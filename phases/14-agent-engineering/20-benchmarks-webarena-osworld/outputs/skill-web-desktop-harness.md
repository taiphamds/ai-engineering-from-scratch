---
name: web-desktop-harness
description: Build a WebArena/OSWorld-style harness with execution-based evaluation and trajectory-efficiency metrics.
version: 1.0.0
phase: 14
lesson: 20
tags: [webarena, osworld, harness, trajectory-efficiency]
---

Với một ứng dụng đích (web hoặc máy tính để bàn) và một danh sách tác vụ với các quỹ đạo chuẩn, xây dựng một bộ đánh giá.

Tạo:

1. Các định nghĩa tác vụ: `(tid, description, gold_steps, success_predicate, state_reset)`.
2. Trình chạy: chạy agent, ghi lại mọi hành động, ghi số bước + thời gian đã trôi qua + trạng thái thành công.
3. Thước đo hiệu quả quỹ đạo: `agent_steps / gold_steps`. Báo cáo cho từng tác vụ và tổng hợp.
4. Đặt lại trạng thái giữa các tác vụ — không bao giờ chạy một tác vụ trên trạng thái bị một tác vụ khác làm bẩn.
5. Bộ phân loại chế độ lỗi: với mỗi lỗi, gắn thẻ liệu nó là một lần định vị sai (sai phần tử) hay một lần lập kế hoạch sai (sai hành động).

Các trường hợp từ chối cứng:

- Không đặt lại trạng thái giữa các tác vụ. Nhiễm bẩn xuyên tác vụ làm mất hiệu lực mọi điểm số.
- Báo cáo chỉ tỷ lệ thành công. Hiệu quả quỹ đạo là tiêu chuẩn năm 2026.
- Bộ kiểm thử chỉ ảnh chụp màn hình mà không có tính tương đương DOM. Một số agent sử dụng DOM+thị giác; cung cấp cả hai trừ khi giới hạn bề mặt cụ thể.

Các quy tắc từ chối:

- Nếu các tác vụ không có các quỹ đạo chuẩn, từ chối. Bạn không thể đo hiệu quả mà không có chúng.
- Nếu ứng dụng không được ghim vào một phiên bản cụ thể, từ chối. Trôi dạt làm mất hiệu lực các so sánh xuyên lần chạy.
- Nếu agent có các công cụ phá hủy (xóa, xuất bản), yêu cầu một bản sao sandbox của ứng dụng.

Đầu ra: `tasks.py`, `runner.py`, `failure_classifier.py`, `report.py`, `README.md` giải thích chính sách đặt lại, nguồn các quỹ đạo chuẩn và sự phân tách định vị với lập kế hoạch. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 21 (các mô hình sử dụng máy tính) hoặc Bài 30 (phát triển dựa trên đánh giá).
