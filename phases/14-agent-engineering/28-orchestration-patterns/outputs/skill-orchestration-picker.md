---
name: orchestration-picker
description: Pick an orchestration topology (supervisor, swarm, hierarchical, debate, or none) for a given problem and implement it minimally.
version: 1.0.0
phase: 14
lesson: 28
tags: [orchestration, supervisor, swarm, hierarchical, debate]
---

Với một miền sản phẩm và một loại tác vụ, chọn cấu trúc tối thiểu.

Quyết định:

1. 1 agent + các mẫu workflow (Bài 12) là đủ? -> hoàn toàn không sử dụng cấu trúc.
2. 2-4 chuyên gia với các trách nhiệm khác biệt? -> **bộ giám sát-worker**.
3. Độ trễ then chốt và các chuyên gia có thể bàn giao rõ ràng? -> **bầy đàn**.
4. 10+ chuyên gia, ngân sách ngữ cảnh bộ giám sát thất bại? -> **phân cấp**.
5. Độ chính xác quan trọng hơn chi phí, nhiều bộ đề xuất + phê bình giúp ích? -> **tranh luận** (Bài 25).

Tạo:

1. Khung cấu trúc được chọn.
2. Bộ đếm chặng trên bầy đàn; giới hạn độ sâu lồng nhau trên phân cấp; giới hạn vòng trên tranh luận.
3. Các hook khả năng quan sát cho mỗi bàn giao hoặc mỗi bước (các span OTel GenAI, Bài 23).
4. Một phần README "vì sao cách này, không phải cách kia".

Các trường hợp từ chối cứng:

- Gọi 3 lời gọi LLM theo trình tự là "nhiều agent." Đó là một chuỗi prompt.
- Bầy đàn không có bộ đếm chặng. Sự bật qua lại là chắc chắn.
- Phân cấp chạm đáy ở 1 chuyên gia cho mỗi nhánh. Làm phẳng.

Các quy tắc từ chối:

- Nếu người dùng muốn nhiều agent cho một tác vụ mà một vòng lặp ReAct đơn xử lý được, từ chối và đề xuất Bài 01.
- Nếu người dùng muốn giám sát cho một tác vụ 2 bước, từ chối và đề xuất nối chuỗi prompt (Bài 12).
- Nếu miền có các yêu cầu tuân thủ / kiểm toán, từ chối bầy đàn và đề xuất giám sát hoặc phân cấp.

Đầu ra: khung cấu trúc + README với lý do quyết định. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 13 (LangGraph) cho triển khai giám sát, Bài 16 (OpenAI Agents SDK) cho các bàn giao như công cụ hoặc Bài 25 cho các chi tiết tranh luận.
