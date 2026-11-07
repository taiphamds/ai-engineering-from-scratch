---
id: reward-model-pairwise
title: Why reward models learn from pairs, not scores
card: post-training
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [reward-model, bradley-terry, preference-data, rlhf]
minutes: 10
lessons: [phases/10-llms-from-scratch/07-rlhf, phases/09-reinforcement-learning/09-reward-modeling-rlhf]
manuals: []
practice: []
cheatsheet: [rlhf-dpo]
related: [post-training/kl-penalty-purpose, post-training/reward-up-humans-flat]
updated: 2026-11-03
---

Bạn cần một reward model cho một mục tiêu tính hữu ích. Một quản lý sản phẩm gợi ý yêu cầu người đánh giá chấm mỗi câu trả lời từ một đến mười và hồi quy trên các điểm. Tại sao phần lớn pipeline thu thập các so sánh ghép cặp thay vào đó, và bạn huấn luyện với loss nào?

## Short answer

Con người kém về điểm tuyệt đối và tốt về phán xét tương đối, nên các pipeline cho thấy hai câu trả lời cho một prompt và hỏi câu nào tốt hơn. Reward model là mô hình SFT với head từ vựng được thay bằng một head vô hướng. Nó huấn luyện bằng Bradley-Terry loss, âm log của sigmoid của hiệu reward giữa câu trả lời được thích và câu bị loại. Hiệu reward trở thành một log-odds preference, biến nhiều phán xét tương đối thành một thang nhất quán.

## Full answer

### The loss

```text
loss = -log( sigmoid( r(x, y_preferred) - r(x, y_rejected) ) )
```

Sigmoid của hiệu là xác suất câu trả lời được thích thắng. Huấn luyện đẩy reward được thích lên và reward bị loại xuống. Mô hình đọc trạng thái ẩn ở vị trí cuối, vì attention nhân quả đã thấy toàn bộ prompt và câu trả lời ở đó, và chiếu nó thành một số.

### What accuracy to expect

Một reward model ngẫu nhiên xếp đúng một nửa các cặp. Pipeline tham chiếu trong bài học RLHF huấn luyện reward model trên 33,000 so sánh từ 40 người đánh giá, khoảng 5 phút mỗi so sánh, và đạt độ chính xác khoảng 72 phần trăm trên các cặp giữ lại. Nghe có vẻ thấp, nhưng người đánh giá đồng ý với nhau khoảng 73 phần trăm thời gian. Sự đồng thuận đó ước lượng nhiễu trong các nhãn. Nó không phải một cận cứng, nhưng một điểm cao hơn nó nhiều là lý do tìm một rò rỉ.

### Noise in the labels

Khoảng 30 phần trăm các nhãn con người nhiễu hoặc mơ hồ. Lọc các cặp theo đồng thuận người đánh giá, hoặc thêm một temperature vào sigmoid. Các cặp mà cả hai câu trả lời đều tệ vẫn dạy mô hình câu nào ít tệ hơn.

### Size

Một reward model quá nhỏ không thể chấm trung thực các đầu ra policy. Bảng của bài học liệt kê một reward model 6B cho một policy 175B trong một pipeline, và một reward model 52B được huấn luyện trên 22,000 so sánh trong một pipeline khác. Các reward model lớn hơn cho tín hiệu ổn định hơn đến giai đoạn RL.

### Where the reward model lives later

Cùng head vô hướng cung cấp sức mạnh cho lấy mẫu best-of-N lúc decode và phía reward của các pipeline suy luận. Nó là lối vào toàn bộ stack alignment.

## Follow-ups

- **Level 2:** Tại sao đọc trạng thái ẩn của token cuối và không phải trung bình trên các vị trí? Expected: với một mask nhân quả, vị trí cuối đã attend đến toàn bộ chuỗi, nên nó giữ bản tóm tắt đầy đủ nhất; mean pooling là một lựa chọn đáng kiểm thử.
- **Level 2:** Reward model của bạn xếp đúng 90 phần trăm các cặp kiểm thử. Tin tốt? Expected: đáng nghi; với đồng thuận người đánh giá gần 73 phần trăm, điểm đó gợi ý một rò rỉ hoặc một lối tắt như độ dài, nên kiểm tra mô hình dựa vào gì.
- **Level 3:** Bạn biến các so sánh thành một reward cho nhiều tiêu chí cùng lúc như thế nào? Expected: một reward model mỗi tiêu chí, như tính hữu ích và an toàn, được kết hợp với các trọng số; một mô hình đơn học một hỗn hợp mờ các tiêu chí.
- **Level 4:** Tại sao reward model cần được bảo vệ khỏi policy sau đó? Expected: nó chỉ thấy các câu trả lời trong phân phối; một policy dưới tối ưu hóa rời phân phối đó và tìm các câu trả lời đạt điểm cao vì lý do sai, là lý do giai đoạn RL mang một KL penalty.

## Wrong answers

- "Hồi quy trên một điểm một-đến-mười; đó là nhiều thông tin hơn mỗi nhãn." Các điểm tuyệt đối trôi giữa người đánh giá và phiên; một phán xét ghép cặp rẻ và nhất quán, và phép khớp Bradley-Terry khôi phục một thang từ nó.
- "Độ chính xác 72 phần trăm có nghĩa reward model hỏng." Người đánh giá chỉ đồng ý khoảng 73 phần trăm thời gian; mô hình gần mức đồng thuận các nhãn của nó.
- "Dùng một reward model nhỏ để tiết kiệm tính toán." Một reward model không thể biểu diễn các đầu ra policy cho một tín hiệu nhiễu, và policy khai thác các điểm mù của nó.

## Taught in

[Bài học RLHF](../../../phases/10-llms-from-scratch/07-rlhf/) xây reward model và loss ghép cặp của nó, và [bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) đặt nó trong pipeline đầy đủ.
