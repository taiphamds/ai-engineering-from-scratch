---
name: router-plan
description: Design an LLM model-routing plan — pick pattern (pre-route, cascade, ensemble), signals (task, length, embedding, confidence), and online quality gates.
version: 1.0.0
phase: 17
lesson: 16
tags: [routing, cascade, model-cascade, routellm, notdiamond, cost-reduction]
---

Với tỷ lệ pha trộn khối lượng công việc (mẫu phân loại tác vụ), sàn chất lượng, mức chấp nhận độ trễ và chi tiêu hằng tháng hiện tại, tạo một kế hoạch định tuyến.

Tạo:

1. Mẫu. Định tuyến trước (nhanh nhất, phụ thuộc bộ phân loại), xếp tầng (sàn chất lượng tốt nhất), hoặc tổ hợp (chỉ A/B lấy mẫu). Giải thích bằng mức chấp nhận chất lượng + ngân sách độ trễ.
2. Tín hiệu. Chọn từ: phân loại tác vụ, độ dài prompt, độ tương đồng embedding với tập đã biết là khó, độ tự tin. Nêu các tín hiệu kết hợp (thường 2-3) và quy tắc kết hợp.
3. Cặp rẻ/tiên tiến hàng đầu. Nêu các mô hình cụ thể. Ví dụ: Claude Haiku 3.5 + GPT-5. Giải thích bằng đường cong chi phí + năng lực.
4. Tiết kiệm dự kiến. Tính chi phí pha trộn ở tỷ lệ phân chia khuyến nghị; nêu $ hằng tháng dự kiến so với hiện tại.
5. Cổng chất lượng trực tuyến. Chỉ định giám khảo lưu lượng trực tiếp: mẫu 5% theo tuyến được đánh giá bởi một giám khảo tiên tiến hàng đầu; cảnh báo nếu Δ chất lượng > 2%. Theo dõi tỷ lệ chuyển cấp; cảnh báo nếu tăng >10 điểm trong một tháng.
6. Triển khai. Chạy bóng (định tuyến nhưng bỏ qua; so sánh ngoại tuyến), canary 10% theo nhóm người dùng, mở rộng khi vượt cổng.

Các trường hợp loại bỏ dứt khoát:
- Định tuyến không có cổng chất lượng trực tuyến. Từ chối — độ trôi là lỗi #1.
- Chỉ dùng phân loại tác vụ làm tín hiệu. Từ chối — bỏ sót độ khó bên trong tác vụ.
- Định tuyến tác vụ đủ điều kiện dùng mô hình tiên tiến hàng đầu (mã, toán, nhiều bước) sang mô hình rẻ mà không có dự phòng xếp tầng. Từ chối — sẽ vi phạm sàn chất lượng.

Quy tắc từ chối:
- Nếu mức chấp nhận chất lượng được nêu là "không suy giảm," từ chối định tuyến trước và đề xuất xếp tầng với tỷ lệ chuyển cấp cao.
- Nếu mô hình rẻ không phải Anthropic/không phải OpenAI/không phải tiên tiến hàng đầu và có các mẫu từ chối đã biết (ví dụ: mô hình không kiểm duyệt cho agent dùng công cụ), từ chối cặp này — nó sẽ âm thầm phá vỡ lệnh gọi công cụ.
- Nếu định tuyến đến một nhà cung cấp khác cho mô hình rẻ (xếp tầng xuyên nhà cung cấp), yêu cầu lớp gateway AI (Giai đoạn 17 · 19) để hợp nhất API.

Đầu ra: một kế hoạch một trang nêu mẫu, tín hiệu, cặp mô hình, tiết kiệm dự kiến, cổng trực tuyến, kế hoạch triển khai. Kết thúc bằng chỉ số duy nhất: tỷ lệ chuyển cấp trong 7 ngày trượt; kích hoạt độ trôi nếu thay đổi > 10 điểm phần trăm.
