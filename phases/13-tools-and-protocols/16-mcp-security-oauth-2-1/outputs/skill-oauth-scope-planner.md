---
name: oauth-scope-planner
description: Design MCP 2026-07-28 authorization with CIMD, issuer isolation, resource indicators, and step-up scopes.
version: 2.0.0
phase: 13
lesson: 16
tags: [mcp, oauth, cimd, pkce, issuer, resource-indicators]
---

Với máy chủ MCP HTTP từ xa và danh sách công cụ, thiết kế ranh giới cấp quyền đầy đủ.

## Required inputs

- URI tài nguyên MCP chuẩn và vị trí siêu dữ liệu tài nguyên được bảo vệ.
- Bên phát hành máy chủ cấp quyền được phép.
- Runtime client: native hoặc web, với URI chuyển hướng chính xác.
- Ánh xạ công cụ-sang-phạm vi và thao tác có hệ quả.
- Ràng buộc token, refresh và lưu thông tin xác thực.
- Máy chủ cấp quyền cũ thiếu CIMD, nếu có.

## Produce

1. Siêu dữ liệu tài nguyên. Soạn `resource`, `authorization_servers` và `scopes_supported` RFC 9728. Giữ đường dẫn tài nguyên sau đoạn well-known, như `https://notes.example.com/.well-known/oauth-protected-resource/mcp` cho `https://notes.example.com/mcp`.
2. Chính sách bên phát hành. Nêu đúng bên phát hành được phép, xác thực siêu dữ liệu, xử lý đổi và so `iss` RFC 9207.
3. Ghi danh. Dùng đăng ký trước khi có, nếu không ưu tiên Tài liệu siêu dữ liệu ID client. URL HTTPS có đường dẫn là `client_id`; yêu cầu URI chuyển hướng chính xác và coi siêu dữ liệu hiển thị là không đáng tin. `application_type` tùy chọn ở đây.
4. Dự phòng DCR. Nếu cần, gắn nhãn ngừng khuyến nghị, khai báo `application_type` và định nghĩa đúng điều kiện cho phép dự phòng. Không hạ cấp sau thất bại bảo mật CIMD chung.
5. Khóa thông tin xác thực. Lưu thông tin xác thực đăng ký trước và DCR dưới bên phát hành, token dưới `(issuer, resource)`. Cấm dùng lại giữa bên phát hành. Nêu URL CIMD tự host có thể chuyển và không cần đăng ký lại DCR khi bên phát hành đáng tin đổi.
6. Luồng PKCE. Yêu cầu S256, URI chuyển hướng chính xác, xác thực bên phát hành phản hồi cấp quyền và cùng tài nguyên trong yêu cầu cấp quyền và token.
7. Mô hình phạm vi. Ánh xạ mọi công cụ đến phạm vi tối thiểu. Coi thách thức phạm vi `WWW-Authenticate` hiện tại có thẩm quyền.
8. Trải nghiệm nâng quyền. Xác định phạm vi thêm, giải thích người dùng, điểm đồng ý, cấp quyền mới và thử lại với id yêu cầu MCP mới.
9. Kiểm tra máy chủ tài nguyên. Triển khai `tools/list` công bố với lược đồ gốc đối tượng hợp lệ, thứ tự tất định, kiểu kết quả, danh tính máy chủ và gợi ý bộ đệm. Xác thực bên phát hành, đối tượng nhận, hết hạn, phạm vi, header MCP hiện tại và siêu dữ liệu yêu cầu trước phân phối công cụ.
10. Vệ sinh token. Chỉ header bearer, không token truy vấn, không chuyển token xuyên qua, lưu refresh bí mật và kế hoạch xoay vòng.
11. Hợp đồng lỗi. Giữ mọi id yêu cầu trong vỏ lỗi JSON-RPC, gồm lỗi OAuth. Yêu cầu HTTP 400 `-32020` cho header không khớp trước kiểm tra hỗ trợ phiên bản HTTP 400 `-32022`, dữ liệu hỗ trợ và yêu cầu chính xác, HTTP 404 `-32601` cho phương thức không biết và 202 phần thân rỗng cho thông báo chấp nhận.
12. Ranh giới vận chuyển. Gắn nhãn ví dụ phần thân đã phân tích là mô hình giao thức trong tiến trình và gắn với adapter Streamable HTTP đầy đủ Bài 09 để xác thực Content-Type JSON và Accept JSON cộng SSE.

## Hard rejects

- DCR trình bày như cơ chế ghi danh mới ưu tiên.
- DCR không có `application_type`.
- Dùng lại thông tin xác thực đăng ký, access token hoặc refresh token do bên phát hành tạo sau đổi bên phát hành. URL CIMD tự host là ngoại lệ có thể chuyển, không phải bí mật do bên phát hành tạo.
- Chuẩn hóa `iss` phản hồi cấp quyền trước so sánh.
- Thiếu PKCE S256 hoặc thiếu `resource` trong yêu cầu cấp quyền và token.
- Nhận token cho đối tượng nhận khác hoặc chuyển token MCP xuống phía sau.
- Dùng `clientInfo`, `serverInfo`, khả năng hoặc phiên giao thức đã bỏ làm xác thực.
- Thêm OAuth vào stdio cục bộ chỉ để bắt chước HTTP từ xa.
- Bỏ đường dẫn tài nguyên được bảo vệ khi tạo URL siêu dữ liệu RFC 9728.
- Trả văn bản thuần hoặc đối tượng tùy hứng cho lỗi yêu cầu MCP thay vỏ JSON-RPC cùng id.

## Output format

Trả các mục tên Resource, Issuers, Enrollment, Credential Store, PKCE Flow, Scope Matrix, Step-Up, Server Validation, Token Hygiene và Compatibility. Kết thúc bằng đúng sự kiện buộc xem xét bên phát hành và, với client do bên phát hành tạo, ghi danh lại.
