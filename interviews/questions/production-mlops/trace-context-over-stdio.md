---
id: trace-context-over-stdio
title: One trace across HTTP and stdio tool servers
card: production-mlops
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [system-design, debugging]
tags: [tracing, mcp, traceparent, propagation]
minutes: 12
lessons: [phases/13-tools-and-protocols/20-opentelemetry-genai]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/span-kind-client-or-internal, production-mlops/read-this-span]
updated: 2026-11-03
---

Agent của bạn dùng ba máy chủ công cụ qua giao thức MCP. Hai máy chủ dùng streamable HTTP, và một chạy như một tiến trình con cục bộ qua stdio. Thiết kế cách một trace id duy nhất đến cả ba, và nói mỗi máy chủ phải làm gì khi nó đến.

## Short answer

Với các máy chủ HTTP, chèn header W3C `traceparent` vào mọi yêu cầu, như bất kỳ client HTTP được trace nào làm. Transport stdio không có header, nên đặt cùng giá trị vào trường `_meta` của mỗi yêu cầu JSON-RPC đến khi giao thức thêm một trường tiêu chuẩn cho nó. Mỗi máy chủ đọc giá trị, mở span riêng như một con của ngữ cảnh đó, ghi trace id vào log, và truyền ngữ cảnh tiếp nếu gọi bất cứ thứ gì khác.

## Full answer

### Why this is worth the work

Bài học mở bằng một báo cáo từ production: agent đôi khi trả lời trong 3 giây và đôi khi trong 30. Các log cho thấy các lời gọi mô hình và không gì khác. Nguyên nhân là một máy chủ công cụ treo trong cold start, và không gì ít hơn một trace từ đầu đến cuối có thể cho thấy nó.

### The HTTP servers

Streamable HTTP mang các header tiêu chuẩn. Client chèn `traceparent`, và máy chủ bắt đầu một span dưới cha đó. Ở phía client, lời gọi là một span CLIENT dưới span `execute_tool`. Ở phía máy chủ, công việc là một con của cùng trace. Khoảng cách giữa hai bên là thời gian transport.

### The stdio server

Stdio không mang header HTTP. Lộ trình giao thức thảo luận một trường `_meta.traceparent` trên các lời gọi JSON-RPC. Đến khi nó được phát hành, tự bao gồm giá trị `traceparent` trong `_meta` trên mọi yêu cầu, và để máy chủ đọc nó từ đó. Máy chủ ghi log trace id để một dòng log và một span có thể được nối sau.

### What every server does with the context

1. Phân tích ngữ cảnh từ header hoặc từ `_meta`.
2. Bắt đầu một span như một con của ngữ cảnh đó, không phải một trace mới.
3. Ghi trace id vào mọi dòng log của yêu cầu.
4. Truyền ngữ cảnh đến bất cứ thứ gì nó gọi tiếp.

### What you can see afterwards

Một waterfall: bước agent, lời gọi công cụ, công việc của máy chủ. Một lần treo xuất hiện như một span máy chủ dài dưới một span client dài. Cạnh các span, phát histogram thời lượng thực thi công cụ theo công cụ, trả lời các câu hỏi dashboard mà không có trace.

## Follow-ups

- **Level 3:** Một máy chủ bỏ qua trường `_meta`. Bạn thấy gì trong trace? Expected: công việc máy chủ xuất hiện như một trace riêng hoặc hoàn toàn không, và span client cho thấy thời lượng nhưng không cho thấy thời gian đi đâu.
- **Level 3:** Span nào ghi lần treo, span client hay span máy chủ? Expected: cả hai. Span client cho thấy thời gian chờ từ phía agent, span máy chủ cho thấy máy chủ làm gì, và khoảng cách giữa chúng là transport.
- **Level 4:** Một nhóm khác vận hành một máy chủ công cụ. Bạn yêu cầu họ cam kết gì? Expected: nhận ngữ cảnh từ header hoặc `_meta`, tiếp tục trace thay vì bắt đầu một trace, ghi log trace id, và xuất span đến một backend cả hai nhóm có thể đọc.

## Wrong answers

- "Ghi log một request id và nối các log sau." Một request id không có cấu trúc cha-con và không thời gian. Một trace có cả hai.
- "Máy chủ stdio cục bộ, nên không cần tracing." Lần treo trong bài học ở cold start của một máy chủ cục bộ. Cục bộ không có nghĩa nhanh.
- "Đặt trace id vào prompt để mô hình mang nó." Mô hình không phải một transport, và một giá trị thay đổi trong prompt cũng phá prefix cache.

## Taught in

[Bài học OpenTelemetry GenAI](../../../phases/13-tools-and-protocols/20-opentelemetry-genai/) trình bày truyền qua các transport MCP và chỉ số thời lượng công cụ.
