# Security — Secrets, API Key Rotation, Audit Logs, Guardrails

> Loại bỏ tình trạng bí mật nằm rải rác qua vault tập trung (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault). Không bao giờ lưu thông tin xác thực trong file cấu hình, file env trong VCS, bảng tính. Dùng vai trò IAM thay vì khóa tĩnh; OIDC cho CI/CD. Mẫu gateway AI là giải pháp năm 2026: ứng dụng → gateway → nhà cung cấp mô hình, với gateway lấy thông tin xác thực từ vault lúc chạy. Luân chuyển trong vault và mọi ứng dụng nhận cập nhật trong vài phút — không triển khai lại, không tin nhắn Slack "ai có khóa mới". Chính sách luân chuyển ≤90 ngày; quét bằng TruffleHog / GitGuardian / Gitleaks trên mọi commit. Không tin cậy mặc định: MFA, SSO, RBAC/ABAC, token thời hạn ngắn, trạng thái thiết bị. Làm sạch PII dùng nhận dạng thực thể để che PHI/PII trước khi chuyển tiếp; token hóa nhất quán (cách tiếp cận Mesh) ánh xạ giá trị nhạy cảm sang chỗ giữ chỗ ổn định để LLM giữ ngữ nghĩa mã/quan hệ. Lưu lượng mạng ra: dịch vụ LLM trong subnet VPC/VNet dành riêng chỉ cho phép `api.openai.com`, `api.anthropic.com` v.v.; chặn mọi lưu lượng ra khác. Nguyên nhân sự cố năm 2026: tấn công chuỗi cung ứng Vercel qua thông tin xác thực CI/CD bị xâm phạm đã đánh cắp biến môi trường trên hàng nghìn triển khai khách hàng.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Liệt kê bốn phản mẫu quản lý bí mật (file cấu hình trong VCS, env ghi cứng, bảng tính, khóa tĩnh) và nêu thứ thay thế chúng.
- Giải thích mẫu gateway AI lấy từ vault như tiêu chuẩn sản xuất năm 2026.
- Triển khai bộ làm sạch PII với token hóa nhất quán (cùng giá trị → cùng chỗ giữ chỗ) để ngữ nghĩa được giữ lại.
- Nêu sự cố chuỗi cung ứng Vercel năm 2026 và điều nó dạy về giữ gìn thông tin xác thực CI/CD.

## The Problem

Một thực tập sinh commit `.env` có khóa API. Họ nhanh chóng xóa nó. Các khóa đã nằm trong lịch sử git — quét GitGuardian bắt được, quy trình luân chuyển của bạn là "nhắn Slack cho nhóm, cập nhật 40 file cấu hình, triển khai lại mọi dịch vụ." 8 giờ sau, một nửa dịch vụ đã hoạt động và một nửa đang chờ cửa sổ triển khai.

Riêng biệt, prompt người dùng chứa "SSN của tôi là 123-45-6789." Prompt đi đến OpenAI. Bạn có BAA nhưng chính sách nội bộ là che PII trước khi chuyển tiếp. Bạn đã không làm.

Riêng biệt, pod LLM trong cụm EKS của bạn có thể đến bất kỳ máy chủ internet nào. Ai đó đánh cắp dữ liệu qua tra cứu DNS đến một tên miền do kẻ tấn công kiểm soát. Không có gì chặn nó.

Bảo mật cho dịch vụ LLM phải giải quyết cả ba hướng. Thông tin xác thực dựa trên vault. Làm sạch PII. Lọc lưu lượng mạng ra. Log kiểm toán.

## The Concept

### Centralized vault + IAM-role pull

**Vault**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager. Một nguồn sự thật duy nhất.

**Vai trò IAM**: ứng dụng/gateway xác thực qua danh tính IAM của nó, không phải khóa tĩnh. Vault trả bí mật cho thời gian tồn tại của token.

**Mẫu gateway AI**: gateway lấy `OPENAI_API_KEY` từ vault tại thời điểm yêu cầu. Luân chuyển trong vault; yêu cầu tiếp theo nhận khóa mới. Không triển khai lại.

### Rotation policy ≤ 90 days

Mọi khóa API, token gốc vault, thông tin xác thực CI/CD. Luân chuyển tự động ở nơi có thể. Luân chuyển thủ công được ghi log và theo dõi.

### Secret scanning

- **TruffleHog** — regex + entropy trên commit.
- **GitGuardian** — thương mại, độ chính xác cao.
- **Gitleaks** — OSS, chạy trong CI.

Chạy trên mọi commit. Chặn PR nếu phát hiện bí mật mới.

### Zero-trust posture

- Bắt buộc MFA trên mọi tài khoản.
- SSO qua SAML/OIDC.
- RBAC (dựa trên vai trò) hoặc ABAC (dựa trên thuộc tính) cho truy cập chi tiết.
- Token thời hạn ngắn (giờ, không phải ngày).
- Trạng thái thiết bị — chỉ thiết bị công ty có mã hóa đĩa.

### PII / PHI scrubbing

Trước khi prompt rời hạ tầng của bạn:

1. Nhận dạng thực thể (spaCy NER, Presidio, thương mại).
2. Che các thực thể khớp: `"My SSN is 123-45-6789"` → `"My SSN is [SSN_TOKEN_A3F]"`.
3. Token hóa nhất quán (cách tiếp cận Mesh): cùng giá trị ánh xạ đến cùng chỗ giữ chỗ để LLM giữ các quan hệ.
4. Ánh xạ ngược tùy chọn cho phản hồi LLM.

Bộ lọc regex tĩnh bắt các mẫu cơ bản; NER bắt nhiều hơn. Dùng cả hai.

### Input + output guardrails

Đầu vào: chặn jailbreak đã biết, chủ đề cấm; giới hạn tốc độ theo người dùng.

Đầu ra: làm sạch bằng regex để tìm bí mật bị lộ (mẫu khóa API, mẫu email trong ngữ cảnh từ chối), bộ phân loại cho vi phạm chính sách.

### Network egress whitelist

Dịch vụ LLM trong một subnet dành riêng:
- Danh sách cho phép: `api.openai.com`, `api.anthropic.com`, endpoint DB vector, endpoint vault.
- Mọi thứ khác: loại bỏ.
- DNS qua trình phân giải chỉ danh sách cho phép (tránh đánh cắp qua đường hầm DNS).

### Audit log

Log bất biến của mọi lệnh gọi LLM với:
- Dấu thời gian.
- Người dùng / tenant.
- Hash prompt (không phải prompt thô vì quyền riêng tư).
- Mô hình + phiên bản.
- Số lượng token.
- Chi phí.
- Hash phản hồi.
- Mọi lần chốt bảo vệ kích hoạt.

Lưu giữ theo yêu cầu quy định (SOC 2 1 năm, HIPAA 6 năm).

### The 2026 Vercel incident

Tấn công chuỗi cung ứng: thông tin xác thực CI/CD bị xâm phạm đã đánh cắp biến môi trường trên hàng nghìn triển khai khách hàng. Bài học: thông tin xác thực CI/CD tương đương sản xuất. Lưu trong vault. Giới hạn phạm vi hẹp. Luân chuyển quyết liệt.

### Numbers you should remember

- Chính sách luân chuyển: ≤ 90 ngày.
- Quét trên mọi commit: TruffleHog / GitGuardian / Gitleaks.
- Vercel 2026: thông tin xác thực CI/CD bị xâm phạm → hàng nghìn biến môi trường khách hàng bị lộ.
- Lưu giữ log kiểm toán: SOC 2 = 1 năm, HIPAA = 6 năm.

```figure
i4-vault-rotation
```

## Use It

`code/main.py` triển khai một bộ làm sạch PII đơn giản với token hóa nhất quán và log kiểm toán chỉ nối thêm.

## Ship It

Bài học này tạo ra `outputs/skill-llm-security-plan.md`. Với phạm vi quy định và hiện trạng, lập kế hoạch chuyển sang vault, bộ làm sạch, lưu lượng ra, log kiểm toán.

## Exercises

1. Chạy `code/main.py`. Gửi hai prompt tham chiếu cùng SSN. Xác nhận cả hai nhận cùng chỗ giữ chỗ.
2. Thiết kế chính sách lưu lượng mạng ra cho một triển khai vLLM trên EKS gọi OpenAI + Anthropic + Weaviate.
3. Bạn phát hiện một khóa trong lịch sử git (cũ 2 năm). Phản ứng đúng là gì — luân chuyển khóa, làm sạch lịch sử, hay cả hai? Giải thích.
4. Log kiểm toán của bạn tăng 10 GB/ngày. Thiết kế các tầng lưu giữ (nóng 30 ngày, ấm 12 tháng, nguội 6 năm).
5. Lập luận liệu token hóa ngược (thay giá trị thực trở lại phản hồi LLM) có đáng với độ phức tạp so với giữ chỗ giữ chỗ hiển thị hay không.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Vault | "kho bí mật" | Dịch vụ quản lý thông tin xác thực tập trung |
| IAM role (Vai trò IAM) | "xác thực dựa trên danh tính" | Vai trò được ứng dụng đảm nhận; trả thông tin xác thực thời hạn ngắn |
| OIDC for CI/CD (OIDC cho CI/CD) | "token do đám mây cấp" | Không khóa tĩnh trong CI — danh tính qua OIDC |
| TruffleHog / GitGuardian / Gitleaks | "bộ quét bí mật" | Phát hiện bí mật lúc commit |
| RBAC / ABAC | "kiểm soát truy cập" | Dựa trên vai trò so với dựa trên thuộc tính |
| PII scrubbing (Làm sạch PII) | "che dữ liệu" | Loại bỏ hoặc token hóa thực thể nhạy cảm |
| Consistent tokenization (Token hóa nhất quán) | "chỗ giữ chỗ ổn định" | Cùng giá trị → cùng token mỗi lần |
| Mesh approach (Cách tiếp cận Mesh) | "token hóa Mesh" | Mẫu token hóa giữ ngữ nghĩa |
| Egress whitelist (Danh sách cho phép lưu lượng ra) | "danh sách cho phép chiều ra" | Chỉ tên miền được phép mới đến được |
| Audit log (Log kiểm toán) | "lịch sử bất biến" | Bản ghi chỉ nối thêm để tuân thủ |

## Further Reading

- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) — phát hiện và ẩn danh PII.
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
