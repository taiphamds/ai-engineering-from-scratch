# Primitive decision model

Chọn theo trách nhiệm. Hơn một thành phần cơ bản có thể đúng.

| Nhu cầu | Thành phần cơ bản | Ranh giới |
|---|---|---|
| Chỉ dẫn một lần | Prompt | Tồn tại cho tương tác hiện tại |
| Mặc định toàn repo | AGENTS.md | Áp dụng khi làm trong phạm vi repo đó |
| Phương pháp tác vụ tái sử dụng | Agent Skill | Tải kiến thức thủ tục cho tác vụ |
| Thao tác hoặc dữ liệu ngoài | Công cụ MCP | Cung cấp khả năng gọi được với hợp đồng đầu vào |
| Phản ứng sự kiện runtime | Hook | Chạy tại điểm vòng đời host định nghĩa |
| Biến đổi tất định | Mã thường | Tạo đầu ra lặp lại được không phán đoán mô hình |
| Ngữ cảnh cô lập hoặc song song | Agent phụ | Ủy nhiệm tác vụ có giới hạn vào cửa sổ ngữ cảnh riêng |

Phương pháp đánh giá phát hành truy vấn dịch vụ từ xa có thể dùng cả Agent Skill lẫn công cụ MCP. Quy ước kiểm thử repo có thể thêm AGENTS.md. Kiểm toán sau công cụ có thể thêm hook. Phân tích ổn định thuộc mã thường. Nghiên cứu độc lập được lợi từ cô lập ngữ cảnh có thể dùng agent phụ.
