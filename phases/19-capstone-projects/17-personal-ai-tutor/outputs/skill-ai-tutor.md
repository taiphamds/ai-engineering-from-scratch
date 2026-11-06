---
name: ai-tutor
description: Ship an adaptive multimodal personal tutor for a specific subject with Bayesian knowledge tracing, a curriculum graph, safety filters, and a measured two-week efficacy study.
version: 1.0.0
phase: 19
lesson: 17
tags: [capstone, tutor, adaptive, bkt, fsrs, livekit, multimodal, coppa]
---

Với một môn học được cung cấp (đại số K-12 hoặc nhập môn Python), xây dựng một gia sư cá nhân với đầu vào văn bản + giọng nói + toán qua ảnh, mô hình người học theo dõi kiến thức Bayes, lựa chọn khái niệm theo đồ thị chương trình học, bộ nhớ có nhận thức COPPA, và các bộ lọc an toàn. Chạy một nghiên cứu hiệu quả hai tuần với 10 người học.

Kế hoạch xây dựng:

1. Đồ thị chương trình học trong Neo4j: 50-150 nút khái niệm với các cạnh tiên quyết và nội dung OER được gắn (OpenStax, Open Textbook).
2. Mô hình người học: theo dõi kiến thức Bayes với các tiên nghiệm cho đoán/nhầm/tốc độ học theo khái niệm; trạng thái được lưu bền vững theo người học.
3. Chính sách gia sư (LangGraph trên Claude Sonnet 4.7 với lưu đệm prompt): read_signal -> select_concept (duyệt đồ thị) -> scaffold (Socrates) -> update_mastery.
4. Bộ nhớ: kho tình tiết + ngữ nghĩa bền vững kiểu agentmemory; tự động xóa sau 1 năm có nhận thức COPPA; phụ huynh có thể truy cập để xóa.
5. Giọng nói: worker LiveKit Agents với ASR Whisper-v3-turbo và TTS Cartesia Sonic-2; tái sử dụng pipeline bài tổng kết 03.
6. Toán qua ảnh: dots.ocr hoặc PaliGemma 2 để nhận dạng phương trình; đưa đầu vào có cấu trúc cho gia sư.
7. An toàn: Llama Guard 4 đầu vào/đầu ra; bộ lọc phù hợp lứa tuổi chặn tự hại/người lớn/bạo lực; cô lập bộ nhớ theo người học.
8. Các báo cáo tiến độ PDF hàng tuần theo người học.
9. Nghiên cứu hiệu quả: 10 người học, kiểm tra trước (đường cơ sở chuẩn hóa 30 câu hỏi), 2 tuần các buổi học (3/tuần), kiểm tra sau; so sánh với nhóm tuyến tính không thích ứng.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Chênh lệch mức tiến bộ học tập | Chênh lệch kiểm tra trước/sau trong nghiên cứu 2 tuần với 10 người học |
| 20 | Mức trung thành với Socrates | Điểm theo thang đánh giá trên các mẫu bản chép lời |
| 20 | UX đa phương thức | Tính nhất quán giọng nói + ảnh + văn bản từ đầu đến cuối |
| 20 | Tư thế an toàn + quyền riêng tư | Tỷ lệ đạt Llama Guard 4 + lưu giữ có nhận thức COPPA + cô lập giữa người học |
| 15 | Độ rộng chương trình học và chất lượng đồ thị | Độ bao phủ khái niệm + tính nhất quán đồ thị tiên quyết |

Các trường hợp loại thẳng:

- Các chính sách gia sư tuôn đáp án thay vì hỏi câu tiếp theo. Socrates là một yêu cầu cứng.
- Các mô hình người học không cập nhật theo tương tác. BKT là mức sàn.
- Bộ nhớ không có lưu giữ có nhận thức COPPA. Không thể chấp nhận cho đối tượng K-12.
- Các tuyên bố hiệu quả mà không có một nhóm đường cơ sở không thích ứng.

Quy tắc từ chối:

- Từ chối triển khai mà không có Llama Guard 4 trên cả đầu vào và đầu ra.
- Từ chối lưu bền vững dữ liệu người học mà không có một bề mặt xóa phụ huynh có thể truy cập.
- Từ chối tuyên bố "thích ứng" mà không chạy đường cơ sở không thích ứng bên cạnh.

Đầu ra: một repo chứa đồ thị chương trình học, mô hình người học BKT, chính sách gia sư LangGraph, các handler đầu vào đa phương thức, pipeline giọng nói LiveKit, pipeline an toàn, bảng điều khiển phụ huynh, trình chạy nghiên cứu hiệu quả, bộ kiểm thử trước/sau, và một bài viết ghi lại chênh lệch mức tiến bộ học tập so với đường cơ sở tuyến tính với các khoảng tin cậy.
