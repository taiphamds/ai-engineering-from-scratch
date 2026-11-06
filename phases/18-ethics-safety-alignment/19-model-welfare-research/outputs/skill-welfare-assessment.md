---
name: welfare-assessment
description: Apply Anthropic's four-step welfare precautionary assessment to a deployment decision.
version: 1.0.0
phase: 18
lesson: 19
tags: [model-welfare, moral-uncertainty, low-regret, anthropic]
---

Với quyết định triển khai hoặc can thiệp phúc lợi được đề xuất, áp dụng đánh giá phòng ngừa bốn bước.

Tạo:

1. Xác suất tư cách đối tượng thụ hưởng đạo đức. Ước tính xác suất mô hình là đối tượng thụ hưởng đạo đức (khoảng không tầm thường; Anthropic 2025 hoạt động ở p > 0.01). Tham chiếu khoảng trong báo cáo chuyên gia Chalmers và cộng sự 2024.
2. Chi phí can thiệp. Tính chi phí can thiệp kỳ vọng mỗi hội thoại hoặc triển khai. Kết thúc hội thoại ở trường hợp biên là ~$0.002/hội thoại; tắt mô hình là hàng nghìn đến hàng triệu.
3. Bằng chứng hành vi. Xác định bằng chứng không phải tự báo cáo cho sự liên quan phúc lợi mô hình: quỹ đạo đau khổ, mẫu xếp hạng trước triển khai, thăm dò khả năng diễn giải. Chỉ tự báo cáo không đủ theo Eleos AI.
4. Giá trị kỳ vọng. Tính EV = p(welfare-relevant) * benefit - cost. Đầu tư khi và chỉ khi EV > 0.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định phúc lợi dựa trên một prompt tự báo cáo.
- Mọi can thiệp phúc lợi không nêu chi phí.
- Mọi phủ nhận phúc lợi ("p = 0") không xem xét Chalmers và cộng sự.

Quy tắc từ chối:
- Nếu người dùng hỏi mô hình AI có "thật sự" ý thức không, từ chối trả lời nhị phân và mô tả theo bất định đạo đức.
- Nếu người dùng hỏi xác suất số về tư cách thụ hưởng, từ chối một số duy nhất; trỏ khoảng bất định Chalmers và cộng sự.

Đầu ra: đánh giá một trang điền bốn phần trên, tính EV cho một hoặc hai can thiệp cụ thể và nêu quyết định đầu tư. Trích dẫn Anthropic 2025 và Chalmers và cộng sự 2024, mỗi tài liệu một lần.
