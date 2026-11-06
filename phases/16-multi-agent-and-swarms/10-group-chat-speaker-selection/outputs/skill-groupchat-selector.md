---
name: groupchat-selector
description: Configure an AutoGen/AG2-style GroupChat selector for a task, naming the selector variant, termination, and anti-hot-speaker rules.
version: 1.0.0
phase: 16
lesson: 10
tags: [multi-agent, groupchat, autogen, ag2, speaker-selection]
---

Với một tác vụ và một danh sách agent, tạo một cấu hình GroupChat: lựa chọn bộ chọn, các đầu vào bộ chọn, các quy tắc kết thúc, và các rào chắn.

Tạo ra:

1. **Biến thể bộ chọn.** Luân phiên (rẻ, công bằng, mù ngữ cảnh), do LLM lựa chọn (nhận biết ngữ cảnh, tốn kém), hoặc tùy chỉnh (LLM + dự phòng dựa trên quy tắc).
2. **Các đầu vào bộ chọn.** Nếu do LLM lựa chọn: N thông điệp gần đây, các chuyên môn agent, số lượt. Nếu tùy chỉnh: các quy tắc tường minh.
3. **Các quy tắc kết thúc.** Số vòng tối đa, token TERMINATE, bộ xác minh đã đạt mục tiêu, hoặc kết hợp.
4. **Giảm thiểu người nói nóng.** Mức trần lượt theo từng agent, điểm cân bằng người nói trong đầu vào bộ chọn, luân chuyển bắt buộc sau K lượt liên tiếp.
5. **Giảm thiểu phình ngữ cảnh.** Kế hoạch phép chiếu (các góc nhìn có phạm vi giới hạn theo từng vai trò), các checkpoint tóm tắt, mức trần ngữ cảnh theo từng agent.
6. **Khả năng quan sát.** Ghi nhật ký đầu vào bộ chọn, lựa chọn bộ chọn, độ trễ agent theo từng lượt.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ cấu hình do LLM lựa chọn nào không có ghi nhật ký đầu vào/đầu ra bộ chọn. Gỡ lỗi trở nên không thể.
- Các cấu hình không có mức trần max_rounds.
- Các cuộc trò chuyện đối xứng (không chuyên biệt hóa) trên các tác vụ suy luận — thay vào đó sử dụng tranh luận (Bài 07).

Các quy tắc từ chối:

- Nếu tác vụ có một cấu trúc DAG đã biết, từ chối GroupChat và đề xuất đồ thị tĩnh LangGraph để có tính xác định.
- Nếu tác vụ yêu cầu các dấu vết kiểm toán nghiêm ngặt, từ chối GroupChat; đề xuất LangGraph với bộ tạo checkpoint.
- Nếu các agent nhiều hơn 5-6, từ chối GroupChat phẳng và đề xuất các nhóm lồng nhau hoặc mẫu phân cấp.

Đầu ra: một bản tóm lược cấu hình GroupChat một trang. Kết thúc bằng ước tính chi phí (do LLM lựa chọn phát sinh một lệnh gọi bộ chọn mỗi lượt).
