---
id: two-provider-minimum
title: Survive a provider outage without a redeploy
card: cost-capacity
kind: design
level: 4
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [failover, gateway, model-alias, lock-in]
minutes: 18
lessons: [phases/17-infrastructure-and-production/01-managed-llm-platforms, phases/13-tools-and-protocols/21-llm-routing-layer, phases/17-infrastructure-and-production/19-ai-gateways, phases/11-llm-engineering/15-prompt-caching]
manuals: []
practice: []
cheatsheet: [llm-routing-gateways, managed-llm-platforms]
related: [cost-capacity/gateway-latency-budget, cost-capacity/cache-break-even]
updated: 2026-11-03
---

CTO muốn mọi lời gọi mô hình quan trọng với sản phẩm sống sót qua một lần gián đoạn hoàn toàn của một nhà cung cấp, không triển khai lại và không tăng gấp đôi hóa đơn. Thiết kế cấu hình: nhà cung cấp thứ hai nằm ở đâu, một request di chuyển giữa hai bên như thế nào, điều gì phải giống hệt ở cả hai phía, và thiết kế tốn gì.

## Short answer

Đặt một gateway trước ứng dụng với một model alias cho mỗi trường hợp sử dụng, một danh sách ưu tiên hai nhà cung cấp sau mỗi alias, và một quy tắc dự phòng khi lỗi máy chủ và giới hạn tốc độ với một ngân sách retry có giới hạn. Giữ bố trí tiền tố có thể cache, thứ tự công cụ và schema đầu ra giống hệt trên cả hai nhà cung cấp, để một request chuyển sang dự phòng có thể hit cache của nhà cung cấp thứ hai khi tiền tố đó được cache ở đó, và vẫn phân tích cú pháp được. Phần chi phí tăng ở trạng thái ổn định nhỏ, vì gateway gửi lưu lượng đến nhà cung cấp ưu tiên hầu hết thời gian, và giá thực được trả bằng các đánh giá và kiểm thử prompt chạy hai lần.

## Full answer

### Why two

Bài học về các nền tảng được quản lý lập luận rằng khóa vào một nền tảng khóa bạn ra khỏi phần lớn frontier, vì mô hình mạnh nhất di chuyển giữa các nhà cung cấp mỗi vài tháng, và rằng một lần gián đoạn khu vực của một nền tảng là một lần gián đoạn sản phẩm. Chính sách của nó là tối thiểu hai nhà cung cấp cho bất kỳ lời gọi nào quan trọng với sản phẩm. Chi phí tăng không đáng kể vì gateway định tuyến đến lựa chọn tốt hơn trong vận hành bình thường, và mức tăng tính sẵn sàng trong một lần gián đoạn mang tính quyết định.

### The gateway in front

Bài học về lớp định tuyến đưa ra hình dạng. Mọi người nói một API schema, vì vậy gateway cung cấp một endpoint và dịch ở phía sau nó. Mã của bạn nêu một alias chẳng hạn `our_smart_model`, và gateway ánh xạ alias đến một mô hình cụ thể trên một nhà cung cấp cụ thể. Sau mỗi alias nằm một danh sách ưu tiên: nhà cung cấp chính, rồi nhà cung cấp thứ hai khi có một lỗi máy chủ hoặc một giới hạn tốc độ, rồi từ chối. Các lần retry tính vào một ngân sách, để một nhà cung cấp chính đang lỗi không thể nhân chi phí. Bài học gateway thêm phần còn lại mà lớp phụ trách: giới hạn tốc độ theo tenant, thông tin xác thực lấy từ một vault lúc chạy, khả năng quan sát và guardrail.

### What the two sides share

1. **Bố trí tiền tố có thể cache.** Quy tắc cho dự phòng xuyên nhà cung cấp trong bài học prompt caching là giữ bố trí giống hệt, để bất kỳ hit nào hoạt động ở cả hai phía. Các phần ổn định trước, tin nhắn người dùng cuối.
2. **Thứ tự tuần tự hóa công cụ.** Một danh sách công cụ bị xáo lại phá cache trên mọi request.
3. **Schema đầu ra và bộ phân tích cú pháp.** Một lần chuyển dự phòng trả về một hình dạng mà ứng dụng không thể phân tích cú pháp vẫn là một lần gián đoạn.
4. **Tập đánh giá.** Cả hai nhà cung cấp chạy cùng bộ kiểm thử hồi quy trên mọi thay đổi prompt, nếu không đường dự phòng thay đổi dần mà không ai nhận ra.

### What it costs

- Hai bộ đánh giá và kiểm thử hồi quy prompt mỗi bản phát hành.
- Các cache lạnh trên nhà cung cấp thứ hai khi gián đoạn bắt đầu. Các request đầu trả khoản phí ghi thêm, và kích thước khối tối thiểu có thể cache phải được đáp ứng ở cả hai phía.
- Độ trễ riêng của gateway, từ vài mili giây đến hàng chục, tùy nhóm của nó.
- Một dòng log mỗi lời gọi nêu nhà cung cấp đã phục vụ nó, để hóa đơn được chia và tỷ lệ chuyển dự phòng hiện rõ.

### Prove it before the outage

Đưa vào các lỗi giới hạn tốc độ từ nhà cung cấp chính trong staging và theo dõi lưu lượng di chuyển. Đo thời gian đến phản hồi thành công đầu tiên trên nhà cung cấp thứ hai, và so sánh thời gian token đầu tiên cùng các lần đọc cache trong khi chuyển dự phòng với trạng thái ổn định.

## Follow-ups

- **Level 3:** Tại sao nhà cung cấp thứ hai tốn ít trong trạng thái ổn định? Expected: gateway gửi hầu hết lưu lượng đến nhà cung cấp ưu tiên. Bên thứ hai chỉ mang lưu lượng trong các sự cố và diễn tập.
- **Level 4:** Điều gì hỏng trước trên một lần chuyển dự phòng không có bố trí tiền tố giống hệt? Expected: cache trên nhà cung cấp thứ hai miss trên mọi request, vì vậy giờ gián đoạn tốn giá đầy đủ và thời gian token đầu tiên tăng vọt.
- **Level 4:** Những lỗi nào kích hoạt chuyển dự phòng, và những lỗi nào không? Expected: lỗi máy chủ, giới hạn tốc độ và hết thời gian ở nhà cung cấp chính. Không phải một lần chặn guardrail hoặc một phản hồi sai định dạng, sẽ thất bại theo cùng cách trên nhà cung cấp thứ hai.

## Wrong answers

- "Hai nhà cung cấp tăng gấp đôi hóa đơn." Nhà cung cấp thứ hai chỉ mang lưu lượng trong các sự cố. Gateway định tuyến đến bên ưu tiên trong phần thời gian còn lại.
- "Điều chỉnh một prompt riêng cho mỗi nhà cung cấp." Khi đó mọi thay đổi được phát hành hai lần và đường dự phòng thay đổi dần. Giữ một bố trí và một tập đánh giá cho cả hai.
- "Chuyển dự phòng trên bất kỳ lỗi nào." Một lần chặn guardrail hoặc một lỗi schema lặp lại trên nhà cung cấp thứ hai và tăng gấp đôi chi phí của một request nên thất bại nhanh.

## Taught in

[Bài học các nền tảng được quản lý](../../../phases/17-infrastructure-and-production/01-managed-llm-platforms/) đặt chính sách hai nhà cung cấp, [bài học lớp định tuyến](../../../phases/13-tools-and-protocols/21-llm-routing-layer/) đưa ra các alias và chuỗi dự phòng, [bài học AI gateway](../../../phases/17-infrastructure-and-production/19-ai-gateways/) liệt kê các tính năng gateway, và [bài học prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) giữ bố trí có thể cache giống hệt giữa các nhà cung cấp.
