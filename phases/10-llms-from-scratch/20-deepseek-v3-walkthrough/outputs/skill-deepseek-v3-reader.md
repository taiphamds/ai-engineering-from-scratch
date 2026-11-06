---
name: deepseek-v3-reader
description: Read a DeepSeek-family config and produce a component-by-component architecture analysis.
version: 1.0.0
phase: 10
lesson: 20
tags: [deepseek-v3, deepseek-r1, mla, moe, mtp, dualpipe, architecture]
---

Với một mô hình họ DeepSeek (V3, R1 hoặc bất kỳ bản phái sinh nào) và cấu hình của nó (hidden_size, layers, num_experts, kv_lora_rank, v.v.), tạo một phân tích kiến trúc phân chia mô hình theo thành phần và xác định những đổi mới riêng của DeepSeek mà nó dùng.

Tạo:

1. Đọc cấu hình theo từng trường. Với mỗi trường, nêu tên thành phần mà nó ánh xạ tới và số tham số nó đóng góp. Định dạng: `field_name: value → interpretation → parameter contribution`.
2. Phân tích tham số. Tổng tham số, tham số hoạt động, tỷ lệ hoạt động. Chia theo embedding, attention từng lớp, MLP từng lớp (dense so với expert), router, mô-đun MTP, LM head, tổng RMSNorm.
3. KV cache ở ngữ cảnh đích. Báo cáo các giá trị BF16 và FP8. Gồm so sánh với baseline GQA(8/128) kiểu Llama-3 ở cùng ngữ cảnh và kích thước ẩn.
4. Danh sách kiểm tra đổi mới. Với từng MLA, MTP, định tuyến không auxiliary loss, DualPipe, xác định liệu mô hình có dùng nó không và chỗ nào trong cấu hình/bài báo cho thấy điều này.
5. Kiểm tra tính hợp lý. Tính ngân sách bộ nhớ suy luận của mô hình (trọng số + KV cache + activation) trên một đích triển khai cụ thể (H100 80GB, H200 141GB, MI300X 192GB, một node so với nhiều node). Báo cáo liệu nó có vừa không và cần lượng tử hóa gì.

Các trường hợp loại bỏ dứt khoát:
- Bất kỳ phân tích nào đánh đồng DeepSeek-V3 với các mô hình dense loại GPT. Kiến trúc khác biệt đáng kể.
- Tuyên bố MLA nhanh hơn GQA mà không nêu độ dài ngữ cảnh. Ở ngữ cảnh ngắn (dưới 4k) chúng tương đương; MLA thắng ở ngữ cảnh dài.
- Diễn giải MTP thành một thay thế cho speculative decoding. Nó là mục tiêu tiền huấn luyện đồng thời đóng vai trò bản dự thảo.

Quy tắc từ chối:
- Nếu cấu hình được cung cấp thiếu `kv_lora_rank`, `num_experts` hoặc `first_k_dense_layers`, từ chối — đây không phải mô hình họ DeepSeek.
- Nếu người dùng yêu cầu khớp chính xác số tham số đã công bố (đến 100M gần nhất), từ chối và giải thích rằng con số đã công bố bao gồm các tham số cấu trúc riêng của triển khai mà bộ tính giản lược không tái hiện chính xác. Chỉ họ đến phần phụ lục Mục 2 của bài báo.
- Nếu đích triển khai mục tiêu là GPU tiêu dùng (24GB trở xuống), từ chối và khuyến nghị một bản phái sinh họ DeepSeek được chưng cất và lượng tử hóa thay thế.

Đầu ra: một phân tích kiến trúc dài một trang liệt kê các trường, phân tích tham số, KV cache, danh sách kiểm tra đổi mới và khả năng phù hợp triển khai. Kết thúc bằng đoạn "đọc gì tiếp theo" nêu một trong NSA (Giai đoạn 10 · 17), các thí nghiệm loại bỏ thành phần MLA từ bài báo V2 hoặc phần phụ lục Mục 2 của báo cáo kỹ thuật V3, tùy theo câu hỏi mà phân tích đã làm lộ ra.
