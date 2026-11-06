---
id: what-a-feedback-record-carries
title: What one feedback record carries
card: agents
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [feedback-record, exit-code, truncation, redaction, telemetry]
minutes: 5
lessons: [phases/14-agent-engineering/37-runtime-feedback-loops]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops]
related: [agents/tests-passed-but-nothing-ran]
updated: 2026-11-03
---

Bạn bọc mọi lệnh shell mà một agent chạy để lượt tiếp theo có thể đọc điều gì đã xảy ra. Điều gì đi vào bản ghi, trường nào cho bạn biết lệnh có hoạt động hay không, và bạn làm gì khi trường đó rỗng?

## Short answer

Bản ghi mang lệnh chính xác dưới dạng argv, phần đuôi stdout và phần đuôi stderr dưới dạng các trường riêng, mã thoát, thời lượng, thời điểm bắt đầu, và một ghi chú một dòng về những gì agent kỳ vọng. Mã thoát là tín hiệu thành công, vì văn bản có thể nói bất kỳ điều gì và mã không thể. Nếu runner thất bại trước khi thu một mã thoát, bản ghi mang một mã thoát null và một lý do lỗi, và vòng lặp không được tiến tiếp trên nó.

## Full answer

### The fields

| Trường | Tại sao nó ở đó |
|---|---|
| `command` | Argv chính xác, để không có bất ngờ mở rộng shell |
| `stdout_tail` | Các dòng đầu ra cuối cùng, được cắt cùng cách mỗi lần |
| `stderr_tail` | Các dòng lỗi cuối cùng, được giữ tách khỏi stdout |
| `exit_code` | Một tín hiệu thành công không mơ hồ duy nhất |
| `duration_ms` | Cho thấy các phép thăm dò chậm và tiến trình mất kiểm soát |
| `started_at` | Một dấu thời gian cho việc phát lại |
| `agent_note` | Những gì agent kỳ vọng trước khi đọc kết quả |

### Truncation that does not lose the error

Một log lớn phá hủy vòng lặp. Runner giữ một số cố định các dòng đầu và dòng cuối rồi chèn một dấu đánh dấu nói nó đã loại bỏ bao nhiêu dòng. Cùng đầu ra luôn cho cùng bản ghi. Không có gì được lấy mẫu, vì lỗi cuối cùng và tóm tắt cuối cùng nằm ở đuôi.

### Redact at write

Một bản ghi stdout có thể mang một bí mật. Runner loại bỏ các bearer token, phép gán mật khẩu, khóa API và các định dạng khóa đã biết trước khi nối thêm dòng. Che thông tin tại thời điểm đọc là một sai lầm, vì file trên đĩa là thứ một kẻ tấn công tiếp cận.

### Feedback is not telemetry

Telemetry dành cho các người vận hành đánh giá các lần chạy qua thời gian. Phản hồi dành cho lượt tiếp theo của lần chạy này. Chúng dùng chung các trường và nằm trong các file khác nhau với thời hạn lưu giữ khác nhau.

## Follow-ups

- **Level 1:** Tại sao giữ stderr tách khỏi stdout? Expected: tóm tắt thất bại thường vào một luồng và tiến độ vào luồng kia, và một phần đuôi được gộp có thể chôn tóm tắt.
- **Level 2:** Một lệnh timeout. Bản ghi nói gì? Expected: một mã thoát null, một trường lỗi có timeout, và bất kỳ đầu ra một phần nào đã thu, và vòng lặp từ chối tiến tiếp.
- **Level 2:** Ghi chú agent dùng làm gì? Expected: nó ghi lại dự đoán trước kết quả, để một người đánh giá có thể thấy khi agent kỳ vọng thành công và nhận một thất bại.
- **Level 3:** Một lần thử lại thành công. Cuộc kiểm toán thấy thất bại đầu tiên thế nào? Expected: mỗi bản ghi có một id lệnh, và lần thử lại mang id lệnh cha, nên chuỗi nhìn thấy được và lần thử lại không trông như một thành công độc lập.

## Wrong answers

- "Phân tích đầu ra để tìm từ error nhằm phát hiện thất bại." Văn bản đầu ra thay đổi theo công cụ và ngôn ngữ, và mã thoát là tín hiệu mà mọi lệnh cho.
- "Giữ toàn bộ đầu ra, vì việc cắt có thể giấu thứ gì đó." Một bản ghi khổng lồ đẩy vòng lặp ra khỏi ngân sách token của nó, và phần đuôi xác định giữ các dòng có ý nghĩa.
- "Che thông tin khi một con người mở log." File trên đĩa đã là rò rỉ, nên việc che phải xảy ra trước khi nối thêm.

## Taught in

[Bài học phản hồi runtime](../../../phases/14-agent-engineering/37-runtime-feedback-loops/) dựng runner viết bản ghi này.
