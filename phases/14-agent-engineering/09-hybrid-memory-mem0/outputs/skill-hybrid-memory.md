---
name: hybrid-memory
description: Generate a Mem0-shaped three-store memory system (vector + KV + graph) with a fusion scorer, scope taxonomy, and temporal invalidation.
version: 1.0.0
phase: 14
lesson: 09
tags: [memory, mem0, vector, graph, kv, fusion, scope]
---

Với một runtime đích, một backend vector (Qdrant, pgvector, Chroma, sqlite-vec), một backend KV (Postgres, Redis, dict) và một backend đồ thị (Neo4j, các cạnh trong bộ nhớ), tạo một hệ thống bộ nhớ hợp nhất.

Tạo:

1. Ba lớp kho phía sau một facade `add(text, user_id, session_id, scope, importance, tags)`. Khi ghi, bộ trích xuất phân rã `text` thành các bản ghi, bộ ba KV và bộ ba đồ thị. Không kho nào là tùy chọn.
2. Một bộ chấm điểm hợp nhất `score = w_rel * relevance + w_imp * importance + w_rec * recency`. Cung cấp cả ba trọng số dưới dạng cấu hình. Điều chỉnh theo sản phẩm, không phải theo lời gọi.
3. Hệ phân loại phạm vi: `user`, `session`, `agent`. Truy xuất PHẢI tôn trọng phạm vi. Một truy vấn người dùng không bao giờ được làm rò rỉ các bản ghi của người dùng khác.
4. Vô hiệu hóa theo thời gian. Các mâu thuẫn đánh dấu các cạnh/bản ghi cũ không hợp lệ; không bao giờ xóa. Cung cấp `search(query, as_of=timestamp)` cho các truy vấn lịch sử.
5. Một giao diện bộ trích xuất. Mặc định có thể do LLM điều khiển; cho phép một phương án dự phòng regex mang tính xác định cho các kiểm thử. Giới hạn các cạnh đồ thị cho mỗi `add()` để ngăn bùng nổ.

Các trường hợp từ chối cứng:

- Bộ nhớ một kho được mô tả là "có dạng Mem0." Các sản phẩm chỉ vector, chỉ KV, chỉ đồ thị đều ổn nhưng không phải bộ nhớ lai. Đừng gọi sai tên chúng.
- Truy xuất xuyên phạm vi mà không có các trọng số cho từng phạm vi hoặc một bộ lọc `scope=` tường minh. Rò rỉ phạm vi là một sự cố tuân thủ và riêng tư.
- Xóa khi có mâu thuẫn. Vô hiệu hóa và đóng dấu thời gian. Xóa che giấu lỗi và phá vỡ kiểm toán.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu "không gán trọng số tầm quan trọng," từ chối. Xếp hạng tính liên quan phẳng trên một triệu bản ghi là một thất bại truy xuất đang chờ xảy ra.
- Nếu backend đồ thị không có bộ phát hiện xung đột, từ chối gọi hệ thống kết quả là "có dạng Mem0." Hạ mức tên gọi.
- Nếu sản phẩm liên quan đến PII (y tế, pháp lý, nhân sự), từ chối phát hành với một bộ trích xuất chưa được chủ sản phẩm kiểm toán.

Đầu ra: một file cho mỗi kho cộng `memory.py` (facade), `config.py` (các trọng số), `README.md` giải thích các trọng số hợp nhất, chính sách phạm vi, hợp đồng bộ trích xuất và ngữ nghĩa vô hiệu hóa. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 10 nếu agent cần học các skill mới, Bài 23 nếu các span OTel được yêu cầu trên các thao tác bộ nhớ hoặc Bài 27 cho xử lý đầu vào không đáng tin cậy khi truy xuất.
