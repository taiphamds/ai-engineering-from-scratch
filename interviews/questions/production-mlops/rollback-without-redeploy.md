---
id: rollback-without-redeploy
title: Make the next rollback take seconds
card: production-mlops
kind: design
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [rollback, feature-flags, model-registry, canary]
minutes: 10
lessons: [phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/canary-gates-above-noise, production-mlops/shadow-mode-is-a-smoke-test]
updated: 2026-11-03
---

Quý trước, một lần ra mắt mô hình xấu mất ba giờ để hoàn tác, vì đường duy nhất trở lại là một deployment mới. Giờ bạn sở hữu đường phát hành. Thiết kế nó để lần tới đường trở lại mất vài giây. Nêu các phần và nói mỗi phần giữ gì.

## Short answer

Tách policy khỏi mô hình. Giữ phần chia lưu lượng trong một feature flag mà một thay đổi cấu hình bật tắt, và giữ mô hình trong một registry dưới một digest được ghim không bao giờ tự nâng cấp. Một rollback khi đó là hai hành động: hoàn nguyên cờ, và trỏ pin về digest trước, cũng khôi phục phiên bản prompt và mẫu được ghim với mô hình đó. Không gì được dựng lại và không gì được triển khai lại.

## Full answer

### Two things change in a launch

1. **Policy.** Tỷ phần lưu lượng nào đến mô hình nào. Nó nằm trong một hệ thống feature-flag, và một lần bật tắt mất vài giây.
2. **Mô hình.** Chính artifact. Nó nằm trong một registry có content digest. Một digest được ghim không di chuyển khi một build mới xuất hiện.

Một deployment ghép hai thứ: để thay policy bạn phát hành một build mới. Quy tắc của bài học thẳng thừng: nếu stack cần triển khai lại để rollback, sửa điều đó trước khi rollout bất cứ thứ gì.

### The rollback

Hoàn nguyên cờ, đặt digest được ghim về digest trước, và khôi phục các ngưỡng cổng đi cùng nó. Bài học đặt toàn bộ chuỗi ở vài giây, so với hàng giờ cho một triển khai lại. Trong câu chuyện mở đầu, triển khai lại mất ba giờ và bật tắt cờ sẽ mất 30 giây.

### The same flag runs the canary

Tỷ phần canary nằm trong cùng cờ: 1, 10, 25, 50, 75 rồi 100 phần trăm. Một vi phạm cổng đặt tỷ phần trở lại không. Điều đó khiến dừng và rollback là cùng cơ chế, nên đường bạn diễn tập trên mọi rollout là đường bạn dùng trong một sự cố.

### The tooling shape

Một bộ điều khiển triển khai tiến dần trên cụm chuyển các trọng số tại service mesh hoặc ingress. Một nền tảng phục vụ mô hình có thể tự mang phần chia canary. Một dịch vụ feature-flag giữ policy. Chọn một của mỗi loại, và giữ mô hình cũ được triển khai đến khi mô hình mới giữ ở 100 phần trăm qua các cổng.

### Rehearse it

Bài tập của bài học yêu cầu một rollback dưới 60 giây từ đầu đến cuối. Đo thời gian trong staging trên mọi bản phát hành, và xem một kết quả chậm hơn là một điều chặn phát hành.

## Follow-ups

- **Level 2:** Tại sao ghim mô hình bằng digest và không bằng tag? Expected: một tag có thể chuyển sang một build mới. Một digest bất biến, nên mục tiêu rollback chính xác là mô hình đã chạy trước.
- **Level 2:** Điều gì khác phải hoàn nguyên cùng mô hình? Expected: các ngưỡng cổng, và bất kỳ phiên bản prompt hoặc mẫu đã phát hành cùng mô hình.
- **Level 3:** Bạn biết đường hoạt động trước khi cần nó như thế nào? Expected: diễn tập trong staging trên mọi bản phát hành và đo thời gian từ đầu đến cuối, theo một mục tiêu như 60 giây của bài học.
- **Level 3:** Mô hình mới cần một engine image mới. Cờ vẫn hoạt động không? Expected: có, khi cả hai image chạy cạnh nhau và cờ chọn giữa chúng. Deployment cũ giữ sống đến khi bản mới giữ ở 100 phần trăm.

## Wrong answers

- "Rollback bằng cách triển khai lại image trước." Một triển khai lại mất hàng giờ, và ý của bài học là tách rollback khỏi deployment.
- "Xóa mô hình cũ một ngày sau ra mắt." Mô hình cũ phải giữ sẵn đến khi canary giữ ở toàn bộ lưu lượng qua mọi cổng.
- "Một rollback nhanh khiến các cổng không cần thiết." Các cổng quyết định khi nào rollback. Đường nhanh chỉ hạn chế thiệt hại một khi chúng kích hoạt.

## Taught in

[Bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) tách các cờ policy khỏi các pin mô hình và khiến rollback là một thay đổi cấu hình.
