---
id: demo-to-product-signals
title: The signals that a demo has become a product
card: system-design
kind: concept
level: 1
roles: [applied-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [system-design, screen]
tags: [demo, product, availability, cost-control]
minutes: 6
lessons: [phases/17-infrastructure-and-production/29-model-demo-interfaces, phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [production-llm-app]
related: [system-design/public-demo-controls, system-design/batched-inference-api-budget]
updated: 2026-11-03
---

Bạn đã xây một web demo nhỏ của một mô hình cho người review. Ba tháng sau, một đồng nghiệp hỏi liệu nó là "production" chưa. Bạn nhận biết bằng cách nào, và điều gì thay đổi khi câu trả lời là có?

## Short answer

Một demo phục vụ những người đã biết trong các phiên ngắn từ một tiến trình. Nó đã trở thành một sản phẩm khi những người ngoài nhóm dùng nó mỗi tuần, khi ai đó yêu cầu một mục tiêu uptime hoặc báo một sự cố ngừng hoạt động, khi người dùng muốn đăng nhập hoặc thấy lịch sử, khi chi phí mô hình hàng tuần là một dòng ngân sách, hoặc khi đầu vào được một hợp đồng hoặc một luật bao phủ. Tại điểm đó, demo chuyển lên ngăn xếp production với xác thực, các mô hình fallback, tracing và theo dõi chi phí theo từng người dùng.

## Full answer

### The five signals

- Những người ngoài nhóm của bạn dùng nó mỗi tuần.
- Ai đó yêu cầu một mục tiêu uptime, hoặc báo một sự cố ngừng hoạt động.
- Người dùng yêu cầu đăng nhập, lưu kết quả, hoặc thấy lịch sử.
- Chi phí mô hình hàng tuần là một dòng trong một ngân sách.
- Đầu vào bao gồm dữ liệu mà một hợp đồng hoặc một luật bao phủ.

### What changes

| Thuộc tính | Demo | Sản phẩm |
|---|---|---|
| Người dùng | Những người đã biết, các phiên ngắn | Những người không biết, sử dụng hàng ngày |
| Trạng thái | Không có | Tài khoản, lịch sử, các kết quả được lưu |
| Tính sẵn sàng | Nỗ lực tốt nhất, một tiến trình | Một mục tiêu được viết ra, các replica, một người phụ trách trực |
| Kiểm soát chi phí | Một trần sử dụng hàng ngày | Các hạn ngạch và tính phí theo từng người dùng |
| Khả năng quan sát | Một bản ghi nhật ký mỗi yêu cầu | Trace, các chỉ số và cảnh báo |

### What the demo already had

Một demo tốt đã có các phiên bản nhỏ của các biện pháp kiểm soát này: một giới hạn đầu vào, một giới hạn tốc độ theo từng client, một trần hàng ngày, và một nhật ký giữ độ dài đầu vào chứ không văn bản. Ngăn xếp sản phẩm thêm xác thực thực tại gateway, một chuỗi mô hình fallback cho các lỗi provider, các trace qua các thành phần, và tính toán chi phí theo từng yêu cầu và từng người dùng. Giới hạn đầu vào và tính riêng tư của nhật ký được chuyển tiếp không đổi.

### Why the question matters

Trạng thái nguy hiểm là ở giữa: một demo với lưu lượng sản phẩm và các biện pháp kiểm soát demo. Một trần hàng ngày không ngăn một tenant dùng toàn bộ ngân sách, và một tiến trình không có replica để tiếp quản khi nó chết.

## Follow-ups

- **Level 1:** Tín hiệu đơn lẻ nào mạnh nhất? Expected: một báo cáo ngừng hoạt động, vì nó nghĩa là ai đó phụ thuộc vào demo và mong đợi tính sẵn sàng.
- **Level 2:** Chi phí mô hình hàng tuần xuất hiện trong một ngân sách. Biện pháp kiểm soát nào thay trần hàng ngày? Expected: các hạn ngạch và tính phí theo từng người dùng, để tổng được quy thuộc và giới hạn theo từng tenant.
- **Level 2:** Dữ liệu chịu quy định bắt đầu đến trong đầu vào. Nhật ký phải làm gì? Expected: không giữ văn bản đầu vào và không địa chỉ client, với một thời gian lưu giữ và kiểm soát truy cập trên các bản ghi.

## Wrong answers

- "Nó là production khi chạy trên một server thay vì một laptop." Nơi nó chạy không quyết định; ai phụ thuộc vào nó mới quyết định.
- "Thêm một tuyên bố miễn trừ rằng nó là demo." Một tuyên bố miễn trừ không ngăn lưu lượng, chi phí hoặc ngừng hoạt động.
- "Giữ demo và xây sản phẩm riêng sau." Các tín hiệu nghĩa là demo đã mang rủi ro sản phẩm ngay bây giờ.

## Taught in

[Bài học giao diện demo mô hình](../../../phases/17-infrastructure-and-production/29-model-demo-interfaces/) liệt kê các tín hiệu và bảng demo-tới-sản phẩm, và [bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) mô tả ngăn xếp mà demo chuyển lên.
