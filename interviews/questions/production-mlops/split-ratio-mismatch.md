---
id: split-ratio-mismatch
title: An even split that lands at 47 to 53
card: production-mlops
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [debugging, ml-breadth]
tags: [ab-testing, srm, randomization, assignment]
minutes: 8
lessons: [phases/17-infrastructure-and-production/21-ab-testing-llm-features, phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/peeking-at-an-ab-test, production-mlops/hash-bucket-assignment]
updated: 2026-11-03
---

Một thí nghiệm phân người dùng đều vào đối chứng và biến thể. Sau một tuần, dashboard hiển thị 47 phần trăm người dùng trong đối chứng và 53 phần trăm trong biến thể, và biến thể dẫn trên chỉ số chính. Bạn kết luận gì, và làm gì tiếp?

## Short answer

Không đọc kết quả. Một phần chia đều được cấu hình mà cho 47 trên 53 qua một tuần lưu lượng là một không khớp tỷ lệ mẫu, có nghĩa phân nhóm hoặc ghi log hỏng và hai nhóm không còn so sánh được. Tìm nguyên nhân trong đường phân nhóm, sửa nó, và bắt đầu thí nghiệm lại.

## Full answer

### What the check says

Một hash phân nhóm đặt mỗi người dùng vào một nhánh. Qua một tuần, phần chia thực nên nằm rất gần phần chia cấu hình. Khi không như vậy, câu trả lời của bài học thẳng thừng: có gì đó hỏng. Cả hai loại nền tảng thí nghiệm trong bài học chạy kiểm tra này cho bạn, và nó thuộc phía trước mọi lần đọc kết quả.

### Why the win is void

Bất cứ điều gì làm mất người dùng từ một nhánh có thể có tương quan với kết quả. Nếu các client chậm thất bại trước khi ghi log một phơi lộ trong một nhánh, nhánh đó trông nhanh hơn và vui hơn. Mức tăng đo được khi đó là sự rời bỏ, không phải biến thể. Không hiệu chỉnh sau sự việc nào khôi phục ngẫu nhiên hóa.

### Where to look

1. **Hàm phân nhóm.** Capstone ứng dụng production phân bằng một hash có tính xác định của user id, để một người dùng ở trong một nhánh. Một lần rút ngẫu nhiên mỗi yêu cầu, hoặc một hash trên một trường thay đổi, làm hỏng phần chia.
2. **Ghi log phơi lộ.** Một nhánh có thể bỏ các sự kiện, ví dụ khi đường biến thể ghi log sau một lời gọi có thể thất bại.
3. **Các lỗi client.** Một biến thể crash trước khi ghi log loại người dùng của nó khỏi số đếm.
4. **Bot và các lần thử lại.** Một bot hoặc một vòng lặp thử lại rơi vào một nhánh làm phồng nó.
5. **Cache.** Một cache phía trước phân nhóm có thể phục vụ quyết định của một nhánh cho nhiều người dùng.

### Then

Sửa nguyên nhân, bỏ dữ liệu, và khởi động lại. Đăng ký trước kiểm tra không khớp để nó tự chặn lần đọc kết quả, và không ai phải tranh luận về một biến thể thắng.

## Follow-ups

- **Level 2:** Tại sao hash user id thay vì rút một nhánh ngẫu nhiên trên mỗi yêu cầu? Expected: cùng người dùng rơi vào cùng nhánh trên mọi yêu cầu, nên trải nghiệm nhất quán và số phơi lộ theo người dùng.
- **Level 3:** Nêu hai nguyên nhân đặt nhiều người dùng vào biến thể hơn đối chứng. Expected: một lỗi ghi log bỏ các phơi lộ đối chứng, hoặc một đường biến thể xử lý bot hoặc các lần thử lại khác.
- **Level 3:** Bạn có thể hiệu chỉnh không khớp bằng thống kê và giữ kết quả không? Expected: không. Không khớp cho thấy các nhóm không so sánh được, và không hiệu chỉnh nào khôi phục ngẫu nhiên hóa.

## Wrong answers

- "Ba phần trăm nằm trong nhiễu." Qua một tuần lưu lượng, khoảng cách đó dưới một phần chia công bằng rất ít khả năng, và kiểm tra không khớp tồn tại để gắn cờ chính trường hợp này.
- "Biến thể thắng nhiều hơn khoảng cách, nên triển khai." Khoảng cách có thể có tương quan với kết quả, nên mức tăng có thể chính là sự rời bỏ.
- "Bỏ người dùng biến thể đến khi các nhóm khớp." Loại người dùng sau sự việc thêm một bias thứ hai lên bias đầu.

## Taught in

[Bài học A/B testing](../../../phases/17-infrastructure-and-production/21-ab-testing-llm-features/) định nghĩa kiểm tra không khớp tỷ lệ mẫu, và [bài học ứng dụng production](../../../phases/11-llm-engineering/13-production-app/) hash user id để chọn một nhánh.
