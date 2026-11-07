---
id: shared-prefix-first
title: Why the shared part of the prompt goes first
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-depth]
tags: [prefix-cache, radix-cache, kv-cache, ttft, prompt-order]
minutes: 8
lessons: [phases/17-infrastructure-and-production/06-sglang-radixattention]
manuals: [vllm-101#s-make-repeated-prompts-hit-the-prefix-cache, sglang-101#s-prefix-friendly-prompts, sglang-101#s-radixcache]
practice: []
cheatsheet: []
related: [inference-serving/prefix-cache-order, inference-serving/low-hit-rate-with-a-stable-template]
updated: 2026-11-03
---

Mọi yêu cầu đến dịch vụ chat của bạn lặp lại cùng một system prompt dài, và engine mặc định bật prefix caching. Điều gì quyết định liệu yêu cầu tiếp theo có tái sử dụng công việc của yêu cầu trước không? Bạn sẽ bố trí prompt như thế nào, và bạn cho thấy một cache hit bằng một con số thay vì phỏng đoán như thế nào?

## Short answer

Cache khớp token từ token đầu tiên trở đi và dừng ở khác biệt đầu tiên, nên một cache hit cần các token giống nhau theo cùng thứ tự ở đầu prompt. Đặt những phần không bao giờ thay đổi trước, những phần thay đổi theo phiên tiếp theo, và câu hỏi, thời gian cùng bất kỳ ID yêu cầu nào cuối cùng. Chứng minh cache hit từ máy chủ: trường `cached_tokens` trong khối usage, số `#cached-token` trong dòng log prefill, hoặc các bộ đếm prefix cache trong `/metrics`.

## Full answer

### What a hit saves

Trên L4 của chúng tôi với Qwen/Qwen3-8B, vLLM 0.31.0 chạy 4 nhóm gồm 16 prompt ở 8 người dùng. Các prompt trong một nhóm chia sẻ một system prompt có độ dài trong bảng, rồi thêm một câu hỏi 128 token và yêu cầu nhận lại 64 token.

| Token prompt dùng chung | TTFT trung vị, bật cache | TTFT trung vị, tắt cache |
|---|---|---|
| không có | 408 ms | 392 ms |
| 256 | 488 ms | 753 ms |
| 1,024 | 396 ms | 1,213 ms |
| 2,048 | 410 ms | 2,550 ms |
| 4,096 | 375 ms | 13,353 ms |

Khi bật cache, token đầu tiên mất khoảng 400 ms ở mọi độ dài. Khi không có nó, thời gian token đầu tiên tăng theo phần dùng chung, vì mọi yêu cầu tính lại toàn bộ prompt. Dòng 1,024 là so sánh rõ nhất, vì cả hai lần chạy giữ 1,410 MHz hoặc hơn; ở đó cache giảm thời gian token đầu tiên khoảng 3 lần và cho đầu ra nhiều hơn 50 phần trăm. SGLang trên cùng card cho cùng hình dạng: 479 ms so với 14,706 ms ở 4,096 token dùng chung, với lần chạy tắt cache bị giảm xung xuống 930 MHz.

### Why the order decides

Các giá trị attention của mọi token phụ thuộc vào mọi token phía trước. Một cache tái sử dụng token sau một thay đổi sẽ trả về câu trả lời sai, nên prefix caching chính xác theo thiết kế và không khoan nhượng cũng theo thiết kế đó. Trong vLLM, việc khớp chạy từng block 16 token và chỉ các block đầy được cache: một phần dùng chung 20 token cho một block đã cache, và 4 token cuối được tính mỗi lần. Trong SGLang, cây radix khớp từng token, và token prompt cuối luôn đi qua prefill, vì mô hình cần logits của nó để lấy mẫu token đầu ra đầu tiên. Một prompt 2,999 token báo cáo 2,998 token đã cache.

### The order

1. Những phần không bao giờ thay đổi: system prompt, các định nghĩa công cụ theo thứ tự cố định, các chỉ dẫn cố định.
2. Những phần hiếm khi thay đổi: các tài liệu của một phiên, các lượt trước, được gửi nguyên vẹn.
3. Những phần thay đổi trên mọi yêu cầu: câu hỏi người dùng, thời gian, ID yêu cầu.

Kiểm tra cả mẫu chat. Một số mẫu đưa ngày vào system prompt. Một đối tượng JSON có các khóa thay đổi thứ tự là một chuỗi token khác.

### Prove the hit

- vLLM: `vllm:prefix_cache_hits_total` chia cho `vllm:prefix_cache_queries_total` từ `/metrics`, và dòng log in `Prefix cache hit rate`, đọc 87.2 phần trăm ở giữa lần chạy prefix dùng chung.
- SGLang: khởi động với `--enable-cache-report` và đọc `cached_tokens` trong khối usage, đọc `#cached-token` và `#new-token` trong mọi dòng `Prefill batch`, hoặc đọc gauge `sglang:cache_hit_rate`, đọc 0.94 sau benchmark prefix dùng chung và 0.0 khi tắt cache.

Nếu tỷ lệ cache hit thấp, thứ tự prompt gần như luôn là nguyên nhân. Một pool đầy là nguyên nhân tiếp theo, vì cache chỉ giữ các block cũ đến khi một yêu cầu đang chạy cần bộ nhớ. Định tuyến là thứ ba: với nhiều máy chủ, một yêu cầu đến máy chủ không có prefix của nó sẽ cache miss bất kể prompt trông như thế nào, và một báo cáo đưa tỷ lệ cache hit từ 64.7 lên 92.1 phần trăm bằng cách định tuyến mỗi cuộc hội thoại đến cùng máy chủ.

### Keep tenants apart

Hai người dùng có cùng prefix chia sẻ block, và thời gian của một bên có thể tiết lộ bên kia đã gửi gì. Một trường `cache_salt` cho mỗi tenant đi vào khóa block, nên các salt khác nhau không bao giờ chia sẻ. Adapter LoRA cũng là một phần của khóa.

## Follow-ups

- **Level 2:** Trên vLLM mọi yêu cầu bắt đầu với cùng 20 token. Bao nhiêu token đến từ cache? Expected: 16, một block đầy; 4 token cuối được tính mỗi lần vì chỉ các block đầy được cache.
- **Level 3:** Prompt ổn định, một máy chủ cache hit tốt, và cả cụm vẫn cache miss. Nêu hai nguyên nhân bên ngoài prompt. Expected: một pool đầy bỏ các block trước khi yêu cầu tiếp theo đến, và một router gửi một phiên đến một máy chủ chưa từng thấy prefix của nó; định tuyến cố định đưa một báo cáo từ 64.7 lên 92.1 phần trăm.
- **Level 3:** Tại sao SGLang báo cáo 2,998 token đã cache cho một prompt 2,999 token và không bao giờ là 2,999? Expected: token prompt cuối luôn đi qua prefill, vì mô hình cần logits của nó để lấy mẫu token đầu ra đầu tiên.
- **Level 4:** Một client ghi một bản chụp danh sách tác vụ ở cuối system prompt và cập nhật nó ở mỗi lượt. Cây làm gì? Expected: mỗi cập nhật thay đổi system prompt, nên mọi token sau nó đều cache miss, kể cả toàn bộ lịch sử phía sau nó; trong sự cố của tài liệu điều đó làm mất hiệu lực hơn 100,000 token mỗi lượt, và cách sửa là chuyển bản chụp ra sau lịch sử hoặc vào metadata yêu cầu.

## Wrong answers

- "Cache được bật, nên các prompt lặp lại sẽ cache hit." Việc khớp là chính xác từ token đầu tiên; một dấu thời gian, một ID yêu cầu hoặc một danh sách công cụ đổi thứ tự gần phần đầu khiến mọi block phía sau cache miss, và một ID ngẫu nhiên ở đầu chỉ khớp 5 token của một prompt 3,034 token.
- "Đặt câu hỏi người dùng trước để mô hình đọc nó trước." Câu hỏi thay đổi trên mọi yêu cầu, nên system prompt dùng chung phía sau nó không bao giờ khớp; đặt phần cố định trước và câu hỏi cuối.
- "Tắt cache để benchmark công bằng." Cache được bật trong production, nên kiểm thử phải đặt lại nó giữa các lần chạy, không phải loại bỏ nó; khi tắt nó, token đầu tiên ở 4,096 token dùng chung mất 13,353 ms trên vLLM và 14,706 ms trên SGLang.
- "Đo tỷ lệ cache hit từ thời gian phản hồi của client." Đọc nó từ máy chủ, trong khối usage, dòng prefill hoặc các bộ đếm; một phản hồi thứ hai nhanh hơn cũng có thể đến từ GPU đã được làm nóng hơn.

## Taught in

[Khiến các prompt lặp lại cache hit trong prefix cache](../../../manuals/vllm-101/sections/3-2-make-repeated-prompts-hit-the-prefix-cache.md), [Prompt thân thiện với prefix](../../../manuals/sglang-101/sections/3-4-prefix-friendly-prompts.md) và [RadixCache](../../../manuals/sglang-101/sections/3-3-radixcache.md) đo cache trên cả hai engine, và [bài học RadixAttention](../../../phases/17-infrastructure-and-production/06-sglang-radixattention/docs/en.md) đưa ra quy tắc sắp thứ tự.
