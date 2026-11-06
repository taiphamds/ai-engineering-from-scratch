---
name: gateway-picker
description: Pick an AI gateway (LiteLLM, Portkey, Kong AI, Cloudflare/Vercel) given scale, latency budget, compliance, ops posture, and pricing tolerance.
version: 1.0.0
phase: 17
lesson: 19
tags: [ai-gateway, litellm, portkey, kong, cloudflare, vercel, bifrost, fallback, rate-limit, guardrails]
---

Với RPS (hiện tại và dự kiến 12 tháng), ngân sách độ trễ, tuân thủ (bắt buộc tự lưu trữ?), nhu cầu chốt bảo vệ (che PII, phát hiện jailbreak, kiểm toán) và mức chấp nhận giá, tạo một khuyến nghị gateway.

Tạo:

1. Gateway chính. Nêu công cụ. Giải thích bằng trần RPS, chi phí phụ và mức phù hợp tính năng.
2. Chuỗi dự phòng. Ba nhà cung cấp theo thứ tự; OpenAI → Anthropic → tự lưu trữ là điển hình. Tính tính khả dụng dự kiến.
3. Chính sách giới hạn tốc độ. Khuyến nghị cửa sổ trượt ở >500 RPS; ngoài ra token-bucket chấp nhận được. Phân tầng theo tenant.
4. Chốt bảo vệ. Portkey nếu yêu cầu PII/jailbreak; Kong nếu cần quy mô + chốt bảo vệ; LiteLLM nếu chỉ gói phát triển.
5. Bàn giao khả năng quan sát. Trỏ đến lựa chọn Giai đoạn 17 · 13; xác nhận các quy ước OTel GenAI đi xuyên suốt.
6. Chuyển đổi. Nếu chuyển từ tích hợp cấp ứng dụng, triển khai theo giai đoạn (canary 1% trên gateway, mở rộng khi thành công).

Các trường hợp loại bỏ dứt khoát:
- LiteLLM ở >2000 RPS. Từ chối — phép đo chuẩn Kong cho thấy lỗi dây chuyền; chuyển đổi trước.
- Portkey với SLA TTFT P99 < 100 ms. Từ chối — chi phí phụ 30 ms ăn quá nhiều ngân sách.
- Cloudflare AI Gateway cho khách hàng tại chỗ chịu quản lý theo quy định. Từ chối — chỉ được quản lý; không tự lưu trữ.

Quy tắc từ chối:
- Nếu mức mơ hồ quy mô lớn (hiện tại 100 RPS, dự kiến 2K+ trong 6 tháng), yêu cầu kế hoạch chuyển đổi trước khi cam kết LiteLLM.
- Nếu tuân thủ yêu cầu SOC 2 Type II và gateway được chọn chỉ OSS không có SLA được quản lý, yêu cầu chứng thực SOC 2 riêng của khách hàng.
- Nếu nhóm không có Kubernetes và chọn Kong tự lưu trữ, từ chối — khuyến nghị Kong được quản lý hoặc Portkey được quản lý.

Đầu ra: một quyết định một trang với gateway, chuỗi dự phòng, chính sách giới hạn tốc độ, định hướng chốt bảo vệ, luồng khả năng quan sát, kế hoạch chuyển đổi. Kết thúc bằng một chỉ số: độ trễ gateway P99 trong giờ qua; cảnh báo khi vi phạm.
