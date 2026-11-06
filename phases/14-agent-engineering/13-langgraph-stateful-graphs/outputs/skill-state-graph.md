---
name: state-graph
description: Build a LangGraph-shaped state machine with typed state, conditional edges, per-node checkpointing, and durable resume.
version: 1.0.0
phase: 14
lesson: 13
tags: [langgraph, state-machine, durable, checkpointing, human-in-the-loop]
---

Với một runtime đích, một hình dạng trạng thái, một tập các hàm nút và một backend bộ tạo checkpoint, tạo một đồ thị agent có trạng thái.

Tạo:

1. Một `State` có kiểu (dict hoặc Pydantic). Tài liệu hóa mọi trường. Các nút đọc trạng thái; chúng trả về các cập nhật.
2. Một `StateGraph` với `add_node`, `add_edge`, `add_conditional_edges`, `set_entry`, cộng các dấu hiệu `START`/`END`.
3. Một giao diện `Checkpointer` với `save(session_id, node, state)` và `load_latest(session_id)`. Mặc định là SQLite; cho phép Postgres/Redis/tùy chỉnh.
4. Một `Runner` đi từng bước qua đồ thị, tuần tự hóa trạng thái sau mỗi nút, bắt `PausedAtNode` để có con người tham gia và hỗ trợ `resume_from` với `state_override` tùy chọn.
5. Ba hàm trợ giúp cấu trúc: giám sát (bộ định tuyến trung tâm), bầy đàn (các bàn giao qua công cụ dùng chung), phân cấp (các đồ thị con).

Các trường hợp từ chối cứng:

- Các nút không mang tính xác định mà không ghi lại tường minh hạt giống ngẫu nhiên hoặc thời gian đồng hồ. Tiếp tục giả định đầu ra nút có thể tái tạo với trạng thái đầu vào cho trước.
- Một bộ tạo checkpoint chỉ lưu trạng thái "tóm tắt." Tuần tự hóa toàn bộ trạng thái hoặc việc tiếp tục bị hỏng.
- Các đồ thị mà mọi cạnh đều có điều kiện. Ưu tiên các chuỗi tuyến tính với các nhánh thỉnh thoảng.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu một đồ thị trạng thái mà không có lưu giữ, từ chối. Toàn bộ mục đích là tiếp tục bền vững; nếu bạn không cần tiếp tục, sử dụng các mẫu workflow trong Bài 12.
- Nếu người dùng yêu cầu "chỉ tạo checkpoint khi thành công," từ chối. Các thất bại cũng cần trạng thái — đó là nơi gỡ lỗi bắt đầu.
- Nếu đồ thị có hơn ~30 nút, từ chối bố cục phẳng và yêu cầu các đồ thị con lồng nhau. Các đồ thị phẳng 30 nút không thể đánh giá được.

Đầu ra: `state.py`, `graph.py`, `checkpointer.py`, `runner.py`, `README.md` giải thích schema trạng thái, lựa chọn bộ tạo checkpoint và ngữ nghĩa tiếp tục. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 14 cho lựa chọn mô hình actor, Bài 16 cho lớp bàn giao/chốt bảo vệ hoặc Bài 23 cho các span OTel trên các bước đồ thị.
