---
id: dpo-or-rlhf
title: DPO or the full RLHF stack for a small team
card: post-training
kind: tradeoff
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [system-design, ml-depth]
tags: [dpo, rlhf, compute-budget, preference-data, alignment]
minutes: 12
lessons: [phases/10-llms-from-scratch/08-dpo, phases/09-reinforcement-learning/09-reward-modeling-rlhf]
manuals: []
practice: []
cheatsheet: [rlhf-dpo]
related: [post-training/dpo-implicit-reward, post-training/kl-penalty-purpose]
updated: 2026-11-03
---

Một nhóm bốn kỹ sư với tám GPU có khoảng 20,000 cặp preference cho một trợ lý hỗ trợ khách hàng và muốn alignment trong ba tuần. Một kỹ sư muốn toàn bộ stack RLHF với một reward model và PPO. Một người khác muốn DPO. Bạn chọn gì, và trong những điều kiện nào bạn sẽ đảo ngược lựa chọn?

## Short answer

Chọn DPO. Với hàng chục nghìn cặp, nó ngang hoặc thắng stack đầy đủ, nó huấn luyện một mô hình đối chiếu một reference đóng băng trong một vòng lặp có giám sát, nó cần khoảng một phần ba tính toán, và mỗi thí nghiệm mất hàng giờ thay vì hàng ngày. Đảo lựa chọn khi tín hiệu có nhiều chiều và cần một reward được học bạn có thể kiểm tra và tái sử dụng, khi bạn muốn một vòng lặp online chấm các mẫu mới, hoặc khi DPO đạt bình nguyên trên đánh giá của bạn.

## Full answer

### What DPO buys

| Khía cạnh | RLHF với PPO | DPO |
|---|---|---|
| Các mô hình được huấn luyện | ba: SFT, reward, policy | một: policy |
| Các mô hình trong bộ nhớ | ba hoặc bốn trong PPO | hai: policy và reference |
| Siêu tham số | learning rate, hệ số KL, clip ratio, rate reward model, epoch cho mỗi giai đoạn | learning rate, beta, epoch |
| Tính ổn định | nhạy với các thiết lập | gần SFT |

Với một mô hình 70B, mỗi bản sao chiếm 140GB trong FP16, nên bớt một mô hình trong bộ nhớ là một bậc phần cứng khác.

### When DPO wins

- Các tập dữ liệu nhỏ, 5,000 đến 20,000 cặp. Một reward model cần đủ dữ liệu để tổng quát hóa và overfit dưới mức đó; DPO không bao giờ khớp một mô hình như vậy.
- Tính toán hạn chế. Một vòng lặp huấn luyện thay vì ba, khoảng một phần ba stack đầy đủ.
- Lặp nhanh. Thử 10 tập preference mất mười lần chạy mỗi lần hàng giờ, không có reward model để huấn luyện lại cho mỗi tập.

Kết quả tham chiếu của bài học: một mô hình 7B được alignment bằng DPO trên 60K cặp đạt 6.47 trên một benchmark chat so với 6.86 cho một mô hình chat 70B được huấn luyện với stack đầy đủ, trong sáu phần trăm của một mô hình gấp mười kích thước.

### When the full stack wins

- Nhiều chiều chất lượng cùng lúc, như tính hữu ích, vô hại và trung thực. Một reward model học sự đánh đổi; DPO thấy mỗi cặp như một tín hiệu nhị phân.
- Một vòng lặp online: lấy mẫu từ policy hiện tại, chấm, huấn luyện lại reward model, tiếp tục. DPO làm việc trên một tập cố định.
- Một reward model bạn có thể tái sử dụng cho lấy mẫu best-of-N hoặc như một giám khảo lúc decode.
- Các quy mô lớn nhất, nơi một reward model riêng đã nắm nhiều sắc thái hơn trong các pipeline đã công bố.

### The practical path

Bắt đầu với DPO. Chuyển sang stack đầy đủ khi đánh giá đạt bình nguyên. Nhiều pipeline production chạy cả hai: stack đầy đủ trước cho alignment rộng, DPO sau nó cho tinh chỉnh có mục tiêu.

## Follow-ups

- **Level 3:** Lần chạy DPO vẫn cần gì từ công thức RLHF? Expected: một checkpoint SFT làm reference đóng băng, một đánh giá giữ lại, và một lựa chọn beta đóng vai trò hệ số KL.
- **Level 3:** Các cặp đến từ đầu ra của một mô hình cũ hơn. Điều đó có quan trọng cho DPO không? Expected: có; các cặp hiếm dưới reference tạo reward ngầm tùy ý, nên lấy mẫu các cặp từ mô hình SFT hoặc lọc chúng bằng likelihood reference.
- **Level 4:** Bạn sẽ biến ba tuần thành một vòng lặp cải tiến không có PPO như thế nào? Expected: chạy DPO, sinh từ policy mới, thu thập preference trên các mẫu đó, chạy DPO lại; bài tập của bài học gọi đây là iterative DPO.
- **Level 4:** Cả hai phương pháp chia sẻ chế độ lỗi nào? Expected: tối ưu hóa quá mức một proxy, reward model trong một trường hợp và tỷ số đến reference trong trường hợp kia; cả hai cần một đánh giá mù và early stopping.

## Wrong answers

- "RLHF là đường đã được chứng minh, nên bắt đầu ở đó." Stack đầy đủ mong manh để tinh chỉnh và cần ba vòng lặp huấn luyện; hướng dẫn thực tế của bài học bắt đầu với DPO và chỉ chuyển khi đạt bình nguyên.
- "DPO không cần giai đoạn SFT." Nó cần một policy reference, và reference đó là checkpoint SFT; các phương pháp một giai đoạn là các loss khác.
- "DPO không có siêu tham số để lo." Beta quyết định policy di chuyển xa reference bao nhiêu, và lượt quét của bài học cho thấy các câu trả lời suy biến ở giá trị nhỏ và không học ở giá trị lớn.

## Taught in

[Bài học DPO](../../../phases/10-llms-from-scratch/08-dpo/) so sánh cả hai phương pháp về dữ liệu, tính toán và bộ nhớ, và [bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) đặt mỗi phương pháp trong stack alignment theo lớp.
