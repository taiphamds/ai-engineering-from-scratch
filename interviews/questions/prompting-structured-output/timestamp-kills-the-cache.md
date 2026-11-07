---
id: timestamp-kills-the-cache
title: Cache reads stay at zero on every request
card: prompting-structured-output
kind: debug
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, screen]
tags: [prompt-caching, prefix, cache-control, cost]
minutes: 8
lessons: [phases/11-llm-engineering/15-prompt-caching]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [prompting-structured-output/cache-break-even, prompting-structured-output/lost-in-the-middle-order, inference-serving/prefix-cache-order]
updated: 2026-11-03
---

Bạn đã bật prompt caching trên một system prompt 15,000 token. Trường usage cho số lần đọc cache giữ ở mức không trên mọi yêu cầu, trong khi token tạo cache bị tính phí mỗi lần. Bạn tìm gì, và theo thứ tự nào?

## Short answer

Một thứ gì đó phía trên điểm ngắt cache thay đổi trên mọi yêu cầu. Trước tiên tìm một timestamp hoặc một id yêu cầu ở đầu system prompt, sau đó các định nghĩa công cụ được tuần tự hóa theo một thứ tự thay đổi, rồi văn bản gần trùng lặp khác một byte giữa các đường mã, rồi một block dưới kích thước tối thiểu có thể cache. Cache chỉ khớp các tiền tố, nên token khác biệt đầu tiên biến mọi thứ sau nó thành một lần trượt.

## Full answer

### The invariant

Tất cả các nhà cung cấp đều cache tiền tố. Khi tiền tố của một yêu cầu khớp với một yêu cầu gần đây, nhà cung cấp phục vụ key và value cache đã lưu thay vì mã hóa lại các token, và tính phí một lần đọc bằng một phần đơn giá đầu vào. Nếu bất kỳ token nào khác, mọi thứ sau nó là một lần trượt. Các trường usage nói lên câu chuyện: số lượng tạo ở mỗi lần và số lượng đọc bằng không nghĩa là tiền tố chưa bao giờ khớp.

### The checklist, in order

1. **Một trường động ở đầu.** Thời gian hiện tại, một id yêu cầu hoặc một id phiên ở những dòng đầu của system prompt gây trượt trên mọi yêu cầu. Chuyển nó xuống dưới điểm ngắt cùng các trường theo từng yêu cầu khác.
2. **Đổi thứ tự công cụ.** Các công cụ được tuần tự hóa từ một dictionary có thể thay đổi thứ tự giữa các lần triển khai hoặc giữa các tiến trình; tuần tự hóa chúng theo một thứ tự ổn định.
3. **Văn bản gần trùng lặp.** Hai đường mã xây dựng prompt khác nhau một byte tạo ra hai tiền tố và không có lần trúng nào.
4. **Các block quá nhỏ.** Cache tường minh có ngưỡng sàn 1,024 token, 2,048 trên mô hình nhỏ; một block nhỏ hơn âm thầm không được cache.
5. **Trên nhà cung cấp tự động**, một trường user bị thay đổi là một phần của khóa cache, và tiền tố vẫn phải ổn định và trên 1,024 token.

### The layout that hits

System prompt, rồi các định nghĩa công cụ, rồi các ví dụ few-shot, rồi các tài liệu được truy xuất nếu chúng được dùng lại, rồi lịch sử đến lượt cuối, rồi thông điệp hiện tại, thứ không bao giờ được cache vì mỗi lần đều khác.

### Turn it into a test

Trong CI, xây dựng hai yêu cầu thông qua bộ dựng prompt production với cùng đầu vào người dùng, so sánh các tiền tố có thể cache của chúng, gửi cả hai, và khẳng định rằng số token đọc cache lớn hơn không ở lần thứ hai. Hai phần thân giống hệt nhau viết tay sẽ bỏ qua timestamp hoặc id yêu cầu mà bộ dựng thêm vào. Chia dashboard chi phí thành token đầu vào được cache và không được cache, nếu không thì sụt giảm lưu lượng trông như một thắng lợi của cache.

## Follow-ups

- **Level 2:** Bạn biến điều này thành một bài kiểm tra bằng cách nào? Expected: hai yêu cầu được bộ dựng prompt production xây dựng với cùng đầu vào người dùng, với một khẳng định rằng số token đọc cache lớn hơn không ở lần thứ hai; nếu chúng giữ ở mức không thì các khóa đang trôi dạt.
- **Level 2:** Timestamp chuyển đi đâu thay vào đó? Expected: xuống dưới điểm ngắt, cùng các trường theo từng yêu cầu khác như thông điệp user.
- **Level 3:** Block nằm dưới kích thước tối thiểu. Điều gì xảy ra? Expected: không có gì được cache và không có gì được báo cáo; ngưỡng sàn là 1,024 token, và 2,048 trên mô hình nhỏ.
- **Level 3:** Token đầu vào giảm sau thay đổi của bạn. Đó có phải bằng chứng nó hoạt động không? Expected: không; chia token đầu vào thành được cache và không được cache, nếu không thì sụt giảm lưu lượng trông như một thắng lợi của cache.

## Wrong answers

- "Caching là tự động, không có gì để cấu hình." Trên các nhà cung cấp tường minh, bạn đánh dấu block; trên nhà cung cấp tự động, tiền tố vẫn phải ổn định và trên 1,024 token, và một trường user hoặc thứ tự công cụ thay đổi phá vỡ nó.
- "Đặt thông điệp user đầu tiên để mô hình đọc nó sớm." Điều đó đặt phần duy nhất thay đổi lên trên mọi thứ khác, và cache không bao giờ trúng.
- "Kéo dài TTL lên một giờ, cache đang hết hạn." Việc hết hạn sẽ thể hiện thành các lần ghi sau những khoảng yên lặng, không phải trên mọi yêu cầu; TTL một giờ cũng tính phí 2x cho thao tác ghi.

## Taught in

Bài học [prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) cung cấp bất biến tiền tố, cách bố trí thân thiện với cache, các cạm bẫy và kiểm tra CI.
