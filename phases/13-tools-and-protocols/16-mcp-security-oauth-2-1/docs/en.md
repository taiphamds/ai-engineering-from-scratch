# MCP Authorization: CIMD, Issuer Binding, PKCE, and Step-Up

> Yêu cầu MCP từ xa không trạng thái, nhưng cấp quyền của nó không ẩn danh. Gắn mọi thông tin xác thực với bên phát hành tạo nó và mọi token với tài nguyên nhận nó.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 15 (security)
**Time:** ~90 minutes

## Learning Objectives

- Khám phá máy chủ cấp quyền qua siêu dữ liệu tài nguyên được bảo vệ.
- Ưu tiên Tài liệu siêu dữ liệu ID client thay Đăng ký client động ngừng được khuyến nghị.
- Khai báo đúng `application_type` khi nhánh tương thích DCR không tránh được.
- Xác thực `iss` phản hồi cấp quyền và cô lập thông tin xác thực theo bên phát hành.
- Dùng PKCE, chỉ báo tài nguyên, xác thực đối tượng nhận và phạm vi tăng dần.
- Gửi yêu cầu MCP 2026-07-28 được cấp quyền không có phiên giao thức.

## The Problem

Máy chủ MCP từ xa có thể đọc bản ghi riêng, ghi hệ thống ngoài hoặc kích hoạt công việc đắt. Xác thực cho biết ai đưa thông tin xác thực. Cấp quyền cũng phải trả lời:

- Máy chủ cấp quyền nào phát hành thông tin xác thực?
- Token dành cho tài nguyên MCP nào?
- Client và URI chuyển hướng nào hoàn tất luồng?
- Người dùng phê duyệt thao tác nào?
- Đúng yêu cầu này còn phù hợp phê duyệt đó không?

Hồ sơ cấp quyền 2026-07-28 gia cố ghi danh client và xử lý bên phát hành. Nó ưu tiên Tài liệu siêu dữ liệu ID client, ngừng khuyến nghị Đăng ký client động, yêu cầu đúng `application_type` trên DCR, xác thực phản hồi bên phát hành RFC 9207 và cấm dùng lại thông tin xác thực giữa bên phát hành.

Quy tắc này bổ sung lõi không trạng thái. Không khôi phục bắt tay lõi hoặc `Mcp-Session-Id`.

## The Concept

### Know the three roles

- **Client MCP:** gửi yêu cầu thay chủ tài nguyên.
- **Máy chủ tài nguyên MCP:** nhận token truy cập và phục vụ endpoint MCP.
- **Máy chủ cấp quyền:** xác thực chủ tài nguyên, thu đồng ý và phát token.

Máy chủ tài nguyên và máy chủ cấp quyền có thể vận hành cùng, nhưng giữ định danh và trách nhiệm xác thực riêng.

### Authorization applies to HTTP

Đặc tả cấp quyền MCP áp dụng cho vận chuyển dựa HTTP. Máy chủ stdio cục bộ chạy dưới ranh giới tin cậy tiến trình và hệ điều hành. Không thêm luồng OAuth trình duyệt giả vào stdio chỉ để đối xứng.

Với Streamable HTTP từ xa, gửi bearer token trong header `Authorization` trên mọi yêu cầu. Không bao giờ đặt trong URL.

### Start with protected-resource metadata

Máy chủ tài nguyên công bố siêu dữ liệu RFC 9728:

```json
{
  "resource": "https://notes.example.com/mcp",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["notes:delete", "notes:read", "notes:write"]
}
```

Client bắt đầu từ URL tài nguyên MCP, lấy tài liệu này, chọn máy chủ cấp quyền công bố rồi lấy siêu dữ liệu OAuth hoặc OpenID Connect của máy chủ đó.

Giữ đường dẫn tài nguyên khi tạo URL well-known RFC 9728. Với tài nguyên `https://notes.example.com/mcp`, bài này dùng `https://notes.example.com/.well-known/oauth-protected-resource/mcp`. Bỏ hậu tố `/mcp` có thể chọn siêu dữ liệu cho tài nguyên được bảo vệ khác trên cùng origin.

Không đoán máy chủ cấp quyền từ hostname. Không theo bên phát hành khám phá từ phần thân lỗi chưa xác thực. Giữ chính sách client sẵn lòng tin bên phát hành nào.

### Verify authorization server metadata

Siêu dữ liệu nên đưa endpoint và kiểm soát hỗ trợ ra:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "code_challenge_methods_supported": ["S256"],
  "authorization_response_iss_parameter_supported": true,
  "client_id_metadata_document_supported": true
}
```

Yêu cầu S256 cho PKCE. Ghi đúng chuỗi bên phát hành. Giá trị chính xác đó thành khóa lưu đăng ký và token.

### Follow the registration priority

Dùng thông tin client đăng ký trước khi client đã có quan hệ tường minh với bên phát hành chọn. Nếu không, ưu tiên Tài liệu siêu dữ liệu ID client khi máy chủ cấp quyền công bố hỗ trợ. Chỉ dùng DCR làm dự phòng tương thích ngừng được khuyến nghị, rồi hỏi thông tin client nếu không cơ chế nào sẵn có.

### Prefer Client ID Metadata Documents

Tài liệu siêu dữ liệu ID client cho máy chủ cấp quyền URL HTTPS vừa là định danh client vừa là nơi siêu dữ liệu của nó:

```json
{
  "client_id": "https://client.example.com/oauth/metadata.json",
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

Máy chủ cấp quyền lấy và xác thực tài liệu. `client_id` phải là URL HTTPS có đường dẫn và giá trị trong tài liệu phải bằng chính xác URL đó. Trường tài liệu bắt buộc là `client_id`, `client_name` và `redirect_uris`. `application_type` xuất hiện trong ví dụ nhưng không phải yêu cầu CIMD. Việc bắt buộc mới của nó riêng cho nhánh DCR.

Coi việc lấy tài liệu là thao tác nhạy cảm SSRF. Phân giải và xác thực đích, từ chối địa chỉ loopback, riêng, link-local và địa chỉ không được phép khác, kiểm tra lại sau chuyển hướng và đổi DNS, giới hạn chuyển hướng, byte và thời gian, yêu cầu JSON và chỉ lưu đệm theo kiểm soát bộ đệm HTTP đã xác thực. Coi `client_name` và trường hiển thị khác là văn bản không đáng tin.

CIMD bỏ nhu cầu tạo định danh động mới mỗi lần liên hệ đầu. Không bỏ xác thực URI chuyển hướng, chính sách bên phát hành hoặc đồng ý người dùng.

### DCR is a compatibility path

Đăng ký client động vẫn có cho máy chủ cấp quyền cũ, nhưng ngừng được khuyến nghị cho triển khai MCP mới.

Khi dùng DCR, khai báo `application_type`:

```json
{
  "client_name": "Notes desktop client",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:8765/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"]
}
```

- Client máy tính, di động, dòng lệnh và loopback dùng `native`.
- Ứng dụng trình duyệt được host từ xa dùng `web` và chuyển hướng HTTPS từ xa.

Bỏ trường có thể mặc định `web` trong triển khai đăng ký OpenID Connect và làm chuyển hướng loopback hợp lệ thất bại.

Giữ mã DCR sau quyết định dự phòng tường minh. Không âm thầm dự phòng sau lỗi xác thực CIMD tùy ý. Điều đó có thể biến thất bại bảo mật thành nhánh ghi danh yếu hơn.

### Bind credentials to the issuer

Lưu vật liệu ghi danh do bên phát hành tạo dưới đúng bên phát hành:

```text
issuer_credentials[issuer] = pre_registered_or_dcr_client
tokens[(issuer, resource)] = access_token
```

Nếu khám phá tài nguyên được bảo vệ đổi từ `https://auth-one.example` sang `https://auth-two.example`, đánh giá lại tin cậy. Không bao giờ gửi bí mật client, id client DCR, token truy cập đăng ký, refresh token hoặc access token của bên đầu đến bên thứ hai. Client đăng ký trước và DCR phải dùng thông tin xác thực cấp cho bên phát hành mới.

Id client CIMD khác vì là URL HTTPS tự host, không phải thông tin xác thực do máy chủ cấp quyền tạo. Cùng URL CIMD có thể chuyển: bên phát hành đáng tin mới lấy và xác thực tài liệu không đăng ký lại DCR. Phản hồi cấp quyền và token vẫn được xác thực và lưu dưới bên phát hành mới.

### Authorization code with PKCE

Luồng tương tác là:

1. Tạo `code_verifier` entropy cao.
2. Suy `code_challenge` S256.
3. Gửi yêu cầu cấp quyền với `client_id`, `redirect_uri`, `scope`, `code_challenge` và `resource` chính xác.
4. Nhận phản hồi cấp quyền chứa `code` và, khi được cung cấp, `iss`.
5. Xác thực `iss` theo đúng bên phát hành đã ghi trước dùng mọi trường phản hồi.
6. Đổi mã bằng `code_verifier`, cùng URI chuyển hướng và cùng `resource`.
7. Lưu token kết quả dưới `(issuer, resource)`.

Tham số `resource` từ RFC 8707 xuất hiện trong cả yêu cầu cấp quyền và token. Nó định danh URI máy chủ MCP chuẩn.

### Validate `iss` exactly

RFC 9207 ngăn phản hồi cấp quyền từ bên phát hành này bị nhầm với phản hồi từ bên khác.

Khi có `iss`, so với bên phát hành đã ghi không đổi hoa thường, đổi dấu gạch chéo cuối, bỏ cổng mặc định hoặc chuẩn hóa mã hóa phần trăm. Khi không khớp, không hành động theo mã hoặc thậm chí hiển thị chi tiết lỗi do kẻ tấn công kiểm soát từ phản hồi đó.

Máy chủ cấp quyền có `iss` công bố `authorization_response_iss_parameter_supported: true`. Client hiện tại vẫn xác thực `iss` có mặt ngay cả khi thiếu công bố đó.

### Validate audience at the MCP server

Máy chủ tài nguyên chỉ nhận token cấp cho chính nó:

```text
token.issuer == configured_authorization_server
token.audience == canonical_mcp_resource
```

Token không hợp lệ, hết hạn, sai bên phát hành hoặc sai đối tượng nhận nhận 401. Máy chủ MCP không được nhận hoặc chuyển token dành cho dịch vụ khác.

### Request the smallest current scope

Bắt đầu với phạm vi cần ngay. Nếu công cụ sau cần thêm, máy chủ trả 403 với thách thức phạm vi có thẩm quyền:

```text
WWW-Authenticate: Bearer error="insufficient_scope",
  scope="notes:delete",
  resource_metadata="https://notes.example.com/.well-known/oauth-protected-resource/mcp"
```

Client giải thích quyền mới, lấy đồng ý, thực hiện luồng cấp quyền mới với tập phạm vi kết hợp và thử lại yêu cầu MCP với id JSON-RPC mới.

Không giả định phạm vi bị thách thức là tập con `scopes_supported`. Thách thức có thẩm quyền cho thao tác hiện tại.

### Authorization and the stateless MCP wire

Lời gọi công cụ được cấp quyền vẫn mang vỏ yêu cầu hiện tại đầy đủ:

```text
POST /mcp
Authorization: Bearer <access-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.delete
```

```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "notes.delete",
    "arguments": {"id": "note-7"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "oauth-lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Token cấp quyền chủ thể. Siêu dữ liệu yêu cầu thương lượng hành vi giao thức. Không bên nào thay bên kia.

Xác thực đường truyền theo thứ tự cố định: JSON-RPC và kiểu siêu dữ liệu, header và phần thân bằng nhau, rồi hỗ trợ giao thức. Không khớp định tuyến hoặc header phiên bản trả HTTP 400 với `-32020`. Nếu header và phần thân đồng ý phiên bản không hỗ trợ, trả HTTP 400 với `-32022` và `data` chính xác `{"supported":["2026-07-28"],"requested":"<actual>"}`. Phương thức không biết trả HTTP 404 với `-32601`.

Mọi lỗi yêu cầu, gồm 401 token không hợp lệ và 403 thiếu phạm vi, là vỏ lỗi JSON-RPC với `id` yêu cầu gốc. Thông tin phục hồi có cấu trúc thuộc `data` lỗi tùy chọn; `WWW-Authenticate` vẫn là header phản hồi HTTP. Thông báo không có `id`, nên không nhận phần thân JSON-RPC. Thông báo HTTP được chấp nhận trả 202 với phần thân rỗng.

Máy chủ triển khai `server/discover` và công bố công cụ, nên cũng triển khai phương thức `tools/list` bắt buộc. Bộ mô tả công cụ có tên ổn định, mô tả và giá trị `inputSchema` gốc đối tượng. Danh sách tất định và trả `resultType`, siêu dữ liệu danh tính máy chủ, `ttlMs` có giới hạn và `cacheScope`. Khám phá và danh sách công cụ không phụ thuộc người dùng có thể sẵn trước cấp quyền. Áp chính sách thường và lưu đệm riêng nếu bên nào đổi theo chủ thể.

### No token passthrough

Máy chủ MCP không được chuyển token truy cập MCP của client đến API phía sau. Lấy token phía sau riêng có đúng đối tượng nhận hoặc dùng thiết kế đổi token tường minh. Xác thực đối tượng nhận chỉ hoạt động khi dịch vụ từ chối token tạo cho người khác.

### Refresh tokens

Refresh token tùy chọn. Khi được cấp, lưu bí mật và đặt khóa theo bên phát hành và tài nguyên. Không giả định tồn tại. Xoay vòng khi máy chủ cấp quyền hỗ trợ và phát hiện dùng lại giá trị đã vô hiệu.

```figure
t3-scope-stepup
```

## Build It

`code/main.py` là mô phỏng giao thức và cấp quyền trong tiến trình. Nó triển khai khám phá tài nguyên được bảo vệ, siêu dữ liệu máy chủ cấp quyền, ghi danh CIMD, dự phòng DCR chặn theo phiên bản, kiểm tra loại ứng dụng, PKCE, xác thực bên phát hành, token gắn tài nguyên, nâng phạm vi, `server/discover`, `tools/list` và yêu cầu công cụ không trạng thái.

Mô hình nhận phần thân yêu cầu và header định tuyến đã phân tích. Không phải adapter HTTP đầy đủ và không phân tích `Content-Type` hoặc `Accept`. Nối với adapter Streamable HTTP Bài 09, yêu cầu `Content-Type: application/json` và giá trị `Accept` chứa cả `application/json` và `text/event-stream`.

Chạy:

```bash
cd phases/13-tools-and-protocols/16-mcp-security-oauth-2-1
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Đầu ra cho thấy khám phá trước, ghi danh CIMD, đọc thường, hai lần nâng phạm vi riêng và lưu thông tin xác thực khóa theo bên phát hành.

## Use It

Ánh xạ đối tượng mô phỏng sang thành phần sản xuất:

- `ResourceServer.protected_resource_metadata` thành endpoint RFC 9728.
- `AuthorizationServer.metadata` thành khám phá RFC 8414 hoặc OpenID Connect.
- `Client.enroll` thành phân giải CIMD cộng nhánh tương thích DCR tường minh.
- Thông tin xác thực client do bên phát hành tạo và `tokens_by_issuer_resource` thành bản ghi mã hóa. URL CIMD có thể còn chuyển được trong khi kết quả cấp quyền vẫn gắn bên phát hành.
- `ResourceServer.handle` thành middleware xác thực header MCP hiện tại, token và phạm vi công cụ trước phân phối, trong khi giữ mọi lỗi yêu cầu trong vỏ JSON-RPC khớp.

## Ship It

Bài học này cung cấp `outputs/skill-oauth-scope-planner.md`. Nó hiện thiết kế ưu tiên ghi danh, lưu thông tin xác thực gắn bên phát hành, loại ứng dụng, PKCE, chỉ báo tài nguyên, thách thức phạm vi và ranh giới yêu cầu không trạng thái hiện tại.

## Exercises

1. Thêm xoay refresh token và từ chối dùng lại refresh token trước.
2. Thêm danh sách cho phép bên phát hành. Khi đổi bên phát hành, chỉ dùng lại URL CIMD có thể chuyển; từ chối mọi thông tin xác thực và token do bên phát hành trước tạo.
3. Thêm hết hạn cho mã cấp quyền và xác nhận trao đổi trễ thất bại.
4. Xây biến thể client web với chuyển hướng HTTPS từ xa và so siêu dữ liệu DCR với client native.
5. Thêm tài nguyên thứ hai dưới cùng bên phát hành. Xác nhận token truy cập của nó không dùng được tại tài nguyên đầu.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Protected-resource metadata (Siêu dữ liệu tài nguyên được bảo vệ) | Tài liệu RFC 9728 định danh tài nguyên và máy chủ cấp quyền |
| CIMD | Tài liệu siêu dữ liệu HTTPS có URL là định danh client OAuth |
| DCR | Ghi danh client động ngừng được khuyến nghị giữ để tương thích |
| `application_type` | `native` hoặc `web`, dùng xác thực quy tắc URI chuyển hướng |
| PKCE | Verifier và thách thức S256 bảo vệ mã cấp quyền bị chặn bắt |
| `iss` | Định danh bên phát hành phản hồi cấp quyền RFC 9207 |
| Resource indicator (Chỉ báo tài nguyên) | Tham số RFC 8707 gắn yêu cầu token với tài nguyên MCP |
| Audience (Đối tượng nhận) | Tài nguyên token hợp lệ cho |
| Step-up (Nâng quyền) | Đồng ý mới và cấp token cho phạm vi thao tác hiện tại bổ sung |
| Issuer-bound credentials (Thông tin xác thực gắn bên phát hành) | Bản ghi đăng ký và token cô lập theo đúng bên phát hành máy chủ cấp quyền |

## Further Reading

- [MCP 2026-07-28 authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9207: OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207)
- [OAuth Client ID Metadata Document draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/)
