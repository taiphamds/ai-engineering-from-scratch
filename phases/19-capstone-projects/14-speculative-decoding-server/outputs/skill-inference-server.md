---
name: inference-server
description: Ship a speculative-decoding inference server with EAGLE-3 or P-EAGLE drafts, K8s autoscaling, and a full throughput/latency/cost report.
version: 1.0.0
phase: 19
lesson: 14
tags: [capstone, inference, vllm, sglang, eagle-3, p-eagle, speculative-decoding, quantization, hpa]
---

Với hai mô hình đích mở được cung cấp (Llama 3.3 70B và Qwen3-Coder-30B MoE hoặc GPT-OSS-120B), cung cấp một ngăn xếp phục vụ sản xuất với decode suy đoán, lượng tử hóa, và tự động mở rộng Kubernetes. Công bố các mức tăng tốc đo được và các số liệu độ trễ đuôi.

Kế hoạch xây dựng:

1. Triển khai các mô hình đích dưới vLLM 0.7 (hoặc SGLang 0.4) với lượng tử hóa FP8 Marlin.
2. Nạp một bản nháp EAGLE-3 được căn chỉnh từ Red Hat Speculators (hoặc huấn luyện một bản qua SpecForge).
3. Các số liệu đường cơ sở: token/s và độ trễ p50/p99 ở lô 1/8/32 không có suy đoán.
4. Bật EAGLE-3. Chạy lại cùng benchmark. Báo cáo mức tăng tốc, tỷ lệ chấp nhận, chênh lệch độ trễ đuôi p99.
5. Bật suy đoán song song P-EAGLE; báo cáo điểm chuyển nơi các cây sâu hơn giúp ích so với gây hại.
6. Chạy các benchmark trên các phân phối: ShareGPT, HumanEval, dữ liệu miền. Công bố độ trôi tỷ lệ chấp nhận.
7. Lặp lại trên mô hình đích thứ hai (MoE); xác định độ nhạy với nhiễu định tuyến trong mức chấp nhận bản nháp.
8. Triển khai trên Kubernetes với HPA theo dõi `queue_wait_ms`. Chứng minh mở rộng ngang khi tải tăng gấp ba.
9. So sánh $/1M token với Anthropic Claude Sonnet 4.7 và OpenAI GPT-5.4 trên các đánh giá tương ứng.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Mức tăng tốc đo được so với đường cơ sở | Thông lượng 2.5x+ ở chất lượng tương ứng trên cả hai mô hình |
| 20 | Tỷ lệ chấp nhận trên lưu lượng thực tế | Báo cáo tỷ lệ chấp nhận theo phân phối |
| 20 | Kỷ luật độ trễ đuôi P99 | p99 ở lô 1/8/32 có và không có suy đoán |
| 20 | Vận hành | Triển khai K8s, HPA theo thời gian chờ hàng đợi, phát hành suôn sẻ, nâng cấp rút hết yêu cầu trước |
| 15 | Bài viết và phương pháp luận | Suy ra các chỉ số rõ ràng, các đường cơ sở tương ứng |

Các trường hợp loại thẳng:

- Báo cáo thông lượng trạng thái ổn định mà không có độ trễ đuôi.
- HPA theo CPU thay vì thời gian chờ hàng đợi. Sẽ dao động dữ dội khi GPU bão hòa.
- Bỏ qua sự căn chỉnh phiên bản nháp-đích. Các bản nháp bị trôi tốn kém hơn không suy đoán.
- Các so sánh chi phí bỏ qua chiết khấu lưu đệm prompt của các API được lưu trữ.

Quy tắc từ chối:

- Từ chối phục vụ mà không có bước rút hết yêu cầu khi phát hành. Nâng cấp tại chỗ trong khi các yêu cầu đang được xử lý là bị loại.
- Từ chối báo cáo tỷ lệ chấp nhận tổng hợp trên các phân phối. Theo phân phối là bắt buộc.
- Từ chối tuyên bố decode suy đoán thắng ở bs=32 mà không có số liệu không suy đoán tương ứng.

Đầu ra: một repo chứa các cấu hình vLLM / SGLang, script tải bản nháp EAGLE-3, các manifest triển khai K8s, cấu hình HPA theo thời gian chờ hàng đợi, harness benchmark cho ShareGPT / HumanEval / dữ liệu miền, một bảng so sánh $/1M token, và một bài viết nêu tên ba lỗi thoái lui độ trễ đuôi do decode suy đoán đưa vào cùng biện pháp giảm thiểu (kiểm soát cổng lô, dự phòng ngram, điều chỉnh lượng tử hóa) đã sửa từng lỗi.
