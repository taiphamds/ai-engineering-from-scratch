---
id: semantic-threshold
title: A lower cache threshold hits more and answers wrong
card: cost-capacity
kind: tradeoff
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [system-design, ml-breadth]
tags: [semantic-cache, similarity-threshold, hit-rate, correctness]
minutes: 8
lessons: [phases/17-infrastructure-and-production/14-prompt-semantic-caching, phases/11-llm-engineering/11-caching-cost]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/two-cache-layers, cost-capacity/cache-break-even]
updated: 2026-11-03
---

Semantic cache của bạn phục vụ 20 phần trăm request ở một ngưỡng tương đồng 0.95. Một đồng đội hạ nó xuống 0.85 trong staging. Hit rate tăng lên 50 phần trăm, và một vài câu trả lời đã cache không phù hợp với câu hỏi được hỏi. Bạn phát hành ngưỡng nào, và bạn quyết định như thế nào?

## Short answer

Phát hành ngưỡng mà các hit sai của nó bạn có thể chịu được, và đo điều đó thay vì đoán. Một câu trả lời cache sai là một thất bại về tính đúng đắn mà người dùng thấy, trong khi một miss tốn một lời gọi mô hình. Giữ ngưỡng nghiêm ngặt trên đường chung, và chỉ hạ nó nơi các câu trả lời có thể thay thế cho nhau hoặc nơi một tuyên bố lưu ý được chấp nhận. Con số độ chính xác của một nhà cung cấp mô tả tần suất một hit phù hợp, không phải tần suất lưu lượng của bạn hit, vì vậy gán nhãn các cặp từ lưu lượng riêng của bạn ở cả hai ngưỡng.

## Full answer

### Two numbers that get confused

Hit rate là tỷ lệ request được phục vụ từ cache. Độ chính xác của một hit là liệu câu trả lời đã lưu có phù hợp với câu hỏi mới không. Bài học cảnh báo rằng tuyên bố độ chính xác của một nhà cung cấp mô tả tính đúng đắn của phép khớp, và rằng các hit rate production là telemetry cộng đồng trải từ khoảng 10 phần trăm trên chat mở đến khoảng 70 phần trăm trên hỗ trợ có cấu trúc.

### The cost of each error

Một miss tốn một lời gọi mô hình, mà bạn biết đến từng xu. Một hit sai tốn một câu trả lời sai trước một người dùng, một ticket hỗ trợ và một ít lòng tin, và chỉ bộ phận sản phẩm có thể định giá nó. Hai ngưỡng đánh đổi thứ này lấy thứ kia.

### Decide with labeled pairs

Lấy mẫu các cặp gồm một câu hỏi mới và câu trả lời cache mà nó sẽ nhận ở mỗi ngưỡng. Gán nhãn mỗi cặp là phù hợp hoặc không. Ở 0.85 và ở 0.95 khi đó bạn có một hit rate và một precision của các hit. Tiết kiệm kỳ vọng là hit rate nhân chi phí một lời gọi. Thiệt hại kỳ vọng là tỷ lệ hit sai nhân chi phí một câu trả lời sai. Phát hành ngưỡng mà tại đó con số thứ hai được người phụ trách sản phẩm chấp nhận.

### A two-tier scheme

Bài tập của bài học caching trước dùng hai ngưỡng: các hit ở 0.98 trả về ngay, và các hit ở 0.90 trả về với một tuyên bố lưu ý rằng câu trả lời đến từ một câu hỏi tương tự trước đó. Ghi log tầng đã phục vụ mỗi hit, và so sánh mức hài lòng theo tầng. Điều này giữ đường nghiêm ngặt nghiêm ngặt và vẫn lấy các thắng lợi rẻ.

### Why some workloads cannot go low

Các câu hỏi mã nguồn hit khoảng 20 đến 30 phần trăm là tốt nhất, vì một thay đổi nhỏ trong một câu hỏi mã nguồn thay đổi câu trả lời đúng. Văn bản gần trùng lặp không phải ý định gần trùng lặp ở đó. Các voice agent trên một tập prompt cố định đạt 50 đến 80 phần trăm, vì các câu hỏi thực sự lặp lại.

### The checks around the threshold

Chạy exact-match cache trước, vì một lần lặp giống từng byte không cần embedding. Đặt một thời gian tồn tại để các câu trả lời lỗi thời hết hạn. Chi phí embedding nhỏ, bài học nêu một giá trên mỗi triệu token là 0.02 đô la cho một mô hình embedding nhỏ, vì vậy ngưỡng là đòn bẩy, không phải hóa đơn embedding.

## Follow-ups

- **Level 2:** Tại sao con số độ chính xác trong tài liệu quảng bá của một nhà cung cấp không phải hit rate của bạn? Expected: độ chính xác nói tần suất một hit được trả về phù hợp. Hit rate nói tần suất có một hit, và nó phụ thuộc vào lưu lượng của bạn.
- **Level 2:** Một miss tốn gì, và một hit sai tốn gì? Expected: một miss tốn một lời gọi mô hình. Một hit sai tốn một câu trả lời sai trước một người dùng, điều mà bộ phận sản phẩm phải định giá.
- **Level 3:** Bạn hạ ngưỡng mà không hạ tính đúng đắn của đường nghiêm ngặt như thế nào? Expected: một sơ đồ hai tầng, với các lần khớp nghiêm ngặt được phục vụ nguyên trạng và các lần khớp trung bình được phục vụ với một tuyên bố lưu ý, và tầng được ghi log để mức hài lòng có thể được so sánh.
- **Level 3:** Tại sao các câu hỏi mã nguồn hit hiếm như vậy? Expected: một biến thể nhỏ trong một câu hỏi mã nguồn thay đổi câu trả lời đúng, vì vậy văn bản tương tự không phải ý định tương tự.

## Wrong answers

- "Hạ ngưỡng, mức tiết kiệm lớn hơn." Một hit sai là một thất bại về tính đúng đắn mà người dùng thấy. Chi phí của nó không phải một lời gọi mô hình.
- "Tăng ngưỡng cho đến khi không hit nào từng sai." Hit rate khi đó tiến gần exact-match rate, và cache ngừng tự bù chi phí.
- "Dùng con số độ chính xác của nhà cung cấp làm hit rate." Con số mô tả tính đúng đắn của phép khớp, không phải tần suất lưu lượng của bạn hit.

## Taught in

[Bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) tách độ chính xác phép khớp khỏi hit rate và đặt ra quyết định ngưỡng, và [bài học caching và chi phí](../../../phases/11-llm-engineering/11-caching-cost/) xây dựng các ngưỡng hai tầng.
