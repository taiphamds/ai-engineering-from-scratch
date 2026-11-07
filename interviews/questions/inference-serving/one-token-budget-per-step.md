---
id: one-token-budget-per-step
title: One token budget instead of two phases
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [continuous-batching, chunked-prefill, token-budget, scheduler]
minutes: 8
lessons: [phases/17-infrastructure-and-production/04-vllm-serving-internals]
manuals: [vllm-101#s-why-one-token-budget-replaces-a-prefill-phase, vllm-101#s-keep-long-prompts-from-stalling-short-ones]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Phần lớn các giải thích về continuous batching mô tả một pha prefill và một pha decode thay phiên nhau trên GPU. Thay vào đó, hãy mô tả bộ lập lịch vLLM làm gì trong một bước. Chunked prefill đến từ đâu trong thiết kế đó, và bạn đọc giá trị điều khiển nó ở đâu?

## Short answer

Bộ lập lịch đặt cùng một câu hỏi cho mọi yêu cầu: nó còn cần tính bao nhiêu token? Mỗi bước có một ngân sách token, được đặt bằng `--max-num-batched-tokens`, và các yêu cầu đang chạy lấy token tiếp theo của chúng trước. Các prompt đang chờ lấp phần ngân sách còn lại, nên một prompt dài được chia qua nhiều bước, và chunked prefill không cần cơ chế bổ sung.

## Full answer

### One question for every request

Một yêu cầu mới cần tất cả token prompt của nó. Một yêu cầu đang chạy cần một token, hoặc nhiều hơn với speculative decoding. Không có pha prefill và không có pha decode trong mã, chỉ có số token còn phải tính.

### The order inside a step

1. Mỗi yêu cầu đang chạy nhận các token nó cần, đến mức ngân sách.
2. Các yêu cầu đang chờ được tiếp nhận khi còn ngân sách và chỗ trống. `--max-num-seqs` giới hạn các yêu cầu đang chạy.

Một prompt không vừa phần ngân sách còn lại nhận một phần bây giờ và phần còn lại trong các bước sau. Đó là chunked prefill, và nó được bật mặc định vì thiết kế ngân sách không cần gì khác để hỗ trợ nó.

### The default depends on the memory that vLLM reads

| Bộ nhớ GPU mà vLLM đọc | Ngân sách, `vllm serve` | Ngân sách, lớp `LLM` | `--max-num-seqs`, cả hai |
|---|---|---|---|
| 160 GiB trở lên | 16,384 | 16,384 | 1,024 |
| 70 GiB trở lên, nhưng không phải A100 | 8,192 | 16,384 | 1,024 |
| ít hơn, hoặc không xác định | 2,048 | 8,192 | 256 |

Máy bộ nhớ hợp nhất trong tài liệu có 121.69 GiB mà CPU và GPU dùng chung, và log của nó vẫn hiển thị 2,048, giá trị cho một GPU nhỏ hoặc không xác định. Đọc giá trị mà máy chủ của bạn dùng trước khi thay đổi nó. Ở 0.31.0, log không in ngân sách dưới tên riêng của nó; tìm `compile_ranges_endpoints` trong dòng cấu hình engine, và số lớn nhất trong danh sách đó là ngân sách.

### Why decode goes first

Các yêu cầu đang chạy đến trước để một người dùng đã thấy luồng tiếp tục thấy nó. Một prompt mới chờ phần còn lại. Một ngân sách nhỏ hơn cho một luồng mượt hơn; một ngân sách lớn hơn cho token đầu tiên nhanh hơn đối với prompt dài. Mặc định nhỏ 2,048 là một lựa chọn cho luồng.

### Why one budget

Một ngân sách cho mọi loại công việc giữ bộ lập lịch đơn giản. Prefix caching chỉ giảm số token cần tính. Speculative decoding chỉ tăng số lượng cho một yêu cầu đang chạy. Cùng vòng lặp phục vụ tất cả chúng. Cái giá là một con số quyết định sự cân bằng giữa token đầu tiên và luồng, và không có một giá trị duy nhất phù hợp với mọi workload.

Bộ lập lịch đồ chơi của bài học dùng một chunk cố định 512 token. Engine thực không có kích thước chunk riêng ở 0.31.0: chunk là phần ngân sách còn lại trong bước đó.

## Follow-ups

- **Level 2:** Prefix caching được bật, và một yêu cầu có prompt 2,048 token tìm thấy 1,024 token trong cache. Bộ lập lịch đếm gì cho nó? Expected: 1,024 token còn phải tính; cache chỉ giảm số lượng, và cùng vòng lặp phục vụ yêu cầu.
- **Level 3:** Một máy chủ có 121.69 GiB bộ nhớ hợp nhất ghi log ngân sách 2,048. Tại sao không phải 8,192? Expected: mặc định đến từ bộ nhớ mà vLLM đọc, và máy hợp nhất được đọc là nhỏ hoặc không xác định, nên nó nhận giá trị nhỏ; đọc compile_ranges_endpoints trước khi thay đổi nó.
- **Level 4:** Speculative decoding được bật với ba token nháp. Quy tắc ngân sách thay đổi như thế nào? Expected: nó không thay đổi; một yêu cầu đang chạy giờ cần nhiều hơn một token mỗi bước, nên số lượng của nó tăng, và ngân sách được chi theo cùng thứ tự.

## Wrong answers

- "Chunked prefill là một cờ bạn bật." Nó là hệ quả của ngân sách: một prompt không vừa phần ngân sách còn lại nhận một phần bây giờ và phần còn lại sau, nên nó được bật mặc định và không có cơ chế riêng.
- "Prompt mới đến trước để token đầu tiên đến nhanh." Các yêu cầu đang chạy lấy token của chúng trước để một người dùng thấy luồng tiếp tục thấy nó; một prompt mới chờ phần ngân sách còn lại.
- "Ngân sách là 2,048 trên mọi GPU." Nó phụ thuộc vào bộ nhớ mà vLLM đọc: 2,048 dưới 70 GiB, 8,192 ở 70 GiB trở lên, và 16,384 ở 160 GiB trở lên, và lớp LLM offline dùng các giá trị lớn hơn.

## Taught in

[Tại sao một ngân sách token thay thế một pha prefill](../../../manuals/vllm-101/sections/8-2-why-one-token-budget-replaces-a-prefill-phase.md) và [phần prompt dài](../../../manuals/vllm-101/sections/3-3-keep-long-prompts-from-stalling-short-ones.md) đưa ra quy tắc và các mặc định, và [bài học về nội bộ engine phục vụ](../../../phases/17-infrastructure-and-production/04-vllm-serving-internals/docs/en.md) có bộ lập lịch đồ chơi.
