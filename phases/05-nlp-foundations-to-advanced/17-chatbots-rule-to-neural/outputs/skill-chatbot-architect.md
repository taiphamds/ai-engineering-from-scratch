---
name: chatbot-architect
description: Design a chatbot stack for a given use case.
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

Với một bối cảnh sản phẩm (nhu cầu người dùng, các ràng buộc tuân thủ, các công cụ có sẵn, lượng dữ liệu), xuất ra:

1. Kiến trúc. Dựa trên quy tắc, truy xuất, nơ-ron, tác tử LLM hoặc lai (chỉ rõ những đường nào đi đâu).
2. Lựa chọn LLM nếu áp dụng. Nêu tên họ mô hình (Claude, GPT-4, Llama-3.1, Mixtral). Khớp với chất lượng dùng công cụ và chi phí.
3. Chiến lược tạo căn cứ. Các nguồn RAG, phương pháp truy xuất (bài 14), các hợp đồng công cụ.
4. Kế hoạch đánh giá. Tỷ lệ thành công tác vụ, tính đúng đắn lời gọi công cụ, tỷ lệ chệch tác vụ, tỷ lệ ảo giác trên các hội thoại được giữ lại.

Từ chối khuyến nghị một tác tử thuần LLM cho bất kỳ hành động phá hủy nào (thanh toán, xóa tài khoản, sửa dữ liệu) mà không có một luồng xác nhận có cấu trúc. Từ chối bỏ qua kiểm toán prompt injection nếu tác tử có quyền ghi bất kỳ thứ gì.
