---
name: dualpipe-planner
description: Plan a pipeline parallelism strategy (1F1B, Zero Bubble, DualPipe, DualPipeV) for a training cluster.
version: 1.0.0
phase: 10
lesson: 19
tags: [pipeline-parallelism, dualpipe, dualpipev, zero-bubble, expert-parallelism, distributed-training]
---

Với một đặc tả cụm huấn luyện (tổng số GPU, cấu trúc liên kết kết nối, mẫu bộ tăng tốc, bộ nhớ mỗi GPU), một hình dạng mô hình (tổng tham số, tham số hoạt động, MoE hay dense, số lớp dự kiến) và khối lượng dữ liệu huấn luyện đích, khuyến nghị chiến lược pipeline parallelism và xác nhận tỷ lệ bubble dự kiến.

Tạo:

1. Độ sâu pipeline P. Chọn dựa trên ngân sách bộ nhớ GPU (phải chứa vừa một stage pipeline trên mỗi rank), MoE so với dense và băng thông kết nối. Phạm vi: 4 cho cụm nhỏ, 16-32 cho huấn luyện MoE tiên tiến nhất.
2. Số micro-batch M. Phải chia hết cho 2 với DualPipe và DualPipeV. Tỷ lệ M/P điển hình từ 8 đến 16. Biện minh theo mục tiêu tích lũy gradient và bộ nhớ activation ở độ dài chuỗi đích.
3. Lựa chọn lịch. Chọn trong 1F1B, Zero Bubble, DualPipe, DualPipeV. Bảng quyết định: huấn luyện dense dưới 500 GPU -> Zero Bubble. MoE với expert parallelism -> DualPipe. Huấn luyện dense trên 500 GPU không có all-to-all nặng -> DualPipeV. Các lượt chạy nhỏ dưới 100 GPU -> 1F1B là phù hợp.
4. Tỷ lệ bubble dự kiến. Tính cho lịch đã chọn ở P và M đích. Báo cáo dưới dạng phần trăm và GPU-giờ tuyệt đối tiết kiệm so với 1F1B ở tổng ngân sách huấn luyện.
5. Kế hoạch nhân bản tham số (chỉ DualPipe). Xác nhận việc nhân bản tham số 2x vừa VRAM sẵn có. Báo cáo mật độ tham số hiệu dụng trên mỗi GPU với P đã chọn.

Các trường hợp loại bỏ dứt khoát:
- DualPipe không có Expert Parallelism. Việc nhân bản 2x không có cơ sở nếu không có giao tiếp nặng EP để ẩn.
- P > 64 trong bất kỳ lượt huấn luyện nào. Tỷ lệ bubble tăng tuyến tính theo P bất kể lịch.
- Số micro-batch không chia hết cho 2 với DualPipe/DualPipeV. Lịch sẽ không khép kín.
- Bất kỳ pipeline parallelism nào khi mô hình vừa bộ nhớ của một GPU. Chỉ dùng data parallelism.

Quy tắc từ chối:
- Nếu kết nối là 200Gbps hoặc chậm hơn trên mỗi GPU, từ chối DualPipe và khuyến nghị DualPipeV. Cửa sổ chồng lấp all-to-all quá hẹp để biện minh cho việc nhân bản.
- Nếu người dùng không thể cung cấp kernel all-to-all tùy chỉnh phù hợp với cấu trúc liên kết cụm của họ, khuyến nghị Zero Bubble thay vì DualPipe.
- Nếu lượt huấn luyện dưới 1B token, từ chối hoàn toàn việc lập kế hoạch pipeline parallelism và khuyến nghị data parallelism cộng tensor parallelism.

Đầu ra: một kế hoạch dài một trang liệt kê P, M, lịch, tỷ lệ bubble dự kiến, chi phí nhân bản tham số (nếu DualPipe) và khuyến nghị kernel all-to-all. Kết thúc bằng đoạn "điều kiện kích hoạt hoàn tác" nêu chỉ số sử dụng cụ thể (phần trăm sử dụng GPU tổng hợp, đo trên 1000 bước đầu) sẽ biện minh cho việc chuyển sang lịch đơn giản hơn nếu không đạt con số đích.
