---
name: skill-structured-outputs
description: Decision framework for choosing the right structured output strategy based on provider, reliability, and complexity
version: 1.0.0
phase: 11
lesson: 03
tags: [structured-output, json, schema, constrained-decoding, pydantic, function-calling]
---

# Structured Output Strategy

Khi xây dựng một ứng dụng LLM cần dữ liệu có cấu trúc, áp dụng khung quyết định này.

## When to use each approach

**Dựa trên prompt ("Trả về JSON"):** Chỉ tạo mẫu. Chấp nhận được cho công cụ nội bộ nơi thỉnh thoảng phân tích cú pháp thất bại có thể chịu được. Thêm try/except với thử lại. Không bao giờ dùng trong pipeline sản xuất.

**Chế độ JSON (cờ API):** Bạn cần JSON hợp lệ được bảo đảm nhưng schema đơn giản hoặc linh hoạt. Hoạt động khi bạn xác thực hình dạng ở phía ứng dụng. Có sẵn: OpenAI, Anthropic (qua tool use), Google.

**Chế độ schema (constrained decoding):** Hệ thống sản xuất mà mọi đầu ra phải khớp một schema cụ thể. Không thất bại phân tích cú pháp. Không vi phạm schema. Dùng mặc định cho bất kỳ tác vụ trích xuất hay phân loại sản xuất nào. Có sẵn: structured outputs của OpenAI, Outlines, Guidance.

**Function calling / tool use:** Mô hình cần chọn hàm nào để gọi, không chỉ điền tham số. Bạn có nhiều schema và mô hình chọn schema phù hợp. Cũng dùng khi tích hợp với hạ tầng công cụ/hàm hiện có.

**Thư viện Instructor:** Bạn muốn xác thực Pydantic với tự động thử lại trên mọi nhà cung cấp. DX tốt nhất cho dự án Python. Bọc OpenAI, Anthropic, Google và các mô hình mã nguồn mở.

## Provider-specific guidance

**OpenAI:** Dùng `response_format` với kiểu `json_schema`. Constrained decoding được tích hợp. Các mô hình Pydantic hoạt động trực tiếp. Triển khai đầu ra có cấu trúc đáng tin cậy nhất.

**Anthropic:** Dùng tool use cho đầu ra có cấu trúc. Định nghĩa một công cụ duy nhất với schema mong muốn. Mô hình trả về đối số lệnh gọi công cụ khớp schema. Đáng tin cậy nhưng cần mẫu API tool use.

**Các mô hình mã nguồn mở (vLLM, Ollama):** Dùng Outlines hoặc Guidance cho constrained decoding. Các thư viện này biên dịch JSON Schema thành máy trạng thái hữu hạn che token không hợp lệ trong lúc sinh. Cần chạy suy luận cục bộ.

## Schema design guidelines

1. Giữ schema phẳng khi có thể. Đối tượng lồng hơn 2 mức tăng lỗi trích xuất.
2. Dùng enum cho trường phân loại. Không dựa vào việc mô hình tự tạo chuỗi đúng.
3. Đặt trường mơ hồ là bắt buộc với hỗ trợ null rõ ràng thay vì tùy chọn. Buộc mô hình đưa ra quyết định.
4. Thêm mô tả vào thuộc tính schema. Mô hình đọc chúng như chỉ dẫn.
5. Tránh kiểu hợp (oneOf/anyOf) trừ khi cần thiết. Chúng tăng độ phức tạp giải mã.
6. Đặt minimum/maximum trên số. Bắt các giá trị cực đoan bị ảo giác.
7. Dùng minItems/maxItems trên mảng để ngăn đầu ra rỗng hoặc không giới hạn.

## Common failure patterns and fixes

- **Mô hình bọc JSON trong hàng rào markdown**: chuyển từ dựa trên prompt sang chế độ JSON hoặc chế độ schema
- **Hợp lệ schema nhưng sai sự kiện**: thêm bước xác thực LLM-as-judge sau trích xuất
- **Giá trị enum không nhất quán**: chuyển sang constrained decoding hoặc thêm chuẩn hóa hậu xử lý
- **Thiếu trường tùy chọn**: đặt chúng là bắt buộc hoặc thêm giá trị mặc định trong mã ứng dụng
- **Trích xuất rất chậm**: constrained decoding thêm 5-15% độ trễ, giảm độ phức tạp schema nếu nhạy độ trễ
- **Mảng lớn với phần tử đa dạng**: chia đầu vào thành chunk và trích xuất theo từng chunk, rồi gộp kết quả

## Reliability ladder

| Cách tiếp cận | Thành công phân tích cú pháp | Khớp schema | Công sức thiết lập |
|----------|-------------|-------------|-------------|
| Dựa trên prompt | ~90% | ~80% | 1 phút |
| Chế độ JSON | 100% | ~90% | 5 phút |
| Chế độ schema | 100% | ~99% | 15 phút |
| Constrained decoding | 100% | 100% | 30 phút |
| Instructor + thử lại | 100% | ~99.5% | 10 phút |
