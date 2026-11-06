---
name: bias-eval
description: Audit a bias evaluation report across metric categories, intersectionality, and debias mechanism.
version: 1.0.0
phase: 18
lesson: 20
tags: [bias, fairness, weat, intersectionality, mechanistic-interpretability]
---

Với báo cáo đánh giá thiên lệch hoặc khẳng định công bằng, kiểm tra theo khung ba nhóm Gallegos và cộng sự 2024 và tài liệu giao thoa 2024-2025.

Tạo:

1. Bao phủ chỉ số. Đánh giá có ít nhất một chỉ số từ mỗi nhóm: dựa trên embedding (kiểu WEAT), xác suất (log-likelihood khuôn mẫu), văn bản được sinh (đo tác vụ hạ nguồn) không? Đánh dấu nhóm thiếu.
2. Tách loại tổn hại. Đánh giá có phân biệt tổn hại biểu đạt với phân bổ không? Báo cáo chỉ đo tạo khuôn mẫu không đo phân bổ tài nguyên hạ nguồn.
3. Bao phủ giao thoa. Có đánh giá trục giao thoa hay chỉ một trục (riêng giới, riêng chủng tộc)? Theo An và cộng sự 2025, đánh giá một trục thường bỏ sót hiệu ứng giao thoa.
4. Cơ chế khử thiên lệch. Nếu áp dụng, xác định hoạt động trên embedding (phép chiếu), neuron MLP (Yu & Ananiadou 2025), đặc trưng SAE (Ahsan & Wallace 2025), đầu attention (UniBias 2024) hay lọc đầu ra hậu nghiệm. Ước tính chi phí năng lực chung.
5. Đa dạng trục. Theo phê bình tổng quan 2025, thiên lệch giới nhị nguyên được nghiên cứu quá mức so với trục khác. Đánh giá có bao phủ khuyết tật, tôn giáo, di cư hay trục bản sắc đa ngôn ngữ không?

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "đã khử thiên lệch" dựa trên một nhóm chỉ số.
- Mọi khẳng định công bằng không có đánh giá giao thoa.
- Mọi can thiệp khử thiên lệch không có chênh lệch năng lực chung.

Quy tắc từ chối:
- Nếu người dùng hỏi mô hình "không thiên lệch" không, từ chối khẳng định nhị phân; thiên lệch là thuộc tính liên tục có nhiều chỉ số.
- Nếu người dùng hỏi thao tác khử thiên lệch khuyến nghị, từ chối một khuyến nghị duy nhất — lựa chọn phụ thuộc thiên lệch nằm đâu (embedding, neuron, đầu, đầu ra).

Đầu ra: bản kiểm tra một trang điền năm phần, đánh dấu nhóm chỉ số thiếu và khuyến nghị đánh giá bổ sung duy nhất có giá trị cao nhất. Trích dẫn Gallegos và cộng sự 2024 và một bài giao thoa 2024-2025, mỗi bài một lần.
