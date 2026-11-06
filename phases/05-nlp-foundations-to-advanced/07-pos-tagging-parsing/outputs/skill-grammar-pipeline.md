---
name: grammar-pipeline
description: Design a classical POS + dependency pipeline for a downstream NLP task.
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

Với một tác vụ phía sau (trích xuất thông tin, xác thực viết lại, phân rã truy vấn, lemmatization), bạn xuất ra:

1. Tập nhãn. Penn Treebank cho các pipeline cũ chỉ tiếng Anh, Universal Dependencies cho đa ngôn ngữ hoặc xuyên ngôn ngữ.
2. Thư viện. spaCy cho hầu hết production (`en_core_web_sm` / `_lg` / `_trf`), stanza cho đa ngôn ngữ cấp học thuật, trankit cho accuracy UD cao nhất.
3. Đoạn mã tích hợp. 3-5 dòng gọi thư viện và tiêu thụ `.pos_`, `.dep_`, `.head`.
4. Dạng lỗi cần kiểm thử. Nhập nhằng danh từ-động từ (`saw`, `book`, `can`) và nhập nhằng gắn cụm giới từ là những bẫy cổ điển. Lấy mẫu 20 đầu ra và kiểm tra bằng mắt.

Từ chối khuyến nghị tự xây dựng bộ phân tích của riêng bạn. Xây dựng các bộ phân tích từ đầu là một dự án nghiên cứu, không phải một tác vụ ứng dụng. Đánh dấu bất kỳ pipeline nào tiêu thụ nhãn POS mà không xử lý các biến thể chữ thường / chữ hoa là mong manh.
