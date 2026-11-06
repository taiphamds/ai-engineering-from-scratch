---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Với một trường hợp sử dụng (một tài liệu / nhiều tài liệu, lĩnh vực, ngôn ngữ), xuất ra:

1. Cách tiếp cận. Dựa trên quy tắc / nơ-ron dựa trên span / được prompt bằng LLM / lai. Lý do trong một câu.
2. Mô hình. Checkpoint được nêu tên nếu nơ-ron.
3. Tích hợp. Thứ tự các phép toán: tokenize → NER → coref → tác vụ phía sau.
4. Đánh giá. CoNLL F1 (trung bình MUC + B³ + CEAF-φ4) trên tập được giữ lại + rà soát cụm thủ công trên 20 tài liệu.

Từ chối coref chỉ LLM cho các tài liệu trên 2,000 token không có gộp cửa sổ trượt. Từ chối bất kỳ pipeline nào chạy coref mà không có báo cáo precision-recall cấp lần nhắc. Đánh dấu các hệ thống heuristic giới được triển khai trong văn bản đa dạng về nhân khẩu học.
