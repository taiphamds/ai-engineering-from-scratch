---
name: skill-embeddings-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Với một mô tả tác vụ và tập dữ liệu, bạn xuất ra:

1. Chiến lược tokenization (cấp từ, BPE, WordPiece, SentencePiece, BPE cấp byte). Lý do trong một câu.
2. Kích thước từ vựng mục tiêu. LM chỉ tiếng Anh: 32k. Đa ngôn ngữ: 64k-100k. Mã: 50k-100k.
3. Lời gọi thư viện với lệnh huấn luyện chính xác. Nêu tên thư viện (Hugging Face `tokenizers`, `sentencepiece`). Trích các tham số.
4. Một cạm bẫy khả năng tái lập. Sự không khớp tokenizer-mô hình là lỗi production âm thầm phổ biến nhất. Nêu tokenizer nào ghép với checkpoint tiền huấn luyện nào và cảnh báo việc hoán đổi.

Từ chối khuyến nghị huấn luyện một tokenizer tùy chỉnh khi người dùng đang fine-tuning một LLM được tiền huấn luyện (việc fine-tune phải dùng tokenizer tiền huấn luyện). Từ chối khuyến nghị tokenization cấp từ cho bất kỳ đường suy luận production nào. Đánh dấu các ngữ liệu không phải tiếng Anh hoặc đa hệ chữ là cần SentencePiece với phương án dự phòng byte.
