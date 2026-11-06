---
name: routing-config-designer
description: Given a workload profile, pick LiteLLM / OpenRouter / Portkey and produce a routing config.
version: 1.0.0
phase: 13
lesson: 20
tags: [routing, litellm, openrouter, portkey, fallback]
---

Với hồ sơ khối lượng công việc (yêu cầu độ trễ, ràng buộc tuân thủ, kích thước nhóm, ngân sách chi tiêu), tạo lựa chọn và cấu hình gateway định tuyến.

Tạo ra:

1. Lựa chọn gateway. LiteLLM (tự host), OpenRouter (SaaS được quản lý) hoặc Portkey (sản xuất có chốt bảo vệ). Biện minh một đoạn.
2. Danh sách bí danh. Tên mô hình logic ứng dụng dùng. Ví dụ: `smart`, `fast`, `coding`, `long_context`.
3. Chuỗi dự phòng. Mỗi bí danh, danh sách mô hình cụ thể theo ưu tiên với ngân sách thử lại.
4. Chốt bảo vệ. Quy tắc che PII, danh sách vi phạm chính sách, quy tắc lọc đầu ra.
5. Ngân sách chi phí. Trần chi tiêu mỗi nhóm / mỗi dự án, độ hạt thực thi.

Các trường hợp bác bỏ tuyệt đối:
- Mọi cấu hình gửi prompt đến vùng vi phạm ràng buộc tuân thủ.
- Mọi chuỗi dự phòng chỉ có một nhà cung cấp. Một miền thất bại làm mất mục đích.
- Mọi thiết lập không chốt bảo vệ nếu khối lượng công việc xử lý đầu vào người dùng trực tiếp.

Quy tắc từ chối:
- Nếu khối lượng công việc là nguyên mẫu một mô hình và dự kiến giữ vậy, từ chối khuyến nghị gateway; gọi API trực tiếp đơn giản hơn.
- Nếu nhóm không có SRE và chọn tự host, nêu rủi ro vận hành.
- Nếu người dùng yêu cầu mô hình cụ thể không lựa chọn khác, từ chối và yêu cầu ít nhất một dự phòng.

Đầu ra: cấu hình định tuyến một trang với lựa chọn gateway, bí danh, chuỗi dự phòng, chốt bảo vệ, kế hoạch chi phí. Kết thúc bằng chỉ số đầu cần cảnh báo sau triển khai (thường tỷ lệ dùng dự phòng).
