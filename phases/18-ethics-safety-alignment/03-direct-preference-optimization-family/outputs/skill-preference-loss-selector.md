---
name: preference-loss-selector
description: Recommend a direct-alignment-algorithm loss given dataset shape and target stage.
version: 1.0.0
phase: 18
lesson: 3
tags: [dpo, ipo, kto, simpo, orpo, bpo, daa, preference-optimization]
---

Với mô tả tập dữ liệu ưu tiên (ghép cặp so với không ghép cặp, phân phối cường độ ưu tiên, phân phối độ dài, kích thước) và mục tiêu huấn luyện (một giai đoạn từ nền, hai giai đoạn sau SFT, tiếp tục on-policy), khuyến nghị hàm mất mát từ họ DPO và nêu chế độ lỗi duy nhất nó bảo vệ chống lại.

Tạo:

1. Dấu vân tay tập dữ liệu. Ghép cặp? Không ghép cặp? Cân bằng độ dài? Phương sai cường độ ưu tiên? Chủ yếu trong phân phối hay miền mở? Chọn 4 trường giàu thông tin nhất cho tập dữ liệu này.
2. Khuyến nghị hàm mất mát. Từ {DPO, IPO, KTO, SimPO, ORPO, BPO}. Một chính và một dự phòng. Với mỗi hàm, nêu chế độ lỗi cụ thể nó bảo vệ chống lại trên tập dữ liệu này.
3. Mặc định siêu tham số. `beta` cho phương pháp có điểm neo, biên `gamma` cho SimPO, `lambda` cho ORPO. Luôn nêu chúng như điểm bắt đầu cho một lượt quét, không bao giờ là giá trị cuối.
4. Dấu hiệu cảnh báo trong dữ liệu. Nếu cường độ ưu tiên hoàn toàn đồng nhất, phương pháp họ DPO mất tín hiệu theo cặp — khuyến nghị thu thập ưu tiên được hiệu chuẩn. Nếu trung bình `|y_w| / |y_l|` lệch > 1.5, đánh dấu thiên lệch độ dài và thúc đẩy hướng SimPO.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định DPO (hoặc bất kỳ thành viên nào) "thoát Goodhart." Rafailov và cộng sự (NeurIPS 2024) chứng minh thuật toán căn chỉnh trực tiếp quá tối ưu hóa theo cùng hình dạng đường cong phần thưởng chuẩn như RLHF có RM tường minh.
- Mọi khuyến nghị không chỉ định đánh giá năng lực giữ riêng bên cạnh đánh giá ưu tiên. Thuật toán căn chỉnh trực tiếp vẫn cần phép đo chuẩn tín hiệu chuẩn.
- Mọi khẳng định phương pháp không chính sách tham chiếu (SimPO, ORPO) "không cần điều chuẩn." Số hạng giống SFT hoặc hình phạt độ dài là bộ điều chuẩn.

Quy tắc từ chối:
- Nếu tập dữ liệu nhỏ hơn 5k cặp và người dùng nhắm mô hình quy mô tiên tiến hàng đầu, từ chối và khuyến nghị mở rộng tập dữ liệu hoặc dùng cách tiếp cận SFT trước.
- Nếu người dùng yêu cầu hàm mất mát "tốt nhất", từ chối và giải thích không có phương án thắng dạng đóng — phương pháp đúng phụ thuộc dạng tập dữ liệu và tác vụ.

Đầu ra: một khuyến nghị một trang liệt kê dấu vân tay tập dữ liệu, hàm mất mát chính và dự phòng, siêu tham số khởi đầu và dấu hiệu cảnh báo. Trích dẫn DPO (arXiv:2305.18290) và một bài báo khác trong họ (IPO, KTO, SimPO, ORPO, hoặc BPO), mỗi bài đúng một lần.
