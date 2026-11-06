---
name: eagle3-rollout
description: Produce a staged EAGLE-3 speculative-decoding rollout plan that measures acceptance rate alpha on real traffic before shipping.
version: 1.0.0
phase: 17
lesson: 05
tags: [speculative-decoding, eagle-3, vllm, alpha, production-rollout]
---

Với một mô hình đích, phần cứng (loại và số GPU), mô tả lưu lượng (trò chuyện tổng quát / mã / chuyên biệt), mục tiêu đồng thời, và các chỉ số đường cơ sở hiện tại (TTFT, ITL, thông lượng), tạo một kế hoạch triển khai EAGLE-3 theo giai đoạn.

Tạo ra:

1. Kế hoạch đo đường cơ sở. Benchmark nào (LLMPerf, GenAI-Perf, hoặc bóng sản xuất), phân phối prompt nào, điểm đồng thời nào, các chỉ số nào để ghi lại (TTFT trung bình/P99, ITL trung bình/P99, thông lượng, mức đồng thời).
2. Lựa chọn đầu nháp. EAGLE-3 huấn luyện trên ShareGPT cho trò chuyện tổng quát. EAGLE-3 huấn luyện theo lĩnh vực cho lưu lượng chuyên biệt (mã, y khoa, pháp lý) hoặc quyết định huấn luyện một đầu trước khi đưa ra sử dụng.
3. Cấu hình. Các trường vLLM `speculative_config` chính xác (method, model, num_speculative_tokens). Kiểm tra tổ hợp theo ma trận tương thích cho phiên bản vLLM đã triển khai (v0.18.0 đánh dấu giải mã suy đoán tương thích với prefill chia khối).
4. Cổng alpha. Alpha mục tiêu >= 0.55 ở mức đồng thời sản xuất. Quy trình đo: lưu lượng bóng trong 24 giờ, ghi nhật ký vLLM `spec_decode_metrics`, chia các token được chấp nhận cho độ dài nháp được yêu cầu. Công tắc ngắt nếu alpha giảm dưới 0.45 trong bất kỳ cửa sổ 1 giờ nào.
5. Theo dõi đuôi. Vẽ chênh lệch P99 ITL (bật suy đoán - tắt suy đoán). Nếu chênh lệch dương, mẫu hai lượt nháp bị từ chối đang gây tác hại. Giảm K hoặc tắt trên khối lượng công việc này.
6. Kiểm tra hòa vốn. Ở mức đồng thời được báo cáo, tính alpha hòa vốn cho chi phí phụ xác minh hiện tại. Chỉ đưa ra sử dụng nếu alpha được đo vượt hòa vốn ít nhất 0.1.

Các trường hợp loại bỏ dứt khoát:
- Đưa ra sử dụng không đo alpha trên lưu lượng sản xuất. Từ chối và yêu cầu một phép đo bóng 24 giờ.
- Tuyên bố tăng tốc 2-3x mà không nêu alpha được đo.
- Bật giải mã suy đoán cho các công việc lô ngoại tuyến nơi độ trễ không phải ràng buộc.
- Kết hợp giải mã suy đoán với song song pipeline trên vLLM 0.15.0 hoặc sớm hơn. Tài liệu giải mã suy đoán liệt kê là không tương thích.

Các quy tắc từ chối:
- Nếu lưu lượng chủ yếu là các đầu ra rất ngắn (trung bình dưới 50 token), từ chối. Chi phí phụ nháp chi phối; đưa đích thuần ra sử dụng.
- Nếu phần cứng tiêu dùng (RTX 4090 / 5090) và kích thước lô ở dưới 8, đề xuất đích thuần — phân bổ chi phí phụ xác minh theo lô cần mức đồng thời mà phần cứng không thể cung cấp.
- Nếu người dùng muốn tự điều chỉnh K không có một vòng lặp đo, từ chối. K được chọn từ alpha được đo cộng chi phí phụ xác minh; không tự điều chỉnh nào thay phép đo.

Đầu ra: một kế hoạch triển khai theo giai đoạn một trang liệt kê đường cơ sở → cấu hình → cổng alpha → theo dõi đuôi → xác nhận hòa vốn. Kết thúc bằng một đoạn “đo gì tiếp theo” nêu hoặc huấn luyện EAGLE-3 riêng lĩnh vực, K thấp hơn, hoặc quay về đích thuần tùy chẩn đoán.
