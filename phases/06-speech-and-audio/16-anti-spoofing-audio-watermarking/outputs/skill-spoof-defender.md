---
name: spoof-defender
description: Pick detection model, watermark, provenance manifest, and operational playbook for a voice-generation / voice-auth deployment.
version: 1.0.0
phase: 6
lesson: 16
tags: [anti-spoofing, watermark, audioseal, asvspoof, c2pa, voice-fraud]
---

Với khối lượng công việc (sinh giọng nói so với xác thực giọng nói, quy mô triển khai, khu vực tuân thủ, cấu hình đối kháng), xuất ra:

1. Phát hiện (CM). AASIST · RawNet2 · NeXt-TDNN + WavLM · thương mại (Pindrop, Validsoft). Dữ liệu huấn luyện: ASVspoof 2019 / ASVspoof 5 / riêng lĩnh vực. EER mục tiêu.
2. Watermarking (sinh đầu ra). Tải trọng AudioSeal 16 bit mã hóa `(model_id, user_id, generation_ts)` · WaveVerify (phương án khác) · không (có giải thích). Bộ phát hiện chạy trong CI trên mọi đầu ra trước phát hành.
3. Nguồn gốc. Manifest C2PA được ký bằng khóa bên triển khai · metadata IPTC · không (cho âm thanh phi tiêu dùng).
4. Các biện pháp bảo vệ xác thực giọng nói (nếu áp dụng). Thử thách xác nhận sống (TTS' cụm từ ngẫu nhiên + chép lời), phát hiện tấn công phát lại (AASIST + mô hình PA), hiệu chuẩn ngưỡng sinh trắc học theo kênh.
5. Vận hành. Giữ nhật ký kiểm toán, giữ hiện vật đồng ý (7+ năm), các tín hiệu phát hiện lạm dụng (khối lượng tăng đột ngột, prompt thực thể có tên), thủ tục công tắc ngắt.

Từ chối các triển khai sinh giọng nói không có AudioSeal (hoặc watermark tương đương). Từ chối các triển khai sinh trắc học giọng nói không có phát hiện chống giả mạo — nhân bản giọng nói khiến xác thực chỉ cosine dễ dàng bị vượt qua. Từ chối các triển khai chỉ dựa vào manifest nguồn gốc (có thể bị bỏ). Từ chối các ngưỡng phát hiện được huấn luyện trên ASVspoof 2019 cho các triển khai thực tế không có quét hiệu chuẩn kênh.

Đầu vào ví dụ: "IVR dịch vụ khách hàng ngân hàng. Mở khóa sinh trắc học giọng nói + tác tử giọng nói do AI sinh. 10M cuộc gọi/tháng. Mỹ + EU."

Đầu ra ví dụ:
- Phát hiện: Pindrop thương mại (ưu tiên) hoặc NeXt-TDNN + WavLM mở. Huấn luyện trên ASVspoof 5 + 100k mẫu cuộc gọi riêng ngân hàng. EER mục tiêu &lt; 0.5% trên dữ liệu trong lĩnh vực.
- Watermarking: tải trọng AudioSeal 16 bit trên mọi phát ngôn TTS đầu ra; tải trọng mã hóa bank_id + session_id + timestamp. Bộ phát hiện xác minh trước truyền.
- Nguồn gốc: manifest C2PA trên các quy trình xuất âm thanh cho khách hàng; các cuộc gọi chỉ nội bộ bỏ qua.
- Xác thực giọng nói: thử thách xác nhận sống ở mỗi lần xác thực (TTS cụm từ 4 chữ số ngẫu nhiên; người dùng lặp + bộ phát hiện + bộ chép lời). Chống giả mạo chạy trên mọi nỗ lực xác thực đầu vào. Ngưỡng sinh trắc học tại FAR 0.1%, FRR 1%.
- Vận hành: giữ 7 năm sự đồng ý + nhật ký kiểm toán trong khu vực (dữ liệu EU lưu tại EU). Cảnh báo khi khối lượng yêu cầu nhân bản tăng đột ngột &gt; 2σ; công tắc ngắt khi phát hiện lạm dụng.
