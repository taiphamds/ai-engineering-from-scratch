---
name: skill-cost-patterns
description: Decision framework for LLM cost optimization -- caching strategies, rate limiting, model routing, and budget controls
version: 1.0.0
phase: 11
lesson: 11
tags: [caching, cost-optimization, rate-limiting, model-routing, budget, llm-ops]
---

# LLM Cost Optimization Patterns

Khi xây ứng dụng LLM cần kiểm soát chi phí, áp dụng khung quyết định này.

## When to optimize

**Tối ưu ngay khi:**
- Chi LLM hằng tháng vượt $500 hoặc 10% ngân sách hạ tầng
- Chi phí mỗi truy vấn trên $0.01 cho sản phẩm tiêu dùng
- System prompt trên 1,000 token và được gửi với mọi yêu cầu
- Hơn 30% truy vấn trùng hoặc gần trùng
- Bạn đang mở rộng từ 100 đến 10,000+ người dùng hằng ngày

**Chưa tối ưu khi:**
- Bạn có dưới 100 DAU và vẫn xác thực độ phù hợp sản phẩm-thị trường
- Chi hằng tháng dưới $100 và tăng chậm
- Bạn vẫn đang lặp thiết kế prompt (cache khóa bạn vào một prompt)

## Caching strategy selection

### Exact caching

**Dùng khi:** temperature=0, prompt giống hệt lặp lại, cần đầu ra tất định.

```python
key = sha256(json.dumps({"model": m, "messages": msgs, "temp": 0}))
```

- Triển khai: 30 phút
- Tỷ lệ hit: 10-25% cho hầu hết ứng dụng, 40-60% cho bot FAQ
- Độ trễ: <1ms (tra dict)
- Rủi ro: phản hồi lỗi thời nếu dữ liệu bên dưới thay đổi

**Bỏ qua khi:** temperature > 0, mọi truy vấn duy nhất, cần dữ liệu thời gian thực.

### Semantic caching

**Dùng khi:** người dùng hỏi cùng câu bằng từ khác, sản phẩm nhiều FAQ, hỗ trợ khách hàng.

- Triển khai: 2-4 giờ (embedding + tương đồng + lưu trữ)
- Tỷ lệ hit: thêm 15-35% ngoài cache chính xác
- Độ trễ: 10-50ms (embedding + tìm ANN)
- Rủi ro: dương tính giả (trả câu trả lời cache sai cho câu hỏi tương tự nhưng khác)

**Hướng dẫn ngưỡng:**
- 0.98+: rất thận trọng, gần như không dương tính giả, tỷ lệ hit thấp hơn
- 0.95: cân bằng tốt cho hỏi đáp sự kiện
- 0.90: mạnh, tỷ lệ hit cao hơn nhưng có nguy cơ trả lời sai
- 0.85: chỉ cho ứng dụng ít hệ trọng (gợi ý, tự động hoàn thành)

**Bỏ qua khi:** mỗi truy vấn có ngữ cảnh riêng (sinh mã), phản hồi phải phản ánh dữ liệu mới nhất, không gian truy vấn không giới hạn.

### Provider prompt caching

**Dùng khi:** system prompt > 1,024 token (OpenAI) hoặc mức tối thiểu riêng mô hình, cùng tiền tố được gửi lặp.

| Nhà cung cấp | Hành động | Tiết kiệm |
|----------|--------|---------|
| Anthropic | Thêm `cache_control: {"type": "ephemeral"}` vào thông điệp hệ thống | 90% trên tiền tố cache (sau phụ phí ghi 25%) |
| OpenAI | Không làm gì (tự động) | 50% trên tiền tố cache |
| Google | Dùng Context Caching API với TTL rõ ràng | ~75% trên ngữ cảnh cache |

**Bỏ qua khi:** system prompt thay đổi mỗi yêu cầu, prompt dưới độ dài tối thiểu.

## Model routing rules

### Keyword-based (simple, fast)

```
simple:  <= 5 words OR matches FAQ keywords -> gpt-4o-mini ($0.15/$0.60)
medium:  general queries, summaries        -> claude-sonnet ($3/$15)
complex: "analyze", "compare", "debug"     -> gpt-4o ($2.50/$10)
```

- Triển khai: 1 giờ
- Độ chính xác: 70-80%
- Tiết kiệm: 40-60% chi phí mô hình

### Embedding-based (more accurate)

Nhúng 50-100 truy vấn gán nhãn mỗi loại. Phân loại truy vấn mới bằng láng giềng gần nhất.

- Triển khai: 4-8 giờ
- Độ chính xác: 85-92%
- Tiết kiệm: 50-70% chi phí mô hình
- Chi phí bổ sung: ~$0.02/1M token cho embedding phân loại (không đáng kể)

### ML-based (production grade)

Huấn luyện bộ phân loại nhỏ (hồi quy logistic hoặc BERT nhỏ) trên cặp truy vấn/mô hình lịch sử.

- Triển khai: 1-2 tuần
- Độ chính xác: 90-95%
- Tiết kiệm: 60-75% chi phí mô hình
- Cần: dữ liệu huấn luyện gán nhãn từ lưu lượng sản xuất

## Rate limiting configuration

### Token bucket parameters by tier

| Hạng | Kích thước xô | Tốc độ nạp | RPM tối đa | Trần hằng ngày |
|------|-------------|-------------|---------|-----------|
| Miễn phí | 50K token | 500/giây | 10 | 50K |
| Pro | 500K token | 5K/giây | 60 | 500K |
| Doanh nghiệp | 5M token | 50K/giây | 300 | 5M |

### Implementation checklist

1. Lưu xô trong Redis (không trong bộ nhớ) cho ứng dụng nhiều instance
2. Dùng thao tác nguyên tử (MULTI/EXEC) để ngăn race condition
3. Trả header `Retry-After` với phản hồi từ chối
4. Theo dõi yêu cầu bị từ chối như thước đo (>5% từ chối = giới hạn hạng quá chặt)
5. Triển khai suy giảm có kiểm soát: từ chối yêu cầu mô hình đắt trước, giữ truy cập mô hình rẻ

## Budget controls

### Three-threshold circuit breaker

| Ngưỡng | Hành động | Có thể đảo ngược |
|-----------|--------|------------|
| 70% ngân sách tháng | Ghi cảnh báo, báo nhóm qua Slack/PagerDuty | Có (tự động) |
| 85% ngân sách tháng | Định tuyến mọi lưu lượng sang mô hình rẻ nhất | Có (tự động, kỳ thanh toán tiếp) |
| 95% ngân sách tháng | Chỉ phục vụ phản hồi cache, từ chối lệnh gọi LLM mới | Có (đặt lại thủ công hoặc kỳ tiếp) |

### Per-user cost tracking

Theo dõi chi phí tích lũy mỗi người dùng. Đánh dấu người vượt 10x trung vị. Nguyên nhân phổ biến:
- Người dùng chuyên sâu hợp lệ (nâng hạng cho họ)
- Vòng lặp prompt injection (bot gửi yêu cầu tự động)
- Tích hợp kém hiệu quả (client thử lại trên mọi lỗi)

## Cost tracking fields

Ghi log mọi lệnh gọi API với các trường này:

```json
{
  "timestamp": "2026-04-02T10:30:00Z",
  "model": "gpt-4o",
  "input_tokens": 1523,
  "output_tokens": 487,
  "cached_input_tokens": 1024,
  "latency_ms": 1847,
  "cost_usd": 0.006142,
  "user_id": "user_abc123",
  "cache_status": "partial_hit",
  "request_category": "customer_support",
  "complexity_class": "medium",
  "routed_from": "gpt-4o"
}
```

### Key metrics to dashboard

- **Chi phí mỗi truy vấn** (P50, P95, P99) -- theo mô hình, tính năng, hạng người dùng
- **Tỷ lệ cache hit** -- chính xác so với ngữ nghĩa, xu hướng theo thời gian
- **Phân phối mô hình** -- % lưu lượng mỗi mô hình, chi phí mỗi mô hình
- **Tốc độ tiêu ngân sách** -- chi hiện tại so với dự báo tháng ở tốc độ hiện tại
- **Tỷ lệ từ chối** -- % yêu cầu bị giới hạn tần suất, theo hạng

## Common mistakes

| Sai lầm | Tại sao gây hại | Cách sửa |
|---------|-------------|-----|
| Cache với temperature > 0 | Đầu ra không tất định, cache cũ cho sai độ đa dạng | Chỉ cache lệnh gọi temp=0, hoặc chấp nhận phản hồi cache mất tính ngẫu nhiên |
| Ngưỡng cache ngữ nghĩa quá thấp | Trả sai cho truy vấn tương tự bề ngoài | Bắt đầu 0.95, chỉ giảm sau khi đo tỷ lệ dương tính giả |
| Không vô hiệu hóa cache | Phản hồi lỗi thời khi dữ liệu bên dưới đổi | Đặt TTL (1 giờ cho dữ liệu động, 24 giờ cho tĩnh), vô hiệu khi cập nhật dữ liệu |
| Định tuyến mọi lưu lượng sang mô hình rẻ nhất | Chất lượng giảm, người dùng nhận thấy | Định tuyến theo độ phức tạp, đo chất lượng mỗi hạng, đặt ngưỡng chất lượng tối thiểu |
| Không giới hạn mỗi người dùng | Một người lạm dụng đốt toàn ngân sách | Luôn triển khai hạn mức mỗi người dùng, dù rộng rãi |
| Bỏ qua token đầu ra | Đầu ra tốn hơn đầu vào 2-5x mỗi token | Đặt max_tokens thích hợp, dùng stop sequence, nén đầu ra |
| Cache trước khi prompt ổn định | Cache đầy phản hồi từ prompt cũ | Chỉ bật cache sau khi chốt prompt, xóa cache khi prompt đổi |

## Pricing reference (as of April 2026)

| Mô hình | Đầu vào ($/1M) | Đầu ra ($/1M) | Đầu vào cache ($/1M) | Tốt nhất cho |
|-------|-------------|--------------|--------------------|---------| 
| gpt-4.1-nano | $0.10 | $0.40 | $0.025 | Tác vụ đơn giản khối lượng cao |
| gpt-4o-mini | $0.15 | $0.60 | $0.075 | Định tuyến đơn giản, phân loại |
| gemini-2.5-flash | $0.15 | $0.60 | $0.0375 | Đa phương thức tiết kiệm |
| claude-haiku-3.5 | $0.80 | $4.00 | $0.08 | Tác vụ tầm trung nhanh |
| o4-mini | $1.10 | $4.40 | $0.275 | Suy luận tiết kiệm |
| gemini-2.5-pro | $1.25 | $10.00 | $0.3125 | Ngữ cảnh dài, đa phương thức |
| gpt-4o | $2.50 | $10.00 | $1.25 | Đa dụng, function calling |
| claude-sonnet-4 | $3.00 | $15.00 | $0.30 | Cân bằng chất lượng/chi phí |
| claude-opus-4 | $15.00 | $75.00 | $1.50 | Chất lượng tối đa, suy luận phức tạp |
