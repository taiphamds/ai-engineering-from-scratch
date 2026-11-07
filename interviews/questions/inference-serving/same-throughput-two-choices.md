---
id: same-throughput-two-choices
title: Same throughput, two choices at a full pool
card: inference-serving
kind: tradeoff
level: 4
roles: [inference-engineer]
rounds: [design-review, system-design]
tags: [engine-choice, p99-itl, ttft, full-pool, benchmark]
minutes: 12
lessons: []
manuals: [sglang-101#s-reading-other-peoples-benchmarks, vllm-101#s-tune-chat-for-many-users]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Trên một L4 với Qwen/Qwen3-8B và cùng pool 24,096 token, một lượt quét vòng kín ở 64 người dùng cho vLLM 241 token đầu ra mỗi giây và SGLang 257, nên các engine hòa nhau về thông lượng. Tuy nhiên nhóm chat nói một trong chúng không dùng được ở tải đó còn cái kia thì ổn. Họ đang thấy gì, và bạn chọn engine nào cho chat?

## Short answer

Họ đang thấy hai lựa chọn khác nhau ở một pool đầy. Ở 64 người dùng, vLLM chạy 40 yêu cầu và giữ 11 đang chờ với pool đầy 99.5 phần trăm, nên token đầu tiên của nó đến sớm hơn 1.7 lần, 10,953 so với 18,356 ms, nhưng mỗi prefill mới chia sẻ bước với các decode đang chạy và khoảng cách P99 giữa token là 1,363 ms so với 114 trên SGLang, vốn chạy 37 yêu cầu và giữ 27 đang chờ. Với chat, đọc P99 ITL cạnh token đầu tiên ở tải thực và hình dạng lưu lượng thực của bạn, vì hai engine mặc định chọn hai phía khác nhau của sự đánh đổi đó, và một cờ trên SGLang đã thay đổi phía của nó.

## Full answer

### Matched pools, matched clocks

Tài liệu đưa ra ba lựa chọn để chỉ engine khác nhau. Máy chủ vLLM nhận `--num-gpu-blocks-override 1506`, 1,506 block 16 token, tức là 24,096 token, trong khi SGLang tự định cỡ 24,094 token. Cả hai chạy trong một phiên trên một GPU, mọi lần chạy bắt đầu ở 72 C hoặc thấp hơn, và một lần chạy có xung nhịp SM trung vị dưới 1,000 MHz được để riêng và lặp lại, tối đa ba lần. Máy chủ vLLM nhận `--max-model-len 8192`, mà mọi yêu cầu đều vừa, và vấn đề dựng bộ lấy mẫu của nó được xử lý bằng cách khắc phục tạm; benchmark là tham lam, nên bộ lấy mẫu không thay đổi đầu ra.

### The closed loop

| Mức đồng thời | Token đầu ra/s, SGLang / vLLM | TTFT trung vị, SGLang / vLLM | P99 ITL, SGLang / vLLM | Xung nhịp SM trung vị, SGLang / vLLM |
|---|---|---|---|---|
| 1 | 13.84 / 13.51 | 185 / 192 ms | 104 / 105 ms | 1,290 / 1,290 MHz |
| 8 | 112.46 / 112.79 | 170 / 253 ms | 71 / 68 ms | 1,485 / 1,470 MHz |
| 16 | 201.13 / 200.90 | 212 / 289 ms | 81 / 80 ms | 1,470 / 1,425 MHz |
| 32 | 271.28 / 273.93 | 2,871 / 1,813 ms | 102 / 619 ms | 1,320 / 1,275 MHz |
| 64 | 256.62 / 241.39 | 18,356 / 10,953 ms | 114 / 1,363 ms | 1,215 / 1,013 MHz |

Đến 32 người dùng, các engine chênh nhau trong 3 phần trăm về thông lượng và trong 6 phần trăm về thời gian mỗi token. Dưới điểm pool đầy, SGLang cho token đầu tiên sớm hơn, 170 so với 253 ms ở 8 người dùng.

### What the stats lines show

Trên điểm đó, các engine đưa ra lựa chọn khác nhau. SGLang chạy 37 yêu cầu và giữ 27 đang chờ, với pool đầy 92 phần trăm. vLLM chạy 40 yêu cầu và giữ 11 đang chờ, lấp 99.5 phần trăm pool của nó, và prefill prompt mới ở 460 token mỗi giây trong lúc đó. Nhiều yêu cầu hơn bắt đầu, nên token đầu tiên của chúng đến sớm hơn. Mỗi prefill mới sau đó chia sẻ bước với các decode đang chạy, nên các luồng bị khựng. Lưu ý về xung nhịp thuộc về dòng cuối: ngay cả sau ba lần thử, các lần chạy vLLM ở 64 người dùng có xung nhịp trung vị 1,013 MHz so với 1,215, nên một phần khoảng cách thông lượng là do card. Khoảng cách 12 lần ở phần đuôi giữa token quá lớn đối với một khác biệt xung nhịp 17 phần trăm.

### A fixed arrival rate

Đến 2 yêu cầu mỗi giây, các engine hòa nhau về thông lượng, SGLang cho token đầu tiên sớm hơn, 284 so với 317 ms ở 0.5 mỗi giây, và vLLM có thời gian mỗi token ngắn hơn, 68 so với 74 ms ở 1 mỗi giây. Ở 2 mỗi giây, vLLM phục vụ trung vị 1.36 yêu cầu mỗi giây trong mục tiêu độ trễ và SGLang 0.88, với các khoảng seed chồng lấn. Từ 4 mỗi giây, cả hai tụt lại sau lượng đến, và cùng lựa chọn tiếp nhận xuất hiện: vLLM cho 286.6 so với 257.5 token mỗi giây, nhiều hơn 11 phần trăm, và thời gian P99 mỗi token của nó là 187 so với 127 ms.

### Waves and mixed lengths

Với độ dài prompt cố định ở 16 người dùng, các yêu cầu đến theo đợt, và các engine hòa nhau về thông lượng trong khi vLLM cho token đầu tiên sớm hơn, 1,499 so với 1,775 ms, và SGLang giữ luồng mượt, với P99 ITL là 81 so với 502 ms. Với độ dài hỗn hợp, vLLM mặc định dẫn đầu: 169.6 so với 159.6 token mỗi giây và P99 ITL là 191 so với 363 ms. Sau đó `--enable-mixed-chunk` trên SGLang, đưa các decode đang chạy vào batch prefill, thu hẹp khoảng cách đó còn 193 so với 191 ms, với cái giá là P99 ITL tệ hơn với độ dài cố định, từ 81 lên 203 ms.

### Shared prompts

Với một system prompt dùng chung, cả hai cache đều cache hit, và cả hai engine giữ token đầu tiên trung vị dưới 500 ms ở mọi độ dài dùng chung. Khi tắt cache, SGLang mất 14,706 ms và vLLM 13,353 ở 4,096 token dùng chung. Cache là kết quả, không phải engine.

### The GB10

Trên GB10, hai engine cho cùng đầu ra ở 32 và 64 người dùng, và P99 ITL của vLLM cao khoảng gấp đôi, 478 so với 220 ms ở 32 người dùng.

### How to pick

Trên card này với các prompt riêng biệt, lựa chọn chủ yếu là một quyết định độ trễ, và hình dạng lưu lượng chọn bên thắng. Khi các yêu cầu đến cùng nhau, ở một pool đầy hoặc theo đợt, SGLang bảo vệ luồng và vLLM bảo vệ token đầu tiên. Với độ dài hỗn hợp, vLLM mặc định dẫn đầu và một cờ loại bỏ lợi thế đó. Quyết định dựa trên hỗ trợ mô hình, thời gian khởi động và phần cứng bạn có, rồi đo hỗn hợp độ dài riêng của bạn, và đọc P99 ITL cạnh token đầu tiên. So sánh các engine ở pool khớp nhau và xung nhịp khớp nhau, hoặc không so sánh.

## Follow-ups

- **Level 3:** Tại sao vLLM cho token đầu tiên sớm hơn và luồng tệ hơn ở cùng thông lượng? Expected: nó tiếp nhận nhiều yêu cầu hơn, 40 so với 37, và lấp 99.5 phần trăm pool của nó trong khi prefill prompt mới ở 460 token mỗi giây; mỗi prefill mới chia sẻ bước với các decode đang chạy, nên các luồng khựng trong khi các token đầu tiên đến sớm hơn.
- **Level 4:** Với độ dài prompt hỗn hợp, vLLM dẫn đầu về luồng, rồi SGLang hòa với nó. Điều gì thay đổi? Expected: cờ mixed-chunk đưa các decode đang chạy vào batch prefill, nên một prompt mới không còn dừng luồng; P99 ITL giảm từ 363 xuống 193 ms với độ dài hỗn hợp, và cái giá là P99 ITL tệ hơn với độ dài cố định, 81 lên 203 ms, vì toàn bộ các đợt khi đó chia sẻ bước với decode.
- **Level 4:** Một so sánh đã công bố cho thấy một engine dẫn trước 29 phần trăm. Bạn hỏi gì trước khi tin nó? Expected: các phiên bản và ngày, liệu workload có khớp với của bạn kể cả tỷ phần prefix lặp lại, liệu các ngân sách bộ nhớ và cờ ngữ cảnh có được khớp, liệu mức đồng thời có vượt giới hạn graph decode, liệu các cờ có được ánh xạ đúng, và ai trả tiền cho kiểm thử.

## Wrong answers

- "Chúng hòa nhau về thông lượng, nên chọn cái nào cũng được." Ở 64 người dùng, khoảng cách P99 giữa token là 1,363 ms trên một bên và 114 trên bên kia ở cùng đầu ra; với chat đó là con số người dùng cảm nhận.
- "Engine có token đầu tiên sớm hơn tốt hơn cho chat." Nó mua token đầu tiên bằng những lần khựng trong luồng; P99 ITL cao hơn 12 lần, và không giới hạn nào sửa được; đọc cả hai con số.
- "Engine nhanh hơn trong benchmark thì nhanh hơn." Chỉ so sánh ở pool và xung nhịp khớp nhau; một kiểm thử đã công bố để một engine ở tỷ phần bộ nhớ tự động của nó và bên kia ở 0.9 bộ nhớ GPU, nên hai pool khác nhau.
- "Kết quả áp dụng được cho lưu lượng hỗn hợp của chúng ta." Bên thắng thay đổi theo hình dạng lưu lượng: ở một pool đầy và theo đợt, một engine bảo vệ luồng, với độ dài hỗn hợp bên kia mặc định dẫn đầu, và một cờ loại bỏ lợi thế đó; đo hỗn hợp độ dài riêng của bạn.

## Taught in

[Đọc benchmark SGLang của người khác](../../../manuals/sglang-101/sections/5-3-reading-other-peoples-benchmarks.md) có so sánh pool khớp nhau, và [Tinh chỉnh chat cho nhiều người dùng](../../../manuals/vllm-101/sections/3-1-tune-chat-for-many-users.md) bổ sung cho GB10 chỉ số P99 ITL.
