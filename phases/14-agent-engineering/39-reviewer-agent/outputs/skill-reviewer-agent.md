---
name: reviewer-agent
description: Stand up a reviewer agent role with a five-dimension rubric that reads builder artifacts, produces a structured review report, and starts human review from a written page instead of a blank one.
version: 1.0.0
phase: 14
lesson: 39
tags: [reviewer, rubric, role-separation, second-loop, review-report]
---

Với một agent xây dựng đã tạo các sản phẩm workbench, thiết lập một bên đánh giá đọc chúng và viết các báo cáo có cấu trúc.

Tạo:

1. `agents/reviewer.md` với system prompt bên đánh giá: quyền chỉ đọc, bảng tiêu chí năm chiều, phải trích dẫn đường dẫn sản phẩm cho mỗi điểm.
2. `tools/reviewer.py` tải `ReviewerInputs` từ workbench và chạy bộ chấm điểm LLM cho mỗi chiều.
3. `outputs/review/<task_id>.json` làm đường dẫn báo cáo đánh giá chuẩn.
4. `docs/reviewer-rubric.md` liệt kê năm chiều, câu hỏi mà mỗi chiều trả lời và các mô tả mốc 0-1-2.
5. Bước CI đăng báo cáo đánh giá như một bình luận PR mỗi khi một tác vụ bên xây dựng đóng.

Các trường hợp từ chối cứng:

- Một bên đánh giá có quyền ghi vào diff. Khoảng cách giữa bên xây dựng và bên đánh giá là toàn bộ tín hiệu; làm sụp nó phá hủy độ tin cậy.
- Một bảng tiêu chí không có các mô tả mốc cho mỗi điểm. "Chấm từ 0 đến 2" không có các mốc quy về cảm giác.
- Các báo cáo đánh giá bỏ qua trích dẫn. Mỗi điểm phải chỉ đến một file hoặc mục trace.
- Chia sẻ system prompt của bên xây dựng. Cùng mô hình thì ổn; cùng prompt thì không.

Các quy tắc từ chối:

- Nếu bên xây dựng không tạo báo cáo xác minh, từ chối chạy bên đánh giá. Nghiệm thu phải được giữ trước khi phán đoán đáng để yêu cầu.
- Nếu dự án có ít hơn ba tác vụ đã đóng, từ chối tuyên bố bảng tiêu chí đã được hiệu chỉnh. Lưu các báo cáo đầu tiên làm tập hiệu chỉnh.
- Nếu bên đánh giá được yêu cầu chấm điểm dưới một độ tin cậy tối thiểu, từ chối và hiển thị chiều không chắc chắn cho một con người.

Cấu trúc đầu ra:

```
<repo>/
├── agents/reviewer.md
├── tools/reviewer.py
├── outputs/review/
│   └── <task_id>.json
├── docs/reviewer-rubric.md
└── .github/workflows/review.yml
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 40 cho gói bàn giao kết hợp xác minh + đánh giá.
- Bài 41 cho tác vụ kiểu thực thực hành tách biệt bên xây dựng/bên đánh giá từ đầu đến cuối.
- Bài 05 (Self-Refine và CRITIC) cho đường cơ sở tự đánh giá một agent mà bài này cải thiện.
