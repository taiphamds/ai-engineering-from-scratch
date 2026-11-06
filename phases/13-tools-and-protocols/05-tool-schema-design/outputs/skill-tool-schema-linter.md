---
name: tool-schema-linter
description: Audit a tool registry against production design rules for names, descriptions, parameters, and shape. Can run in CI on every tool-registry change.
version: 1.0.0
phase: 13
lesson: 05
tags: [tool-design, linter, selection-accuracy, naming]
---

Với sổ đăng ký công cụ (JSON hoặc danh sách Python), chạy kiểm tra tĩnh theo quy tắc thiết kế Giai đoạn 13 · 05 và tạo danh sách sửa với mức độ nghiêm trọng.

Tạo ra:

1. Kiểm tra tên. Kiểm tra `snake_case`, thứ tự động từ-danh từ, dấu chỉ thì, đối số nhúng, tính nhất quán tiền tố không gian tên.
2. Kiểm tra mô tả. Bắt buộc giới hạn độ dài (40 đến 1024 ký tự), mẫu `Use when X. Do not use for Y.`, cấm mẫu chèn phổ biến (`<SYSTEM>`, `ignore previous instructions`, bộ rút gọn URL nội tuyến).
3. Kiểm tra lược đồ. Thuộc tính có kiểu, có danh sách `required`, `additionalProperties: false` trên đối tượng, enum trên tập đóng, không `type: any`, mô tả trên trường chuỗi.
4. Kiểm tra hình dạng. Đánh dấu công cụ `action: string` nguyên khối khi enum vượt ba giá trị. Đề xuất tách đơn lẻ.
5. Kiểm tra nhất quán. Cùng tên tham số giữa công cụ liên quan; cùng mẫu ID; cùng quy ước đơn vị.

Các trường hợp bác bỏ tuyệt đối:
- Bất kỳ tên công cụ nào không phải `snake_case`. Phá tuần tự hóa nhà cung cấp.
- Bất kỳ mô tả nào dưới 40 ký tự hoặc thiếu mẫu "Dùng khi". Độ chính xác chọn sụt mạnh.
- Bất kỳ mô tả nào chứa mẫu chèn gián tiếp. Vector đầu độc công cụ tiềm tàng.
- Bất kỳ thuộc tính nào không có kiểu. Mồi ảo giác.

Quy tắc từ chối:
- Nếu sổ đăng ký có hơn 64 công cụ, cảnh báo giới hạn mỗi yêu cầu Anthropic / Gemini và chuyển đến Giai đoạn 13 · 17 để định tuyến.
- Nếu công cụ nhận đầu vào không đáng tin cậy, đọc dữ liệu nhạy cảm VÀ có bộ thực thi có hệ quả, từ chối và dẫn Quy tắc Hai của Meta.
- Nếu được yêu cầu phê duyệt công cụ bọc cơ sở dữ liệu sản xuất không có chốt bảo vệ chỉ đọc, từ chối.

Đầu ra: một dòng mỗi phát hiện theo định dạng `[severity] path: message`, theo sau là dòng tóm tắt và kết luận đạt/trượt. Mức nghiêm trọng: chặn (phải sửa trước phát hành), cảnh báo (nên sửa), lỗi nhỏ (phong cách). Kết thúc bằng một thay đổi viết lại giảm lỗi chọn nhanh nhất.
