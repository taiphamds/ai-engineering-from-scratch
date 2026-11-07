---
id: stale-snapshot-refused
title: profile_mismatch after an upgrade and a rename
card: evidence-reverse-engineering
kind: debug
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [debugging, system-design]
tags: [reverse-engineering, cache, snapshot, analysis-profile, invalidation]
minutes: 8
lessons: [phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: [reverse-engineering-101#s-snapshots-and-the-answer-cache]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/evidence-id-excludes-the-path]
updated: 2026-11-03
---

Sau một nâng cấp công cụ, một lời gọi `open_binary` với snapshot đã lưu trả lời `profile_mismatch`, dù SHA-256 và provider của mục tiêu không đổi. Cùng buổi sáng một đồng nghiệp đổi tên một hàm, và sau đó `close_binary` với một đường dẫn snapshot thất bại với "Analysis snapshots are unavailable because analysis metadata may have changed". Giải thích cả hai lần từ chối, và nói một snapshot là gì và không là gì.

## Short answer

Khóa cache là chuỗi `query_` cộng một SHA-256 trên định danh mục tiêu, binding, thao tác và các tham số, và binding bao gồm digest hồ sơ phân tích trên 25 chuỗi phiên bản tham số; nâng cấp dịch chuyển hai giá trị đó, vì vậy digest thay đổi và không mục đã lưu nào có thể khớp, điều mà việc import báo cáo là `profile_mismatch`. Một lần đổi tên là một lời gọi sửa đổi, và phiên làm rỗng cache và đặt một cờ trước khi lời gọi được chuyển đi, ngay cả khi phản hồi thất bại, vì một phản hồi thất bại không thể chứng minh việc ghi chưa bao giờ tới provider, vì vậy việc xuất bị từ chối và lối ra là xuất evidence bundle, đóng không có snapshot, và mở lại. Một snapshot là một file các câu trả lời chính xác trước đó cộng evidence bundle của chúng, không phải một cơ sở dữ liệu provider được lưu.

## Full answer

### Three things called a snapshot

Target snapshot là bản sao riêng launcher import chỉ đọc và xóa khi đóng; không gì của phân tích sống sót qua nó, và mọi phiên mới import mục tiêu lại. Cache snapshot phân tích trong bộ nhớ giữ tối đa 10,000 mục cho một định danh mục tiêu. Snapshot file là thứ `close_binary` ghi và `open_binary` đọc: định danh mục tiêu, binding provider, các mục cache và evidence bundle của phiên. Chỉ một truy vấn chính xác đủ điều kiện có thể tái sử dụng một kết quả, và một truy vấn mới hoặc trực tiếp vẫn khởi động provider.

### What qualifies and what a hit looks like

Một lời gọi đủ điều kiện khi thao tác không có trạng thái, nêu tài liệu hoặc địa chỉ nơi một thứ được ngụ ý, khai báo không sửa đổi artifact, và mang chính sách cache `snapshot`. Một hit trả về không đụng provider và thêm một giới hạn: "Được nạp từ một REA analysis snapshot cục bộ; lời gọi này không chạy lại provider." Bản ghi được phát lại được rebind với đường dẫn mục tiêu đang mở và giữ `evidence_id`, vì đường dẫn ở ngoài hash. Các phép đo của bài học làm rõ điểm: một truy vấn đầu mất 8.6 s với một import mới, một truy vấn khác với cùng snapshot mất 8.5 s vì nó là miss, và một lần lặp mất 2.1 s và trả về bản ghi giống hệt với id giống hệt.

### Load is a full check

Các mục phải theo thứ tự id chuẩn tắc, mọi query id được tính lại và phải khớp, không id nào xuất hiện hai lần, và mọi mục phải có một bản ghi bằng chứng trong bundle với cùng hồ sơ và kết quả. Một bản ghi bundle cho mục tiêu khác làm thất bại toàn bộ file. Việc ghi là nguyên tử và chỉ dành cho chủ sở hữu.

### Why the order of invalidation matters

Bản phát hành hiện tại vô hiệu hóa rồi gọi provider; một bản trước chỉ vô hiệu hóa sau một lời gọi thành công. Tài liệu nêu quy tắc: một lần ghi metadata xóa cache của phiên hoạt động ngay cả khi phản hồi thất bại, vì provider có thể đã áp dụng việc ghi.

## Follow-ups

- **Level 2:** Bạn cache `analyze_function` cho một hàm rồi hỏi về hàm khác. Tại sao miss? Expected: các tham số là một phần của khóa, vì vậy chỉ chính xác cùng câu hỏi được phát lại.
- **Level 3:** Tại sao không vô hiệu hóa sau khi lời gọi sửa đổi thành công? Expected: một phản hồi thất bại không thể chứng minh rollback, vì vậy một cache được giữ sau thất bại có thể phát lại một câu trả lời về một cơ sở dữ liệu đã thay đổi.
- **Level 3:** Một người đọc phân biệt một bản ghi được phát lại với một bản mới như thế nào? Expected: câu giới hạn được thêm nói provider không chạy lại.
- **Level 4:** Hành động đúng sau lần từ chối do nâng cấp là gì? Expected: chạy phân tích lại dưới hồ sơ mới và giữ bundle cũ làm bằng chứng về một hợp đồng cũ; không bao giờ sửa digest để ép khớp.

## Wrong answers

- "Một snapshot là một project đã lưu; mở lại nó." Nó giữ các câu trả lời cho các câu hỏi trước, và project bị xóa khi đóng.
- "Vá digest hồ sơ để các mục cũ khớp." Digest nêu hợp đồng mà các câu trả lời được tạo dưới đó; một lần ép khớp phát lại các câu trả lời từ một hợp đồng đã thay đổi.
- "Một lần đổi tên là metadata, vì vậy các câu trả lời cache vẫn hợp lệ." Một lần đổi tên là một lời gọi sửa đổi; cache bị làm rỗng trước khi chuyển đi và việc xuất bị từ chối.

## Taught in

[Phần snapshot](../../../manuals/reverse-engineering-101/sections/5-3-snapshots-and-the-answer-cache.md) đưa ra khóa, các quy tắc đủ điều kiện và thứ tự vô hiệu hóa, và [bài học bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/) xây cùng cache và từ chối một phiên bản hồ sơ tăng.
