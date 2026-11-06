---
id: riskiest-assumption-first
title: Pick the first experiment from a roadmap of features
card: behavioral
kind: design
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [behavioral]
tags: [assumptions, risk, experiments, product-judgment]
minutes: 10
lessons: [phases/14-agent-engineering/49-map-assumptions-and-risk]
manuals: []
practice: []
cheatsheet: [product-discovery]
related: [behavioral/outcome-before-output, behavioral/smallest-slice-that-decides]
updated: 2026-11-03
---

Bạn tham gia một nhóm có lộ trình kéo dài một quý cho một trợ lý đề xuất hành động tiếp theo cho các kỹ sư trực. Lộ trình liệt kê các tính năng theo thứ tự ưu tiên. Hãy cho tôi biết bạn quyết định làm gì trong tuần đầu tiên như thế nào, và tại sao đó có thể không phải là mục đầu tiên trong lộ trình.

## Short answer

Một lộ trình giấu sự không chắc chắn bên trong các tính năng. Tôi viết lại các tính năng thành các giả định có thể bị bác bỏ về giá trị, khả năng sử dụng, tính khả thi, khả năng duy trì và an toàn, rồi chấm điểm mỗi giả định theo tác động, sự không chắc chắn và tính không thể đảo ngược. Tuần đầu tiên dành cho phép thử mang tính quyết định rẻ nhất đối với rủi ro chưa được giải quyết cao nhất, thường không phải là mục đầu tiên trong lộ trình.

## Full answer

### Features are bets

Trợ lý chỉ mang lại lợi ích nếu một số điều kiện được đáp ứng: ngữ cảnh cảnh báo chứa đủ thông tin để nêu tên một dịch vụ, các kỹ sư tin tưởng một khuyến nghị mà họ không tự suy ra, thời gian phản hồi có ý nghĩa về vận hành, dữ liệu có thể truy cập mà không cần thẩm quyền không an toàn, và quy trình làm việc diễn ra đủ thường xuyên để biện minh cho việc bảo trì. Không điều nào trong số này là một nhiệm vụ triển khai. Chúng là các điều kiện để việc xây dựng đáng được thực hiện.

### Five classes

| Nhóm | Câu hỏi |
|---|---|
| Giá trị | Kết quả có đủ quan trọng không? |
| Khả năng sử dụng | Người dùng có thể hiểu và hành động dựa trên nó không? |
| Tính khả thi | Hệ thống có thể tạo ra nó với dữ liệu và các giới hạn hiện có không? |
| Khả năng duy trì | Tổ chức có thể duy trì chi phí, trách nhiệm phụ trách và vận hành không? |
| An toàn | Nó có thể thất bại mà không gây ra hậu quả không thể chấp nhận không? |

Một giả định phải được viết sao cho nó có thể sai. "Tính năng hữu ích" không thể kiểm chứng. "Tám trong mười kỹ sư trực nêu tên dịch vụ chính xác nhanh hơn với kết quả chỉ đọc" thì có thể.

### Risk is three numbers, not one

Bài học chấm điểm riêng tác động, sự không chắc chắn và tính không thể đảo ngược, mỗi yếu tố từ một đến năm, nhân tác động với sự không chắc chắn và cộng tính không thể đảo ngược. Công thức không phải bất di bất dịch. Nhiệm vụ của nó là buộc nhóm nói rõ tại sao một điều chưa biết phải được giải quyết trước một điều khác. Các lựa chọn không thể đảo ngược, có hậu quả cao cần bằng chứng sớm hơn: một lần phát lại chỉ đọc có thể đi trước một tích hợp production, và một khuyến nghị được con người phê duyệt có thể đi trước hành động tự động.

### An experiment, not a confirmation ritual

Một phép thử hữu ích có một nhận định có thể sai, một mẫu thực tế, một kết quả quan sát được, một ngưỡng được quyết định trước kết quả, và một quyết định tiếp theo cho bằng chứng đạt, không đạt và mơ hồ. Một bản demo chỉ cho thấy nhóm có thể xây dựng ý tưởng không phải là một phép thử.

## Follow-ups

- **Level 2:** Giả định rủi ro cao nhất được kiểm chứng và đúng. Điều gì thay đổi? Expected: nó chuyển từ chưa được giải quyết sang đã được kiểm chứng với bằng chứng đính kèm, và thử nghiệm tiếp theo nhắm vào rủi ro chưa được giải quyết cao nhất tiếp theo.
- **Level 2:** Danh sách tính năng thường bỏ sót nhóm giả định nào nhất? Expected: an toàn, câu hỏi liệu tính năng có thể thất bại mà không gây ra hậu quả không thể chấp nhận hay không.
- **Level 3:** Người phụ trách lộ trình nói thứ hạng đã phản ánh rủi ro. Bạn kiểm tra như thế nào? Expected: so sánh thứ hạng rủi ro với thứ tự lộ trình và giải thích mỗi chỗ không khớp; nơi chúng khác nhau, một trong hai đã sai về bằng chứng.
- **Level 3:** Viết một ngưỡng sẽ dừng việc xây dựng. Expected: ví dụ, ít hơn một tỷ lệ kỹ sư được nêu trong lần phát lại tin tưởng khuyến nghị chỉ đọc đủ để hành động dựa trên nó.

## Wrong answers

- "Xây dựng mục đầu tiên trong lộ trình; thứ tự đã được thống nhất." Sự thống nhất về thứ tự không phải là bằng chứng rằng giả định rủi ro nhất là đúng.
- "Phát hành thứ gì đó nhỏ và xem điều gì xảy ra." Một thứ nhỏ được xây dựng mà không có một nhận định, một ngưỡng và một quyết định tiếp theo thì không học được gì.
- "Rủi ro chỉ là khả năng nó thất bại." Tác động và tính không thể đảo ngược thay đổi thứ tự ngay cả khi xác suất là như nhau.

## Taught in

[Bài học bản đồ giả định](../../../phases/14-agent-engineering/49-map-assumptions-and-risk/) đưa ra năm nhóm, ba chiều rủi ro và hình thức của một thử nghiệm mang tính quyết định.
