---
id: cost-per-outcome
title: The metric to give finance instead of a token price
card: cost-capacity
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [screen, customer]
tags: [finops, unit-economics, attribution, cost-per-request]
minutes: 5
lessons: [phases/17-infrastructure-and-production/27-finops-llms]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/batch-lane-triage]
updated: 2026-11-03
---

Bộ phận tài chính yêu cầu chi phí trên mỗi triệu token làm metric chính cho dịch vụ mô hình. Bạn phản đối. Thay vào đó bạn đề xuất metric nào, và mọi lời gọi phải ghi lại gì để bạn có thể tính nó?

## Short answer

Đề xuất một chi phí trên mỗi kết quả sản phẩm: trên mỗi ticket được giải quyết, mỗi bài viết được sinh, mỗi nhiệm vụ agent thành công hoặc mỗi phút phiên. Một giá trên mỗi triệu token là đơn vị của nhà cung cấp, và nó không nói gì về việc chi tiêu có tạo ra thứ gì không. Để tính metric kết quả, đóng dấu mọi lời gọi lúc tạo bằng user id, task id với tuyến của nó, và tenant id, chia token thành prompt, công cụ, bộ nhớ và phản hồi, và nối chi phí với sự kiện kết quả.

## Full answer

### Why the token price misleads

Một mô hình rẻ hơn cần gấp đôi số token mỗi nhiệm vụ tốn hơn mỗi nhiệm vụ. Một thay đổi prompt cắt token và làm giảm tỷ lệ giải quyết làm tăng chi phí trên mỗi ticket được giải quyết trong khi dashboard token chuyển xanh. Quy tắc của bài học là gắn chi phí với một kết quả sản phẩm, vì một tối ưu hóa không có điểm neo đó không có hướng.

### Three attribution dimensions

| Chiều | Khóa | Nó trả lời điều gì |
|---|---|---|
| theo người dùng | `user_id` | ai tốn bao nhiêu, cho định giá theo chỗ ngồi và lạm dụng |
| theo nhiệm vụ | `task_id` và `route` | bề mặt sản phẩm nào tốn bao nhiêu |
| theo tenant | `tenant_id` | khách hàng nào có lợi nhuận |

Gắn đo lường cả ba tại điểm gọi ngay ngày đầu. Một dòng mục của nhà cung cấp không mang thứ nào trong số đó, và gắn thẻ hồi tố luôn bỏ sót các trường hợp.

### Four token layers

| Lớp | Tỷ lệ điển hình |
|---|---|
| prompt, văn bản hệ thống và đầu vào người dùng | 40 đến 60 phần trăm |
| công cụ, các kết quả được đưa trở lại ngữ cảnh | 20 đến 40 phần trăm trên các workload agent |
| bộ nhớ, các lượt trước và tài liệu được truy xuất | 10 đến 30 phần trăm |
| phản hồi, đầu ra mô hình | 10 đến 30 phần trăm |

Một bucket che giấu lớp nào thúc đẩy chi tiêu, vì vậy bạn không thể chọn đòn bẩy.

### The record on every call

Trace mang trace id, ba khóa chiều, bốn số đếm lớp, chi phí, và hai cờ, một cho đầu vào đã cache và một cho lời gọi batch. Mẫu quy gán chính xác nhất nối các trace này với bản xuất thanh toán bằng trace id, điều mà bài học gọi là telemetry joiner.

## Follow-ups

- **Level 1:** Tại sao chỉ giá token gây hiểu lầm? Expected: nó không nói gì về token trên mỗi kết quả. Một mô hình rẻ hơn cần gấp đôi số token mỗi nhiệm vụ tốn hơn mỗi nhiệm vụ.
- **Level 2:** Tại sao chia token thành bốn lớp? Expected: một bucket che giấu liệu prompt phình to, kết quả công cụ, bộ nhớ hay đầu ra thúc đẩy chi tiêu, vì vậy bạn không thể chọn cách sửa đúng.
- **Level 2:** Tại sao đóng dấu lời gọi lúc tạo thay vì gắn thẻ hóa đơn sau? Expected: dòng mục của nhà cung cấp không có người dùng, nhiệm vụ hay tenant trên nó, và quy gán hồi tố luôn bỏ sót các trường hợp.
- **Level 3:** Mẫu quy gán nào chính xác nhất, và nó cần gì? Expected: telemetry joiner, nối các trace id với thanh toán. Nó cần trace id trên mọi lời gọi và một bản xuất thanh toán có cùng khóa.

## Wrong answers

- "Token là thứ chúng ta trả tiền, vì vậy token là metric." Chúng là đơn vị của nhà cung cấp. Doanh nghiệp trả cho kết quả, và một token rẻ hơn có thể có nghĩa là một nhiệm vụ đắt hơn.
- "Gắn thẻ hóa đơn cloud theo nhóm như mọi tài nguyên khác." Một lời gọi mô hình là một giao dịch, không phải một tài sản. Dòng mục không có nhóm trên nó trừ khi lời gọi đã đóng dấu một nhóm.
- "Chi phí theo tenant là đủ." Theo nhiệm vụ cho thấy tính năng nào cần sửa và theo người dùng cho thấy lạm dụng. Bài học gắn đo lường cả ba.

## Taught in

[Bài học FinOps cho LLM](../../../phases/17-infrastructure-and-production/27-finops-llms/) thay giá token bằng một chi phí trên mỗi kết quả và định nghĩa các chiều và lớp quy gán.
