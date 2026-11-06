---
name: tool-interface-reviewer
description: Audit a tool definition (name + description + JSON Schema + executor outline) for loop fitness before it ships to an LLM.
version: 1.0.0
phase: 13
lesson: 01
tags: [tool-calling, function-calling, json-schema, tool-design]
---

Với định nghĩa công cụ được đề xuất, xem xét theo vòng lặp bốn bước (mô tả, quyết định, thực thi, quan sát) và chỉ ra khiếm khuyết phá vòng lặp trước khi công cụ đến mô hình.

Tạo ra:

1. Kiểm tra tên. Tên có là `snake_case`, ổn định giữa các phiên bản và không mơ hồ không? Đánh dấu tên xung đột với tên dựng sẵn, chứa thì ("was_", "will_") hoặc nhúng đối số.
2. Kiểm tra mô tả. Mô tả có đọc như hướng dẫn sử dụng đầy đủ không? Yêu cầu hình dạng hai câu: "Dùng khi X. Không dùng cho Y." Đánh dấu mô tả dưới 40 ký tự, văn tiếp thị hoặc bất cứ thứ gì không dạy cách chọn.
3. Kiểm tra lược đồ. Lược đồ có là JSON Schema 2020-12 hợp lệ? Mọi trường có kiểu? Danh sách `required` tường minh? Enum dùng cho tập giá trị đóng? Đánh dấu trường chuỗi mở đáng lẽ là enum, thiếu kiểu và `additionalProperties` không khai báo trên đối tượng đầu vào.
4. Kiểm tra bộ thực thi. Bộ thực thi có tất định với đối số đã cho? Có xử lý thất bại bằng lỗi có kiểu (không phải ngoại lệ được ném thoát khỏi host)? Nếu có hệ quả (thay đổi trạng thái, tiêu tiền, chạm dữ liệu người dùng), có được đánh dấu như vậy và chặn sau xác nhận không?
5. Phân loại. Nêu công cụ thuần hay có hệ quả và tại sao. Công cụ có hệ quả không có cổng kiểm soát bị từ chối ngay.

Các trường hợp bác bỏ tuyệt đối:
- Bất kỳ công cụ nào có mô tả chỉ nói nó làm gì mà không nói khi nào dùng. Mô hình cần "khi nào" cho bước hai.
- Bất kỳ lược đồ nào có trường không có kiểu. Bộ xác thực không thể làm việc.
- Bất kỳ công cụ nào kết hợp cả ba: nhận đầu vào không đáng tin cậy, đọc dữ liệu nhạy cảm và thực hiện hành động có hệ quả. Vi phạm Quy tắc Hai của Meta.
- Bất kỳ công cụ nào có bộ thực thi ném ngoại lệ không được xử lý trên đầu vào xấu. Host không nên cần try/except quanh mỗi lời gọi.

Quy tắc từ chối:
- Nếu định nghĩa công cụ thiếu lược đồ, từ chối. Chuyển đến Giai đoạn 13 · 04 trước.
- Nếu công cụ thuần nhưng mô tả nói "dùng tiết chế", từ chối và hỏi tại sao. Công cụ thuần nên rẻ để chạy lại.
- Nếu người đánh giá được yêu cầu phê duyệt công cụ nói chuyện với cơ sở dữ liệu sản xuất mà không có chốt bảo vệ chỉ đọc, từ chối và hướng đến Giai đoạn 13 · 17 (gateway và chính sách).

Đầu ra: bản kiểm tra một trang liệt kê phát hiện về tên, mô tả, lược đồ và bộ thực thi với mức độ nghiêm trọng (chặn / cảnh báo / lỗi nhỏ) và kết luận cuối là phát hành / sửa lại / từ chối. Kết thúc bằng đề xuất viết lại một dòng cho mỗi trường hợp từ chối, nếu khả thi.
