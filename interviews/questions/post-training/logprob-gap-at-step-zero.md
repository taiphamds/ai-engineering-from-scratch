---
id: logprob-gap-at-step-zero
title: A step-0 gap several times the healthy range
card: post-training
kind: debug
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [grpo, logprob-gap, deterministic-inference, trainer-engine, miles]
minutes: 12
lessons: []
manuals: [miles-101#s-check-the-first-step, miles-101#s-use-deterministic-inference, miles-101#s-troubleshoot-by-symptom, miles-101#s-read-the-run, miles-101#s-why-true-on-policy-is-a-contract]
practice: []
cheatsheet: [miles-rl]
related: [post-training/grpo-groups-teach-nothing]
updated: 2026-11-03
---

Bạn bắt đầu một lần chạy GRPO với một checkpoint mô hình mới. Ở bước 0, chỉ số so sánh các log xác suất của trainer với của engine rollout đọc cao gấp nhiều lần các lần chạy trước với cùng họ mô hình. Một đồng nghiệp đề xuất bật chế độ xác định của engine để khép nó. Bạn làm gì?

## Short answer

Dừng lần chạy trước khi nó huấn luyện trên các con số sai. Ở bước 0, cả hai phía giữ cùng trọng số, nên một giá trị vượt xa khoảng khỏe mạnh có nghĩa hai phía không tính cùng mô hình: một đường dẫn checkpoint sai ở một phía, hoặc một định dạng một phía đọc khác. Suy luận xác định không giúp; trong các lần chạy của tài liệu nó để khoảng cách không đổi ở khoảng 0.015 và khiến engine lặp lại chính nó, là một thuộc tính khác. Sửa thiết lập, rồi so sánh giá trị bước-0 với khoảng các lần chạy khỏe mạnh.

## Full answer

### What step 0 proves

Chưa có huấn luyện xảy ra. Trainer chấm các token được lấy mẫu bằng trọng số engine đã dùng, nên mọi khác biệt đến từ thiết lập. Hai giá trị phải chính xác bằng 0 ở bước 0: `train/ppo_kl`, KL giữa các xác suất cũ và mới của trainer, và `train/pg_clipfrac`, tỷ phần các token bị clip. Bản thân khoảng cách, `train/train_rollout_logprob_abs_diff`, không bao giờ bằng 0 ngoài chế độ chính xác từng bit, vì hai phía chạy các kernel khác nhau. Nó vẫn phải nằm trong khoảng của bạn.

### The ranges in the manual

| Thiết lập | Khoảng cách ở bước 0 |
|---|---|
| Qwen3-0.6B, lấy mẫu thông thường, 17 lần chạy | 0.0148 đến 0.0157 |
| Qwen3-0.6B, top-p 0.95 và top-k 64 | 0.0136 |
| Qwen3-1.7B | 0.0109 |

Khoảng cách phụ thuộc mô hình và bộ lấy mẫu, nên xây khoảng từ các seed riêng của bạn. Một giá trị gấp nhiều lần khoảng chỉ đến mô hình, không phải kernel.

### Why deterministic mode is the wrong tool

Suy luận xác định khiến engine cho cùng kết quả cho một yêu cầu, bất kể batch quanh nó. Trong bốn lần chạy 12 bước với một seed, khoảng cách trung vị là 0.01526 với engine mặc định và 0.01518, 0.01520 và 0.01515 với các kernel xác định trên hai backend attention. Hai lần chạy xác định lặp khoảng cách bước-0 đến sáu chữ số thập phân, 0.015404. Vì vậy chế độ mang lại khả năng lặp, không phải đồng thuận, và nó tốn thời gian rollout nhiều hơn 40 đến 45 phần trăm trên các bước sạch.

### The checks, in order

1. Các đường dẫn checkpoint của cả hai phía. Với trainer tài liệu dùng, cả hai phía nạp từ một đối số; một bố trí tách hoặc một engine precision thấp nạp hai file, và chúng phải giữ cùng mô hình.
2. Định dạng mô hình: một bước chuyển đổi mà một phía áp dụng và phía kia không.
3. Kiểm tra bằng nhau trọng số trên một lần chạy hai bước sau cập nhật đầu tiên, với dung sai lượng tử hóa bật khi engine chạy precision thấp.
4. Bộ lấy mẫu. Một thiết lập top-p hoặc top-k trên một lần chạy và không trên lần khác di chuyển khoảng cách, như bảng cho thấy.

### What a healthy gap does over a run

Nó giữ phẳng. Trong ba seed baseline của tài liệu, mọi bước qua 48 bước giữ giữa 0.0136 và 0.0164, và KL giữa hai phía giữ giữa 0.00063 và 0.00076. Một khoảng cách nhảy và giữ cao sau một cập nhật trọng số có nghĩa hai phía không còn giữ cùng trọng số.

## Follow-ups

- **Level 3:** Tại sao khoảng cách không bao giờ bằng không trong một lần chạy bình thường? Expected: hai phía cộng cùng các số theo một thứ tự khác, với các kernel khác; qua nhiều lớp và một từ vựng lớn, làm tròn cộng dồn.
- **Level 3:** Vậy chế độ xác định mang lại gì? Expected: cùng rollout cho cùng seed, là điều bạn cần để kiểm thử một hàm reward trên các mẫu giống hệt.
- **Level 4:** Các đòn bẩy nào di chuyển sàn của chính khoảng cách? Expected: precision ở cả hai phía, kích thước tensor-parallel của engine, và các kernel cộng theo một thứ tự cố định; mỗi đòn bẩy tốn tốc độ hoặc công việc.
- **Level 4:** Khoảng cách ổn ở bước 0 và tăng bước này sau bước khác. Điều gì khác với lỗi bước-0? Expected: trọng số phân kỳ sau các cập nhật, nên đường cập nhật trọng số là bên bị nghi, không phải checkpoint; đọc log cập nhật và chạy kiểm tra bằng nhau trọng số.

## Wrong answers

- "Bật suy luận xác định để khép khoảng cách." Bốn lần chạy của tài liệu cho thấy cùng khoảng cách có và không có nó; nó khiến engine lặp lại chính nó và tốn thời gian rollout.
- "Một khoảng cách là bình thường; tiếp tục huấn luyện và theo dõi reward." Một giá trị bước-0 gấp nhiều lần khoảng khỏe mạnh có nghĩa trainer chấm một mô hình khác với mô hình đã lấy mẫu, nên lần chạy huấn luyện trên các con số sai từ cập nhật đầu.
- "Thêm một hiệu chỉnh importance-sampling." Một cách đặt lại trọng số giấu một khoảng cách đến từ một lỗi thiết lập; loại bỏ nguyên nhân trước.

## Taught in

[Phần 5.2 của Miles 101](../../../manuals/miles-101/sections/5-2-check-the-first-step.md) đưa ra các kiểm tra và khoảng bước-0, [phần 4.5](../../../manuals/miles-101/sections/4-5-use-deterministic-inference.md) đo chế độ xác định làm gì và không sửa gì, và [phần 7.1](../../../manuals/miles-101/sections/7-1-troubleshoot-by-symptom.md) liệt kê triệu chứng.
