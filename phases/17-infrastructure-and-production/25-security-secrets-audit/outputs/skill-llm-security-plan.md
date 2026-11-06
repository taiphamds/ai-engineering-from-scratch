---
name: llm-security-plan
description: Produce an LLM security plan covering secrets vault, PII scrubbing with consistent tokenization, network egress allowlist, audit log retention, and zero-trust posture.
version: 1.0.0
phase: 17
lesson: 25
tags: [security, vault, hashicorp, aws-secrets-manager, pii, presidio, egress, audit-log, zero-trust, ci-cd-supply-chain]
---

Với phạm vi quy định (SOC 2, HIPAA, GDPR), hiện trạng thông tin xác thực và định hướng mạng/lưu lượng ra, tạo một kế hoạch bảo mật.

Tạo:

1. Chuyển sang vault. Chọn vault (HashiCorp, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager). Mẫu gateway: ứng dụng → gateway → vault lúc chạy. Ngừng dùng env ghi cứng và thông tin xác thực trong file cấu hình.
2. Quét bí mật. Bật TruffleHog / GitGuardian / Gitleaks trên mọi commit. Chặn PR khi phát hiện.
3. Chính sách luân chuyển. ≤ 90 ngày. Tự động ở nơi có thể. Luân chuyển riêng cho thông tin xác thực CI/CD (ngắn hơn — khuyến nghị 30 ngày).
4. Làm sạch PII. Nhận dạng thực thể (Presidio + regex). Token hóa nhất quán (cùng giá trị → cùng chỗ giữ chỗ) để giữ ngữ nghĩa.
5. Danh sách cho phép lưu lượng ra. Cho phép tên miền nhà cung cấp LLM, DB vector, endpoint vault. Trình phân giải danh sách cho phép DNS.
6. Log kiểm toán. Chỉ nối thêm, bất biến. Trường bắt buộc: người dùng, tenant, hash prompt/phản hồi, token, chi phí, lần kích hoạt chốt bảo vệ. Lưu giữ theo framework (SOC 2 1 năm / HIPAA 6 năm).
7. Giữ gìn CI/CD. Liên kết danh tính OIDC (không khóa đám mây tĩnh). Giới hạn phạm vi thông tin xác thực CI/CD hẹp. Trích dẫn sự cố chuỗi cung ứng Vercel năm 2026 làm động lực.

Các trường hợp loại bỏ dứt khoát:
- Khóa tĩnh trong file cấu hình. Từ chối.
- Lưu prompt thô trong log kiểm toán. Từ chối — chỉ hash trừ khi framework quy định yêu cầu tường minh cách khác.
- Cho phép lưu lượng ra đến `*` hoặc "internet." Từ chối — danh sách cho phép.

Quy tắc từ chối:
- Nếu không vault nào được khách hàng chấp nhận (yêu cầu cách ly mạng), từ chối kế hoạch thông thường và thiết kế dự phòng dựa trên file có luân chuyển. Ghi nhận tường minh rằng nó kém an toàn hơn.
- Nếu làm sạch PII bị từ chối vì lý do "độ trễ", từ chối — độ trễ thường <20 ms và rủi ro quy định lớn hơn nó rất nhiều.
- Nếu yêu cầu luân chuyển >90 ngày cho token gốc vault, từ chối — nó trở thành hướng xâm phạm.

Đầu ra: một kế hoạch một trang với vault, quét, luân chuyển, làm sạch, lưu lượng ra, log kiểm toán, định hướng CI/CD. Kết thúc bằng chỉ số duy nhất: số lượt phát hiện quét bí mật mỗi tháng; mục tiêu không.
