---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Với một trường hợp sử dụng (kiểm tra độ trung thành, phân loại zero-shot, suy luận cấp tài liệu), xuất ra:

1. Mô hình. Checkpoint NLI được nêu tên. Lý do gắn với lĩnh vực, độ dài, ngôn ngữ.
2. Khuôn (nếu zero-shot). Mẫu diễn đạt bằng lời. Ví dụ.
3. Ngưỡng. Ngưỡng cắt kéo theo cho quy tắc quyết định. Lý do dựa trên hiệu chuẩn.
4. Đánh giá. Accuracy trên tập có nhãn được giữ lại, baseline chỉ giả thuyết, tập con đối kháng.

Từ chối phát hành phân loại zero-shot mà không có kiểm tra hợp lý có nhãn 100 ví dụ. Từ chối dùng một mô hình NLI cấp câu trên các tiền đề dài bằng tài liệu. Đánh dấu bất kỳ khẳng định nào rằng NLI giải quyết ảo giác — nó giảm ảo giác; nó không loại bỏ ảo giác.
