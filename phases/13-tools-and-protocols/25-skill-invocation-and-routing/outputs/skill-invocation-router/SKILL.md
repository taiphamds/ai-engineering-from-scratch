---
name: skill-invocation-router
description: Design and test explicit human, implicit model or agent, programmatic application, bounded skill-composition, and harness activation policies for an Agent Skill catalog.
license: MIT
metadata:
  lesson: "25"
---

# Skill invocation router

Dùng skill này khi host cần chính sách kích hoạt kiểm toán được thay một cờ `invocable` không phân biệt.

1. Đọc `references/invocation-model.md` và phân loại kênh yêu cầu.
2. Đánh giá `assets/host-policy.json` như cấu hình adapter ví dụ, không tiêu chuẩn có thể chuyển.
3. Chạy `python3 scripts/simulate_invocation.py --policy assets/host-policy.json --actor ACTOR --name NAME --description DESCRIPTION --query QUERY [--explicit-name NAME] [--caller-name NAME] [--depth N] [--user-invocable true|false] [--disable-model-invocation true|false]`.
4. Với yêu cầu con người, ứng dụng, skill hoặc bộ khung, yêu cầu đúng tên đã khám phá và danh sách cho phép riêng kênh.
5. Với bên gọi skill, cũng yêu cầu danh tính bên gọi, đích không chu kỳ và độ sâu kết hợp có giới hạn.
6. Với yêu cầu mô hình hoặc agent tự chủ, bỏ ứng viên tác nhân hoặc phần mở rộng host nhận biết làm không đủ điều kiện.
7. Chỉ chấm mô tả còn lại. Chọn khớp đủ điều kiện mạnh nhất hoặc không chọn khi không ứng viên đủ điều kiện vượt ngưỡng.
8. Trả quyết định JSON với adapter, kênh, điểm và lý do chính sách.

Kích hoạt tải chỉ dẫn. Không phê duyệt công cụ, thay đổi hệ thống file, truy cập mạng, dùng bí mật hoặc script đi kèm.
