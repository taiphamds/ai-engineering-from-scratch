---
name: token-gen-cost-analyzer
description: Compute token counts, inference latency, and quality ceiling for Emu3-style next-token generation and pick between Emu3-family and diffusion.
version: 1.0.0
phase: 12
lesson: 12
tags: [emu3, next-token-prediction, video-gen, diffusion, cfg]
---

Với một đặc tả sản phẩm tạo sinh (ảnh hoặc video, độ phân giải mục tiêu, cấp chất lượng, yêu cầu thông lượng), tính số token cho việc tạo token tiếp theo kiểu Emu3, ước tính chi phí suy luận và chọn giữa họ Emu3 với khuếch tán.

Tạo ra:

1. Số token. Token cho mỗi hình ảnh ở mức giảm của tokenizer đã chọn (thường 8 lần theo mỗi chiều đối với hình ảnh). Token cho mỗi video với VQ 3D (thường 4 khung hình x 8x8 pixel mỗi token).
2. Độ trễ suy luận. Token / thông lượng (token mỗi giây) cho họ Emu3; số bước khử nhiễu * thời gian mỗi bước cho khuếch tán. Dẫn các khoảng cụ thể của A100 / H100.
3. Giới hạn chất lượng. PSNR tái tạo của tokenizer (30-32 dB cho lớp IBQ), kỳ vọng FID trên MJHQ-30K, FVD cho video.
4. Cấu hình CFG. Trọng số hướng dẫn (gamma) được khuyến nghị theo từng tác vụ; thường là 3.0 cho tạo sinh tiêu chuẩn, 5-7 để bám sát prompt mạnh.
5. Lựa chọn. Họ Emu3 nếu sản phẩm cần hiểu + tạo sinh thống nhất hoặc tính linh hoạt với bất kỳ phương thức nào; khuếch tán (SDXL / SD3 / Flux) nếu sản phẩm chỉ tạo ảnh với độ trễ nghiêm ngặt.

Các trường hợp bác bỏ tuyệt đối:
- Khẳng định Emu3 nhanh hơn khuếch tán khi suy luận. Không phải vậy; giải mã tự hồi quy qua hàng nghìn token ảnh là chi phí hiện hữu.
- Khuyến nghị họ Emu3 mà không chỉ rõ trọng số CFG. Chất lượng sụp đổ nếu không có nó.
- Đề xuất Emu3 để tạo ảnh đúng 4K. Số token ở độ phân giải 2048+ làm quá tải KV cache và mất nhiều phút.

Quy tắc từ chối:
- Nếu ngân sách độ trễ là <5s mỗi ảnh, từ chối Emu3 và khuyến nghị SDXL hoặc SD3.
- Nếu sản phẩm phải phát ra ảnh VÀ mô tả chúng VÀ suy luận về ảnh của bên thứ ba, khuyến nghị họ Emu3 (hàm mất mát thống nhất là điểm chính); khuếch tán không thể làm điều này nếu không có một VLM riêng.
- Nếu người dùng muốn trọng số mở với giấy phép dễ dãi để sử dụng thương mại, từ chối Emu3 — kiểm tra giấy phép của nó trước; một số phiên bản chỉ dành cho nghiên cứu.

Đầu ra: phân tích một trang với số token, ước tính độ trễ, giới hạn chất lượng, cấu hình CFG và một lựa chọn kèm lý do. Kết thúc bằng arXiv 2409.18869 (Emu3) và 2408.11039 (Transfusion) cho phương án thay thế.
