---
name: realtime-voice-pipeline
description: Pick transport, VAD, streaming STT, LLM, streaming TTS, and orchestration for a target end-to-end latency.
version: 1.0.0
phase: 6
lesson: 11
tags: [voice-agent, livekit, pipecat, silero, streaming, latency]
---

Với đích (độ trễ P50/P95, ngôn ngữ, kênh, ngoại tuyến so với đám mây, khối lượng cuộc gọi), xuất ra:

1. Truyền tải. WebRTC (LiveKit / Daily) · WebSocket · SIP trunking (Twilio / Telnyx). Lý do gắn với khả năng chịu jitter + trường hợp sử dụng.
2. VAD + chuyển lượt. Silero VAD (mở, TPR 99.5%) · Cobra (thương mại) · LiveKit turn-detector. Ngưỡng, thời lượng tiếng nói tối thiểu, thời gian duy trì sau im lặng.
3. STT luồng. Parakeet TDT (mở nhanh nhất) · Kyutai STT (với thủ thuật flush) · Deepgram Nova-3 (API, ~150 ms) · Whisper-streaming. Lý do.
4. LLM + truyền luồng. Ghim 20 token đầu trước khi TTS bắt đầu. Mô hình + cấu hình truyền luồng + các biện pháp bảo vệ prompt injection.
5. TTS luồng. Kokoro-82M (~100 ms TTFA) · Orpheus · Cartesia Sonic · ElevenLabs Turbo. Gói giọng hoặc biện pháp bảo vệ nhân bản (Bài 8).
6. Điều phối. LiveKit Agents · Pipecat · Vapi · Retell · Rust tùy chỉnh. Lý do gắn với kỹ năng nhóm + quy mô.
7. Khả năng quan sát. Các histogram P50/P95/P99 theo giai đoạn; tỷ lệ ngắt dương tính giả; tỷ lệ rớt cuộc gọi; WER trên các mẫu cuộc gọi.

Từ chối các triển khai đệm toàn bộ phát ngôn trước STT. Từ chối TTS không truyền luồng. Từ chối đánh giá bằng độ trễ trung bình — yêu cầu P95. Từ chối các nền tảng được quản lý (Vapi / Retell) cho &gt; 100k phút/tháng mà không có so sánh chi phí với tự xây dựng.

Đầu vào ví dụ: "Tác tử giọng nói cho báo giá bảo hiểm xe hơi. &lt; 500 ms P95. Tiếng Anh, Mỹ. 50k phút/tuần. Tuân thủ: gần HIPAA (không PII trong nhật ký)."

Đầu ra ví dụ:
- Truyền tải: LiveKit Agents + Twilio SIP. Được chứng minh ở quy mô trung tâm cuộc gọi, chủ động chọn chế độ HIPAA.
- VAD: Silero VAD @ ngưỡng 0.45, tiếng nói tối thiểu 220 ms, thời gian duy trì sau im lặng 400 ms. Lớp phủ LiveKit turn-detector.
- STT: Deepgram Nova-3 English (~150 ms P95); quay về Parakeet-TDT nếu yêu cầu kiểm toán tại chỗ.
- LLM: GPT-4o truyền luồng qua OpenAI realtime API; bảo vệ trước prompt injection bằng một bộ lọc sau; ghim 20 token đầu vào TTS.
- TTS: Cartesia Sonic 2 (~150 ms TTFA, không dùng nhân bản giọng nói — giọng được định nghĩa trước).
- Điều phối: LiveKit Agents. Khả năng quan sát qua Hamming AI cho production.
- Nhật ký: bỏ CVV / SSN / DOB bằng một lượt regex + NER trước khi lưu bền. Giữ 30 ngày.
