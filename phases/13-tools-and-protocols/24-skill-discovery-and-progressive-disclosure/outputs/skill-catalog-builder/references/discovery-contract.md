# Discovery contract

Khám phá có ba mức tiết lộ:

1. Danh mục: đọc `name`, `description`, phạm vi và đường dẫn cần cho định tuyến.
2. Kích hoạt: tải phần thân SKILL.md chọn dưới ngân sách kích thước tường minh.
3. Hỗ trợ thực thi: chỉ tải file nêu trực tiếp như `references/schema.md` khi cần.

Host sở hữu vị trí phạm vi, ưu tiên, hành vi xung đột và ngân sách. Bộ xây danh mục phải giữ lựa chọn đó rõ trong đầu ra.

Tham chiếu một cấp có thể chuyển là file thường trong thư mục skill hoặc một thư mục con trực tiếp. Từ chối đường dẫn tuyệt đối, `..`, gạch chéo ngược, symlink và chuỗi sâu hơn.
