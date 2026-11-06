---
name: vad-tuner
description: Pick VAD model, threshold, silence hangover, pre-roll, and turn-detection strategy for a voice agent.
version: 1.0.0
phase: 6
lesson: 14
tags: [vad, silero, cobra, turn-detection, flush-trick]
---

Với khối lượng công việc (tiêu dùng / trung tâm cuộc gọi / biên / hỗ trợ tiếp cận; cấu hình nhiễu; hỗn hợp ngôn ngữ; độ trễ), xuất ra:

1. VAD. Silero VAD (mặc định) · Cobra (accuracy thương mại) · phân đoạn pyannote (cấp phân đoạn người nói) · WebRTC VAD (cũ / tí hon). Lý do trong một câu.
2. Các tham số. Ngưỡng (0.3-0.5), tiếng nói tối thiểu (200-300 ms), thời gian duy trì sau im lặng (400-800 ms), đệm trước (250-500 ms).
3. Phát hiện lượt ngữ nghĩa. Bật (LiveKit turn-detector hoặc MLP tùy chỉnh) hay không. Lý do gắn với các mẫu tiếng nói người dùng dự kiến.
4. Thủ thuật flush. Bật (nếu STT hỗ trợ — Kyutai / Deepgram) hay không. Mức tiết kiệm độ trễ dự kiến.
5. Các biện pháp bảo vệ. Từ chối tiếng nói ngắn hơn thời lượng tối thiểu; luôn giữ đệm trước; giới hạn ghi đè thời gian duy trì sau im lặng theo người dùng; mở khi lỗi nếu dịch vụ VAD ngừng (coi mọi thứ là tiếng nói).

Từ chối VAD chỉ năng lượng cho production — quá nhiễu. Từ chối thời gian duy trì sau im lặng bằng không — sẽ ngắt người dùng. Từ chối VAD dựa trên Whisper khi có Silero chuyên dụng (chậm hơn, kém chính xác hơn).

Đầu vào ví dụ: "IVR trung tâm cuộc gọi cho đặt lại vé máy bay. Nền ồn (sân bay). Tiếng Anh + Tây Ban Nha. Phát hiện lượt &lt; 500 ms."

Đầu ra ví dụ:
- VAD: Cobra (thương mại) vì lợi thế kháng nhiễu. Quay về Silero nếu chi phí quá cao.
- Các tham số: ngưỡng 0.4 (mức nhiễu nền sân bay cao); tiếng nói tối thiểu 300 ms; thời gian duy trì sau im lặng 600 ms (người dùng thường dừng trong IVR để đọc số chuyến bay); đệm trước 400 ms.
- Lượt ngữ nghĩa: bật LiveKit turn-detector — các khoảng dừng giữa câu phổ biến ("Tôi cần đổi chuyến bay... sang ngày mai").
- Thủ thuật flush: bật trên Deepgram streaming. Tiết kiệm dự kiến: độ trễ kết thúc lượt 400 ms → 150 ms.
- Các biện pháp bảo vệ: mở khi lỗi nếu không truy cập được Cobra/Deepgram; ghi nhật ký kiểm toán mọi sự kiện VAD kích hoạt để tinh chỉnh.
