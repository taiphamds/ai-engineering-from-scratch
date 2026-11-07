---
id: async-rl-sample-age
title: Design async RL rollout and control the sample age
card: post-training
kind: design
level: 4
roles: [inference-engineer]
rounds: [system-design]
tags: [async-rl, staleness, grpo, weight-update, miles]
minutes: 15
lessons: []
manuals: [miles-101#s-run-rollout-and-training-at-once, miles-101#s-read-the-run, miles-101#s-split-rollout-and-training, miles-101#s-the-correction-methods, miles-101#s-handle-long-responses, miles-101#s-run-a-separate-eval-fleet]
practice: []
cheatsheet: [miles-rl, async-disaggregated-inference]
related: [post-training/gap-remove-before-reweight]
updated: 2026-11-03
---

Bạn chuyển một công việc RL từ một GPU sang một cụm nơi các engine rollout và các trainer chạy trên các thiết bị riêng. Nhóm muốn sinh và huấn luyện chạy cùng lúc, để không phía nào chờ phía kia. Thiết kế thiết lập async: các núm nào quan trọng, lỗi mới nào xuất hiện, và bạn quan sát gì trong log.

## Short answer

Huấn luyện async cho phép các engine sinh batch tiếp theo trong khi trainer cập nhật, với cái giá các mẫu đến từ trọng số cũ hơn. Có hai chế độ: trước một bước, nơi mọi mẫu cũ tối đa một phiên bản trọng số với khoảng cập nhật mặc định, và async hoàn toàn, nơi một worker tiếp tục sinh và trainer rút từ một buffer, nên tuổi phụ thuộc vào trainer rút nhanh thế nào. Đặt một giới hạn tuổi mẫu, quyết định điều gì xảy ra với các yêu cầu đang chạy ở mỗi cập nhật trọng số, và giảm learning rate khi cho phép các mẫu cũ hơn. Theo dõi phiên bản trọng số của mỗi mẫu, tỷ phần các mẫu bị bỏ, clip fraction, và khoảng cách giữa hai phía.

## Full answer

### Why async pays off only on a split layout

Với cả hai phía trên một GPU, chúng thay phiên nhau, và việc sinh dừng trong toàn bộ cửa sổ huấn luyện; chế độ async hoàn toàn cùng vị trí chỉ tồn tại để học các thiết lập. Trên các thiết bị riêng, trainer nhàn rỗi trong rollout và các engine nhàn rỗi trong huấn luyện trừ khi hai bên chồng lấn. Async loại bỏ một phần thời gian chờ đó.

### The knobs

| Thiết lập | Nó quyết định gì |
|---|---|
| `--update-weights-interval` | bao nhiêu bước chạy giữa các cập nhật trọng số đến các engine |
| `--max-weight-staleness` | phiên bản trọng số cũ nhất một mẫu có thể đến từ; không đặt có nghĩa không giới hạn |
| `--async-unused-samples-handler` | bỏ hoặc thử lại một mẫu quá cũ |
| `--async-max-concurrent-samples` | bao nhiêu mẫu các engine sinh cùng lúc |
| `--pause-generation-mode` | điều gì xảy ra với các yêu cầu đang chạy khi cập nhật trọng số: hủy, rút lại, hoặc tại chỗ; rút lại là mặc định |

Kích thước batch lấy mẫu dư không có tác dụng trong chế độ async hoàn toàn.

### The new failure: stale samples

Một mẫu được sinh dưới trọng số cũ hai phiên bản là off-policy đối với trainer. Tỷ số xác suất trainer trên xác suất engine giờ mang một khoảng cách mà các kernel không gây ra. Hai tín hiệu cho thấy nó. Clip fraction, `train/pg_clipfrac`, bằng 0 trong một lần chạy có một cập nhật bộ tối ưu mỗi rollout, vì policy huấn luyện là policy đã lấy mẫu; một clip fraction trên 0 trong một lần chạy như vậy có nghĩa các mẫu không đến từ trọng số hiện tại. Khoảng cách log xác suất tăng theo tuổi vì cùng lý do.

### Learning rate follows age

Một nghiên cứu về GRPO bất đồng bộ trên các mô hình nhỏ thay đổi số bước giữa các cập nhật trọng số và learning rate cùng nhau, và learning rate ổn định lớn nhất giảm tỷ lệ với số bước giữa các cập nhật: số bước gấp đôi, rate khoảng một nửa. Tài liệu chưa kiểm thử nó và đưa ra như quy tắc bắt đầu. Khi bạn tăng khoảng cập nhật hoặc giới hạn tuổi, giảm learning rate cùng hệ số, rồi theo dõi khoảng cách và reward.

### What to watch

- Các thống kê phiên bản trọng số trong các chỉ số rollout: các mẫu cũ bao nhiêu.
- Tỷ phần các mẫu bị bỏ hoặc thử lại. Một tỷ phần cao có nghĩa các engine làm việc vô ích.
- `train/pg_clipfrac` và khoảng cách, được đọc đối chiếu các khoảng của các lần chạy đồng bộ của bạn.
- `perf/update_weights_time` đối chiếu thời gian bước. Trên một bố trí tách, cập nhật là một lần truyền qua mạng, không phải một bản sao trong một GPU, và phương pháp truyền là một lựa chọn riêng.

### Corrections for what remains

Một giới hạn tuổi mẫu bỏ các mẫu tệ nhất. Với phần còn lại, hiệu chỉnh importance-sampling cắt cụt đặt lại trọng số mỗi token bằng tỷ số hai xác suất với một giới hạn. Loại bỏ độ cũ trước khi đặt lại trọng số nó.

## Follow-ups

- **Level 3:** Tại sao clip fraction chính xác bằng 0 trong một lần chạy đồng bộ có một cập nhật mỗi rollout? Expected: policy trong trainer vẫn là policy đã tạo các mẫu, nên mọi tỷ số bằng 1 và không gì chạm khoảng clip.
- **Level 4:** Bạn chọn chế độ tạm dừng nào, và chế độ sai tốn gì? Expected: rút lại giữ công việc của các yêu cầu đang chạy và tiếp tục chúng dưới trọng số mới, trộn các phiên bản trọng số trong một câu trả lời; hủy bỏ công việc đi; tại chỗ thay trọng số dưới một yêu cầu đang chạy; chế độ async hoàn toàn từ chối một số chế độ này, nên đọc trợ giúp cờ của phiên bản bạn.
- **Level 4:** Một câu trả lời một phần bắt đầu dưới phiên bản 5 và kết thúc dưới phiên bản 7. Điều đó xuất hiện ở đâu? Expected: trong khoảng cách, vì một phần token của nó đến từ trọng số cũ hơn trainer giữ; theo dõi khoảng cách sau khi bật partial rollout hoặc tăng giới hạn độ cũ.
- **Level 4:** Một cụm đánh giá chuyên dụng phù hợp thiết kế này như thế nào? Expected: nó nạp các bản chụp checkpoint và không bao giờ tham gia các cập nhật trọng số huấn luyện, nên độ trễ của nó được báo cáo bằng bước; trong phiên bản tài liệu đọc, nó không kết hợp với chịu lỗi rollout.

## Wrong answers

- "Cũng chạy async hoàn toàn trên GPU đơn; đó là cùng mã." Với một GPU, hai phía vẫn thay phiên và sinh dừng trong huấn luyện, nên bạn trả chi phí độ cũ và không có chồng lấn.
- "Để giới hạn độ cũ không đặt, để không mẫu nào bị lãng phí." Không đặt có nghĩa không giới hạn; các mẫu rất cũ kéo cập nhật theo hướng sai, và khoảng cách tăng mà không có nguyên nhân trong các kernel.
- "Giữ learning rate từ lần chạy đồng bộ." Rate ổn định giảm theo tuổi các mẫu; tăng khoảng cập nhật và bạn giảm rate cùng khoảng hệ số.

## Taught in

[Phần 4.1 của Miles 101](../../../manuals/miles-101/sections/4-1-run-rollout-and-training-at-once.md) liệt kê các chế độ và thiết lập async, [phần 5.1](../../../manuals/miles-101/sections/5-1-read-the-run.md) đọc clip fraction như một tín hiệu độ cũ, và [phần 6.1](../../../manuals/miles-101/sections/6-1-split-rollout-and-training.md) trình bày bố trí tách và truyền trọng số.
