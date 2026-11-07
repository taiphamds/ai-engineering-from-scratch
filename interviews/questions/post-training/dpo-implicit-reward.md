---
id: dpo-implicit-reward
title: Where the reward model went in DPO
card: post-training
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth]
tags: [dpo, implicit-reward, preference-tuning, beta]
minutes: 12
lessons: [phases/10-llms-from-scratch/08-dpo, phases/19-capstone-projects/40-dpo-from-scratch, phases/18-ethics-safety-alignment/03-direct-preference-optimization-family]
manuals: []
practice: [dpo-loss]
cheatsheet: [rlhf-dpo, alignment-training]
related: [post-training/kl-penalty-purpose]
updated: 2026-11-03
---

DPO thường được mô tả là RLHF không có một reward model. Trình bày reward đã đi đâu. Bắt đầu từ mục tiêu RLHF với số hạng KL của nó và kết thúc ở loss bạn sẽ triển khai.

## Short answer

Mục tiêu có phạt có một nghiệm tối ưu dạng đóng: policy tối ưu bằng policy reference nhân hàm mũ của reward chia beta, được chuẩn hóa mỗi prompt. Đảo nó và reward bằng beta nhân tỷ số log của policy trên reference, cộng một số hạng chỉ phụ thuộc prompt. Đặt reward đó vào xác suất preference Bradley-Terry và số hạng chỉ prompt triệt tiêu, vì cả hai câu trả lời chia sẻ prompt. Phần còn lại là một loss trong các log xác suất riêng của policy: âm log sigmoid của beta nhân hiệu hai tỷ số log.

## Full answer

### The derivation in four lines

```text
optimum:  pi*(y|x) = pi_ref(y|x) * exp( r(x,y) / beta ) / Z(x)
invert:   r(x,y) = beta * log( pi*(y|x) / pi_ref(y|x) ) + beta * log Z(x)
BT:       P(y_w > y_l | x) = sigmoid( r(x,y_w) - r(x,y_l) )
loss:     -log sigmoid( beta * [ log pi(y_w|x)/pi_ref(y_w|x) - log pi(y_l|x)/pi_ref(y_l|x) ] )
```

Số hạng log Z chỉ phụ thuộc prompt, nên nó giống nhau cho câu trả lời chosen và rejected và rời khỏi hiệu.

### What you compute per pair

Bốn log xác suất chuỗi: policy và reference trên câu trả lời chosen, và cả hai trên câu trả lời rejected. Mỗi giá trị là tổng các log xác suất next-token chỉ trên các token câu trả lời, với các vị trí prompt bị mask. Reference chạy không có gradient.

### The implicit reward

`beta * (log pi(y|x) - log pi_ref(y|x))` là reward DPO gán cho một câu trả lời. Ghi log margin giữa các reward ngầm chosen và rejected; nó nên tăng trong huấn luyện. Gradient trên log xác suất chosen là `-beta * (1 - sigmoid(z))`, âm với mọi z, nên huấn luyện đẩy câu trả lời chosen lên và câu trả lời rejected xuống.

### Where the KL went

Không số hạng KL xuất hiện trong loss. Ràng buộc mang tính cấu trúc: một di chuyển lớn từ reference làm tỷ số log lớn, sigmoid bão hòa, và gradient mờ dần. Beta đặt policy được di chuyển xa bao nhiêu. Bài học DPO đưa ra 0.1 đến 0.5 là khoảng và 0.1 đến 0.3 là điểm tối ưu thông thường. Một beta nhỏ cho phép các di chuyển lớn và rủi ro câu trả lời suy biến; một giá trị gần 1.0 ghim policy vào reference.

### What it saves

Hai mô hình trong bộ nhớ thay vì ba hoặc bốn, và một vòng lặp có giám sát thay vì PPO. Với một mô hình 70B, mỗi bản sao chiếm 140GB trong FP16, nên reward model bạn không bao giờ nạp là một tiết kiệm lớn.

## Follow-ups

- **Level 2:** Tại sao policy phải bắt đầu như một bản sao của reference? Expected: phép suy ra coi nghiệm tối ưu là reference cộng một dịch chuyển được học, và một bản sao khiến mọi reward ngầm bắt đầu ở không.
- **Level 2:** Một tỷ số log dương có nghĩa gì? Expected: policy giờ cho câu trả lời đó một xác suất cao hơn reference.
- **Level 3:** Tại sao phép suy ra cần cả hai câu trả lời chia sẻ một prompt? Expected: số hạng phân hoạch chỉ phụ thuộc prompt; với các prompt khác nhau nó sẽ không triệt tiêu, và các reward ngầm sẽ không so sánh được.
- **Level 4:** Những giả định nào của phép suy ra thất bại trong thực tế? Expected: nghiệm tối ưu đạt được, các cặp nằm trong phân phối cho reference, và reference là neo thật; mỗi phương pháp sau trong họ sửa một giả định.

## Wrong answers

- "DPO không có reference model, đó là mục đích." Nó loại bỏ reward model và PPO; reference đóng băng ở lại trong loss, và các phương pháp bỏ nó là một biến thể sau.
- "DPO tối đa hóa xác suất câu trả lời chosen." Nó tối đa hóa margin của hai tỷ số log; xác suất tuyệt đối chosen có thể giảm miễn là rejected giảm nhanh hơn.
- "Beta là một learning rate." Beta điều chỉnh reward ngầm và đặt policy được di chuyển xa reference bao nhiêu; kích thước bước bộ tối ưu là một thiết lập riêng.

## Taught in

[Bài học DPO](../../../phases/10-llms-from-scratch/08-dpo/) suy ra loss và quét beta, [capstone DPO](../../../phases/19-capstone-projects/40-dpo-from-scratch/) kiểm tra dấu gradient và tính bất biến reference, và [bài học họ DPO](../../../phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/) nêu các giả định.
