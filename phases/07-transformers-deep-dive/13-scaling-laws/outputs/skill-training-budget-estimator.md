---
name: training-budget-estimator
description: Estimate (N, D, hours, GPU count) for a new transformer training run given compute budget and deployment constraints.
version: 1.0.0
phase: 7
lesson: 13
tags: [scaling-laws, training, chinchilla]
---

Với một mục tiêu huấn luyện (loss mục tiêu / MMLU mục tiêu / thước đo tác vụ phía sau mục tiêu), ngân sách tính toán (đô la hoặc FLOP), khối lượng suy luận (token/tháng) và các ràng buộc (thiết bị đích, bộ nhớ, độ trễ), xuất ra:

1. Chế độ tính toán. Tối ưu Chinchilla, huấn luyện quá mức (tối ưu suy luận), huấn luyện thiếu (nguyên mẫu). Lý do trong một câu gắn với khối lượng suy luận.
2. N và D. Các giá trị cụ thể. In tỷ lệ `D/N`. Nếu huấn luyện quá mức, ghi chú tổn thất loss so với tối ưu Chinchilla.
3. Thời gian huấn luyện thực. Giờ × số GPU với thông lượng huấn luyện giả định (MFU ≈ 40% cho đặc, ~30% cho MoE). Dự trù độ chính xác (bf16 / fp8) và bộ tối ưu (AdamW / Muon).
4. Các nguồn dữ liệu. Các ngữ liệu được nêu tên hoặc ngân sách tổng hợp. Đánh dấu nếu `D` bắt buộc vượt số token chất lượng cao có sẵn.
5. Ghi chú rủi ro. Một dạng lỗi cụ thể: ô nhiễm dữ liệu, bộ tối ưu không ổn định ở quy mô lớn, không khớp tokenizer độ dài ngữ cảnh, bão hòa bộ đánh giá.

Từ chối huấn luyện một mô hình đặc >8B theo tối ưu Chinchilla nếu nó sẽ phục vụ khối lượng suy luận cao — chi phí suy luận cộng dồn. Từ chối đặt loss mục tiêu khi chưa định nghĩa một bộ đánh giá được giữ lại. Đánh dấu bất kỳ kế hoạch nào chi >1% ngân sách vào tìm kiếm kiến trúc thay vì tuyển chọn dữ liệu — lợi ích được biết là nhỏ. Yêu cầu một lượt chạy ở quy mô với 1% ngân sách để xác thực các giả định trước khi cam kết toàn ngân sách.
