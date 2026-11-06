---
name: eagle3-tuner
description: Pick and tune a speculative decoding strategy (vanilla / Medusa / EAGLE-1/2/3 / lookahead) for a new inference workload.
version: 1.0.0
phase: 10
lesson: 15
tags: [speculative-decoding, eagle, eagle-3, medusa, inference, vllm, sglang, tensorrt-llm]
---

Với đích suy luận production (mô hình xác minh, batch, đặc điểm độ dài chuỗi, độ trễ decode p50/p99 mục tiêu, bộ tăng tốc, phạm vi alpha kỳ vọng từ đo từ xa, hỗn hợp tác vụ), đề xuất chiến lược speculative-decoding và tham số điều chỉnh. Đề xuất phải giữ chính xác phân phối đầu ra bộ xác minh — không đánh đổi chất lượng nào chấp nhận được nếu không phê duyệt rõ.

Tạo:

1. Họ nháp. Chọn nguyên bản, Medusa, EAGLE-1, EAGLE-2, EAGLE-3 hoặc lookahead. Biện minh bằng đo từ xa alpha (hoặc ước tính hiệu chuẩn), chi phí huấn luyện sẵn có (không, SFT nhỏ, lần chạy đầy đủ 60B+ token), và liệu bộ xác minh có nháp công bố không (checkpoint EAGLE-3 tồn tại cho Llama 3.1/3.3, DeepSeek-V3, Qwen 2.5, Qwen 3).
2. Độ dài nháp N. Chọn số nguyên N giảm thiểu thời gian thực kỳ vọng mỗi token với alpha và tỷ lệ chi phí nháp/bộ xác minh c: tối thiểu hóa (1 + N*c) / ((1 - alpha^(N+1)) / (1 - alpha)). Trình bày tính cho ba N ứng viên quanh tối ưu.
3. Tham số tìm kiếm cây nếu EAGLE-2/3. Chọn độ sâu và hệ số phân nhánh trong ngân sách bộ nhớ. Mặc định sâu 3, phân nhánh (4, 2, 2) cho batch <=8, sâu 2 (4, 2) cho batch 16-64, và không cây cho batch >64.
4. Cổng temperature. Khi temperature > 0.8, alpha sụp đổ. Đề xuất tắt spec decode trên ngưỡng hiệu chuẩn, hoặc chuyển sang cây rộng hơn với phân nhánh mỗi nút thấp hơn.
5. Kế hoạch hoàn tác KV. Nêu triển khai KV cache cụ thể (bộ đệm tạm vLLM so với độ dài logic theo chuỗi TensorRT-LLM) và xác nhận hỗ trợ loại theo batch ở mức đồng thời mục tiêu.

Từ chối dứt khoát:
- Mọi đề xuất thay đổi phân phối đầu ra bộ xác minh (ví dụ spec-decode xấp xỉ, loại bỏ nới lỏng).
- Spec decode ở batch 1 trên mô hình nhỏ đơn lẻ mà chi phí nháp vượt chi phí xác minh tiết kiệm.
- EAGLE có checkpoint nháp huấn luyện với tokenizer hoặc bản mô hình cơ sở khác bộ xác minh.
- Chạy spec decode không hoàn tác KV — sẽ âm thầm làm hỏng token sau.

Quy tắc từ chối:
- Nếu không có đo từ xa alpha VÀ hỗn hợp tác vụ là viết sáng tạo temperature cao, từ chối đề xuất và yêu cầu lần hiệu chuẩn trước.
- Nếu bộ xác minh nhỏ hơn 7B tham số dense, đề xuất tắt spec decode thay vì chọn chiến lược.
- Nếu bộ phục vụ không hỗ trợ họ nháp đã chọn (ví dụ phiên bản vLLM không EAGLE-3), hạ xuống EAGLE-2 thay vì yêu cầu người dùng xây lại bộ công cụ.

Đầu ra: đề xuất một trang liệt kê họ nháp, N, hình dạng cây (nếu có), xác nhận hoàn tác KV và phạm vi tăng tốc kỳ vọng. Kết thúc bằng đoạn "kế hoạch đo từ xa alpha" nêu hook ghi log chính xác người dùng phải thêm vào máy chủ suy luận để xác minh đề xuất trong tuần production đầu.
