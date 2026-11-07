---
id: llm-cost-projection
title: Project the monthly bill of a chat feature
card: system-design
kind: estimate
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design, screen]
tags: [cost, tokens, caching, unit-economics]
minutes: 10
lessons: [phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [llm-cost-caching, production-llm-app]
related: [system-design/batched-inference-api-budget, system-design/streaming-and-fallback]
updated: 2026-11-03
---

Một tính năng chat dự kiến 10,000 người dùng hoạt động hàng ngày với 5 truy vấn mỗi người, khoảng 1,500 token đầu vào và 400 token đầu ra mỗi truy vấn, ở $2.50 mỗi triệu token đầu vào và $10.00 mỗi triệu token đầu ra. Các chỉ số cache được đo cho tỷ lệ hit 35%. Trình bày cho tôi ước lượng hàng tháng, và nói con số nào bạn sẽ xử lý trước.

## Short answer

Lưu lượng là 50,000 truy vấn một ngày, và tỷ lệ cache hit 35% để lại 32,500 đến mô hình. Trong 30 ngày, đó là $3,656 đầu vào và $3,900 đầu ra, khoảng $7,556 một tháng, so với $11,625 không có cache, nên cache tiết kiệm khoảng $4,070. Token đầu ra tốn gấp bốn lần mỗi token, nên sau tỷ lệ hit, độ dài đầu ra là con số cần xử lý, với một giới hạn token đầu ra tối đa và các prompt chặt hơn.

## Full answer

### The sheet

| Biến | Giá trị |
|---|---|
| Người dùng hoạt động hàng ngày | 10,000 |
| Truy vấn mỗi người dùng mỗi ngày | 5 |
| Token đầu vào mỗi truy vấn | 1,500 |
| Token đầu ra mỗi truy vấn | 400 |
| Giá đầu vào mỗi triệu | $2.50 |
| Giá đầu ra mỗi triệu | $10.00 |
| Tỷ lệ cache hit | 35% |
| Truy vấn hàng ngày hiệu dụng | 32,500 |

Đầu vào: 32,500 truy vấn một ngày nhân 1,500 token nhân 30 ngày, chia một triệu, nhân $2.50 cho $3,656. Đầu ra: tương tự với 400 token và $10.00 cho $3,900. Tổng là $7,556 một tháng.

### Why the cache matters this much

Cùng lưu lượng không có caching tốn $11,625. Một tỷ lệ hit 35% loại 35% các lệnh gọi mô hình, nên nó loại 35% chi phí token. Cache là một lần tra cứu embedding với một ngưỡng tương đồng và một thời gian sống, nên hai phiên bản diễn đạt khác nhau của một câu hỏi trả về một câu trả lời. Tỷ lệ hit được đo từ các chỉ số cache, không được giả định.

### Which number to attack

- Tỷ lệ hit trước: mỗi điểm tỷ lệ hit là một điểm giảm trên toàn hóa đơn.
- Độ dài đầu ra thứ hai: token đầu ra được định giá cao hơn đầu vào bốn lần, và một giới hạn token đầu ra tối đa theo từng template chặn trường hợp xấu nhất.
- Độ dài đầu vào thứ ba: system prompt và ngữ cảnh truy xuất nằm trong mọi lệnh gọi; một cache phía provider của tiền tố cố định và truy xuất chặt hơn cắt nó.
- Định tuyến mô hình cuối: một mô hình nhỏ hơn cho các template đơn giản cắt giá mỗi token, với một đánh giá để chứng minh chất lượng giữ vững.

### Where the estimate goes wrong

Các trung bình giấu một đuôi. Một ít người dùng dán các tài liệu dài hoặc chạy script có thể chi phối hóa đơn, đó là lý do danh sách kiểm tra production theo dõi chi phí theo từng người dùng và từng yêu cầu, và tại sao bài tập cảnh báo chi phí chuyển một người dùng nặng sang một mô hình rẻ hơn sau một ngưỡng hàng ngày. Mục tiêu trong dashboard của bài học là chi phí mỗi yêu cầu dưới $0.01.

## Follow-ups

- **Level 2:** Chỉ số đơn lẻ nào trên dashboard cho bạn biết ước lượng giữ vững? Expected: chi phí mỗi yêu cầu, kết hợp số token và giá và có một mục tiêu dưới $0.01.
- **Level 2:** Tỷ lệ cache hit giảm về không sau một thay đổi template prompt. Tại sao? Expected: khóa cache là embedding truy vấn và phản hồi được sinh bằng template cũ; các mục cũ không hợp lệ hoặc thời gian sống đã xóa chúng.
- **Level 3:** Prompt caching trên tiền tố ổn định thay đổi dòng đầu vào như thế nào? Expected: system prompt và các chỉ dẫn cố định được tính phí giảm giá khi lặp, nên giá đầu vào hiệu dụng mỗi truy vấn giảm mà không thay số token.
- **Level 3:** Một trần hàng ngày theo từng người dùng bảo vệ điều gì mà một mục tiêu chi phí mỗi yêu cầu không bảo vệ? Expected: tổng từ một người dùng nặng; nhiều yêu cầu rẻ vẫn cộng thành một hóa đơn lớn.

## Wrong answers

- "Nhân người dùng với một chi phí mỗi người dùng từ một trang nhà cung cấp." Hóa đơn đến từ token mỗi truy vấn, truy vấn mỗi người dùng và tỷ lệ hit; mỗi thứ đều được đo.
- "Caching chỉ tiết kiệm tiền trên các lần lặp chính xác." Một cache ngữ nghĩa khớp các truy vấn tương tự bằng embedding, đó là lý do tỷ lệ hit đạt một phần ba lưu lượng.
- "Token đầu vào chi phối vì có nhiều hơn." Ở các mức giá và độ dài này, dòng đầu ra lớn hơn dù có ít token đầu ra hơn.

## Taught in

[Bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) giải phép dự báo chi phí này và dashboard chỉ số.
