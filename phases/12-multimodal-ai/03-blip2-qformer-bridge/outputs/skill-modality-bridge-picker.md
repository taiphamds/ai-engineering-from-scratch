---
name: modality-bridge-picker
description: Recommend Q-Former vs MLP projector vs Perceiver resampler for a VLM configuration given token budget, quality target, and training compute.
version: 1.0.0
phase: 12
lesson: 03
tags: [blip2, qformer, vlm, modality-bridge, architecture]
---

Với số token mỗi ảnh của encoder thị giác, ngân sách ngữ cảnh LLM, số ảnh đích mỗi prompt và ngân sách tính toán huấn luyện, khuyến nghị cầu nối phương thức cần dùng và lý giải bằng số tham số và kinh tế token.

Tạo:

1. Kiểm toán ngân sách token. Báo token thô mỗi ảnh từ encoder thị giác, token mỗi ảnh sau mỗi lựa chọn cầu nối và tỷ phần ngữ cảnh LLM tiêu thụ ở số ảnh mỗi prompt đã khai báo.
2. So cầu nối. Với mỗi Q-Former (32 token, ~188M tham số), projector MLP (mọi patch, ~20M tham số) và Perceiver resampler (K query có thể học qua cross-attention N lớp, thay đổi), đưa tham số, đại diện chất lượng và ước lượng sơ bộ chi phí huấn luyện.
3. Khuyến nghị. Một lựa chọn tốt nhất cho ràng buộc đã nêu, với lý giải một dòng. Đánh dấu khi ràng buộc mâu thuẫn (chất lượng cao + ngân sách token chặt + tính toán huấn luyện thấp).
4. Theo dấu huấn luyện hai giai đoạn. Nếu chọn Q-Former, phác loss ITC + ITM + ITG cho giai đoạn 1 và LM loss cho giai đoạn 2. Nêu bộ dữ liệu đại diện cho mỗi loại (COCO, LAION, Visual Genome).
5. Danh sách thí nghiệm loại bỏ thành phần. Năm thí nghiệm người gọi nên chạy trước khi chốt cầu nối (số query, hai giai đoạn so với một, độ sâu projector, lịch đóng băng, tập con finetune).

Các trường hợp loại bỏ dứt khoát:
- Mọi khuyến nghị bỏ qua ngân sách token. "Dùng MLP" với 576 token mỗi ảnh thất bại ở 10 ảnh trong ngữ cảnh 4k.
- Tuyên bố Q-Former tuyệt đối vượt MLP. Ở tác vụ một ảnh chất lượng cao với ngữ cảnh không giới hạn, MLP thắng.
- Xem Perceiver resampler tương đương Q-Former. Flamingo áp dụng ở mọi lớp LLM; BLIP-2 áp dụng một lần.

Quy tắc từ chối:
- Nếu người gọi yêu cầu cầu nối xử lý video mà không chỉ rõ bao nhiêu khung và tốc độ khung nào, từ chối — cầu nối video khác cầu nối một ảnh theo đặc tả, không chỉ quy mô.
- Nếu LLM trong phạm vi được huấn luyện từ đầu cùng tháp thị giác (hợp nhất sớm, kiểu Chameleon), từ chối — Bài 12.11 trình bày riêng trường hợp đó.
- Nếu không nêu tính toán huấn luyện, từ chối và hỏi người gọi đủ chi phí giai đoạn 2 BLIP-2 (~vài trăm A100-giờ) hay chỉ huấn luyện projector.

Đầu ra: khuyến nghị cầu nối một trang với phép tính token, số tham số, kiến trúc khuyến nghị, phác thảo huấn luyện và danh sách thí nghiệm loại bỏ thành phần. Kết thúc bằng đoạn "đọc gì tiếp" chỉ đến Bài 12.04 (Flamingo) cho cross-attention mọi nơi, Bài 12.05 (LLaVA) cho chỉ MLP hoặc Bài 12.07 (loại bỏ thành phần) cho đánh đổi dữ liệu-kiến trúc.
