---
name: multi-agent-team
description: Build a multi-agent software team with architect, parallel coders, reviewer, and tester; measure against SWE-bench Pro and produce a handoff post-mortem.
version: 1.0.0
phase: 19
lesson: 10
tags: [capstone, multi-agent, swe-bench, langgraph, a2a, worktree, roles]
---

Với một URL issue GitHub và một mức song song được cung cấp, triển khai một nhóm phần mềm đa agent tạo ra một PR sẵn sàng hợp nhất. Đánh giá trên 50 issue SWE-bench Pro và công bố một biểu đồ tần suất lỗi bàn giao.

Kế hoạch xây dựng:

1. Bảng nhiệm vụ: kho JSONL dựa trên file (hoặc Redis) chứa các thông điệp có kiểu. Các loại thông điệp: plan_request, subtask, diff_ready, review_needed, review_feedback, approved, test_needed, test_passed, test_failed, replan_needed.
2. Kiến trúc sư (Opus 4.7): đọc issue, viết kế hoạch, phát ra một DAG các nhiệm vụ con với giao diện rõ ràng (các file được chạm tới, các hàm công khai, tác động đến kiểm thử).
3. N lập trình viên (Sonnet 4.7): mỗi người nhận một nhiệm vụ con, tạo một `git worktree add` mới + sandbox Daytona, triển khai độc lập.
4. Bộ điều phối hợp nhất: hợp nhất ba chiều; chỉ giải quyết xung đột qua trung gian LLM khi có chồng lấn ở mức file.
5. Người rà soát (GPT-5.4): đọc diff đã hợp nhất; không thể chấp thuận các diff do chính nó tạo; phát ra approved hoặc review_feedback được chuyển đến lập trình viên liên quan.
6. Người kiểm thử (Gemini 2.5 Pro): chạy bộ kiểm thử trong một sandbox sạch; phát ra test_passed hoặc test_failed kèm hiện vật.
7. Hạch toán bàn giao: mỗi thông điệp giữa các vai trò trở thành một span Langfuse với kích thước payload và mô hình. Tính khuếch đại token = total_tokens / single_agent_baseline_tokens.
8. Chèn một phép thăm dò lỗi rõ ràng (10% số lần chạy) để đo tỷ lệ chấp thuận sai của người rà soát.
9. Chạy trên 50 issue SWE-bench Pro; công bố pass@1, thời gian thực so với đường cơ sở đơn agent, phân tích token theo vai trò, biểu đồ tần suất lỗi bàn giao.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | pass@1 trên tập con 50 issue |
| 20 | Mức tăng tốc song song | Thời gian thực so với đường cơ sở đơn agent |
| 20 | Chất lượng rà soát | Tỷ lệ chấp thuận sai trên phép thăm dò chèn lỗi |
| 20 | Hiệu quả token | Tổng token trên mỗi issue đã giải so với đơn agent |
| 15 | Kỹ thuật điều phối | Giải quyết xung đột hợp nhất, biểu đồ tần suất lỗi bàn giao |

Các trường hợp loại thẳng:

- Người rà soát có thể chấp thuận các diff do nó tạo hoặc đề xuất. Ràng buộc cứng.
- Báo cáo không có lần chạy đường cơ sở đơn agent tương ứng. Đa agent phải thắng *trên mỗi đô la*, không chỉ pass@1.
- Các bảng nhiệm vụ mà thông điệp là chuỗi tự do thay vì thông điệp A2A có kiểu.
- Các bộ điều phối hợp nhất âm thầm bỏ các diff xung đột thay vì chuyển lại để lập lại kế hoạch.

Quy tắc từ chối:

- Từ chối chạy mà không có trần ngân sách cho mỗi vai trò (token + đô la).
- Từ chối mở một PR mà người kiểm thử chưa xác minh trong một sandbox sạch.
- Từ chối mở rộng lập trình viên vượt quá 8 trong một lần chạy. Chi phí phụ điều phối chiếm ưu thế trên mức đó.

Đầu ra: một repo chứa bảng nhiệm vụ + các worker vai trò, nhật ký chạy SWE-bench Pro 50 issue, một lần chạy đường cơ sở đơn agent tương ứng, một bảng điều khiển Langfuse với các span gắn nhãn vai trò và phân tích token theo vai trò, một báo cáo phép thăm dò chèn lỗi, và một bản phân tích sau sự cố nêu tên ba bước bàn giao bị hỏng thường xuyên nhất cùng thay đổi lược đồ thông điệp hoặc prompt đã làm giảm từng lỗi.
