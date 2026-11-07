---
id: low-hit-rate-with-a-stable-template
title: Cached tokens at zero with a stable template
card: inference-serving
kind: debug
level: 2
roles: [inference-engineer, applied-ai-engineer, agentic-ai-engineer]
rounds: [debugging, screen]
tags: [prefix-cache, radix-cache, request-id, hit-rate, routing]
minutes: 8
lessons: [phases/17-infrastructure-and-production/06-sglang-radixattention]
manuals: [sglang-101#s-prefix-friendly-prompts]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một nhóm chạy các phiên agent dài trên SGLang với caching phân cấp được bật. Dashboard của họ hiển thị `#cached-token: 0` trên những yêu cầu gửi lại lịch sử dài. Họ đã tinh chỉnh các tầng cache và chính sách ghi, và tỷ lệ cache hit hầu như không thay đổi. Mẫu prompt có vẻ ổn định đối với họ. Bạn xem ở đâu trước, và bạn kỳ vọng tìm thấy gì?

## Short answer

Xem các token đầu tiên của yêu cầu như máy chủ nhìn thấy chúng, không phải mẫu. Một relay hoặc một mẫu chat thường thêm thứ gì đó thay đổi ở mỗi yêu cầu gần phần đầu, chẳng hạn ID yêu cầu, hash phiên hoặc ngày, và cây khớp từ token đầu tiên rồi dừng ở khác biệt đầu tiên. Trong sự cố của tài liệu, một hash ngẫu nhiên trong system prompt làm mất 27.6 điểm tỷ lệ cache hit, và loại bỏ nó đưa tỷ lệ cache hit của engine từ 66.8 lên 94.4 phần trăm.

## Full answer

### Reproduce it with one identifier in three places

Bộ công cụ thu thập của tài liệu gửi một system prompt dài 2,999 token và một câu hỏi ngắn, năm lần ở mỗi dạng trong ba dạng, với `--enable-cache-report` được bật để mỗi phản hồi báo cáo các token đã cache của nó:

| Dạng | Token đã cache | Token prompt | TTFT trung vị |
|---|---|---|---|
| system prompt ổn định | 2,998 | 2,999 | 45.1 ms |
| ID ngẫu nhiên ở đầu | 5 | 3,034 | 1,255.3 ms |
| cùng ID ở cuối | 2,985 | 3,028 | 88.2 ms |

ID ở đầu khiến token đầu tiên chậm hơn 28 lần. ID ở cuối tốn 43 ms. Các token gần như giống nhau trong ba dạng; chỉ thứ tự của chúng khác nhau. ID ở đầu khớp với 5 token trước các chữ số hex ngẫu nhiên và không khớp gì sau chúng.

### Why nothing after a change can match

Các giá trị attention của mọi token phía sau phụ thuộc vào mọi token phía trước. Một cache tái sử dụng các token phía sau sẽ trả về câu trả lời sai. Vì vậy cây là chính xác, và một thay đổi trong system prompt làm mất hiệu lực mọi thứ phía sau nó, trong khi một thay đổi trong tin nhắn mới nhất chỉ làm mất hiệu lực tin nhắn đó.

### The incident behind the question

Người báo cáo tìm thấy ba nguyên nhân chồng lên nhau:

1. Relay đưa một hash ngẫu nhiên theo phiên và một system message luân phiên vào mỗi yêu cầu. Loại bỏ chúng đưa tỷ lệ cache hit của engine từ 66.8 lên 94.4 phần trăm.
2. Client ghi bản chụp danh sách tác vụ ở cuối system prompt. Mỗi cập nhật tác vụ thay đổi system prompt và làm mất hiệu lực hơn 100,000 token lịch sử phía sau nó.
3. Việc nạp lại cache phân cấp, khi không tìm thấy chỗ trống, đã loại các prefix của những phiên khác. Người báo cáo đếm được 250,000 lời gọi loại bỏ so với 376 lần nạp lại hoàn tất.

Cách sửa đầu tiên là chỉnh sửa prompt. Không cờ cache nào có thể khôi phục 27.6 điểm mà hash làm mất. Bài học kể cùng câu chuyện từ một lần triển khai khác, nơi việc chuyển nội dung động ra khỏi prefix có thể cache đưa tỷ lệ cache hit từ 7 lên 74 phần trăm.

### The order of checks

1. Xuất chuỗi token chính xác của hai yêu cầu liên tiếp và so sánh chúng từ token đầu tiên. Bao gồm những gì relay và mẫu chat thêm vào.
2. Đọc `cached_tokens` trong khối usage với `--enable-cache-report`, hoặc trong `meta_info` của route `/generate` gốc.
3. Đọc `#new-token` và `#cached-token` trong các dòng `Prefill batch`.
4. Đọc `sglang:cache_hit_rate` từ `/metrics`.
5. Với nhiều máy chủ, kiểm tra định tuyến. Một yêu cầu đến máy chủ không có prefix của nó sẽ cache miss bất kể prompt trông như thế nào. Một báo cáo tăng từ 64.7 lên 92.1 phần trăm bằng cách định tuyến mỗi cuộc hội thoại đến cùng máy chủ.

Hai thiết lập máy chủ trông giống các vấn đề prompt. Một yêu cầu xác suất log của prompt từ vị trí k chỉ có thể tái sử dụng k token đầu tiên. Các adapter LoRA khác nhau không bao giờ chia sẻ node cây, vì adapter là một phần của khóa cây.

## Follow-ups

- **Level 2:** Thay vào đó, cùng ID ngẫu nhiên được chuyển ra sau văn bản cố định. Bây giờ nó tốn gì? Expected: khoảng 45 token prefill thay vì khoảng 3,027; trong thí nghiệm đó là nhiều hơn 43 ms so với prompt ổn định thay vì lâu hơn 28 lần.
- **Level 3:** Sau khi sửa prompt, một máy chủ cache hit tốt và cả cụm vẫn cache miss. Tiếp theo là gì? Expected: định tuyến; một yêu cầu đến máy chủ không có prefix của nó sẽ cache miss, và định tuyến mỗi cuộc hội thoại đến cùng máy chủ đưa một báo cáo từ 64.7 lên 92.1 phần trăm.
- **Level 4:** Tầng host vẫn gây hại cho các phiên khác sau khi sửa prompt. Sự cố đã đếm được gì, và điều đó có nghĩa gì? Expected: 250,000 lời gọi loại bỏ so với 376 lần nạp lại hoàn tất; một lần nạp lại không tìm thấy chỗ trống sẽ loại các phiên khác khỏi pool GPU, nên kích thước pool và chính sách ghi chỉ cần được xem xét sau khi prompt được sửa.

## Wrong answers

- "Tăng tỷ lệ cache phân cấp đến khi tỷ lệ cache hit phục hồi." Không cờ cache nào có thể khôi phục một cache miss bắt đầu ở token 5; cách sửa đầu tiên là chỉnh sửa prompt, đáng giá 27.6 điểm tỷ lệ cache hit.
- "Mẫu ổn định, nên prompt ổn định." Mẫu không phải những gì máy chủ nhìn thấy; một relay, một gateway hoặc mẫu chat có thể chèn hash, ngày hoặc bản chụp, nên so sánh các chuỗi token của hai yêu cầu liên tiếp từ đầu.
- "Một trường thay đổi ở giữa chỉ tốn các token của trường đó." Mọi token sau thay đổi là một nhánh khác của cây, vì các giá trị attention của các token phía sau phụ thuộc vào mọi token phía trước.

## Taught in

[Prompt thân thiện với prefix](../../../manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md) có thí nghiệm ba dạng và sự cố, và [bài học RadixAttention](../../../phases/17-infrastructure-and-production/06-sglang-radixattention/docs/en.md) nêu quy tắc sắp thứ tự.
