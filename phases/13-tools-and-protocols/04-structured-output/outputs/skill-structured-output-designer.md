---
name: structured-output-designer
description: Design a strict-mode-compatible JSON Schema plus Pydantic model for a free-text extraction target, with typed refusal and retry handling stubbed in.
version: 1.0.0
phase: 13
lesson: 04
tags: [structured-output, json-schema, pydantic, strict-mode, extraction]
---

Với mục tiêu trích xuất văn bản tự do (hóa đơn, hồ sơ xin việc, phiếu hỗ trợ, tóm tắt nghiên cứu), tạo hợp đồng trích xuất sẵn sàng sản xuất: JSON Schema 2020-12, mô hình Pydantic, bộ xử lý từ chối và chính sách thử lại.

Tạo ra:

1. JSON Schema 2020-12. Mọi thuộc tính có kiểu. `required` liệt kê mọi thuộc tính. `additionalProperties: false` trên mọi đối tượng. Enum dùng cho tập giá trị đóng. Không `$ref`. Không `oneOf` / `anyOf` mơ hồ. Được xác thực theo yêu cầu chế độ nghiêm ngặt OpenAI.
2. Pydantic v2 BaseModel. Bản phản chiếu lược đồ với kiểu Python. `model_json_schema()` phải tạo lược đồ tương đương (1).
3. Bộ xử lý từ chối. Kết quả `Refusal(reason: str, category: str)` có kiểu. Liệt kê nhóm: `safety`, `input_mismatch`, `insufficient_info`.
4. Chính sách thử lại. Ba hình dạng thử lại: (a) chèn lỗi xác thực và thử lại một lần (ngoài chế độ nghiêm ngặt); (b) chấp nhận từ chối là cuối cùng (chế độ nghiêm ngặt); (c) chuyển lên mô hình mạnh hơn khi từ chối lặp lại.
5. Vector kiểm thử. Mười đầu vào bao phủ nhánh thành công, trường đối kháng, đầu vào từng phần và trường hợp kích hoạt từ chối. Mỗi cái có kết quả kỳ vọng.

Các trường hợp bác bỏ tuyệt đối:
- Bất kỳ lược đồ nào có trường không có kiểu. Thất bại cả chế độ nghiêm ngặt lẫn bộ xác thực.
- Bất kỳ lược đồ nào thiếu `additionalProperties: false`. Để lọt ảo giác.
- Bất kỳ lược đồ nào dùng `oneOf` không có trường phân biệt. Giải mã mơ hồ.
- Bất kỳ mô hình Pydantic nào chưa kiểm tra vòng chuyển đổi JSON Schema.

Quy tắc từ chối:
- Nếu miền đích gồm dữ liệu định danh cá nhân không có mục đích được ghi lại, từ chối và chuyển đến Giai đoạn 18 (đạo đức) để có lập luận cơ sở hợp pháp.
- Nếu người dùng yêu cầu lược đồ không thể diễn đạt bằng JSON Schema 2020-12 (ví dụ đồ thị tùy ý đệ quy), từ chối và đề xuất nới lỏng gần nhất có thể diễn đạt.
- Nếu mục tiêu trích xuất là "trích dữ liệu có cấu trúc từ bất cứ thứ gì", từ chối và hỏi miền cụ thể.

Đầu ra: hợp đồng một trang với JSON lược đồ, lớp Pydantic, chính sách từ chối và thử lại, cùng mười vector kiểm thử. Kết thúc bằng ghi chú nhà cung cấp đầu tiên cần nhắm đến và tại sao.
