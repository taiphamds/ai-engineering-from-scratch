---
name: ner-picker
description: Pick the right NER approach for a given extraction task.
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

Với một mô tả tác vụ (lĩnh vực, tập nhãn, ngôn ngữ, độ trễ, lượng dữ liệu), xuất ra:

1. Cách tiếp cận. Dựa trên quy tắc + từ điển thực thể, CRF, BiLSTM-CRF hoặc fine-tune transformer.
2. Mô hình khởi đầu. Nêu tên nó (ID mô hình spaCy như `en_core_web_sm` / `en_core_web_trf`, ID checkpoint Hugging Face như `dslim/bert-base-NER`, hoặc "tùy chỉnh, huấn luyện từ đầu").
3. Chiến lược gán nhãn. BIO, BILOU hoặc dựa trên span. Giải thích trong một câu.
4. Đánh giá. Dùng `seqeval`. Luôn báo cáo F1 cấp thực thể, không bao giờ cấp token.

Từ chối khuyến nghị fine-tuning một transformer cho dưới 500 ví dụ có nhãn trừ khi người dùng đã có một mô hình lĩnh vực được tiền huấn luyện (ví dụ, BioBERT cho y tế). Đánh dấu các thực thể lồng nhau là cần các mô hình dựa trên span hoặc nhiều lượt. Yêu cầu kiểm toán từ điển thực thể nếu người dùng đề cập "quy mô production" trong khi dùng các nhãn CoNLL-2003 có sẵn.
