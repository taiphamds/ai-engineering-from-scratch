---
id: keep-every-error-trace
title: Trace retention when traces cost more than the model
card: production-mlops
kind: design
level: 2
roles: [ai-evaluation-reliability-engineer, inference-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [tracing, sampling, retention, observability-cost]
minutes: 10
lessons: [phases/17-infrastructure-and-production/13-llm-observability, phases/19-capstone-projects/11-llm-observability-dashboard]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/renamed-token-attribute, production-mlops/drift-score-on-prompts]
updated: 2026-11-03
---

Dịch vụ của bạn thực hiện hơn một triệu lời gọi mô hình mỗi ngày. Giữ mọi trace giờ tốn hơn chính các lời gọi mô hình. Thiết kế một policy lưu giữ giữ các trace bạn sẽ cần trong một sự cố và bỏ phần còn lại.

## Short answer

Lấy mẫu theo quy tắc, không phải theo một tỷ lệ phẳng. Giữ mọi trace có lỗi và mọi trace chi phí cao, giữ một tỷ phần nhỏ các thành công, và luôn giữ các tổng hợp. Đưa ra quyết định tại collector với một tail sampler sau khi trace hoàn tất, để quy tắc có thể thấy trạng thái và chi phí. Capstone giữ tất cả trace có lỗi và 10 phần trăm các thành công.

## Full answer

### Why a flat rate fails

Một mức phẳng 5 phần trăm cũng giữ 5 phần trăm lỗi. Trace bạn cần trong một sự cố là trace bạn bỏ, và số lỗi tổng hợp chỉ cho bạn biết nó tồn tại.

### The rules

| Lớp | Giữ |
|---|---|
| các trace có lỗi | tất cả chúng |
| các trace chi phí cao, đầu ra dài hoặc mô hình đắt | tất cả chúng |
| các thành công | 5 đến 10 phần trăm |
| các tổng hợp | luôn luôn, từ mọi yêu cầu |

Bài học quan sát nêu quy tắc là 100 phần trăm lỗi, 100 phần trăm chi phí cao và 5 phần trăm thành công. Các tổng hợp không cần trace: các bộ đếm và histogram đếm mọi yêu cầu ngay cả khi trace bị bỏ.

### Decide at the tail

Head sampling quyết định khi trace bắt đầu, trước khi bất cứ thứ gì biết liệu nó thất bại. Tail sampling tại collector quyết định sau khi trace hoàn tất, nên nó có thể đọc trạng thái, chi phí và điểm đánh giá. Cái giá là bộ nhớ buffer tại collector, vì các trace nguyên vẹn chờ đến quyết định.

### Stratify, and know the bias

Bài tập của capstone giữ mọi trace có điểm độc hại trên 0.5 cộng một mẫu phân tầng 10 phần trăm của phần còn lại, và yêu cầu bạn đo bias mà lấy mẫu thêm. Bất kỳ phân tích nào trên các trace lấy mẫu đều đặt trọng số quá mức các lớp bạn giữ đầy đủ. Đặt trọng số theo nghịch đảo tỷ lệ lấy mẫu, hoặc chỉ chạy các đánh giá theo trace trên tỷ phần phân tầng.

### Tier the storage

Các span đến một kho dạng cột để truy vấn, và các sự kiện thô đến object storage cho phần đuôi dài. Kho lưu trữ rẻ, và phân tích dài hạn chạy ở đó.

## Follow-ups

- **Level 2:** Tại sao head sampling mất các lỗi? Expected: nó quyết định trước khi span kết thúc, nên không thể thấy trạng thái.
- **Level 2:** Điều gì sống sót từ một trace bị bỏ? Expected: các chỉ số. Các bộ đếm và histogram đếm mọi yêu cầu, dù trace của nó có được giữ hay không.
- **Level 3:** Các công việc đánh giá của bạn chạy trên các trace lấy mẫu. Chúng kế thừa bias nào? Expected: một mẫu giữ tất cả lỗi đặt trọng số quá mức các thất bại, nên đặt trọng số theo nghịch đảo tỷ lệ lấy mẫu hoặc chỉ đánh giá tỷ phần phân tầng.
- **Level 3:** Collector hết bộ nhớ trong một đợt bùng phát. Tại sao, và bạn thay đổi gì? Expected: tail sampling buffer các trace nguyên vẹn đến khi chúng hoàn tất. Giới hạn buffer, rút ngắn thời gian chờ quyết định, và loại bỏ bằng một quy tắc head dưới áp lực.

## Wrong answers

- "Lấy mẫu 5 phần trăm mọi thứ." Phần lớn các lỗi bạn cần trong một sự cố mất, và tổng hợp chỉ cho bạn biết chúng xảy ra.
- "Giữ mọi thứ một tuần, rồi xóa." Một tuần trace đầy đủ ở khối lượng này là chi phí bạn đang cố loại bỏ.
- "Trace đủ, bỏ các chỉ số." Một phân vị trên một giờ cần mọi yêu cầu, điều chỉ một histogram cho.

## Taught in

[Bài học stack quan sát](../../../phases/17-infrastructure-and-production/13-llm-observability/) đưa ra các quy tắc lấy mẫu, và [capstone dashboard](../../../phases/19-capstone-projects/11-llm-observability-dashboard/) cấu hình tail sampler và đo bias của nó.
