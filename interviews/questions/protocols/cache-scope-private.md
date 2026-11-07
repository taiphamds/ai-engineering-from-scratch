---
id: cache-scope-private
title: A shared cache in front of private notes
card: protocols
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [mcp, caching, cache-scope, ttl, resources]
minutes: 8
lessons: [phases/13-tools-and-protocols/10-mcp-resources-and-prompts, phases/13-tools-and-protocols/07-building-an-mcp-server]
manuals: []
practice: []
cheatsheet: [mcp-server-build]
related: [protocols/tool-resource-or-prompt]
updated: 2026-11-03
---

Một server ghi chú muốn có một cache dùng chung phía trước nó, nên các kết quả `resources/read` mang phạm vi công khai và một gợi ý độ tươi năm phút. Một người rà soát bảo mật phản đối. Rủi ro là gì, bạn chọn phạm vi và độ tươi nào cho một ghi chú của người dùng, và bạn làm gì với một kết quả tuyệt đối không được lưu?

## Short answer

Một phạm vi công khai cho phép cache dùng chung trao ghi chú của một người dùng cho người dùng khác yêu cầu cùng URI. Nội dung gắn với một người dùng nhận `cacheScope: "private"`, gắn mục với ngữ cảnh thông tin xác thực đang yêu cầu, và một độ tươi ngắn như một phút. MCP chỉ định nghĩa `public` và `private`, nên một kết quả mang bí mật hoặc thay đổi nhanh nhận `private` với `ttlMs: 0`, và host thêm một quy tắc no-store nghiêm ngặt hơn trong chính sách cache riêng.

## Full answer

### Two scopes, one rule

| Phạm vi | Ý nghĩa | Cách dùng điển hình |
|---|---|---|
| `public` | có thể được dùng lại giữa các người dùng khi ủy quyền cho phép | một catalog prompt công khai |
| `private` | gắn với người dùng đang yêu cầu hoặc ngữ cảnh thông tin xác thực | nội dung ghi chú thuộc sở hữu người dùng |

Các gợi ý mô tả độ tươi và việc chia sẻ. Chúng không bao giờ thay thế ủy quyền. Server vẫn ủy quyền cho mọi lần đọc, và một phản hồi được cache không được vượt qua các ngữ cảnh ủy quyền.

### Which results carry hints

`tools/list`, `resources/list`, `prompts/list`, `resources/templates/list`, `resources/read` và `server/discover` có thể cache và bao gồm `ttlMs` và `cacheScope`. Một kết quả `prompts/get` đã render là hoàn chỉnh, nhưng nó không phải một trong các kết quả có thể cache. Một mặc định an toàn là `ttlMs: 0` với `cacheScope: "private"`.

### Choosing the freshness

Chọn TTL từ tốc độ thay đổi của dữ liệu và thiệt hại do lỗi thời. Một catalog prompt công khai có thể sống trong nhiều phút. Một lần đọc ghi chú riêng tư có thể dùng một phút. Các ví dụ của bài học dùng `300000` cho một danh sách resource, `600000` cho một danh sách prompt và `3600000` cho discovery.

### Keys and determinism

Một khóa cache phải bao gồm mọi chiều của yêu cầu làm thay đổi khả năng hiển thị: tenant, người dùng, phạm vi, locale và cursor phân trang. Nếu một cache dùng chung không thể biểu diễn các chiều đó an toàn, dùng `private` với TTL bằng không và một chính sách no-store ở cấp host. Các kết quả danh sách cũng cần thứ tự xác định, để các kết quả bằng nhau cho các khóa cache ổn định và ngữ cảnh mô hình ổn định.

### The trade

Một cache dùng chung tiết kiệm công việc trên các catalog công khai và không tốn gì về an toàn ở đó. Trên nội dung riêng tư, nó mang lại vài mili giây và có nguy cơ rò rỉ giữa các người dùng mà không TTL nào có thể rút ngắn về không. Cache catalog, không cache ghi chú.

## Follow-ups

- **Level 2:** Tại sao `resources/list` phải trả về một thứ tự ổn định? Expected: để các phản hồi tương đương tạo ra các khóa cache ổn định và ngữ cảnh mô hình ổn định, và giao diện host không nhảy giữa các lần làm mới.
- **Level 2:** Một client nhận một danh sách được cache và muốn biết khi nào nó thay đổi. Nó làm gì? Expected: mở `subscriptions/listen` với danh mục thay đổi danh sách, và lấy lại sau khi hết hạn hoặc sau một sự kiện.
- **Level 3:** `tools/list` khác nhau theo principal vì ủy quyền theo từng người dùng. Phạm vi nào? Expected: `private`; khả năng hiển thị công cụ theo từng người dùng không được nằm sau một cache công khai dùng chung.
- **Level 4:** Nhóm đề xuất `cacheScope: "no-store"`. Bạn trả lời gì? Expected: nó không phải một giá trị MCP; trả về `private` với `ttlMs: 0` và áp dụng no-store trong chính sách cache của host.

## Wrong answers

- "Một TTL ngắn khiến phạm vi công khai an toàn." Phạm vi quyết định ai có thể chia sẻ một mục, và TTL quyết định trong bao lâu. Một giây chia sẻ vẫn làm rò rỉ ghi chú.
- "Các gợi ý cache là sự ủy quyền." Chúng là các gợi ý độ tươi và chia sẻ. Server tự ủy quyền cho mọi lần đọc.
- "Chỉ danh sách công cụ cần các gợi ý cache." Các lần đọc resource và discovery cũng mang chúng, và một lần đọc riêng cho người dùng là nơi phạm vi riêng tư quan trọng nhất.

## Taught in

[Bài học về resource và prompt](../../../phases/13-tools-and-protocols/10-mcp-resources-and-prompts/) xem các gợi ý cache là một phần của tính đúng đắn, và [bài học về server](../../../phases/13-tools-and-protocols/07-building-an-mcp-server/) liệt kê những kết quả nào mang chúng.
