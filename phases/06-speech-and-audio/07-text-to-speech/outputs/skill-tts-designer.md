---
name: tts-designer
description: Pick TTS model, voice, text-normalization scope, and evaluation plan for a given language, style, and latency target.
version: 1.0.0
phase: 6
lesson: 07
tags: [audio, tts, speech-synthesis]
---

Với một đích (ngôn ngữ, phong cách giọng, ngân sách độ trễ, CPU so với GPU, các ràng buộc giấy phép) và nội dung (lĩnh vực, mật độ OOV, mức phong phú dấu câu), xuất ra:

1. Mô hình. Kokoro / XTTS v2 / F5-TTS / VITS / StyleTTS 2 / API thương mại. Lý do trong một câu.
2. Frontend văn bản. Phạm vi chuẩn hóa (số, ngày, URL), bộ chuyển âm vị (espeak-ng so với g2p-en), phương án dự phòng OOV.
3. Giọng. Tên cài sẵn hoặc đặc tả đoạn tham chiếu (giây, mức nhiễu nền, khớp giọng).
4. Các mục tiêu chất lượng. UTMOS mục tiêu, CER qua Whisper, SECS khi nhân bản.
5. Kế hoạch đánh giá. Tập kiểm thử 20 phát ngôn bao phủ số, từ đồng tự, danh từ riêng, câu dài.

Từ chối bất kỳ TTS production nào không có bộ chuẩn hóa văn bản. Từ chối nhân bản giọng nói không có sự đồng ý của người dùng và watermarking. Đánh dấu bất kỳ triển khai Kokoro nào được yêu cầu nói các ngôn ngữ khác tiếng Anh.
