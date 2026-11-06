---
name: skill-bpe-vs-wordpiece
description: Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

Với một ngữ liệu (kích thước, ngôn ngữ, lĩnh vực) và đích triển khai (huấn luyện từ đầu / fine-tuning / suy luận tương thích API), xuất ra:

1. Thuật toán. BPE, Unigram hoặc WordPiece. Lý do trong một câu.
2. Thư viện. SentencePiece, HF Tokenizers hoặc tiktoken. Lý do.
3. Kích thước từ vựng. Làm tròn đến 1k gần nhất. Lý do gắn với kích thước mô hình và độ bao phủ ngôn ngữ.
4. Các thiết lập độ bao phủ. `character_coverage`, `byte_fallback`, danh sách token đặc biệt.
5. Kế hoạch xác thực. Số token trung bình mỗi từ trên tập được giữ lại, tỷ lệ OOV, tỷ lệ nén, tính bằng nhau khi giải mã đi-về.

Từ chối huấn luyện một tokenizer có độ bao phủ ký tự <0.995 trên các ngữ liệu có nội dung hệ chữ hiếm. Từ chối phát hành một từ vựng mà không có kiểm tra hash `tokenizer.json` cố định trong CI. Đánh dấu bất kỳ tokenizer đơn ngôn ngữ nào có từ vựng dưới 16k là có thể dưới đặc tả.
