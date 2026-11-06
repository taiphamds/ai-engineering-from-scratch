---
name: cold-start-planner
description: Pick and stack cold-start mitigations for serverless LLM deployments. Budget phases (node, image, weights, engine, first forward) and match mitigations to SLA.
version: 1.0.0
phase: 17
lesson: 10
tags: [cold-start, serverless, bottlerocket, model-streamer, gpu-snapshot, warm-pool, serverlessllm]
---

Với kích thước mô hình, SLA (TTFT P99), dạng lưu lượng (ổn định so với đột biến) và định hướng ngân sách, tạo một kế hoạch giảm thiểu khởi động nguội.

Tạo:

1. Ngân sách khởi động nguội. Phân tách đường khởi động nguội thô (cấp phát nút, kéo image, trọng số vào HBM, khởi tạo engine, lượt truyền xuôi đầu tiên). Dùng số giây danh định năm 2026 cho kích thước mô hình đã nêu.
2. Chọn lớp. Chọn số lớp tối thiểu đưa tổng xuống dưới SLA: image được nạp sẵn (L1), model streamer (L2), ảnh chụp GPU (L3), bể nóng (L4), nạp theo tầng (L5). Giải thích từng lớp theo giai đoạn cụ thể mà nó xử lý.
3. Định cỡ bể nóng. Nêu `min_workers` cho đường xử lý chính. Nếu SLA là TTFT P99 < 60s trên một mô hình 70B+, bắt buộc có bể nóng bất kể chi phí.
4. Ước tính chi phí. Chi phí GPU hằng tháng cho bể nóng đã chọn và số lần khởi động nguội dự kiến mỗi ngày.
5. Chính sách phần đuôi. Điều gì xảy ra với người dùng đầu tiên trên một bản sao mới — họ được xếp hàng vào một bản sao nóng, hay họ trả chi phí khởi động nguội? Nêu một chính sách cụ thể (ví dụ: "định tuyến yêu cầu đầu tiên đến bất kỳ bản sao nóng nào trong vòng 10s; nếu không thì chuyển sang bản sao nguội").
6. Chế độ lỗi. Điều gì xảy ra nếu một bản sao nóng chết giữa phiên. Việc khôi phục có tự động (di chuyển trực tiếp), hay là khởi động nguội ở yêu cầu tiếp theo?

Các trường hợp loại bỏ dứt khoát:
- Đề xuất "chỉ cần thêm bể nóng" mà không tính chi phí hằng tháng.
- Khẳng định một biện pháp giảm thiểu mà không có giai đoạn cụ thể nó xử lý (ví dụ: "dùng Bottlerocket" mà không nói nó loại bỏ việc kéo image 180s).
- Bỏ qua ràng buộc theo từng cấu trúc liên kết GPU của ảnh chụp GPU — nếu nền tảng chuyển SKU, ảnh chụp không còn hợp lệ.

Quy tắc từ chối:
- Nếu SLA là TTFT P99 < 5s khi khởi động nguội 70B mới mà không có bể nóng, từ chối — bất khả thi về mặt toán học ở tốc độ hạ tầng năm 2026.
- Nếu ngân sách cấm bể nóng nhưng SLA yêu cầu khởi động nguội dưới 30s, nêu giải pháp đặc thù nền tảng (ảnh chụp GPU Modal, làm nóng trước Baseten) và từ chối hứa hẹn SLA trên một nền tảng khác không có nó.
- Nếu người vận hành yêu cầu giảm quy mô về không với lưu lượng đột biến và một mô hình 70B, từ chối hứa hẹn SLA — phép tính không khả thi nếu không có ảnh chụp hoặc bể nóng.

Đầu ra: một kế hoạch một trang liệt kê các giai đoạn, các lớp, `min_workers`, chi phí hằng tháng, chính sách phần đuôi, chế độ lỗi. Kết thúc bằng chỉ số duy nhất cần cảnh báo: thời lượng khởi động nguội P99 trong giờ trượt gần nhất.
