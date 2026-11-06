---
name: cache-auditor
description: Audit an LLM prompt template and traffic pattern for cacheability. Recommend prompt restructure, TTL choice, parallelization fix, and semantic-cache threshold.
version: 1.0.0
phase: 17
lesson: 14
tags: [caching, prompt-cache, semantic-cache, anthropic, openai, parallelization, ttl]
---

Với một mẫu prompt, mẫu lưu lượng (tốc độ đến, hệ số song song) và nhà cung cấp (Anthropic, OpenAI, Gemini, vLLM tự lưu trữ), tạo một bản kiểm tra bộ nhớ đệm.

Tạo:

1. Cấu trúc tiền tố. Chia mẫu thành các phần tĩnh (có thể lưu bộ nhớ đệm) và động (không thể lưu bộ nhớ đệm). Đánh dấu mọi nội dung động hiện có trong tiền tố và đề xuất bản viết lại.
2. Chọn TTL. Anthropic 5 phút (ghi 1.25x) so với 1 giờ (ghi 2x). Chọn theo tốc độ đến — 1 giờ thắng khi tiền tố được tái sử dụng đều đặn trong giờ đó.
3. Kiểm tra song song hóa. Đếm các yêu cầu song song có tiền tố chung. Nếu N > 2 và song song, yêu cầu mẫu tuần tự trước rồi mới phân nhánh. Định lượng mức giảm hóa đơn dự kiến.
4. Chọn bộ nhớ đệm ngữ nghĩa. Quyết định L1 có đáng hay không. Trò chuyện mở: có thể không (ít trúng). FAQ có cấu trúc / hỗ trợ: có. Đặt ngưỡng cosine, bắt đầu 0.95; chỉ điều chỉnh giảm với các đánh giá chất lượng phản hồi.
5. Tiết kiệm dự kiến. Tính chênh lệch $ hằng tháng so với đường cơ sở không có bộ nhớ đệm với lưu lượng hiện tại và tỷ lệ trúng dự kiến.
6. Đại lượng quan sát. Một chỉ số bảng điều khiển bắt được suy giảm: tỷ lệ trúng bộ nhớ đệm L2 trong giờ trượt gần nhất; cảnh báo nếu giảm >20%.

Các trường hợp loại bỏ dứt khoát:
- Khẳng định "tiết kiệm 50%" mà không tính tỷ lệ trúng dự kiến và phụ phí ghi. Từ chối — tính theo từng lớp.
- Để nội dung động trong tiền tố khi một bản viết lại đơn giản chuyển nó ra ngoài. Từ chối phê duyệt.
- Gửi các yêu cầu song song có tiền tố chung mà không có mẫu tuần tự trước. Từ chối — nêu mức phình hóa đơn 5-10x.

Quy tắc từ chối:
- Nếu prompt có >80% nội dung động theo token, từ chối hứa hẹn tiết kiệm bộ nhớ đệm. Tốt nhất chỉ khuyến nghị lưu bộ nhớ đệm ngữ nghĩa.
- Nếu ngưỡng bộ nhớ đệm ngữ nghĩa bị hạ dưới 0.85 mà không đánh giá chất lượng phản hồi, từ chối — rủi ro lưu ảo giác vào bộ nhớ đệm.
- Nếu nhà cung cấp không hỗ trợ cache_control tường minh (không phải Anthropic, không phải Gemini-v1) và chỉ tự động lưu bộ nhớ đệm, ghi nhận rằng tỷ lệ trúng là tận dụng cơ hội, không được bảo đảm.

Đầu ra: một bản kiểm tra một trang liệt kê bản viết lại tiền tố, TTL, mẫu song song hóa, ngưỡng L1, tiết kiệm dự kiến, đại lượng quan sát. Kết thúc bằng khuyến nghị rà soát hằng quý: kiểm tra lại prompt sau mọi thay đổi mẫu.
