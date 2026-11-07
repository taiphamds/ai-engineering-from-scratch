---
id: header-body-mismatch-order
title: The gateway that authorized a read and ran a delete
card: protocols
kind: debug
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, system-design]
tags: [mcp, streamable-http, headers, gateway, validation-order]
minutes: 10
lessons: [phases/13-tools-and-protocols/06-mcp-fundamentals, phases/13-tools-and-protocols/09-mcp-transports, phases/13-tools-and-protocols/15-mcp-security-tool-poisoning]
manuals: []
practice: []
cheatsheet: [mcp-gateways-operations, mcp-security-auth]
related: [protocols/post-only-streamable-http, protocols/descriptor-pin-rug-pull]
updated: 2026-11-03
---

Một gateway phía trước một MCP server ủy quyền mỗi `tools/call` bằng cách đọc header `Mcp-Name` và kiểm tra nó theo vai trò của bên gọi. Server gốc phía sau nó thực thi `params.name` từ phần thân JSON. Một kẻ tấn công gửi `Mcp-Name: notes.read` với một phần thân có `params.name` là `notes.delete`. Gateway cũng từ chối một `MCP-Protocol-Version` không được hỗ trợ trước khi xem bất cứ thứ gì khác. Trình bày điều xảy ra, và đưa ra thứ tự xác thực bạn sẽ phát hành.

## Short answer

Gateway phê duyệt một thao tác đọc trong khi server gốc chạy một thao tác xóa, vì hai thành phần quyết định từ hai trường khác nhau. Phát hành một thứ tự cố định: xác thực JSON-RPC và các kiểu metadata, so sánh mọi header được phản chiếu với phần thân, và chỉ sau khi đã chứng minh bằng nhau mới kiểm tra phiên bản đã khớp có được hỗ trợ không. Một bất đồng là HTTP `400` với `-32020` ngay cả khi một trong hai giá trị phiên bản không được hỗ trợ, nên yêu cầu chết trước khi một backend được chọn, một vai trò được kiểm tra hoặc một token giới hạn tốc độ được tiêu thụ.

## Full answer

### The mirrored headers

| Header | Phải bằng |
|---|---|
| `MCP-Protocol-Version` | `params._meta.io.modelcontextprotocol/protocolVersion` |
| `Mcp-Method` | `method` của JSON-RPC |
| `Mcp-Name` | `params.name`, hoặc `params.uri` cho `resources/read` |

Tên header không phân biệt hoa thường. Giá trị header phân biệt hoa thường. Một tên không phải ASCII hoặc không an toàn đi dưới dạng sentinel `=?base64?{value}?=`, và server giải mã nó trước khi so sánh.

### The order and the codes

1. Parse một vỏ thông điệp. Xác nhận `jsonrpc` là `"2.0"`, một `id` tồn tại trên một yêu cầu (một thông báo không có), `method` là một chuỗi và `params` là một đối tượng.
2. Yêu cầu chuỗi phiên bản và đối tượng capability trong `params._meta`. Metadata thiếu hoặc sai định dạng là `-32602`.
3. So sánh mỗi header được phản chiếu với phần thân. Một sự không khớp là HTTP `400` với `-32020`, ngay cả khi một giá trị không được hỗ trợ.
4. Khi đã thiết lập sự bằng nhau, từ chối một phiên bản đã khớp nhưng không được hỗ trợ bằng HTTP `400` và `-32022`, với dữ liệu chính xác là `{"supported":["2026-07-28"],"requested":"<actual>"}`.
5. Kiểm tra các capability bắt buộc, định tuyến theo `method`, xác thực các đối số riêng của phương thức.
6. Xác thực danh tính và ủy quyền thao tác cụ thể trước khi handler của nó chạy.
7. Trả về một kết quả hoàn chỉnh với danh tính server, rồi quên metadata có phạm vi theo yêu cầu.

Một phương thức không xác định là HTTP `404` với `-32601`. Một thông báo không có `id` và không nhận phần thân JSON-RPC; một thông báo được chấp nhận nhận `202` với một phần thân trống.

### Why the order matters

Mỗi bước để lại một mảnh bằng chứng riêng: đầu vào sai định dạng, nhầm lẫn header, thương lượng phiên bản, lỗi capability, ủy quyền và lỗi handler giữ tách biệt. Kiểm tra hỗ trợ phiên bản trước sự bằng nhau của header trộn hai lớp và cho phép một header được chế tạo đi tới một quyết định. Xác thực định tuyến trước chính sách đóng khoảng hở trong đó một thành phần ủy quyền phần thân trong khi thành phần khác định tuyến theo header.

### What the gateway does after validation

Ủy quyền vẫn đến từ principal đã xác thực và chính sách resource, không phải từ header và không phải từ `clientCapabilities`. Trình tự là: xác thực thông tin xác thực transport, xác thực phiên bản, header và hình dạng, kiểm tra tính tương thích capability, rồi ủy quyền principal đối với đúng động từ, resource và các đối số đã chuẩn hóa, và chỉ sau đó mới thực thi hoặc yêu cầu đầu vào người dùng.

## Follow-ups

- **Level 3:** Header và phần thân đều nói phiên bản `2027-01-01`. Phản hồi nào? Expected: HTTP `400` với `-32022` và dữ liệu `{"supported":["2026-07-28"],"requested":"2027-01-01"}`.
- **Level 3:** `Mcp-Name` mang một URI resource có các ký tự không phải ASCII. Server so sánh nó bằng cách nào? Expected: client gửi sentinel base64 UTF-8 chính xác, và server giải mã nó trước khi so sánh với `params.uri`.
- **Level 4:** Tại sao kiểm tra không khớp phải chạy trước khi một token giới hạn tốc độ bị tiêu thụ? Expected: một yêu cầu bị từ chối nên không tốn gì và để lại bằng chứng riêng; nếu không, một kẻ tấn công tiêu hạn ngạch hoặc kích hoạt chính sách đối với sai đối tượng.
- **Level 4:** Yêu cầu của kẻ tấn công cũng mang một bearer token hợp lệ. Điều đó có thay đổi kết quả không? Expected: không; xác thực trên đường truyền thất bại trước, và xác thực danh tính cho bạn biết ai đã gửi một yêu cầu sai định dạng, không phải rằng nó được chạy.

## Wrong answers

- "Tin header, vì gateway định tuyến dựa trên nó." Phần thân là thứ được thực thi. Phải chứng minh hai thứ bằng nhau trước khi dùng bất kỳ thứ nào cho một quyết định.
- "Kiểm tra hỗ trợ phiên bản trước để các client xấu thất bại nhanh." Một sự không khớp phải trả về `-32020` ngay cả khi một phiên bản không được hỗ trợ; hỗ trợ chỉ được kiểm tra sau sự bằng nhau.
- "Giá trị header không phân biệt hoa thường như tên header." Các giá trị phân biệt hoa thường, và một tên khác về chữ hoa thường là một tên khác.

## Taught in

[Bài học nền tảng](../../../phases/13-tools-and-protocols/06-mcp-fundamentals/) cung cấp thứ tự vòng đời, [bài học về transport](../../../phases/13-tools-and-protocols/09-mcp-transports/) định nghĩa các header được phản chiếu, và [bài học bảo mật](../../../phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/) đặt định tuyến trước chính sách.
