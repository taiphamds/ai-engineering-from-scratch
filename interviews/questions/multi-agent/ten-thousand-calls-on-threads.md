---
id: ten-thousand-calls-on-threads
title: Ten thousand concurrent model calls on threads
card: multi-agent
kind: estimate
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [async, threads, concurrency, memory, io-bound]
minutes: 8
lessons: [phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints]
manuals: []
practice: []
cheatsheet: [production-agent-runtimes]
related: [multi-agent/a-worker-died-mid-run]
updated: 2026-11-03
---

Một runtime swarm dùng một thread mỗi lời gọi mô hình đang diễn ra. Ở đỉnh nó giữ khoảng 10,000 lời gọi cùng lúc. Ước lượng bộ nhớ các thread chiếm trước khi bất kỳ công việc nào được làm, nói những thread đó đang làm gì phần lớn thời gian, và nói bạn sẽ thay đổi gì.

## Short answer

Một stack thread khoảng 1 MB, nên 10,000 thread cần khoảng 10 GB bộ nhớ chỉ cho stack, trước khi token đầu tiên đến. Những thread đó nhàn rỗi khoảng 99 phần trăm thời gian, chờ token tiếp theo từ một dịch vụ mô hình. Chuyển các lời gọi mô hình sang các fiber hợp tác qua I/O bất đồng bộ, nơi cùng 10,000 lời gọi vừa trong một tiến trình, và chỉ giữ thread hoặc tiến trình cho công việc bị giới hạn bởi CPU như embedding.

## Full answer

### The estimate

| Đại lượng | Giá trị |
|---|---|
| Stack mỗi thread | khoảng 1 MB |
| Lời gọi đồng thời | 10,000 |
| Bộ nhớ cho stack | khoảng 10 GB |

Đó là chi phí giữ các lời gọi mở, không phải làm bất cứ thứ gì với chúng. Một lời gọi mô hình bị giới hạn bởi I/O. Thread gửi một yêu cầu rồi chờ token, và nó nhàn rỗi khoảng 99 phần trăm vòng đời.

### What fibers change

Các fiber hợp tác nhường khi I/O thay vì giữ một stack trong khi chờ. Trong demo của bài học, 500 lời gọi mô phỏng đồng thời hoàn tất trong dưới một giây trên phiên bản bất đồng bộ, trong khi phiên bản thread mất vài giây và dùng bộ nhớ nhiều hơn nhiều bậc độ lớn mỗi đơn vị đồng thời. Ở quy mô agent, I/O bất đồng bộ là kiến trúc, không phải một tối ưu hóa.

### The exception

Hậu xử lý bị giới hạn bởi CPU muốn thread hoặc tiến trình: embedding, các thủ thuật tokenizer, bất cứ thứ gì tính toán thay vì chờ. Tách lớp I/O khỏi lớp CPU và cấp cho mỗi lớp mô hình đồng thời riêng.

### How this fits the rest of the runtime

Lớp bất đồng bộ xử lý các lời gọi đang diễn ra. Tính bền vững là một mối quan tâm riêng: một checkpoint mỗi bước dưới một run id để một crash của tiến trình làm mất các lời gọi đang diễn ra và không gì khác, và bất kỳ worker nào tiếp tục từ checkpoint cuối. Tải đỉnh gấp mười lần trung bình là một lý do cho cả hai: fiber để giữ các lời gọi ít tốn kém, và các hàng đợi có lease để phân bố chúng qua các worker.

## Follow-ups

- **Level 2:** Tại sao số thread quan trọng hơn số yêu cầu? Expected: mỗi thread giữ một stack dù nó có đang làm việc hay không, nên bộ nhớ tỷ lệ với mức đồng thời, không phải thông lượng.
- **Level 2:** Điều gì hỏng nếu bạn chạy bước embedding trên vòng lặp bất đồng bộ? Expected: một tác vụ bị giới hạn bởi CPU chặn vòng lặp, nên mọi lời gọi đang chờ khựng phía sau nó, đó là lý do công việc CPU đến thread hoặc tiến trình.
- **Level 3:** Bộ nhớ vừa sau thay đổi. Giới hạn tiếp theo là gì? Expected: các giới hạn tốc độ của dịch vụ mô hình và độ sâu hàng đợi, nên runtime cần áp lực ngược và một lease mỗi lần chạy thay vì thêm đồng thời.
- **Level 3:** Bạn chứng minh thay đổi trước khi triển khai như thế nào? Expected: chạy so sánh của bài học trên hình dạng lời gọi riêng của bạn, đo thời gian thực và bộ nhớ đỉnh cho cả hai phiên bản ở cùng mức đồng thời, và giữ các con số cạnh quyết định.

## Wrong answers

- "Thêm bộ nhớ đến khi các thread vừa." Bộ nhớ cho các stack nhàn rỗi là lãng phí, và đỉnh tiếp theo cần thêm, trong khi fiber loại bỏ chi phí.
- "Làm các thread nhỏ hơn với một kích thước stack giảm." Một stack nhỏ hơn vẫn là một stack mỗi lời gọi nhàn rỗi, và thời gian nhàn rỗi giữ ở 99 phần trăm.
- "Dùng fiber cho mọi thứ, kể cả embedding." Một bước bị giới hạn bởi CPU trên vòng lặp hợp tác chặn mọi lời gọi đang chờ, nên lớp CPU giữ thread hoặc tiến trình.

## Taught in

[Bài học mở rộng production](../../../phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/) chạy các phiên bản bất đồng bộ và thread cạnh nhau.
