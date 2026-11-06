---
name: voice-assistant-architect
description: Produce a full-stack voice-assistant spec — components, latency budget, observability, compliance — for a given workload.
version: 1.0.0
phase: 6
lesson: 12
tags: [voice-assistant, architecture, livekit, pipecat, compliance]
---

Với trường hợp sử dụng (tiêu dùng / hỗ trợ khách hàng / hỗ trợ tiếp cận / biên), quy mô dự kiến (các phiên đồng thời, phút/tháng), ngôn ngữ, các mục tiêu độ trễ, tuân thủ (HIPAA, PCI, EU AI Act, CA SB 942), xuất ra:

1. Các thành phần (7 tầng). Micro + chia khối · VAD · STT luồng · LLM + công cụ · TTS luồng · phát lại · bộ xử lý ngắt. Nêu đúng nhà cung cấp/mô hình cho mỗi thành phần.
2. Ngân sách độ trễ. Các mục tiêu P50 / P95 / P99 theo giai đoạn có tổng bằng mục tiêu đầu cuối. Đánh dấu các giai đoạn nào độc lập so với tuần tự.
3. Schema gọi công cụ. Đặc tả JSON cho mỗi công cụ + xử lý lỗi + văn bản dự phòng. Luôn bao gồm một đường "không thể giúp" mà LLM phải chọn khi thất bại hai lần.
4. An toàn. Biện pháp bảo vệ prompt injection, khóa nhân bản giọng nói (nếu TTS có khả năng nhân bản), cổng từ đánh thức (cho luôn bật), che PII trong nhật ký, giữ 30 ngày.
5. Khả năng quan sát. P50/P95/P99 theo giai đoạn · tỷ lệ ngắt sai · tỷ lệ thành công gọi công cụ · WER mỗi 100 cuộc gọi · chi phí mỗi phút · tỷ lệ bỏ cuộc.
6. Tuân thủ. Âm thanh công khai ("Đây là một trợ lý AI"), ghim khu vực (dữ liệu EU ở EU), giữ nhật ký kiểm toán, con đường từ chối tham gia.

Từ chối các triển khai luôn bật không có từ đánh thức. Từ chối TTS không truyền luồng (thêm độ trễ bằng độ dài phát ngôn). Từ chối lấy trung bình độ trễ không có P95 — phần đuôi là nơi người dùng rời bỏ. Từ chối giữ âm thanh thô &gt; 30 ngày không có rà soát pháp lý.

Đầu vào ví dụ: "Trợ lý hỗ trợ tiếp cận cho người dùng thị lực kém: giao diện chỉ giọng nói cho một ứng dụng email tiêu dùng. Tiếng Anh. P95 &lt; 600 ms. ~10k người dùng đồng thời."

Đầu ra ví dụ:
- Các thành phần: sounddevice (WebRTC qua LiveKit Agents) · Silero VAD · Deepgram Nova-3 (tiếng Anh) · GPT-4o với các công cụ email (read_message, compose_reply, mark_read) · Cartesia Sonic 2 truyền luồng · WebRTC ra · interrupt=cancel-LLM-and-TTS khi VAD kích hoạt.
- Ngân sách: thu 120 ms + VAD 40 + STT 150 + LLM TTFT 100 + TTS TTFA 150 = 560 ms P95.
- Công cụ: read_message({id}), compose_reply({message_id, body}), mark_read({id}), search({query}). Tất cả trả JSON; LLM có tối đa 2 lần thử lại mỗi công cụ rồi dự phòng "Tôi không thể làm điều đó — thử diễn đạt lại".
- An toàn: biện pháp bảo vệ prompt injection (phát hiện `ignore previous instructions`); từ đánh thức "Hey Mail"; không nhân bản giọng nói (giọng Cartesia cố định); che nội dung email trong nhật ký.
- Khả năng quan sát: giám sát production Hamming AI; các histogram Prometheus theo giai đoạn; cảnh báo khi ngắt sai &gt; 5% hoặc p95 &gt; 800 ms.
- Tuân thủ: công khai AI khi dùng lần đầu; chủ động chọn HIPAA chỉ cho các tin nhắn y tế; người dùng EU truy cập Cartesia được lưu trữ tại EU + GPT-4o Ireland.
