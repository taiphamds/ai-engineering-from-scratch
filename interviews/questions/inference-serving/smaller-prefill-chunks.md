---
id: smaller-prefill-chunks
title: Should the prefill chunk be smaller
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer]
rounds: [design-review, ml-depth]
tags: [chunked-prefill, mixed-chunk, p99-itl, moe, scheduler]
minutes: 10
lessons: []
manuals: [sglang-101#s-the-scheduler-loop-and-schedule-policy, vllm-101#s-keep-long-prompts-from-stalling-short-ones]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Các prompt dài khiến luồng tạm dừng cho những người dùng khác của máy chủ SGLang của bạn. Một trang tinh chỉnh nói hãy giảm `--chunked-prefill-size`, để các bước decode chạy thường xuyên hơn giữa các mảnh của một prompt dài. Bạn có làm theo không? Tài liệu tìm thấy gì khi thử, và thay vào đó bạn sẽ thử gì?

## Short answer

Không nếu chưa đo, vì chunk nhỏ không giúp ích trên cả hai card trong các lần chạy của tài liệu. Trên GB10 ở tốc độ đến thấp, một chunk 1,024 làm P99 ITL tệ hơn, 1,977 so với 929 ms với mặc định 8,192, và ở tốc độ cao hơn mọi kích thước chunk hòa nhau. Tôi sẽ thử `--enable-mixed-chunk` trước, đưa các token decode vào batch prefill, và đo sự đánh đổi của nó: trên GB10 nó giảm P99 ITL từ 15 đến 19 phần trăm và ở 1 và 2 yêu cầu mỗi giây nó tăng token đầu tiên trung vị từ 49 đến 74 phần trăm.

## Full answer

### The rule behind the advice

Bộ lập lịch chạy một batch prefill bất cứ khi nào nó có thể tiếp nhận thứ gì đó, và nếu không thì một bước decode. Chunked prefill chia một prompt dài thành các mảnh tối đa bằng kích thước chunk, một mảnh mỗi batch prefill. Mặc định phụ thuộc vào bộ nhớ GPU: 4,096 trên một card 22 GB L4 và 8,192 trên GB10. Lời khuyên giả định rằng nhiều mảnh hơn cho các bước decode nhiều lượt hơn.

### What the manual measured

Mỗi lần chạy gửi 48 prompt dài 1,024 đến 4,096 token với 256 token đầu ra, ở tốc độ Poisson 0.5, 1 hoặc 2 mỗi giây, ba seed:

| GPU, mô hình | Chunk | Tốc độ mỗi giây | Token đầu ra/s | TTFT trung vị | P99 ITL |
|---|---|---|---|---|---|
| GB10, Qwen3-30B-A3B | 8,192 | 0.5 | 70.1 | 892 ms | 929 ms |
| GB10, Qwen3-30B-A3B | 1,024 | 0.5 | 68.1 | 1,253 ms | 1,977 ms |
| GB10, Qwen3-30B-A3B | 8,192 | 2 | 129.3 | 269 ms | 312 ms |
| GB10, Qwen3-30B-A3B | 1,024 | 2 | 130.1 | 256 ms | 260 ms |
| L4, Qwen3-8B | 4,096 | 0.5 | 44.1 | 36.0 s | 2,579 ms |
| L4, Qwen3-8B | 1,024 | 0.5 | 43.3 | 37.4 s | 2,922 ms |

Ở 1 và 2 mỗi giây trên GB10, các kích thước nằm trong độ trải seed của nhau. Ở 0.5 mỗi giây, chunk nhỏ thua, và các khoảng seed không chồng lấn. Trên L4, workload nhiều hơn mức card có thể phục vụ ở bất kỳ tốc độ nào: đầu ra giữ gần 44 token mỗi giây, token đầu tiên mất 36 đến 62 giây, và khoảng cách tệ nhất giữ giữa 2.5 và 2.9 s với cả hai chunk.

### Why the small chunk lost on a mixture-of-experts model

Mỗi chunk của một prompt nạp lại các trọng số expert được chọn. Một nghiên cứu năm 2025 về chunked prefill trên các mô hình như vậy đo được lưu lượng bộ nhớ tăng đến 39 phần trăm từ các lần nạp bổ sung. Với chunk 1,024, một prompt 4,096 token chạy thành tối đa bốn chunk, và mỗi chunk đọc lại các expert. Tài liệu không đo lưu lượng expert, nên đây là một cách lý giải và không phải một kết quả.

### Why nothing helped on the L4

Prefill thắng bất cứ khi nào bộ lập lịch có thể tiếp nhận thứ gì đó. Với một hàng đợi đầy, một chunk nhỏ hơn chỉ thêm nhiều lượt prefill trước các bước decode, và luồng vẫn chờ. Tài liệu kỳ vọng cách sửa là thêm năng lực prefill hoặc ít prompt dài hơn mỗi giây, và không kiểm thử điều đó.

### The mixed chunk

`--enable-mixed-chunk` đưa các token decode vào batch prefill, nên một bước decode không chờ một lượt prefill. Trên GB10, so với một lần chạy mặc định cùng ngày:

| Tốc độ mỗi giây | P99 ITL, mặc định / mixed | TTFT trung vị, mặc định / mixed | Token đầu ra/s, mặc định / mixed |
|---|---|---|---|
| 0.5 | 922 / 781 ms | 841 / 910 ms | 70.9 / 72.1 |
| 1 | 219 / 177 ms | 244 / 362 ms | 108.8 / 112.6 |
| 2 | 261 / 221 ms | 238 / 416 ms | 133.2 / 138.1 |

Một luồng mượt hơn và một token đầu tiên chậm hơn. P99 ITL giảm từ 15 đến 19 phần trăm, ngoài độ trải seed ở 0.5 và 2 mỗi giây. TTFT trung vị tăng từ 49 đến 74 phần trăm ở 1 và 2 mỗi giây, ngoài độ trải. Trên L4, cờ thay đổi P99 ITL từ 5 đến 8 phần trăm, trong độ trải, vì hàng đợi quyết định nhịp độ. Card quyết định liệu bạn có nhận được sự đánh đổi đó hay không.

### The other direction fails at startup

Với chunk 8,192 trên L4, máy chủ thoát trong khi capture graph. Pool lấy cùng 24,094 token như trước, và graph prefill cho 8,192 token cần nhiều hơn 2.33 GB còn lại. Dòng log cuối là một assert nội bộ PyTorch yêu cầu báo cáo bug. Lỗi thực sự là dòng hết bộ nhớ ở hai dòng phía trên nó.

### The same trade in vLLM

vLLM không có kích thước chunk riêng. Ngân sách token của nó đóng cùng vai trò, và ở tải thấp, một ngân sách 16,384 tăng P99 ITL thêm 39 phần trăm so với 2,048 trên GB10. Cả hai engine đánh đổi token đầu tiên của các prompt dài với các khoảng cách trong luồng, và giá trị tốt nhất thay đổi theo tải.

## Follow-ups

- **Level 3:** Tại sao một chunk nhỏ tốn nhiều hơn khi mô hình định tuyến mỗi token đến một vài expert so với trên một mô hình dense? Expected: mỗi chunk đọc lại các trọng số expert được chọn, nên bốn chunk có thể đọc expert bốn lần; một mô hình dense đọc cùng trọng số một lần mỗi bước theo cả hai cách.
- **Level 3:** Trên L4, cả hai cờ đều không thay đổi luồng. Tại sao không? Expected: card không thể theo kịp các prompt, nên prefill thắng mọi lượt nó có thể; một chunk nhỏ hơn chỉ thêm các lượt prefill trước các bước decode, và cách sửa là thêm năng lực prefill hoặc ít prompt dài hơn mỗi giây.
- **Level 4:** Bạn tăng chunk lên 8,192 trên L4 và máy chủ chết khi khởi động với một assert yêu cầu bạn báo cáo bug. Điều gì đã xảy ra? Expected: graph prefill cho 8,192 token cần nhiều bộ nhớ hơn 2.33 GB mà pool để lại; assert là dòng cuối, và dòng hết bộ nhớ phía trên nó là nguyên nhân.

## Wrong answers

- "Các chunk nhỏ hơn luôn làm luồng mượt hơn." Trên GB10 ở 0.5 yêu cầu mỗi giây, chunk 1,024 tăng P99 ITL từ 929 lên 1,977 ms, và ở tốc độ cao hơn các kích thước hòa nhau.
- "Mixed chunk không tốn gì." Nó đánh đổi một luồng mượt hơn lấy một token đầu tiên chậm hơn: TTFT trung vị tăng 49 đến 74 phần trăm ở 1 và 2 yêu cầu mỗi giây trên GB10.
- "Assert PyTorch khi khởi động là một bug PyTorch." Lỗi thực sự là dòng hết bộ nhớ ở hai dòng phía trên nó; graph prefill cho chunk lớn hơn không vừa bộ nhớ mà pool để lại.
- "Một chunk lớn hơn không cần thêm bộ nhớ vì pool giống nhau." Pool giữ ở 24,094 token, nhưng graph prefill được capture cho 8,192 token cần nhiều hơn 2.33 GB còn lại.

## Taught in

[Vòng lặp bộ lập lịch và --schedule-policy](../../../manuals/sglang-101/sections/2-2-the-scheduler-loop-and-schedule-policy.md) có các lượt quét chunk và mixed-chunk, và [Ngăn prompt dài làm khựng prompt ngắn](../../../manuals/vllm-101/sections/3-3-keep-long-prompts-from-stalling-short-ones.md) đo cùng sự đánh đổi trong vLLM.
