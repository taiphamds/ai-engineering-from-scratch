---
id: grpo-groups-teach-nothing
title: A flat GRPO reward and the groups that teach nothing
card: post-training
kind: debug
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [grpo, dynamic-sampling, zero-variance, reward, miles]
minutes: 12
lessons: []
manuals: [miles-101#s-train-with-the-dapo-filter, miles-101#s-read-your-first-ten-steps, miles-101#s-train-math-on-gsm8k, miles-101#s-write-a-custom-reward, miles-101#s-read-the-run]
practice: [grpo-advantages]
cheatsheet: [miles-rl]
related: [post-training/rl-custom-reward-take-home, post-training/logprob-gap-at-step-zero]
updated: 2026-11-03
---

Một lần chạy GRPO huấn luyện một mô hình nhỏ trên toán tiểu học với một reward nhị phân. Reward mỗi bước nhảy lên xuống, và xu hướng qua nhiều bước trông phẳng. Nhóm muốn tăng learning rate. Bạn đọc gì trước, và bạn nghi ngờ gì?

## Short answer

Đọc các thống kê nhóm trước khi chạm learning rate. GRPO chấm mỗi câu trả lời đối chiếu trung bình nhóm của nó, nên một nhóm mà mọi câu trả lời đều đúng hoặc mọi câu trả lời đều sai có advantage bằng không cho mọi thành viên và không dạy gì. Trong các lần chạy của tài liệu, 10 trong 32 nhóm ở bước đầu có một reward cho tất cả 8 câu trả lời, và khoảng một nửa nhóm như vậy qua 12 bước. Nếu phần lớn nhóm như vậy, tín hiệu mỏng, và cách sửa là hỗn hợp prompt hoặc bộ lọc lấy mẫu động, không phải một bước lớn hơn.

## Full answer

### Read five numbers, not the reward

Reward của một bước thay đổi đến 0.14 giữa các bước trong mười bước đầu của các lần chạy tài liệu, và đến 0.21 qua một lần chạy dài, nên đọc trung bình trên năm bước hoặc hơn. Cạnh nó, đọc độ dài câu trả lời, tỷ phần câu trả lời bị cắt ở giới hạn độ dài, khoảng cách log xác suất giữa trainer và engine, và KL giữa chúng. Một reward phẳng với khoảng cách phẳng và độ dài bình thường chỉ đến tín hiệu, không phải kernel.

### Count the groups that carry no advantage

Dòng `perf` rollout đếm các nhóm có độ lệch chuẩn bằng không: `rollout/zero_std/count_1` cho tất cả đúng và `rollout/zero_std/count_0` cho tất cả sai. Trong bước đầu baseline của tài liệu, 7 nhóm đều đúng và 3 đều sai, 10 trong 32. Qua 12 bước với một seed, 191 trong 384 nhóm có một reward cho mọi câu trả lời, và 142 trong số đó đều đúng: các prompt dễ mô hình đã giải được.

### The filter and its cost

Bộ lọc lấy mẫu động bỏ những nhóm đó và yêu cầu engine thêm prompt đến khi bước giữ đủ nhóm có độ trải. Với các batch 48 prompt cho 32 nhóm được giữ, các bước của tài liệu mỗi bước bỏ 16 đến 48 nhóm, trung vị 36, và phần lớn nhóm bị bỏ đều đúng. Rollout mất lâu hơn 1.5 lần khi một batch bổ sung là đủ và 2.8 lần khi cần một batch thứ hai. Tổng mười hai thời gian bước tăng từ 60 phút lên 113.

### Read the reward with the filter on

`rollout/raw_reward` không còn gồm các nhóm bị bỏ, nên thay vào đó so sánh `rollout/raw_reward_unfiltered`. Ngay cả con số đó cũng nghiêng cao trong lần chạy tài liệu, 0.686 so với 0.657, vì các câu trả lời chậm nhất và dài nhất bị dừng trước khi được tính, và một câu trả lời bị cắt thường đạt 0. Xem một mức tăng trong độ trải của các seed baseline là nhiễu.

### What a higher learning rate would do

Một bước lớn hơn trên một tín hiệu mỏng tăng norm gradient và variance của cập nhật mà không thêm thông tin. Quy tắc của tài liệu cho một norm gradient tăng bước này sau bước khác là ngược lại: giảm rate.

## Follow-ups

- **Level 2:** Tại sao một nhóm có một reward cho một advantage bằng không? Expected: GRPO trừ trung bình nhóm và chia cho độ lệch chuẩn nhóm; các reward bằng nhau cho một tử số không cho mọi câu trả lời.
- **Level 2:** Ngoài một đáp án sai, điều gì khác khiến một reward toán đạt 0? Expected: một câu trả lời bị cắt ở giới hạn độ dài trước dòng cuối của nó; đọc tỷ phần cắt cạnh reward.
- **Level 3:** Lần chạy bộ lọc cho thấy reward trung bình cao hơn baseline. Bạn quyết định liệu nó học nhiều hơn như thế nào? Expected: so sánh reward chưa lọc, tính đến bias từ các câu trả lời dài bị dừng, và chạy một seed thứ hai đối chiếu độ trải các seed baseline.
- **Level 3:** Reward của bạn trả về các phân số, và một nhóm có reward giống nhau vẫn cho advantage nhỏ khác không. Tại sao? Expected: làm tròn float32 của trung bình nhóm để lại một phần dư mà phép chia cho độ lệch chuẩn gần không khuếch đại; làm tròn reward về các giá trị một float32 giữ chính xác.

## Wrong answers

- "Tăng learning rate; reward phẳng vì các bước nhỏ." Tín hiệu mỏng vì nhiều nhóm không mang advantage; một bước lớn hơn khuếch đại nhiễu và tăng norm gradient.
- "Lấy mẫu thêm câu trả lời mỗi prompt để có độ trải." Trong các lần chạy của tài liệu, 4, 8 và 16 câu trả lời mỗi prompt cho các mức tăng reward trong khoảng một seed, và nhiều câu trả lời hơn làm mỗi rollout lâu hơn.
- "Đọc reward của bước cuối." Một bước thay đổi đến một phần năm thang; đọc trung bình trên năm bước hoặc hơn.

## Taught in

[Phần 3.2 của Miles 101](../../../manuals/miles-101/sections/3-2-train-with-the-dapo-filter.md) đo các nhóm bị bỏ và chi phí bộ lọc, [phần 1.3](../../../manuals/miles-101/sections/1-3-read-your-first-ten-steps.md) đếm các nhóm không dạy gì, và [phần 3.1](../../../manuals/miles-101/sections/3-1-train-math-on-gsm8k.md) so sánh các kích thước nhóm.
