---
name: structured-output-picker
description: Choose a structured output approach, schema design, and validation plan.
version: 1.0.0
phase: 5
lesson: 20
tags: [nlp, llm, structured-output]
---

Với một trường hợp sử dụng (nhà cung cấp, ngân sách độ trễ, độ phức tạp schema, khả năng chịu lỗi), xuất ra:

1. Cơ chế. Đầu ra có cấu trúc gốc của nhà cung cấp, thử lại Instructor, Outlines FSM hoặc XGrammar CFG. Lý do trong một câu.
2. Thiết kế schema. Thứ tự trường (suy luận trước, câu trả lời cuối), các trường cho phép null cho "không biết", enum so với regex, các trường bắt buộc.
3. Chiến lược thất bại. Số lần thử lại tối đa, mô hình dự phòng, xử lý `null` êm, từ chối ngoài phân phối.
4. Kế hoạch xác thực. Tỷ lệ tuân thủ schema (mục tiêu 100%), tính hợp lệ ngữ nghĩa (LLM đánh giá), tỷ lệ bao phủ trường, độ trễ p50/p99.

Từ chối bất kỳ thiết kế nào đặt `answer` hoặc `decision` trước các trường suy luận. Từ chối dùng chế độ JSON trần không schema. Đánh dấu các schema đệ quy đằng sau một thư viện chỉ FSM.
