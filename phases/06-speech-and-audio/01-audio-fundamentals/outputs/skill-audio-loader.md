---
name: audio-loader
description: Validate a raw audio file against a target model's expectations and resample it safely.
version: 1.0.0
phase: 6
lesson: 01
tags: [audio, speech, preprocessing]
---

Với một file âm thanh (đường dẫn, số kênh, tần số lấy mẫu, độ sâu bit, codec) và một mô hình đích (ASR / TTS / bộ phân loại có tần số lấy mẫu và số kênh bắt buộc), xuất ra:

1. Các điểm không khớp. Liệt kê mọi chiều mà file không khớp đích (sr, số kênh, mức sàn thời lượng, kiểm tra clipping).
2. Kế hoạch lấy mẫu lại. sr nguồn, sr đích, thư viện lấy mẫu lại (`torchaudio.transforms.Resample` hoặc `librosa.resample`), loại bộ lọc chống chồng phổ.
3. Kế hoạch kênh. Chiến lược gộp mono (trung bình so với chỉ bên trái), hoặc truyền nguyên nhiều kênh khi mô hình hỗ trợ.
4. Chuẩn hóa. Chuẩn hóa đỉnh so với RMS, mục tiêu dBFS, biện pháp bảo vệ clipping.
5. Đoạn mã xác thực. Python tải file, chạy các phép biến đổi và khẳng định mảng cuối khớp `(target_sr, dtype, channel_count, range)`.

Từ chối giảm tần số lấy mẫu mà không có bộ lọc chống chồng phổ. Từ chối tăng tần số lấy mẫu vượt 2 lần mà không có bộ lọc tái tạo. Đánh dấu bất kỳ file đầu vào nào có các đỉnh clipping vượt ±0.999 hoặc độ lệch DC trên ±0.01.
