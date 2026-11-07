---
id: tool-resource-or-prompt
title: Pick the MCP primitive by who chooses it
card: protocols
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [mcp, tools, resources, prompts, primitives]
minutes: 6
lessons: [phases/13-tools-and-protocols/10-mcp-resources-and-prompts]
manuals: []
practice: []
cheatsheet: [mcp]
related: [protocols/two-error-layers]
updated: 2026-11-03
---

Một nhóm xây dựng một MCP server cho một bộ theo dõi dự án. Nó có năm capability: hiển thị chi tiết của một issue, tạo một issue, một mẫu sprint review, tài liệu chính sách dự án, và đóng một issue. Một lập trình viên đề xuất công bố mỗi capability dưới dạng một tool, một resource và một prompt cùng lúc, để mọi client tìm thấy nó. Bạn cho mỗi capability thành phần cơ bản nào, và tại sao không phải cả ba?

## Short answer

Chọn thành phần cơ bản từ người đưa ra lựa chọn. Mô hình chọn một tool để thực hiện một thao tác, nên tạo và đóng là tool. Một host hoặc một người dùng đọc nội dung có địa chỉ tại một URI, nên chi tiết issue và chính sách là resource, và một người dùng bắt đầu một workflow thông điệp đã chuẩn bị, nên mẫu review là một prompt. Mỗi bề mặt thêm vào tốn discovery, ủy quyền, caching, xử lý lỗi, kiểm thử và tài liệu, nên một capability nhận một thành phần cơ bản.

## Full answer

### Three primitives, three choosers

| Thành phần cơ bản | Người chọn | Ý định | Kết quả |
|---|---|---|---|
| Tool | mô hình hoặc ứng dụng | thực hiện một thao tác | kết quả hành động có cấu trúc |
| Resource | host, ứng dụng hoặc người dùng | đọc nội dung tại một URI | nội dung văn bản hoặc nhị phân |
| Prompt | người dùng, thông qua giao diện host | bắt đầu một workflow thông điệp có thể dùng lại | một hoặc nhiều thông điệp |

### The five capabilities

- Chi tiết issue: nội dung có một địa chỉ ổn định, như `tracker://issues/7`. Một resource.
- Tạo issue: thay đổi trạng thái. Một tool.
- Mẫu sprint review: một người dùng chọn nó từ một menu hoặc một lệnh slash và điền các đối số. Một prompt.
- Chính sách dự án: một tài liệu mà host đọc vào ngữ cảnh. Một resource.
- Đóng issue: thay đổi trạng thái. Một tool.

### Why the triple publication is wrong

Một capability được công bố theo ba cách cần ba mục discovery, ba kiểm tra ủy quyền, ba chính sách cache, ba đường lỗi và ba tập kiểm thử. Mô hình cũng thấy một tool mà nó không nên gọi cho nội dung host đọc. Bắt đầu từ bên tiêu thụ, rồi viết handler.

### Design rules that follow

- Thiết kế URI resource trước handler. Đặt namespace cho nó theo server, giữ nó độc lập với một tiến trình hoặc một kết nối, xác thực nó trước truy cập lưu trữ, và ủy quyền mọi lần đọc.
- `prompts/get` phân giải các đối số thành các thông điệp. Host quyết định các thông điệp đó đi vào ngữ cảnh mô hình như thế nào và giữ chính sách riêng ở trên chúng.
- Xem văn bản resource và các mẫu prompt là đầu ra server không đáng tin cậy. Host giữ nguồn gốc và xem nội dung là dữ liệu.

## Follow-ups

- **Level 1:** Điều gì tạo nên một URI resource tốt? Expected: đủ ổn định để đánh dấu trang, được đặt namespace theo server, độc lập với một id tiến trình hoặc kết nối, được xác thực trước truy cập lưu trữ, và được ủy quyền ở mọi lần đọc.
- **Level 2:** Một client muốn biết khi nào tài liệu chính sách thay đổi. Bản sửa đổi hiện tại dùng cơ chế nào? Expected: một yêu cầu `subscriptions/listen` do client mở nêu URI trong `resourceSubscriptions`; sự kiện nói resource đã thay đổi, và client đọc lại nó bằng `resources/read`.
- **Level 2:** Một client yêu cầu `resources/read` cho một URI không tồn tại. Bạn có trả về một tài liệu trống không? Expected: không, trả về JSON-RPC `-32602`, để client phân biệt sự vắng mặt với một tài liệu trống hợp lệ.
- **Level 3:** Khi nào bạn công bố một resource template thay vì liệt kê mọi issue? Expected: khi danh sách lớn hoặc không giới hạn; template cho client biết cách tạo một URI hợp lệ, và server vẫn parse các biến, ủy quyền, và dùng các truy vấn lưu trữ có kiểu.

## Wrong answers

- "Biến mọi thứ thành một tool để mô hình có thể tiếp cận." Nội dung mà một host đọc không phải một thao tác. Nó mất hợp đồng URI, các gợi ý cache và bề mặt do người dùng kiểm soát.
- "Lưu template thành một resource vì nó nằm trong một file." Nơi dữ liệu được lưu không quyết định thành phần cơ bản. Một người dùng bắt đầu review, nên nó là một prompt.
- "Một prompt là chính sách mà host chèn vào mà người dùng không biết." Prompt tồn tại cho việc lựa chọn tường minh của người dùng. Chính sách mà host thực thi nằm trong host ở ưu tiên cao hơn.

## Taught in

[Bài học về resource và prompt](../../../phases/13-tools-and-protocols/10-mcp-resources-and-prompts/) phân loại ba thành phần cơ bản theo ý định của bên tiêu thụ và cho thấy luồng subscription.
