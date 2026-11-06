---
id: router-decides-hit-rate
title: A second replica that undoes the prefix cache
card: cost-capacity
kind: design
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [routing, prefix-cache, replicas, session-affinity]
minutes: 15
lessons: [phases/17-infrastructure-and-production/19-ai-gateways]
manuals: [sglang-101#s-sgl-model-gateway, vllm-101#s-run-vllm-on-kubernetes]
practice: []
cheatsheet: [sglang-serving, llm-routing-gateways, gpu-kubernetes]
related: [cost-capacity/hit-rate-gauge-lies, inference-serving/prefix-cache-order]
updated: 2026-11-03
---

Bạn thêm một replica phục vụ thứ hai để tăng gấp đôi năng lực. Throughput tăng, nhưng thời gian token đầu tiên của các phiên chat dài trở nên tệ hơn, và hit rate cache trên cả hai máy chủ giảm. Giải thích nguyên nhân, và thiết kế định tuyến để replica thứ hai ngừng phá tác dụng của cache.

## Short answer

Mỗi replica có KV cache riêng, và một router phân tán các request ngẫu nhiên hoặc lần lượt gửi lượt năm của một cuộc chat đến replica chưa từng thấy các lượt một đến bốn. Replica đó prefill lại toàn bộ lịch sử, chính là prefix miss mà cache tồn tại để tránh. Định tuyến mỗi cuộc hội thoại trở lại replica giữ tiền tố của nó bằng một chính sách nhận biết cache ghi nhớ máy chủ nào đã thấy văn bản nào, với một phép kiểm tra cân bằng tải trước nó. Rồi đọc hit rate trên chính các máy chủ, vì bản ghi của router là một phỏng đoán.

## Full answer

### The mechanism

Một Kubernetes Service thông thường phân tán các request ngẫu nhiên. Bộ điều khiển data parallel bên trong máy chủ của SGLang mặc định dùng round robin, bỏ qua các tiền tố. Dù cách nào, các lượt của một cuộc hội thoại đến các replica khác nhau, và mỗi replica tính lịch sử mà replica còn lại đã giữ. Một báo cáo thực địa trong tài liệu SGLang đo thiệt hại: với định tuyến từng lượt, 23 phần trăm token đầu vào được tính lại. Một request header ghim mỗi cuộc hội thoại vào một GPU nâng hit rate cache từ 64.7 lên 92.1 phần trăm và giảm một nửa trung vị thời gian đến token đầu tiên.

### How a cache-aware router picks a server

Gateway SGLang giữ một radix tree xấp xỉ cho mỗi mô hình, trên các ký tự của văn bản request, vì vậy nó không bao giờ tokenize để định tuyến. Với mỗi request nó làm ba việc theo thứ tự:

1. Nó kiểm tra cân bằng. Khi tải của máy chủ bận nhất cao hơn máy nhẹ nhất hơn 64 và hơn 1.5 lần máy nhẹ nhất, request đi đến máy chủ có tải thấp nhất.
2. Nếu không nó tính match rate, tỷ lệ văn bản request khớp với cây. Trên 0.3, request đi đến máy chủ có phần khớp dài nhất.
3. Dưới 0.3, nó đi đến máy chủ có tải thấp nhất.

Cứ mỗi 120 giây một tác vụ nền cắt mỗi cây xuống tối đa 67,108,864 nút. Phép kiểm tra cân bằng chủ ý đến trước: một chính sách ưu tiên tiền tố sẽ dồn mọi cuộc hội thoại dài lên một máy chủ nóng.

### The tree is a guess

Gateway ghi lại nơi nó gửi văn bản. Nó không bao giờ hỏi một máy chủ còn giữ gì, và một máy chủ có thể loại tiền tố sau đó. Vì vậy một request có thể đến máy chủ mà cây nêu và vẫn prefill. Kiểm tra hit rate trên chính các máy chủ, từ các counter của chúng trong một khoảng thời gian, chứ không chỉ các quyết định định tuyến.

### Pick the policy by traffic

Định tuyến nhận biết cache cho lưu lượng chat và agent, nơi các lượt dùng chung các tiền tố dài. Một chính sách power-of-two hoặc round-robin cho lưu lượng batch với các prompt riêng biệt, vì một match rate dưới ngưỡng dù sao cũng không tạo ái lực. Không đặt lưu lượng nhiều lượt sau data parallelism bên trong máy chủ với mặc định round-robin của nó.

### The same idea in the vLLM layers

Tài liệu vLLM liệt kê các router đọc các metric của engine để chọn một replica, và một router cũng đọc các sự kiện KV cache mà engine công bố bằng `--kv-events-config`, để một request đi đến replica giữ tiền tố của nó. Router của production stack giữ một phiên trên một replica. Theo từ vựng của bài học gateway, đây là định tuyến nhà cung cấp ở một cấp thấp hơn: AI gateway định tuyến giữa các nhà cung cấp, và engine router định tuyến giữa các replica.

### Pin the router with the engine

Tài liệu SGLang ghi lại một sự cố nơi cùng bản dựng engine cho 132,140 token mỗi giây với một phiên bản router và 69,767 với phiên bản tiếp theo. Benchmark router và engine như một hệ thống, và ghim cả hai phiên bản.

## Follow-ups

- **Level 3:** Tại sao router kiểm tra cân bằng tải trước phép khớp tiền tố? Expected: một chính sách ưu tiên tiền tố sẽ gửi mọi cuộc hội thoại dài đến một máy chủ nóng. Phép kiểm tra mất cân bằng gửi request đến máy chủ có tải thấp nhất khi khoảng cách lớn.
- **Level 3:** Lưu lượng nào không nên dùng chính sách nhận biết cache? Expected: lưu lượng batch với các prompt riêng biệt. Một match rate dưới ngưỡng không tạo ái lực, vì vậy một chính sách dựa trên tải làm cùng công việc với ít trạng thái hơn.
- **Level 4:** Hit rate của một máy chủ giữ thấp dù gateway định tuyến các cuộc hội thoại của nó đến đó. Tại sao? Expected: cây của gateway ghi lại nơi nó gửi văn bản, không phải thứ máy chủ còn giữ. Máy chủ đã loại tiền tố, vì vậy request prefill. Đọc các counter riêng của máy chủ.
- **Level 4:** Bạn nâng cấp router mà không đụng engine. Bạn đo gì? Expected: throughput và hit rate của router cùng engine như một hệ thống, vì chỉ một thay đổi router đã giảm một nửa throughput trong một sự cố được báo cáo.

## Wrong answers

- "Thêm một replica và hit rate của mỗi máy chủ giữ nguyên." Mỗi replica có cache riêng, và định tuyến ngẫu nhiên chia mọi cuộc hội thoại qua cả hai.
- "Hash user id đến một máy chủ rồi xong." Nó giữ một người dùng trên một máy chủ và bỏ qua tải. Gateway của tài liệu cân bằng trước, để một người dùng nóng không thể làm bão hòa một replica mà không được giảm tải.
- "Bật data parallelism bên trong máy chủ thay vì một gateway." Phương thức mặc định của nó là round robin, bỏ qua các tiền tố, chính là vấn đề bạn đang giải quyết.

## Taught in

[Phần model gateway của SGLang 101](../../../manuals/sglang-101/sections/6-4-sgl-model-gateway.md) giải thích định tuyến nhận biết cache và báo cáo thực địa, [phần Kubernetes của vLLM 101](../../../manuals/vllm-101/sections/6-4-run-vllm-on-kubernetes.md) nêu các router đọc metric engine và sự kiện cache, và [bài học AI gateway](../../../phases/17-infrastructure-and-production/19-ai-gateways/) đặt định tuyến trong số các tính năng gateway.
