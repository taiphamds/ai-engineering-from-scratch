# Invocation model

| Kênh | Bên khởi tạo | Lựa chọn | Dùng điển hình |
|---|---|---|---|
| Con người tường minh | Người dùng | Đúng tên đã khám phá | Chọn quy trình chủ ý |
| Mô hình hoặc agent ngầm | Mô hình hoặc agent tự chủ | Liên quan mô tả cộng chính sách host | Định tuyến nhạy ngữ cảnh |
| Ứng dụng lập trình | Runtime sản phẩm | Đúng tên cấu hình và danh sách cho phép đích | Quy trình sản phẩm tất định |
| Kết hợp skill | Skill hoặc agent phụ khác | Đúng đích, danh tính bên gọi và chính sách độ sâu | Phụ thuộc quy trình có giới hạn |
| Bộ khung lập trình | Runtime đánh giá | Đúng tên cấu hình và danh sách cho phép đích | Đánh giá tất định |

Kích hoạt con người và mô hình tạo 2x2: không bên nào, chỉ con người, chỉ mô hình hoặc cả hai. Kích hoạt ứng dụng, kết hợp và bộ khung là kênh riêng có chính sách đích, bên gọi và độ sâu riêng.

Với định tuyến ngầm, áp đủ điều kiện tác nhân và phần mở rộng host trước xếp liên quan. Skill điểm cao bị chặn không phải bên thắng; bỏ khỏi tập lựa chọn và đánh giá ứng viên đủ điều kiện còn lại. Không chọn nếu tập đủ điều kiện rỗng hoặc điểm tốt nhất không đạt ngưỡng.

Trường như `user-invocable` hoặc `disable-model-invocation` có thể có nghĩa với host cụ thể. Adapter có thể thực thi, nhưng tài liệu có thể chuyển không được khẳng định mọi runtime nhận cùng trường hoặc giá trị.
