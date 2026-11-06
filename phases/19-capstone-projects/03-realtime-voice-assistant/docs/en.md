# Capstone 03 — Real-Time Voice Assistant (ASR to LLM to TTS)

> Agent giọng nói có cảm giác đúng có độ trễ đầu cuối dưới 800ms, biết khi bạn ngừng nói, xử lý ngắt lời và gọi công cụ không đình trệ. Retell, Vapi, LiveKit Agents và Pipecat đều đạt mức này năm 2026. Chúng làm bằng cùng hình dạng: ASR truyền luồng, bộ phát hiện lượt, LLM truyền luồng và TTS truyền luồng, nối qua WebRTC với ngân sách độ trễ quyết liệt mỗi chặng. Xây một hệ thống, đo WER, MOS, tỷ lệ cắt nhầm và chạy dưới mất gói.

**Type:** Capstone
**Languages:** Python (agent + pipeline), TypeScript (web client)
**Prerequisites:** Phase 6 (speech and audio), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 17 (infrastructure)
**Phases exercised:** P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 hours

## Problem

Giọng nói là nhóm UX AI chuyển động nhanh nhất 2025-2026. Trần kỹ thuật giảm mỗi quý. OpenAI Realtime API, Gemini 2.5 Live, Cartesia Sonic-2, ElevenLabs Flash v3, LiveKit Agents 1.0 và Pipecat 0.0.70 đều đưa âm thanh đầu tiên dưới 800ms trong tầm tay. Tiêu chuẩn không chỉ độ trễ. Đó là cảm giác tương tác: không cắt ngang người dùng, không bị cắt ngang, khôi phục từ ngắt giữa câu, gọi công cụ giữa hội thoại không đình trệ âm thanh, trụ qua mạng di động chập chờn.

Bạn không đạt được bằng ghép ba lệnh gọi REST. Kiến trúc là pipeline truyền luồng đầu cuối. Xây nó và chế độ lỗi hiện ra: VAD chỉnh cho âm thanh điện thoại kích hoạt bởi TV nền, bộ phát hiện lượt chờ dấu câu không bao giờ đến, TTS đệm 400ms trước xuất. Bài tổng kết là sửa từng lỗi dưới tải và công bố báo cáo độ trễ-và-chất lượng.

## Concept

Pipeline có năm giai đoạn truyền luồng: **âm thanh vào** (WebRTC từ trình duyệt hoặc PSTN), **ASR** (bản chép lời từng phần từ Deepgram Nova-3 hoặc faster-whisper), **phát hiện lượt** (VAD cộng mô hình phát hiện lượt nhỏ đọc bản chép lời từng phần để tìm dấu hiệu hoàn tất), **LLM** (truyền token ngay khi lượt được phán hoàn tất), **TTS** (truyền âm thanh ra trong ~200ms từ token LLM đầu).

Ba mối quan tâm xuyên suốt. **Ngắt lời**: khi người dùng bắt đầu nói lúc agent đang nói, TTS hủy và ASR tiếp nhận ngay. **Dùng công cụ**: lệnh gọi hàm giữa hội thoại (thời tiết, lịch) phải chạy kênh phụ không đình trệ âm thanh; agent điền trước token xác nhận ("một giây...") nếu độ trễ vượt 300ms. **Áp lực ngược**: dưới mất gói, bản chép lời từng phần được giữ, VAD tăng ngưỡng cổng giọng nói và agent tránh nói đè thông điệp chưa được xác nhận.

Tiêu chuẩn đo định lượng. WER dưới 8% trên phép đo chuẩn Hamming VAD ở SNR 15 dB. Âm thanh đầu tiên p50 dưới 800ms trên 100 cuộc gọi đo. Tỷ lệ cắt nhầm dưới 3%. MOS trên 4.2 cho TTS. 50 cuộc gọi đồng thời trên một g5.xlarge. Các số này là sản phẩm bàn giao.

## Architecture

```
browser / Twilio PSTN
        |
        v
   WebRTC / SIP edge
        |
        v
  LiveKit Agents 1.0  (or Pipecat 0.0.70)
        |
   +----+--------------+--------------+-----------------+
   |                   |              |                 |
   v                   v              v                 v
  ASR              VAD v5         turn-detector     side-channel
(Deepgram         (Silero)          (LiveKit)        tools
 Nova-3 /         speech-gate    completion score    (weather,
 Whisper-v3)      per 20ms        on partials        calendar)
   |                   |              |
   +--------+----------+--------------+
            v
        LLM (streaming)
     GPT-4o-realtime / Gemini 2.5 Flash /
     cascaded Claude Haiku 4.5
            |
            v
        TTS streaming
     Cartesia Sonic-2 / ElevenLabs Flash v3
            |
            v
     audio back to caller
            |
            v
   OpenTelemetry voice traces -> Langfuse
```

## Stack

- Truyền tải: LiveKit Agents 1.0 (WebRTC) cộng gateway PSTN Twilio; Pipecat 0.0.70 là framework thay thế
- ASR: Deepgram Nova-3 (truyền luồng, phần đầu dưới 300ms) hoặc faster-whisper Whisper-v3-turbo tự lưu trữ
- VAD: Silero VAD v5 cộng bộ phát hiện lượt LiveKit (transformer nhỏ đọc bản chép lời từng phần)
- LLM: OpenAI GPT-4o-realtime cho tích hợp chặt, Gemini 2.5 Flash Live hoặc Claude Haiku 4.5 xếp tầng (hoàn thành truyền luồng, đường âm thanh riêng)
- TTS: Cartesia Sonic-2 (byte đầu nhanh nhất), ElevenLabs Flash v3 hoặc Orpheus mã nguồn mở để tự lưu trữ
- Công cụ: kênh phụ FastMCP cho thời tiết/lịch/đặt chỗ; agent xuất trước câu lấp khoảng trống nếu công cụ mất >300ms
- Khả năng quan sát: span giọng nói OpenTelemetry, dấu vết giọng nói Langfuse có phát lại âm thanh
- Triển khai: một g5.xlarge (VRAM 24GB) cho Whisper + Orpheus tự lưu trữ; API được lưu trữ để độ trễ thấp nhất

```figure
ce-voice-latency
```

## Build It

1. **Phiên WebRTC.** Dựng phòng LiveKit và client web truyền âm thanh micro. Trên máy chủ, gắn worker agent tham gia phòng.

2. **Truyền luồng ASR.** Đưa khung PCM 20ms vào Deepgram Nova-3 (hoặc faster-whisper trên GPU). Đăng ký bản chép lời từng phần và cuối. Ghi độ trễ theo phần.

3. **VAD và bộ phát hiện lượt.** Chạy Silero VAD v5 trên luồng khung. Khi sự kiện kết thúc giọng nói, kích hoạt bộ phát hiện lượt LiveKit trên bản chép lời từng phần mới nhất. Chỉ chốt "lượt hoàn tất" khi VAD báo im lặng 500ms và bộ phát hiện chấm hoàn tất > 0.6.

4. **Luồng LLM.** Khi lượt hoàn tất, bắt đầu lệnh gọi LLM với hội thoại đang diễn ra cộng bản chép lời cuối. Truyền token ra. Ở token đầu, chuyển giao cho TTS.

5. **Luồng TTS.** Cartesia Sonic-2 truyền đoạn âm thanh trở lại. Đoạn đầu phải rời máy chủ trong 200ms từ token LLM đầu. Phát đoạn vào phòng LiveKit; client phát qua bộ đệm jitter WebRTC.

6. **Ngắt lời.** Khi VAD phát hiện giọng nói người dùng mới lúc TTS phát, hủy luồng TTS ngay, bỏ đầu ra LLM còn lại và kích hoạt lại ASR. Công bố span `tts_canceled`.

7. **Kênh phụ công cụ.** Đăng ký thời tiết và lịch làm công cụ gọi hàm. Khi gọi, thực hiện đồng thời; nếu không hoàn tất trong 300ms, cho LLM xuất "một giây, để tôi kiểm tra" làm câu lấp khoảng trống; tiếp tục khi công cụ trả.

8. **Bộ kiểm thử đánh giá.** Ghi 100 cuộc gọi. Tính WER (so bản chép lời giữ riêng), tỷ lệ cắt nhầm (TTS hủy khi người dùng giữa câu), âm thanh đầu tiên p50, MOS TTS (con người hoặc NISQA) và kiểm thử jitter-mất gói (bỏ 3% gói).

9. **Kiểm thử tải.** Tạo 50 cuộc gọi đồng thời trên một g5.xlarge bằng người gọi tổng hợp. Đo âm thanh đầu tiên p95 duy trì.

## Use It

```
caller: "what is the weather in tokyo tomorrow"
[asr  ] partial @280ms: "what is the"
[asr  ] partial @540ms: "what is the weather"
[turn ] completion score 0.82 at @820ms; commit
[llm  ] tool call emitted @880ms
[tool ] weather.tokyo tomorrow -> 68/52 partly cloudy @940ms
[llm  ] first token @990ms
[tts  ] first audio-out @1040ms: "Tokyo tomorrow will be partly cloudy..."
turn latency: 1040ms user-stop -> audio-out
```

## Ship It

`outputs/skill-voice-agent.md` là sản phẩm bàn giao. Với miền (hỗ trợ khách hàng, lập lịch hoặc kiosk), dựng agent LiveKit với pipeline ASR/VAD/LLM/TTS chỉnh theo tiêu chuẩn đo. Tiêu chí chấm:

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Độ trễ đầu cuối | p50 âm thanh đầu tiên dưới 800ms trên 100 cuộc gọi ghi |
| 20 | Chất lượng luân phiên lượt | Tỷ lệ cắt nhầm dưới 3% trên phép đo chuẩn Hamming VAD |
| 20 | Tính đúng dùng công cụ | Lệnh gọi công cụ giữa hội thoại trả dữ liệu đúng không đình trệ âm thanh |
| 20 | Độ tin cậy dưới mất gói | WER và ổn định luân phiên lượt khi chèn mất 3% gói |
| 15 | Đầy đủ bộ kiểm thử đánh giá | Phép đo tái lập được với cấu hình công khai |
| **100** | | |

## Exercises

1. Đổi Deepgram Nova-3 sang faster-whisper v3 turbo trên g5.xlarge. Đo khoảng cách độ trễ và WER. Xác định nơi quyết định CPU-với-GPU quan trọng.

2. Thêm chính sách phân xử ngắt: agent làm gì khi người dùng ngắt trong lệnh gọi công cụ? So sánh ba chính sách (hủy cứng, xong công cụ rồi dừng, xếp lượt tiếp).

3. Chạy kiểm thử đối kháng bộ phát hiện lượt: cho người dùng ngừng lâu giữa câu. Chỉnh ngưỡng im lặng VAD và ngưỡng điểm phát hiện lượt cho cắt nhầm thấp nhất mà không vượt 900ms.

4. Triển khai cùng agent trên PSTN qua Twilio. So âm thanh đầu tiên PSTN với WebRTC. Giải thích khác biệt bộ đệm jitter và codec.

5. Thêm phát hiện hoạt động giọng nói cho ngôn ngữ ngoài tiếng Anh (Nhật, Tây Ban Nha). Đo tỷ lệ kích hoạt nhầm Silero VAD v5 so với bản tinh chỉnh riêng ngôn ngữ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Turn detection (Phát hiện lượt) | "Kết thúc phát ngôn" | Bộ phân loại quyết định người dùng nói xong dựa trên im lặng VAD và bản chép lời từng phần |
| Barge-in (Ngắt lời) | "Xử lý ngắt" | Hủy TTS giữa phát khi VAD phát hiện giọng nói người dùng mới |
| First-audio-out (Âm thanh đầu tiên ra) | "Độ trễ" | Thời gian từ người dùng ngừng nói đến gói âm thanh đầu rời máy chủ |
| VAD | "Cổng giọng nói" | Mô hình phân loại khung âm thanh thành giọng nói so với im lặng; Silero VAD v5 là mặc định 2026 |
| Jitter buffer (Bộ đệm jitter) | "Làm mượt âm thanh" | Bộ đệm phía client giữ gói ngắn để hấp thụ biến thiên mạng |
| Filler (Câu lấp khoảng trống) | "Token xác nhận" | Cụm ngắn agent xuất để tránh im lặng khi công cụ chậm |
| MOS | "Điểm ý kiến trung bình" | Đánh giá chất lượng giọng nói cảm nhận; NISQA là đại diện tự động |

## Further Reading

- [LiveKit Agents 1.0](https://github.com/livekit/agents) — framework agent WebRTC tham chiếu
- [Pipecat](https://github.com/pipecat-ai/pipecat) — framework agent truyền luồng ưu tiên Python thay thế
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) — tham chiếu mô hình giọng nói tích hợp
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) — tham chiếu ASR truyền luồng
- [Silero VAD v5](https://github.com/snakers4/silero-vad) — mô hình VAD tham chiếu
- [Cartesia Sonic-2](https://docs.cartesia.ai) — tham chiếu TTS độ trễ thấp
- [Retell AI architecture](https://docs.retellai.com) — kiến trúc agent giọng nói sản xuất
- [Vapi.ai production stack](https://docs.vapi.ai) — tham chiếu sản xuất thay thế
