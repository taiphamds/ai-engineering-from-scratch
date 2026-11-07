---
id: canary-gates-above-noise
title: Set canary gates that do not halt on noise
card: production-mlops
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [canary, release-gates, non-determinism, latency-percentiles]
minutes: 12
lessons: [phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/shadow-mode-is-a-smoke-test, production-mlops/canary-samples-at-one-percent, production-mlops/rollback-without-redeploy]
updated: 2026-11-03
---

Bạn chạy một canary cho một mô hình mới. Nhóm muốn một quy tắc dừng rollout khi canary và baseline khác nhau trên bất kỳ chỉ số nào. Thiết kế các cổng để chúng bắt một suy giảm thật và cho một rollout khỏe mạnh qua.

## Short answer

Viết mỗi cổng như một hệ số trên baseline, không bao giờ như bằng nhau. Đặt cổng trên năm chỉ số: các phân vị độ trễ, chi phí mỗi yêu cầu, tỷ lệ lỗi và từ chối, phân phối độ dài đầu ra và tỷ lệ phản hồi người dùng. Đặt mọi ngưỡng trên variance giữa các lần chạy, mà bài học đo đến 15 phần trăm trên các đầu vào giống hệt, và giữ mỗi bước đủ lâu để thu thập các mẫu cổng cần.

## Full answer

### Why equality fails

Các đầu vào giống hệt tạo các đầu ra khác nhau. Các phép rút gọn dấu phẩy động trên GPU chạy theo một thứ tự khác cho mỗi shape batch, kích thước batch thay đổi giữa các lần chạy, và lấy mẫu trên temperature không thêm sự ngẫu nhiên riêng. Bài học báo cáo đến 15 phần trăm biến thiên độ chính xác giữa các lần chạy trên cùng tập đánh giá. "Ổn định" do đó có nghĩa trong variance kỳ vọng, không phải giống hệt baseline.

### The five gates

| Chỉ số | Vi phạm |
|---|---|
| Độ trễ P50, P95, P99 | P99 canary trên 1.5x baseline |
| Chi phí mỗi yêu cầu | hơn 20 phần trăm trên baseline |
| Tỷ lệ lỗi và từ chối | 2x baseline |
| Độ dài đầu ra, trung bình và P99 | một dịch chuyển trong phân phối |
| Phản hồi người dùng, không thích và ticket | 1.5x baseline |

### Measure the noise floor first

Trước canary, chạy hai nhánh của cùng mô hình baseline và ghi độ trải mỗi chỉ số giữa chúng. Độ trải đó là sàn. Một cổng dưới nó dừng mọi rollout, gồm một rollout tốt. Bài tập của bài học yêu cầu các hệ số khi nhiễu đánh giá là cộng hoặc trừ 7 phần trăm, và đáp án là một cổng trên dải đó.

### Hold each step long enough

Tiến trình chạy 1, 10, 25, 50, 75 và 100 phần trăm. Các cổng kiểm tra mỗi 5 đến 15 phút. Ở 1 phần trăm của tải 1,000 mỗi phút, canary thấy 10 yêu cầu mỗi phút, là 50 đến 150 điểm dữ liệu mỗi cửa sổ. Đó là đủ để đọc độ trễ và lỗi, nhưng một hoặc hai mẫu quyết định P99, nên cổng P99 phải giữ hơn một cửa sổ. Nó quá ít cho phản hồi người dùng. Mỗi bước phải tạm dừng đến khi cổng có các mẫu của nó.

### Keep the exit cheap

Một lần dừng chỉ hữu ích khi rollback nhanh. Giữ tỷ phần lưu lượng trong một cờ policy và mô hình trong một registry có digest được ghim, để một vi phạm hoàn nguyên trong vài giây.

## Follow-ups

- **Level 3:** Bạn biết độ lớn nhiễu trước khi canary bắt đầu như thế nào? Expected: chạy hai nhánh canary của cùng baseline và ghi độ trải mỗi chỉ số giữa chúng.
- **Level 3:** Phản hồi người dùng ở bước đầu quá mỏng để đặt cổng. Bạn làm gì? Expected: đặt cổng các bước đầu trên độ trễ, chi phí, lỗi và độ dài, và áp dụng cổng phản hồi từ bước có đủ mẫu.
- **Level 4:** Một cổng kích hoạt ở một bước, và chỉ số bình thường lại ở lần kiểm tra sau. Tiếp tục hay dừng? Expected: dừng và xem. Một cổng dao động nằm trong nhiễu hoặc thấy một suy giảm gián đoạn, và cả hai cần một quyết định trước khi thêm người dùng thấy mô hình.

## Wrong answers

- "Dừng ở bất kỳ khác biệt nào so với baseline." Hai lần chạy cùng mô hình khác nhau, nên quy tắc đó dừng mọi rollout.
- "Đặt cổng trên độ trễ trung bình." Một trung bình giấu phần đuôi. Đặt cổng trên các phân vị.
- "Cho phép tăng chi phí bằng không." Một mô hình tốt hơn có thể tốn hơn. Bài học đặt vi phạm ở 20 phần trăm, và sản phẩm quyết định liệu mức tăng có trả được nó.

## Taught in

[Bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) liệt kê năm cổng, trần không xác định và nhịp bước.
