---
name: video-qa
description: Build a video understanding pipeline with scene segmentation, multi-vector indexing, temporal grounding, and timestamped citations.
version: 1.0.0
phase: 19
lesson: 12
tags: [capstone, video, multimodal, gemini, qwen-vl, molmo, transnet, qdrant]
---

Với 100 giờ video được cung cấp, xây dựng một pipeline tiếp nhận và một hệ thống truy vấn trả lời các câu hỏi ngôn ngữ tự nhiên bằng các mốc thời gian (start, end) cùng bản xem trước khung hình.

Kế hoạch xây dựng:

1. Tiếp nhận video (URL YouTube hoặc MP4); giảm độ phân giải xuống 720p nếu cần.
2. Phân đoạn cảnh với TransNetV2 hoặc PySceneDetect; phát ra `[{scene_id, start_ms, end_ms, keyframe_path}]`.
3. ASR với Whisper-v3-turbo (faster-whisper) tạo các mốc thời gian ở mức từ; chia theo cảnh.
4. Chú thích VLM với Gemini 2.5 Pro hoặc Qwen3-VL-Max hoặc Molmo 2; phát ra chú thích + embedding khung hình.
5. Chỉ mục đa vector Qdrant với ba vector có tên cho mỗi cảnh (caption_emb, frame_emb, transcript_emb) và payload {video_id, scene_id, start_ms, end_ms, keyframe_url}.
6. Truy vấn: ba truy vấn dense song song; hợp nhất thứ hạng nghịch đảo để hợp nhất; top-k=5 cảnh.
7. Định vị thời gian (adapter TimeLens hoặc VideoITG) tinh chỉnh (start, end) trong cảnh đứng đầu.
8. Tổng hợp VLM (Gemini 2.5 Pro) với truy vấn + top-3 đoạn cảnh + bản chép lời; yêu cầu các trích dẫn `(video_id, start_ms, end_ms)`.
9. Đánh giá trên ActivityNet-QA, NeXT-GQA, cùng một tập tùy chỉnh 100 truy vấn gắn nhãn thủ công. Báo cáo độ chính xác tổng thể và theo lớp câu hỏi (mô tả, đếm, loại hành động).

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | IoU định vị thời gian | IoU trên tập định vị được giữ riêng |
| 20 | Độ chính xác hỏi đáp | NeXT-GQA và tập tùy chỉnh 100 truy vấn |
| 20 | Thông lượng tiếp nhận | Số giờ video được lập chỉ mục trên mỗi đô la |
| 20 | UI và UX trích dẫn | Liên kết mốc thời gian, dải hình thu nhỏ, nhảy đến khung hình |
| 15 | Tỷ lệ ảo giác | Độ chính xác đếm và loại hành động được báo cáo riêng |

Các trường hợp loại thẳng:

- Pipeline gộp một vector duy nhất cho mỗi cảnh. Đa vector là bắt buộc để thể hiện sự khác biệt giữa các lớp.
- Các câu trả lời không có trích dẫn (start, end).
- Báo cáo một độ chính xác tổng thể mà không có phân tích tập con đếm/hành động.
- Tổng hợp VLM không nhận trực tiếp các khung hình cảnh (đầu vào chỉ có văn bản làm mất căn cứ thị giác).

Quy tắc từ chối:

- Từ chối phục vụ các video có nguồn gốc giấy phép không rõ ràng; yêu cầu một nhãn giấy phép trên mỗi video_id.
- Từ chối tuyên bố phản hồi "thời gian thực" ở tốc độ tiếp nhận cao hơn thông lượng đã đo.
- Từ chối che giấu con số ảo giác đếm/hành động trong một số liệu độ chính xác tổng thể.

Đầu ra: một repo chứa pipeline phân đoạn cảnh + ASR + chú thích, collection Qdrant đa vector, adapter định vị thời gian, trình xem Next.js 15 với các liên kết sâu mốc thời gian, các kết quả đánh giá ba benchmark (ActivityNet-QA, NeXT-GQA, tùy chỉnh), và một bài viết nêu tên ba lớp lỗi đếm hoặc loại hành động mà bạn đã quan sát cùng thay đổi truy xuất hoặc tổng hợp đã làm giảm từng lớp.
