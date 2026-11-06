---
id: correction-to-control
title: The same correction for the third time
card: behavioral
kind: concept
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [behavioral]
tags: [feedback, controls, root-cause, agent-workbench]
minutes: 10
lessons: [phases/14-agent-engineering/46-turn-feedback-into-system]
manuals: []
practice: []
cheatsheet: [delegation-feedback, agent-workbench-ops]
related: [behavioral/retire-a-rule, behavioral/feedback-ratchet-owner]
updated: 2026-11-03
---

Lần thứ ba trong tháng này bạn đã bảo một coding agent không chỉnh sửa README dự án trong một thay đổi tính năng. Mỗi lần nó xin lỗi và sửa lần chạy. Hãy nói bạn làm gì bây giờ, và tại sao cách sửa không phải một prompt tốt hơn.

## Short answer

Một lần sửa nằm trong trò chuyện sửa một lần chạy. Tôi coi sự lặp lại là bằng chứng về hệ thống làm việc: ranh giới phạm vi không thực thi được. Tôi tìm nguyên nhân đằng sau triệu chứng, rồi đặt một biện pháp kiểm soát tại lớp sớm nhất có thể ngăn việc tái diễn, ở đây là một chính sách phạm vi hoặc quyền hạn thay vì một đoạn văn nữa trong các chỉ dẫn. Biện pháp kiểm soát có một người phụ trách, một cách xác minh và một ngày để đánh giá hoặc loại bỏ nó.

## Full answer

### Separate the cause from the symptom

"Agent đã chỉnh sửa README" là một triệu chứng. Nguyên nhân có thể là bất kỳ điều nào sau đây:

- nhiệm vụ cho phép ghi vào gốc repository;
- tài liệu được coi là an toàn theo mặc định;
- kế hoạch gộp triển khai và tài liệu trong một mục;
- hai worker có quyền sở hữu chồng lấp.

Mỗi nguyên nhân thuộc về một biện pháp kiểm soát khác nhau. Một quy tắc chỉ lặp lại triệu chứng thất bại trong trường hợp hơi khác tiếp theo.

### Promote to the earliest effective layer

| Thất bại lặp lại | Nơi chuyển đến bền vững |
|---|---|
| Kết quả sai hoặc sự suy giảm | Kiểm thử hoặc đánh giá |
| Hành động ngoài phạm vi hoặc không an toàn | Chính sách phạm vi hoặc quyền hạn |
| Lỗi thiết lập hoặc lệnh lặp lại | Tự động hóa hoặc công cụ |
| Lỗi định dạng đầu ra lặp lại | Ví dụ chuẩn cộng validator |
| Quy ước cục bộ mơ hồ | Chỉ dẫn có một phép kiểm tra tình huống |
| Bất đồng sản phẩm | Bản ghi quyết định của con người |

Các biện pháp kiểm soát sớm hơn rẻ hơn. Một quyền khiến lần ghi không thể thực hiện mạnh hơn một nhận xét đánh giá bắt nó sau đó, và một kiểm thử tập trung mạnh hơn một đoạn văn yêu cầu agent ghi nhớ.

### The record

Với mỗi lần sửa được nâng cấp tôi thu triệu chứng, nguyên nhân gốc, hậu quả, số lần tái diễn, biện pháp kiểm soát đã chọn, cách biện pháp kiểm soát được xác minh, người phụ trách, và một ngày để đánh giá hoặc loại bỏ nó. Không phải mọi sở thích một lần đều được nâng cấp. Sự tái diễn hoặc hậu quả phải biện minh cho độ phức tạp lâu dài.

### Why not a better prompt

Prompt đã rõ ràng ba lần. Thất bại là ranh giới phụ thuộc vào việc agent đọc và nhớ. Một chính sách từ chối lần ghi không phụ thuộc vào trí nhớ.

## Follow-ups

- **Level 2:** Hai lần sửa dùng các từ khác nhau cho cùng nguyên nhân. Bạn ngăn chúng trở thành hai quy tắc thế nào? Expected: chuẩn hóa chúng thành một fingerprint ổn định của nguyên nhân, để chúng quy về một biện pháp kiểm soát mà không gộp các thất bại không liên quan.
- **Level 2:** Một thất bại lần đầu xóa dữ liệu khách hàng. Nó có chờ tái diễn không? Expected: không; việc lấy trọng số theo hậu quả cho phép một lần xuất hiện đầu tiên nghiêm trọng được nâng cấp ngay.
- **Level 3:** Khi nào bạn sẽ loại bỏ biện pháp kiểm soát đã thêm? Expected: khi kiến trúc thay đổi, một biện pháp kiểm soát thực thi được mạnh hơn thay thế nó, thất bại không tái diễn trong một khoảng thời gian có ý nghĩa, hoặc biện pháp kiểm soát chặn nhiều công việc hợp lệ hơn rủi ro nó ngăn.
- **Level 3:** Hệ thống nhỏ nhất bạn hướng tới là gì? Expected: tập biện pháp kiểm soát nhỏ nhất giữ được phán đoán khó khăn mới giành được, không phải file chỉ dẫn dài nhất.

## Wrong answers

- "Thêm quy tắc bằng chữ in hoa ở đầu các chỉ dẫn." Chỉ dẫn đã tồn tại; một bản sao lớn tiếng hơn vẫn phụ thuộc vào việc agent đọc nó.
- "Nâng cấp mọi lần sửa để không có gì bị mất." Các biện pháp kiểm soát tích tụ, xung đột và làm phình ngữ cảnh; việc nâng cấp cần tái diễn hoặc hậu quả.
- "Agent là vấn đề, đổi mô hình." Ranh giới không thực thi được; một mô hình khác gặp cùng biện pháp kiểm soát bị thiếu.

## Taught in

[Bài học từ phản hồi đến hệ thống](../../../phases/14-agent-engineering/46-turn-feedback-into-system/) đưa ra bảng nơi chuyển đến, bản ghi ratchet và các phép kiểm tra loại bỏ.
