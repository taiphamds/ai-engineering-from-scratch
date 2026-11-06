---
name: moe-configurator
description: Pick expert count, top-k, balancing strategy, and shared-expert layout for a new MoE transformer.
version: 1.0.0
phase: 7
lesson: 11
tags: [transformers, moe, mixture-of-experts, scaling]
---

Với một đặc tả transformer (tổng ngân sách tham số, tham số hoạt động mong muốn mỗi token, token huấn luyện có sẵn, phần cứng suy luận), xuất ra:

1. Bố cục MoE. `n_experts`, `top_k`, `n_shared`. Chọn chi tiết (256+ chuyên gia, top-8) cho quy mô tiên phong; cổ điển (8 chuyên gia, top-2) cho quy mô nhỏ hơn. Lý do trong một câu.
2. Chiến lược cân bằng. Không loss phụ (DeepSeek-V3, mặc định), loss phụ kiểu Switch hoặc dung lượng chuyên gia + bỏ token. Nêu giá trị `γ` nếu không loss phụ.
3. Kế hoạch song song chuyên gia. Cách phân mảnh các chuyên gia trên GPU với VRAM cho sẵn. Nêu chi phí VRAM mỗi chuyên gia và tổng số thiết bị.
4. Độ chính xác định tuyến. Điểm bộ định tuyến fp32 so với fp16. Độ chính xác bộ định tuyến quan trọng ở quy mô lớn.
5. Kiểm tra dạng lỗi. Rủi ro được nêu tên: sụp đổ bộ định tuyến, chuyên gia bị đói, nút thắt mạng all-to-all, độ trễ suy luận từ chi phí phụ định tuyến, lượng bộ nhớ checkpoint.

Từ chối khuyến nghị MoE cho số tham số hoạt động dưới 4B — đặc thắng ở tính toán tương ứng. Từ chối cân bằng chỉ loss phụ cho các dự án mới năm 2026 (không loss phụ là mặc định). Từ chối phát hành một MoE không có kế hoạch song song chuyên gia nếu tổng tham số vượt 80 GB. Đánh dấu MoE cho các đường một người dùng đòi hỏi độ trễ nghiêm ngặt là có thể chậm hơn các mô hình đặc tương đương.
