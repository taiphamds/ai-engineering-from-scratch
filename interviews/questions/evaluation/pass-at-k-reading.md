---
id: pass-at-k-reading
title: Pass at one of 0.6 and pass at five of 0.95
card: evaluation
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [pass-at-k, agent-eval, verifier, variance]
minutes: 8
lessons: [phases/19-capstone-projects/27-eval-harness-fixture-tasks]
manuals: []
practice: []
cheatsheet: [eval-driven-agents, agent-benchmarks]
related: [evaluation/two-pass-at-k-formulas]
updated: 2026-11-03
---

Agent lập trình của bạn đạt pass at one 0.6 trên bộ fixture và pass at five 0.95. Một quản lý đọc điều này là một agent thất bại; người khác đọc là một agent đạt. Mỗi con số cho bạn biết gì, và bạn đặt gì vào báo cáo?

## Short answer

Pass at one nói mẫu đầu tiên sửa nhiệm vụ trên khoảng sáu nhiệm vụ trong mười. Pass at five nói ít nhất một trong năm mẫu đạt trên gần như mọi nhiệm vụ, vì vậy câu trả lời đúng thường trong tầm với và khoảng trống là lựa chọn. Báo cáo cả hai, với các số đếm đạt thô theo nhiệm vụ, vì chỉ pass at k che giấu một agent thành công một lần trong hai mươi lần thử.

## Full answer

### What the harness computes

Harness chạy mỗi nhiệm vụ fixture k lần. Mỗi mẫu đi qua một bộ xác minh có tính xác định: một file bằng một file kỳ vọng, một regex khớp, hoặc một lệnh shell thoát bằng không. Tỷ lệ đạt p theo nhiệm vụ là số lần đạt chia số mẫu. Pass at k là xác suất k mẫu chứa ít nhất một lần đạt. Harness cũng lưu các số đếm thô, để một người rà soát có thể thấy phương sai đằng sau tỷ lệ.

### Reading the gap

Một pass at one thấp với một pass at five cao nói agent có tính ngẫu nhiên, không phải bất tài. Cách sửa là lấy mẫu cộng xếp hạng: sinh nhiều ứng viên và để một bộ xác minh chọn. Không phải luôn thêm huấn luyện. Không có bộ chọn trong production, người dùng nhận mẫu đầu tiên, vì vậy pass at one là con số họ cảm nhận.

### Why both numbers stay

Pass at k che đậy một thất bại thật. Một agent đạt một lần trong hai mươi lần thử có một pass at twenty đáng kể và vô ích. Harness in cả hai để không quản lý nào có thể đọc riêng kết quả.

### The rest of the report

Harness tồn tại để ngăn ba thất bại: đạt chưa được xác minh, nơi agent tuyên bố thành công và không ai kiểm tra; thoái lui không được phát hiện, nơi một thay đổi prompt làm nhiệm vụ nổi bật tốt hơn 4 phần trăm và nhiệm vụ ít nổi bật tệ hơn 14 phần trăm; và thay đổi theo nhiệm vụ, nơi thứ Hai chạy 100 nhiệm vụ và thứ Sáu chạy 95 vì năm nhiệm vụ được đổi tên. Vì vậy báo cáo mang pass at one, pass at k, số đếm theo nhiệm vụ, trung bình và phân vị thứ 95 của độ trễ, và chi phí trung bình, trên cùng danh sách nhiệm vụ cố định mỗi lần chạy.

## Follow-ups

- **Level 2:** Bạn cần gì trong production để biến một pass at five cao thành một pass at one cao? Expected: một bộ xác minh chọn mẫu đạt, chẳng hạn các kiểm thử chạy; không có nó người dùng nhận mẫu đầu tiên.
- **Level 2:** Tại sao harness in các số đếm đạt thô cạnh tỷ lệ? Expected: để cho thấy phương sai theo nhiệm vụ và phơi bày một nhiệm vụ đạt một lần trong nhiều lần thử.
- **Level 3:** Tỷ lệ đạt tăng từ thứ Hai đến thứ Sáu trong khi năm fixture được đổi tên. Có thật không? Expected: không; tập nhiệm vụ thay đổi, vì vậy các lần chạy không so sánh được, và harness phải chạy mọi fixture mỗi lần theo một thứ tự cố định.
- **Level 3:** Harness tồn tại để ngăn ba chế độ thất bại nào? Expected: đạt chưa được xác minh, thoái lui không được phát hiện giữa các nhiệm vụ, và thay đổi tập nhiệm vụ.

## Wrong answers

- "Pass at five là điểm thật." Nó đo trần với lựa chọn; người dùng nhận một mẫu trừ khi bạn xây bộ chọn.
- "Một pass at one 0.6 nghĩa là agent hỏng." Nó nghĩa là mẫu đầu tiên thất bại trên bốn nhiệm vụ trong mười; pass at five cao nói năng lực có đó và lựa chọn là khoảng trống.
- "Tin báo cáo thành công riêng của agent." Thành công tự báo cáo là chế độ thất bại đầu tiên mà harness tồn tại để loại bỏ; một bộ xác minh có tính xác định quyết định.

## Taught in

[Capstone harness đánh giá với nhiệm vụ fixture](../../../phases/19-capstone-projects/27-eval-harness-fixture-tasks/) định nghĩa pass at one và pass at k và giải thích tại sao cả hai được báo cáo.
