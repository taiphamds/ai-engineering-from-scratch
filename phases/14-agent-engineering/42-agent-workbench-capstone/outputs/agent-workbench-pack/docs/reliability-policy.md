# Reliability Policy

Workbench hấp thụ năm chế độ lỗi tái diễn trong ngành:

1. Hành động ảo giác — được bắt bởi tập quy tắc + cổng xác minh.
2. Mở rộng phạm vi — được bắt bởi kiểm tra diff hợp đồng phạm vi.
3. Các lỗi dây chuyền — được bắt bởi các bản ghi phản hồi + từ chối khi mã thoát null.
4. Mất ngữ cảnh — được hấp thụ bởi bộ nhớ repo; trò chuyện không phải nguồn sự thật.
5. Dùng sai công cụ — được bắt bởi chiều xác minh của bảng tiêu chí đánh giá.

Chính sách được thực thi bởi cổng xác minh. Đường override có chữ ký
và được kiểm toán; các agent không thể tự override.
