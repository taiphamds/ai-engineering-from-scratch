# MCP Auth in Production: Issuer-Bound Enrollment and Tokens

> Bài 16 xây máy trạng thái OAuth 2.1. Bài này gia cố ranh giới sản xuất cho MCP 2026-07-28: Tài liệu siêu dữ liệu ID client trước, đăng ký động ngừng khuyến nghị chỉ để tương thích, xác thực bên phát hành phản hồi cấp quyền, thông tin xác thực client khóa theo bên phát hành, làm mới JWKS và token ghim đối tượng nhận trên mọi yêu cầu không trạng thái.
>
> **Ghi chú đặc tả (2026-07-28):** Đăng ký client động ngừng được khuyến nghị để ưu tiên Tài liệu siêu dữ liệu ID client. DCR vẫn là cơ chế tương thích. Khi dùng, client khai báo đúng `application_type`. Client xác thực giá trị RFC 9207 `iss` có mặt và không bao giờ dùng lại thông tin xác thực giữa các bên phát hành máy chủ cấp quyền.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## Learning Objectives

- Khám phá máy chủ cấp quyền qua siêu dữ liệu RFC 8414 và xác minh hợp đồng.
- Ghi danh qua Tài liệu siêu dữ liệu ID client và cô lập DCR ngừng khuyến nghị làm dự phòng.
- Xác thực RFC 9207 `iss`, đặt khóa đăng ký theo bên phát hành máy chủ cấp quyền và token gắn tài nguyên theo bên phát hành cộng tài nguyên.
- Lưu đệm và làm mới khóa JWKS theo lịch để xác minh chữ ký sống qua xoay khóa.
- Ghim token vào một tài nguyên MCP bằng chỉ báo tài nguyên RFC 8707 và từ chối dùng lại kiểu confused deputy.
- Chọn xác thực JWT hoặc introspection token, định nghĩa độ mới thu hồi và thất bại an toàn khi phụ thuộc danh tính không sẵn.
- Tách máy chủ cấp quyền, máy chủ tài nguyên và client để mỗi bên chỉ thực thi kiểm tra riêng.
- Kiểm tra máy chủ cấp quyền theo danh sách triển khai và từ chối ghi danh hoặc dùng lại token không an toàn.

## The Problem

Mô phỏng Bài 16 chạy OAuth 2.1 trong bộ nhớ. Sản xuất có ba khoảng trống vận hành mô phỏng chỉ bộ nhớ không thấy.

Khoảng trống đầu là ghi danh và cô lập thông tin xác thực. Tổ chức thật có thể chạy hàng trăm máy chủ MCP và hàng nghìn client MCP. Bản sửa đổi 2026-07-28 ưu tiên **Tài liệu siêu dữ liệu ID client**: client dùng URL HTTPS có đường dẫn nó kiểm soát làm định danh và máy chủ cấp quyền kéo siêu dữ liệu. Đăng ký động RFC 7591 chỉ còn là nhánh tương thích ngừng khuyến nghị. Khi DCR không tránh được, yêu cầu khai báo đúng `application_type`. Client lưu đăng ký dưới bên phát hành máy chủ cấp quyền và token truy cập dưới cặp `(issuer, resource)`. Bên phát hành đổi nghĩa ghi danh mới và tài nguyên khác nghĩa token gắn đối tượng nhận riêng.

Khoảng trống thứ hai là xoay khóa. Xác thực JWT phụ thuộc khóa ký của máy chủ cấp quyền, công bố dưới dạng JSON Web Key Set (JWKS). Máy chủ cấp quyền xoay chúng theo lịch (thường mỗi giờ, đôi khi nhanh hơn khi ứng phó sự cố). Máy chủ MCP chỉ lấy JWKS một lần khi khởi động xác thực tốt đến cửa sổ xoay — rồi mọi yêu cầu thất bại đến khởi động lại. Sản xuất nối JWKS như giá trị lưu đệm với công việc làm mới ghi đè bộ đệm trước khóa trước hết hạn, cộng lấy dự phòng khi trượt bộ đệm cho trường hợp token ký bằng khóa mới hơn bộ đệm đến.

Khoảng trống thứ ba là gắn đối tượng nhận. Bài 16 giới thiệu chỉ báo tài nguyên RFC 8707. Trong sản xuất, chỉ báo thành kiểm tra claim cứng trên mọi yêu cầu. Máy chủ MCP so `token.aud` với URL tài nguyên chuẩn riêng và từ chối không khớp bằng HTTP 401. Đây là phòng vệ duy nhất chống máy chủ MCP phía trước (hoặc client độc hại giữ token dành cho một máy chủ) phát lại token đó với máy chủ khác trong cùng lưới tin cậy.

Bài này ánh xạ mỗi khoảng trống vào phần bề mặt cụ thể. Tài liệu siêu dữ liệu là endpoint HTTP. Làm mới bộ đệm JWKS là công việc theo lịch cộng bộ đệm khóa-giá trị. Xác thực JWT là thủ tục máy chủ tài nguyên chạy trước phân phối mọi công cụ. Giữ ba vai trò riêng và mỗi bên chỉ thực thi kiểm tra mình sở hữu: máy chủ cấp quyền cấp và xoay khóa, máy chủ tài nguyên lưu đệm và xác thực, client khám phá và ghi danh.

## Scope: Production Enforcement After Lesson 16

[Bài 16: Bảo mật MCP với OAuth 2.1](../../16-mcp-security-oauth-2-1/docs/en.md) phụ trách máy trạng thái mã cấp quyền, PKCE, khám phá tài nguyên được bảo vệ, chỉ báo tài nguyên và quyết định phạm vi. Bài này không định nghĩa luồng OAuth thứ hai. Nó bắt đầu sau khi hợp đồng đó tồn tại và hỏi máy chủ tài nguyên triển khai tiếp tục thực thi chúng thế nào trong xoay khóa, xác thực token mờ, thu hồi, lỗi phụ thuộc, triển khai và ứng phó sự cố.

Ranh giới sản xuất hẹp hơn và mang tính vận hành hơn:

- Nhánh JWT xác minh bên phát hành ghim, thuật toán, khóa chữ ký, đối tượng nhận, claim thời gian và phạm vi trên mọi yêu cầu trong khi làm mới JWKS an toàn.
- Nhánh token mờ gọi endpoint introspection có xác thực của bên phát hành và xác thực trạng thái hoạt động, đối tượng nhận hoặc tài nguyên, hết hạn, chủ thể và phạm vi trả về.
- Chính sách thu hồi định nghĩa thông tin xác thực phải ngừng hoạt động nhanh đến đâu và bộ đệm nào có thể trì hoãn sự thật đó.
- Chính sách thất bại quyết định điều gì xảy ra khi hạ tầng khám phá, JWKS, introspection hoặc thu hồi không sẵn.
- Bằng chứng ghi siêu dữ liệu bên phát hành nào, bộ khóa hoặc phản hồi introspection nào, claim token, phiên bản chính sách và lý do từ chối dẫn đến kết quả mà không lưu token.

Phân biệt này giữ bài học kết hợp được. Bài 16 chứng minh luồng. Bài 18 chứng minh token còn đáng tin, hoặc bị từ chối, sau khi đến nhánh yêu cầu MCP thật.

## The Concept

### RFC 8414 — OAuth Authorization Server Metadata

Tài liệu tại `/.well-known/oauth-authorization-server` mô tả mọi thứ client cần:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

Client được cho URL tài nguyên MCP nối khám phá: `oauth-protected-resource` từ RFC 9728 (tài liệu máy chủ tài nguyên) nêu bên phát hành, rồi `oauth-authorization-server` (RFC này) nêu mọi endpoint. Client không bao giờ mã hóa cứng URL cấp quyền.

Với định danh tài nguyên có đường dẫn, chèn đoạn well-known trước đường dẫn. Ví dụ `https://mcp.example.com/team/server` phân giải siêu dữ liệu tài nguyên được bảo vệ tại `https://mcp.example.com/.well-known/oauth-protected-resource/team/server`. Nối `/.well-known/...` sau đường dẫn tài nguyên là sai.

Hợp đồng bạn xác minh trước tin IdP cho MCP:

- `code_challenge_methods_supported` gồm `S256` (PKCE theo RFC 7636). Đặc tả rõ: nếu trường **vắng**, máy chủ cấp quyền không hỗ trợ PKCE và client **PHẢI** từ chối tiếp tục.
- `grant_types_supported` gồm `authorization_code` và từ chối `password` và `implicit`.
- Ít nhất một nhánh ghi danh sẵn: `client_id_metadata_document_supported: true` (CIMD, ưu tiên), client đăng ký trước hoặc `registration_endpoint` (tương thích RFC 7591 ngừng khuyến nghị).
- Nếu `authorization_response_iss_parameter_supported` true, client yêu cầu RFC 9207 `iss` trả về và so chính xác với bên phát hành ghi trước chuyển hướng.
- `response_types_supported` chính xác là `["code"]` cho OAuth 2.1.

Nếu thiếu `S256`, máy chủ MCP từ chối triển khai với IdP này — không chế độ suy giảm cho PKCE. Nếu *không nhánh nào* được công bố và bạn không có `client_id` đăng ký trước, cũng không thể ghi danh; manifest triển khai sai, không phải mã.

### RFC 9728 (recap) — Protected Resource Metadata

Bài 16 đề cập RFC 9728. Khác biệt trong sản xuất: tài liệu này là nơi duy nhất client tìm máy chủ cấp quyền được *máy chủ MCP này* tin. Một máy chủ MCP có thể nhận token từ nhiều IdP (một cho nhân viên, một cho đối tác). RFC 9728 khai báo tập đó; RFC 8414 ghi mỗi IdP hỗ trợ gì.

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### Client ID Metadata Documents (the recommended default)

CIMD đảo đăng ký từ *đẩy* sang *kéo*. Thay yêu cầu máy chủ cấp quyền tạo `client_id`, client dùng URL HTTPS nó kiểm soát **làm** `client_id`. URL phân giải thành tài liệu siêu dữ liệu JSON; máy chủ cấp quyền lấy theo nhu cầu trong luồng OAuth. Tin cậy bắt nguồn DNS: nếu người vận hành máy chủ tin `app.example.com`, họ tin client phục vụ từ `https://app.example.com/client.json`. Không lượt khứ hồi đăng ký, không không gian tên `client_id` để làm cạn, không trạng thái mỗi máy chủ cần đồng bộ.

Tài liệu siêu dữ liệu client host:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

Giá trị `client_id` trong tài liệu **PHẢI** bằng URL nó được phục vụ (máy chủ cấp quyền xác minh; không khớp bị từ chối). Máy chủ cấp quyền công bố hỗ trợ bằng `client_id_metadata_document_supported: true` trong siêu dữ liệu RFC 8414.

Với hợp đồng CIMD hiện tại, `client_id`, `client_name` và mảng `redirect_uris` không rỗng là bắt buộc. Định danh client là URL HTTPS tuyệt đối có đường dẫn. Có thể gồm `application_type`, nhưng không là trường CIMD bắt buộc. Không sao chép yêu cầu DCR cho `application_type` vào nhánh CIMD ưu tiên.

Hai sự thật bảo mật đặc tả nói thẳng:

- **SSRF.** Máy chủ cấp quyền lấy URL do kẻ tấn công cung cấp. Phải phòng giả mạo yêu cầu phía máy chủ (không lấy endpoint nội bộ/quản trị).
- **Mạo danh localhost.** Chỉ CIMD không chặn kẻ tấn công cục bộ tuyên bố URL siêu dữ liệu client hợp lệ và gắn chuyển hướng `localhost` bất kỳ. Máy chủ cấp quyền **PHẢI** hiển thị rõ hostname URI chuyển hướng khi đồng ý và **NÊN** cảnh báo chuyển hướng chỉ `localhost`.

Vì CIMD không cần trạng thái phía máy chủ, không có bộ đăng ký phải dựng như DCR yêu cầu. Phía client chỉ đọc: phục vụ tài liệu siêu dữ liệu từ endpoint HTTPS tĩnh và để máy chủ cấp quyền kéo.

Nếu người vận hành máy chủ cấp quyền đã cấp định danh client, dùng đăng ký phạm vi bên phát hành đó trước thử ghi danh tự động. Nếu không ưu tiên CIMD. Chỉ dùng DCR ngừng khuyến nghị khi bên phát hành không dùng được đăng ký trước hoặc CIMD.

### RFC 7591: deprecated compatibility enrollment

DCR ngừng được khuyến nghị trong bản sửa đổi 2026-07-28. Chỉ giữ cho máy chủ cấp quyền không tiếp nhận được CIMD và đăng ký trước không thực tế. Client tương thích gửi POST:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

Máy chủ phản hồi `client_id` và `registration_access_token` để cập nhật sau:

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type` không trang trí. Client máy tính loopback khai báo `native`; client host trên máy chủ khai báo `web` và dùng URI chuyển hướng HTTPS. `token_endpoint_auth_method: none` là mặc định đúng cho client native công khai. Nó chỉ nhận `client_id`, với PKCE cung cấp bằng chứng sở hữu.

Ba cạm bẫy sản xuất:

- Endpoint đăng ký phải giới hạn tốc độ theo IP nguồn. Không có, tác nhân thù địch viết script hàng triệu đăng ký giả và làm cạn không gian tên `client_id`. Chạy kiểm tra giới hạn tốc độ trước bộ đăng ký xử lý yêu cầu.
- `software_statement` (JWT có chữ ký bảo chứng client) được một số IdP doanh nghiệp yêu cầu. Mô phỏng bài bỏ qua; sản xuất nối bước xác minh từ chối đăng ký không chữ ký từ mọi thứ ngoài URI chuyển hướng localhost.
- `registration_access_token` phải lưu dạng hash, không văn bản thuần. Trộm token này nghĩa kẻ tấn công viết lại được URI chuyển hướng client.

### RFC 8707 (recap) — Resource Indicators

Bài 16 thiết lập hình dạng. Quy tắc sản xuất: mọi yêu cầu token gồm `resource=<canonical-mcp-url>`, và máy chủ MCP xác minh `token.aud` khớp URL tài nguyên riêng trên mọi lời gọi. URI chuẩn là định danh *cụ thể nhất* cho máy chủ: dùng scheme và host viết thường, không fragment và theo quy ước không gạch chéo cuối. Thành phần đường dẫn **không** bị bỏ theo quy tắc — đặc tả giữ khi cần định danh máy chủ MCP riêng. `https://mcp.example.com`, `https://mcp.example.com/mcp`, `https://mcp.example.com:8443`, và `https://mcp.example.com/server/mcp` đều là URI chuẩn hợp lệ. Chọn một mỗi máy chủ và ghim `aud` đúng vào đó. (Mô phỏng bài dùng đối tượng nhận host trần như `https://notes.example.com` cho ngắn; triển khai host nhiều máy chủ MCP dưới một origin phân biệt bằng đường dẫn.)

### RFC 7636 (recap) — PKCE

PKCE bắt buộc trong OAuth 2.1. Luồng mã cấp quyền bài luôn mang `code_challenge` và `code_verifier`. Máy chủ từ chối mọi yêu cầu token không verifier hoặc verifier không hash ra thách thức đã lưu.

### MCP 2026-07-28 authorization profile

Bản sửa đổi MCP hiện tại giữ ranh giới máy chủ tài nguyên OAuth trong khi làm vận chuyển MCP không trạng thái. Không có phiên giao thức để lưu đệm quyết định danh tính. Vì vậy tầng cấp quyền xác thực độc lập mỗi yêu cầu:

- Triển khai siêu dữ liệu tài nguyên được bảo vệ RFC 9728 và cung cấp vị trí qua header `WWW-Authenticate: Bearer resource_metadata="..."` trên 401 **hoặc** URI well-known `/.well-known/oauth-protected-resource` (SEP-985 làm header tùy chọn với dự phòng well-known). Trường siêu dữ liệu `authorization_servers` **PHẢI** nêu ít nhất một máy chủ.
- Chỉ nhận token qua `Authorization: Bearer ...` trên **mọi** yêu cầu — không bao giờ trong chuỗi truy vấn, không bao giờ chỉ xác thực lúc bắt đầu phiên.
- Xác thực `aud`, `iss`, `exp` và phạm vi bắt buộc mỗi yêu cầu. Máy chủ **PHẢI** xác thực token được cấp riêng cho nó (đối tượng nhận); `aud` thiếu hoặc không khớp bị từ chối, không bao giờ coi là ký tự đại diện.
- Trên 401/403, trả `WWW-Authenticate: Bearer` mang `error=...`, tham số `resource_metadata="<PRM-URL>"` (URL tài liệu siêu dữ liệu, *không phải* tài nguyên trần) và `scope="..."` trên `insufficient_scope` (403). Lưu ý: tham số là `resource_metadata`, con trỏ khám phá — không có tham số `resource` trong thách thức.
- Khám phá máy chủ cấp quyền nhận **hoặc** siêu dữ liệu OAuth RFC 8414 **hoặc** OpenID Connect Discovery 1.0; client phải thử cả hai hậu tố well-known theo thứ tự ưu tiên.
- Client (không phải máy chủ) phòng **tấn công mix-up**: ghi `issuer` kỳ vọng trước chuyển hướng và xác thực giá trị `iss` trả trong phản hồi cấp quyền thật (RFC 9207) trước đổi mã. Chỉ PKCE không chặn mix-up vì client đưa `code_verifier` đến endpoint token bất kỳ mà nó bị hướng đến.
- Thông tin xác thực client thuộc một bên phát hành máy chủ cấp quyền. Nếu khám phá phân giải đến bên khác, client ghi danh lại thay đưa `client_id`, token đăng ký hoặc token truy cập cũ.
- CIMD là cơ chế ghi danh ưu tiên. DCR ngừng được khuyến nghị; yêu cầu DCR tương thích vẫn khai báo đúng `application_type`.

Dự thảo OAuth 2.1 là nền; RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD là bề mặt; đặc tả MCP là hồ sơ.

### Deployment capability checklist

Bảng tính năng nhà cung cấp nhanh cũ. Thay vào đó kiểm tra siêu dữ liệu trả bởi máy chủ cấp quyền bạn thực sự triển khai. Cổng mang tính cơ học:

| Kiểm tra | Quyết định bắt buộc |
|---|---|
| Bên phát hành khám phá | Đúng bên phát hành HTTPS chính sách kỳ vọng |
| PKCE | `S256` công bố; nếu không dừng |
| Ghi danh | CIMD ưu tiên, đăng ký trước chấp nhận, DCR chỉ để tương thích ngừng khuyến nghị |
| Phản hồi cấp quyền | Xác thực RFC 9207 `iss` khi có hoặc công bố |
| Gắn tài nguyên | Yêu cầu token mang `resource`; máy chủ tài nguyên yêu cầu `aud` khớp |
| Lưu thông tin xác thực | Đặt khóa ID client và thông tin xác thực đăng ký theo bên phát hành; token truy cập theo bên phát hành cộng tài nguyên |
| Tương thích DCR | Khai báo `native` hoặc `web`; từ chối URI chuyển hướng không hợp loại ứng dụng khai báo |

Không suy hỗ trợ từ tên sản phẩm hoặc gói giá. Lưu tài liệu khám phá trong bằng chứng triển khai và thất bại theo hướng đóng khi thiếu trường bắt buộc.

### JWKS refresh pattern (rotate at the AS, refresh at the resource server)

Giữ hai động từ riêng, vì nhập làm một là lỗi sản xuất thật:

- **Xoay** là việc *máy chủ cấp quyền* làm: tạo khóa ký mới, công bố trong JWKS, thu hồi khóa cũ sau. Máy chủ tài nguyên không tham gia và không thể làm — nó không giữ khóa riêng IdP.
- **Làm mới** là việc *máy chủ tài nguyên* làm: `GET` lại JWKS đã công bố vào bộ đệm. Đó là hành động JWKS duy nhất máy chủ tài nguyên từng thực hiện.

Dạng lỗi sản xuất là bộ đệm cũ. Giải bằng công việc làm mới theo lịch cộng bộ đệm khóa-giá trị. Máy chủ tài nguyên chạy công việc (cron, timer, bất cứ thứ runtime cung cấp) ở khoảng cố định lấy `<issuer>/.well-known/jwks.json` và ghi đè `cache[issuer] = {keys, fetched_at}`. Bộ xác thực đọc bộ đệm đó. Token có `kid` thiếu trong bộ đệm kích hoạt **một** lần làm mới đồng bộ để dự phòng, rồi kiểm tra lại. Xử lý hai trường hợp cùng lúc: làm mới theo lịch và cửa sổ chồng khóa nơi token ký bằng khóa hoàn toàn mới đến trước lần làm mới theo lịch tiếp.

Dự phòng **phải là lấy lại, không bao giờ xoay**. Nếu nối nhánh trượt bộ đệm vào xoay-và-tạo, hai thứ hỏng: (1) tạo khóa mới sinh `kid` *vẫn* không khớp token, nên tra cứu vẫn thất bại; và (2) kẻ tấn công phun token với giá trị `kid` ngẫu nhiên ép chuỗi tạo khóa không giới hạn — DoS tự gây. Lấy lại lũy đẳng, nên `kid` giả tốn tối đa một lần lấy lãng phí.

Hình dạng bộ đệm:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

Hai khóa cùng lúc là trạng thái ổn định. Máy chủ cấp quyền xoay bằng đưa khóa tiếp (`k_2026_04`) trước thu hồi khóa trước (`k_2026_03`), nên token cấp dưới khóa cũ còn hợp lệ đến hết hạn. Bộ đệm giữ hợp; bộ xác thực chọn theo `kid`.

### The validation routine

Máy chủ MCP chạy xác thực trước phân phối mọi công cụ. Hình dạng `code/main.py` dùng:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate` giải mã JWT, phân giải khóa ký từ bộ đệm JWKS (làm mới một lần khi trượt), xác minh chữ ký, rồi kiểm tra `iss` theo danh sách cho phép, `aud` theo tài nguyên chuẩn máy chủ này, `exp` và phạm vi bắt buộc — trả thách thức `WWW-Authenticate` ở thất bại đầu. Giữ một thủ tục trên máy chủ tài nguyên nghĩa mọi điểm vào (mọi lời gọi công cụ, mọi vận chuyển) qua cùng kiểm tra; không có nhánh đến công cụ không xác thực trước.

### Opaque tokens use introspection, not guesswork

Không phải mọi token truy cập là JWT. Nếu bên phát hành ghi token mờ, máy chủ tài nguyên không thể giải mã thành claim đáng tin. Nó gửi token đến endpoint introspection RFC 7662 của bên phát hành trên kênh sau có xác thực và yêu cầu `active: true`, ngữ cảnh bên phát hành kỳ vọng, đúng đối tượng nhận hoặc tài nguyên MCP, claim thời gian chưa hết hạn và phạm vi công cụ cụ thể cần.

Lưu đệm introspection theo bên phát hành, bản băm token một chiều và tài nguyên MCP. Không bao giờ dùng token rõ làm nhãn nhật ký hoặc bộ đệm. Giới hạn mục bộ đệm dương theo thời điểm sớm nhất giữa hết hạn token, hướng dẫn bộ đệm bên phát hành và mục tiêu độ mới thu hồi triển khai. Giữ lưu đệm âm đủ ngắn để token vừa cấp không còn bị coi sai là bất hoạt. Kết quả cho tài nguyên này không thể cấp quyền tài nguyên khác dù chuỗi token mờ giống hệt.

Không chọn chế độ xác thực từ nội dung token do kẻ tấn công kiểm soát. Ghim hành vi JWT so với introspection vào siêu dữ liệu bên phát hành đã xác thực và cấu hình triển khai. Trên nhánh JWT, ghim thuật toán chấp nhận và `jwks_uri` đáng tin; không bao giờ theo URL khóa hoặc thuật toán chỉ do header token chọn.

### Revocation is a freshness contract

RFC 7009 cho client yêu cầu máy chủ cấp quyền thu hồi token. Yêu cầu đó không xóa bản sao đã lưu đệm bởi mọi máy chủ tài nguyên. Định nghĩa độ trễ thu hồi tối đa chấp nhận được và làm mọi bộ đệm tôn trọng.

Triển khai token mờ có thể thu hồi chặt hơn bằng introspection trên mỗi lời gọi rủi ro cao hoặc bộ đệm dương ngắn. Triển khai JWT tự đầy đủ thường kết hợp tuổi token truy cập ngắn với thu hồi refresh token, thu hồi khóa cho sự cố toàn bên phát hành và danh sách từ chối chủ thể, phiên hoặc id token tùy chọn để từ chối cục bộ khẩn. JWT có chữ ký vẫn hợp lệ mật mã đến hết hạn trừ khi máy chủ tài nguyên có bằng chứng thu hồi bên ngoài hiện tại.

Đăng xuất, vô hiệu tài khoản, rút đồng ý và ứng phó sự cố là kích hoạt khác nhau nhưng phải hội tụ một tuyên bố đo được: sau tối đa cửa sổ thu hồi khai báo, mọi bản sao từ chối thông tin xác thực. Kiểm thử tuyên bố qua bộ cân bằng tải, không chỉ trên một tiến trình đã làm nóng.

### Dependency failure needs a declared decision

Không bao giờ ứng biến chính sách sẵn sàng trong trình xử lý ngoại lệ.

| Thất bại | Hành vi sản xuất an toàn |
|---|---|
| Làm mới JWKS theo lịch thất bại, `kid` đã biết còn trong bộ đệm có giới hạn vẫn hợp lệ | Chỉ tiếp tục trong cửa sổ dùng dữ liệu cũ khi lỗi đã khai báo và phát bằng chứng sức khỏe suy giảm |
| Token có `kid` không biết và một lần làm mới cho phép thất bại | Từ chối; không bao giờ nhận chữ ký không xác minh được |
| Introspection không sẵn | Thất bại theo hướng đóng cho lời gọi được bảo vệ; không biến lỗi mạng thành `active: true` |
| Siêu dữ liệu tài nguyên được bảo vệ hoặc bên phát hành đổi bất ngờ | Dừng ghi danh và lấy token mới; chỉ giữ cấu hình ghim rõ, chưa hết hạn dưới chính sách sự cố có giới hạn |
| Endpoint thu hồi không sẵn | Báo đăng xuất hoặc thu hồi chưa xong, giữ thông tin xác thực cục bộ là không dùng được khi có thể và không khẳng định thu hồi toàn cục thành công |
| Nguồn đồng hồ hoặc kiểu claim không hợp lệ | Từ chối thay vì nới độ lệch đến khi token qua |

Phân loại thất bại riêng thông tin xác thực không hợp lệ. Mất dịch vụ phụ thuộc là lỗi vận hành với chính sách sức khỏe và thử lại. Chữ ký, bên phát hành, đối tượng nhận, hết hạn hoặc phạm vi xấu là từ chối cấp quyền. Không bên nào đến trình xử lý công cụ và không bên nào nên rò nội dung token vào bằng chứng kiểm toán.

### Audience-replay walkthrough (access-token privilege restriction)

Máy chủ A (`notes.example.com`) và Máy chủ B (`tasks.example.com`) đều đăng ký với cùng máy chủ cấp quyền. Máy chủ A bị xâm phạm. Kẻ tấn công lấy token ghi chú người dùng và phát lại với Máy chủ B.

Bộ xác thực Máy chủ B:

1. Giải mã JWT, lấy JWKS theo `kid`, xác minh chữ ký.
2. Kiểm tra `iss` theo `authorization_servers` của siêu dữ liệu tài nguyên được bảo vệ. (Đạt — cùng IdP.)
3. Kiểm tra `aud == "https://tasks.example.com"`. (Trượt — `aud` token là `https://notes.example.com`.)
4. Trả 401 với `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`.

Claim đối tượng nhận là phòng vệ duy nhất trước tấn công này ở tầng giao thức. Bỏ vì hiệu năng là lỗi sản xuất phổ biến nhất; bộ xác thực phải chạy trên mọi yêu cầu, không chỉ đầu phiên. Đặc tả gọi là **hạn chế đặc quyền token truy cập**: máy chủ MCP `MUST` từ chối mọi token không nêu nó trong đối tượng nhận.

> **Ghi chú tên gọi.** Đặc tả dành thuật ngữ *confused deputy* cho vấn đề liên quan nhưng riêng: máy chủ MCP làm **proxy** OAuth đến API bên thứ ba, dùng ID client tĩnh, chuyển token không lấy đồng ý người dùng mỗi client. Gắn đối tượng nhận sửa phát lại phía trên; sửa confused deputy là đồng ý mỗi client **cộng** không bao giờ chuyển token đến xuyên qua API phía trước (máy chủ MCP `MUST` lấy token phía trước riêng).

### Mix-up attacks (a client-side defense the server cannot provide)

Client nói chuyện nhiều máy chủ cấp quyền trong đời. AS độc hại có thể cố làm client đổi mã cấp quyền AS trung thực tại endpoint token kẻ tấn công. Gắn đối tượng nhận không giúp ở đây — tấn công xảy ra trước mọi token tồn tại. Phòng vệ nằm ở client (RFC 9207):

1. Trước chuyển hướng, client ghi `issuer` kỳ vọng từ siêu dữ liệu AS đã xác thực.
2. Trên phản hồi cấp quyền, client so tham số `iss` trả với bên phát hành đã ghi (so chuỗi đơn giản, không chuẩn hóa) trước gửi mã đi đâu.
3. Không khớp (hoặc `iss` vắng khi AS công bố `authorization_response_iss_parameter_supported`) → từ chối và thậm chí không hiển thị trường `error`.

Chỉ PKCE không chặn mix-up vì client đưa `code_verifier` đến endpoint token bất kỳ bị hướng đến. Vì vậy đặc tả ghi bên phát hành mỗi yêu cầu cùng verifier PKCE và `state`.

### Failure modes

- **JWKS cũ.** Bộ xác thực từ chối token hợp lệ sau AS xoay khóa. Cách sửa là mẫu làm mới cron + lấy lại khi trượt bộ đệm ở trên. Không bao giờ lưu đệm JWKS không có công việc làm mới.
- **Xoay làm dự phòng.** Nối nhánh trượt bộ đệm vào xoay-và-tạo thay lấy lại là lỗi thật: không bao giờ tạo `kid` thiếu và biến giá trị `kid` do kẻ tấn công kiểm soát thành DoS tạo khóa. Dự phòng phải là `refresh-jwks` lũy đẳng.
- **Thiếu claim `aud`.** Một số IdP mặc định bỏ `aud` trừ khi có `resource` trong yêu cầu token. Bộ xác thực phải từ chối token thiếu `aud`, không coi vắng mặt là ký tự đại diện.
- **Mix-up qua thiếu kiểm tra `iss`.** Client không xác thực tham số phản hồi cấp quyền RFC 9207 `iss` theo bên phát hành ghi trước chuyển hướng có thể bị hướng đổi mã AS trung thực tại endpoint token kẻ tấn công. Đây là thất bại phía client; máy chủ tài nguyên không bù được.
- **Tranh chấp nâng phạm vi.** Hai luồng nâng quyền đồng thời cho cùng người dùng đều có thể thành công và tạo hai token truy cập với phạm vi khác. Bộ xác thực phải dùng token đưa trên yêu cầu, không tra "phạm vi hiện tại của người dùng" — điều đó tạo cửa sổ TOCTOU.
- **Trộm token đăng ký.** `registration_access_token` rò cho kẻ tấn công viết lại URI chuyển hướng. Hash khi lưu; yêu cầu client đưa văn bản rõ trên mọi cập nhật; xoay khi nghi ngờ.
- **`iss` không ghim.** Bộ xác thực nhận mọi `iss` cho kẻ tấn công dựng máy chủ cấp quyền riêng, đăng ký client cho đối tượng nhận đích và cấp token. Danh sách `authorization_servers` của siêu dữ liệu tài nguyên được bảo vệ là danh sách cho phép; thực thi nó.
- **Xung đột bộ đệm thông tin xác thực hoặc token.** Client chỉ khóa đăng ký theo tài nguyên có thể đưa danh tính máy chủ cấp quyền này cho bên khác. Client chỉ khóa token truy cập theo bên phát hành có thể phát lại token tại sai đối tượng nhận. Khóa đăng ký theo bên phát hành đã xác thực, token truy cập theo `(issuer, resource)` và ghi danh lại mỗi khi bên phát hành đổi.

```figure
t3-jwks-rotate
```

## Use It

`code/main.py` đi qua toàn luồng sản xuất với Python stdlib và ba vai trò: `AuthorizationServer`, `ResourceServer` và `Client`. Luồng:

Từ thư mục gốc repo, chạy:

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Lệnh đầu in bản ghi ghi danh gắn bên phát hành và xác thực token.
Lệnh thứ hai báo mười tám kiểm tra đạt. Không lệnh nào mở
trình nghe mạng hoặc ghi thông tin xác thực.

1. Máy chủ cấp quyền công bố siêu dữ liệu RFC 8414 tại `/.well-known/oauth-authorization-server`.
2. Client MCP gọi endpoint siêu dữ liệu và kiểm tra lựa chọn ghi danh (`client_id_metadata_document_supported` cho CIMD, `registration_endpoint` cho DCR) và hỗ trợ PKCE `S256`.
3. Client kiểm tra đăng ký trước phạm vi bên phát hành, nếu không ghi danh bằng Tài liệu siêu dữ liệu ID client HTTPS. DCR ngừng khuyến nghị vẫn là phương thức tương thích kiểm thử riêng được.
4. Client ghi bên phát hành đã xác thực, tạo thách thức S256, nhận mã cấp quyền một lần cộng `iss`, xác thực bên phát hành trả về và đổi mã bằng verifier gốc và chỉ báo `resource` RFC 8707.
5. Client MCP gọi công cụ trên máy chủ MCP với `Authorization: Bearer ...`.
6. Máy chủ MCP chạy `validate`, phân giải khóa ký từ bộ đệm JWKS.
7. IdP xoay khóa; làm mới theo lịch kéo lại JWKS vào bộ đệm.
8. Lời gọi tiếp xác thực theo khóa làm mới không khởi động lại và token trước vẫn xác thực trong cửa sổ chồng lấn.
9. Cố phát lại đối tượng nhận với tài nguyên MCP khác nhận 401 với `audience mismatch` và con trỏ `resource_metadata`.

JWT ở đây dùng HS256 với bí mật dùng chung (để bài chạy chỉ stdlib). Sản xuất dùng RS256 hoặc EdDSA với mẫu JWKS trên; logic xác thực còn lại giống hệt. Vì IdP và máy chủ tài nguyên trong một tiến trình, `refresh_jwks` đọc trực tiếp danh sách khóa máy chủ cấp quyền; trên đường truyền là HTTP `GET` đến `jwks_uri`.

## Ship It

Bài này tạo `outputs/skill-mcp-auth.md`. Với cấu hình máy chủ MCP và tập khả năng IdP, skill phát bề mặt xác thực cần dựng — siêu dữ liệu tài nguyên được bảo vệ, nhánh ghi danh dùng (CIMD, đăng ký trước hoặc dự phòng DCR), lịch làm mới JWKS, ánh xạ phạm vi và quy tắc từ chối khi IdP không hỗ trợ đầy đủ hồ sơ RFC.

## Exercises

1. Chạy `code/main.py`. Lần theo luồng. Chú ý IdP xoay khóa ở bước 6, `refresh_jwks` theo lịch kéo lại tập công bố và cả token cũ (cửa sổ chồng lấn) lẫn token mới xác thực không khởi động lại.

2. Thêm IdP mới vào danh sách `authorization_servers` siêu dữ liệu tài nguyên được bảo vệ. Cấp token ký bởi IdP mới và xác nhận bộ xác thực nhận. Cấp token ký bởi IdP không liệt kê và xác nhận bộ xác thực từ chối với `WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`.

3. Thêm kiểm tra giới hạn tốc độ vào `register_client` chạy trước bộ đăng ký nhận yêu cầu. Dùng token bucket mỗi IP nguồn giữ trong dict nhỏ khóa theo IP.

4. Đọc RFC 7591 và xác định hai trường trình xử lý `/register` bài không xác thực. Thêm xác thực. (Gợi ý: `software_statement` và scheme URI `redirect_uris`.)

5. Thêm máy chủ cấp quyền thứ hai. Xác nhận client lưu ghi danh khóa theo bên phát hành riêng và từ chối dùng lại token hoặc `client_id` bên phát hành đầu.

6. Chứng minh sửa DoS. Gửi bộ xác thực token có `kid` ngẫu nhiên và xác nhận `refresh_jwks` chạy tối đa một lần và số khóa máy chủ cấp quyền không tăng. Rồi cố ý nối lại dự phòng thành xoay-và-tạo và quan sát số khóa tăng theo mỗi token giả — khôi phục lấy lại sau đó.

7. Thực hành DCR ngừng khuyến nghị với cả client `native` và `web`. Xác nhận client web có URI chuyển hướng HTTP và client native không có chuyển hướng loopback chính xác bị từ chối.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| ASM | "Tài liệu siêu dữ liệu OAuth" | JSON `/.well-known/oauth-authorization-server` RFC 8414 |
| CIMD | "URL siêu dữ liệu client" | Tài liệu siêu dữ liệu ID client: URL HTTPS dùng làm `client_id`; AS kéo JSON. Ghi danh ưu tiên trong MCP 2026-07-28 |
| DCR | "Đăng ký client tự phục vụ" | RFC 7591 `POST /register`; ngừng khuyến nghị cho MCP hiện tại và chỉ giữ để tương thích |
| JWKS | "Khóa công khai để xác thực JWT" | JSON Web Key Set, lấy từ `jwks_uri`, lập chỉ mục theo `kid` |
| Rotate vs refresh (Xoay so với làm mới) | "Cập nhật khóa" | *Xoay* = AS tạo/thu hồi khóa ký; *làm mới* = máy chủ tài nguyên lấy lại tập công bố. Máy chủ tài nguyên chỉ làm mới |
| Resource indicator (Chỉ báo tài nguyên) | "Tham số đối tượng nhận" | Tham số RFC 8707 `resource` ghim token vào một máy chủ |
| `aud` claim (Claim đối tượng nhận) | "Đối tượng nhận" | Claim JWT bộ xác thực so với URL tài nguyên chuẩn |
| Audience replay (Phát lại đối tượng nhận) | "Phát lại token" | Token cấp cho Máy chủ A đưa cho Máy chủ B; phòng bằng xác thực đối tượng nhận (đặc tả: hạn chế đặc quyền token truy cập) |
| Confused deputy | "Dùng sai token proxy" | Proxy MCP với ID client tĩnh chuyển token không đồng ý mỗi client; riêng phát lại đối tượng nhận |
| Mix-up attack (Tấn công mix-up) | "Sai endpoint token" | Client bị hướng đổi mã AS trung thực tại endpoint kẻ tấn công; phòng phía client qua RFC 9207 `iss` |
| `iss` allow-list (Danh sách cho phép bên phát hành) | "Máy chủ cấp quyền đáng tin" | Tập nêu trong `authorization_servers` siêu dữ liệu tài nguyên được bảo vệ |
| `resource_metadata` | "Nơi tìm tài liệu PRM" | Tham số `WWW-Authenticate` nêu URL siêu dữ liệu RFC 9728 trên 401/403 |
| Public client (Client công khai) | "Client native hoặc trình duyệt" | Client OAuth không `client_secret`; PKCE bù đắp |
| `WWW-Authenticate` | "Header phản hồi 401/403" | Mang chỉ thị `Bearer error=...` điều khiển phục hồi client |

## Further Reading

- [MCP authorization specification (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) - hồ sơ cấp quyền MCP hiện tại
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) - CIMD, xác thực bên phát hành, ngừng khuyến nghị DCR và đổi thông tin xác thực khóa theo bên phát hành
- [OAuth Client ID Metadata Document (draft-ietf-oauth-client-id-metadata-document-00)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) — CIMD
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) — hợp đồng khám phá
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591) — DCR (nhánh dự phòng)
- [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) — bằng chứng sở hữu client công khai
- [RFC 8707 — Resource Indicators for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc8707) — ghim đối tượng nhận
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728) — khám phá máy chủ tài nguyên
- [RFC 9207 — OAuth 2.0 Authorization Server Issuer Identification](https://datatracker.ietf.org/doc/html/rfc9207) — tham số `iss` phòng tấn công mix-up
- [RFC 7662: OAuth 2.0 Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
