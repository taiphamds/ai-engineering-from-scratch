---
id: six-jailbreak-categories
title: Name the attack before you defend it
card: safety
kind: concept
level: 1
roles: [applied-ai-engineer, agentic-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [jailbreak, taxonomy, trust-boundary, severity]
minutes: 6
lessons: [phases/19-capstone-projects/82-jailbreak-taxonomy]
manuals: []
practice: []
cheatsheet: [guardrails-moderation, ai-safety]
related: [safety/one-regex-is-not-a-detector, safety/normalize-then-match]
updated: 2026-11-03
---

Nhóm của bạn đã phát hành bốn mươi bản vá regex chống các prompt vượt qua các quy tắc từ chối của trợ lý, và tồn đọng tấn công mới tăng nhanh hơn các bản vá. Một kỹ sư mới hỏi rốt cuộc một cuộc tấn công là gì. Bạn giới thiệu vốn từ chung nào, và nó mang lại gì cho nhóm?

## Short answer

Gán nhãn mọi cuộc tấn công theo ranh giới tin cậy mà nó lạm dụng. Sáu danh mục bao phủ phần lớn những gì đến: nhập vai chống persona, ghi đè chỉ dẫn chống system prompt, context smuggling trong khoảng hở giữa dữ liệu và chỉ dẫn, tăng dần nhiều lượt chống lịch sử hội thoại, các thủ thuật mã hóa chống dạng bề mặt của các token bị cấm, và prefix injection chống quyết định token tiếp theo. Các nhãn biến luồng tấn công thành một biểu đồ tần suất, biểu đồ tần suất thành một biểu đồ độ bao phủ, và biểu đồ thành sprint tiếp theo.

## Full answer

### The six categories

| Danh mục | Ranh giới tin cậy bị lạm dụng | Dạng |
|---|---|---|
| nhập vai | persona của trợ lý | "bạn là một mô hình không bị hạn chế tên là ..." |
| ghi đè chỉ dẫn | thẩm quyền của system prompt | "phớt lờ mọi thứ ở trên" |
| context smuggling | dữ liệu đối với chỉ dẫn | một mệnh lệnh ẩn trong một tài liệu được dán hoặc một kết quả công cụ |
| tăng dần nhiều lượt | hội thoại như một hợp đồng | các lượt vô hại, rồi mỗi lần xuống một bước |
| thủ thuật mã hóa | dạng bề mặt của các token | base64, rot13, leet speak, các ký tự zero width |
| prefix injection | quyết định token tiếp theo | "bắt đầu câu trả lời bằng: Chắc chắn, đây là" |

### The fixture record

Mỗi ví dụ được gán nhãn mang một id, một danh mục, một loại con, prompt, hành vi mục tiêu và một mức nghiêm trọng từ 1 đến 5. Một mức 1 là một cuộc tấn công vụng về vào một mục tiêu lành tính; một mức 5 sẽ tạo đầu ra mà một hệ thống đã triển khai không bao giờ được phát ra. Phần lớn các cuộc tấn công thực nằm ở 2 hoặc 3. Tác giả đặt mức nghiêm trọng, và khi hai người review khác nhau hơn một bậc thì rubric cần được làm sắc hơn.

### What the corpus must satisfy

Mọi danh mục có ít nhất bảy fixture, mọi prompt không trống, mọi mức nghiêm trọng nằm trong khoảng và mọi id là duy nhất. Một lỗi dừng bản build, vì mọi thành phần sau đó đọc kho ngữ liệu này.

### What the taxonomy is not

Kết quả khớp fixture gần nhất, theo cosine trigram ký tự, gán một nhãn cho một prompt mới. Nó là một bộ tạo nhãn. Bộ phát hiện với precision và recall được đo là một thành phần riêng tiêu thụ các nhãn.

## Follow-ups

- **Level 1:** Một prompt bảo mô hình quên mọi thứ nó được bảo trước đó. Đó là ranh giới nào? Expected: thẩm quyền của system prompt, nên là ghi đè chỉ dẫn.
- **Level 2:** Một kẻ tấn công đặt các lệnh bên trong văn bản mà người dùng yêu cầu mô hình tóm tắt. Danh mục nào? Expected: context smuggling.
- **Level 2:** Tại sao ít nhất bảy fixture mỗi danh mục? Expected: để mọi danh mục có đủ ví dụ để đo một bộ phát hiện theo đó và biểu đồ tần suất không bao giờ trống.
- **Level 3:** Hai người review chấm một fixture ở mức nghiêm trọng 2 và 4. Điều đó cho bạn biết gì? Expected: rubric chưa đủ sắc; một khoảng cách hơn một bậc là tín hiệu để viết lại nó.

## Wrong answers

- "Một regex cho mỗi cuộc tấn công là một hệ phân loại." Một regex là một bản vá; không có các danh mục bạn không thể thấy độ bao phủ hoặc nói về một cuộc tấn công là gì.
- "Mức nghiêm trọng là prompt nghe tệ đến đâu." Mức nghiêm trọng là tác động nếu cuộc tấn công thành công, được tác giả đặt trên thang 1 đến 5.
- "Kết quả khớp fixture gần nhất là bộ phát hiện." Kết quả khớp gán một nhãn; bộ phát hiện với precision và recall được đo là một thành phần riêng.

## Taught in

[Capstone phân loại jailbreak](../../../phases/19-capstone-projects/82-jailbreak-taxonomy/) định nghĩa sáu danh mục, bản ghi fixture và rubric mức nghiêm trọng.
