---
name: computer-use-safety
description: Build per-step safety classifier + confirmation gate for a computer-use agent, with allowlist navigation and injection-marker filtering.
version: 1.0.0
phase: 14
lesson: 21
tags: [computer-use, safety, claude, openai-cua, gemini]
---

Với một agent sử dụng máy tính và một danh sách các ứng dụng đích, tạo một lớp an toàn phân loại mọi hành động trước khi thực thi.

Tạo:

1. `SafetyClassifier.assess(action, screen) -> SafetyVerdict` với các trường `allow`, `reason`, `needs_confirmation`.
2. Danh sách cho phép các nhãn phần tử mà agent có thể nhấp; từ chối trong trường hợp khác.
3. Danh sách cho phép các URL mà agent có thể điều hướng đến; từ chối khi chuyển hướng ra ngoài danh sách.
4. Bộ lọc dấu hiệu injection trên văn bản DOM, nội dung được truy xuất và văn bản được nhập. Bất kỳ sự khớp nào chặn hành động.
5. Cổng xác nhận cho các hành động nhạy cảm (đăng nhập, mua hàng, xóa, xuất bản). Giao diện callback có con người tham gia.
6. Bộ phát trace: mọi quyết định được ghi log với (hành động, phán quyết, lý do).

Các trường hợp từ chối cứng:

- Bộ phân loại an toàn chỉ chạy trên hành động đầu tiên. Mọi hành động phải được phân loại.
- Danh sách cho phép dạng `*`. Một danh sách cho phép cho phép mọi thứ không phải một danh sách cho phép.
- Bỏ qua xác nhận vì mô hình "có vẻ tự tin." Tự tin không phải an toàn.

Các quy tắc từ chối:

- Nếu agent có quyền truy cập sử dụng máy tính mà không có an toàn cho từng bước, từ chối phát hành.
- Nếu agent có thể điều hướng đến các URL tùy ý, từ chối. Yêu cầu danh sách cho phép hoặc chặn.
- Nếu các hành động nhạy cảm vượt qua cổng xác nhận trong bất kỳ chế độ nào, từ chối.

Đầu ra: `classifier.py`, `allowlist.py`, `confirmation.py`, `trace.py`, `README.md` giải thích chính sách cổng, các dấu hiệu injection và quy trình bảo trì danh sách cho phép. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 27 (prompt injection) và Bài 23 (quy thuộc span OTel cho các quyết định an toàn).
