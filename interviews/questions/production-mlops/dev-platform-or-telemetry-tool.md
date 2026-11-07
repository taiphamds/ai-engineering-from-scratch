---
id: dev-platform-or-telemetry-tool
title: Pick an observability stack without locking in
card: production-mlops
kind: tradeoff
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [observability, opentelemetry, evals, vendor-lock-in]
minutes: 12
lessons: [phases/17-infrastructure-and-production/13-llm-observability, phases/14-agent-engineering/24-agent-observability-platforms]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/keep-every-error-trace, production-mlops/five-minute-detection]
updated: 2026-11-03
---

Nhóm của bạn phải chọn một stack quan sát cho một dịch vụ mô hình mới. Một nửa nhóm muốn một nền tảng tất cả trong một với đánh giá, các phiên bản prompt và phát lại phiên. Nửa kia muốn một gateway mỏng ghi mọi lời gọi và không gì hơn. Bạn quyết định như thế nào, và mẫu nào cho phép tránh lựa chọn?

## Short answer

Quyết định trên bốn trục: framework bạn chạy trên, giấy phép bạn có thể chấp nhận, ngân sách, và liệu bạn phải tự host. Một nền tảng phát triển đóng gói phù hợp một nhóm lặp cải tiến prompt và cần đánh giá gắn với trace. Một gateway hoặc công cụ telemetry phù hợp một nhóm cần instrumentation di chuyển được không phụ thuộc framework. Mẫu tránh lựa chọn là phát các span OpenTelemetry với các quy ước GenAI từ mọi lời gọi và gửi chúng đến hơn một nơi: một gateway cho hằng ngày, một nền tảng đánh giá cho suy giảm, và một kho lưu trữ cho phân tích dài hạn.

## Full answer

### Two categories of tool

Các nền tảng phát triển đóng gói khả năng quan sát với đánh giá, quản lý prompt, quản lý phiên bản tập dữ liệu và phát lại phiên. Bạn chạy thí nghiệm, so sánh prompt và kiểm thử hồi quy một prompt mới đối chiếu các bên thắng cũ. Các công cụ gateway và telemetry ghi prompt, phản hồi, token, độ trễ, mô hình và chi phí, và chúng dừng ở đó.

### The four axes

| Trục | Câu hỏi |
|---|---|
| stack | một framework, một SDK thô, hoặc nhiều nhà cung cấp |
| giấy phép | chỉ mã nguồn mở, một giấy phép source-available, hoặc thương mại |
| ngân sách | một tầng miễn phí, một gói nhóm, hoặc một hợp đồng doanh nghiệp |
| tự host | bắt buộc, được hoan nghênh, hoặc không bao giờ |

### The trap

Instrumentation bên trong framework agent gắn trace với framework đó. Instrumentation ở lớp HTTP hoặc SDK di chuyển được, nên một thay đổi framework hoặc một framework thứ hai không làm mất lịch sử.

### The glue pattern

1. Phát các span OpenTelemetry với các quy ước GenAI từ mọi lời gọi mô hình.
2. Định tuyến chúng đến một gateway hoặc công cụ telemetry cho góc nhìn hằng ngày.
3. Gửi một bản sao đến một nền tảng đánh giá cho suy giảm.
4. Lưu trữ chúng trong một data lake cho phân tích dài hạn.

Mọi công cụ đọc các quy ước có thể đọc cùng span, nên stack là một quyết định định tuyến, không phải viết lại.

### What to insist on in either case

- Các phiên bản prompt gắn với trace. Khi production suy giảm, bạn phải có thể chia đôi tìm thay đổi prompt gây ra nó.
- Một chiến lược đánh giá. Tracing không có đánh giá là ghi log đắt tiền.
- Một policy lấy mẫu ở quy mô lớn, vì giữ đầy đủ ở khối lượng lớn đắt hơn các lời gọi nó ghi.

## Follow-ups

- **Level 3:** Tại sao instrument ở lớp SDK thay vì trong framework? Expected: các hook framework gắn bạn với framework. Lớp SDK tiếp tục hoạt động khi bạn thay framework hoặc thêm một framework thứ hai.
- **Level 3:** Điều gì hỏng khi các phiên bản prompt không gắn với trace? Expected: khi production suy giảm, bạn không thể chia đôi tìm thay đổi prompt gây ra nó.
- **Level 4:** Bạn gửi cùng span đến hai backend. Bạn kiểm tra gì để chúng đồng ý? Expected: cùng phiên bản quy ước, cùng các quy tắc lấy mẫu trên cả hai exporter, và một nguồn sự thật cho quy chi phí, để hai dashboard không hiển thị hai hóa đơn.

## Wrong answers

- "Chọn công cụ có nhiều tính năng nhất." Các tính năng bạn không dùng tốn tiền và ràng buộc bạn. Chọn theo stack, giấy phép, ngân sách và hosting.
- "Tracing đủ, đánh giá có thể đến sau." Trace không có đánh giá là log có giá. Một suy giảm ẩn trong chúng đến khi một người dùng báo cáo.
- "Gateway ghi mọi lời gọi, nên bỏ nền tảng." Một proxy thấy các lời gọi, không phải các bước agent hoặc phiên. Nó bỏ lỡ các trace nhiều bước mà một suy giảm agent cần.

## Taught in

[Bài học stack quan sát](../../../phases/17-infrastructure-and-production/13-llm-observability/) đưa ra hai nhóm, bốn trục và mẫu kết nối, và [bài học quan sát agent](../../../phases/14-agent-engineering/24-agent-observability-platforms/) cảnh báo về tracing không có đánh giá.
