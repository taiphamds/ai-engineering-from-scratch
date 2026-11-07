---
id: renamed-token-attribute
title: The token dashboard reads zero after an SDK upgrade
card: production-mlops
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [debugging, screen]
tags: [opentelemetry, genai-conventions, dashboards, upgrades]
minutes: 8
lessons: [phases/19-capstone-projects/28-observability-otel-traces, phases/14-agent-engineering/23-otel-genai-conventions]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/read-this-span, production-mlops/prompts-in-span-attributes]
updated: 2026-11-03
---

Sau một nâng cấp thường lệ của SDK tracing, các bảng sử dụng token hiển thị không cho mọi mô hình, trong khi các bảng số yêu cầu và độ trễ trông bình thường. Không gì khác được triển khai. Bạn xem ở đâu trước?

## Short answer

Xem các tên thuộc tính trên các span dịch vụ phát bây giờ. Các quy ước GenAI vẫn được đánh dấu đang phát triển, và chúng đã đổi tên thuộc tính trước: số token đầu vào chuyển từ `gen_ai.usage.prompt_tokens` sang `gen_ai.usage.input_tokens`. Nếu SDK phát tên mới và dashboard truy vấn tên cũ, mọi bảng token đọc không trong khi số đếm và độ trễ tiếp tục hoạt động. Ghim phiên bản quy ước bạn phát, và đặt stability opt-in để các tên không di chuyển bên dưới bạn.

## Full answer

### Why only the token panels broke

Số yêu cầu đến từ số span, và độ trễ đến từ thời gian bắt đầu và kết thúc span. Không cái nào phụ thuộc một tên thuộc tính. Một bảng token lấy tổng một thuộc tính theo khóa. Một khóa đổi tên khiến tổng bằng không, và không gì báo lỗi.

### Confirm it in one minute

Lấy một span thô sau nâng cấp và một span trước. So sánh các khóa thuộc tính. Khóa cũ mất, và khóa mới mang các con số.

### Two fixes, in order

1. Thay các truy vấn dashboard sang khóa mới. Trong chuyển tiếp, lấy tổng cả hai khóa để các span cũ và mới hiển thị.
2. Dừng các tên di chuyển: ghim phiên bản quy ước trong bộ phát, đặt `OTEL_SEMCONV_STABILITY_OPT_IN`, và kiểm tra các tên trên mọi nâng cấp SDK.

### Prevent the repeat

Các kiểm thử của capstone assert các thuộc tính chuẩn có mặt trên các span được phát. Chạy chúng trên mọi nâng cấp phụ thuộc. Thêm một cảnh báo cho hình dạng sự cố này: tổng token bằng không trong khi số yêu cầu trên không.

## Follow-ups

- **Level 2:** Tại sao các bảng số đếm và độ trễ tiếp tục hoạt động? Expected: chúng dùng số span và thời gian span, không phụ thuộc một tên thuộc tính.
- **Level 3:** Bạn bắt lần đổi tên tiếp theo trước production như thế nào? Expected: một kiểm thử trên các span được phát assert các tên thuộc tính chuẩn, chạy trên mọi nâng cấp phụ thuộc.
- **Level 3:** Dashboard có nên đọc cả tên cũ và mới? Expected: có cho một cửa sổ chuyển tiếp, như tổng cả hai. Sau đó bỏ tên cũ, để một suy giảm tương lai giữ nhìn thấy.
- **Level 4:** Backend ánh xạ các thuộc tính vào schema riêng. Điều đó có bảo vệ bạn? Expected: chỉ khi ánh xạ theo cùng phiên bản quy ước. Một ánh xạ xây cho tên cũ hiển thị cùng số không, nên kiểm thử đường từ đầu đến cuối.

## Wrong answers

- "Các mô hình ngừng báo cáo usage." Các phản hồi nhà cung cấp không thay đổi. Bộ phát span thay đổi.
- "Backend mất dữ liệu trong nâng cấp." Các bảng độ trễ chứng minh span đến. Chỉ một thuộc tính thiếu từ góc nhìn của truy vấn.
- "Rollback SDK và ở lại đó." Một phiên bản quy ước được ghim và một kiểm thử cho phép bạn nâng cấp có chủ đích thay vì không bao giờ.

## Taught in

[Bài học capstone trace](../../../phases/19-capstone-projects/28-observability-otel-traces/) cảnh báo các quy ước đã đổi tên thuộc tính và bảo bạn ghim phiên bản, và [bài học quy ước](../../../phases/14-agent-engineering/23-otel-genai-conventions/) đưa ra stability opt-in.
