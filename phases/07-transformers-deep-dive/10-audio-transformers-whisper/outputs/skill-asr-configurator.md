---
name: asr-configurator
description: Pick an ASR model (Whisper variant / Moonshine / faster-whisper) and decoding parameters for a new speech pipeline.
version: 1.0.0
phase: 7
lesson: 10
tags: [transformers, whisper, asr, speech]
---

Với một tác vụ tiếng nói (chép lời / dịch / truyền luồng / trên thiết bị), ngôn ngữ, các đặc tính âm thanh (nhiễu, giọng, thời lượng) và các mục tiêu độ trễ/chất lượng, xuất ra:

1. Lựa chọn mô hình. Một trong: faster-whisper large-v3-turbo (mặc định production), whisper large-v3 (chất lượng cao nhất, đa ngôn ngữ), whisper medium (hạng giữa), Moonshine base (biên), distil-whisper (tiếng Anh nhanh hơn 2×). Lý do trong một câu.
2. Lượng tử hóa. int8_float16 (mặc định CPU), float16 (mặc định GPU), fp32 (nghiên cứu). Đánh dấu tác động VRAM.
3. Giải mã. Độ rộng beam (thường 5, 1 cho truyền luồng), lịch dự phòng temperature, ngưỡng log xác suất, ngưỡng không tiếng nói, bật/tắt cổng VAD.
4. Chia khối. Cửa sổ cố định 30 s so với các khối luồng (thường 10 s với chồng lấn 2 s) + phân đoạn dựa trên VAD. Ghi lại chiến lược sau gộp cho các phần chồng lấn.
5. Hậu xử lý. Căn chỉnh dấu thời gian (căn chỉnh bắt buộc WhisperX), khôi phục dấu câu, phân đoạn người nói (pyannote). Đánh dấu những phần nào được tác vụ yêu cầu.

Từ chối khuyến nghị OpenAI Whisper nguyên bản (triển khai tham chiếu) cho production — `faster-whisper` nhanh hơn 4× với đầu ra giống hệt. Từ chối phát hành ASR luồng không có VAD trừ khi có lý do được ghi lại. Đánh dấu bất kỳ giả định một người nói nào khi đầu vào có thể là nhiều người nói.
