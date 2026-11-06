---
id: autoscale-on-the-right-signal
title: Autoscale a model service on queue and cache signals
card: cost-capacity
kind: design
level: 3
roles: [inference-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [autoscaling, kubernetes, probes, cold-start]
minutes: 15
lessons: [phases/17-infrastructure-and-production/10-cold-start-mitigation]
manuals: [vllm-101#s-run-vllm-on-kubernetes, vllm-101#s-watch-vllm-in-production, sglang-101#s-operating-sglang]
practice: []
cheatsheet: [gpu-kubernetes, serving-engines-compared]
related: [cost-capacity/warm-pool-or-cold-start, cost-capacity/size-the-pool-from-peak]
updated: 2026-11-03
---

Dịch vụ mô hình của bạn chạy dưới dạng một Deployment thông thường với một autoscaler dựa trên mức sử dụng CPU. Trong một đợt lưu lượng tăng vọt autoscaler thêm replica muộn, tiếp tục thêm chúng trong khi các pod mới vẫn đang nạp trọng số, và một liveness probe khởi động lại pod bận nhất giữa đợt tăng vọt. Thiết kế lại việc mở rộng quy mô và các probe.

## Short answer

Mở rộng quy mô theo các tín hiệu riêng của engine, không theo CPU: số request đang chờ và mức sử dụng KV cache cho biết một máy chủ đã bão hòa từ lâu trước khi CPU cho biết. Cho startup probe một khoảng thời gian dài hơn cold start đã đo của bạn, để một pod đang nạp không bị gửi lưu lượng đến cũng không bị khởi động lại, và làm cho liveness probe nhẹ, để một máy chủ bận không mất pod bận nhất vì một probe đã chờ trong hàng đợi. Giữ các trọng số và compile cache trên bộ lưu trữ bền vững, để một replica mới sẵn sàng trong một phần nhỏ thời gian.

## Full answer

### Why CPU is the wrong signal

Tải GPU không phải tải CPU. Một engine bão hòa cho thấy các request đang chờ trên không và mức sử dụng cache gần một trong khi CPU trông bình lặng. Tài liệu vLLM nói điều này trực tiếp về Deployment thông thường: nó định tuyến ngẫu nhiên và mở rộng quy mô theo tín hiệu sai. Các lớp định tuyến mà tài liệu liệt kê đọc `vllm:num_requests_waiting`, `vllm:num_requests_running` và `vllm:kv_cache_usage_perc` để chọn một replica, và một autoscaler nên đọc cùng các chuỗi đó.

### Read the signals in pairs

| Số đọc | Ý nghĩa |
|---|---|
| đang chờ trên 0, mức sử dụng cache dưới 0.9 | kích thước batch hoặc ngân sách token giới hạn việc tiếp nhận, không phải bộ nhớ |
| đang chờ trên 0, mức sử dụng cache gần 1 | pool giới hạn việc tiếp nhận, vì vậy thêm bộ nhớ hoặc replica |
| token đầu tiên chậm khi không có gì đang chờ | prompt dài hoặc một tokenizer chậm, không phải vấn đề dung lượng |
| các lần preemption với các câu trả lời dài | các request đang chạy tăng lên cho đến khi pool cạn |

Hàng thứ hai là một lý do để thêm một replica, vì pool đã đầy. Ở hàng thứ nhất, tăng giới hạn batch hoặc ngân sách token trước, trong khi pool còn chỗ. Nếu hàng đợi vẫn còn sau đó, hoặc giới hạn đã ở mức mà mục tiêu độ trễ cần, thêm một replica, vì mỗi replica mang theo giới hạn batch và ngân sách token riêng của nó.

### Probes that match a slow start

Ví dụ của tài liệu cho startup probe 90 lần kiểm tra cách nhau 10 giây, là 15 phút, và ghi chú rằng chính máy của nó mất khoảng 8 phút cho lần khởi động đầu tiên. Đặt khoảng thời gian từ cold start đã đo của bạn. Đối với readiness, gửi một request thật ngắn, chứng minh engine có thể sinh, hoặc dùng ready endpoint trên một engine có endpoint đó. Đối với liveness, dùng một đường dẫn health nhẹ. Tài liệu SGLang tắt việc sinh trong health endpoint, vì một probe có sinh chờ trong hàng đợi dưới tải, hết thời gian sau 20 giây, và đánh dấu một máy chủ bận là không khỏe. Trong một sự cố mỗi probe thất bại cũng để lại một request mồ côi trong scheduler, vì vậy các probe làm tăng tải mà chúng được dùng để phát hiện.

### Stop the overshoot

Các pod mới mất nhiều phút để nạp. Autoscaler thấy tín hiệu vẫn cao và thêm nữa. Cho nó một khoảng thời gian ổn định ít nhất dài bằng cold start, giới hạn số replica được thêm mỗi bước, và rút ngắn chính cold start: trọng số trên đĩa cục bộ, compile cache trên một persistent volume, và một lần nạp trước trước khi máy chủ nhận lưu lượng. Bài học cold start thêm warm pool cho đường tương tác, để replica đầu tiên không bao giờ là một replica lạnh.

### Scale down without losing work

Loại pod khỏi bộ cân bằng tải, chỉ gửi SIGTERM đến tiến trình chính, và đặt một thời gian ân hạn ít nhất dài bằng request dài nhất tại giới hạn đầu ra. Một lần buộc dừng, hoặc một tín hiệu đến toàn bộ nhóm tiến trình, làm mất mọi request đang chạy.

## Follow-ups

- **Level 3:** Cặp số đọc nào cho biết pool là nút thắt, không phải giới hạn batch? Expected: các request đang chờ trên không với mức sử dụng cache gần một. Với mức sử dụng cache dưới 0.9, thay vào đó kích thước batch hoặc ngân sách token giới hạn việc tiếp nhận.
- **Level 3:** Tại sao một health probe có sinh gây hại dưới tải? Expected: request của nó chờ trong hàng đợi như mọi request khác, hết thời gian, và đánh dấu một máy chủ bận là không khỏe. Trong một sự cố mỗi probe thất bại cũng để lại một request mồ côi.
- **Level 4:** Bạn giữ autoscaler không mở rộng quá mức trong một cold start như thế nào? Expected: một khoảng thời gian ổn định ít nhất dài bằng cold start đã đo, một giới hạn số replica được thêm mỗi bước, và một cold start ngắn hơn nhờ trọng số và compile cache bền vững.
- **Level 4:** Một lần thu hẹp quy mô cần gì để không mất request nào? Expected: loại pod khỏi bộ cân bằng tải, chỉ gửi SIGTERM đến tiến trình chính, và một thời gian ân hạn ít nhất dài bằng request dài nhất tại giới hạn đầu ra.

## Wrong answers

- "Mở rộng quy mô theo mức sử dụng GPU thay vì CPU." Mức sử dụng có thể được đọc là cao trong khi các request chờ và thấp trong khi pool đầy. Hàng đợi và mức sử dụng cache là các tín hiệu engine cung cấp cho việc này.
- "Làm liveness probe nghiêm ngặt hơn để các pod hỏng khởi động lại nhanh hơn." Dưới tải một probe nghiêm ngặt khởi động lại các pod khỏe, bận. Cách sửa là một probe nhẹ và một khoảng thời gian khởi động dài.
- "Thêm replica nhanh hơn để vượt qua đợt tăng vọt." Các replica mất nhiều phút để nạp không thêm được gì trong đợt tăng vọt và tốn tiền sau đó. Rút ngắn cold start và giữ một khoảng dự phòng ấm.

## Taught in

[Phần Kubernetes của vLLM 101](../../../manuals/vllm-101/sections/6-4-run-vllm-on-kubernetes.md) đặt các probe và nêu tín hiệu mở rộng quy mô sai, [phần theo dõi production](../../../manuals/vllm-101/sections/5-2-watch-vllm-in-production.md) đọc các metric theo cặp, [phần vận hành của SGLang 101](../../../manuals/sglang-101/sections/7-1-operating-sglang.md) giải thích sự cố health probe và việc drain, và [bài học cold start](../../../phases/17-infrastructure-and-production/10-cold-start-mitigation/) định kích thước warm pool.
