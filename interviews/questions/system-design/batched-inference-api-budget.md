---
id: batched-inference-api-budget
title: Design a chat API for ten thousand daily users
card: system-design
kind: design
level: 3
roles: [applied-ai-engineer, inference-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [llm-api, gateway, semantic-cache, observability, capacity]
minutes: 25
lessons: [phases/11-llm-engineering/13-production-app, phases/10-llms-from-scratch/13-building-complete-llm-pipeline]
manuals: []
practice: []
cheatsheet: [production-llm-app, llm-cost-caching]
related: [system-design/llm-cost-projection, system-design/streaming-and-fallback, system-design/demo-to-product-signals]
updated: 2026-11-03
---

Thiết kế dịch vụ phía sau một sản phẩm chat với 10,000 người dùng hoạt động hàng ngày gửi khoảng 5 truy vấn mỗi người, với khoảng 1,500 token đầu vào và 400 token đầu ra mỗi truy vấn. Người dùng phải thấy phản hồi bắt đầu nhanh, đuôi phải giữ bị chặn, và sản phẩm có một mục tiêu chi phí đơn vị. Trình bày đường yêu cầu, các thành phần, các ngân sách bạn giữ cho từng thành phần, và cách bạn sẽ mở rộng.

## Short answer

Yêu cầu đi vào qua một gateway xác thực và giới hạn tốc độ theo từng người dùng, đi qua các guardrail đầu vào, được khớp với một cache ngữ nghĩa, và khi trượt thì đến mô hình với streaming, rồi qua các guardrail đầu ra, một bộ ghi đánh giá và một bộ theo dõi chi phí. Các ngân sách là trung vị dưới 2s, p99 dưới 10s, tỷ lệ cache hit trên 30%, tỷ lệ chặn guardrail dưới 5%, và chi phí mỗi yêu cầu dưới $0.01. Ở 50,000 truy vấn một ngày, điều này chạy trên vài server async phía sau một bộ cân bằng tải; các server bị giới hạn bởi I/O, nên một tiến trình async giữ một trăm yêu cầu đồng thời trở lên và mở rộng nghĩa là thêm server, không phải thêm core.

## Full answer

### The path

Gateway cho xác thực, các giới hạn tốc độ 10-50 yêu cầu một phút theo từng người dùng và CORS; các guardrail đầu vào cho các mẫu injection và dữ liệu cá nhân; một bộ định tuyến prompt chọn template và phiên bản; một cache ngữ nghĩa được khóa theo embedding truy vấn với một ngưỡng tương đồng và một thời gian sống; lệnh gọi mô hình với streaming và một chuỗi fallback; các guardrail đầu ra; một bộ ghi đánh giá; một bộ theo dõi chi phí; một phản hồi server-sent events. Bảy thành phần, mỗi thành phần là một phần đã biết; kỹ thuật nằm ở kết nối và các ngân sách.

### Budgets

| Chỉ số | Mục tiêu | Tại sao |
|---|---|---|
| Độ trễ trung vị | Dưới 2s | Trải nghiệm điển hình |
| Độ trễ p99 | Dưới 10s | Đuôi thúc đẩy rời bỏ |
| Tỷ lệ cache hit | Trên 30% | Tiết kiệm chi phí trực tiếp |
| Tỷ lệ chặn guardrail | Dưới 5% | Cao hơn nghĩa là dương tính giả |
| Chi phí mỗi yêu cầu | Dưới $0.01 | Kinh tế đơn vị |

Streaming đặt token đầu trong ngân sách trung vị ngay cả khi câu trả lời đầy đủ mất vài giây. Các giới hạn token tối đa trên đầu vào và đầu ra chặn cả chi phí lẫn đuôi. Mọi lệnh gọi bên ngoài có một timeout.

### Load and capacity

Lưu lượng là 50,000 truy vấn một ngày, và với tỷ lệ cache hit đã đo khoảng 32,500 đến mô hình. Đỉnh quan trọng hơn trung bình; định cỡ cho phút bận nhất. Các server chờ I/O mạng, nên một tiến trình async phục vụ 100+ yêu cầu đồng thời và một máy với bốn worker phục vụ 400+. Bảng mở rộng của bài học đặt tầng này ở vài server async với một cache và một hàng đợi, cho khoảng $500 một tháng hạ tầng, với hóa đơn mô hình thêm bên trên. Connection pooling tới provider tránh một TLS handshake mới mỗi yêu cầu, tốn 100-200ms. Công việc không tương tác, như tóm tắt, đi vào một hàng đợi với các worker và một id công việc mà client thăm dò.

### Observability

Mọi yêu cầu ghi một dòng nhật ký có cấu trúc với id yêu cầu, người dùng, template và phiên bản, mô hình, số token đầu vào và đầu ra, độ trễ, kết quả cache, các kết quả guardrail và chi phí. Các trace qua các thành phần cho thấy thời gian đã đi đâu. Năm con số trong bảng nằm trên một dashboard.

### If the model is self-hosted

Giai đoạn phục vụ của bài học pipeline thêm continuous batching, speculative decoding và đẩy KV cache ra, với trọng số được lượng tử hóa để phục vụ và cổng đánh giá chạy lại trên mô hình được lượng tử hóa. Cùng gateway, cache và các guardrail nằm phía trước nó.

### Before launch

Danh sách kiểm tra triển khai có mười lăm mục; những mục mọi người bỏ qua là các giới hạn tốc độ theo từng người dùng, các giới hạn token tối đa, một health endpoint báo trạng thái phụ thuộc, các timeout trên mọi lệnh gọi bên ngoài, và một kiểm thử tải với 100 người dùng đồng thời.

## Follow-ups

- **Level 3:** Một người dùng dán một tài liệu dài hơn cửa sổ ngữ cảnh rất nhiều. Điều đó được bắt ở đâu? Expected: tại giới hạn token đầu vào tối đa trước lệnh gọi mô hình, với một lỗi rõ ràng, không phải tại provider.
- **Level 3:** Tại sao chi phí mỗi người dùng quan trọng khi chi phí mỗi yêu cầu đã dưới mục tiêu? Expected: một ít người dùng nặng chi phối hóa đơn; theo dõi theo từng người dùng và một trần hàng ngày chuyển họ sang một mô hình rẻ hơn hoặc dừng họ.
- **Level 4:** Provider có một sự cố khu vực trong đỉnh hàng ngày. Trình bày đường yêu cầu. Expected: backoff và thử lại trên chính, đi xuống chuỗi tới một mô hình thứ hai, rồi các câu trả lời được cache cho các truy vấn lặp, rồi một thông điệp không khả dụng; bộ theo dõi chi phí cho thấy giá của fallback và dashboard cho thấy bước đã trả lời.
- **Level 4:** Bạn chứng minh dịch vụ đạt các ngân sách trước người dùng đầu tiên bằng cách nào? Expected: một kiểm thử tải ở 100 người dùng đồng thời đối với ngăn xếp staging với các chỉ số dashboard làm tiêu chí đạt, cùng một lần chạy shadow các prompt trên lưu lượng được ghi nhật ký.

## Wrong answers

- "Mở rộng các server mô hình trước." Dịch vụ bị giới hạn bởi I/O ở lưu lượng này; gateway, cache và các server async là thiết kế, và mô hình là một phụ thuộc.
- "Bỏ cache; mô hình là sản phẩm." Một phần ba lưu lượng lặp lại, và cache là khoản tiết kiệm đơn lẻ lớn nhất trong hóa đơn.
- "p99 là một vấn đề của nhà cung cấp." Các timeout, token tối đa, streaming và chuỗi fallback là những gì chặn đuôi ở phía bạn.

## Taught in

[Bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) cung cấp kiến trúc, các ngân sách, bảng mở rộng và danh sách kiểm tra, và [bài học pipeline LLM hoàn chỉnh](../../../phases/10-llms-from-scratch/13-building-complete-llm-pipeline/) mô tả giai đoạn phục vụ phía sau một mô hình tự lưu trữ.
