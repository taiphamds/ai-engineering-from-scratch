---
name: spec-decode-picker
description: Pick a speculative decoding strategy (vanilla / Medusa / EAGLE / lookahead) and tuning parameters for a new LLM inference workload.
version: 1.0.0
phase: 7
lesson: 16
tags: [inference, decoding, latency, speculative, optimization]
---

# Speculative Decoding Picker

Giúp một kỹ sư chọn giữa giải mã suy đoán nguyên bản, Medusa, EAGLE hoặc lookahead và tinh chỉnh `N` (độ dài nháp) cho một khối lượng công việc cụ thể.

## Inputs to gather

1. **Mô hình xác minh** — LLM nào tạo đầu ra cuối. Kích thước quan trọng (chi phí nháp phải < chi phí bộ xác minh để tăng tốc).
2. **Loại khối lượng công việc** — mã, trò chuyện, đầu ra có cấu trúc, tóm tắt. Quyết định tỷ lệ chấp nhận.
3. **Chiến lược lấy mẫu** — tham lam, T thấp, T cao, beam. Lấy mẫu T cao làm giảm chấp nhận.
4. **Phần cứng đích** — ngân sách bộ nhớ quyết định bạn có thể chứa một mô hình nháp riêng không.
5. **Ngân sách kỹ thuật** — Medusa và EAGLE cần fine-tuning; nguyên bản và lookahead không cần.
6. **Mục tiêu độ trễ** — trò chuyện tương tác (<500ms TTFT, <50ms mỗi token) so với batch (ưu tiên thông lượng).

## Decision rules

- **Bắt đầu nhanh, không huấn luyện**: nháp nguyên bản với một mô hình cùng họ 1B–3B. Thường 2×.
- **Bạn có thể fine-tune**: EAGLE-2 hoặc EAGLE-3 dùng các trạng thái ẩn của bộ xác minh. Thường 3–4×.
- **Bạn có thể fine-tune nhưng không thể chạy hai mô hình**: Medusa (các head bổ sung trên bộ xác minh). 2–3×.
- **Không ngân sách huấn luyện, không có mô hình nháp**: lookahead decoding. 1.3–1.6×.
- **Phục vụ nặng batch**: batching liên tục quan trọng hơn; lợi ích suy đoán giảm khi batch tăng vì bộ xác minh đã bão hòa.
- **Temperature cao hoặc lấy mẫu ngẫu nhiên**: chấp nhận giảm mạnh. Cân nhắc N thấp hơn (2–3) hoặc tắt.
- **Đầu ra có cấu trúc (JSON, mã)**: chấp nhận cao. Đẩy N lên 7+ để tăng tốc tối đa.

## Tuning

- **N (độ dài nháp)**: bắt đầu tại 5. Đo chấp nhận. Nếu α > 0.9, đẩy lên 7. Nếu α < 0.6, giảm xuống 3.
- **Temperature nháp**: khớp temperature của bộ xác minh. Lấy mẫu nháp không khớp làm mất α.
- **Độ sâu cây (EAGLE-2 / Medusa)**: 3–5 nhánh; các cây rộng hơn chỉ giúp tại α > 0.8.
- **Kích thước mô hình nháp**: nhỏ nhất đạt α > 0.7. Một nháp 1B cho bộ xác minh 70B là điển hình; đừng xuống dưới khả năng tương thích tokenizer / embedding của bộ xác minh.

## Always flag

- Kiểm tra nháp và bộ xác minh dùng chung tokenizer. Các cách chia BPE khác nhau phá các bảo đảm suy đoán.
- Giải mã suy đoán tương tác với batching liên tục trong vLLM: mức tăng tốc theo yêu cầu giảm khi batch đã bão hòa.
- Đầu vào trạng thái ẩn của EAGLE yêu cầu nội bộ bộ xác minh; không phải luôn được cung cấp qua các API HF. Ưu tiên runtime vLLM hoặc SGLang.
- Các head Medusa cần một fine-tune có giám sát trên các đầu ra của chính bộ xác minh. Bước thu thập dữ liệu thường là chi phí chi phối.

## Output format

Trả về:

1. **Khuyến nghị** — một tên chiến lược và các tham số tinh chỉnh (ví dụ "EAGLE-2, N=5, tree_depth=4").
2. **Mức tăng tốc dự kiến** — với giả định α rõ ràng.
3. **Các kiểm tra tương thích** — khớp tokenizer, hỗ trợ runtime, hỗ trợ hoàn tác KV cache.
4. **Kế hoạch dự phòng** — nếu chiến lược chính hoạt động dưới mức, thử gì tiếp theo.
5. **Kế hoạch đo lường** — cách xác thực tỷ lệ chấp nhận và mức tăng tốc trên một mẫu đại diện.
