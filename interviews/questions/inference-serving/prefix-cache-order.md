---
id: prefix-cache-order
title: Why one ID at the top of a prompt kills the cache
card: inference-serving
kind: debug
level: 2
roles: [inference-engineer, applied-ai-engineer, agentic-ai-engineer]
rounds: [debugging, ml-depth]
tags: [prefix-cache, kv-cache, ttft, prompt-layout]
minutes: 8
lessons: [phases/17-infrastructure-and-production/06-sglang-radixattention]
manuals: [sglang-101#s-prefix-friendly-prompts, vllm-101#s-make-repeated-prompts-hit-the-prefix-cache]
practice: []
cheatsheet: [sglang-serving, serving-engines-compared]
related: [scenarios/prefix-cache-inflated-benchmark]
updated: 2026-11-03
---

Mọi yêu cầu đến dịch vụ của bạn bắt đầu với cùng một system prompt dài, và prefix cache được bật. Máy chủ báo cáo gần như không có token đã cache, và token đầu tiên chậm. Tuần trước một đồng đội thêm ID yêu cầu vào đầu system prompt để truy vết. Điều gì đã xảy ra, và bạn thay đổi gì?

## Short answer

Prefix cache khớp một prompt từ token đầu tiên của nó và dừng ở token đầu tiên khác biệt. Một ID mới ở đầu khiến mọi token phía sau đều cache miss, nên máy chủ tính lại toàn bộ prompt trên mỗi yêu cầu. Chuyển những phần không bao giờ thay đổi lên đầu và đặt ID sau chúng. Sau đó chứng minh cách sửa bằng các bộ đếm token đã cache.

## Full answer

### Why the position matters

Các giá trị attention của mỗi token phụ thuộc vào mọi token trước nó. Vì vậy một cache chỉ có thể tái sử dụng một token khi toàn bộ prefix trước nó giống nhau. Cây radix SGLang so sánh các token từ token đầu tiên và dừng ở khác biệt đầu tiên. vLLM làm tương tự với các block 16 token. Nó chỉ cache các block đầy và dừng ở block đầu tiên khác biệt.

### What it costs

Tài liệu SGLang đo một system prompt dài 2,999 token trong ba cách bố trí:

| Cách bố trí | TTFT trung vị | Số token đã cache trung vị |
|---|---|---|
| Cùng prompt mỗi lần | 45.1 ms | 2998.0 |
| Một ID ngẫu nhiên ở đầu | 1255.3 ms | 5 |
| Cùng ID ở cuối | 88.2 ms | 2985 |

Với ID ở đầu, chỉ 5 token trước các chữ số ngẫu nhiên khớp. Token đầu tiên mất thời gian lâu hơn 28 lần. Với ID ở cuối, chi phí là 43 ms.

### The fix

1. Đặt những phần không bao giờ thay đổi trước: system prompt, các định nghĩa công cụ và các chỉ dẫn cố định.
2. Đặt những phần hiếm khi thay đổi tiếp theo, chẳng hạn các tài liệu của một phiên.
3. Đặt những phần thay đổi trên mọi yêu cầu cuối cùng: câu hỏi người dùng, thời gian và ID yêu cầu.
4. Gửi trace ID trong một header hoặc một trường yêu cầu, không phải trong văn bản prompt.

Kiểm tra cả mẫu chat. Một số mẫu đưa ngày vào system prompt.

### The proof

Trên vLLM, đọc `vllm:prefix_cache_hits` và `vllm:prefix_cache_queries` từ `/metrics`. Số cache hit chia cho số truy vấn là tỷ lệ cache hit. Trên SGLang, khởi động máy chủ với `--enable-cache-report` và đọc `usage.prompt_tokens_details.cached_tokens` trong mỗi phản hồi. Một cách bố trí tốt cho thấy gần như mọi token prompt đã được cache sau yêu cầu đầu tiên.

## Follow-ups

- **Level 2:** Tỷ lệ cache hit vẫn thấp sau khi sửa. Nguyên nhân tiếp theo cần kiểm tra là gì? Expected: một pool đầy, vì cache chỉ giữ các block cũ đến khi một yêu cầu đang chạy cần bộ nhớ.
- **Level 2:** Ở đâu trong một yêu cầu chat thì một thay đổi tốn ít nhất? Expected: trong tin nhắn mới nhất, vì mẫu đặt nó cuối cùng, nên chỉ tin nhắn đó được tính lại.
- **Level 3:** Hai tenant gửi cùng system prompt. Rủi ro là gì, và biện pháp kiểm soát trong vLLM là gì? Expected: một tenant có thể biết từ thời gian bên kia đã gửi gì. Gửi một `cache_salt` khác nhau cho mỗi tenant, để các yêu cầu của họ không bao giờ chia sẻ block.
- **Level 3:** Một nhóm tinh chỉnh các tầng cache và chính sách loại bỏ, và tỷ lệ cache hit không thay đổi. Bạn kiểm tra gì trước? Expected: văn bản prompt, tìm một giá trị thay đổi trên mỗi yêu cầu gần phần đầu, chẳng hạn một hash ngẫu nhiên hoặc một dấu thời gian.

## Wrong answers

- "Cấp cho cache nhiều bộ nhớ hơn." Một pool lớn hơn giữ nhiều block hơn, nhưng một prompt khác biệt ở những token đầu tiên không có block nào để tái sử dụng.
- "Cache khớp phần dùng chung dài nhất ở bất cứ đâu trong prompt." Cache chỉ khớp từ token đầu tiên, nên một phần dùng chung sau một khác biệt không bao giờ cache hit.
- "Bật caching phân cấp." Một tầng thứ hai lưu nhiều prefix hơn. Nó không thể khớp một prefix khác biệt trên mọi yêu cầu.

## Taught in

[Phần prompt thân thiện với prefix](../../../manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md) đo ba cách bố trí, [phần prefix cache của vLLM](../../../manuals/vllm-101/sections/3-2-make-repeated-prompts-hit-the-prefix-cache.md) đưa ra các bộ đếm, và [bài học RadixAttention](../../../phases/17-infrastructure-and-production/06-sglang-radixattention/) xây dựng cây radix.
