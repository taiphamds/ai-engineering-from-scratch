---
name: voice-agent
description: Build a real-time voice agent with sub-800ms first-audio-out, barge-in handling, and mid-conversation tool use.
version: 1.0.0
phase: 19
lesson: 03
tags: [capstone, voice, webrtc, livekit, pipecat, asr, tts, streaming]
---

Với miền (hỗ trợ khách hàng, lập lịch, trợ lý bán lẻ), triển khai agent giọng nói WebRTC giữ âm thanh đầu tiên đầu cuối dưới 800ms trong khi xử lý ngắt lời, gọi công cụ và mất gói.

Kế hoạch xây dựng:

1. Dựng phòng LiveKit Agents 1.0 với client web truyền âm thanh micro. Thêm gateway PSTN Twilio để bao phủ điện thoại.
2. Chạy ASR truyền luồng (Deepgram Nova-3 được lưu trữ hoặc faster-whisper Whisper-v3-turbo trên g5.xlarge). Đăng ký bản chép lời từng phần và cuối.
3. Chạy Silero VAD v5 trên khung 20ms. Khi giọng nói kết thúc, chấm phần mới nhất bằng bộ phát hiện lượt LiveKit; chỉ chốt lượt hoàn tất khi im lặng VAD >= 500ms và điểm hoàn tất >= 0.6.
4. Truyền luồng LLM (GPT-4o-realtime, Gemini 2.5 Flash Live hoặc Claude Haiku 4.5 xếp tầng). Chuyển token đầu cho TTS trong 200ms.
5. Truyền luồng TTS (Cartesia Sonic-2 hoặc ElevenLabs Flash v3). Đoạn âm thanh đầu phải rời máy chủ trong 200ms từ token LLM đầu.
6. Ngắt lời: khi VAD phát hiện giọng nói mới trong SPEAKING hoặc THINKING, hủy TTS, bỏ đầu ra LLM còn lại, kích hoạt lại ASR. Công bố span `tts_canceled`.
7. Kênh phụ công cụ: chạy lệnh gọi hàm đồng thời; nếu độ trễ > 300ms, xuất câu lấp khoảng trống xác nhận để luồng âm thanh không bao giờ đình trệ.
8. Ghi 100 cuộc gọi. Đo WER so bản chép lời giữ riêng, tỷ lệ cắt nhầm trên phép đo chuẩn Hamming VAD, âm thanh đầu tiên p50, MOS NISQA và hành vi dưới mất 3% gói.
9. Kiểm thử tải 50 cuộc gọi đồng thời trên một g5.xlarge bằng người gọi tổng hợp; báo cáo âm thanh đầu tiên p95 duy trì.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Độ trễ đầu cuối | p50 âm thanh đầu tiên dưới 800ms trên 100 cuộc gọi ghi |
| 20 | Chất lượng luân phiên lượt | Tỷ lệ cắt nhầm dưới 3% trên phép đo chuẩn Hamming VAD |
| 20 | Tính đúng dùng công cụ | Gọi công cụ giữa hội thoại trả dữ liệu đúng không đình trệ âm thanh |
| 20 | Độ tin cậy dưới mất gói | WER và ổn định luân phiên lượt khi chèn mất 3% gói |
| 15 | Đầy đủ bộ kiểm thử đánh giá | Phép đo tái lập được với cấu hình công khai |

Các trường hợp loại bỏ dứt khoát:

- Pipeline không truyền luồng (ASR theo lô, TTS theo lô) không đạt mục tiêu độ trễ.
- Mọi chính sách ngắt lời không hủy bộ đệm TTS ngay. Hủy trễ tạo suy giảm trải nghiệm người dùng tệ nhất.
- Lệnh gọi công cụ chặn đồng bộ luồng LLM. Phải chạy kênh phụ.

Quy tắc từ chối:

- Từ chối triển khai không có VAD hoặc bộ phát hiện lượt. Luân phiên lượt bằng thời gian chờ cố định tạo tỷ lệ cắt không chấp nhận được.
- Từ chối báo cáo MOS không ghi rõ con người đánh giá hay đại diện NISQA.
- Từ chối báo cáo "độ trễ p50 dưới X" không có ít nhất 100 cuộc gọi ghi và công bố dấu vết cuộc gọi.

Đầu ra: repo chứa worker agent LiveKit, cấu hình gateway PSTN, bộ kiểm thử đánh giá 100 cuộc gọi, bảng điều khiển giọng nói Langfuse công khai, so sánh cạnh nhau với một đối thủ được lưu trữ (Retell, Vapi hoặc trực tiếp OpenAI Realtime API) và bài viết về ba thất bại luân phiên lượt lớn nhất bạn quan sát và việc chỉnh bộ phát hiện sửa từng lỗi.
