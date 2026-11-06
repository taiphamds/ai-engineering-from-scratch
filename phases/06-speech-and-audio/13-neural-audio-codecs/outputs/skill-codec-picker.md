---
name: codec-picker
description: Pick a neural audio codec (EnCodec / DAC / SNAC / Mimi) for a given generative or compression task.
version: 1.0.0
phase: 6
lesson: 13
tags: [codec, encodec, dac, snac, mimi, rvq, semantic-tokens]
---

Với tác vụ (LM sinh, nén, hội thoại song công toàn phần, chỉnh sửa nhạc, mục tiêu độ trung thực), xuất ra:

1. Codec. EnCodec-24k · EnCodec-48k · DAC-44.1k · SNAC-24k · Mimi · (dự phòng: Opus cho nén phi nơ-ron). Lý do trong một câu.
2. Tốc độ khung + codebook. Ngân sách bitrate, số codebook (thường 4-12), độ dài chuỗi cho thời lượng đoạn đích.
3. Hệ tokenization. Phẳng so với phân cấp (SNAC) so với ngữ nghĩa+âm học (Mimi). Cách LM tiêu thụ token.
4. Decoder. Decoder trong codec · vocoder bên ngoài (HiFi-GAN) · chỉ LM (không vocoder, dự đoán trực tiếp các token codec). Giải thích vì sao.
5. Các hệ quả huấn luyện. Cần huấn luyện encoder/decoder? Fine-tune trên âm thanh lĩnh vực (chỉ tiếng nói → âm nhạc riêng lĩnh vực)? Có sẵn đóng băng?

Từ chối DAC cho các khối lượng công việc AR-LM có ngân sách độ trễ chặt — tốc độ khung 86 Hz × 8 codebook = 5,504 token mỗi 10 s, quá dài để sinh nhanh. Từ chối Mimi cho âm nhạc — nó được tinh chỉnh tiếng nói. Từ chối EnCodec cho sinh có điều kiện ngữ nghĩa — không codebook ngữ nghĩa, tiếng nói mờ từ văn bản.

Đầu vào ví dụ: "Xây dựng một LM AR cho TTS văn bản thành tiếng nói. Mục tiêu TTFA 200 ms. Chỉ tiếng Anh."

Đầu ra ví dụ:
- Codec: Mimi. Sự tách ngữ nghĩa+âm học cho phép phân tích nhân tử văn bản → codebook 0 → codebook 1-7, vừa nhanh vừa hỗ trợ nhân bản giọng nói.
- Tốc độ khung + codebook: 12.5 Hz · 8 codebook · 4.4 kbps. 10 s = 1,000 token.
- Tokenization: dự đoán codebook 0 trước từ văn bản + tham chiếu người nói; rồi dự đoán codebook 1-7 khi biết codebook 0 + tham chiếu người nói (mẫu depth-transformer).
- Decoder: decoder tích hợp của Mimi, không cần vocoder bên ngoài.
- Huấn luyện: huấn luyện LM văn bản-thành-codec; đóng băng Mimi.
