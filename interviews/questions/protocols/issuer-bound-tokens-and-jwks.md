---
id: issuer-bound-tokens-and-jwks
title: Two issuers, one resource server, no outage
card: protocols
kind: design
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [mcp, oauth, cimd, audience, jwks, issuer]
minutes: 15
lessons: [phases/13-tools-and-protocols/16-mcp-security-oauth-2-1, phases/13-tools-and-protocols/18-mcp-auth-production]
manuals: []
practice: []
cheatsheet: [mcp-security-auth]
related: [protocols/header-body-mismatch-order, protocols/descriptor-pin-rug-pull]
updated: 2026-11-03
---

Bạn triển khai một MCP server từ xa chấp nhận token từ hai authorization server, một cho nhân viên và một cho đối tác. Thiết kế việc đăng ký client, xác thực token theo từng yêu cầu và xử lý khóa để ba điều được giữ vững: một token được tạo cho một MCP server anh em bị từ chối, một lần luân chuyển khóa ký không gây ngừng hoạt động, và một client bị hướng tới một token endpoint thù địch không bao giờ trao mã ủy quyền của nó.

## Short answer

Công bố metadata protected-resource RFC 9728 nêu cả hai issuer, và xem danh sách đó là danh sách issuer được cho phép. Đăng ký một client bằng thông tin xác thực đăng ký trước khi nó có quan hệ tường minh với issuer đó, nếu không thì bằng một Client ID Metadata Document khi issuer quảng bá hỗ trợ, và chỉ dùng đăng ký động đã lỗi thời như một phương án dự phòng tường minh với `application_type` đúng. Trên mọi yêu cầu, xác thực `iss` đã ghim, một `aud` bằng URI resource chuẩn của server này, `exp` và scope mà công cụ cần; trả lời `401` cho một token không hợp lệ và `403` với `insufficient_scope` cho một token hợp lệ thiếu scope. Làm mới JWKS theo lịch và lấy lại một lần khi gặp một `kid` không xác định, và để client ghi lại issuer trước khi chuyển hướng và so sánh chính xác `iss` RFC 9207 trong phản hồi ủy quyền trước khi nó đổi mã.

## Full answer

### Discovery and the deployment gate

Client bắt đầu từ URL resource MCP, lấy tài liệu RFC 9728, chọn một authorization server được quảng bá và lấy metadata RFC 8414 của nó. Giữ đường dẫn resource khi bạn xây dựng URL well-known: một resource được phục vụ ở đường dẫn `/mcp` phân giải thành `/.well-known/oauth-protected-resource/mcp` trên cùng host. Trước khi tin một issuer, kiểm tra metadata một cách cơ học: `S256` phải được quảng bá nếu không thì dừng, `response_types_supported` là `["code"]`, và tồn tại ít nhất một đường đăng ký.

### Enrollment priority

| Đường | Khi nào | Ghi chú |
|---|---|---|
| client đăng ký trước | tồn tại một quan hệ tường minh với issuer đó | thông tin xác thực được khóa theo issuer |
| Client ID Metadata Document | issuer quảng bá hỗ trợ | URL HTTPS có đường dẫn là `client_id` và `client_id` của tài liệu bằng nó |
| đăng ký động | không có đường nào ở trên | đã lỗi thời; khai báo `native` hoặc `web`; không bao giờ là một phương án dự phòng âm thầm sau một lỗi CIMD |

Lấy một CIMD là một thao tác nhạy cảm với SSRF đối với issuer. Lưu thông tin xác thực do issuer tạo dưới đúng issuer và access token dưới `(issuer, resource)`. Nếu discovery chuyển từ một issuer sang một issuer khác, đánh giá lại sự tin cậy và không bao giờ gửi bí mật, registration token hoặc các token của issuer thứ nhất cho issuer thứ hai. Một URL CIMD có thể mang sang nơi khác vì nó được tự lưu trữ, không phải được tạo.

### Validation on every request

```text
token.iss in protected_resource_metadata.authorization_servers
token.aud == canonical MCP resource URI
token.exp in the future
required scope present
```

Một `aud` bị thiếu là một sự từ chối, không bao giờ là một wildcard. Diễn giải việc phát lại: một token cho `notes.example.com` được trình cho `tasks.example.com` vượt qua kiểm tra issuer và không vượt qua kiểm tra audience, và server trả về `401` với `WWW-Authenticate: Bearer error="invalid_token"` và một con trỏ `resource_metadata`. Đặc tả gọi điều này là giới hạn đặc quyền access-token. Không bao giờ chuyển token đầu vào tới một API phía sau; hãy lấy một token phía sau riêng.

### Rotate at the issuer, refresh at the server

Issuer luân chuyển bằng cách công bố khóa tiếp theo trước khi cho khóa trước nghỉ, nên hai khóa cùng lúc là trạng thái ổn định. Resource server chỉ làm mới: một công việc theo lịch ghi đè `cache[issuer] = {keys, fetched_at}`, và một token có `kid` không xác định kích hoạt một lần lấy lại đồng bộ rồi thất bại nếu khóa vẫn thiếu. Không bao giờ nối cache miss với luân-chuyển-và-tạo: khóa mới vẫn không khớp, và các giá trị `kid` do kẻ tấn công chọn trở thành một cuộc từ chối dịch vụ tạo khóa.

### The mix-up defense lives in the client

Một authorization server thù địch có thể hướng một client đổi mã của một issuer trung thực tại token endpoint của kẻ tấn công. PKCE không ngăn điều đó, vì client trao `code_verifier` cho bất kỳ endpoint nào mà nó bị hướng tới. Client ghi lại issuer mong đợi trước khi chuyển hướng và so sánh `iss` được trả về như một chuỗi thuần, không gộp hoa thường, chuẩn hóa dấu gạch chéo hoặc cổng, trước khi gửi mã đi bất kỳ đâu.

### Declared failure policy

| Lỗi | Hành vi |
|---|---|
| làm mới JWKS theo lịch thất bại, `kid` đã biết vẫn được cache | chỉ tiếp tục trong một khoảng cho phép dùng dữ liệu cũ khi lỗi đã khai báo |
| `kid` không xác định và lần làm mới duy nhất thất bại | từ chối |
| introspection không khả dụng cho một token mờ | đóng khi thất bại; không bao giờ chuyển một lỗi mạng thành `active: true` |
| metadata issuer thay đổi bất ngờ | dừng đăng ký mới và lấy token |

## Follow-ups

- **Level 3:** Tại sao kiểm tra token theo từng kết nối không đủ? Expected: không có phiên giao thức; mọi yêu cầu mang bearer token riêng và được xác thực riêng.
- **Level 3:** Một công cụ cần tăng scope. Server trả về gì? Expected: `403` với `WWW-Authenticate: Bearer error="insufficient_scope"` nêu scope và URL `resource_metadata`; client lấy sự đồng ý và thử lại với một id yêu cầu mới.
- **Level 4:** Hai lần tăng quyền đồng thời tạo hai token với các scope khác nhau. Bộ xác thực dùng token nào? Expected: token được trình trên yêu cầu, không bao giờ là một lần tra cứu "scope hiện tại của người dùng", điều sẽ mở ra một cuộc đua thời điểm kiểm tra.
- **Level 4:** Issuer đối tác thay đổi URL issuer trong discovery. Client được dùng lại gì? Expected: chỉ một URL CIMD có thể mang sang nơi khác; thông tin xác thực do issuer trước tạo, registration token và access token bị từ chối, và client đăng ký lại.

## Wrong answers

- "Bất kỳ token nào từ nhà cung cấp danh tính của chính chúng ta đều ổn." Một token được tạo cho một server anh em vượt qua kiểm tra issuer; chỉ kiểm tra audience từ chối nó.
- "Lấy JWKS một lần khi khởi động." Bộ xác thực từ chối mọi token sau lần luân chuyển tiếp theo cho đến khi khởi động lại; làm mới theo lịch và một lần khi trượt.
- "Quay về đăng ký động khi xác thực CIMD thất bại." Một lỗi bảo mật không được chọn một đường đăng ký yếu hơn; phương án dự phòng là một quyết định cấu hình tường minh.

## Taught in

[Bài học OAuth](../../../phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/) xây dựng việc đăng ký và luồng, và [bài học xác thực production](../../../phases/13-tools-and-protocols/18-mcp-auth-production/) bổ sung làm mới JWKS, phát lại audience và bảng lỗi.
