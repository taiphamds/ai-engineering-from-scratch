---
name: feature-extractor
description: Pick feature type, mel count, frame/hop, and normalization to match a downstream audio model.
version: 1.0.0
phase: 6
lesson: 02
tags: [audio, features, spectrogram, mel]
---

Với một mô hình đích (ASR / TTS / bộ phân loại / người nói / âm nhạc) và âm thanh đầu vào (tần số lấy mẫu, lĩnh vực), xuất ra:

1. Loại đặc trưng. Log-mel, mel, MFCC, dạng sóng thô hoặc codec rời rạc (EnCodec, SoundStream). Lý do trong một câu.
2. Số mel và phạm vi tần số. `n_mels`, `fmin`, `fmax`. Lý do gắn với lĩnh vực (tiếng nói so với âm nhạc) và mô hình đích.
3. Khung và bước nhảy. `frame_len`, `hop_len`, loại cửa sổ. Lý do gắn với độ phân giải thời gian bắt buộc.
4. Chuẩn hóa. Trung bình/phương sai theo phát ngôn, thống kê toàn cục hoặc dB với tham chiếu cố định; trước hoặc sau trích xuất đặc trưng.
5. Đoạn mã xác thực. Python in hình dạng kết quả, min/max, trung bình/độ lệch chuẩn trên một đoạn tham chiếu 1 giây và khẳng định chúng khớp huấn luyện.

Từ chối phát hành một pipeline đặc trưng có khung/bước nhảy/số mel lệch khỏi cấu hình huấn luyện đã công bố của mô hình đích. Đánh dấu bất kỳ thiết lập dựa trên MFCC nào cho Whisper hoặc Parakeet là sai — các mô hình đó tiêu thụ log-mel. Đánh dấu bất kỳ bộ trích xuất đặc trưng nào không có khẳng định chuẩn hóa.
