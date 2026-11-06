---
name: actor-runtime
description: Build an AutoGen v0.4-shaped actor runtime with private state, inbox-per-actor, message-only IPC, fault isolation, and a dead-letter queue.
version: 1.0.0
phase: 14
lesson: 14
tags: [autogen, actor-model, messaging, fault-isolation, dead-letter]
---

Với một tác vụ nhiều agent, tạo một runtime actor và các actor agent cần thiết.

Tạo:

1. Một kiểu `Message` với `sender`, `recipient`, `topic`, `body`, `mid`.
2. Một lớp cơ sở `Actor` với `receive(message, runtime)`. Trạng thái actor là riêng tư.
3. Một `Runtime` với một hàng đợi dùng chung, `send()`, `run_until_idle()` và một hàng đợi thông điệp lỗi. Các ngoại lệ trong bộ xử lý đi vào DLQ; không lan truyền.
4. Một hàm trợ giúp cấu trúc: RoundRobin (vòng xoay cố định), Selector (LLM chọn tiếp theo) hoặc quảng bá tùy chỉnh.
5. Các hook khả năng quan sát cho từng thông điệp: phát ra các span OTel với `gen_ai.agent.name` và `gen_ai.operation.name` theo Bài 23.

Các trường hợp từ chối cứng:

- Truyền thông điệp đồng bộ chặn bên gửi cho đến khi bên nhận trả về. Đó là mô hình v0.2; nó phá vỡ cô lập lỗi.
- Trạng thái có thể thay đổi dùng chung xuyên các actor. Các actor đọc trạng thái qua thông điệp hoặc hoàn toàn không đọc.
- Một runtime lan truyền các ngoại lệ bộ xử lý. Các lỗi thuộc về DLQ; để các actor khác tiếp tục chạy.

Các quy tắc từ chối:

- Nếu tác vụ chỉ có hai actor với một sự qua lại cố định, từ chối cách định khung actor và đề xuất một chuỗi prompt (Bài 12). Các actor xứng đáng với chi phí khi có >=3 actor hoặc tính đồng thời bất đồng bộ.
- Nếu người dùng muốn "chế độ đồng bộ" để "gỡ lỗi dễ hơn," từ chối. Thay vào đó đề xuất ghi log + truy vết (Bài 23).
- Nếu miền nghiêm ngặt là yêu cầu/phản hồi với một chuyên gia duy nhất, đề xuất định tuyến (Bài 12) thay vì một nhóm actor.

Đầu ra: `message.py`, `actor.py`, `runtime.py`, `teams.py`, `README.md` giải thích chính sách DLQ, lựa chọn cấu trúc và cách các span OTel được nối. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 25 (tranh luận nhiều agent) nếu các actor thương lượng, Bài 23 (OTel) nếu cần truy vết hoặc Microsoft Agent Framework nếu bạn muốn runtime hướng tới tương lai.
