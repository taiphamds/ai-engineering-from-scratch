---
id: prompts-in-span-attributes
title: Should the full prompt live on the span
card: production-mlops
kind: tradeoff
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [tracing, pii, content-capture, genai-conventions]
minutes: 8
lessons: [phases/14-agent-engineering/23-otel-genai-conventions, phases/13-tools-and-protocols/20-opentelemetry-genai]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/read-this-span, production-mlops/renamed-token-attribute]
updated: 2026-11-03
---

Backend trace của bạn có thể lưu toàn bộ prompt và completion trên mọi span mô hình. Nhóm hỗ trợ muốn bật, vì họ gỡ lỗi ticket từ trace. Nhóm bảo mật muốn tắt. Bạn quyết định gì, và bạn vẫn cấp cho hỗ trợ những gì họ cần như thế nào?

## Short answer

Giữ thu thập nội dung tắt, là mặc định các quy ước khuyến nghị. Lưu prompt và completion trong kho riêng, với kiểm soát truy cập và thời hạn lưu giữ, và ghi một reference id trên span. Hỗ trợ theo id từ trace đến nội dung, và backend trace không bao giờ giữ dữ liệu khách hàng.

## Full answer

### What the default is

Mặc định một span mang thời gian và chỉ số, không phải prompt hoặc completion. Thu thập nội dung là opt-in qua biến stability opt-in và các biến nội dung riêng. Khi bật, nội dung đến `gen_ai.input.messages`, `gen_ai.output.messages` và `gen_ai.system_instructions`, hoặc trong các sự kiện nội dung trên span.

### What goes wrong when it is on

Các prompt mang dữ liệu cá nhân, bí mật và tài liệu khách hàng. Người vận hành đọc trace, và backend trace đặt thời hạn lưu giữ riêng. Bài học quy ước liệt kê "thu thập toàn bộ prompt trong span" là cách đầu tiên mẫu thất bại. Một backend trace cũng là một mục tiêu hấp dẫn, vì nó giữ mọi thứ ở một nơi.

### The pattern that works

Lưu nội dung ngoài trace: trong kho log hoặc object store, dưới kiểm soát truy cập, log kiểm toán và thời hạn lưu giữ riêng. Đặt một reference id trên span. Bài học gọi đây là mẫu tham chiếu bên ngoài, và nó cũng là phòng vệ chống đầu độc nội dung, vì văn bản bị đầu độc không bao giờ đi vào kho telemetry.

### What support gets

Cùng đường gỡ lỗi với một bước bổ sung: trace, span, reference id, kho nội dung. Kho có thể che các mẫu hình đã biết khi ghi và ghi log mọi lần đọc. Phần lớn ticket không cần nội dung chút nào, vì span đã cho thấy mô hình, token, độ trễ, các lời gọi công cụ và trạng thái.

### What you give up

Một góc nhìn một lần nhấp của prompt trong UI trace. Đó là cái giá, và nó nhỏ cạnh một backend trace đầy dữ liệu khách hàng.

## Follow-ups

- **Level 2:** Các span nào có thể mang nội dung thô khi thu thập được bật? Expected: không span nào trong production. Giữ một quy tắc, chỉ tham chiếu, để không ai phải quyết định theo span.
- **Level 3:** Một nhà phát triển bật thu thập trong staging một ngày. Rủi ro là gì? Expected: staging thường phát lại các prompt production, và backend giữ chúng trong thời hạn lưu giữ. Dùng prompt tổng hợp hoặc làm sạch trước xuất.
- **Level 3:** Bạn giữ kho nội dung khỏi thành cùng rò rỉ như thế nào? Expected: truy cập theo vai trò, một log kiểm toán các lần đọc, một thời hạn lưu giữ, và che các mẫu hình đã biết trước khi ghi.

## Wrong answers

- "Bật nó, backend trace nội bộ." Các người vận hành nội bộ đọc trace, và thời hạn lưu giữ của backend không phải policy của bạn.
- "Lưu một hash của prompt trên span." Một hash cho thấy một lần lặp nhưng không cho hỗ trợ gì để đọc. Một reference id vào một kho có kiểm soát làm cả hai.
- "Giữ nội dung trên span và loại dữ liệu cá nhân bằng một regex." Các mẫu hình bỏ lỡ, và span vẫn là sai kho với sai thời hạn lưu giữ.

## Taught in

[Bài học quy ước](../../../phases/14-agent-engineering/23-otel-genai-conventions/) đặt quy tắc opt-in và mẫu lưu nội dung ngoài span, và [bài học OpenTelemetry GenAI](../../../phases/13-tools-and-protocols/20-opentelemetry-genai/) nêu các sự kiện nội dung.
