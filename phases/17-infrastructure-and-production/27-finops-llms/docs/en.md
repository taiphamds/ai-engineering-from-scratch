# FinOps for LLMs — Unit Economics and Multi-Tenant Attribution

> FinOps truyền thống thất bại với chi tiêu LLM. Chi phí là giao dịch token, không phải thời gian hoạt động tài nguyên. Thẻ không ánh xạ được — lệnh gọi API là giao dịch, không phải tài sản. Quyết định kỹ thuật (thiết kế prompt, cửa sổ ngữ cảnh, độ dài đầu ra) là quyết định tài chính. Cẩm nang năm 2026 có ba chiều quy chi phí cần đo đạc ngay ngày đầu: theo người dùng (`user_id`) cho định giá chỗ dùng và mở rộng, theo tác vụ (`task_id` + `route`) cho chi phí bề mặt sản phẩm và ưu tiên, theo tenant (`tenant_id`) cho tính kinh tế đơn vị và gia hạn. Bốn lớp token — prompt, công cụ, bộ nhớ, phản hồi — một nhóm duy nhất che giấu chi tiêu. Thang thực thi cho sản phẩm đa tenant: giới hạn tốc độ theo tenant (2-3x đỉnh dự kiến, 429 rõ ràng + retry-after); trần chi tiêu hằng ngày (1.5-3x trần hợp đồng; kích hoạt siết tốc độ + cảnh báo); công tắc ngắt khi z-score chi tiêu > 4 (tự tạm dừng + gọi người trực). Mẫu quy chi phí: gắn thẻ và tổng hợp, nối dữ liệu đo từ xa (ID dấu vết → hóa đơn; độ chính xác cao nhất), lấy mẫu và ngoại suy, phân bổ dựa trên mô hình, dựa trên sự kiện, truyền theo luồng thời gian thực. Chỉ số đơn vị: chi phí mỗi truy vấn được giải quyết, chi phí mỗi tạo tác được sinh — không phải $/M token. Gắn thẻ hồi tố luôn bỏ sót; đo đạc khi tạo yêu cầu.

**Type:** Learn
**Languages:** Python (stdlib, toy cost-attribution simulator with kill switch)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 14 (Caching)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích tại sao FinOps truyền thống (thẻ + tầng) thất bại với chi tiêu LLM và nêu ba chiều quy chi phí mới.
- Liệt kê bốn lớp token (prompt, công cụ, bộ nhớ, phản hồi) và tại sao tính phí một nhóm duy nhất che giấu chi phí.
- Thiết kế thang thực thi (tốc độ → trần chi tiêu → công tắc ngắt) cho một sản phẩm đa tenant.
- Chọn một chỉ số đơn vị (chi phí mỗi truy vấn được giải quyết / tạo tác) thay vì $/M token.

## The Problem

Hóa đơn của bạn ghi $40,000. Bạn không biết:
- Tenant nào đã chi.
- Tính năng sản phẩm nào thúc đẩy nó.
- Có người dùng riêng lẻ nào lạm dụng hay không.
- Phình prompt, lệnh gọi công cụ hay khuếch đại bộ nhớ là thủ phạm.

Gắn thẻ và tổng hợp phía nhà cung cấp hoạt động cho tài nguyên đám mây (EC2, S3) nơi thẻ lan truyền đến các mục hóa đơn. Lệnh gọi API LLM không tự gắn thẻ — bạn phải đóng dấu người dùng/tác vụ/tenant tại nơi gọi và mang theo xuyên suốt. Quy chi phí hồi tố luôn bỏ sót trường hợp biên.

## The Concept

### Three attribution dimensions

**Theo người dùng** (`user_id`): ai đang tốn bao nhiêu. Thúc đẩy định giá chỗ dùng, trao đổi mở rộng, xác định người dùng chuyên sâu.

**Theo tác vụ** (`task_id` + `route`): bề mặt sản phẩm nào tốn bao nhiêu. Thúc đẩy ưu tiên tính năng, quyết định loại bỏ tính năng đắt.

**Theo tenant** (`tenant_id`): khách hàng nào có lợi nhuận. Thúc đẩy tính kinh tế đơn vị, định giá gia hạn, ngưỡng tầng.

Đo đạc cả ba tại nơi gọi ngay ngày đầu. Hồi tố luôn tệ hơn.

### Four token layers

| Lớp | Ví dụ | % tổng điển hình |
|-------|---------|---------------------|
| Prompt | đầu vào hệ thống + người dùng | 40-60% |
| Công cụ | kết quả gọi công cụ đưa trở lại | 20-40% (khối lượng công việc agent) |
| Bộ nhớ | hội thoại trước / tài liệu được truy xuất | 10-30% |
| Phản hồi | đầu ra mô hình | 10-30% |

Gộp cả bốn vào cùng một nhóm làm tối ưu bị mù. Tách chúng trong schema quy chi phí của bạn.

### Enforcement ladder

1. **Giới hạn tốc độ** theo tenant. 2-3x đỉnh dự kiến. Trả 429 với `Retry-After`. Tenant thấy trở ngại; không hóa đơn bất ngờ.

2. **Trần chi tiêu hằng ngày** theo tenant. 1.5-3x trần hợp đồng. Kích hoạt: siết giới hạn tốc độ + cảnh báo bộ phận thành công khách hàng.

3. **Công tắc ngắt** khi z-score chi tiêu > 4 so với đường cơ sở tenant. Tự tạm dừng tenant; gọi người trực; chuyển cấp tới vận hành + CS.

### Attribution patterns

- **Gắn thẻ và tổng hợp**: đóng dấu header metadata; tổng hợp sau. Đơn giản; sơ bộ.
- **Bộ nối dữ liệu đo từ xa**: nối dấu vết với hóa đơn qua ID dấu vết. Độ chính xác cao nhất. Điều các nhóm trưởng thành làm.
- **Lấy mẫu + ngoại suy**: lấy mẫu 5-10%, nhân lên. Hiệu quả chi phí cho chi tiêu sơ bộ; bỏ sót phần đuôi.
- **Phân bổ dựa trên mô hình**: hồi quy để suy ra yếu tố chi phí. Cho dữ liệu cũ không có thẻ.
- **Dựa trên sự kiện**: chi phí dưới dạng sự kiện trong một luồng (Kafka / Kinesis). Thời gian thực.
- **Truyền theo luồng thời gian thực**: bảng điều khiển cập nhật dưới một giây.

### Cost per X is the unit metric

$/M token là cách nói của nhà cung cấp. Chỉ số sản phẩm:

- Chi phí mỗi phiếu hỗ trợ được giải quyết.
- Chi phí mỗi bài viết được tạo.
- Chi phí mỗi tác vụ agent thành công.
- Chi phí mỗi phút phiên người dùng.

Gắn chi phí với một kết quả sản phẩm. Nếu không, tối ưu không có điểm tựa.

### Cost attribution trace shape

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Phát trên mọi lệnh gọi. Lưu trong hồ dữ liệu. Tổng hợp theo chiều. Ngăn xếp khả năng quan sát Giai đoạn 17 · 13 là nơi chứa điều này.

### The compounded-savings stack

Kết hợp: bộ nhớ đệm + theo lô + định tuyến + gateway. Với cả bốn:
- Bộ nhớ đệm L2 (Giai đoạn 17 · 14): đầu vào rẻ hơn ~10x.
- Theo lô (Giai đoạn 17 · 15): giảm 50%.
- Định tuyến đến mô hình rẻ (Giai đoạn 17 · 16): giảm chi phí 60%.
- Hiệu quả gateway (Giai đoạn 17 · 19): dự phòng dư thừa + thử lại.

Kết hợp trường hợp tốt nhất: ~5-10% đường cơ sở đơn giản. Hầu hết nhóm có 2-3 đòn bẩy đang dùng; ít nhóm kết hợp cả bốn.

### Numbers you should remember

- Chiều quy chi phí: theo người dùng, theo tác vụ, theo tenant.
- Bốn lớp token: prompt, công cụ, bộ nhớ, phản hồi.
- Công tắc ngắt: z-score chi tiêu > 4.
- Chỉ số đơn vị: chi phí mỗi truy vấn được giải quyết, không phải $/M token.
- Tối ưu kết hợp: có thể ~5-10% đường cơ sở.

```figure
i4-spend-ladder
```

## Use It

`code/main.py` mô phỏng một dịch vụ LLM đa tenant với thang thực thi ba tầng. Chèn một tenant lạm dụng và minh họa công tắc ngắt kích hoạt.

## Ship It

Bài học này tạo ra `outputs/skill-finops-plan.md`. Với sản phẩm và quy mô, thiết kế schema quy chi phí và thang thực thi.

## Exercises

1. Chạy `code/main.py`. Ở z-score nào công tắc ngắt kích hoạt? Bạn chọn ngưỡng như thế nào?
2. Thiết kế bảng điều khiển chi phí theo tenant, theo tác vụ. 5 khung nhìn bạn xây đầu tiên là gì?
3. Tenant lớn nhất của bạn có tính kinh tế đơn vị âm. Đề xuất ba can thiệp theo thứ tự tác động khách hàng.
4. Tính chi phí mỗi phiếu hỗ trợ được giải quyết cho một sản phẩm hỗ trợ: 3M token/phiếu, ~800 phiếu/ngày, giá bộ nhớ đệm GPT-5.
5. Lập luận liệu gắn thẻ hồi tố có bao giờ hoạt động được không. Khi nào nó chấp nhận được?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Per-user attribution (Quy chi phí theo người dùng) | "chi phí cấp người dùng" | `user_id` được đóng dấu trên mọi lệnh gọi |
| Per-task attribution (Quy chi phí theo tác vụ) | "chi phí tính năng" | `task_id` + `route` xác định bề mặt sản phẩm |
| Per-tenant attribution (Quy chi phí theo tenant) | "chi phí khách hàng" | `tenant_id`; thúc đẩy tính kinh tế đơn vị |
| Four token layers (Bốn lớp token) | "các lớp chi phí" | prompt + công cụ + bộ nhớ + phản hồi |
| Rate limit (Giới hạn tốc độ) | "chốt 429" | Trần theo tenant thực thi tại gateway |
| Daily spend cap (Trần chi tiêu hằng ngày) | "trần hằng ngày" | Ngân sách theo phạm vi tenant với cảnh báo |
| Kill switch (Công tắc ngắt) | "tự tạm dừng" | Z-score chi tiêu > 4 kích hoạt tự đình chỉ |
| Cost per resolved (Chi phí mỗi trường hợp được giải quyết) | "chỉ số đơn vị sản phẩm" | Chi phí gắn với kết quả sản phẩm, không phải token |
| Telemetry joiner (Bộ nối dữ liệu đo từ xa) | "dấu vết đến hóa đơn" | Mẫu quy chi phí chính xác nhất |
| Stacked optimization (Tối ưu kết hợp) | "bộ nhớ đệm+theo lô+định tuyến+gateway" | Tiết kiệm cộng hưởng xuống ~5-10% đường cơ sở |

## Further Reading

- [FinOps Foundation — FinOps for AI Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Managed LLMs in Azure OpenAI](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
