---
id: cache-break-even
title: Pick the cache lifetime for a batch of code reviews
card: prompting-structured-output
kind: estimate
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [system-design, screen]
tags: [prompt-caching, cost, ttl, break-even]
minutes: 10
lessons: [phases/11-llm-engineering/15-prompt-caching]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [prompting-structured-output/timestamp-kills-the-cache]
updated: 2026-11-03
---

Công việc batch của bạn gửi cùng rubric 15,000 token với mỗi trong hai mươi bài đánh giá mã, trải qua 40 phút theo các cụm không đều, và một số khoảng yên giữa các cụm dài hơn cache ngắn. Nhà cung cấp tính phí ghi ở 1.25 lần giá đầu vào cho cache năm phút và ở 2 lần giá đầu vào cho cache một giờ, và tính phí đọc ở một phần mười giá đầu vào. Bạn chọn cache nào, và chỉ ra điểm hòa vốn.

## Short answer

Cache năm phút tự trả chi phí ở lần đọc đầu: một lần ghi tốn 1.25 lần và một lần đọc 0.1 lần giá đầu vào bình thường, nên một ghi cộng một đọc trung bình 0.675 lần, tiết kiệm 32 phần trăm, và một ghi cộng mười đọc trung bình 0.205 lần, tiết kiệm 80 phần trăm. Mỗi lần đọc làm mới thời hạn năm phút, nên cache năm phút chỉ hết hạn trong một khoảng trống dài hơn năm phút. Batch này có các khoảng như vậy, nên cache một giờ phù hợp; ghi của nó tốn 2 lần giá đầu vào và chỉ cần hai lần đọc để có lợi, và hai mươi bài đánh giá cho nhiều hơn xa. Quy tắc kinh nghiệm là cache bất cứ thứ gì được tái sử dụng ít nhất ba lần trong thời hạn.

## Full answer

### The arithmetic

| Trường hợp | Chi phí mỗi yêu cầu đối chiếu không cache |
|---|---|
| Một ghi, cache năm phút | 1.25 |
| Một đọc | 0.1 |
| Một ghi cộng một đọc, lấy trung bình | 0.675, tiết kiệm 32 phần trăm |
| Một ghi cộng mười đọc, lấy trung bình | 0.205, tiết kiệm 80 phần trăm |
| Một ghi, cache một giờ | 2, nên hai đọc để hòa vốn |

### The lifetime decides it

Mỗi lần đọc làm mới thời hạn năm phút. Nếu các bài đánh giá đến đều qua 40 phút, mọi khoảng giữ trong năm phút, mục không bao giờ hết hạn, và cache năm phút thắng với ghi rẻ hơn. Nếu một số khoảng vượt năm phút, như trong batch này, mỗi khoảng đó tốn một ghi mới ở giá cộng thêm, và cache một giờ giữ toàn bộ batch cho một ghi. Nếu thay vào đó các bài đánh giá đến thành một đợt vài bài trong một phút rồi một giờ nhàn rỗi, mỗi đợt vừa cache năm phút và ghi rẻ hơn thắng. Chọn từ các khoảng giữa yêu cầu, không phải từ tổng số.

### Prove it on the response

Đọc các trường usage: yêu cầu đầu của bài học báo cáo 15,023 token được ghi ở 1.25 lần, và yêu cầu thứ hai báo cáo cùng số được đọc ở 0.1 lần với không ghi. Trong production, đặt cổng deploy trên tỷ phần đọc trên 80 phần trăm sau warmup, và chia dashboard chi phí thành token cache và không cache.

### Other provider shapes

Nhà cung cấp tự động giảm 50 phần trăm giá đọc không có phí cộng thêm, đến một giờ trên cơ sở best-effort, nên công việc duy nhất là một prefix ổn định. Đối tượng cache tường minh trên nhà cung cấp thứ ba được tính phí lưu trữ và đọc ở khoảng 25 phần trăm giá đầu vào; nó phù hợp tái sử dụng một prompt khổng lồ qua nhiều ngày.

## Follow-ups

- **Level 3:** Tại sao cache năm phút hòa vốn ở lần đọc đầu? Expected: ghi tốn 1.25 lần và đọc 0.1 lần, nên hai yêu cầu trung bình 0.675 lần chi phí không cache.
- **Level 3:** Cache một giờ cần gì để có lợi? Expected: hai đọc, vì ghi tốn 2 lần giá đầu vào.
- **Level 4:** Các bài đánh giá đến theo đợt vài bài trong một phút, rồi không gì trong một giờ. Đáp án có thay đổi? Expected: có; mỗi đợt sống trong một cache năm phút, nên ghi rẻ hơn thắng, và cache một giờ sẽ trả ghi 2 lần cho tái sử dụng không bao giờ đến.
- **Level 4:** Bạn xác minh tiết kiệm trong production thay vì trên giấy như thế nào? Expected: đọc các trường token tạo cache và đọc cache trên mỗi phản hồi, đặt cổng deploy trên tỷ phần đọc trên 80 phần trăm sau warmup, và chia dashboard thành token cache và không cache.

## Wrong answers

- "Luôn chọn cache dài hơn cho chắc." Ghi của nó tốn 2 lần giá đầu vào so với 1.25; với tái sử dụng trong năm phút, cache ngắn hơn rẻ hơn.
- "Phí cộng thêm ghi khiến caching lỗ cho các công việc ngắn." Một ghi cộng một đọc đã tiết kiệm 32 phần trăm trên cache năm phút.
- "Cache cả thông điệp người dùng." Nó khác trên mọi yêu cầu, nên không bao giờ cache hit; bố trí để nó dưới breakpoint.

## Taught in

Bài học [prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) đưa ra bảng nhà cung cấp, phép tính hòa vốn và các trường usage.
