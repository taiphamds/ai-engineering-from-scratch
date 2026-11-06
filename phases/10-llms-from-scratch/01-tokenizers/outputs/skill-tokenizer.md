---
name: skill-tokenizer
description: Choosing and building tokenizers for LLM projects
version: 1.0.0
phase: 10
lesson: 1
tags: [tokenizer, bpe, wordpiece, sentencepiece, llm, nlp]
---

# Tokenizer Selection and Implementation

Khi bắt đầu một dự án LLM, áp dụng khung quyết định này để chọn tokenizer.

## When to use each tokenizer

**BPE cấp byte (tiktoken):** Bạn đang xây trên hoặc tinh chỉnh các mô hình họ GPT. Bạn cần bảo đảm xử lý bất kỳ chuỗi byte đầu vào nào. Bạn muốn không token không biết.

**WordPiece (Hugging Face):** Bạn đang làm việc với các mô hình họ BERT cho các tác vụ phân loại, NER hoặc embedding. Bạn cần tiền tố tiếp nối "##" cho các tác vụ phía sau dựa vào tín hiệu ranh giới từ.

**SentencePiece (BPE hoặc Unigram):** Bạn đang huấn luyện từ đầu. Bạn cần token hóa độc lập ngôn ngữ. Dữ liệu của bạn gồm các ngôn ngữ CJK, tiếng Thái hoặc các hệ chữ khác không có ranh giới từ bằng khoảng trắng. LLaMA, T5 và hầu hết mô hình đa ngôn ngữ dùng cách này.

## Vocabulary size guidelines

- 32K token: mặc định tốt cho mô hình đơn ngôn ngữ, giữ lớp embedding nhỏ
- 50K-64K token: tốt hơn cho mô hình đa ngôn ngữ hoặc nhiều mã
- 100K+ token: chỉ khi bạn có dữ liệu huấn luyện khổng lồ và muốn chuỗi ngắn

Từ vựng lớn hơn nghĩa là chuỗi ngắn hơn (suy luận rẻ hơn) nhưng nhiều tham số hơn trong ma trận embedding. Với một từ vựng 100K có embedding 4096 chiều, riêng lớp embedding là 400M tham số.

## Pre-tokenization rules that matter

1. Tách theo khoảng trắng trước BPE để ngăn các phép gộp xuyên từ
2. Tách từng chữ số riêng nếu bạn muốn mô hình học số học
3. Chuẩn hóa Unicode (NFC) trước token hóa để có hành vi nhất quán
4. Thêm token đặc biệt cho trường hợp sử dụng: `<pad>`, `<eos>`, `<bos>`, `<unk>`, và bất kỳ dấu nào riêng cho tác vụ

## Red flags in tokenizer behavior

- Fertility trên 2.0 cho ngôn ngữ mục tiêu: mô hình lãng phí cửa sổ ngữ cảnh
- Các từ phổ biến trong miền bị tách thành 3+ token: huấn luyện lại với dữ liệu miền
- Token hóa số không nhất quán: kiểm tra quy tắc tách chữ số
- Từ vựng lớn có nhiều token chỉ dùng một lần: giảm kích thước từ vựng

## Building a custom tokenizer - checklist

1. Thu thập dữ liệu huấn luyện đại diện (ít nhất 1GB văn bản trong miền mục tiêu)
2. Chọn thuật toán: BPE cho sử dụng chung, Unigram cho đa ngôn ngữ
3. Đặt kích thước từ vựng theo các hướng dẫn trên
4. Cấu hình tiền token hóa: tách khoảng trắng, xử lý chữ số, dấu câu
5. Thêm token đặc biệt
6. Huấn luyện bằng thư viện tokenizers của Hugging Face (backend Rust, nhanh)
7. Xác thực: kiểm tra fertility trên văn bản giữ lại xuyên tất cả ngôn ngữ mục tiêu
8. Kiểm thử trường hợp biên: chuỗi rỗng, đầu vào rất dài, dữ liệu nhị phân, emoji, văn bản RTL
9. Lưu và quản lý phiên bản tokenizer cùng các checkpoint mô hình
