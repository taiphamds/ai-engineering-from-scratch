---
name: benchmark-harness
description: Build a SWE-bench-style harness for a codebase with FAIL_TO_PASS / PASS_TO_PASS gating, contamination checks, and step-count metrics.
version: 1.0.0
phase: 14
lesson: 19
tags: [swe-bench, gaia, agentbench, harness, evaluation]
---

Với một cơ sở mã và một danh sách các cặp (lỗi, cách sửa), xây dựng một bộ benchmark kiểm soát bằng các kiểm thử đơn vị thực và ghi lại các thước đo vận hành.

Tạo:

1. Định nghĩa cho từng tác vụ: `(tid, description, state_before, fail_to_pass_tests, pass_to_pass_tests, solution)`.
2. Một trình chạy áp dụng bản vá của agent, chạy bộ kiểm thử của repo trong một sandbox và ghi lại: số đạt FTP, số đạt PTP, số bước, token, thời gian đồng hồ, chi phí.
3. Một kiểm tra nhiễm bẩn: khớp mẫu văn bản issue với bản vá được tạo; gắn cờ chồng lấp >=30%.
4. Một bộ báo cáo phát ra các điểm cho từng tác vụ và tổng hợp dưới dạng JSON, cộng số bước và chi phí P50/P75/P95.
5. Một job CI chạy bộ kiểm thử trên mỗi PR và thất bại khi hồi quy >=5%.

Các trường hợp từ chối cứng:

- Bộ kiểm thử chỉ báo cáo một con số tổng hợp duy nhất. Yêu cầu các kết quả cho từng tác vụ + các phân phối.
- Bộ kiểm thử chạy các kiểm thử mà không có một sandbox. Các bản vá do agent cung cấp là mã không đáng tin cậy.
- Bộ kiểm thử không có cổng PASS_TO_PASS. Các bản vá phá vỡ các kiểm thử khác âm thầm làm sản phẩm hồi quy.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu "chỉ điểm FAIL_TO_PASS," từ chối. Thêm PASS_TO_PASS; phá vỡ các kiểm thử hiện có là một hồi quy tệ hơn bỏ lỡ cách sửa.
- Nếu các kiểm thử không được ghim vào một commit cụ thể, từ chối. Trôi dạt trong các kiểm thử khiến các điểm không thể so sánh xuyên các lần chạy.
- Nếu các tác vụ chồng lấp với văn bản issue đã thấy trong huấn luyện, gắn cờ rõ ràng.

Đầu ra: `tasks.py`, `harness.py`, `contamination.py`, `report.py`, `README.md` giải thích sandbox, các cổng, chính sách nhiễm bẩn. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 30 cho phát triển dựa trên đánh giá bên trên bộ kiểm thử.
