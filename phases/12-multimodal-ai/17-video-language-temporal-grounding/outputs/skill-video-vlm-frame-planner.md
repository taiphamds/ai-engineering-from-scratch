---
name: video-vlm-frame-planner
description: Plan frame sampling, per-frame pooling, output format, and benchmark targets for a video-language model deployment.
version: 1.0.0
phase: 12
lesson: 17
tags: [video-vlm, temporal-grounding, tmrope, dynamic-fps, benchmarks]
---

Với một tác vụ video (nhận dạng hành động, định vị theo thời gian, tóm tắt, giám sát, phát lại quy trình agent) và ràng buộc triển khai (ngữ cảnh mô hình, ngân sách độ trễ, thông lượng), đưa ra kế hoạch lấy mẫu khung hình và đầu ra.

Tạo ra:

1. Lựa chọn bộ lấy mẫu khung hình. Đồng đều cho nội dung ổn định, FPS động cho chuyển động hỗn hợp, theo sự kiện cho nhiều hành động, khung hình chính+ngữ cảnh cho điện ảnh.
2. Pool mỗi khung hình. 2x2 cho chi tiết cao, mặc định 3x3, 4x4 hoặc 6x6 cho quy trình agent nơi mật độ nội dung ít quan trọng hơn độ bao phủ.
3. Mã hóa thời gian. M-RoPE căn chỉnh theo thời gian cho họ Qwen2.5-VL (TMRoPE trong Qwen2.5-Omni); embedding thời gian được học cho các mô hình nhỏ hơn; không mã hóa cho các tác vụ clip đơn.
4. Định dạng đầu ra. JSON với `{event, start, end, confidence}` cho định vị; văn bản tự do cho tóm tắt; phân cách bằng token cho luồng hỗn hợp.
5. Kế hoạch benchmark. VideoMME cho tổng quát, TempCompass cho định vị, EgoSchema cho khoảng thời gian dài. Chỉ rõ mức độ chính xác kỳ vọng.
6. Ngân sách ngữ cảnh / độ trễ. Tổng token = thời lượng * fps * tokens_per_frame. Cảnh báo nếu vượt 40% ngữ cảnh.

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất lấy mẫu đồng đều cho video nhiều hành động. Mất các sự kiện đỉnh.
- Khẳng định đầu ra phân cách bằng token ngang độ chính xác JSON khi phân tích cú pháp phía sau. JSON vững chắc hơn.
- Khuyến nghị Video-LLaMA cho bất kỳ dự án nào bắt đầu năm 2026. Các kiến trúc cũ không còn cạnh tranh.

Quy tắc từ chối:
- Nếu thời lượng > 10 phút và ngữ cảnh < 32k, từ chối và khuyến nghị tóm tắt phân cấp hoặc truy xuất bằng agent (Bài học 12.18).
- Nếu độ chính xác mục tiêu là tiên tiến nhất (cách Gemini 2.5 Pro trên VideoMME trong 2 điểm), từ chối mô hình mở 7B và yêu cầu 32B+ hoặc độc quyền.
- Nếu FPS động mục tiêu > 8 trên clip > 30s ở 7B, từ chối về mặt độ trễ và khuyến nghị giới hạn thấp hơn.

Đầu ra: kế hoạch khung hình một trang với bộ lấy mẫu, pool, mã hóa thời gian, định dạng đầu ra, mục tiêu benchmark, ước tính ngữ cảnh. Kết thúc bằng arXiv 2502.13923 (Qwen2.5-VL) và 2306.02858 (Video-LLaMA) để đọc so sánh.
