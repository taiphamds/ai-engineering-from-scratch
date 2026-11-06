---
name: voice-cloner
description: Pick cloning approach (zero-shot / conversion / adaptation), consent artifact, watermark, and safety filters for a voice-cloning deployment.
version: 1.0.0
phase: 6
lesson: 08
tags: [voice-cloning, voice-conversion, watermark, consent, safety]
---

Với tác vụ (ngôn ngữ, độ dài tham chiếu có sẵn, ngân sách thích nghi, các ràng buộc giấy phép, trạng thái đồng ý, quy mô triển khai), xuất ra:

1. Cách tiếp cận. Bản nhân zero-shot (F5-TTS / VibeVoice / Orpheus / OpenVoice V2) · chuyển đổi giọng nói (kNN-VC / màu âm OpenVoice V2) · thích nghi người nói (XTTS v2 + LoRA / fine-tune đầy đủ VITS).
2. Chuẩn bị tham chiếu. Độ dài bắt buộc, SNR (≥ 20 dB), mono 16 kHz+, cắt im lặng, `ref_text` (phải khớp chính xác với F5-TTS). Từ chối các tham chiếu có nhạc nền.
3. Hiện vật đồng ý. Sự đồng ý được ghi rõ ràng từ chủ giọng. Khuôn: tên + ngày + mục đích + phạm vi + thủ tục thu hồi. Lưu 7+ năm.
4. Watermark. Tải trọng 16 bit được nhúng bằng AudioSeal trên mọi đầu ra. Cấu hình bộ phát hiện trong CI để xác minh sự hiện diện trước khi công bố âm thanh.
5. Các bộ lọc an toàn. Từ chối prompt thực thể có tên (người nổi tiếng / chính trị gia / trẻ vị thành niên); giới hạn tốc độ theo người dùng theo giờ; nhật ký kiểm toán mọi lần sinh bản nhân; công tắc ngắt.

Từ chối phát hành nhân bản mà không có chiến lược watermarking. Từ chối nhân bản những người nổi tiếng / chính trị gia / trẻ vị thành niên được nêu tên bất kể các tuyên bố đồng ý. Từ chối tham chiếu dưới 3 s hoặc SNR &lt; 20 dB. Từ chối F5-TTS cho các triển khai thương mại (CC-BY-NC). Từ chối bản nhân xuyên ngôn ngữ mà không đánh dấu rõ khoảng cách chuyển giọng.

Đầu vào ví dụ: "Ứng dụng hỗ trợ tiếp cận: để bệnh nhân ALS lưu giọng khi còn nói được, rồi nói qua TTS sau khi mất giọng. Tiếng Anh, Mỹ."

Đầu ra ví dụ:
- Cách tiếp cận: OpenVoice V2 (MIT, zero-shot, tham chiếu 6 s). Trường hợp sử dụng hỗ trợ tiếp cận với sự đồng ý vốn có; bệnh nhân là chủ giọng.
- Chuẩn bị tham chiếu: ghi 5 × 6 s đoạn trong các điều kiện chất lượng phòng thu (phòng yên tĩnh, micro USB, 24 kHz). Lưu bản thô + các bản chép lời. Xây dựng tham chiếu trọng tâm để ổn định.
- Đồng ý: chữ ký số + xác nhận video chứng thực mục đích ("tái sử dụng giọng sau chẩn đoán"), lưu trên ổ mã hóa với thời hạn giữ 10 năm. Đường dây nóng thu hồi.
- Watermark: tải trọng AudioSeal 16 bit mã hóa `patient_id` + `clip_id`; bộ phát hiện chạy trên mọi lần sinh trong CI.
- An toàn: lọc cứng các prompt thực thể có tên; ghi nhật ký mọi lần sinh; giới hạn ROI vào phiên ứng dụng đã đăng nhập của bệnh nhân. Không cung cấp API.
