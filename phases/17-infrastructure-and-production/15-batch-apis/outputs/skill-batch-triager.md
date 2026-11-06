---
name: batch-triager
description: Triage LLM workloads into interactive / semi-interactive / batch lanes, compute stacked discount (batch + cache) savings, and flag mis-triaged workloads.
version: 1.0.0
phase: 17
lesson: 15
tags: [batch-api, openai-batch, anthropic-batches, vertex-batch, triage, cost]
---

Với một khối lượng công việc (tên, kỳ vọng độ trễ của người dùng, lượng lưu lượng, cấu trúc prompt chung), tạo một kế hoạch phân loại + chi phí.

Tạo:

1. Làn. Tương tác (bị giới hạn bởi TTFT, đồng bộ), bán tương tác (vài phút là được, hàng đợi bất đồng bộ), hoặc theo lô (trước buổi sáng là được, API xử lý theo lô). Giải thích bằng kỳ vọng cụ thể của người dùng.
2. Chi phí hiện tại. Tính chi phí hằng tháng ở cấu hình hiện tại (đồng bộ, không bộ nhớ đệm, v.v.).
3. Chi phí mục tiêu. Tính chi phí sau cấu hình khuyến nghị (theo lô + bộ nhớ đệm hoặc đồng bộ + bộ nhớ đệm). Biểu thị bằng % hiện tại.
4. Kế hoạch chuyển đổi. Các bước riêng theo nhà cung cấp (chọn nhà cung cấp khớp mô hình của khối lượng công việc, không phải cả hai):
   - OpenAI: chuyển sang `/v1/batches`. Lưu bộ nhớ đệm prompt được bật tự động cho prompt đủ điều kiện (≥1024 token) — không có `cache_control` để đặt. Tùy chọn truyền `prompt_cache_key` để quy chi phí chặt hơn.
   - Anthropic: chuyển sang Message Batches. Tái sử dụng bộ nhớ đệm yêu cầu các block `cache_control` tường minh (ví dụ: `{"type": "ephemeral"}`) trên các đoạn prompt có thể lưu bộ nhớ đệm; giảm giá theo lô kết hợp với giá đọc bộ nhớ đệm.
   - Cả hai: thiết lập webhook thành công/thất bại và một làn tràn sang đồng bộ cho các lô lỡ cửa sổ hoàn thành.
5. Rủi ro. Nếu thời gian hoàn thành lô là 20 giờ ở P99 thì sao? Nêu hành vi hệ thống hạ nguồn (gửi email, hàng đợi tràn sang đồng bộ).
6. Đại lượng quan sát. Chỉ số bắt được phân loại sai: độ trễ hoàn thành tác vụ theo lô P95; cảnh báo nếu > 12 giờ.

Các trường hợp loại bỏ dứt khoát:
- Chạy pipeline qua đêm ở chế độ đồng bộ mà không xử lý theo lô khi người dùng chỉ cần độ trễ "trước buổi sáng." Từ chối — chỉ ra ~90% chi tiêu rò rỉ.
- Hứa hẹn xử lý theo lô cho bất cứ thứ gì người dùng kỳ vọng dưới 15 phút. Từ chối — SLA theo lô là 24 giờ.
- Bỏ qua lưu bộ nhớ đệm prompt trên khối lượng công việc theo lô có system prompt chung. Từ chối — giảm giá kết hợp là điểm mấu chốt.

Quy tắc từ chối:
- Nếu khối lượng công việc được quảng bá là "thời gian thực" nhưng kỳ vọng thực tế của người dùng là vài phút, yêu cầu xác nhận tường minh trước khi khuyến nghị xử lý theo lô.
- Nếu khối lượng công việc nhắm nhà cung cấp không có lưu bộ nhớ đệm prompt trong xử lý theo lô (ví dụ: bất kỳ ngăn xếp tùy chỉnh hoặc tự lưu trữ nào không có tái sử dụng tiền tố KV), ghi nhận rằng chỉ giảm giá theo lô áp dụng và tính lại không có tiết kiệm kết hợp. Lưu bộ nhớ đệm theo lô OpenAI là tự động; lưu bộ nhớ đệm theo lô Anthropic yêu cầu các block `cache_control` tường minh.
- Nếu khối lượng công việc có SLA độ trễ nghiêm ngặt (ví dụ: P99 < 60s), từ chối xử lý theo lô hoàn toàn — nó thuộc một làn khác.

Đầu ra: một bản phân loại một trang với làn, chi phí hiện tại, chi phí mục tiêu, các bước chuyển đổi, rủi ro, đại lượng quan sát. Kết thúc bằng nhịp: phân loại lại mọi khối lượng công việc hằng quý khi bề mặt sản phẩm thay đổi.
