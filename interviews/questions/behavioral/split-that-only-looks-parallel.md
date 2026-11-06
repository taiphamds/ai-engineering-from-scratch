---
id: split-that-only-looks-parallel
title: Decide whether to split work across parallel workers
card: behavioral
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, inference-engineer]
rounds: [behavioral]
tags: [delegation, isolation, merge-contract, parallelism]
minutes: 12
lessons: [phases/14-agent-engineering/45-delegate-with-isolation]
manuals: []
practice: []
cheatsheet: [delegation-feedback]
related: [behavioral/plan-you-would-reject, behavioral/agent-decides-alone]
updated: 2026-11-03
---

Quản lý của bạn muốn một tính năng được hoàn thành nhanh hơn và đề xuất bạn chạy hai agent lập trình, hoặc hai kỹ sư, song song trên tính năng đó. Hãy kể cho tôi về một lần bạn phải đưa ra quyết định đó. Bạn đã quyết định như thế nào, và bạn đã thiết lập những gì trước khi bất kỳ ai bắt đầu?

## Short answer

Tôi chỉ giao việc khi công việc thực sự độc lập: hai cuộc điều tra trả lời các điều chưa biết khác nhau, hai phần triển khai có các file và hợp đồng không giao nhau, một người rà soát chỉ đọc, hoặc một phép kiểm tra bên ngoài chậm chạy trong khi công việc cục bộ tiếp tục. Khi các phần cần cùng các file, cùng một quyết định chưa chốt hoặc cùng một môi trường có thể thay đổi, tôi giữ chúng tuần tự, vì việc chia song song khi đó biến một nhiệm vụ rõ ràng thành một vấn đề phối hợp. Trước khi bất kỳ ai bắt đầu, mỗi đơn vị được giao một mục tiêu, một người phụ trách, các đường dẫn ghi độc quyền, các phụ thuộc, một bằng chứng và một bản bàn giao.

## Full answer

### The parallelism test

Có thêm người thực hiện sẵn sàng không phải là một lý do. Việc chia là có cơ sở khi ít nhất một trong những điều này đúng:

- hai cuộc điều tra có thể tự trả lời các điều chưa biết khác nhau;
- hai phần triển khai sở hữu các file và hợp đồng không giao nhau;
- một người rà soát có thể kiểm tra một sản phẩm đã hoàn thành mà không thay đổi nó;
- một phép kiểm tra bên ngoài chậm có thể chạy trong khi công việc cục bộ tiếp tục.

### A work unit is a contract

"Xử lý backend" không phải là một đơn vị. "Triển khai phép kiểm tra trùng lặp trong một file được nêu tên và chứng minh nó bằng kiểm thử tài khoản tập trung" thì có. Mỗi đơn vị ghi lại mục tiêu, một người phụ trách chịu trách nhiệm, các đường dẫn độc quyền, các đơn vị đã hoàn thành mà nó chờ, bằng chứng chính xác mà nó trả về, và một bản bàn giao với các file đã thay đổi, các quyết định đã đưa ra và rủi ro còn lại.

### Three layers of isolation

1. Hệ thống file: các worktree hoặc sandbox riêng biệt ngăn việc vô tình chỉnh sửa chung.
2. Quyền sở hữu: hợp đồng ngăn hai người thực hiện cố ý chỉnh sửa cùng một đường dẫn.
3. Trạng thái: các log và đầu ra riêng biệt ngăn một người thực hiện ghi đè bằng chứng của người khác.

Cách ly hệ thống file không giải quyết quyền sở hữu. Hai worktree sạch vẫn có thể tạo ra hai thiết kế xung đột. Hợp đồng gộp phải chốt các giao diện dùng chung trước khi công việc bắt đầu.

### What the integrator does

Người tích hợp xác nhận mỗi bản bàn giao khớp với phạm vi của nó, đọc đầu ra bằng chứng thay vì bản tóm tắt, kết hợp các thay đổi theo thứ tự phụ thuộc, chạy cổng kiểm tra đầy đủ xuyên các đơn vị, từ chối việc phạm vi âm thầm mở rộng, và ghi lại các xung đột thành các quyết định mới thay vì những chỉnh sửa âm thầm. Nếu tích hợp có nghĩa là viết lại phần lớn kết quả của một người thực hiện, việc chia đã sai.

### The call I made

Lần điều này quan trọng nhất, hai nửa trông độc lập nhưng cả hai đều cần cùng một kiểu phản hồi thay đổi. Tôi cho chạy một đơn vị ngắn để sửa hợp đồng đó trước, rồi để hai phần triển khai chạy song song dựa trên nó. Bước tuần tự ngắn hơn xung đột gộp mà nó ngăn được.

## Follow-ups

- **Level 3:** Một đơn vị tài liệu yêu cầu sở hữu toàn bộ thư mục ứng dụng. Điều gì xảy ra? Expected: kế hoạch bị chặn, vì đường dẫn cha đó chồng lấn với các đường dẫn của đơn vị triển khai.
- **Level 3:** Một phụ thuộc của người thực hiện trở nên không hợp lệ giữa chừng. Quy tắc là gì? Expected: một quy tắc hủy bằng văn bản được quyết định trước khi bắt đầu, để người thực hiện dừng lại và trả về một bản bàn giao thay vì xây dựng dựa trên một hợp đồng đã chết.
- **Level 4:** Con người tiếp tục tham gia ở đâu khi các agent làm công việc? Expected: ở các lựa chọn thay đổi hành vi công khai, rủi ro, thẩm quyền hoặc chi phí không thể đảo ngược; các agent phụ trách điều tra, triển khai, xác minh và rà soát trong phạm vi giới hạn.
- **Level 4:** Sau khi hoàn tất bạn biết việc phân rã đã đúng như thế nào? Expected: người tích hợp kết hợp các bản bàn giao mà không viết lại chúng, và tập hợp file đã thay đổi cuối cùng khớp với hợp của các hợp đồng đơn vị.

## Wrong answers

- "Hai agent luôn nhanh hơn một." Công việc song song chỉ tiết kiệm thời gian thực khi các phần độc lập; nếu không nó làm tăng tỷ lệ thất bại.
- "Các worktree riêng biệt giải quyết các xung đột." Chúng ngăn việc vô tình chỉnh sửa chung, không ngăn hai thiết kế xung đột của một giao diện.
- "Người tích hợp sửa bất cứ thứ gì không khớp." Nếu phần lớn một kết quả phải được viết lại khi tích hợp, việc chia ban đầu là sai lầm.

## Taught in

[Bài học giao việc](../../../phases/14-agent-engineering/45-delegate-with-isolation/) đưa ra phép kiểm tra tính song song, hợp đồng đơn vị và các lớp cách ly.
