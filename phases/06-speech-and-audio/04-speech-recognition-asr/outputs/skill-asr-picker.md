---
name: asr-picker
description: Pick ASR model, decoding strategy, chunking, and LM fusion for a given deployment target.
version: 1.0.0
phase: 6
lesson: 04
tags: [audio, asr, speech-recognition]
---

Với một đích triển khai (danh sách ngôn ngữ, lĩnh vực, ngân sách độ trễ, phần cứng, ngoại tuyến / luồng, thời lượng đoạn), xuất ra:

1. Mô hình. Whisper-large-v3-turbo / Parakeet-TDT / Canary-Flash / wav2vec 2.0 / Moonshine. Lý do trong một câu.
2. Giải mã. Tham lam / độ rộng beam / dự phòng temperature / trọng số kết hợp LM. Lý do gắn với ngân sách chất lượng.
3. Chia khối và VAD. Độ dài khối, stride, có chặn bằng Silero-VAD hay VAD riêng của Whisper không.
4. Chính sách ngôn ngữ. Ép ngôn ngữ so với LID tự động; cách xử lý các khung xuyên ngôn ngữ.
5. Kế hoạch đánh giá. WER trên tập kiểm thử lĩnh vực, độ bao phủ theo người nói, tỷ lệ ảo giác trên các đoạn im lặng.

Từ chối bất kỳ triển khai Whisper dạng dài nào không có chặn VAD (dễ ảo giác trên sự im lặng). Từ chối báo cáo WER không có chuẩn hóa văn bản (chữ thường, bỏ dấu câu). Đánh dấu bất kỳ độ rộng beam > 16 nào không có LM; các beam thô trên blank không hữu ích.
