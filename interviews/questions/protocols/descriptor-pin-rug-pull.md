---
id: descriptor-pin-rug-pull
title: The pin that passed a changed tool
card: protocols
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [debugging, design-review]
tags: [mcp, tool-poisoning, rug-pull, hash-pin, gateway]
minutes: 9
lessons: [phases/13-tools-and-protocols/15-mcp-security-tool-poisoning]
manuals: []
practice: []
cheatsheet: [mcp-security-auth, mcp-gateways-operations]
related: [protocols/two-error-layers]
updated: 2026-11-03
---

Gateway của bạn ghim mỗi công cụ được phê duyệt bằng cách băm văn bản mô tả của nó. Một server được kết nối phát hành một bản cập nhật. Mô tả không đổi, nhưng `inputSchema` có thêm một trường `destination` và `destructiveHint` chuyển thành false. Kiểm tra ghim đạt, và mô hình bắt đầu gọi công cụ với đối số mới. Điều gì đã sai, và bạn ghim đúng bằng cách nào?

## Short answer

Việc ghim bao phủ một trường, nên một thay đổi schema và annotation được cho qua như không thay đổi. Chuẩn hóa toàn bộ descriptor với các khóa được sắp xếp, băm nó, và lưu digest dưới một tên đầy đủ cùng bằng chứng nhà phát hành và thời gian phê duyệt. Ở mỗi lần làm mới, cách ly một khóa không xác định hoặc một digest đã thay đổi cho đến khi một người phê duyệt lại. Hash bằng nhau chứng minh tính ổn định, không chứng minh an toàn, nên descriptor đầu tiên cũng cần được xem xét.

## Full answer

### Pin the whole descriptor

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

Lưu digest dưới một khóa đầy đủ như `notes.export`. Ở mỗi lần làm mới:

| Quan sát | Hành động |
|---|---|
| khóa không xác định | cách ly cho đến khi được xem xét |
| cùng khóa, digest khác | cách ly như một rug pull cho đến khi được phê duyệt lại |
| tên không đầy đủ bị trùng | yêu cầu namespacing xác định |
| bộ quét phát hiện | chặn và xem xét toàn bộ descriptor |

### Seven surfaces, not one

Đầu độc metadata, descriptor rug pull, che khuất giữa các server, nhầm lẫn header và body, leo thang capability, can thiệp trạng thái MRTR, và nhầm lẫn danh tính chuỗi cung ứng chồng lấn nhau. Ghim hash giúp với các thay đổi nhưng không chứng minh phiên bản đầu tiên an toàn. Một bộ quét tĩnh bắt được các cụm từ hiển nhiên và bỏ sót các cụm từ tinh vi. Namespacing ngăn một lớp va chạm chứ không ngăn một server có namespace độc hại. Kết hợp các biện pháp kiểm soát.

### The scanner is a tripwire

Các mẫu đơn giản đánh dấu tag vai trò, ghi đè chỉ dẫn, che giấu, truy cập bí mật và các đích mạng bị làm mờ. Chúng rẻ ở thời điểm cài đặt và trong CI. Chúng không phải một bằng chứng ngữ nghĩa: một mô tả an toàn có thể chứa một cụm từ bị đánh dấu trong một cảnh báo, và một mô tả độc hại có thể tránh mọi cụm từ. Xem một lần phát hiện là bằng chứng để xem xét.

### Namespace before you merge

Khi hai server đều cung cấp `search`, không bao giờ để thứ tự discovery quyết định. Các tên đầy đủ `notes.search` và `issues.search` trở thành các tên gateway công khai, và ánh xạ backend được ghi riêng. Các tên ổn định khiến việc phê duyệt, kiểm toán, ghim và định tuyến `Mcp-Name` tham chiếu cùng một đối tượng.

### Run the checks twice

Chạy so sánh ghim tại discovery và một lần nữa trước khi điều phối. Một cache có thể giảm công việc discovery, nhưng một phê duyệt được cache phải hết hạn hoặc bị vô hiệu hóa khi descriptor thay đổi.

## Follow-ups

- **Level 2:** Một kết quả bộ quét sạch chứng minh điều gì? Expected: không có gì về ngữ nghĩa; nó là bằng chứng để xem xét, không phải điểm vô tội.
- **Level 3:** `serverInfo` của server nói nó là nhà phát hành quen thuộc. Điều đó mang lại bao nhiêu sự tin cậy? Expected: không có; nó là dữ liệu hiển thị tự báo cáo cho nhật ký, không phải một chứng chỉ hoặc bằng chứng registry.
- **Level 3:** Descriptor đã bị đầu độc ngay từ ngày đầu và việc ghim đã lưu digest đó. Điều gì bắt được nó? Expected: xem xét trước lần phê duyệt đầu tiên, với bộ quét làm dây báo động; hash không thể.
- **Level 4:** Một gateway ngăn mô hình xem annotation là chính sách bằng cách nào? Expected: annotation vẫn là gợi ý trình bày; ủy quyền gắn principal với đúng động từ, resource và các đối số đã chuẩn hóa, và một lệnh gọi có hệ quả cần phê duyệt gắn với hành động.

## Wrong answers

- "Băm mô tả; schema chỉ là định kiểu." Schema quyết định các đối số mà mô hình có thể gửi, và một trường mới có thể định tuyến dữ liệu tới một đích mới.
- "Một hash khớp nghĩa là công cụ an toàn." Nó nghĩa là descriptor không thay đổi. Một descriptor bị đầu độc vẫn bị đầu độc khi được ghim.
- "Đặt `destructiveHint` và host sẽ xác nhận." Annotation là các gợi ý không đáng tin cậy. Server thực thi ủy quyền và phê duyệt.

## Taught in

[Bài học về tool poisoning](../../../phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/) liệt kê bảy bề mặt tấn công và ghim toàn bộ descriptor.
