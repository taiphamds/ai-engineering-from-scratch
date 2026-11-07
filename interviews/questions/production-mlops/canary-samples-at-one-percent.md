---
id: canary-samples-at-one-percent
title: How many samples a one percent canary gives a gate
card: production-mlops
kind: estimate
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [screen, system-design]
tags: [canary, sample-size, release-gates, metrics-cadence]
minutes: 8
lessons: [phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/canary-gates-above-noise]
updated: 2026-11-03
---

Dịch vụ của bạn xử lý 1,000 yêu cầu mỗi phút. Canary mở ở một phần trăm, và cổng chạy mỗi năm phút. Khoảng bao nhiêu điểm dữ liệu một lần kiểm tra cổng thấy, và bạn có thể tin các cổng nào ở bước này?

## Short answer

Một phần trăm của 1,000 mỗi phút là 10 yêu cầu mỗi phút đến canary, nên một cửa sổ năm phút giữ khoảng 50 điểm và một cửa sổ mười lăm phút khoảng 150. Đó là đủ để đọc độ trễ và tỷ lệ lỗi, và quá ít để đọc phản hồi người dùng. Đặt cổng bước đầu trên độ trễ, chi phí, lỗi và độ dài đầu ra, và áp dụng cổng phản hồi ở một bước sau.

## Full answer

### The arithmetic

Nhịp của bài học là một kiểm tra cổng mỗi 5 đến 15 phút, tùy khối lượng. Ở 1 phần trăm của một tải 1,000 mỗi phút, canary nhận 10 yêu cầu mỗi phút, cho 50 đến 150 điểm dữ liệu mỗi cửa sổ.

### What each gate needs from those points

| Cổng | Ở khoảng 50 điểm |
|---|---|
| Độ trễ P50 và P95 | đọc được, với một dải rộng |
| Độ trễ P99 | một hoặc hai mẫu quyết định nó, nên giữ hơn một cửa sổ |
| Chi phí mỗi yêu cầu | mọi yêu cầu báo cáo token, nên một dịch chuyển lớn hiện ra |
| Tỷ lệ lỗi và từ chối | một baseline vài phần trăm cho một ít sự kiện, nên nhiễu |
| Phân phối độ dài đầu ra | thô, nhưng một dịch chuyển lớn hiện ra |
| Phản hồi người dùng | chỉ một số người dùng chấm một câu trả lời, nên một cửa sổ giữ tối đa vài đánh giá |

### The next step changes the picture

Ở 10 phần trăm, canary thấy số điểm nhiều hơn khoảng mười lần mỗi cửa sổ. Cổng phản hồi trở nên dùng được ở đó. Đây là lý do tiến trình tạm dừng ở mỗi bước: tạm dừng không phải hình thức, nó là thời gian cổng cần để thu thập các mẫu.

### Write the dwell rule down

Với mỗi bước, nêu số cửa sổ phải qua với mọi cổng xanh trước khi tỷ phần tăng. Một cổng cần hai cửa sổ để xác nhận một vi phạm tăng gấp đôi mức phơi lộ một suy giảm thật, nên viết sự đánh đổi đó cạnh quy tắc.

## Follow-ups

- **Level 2:** Ở bước nào cổng phản hồi người dùng trở nên dùng được? Expected: ở 10 phần trăm, nơi canary thấy số điểm nhiều hơn khoảng mười lần mỗi cửa sổ.
- **Level 2:** Tại sao một cửa sổ dài hơn không sửa bước đầu? Expected: một cửa sổ dài hơn thêm điểm chậm, và một suy giảm chạy trong toàn bộ cửa sổ trước khi cổng có thể kích hoạt.
- **Level 3:** Lưu lượng giảm còn một phần mười ban đêm. Kế hoạch thay đổi như thế nào? Expected: cùng tỷ phần cho khoảng một yêu cầu mỗi phút, nên kéo dài thời gian giữ, bắt đầu ở tỷ phần cao hơn, hoặc chạy tăng dần ban ngày.
- **Level 3:** Một vi phạm phải giữ hai cửa sổ trước khi cổng kích hoạt. Điều đó tốn gì? Expected: một suy giảm thật tiếp tục chạy qua cả hai cửa sổ đến khi dừng, nên quy tắc đánh đổi ít báo động giả hơn lấy phơi lộ lâu hơn.

## Wrong answers

- "Một phần trăm an toàn, nên các cổng hoạt động ở một phần trăm." Tỷ phần an toàn cho người dùng, và phần lớn cổng mù ở kích thước mẫu đó.
- "Kiểm tra mỗi phút để phát hiện nhanh hơn." Một cửa sổ một phút ở bước này giữ khoảng mười điểm, không thể cho một phân vị.
- "Bắt đầu ở 25 phần trăm để có thống kê tốt hơn." Một phần tư người dùng thấy mô hình mới trước khi bất kỳ cổng nào kích hoạt một lần.

## Taught in

[Bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) đưa ra nhịp chỉ số và số mẫu mỗi cửa sổ.
