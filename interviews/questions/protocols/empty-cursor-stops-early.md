---
id: empty-cursor-stops-early
title: The pagination loop that ends two pages short
card: protocols
kind: code-reading
level: 2
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [coding, debugging]
tags: [mcp, pagination, cursor, tools-list, code-reading]
minutes: 7
lessons: [phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content]
manuals: []
practice: []
cheatsheet: [mcp-client-transports]
related: [protocols/two-error-layers]
updated: 2026-11-03
---

Một client thu thập danh sách công cụ của một MCP server bằng vòng lặp này:

```python
tools = []
cursor = None
while True:
    result = call("tools/list", cursor=cursor)
    tools.extend(result["tools"])
    if not result.get("nextCursor"):
        break
    cursor = result["nextCursor"]
```

Với một server, client chỉ thấy trang đầu tiên, và trace cho thấy một yêu cầu duy nhất. Đọc mã và tìm lỗi. Sau đó nêu thêm hai điều mà client không bao giờ được làm với cursor.

## Short answer

Vòng lặp kiểm tra tính truthy của cursor, và một chuỗi trống là một cursor hợp lệ. Server trả về `""` sau trang đầu, phép kiểm tra đọc nó là false, và vòng lặp dừng trước yêu cầu thứ hai. Chỉ dừng khi `nextCursor` vắng mặt hoặc `null`, và gửi lại giá trị chính xác như đã nhận. Client cũng không bao giờ được giải mã một cursor hoặc so sánh hai cursor về thứ tự.

## Full answer

### The one decision a client gets

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

Server chọn kích thước trang và định dạng cursor. Server mẫu trong bài học cố ý trả về `""` sau trang đầu tiên, và trace đúng là một yêu cầu không có cursor theo sau bởi một yêu cầu với cursor `""`.

### Cursors are opaque

Không giải mã một cursor, tăng nó, so sánh nó với một cursor trước, hoặc suy ra số trang từ nó. Một server có thể ký một cursor, gắn nó với một phiên bản catalog, hoặc ánh xạ nó tới trạng thái riêng. Đó là chi tiết của server và có thể thay đổi mà không báo trước. Một cursor không hợp lệ trả về invalid params JSON-RPC, `-32602`.

### Why the bug matters

Danh sách công cụ là cổng đầu tiên của pipeline hợp đồng: khám phá, tiếp nhận, gọi, thực thi, tiêu thụ. Một client bỏ các trang cuối cung cấp một catalog không đầy đủ cho mô hình và có thể bỏ sót descriptor mà nó được yêu cầu tiếp nhận hoặc từ chối. Discovery phải xác định và hoàn chỉnh trước khi việc tiếp nhận bắt đầu.

## Follow-ups

- **Level 2:** Một trang đến với `nextCursor` hiện diện và một mảng `tools` trống. Bạn có tiếp tục không? Expected: có; tiếp tục bất cứ khi nào `nextCursor` hiện diện và không phải `null`.
- **Level 2:** Một cursor trông giống base64. Client có được giải mã nó để nhảy về phía trước không? Expected: không; giá trị là mờ, và server có thể ký nó hoặc gắn nó với một phiên bản catalog.
- **Level 3:** Server nên đặt gì trong một cursor để client không thể dùng sai nó? Expected: một token được ký hoặc được ánh xạ ở server, gắn với một phiên bản catalog khi cần, với một giá trị không hợp lệ hoặc cũ bị từ chối bằng `-32602`.
- **Level 4:** Bằng chứng nào chứng minh discovery phân trang hoàn chỉnh cho một gateway? Expected: trace các trang, các tập descriptor được tiếp nhận và bị từ chối, và một phép kiểm tra rằng các lệnh gọi lặp lại cho cùng thứ tự logic.

## Wrong answers

- "Một chuỗi trống nghĩa là không còn trang." Nó là một cursor hợp lệ. Chỉ sự vắng mặt hoặc `null` kết thúc vòng lặp.
- "Parse cursor để tính số trang." Định dạng thuộc về server và có thể được ký hoặc là trạng thái riêng.
- "So sánh cursor mới với cursor cũ để phát hiện một vòng lặp." Các client không được so sánh cursor về thứ tự.

## Taught in

[Bài học về hợp đồng công cụ](../../../phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/) cho thấy trace cursor hai yêu cầu và quy tắc cursor mờ.
