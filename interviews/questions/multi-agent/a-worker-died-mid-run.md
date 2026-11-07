---
id: a-worker-died-mid-run
title: A worker died mid-run, and the user paid for the run
card: multi-agent
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [durable-execution, checkpoint, idempotency, outbox, rainbow-deploy]
minutes: 15
lessons: [phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints]
manuals: []
practice: []
cheatsheet: [production-agent-runtimes, multi-agent]
related: []
updated: 2026-11-03
---

Nguyên mẫu đa agent của bạn chạy trong một tiến trình với một vòng lặp sự kiện trong bộ nhớ. Trong production, các lần chạy kéo dài hàng giờ trong khi chờ đầu vào con người, các tiến trình worker crash và mất mọi thứ, tải đỉnh gấp mười lần trung bình, và người dùng bị tính phí mỗi lần chạy nên một tác dụng phụ được thử lại là một lần tính phí kép. Thiết kế lớp nằm dưới các agent, và nói bạn sẽ xây gì trước.

## Short answer

Đặt một lớp thực thi bền vững dưới các agent: lưu bền toàn bộ trạng thái lần chạy sau mỗi bước dưới một run id, để khi một worker crash, lease của nó hết hạn và bất kỳ worker nào khác tiếp tục từ checkpoint cuối. Điều đó cần trạng thái có thể tuần tự hóa, một lần tiếp tục có tính xác định, và các tác dụng phụ lũy đẳng. Với khoản phí, dùng một khóa chống trùng mỗi lần chạy và một outbox để các tác dụng phụ được ghi thành ý định trước và thực thi một lần, dùng I/O bất đồng bộ cho các lời gọi mô hình, và triển khai các phiên bản mới cạnh phiên bản cũ để các lần chạy đang diễn ra không bao giờ bị giết. Xây phiên bản đơn giản nhất trước, một dịch vụ web với một cơ sở dữ liệu quan hệ, và áp dụng một workflow engine khi một vấn đề được đo đòi hỏi nó.

## Full answer

### The resume path

```text
worker crashes mid-step
  -> lease times out
  -> another worker picks up the run id
  -> resumes from the last checkpoint
  -> no duplicate side effect
```

Ba yêu cầu khiến điều này hoạt động:

1. **Trạng thái có thể tuần tự hóa.** Mọi thứ agent giữ phải có thể lưu bền. Một closure với một kết nối cơ sở dữ liệu đang hoạt động không sống sót qua một crash.
2. **Tiếp tục có tính xác định.** Với cùng trạng thái và cùng đầu vào, agent thực hiện cùng hành động, hoặc dùng một kết quả đã ghi cho các lời gọi mô hình.
3. **Các tác dụng phụ lũy đẳng.** Mọi lời gọi bên ngoài mang một khóa, hoặc ghi vào một bảng trước và được thực thi bởi một tiến trình riêng.

Các graph runtime ghi một checkpoint sau mỗi bước dưới một thread id. Các workflow engine ghi sau mỗi activity. Các runtime event-sourced giữ một nhật ký. Mẫu giống nhau.

### The waiting run

Một lần chạy chờ hàng giờ cho một người không được giữ một worker. Runtime lưu bền lần chạy, giải phóng worker, và bất kỳ worker nào tiếp tục khi đầu vào đến. Đó là điều khiến checkpoint là đơn vị của hệ thống thay vì tiến trình.

### Exactly once, effectively

Phân phối ít nhất một lần cộng một bên tiêu thụ lũy đẳng là loại chính xác một lần duy nhất bạn nhận được.

| Biện pháp | Nó làm gì |
|---|---|
| Khóa chống trùng mỗi lần chạy | Được bao gồm trong mọi lời gọi tác dụng phụ để một lần thử lại được nhận ra |
| Outbox | Ý định được ghi vào một bảng, và một bộ thực thi riêng thực hiện nó rồi đánh dấu hoàn tất |
| Giao dịch bù | Khi tác động thành công và lần ghi theo dõi thất bại, lên lịch thao tác đảo ngược |

Đây là các mẫu cơ sở dữ liệu. Chi phí riêng của agent duy nhất là các lời gọi mô hình chậm.

### Concurrency

Các lời gọi mô hình bị giới hạn bởi I/O, và một thread chờ token tiếp theo nhàn rỗi 99 phần trăm thời gian. Ở 10,000 lời gọi đồng thời, các thread khoảng 1 MB mỗi thread cần khoảng 10 GB chỉ cho stack, trong khi các fiber hợp tác vừa trong một tiến trình. Dùng I/O bất đồng bộ cho lớp mô hình và các thread hoặc tiến trình chỉ cho công việc bị giới hạn bởi CPU như embedding.

### Deploys

Các agent có trạng thái chạy lâu không thể được thay nóng. Chạy nhiều phiên bản runtime cùng lúc, gửi một phần các lần chạy mới đến phiên bản mới, và ngừng phiên bản cũ khi các lần chạy của nó hoàn tất.

### What to build first

Luận điểm đối trọng của bài học là phần lớn nhóm thiết kế quá mức trước khi đo. Một dịch vụ web và một cơ sở dữ liệu quan hệ, với mỗi lần chạy là một hàng, đồng thời lạc quan trên trạng thái, một worker nền đơn giản và các lần thử lại ở cấp ứng dụng, gánh tải dưới khoảng 100 lần chạy đồng thời trên các tác vụ quản lý được. Áp dụng một engine thực thi bền vững khi bạn gặp một vấn đề cụ thể mà thiết kế đơn giản không thể giải quyết: các lần chờ hàng giờ ở quy mô lớn, phối hợp xuyên vùng, hoặc các chính sách bù phức tạp.

## Follow-ups

- **Level 3:** Tại sao lời gọi mô hình là phần khó của tiếp tục có tính xác định? Expected: nó không có tính xác định, nên lần tiếp tục phải phát lại kết quả đã ghi của lời gọi thay vì gọi lại.
- **Level 3:** Lease làm gì? Expected: nó đánh dấu một lần chạy được một worker sở hữu trong thời gian bị giới hạn, để một crash giải phóng lần chạy cho một worker khác mà không có hai worker chạy nó cùng lúc.
- **Level 4:** Bạn kiểm thử outbox như thế nào? Expected: chạy cùng tác dụng phụ hai lần qua bộ thực thi và assert một lời gọi bên ngoài, rồi làm bộ thực thi crash giữa tác động và dấu hoàn tất và assert rằng thao tác bù hoặc làm lại lũy đẳng để lại một tác động.
- **Level 4:** Tính năng nào của một workflow engine khó sao chép bằng tay nhất, và đó có phải lý do áp dụng nó không? Expected: một lựa chọn có lý lẽ như các bộ hẹn giờ bền vững cho các lần chờ hàng giờ hoặc các chính sách bù, với quy tắc việc áp dụng theo sau một thất bại được đo của thiết kế đơn giản.

## Wrong answers

- "Thử lại toàn bộ lần chạy từ đầu khi một worker chết." Điều đó lặp mọi tác dụng phụ đã xảy ra, chính là khoản phí kép trong prompt.
- "Dùng một thread mỗi lần chạy; nó đơn giản hơn." Các thread nhàn rỗi trong khi chờ token, và ở mười nghìn lời gọi đồng thời, chỉ các stack đã làm cạn bộ nhớ.
- "Áp dụng một workflow engine từ ngày đầu cho chắc." Thiết kế đơn giản gánh khoảng một trăm lần chạy đồng thời, và các thủ tục của engine tốn thời gian đến khi một vấn đề được đo trả giá cho nó.

## Taught in

[Bài học mở rộng production](../../../phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/) xây dựng kho checkpoint, hàng đợi mỗi agent và demo bất đồng bộ, và chốt quy tắc bắt đầu đơn giản.
