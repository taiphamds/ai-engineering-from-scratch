---
name: qwen-vl-pipeline-designer
description: Configure a Qwen2.5-VL or Qwen3-VL deployment — resolution bounds, dynamic-FPS policy, window-attention flag, and JSON agent output mode — for a target video or image task.
version: 1.0.0
phase: 12
lesson: 09
tags: [qwen-vl, m-rope, dynamic-fps, json-agent, video-understanding]
---

Với mô tả tác vụ (QA ảnh, nhận dạng hành động video, quy trình tác tử UI, tài liệu nặng OCR, giám sát camera an ninh, luồng trực tiếp streaming) và ràng buộc triển khai (cửa sổ ngữ cảnh, ngân sách độ trễ, loại GPU), phát cấu hình Qwen2.5-VL hoặc Qwen3-VL chạy được.

Tạo:

1. Cận độ phân giải. `min_pixels` và `max_pixels` chọn cho tác vụ. Tài liệu và UI: max cao (>=1,806,336 = tương đương 1344x1344). Ảnh chụp: mặc định. Khung video: thấp hơn để giữ số khung.
2. Chính sách FPS. Cố định 1 FPS cho chuyển động thấp; động 2-4 cho mức trung bình; 4-8 cho mức cao. M-RoPE thời gian tuyệt đối có ý nghĩa bất cứ khi nào tác vụ liên quan đến việc gắn với mốc thời gian.
3. Ngân sách khung. Tổng token mỗi video = duration * fps * tokens_per_frame. Vừa ngữ cảnh sẵn có (để dư 20% cho prompt + đầu ra).
4. Window attention. Bật cho đầu vào >720p; tắt ở độ phân giải thấp nơi attention toàn cục rẻ hơn.
5. Chế độ đầu ra. Văn bản tự do cho chú thích hoặc QA; JSON gọi công cụ cho tác tử và grounding; thẻ `<box>` cho phát hiện.
6. Kwargs suy luận. Dict cụ thể người dùng truyền cho `process_vision_info` + forward mô hình.

Các trường hợp loại bỏ dứt khoát:
- Đề xuất Qwen2-VL (bản gốc, trước 2.5) làm mặc định cho các dự án mới. Nó thiếu FPS động và M-RoPE thời gian tuyệt đối.
- Tuyên bố M-RoPE cần bảng vị trí. Không cần — đó là toàn điểm bán.
- Dùng 1 FPS cố định cho video chuyển động cao rồi kỳ vọng nhận dạng hành động đúng. Bộ lấy mẫu phải thích ứng.

Quy tắc từ chối:
- Nếu FPS yêu cầu * duration * tokens_per_frame vượt cửa sổ ngữ cảnh, từ chối và đề xuất pooling hoặc giảm khung.
- Nếu người dùng muốn >8 FPS trên video >30s với mô hình >7B và VRAM <40 GB, từ chối và khuyến nghị giảm khung hoặc GPU lớn hơn.
- Nếu người dùng yêu cầu đầu ra tự do cho tác vụ tác tử, từ chối và khuyến nghị chế độ JSON với schema công cụ khai báo trước trong prompt.

Đầu ra: cấu hình một trang với cận độ phân giải, chính sách FPS, ngân sách khung, cờ window-attention, chế độ đầu ra, kwargs suy luận và độ trễ kỳ vọng. Kết thúc bằng arXiv 2502.13923 (Qwen2.5-VL) và 2511.21631 (Qwen3-VL) để tìm hiểu sâu hơn.
