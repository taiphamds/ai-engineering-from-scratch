---
id: post-training-pipeline-take-home
title: Plan the post-training of a support assistant
card: post-training
kind: take-home
level: 4
roles: [applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [take-home, system-design]
tags: [sft, dpo, qlora, pipeline, evaluation]
minutes: 45
lessons: [phases/10-llms-from-scratch/06-instruction-tuning-sft, phases/11-llm-engineering/08-fine-tuning-lora, phases/10-llms-from-scratch/08-dpo, phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/19-capstone-projects/39-instruction-tuning-sft, phases/19-capstone-projects/40-dpo-from-scratch]
manuals: []
practice: [dpo-loss, lora-forward]
cheatsheet: [llm-pipeline-capstone, rlhf-dpo, lora-fine-tuning]
related: [post-training/dpo-or-rlhf, post-training/qlora-on-one-gpu, post-training/sft-learning-rate-gap]
updated: 2026-11-03
---

Bài làm ở nhà. Một công ty muốn một trợ lý hỗ trợ được xây từ một mô hình nền 8B mở. Họ có khoảng 50,000 cuộc hội thoại hỗ trợ trước có đánh giá khách hàng, hai GPU 24 GB, và ba tuần. Viết kế hoạch post-training trên một trang: các giai đoạn, dữ liệu cho mỗi giai đoạn, các thiết lập bạn bắt đầu từ, những gì bạn đo sau mỗi giai đoạn, và ba chế độ lỗi bạn bảo vệ chống.

## Short answer

Ba giai đoạn: đầu tiên, SFT với QLoRA trên các cuộc hội thoại được đánh giá cao nhất trong một mẫu chat với loss được mask đến các lượt assistant, ở learning rate thấp trong một đến ba epoch với vài phần trăm văn bản thô trộn vào, được đo bằng instruction loss giữ lại, sự trôi văn bản thô và đọc một mẫu. Thứ hai, DPO đối chiếu checkpoint SFT làm reference đóng băng, trên các cặp được xây từ các câu trả lời đánh giá cao và thấp cho cùng prompt với một beta thận trọng, được đo bằng một đánh giá ghép cặp mù và log xác suất chosen tuyệt đối, không phải margin huấn luyện. Thứ ba, một cổng phát hành: một tập prompt cố định được chấm mù, một tập từ chối, và một so sánh với mô hình nền trên các tác vụ dữ liệu chưa bao phủ. Các biện pháp bảo vệ là quên thảm họa, khai thác độ dài và đồng ý trong các đánh giá, và tối ưu hóa quá mức proxy preference.

## Full answer

### Stage 0: data

- Chuyển mọi cuộc hội thoại thành một mẫu chat, với một system prompt cố định.
- Tập SFT: các câu trả lời được đánh giá cao nhất, được lọc theo độ dài, đa dạng từ vựng và một tỷ lệ instruction-trên-câu trả lời sạch. Hàng chục nghìn ví dụ sạch là đủ; giai đoạn SFT tham chiếu trong bài học dùng khoảng 27,000.
- Tập preference: với các prompt có cả câu trả lời đánh giá cao và thấp, xây các bộ ba prompt, chosen và rejected. Nơi dữ liệu mỏng, lấy mẫu phía rejected từ mô hình SFT, để các cặp nằm trong phân phối cho reference. Một người đánh giá hoặc giám khảo phải xác nhận mỗi câu trả lời lấy mẫu tệ hơn chosen trước khi nó thành một cặp, vì mô hình SFT được huấn luyện trên các câu trả lời được đánh giá cao nhất và các mẫu của nó có thể tốt tương đương. Nhắm đến 5,000 đến 20,000 cặp nơi DPO hoạt động tốt.
- Một tập prompt đánh giá mù chưa bao giờ dùng trong huấn luyện, cộng một tập quên của các tác vụ ngoài hỗ trợ, như mã ngắn và số học.

### Stage 1: SFT with QLoRA

Hai card 24 GB không thể chứa một cập nhật đầy đủ của mô hình này; một cập nhật đầy đủ 7B cần khoảng 56 GB với gradient và trạng thái bộ tối ưu. QLoRA giữ bản nền trong 4-bit và huấn luyện các adapter rank 16 trên các phép chiếu attention trong khoảng 6 GB, nên mỗi card chạy thí nghiệm riêng.

Bắt đầu từ: learning rate SFT 2e-5 của bài học cho một cập nhật đầy đủ, với rate cao hơn cho các adapter như bộ huấn luyện của bài học LoRA cho thấy; một đến ba epoch; 2 đến 5 phần trăm văn bản pretraining thô trộn vào các batch.

Đo: instruction loss giữ lại, raw-text loss trước và sau với một ngân sách tăng 10 đến 15 phần trăm, exact match trên các tác vụ theo mẫu nơi áp dụng được, và đọc năm mươi mẫu.

### Stage 2: DPO

Reference: checkpoint SFT đã merge, đóng băng. Policy: một bản sao với các adapter mới. Beta trong khoảng 0.1 đến 0.3, vài epoch, và bốn log xác suất mỗi cặp chỉ trên các token câu trả lời.

Đo: một đánh giá ghép cặp mù đối chiếu mô hình SFT trên các prompt giữ lại, margin reward ngầm, log xác suất chosen tuyệt đối, độ dài phản hồi theo checkpoint, và tập quên lần nữa. Dừng theo đánh giá, không phải margin.

### Stage 3: release gate

- Một tập prompt cố định được con người chấm mù, đối chiếu checkpoint SFT và bản nền.
- Một tập từ chối và an toàn với hành vi kỳ vọng được viết xuống.
- Tập quên.
- Các adapter được giữ riêng cho một rollback; chỉ merge cho artifact được phát hành.

### The three guards

1. Quên thảm họa: rate thấp, huấn luyện ngắn, một hỗn hợp pretraining, và một ngân sách raw-text loss.
2. Khai thác tín hiệu đánh giá: người đánh giá thích các câu trả lời dài và đồng ý, nên quan sát độ dài và sự đồng ý với tiền đề, và lọc các cặp nơi chỉ độ dài phân biệt chúng.
3. Tối ưu hóa quá mức proxy: tỷ số DPO có thể bị đẩy ra ngoài dữ liệu, nên dừng sớm theo đánh giá mù và giữ beta thận trọng.

### Schedule

Tuần một: dữ liệu và SFT. Tuần hai: DPO và đánh giá mù đầu tiên. Tuần ba: cổng, một seed thứ hai của cấu hình tốt nhất, và kế hoạch rollback.

## Follow-ups

- **Level 3:** Tại sao DPO và không phải một reward model với PPO ở đây? Expected: hàng chục nghìn cặp, hai GPU nhỏ và ba tuần phù hợp chế độ DPO; một reward model và PPO cần ba vòng lặp và nhiều bộ nhớ hơn.
- **Level 4:** Các đánh giá là một đến năm sao trên các câu trả lời đơn, không phải cặp. Điều gì thay đổi? Expected: chỉ xây các cặp nơi một prompt có câu trả lời ở cả hai đầu thang, hoặc dùng loss không ghép cặp hoạt động trên nhãn tốt và xấu và giữ các cặp cho đánh giá.
- **Level 4:** Bạn chứng minh giai đoạn DPO không làm suy giảm hành vi SFT như thế nào? Expected: đánh giá ghép cặp mù đối chiếu checkpoint SFT, tập quên, và log xác suất chosen tuyệt đối; một margin tăng trong khi những thứ đó giảm là một tín hiệu dừng.
- **Level 4:** Điều gì khiến bạn thêm một giai đoạn RL với một bộ xác minh? Expected: một phần tác vụ có một đáp án kiểm tra được, như một mã đơn hàng đúng hoặc một đoạn mã vượt kiểm thử, nơi một reward nhị phân và các advantage tương đối nhóm cho một tín hiệu các đánh giá không cho.

## Wrong answers

- "Bỏ SFT và chạy DPO trên mô hình nền." DPO cần một reference đã theo instruction; loss một giai đoạn là một phương pháp khác, và các cặp của mô hình nền ngoài phân phối.
- "Fine-tune đầy đủ mô hình 8B trên cả hai GPU." Một cập nhật đầy đủ của một mô hình cỡ này cần khoảng 56 GB với các trạng thái bộ tối ưu; hai card 24 GB chỉ chứa nó với các adapter và một bản nền 4-bit.
- "Dùng các đánh giá sao làm reward và chạy PPO." Một hồi quy trên các điểm tuyệt đối là nhãn yếu các bài học cảnh báo, và stack đầy đủ không vừa tính toán hoặc thời hạn.

## Taught in

[Bài học SFT](../../../phases/10-llms-from-scratch/06-instruction-tuning-sft/) đặt dữ liệu và thiết lập SFT, [bài học LoRA](../../../phases/11-llm-engineering/08-fine-tuning-lora/) định cỡ bộ nhớ QLoRA, [bài học DPO](../../../phases/10-llms-from-scratch/08-dpo/) đưa ra khoảng beta và đánh giá, và [bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) liệt kê các biện pháp bảo vệ tối ưu hóa quá mức.
