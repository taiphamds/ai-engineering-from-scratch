---
id: span-kind-client-or-internal
title: Which agent spans are CLIENT and which are INTERNAL
card: production-mlops
kind: concept
level: 1
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [opentelemetry, tracing, spans, genai-conventions]
minutes: 5
lessons: [phases/13-tools-and-protocols/20-opentelemetry-genai, phases/14-agent-engineering/23-otel-genai-conventions]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/read-this-span, production-mlops/trace-context-over-stdio]
updated: 2026-11-03
---

Bạn thêm tracing vào một agent. Trong một lần chạy, nó gọi một API mô hình hai lần, chạy hai công cụ bên trong tiến trình riêng và gửi một yêu cầu đến một máy chủ công cụ trên máy khác. Các phép toán nào trong số này nhận một span CLIENT, các phép toán nào nhận một span INTERNAL, và tại sao có ai quan tâm?

## Short answer

Một lời gọi rời tiến trình nhận một span CLIENT: hai lời gọi API mô hình và yêu cầu đến máy chủ công cụ từ xa. Bước vòng lặp agent và một công cụ chạy trong tiến trình riêng của bạn nhận các span INTERNAL. Kind cho một backend biết hướng mỗi lời gọi, để nó có thể cho thấy các phép toán nào rời tiến trình và các phép toán nào không.

## Full answer

### The tree for this run

```text
invoke_agent            INTERNAL
 ├── chat               CLIENT
 ├── execute_tool       INTERNAL
 │    └── remote call   CLIENT
 ├── execute_tool       INTERNAL
 └── chat               CLIENT
```

Mọi span chia sẻ một trace id. Mỗi con mang id của cha. Đó là điều khiến lần chạy là một cây thay vì sáu bản ghi rời.

### The rule

CLIENT đánh dấu một lời gọi qua ranh giới tiến trình: một nhà cung cấp mô hình, một máy chủ công cụ, một dịch vụ agent được host. INTERNAL đánh dấu các bước vòng lặp riêng của agent và bất kỳ công cụ nào chạy trong cùng tiến trình. Các quy ước áp dụng cùng quy tắc cho chính span agent: một agent chạy như một dịch vụ từ xa là CLIENT từ bên gọi, và một framework agent trong tiến trình là INTERNAL.

### The attributes that go with each kind

| Span | Thuộc tính |
|---|---|
| lời gọi mô hình | `gen_ai.operation.name`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.response.id` |
| lời gọi công cụ | `gen_ai.tool.name`, `gen_ai.tool.call.id` |
| lần chạy agent | `gen_ai.agent.name`, `gen_ai.agent.id` |

### Why it matters

Các backend vẽ một waterfall từ các kind và liên kết cha. Một span CLIENT không có response id không thể được khớp với log nhà cung cấp. Một span công cụ không có cha là mồ côi, và bạn không còn thấy bước agent nào gây lời gọi.

## Follow-ups

- **Level 1:** Điều gì nối các span thành một cây? Expected: một trace id dùng chung, và một parent span id trên mọi con.
- **Level 2:** Agent gọi một dịch vụ agent được host thay vì một agent cục bộ. Span đó là kind nào? Expected: CLIENT, vì agent chạy trong một tiến trình khác.
- **Level 2:** Thuộc tính nào cho phép một dashboard chia chi phí theo nhà cung cấp? Expected: `gen_ai.provider.name`, và các dashboard đa nhà cung cấp hỏng khi thiếu nó.
- **Level 3:** Một agent phụ chạy trong cùng tiến trình. Nó có bắt đầu một trace mới? Expected: không. Nó là một span con dưới span agent cha, nên toàn bộ lần chạy ở trong một trace.

## Wrong answers

- "Mọi lời gọi công cụ là một span CLIENT." Một công cụ chạy trong tiến trình của bạn là INTERNAL. Chỉ lời gọi rời tiến trình là CLIENT.
- "Kind là trang trí." Các backend đọc kind để cho thấy hướng, và các quy ước đặt nó theo nhóm span.
- "Bắt đầu một trace mới cho mỗi lời gọi công cụ, để cô lập." Các trace riêng mất liên kết cha, nên bạn không thể thấy bước nào gây lời gọi.

## Taught in

[Bài học OpenTelemetry GenAI](../../../phases/13-tools-and-protocols/20-opentelemetry-genai/) vẽ phân cấp span, và [bài học quy ước](../../../phases/14-agent-engineering/23-otel-genai-conventions/) nêu các nhóm span và kind của chúng.
