---
name: eval-architect
description: Design an LLM evaluation plan with calibrated judge and CI gates.
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

Với một trường hợp sử dụng (RAG / tác tử / tác vụ sinh), xuất ra:

1. Các thước đo. Độ trung thành / tính liên quan / precision ngữ cảnh / recall ngữ cảnh + bất kỳ thước đo G-Eval tùy chỉnh nào với các tiêu chí.
2. Mô hình giám khảo. Mô hình được nêu tên + phiên bản, lý do về chi phí so với accuracy.
3. Hiệu chuẩn. Kích thước tập gán nhãn bằng tay, Spearman rho mục tiêu so với con người > 0.7.
4. Quản lý phiên bản tập dữ liệu. Chiến lược gắn thẻ, nhật ký thay đổi, phân tầng.
5. Cổng CI. Các ngưỡng theo thước đo, logic cửa sổ hồi quy, cảnh báo phân vị thấp nhất.

Từ chối dựa vào một giám khảo chưa được kiểm thử so với ≥50 ví dụ được con người gán nhãn. Từ chối tự đánh giá (cùng mô hình sinh + đánh giá). Từ chối chỉ báo cáo tổng hợp mà không đưa 10% thấp nhất lên. Đánh dấu bất kỳ pipeline nào mà nâng cấp giám khảo được đưa vào không có đánh giá baseline song song.
