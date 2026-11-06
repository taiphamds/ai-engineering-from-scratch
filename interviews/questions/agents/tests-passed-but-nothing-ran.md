---
id: tests-passed-but-nothing-ran
title: The agent said the tests passed, and no test ran
card: agents
kind: debug
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [debugging, design-review]
tags: [feedback-record, verification-gate, exit-code, acceptance-command]
minutes: 10
lessons: [phases/14-agent-engineering/37-runtime-feedback-loops, phases/14-agent-engineering/38-verification-gates]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, agent-harness]
related: []
updated: 2026-11-03
---

Một pull request từ một coding agent nói toàn bộ bộ kiểm thử xanh. Một người đánh giá chạy nó và hai kiểm thử thất bại. Bản ghi cho thấy agent viết "đang chạy kiểm thử" rồi "mọi kiểm thử đều đạt", không có gì giữa hai dòng. Điều gì đã xảy ra, và bạn dựng gì để khẳng định này không thể đến một người đánh giá lần nữa?

## Short answer

Agent dự đoán đầu ra thay vì đọc nó. Hoặc không lệnh nào chạy, hoặc lệnh chạy và không ai thu kết quả vào vòng lặp. Cách sửa có hai phần: một runner phản hồi ghi mọi lệnh cùng mã thoát của nó, và một gate xác minh đọc các bản ghi đó và từ chối đánh dấu nhiệm vụ hoàn tất trừ khi mỗi lệnh nghiệm thu đã chạy và thoát với mã không.

## Full answer

### Three ways the claim appears

1. **Không lệnh nào chạy.** Mô hình viết những từ nó kỳ vọng viết tiếp theo. Không có gì trong bản ghi cho thấy argv, đầu ra hoặc một mã thoát.
2. **Lệnh chạy, và kết quả không bao giờ trở lại.** Một runner báo lỗi trước khi thu mã thoát để mô hình không có gì để đọc, và mô hình điền khoảng trống.
3. **Kết quả trở lại, và dòng thất bại bị cắt.** Một đầu ra dài bị cắt từ cuối mất dòng tóm tắt nơi các thất bại nằm.

Bản ghi trong trường hợp này không có bản ghi nào giữa hai câu, nên đó là trường hợp thứ nhất hoặc thứ hai.

### The feedback runner

Mọi lệnh đi qua một wrapper. Bản ghi mang argv chính xác, phần đuôi stdout và stderr dưới dạng các trường riêng, mã thoát, thời lượng, thời điểm bắt đầu, và một ghi chú một dòng về những gì agent kỳ vọng. Runner cắt phần đầu và đuôi theo một cách cố định với một dấu đánh dấu cho các dòng nó đã loại bỏ, để dòng lỗi cuối cùng sống sót. Nếu runner thất bại trước khi thu một mã thoát, bản ghi mang `exit_code: null` và một trường `error`, và vòng lặp không được tiến tiếp trên nó. Không mã thoát, không tiến triển.

### The verification gate

Gate là một hàm thuần trên các sản phẩm. Với thất bại này nó kiểm tra ba thứ từ log phản hồi: mọi lệnh nghiệm thu xuất hiện trong các bản ghi, mỗi lệnh thoát với mã không, và không bản ghi nào có mã thoát null. Mỗi thứ trong số đó là một phát hiện mức độ chặn. Một chặn ngăn `passed: true`, và chỉ một con người có thể ghi đè nó, với một lý do và một id người dùng trong một log đã ký. Gate chạy trong CI và trước bàn giao. Không kết luận xanh, không pull request.

### Why the model is not the fix

Một prompt nói "luôn chạy các kiểm thử" yêu cầu mô hình trung thực về thứ nó không thể thấy. Runner làm kết quả nhìn thấy được. Gate làm khẳng định kiểm tra được. Không thứ nào phụ thuộc vào mô hình.

## Follow-ups

- **Level 2:** Tại sao bản ghi giữ stdout và stderr trong các trường riêng? Expected: một runner kiểm thử viết tóm tắt thất bại vào một luồng và tiến độ vào luồng kia, và một phần đuôi được gộp có thể giấu tóm tắt sau các dòng tiến độ.
- **Level 2:** Agent chạy lệnh nghiệm thu, lệnh thất bại, và một lần thử lại đạt. Gate thấy gì? Expected: hai bản ghi cho cùng lệnh, được liên kết bởi id lệnh cha. Gate chặn trên bản ghi thất bại và không báo cáo `passed: true`, mặc dù lần thử lại thoát với mã không. Chỉ một lần ghi đè có chữ ký con người vượt qua nó, và chuỗi giữ lịch sử thất bại nhìn thấy được.
- **Level 3:** Tại sao gate phải có tính xác định và không phải một mô hình giám khảo? Expected: gate trả lời liệu nhiệm vụ có hoàn tất hay không, điều phải cho cùng kết luận với cùng các sản phẩm mỗi lần, trong khi một giám khảo cho một ý kiến định tính thuộc phía đánh giá.
- **Level 4:** Bạn đặt gate ở đâu để nó không thể bị bỏ qua? Expected: trong các lớp, với một pre-commit hook, một phép kiểm tra trạng thái CI, và một gate trước gộp, để một thất bại trong một lớp được lớp tiếp theo bắt.

## Wrong answers

- "Bảo agent dán đầu ra kiểm thử vào bản ghi." Mô hình có thể dán những gì nó kỳ vọng, và một người đánh giá không thể phân biệt một phần dán với một bản thu.
- "Tin agent và để CI bắt nó." CI đã bắt nó, sau khi khẳng định đến một người đánh giá, và mục đích là dừng khẳng định tại nguồn.
- "Coi một timeout là đạt, vì các kiểm thử chậm." Một timeout cho một mã thoát null, và vòng lặp phải từ chối tiến tiếp trên một mã thoát null.

## Taught in

[Bài học phản hồi runtime](../../../phases/14-agent-engineering/37-runtime-feedback-loops/) dựng runner, và [bài học các gate xác minh](../../../phases/14-agent-engineering/38-verification-gates/) dựng gate đọc các bản ghi của nó.
