# Voice Agents: Pipecat and LiveKit

> Các agent giọng nói là một hạng mục sản xuất hạng nhất năm 2026. Pipecat cho bạn một pipeline Python dựa trên frame (VAD → STT → LLM → TTS → truyền tải). LiveKit Agents nối các mô hình AI với người dùng qua WebRTC. Các mục tiêu độ trễ sản xuất nằm ở 450–600ms từ đầu đến cuối cho các stack cao cấp.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả pipeline dựa trên frame của Pipecat: DOWNSTREAM (nguồn→đích) và UPSTREAM (điều khiển).
- Nêu tên các giai đoạn pipeline giọng nói chuẩn và những phương thức truyền tải nào Pipecat hỗ trợ.
- Giải thích hai lớp agent giọng nói của LiveKit Agents (MultimodalAgent, VoicePipelineAgent) và khi nào mỗi lớp phù hợp.
- Tóm tắt các kỳ vọng độ trễ sản xuất năm 2026 và cách chúng thúc đẩy các lựa chọn kiến trúc.

## The Problem

Các agent giọng nói không phải một vòng lặp văn bản với TTS gắn thêm. Các ngân sách độ trễ khắc nghiệt (~600ms), âm thanh một phần là mặc định, phát hiện lượt là một mô hình và các phương thức truyền tải trải từ SIP điện thoại đến WebRTC. Hoặc bạn xây dựng một pipeline dựa trên frame (Pipecat) hoặc bạn dựa vào một nền tảng (LiveKit).

## The Concept

### Pipecat (pipecat-ai/pipecat)

- Framework pipeline Python dựa trên frame.
- Chuỗi `Frame` → `FrameProcessor`.
- Hai hướng luồng:
  - **DOWNSTREAM** — nguồn → đích (âm thanh vào, TTS ra).
  - **UPSTREAM** — phản hồi và điều khiển (hủy, các thước đo, ngắt lời).
- `PipelineTask` quản lý vòng đời với các sự kiện (`on_pipeline_started`, `on_pipeline_finished`, `on_idle_timeout`) và các bộ quan sát cho các thước đo/truy vết/RTVI.

Pipeline điển hình:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Các phương thức truyền tải: Daily, LiveKit, SmallWebRTCTransport, FastAPI WebSocket, WhatsApp.

Pipecat Flows thêm các hội thoại có cấu trúc (các máy trạng thái). Pipecat Cloud là runtime được quản lý.

### LiveKit Agents (livekit/agents)

- Nối các mô hình AI với người dùng qua WebRTC.
- Các khái niệm then chốt: `Agent`, `AgentSession`, `entrypoint`, `AgentServer`.
- Hai lớp agent giọng nói:
  - **MultimodalAgent** — âm thanh trực tiếp qua OpenAI Realtime hoặc tương đương.
  - **VoicePipelineAgent** — chuỗi tầng STT → LLM → TTS; cho quyền kiểm soát ở cấp văn bản.
- Phát hiện lượt ngữ nghĩa qua một mô hình transformer.
- Tích hợp MCP gốc.
- Điện thoại qua SIP.
- 50+ mô hình không cần khóa API qua LiveKit Inference; 200+ mô hình nữa qua plugin.

### Commercial platforms

Vapi (~450–600ms trên một stack cao cấp được tối ưu) và Retell (~600ms từ đầu đến cuối qua 180 cuộc gọi kiểm thử) xây dựng trên những thứ này. Chọn một nền tảng khi bạn muốn một stack giọng nói được quản lý mà không có một nhóm WebRTC.

### Where this pattern goes wrong

- **Không xử lý ngắt lời.** Người dùng ngắt lời; agent tiếp tục nói. Yêu cầu các frame hủy UPSTREAM trong Pipecat, tương đương trong LiveKit.
- **Bỏ qua độ tin cậy STT.** Các bản chép lời độ tin cậy thấp được đưa cho LLM như chân lý. Kiểm soát bằng độ tin cậy hoặc yêu cầu xác nhận.
- **TTS cắt giữa câu.** Khi pipeline hủy giữa phát ngôn, TTS cần biết hoặc cắt âm thanh.
- **Bỏ qua ngân sách độ trễ.** Mỗi thành phần thêm 50–200ms. Tính tổng chuỗi của bạn trước khi phát hành.

### Typical 2026 latencies

- VAD: 20–60ms
- STT một phần: 100–250ms
- Token đầu tiên LLM: 150–400ms
- Âm thanh đầu tiên TTS: 100–200ms
- RTT truyền tải: 30–80ms

Từ đầu đến cuối 450–600ms là cao cấp. 800–1200ms là phổ biến. Bất cứ thứ gì > 1500ms đều có cảm giác bị hỏng.

```figure
voice-pipeline
```

## Build It

`code/main.py` là một pipeline mô phỏng dựa trên frame với:

- Các kiểu `Frame` (audio, transcript, text, tts_audio, control).
- Giao diện `Processor` với `process(frame)`.
- Một pipeline năm giai đoạn (VAD → STT → LLM → TTS → truyền tải) dưới dạng các bộ xử lý được viết kịch bản.
- Một frame hủy UPSTREAM để minh họa ngắt lời.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy luồng bình thường và một lần hủy ngắt lời dừng TTS giữa phát ngôn.

## Use It

- **Pipecat** cho kiểm soát hoàn toàn — các bộ xử lý tùy chỉnh, ưu tiên Python, các nhà cung cấp có thể cắm.
- **LiveKit Agents** cho các triển khai ưu tiên WebRTC và điện thoại.
- **Vapi / Retell** cho các agent giọng nói được host mà không có một nhóm WebRTC.
- **OpenAI Realtime / Gemini Live** cho âm thanh vào/âm thanh ra trực tiếp (MultimodalAgent).

## Ship It

`outputs/skill-voice-pipeline.md` tạo khung một pipeline giọng nói có dạng Pipecat với VAD + STT + LLM + TTS + truyền tải cộng xử lý ngắt lời.

## Exercises

1. Thêm một bộ quan sát thước đo vào pipeline mô phỏng của bạn: đếm frame cho mỗi giai đoạn mỗi giây. Độ trễ tích lũy ở đâu?
2. Triển khai STT được kiểm soát bằng độ tin cậy: dưới ngưỡng, yêu cầu "bạn có thể nhắc lại không?"
3. Thêm phát hiện lượt ngữ nghĩa: quy tắc đơn giản — nếu bản chép lời kết thúc bằng "?", kết thúc lượt.
4. Đọc tài liệu truyền tải của Pipecat. Thay phương thức truyền tải thư viện chuẩn bằng cấu hình SmallWebRTCTransport (stub).
5. Đo OpenAI Realtime so với một chuỗi tầng STT+LLM+TTS trên cùng truy vấn. Quyền kiểm soát cấp văn bản mang chi phí độ trễ nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Frame (Khung) | "Sự kiện" | Đơn vị dữ liệu có kiểu trong pipeline (âm thanh, bản chép lời, văn bản, điều khiển) |
| Processor (Bộ xử lý) | "Giai đoạn pipeline" | Bộ xử lý với process(frame) |
| DOWNSTREAM (Xuôi dòng) | "Luồng tiến" | Nguồn đến đích: âm thanh vào, lời nói ra |
| UPSTREAM (Ngược dòng) | "Luồng phản hồi" | Điều khiển: hủy, các thước đo, ngắt lời |
| VAD | "Phát hiện hoạt động giọng nói" | Phát hiện khi người dùng đang nói |
| Semantic turn detection (Phát hiện lượt ngữ nghĩa) | "Kết thúc lượt thông minh" | Quyết định dựa trên mô hình rằng người dùng đã xong |
| MultimodalAgent | "Agent âm thanh trực tiếp" | Âm thanh vào, âm thanh ra; không có văn bản ở giữa |
| VoicePipelineAgent | "Agent chuỗi tầng" | STT + LLM + TTS; kiểm soát cấp văn bản |

## Further Reading

- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) — pipeline dựa trên frame, các bộ xử lý, các phương thức truyền tải
- [LiveKit Agents docs](https://docs.livekit.io/agents/) — WebRTC + các thành phần nguyên thủy giọng nói
- [Vapi](https://vapi.ai/) — nền tảng giọng nói được quản lý
- [Retell AI](https://www.retellai.com/) — giọng nói được quản lý, được benchmark độ trễ
