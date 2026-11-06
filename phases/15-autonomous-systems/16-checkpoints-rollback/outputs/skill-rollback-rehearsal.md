---
name: rollback-rehearsal
description: Design a rollback-rehearsal test for a proposed autonomous workflow and audit the checkpoint backend for audit-trail persistence.
version: 1.0.0
phase: 15
lesson: 16
tags: [checkpointing, rollback, idempotency, eu-ai-act-article-14, durable-execution]
---

Với một quy trình tự chủ có tầm thời gian dài được đề xuất, thiết kế một kiểm thử diễn tập hoàn tác chứng minh ngăn xếp tính lũy đẳng + tiền điều kiện + xác minh + hoàn tác thực sự hoạt động đầu cuối, và kiểm toán backend checkpoint về mức sẵn sàng cho cơ quan quản lý.

Tạo ra:

1. **Script diễn tập.** Kiểm thử cụ thể (a) bắt đầu quy trình, (b) làm nó gặp sự cố giữa cam kết, (c) tiếp tục, (d) khẳng định hành động kích hoạt đúng một lần, (e) chèn một lỗi xác minh, (f) khẳng định hoàn tác kích hoạt và trạng thái được khôi phục. Không quy trình sản xuất nào nên chạy khi kiểm thử này chưa vượt qua ít nhất một lần.
2. **Kiểm toán tính lũy đẳng.** Xác nhận khóa lũy đẳng được suy ra từ nội dung đề xuất (Bài 15) và logic cam kết sử dụng các trạng thái thực thi tường minh (`pending` -> `executing` -> `committed`/`failed`). Giữ chỗ/khóa bằng khóa lũy đẳng trước tác dụng phụ, và chỉ đánh dấu `committed` sau khi tác dụng phụ đã được xác minh.
3. **Danh mục tiền điều kiện.** Liệt kê mọi tiền điều kiện quy trình phải kiểm tra lại tại thời điểm cam kết. Khoảng cách giữa thời điểm kiểm tra và thời điểm sử dụng là lỗi sản xuất phổ biến nhất; tiền điều kiện phải được đánh giá tại cam kết, không phải tại đề xuất.
4. **Danh mục xác minh.** Với mọi hành động có hệ quả, nêu lần đọc cụ thể xác nhận tác dụng phụ đã xảy ra. “Trả về 200” là không thể chấp nhận.
5. **Danh mục hoàn tác.** Với mọi hành động có hệ quả, phân loại hoàn tác là trong băng, giao dịch bù trừ, hoặc cảnh báo ngoài băng. Các hoàn tác không làm gì (“chúng tôi không thể đảo ngược điều này”) phải được nêu tường minh trong đề xuất (siêu dữ liệu Bài 15).

Các trường hợp loại bỏ dứt khoát:
- Các quy trình không có hoàn tác đã diễn tập.
- Các backend checkpoint mất dữ liệu khi triển khai.
- Các đường cam kết mà trạng thái được ghi sau thực thi, không phải trước.
- Các trạng thái “Đã xác minh” chỉ kiểm tra mã trả về của lệnh gọi công cụ.
- Các kiểm tra tiền điều kiện chỉ chạy tại thời điểm đề xuất, không phải thời điểm cam kết.

Các quy tắc từ chối:
- Nếu người dùng chưa chạy script diễn tập ít nhất một lần trong staging, hãy từ chối triển khai sản xuất.
- Nếu người dùng không thể cung cấp lược đồ kho lưu trữ checkpoint, hãy từ chối và yêu cầu tài liệu lược đồ trước. Các cơ quan quản lý muốn trạng thái có thể truy vấn.
- Nếu quy trình phụ thuộc vào một checkpoint trong bộ nhớ (không có lưu bền vững), hãy từ chối.

Định dạng đầu ra:

Trả về một kế hoạch diễn tập với:
- **Dàn ý script kiểm thử** (các bước với các khẳng định)
- **Bảng tính lũy đẳng** (thành phần khóa, thứ tự ghi trạng thái)
- **Bảng tiền điều kiện** (kiểm tra, khi nào được đánh giá, hệ quả)
- **Bảng xác minh** (hành động, lần đọc xác nhận)
- **Bảng hoàn tác** (hành động, loại, trạng thái đích)
- **Chứng thực backend** (kho lưu trữ, tồn tại qua triển khai có/không, sẵn sàng truy vấn có/không)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
