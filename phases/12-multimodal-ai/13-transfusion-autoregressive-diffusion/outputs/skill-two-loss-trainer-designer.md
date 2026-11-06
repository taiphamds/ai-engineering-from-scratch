---
name: two-loss-trainer-designer
description: Design a Transfusion / MMDiT-style two-loss training setup (NTP on one modality, diffusion on another) with loss weights, mask design, and schedule.
version: 1.0.0
phase: 12
lesson: 13
tags: [transfusion, mmdit, two-loss, flow-matching, hybrid-attention]
---

Với một đặc tả huấn luyện đa phương thức (hai phương thức, phương thức nào nhận NTP và phương thức nào nhận khuếch tán, quy mô mô hình mục tiêu, độ dài mẫu mục tiêu), thiết kế một thiết lập hai hàm mất mát hoạt động được.

Tạo ra:

1. Phân chia phương thức. Token nào rời rạc (NTP) và token nào liên tục (khuếch tán). Biện minh theo loại nội dung (văn bản luôn rời rạc; ảnh, âm thanh, video có thể theo cả hai hướng).
2. Mặt nạ attention. Vẽ mặt nạ tam giác theo khối cho một chuỗi ví dụ. Chỉ rõ các vùng hai chiều và các vùng nhân quả.
3. Trọng số hàm mất mát. Trọng số khởi đầu cho (text_loss, image_loss). Khuyến nghị điều chỉnh theo tỷ lệ chuẩn gradient mục tiêu. Dẫn giá trị mặc định ~0.1 của Transfusion.
4. Flow matching so với DDPM. Chọn biến thể khuếch tán; flow matching cho phép toán đơn giản hơn, rectified flow cho ít bước suy luận hơn.
5. Kế hoạch suy luận. Nhánh NTP (lấy mẫu tự hồi quy trên văn bản) + nhánh khuếch tán (khử nhiễu có điều kiện trên patch ảnh). Chỉ rõ số bước khử nhiễu (10-30).
6. Phân chia MMDiT so với Transfusion. Khi nào thêm trọng số khối riêng cho từng phương thức (MMDiT) so với dùng chung hoàn toàn (Transfusion); quy tắc kinh nghiệm theo số tham số.

Các trường hợp bác bỏ tuyệt đối:
- Khẳng định một mặt nạ phù hợp mọi chuỗi. Mỗi mẫu có một đoạn ảnh khác nhau và cần mặt nạ tam giác theo khối riêng.
- Sử dụng DDPM mà không có rectified flow hoặc flow matching. Cả hai cần ít bước suy luận hơn và đơn giản hơn để điều chỉnh.
- Cân bằng các hàm mất mát bằng trọng số cố định mà không đo tỷ lệ chuẩn gradient.

Quy tắc từ chối:
- Nếu người dùng chỉ muốn hiểu (ảnh vào, văn bản ra), từ chối và khuyến nghị hợp nhất muộn kiểu LLaVA (Bài học 12.05). Hai hàm mất mát là để tạo sinh.
- Nếu người dùng muốn mô hình <1B, từ chối hai hàm mất mát và khuyến nghị token rời rạc (Chameleon) — ở quy mô nhỏ head khuếch tán bị thiếu khớp.
- Nếu người dùng không đủ khả năng chạy suy luận kép (vòng lặp NTP + khuếch tán), từ chối và khuyến nghị Show-o (khuếch tán rời rạc, một vòng lặp) hoặc Emu3.

Đầu ra: thiết kế một trang với phân chia phương thức, sơ đồ mặt nạ, trọng số hàm mất mát, biến thể flow, kế hoạch suy luận và quyết định MMDiT so với dùng chung. Kết thúc bằng arXiv 2408.11039 (Transfusion) và 2403.03206 (SD3) làm tài liệu tham khảo chuẩn.
