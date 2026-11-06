---
name: crew-or-flow
description: Pick CrewAI Crew or Flow for a given task, and scaffold the minimal implementation.
version: 1.0.0
phase: 14
lesson: 15
tags: [crewai, crews, flows, multi-agent, role-based]
---

Với một mô tả tác vụ, chọn Crew (tự chủ) hoặc Flow (mang tính xác định), rồi tạo khung.

Quyết định:

1. Tác vụ có các yêu cầu SLA, tuân thủ hoặc phát lại mang tính xác định không? -> Flow.
2. Tác vụ có tính khám phá không (nghiên cứu, bản nháp đầu tiên, động não)? -> Crew.
3. Tác vụ có 4+ chuyên gia với thứ tự do LLM chọn không? -> Hierarchical Crew.
4. Tác vụ có <=3 chuyên gia theo một thứ tự cố định không? -> Sequential Crew hoặc Flow — ưu tiên Flow.

Với Crews, tạo:

1. Các định nghĩa Agent: vai trò, mục tiêu, bối cảnh (chặt chẽ, <=200 từ), công cụ.
2. Các định nghĩa Task: description, expected_output, agent.
3. Crew với Process đúng (Sequential | Hierarchical).
4. Một bộ kiểm thử chạy Crew trên các đầu vào mẫu và kiểm tra rằng các expected_outputs được tạo ra.

Với Flows, tạo:

1. Hàm điểm vào `@start`.
2. Các bước `@listen(topic)` tạo thành một DAG.
3. Các topic sự kiện tường minh; không quảng bá kỳ diệu.
4. Một bộ phát lại: với một payload khởi chạy cho trước, chạy lại mang tính xác định.

Các trường hợp từ chối cứng:

- Các Crew không có bối cảnh. Các bối cảnh là trụ cột.
- Các Flow không có tên topic tường minh. "Nối chuỗi ngầm định" đánh bại mục đích kiểm toán.
- Các Hierarchical Crew với 2 chuyên gia. Chi phí phụ bộ quản lý không xứng đáng.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu một Crew trên một tác vụ tuân thủ chỉ dành cho sản xuất, từ chối và chuyển sang Flow.
- Nếu người dùng yêu cầu một Flow trên một tác vụ nghiên cứu mở, từ chối và chuyển sang Crew.
- Nếu bối cảnh vượt quá 200 từ, từ chối và yêu cầu cắt gọn. Ngân sách ngữ cảnh là hữu hạn.

Đầu ra: `agents.py`, `tasks.py`, `crew.py` hoặc `flow.py`, cộng `README.md` với lý do quyết định. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 24 (Langfuse/AgentOps) cho khả năng quan sát, hoặc Bài 13 nếu Flow cần ngữ nghĩa tiếp tục bền vững.
