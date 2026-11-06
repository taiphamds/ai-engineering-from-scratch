---
name: failure-detector
description: Generate failure-mode detectors for agent traces, wired to a trace store, tagging the five industry-recurring modes plus domain-specific signatures.
version: 1.0.0
phase: 14
lesson: 26
tags: [failure-modes, masft, detection, observability]
---

Với một miền sản phẩm và một kho trace, tạo các bộ phát hiện cho các chế độ lỗi agent.

Tạo:

1. Bộ phát hiện cho từng chế độ: `hallucinated_action`, `scope_creep`, `cascading_errors`, `context_loss`, `tool_misuse`, `success_hallucination`.
2. Các bộ phát hiện dành riêng cho miền (ví dụ "đã tạo một PR mà không liên kết một issue" cho một công cụ phát triển, "đã gửi một email đến > 5 người nhận mà không xác nhận" cho một công cụ tiếp thị).
3. Bộ gắn thẻ áp dụng mọi bộ phát hiện lên mỗi trace và phát ra một phân phối.
4. Cảnh báo dựa trên ngưỡng: nếu >=5% trace hôm nay gắn thẻ một chế độ, gọi trực hoặc mở một phiếu.
5. Lưu giữ mẫu: với mỗi trace được gắn thẻ, giữ các đầu vào + đầu ra + ảnh chụp trạng thái để người vận hành đánh giá.

Các trường hợp từ chối cứng:

- Các bộ phát hiện yêu cầu các lời gọi LLM cho mỗi trace trong sản xuất. Sử dụng các bộ phát hiện dựa trên mẫu; dành giám khảo LLM cho đánh giá lấy mẫu.
- Chỉ gắn thẻ khi sập. Hầu hết các lỗi tạo đầu ra trông hợp lệ. Các kiểm tra dấu hiệu trên nội dung + trạng thái là bắt buộc.
- Lưu các trace được gắn thẻ mà không che PII. Các mẫu lỗi mang nội dung tệ nhất; làm sạch trước khi lưu.

Các quy tắc từ chối:

- Nếu người dùng muốn "mọi trace được lưu mãi mãi," từ chối vì các lý do chi phí + tuân thủ. Lấy mẫu theo thẻ + tỷ lệ.
- Nếu sản phẩm không có một đường cơ sở "tốt đã biết," từ chối các cảnh báo trôi dạt. Trôi dạt cần một tham chiếu.
- Nếu các bộ phát hiện không được đánh phiên bản, từ chối. Các hồi quy bộ phát hiện phá vỡ tín hiệu của bạn mà không báo trước.

Đầu ra: `detectors.py`, `tagger.py`, `alerts.py`, `retention.py`, `README.md` giải thích các ngưỡng, chính sách lưu giữ, định tuyến cảnh báo. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 24 (các backend khả năng quan sát) hoặc Bài 27 (prompt injection) cho các chế độ lỗi đối kháng.
