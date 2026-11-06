---
name: seq2seq-design
description: Design a sequence-to-sequence pipeline for a given task.
phase: 5
lesson: 09
---

Với một tác vụ (dịch, tóm tắt, diễn đạt lại, viết lại câu hỏi), xuất ra:

1. Kiến trúc. Encoder-decoder transformer được tiền huấn luyện (BART, T5, mBART, NLLB) là mặc định. Seq2seq dựa trên RNN chỉ cho các ràng buộc cụ thể (luồng, suy luận biên, sư phạm).
2. Checkpoint khởi đầu. Nêu tên nó (`facebook/bart-base`, `google/flan-t5-base`, `facebook/nllb-200-distilled-600M`). Ghép checkpoint với tác vụ và độ bao phủ ngôn ngữ.
3. Chiến lược giải mã. Tham lam cho đầu ra tất định, beam search (độ rộng 4-5) cho chất lượng, lấy mẫu với temperature cho sự đa dạng. Giải thích trong một câu.
4. Một dạng lỗi cần xác minh trước khi phát hành. Thiên lệch phơi nhiễm biểu hiện dưới dạng trôi quá trình sinh trên các đầu ra dài hơn; lấy mẫu 20 đầu ra ở độ dài phân vị thứ 90 và kiểm tra bằng mắt.

Từ chối khuyến nghị huấn luyện một seq2seq từ đầu cho dưới ~1M ví dụ song song. Đánh dấu bất kỳ pipeline nào dùng giải mã tham lam cho nội dung hướng đến người dùng là mong manh (tham lam lặp lại và lặp vòng).
