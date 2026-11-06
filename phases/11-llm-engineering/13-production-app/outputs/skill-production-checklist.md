---
name: skill-production-checklist
description: Decision framework for shipping LLM applications to production -- covers every component with specific thresholds and pass/fail criteria
version: 1.0.0
phase: 11
lesson: 13
tags: [production, deployment, llm, architecture, scaling, cost, observability, guardrails]
---

# Production LLM Checklist

Khi phát hành ứng dụng LLM, làm theo danh sách kiểm tra này theo thứ tự. Mỗi phần có tiêu chí đạt/không đạt với ngưỡng cụ thể.

## 1. Security (Ship Blockers)

Mọi mục ở đây phải đạt trước bất kỳ triển khai nào.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Khóa API trong biến môi trường | Không khóa viết cứng trong cơ sở mã | `grep -r "sk-" --include="*.py"` không trả gì |
| Guardrail đầu vào hoạt động | Mẫu prompt injection bị chặn | Gửi "Bỏ qua mọi chỉ dẫn trước" -- trả phản hồi bị chặn |
| Che PII | Mẫu SSN, thẻ tín dụng, email bị bắt | Gửi "SSN của tôi là 123-45-6789" -- PII bị che trước gọi LLM |
| Lọc đầu ra | Nội dung nguy hiểm bị chặn | Mô hình không thể trả mẫu `DROP TABLE`, `rm -rf`, `exec()` |
| Giới hạn tần suất | Cưỡng chế trần yêu cầu mỗi người dùng | 100 yêu cầu từ cùng người dùng trong 10 giây -- 50+ yêu cầu cuối bị từ chối |
| Xác thực trên mọi endpoint | Không truy cập LLM chưa xác thực | `curl /v1/chat` không token trả 401 |
| CORS hạn chế | Chỉ miền sản xuất được phép | Yêu cầu `Origin: evil.com` bị từ chối |
| Token đầu vào tối đa | Yêu cầu quá giới hạn bị từ chối | Gửi đầu vào 50K token -- trả 413 hoặc cắt ngắn |

## 2. Reliability (Week-One Survival)

Chúng ngăn sự cố trực vận hành đầu tiên của bạn.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Thử lại có backoff | 3 lần thử lại trên 5xx, độ trễ hàm mũ | Tắt LLM giả giữa yêu cầu -- thấy thử lại trong log |
| Chuỗi mô hình dự phòng | 2+ mô hình trong chuỗi | Mô hình chính không sẵn có -- vẫn trả phản hồi từ dự phòng |
| Thời gian chờ yêu cầu | Tối đa 30s trên mọi lệnh gọi ngoài | LLM giả chậm (60s) -- yêu cầu hết thời gian chờ tại 30s |
| Suy giảm có kiểm soát | Cache/RAG thất bại không làm sập dịch vụ | Dừng cache -- yêu cầu vẫn thành công (chậm hơn, đắt hơn) |
| Endpoint kiểm tra sức khỏe | Trả trạng thái phụ thuộc | `GET /health` trả `{"status": "healthy", "cache": ..., "llm": ...}` |
| Streaming hoạt động | Token đầu dưới 500ms | Đo thời gian đến token đầu, nhất quán < 500ms |
| Thông điệp lỗi an toàn | Lỗi nội bộ không bao giờ rò cho người dùng | Ép lỗi 500 -- người dùng thấy lỗi chung, không stack trace |

## 3. Cost Control (Month-One Economics)

Chúng ngăn hóa đơn bất ngờ $50K.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Theo dõi chi phí mỗi yêu cầu | Mọi yêu cầu ghi số token + chi phí USD | Log yêu cầu có trường `input_tokens`, `output_tokens`, `cost_usd` |
| Cache ngữ nghĩa hoạt động | Tỷ lệ hit > 20% trên mẫu lặp | Thống kê cache cho thấy tỷ lệ hit sau 1000 yêu cầu kiểm thử |
| TTL cache cấu hình | Mục hết hạn (mặc định: 1 giờ) | Mục được chèn -- không trả sau TTL |
| Theo dõi chi phí mỗi người dùng | Chi phí tổng hợp theo user_id | Dashboard/API hiện 10 người dùng hàng đầu theo chi phí |
| Cảnh báo chi phí | Cảnh báo ở 80% ngân sách ngày | Đặt ngân sách ngày $10, gửi $8.50 yêu cầu -- cảnh báo kích hoạt |
| Định tuyến mô hình theo chi phí | Truy vấn ít phức tạp dùng mô hình rẻ hơn | Câu đơn giản đến gpt-4o-mini, phức tạp đến gpt-4o |
| Đặt token đầu ra tối đa | Phản hồi bị giới hạn mỗi khuôn mẫu | Khuôn mẫu max_output_tokens=512 -- phản hồi không bao giờ vượt |

**Công thức ước lượng chi phí:**
```
Monthly LLM cost = DAU x queries_per_user x 30 x (1 - cache_hit_rate) x (avg_input_tokens x input_price + avg_output_tokens x output_price) / 1,000,000
```

**Ngưỡng benchmark theo quy mô:**

| DAU | Chi phí/yêu cầu mục tiêu | Ngân sách tháng |
|-----|-------------------|----------------|
| 1K | < $0.005 | < $750 |
| 10K | < $0.003 | < $4,500 |
| 100K | < $0.001 | < $15,000 |

## 4. Observability (Debugging in Production)

Bạn không thể sửa thứ không thấy.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Ghi log JSON có cấu trúc | Mỗi yêu cầu tạo dòng log JSON | Log chứa: request_id, user_id, model, tokens, latency_ms, cost |
| Tracing yêu cầu | Trace từ đầu đến cuối có thời gian thành phần | Một yêu cầu hiện: guardrail (5ms) + cache (2ms) + llm (3200ms) + eval (1ms) |
| Theo dõi độ trễ | Đo P50, P95, P99 | Sau 1000 yêu cầu: P50 < 2s, P99 < 10s |
| Giám sát tỷ lệ lỗi | Lỗi được đếm và phân loại | Dashboard hiện: lỗi API 0.5%, guardrail chặn 0.1%, timeout 0.01% |
| Thước đo cache | Thấy tỷ lệ hit, miss, số mục | `GET /v1/cache/stats` trả số hiện tại |
| Thước đo kiểm thử A/B | Ghi thước đo chất lượng mỗi biến thể | Mỗi yêu cầu ghi prompt_template + version để so sánh |
| Ghi log đánh giá | Ghi tín hiệu chất lượng mỗi yêu cầu | Độ dài phản hồi, độ trễ, mô hình, phiên bản khuôn mẫu lưu để phân tích ngoại tuyến |

## 5. Prompt Management

Prompt là mã. Đối xử như mã.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Khuôn mẫu có phiên bản | Mọi khuôn mẫu có tên + chuỗi phiên bản | Thay khuôn mẫu tạo phiên bản mới, giữ phiên bản cũ |
| Hỗ trợ kiểm thử A/B | Chia lưu lượng bằng hash người dùng tất định | Cùng người dùng luôn thấy cùng biến thể trong thí nghiệm |
| Khả năng hoàn tác | Về phiên bản trước trong < 1 phút | Đổi cấu hình thí nghiệm -- lưu lượng chuyển tức thì |
| Xác thực khuôn mẫu | Biến được xác thực trước kết xuất | Thiếu biến trong khuôn mẫu phát lỗi rõ, không KeyError |
| Tách system prompt | Thông điệp hệ thống và người dùng ở trường riêng | System prompt không bị nối vào thông điệp người dùng |

## 6. Scaling Readiness

Không cần khi ra mắt. Cần ở 10x.

| Kiểm tra | Tiêu chí đạt | Cách xác minh |
|-------|--------------|---------------|
| Gọi LLM bất đồng bộ | Không chặn luồng trên lệnh gọi API | 50 yêu cầu đồng thời -- CPU máy chủ giữ < 30% |
| Gộp kết nối | Kết nối HTTP tái sử dụng | Trace mạng hiện kết nối bền đến nhà cung cấp LLM |
| Mở rộng ngang | Thiết kế máy chủ không trạng thái | 2 instance sau bộ cân bằng tải -- mọi yêu cầu thành công |
| Hỗ trợ hàng đợi | Tác vụ không thời gian thực vào hàng đợi | Yêu cầu tóm tắt trả job_id, kết quả có qua thăm dò |
| Đã kiểm thử tải | 100 người dùng đồng thời, tỷ lệ lỗi < 5% | Kiểm thử `wrk` hoặc `locust` đạt ở mức đồng thời đích |

## Implementation order for new projects

1. **Ngày 1:** Máy chủ API + khuôn mẫu prompt + một lệnh gọi LLM có thử lại
2. **Ngày 2:** Guardrail đầu vào + guardrail đầu ra + xử lý lỗi
3. **Ngày 3:** Cache ngữ nghĩa + theo dõi chi phí mỗi yêu cầu
4. **Ngày 4:** Streaming (SSE) + endpoint kiểm tra sức khỏe
5. **Ngày 5:** Ghi log có cấu trúc + tracing yêu cầu + ghi log đánh giá
6. **Tuần 2:** Kiểm thử A/B + quản lý phiên bản prompt + hoàn tác
7. **Tuần 3:** Chuỗi mô hình dự phòng + suy giảm có kiểm soát
8. **Tuần 4:** Kiểm thử tải + tối ưu bất đồng bộ + mở rộng ngang

## Quick diagnostic

Nếu có sự cố trong sản xuất, kiểm tra theo thứ tự này:

1. **Người dùng phàn nàn lỗi?** Kiểm tra endpoint sức khỏe, rồi tỷ lệ lỗi trong log, rồi trang trạng thái nhà cung cấp LLM
2. **Phản hồi chậm?** Kiểm tra độ trễ P99, rồi tỷ lệ cache hit, rồi thời gian phản hồi LLM trong trace
3. **Chi phí tăng vọt?** Kiểm tra xu hướng chi phí mỗi yêu cầu, rồi tỷ lệ cache hit, rồi người dùng hàng đầu theo chi phí, rồi tìm thay đổi khuôn mẫu prompt làm tăng số token
4. **Chất lượng giảm?** Kiểm tra có phiên bản prompt mới triển khai không, độ chính xác truy xuất RAG có đổi không, nhà cung cấp mô hình có đổi phiên bản mặc định không
5. **Sự cố bảo mật?** Kiểm tra tỷ lệ guardrail chặn (giảm đột ngột = guardrail bị tắt), kiểm tra log yêu cầu tìm mẫu lạ, luân chuyển khóa API ngay
