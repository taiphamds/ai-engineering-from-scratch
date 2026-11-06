---
id: two-users-two-workflows
title: Two users describe two different workflows
card: behavioral
kind: tradeoff
level: 2
roles: [forward-deployed-ai-engineer, applied-ai-engineer, ai-developer-relations-engineer]
rounds: [behavioral, customer]
tags: [workflow-discovery, variants, requirements]
minutes: 8
lessons: [phases/14-agent-engineering/48-discover-the-real-workflow]
manuals: []
practice: []
cheatsheet: [product-discovery]
related: [behavioral/evidence-ladder-for-workflows]
updated: 2026-11-03
---

Hai chuyên viên phân tích cao cấp trong cùng một nhóm cho bạn thấy cách họ phân loại một giao dịch bị gắn cờ. Các bước của họ khác nhau về thứ tự, về những công cụ họ mở, và về người họ hỏi trước khi hành động. Hạn chót của bạn cho phép một quy trình làm việc trong phiên bản đầu tiên. Bạn làm gì với sự bất đồng?

## Short answer

Tôi giữ riêng cả hai biến thể cho đến khi biết tại sao chúng khác nhau. Sự khác biệt có thể đến từ các vai trò khác nhau, các mức rủi ro khác nhau, một quy trình cũ bên cạnh một quy trình hiện tại, sự khác biệt về chuyên môn, hoặc một bất đồng chính sách thực sự, và mỗi điều trong số đó dẫn đến một sản phẩm khác nhau. Một quy trình làm việc trung bình có thể không mô tả ai cả, vì vậy phiên bản đầu tiên chủ ý nhắm vào một biến thể và nêu biến thể còn lại là một khoảng trống đã biết.

## Full answer

### Why not average

Hai người có thể thực hiện các quy trình làm việc khác nhau vì những lý do chính đáng. Gộp các bước của họ thành một đường đi tạo ra một trình tự mà không ai trong số họ tuân theo. Trợ lý khi đó thất bại ở lần bàn giao hoặc ngoại lệ đầu tiên, chính là nơi các tính năng này thất bại nhiều nhất.

### What the difference can mean

| Nguyên nhân | Nó cho việc xây dựng biết điều gì |
|---|---|
| Các vai trò khác nhau | Hai kiểu người dùng, có thể là hai khung kết quả |
| Các mức rủi ro khác nhau | Nhánh là một tính năng, không phải nhiễu |
| Quy trình cũ và hiện tại | Một biến thể có thể đang được ngừng áp dụng; xác nhận với người phụ trách |
| Khác biệt chuyên môn | Đường đi của chuyên gia có thể là mục tiêu và đường đi còn lại là khoảng trống đào tạo |
| Bất đồng chính sách | Cần một quyết định của con người trước mọi việc xây dựng |

### How I resolve it

1. Ghi lại cả hai biến thể thành các bước có thứ tự với bằng chứng và bậc của bằng chứng đó.
2. Tìm nơi nhánh bắt đầu và ranh giới thẩm quyền mà mỗi biến thể vượt qua.
3. Hỏi người phụ trách quy trình nguyên nhân nào áp dụng; nếu đó là bất đồng chính sách, quyết định đó được chuyển cho con người và việc xây dựng chờ nó.
4. Chọn một biến thể cho lát cắt đầu tiên theo rủi ro và tần suất, và viết biến thể còn lại thành một điều không phải mục tiêu kèm lý do.

### Where the exception hides

Thường thì bước "thêm" của một chuyên viên phân tích là đường đi ngoại lệ mà chuyên viên phân tích còn lại đã không còn để ý. Tôi yêu cầu một trường hợp thực tế nơi đường đi bình thường thất bại trước khi gọi một bước là tùy chọn.

## Follow-ups

- **Level 2:** Một chuyên viên phân tích hỏi một người giám sát trước khi hành động và người còn lại thì không. Bước đó là gì? Expected: một ranh giới thẩm quyền; việc xây dựng phải tôn trọng nó, và hai biến thể có thể khác nhau về mức rủi ro hoặc vai trò.
- **Level 2:** Bạn chỉ có thể phát hành một đường đi. Bạn chọn như thế nào? Expected: theo rủi ro và tần suất của mỗi biến thể, với biến thể còn lại được ghi lại thành một khoảng trống được nêu tên, không phải bằng cách lấy trung bình.
- **Level 3:** Người phụ trách nói cả hai đều ổn. Bạn ghi lại điều gì? Expected: rằng chính sách cho phép cả hai, kèm bằng chứng, để trợ lý không ép một đường đi lên tất cả mọi người.
- **Level 3:** Bạn giữ cho biến thể thứ hai không biến mất khỏi kế hoạch như thế nào? Expected: viết nó thành một điều không phải mục tiêu kèm lý do của nó và một mốc xem xét, để nó vẫn hiện diện như một quyết định thay vì một sự bỏ sót.

## Wrong answers

- "Gộp cả hai thành một quy trình tiêu chuẩn." Quy trình làm việc trung bình có thể không mô tả ai cả và hỏng ở lần bàn giao.
- "Làm theo người có thâm niên hơn." Thâm niên không phải là bằng chứng; nguyên nhân của sự khác biệt quyết định.
- "Coi các bước thêm là tùy chọn và bỏ qua chúng." Bước thêm thường là đường đi ngoại lệ mang phần lớn rủi ro.

## Taught in

[Bài học khám phá quy trình làm việc](../../../phases/14-agent-engineering/48-discover-the-real-workflow/) giải thích tại sao không được lấy trung bình để xóa bỏ sự bất đồng và liệt kê các nguyên nhân đằng sau các biến thể.
