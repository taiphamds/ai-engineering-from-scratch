---
name: multilingual-picker
description: Pick source language, target model, and evaluation plan for a multilingual NLP task.
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

Với các yêu cầu (các ngôn ngữ đích, loại tác vụ, dữ liệu có nhãn có sẵn cho mỗi ngôn ngữ), xuất ra:

1. Ngôn ngữ nguồn cho fine-tuning. Mặc định tiếng Anh; kiểm tra LANGRANK hoặc qWALS nếu ngôn ngữ đích có một ngôn ngữ nhiều tài nguyên gần về loại hình.
2. Mô hình cơ sở. XLM-R (phân loại), mT5 (sinh), NLLB (dịch), Aya-23 (LLM sinh).
3. Ngân sách few-shot. Bắt đầu với 100-500 ví dụ ngôn ngữ đích nếu có sẵn. Zero-shot chỉ khi gán nhãn không khả thi.
4. Kế hoạch đánh giá. Accuracy theo ngôn ngữ (không tổng hợp), tính nhất quán xuyên ngôn ngữ, F1 cấp thực thể trên các hệ chữ phi Latin.

Từ chối phát hành một mô hình đa ngôn ngữ không có đánh giá theo ngôn ngữ — các thước đo tổng hợp che giấu các lỗi đuôi dài. Đánh dấu các hệ chữ có độ bao phủ tokenization thấp (Amharic, Tigrinya, nhiều ngôn ngữ châu Phi) là cần một mô hình với phương án dự phòng byte (SentencePiece với byte_fallback=True, hoặc một tokenizer cấp byte như GPT-2).
