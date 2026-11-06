---
name: lm-baseline
description: Build a reproducible n-gram language model baseline before training a neural LM.
phase: 5
lesson: 16
---

Với một ngữ liệu và mục đích đích (dự đoán từ tiếp theo, chấm lại, baseline perplexity), xuất ra:

1. Bậc n-gram. Trigram cho tiếng Anh tổng quát, 4-gram nếu ngữ liệu lớn, 5-gram để chấm lại tiếng nói.
2. Làm trơn. Modified Kneser-Ney là mặc định; Laplace chỉ để giảng dạy.
3. Thư viện. `kenlm` cho production, `nltk.lm` để giảng dạy, chỉ tự xây dựng để học phần toán.
4. Đánh giá. Perplexity trên dữ liệu được giữ lại với tokenization nhất quán giữa các tập huấn luyện và kiểm thử.

Từ chối báo cáo perplexity được tính với tokenization khác nhau giữa các hệ thống được so sánh — các con số perplexity chỉ so sánh được dưới tokenization giống hệt. Đánh dấu tỷ lệ OOV trong tập kiểm thử; KN xử lý OOV kém trừ khi bạn dành riêng một token `<UNK>` đặc biệt trong huấn luyện.
