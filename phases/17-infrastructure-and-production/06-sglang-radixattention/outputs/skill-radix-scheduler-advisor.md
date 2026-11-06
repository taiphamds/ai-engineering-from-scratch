---
name: radix-scheduler-advisor
description: Advise on SGLang adoption and prompt-ordering discipline for prefix-heavy workloads that want RadixAttention's cache reuse.
version: 1.0.0
phase: 17
lesson: 06
tags: [sglang, radixattention, prefix-caching, scheduler, prompt-ordering]
---

Với một mô tả khối lượng công việc (hình dạng mẫu prompt, mẫu truy xuất, độ dài hội thoại, số tenant đồng thời, phần cứng), tạo một tư vấn áp dụng SGLang / RadixAttention.

Tạo ra:

1. Dấu vân tay khối lượng công việc. Phân loại là nhiều tiền tố (RAG với phần mở đầu lặp lại, các agent với các lược đồ công cụ lặp lại, giọng nói với ngữ cảnh lặp lại) hoặc ít tiền tố (các prompt một lần độc nhất). Nêu độ dài tiền tố dùng chung và tỷ lệ lặp lại.
2. Kiểm toán thứ tự prompt. Đi qua mẫu prompt hiện tại từ trên xuống dưới. Gắn cờ bất kỳ nội dung động nào xen vào phần bất biến. Khuyến nghị thứ tự chuẩn: hệ thống → công cụ/lược đồ → ngữ cảnh truy xuất → lịch sử hội thoại → đầu vào người dùng.
3. Tỷ lệ trúng kỳ vọng. Từ dấu vân tay khối lượng công việc, ước tính tỷ lệ trúng bộ nhớ đệm có thể đạt. Trò chuyện tổng quát 10-30%. RAG với mẫu nhất quán 60-85%. Giọng nói/thị giác với phần mở đầu cố định 80-95%.
4. Quyết định SGLang so với vLLM. Nếu tỷ lệ trúng kỳ vọng > 40% và khối lượng công việc không phải một lần, đề xuất SGLang. Nếu < 30%, vLLM với `--enable-prefix-caching` đơn giản hơn. Nếu 30-40%, chạy cả hai trên một mẫu và chọn.
5. Kế hoạch triển khai. Benchmark bóng 48 giờ trên SGLang với mẫu prompt hiện tại. Ghi nhật ký tỷ lệ trúng. Sửa các vấn đề thứ tự prompt. Benchmark lại. Đưa ra sử dụng nếu tỷ lệ trúng vượt mục tiêu.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị SGLang không đo chia sẻ tiền tố thực tế trong lưu lượng. Từ chối.
- Tuyên bố con số 6.4x không dẫn hình dạng khối lượng công việc. Con số riêng theo khối lượng công việc.
- Bỏ qua kỷ luật thứ tự prompt. Mẫu là khóa bộ nhớ đệm; không có nó bộ lập lịch không thể giúp.

Các quy tắc từ chối:
- Nếu khối lượng công việc là một lần (không prompt hệ thống lặp lại), từ chối SGLang và đề xuất vLLM.
- Nếu nhóm không thể kiểm soát mẫu prompt (bên tiêu thụ thứ ba), từ chối và đề xuất chuẩn hóa mẫu cấp proxy trước khi xem lại.
- Nếu cách ly đa tenant yêu cầu các bể KV riêng theo từng tenant, ghi nhận SGLang hỗ trợ nhưng trục xuất nhánh cây có thể khiến các tenant nhỏ hơn bị đói; đề xuất phân bổ ngân sách theo từng tenant.

Đầu ra: một tư vấn SGLang một trang liệt kê dấu vân tay khối lượng công việc, các sửa chữa thứ tự prompt, tỷ lệ trúng kỳ vọng, lựa chọn engine, và kế hoạch triển khai. Kết thúc bằng một đoạn “đọc gì tiếp theo” chỉ tới bài báo SGLang, tài liệu lưu đệm tiền tố vLLM, hoặc bài tập thứ tự prompt trong bài này tùy khoảng trống lớn nhất.
