---
name: omni-streaming-budget
description: Size a Thinker-Talker streaming voice pipeline (Qwen-Omni / Moshi / Mini-Omni) for a target TTFAB and feature set.
version: 1.0.0
phase: 12
lesson: 20
tags: [qwen-omni, moshi, mini-omni, streaming, ttfab, thinker-talker]
---

Với đặc tả sản phẩm ưu tiên giọng nói (TTFAB mục tiêu, tốc độ lấy mẫu mic, có/không thị giác đầu vào, song ngữ, song công toàn phần) và ràng buộc tính toán (hạng GPU, ngân sách), xác định kích thước pipeline Thinker-Talker.

Tạo ra:

1. Lựa chọn họ mô hình. Moshi (độ trễ tốt nhất), Qwen2.5-Omni (tính năng mở tốt nhất), Qwen3-Omni (chất lượng tiên tiến nhất), Mini-Omni (đơn giản nhất).
2. Kích thước Thinker và Talker. Thinker 7B + Talker 200-300M cho TTFAB <400ms. Thinker 70B+ cho chất lượng, chấp nhận TTFAB cao hơn.
3. Phân tích TTFAB. Ước tính độ trễ theo từng thành phần.
4. Chế độ song công. Mặc định bán song công với luân phiên lượt VAD; song công toàn phần nếu sản phẩm đòi hỏi phản hồi phụ.
5. Tích hợp thị giác. TMRoPE với dấu thời gian tuyệt đối cho khung hình video xen kẽ.
6. Hình thức triển khai. Một GPU so với tách (Thinker trên A, Talker trên B) dựa trên nhu cầu thông lượng.

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất Talker 70B. Talker phải nhỏ để theo kịp tốc độ token lời nói.
- Dùng bộ giải mã lời nói không truyền luồng. TTFAB tăng vọt.
- Khẳng định song công toàn phần là cắm và chạy. Nó đòi hỏi dữ liệu huấn luyện chuyên biệt.

Quy tắc từ chối:
- Nếu TTFAB mục tiêu <200ms, từ chối bất kỳ thứ gì lớn hơn hạng Moshi (7B hợp nhất) trên một A100.
- Nếu sản phẩm đòi hỏi tạo âm nhạc trong luồng, từ chối kiến trúc này và khuyến nghị pipeline âm nhạc riêng.
- Nếu tốc độ lấy mẫu mic là 48kHz với chất lượng nghiêm ngặt, nêu nhu cầu bộ mã hóa lời nói mạnh hơn; không giảm tần số lấy mẫu một cách mù quáng.

Đầu ra: kế hoạch truyền luồng một trang với lựa chọn mô hình, kích thước, phân tích TTFAB, chế độ song công, chiến lược thị giác, triển khai. Kết thúc bằng arXiv 2503.20215 (Qwen2.5-Omni), 2410.00037 (Moshi).
