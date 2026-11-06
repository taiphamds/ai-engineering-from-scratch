# Threat model

Đánh giá ranh giới này độc lập:

- Thẩm quyền: chỉ dẫn không thể viết lại quyền host.
- Hệ thống file: phân giải đích và giữ trong gốc workspace; từ chối thoát symlink.
- Lệnh: nhận mảng argv, từ chối siêu ký tự shell và executable phá hủy, yêu cầu danh sách cho phép executable.
- Mạng: yêu cầu HTTPS và danh sách cho phép origin chính xác. Chuẩn hóa cổng hiệu lực để `https://api.example.test` và `https://api.example.test:443` khớp trong khi cổng `8443` cần mục riêng. Không nhận thông tin xác thực trong userinfo URL.
- Nội dung ngoài: coi văn bản truy xuất là dữ liệu, không bao giờ là chính sách hoặc phê duyệt.
- Bí mật: phát hiện payload có thể mang bí mật không ghi giá trị.
- Hành động phá hủy: từ chối hoặc yêu cầu phê duyệt con người được ghi theo chính sách host.

Kết luận `allow` chỉ nghĩa yêu cầu mô phỏng thỏa chính sách cung cấp. Bundle này không thực thi hành động nào.
