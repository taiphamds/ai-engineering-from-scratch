---
id: outcome-before-output
title: Reframe a request that names its own solution
card: behavioral
kind: concept
level: 1
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer, agentic-ai-engineer]
rounds: [behavioral, screen]
tags: [outcome-frame, requirements, solution-leakage]
minutes: 8
lessons: [phases/14-agent-engineering/47-outcomes-before-output]
manuals: []
practice: []
cheatsheet: [product-discovery]
related: [behavioral/riskiest-assumption-first]
updated: 2026-11-03
---

Một quản lý sản phẩm yêu cầu bạn xây dựng một trợ lý sự cố cho nhóm trực. Bạn có một tuần. Trước khi lập kế hoạch bất kỳ công việc nào, bạn hỏi gì, và viết ra gì trước?

## Short answer

Yêu cầu nêu một sản phẩm, không phải một kết quả. Tôi viết một khung kết quả trước: ai có vấn đề, khi nào nó xảy ra, họ làm gì hiện nay, trạng thái có thể quan sát nào phải cải thiện, những giới hạn nào cố định, và công việc gần đó nào ngoài phạm vi. Sau đó tôi kiểm tra khung để tìm một dạng sản phẩm, một mô hình hoặc một kiến trúc mà chưa có bằng chứng hỗ trợ.

## Full answer

### The six parts of the frame

| Phần | Câu hỏi tôi trả lời |
|---|---|
| Người dùng | Ai trực tiếp cảm nhận vấn đề? |
| Tình huống | Nó xảy ra khi nào và ở đâu? |
| Hành vi hiện tại | Điều gì xảy ra hiện nay, bao gồm các cách xử lý vòng? |
| Kết quả mong muốn | Trạng thái có thể quan sát nào phải tốt hơn? |
| Các ràng buộc | Những giới hạn an toàn, chính sách, chi phí hoặc tính tương thích nào cố định? |
| Các điều không phải mục tiêu | Công việc lân cận hấp dẫn nào được loại trừ? |

Với nhóm trực, kết quả mong muốn có thể viết: khi một cảnh báo đến, kỹ sư tìm dịch vụ đang lỗi và một bước tiếp theo an toàn trong ngân sách thời gian sự cố, và chẩn đoán giữ chỉ đọc và có thể kiểm toán. Một runbook, một lần sửa dữ liệu hoặc một thay đổi giao diện nhỏ hơn đều có thể thỏa mãn câu đó. Nhóm giữ gắn bó với kết quả, không với công cụ đầu tiên ai đó tưởng tượng.

### Leakage

Một khung rò rỉ một giải pháp khi nó chứa một giao diện, một lựa chọn mô hình, một framework hoặc một hệ thống lưu trữ mà bằng chứng chưa giành được. "Người dùng nhận một bản tóm tắt hằng tuần từ một mô hình" rò rỉ bản tóm tắt và nhịp độ. "Người dùng hiểu các thay đổi tài khoản trước khi phê duyệt" nêu kết quả. Một ràng buộc có thể nêu một công nghệ khi tính tương thích thực sự cố định nó. Tôi ghi lại tại sao nó cố định.

### Constraints and non-goals do real work

Các ràng buộc là một phần mục tiêu. Không có lần ghi production trong chẩn đoán, một phản hồi trong ngân sách thời gian sự cố, và không có dependency runtime mới đều loại bỏ toàn bộ các lớp giải pháp. Các điều không phải mục tiêu giữ lát cắt đầu tiên không lớn thành một nền tảng: không khắc phục tự động, không định tuyến cảnh báo mới, không thay thế người chỉ huy sự cố.

## Follow-ups

- **Level 1:** Bạn phân biệt một kết quả với một đầu ra thế nào? Expected: một kết quả nêu một thay đổi có thể quan sát cho một người dùng; một đầu ra nêu một sản phẩm như một trang, một công cụ hoặc một mô hình.
- **Level 2:** Quản lý khăng khăng một giao diện trò chuyện. Điều đó đi đâu trong khung? Expected: vào các ràng buộc chỉ khi chính sách hoặc tính tương thích cố định nó, với lý do được viết ra; nếu không nó chờ bằng chứng.
- **Level 2:** Nêu hai điều không phải mục tiêu giữ lát cắt đầu tiên nhỏ. Expected: ví dụ không tự động sửa sự cố và không định tuyến cảnh báo mới; mỗi điều phải đủ cụ thể để từ chối công việc.
- **Level 3:** Quan sát đầu tiên nào sẽ cho thấy kết quả mong muốn sai? Expected: một thời gian đo được để tìm dịch vụ đang lỗi vốn đã ngắn, nghĩa là khung nhắm đến một vấn đề không tồn tại.

## Wrong answers

- "Bắt đầu với giao diện và tinh chỉnh mục tiêu sau." Giao diện là một đầu ra. Nó gắn nhóm với sản phẩm đầu tiên trước khi ai đó biết điều gì phải cải thiện.
- "Các ràng buộc là các chi tiết triển khai cho sau này." Một bản xây dựng đạt kết quả và phá một ràng buộc chưa đạt kết quả.
- "Các điều không phải mục tiêu là tùy chọn." Không có chúng, một lát cắt hữu ích lớn thành một nền tảng trước khi kết quả đầu tiên được đo.

## Taught in

[Bài học khung kết quả](../../../phases/14-agent-engineering/47-outcomes-before-output/) đưa ra khung sáu phần và phép kiểm tra rò rỉ.
