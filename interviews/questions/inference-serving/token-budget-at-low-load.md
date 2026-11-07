---
id: token-budget-at-low-load
title: A larger token budget at low load
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer]
rounds: [design-review, ml-depth]
tags: [token-budget, chunked-prefill, p99-itl, ttft]
minutes: 10
lessons: []
manuals: [vllm-101#s-keep-long-prompts-from-stalling-short-ones]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một đồng đội đề xuất `--max-num-batched-tokens 16384` để các prompt dài nhận token đầu tiên sớm hơn. Máy chủ chạy một mô hình có các lớp mixture-of-experts trên một card. Các yêu cầu đến ở khoảng nửa yêu cầu mỗi giây, với prompt dài từ 1,024 đến 4,096 token. Bạn kỳ vọng gì thay đổi, và bạn sẽ đo gì trước khi chấp nhận thay đổi?

## Short answer

Một ngân sách lớn hơn cho phép một prompt dài hoàn tất prefill trong ít bước hơn, nhưng mỗi bước đó mất lâu hơn, và mọi luồng đang chạy chờ nó. Ở tải thấp, tôi kỳ vọng token đầu tiên nhanh hơn và P99 ITL tệ hơn, và tôi sẽ đo cả hai với nhiều seed ở tốc độ yêu cầu thực. Trên GB10 của chúng tôi ở 0.5 yêu cầu mỗi giây, 16,384 tăng P99 ITL từ 574 lên 798 ms, trong khi mức cải thiện token đầu tiên không vượt được độ trải seed.

## Full answer

### What the manual measured

Các ngân sách 2,048 và 16,384 token trên GB10 với Qwen3-30B-A3B, các yêu cầu ở tốc độ cố định, ba seed mỗi điểm, mỗi yêu cầu xin 64 đến 256 token:

| Yêu cầu mỗi giây | Ngân sách | TTFT trung vị | TPOT trung vị | P99 ITL |
|---|---|---|---|---|
| 0.5 | 2,048 | 1,145 ms | 149.3 ms | 574 ms |
| 0.5 | 16,384 | 906 ms | 139.4 ms | 798 ms |
| 1 | 2,048 | 454 ms | 156.5 ms | 405 ms |
| 1 | 16,384 | 477 ms | 156.9 ms | 395 ms |
| 2 | 2,048 | 560 ms | 205.5 ms | 587 ms |
| 2 | 16,384 | 595 ms | 205.1 ms | 586 ms |

Ở 0.5 yêu cầu mỗi giây, ngân sách lớn hơn tăng P99 ITL thêm 39 phần trăm, và các khoảng seed không chồng lấn. Token đầu tiên đến sớm hơn, nhưng các khoảng seed của token đầu tiên chồng lấn. Vì vậy chi phí rõ ràng và mức tăng chưa được xác nhận. Ở 1 và 2 yêu cầu mỗi giây, hai ngân sách cho cùng các con số trong các khoảng seed. Tất cả lần chạy giữ xung nhịp trung vị từ 2,398 đến 2,411 MHz, nên xung nhịp không giải thích dòng nào.

### Why the effect fades with the rate

Ở tốc độ cao hơn, nhiều yêu cầu hơn chia sẻ mỗi bước. Một prompt dài khi đó lấp một tỷ phần nhỏ hơn của ngân sách, và cách nó được chia chunk ít quan trọng hơn. Kết quả hẹp: hai ngân sách, ba tốc độ thấp, một mô hình, một máy. Bài báo P-PAS tìm thấy rằng không một ngân sách cố định duy nhất nào tốt nhất ở mọi tải: một ngân sách lớn thắng ở áp lực prefill thấp, một ngân sách nhỏ khi nhiều prefill cạnh tranh với các luồng đang chạy.

### An open result

Token đầu tiên trung vị ở 0.5 yêu cầu mỗi giây chậm hơn ở 1 yêu cầu mỗi giây cho cả hai ngân sách. Cả ba seed ở 0.5 đều trên 900 ms với ngân sách 2,048, và cả ba ở 1 đều dưới 600 ms. Một seed chậm không giải thích điều đó. Tài liệu không tìm thấy nguyên nhân và nói rõ như vậy.

### How to decide

1. Đọc ngân sách mà máy chủ của bạn dùng. Lần chạy không có cờ khớp với 2,048 trên máy này.
2. Nếu P99 ITL quá cao và các prompt dài đến, giảm ngân sách.
3. Nếu token đầu tiên của các prompt dài quá chậm và P99 ITL còn dư địa, tăng nó.
4. Đo ở tốc độ yêu cầu thực của bạn, và một lần nữa khi tải thay đổi.

`--long-prefill-token-threshold` giới hạn các token mà một prompt dài nhận trong một bước khi những yêu cầu khác đang chờ. Nó mặc định tắt và tài liệu không kiểm thử nó.

## Follow-ups

- **Level 3:** Ở hai tốc độ cao hơn, các ngân sách hòa nhau. Tại sao khác biệt biến mất khi tốc độ tăng? Expected: nhiều yêu cầu hơn chia sẻ mỗi bước, nên một prompt dài lấp một tỷ phần nhỏ hơn của ngân sách và cách chia chunk của nó ít quan trọng hơn.
- **Level 3:** Cả hai ngân sách cho token đầu tiên muộn hơn ở tốc độ thấp nhất so với tốc độ tiếp theo. Bạn báo cáo điều đó như thế nào? Expected: cả ba seed đồng ý, nên đó không phải một seed chậm; nguyên nhân không được tìm thấy, nên nó vẫn là một kết quả mở và không quy tắc nào được xây dựng trên nó.
- **Level 4:** Có một ngân sách thắng ở mọi tải không? Expected: không; một ngân sách lớn thắng khi áp lực prefill thấp và một ngân sách nhỏ khi nhiều prefill cạnh tranh với các luồng, nên giá trị phải thay đổi theo tải.

## Wrong answers

- "Một ngân sách lớn hơn không tốn gì vì GPU có tính toán dư ở tải thấp." Mỗi bước có một chunk lớn hơn mất lâu hơn và mọi luồng đang chạy chờ nó; P99 ITL tăng 39 phần trăm ở 0.5 yêu cầu mỗi giây.
- "Đặt ngân sách một lần từ kích thước GPU rồi để đó." Giá trị tốt nhất thay đổi theo tốc độ yêu cầu trong các lần chạy này, nên đo ở tốc độ thực của bạn và một lần nữa khi tải thay đổi.
- "Mức giảm từ 1,145 xuống 906 ms chứng minh mức cải thiện token đầu tiên." Các khoảng seed của token đầu tiên chồng lấn, nên chi phí được xác nhận và mức tăng thì không.

## Taught in

[Ngăn prompt dài làm khựng prompt ngắn](../../../manuals/vllm-101/sections/3-3-keep-long-prompts-from-stalling-short-ones.md) có sáu dòng đã đo và thứ tự tinh chỉnh.
