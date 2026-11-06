---
name: skill-library
description: Generate a Voyager-shaped skill library with registration, retrieval by similarity, compositional execution, and failure-driven refinement.
version: 1.0.0
phase: 14
lesson: 10
tags: [voyager, skills, library, composition, refinement]
---

Với một runtime đích và một miền, tạo một thư viện skill hỗ trợ ba thành phần của Voyager: hook chương trình học, kho skill có thể truy xuất, tinh chỉnh lặp.

Tạo:

1. Kiểu `Skill` với `name`, `description`, `code`, `version`, `tags`, `depends_on`, `history`. Mọi lần ghi ghi lại mã trước đó.
2. `SkillLibrary` với `register(skill, dedup=True)` (mới hoặc tăng phiên bản), `search(query, top_k, tag_filter)`, `get(name)`, `topo_order(name)` (phân giải phụ thuộc), `execute(name, context)` (chạy tô pô).
3. Truy xuất PHẢI sử dụng độ tương tự embedding hoặc BM25, không phải chấm điểm LLM trên toàn bộ thư viện. Xếp hạng lại bằng LLM được phép trên danh sách ngắn top-k.
4. Thực thi PHẢI bắt các ngoại lệ theo từng skill và đưa chúng vào trace như phản hồi mà vòng lặp tinh chỉnh có thể tiêu thụ.
5. Một hook tinh chỉnh: sau một `execute` thất bại, runtime thu thập (task, skill_name, error, env_state), truyền nó cho mô hình và gọi `register` trên skill được viết lại. Phiên bản tăng; lịch sử giữ lại mã cũ.

Các trường hợp từ chối cứng:

- Một thư viện trong đó các skill là các chuỗi văn xuôi, không phải mã. Các skill có thể thực thi. Văn xuôi thuộc về `description`.
- Kết hợp mà không có sắp xếp tô pô. Tìm kiếm theo chiều sâu không có phát hiện chu trình bị hỏng trên các DAG skill.
- Ghi đè phiên bản âm thầm. Mọi lần tinh chỉnh PHẢI tăng `version` và đẩy mã cũ vào `history` để kiểm toán.

Các quy tắc từ chối:

- Nếu runtime đích không có sandbox cho thực thi skill, từ chối cho các miền mà các skill chạm đến các hệ thống sản xuất. Yêu cầu một sandbox (các nguyên tắc Bài 09) trước khi phát hành.
- Nếu người dùng yêu cầu "tự động thử lại trên mọi thất bại mà không tinh chỉnh," từ chối. Các lần thử lại không tinh chỉnh khuếch đại lỗi; chúng không khắc phục nó.
- Nếu thư viện vượt quá ~200 skill với truy xuất phẳng, từ chối gọi nó là "sẵn sàng cho sản xuất." Thêm các bộ lọc thẻ và không gian tên phân cấp trước.

Đầu ra: `skill.py`, `library.py`, `execute.py`, `refine.py` và một `README.md` giải thích quy tắc loại trùng, backend truy xuất, prompt tinh chỉnh và chính sách phiên bản. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 17 cho tích hợp Claude Agent SDK, Bài 16 cho dịch công cụ OpenAI Agents SDK hoặc Bài 30 cho đánh giá chất lượng thư viện skill.
