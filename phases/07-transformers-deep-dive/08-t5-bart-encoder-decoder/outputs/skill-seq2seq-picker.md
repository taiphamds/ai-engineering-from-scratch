---
name: seq2seq-picker
description: Choose encoder-decoder vs decoder-only for a new sequence-to-sequence task.
version: 1.0.0
phase: 7
lesson: 8
tags: [transformers, t5, bart, seq2seq]
---

Với một tác vụ seq2seq (dịch / tóm tắt / tiếng nói-thành-văn bản / trích xuất có cấu trúc / viết lại), các phân phối độ dài đầu vào và đầu ra, và các ưu tiên chất lượng so với độ trễ, xuất ra:

1. Kiến trúc. Một trong: encoder-decoder (kiểu T5 / BART / Whisper), chỉ decoder được tinh chỉnh theo chỉ dẫn, chỉ encoder + khuôn prompt. Lý do trong một câu.
2. Mục tiêu tiền huấn luyện. Làm hỏng span (T5), khử nhiễu (BART), token tiếp theo (chỉ decoder) hoặc "bỏ qua tiền huấn luyện, fine-tune checkpoint hiện có." Nêu tên checkpoint.
3. Định dạng đầu vào. Chuỗi tiền tố tác vụ (kiểu T5) so với system prompt (chỉ decoder) so với token thô (BART). Bao gồm xử lý BOS/EOS.
4. Chiến lược giải mã. Độ rộng beam search và phạt độ dài (dịch/tóm tắt), hoặc nucleus/min-p (các tác vụ giống trò chuyện). Nêu loại nào cho tác vụ.
5. Đánh giá. Thước đo phù hợp tác vụ: BLEU / ROUGE / WER / F1 / khớp chính xác. Bao gồm kích thước phần chia kiểm thử.

Từ chối khuyến nghị chỉ encoder cho các đầu ra sinh. Từ chối khuyến nghị encoder-decoder khi đầu vào đã là một cuộc hội thoại — chỉ decoder phù hợp bộ nhớ hội thoại tự nhiên. Đánh dấu bất kỳ lựa chọn chỉ decoder nào cho tiếng nói-thành-văn bản mà không nhắc Whisper làm baseline cần vượt.
