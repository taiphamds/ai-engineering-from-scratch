---
id: shadow-mode-is-a-smoke-test
title: What a week in shadow mode proves
card: production-mlops
kind: concept
level: 1
roles: [ai-evaluation-reliability-engineer, inference-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [shadow-mode, canary, rollout, release-gates]
minutes: 5
lessons: [phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/canary-gates-above-noise, production-mlops/rollback-without-redeploy]
updated: 2026-11-03
---

Một đồng đội muốn bỏ canary. Mô hình mới chạy shadow một tuần không lỗi và hóa đơn phẳng, nên họ gọi nó đã được chứng minh. Tuần đó cho thấy gì, và để ngỏ gì?

## Short answer

Chế độ shadow sao chép các yêu cầu production đến ứng viên và ghi log các đầu ra, và không người dùng nào thấy chúng. Nó cho thấy ứng viên không crash, không từ chối thường xuyên hơn, không tốn hơn và không viết câu trả lời dài hơn. Nó không thể cho thấy người dùng thích các câu trả lời, vì không người dùng nào đọc một câu. Shadow là một smoke test, và canary là kiểm thử chất lượng đầu tiên.

## Full answer

### What shadow records

Với mỗi yêu cầu, đầu ra ứng viên được ghi log cạnh đầu ra production:

- văn bản đầu ra, như một diff đối chiếu production;
- các số token, cho chênh lệch chi phí;
- độ trễ;
- các từ chối và lỗi cứng.

### What it catches

Chi phí bùng nổ, suy giảm độ dài, một thay đổi tỷ lệ từ chối và các lỗi cứng. Đây là các lỗi khiến một lần ra mắt đắt hoặc xấu hổ, và shadow tìm chúng với tác động người dùng bằng không.

### What it misses

Một thay đổi chất lượng mà một người dùng sẽ nhận thấy. Đầu ra ứng viên không bao giờ đến một người, nên không có lượt không thích, không ticket và không tín hiệu giữ chân. Một mô hình cho các câu trả lời ngắn hơn, rẻ hơn và sai vượt qua shadow.

### What comes next

Một canary phơi lộ một tỷ phần người dùng tăng dần với ứng viên, có một cổng ở mỗi bước. Bài học đặt cổng trên năm chỉ số: các phân vị độ trễ, chi phí mỗi yêu cầu, tỷ lệ lỗi và từ chối, phân phối độ dài đầu ra, và tỷ lệ phản hồi người dùng. Tiến trình chạy từ 1 phần trăm đến 10, 25, 50, 75 và 100 phần trăm. Phản hồi người dùng đầu xuất hiện ở đây, không phải trong shadow.

## Follow-ups

- **Level 1:** Shadow cho tín hiệu nào mà một đánh giá offline không cho? Expected: hành vi ứng viên trên hỗn hợp yêu cầu thật, gồm chi phí và độ dài đầu ra mỗi yêu cầu.
- **Level 2:** Shadow cho thấy chi phí mỗi yêu cầu 40 phần trăm trên production. Bạn làm gì? Expected: dừng trước bất kỳ canary nào. Chi phí hơn 20 phần trăm trên baseline là một vi phạm cổng, và một mô hình phá tính kinh tế đơn vị là một trường hợp rollback.
- **Level 2:** Tại sao shadow không thể đo phản hồi người dùng? Expected: không người dùng nào thấy đầu ra ứng viên, nên không có gì cho một người dùng chấm hoặc báo cáo.
- **Level 3:** Shadow tăng gấp đôi tải trên dịch vụ mô hình. Bạn giữ nó có thể chi trả như thế nào? Expected: gửi một tỷ phần yêu cầu cố định đến ứng viên thay vì tất cả, và ghi log cùng chỉ số cho tỷ phần đó.

## Wrong answers

- "Shadow đạt, nên chất lượng ổn." Shadow không có người dùng, nên nó chỉ đo chi phí, độ dài, lỗi và từ chối.
- "Shadow là một canary ở không phần trăm." Một canary trả đầu ra ứng viên cho người dùng thật và đặt cổng trên phản hồi của họ. Shadow không bao giờ trả một đầu ra cho một người dùng.
- "Một tuần shadow thay đánh giá offline." Đánh giá chấm tính đúng đắn trên một tập có nhãn. Shadow ghi hành vi trên lưu lượng thật. Chúng trả lời các câu hỏi khác nhau.

## Taught in

[Bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) định nghĩa chế độ shadow, năm cổng canary và đường rollback.
