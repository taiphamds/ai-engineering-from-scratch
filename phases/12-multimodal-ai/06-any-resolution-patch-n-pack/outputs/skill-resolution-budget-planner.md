---
name: resolution-budget-planner
description: Pick between square-resize, AnyRes, M-RoPE, and NaFlex for a mixed-aspect-ratio VLM workload and emit a per-task token budget plan.
version: 1.0.0
phase: 12
lesson: 06
tags: [vlm, patch-n-pack, naflex, anyres, m-rope, token-budget]
---

Với khối lượng công việc — mô tả ảnh VLM sẽ thấy (tài liệu OCR, biểu đồ, ảnh chụp UI, ảnh tự nhiên, khung video) và ngân sách tổng token mỗi yêu cầu — chọn một chiến lược độ phân giải mỗi lớp ảnh và tạo cấu hình chạy được.

Tạo:

1. Chiến lược từng lớp ảnh. Với mỗi lớp khai báo (OCR, biểu đồ, UI, ảnh chụp, khung video), chọn một trong {square-resize, AnyRes, M-RoPE, NaFlex}. Lý giải một câu viện dẫn độ nhạy độ phân giải tác vụ.
2. Ngân sách token mỗi ảnh. Gồm min_pixels, max_pixels (kiểu Qwen2.5-VL) và độ dài chuỗi kỳ vọng với chiến lược chọn. Đánh dấu nếu bất kỳ ảnh đơn nào vượt 40% ngữ cảnh LLM.
3. Kế hoạch đóng gói batch. Nếu yêu cầu được gom batch, chỉ rõ dùng `cu_seqlens` (FlashAttn varlen), mask chéo khối dày đặc hay suy luận một ảnh không batch. Lưu ý FLOP tiết kiệm của varlen khi tỷ lệ khung hình batch khác > 2x.
4. Khuyến nghị encoder. SigLIP 2 NaFlex cho khối lượng hỗn hợp; Qwen2.5-VL nguyên bản cho UI tác tử; CLIP-336 + AnyRes cho triển khai encoder đóng băng; ViT thô ở 224 cho đường chỉ ảnh chụp.
5. Cảnh báo dạng thất bại. Token mỗi ảnh ở cấu hình chọn; chi phí độ trễ ở prefill 30 tok/s; phần trăm lấp ngữ cảnh; chênh lệch độ chính xác kỳ vọng so với đổi kích thước vuông trên benchmark OCR điển hình.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị đổi kích thước vuông cho OCR hoặc biểu đồ mà không nêu con số benchmark người dùng sẽ mất.
- Đề xuất chiến lược tạo nhiều token hơn ngữ cảnh LLM cho phép. Luôn lập ngân sách theo cửa sổ ngữ cảnh khai báo.
- Xem AnyRes là câu trả lời phổ quát — chi phí ô nhân thêm có thể vượt ngữ cảnh LLM trước khi một ảnh mã hóa xong.

Quy tắc từ chối:
- Nếu ngân sách token người dùng khai báo dưới 256 token mỗi ảnh, từ chối cho mọi thứ ngoài tác vụ ngữ nghĩa chỉ ảnh chụp — không lượng pooling nào phục hồi độ chính xác OCR ở ngân sách đó.
- Nếu người dùng muốn đầu ra dự đoán dày đặc (phân đoạn, độ sâu) mà encoder không có token thanh ghi ViT, từ chối và chỉ đến DINOv2 / SigLIP 2 có bật thanh ghi.
- Nếu ngữ cảnh LLM người dùng < 8k và khối lượng có tài liệu hoặc ảnh chụp màn hình, từ chối và khuyến nghị ngữ cảnh lớn hơn hoặc pipeline OCR trước.

Đầu ra: kế hoạch ngân sách một trang với bảng chiến lược từng lớp, kế hoạch đóng gói batch, khuyến nghị encoder và danh sách cảnh báo. Kết thúc bằng bài báo arXiv liên quan để tiếp nối — 2307.06304 cho NaViT, 2502.14786 cho SigLIP 2 / NaFlex, 2502.13923 cho Qwen2.5-VL.
