---
name: refine-loop
description: Configure an evaluator-optimizer (Self-Refine / CRITIC) loop given task, verifier availability, and iteration budget.
version: 1.0.0
phase: 14
lesson: 05
tags: [self-refine, critic, evaluator-optimizer, guardrails, iteration]
---

Với một tác vụ, một ngân sách lặp và bộ xác minh nào khả dụng (dựa trên công cụ hoặc chỉ tự đánh giá), phát ra các prompt và một chính sách dừng cho một vòng lặp bộ đánh giá-bộ tối ưu.

Tạo:

1. Prompt bộ tạo. Bộ tạo mang tính xác định cho đầu ra đầu tiên. Nêu rõ tác vụ, định dạng đầu ra và các ràng buộc.
2. Prompt bộ đánh giá/bộ xác minh. Nếu các công cụ khả dụng (tìm kiếm, chạy mã, kiểm thử, máy tính, kiểm tra kiểu), chỉ rõ cách gọi chúng và cách tạo một phê bình có cấu trúc (JSON với: đạt/không đạt, violations[], suggested_fixes[]). Nếu chỉ tự đánh giá khả dụng, gắn cờ rõ ràng rủi ro phê duyệt máy móc của Self-Refine và sử dụng một kiểu prompt khác về cấu trúc (ví dụ, đối kháng "tìm ít nhất một thiếu sót").
3. Prompt bộ tinh chỉnh. Phải tham chiếu các đầu ra và phê bình trước (lịch sử). Nêu rằng "không lặp lại một chế độ lỗi đã được gắn cờ trong các lần lặp trước" là bắt buộc.
4. Chính sách dừng. Phép hội: bộ xác minh đạt HOẶC (tự đánh giá nói ổn VÀ số lần lặp >= 2) HOẶC số lần lặp >= max_iterations. Không bao giờ chỉ một điều kiện.
5. Các hook khả năng quan sát. Ghi lại mỗi lần lặp dưới dạng một span OpenTelemetry GenAI (đánh giá, tối ưu) theo Bài 23 để toàn bộ quỹ đạo tinh chỉnh có thể được kiểm toán.

Các trường hợp từ chối cứng:

- Cùng prompt cho bộ tạo và bộ phê bình. Rủi ro phê duyệt máy móc — mô hình đồng ý với chính nó.
- Không có giới hạn lặp. Các vòng lặp tinh chỉnh vô hạn đốt token; luôn giới hạn mặc định ở 4.
- Prompt bộ xác minh yêu cầu phản hồi văn xuôi tự do. Chỉ JSON có cấu trúc — đạt/không đạt cộng các vi phạm được liệt kê.
- Bỏ lịch sử khỏi prompt bộ tinh chỉnh. Bài báo cho thấy chất lượng sụp đổ nếu không có nó.

Các quy tắc từ chối:

- Nếu tác vụ không có bộ xác minh và không có cách xây dựng một bộ, từ chối CRITIC và lưu ý rằng Self-Refine là lựa chọn yếu hơn khả dụng — cảnh báo người dùng về rủi ro phê duyệt máy móc.
- Nếu max_iterations >= 10, từ chối và khuyến nghị thiết kế lại kiến trúc tác vụ. Tinh chỉnh đến hội tụ vượt quá 3-4 lượt thường là một tín hiệu rằng prompt bộ tạo sai.
- Nếu bộ xác minh gọi các công cụ phá hủy (shell, ghi git), từ chối và yêu cầu một ranh giới sandbox (Bài 09).

Đầu ra: một khối cấu hình duy nhất với tất cả các prompt, chính sách dừng và danh sách công cụ, cộng một ghi chú "đọc gì tiếp theo" chỉ đến Bài 16 (các chốt bảo vệ OpenAI Agents SDK), Bài 12 (bộ đánh giá-bộ tối ưu Anthropic) hoặc Bài 30 (phát triển agent dựa trên đánh giá) tùy theo đích triển khai.
