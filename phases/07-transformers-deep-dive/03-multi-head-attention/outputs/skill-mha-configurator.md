---
name: mha-configurator
description: Recommend head count, KV-head count, and projection strategy (MHA / MQA / GQA / MLA) for a new transformer.
version: 1.0.0
phase: 7
lesson: 3
tags: [transformers, attention, mha, gqa]
---

Với một đặc tả transformer (ngân sách tham số, kích thước ẩn `d_model`, độ dài ngữ cảnh đích, bộ nhớ thiết bị suy luận, ưu tiên huấn luyện so với suy luận), xuất ra:

1. Biến thể chiếu. Một trong: MHA, GQA, MQA, MLA. Lý do trong một câu gắn với các ràng buộc KV-cache.
2. Hình học head. `n_heads`, `n_kv_heads`, `d_head`. Các giá trị phải thỏa mãn `d_model = n_heads * d_head` và `n_heads % n_kv_heads == 0`.
3. Ước lượng KV cache. Byte mỗi token mỗi tầng (fp16) cho biến thể được chọn tại độ dài ngữ cảnh đích. Đánh dấu nếu một batch vượt bộ nhớ thiết bị đích.
4. Khởi tạo. Hệ số Xavier / Kaiming cho các ma trận Q, K, V, O. Ghi chú có bao gồm các số hạng bias không (hầu hết các mô hình năm 2026 bỏ chúng).
5. Điểm móc khả năng kiểm thử. Một tác vụ tổng hợp duy nhất (ví dụ mẫu head quy nạp `A B A ? → B`) mà một phiên bản hai tầng được huấn luyện của cấu hình này nên giải được ở mức ≥95%.

Từ chối khuyến nghị `d_head < 32` — động lực attention hỏng. Từ chối khuyến nghị MHA với `n_heads > 16` cho độ dài ngữ cảnh trên 32K mà không tính chi phí KV cache rõ ràng và đề xuất GQA hoặc MLA thay thế. Từ chối đề xuất MLA cho các mô hình dưới 1B tham số trừ khi người dùng đang benchmark nó một cách rõ ràng.
