---
id: design-doc-blocking-review
title: Review an ML design document and name the blockers
card: system-design
kind: design
level: 4
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [design-review, design-document, blocking-items, serving-fit]
minutes: 20
lessons: [phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [ml-system-design]
related: [system-design/when-not-ml, system-design/ab-test-prompt-rollout, system-design/churn-model-system]
updated: 2026-11-03
---

Bạn là người review các tài liệu thiết kế ML trước khi bất kỳ huấn luyện nào bắt đầu. Một nhóm đưa bạn một tài liệu cho một kiểm tra gian lận thanh toán đề xuất chấm điểm batch, trong đó một công việc mất một giờ, với một giới hạn lỗi thời ba phút, báo cáo một AUC offline, liệt kê một baseline lớp đa số, và không có phần rollout. Trình bày cho tôi cách review: các phần bạn mong đợi, các thiếu sót nào chặn, cách bạn chấm, và những gì bạn nói với nhóm.

## Short answer

Tài liệu cần chín phần, và sáu mục chặn một lần review vì mỗi mục khiến hệ thống không an toàn hoặc vô dụng: quyết định dùng dự đoán, một chỉ số kinh doanh, một baseline heuristic hoặc hệ thống hiện tại, xác nhận mọi feature tồn tại ở thời điểm dự đoán, một giai đoạn shadow hoặc canary với một rollback, và một hành động mặc định cho mọi lỗi. Tài liệu này không đạt ít nhất ba mục: baseline duy nhất là tầm thường, không có rollout và không rollback, và lựa chọn phục vụ không đạt kiểm tra phù hợp vì batch không thể đạt một giới hạn ba phút khi một công việc mất một giờ. Tôi gửi lại với danh sách chặn trước, và yêu cầu precision tại ngưỡng quyết định thay vì AUC.

## Full answer

### The nine sections

| Phần | Câu hỏi nó trả lời | Mục chặn |
|---|---|---|
| Vấn đề | Dự đoán gì, quyết định nào dùng nó, tại sao các quy tắc không đủ | Quyết định |
| Các chỉ số | Các chỉ số offline, online, kinh doanh và guardrail | Chỉ số kinh doanh |
| Các baseline | Các baseline tầm thường, heuristic và hệ thống hiện tại | Một baseline heuristic hoặc hiện tại |
| Dữ liệu | Nguồn nhãn, độ trễ, tính sẵn có của feature ở thời điểm dự đoán | Không rò rỉ |
| Các ngân sách và phục vụ | Độ trễ, QPS đỉnh, chi phí, lỗi thời, và chế độ phù hợp | Không có |
| Rollout | Shadow, canary, A/B và rollback | Shadow hoặc canary cùng rollback |
| Các vòng phản hồi | Cách các quyết định của mô hình thay đổi dữ liệu huấn luyện sau đó | Không có |
| Các chế độ lỗi | Hành động mặc định cho mỗi lỗi | Một mặc định cho mọi lỗi |
| Giám sát | Điều gì được theo dõi sau ra mắt | Không có |

### Scoring

Mỗi mục danh sách kiểm tra có một trọng số, một cờ chặn và một phép kiểm tra. Các mục chặn có trọng số 2. Điểm là tổng các trọng số đạt trên tổng, và phán quyết chỉ là sẵn sàng review khi điểm đạt 0.85 và không mục chặn nào thất bại. Một tài liệu có thể đạt điểm cao ở các mục không chặn mà vẫn bị gửi lại vì một mục chặn; đó là mục đích của cờ.

### The serving fit check

Kiểm tra này dùng lại mô hình chi phí. Nó đọc các con số workload từ tài liệu, tính giá chế độ được chọn, và đánh trượt khi chế độ đó thiếu giới hạn lỗi thời, ngân sách độ trễ hoặc ngân sách chi phí hàng ngày. Một công việc batch mất một giờ không thể đạt một giới hạn ba phút ở bất kỳ giá nào, nên một tài liệu nói batch với giới hạn đó không đạt kiểm tra. Với một quyết định thanh toán được đưa ra ở thời điểm yêu cầu, chế độ phù hợp là online, và tài liệu phải nêu QPS đỉnh và ngân sách p99 định cỡ nó.

### What I tell the team

1. Các mục chặn trước: nêu hành động mà mỗi điểm khởi động; thêm quy tắc nhóm gian lận dùng hôm nay làm baseline heuristic và đặt mức tăng tối thiểu; thêm các giai đoạn shadow và canary với một rollback bằng cấu hình; viết một mặc định cho một timeout, một feature thiếu, một thẻ mới và một dịch chuyển điểm đột ngột.
2. Rồi phần phục vụ: chuyển sang online, đưa các ngân sách, tính giá nó.
3. Rồi chỉ số: AUC lấy trung bình các ngưỡng không ai dùng; báo cáo precision và recall tại các ngưỡng phê duyệt, review và chặn, và nêu chỉ số kinh doanh cùng các guardrail.
4. Cuối cùng là vòng phản hồi và giám sát, không chặn nhưng sẽ quyết định quý thứ hai.

### Why the review happens before training

Mọi lỗi trong câu chuyện churn ở đầu bài học thiết kế xảy ra trước huấn luyện: không quyết định, nhịp cập nhật lỗi thời, một feature rò rỉ, không so sánh với quy tắc hiện có. Một tài liệu một trang hỏi về từng điều, và review tốn một ngày trong khi các lỗi tốn một quý.

## Follow-ups

- **Level 3:** Nhóm nói baseline đa số là đủ vì nó có điểm không trên F1. Tại sao đó là baseline sai? Expected: nó là baseline tầm thường và thường yếu; heuristic hoặc hệ thống hiện tại là đối thủ thực và là thứ mức tăng được đo so với.
- **Level 4:** Tại sao kiểm tra mức phù hợp phục vụ thuộc về một lần review tài liệu thay vì kiểm thử tải? Expected: nó là phép tính trên các ngân sách và giá được nêu, nên nó bắt một thiết kế không khả thi trước khi tồn tại một dòng mã phục vụ.
- **Level 4:** Tài liệu đề xuất một chế độ phục vụ lai. Bộ kiểm tra làm gì và bạn làm gì? Expected: mô hình chi phí của bài học không có kế hoạch lai, nên kiểm tra thất bại cho đến khi một kế hoạch lai được thêm; yêu cầu nhóm tính giá phần batch và online và thêm kế hoạch.
- **Level 4:** Đâu là một phần không chặn mà bạn vẫn từ chối bỏ qua cho một hệ thống gian lận? Expected: các vòng phản hồi, vì các thanh toán bị chặn không bao giờ có nhãn và mô hình trôi về các quyết định riêng mà không có một mẫu sạch.

## Wrong answers

- "Một chỉ số offline mạnh bù cho một rollout thiếu." Một mô hình không có giai đoạn shadow và không rollback đến người dùng không có đường quay lại; đó là lý do rollout chặn.
- "Chấm tài liệu và cho qua ở tổng đủ cao." Một mục chặn thất bại làm review thất bại bất kể tổng.
- "Chế độ phục vụ là một chi tiết triển khai để sau." Kiểm tra phù hợp cho thấy batch hoàn toàn không thể đạt giới hạn, điều thay đổi kiến trúc và chi phí.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) định nghĩa tài liệu thiết kế, sáu mục chặn, ngưỡng điểm và kiểm tra mức phù hợp phục vụ.
