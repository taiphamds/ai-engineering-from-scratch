---
name: search-policy
description: Pick a search strategy (ReAct, ToT, LATS, evolutionary) given task shape, token budget, and evaluator quality.
version: 1.0.0
phase: 14
lesson: 04
tags: [tree-of-thoughts, lats, mcts, search, value-function]
---

Với một hình dạng tác vụ (một câu trả lời / nhiều câu trả lời / mở), một ngân sách token và một bộ đánh giá khả dụng (kiểm thử vô hướng / heuristic / tự đánh giá), tạo một khuyến nghị chiến lược tìm kiếm với các tham số cụ thể.

Tạo:

1. Quyết định. Một trong: ReAct tuyến tính, ToT beam (với độ rộng chùm k), ToT BFS (với độ sâu tối đa), ToT DFS với cắt tỉa, LATS MCTS (với số lần lặp và UCT c), tìm kiếm tiến hóa (chỉ nếu bộ đánh giá chạy bằng chương trình và có thể kiểm tra).
2. Các tham số. Với mọi chiến lược, các giá trị mặc định dạng số cụ thể: độ rộng chùm, giới hạn độ sâu, hệ số phân nhánh K, rollout cho mỗi mức, UCT c (mặc định 1.4), thời gian chờ.
3. Hàm giá trị. Chỉ rõ chính xác điều gì chấm điểm một nút. Các lựa chọn: tỷ lệ đạt kiểm thử đơn vị, khoảng cách số đến mục tiêu, điểm LLM được gợi bằng prompt với định dạng (sure/likely/impossible hoặc 1..10 hoặc bỏ phiếu), hoặc phần thưởng môi trường.
4. Ước lượng ngân sách token. Token trường hợp xấu nhất = branching_factor ^ depth * avg_prompt_tokens. Cho thấy con số. Nếu nó vượt ngân sách người dùng, khuyến nghị một chiến lược rẻ hơn.
5. Các chế độ lỗi. Với mỗi chiến lược được chọn, liệt kê hai chế độ lỗi hàng đầu và các biện pháp giảm thiểu của chúng (ví dụ LATS + bộ đánh giá nhiễu -> thêm xác minh dựa trên công cụ theo CRITIC, Bài 05).

Các trường hợp từ chối cứng:

- Khuyến nghị tìm kiếm khi bộ đánh giá không đáng tin cậy (chỉ tự đánh giá, không có sự thật chuẩn). Quay về ReAct + CRITIC.
- Đặt hệ số phân nhánh K cao hơn 5 mà không có một lý do thuyết phục. K=3-5 là mặc định của bài báo; K=10 làm bùng nổ chi phí.
- Áp dụng LATS cho các tác vụ kiểu trò chuyện. Tìm kiếm không giúp hỏi đáp hội thoại không có mục tiêu bằng chương trình.
- Tìm kiếm tiến hóa không có một độ thích nghi có thể kiểm tra bằng máy. AlphaEvolve chỉ thú vị khi độ thích nghi được tính bằng chương trình (chạy kiểm thử, đo tốc độ, xác minh định lý).

Các quy tắc từ chối:

- Nếu ngân sách token < 5 lần chi phí một quỹ đạo đơn, từ chối tìm kiếm và khuyến nghị ReAct + Reflexion (Bài 03).
- Nếu ngân sách độ trễ theo đồng hồ < 10 giây, từ chối LATS và khuyến nghị ReAct.
- Nếu tác vụ thuần túy là truy xuất thông tin, từ chối tìm kiếm và khuyến nghị ReWOO (Bài 02).

Đầu ra: một khối khuyến nghị (chiến lược được chọn, các tham số, hàm giá trị, ước lượng ngân sách) cộng một ghi chú "đọc gì tiếp theo" chỉ đến Bài 05 (CRITIC) cho độ tin cậy của bộ đánh giá, Bài 11 (AlphaEvolve) cho các biến thể tiến hóa hoặc Bài 30 (phát triển dựa trên đánh giá) cho xác thực ở cấp benchmark.
