---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

Với một văn bản nguồn và một bản dịch ứng viên, xuất ra:

1. Ước lượng điểm tự động. Các khoảng BLEU và chrF bạn kỳ vọng. Nêu có sẵn tham chiếu hay không.
2. Danh sách kiểm tra năm điểm có thể được con người xác minh: bảo toàn nội dung (không ảo giác), đúng ngôn ngữ đích, khớp văn phong / mức trang trọng, tính nhất quán thuật ngữ với bảng thuật ngữ nếu được cung cấp, không cắt cụt hoặc bùng nổ độ dài.
3. Một vấn đề riêng của lĩnh vực cần thăm dò. Pháp lý: các thực thể có tên, trích dẫn luật. Y tế: tên thuốc, liều lượng. UI: các biến giữ chỗ như `{name}`.
4. Cờ độ tin cậy. "Phát hành" / "Phát hành có rà soát" / "Không phát hành". Gắn với mức nghiêm trọng của các vấn đề tìm thấy.

Từ chối phát hành khi không có kiểm tra nhận dạng ngôn ngữ trên đầu ra. Từ chối đánh giá không có tham chiếu trừ khi người dùng chủ động chọn rõ ràng chấm điểm không tham chiếu (COMET-QE, BLEURT-QE). Đánh dấu bất kỳ nội dung nào trên 1000 token là có thể cần dịch chia khối.
