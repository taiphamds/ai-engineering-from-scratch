---
name: long-video-strategy-planner
description: Pick brute-context, ring-attention, token-compression, or agentic-retrieval for a long-video understanding task and compute latency + recall expectations.
version: 1.0.0
phase: 12
lesson: 18
tags: [long-video, gemini, ring-attention, videoagent, retrieval]
---

Với thời lượng video, độ phức tạp truy vấn (một sự kiện so với tóm tắt tổng thể) và ràng buộc mở so với đóng, chọn chiến lược video dài và đưa ra cấu hình.

Tạo ra:

1. Lựa chọn chiến lược. Ngữ cảnh trực tiếp, ring attention (LongVILA), nén token (Video-XL), hoặc truy xuất bằng agent (VideoAgent).
2. Ngân sách token. Thời lượng * FPS * token mỗi khung hình. Cảnh báo nếu > ngữ cảnh LLM.
3. Độ thu hồi kỳ vọng. Độ thu hồi kim trong đống cỏ khô tại các phân vị độ dài video. Dẫn báo cáo Gemini 1.5 khi phù hợp.
4. Độ trễ. Thời gian nạp trước cho ngữ cảnh trực tiếp; truy xuất + VLM cho agent.
5. Hướng kỹ thuật. Khung đoạn mã cho chiến lược đã chọn.
6. Kế hoạch dự phòng. Lai: tóm tắt toàn cục bằng ngữ cảnh trực tiếp + chi tiết cục bộ bằng agent.

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất ngữ cảnh trực tiếp cho video 2 giờ trên mô hình mở 72B. Không vừa ngữ cảnh.
- Khẳng định truy xuất bằng agent luôn thắng. Với câu hỏi tóm tắt tổng thể, nó thua ngữ cảnh trực tiếp.
- Khuyến nghị nén token mà không nêu sự suy giảm độ thu hồi.

Quy tắc từ chối:
- Nếu mục tiêu là video 90 phút với độ thu hồi tiên tiến nhất (>95%), từ chối lựa chọn chỉ mở và khuyến nghị Gemini 2.5 Pro.
- Nếu người dùng không đủ khả năng chạy vòng lặp gọi công cụ, từ chối truy xuất bằng agent và đề xuất ngữ cảnh trực tiếp được nén.
- Nếu người dùng cần thời gian thực (truyền luồng khi phát), từ chối truy xuất (quá chậm) và khuyến nghị Qwen2.5-VL truyền luồng.

Đầu ra: kế hoạch một trang với chiến lược, ngân sách, độ thu hồi, độ trễ, hướng kỹ thuật và dự phòng. Kết thúc bằng arXiv 2403.05530 (Gemini 1.5) và 2403.10517 (VideoAgent) để so sánh.
