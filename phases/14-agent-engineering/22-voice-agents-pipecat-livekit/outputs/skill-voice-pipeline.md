---
name: voice-pipeline
description: Scaffold a Pipecat-shaped voice pipeline (VAD + STT + LLM + TTS + transport) with barge-in, confidence gating, and latency budget enforcement.
version: 1.0.0
phase: 14
lesson: 22
tags: [voice, pipecat, livekit, webrtc, latency]
---

Với một đặc tả sản phẩm giọng nói (ngôn ngữ, phương thức truyền tải, các nhà cung cấp), tạo khung một pipeline dựa trên frame.

Tạo:

1. Kiểu `Frame` với `kind`, `payload`, `direction` (xuôi dòng / ngược dòng).
2. Các bộ xử lý: `VAD`, `STT`, `LLM`, `TTS`, `Transport`. Mỗi bộ có `process(frame)`.
3. Hàm trợ giúp `link()` nối chuỗi các bộ xử lý về trước và về sau.
4. Xử lý frame hủy: đường UPSTREAM từ truyền tải đến TTS đến LLM đến STT, loại bỏ công việc đang chờ ở mỗi giai đoạn.
5. Các bộ quan sát: các thước đo độ trễ cho từng giai đoạn; phát ra một span OTel cho mỗi frame đi qua một bộ xử lý (Bài 23).
6. Cổng độ tin cậy trên STT: dưới ngưỡng, phát ra một frame văn bản "vui lòng nhắc lại" thay vì bản chép lời.

Các trường hợp từ chối cứng:

- Pipeline không có xử lý UPSTREAM. Ngắt lời không phải tùy chọn đối với giọng nói.
- Các lời gọi LLM không có streaming. Độ trễ token đầu tiên chiếm ưu thế; phải được truyền dạng luồng.
- STT không xét độ tin cậy. Đưa các bản chép lời sai cho LLM tạo ra các câu trả lời sai.

Các quy tắc từ chối:

- Nếu độ trễ từ đầu đến cuối vượt quá 1500ms trên một lần chạy nguội, từ chối phát hành. Tối ưu hóa chuỗi hoặc sử dụng một MultimodalAgent (âm thanh trực tiếp LiveKit).
- Nếu sản phẩm ưu tiên điện thoại và pipeline không có bộ điều hợp SIP, từ chối. Định tuyến qua LiveKit SIP hoặc một nền tảng (Vapi/Retell).
- Nếu sản phẩm mang âm thanh PII mà không mã hóa khi truyền, từ chối.

Đầu ra: `frames.py`, `processors.py`, `pipeline.py`, `observers.py`, `README.md` giải thích ngân sách độ trễ, thiết kế ngắt lời và lựa chọn truyền tải. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 23 (OTel), Bài 24 (các backend khả năng quan sát) hoặc tài liệu LiveKit cho các chi tiết WebRTC.
