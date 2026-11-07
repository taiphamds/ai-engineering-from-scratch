---
id: rollout-plan-take-home
title: Simulate a shadow, canary and rollback plan
card: production-mlops
kind: take-home
level: 4
roles: [ai-evaluation-reliability-engineer, inference-engineer, applied-ai-engineer]
rounds: [take-home, system-design]
tags: [canary, simulation, release-gates, rollback]
minutes: 60
lessons: [phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/canary-gates-above-noise, production-mlops/canary-samples-at-one-percent, production-mlops/rollback-without-redeploy]
updated: 2026-11-03
---

Bài làm ở nhà. Bạn nhận một mô hình ứng viên, một mô hình baseline, và một tuần log yêu cầu production với độ trễ, số token và phản hồi người dùng của mỗi yêu cầu. Bàn giao một kế hoạch rollout và một bộ mô phỏng thực thi nó: một pha shadow, một ramp canary có cổng, và một rollback. Chèn ít nhất hai suy giảm và cho thấy kế hoạch dừng ở đâu cho mỗi suy giảm. Các log chỉ giữ phản hồi người dùng cho các phản hồi người dùng đã thấy, nên nêu cách bộ mô phỏng tạo phản hồi cho ứng viên.

## Short answer

Xây một bộ mô phỏng phát lại các log qua cả hai mô hình, tính năm chỉ số cổng mỗi bước, và chỉ tiến ramp khi mọi cổng giữ trong số cửa sổ yêu cầu. Đặt mỗi ngưỡng trên variance giữa các lần chạy của chính baseline, mà bạn đo bằng cách phát lại baseline đối chiếu chính nó. Chèn một suy giảm chi phí và một suy giảm chất lượng, và cho thấy bước mỗi suy giảm dừng và rollback theo sau.

## Full answer

### What a complete submission contains

1. **Sàn nhiễu.** Phát lại baseline đối chiếu chính nó và báo cáo độ trải mỗi chỉ số. Đây là sàn dưới mọi cổng.
2. **Các cổng.** Các phân vị độ trễ, chi phí mỗi yêu cầu, tỷ lệ lỗi và từ chối, phân phối độ dài đầu ra, và tỷ lệ phản hồi người dùng. Viết mỗi cổng như một hệ số trên sàn. Các mặc định của bài học là P99 trên 1.5x, chi phí hơn 20 phần trăm trên baseline, lỗi ở 2x, một dịch chuyển trong phân phối độ dài, và phản hồi ở 1.5x.
3. **Pha shadow.** Ứng viên thấy mọi yêu cầu và không trả gì cho một người dùng. Báo cáo chênh lệch chi phí, phân phối độ dài, các từ chối và lỗi cứng đối chiếu baseline.
4. **Ramp.** Các bước ở 1, 10, 25, 50, 75 và 100 phần trăm. Tính thời gian giữ ở mỗi bước từ số mẫu mỗi cửa sổ, để một cổng không bao giờ quyết định trên một ít điểm.
5. **Rollback.** Mô hình hóa như bài học mô tả: một cờ trở lại không và một pin trên digest trước. Bộ mô phỏng cho thấy bước và thời gian mất.
6. **Hai suy giảm.** Bài tập của bài học chèn một suy giảm chi phí 25 phần trăm, và một bài nộp mạnh cho thấy nó dừng ở bước đầu. Suy giảm thứ hai chỉ nằm trong chỉ số phản hồi, và bài nộp cho thấy nó giữ vô hình ở bước đầu và chỉ dừng nơi mẫu đủ lớn.
7. **Một quyết định bằng văn bản.** Bài tập thứ hai của bài học: một ứng viên có mức tăng độ chính xác 3 phần trăm và chi phí 18 phần trăm trên baseline. Viết cả hai đường policy, triển khai và không triển khai, và nêu ai quyết định.

### What the reviewer looks for

- Sàn được đo, không phải giả định.
- Các cổng là các hệ số, và các ngưỡng nằm trên sàn.
- Thời gian giữ được tính từ mẫu, không phải từ đồng hồ.
- Suy giảm bước đầu không thể thấy được cho thấy, không bị giấu.
- Rollback được diễn tập trong mô phỏng.

### What to keep for production

Mã đánh giá cổng và phép đo sàn nhiễu trở thành các kiểm tra của bộ điều khiển canary thật. Bộ khung phát lại trở thành kiểm thử trước phát hành cho mọi ứng viên tương lai.

## Follow-ups

- **Level 3:** Suy giảm phản hồi bị bắt muộn. Kế hoạch sai không? Expected: không. Nó cho thấy giới hạn cổng phản hồi, và cách sửa là thời gian giữ lâu hơn ở bước phản hồi lần đầu có mẫu, hoặc một chỉ số proxy có khối lượng lớn hơn.
- **Level 4:** Ứng viên có cùng chi phí và giọng điệu với baseline. Điều gì thay đổi trong kế hoạch? Expected: bỏ bước A/B sau canary, điều bài học cho là tùy chọn cho một phiên bản cải thiện cùng hành vi.
- **Level 4:** Điều gì từ bộ mô phỏng sống sót vào production? Expected: mã đánh giá cổng và phép đo sàn nhiễu, trở thành các kiểm tra của bộ điều khiển canary.

## Wrong answers

- "Dùng các ngưỡng của bài học nguyên trạng." Các con số của bài học là mặc định. Sàn đến từ baseline riêng.
- "Tiến ramp theo một lịch cố định." Một ramp di chuyển theo đồng hồ bỏ qua liệu một cổng đã có đủ mẫu.
- "Mô hình hóa rollback như một triển khai lại." Bộ mô phỏng nên mô hình hóa cơ chế bạn sẽ dùng, và triển khai lại là cơ chế bài học bảo bạn loại bỏ.

## Taught in

[Bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) đưa ra các cổng, ramp và các bài tập bài làm ở nhà này mở rộng.
