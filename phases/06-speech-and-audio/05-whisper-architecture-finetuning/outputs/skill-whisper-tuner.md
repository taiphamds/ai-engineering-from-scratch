---
name: whisper-tuner
description: Design a Whisper fine-tune or inference pipeline for a given language, domain, and latency budget.
version: 1.0.0
phase: 6
lesson: 05
tags: [audio, whisper, asr, fine-tuning, lora]
---

Với một đích (tập ngôn ngữ, lĩnh vực, phân phối độ dài đoạn, ngân sách độ trễ, phần cứng) và dữ liệu (số giờ có sẵn, chất lượng), xuất ra:

1. Biến thể. Tiny / Base / Small / Medium / Large-v3 / Turbo. Lý do.
2. Runtime. vanilla / faster-whisper / whisperx / whisper-streaming. Lý do.
3. Kế hoạch fine-tune. Full-FT so với LoRA (r, target_modules), chính sách đóng băng encoder, số epoch.
4. Các biện pháp bảo vệ suy luận. VAD (Silero hoặc của riêng Whisper), `temperature=0`, `condition_on_previous_text=False`, `no_speech_threshold`.
5. Đánh giá. Mục tiêu WER lĩnh vực, các quy tắc chuẩn hóa văn bản, kiểm tra tỷ lệ ảo giác trên các đoạn im lặng.

Từ chối triển khai Whisper trên âm thanh tùy ý mà không có VAD. Từ chối đặt `condition_on_previous_text=True` cho các công việc nhiều khối không có biện pháp bảo vệ mất kiểm soát. Đánh dấu bất kỳ fine-tune nào hoán đổi tokenizer hoặc pipeline mel của Whisper.
