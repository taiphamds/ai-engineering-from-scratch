---
name: dst-designer
description: Design a dialogue state tracker — schema, extractor, update policy, evaluation.
version: 1.0.0
phase: 5
lesson: 29
tags: [nlp, dialogue, task-oriented]
---

Với một trường hợp sử dụng (miền, ngôn ngữ, độ mở từ vựng, nhu cầu tuân thủ), xuất ra:

1. Schema. Danh sách miền, các slot theo miền, từ vựng mở so với đóng theo slot.
2. Bộ trích xuất. Dựa trên quy tắc / seq2seq / LLM-với-Pydantic. Lý do.
3. Chính sách cập nhật. Sinh lại toàn trạng thái / tăng dần; xử lý sửa đổi; xử lý phủ định.
4. Đánh giá. Joint Goal Accuracy trên một tập hội thoại được giữ lại, precision/recall cấp slot, nhầm lẫn trên slot khó nhất.
5. Luồng xác nhận. Khi nào cần yêu cầu rõ ràng người dùng xác nhận (các hành động phá hủy, các trích xuất độ tin cậy thấp).

Từ chối DST chỉ LLM cho các slot nhạy cảm tuân thủ mà không có một kiểm tra thứ cấp dựa trên quy tắc. Từ chối bất kỳ DST nào không thể hoàn tác một slot khi người dùng sửa đổi. Đánh dấu các schema không có thẻ phiên bản.
