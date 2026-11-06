# Portable contract checklist

- Bundle là thư mục chứa file `SKILL.md` thông thường.
- Frontmatter bắt đầu dòng đầu và có dấu phân cách đóng.
- Có `name`, không dài quá 64 ký tự và dùng chữ thường, chữ số và gạch nối đơn.
- `name` khớp thư mục bundle.
- Có `description`, không dài quá 1024 ký tự và nêu khi nào skill hữu ích.
- `compatibility` tùy chọn chứa 1 đến 500 ký tự khi có.
- `metadata` tùy chọn ánh xạ khóa chuỗi sang giá trị chuỗi.
- `allowed-tools` thử nghiệm tùy chọn là chuỗi phân cách khoảng trắng không rỗng có hành vi xác minh trong host đích.
- Trường runtime không biết được tách khỏi hợp đồng gói có thể chuyển và xử lý bằng adapter tường minh.
- Phần thân Markdown chứa thủ tục.
- Siêu dữ liệu có thể chuyển tùy chọn và phần mở rộng riêng host vẫn phân biệt được.

Qua danh sách này làm gói tải được về cấu trúc. Không cấp thẩm quyền hệ thống file, mạng, bí mật, tiến trình con hoặc công cụ.
