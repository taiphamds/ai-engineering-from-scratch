---
id: read-this-span
title: Review one span from a new instrumentation branch
card: production-mlops
kind: code-reading
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, design-review]
tags: [opentelemetry, genai-conventions, pii, tracing]
minutes: 12
lessons: [phases/13-tools-and-protocols/20-opentelemetry-genai, phases/14-agent-engineering/23-otel-genai-conventions, phases/19-capstone-projects/28-observability-otel-traces]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/span-kind-client-or-internal, production-mlops/prompts-in-span-attributes]
updated: 2026-11-03
---

Một đồng nghiệp mở một bản đánh giá thêm tracing vào agent. Nhánh phát span này cho mọi lời gọi mô hình. Liệt kê mọi vấn đề bạn tìm trước khi phê duyệt.

```json
{
  "traceId": "abcdefabcdefabcdefabcdefabcdefab",
  "spanId": "abcdefabcdefabcd",
  "parentSpanId": "",
  "name": "chat",
  "kind": "INTERNAL",
  "attributes": {
    "gen_ai.operation.name": "chat",
    "gen_ai.request.model": "our_smart_model",
    "gen_ai.usage.prompt_tokens": 500,
    "gen_ai.content.prompt": "You are a support agent. The customer's card number is ..."
  }
}
```

## Short answer

Span đánh dấu một lời gọi mô hình là INTERNAL, không có cha, và dùng một tên thuộc tính cũ cho token đầu vào. Nó bỏ nhà cung cấp, token đầu ra, mô hình phản hồi và response id, và ghi văn bản prompt, có một số thẻ trong đó, vào trace. Sửa kind và liên kết cha, dùng các tên thuộc tính hiện tại, thêm các thuộc tính thiếu, và chuyển nội dung ra khỏi span.

## Full answer

### The problems, in order of damage

| Dòng | Vấn đề | Cách sửa |
|---|---|---|
| `parentSpanId: ""` | một span mồ côi; không backend nào có thể cho thấy bước agent nào thực hiện lời gọi | truyền ngữ cảnh cha từ span `invoke_agent` |
| `kind: INTERNAL` | một lời gọi mô hình vượt ranh giới tiến trình | `CLIENT` |
| `gen_ai.content.prompt` | văn bản prompt có dữ liệu khách hàng trong một kho người vận hành đọc | thu thập tắt mặc định; lưu nội dung bên ngoài và đặt một reference id trên span |
| `gen_ai.usage.prompt_tokens` | thuộc tính đã được đổi tên; các backend đọc `gen_ai.usage.input_tokens` | dùng tên hiện tại và thêm `gen_ai.usage.output_tokens` |
| không có `gen_ai.provider.name` | các dashboard chi phí và lỗi không thể chia theo nhà cung cấp | đặt nó trên mọi span mô hình |
| không có `gen_ai.response.model` | với định tuyến, mô hình được phục vụ có thể khác alias được yêu cầu | ghi những gì nhà cung cấp trả về |
| không có `gen_ai.response.id` | không có cách khớp span với log riêng của nhà cung cấp | ghi response id |

### Why the content line is the one to fight over

Các quy ước nói instrumentation không nên mặc định thu thập đầu vào và đầu ra. Thu thập là opt-in qua một biến môi trường, và mẫu production lưu nội dung trong kho log riêng và ghi một con trỏ trên span. Một prompt có số thẻ trong một backend trace là một rò rỉ dữ liệu với policy lưu giữ bạn không chọn.

### Why the renamed attribute will come back

Các quy ước GenAI vẫn được đánh dấu đang phát triển, và chúng đã đổi tên thuộc tính trước. Ghim phiên bản quy ước bạn phát, đặt stability opt-in, và kiểm thử các tên thuộc tính của span được phát, nếu không lần nâng cấp SDK tiếp theo mở lại đánh giá này.

## Follow-ups

- **Level 3:** Tại sao cha trống quan trọng hơn kind sai? Expected: không có cha, span mồ côi, trace không còn là một cây, và bạn không thể thấy bước nào thực hiện lời gọi.
- **Level 3:** Nhóm cần văn bản prompt để gỡ lỗi các thất bại. Bạn đưa ra gì? Expected: lưu prompt trong một kho riêng có kiểm soát truy cập và đặt một reference id trên span, là mẫu các quy ước khuyến nghị cho production.
- **Level 4:** Bạn giữ tên thuộc tính cũ khỏi trở lại sau một nâng cấp như thế nào? Expected: ghim phiên bản quy ước, đặt biến stability opt-in, và thêm một kiểm thử assert các tên thuộc tính trên các span được phát.

## Wrong answers

- "Nó có trace id và tên mô hình, nên ổn." Chỉ một trace id không liên kết span với cha, và một tên mô hình không có nhà cung cấp không thể quy thuộc.
- "Giữ prompt trong span, nó hữu ích." Các prompt mang dữ liệu cá nhân và bí mật vào một kho người vận hành đọc. Mặc định tắt, và production lưu nội dung ngoài span.
- "Hai tên token là từ đồng nghĩa." Các backend đọc tên hiện tại. Tên cũ rơi vào một thuộc tính không biết, và dashboard token không hiển thị gì.

## Taught in

[Bài học OpenTelemetry GenAI](../../../phases/13-tools-and-protocols/20-opentelemetry-genai/) liệt kê các thuộc tính bắt buộc, [bài học quy ước](../../../phases/14-agent-engineering/23-otel-genai-conventions/) đưa ra quy tắc thu thập nội dung, và [bài học capstone trace](../../../phases/19-capstone-projects/28-observability-otel-traces/) lưu ý thuộc tính token đổi tên.
