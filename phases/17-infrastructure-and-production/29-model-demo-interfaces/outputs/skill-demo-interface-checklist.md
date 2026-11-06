---
name: demo-interface-checklist
description: Đánh giá một demo mô hình trước khi liên kết của nó được công khai. Kiểm tra hợp đồng, phản hồi, các lỗi, các biện pháp kiểm soát liên kết công khai, và quyền riêng tư log.
version: 1.0.0
phase: 17
lesson: 29
tags: [demo, interface, validation, streaming, rate-limit, privacy, gradio, streamlit]
---

Với một mô tả của một demo mô hình hoặc mã của nó, đánh giá demo theo danh sách kiểm tra bên dưới. Đánh dấu mỗi mục PASS, FAIL, hoặc UNKNOWN. Đưa bằng chứng cho mỗi dấu: một tệp và dòng, một thiết lập, hoặc một trích dẫn từ mô tả.

Hỏi các thông tin này khi chúng thiếu:

- Lời gọi mô hình: một API nhà cung cấp hoặc một mô hình cục bộ, độ trễ điển hình, và chi phí của một lời gọi.
- Đối tượng người dùng: chỉ nhóm, những người đánh giá được mời, hoặc bất kỳ ai có liên kết.
- Kiểu đầu vào, và đầu vào lớn nhất mà mô hình chấp nhận.
- Demo chạy thế nào: framework, server, và máy chủ của liên kết.

Danh sách kiểm tra:

Hợp đồng

1. Đầu vào có một kiểu, một kích thước tối đa, và một quy tắc cho các ký tự điều khiển.
2. Server kiểm tra lại mọi giới hạn. Một phép kiểm tra chỉ trong trình duyệt là FAIL.
3. Demo có ít nhất một ví dụ cho mỗi lớp đầu ra.
4. Lời gọi mô hình có một timeout, và lỗi timeout có một gợi ý cho người dùng.

Phản hồi

5. Điều khiển gửi bị vô hiệu hóa khi một yêu cầu chạy.
6. Trang cho thấy mô hình đang hoạt động, bằng thời gian đã trôi qua hoặc một hiển thị tiến độ.
7. Một câu trả lời văn bản đến dưới dạng một stream, và trang hiển thị thời gian đến token đầu tiên.
8. Một thất bại sau khi stream bắt đầu đến được người dùng dưới dạng một sự kiện lỗi. Một lần dừng im lặng là FAIL.

Các lỗi

9. Mọi phản hồi lỗi có một mã ổn định, một thông điệp với các con số liên quan, một gợi ý với một hành động, và một id yêu cầu.
10. Không phản hồi lỗi nào chứa một stack trace, một đường dẫn tệp, hoặc một bí mật.

Liên kết công khai

11. Một giới hạn tốc độ theo client tồn tại. Một yêu cầu bị từ chối nhận trạng thái 429 và một header `Retry-After`.
12. Khóa giới hạn tốc độ đúng đằng sau một proxy. Một client không thể chọn khóa riêng của nó.
13. Một mức trần sử dụng hoặc một giới hạn chi tiêu tồn tại cho toàn bộ demo, cho tất cả các client cùng nhau.
14. Truy cập cần một token, một mật khẩu, hoặc đăng nhập, trừ khi chủ sở hữu muốn demo mở cho bất kỳ ai.
15. Giới hạn tốc độ và mức trần cũng áp dụng cho các endpoint API mà framework tạo ra.
16. Trang viết đầu ra mô hình dưới dạng văn bản, không bao giờ dưới dạng HTML. Server gửi một header `Content-Security-Policy`.

Quyền riêng tư

17. Các log không giữ văn bản đầu vào, không URL đầy đủ có một chuỗi truy vấn, và không địa chỉ client thô.
18. Mỗi tính năng lưu đầu vào, như flagging, lịch sử, hoặc analytics, đều tắt, hoặc trang cho người dùng biết về nó.
19. Trang cho người dùng biết server giữ gì.

Các dấu hiệu sản phẩm

20. Báo cáo mỗi dấu hiệu sau đang có:
    - Những người ngoài nhóm dùng demo mỗi tuần.
    - Ai đó yêu cầu một mục tiêu uptime.
    - Người dùng yêu cầu các tài khoản, kết quả đã lưu, hoặc lịch sử.
    - Chi phí mô hình là một dòng trong một ngân sách.
    - Đầu vào bao gồm dữ liệu mà một hợp đồng hoặc một luật điều chỉnh.

Tạo:

1. Một bảng với số mục, dấu đánh giá, và bằng chứng.
2. Một danh sách các cách sửa cho mỗi FAIL, theo thứ tự rủi ro. Đặt các mục liên kết công khai và quyền riêng tư trước, rồi các lỗi, rồi hợp đồng, rồi phản hồi. Mỗi cách sửa nêu tệp, thiết lập, hoặc thay đổi mã.
3. Một danh sách các dấu hiệu sản phẩm đang có. Nếu có một hoặc nhiều dấu hiệu, khuyến nghị chuyển sang một stack production. Stack đó có xác thực thực sự, tracing, và theo dõi chi phí theo người dùng.
4. Một kết luận trong một dòng: sẵn sàng chia sẻ, sẵn sàng sau các cách sửa được liệt kê, hoặc chuyển sang stack production trước.

Các điều kiện từ chối cứng. Không đánh dấu demo sẵn sàng chia sẻ khi bất kỳ điều nào sau đây đúng:

- Server không kiểm tra kích thước đầu vào.
- Một liên kết mà bất kỳ ai có thể mở không có giới hạn tốc độ hoặc không có mức trần sử dụng.
- Các log hoặc một tính năng framework lưu văn bản đầu vào, và trang không cho người dùng biết.

Quy tắc từ chối:

- Nếu không biết đối tượng người dùng, coi liên kết là mở cho bất kỳ ai.
- Nếu không biết chi phí của một lời gọi mô hình, yêu cầu một mức trần sử dụng trước một liên kết công khai.
- Nếu demo chạy trên một framework, kiểm tra các mặc định của nó cho flagging, các liên kết chia sẻ, và các endpoint API tự động. Không giả định rằng các mặc định an toàn cho một liên kết công khai.
