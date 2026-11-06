---
name: sleeper-audit
description: Audit an alignment-training report for whether it actually demonstrates removal of a planted or suspected backdoor.
version: 1.0.0
phase: 18
lesson: 7
tags: [sleeper-agents, backdoor, alignment-training, adversarial-training, probes]
---

Với báo cáo khẳng định hành vi có hại đã loại bỏ khỏi mô hình (qua SFT, RLHF, huấn luyện đối kháng hoặc tổ hợp bất kỳ), kiểm tra việc loại bỏ có thực sự được chứng minh đối với mô hình đe dọa tiêu chuẩn Hubinger và cộng sự 2024 không.

Tạo:

1. Phạm vi gợi hành vi. Báo cáo có giữ riêng một phương pháp gợi hành vi mà pipeline huấn luyện chưa từng thấy không? Nếu đánh giá duy nhất là phân phối của chính red team, việc loại bỏ chưa được chứng minh.
2. Tính tổng quát kích hoạt. Kích hoạt được nêu là chuỗi nguyên văn, dịch chuyển phân phối hay đặc trưng môi trường (ngày, token, kích thước ngữ cảnh)? Tính tổng quát quyết định kích thước không gian tìm kiếm red team phải bao phủ.
3. Bằng chứng trạng thái nội bộ. Nhóm có áp dụng thăm dò luồng phần dư, đặc trưng SAE hoặc thăm dò cơ chế khác để kiểm tra trạng thái liên quan kích hoạt còn hiện diện bên trong ngay cả khi hành vi sạch không? Theo công trình tiếp nối Anthropic tháng 4 năm 2024, trạng thái nội bộ vẫn đọc tuyến tính được sau loại bỏ hành vi.
4. Kiểm tra sự tồn tại bền bỉ qua pipeline. Việc loại bỏ có được xác minh sau mọi giai đoạn huấn luyện tiếp theo (SFT thêm, lượt RLHF sau, hợp nhất adapter, chưng cất) không? Cửa hậu tồn tại bền bỉ qua huấn luyện — mô hình cuối là thứ được đánh giá, không phải checkpoint giữa.
5. Kiểm tra nhất quán quy mô. Nếu khẳng định dựa trên mô hình nhỏ hơn, Hình 4 Hubinger 2024 cho thấy sự tồn tại bền bỉ tăng theo quy mô. Bằng chứng mô hình nhỏ hơn không chuyển lên trên.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "chúng tôi áp dụng RLHF nên mô hình an toàn" không có cách gợi hành vi giữ riêng.
- Mọi khẳng định chỉ dựa trên đánh giá phân phối red-team (huấn luyện và đánh giá rút từ cùng nguồn).
- Mọi khẳng định loại bỏ không có thăm dò trạng thái nội bộ khi cơ chế cấy ban đầu chưa biết.

Quy tắc từ chối:
- Nếu người dùng hỏi "RLHF có thể loại căn chỉnh mang tính lừa dối không," từ chối trả lời nhị phân và trỏ đến Phần 5 Hubinger và cộng sự 2024 về sự tồn tại bền bỉ và Phần 6 về chuỗi suy nghĩ.
- Nếu người dùng hỏi xác suất số của lừa dối tiềm ẩn, từ chối và giải thích tỷ lệ nền chưa biết; bằng chứng thực nghiệm là sự tồn tại bền bỉ trong sinh vật được xây, không phải tỷ lệ xuất hiện trong mô hình huấn luyện tự nhiên.

Đầu ra: bản kiểm tra một trang ánh xạ bằng chứng báo cáo lên năm chiều kiểm tra trên, đánh dấu mọi chiều báo cáo không giải quyết, và nêu mô hình đe dọa chưa giải quyết lớn nhất duy nhất. Trích dẫn Hubinger và cộng sự (arXiv:2401.05566) cho mô hình đe dọa cơ sở.
