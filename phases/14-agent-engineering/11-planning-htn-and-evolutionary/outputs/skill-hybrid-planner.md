---
name: hybrid-planner
description: Build a hybrid planner — ChatHTN for provably-sound plans, AlphaEvolve for code search with a machine-checkable evaluator — and pick the right one for the problem.
version: 1.0.0
phase: 14
lesson: 11
tags: [planning, htn, chathtn, alphaevolve, evolutionary-search]
---

Với một lớp vấn đề (workflow ràng buộc bởi chính sách so với tối ưu hóa mã so với tác vụ mở), chọn một bộ lập kế hoạch và tạo một khung đúng.

Quyết định:

1. Vấn đề có các tiền điều kiện / chính sách / ràng buộc lập lịch cứng không? -> HTN (ChatHTN).
2. Vấn đề có một hàm độ thích nghi mang tính xác định, có thể kiểm tra bằng máy không? -> Tiến hóa (AlphaEvolve).
3. Không có cả hai? -> Thay vào đó chọn ReAct (Bài 01) hoặc ReWOO (Bài 02).

Với HTN, tạo:

1. Kiểu `Operator` với `preconditions`, `effects_add`, `effects_remove`.
2. Kiểu `Method` với `task`, `preconditions`, `subtasks`.
3. Một bộ lập kế hoạch thử các phương thức trước, quay về phân rã LLM và lưu đệm các phép phân rã LLM thành công.
4. Một bước xác thực từ chối các phép phân rã LLM tham chiếu các toán tử hoặc phương thức không xác định.

Với Tiến hóa, tạo:

1. Một quần thể hạt giống các chương trình ứng viên.
2. Một bộ đánh giá mang tính xác định trả về một độ thích nghi vô hướng.
3. Một toán tử đột biến (do LLM điều khiển hoặc dựa trên quy tắc).
4. Một vòng lặp lựa chọn (giữ top-k, đột biến, lặp lại) với dừng sớm.

Các trường hợp từ chối cứng:

- ChatHTN trong đó đầu ra LLM được áp dụng trực tiếp mà không có xác thực schema toán tử. Tuyên bố tính đúng đắn thất bại.
- AlphaEvolve trong đó bộ đánh giá gọi một giám khảo LLM. Độ thích nghi phải mang tính xác định; các giám khảo LLM đưa vào nhiễu ngẫu nhiên mà vòng lặp không thể phục hồi từ đó.
- Một trong hai mẫu cho các tác vụ mở ("viết một bài blog"). Không bộ đánh giá, không tiền điều kiện -> sử dụng ReAct.

Các quy tắc từ chối:

- Nếu miền không có schema toán tử rõ ràng, từ chối ChatHTN. Đề xuất ReWOO hoặc ReAct thuần.
- Nếu miền không có độ thích nghi có thể kiểm tra bằng máy, từ chối AlphaEvolve. Đề xuất Self-Refine (Bài 05).
- Nếu người dùng muốn "bộ lập kế hoạch + LLM quyết định cuối cùng," từ chối. Sự phân tách giữa tính đúng đắn biểu tượng và khám phá LLM là trụ cột.

Đầu ra: `operators.py`, `methods.py`, `planner.py` (HTN) hoặc `evaluator.py`, `mutator.py`, `loop.py` (tiến hóa), cộng `README.md` với lý do quyết định. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 25 nếu xác minh kiểu tranh luận phù hợp vấn đề, hoặc Bài 02 nếu rốt cuộc tác vụ thực sự có dạng ReWOO.
