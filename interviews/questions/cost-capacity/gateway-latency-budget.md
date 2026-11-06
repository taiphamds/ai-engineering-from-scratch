---
id: gateway-latency-budget
title: Which gateways fit in a 20 ms tail budget
card: cost-capacity
kind: estimate
level: 2
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [ai-gateway, latency-budget, ttft, p99]
minutes: 8
lessons: [phases/17-infrastructure-and-production/19-ai-gateways]
manuals: []
practice: []
cheatsheet: [llm-routing-gateways]
related: [cost-capacity/budget-circuit-breaker]
updated: 2026-11-03
---

SLA của bạn là thời gian đến token đầu tiên P99 dưới 320 ms. Chỉ riêng mô hình đo được 300 ms tại P99. Bạn đang chọn một gateway để đặt trước nó. Những nhóm gateway nào vừa ngân sách, và bạn làm gì khi nhóm bạn muốn không vừa?

## Short answer

Gateway có tối đa 20 ms ở đuôi. Một gateway được quản lý ở edge ở mức 1 đến 3 ms và một gateway hiệu năng cao ở mức 3 đến 8 ms vừa, một proxy nhẹ ở mức 5 đến 15 ms vừa với ít dư địa, và một gateway control-plane ở mức 20 đến 40 ms không vừa. Nếu bạn cần các tính năng của nhóm chậm, tách các vai trò: giữ gateway nhanh trên đường request, chạy các tính năng nặng ngoài luồng, hoặc mua lại ngân sách từ mô hình bằng một token đầu tiên nhanh hơn.

## Full answer

### The budget

Mục tiêu là 320 ms và mô hình mất 300 ms, vì vậy gateway có thể thêm 20 ms, và đó là ở đuôi. Một mục tiêu P99 có nghĩa là P99 riêng của gateway, không phải trung vị của nó, và một gateway nhanh khi nhàn rỗi có thể chậm dưới tải. Tổng của hai đuôi chỉ là một ước tính sàng lọc. Trước khi cam kết SLA, đo P99 token đầu tiên đầu cuối qua gateway dưới tải.

### The classes

| Nhóm | Phần thời gian thêm trong bài học | Vừa |
|---|---|---|
| được quản lý ở edge, không cần vận hành | 1 đến 3 ms | có |
| hiệu năng cao, xây trên một API gateway trưởng thành | 3 đến 8 ms | có |
| proxy mã nguồn mở nhẹ | 5 đến 15 ms | với ít dư địa |
| control plane với guardrail và kiểm toán | 20 đến 40 ms | không |

Quy tắc kinh nghiệm của bài học khớp: đối với một P99 dưới 100 ms, chọn nhóm edge hoặc hiệu năng cao. Đối với một P99 dưới 500 ms, bất kỳ nhóm nào cũng hoạt động.

### When you want the slow one

Nhóm control-plane mang đến che thông tin PII, phát hiện jailbreak và dấu vết kiểm toán. Ba cách để giữ chúng trong ngân sách:

1. Tách các vai trò. Đặt gateway nhanh trên đường request và chạy khả năng quan sát cùng kiểm toán ngoài đường đi. Bài học ghi chú rằng các triển khai production kết hợp một công cụ quan sát với một gateway quy mô theo đúng cách tách này.
2. Chỉ giữ những gì phải nằm trực tiếp trên đường đi. Việc che thông tin phải chạy trước khi nhà cung cấp thấy prompt, vì vậy nó ở lại trên đường đi. Kiểm toán và tracing thì không.
3. Mua lại ngân sách từ mô hình. Prefix caching giảm thời gian token đầu tiên, và một tầng mô hình nhanh hơn cũng vậy.

### Scale decides as well

Proxy nhẹ suy sụp quanh 2000 request mỗi giây với mức chiếm dụng 8 GB trong benchmark được công bố, và bài học đặt nó dưới 500 request mỗi giây. Nếu lưu lượng sẽ tăng qua mức đó, nhóm hiệu năng cao là nhóm duy nhất vừa cả độ trễ và quy mô.

## Follow-ups

- **Level 2:** Tại sao đo gateway tại P99 chứ không tại trung vị của nó? Expected: SLA là một P99, và đuôi của gateway cộng vào đuôi của mô hình.
- **Level 3:** Giá trị của gateway chậm là che thông tin PII. Bạn giữ nó trong ngân sách như thế nào? Expected: giữ việc che thông tin trực tiếp trên đường đi vì nó phải chạy trước khi nhà cung cấp thấy prompt, chuyển khả năng quan sát và kiểm toán ra ngoài đường đi, rồi đo liệu phần thời gian thêm còn lại có vừa không.
- **Level 3:** Lưu lượng sẽ gấp ba vào năm tới. Nhóm nào sống sót? Expected: proxy nhẹ suy sụp quanh 2000 request mỗi giây, vì vậy lên kế hoạch chuyển sang nhóm hiệu năng cao trước mức đó.

## Wrong answers

- "Mọi gateway đều thêm vài mili giây, chọn theo tính năng." Các phần thời gian thêm của bài học trải từ 1 đến 40 ms, và 40 ms là gấp đôi ngân sách này.
- "Đặt gateway sau mô hình, không phải trước." Gateway định tuyến và chuyển sang dự phòng trước mô hình. Sau mô hình nó không bảo vệ gì.
- "Cộng trung vị của gateway vào P99 của mô hình." Hai đuôi không cộng theo cách đó. Đo đuôi riêng của gateway dưới tải.

## Taught in

[Bài học AI gateway](../../../phases/17-infrastructure-and-production/19-ai-gateways/) đưa ra phần thời gian trễ thêm theo từng nhóm gateway và các trần quy mô.
