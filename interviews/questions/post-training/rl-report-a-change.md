---
id: rl-report-a-change
title: Review a claimed RL speedup before it becomes a default
card: post-training
kind: design
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, ml-depth]
tags: [experiment-hygiene, seeds, benchmarking, thermal, miles]
minutes: 12
lessons: []
manuals: [miles-101#s-repeat-a-run, miles-101#s-keep-runs-comparable, miles-101#s-ref-lab-notes, miles-101#s-choose-what-to-offload]
practice: []
cheatsheet: [miles-rl]
related: [scenarios/prefix-cache-inflated-benchmark]
updated: 2026-11-03
---

Một kỹ sư cho bạn xem hai lần chạy huấn luyện RL. Lần mới, với một thiết lập offload thay đổi, hoàn tất các rollout nhanh hơn mười hai phần trăm và kết thúc với reward cao hơn vài phần trăm đơn vị so với lần cũ. Họ muốn triển khai thay đổi như mặc định mới. Thiết kế đánh giá: bạn yêu cầu gì trước khi tin một trong hai con số?

## Short answer

Yêu cầu độ trải baseline trước khi đọc thay đổi. Trong ba seed baseline của tài liệu, reward cuối nằm từ 0.736 đến 0.766, nên một mức tăng vài phần trăm đơn vị trên một seed nằm trong nhiễu. Sau đó hỏi còn gì khác biệt: cặp offload đầu của tài liệu cũng thay tỷ phần bộ nhớ engine và so sánh các số bước khác nhau, và mười hai phần trăm của nó thu lại còn một đến ba phần trăm trong một cặp cùng ngày chỉ thay một thiết lập. Yêu cầu hai seed, một thay đổi mỗi lần chạy, cùng số bước, và thời gian từ các bước không bị một lần tạm dừng nhiệt nào chạm.

## Full answer

### Know the noise first

Ba lần chạy của một công thức, không gì thay đổi ngoài seed:

| Seed | Reward, 8 bước đầu | Reward, 8 bước cuối |
|---|---|---|
| mặc định | 0.636 | 0.758 |
| 2 | 0.653 | 0.736 |
| 3 | 0.614 | 0.766 |

Cả ba học, và reward cuối vẫn trải 0.03. Quy tắc của tài liệu: một thay đổi 0.01 trên một seed không cho bạn biết gì, và một thay đổi 0.05 trên hai seed đáng một lần chạy thứ ba.

### One change per run

So sánh offload đầu của tài liệu cho thấy một rollout nhanh hơn 12 phần trăm. Hai lần chạy cũng dùng các tỷ phần bộ nhớ engine khác nhau, và các bước sạch của chúng là những bước khác nhau. Trên một bước sạch trong cả hai lần chạy, lần nhanh hơn viết các câu trả lời 599 token so với 695, và thời gian rollout theo độ dài câu trả lời. Một cặp cùng ngày chỉ thay thiết lập offload đo được 1 đến 3 phần trăm.

### Compare the same steps

Các câu trả lời ngắn hơn khi mô hình học, nên thời gian rollout giảm qua một lần chạy. Cùng thiết lập cho một rollout trung vị 47.5 giây trên 48 bước trong một lần chạy và 59.1 giây trên 6 bước sạch của lần khác; trên cùng 6 số bước, lần đầu mất 60.9. Các trung vị trên các bước khác nhau khác biệt chỉ vì lý do đó.

### Time only clean steps

GPU của tài liệu đạt 84 C dưới tải, và một biện pháp bảo vệ tạm dừng container đến khi nó nguội về 74 C. Một lần tạm dừng thêm thời gian thực vào pha nó rơi vào. Báo cáo thời gian từ các bước có cửa sổ không chồng lấn lần tạm dừng nào, và giữ log tạm dừng cạnh log lần chạy.

### What to record for every run

Digest image và commit framework, lệnh đầy đủ, seed, một file log mỗi lần chạy, nhiệt độ GPU và các lần tạm dừng, và mã thoát. Một lần chạy bạn không thể so sánh không dạy gì.

### The review checklist

1. Hai seed của thay đổi, được so sánh với độ trải các seed baseline, không phải với một lần chạy baseline.
2. Một thiết lập thay đổi, với mọi thứ khác giống hệt, gồm tỷ phần bộ nhớ.
3. Các thời gian rollout trên cùng số bước, chỉ từ các bước sạch.
4. Một reward được đọc như trung bình qua nhiều bước, không phải từ bước cuối.
5. Chỉ một khẳng định khi thay đổi nằm ngoài độ trải.

## Follow-ups

- **Level 3:** Tại sao so sánh với độ trải của nhiều seed baseline và không phải baseline tốt nhất? Expected: baseline tốt nhất là một lần rút may mắn; độ trải là sàn nhiễu, và một thay đổi phải vượt nó.
- **Level 3:** Lần chạy mới không có bước sạch, vì mọi rollout chồng lấn một lần tạm dừng. Bạn vẫn có thể báo cáo gì? Expected: trừ thời gian tạm dừng khỏi mỗi bước và nói rõ, như tài liệu làm cho một lần chạy, và đánh dấu kết quả chưa xác nhận.
- **Level 4:** Bạn kiểm thử một thay đổi loss hoặc reward không trả cho các rollout mới như thế nào? Expected: lưu các mẫu rollout của một lần chạy và phát lại chúng chỉ với trainer; mọi lần phát lại thấy cùng mẫu, nên một khác biệt đến từ thay đổi.
- **Level 4:** Hai seed cho thấy mức tăng ngoài độ trải, nhưng khoảng cách bước-0 cũng thay đổi. Tiếp theo? Expected: thay đổi chạm thiết lập, không chỉ thiết lập riêng đó; kiểm tra cả hai lần chạy nạp cùng mô hình và bộ lấy mẫu trước khi ghi công mức tăng.

## Wrong answers

- "Mười hai phần trăm vượt xa nhiễu, triển khai đi." Mười hai phần trăm của tài liệu đến từ hai thiết lập thay cùng lúc và từ các số bước khác nhau; chỉ một thiết lập cho một đến ba phần trăm.
- "Lấy trung bình thời gian rollout trên toàn bộ lần chạy." Trung vị theo độ dài câu trả lời, giảm khi mô hình học; so sánh cùng số bước.
- "Một seed đủ khi mức tăng rõ." Ba seed baseline kết thúc cách nhau 0.03 không có gì thay đổi; vài phần trăm đơn vị trên một seed nằm trong đó.

## Taught in

[Phần 5.3 của Miles 101](../../../manuals/miles-101/sections/5-3-repeat-a-run.md) đưa ra độ trải seed và quy tắc bước sạch, [phần 7.2](../../../manuals/miles-101/sections/7-2-keep-runs-comparable.md) liệt kê những gì ghi lại, và [các ghi chú lab](../../../manuals/miles-101/sections/r-3-lab-notes.md) giải thích tại sao cặp offload đầu không vững.
