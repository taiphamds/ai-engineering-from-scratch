---
name: mcp-auth-wiring
description: Design MCP 2026-07-28 authorization with issuer-bound enrollment, CIMD, protected-resource metadata, JWKS refresh, audience pinning, and per-request validation.
version: 2.0.0
phase: 13
lesson: 18
tags: [mcp, oauth, cimd, dcr, jwks, rfc8414, rfc7591, rfc8707, rfc7636, rfc9728, rfc9207]
---

Với cấu hình máy chủ MCP và tập khả năng IdP, phát bề mặt xác thực và quy tắc từ chối cấu thành tầng cấp quyền MCP sản xuất.

Đầu vào:

- `mcp_resource_url` — URL tài nguyên chuẩn (định danh cụ thể nhất; chỉ giữ đường dẫn khi phân biệt máy chủ cùng host), dùng làm `aud` và giá trị `resource` siêu dữ liệu tài nguyên được bảo vệ.
- `idp_metadata_url` — URL `/.well-known/oauth-authorization-server` (hoặc OpenID Connect Discovery) của IdP.
- `idp_capabilities`: giá trị quan sát cho `issuer`, `code_challenge_methods_supported`, `grant_types_supported`, `client_id_metadata_document_supported`, `registration_endpoint` ngừng khuyến nghị, `response_types_supported` và `authorization_response_iss_parameter_supported`.
- `pre_registered_client_ids`: ánh xạ bên phát hành-sang-ID-client tùy chọn do người vận hành máy chủ cấp quyền cấp. Ưu tiên danh tính phạm vi bên phát hành này trước CIMD, rồi chỉ dùng DCR ngừng khuyến nghị làm nhánh tương thích cuối.
- `application_type`: `native` hoặc `web`, bắt buộc khi chọn tương thích DCR ngừng khuyến nghị.
- `credential_store`: ID client và thông tin xác thực đăng ký khóa theo bên phát hành máy chủ cấp quyền, với token truy cập khóa theo `(issuer, mcp_resource_url)`.
- `tools`: danh sách công cụ MCP với phạm vi mỗi công cụ cần.

Tạo ra:

1. **Cổng từ chối.** Từ chối kết nối và dừng nếu bất kỳ điều kiện cứng nào thất bại:
   - Thiếu `S256` trong `code_challenge_methods_supported` (PKCE không chế độ suy giảm).
   - Thiếu `authorization_code` trong `grant_types_supported`.
   - `response_types_supported` là bất cứ thứ gì ngoài chính xác `["code"]`.
   - Không nhánh ghi danh tồn tại: không có `client_id` đăng ký trước, `client_id_metadata_document_supported: true` hoặc endpoint tương thích DCR ngừng khuyến nghị nào sẵn.
   - CIMD được chọn nhưng `client_id` không là URL tài liệu HTTPS tuyệt đối có đường dẫn, không khớp URL tài liệu hoặc tài liệu thiếu `client_name` không rỗng hay mảng `redirect_uris`. `application_type` tùy chọn cho CIMD.
   - RFC 9207 `iss` trả về khác bên phát hành ghi trước chuyển hướng hoặc bị bỏ khi máy chủ công bố hỗ trợ.
   - DCR ngừng khuyến nghị thiếu `application_type`, hoặc chính sách URI chuyển hướng xung đột `native` hoặc `web`.

2. **Tài liệu siêu dữ liệu tài nguyên được bảo vệ** (RFC 9728) cho máy chủ MCP. Với tài nguyên có đường dẫn, chèn đoạn well-known trước đường dẫn: `https://host/team/mcp` ánh xạ thành `https://host/.well-known/oauth-protected-resource/team/mcp`. Gồm `resource`, `authorization_servers` (danh sách cho phép bên phát hành), `scopes_supported` và `bearer_methods_supported: ["header"]`.

3. **Endpoint HTTP.**
   - `GET /.well-known/oauth-protected-resource` — trả tài liệu từ (2).
   - `POST /mcp` (vận chuyển MCP không trạng thái): xác thực bearer token cho yêu cầu này trước mọi công cụ được phân phối.
   - Chỉ tương thích DCR: `POST /register`, với kiểm tra loại ứng dụng và giới hạn tốc độ phía trước.

4. **Công việc nền + thủ tục.**
   - Làm mới JWKS theo lịch lấy lại `jwks_uri` vào bộ đệm `{keys, fetched_at}`. Lũy đẳng; không bao giờ tạo khóa. AS xoay; máy chủ tài nguyên chỉ làm mới. Mặc định `0 */6 * * *`; thắt thành `*/15 * * * *` cho IdP xoay cao.
   - Thủ tục `validate` — kiểm tra danh sách cho phép `iss`, chữ ký theo JWKS lưu đệm, `aud == mcp_resource_url`, `exp`, phạm vi bắt buộc.
   - Nhánh cấp nâng quyền — chỉ nếu danh sách công cụ chứa thao tác chặn sau phạm vi người dùng ban đầu không cấp.

5. **Kế hoạch bộ đệm.** Một mục mỗi bên phát hành chấp nhận khóa theo `issuer`, giữ `{keys, fetched_at}`. Ghi mẫu đọc: bộ xác thực đọc bộ đệm và dự phòng một lần làm mới đồng bộ khi trượt `kid` (lấy lại, không xoay — lấy lại lũy đẳng và không biến được thành DoS tạo khóa).

6. **Ánh xạ phạm vi.** Ánh xạ mọi công cụ đến phạm vi cần. Xuất bảng:
   `| tool | required_scope | rationale |`. Nhóm công cụ phá hủy dưới phạm vi riêng; không bao giờ dùng lại phạm vi đọc cho công cụ ghi.

7. **Quy tắc từ chối lúc chạy** (bộ xác thực phải mã hóa):
   - Từ chối khi `aud != mcp_resource_url` → 401 `Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="<prm_url>"`.
   - Từ chối khi `iss not in authorization_servers`.
   - Từ chối khi `kid` không trong JWKS lưu đệm sau một lần dự phòng lấy lại.
   - Từ chối khi thiếu phạm vi bắt buộc → 403 `Bearer error="insufficient_scope", scope="<required>", resource_metadata="<prm_url>"`.
   - Từ chối mọi yêu cầu cấp quyền không có S256 `code_challenge` và mọi yêu cầu token có `code_verifier`, client, URI chuyển hướng hoặc `resource` không khớp bản ghi mã cấp quyền một lần.
   - Từ chối mọi thông tin xác thực hoặc token có bên phát hành không khớp khóa kho thông tin xác thực. Bên phát hành đổi cần ghi danh mới.

Các trường hợp bác bỏ tuyệt đối (không bao giờ kết nối bất kỳ thứ nào — từ chối yêu cầu và ghi lý do):

- Lưu `client_secret` văn bản thuần. Client công khai dùng `token_endpoint_auth_method: none`; client bí mật dùng `private_key_jwt`. Không bí mật dùng chung văn bản thuần khi lưu hoặc trong nhật ký phản hồi đăng ký.
- Bỏ kiểm tra `aud` trên bộ xác thực. Gắn đối tượng nhận (hạn chế đặc quyền token truy cập) là toàn bộ lý do cho RFC 8707 + RFC 9728.
- Nối dự phòng trượt bộ đệm JWKS vào xoay-và-tạo thay lấy lại. Không bao giờ tạo `kid` thiếu và cho giá trị `kid` do kẻ tấn công kiểm soát ép tạo khóa vô hạn. Dự phòng phải làm mới lũy đẳng.
- Cho yêu cầu mã cấp quyền không PKCE. OAuth 2.1 cấm; bộ xác thực phải từ chối mọi trao đổi `/token` có bản ghi mã cấp quyền lưu thiếu `code_challenge`.
- Lưu đệm JWKS không công việc làm mới. Hoặc cung cấp làm mới theo lịch, hoặc bề mặt xác thực không triển khai.
- Tin claim `iss` không danh sách cho phép. Bộ xác thực nhận token từ mọi `iss` cho kẻ tấn công dựng IdP riêng và giả token.
- Chuyển token MCP đến sang API phía trước (token passthrough). Nếu máy chủ MCP gọi API phía trước nó PHẢI lấy token riêng; chuyển xuyên tạo vấn đề confused deputy.
- Lưu `registration_access_token` văn bản thuần. Hash khi lưu; yêu cầu văn bản rõ trên mọi cập nhật.
- Coi siêu dữ liệu yêu cầu MCP hoặc phiên giao thức đã bỏ là trạng thái cấp quyền. Vận chuyển 2026-07-28 không trạng thái; xác thực và cấp quyền mọi yêu cầu.

Đầu ra: kế hoạch một trang với tài liệu tài nguyên được bảo vệ, bố cục ghi danh khóa theo bên phát hành, bố cục token bên phát hành-và-tài nguyên, nhánh ghi danh chọn, endpoint HTTP, công việc làm mới JWKS, ánh xạ phạm vi và quy tắc từ chối runtime. Kết thúc bằng cổng triển khai chưa đạt đầu tiên tìm trong siêu dữ liệu thực của máy chủ cấp quyền.
