---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Với một trường hợp sử dụng (KB lĩnh vực, ngôn ngữ, khối lượng, ngân sách độ trễ), xuất ra:

1. Cơ sở tri thức. Wikidata / Wikipedia / KB tùy chỉnh. Ngày phiên bản. Nhịp làm mới.
2. Bộ sinh ứng viên. Chỉ mục bí danh, embedding hoặc lai. Recall lần nhắc mục tiêu @ K.
3. Bộ phân giải nhập nhằng. Tiên nghiệm + ngữ cảnh, dựa trên embedding, sinh hoặc được prompt bằng LLM.
4. Chiến lược NIL. Ngưỡng trên điểm đầu, bộ phân loại hoặc ứng viên NIL tường minh.
5. Đánh giá. Recall lần nhắc @ 30, accuracy top-1, F1 phát hiện NIL trên tập được giữ lại.

Từ chối bất kỳ pipeline EL nào không có baseline recall lần nhắc (bạn không thể đánh giá một bộ phân giải nhập nhằng khi không biết sinh ứng viên đã đưa đúng thực thể lên). Từ chối bất kỳ pipeline nào dùng EL được prompt bằng LLM mà không có đầu ra bị ràng buộc vào các id KB hợp lệ. Đánh dấu các hệ thống mà thiên lệch độ phổ biến ảnh hưởng các thực thể thiểu số (ví dụ trùng tên) không có fine-tuning lĩnh vực.
