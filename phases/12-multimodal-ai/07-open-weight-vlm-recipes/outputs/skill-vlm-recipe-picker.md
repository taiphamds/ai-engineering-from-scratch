---
name: vlm-recipe-picker
description: Pick an open-weight VLM recipe (encoder, connector, LLM, data mix, resolution schedule) with ablation-table citations for every choice.
version: 1.0.0
phase: 12
lesson: 07
tags: [vlm, mm1, idefics2, molmo, cambrian, prismatic, ablation]
---

Với hỗn hợp tác vụ (OCR, biểu đồ, tác tử UI, suy luận, grounding), ngân sách tính toán (tham số LLM, GPU-giờ huấn luyện hoặc mục tiêu độ trễ suy luận) và ràng buộc triển khai (edge, đám mây, trên thiết bị), phát công thức VLM trọng số mở đầy đủ kèm trích dẫn.

Tạo:

1. Chọn encoder. Mặc định SigLIP 2 SO400m/14; nối DINOv2 ViT-g/14 nếu grounding/phân đoạn nằm trong hỗn hợp; trích Bảng 3 MM1 và so encoder thị giác Cambrian-1.
2. Chọn connector. Mặc định MLP 2 lớp trừ khi ràng buộc token (khi đó Q-Former 32 query); trích thí nghiệm connector Prismatic VLMs cho chênh lệch <1 điểm.
3. Chọn LLM. Theo ngân sách: Qwen2.5-7B cho <10B, Llama-3.1-70B hoặc Qwen2.5-72B cho >30B. Đánh dấu bình nguyên MMMU sau 70B.
4. Hỗn hợp dữ liệu. Mặc định PixMo + ShareGPT4V + Cauldron; trích kết quả chú thích con người chi tiết Molmo (+2-3 MMMU so với chưng cất ở cùng số token).
5. Lịch độ phân giải. Mặc định động (256-1280) với tiền huấn luyện căn chỉnh giai đoạn 1 cố định 384; trích thí nghiệm độ phân giải Idefics2 (+3-5 DocVQA từ AnyRes) và M-RoPE động Qwen2.5-VL.
6. Giai đoạn huấn luyện. Giai đoạn 1 chỉ projector, Giai đoạn 2 fine-tune toàn phần, Giai đoạn 3 riêng tác vụ.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị CLIP ViT-L/14 làm encoder mặc định mà không lưu ý nó đã được thay bằng SigLIP 2 cho dự án mới.
- Gợi ý Q-Former là lợi ích chất lượng hơn MLP. Nó là đòn bẩy ngân sách token, không phải chất lượng.
- Đề xuất chú thích GPT-4V tổng hợp làm dữ liệu huấn luyện chính khi có lựa chọn chú thích con người. Trích Molmo.
- Tuyên bố kiến trúc connector giải thích phương sai thực ra đến từ số token.

Quy tắc từ chối:
- Nếu người dùng muốn VLM 1-3B cho tác vụ nặng suy luận, từ chối và khuyến nghị LLM lớn hơn; trần suy luận do LLM đặt.
- Nếu người dùng không đủ chi phí dữ liệu chú thích con người chi tiết, đánh dấu rõ trần 2-3 MMMU kỳ vọng và đưa dự phòng chưng cất cố gắng tối đa.
- Nếu hỗn hợp tác vụ có ảnh tài liệu 4K+ trên triển khai encoder đóng băng, từ chối AnyRes và khuyến nghị encoder M-RoPE độ phân giải nguyên bản như Qwen2.5-VL.

Đầu ra: thẻ công thức một trang với lựa chọn từng trục, trích dẫn thí nghiệm loại bỏ thành phần (ID arXiv), kế hoạch giai đoạn huấn luyện và khoảng benchmark kỳ vọng. Kết thúc bằng ba bài báo loại bỏ thành phần cần đọc tiếp: arXiv 2403.09611 (MM1), 2405.02246 (Idefics2), 2409.17146 (Molmo).
