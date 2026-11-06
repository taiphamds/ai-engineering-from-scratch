---
name: multi-region-router
description: Design a multi-region LLM routing plan with KV-cache locality, residency boundaries, DR manifest, and a quarterly failover drill.
version: 1.0.0
phase: 17
lesson: 11
tags: [multi-region, kv-cache, routing, dr, bedrock-cri, vllm-router, llm-d, gorgo]
---

Với các vùng trong phạm vi, ranh giới lưu trú, độ đa dạng bộ nhớ đệm tiền tố dự kiến và SLA TTFT, tạo một kế hoạch định tuyến đa vùng và DR.

Tạo:

1. Chọn bộ định tuyến. Chọn bộ định tuyến nhận biết bộ nhớ đệm (vLLM Router, bộ định tuyến llm-d) và mô tả kênh sự kiện KV. Nêu thuật toán hash tiền tố (ví dụ: trượt 512 token) và tiêu chí phá hòa (độ sâu hàng đợi nhỏ nhất).
2. Chính sách định tuyến. Tối thiểu hóa prefill + RTT theo hướng ưu tiên trong vùng hay toàn cầu (kiểu GORGO)? Giải thích bằng phân phối độ dài prompt — prompt dài (>8K token) hưởng lợi từ định tuyến xuyên vùng; prompt ngắn thì không.
3. Phân vùng lưu trú. Trước mọi tối ưu: những yêu cầu nào bị ràng buộc với những vùng nào vì lý do pháp lý (GDPR, HIPAA). Cấm định tuyến xuyên ranh giới lưu trú ngay cả khi TTFT cải thiện.
4. Lớp CRI thương mại. Khuyến nghị có bật Bedrock Cross-Region Inference hoặc GKE Multi-Cluster Gateway làm lớp tính khả dụng hay không. Nêu rõ lớp này KHÔNG phải là tối ưu TTFT.
5. Manifest DR. Tối thiểu ba file (repo HF + cấu hình engine + manifest triển khai). Xác minh tokenizer, cấu hình lượng tử hóa, RoPE, mẫu chat, adapter LoRA đều được bao gồm. Nêu nơi lưu trữ (sao chép S3 xuyên vùng, GCS đa vùng).
6. Diễn tập chuyển đổi dự phòng. Nhịp hằng quý. Ai thực hiện, đo những gì (RTO, RPO, thời gian làm nóng bộ nhớ đệm). Mục tiêu: RTO 30 phút tương ứng cuộc diễn tập JPMorgan thực tế năm 2024.

Các trường hợp loại bỏ dứt khoát:
- Bỏ qua lưu trú để tối ưu định tuyến. Từ chối — vi phạm GDPR lấn át lợi ích TTFT.
- Khẳng định Bedrock CRI "giải quyết" định tuyến xuyên vùng. Từ chối — CRI là tính khả dụng, không phải TTFT.
- Chỉ sao lưu trọng số. Từ chối — nêu thống kê 32% lỗi DR và yêu cầu manifest ba file.

Quy tắc từ chối:
- Nếu chỉ có một vùng trong phạm vi, từ chối kế hoạch — một vùng có các chế độ lỗi khác (Giai đoạn 17 · 03 đề cập).
- Nếu lưu trú và SLA TTFT không tương thích (ví dụ: lưu trú EU buộc prefill trên tiền tố nguội cho mỗi yêu cầu với P99 TTFT < 100 ms trên prompt 8K), từ chối hứa hẹn SLA và chuyển yêu cầu sản phẩm lên cấp xử lý cao hơn.

Đầu ra: một kế hoạch một trang nêu bộ định tuyến, chính sách định tuyến, các phân vùng lưu trú, định hướng lớp CRI, manifest DR, người phụ trách diễn tập hằng quý. Kết thúc bằng chỉ số duy nhất cần cảnh báo: tỷ lệ trúng bộ nhớ đệm tiền tố xuyên vùng giảm xuống dưới ngưỡng được chỉ định trong kế hoạch.
