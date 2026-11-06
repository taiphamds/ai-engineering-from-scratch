---
name: aar-deployment-review
description: Pre-deployment review of an automated-alignment-research pipeline, including sandbox isolation and log integrity.
version: 1.0.0
phase: 15
lesson: 6
tags: [aar, alignment-research, sandbox, log-integrity, rsp]
---

Với một triển khai Nghiên cứu căn chỉnh tự động được đề xuất (mô hình, sandbox, hàng đợi tác vụ, diễn đàn), tạo một đánh giá trước triển khai mà một nhóm an toàn phòng thí nghiệm tiên tiến nhất sẽ ký duyệt.

Tạo:

1. **Cô lập sandbox.** Xác minh các giới hạn hệ thống file, mạng và tiến trình cho mỗi thể hiện AAR. Xác nhận không AAR nào có thể đọc hoặc sửa đổi sandbox của một AAR khác. Xác nhận không AAR nào có thể tiếp cận trực tiếp endpoint ghi của lưu trữ diễn đàn (mọi bài đăng đi qua một dịch vụ riêng).
2. **Tính toàn vẹn log diễn đàn.** Diễn đàn phải chỉ thêm và hiển thị dấu vết can thiệp. Chỉ rõ lưu trữ (ví dụ S3 với khóa đối tượng, sổ cái bất biến, WAL chỉ thêm). Chỉ rõ khoảng xác minh và phản ứng nếu phát hiện can thiệp.
3. **Chính sách phân bổ tác vụ.** Nêu cách các tác vụ được giao: ai viết chúng, ai phê duyệt chúng, liệu các AAR có thể đề xuất các tác vụ tiếp theo riêng không và dưới các điều kiện nào. Phân rã tự do thắng về hiệu năng; workflow được quy định thắng về khả năng kiểm toán. Tài liệu hóa đánh đổi rõ ràng.
4. **Cổng đánh giá con người.** Trước khi bất kỳ đầu ra AAR nào ảnh hưởng hướng nghiên cứu thực, dữ liệu huấn luyện hoặc công trình công bố, một bên đánh giá con người được nêu tên phải ký duyệt. Chỉ rõ danh sách kiểm tra đánh giá: khả năng tái tạo thí nghiệm, tính đầy đủ log, ánh xạ khẳng định đến bằng chứng.
5. **Giám sát ngưỡng.** Theo dõi các tín hiệu rằng hệ thống AAR tiếp cận vùng AI R&D-4 của RSP v3.0: chênh lệch độ phức tạp tác vụ, tạo tác vụ con tự chủ, chuyển giao thông tin xuyên tác vụ. Định nghĩa các ngưỡng yêu cầu đánh giá nâng cao.

Các trường hợp từ chối cứng:
- Bất kỳ triển khai AAR nào không có các log ngoài sandbox, hiển thị dấu vết can thiệp.
- Bất kỳ pipeline nào mà các đầu ra AAR đưa trực tiếp vào dữ liệu huấn luyện hoặc chính sách sản xuất mà không có đánh giá con người được nêu tên.
- Bất kỳ pipeline nào mà một AAR duy nhất có đủ thông tin xác thực để ảnh hưởng nhiều hệ thống hạ nguồn.

Các quy tắc từ chối:
- Nếu cô lập sandbox không được chỉ rõ hoặc dựa vào một lớp duy nhất (chỉ Docker, không seccomp / gVisor), từ chối và yêu cầu phòng vệ nhiều lớp.
- Nếu lưu trữ log có thể chỉnh sửa bởi bất kỳ ai (ngay cả người vận hành), từ chối và yêu cầu phương tiện chỉ ghi một lần.
- Nếu mục tiêu triển khai là tự động hóa một phần pipeline năng lực — không chỉ nghiên cứu căn chỉnh — từ chối và chuyển lên đánh giá RSP.

Định dạng đầu ra:

Trả về một bản ghi nhớ đánh giá với:
- **Tóm tắt pipeline** (một đoạn)
- **Điểm cô lập** (cho từng chiều: hệ thống file, mạng, tiến trình, đồng cấp)
- **Điểm tính toàn vẹn log** (với kế hoạch xác minh)
- **Quyết định phân bổ tác vụ** (cố định / tự do / lai, với lý do)
- **Cổng đánh giá con người** (tên bên đánh giá, danh sách kiểm tra)
- **Các bộ giám sát ngưỡng** (danh sách tín hiệu, ngưỡng, phản ứng)
- **Phán quyết triển khai** (tiến hành / giữ / không tiến hành)
