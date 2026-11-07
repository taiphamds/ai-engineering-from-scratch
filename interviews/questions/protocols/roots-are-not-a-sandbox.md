---
id: roots-are-not-a-sandbox
title: A root is a hint, not a permission
card: protocols
kind: concept
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [ml-depth, design-review]
tags: [mcp, roots, authorization, path-containment, scope]
minutes: 8
lessons: [phases/13-tools-and-protocols/12-mcp-roots-and-elicitation]
manuals: []
practice: []
cheatsheet: [mcp-security-auth]
related: [protocols/mrtr-confirmation-state]
updated: 2026-11-03
---

Một MCP server hệ thống file đọc danh sách Roots của client một lần và xem mọi đường dẫn dưới một root là đã được ủy quyền để xóa. Client quảng bá một thư mục workspace. Hai yêu cầu xóa đến: một cho một thư mục anh em có tên bắt đầu bằng tên workspace, và một yêu cầu đi đến thư mục cha thông qua một đoạn hai-dấu-chấm được mã hóa. Thiết kế này sai ở đâu, và bạn thay thế nó bằng cách nào?

## Short answer

Roots là hướng dẫn mang tính thông tin, không bao giờ là ủy quyền và không bao giờ là một sandbox, và bản sửa đổi hiện tại đánh dấu chúng là lỗi thời. Một phép kiểm tra tiền tố chuỗi chấp nhận cả hai đường dẫn thù địch, vì cả hai bắt đầu bằng văn bản workspace. Thay root bằng một đối số `workspaceUri` tường minh hoặc một URI resource, rồi thực thi ba lớp: ủy quyền principal cho workspace đó, chuẩn hóa URI và kiểm tra sự chứa bên trong theo các thành phần đường dẫn, và chạy server dưới một sandbox hệ điều hành.

## Full answer

### What roots were

Các bản sửa đổi trước cho phép một client quảng bá Roots và gửi `notifications/roots/list_changed`. Một root cho server biết người dùng đang làm việc ở đâu. Nó không ràng buộc những gì tiến trình server có thể đọc, không ủy quyền bên gọi, và không tạo ranh giới hệ điều hành. Bản sửa đổi hiện tại đánh dấu `roots/list` là lỗi thời đối với các thiết kế mới.

### The explicit replacements

| Tình huống | Thứ thay thế |
|---|---|
| phạm vi thay đổi theo từng lệnh gọi | một đối số công cụ `workspaceUri` hoặc `directory` |
| thao tác đã nhắm tới một resource | URI resource |
| một triển khai sở hữu một workspace cố định | cấu hình server |
| mã phải không thể thoát ra | một sandbox tiến trình hoặc hệ thống file bị giam |

Mô hình có thể thấy và lặp lại một handle tường minh. Phạm vi phiên ẩn khó kiểm tra, phát lại, kiểm toán và định tuyến hơn.

### Three layers, every time

1. Ủy quyền: principal đã xác thực này có được dùng workspace này không?
2. Sự chứa bên trong: đích đã chuẩn hóa có nằm trong ranh giới workspace không?
3. Sandbox: dù vậy, hệ điều hành có thể chặn một server bị xâm phạm không?

### Why the prefix check fails

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Cả hai đường dẫn thù địch bắt đầu bằng văn bản được cho phép. Chuẩn hóa các đoạn mã hóa phần trăm trước, rồi so sánh các thành phần đường dẫn. Kiểm tra lại sự chứa bên trong ngay trước biến đổi, vì một đích có thể di chuyển sau khi yêu cầu được xác thực. Một server hệ thống file thực cũng cần một chính sách liên kết tượng trưng và xử lý đường dẫn riêng theo nền tảng.

### The migration adapter

Nếu một peer vẫn cần `roots/list` trong khoảng thời gian chuyển sang lỗi thời, server nhúng yêu cầu đó trong một kết quả MRTR `input_required`. Nó không bao giờ gửi một yêu cầu ngược trực tiếp. Gắn nhãn adapter là legacy, và không bao giờ để một danh sách root legacy vượt qua ủy quyền server.

## Follow-ups

- **Level 2:** Khi nào cấu hình server là thứ thay thế đúng? Expected: khi một triển khai sở hữu một workspace cố định; phạm vi theo từng lệnh gọi thuộc về một đối số `workspaceUri`.
- **Level 3:** Tại sao kiểm tra lại sự chứa bên trong ngay trước việc xóa? Expected: bản ghi trực tiếp có thể di chuyển ra ngoài workspace giữa xác thực và biến đổi, và một cuộc đua không được xóa sai đích.
- **Level 3:** Tại sao chỉ sự chứa bên trong theo từ vựng không ngăn một lần thoát qua symlink? Expected: một liên kết bên trong ranh giới phân giải tới một đường dẫn bên ngoài nó, nên lớp hệ thống file cần một chính sách symlink và phân giải đường dẫn thực.
- **Level 4:** Một peer legacy đã ghim vẫn gửi `roots/list`. Bạn phục vụ nó mà không làm yếu handler hiện đại bằng cách nào? Expected: một adapter cô lập nhúng yêu cầu trong các input request MRTR, gắn nhãn legacy, với ủy quyền và sự chứa bên trong vẫn được thực thi trên server.

## Wrong answers

- "Client đã khai báo root, nên server có thể tin phạm vi." Một root là một gợi ý tự báo cáo. Ủy quyền đến từ principal đã xác thực và chính sách server.
- "Kiểm tra `startswith` trên URI được cho phép." Một thư mục anh em và một traversal được mã hóa đều vượt qua. Chuẩn hóa, rồi so sánh các thành phần đường dẫn.
- "Một sandbox hệ điều hành khiến kiểm tra ủy quyền không cần thiết." Sandbox là lớp thứ ba cho một tiến trình bị xâm phạm. Nó không quyết định principal nào được chạm tới workspace nào.

## Taught in

[Bài học về roots và elicitation](../../../phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/) nêu quy tắc ba lớp và cho thấy cả hai đường dẫn thù địch không vượt qua sự chứa bên trong.
