# Model Routing as a Cost-Reduction Primitive

> Một bộ môi giới động đánh giá từng yêu cầu (loại tác vụ, độ dài token, độ tương đồng embedding, độ tin cậy) và gửi truy vấn đơn giản đến mô hình rẻ, chuyển truy vấn phức tạp lên mô hình tiên tiến hàng đầu. Cũng được gọi là xếp tầng mô hình. Các nghiên cứu tình huống sản xuất cho thấy giảm chi phí 20-60% ở cùng chất lượng trên các triển khai Mỹ/Anh/EU; cải thiện hiệu quả định tuyến 30% trên SaaS khối lượng lớn chuyển thành tiết kiệm hằng năm sáu chữ số. Bối cảnh năm 2026 là giá suy luận LLM giảm ~10x mỗi năm — một token tầm GPT-4 giảm từ $20/M xuống ~$0.40/M từ cuối năm 2022 đến 2026. Phần lớn mức giảm đến từ ngăn xếp phục vụ tốt hơn (Giai đoạn 17 · 04-09), không phải phần cứng. Định tuyến là cách bạn chuyển mức giảm giá đó thành biên lợi nhuận mà không làm sản phẩm suy giảm. Chế độ lỗi là độ trôi mô hình rẻ: tuyến đẩy 40% sang mô hình yếu hơn, chất lượng giảm 3-5% trên tác vụ suy luận, không ai nhận ra suốt một quý. Kiểm soát tuyến bằng chỉ số chất lượng trực tuyến, không chỉ bộ đánh giá ngoại tuyến.

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 19 (AI Gateways)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích xếp tầng mô hình: mô hình rẻ trước với kiểm tra độ tin cậy, chuyển cấp khi độ tin cậy thấp.
- Liệt kê bốn tín hiệu định tuyến (phân loại tác vụ, độ dài prompt, độ tương đồng embedding với tập đã biết là khó, độ tự tin từ lượt đầu).
- Tính chi phí pha trộn dự kiến ở tỷ lệ phân chia định tuyến mục tiêu và mức chấp nhận mất chất lượng.
- Nêu chỉ số giám sát độ trôi (cổng chất lượng trực tuyến) bắt được sự lấn dần của mô hình rẻ.

## The Problem

Dịch vụ của bạn tốn $80k/tháng trên GPT-5. Phân tích của bạn cho thấy 70% truy vấn đơn giản: "ở Paris là mấy giờ?" "diễn đạt lại câu này." Một mô hình tầm Haiku xử lý hoàn hảo những truy vấn đó với 3% chi phí. 30% cần khả năng suy luận của GPT-5 — lập trình, toán, lập kế hoạch nhiều bước.

Nếu bạn định tuyến 70% sang rẻ và 30% sang đắt, hóa đơn giảm ~65% ở cùng chất lượng sản phẩm. Đây là định tuyến. Bí quyết là xây bộ môi giới mà không làm chất lượng suy giảm.

## The Concept

### Four routing signals

1. **Phân loại tác vụ**: đơn giản/phức tạp/sinh mã/toán/trò chuyện. Có thể là bộ phân loại dựa trên quy tắc, một LLM nhỏ (tầm Haiku ở $0.25/M), hoặc độ tương đồng embedding với các nhóm có nhãn. Đầu ra: tuyến = rẻ / cân bằng / tiên tiến hàng đầu.

2. **Độ dài prompt**: prompt >4K token thường cần mô hình tiên tiến hàng đầu để mạch lạc. Prompt <500 token thường không cần.

3. **Độ tương đồng embedding với tập đã biết là khó**: nếu truy vấn gần (cosine > 0.88) một nhóm đã biết là khó, chuyển trực tiếp lên mô hình tiên tiến hàng đầu.

4. **Độ tự tin từ lượt đầu**: gửi đến mô hình rẻ; nếu log-prob của mô hình cho thấy độ tin cậy thấp HOẶC nó từ chối HOẶC xuất ra ngôn ngữ dè dặt, thử lại trên mô hình tiên tiến hàng đầu. Thêm độ trễ P95 trên ~10% lưu lượng nhưng tiết kiệm 50%+ trên 90% còn lại.

### Three patterns

**Định tuyến trước** (bộ phân loại phía trước): thêm độ trễ ~5-10ms; nhanh nhất tổng thể.

**Xếp tầng** (mô hình rẻ trước, chuyển cấp khi độ tin cậy thấp): độ trễ trung vị ~1.2x (chạy mô hình rẻ cộng xác minh), ~2x khi chuyển cấp. Sàn chất lượng tốt nhất.

**Tuyến tổ hợp** (chạy mô hình rẻ và tiên tiến hàng đầu song song trên một mẫu, mô hình phần thưởng chọn): chất lượng cao nhất, chi phí cao nhất; chỉ dùng cho A/B quan trọng.

### Implementation

Các gateway AI (Giai đoạn 17 · 19) cung cấp định tuyến. LiteLLM có cấu hình `router` với dự phòng và định tuyến chi phí. Portkey có các chốt bảo vệ + định tuyến. Kong AI Gateway có định tuyến dựa trên plugin. Chợ mô hình OpenRouter cung cấp một API khuyến nghị.

Mã nguồn mở: RouteLLM (LMSYS), Not Diamond (thương mại), Prompt Mule.

### The 2026 price curve

| Lớp mô hình | Cuối năm 2022 | 2026 | Thay đổi |
|-------------|-----------|------|--------|
| Chất lượng cấp GPT-4 | ~$20/M | ~$0.40/M | Rẻ hơn 50x |
| Tiên tiến hàng đầu (GPT-5, Claude 4) | — | ~$3-10/M | tầng mới |

Phần lớn cải thiện là hiệu quả phục vụ — các bài học cốt lõi trong Giai đoạn 17 · 04-09 chuyển thành giảm chi phí phía nhà cung cấp. Định tuyến cho phép bạn thu các lợi ích đó ở lớp ứng dụng thay vì chờ mọi người dùng chuyển sang gói rẻ.

### Drift is the real risk

Tuyến của bạn gửi 40% sang mô hình rẻ. Trong sáu tháng, phân phối tác vụ dịch chuyển (người dùng tinh vi hơn, hỏi câu dài hơn). Bộ định tuyến không nhận ra vì bộ phân loại của nó được huấn luyện trên dữ liệu Q1. Chất lượng âm thầm giảm. Không ai phàn nàn đủ lớn. Bạn phát hiện trong một phép đo chuẩn cạnh tranh mà bạn thua.

Kiểm soát tuyến bằng chỉ số chất lượng trực tuyến:

- Người dùng tán thành / không tán thành theo tuyến.
- LLM giám khảo tự động trên một mẫu giữ riêng (5%) theo tuyến.
- Tỷ lệ chuyển cấp: nếu xếp tầng đẩy lên tuyến cao hơn >30%, mô hình rẻ đang được định tuyến quá nhiều.
- Tỷ lệ từ chối theo tuyến.

### Numbers you should remember

- Tiết kiệm định tuyến năm 2026 ở cùng chất lượng: nghiên cứu tình huống 20-60%.
- Mức giảm giá LLM 2022-2026: tổng hợp ~10x mỗi năm.
- Cấp GPT-4 năm 2022 so với 2026: ~$20/M → ~$0.40/M.
- Tác động độ trễ xếp tầng: trung vị ~1.2x, chuyển cấp ~2x (~10% lưu lượng).

```figure
model-cascade-router
```

## Use It

`code/main.py` mô phỏng định tuyến trước, xếp tầng và tổ hợp trên khối lượng công việc hỗn hợp. Báo cáo chi phí pha trộn, mất chất lượng và tỷ lệ chuyển cấp.

## Ship It

Bài học này tạo ra `outputs/skill-router-plan.md`. Với khối lượng công việc và ngân sách chất lượng, chọn một mẫu định tuyến và các tín hiệu.

## Exercises

1. Chạy `code/main.py`. Ở sàn độ chính xác nào xếp tầng vượt định tuyến trước?
2. Tập người dùng của bạn là 30% doanh nghiệp (truy vấn phức tạp), 70% gói miễn phí (đơn giản). Thiết kế tỷ lệ phân chia định tuyến. Chỉ số trực tuyến nào kiểm soát nó?
3. Một tuyến giảm chất lượng 2% nhưng tiết kiệm 40%. Có triển khai không? Tùy sản phẩm — lập luận cả hai phía.
4. Triển khai kiểm tra độ tin cậy bằng logprobs từ API OpenAI / Anthropic. Ngưỡng bạn bắt đầu là gì?
5. Trong sáu tháng, tỷ lệ chuyển cấp tăng từ 8% lên 22%. Chẩn đoán ba nguyên nhân và giải pháp cho từng nguyên nhân.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Model routing (Định tuyến mô hình) | "bộ môi giới chi phí" | Lựa chọn mô hình động cho mỗi yêu cầu |
| Model cascade (Xếp tầng mô hình) | "rẻ trước chuyển cấp sau" | Chạy mô hình rẻ, chuyển sang mô hình tiên tiến hàng đầu khi độ tin cậy thấp |
| Pre-route (Định tuyến trước) | "phân loại trước" | Bộ phân loại phía trước; không chạy lại |
| Ensemble route (Tuyến tổ hợp) | "chọn song song" | Chạy nhiều mô hình, mô hình phần thưởng chọn tốt nhất |
| Escalation rate (Tỷ lệ chuyển cấp) | "% được chuyển lên" | Tỷ phần yêu cầu xếp tầng được chuyển cấp |
| RouteLLM | "bộ định tuyến LMSYS" | Thư viện bộ định tuyến OSS |
| Not Diamond | "bộ định tuyến thương mại" | Sản phẩm SaaS định tuyến mô hình |
| Drift (Độ trôi) | "sự lấn dần của mô hình rẻ" | Dịch chuyển phân phối mà bộ định tuyến không nhận ra |
| Online quality gate (Cổng chất lượng trực tuyến) | "kiểm tra trực tiếp" | LLM giám khảo tự động lấy mẫu lưu lượng trực tiếp |

## Further Reading

- [AbhyashSuchi — Model Routing LLM 2026 Best Practices](https://web.archive.org/web/20260413143335/https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/) — gateway đa mô hình với các thành phần định tuyến cơ bản.
