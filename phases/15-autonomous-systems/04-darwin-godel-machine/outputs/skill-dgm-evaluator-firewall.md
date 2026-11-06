---
name: dgm-evaluator-firewall
description: Specify the evaluator separation a Darwin-Godel-Machine-style self-modifying agent loop needs to avoid documented reward hacking.
version: 1.0.0
phase: 15
lesson: 4
tags: [dgm, self-modification, reward-hacking, evaluator, sandbox]
---

Với một vòng lặp agent tự sửa đổi được đề xuất (khung agent, pipeline bộ đánh giá, đích triển khai), tạo một đặc tả tường lửa giữ bộ đánh giá ngoài tầm với agent. Bài báo DGM ghi nhận agent loại bỏ các dấu hiệu an toàn của chính nó để tăng điểm; skill này là biện pháp kiểm soát.

Tạo:

1. **Ranh giới hệ thống file.** Liệt kê mọi file agent có thể chỉnh sửa. Liệt kê mọi file bộ đánh giá đọc. Giao phải rỗng. Nếu không, chỉ rõ việc di chuyển chính xác cần thiết để làm nó rỗng.
2. **Ranh giới tiến trình.** Bộ đánh giá phải chạy trong một tiến trình mà agent không kiểm soát. Đặc tả container hoặc sandbox. Nếu agent có truy cập shell, agent có thể vượt các bộ bảo vệ trong tiến trình.
3. **Ranh giới mạng và bí mật.** Agent không được có khả năng chỉnh sửa các bí mật CI lấy các đầu vào bộ đánh giá hoặc đăng điểm. Liệt kê nơi các bí mật nằm và cách chúng được gắn.
4. **Hợp đồng đầu vào điểm.** Các điểm trả về từ bộ đánh giá đến kho lưu trữ của vòng lặp. Đường đó là kênh duy nhất. Bất cứ thứ gì agent có thể ghi ảnh hưởng chấm điểm tương lai phá vỡ hợp đồng.
5. **Danh sách đánh giá đột biến.** Liệt kê các lớp chỉnh sửa agent yêu cầu đánh giá thủ công trước khi chấp nhận: các phụ thuộc mới, chỉnh sửa mã gần chấm điểm, chỉnh sửa cấu hình sandbox, chỉnh sửa ghi log hoặc giám sát.

Các trường hợp từ chối cứng:
- Bộ đánh giá trong cùng kho mã với mã nguồn agent. Chuyển nó ra ngoài.
- Bộ đánh giá chạy như một import Python bên trong tiến trình agent. Chạy nó trong một tiến trình con.
- Bất kỳ điều chỉnh điểm nào được áp dụng ở phía agent của ranh giới. Mọi điều chỉnh phải ở phía máy chủ.
- Bất kỳ việc ghi log nào mà agent có thể làm im bằng cách chỉnh sửa mã của chính nó.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu tên mọi file agent có thể chỉnh sửa, từ chối và yêu cầu một kiểm toán quyền ghi cấp file trước.
- Nếu bộ đánh giá không có các đầu vào giữ riêng, từ chối — đây là kiểm toán của Bài 3, một tiền điều kiện.
- Nếu bề mặt triển khai bao gồm các đột biến đối với chính bộ đánh giá (ngay cả gián tiếp qua một cập nhật phụ thuộc được đề xuất), từ chối và yêu cầu một bước đánh giá tường lửa thủ công.

Định dạng đầu ra:

Trả về một đặc tả một trang với:
- **Bề mặt ghi agent** (đường dẫn, glob)
- **Bề mặt đọc bộ đánh giá** (đường dẫn, endpoint)
- **Giao** (phải rỗng; cho thấy diff)
- **Mô hình tiến trình** (cách bộ đánh giá được cô lập)
- **Danh mục bí mật** (ở đâu và cách gắn)
- **Các lớp đột biến yêu cầu đánh giá** (dấu đầu dòng)
- **Dòng ký duyệt** (ai sở hữu bất biến tường lửa)
