---
id: five-minute-detection
title: Catch a leaking prompt within five minutes
card: production-mlops
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [observability, evals, alerting, pii, mttd]
minutes: 15
lessons: [phases/19-capstone-projects/11-llm-observability-dashboard, phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/drift-score-on-prompts, production-mlops/keep-every-error-trace, production-mlops/dev-platform-or-telemetry-tool]
updated: 2026-11-03
---

Một suy giảm được triển khai. Một trong các prompt bắt đầu rò rỉ các định danh khách hàng giả trong khoảng một trên một trăm câu trả lời. Thiết kế pipeline quan sát để một cảnh báo đến một người trong vòng năm phút từ câu trả lời xấu đầu tiên, và nói mỗi giai đoạn thêm gì vào đồng hồ đó.

## Short answer

Instrument mọi lời gọi mô hình bằng các span theo quy ước GenAI và gửi chúng qua OTLP đến một collector. Chạy một kiểm tra mẫu hình rẻ trên mọi đầu ra tại collector, chạy một giám khảo trên các trace được lấy mẫu theo một lịch ngắn, ghi điểm trở lại như các span đánh giá, xuất các tổng hợp thành chỉ số, và cảnh báo khi điểm rò rỉ vượt một ngưỡng. Năm phút là tổng khoảng scrape, cửa sổ batch giám khảo và định tuyến cảnh báo, nên mỗi giai đoạn phải ngắn, và bộ lấy mẫu phải giữ đủ lưu lượng để thấy một sự kiện một-trên-một-trăm. Mục tiêu năm phút chỉ bao phủ các rò rỉ mà mẫu hình gắn cờ hoặc bộ lấy mẫu giữ.

## Full answer

### The stages and their share of the clock

| Giai đoạn | Nó thêm gì | Thời gian tốn |
|---|---|---|
| instrumentation và xuất OTLP | span có đầu ra | giây |
| collector với tail sampling | quyết định giữ trace | giây, cộng chờ buffer |
| kiểm tra mẫu hình trên đầu ra | một cờ tức thì cho hình dạng định danh | không gì đáng tính |
| giám khảo trên trace được lấy mẫu | một điểm cho các rò rỉ mẫu hình bỏ lỡ | cửa sổ batch |
| span đánh giá và xuất chỉ số | tổng hợp mà cảnh báo đọc | khoảng scrape |
| quy tắc cảnh báo và định tuyến | cuộc gọi trực | khoảng đánh giá cộng định tuyến |

Công việc đánh giá của capstone đọc mười lăm phút cuối của các trace được lấy mẫu. Với một mục tiêu năm phút, giám khảo phải chạy mỗi phút trên các trace mới nhất, nếu không chỉ cửa sổ batch đã ăn hết ngân sách.

### Make the rare event visible

Ở một rò rỉ trên một trăm, một bộ lấy mẫu giữ một phần mười các thành công thấy một rò rỉ trên một nghìn câu trả lời. Ở khối lượng cao điều đó ổn, và ở khối lượng thấp nó mù. Chạy một kiểm tra mẫu hình cho các hình dạng định danh trên mọi đầu ra tại collector, như capstone ứng dụng production làm trong output guardrail, và giữ mọi trace kiểm tra gắn cờ. Giám khảo sau đó chỉ chấm các rò rỉ diễn đạt lại trên tỷ phần được lấy mẫu. Một rò rỉ diễn đạt lại trong một trace không được lấy mẫu không có điểm và không kích hoạt cảnh báo.

### The alert chain

Các điểm đánh giá đến như span đánh giá được liên kết với trace cha. Một exporter chỉ số tổng hợp chúng, một quy tắc cảnh báo kích hoạt khi điểm rò rỉ trong một cửa sổ vượt ngưỡng, và alert manager định tuyến các cảnh báo đến chat và các vi phạm nghiêm trọng đến máy gọi trực.

### Prove it

Phép thăm dò suy giảm của capstone chèn một bug làm rò rỉ định danh giả trong một phần trăm câu trả lời và đo thời gian từ triển khai đến cảnh báo. Phát hiện là phần phục hồi dashboard sở hữu. Cách sửa là rollback, và nó thuộc đường phát hành.

## Follow-ups

- **Level 3:** Giai đoạn nào thường chi phối năm phút? Expected: cửa sổ batch giám khảo. Một công việc chạy mỗi mười lăm phút không thể đáp ứng một mục tiêu năm phút.
- **Level 3:** Bộ lấy mẫu bỏ chín trong mỗi mười thành công. Điều gì xảy ra với phát hiện khi tỷ lệ rò rỉ là một phần trăm? Expected: nó thấy một rò rỉ trên một nghìn câu trả lời, nên ở lưu lượng thấp, phát hiện mất lâu hơn. Giữ mọi trace mà một kiểm tra mẫu hình rẻ gắn cờ.
- **Level 4:** Bạn chứng minh pipeline đáp ứng mục tiêu như thế nào? Expected: cố ý chèn suy giảm, như capstone làm, và đo thời gian từ triển khai đến cảnh báo.

## Wrong answers

- "Chạy giám khảo trên mọi trace." Ở khối lượng lớn, điều đó tốn hơn các lời gọi mô hình. Lấy mẫu, và lọc bằng một kiểm tra rẻ trước.
- "Một báo cáo đánh giá hằng ngày là đủ." Một ngày định danh rò rỉ là sự cố. Mục tiêu là phút.
- "Kiểm tra mẫu hình bắt mọi thứ." Các mẫu hình bỏ lỡ diễn đạt lại. Giám khảo bắt những gì mẫu hình bỏ lỡ, và mẫu hình giữ giám khảo có thể chi trả.

## Taught in

[Capstone dashboard quan sát](../../../phases/19-capstone-projects/11-llm-observability-dashboard/) xây chuỗi tiếp nhận, đánh giá và cảnh báo và đo thời gian phát hiện bằng một suy giảm được chèn, và [bài học ứng dụng production](../../../phases/11-llm-engineering/13-production-app/) đưa ra output guardrail dựa trên mẫu hình.
