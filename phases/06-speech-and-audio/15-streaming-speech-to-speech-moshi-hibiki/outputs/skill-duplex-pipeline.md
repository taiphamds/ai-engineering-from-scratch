---
name: duplex-pipeline
description: Pick full-duplex (Moshi) vs pipeline (VAD + STT + LLM + TTS) architecture for a voice-agent workload.
version: 1.0.0
phase: 6
lesson: 15
tags: [moshi, hibiki, full-duplex, voice-agent, streaming]
---

Với khối lượng công việc (mục tiêu độ trễ, nhu cầu gọi công cụ, độ bao phủ ngôn ngữ, ngân sách phần cứng, đám mây so với biên), xuất ra:

1. Kiến trúc. Song công toàn phần (Moshi / GPT-4o Realtime / Gemini Live) so với pipeline (LiveKit + STT + LLM + TTS, Bài 12). Lý do trong một câu.
2. Mô hình. Moshi · Hibiki · Hibiki-Zero · Sesame CSM · GPT-4o Realtime · Gemini 2.5 Live · pipeline truyền thống. Lý do.
3. Quy mô. Chi phí GPU theo phiên (Moshi giữ một slot), số phiên đồng thời tối đa, tác động khởi động lạnh.
4. Đường gọi công cụ. Nếu cần — pipeline lai (song công + LLM bên ngoài cho các lời gọi công cụ) hoặc pipeline thuần. Giải thích đánh đổi.
5. Độ bao phủ ngôn ngữ. Các mô hình song công toàn phần có hỗ trợ ngôn ngữ hẹp; các pipeline kế thừa khả năng đa ngôn ngữ của LLM.

Từ chối kiến trúc chỉ song công toàn phần cho các tác tử doanh nghiệp cần gọi công cụ / truy xuất — Moshi là mô hình hội thoại, không phải framework tác tử. Từ chối chỉ pipeline cho các tác tử hội thoại dưới 250 ms — các giai đoạn cộng dồn. Từ chối Moshi cho &gt; 4 phiên đồng thời trên một GPU — gặp tranh chấp.

Đầu vào ví dụ: "Bạn đồng hành giọng nói để học ngôn ngữ — luyện độ lưu loát hội thoại. Tiếng Anh + Pháp. Độ phản hồi &lt; 250 ms. 10k người dùng hoạt động hằng ngày."

Đầu ra ví dụ:
- Kiến trúc: song công toàn phần (Moshi). Yêu cầu độ trễ dưới 250 ms + độ lưu loát hội thoại phù hợp các thế mạnh của Moshi.
- Mô hình: Moshi. EN + FR đều được hỗ trợ tốt. Giấy phép CC-BY 4.0.
- Quy mô: một GPU L4 cho mỗi 4-6 phiên đồng thời → ~1500 GPU ở đỉnh cho 10k DAU với 10% đồng thời. Lập kế hoạch cho chế độ nhẹ trên thiết bị dùng Kyutai Pocket TTS + Whisper cục bộ cho đường yên lặng.
- Gọi công cụ: tối thiểu — "hiện gợi ý ngữ pháp" và "dịch cụm từ này" có thể được định tuyến qua một LLM sidecar tí hon; hầu hết tương tác là hội thoại mở nơi Moshi tỏa sáng.
- Độ bao phủ ngôn ngữ: EN + FR (nguyên bản); ES / DE / JP qua thích nghi Hibiki-Zero (yêu cầu 1000 h âm thanh cho mỗi ngôn ngữ mới).
