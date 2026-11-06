---
name: mcp-server-scaffolder
description: Design a stateless MCP 2026-07-28 server with discovery, request validation, and deterministic primitives.
version: 2.0.0
phase: 13
lesson: 07
tags: [mcp, server, stateless, discovery, scaffold]
---

Với một miền, tạo kế hoạch máy chủ MCP hiện đại. Giữ trạng thái ứng dụng tường minh và hành vi giao thức không trạng thái.

Tạo ra:

1. Phân chia thành phần cơ bản. Định nghĩa công cụ đơn lẻ, tài nguyên định địa chỉ URI và prompt hữu ích. Bỏ thành phần khi miền không có cách dùng thực chất cho nó.
2. Kết quả khám phá. Cung cấp `supportedVersions`, khả năng máy chủ, chỉ dẫn tùy chọn, `resultType: "complete"`, gợi ý bộ đệm và danh tính máy chủ trong `_meta` kết quả.
3. Bộ xác thực yêu cầu. Yêu cầu phiên bản giao thức và khả năng client trong mọi `params._meta`. Xác thực danh tính client được khuyến nghị khi có. Trả `-32022` với phiên bản yêu cầu và hỗ trợ khi không khớp.
4. Lớp bọc kết quả. Thêm `resultType: "complete"` và danh tính máy chủ vào mọi thành công. Thêm `ttlMs` và `cacheScope` vào khám phá, danh sách, mẫu và đọc tài nguyên.
5. Chính sách thứ tự. Định nghĩa khóa sắp xếp ổn định cho mọi phản hồi danh sách.
6. Chính sách trạng thái. Đặt trạng thái bền vững trong cơ sở dữ liệu hoặc trả handle mờ tường minh như đối số công cụ thường. Không bao giờ giấu trạng thái trong phiên giao thức.
7. Ranh giới tương thích. Nếu cần hỗ trợ cũ, cô lập adapter initialize `2025-11-25`. Chỉ chọn cho lưu lượng cũ và kiểm thử hai thời kỳ độc lập.

Các trường hợp bác bỏ tuyệt đối:

- Máy chủ hiện đại có phương thức hợp lệ đầu tiên phải là `initialize`.
- Dùng lại khả năng, danh tính hoặc phiên bản từ yêu cầu trước.
- Trả `Mcp-Session-Id` trên lưu lượng HTTP hiện đại.
- Trả kết quả danh sách hoặc đọc tài nguyên không có gợi ý bộ đệm.
- Coi chú giải là kiểm soát cấp quyền.
- Gửi yêu cầu JSON-RPC độc lập từ máy chủ.

Quy tắc từ chối:

- Nếu tài nguyên được yêu cầu làm lộ bí mật không có cấp quyền, dừng và yêu cầu chính sách truy cập.
- Nếu miền không có dữ liệu chỉ đọc, bỏ tài nguyên thay vì bịa ra.
- Nếu miền không có mẫu tái sử dụng, bỏ prompt thay vì cung cấp nội dung lấp chỗ.

Xuất kiến trúc một trang, bảng phương thức, mã giả xác thực, ví dụ kết quả, quy tắc thứ tự tất định và ít nhất sáu kiểm thử tuân thủ. Kết thúc bằng ranh giới giữa trạng thái ứng dụng và trạng thái giao thức.
