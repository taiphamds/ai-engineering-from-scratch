---
name: hybrid-picker
description: Pick between pure Transformer, Jamba-style hybrid, and pure SSM for a given workload.
version: 1.0.0
phase: 10
lesson: 21
tags: [jamba, mamba, ssm, hybrid, long-context, memory-budget, architecture]
---

Với một đặc tả khối lượng công việc (hồ sơ độ dài ngữ cảnh p50/p99, hỗn hợp tác vụ, ngân sách bộ nhớ mỗi GPU, thông lượng đích, ưu tiên chất lượng so với tốc độ), khuyến nghị giữa Transformer thuần (+MoE +MLA), mô hình lai kiểu Jamba và mô hình Mamba thuần.

Tạo:

1. Nhóm độ dài ngữ cảnh. Ngắn (dưới 16k), trung bình (16k-64k), dài (64k-256k) hoặc siêu dài (trên 256k). Chi phối quyết định ban đầu.
2. Khuyến nghị kiến trúc. Chọn một trong Transformer thuần, mô hình lai 1:7, mô hình lai 1:3, mô hình lai 1:15 hoặc Mamba thuần. Biện minh bằng nhóm ngữ cảnh cộng nhu cầu nhớ lại trong ngữ cảnh của tác vụ.
3. Kiểm tra ngân sách bộ nhớ. Tính KV cache + trạng thái SSM ở ngữ cảnh đích. Xác nhận nó vừa trên bộ tăng tốc đích sau khi tính trọng số và bộ nhớ activation (thường là 10-20 GB ngoài trọng số và KV cache).
4. Công bố đánh đổi chất lượng. Ghi lại chi phí chất lượng của mức thưa đã chọn. Các mô hình lai dưới tỷ lệ 1:7 suy giảm về truy xuất trong ngữ cảnh ở mức đo được; Mamba thuần thất bại trên một số tác vụ theo dõi trạng thái.
5. Tương thích ngăn xếp suy luận. Xác nhận kiến trúc đã chọn được ngăn xếp đích hỗ trợ (vLLM, TensorRT-LLM, SGLang, llama.cpp). Các mô hình lai có độ phủ công cụ mỏng hơn Transformer thuần.

Các trường hợp loại bỏ dứt khoát:
- Mô hình lai kiểu Jamba cho ngữ cảnh dưới 16k. Chi phí kiến trúc bổ sung không có cơ sở.
- Mamba thuần cho tác vụ nặng suy luận hoặc đối chiếu chéo nhiều tài liệu. Các giới hạn theo dõi trạng thái gây hại.
- Tỷ lệ lai dưới 1:15. Dưới mức này, nhớ lại trong ngữ cảnh không đáng tin cậy.
- Bất kỳ khuyến nghị nào không vừa ngân sách bộ nhớ đã tính trên bộ tăng tốc được chỉ định.

Quy tắc từ chối:
- Nếu khối lượng công việc thực sự trộn ngữ cảnh ngắn và dài, từ chối khuyến nghị mô hình lai và khuyến nghị Transformer thuần (với MLA nếu có thể) — các mô hình lai nổi trội riêng trên khối lượng công việc ngữ cảnh dài.
- Nếu bộ tăng tốc là loại tiêu dùng (24GB trở xuống), từ chối các mô hình kích thước lai và khuyến nghị mô hình lai nhỏ được chưng cất hoặc Transformer thuần được lượng tử hóa.
- Nếu khối lượng công việc là sinh batch-1 nhạy độ trễ và mô hình mới (không có cách triển khai hiện có), từ chối và khuyến nghị Transformer thuần được hỗ trợ tốt với speculative decoding (Giai đoạn 10 · 15) làm cách đơn giản hơn.

Đầu ra: một khuyến nghị dài một trang liệt kê nhóm ngữ cảnh, lựa chọn kiến trúc, KV cache ở ngữ cảnh đích, công bố đánh đổi chất lượng và tương thích ngăn xếp suy luận. Kết thúc bằng đoạn "cần theo dõi gì" nêu đánh giá ngữ cảnh dài cụ thể (RULER, LongBench, needle-in-haystack) sẽ xác nhận khuyến nghị trong 10k yêu cầu sản xuất đầu tiên.
