---
id: hazard-grid-estimate
title: How many cells prove two small functions equal
card: evidence-reverse-engineering
kind: estimate
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, agentic-ai-engineer]
rounds: [ml-depth, coding]
tags: [reverse-engineering, differential-testing, input-grid, overflow, undefined-behavior]
minutes: 10
lessons: [phases/13-tools-and-protocols/36-rebuild-and-prove-equal]
manuals: [reverse-engineering-101#s-a-proof-harness-outside-rea]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/byte-match-is-not-source, evidence-reverse-engineering/listing-before-pseudocode]
updated: 2026-11-03
---

Thiết kế lưới đầu vào chạy một bản gốc và một bản dựng lại của `percent_change(int before, int after)` và `grade(int score)` cạnh nhau, để mọi nguy cơ listing cho thấy có ít nhất một ô. Ước tính bạn cần bao nhiêu ô và trong những lớp nào, và một bản dựng lại giữ `long` của decompiler sẽ thất bại bao nhiêu ô.

## Short answer

Đọc các nguy cơ từ listing: một điều kiện bảo vệ không từ `TEST EDI, EDI`, cắt về không cho toán hạng âm, thứ tự nhân trước chia cho làm tròn, một wrap 32 bit từ `IMUL EAX`, một trap chia khi tích đã wrap là `INT_MIN` và số chia là -1, và với `grade` cả hai phía của mọi biên dải cộng các điểm vượt switch. Mười giá trị `before` kết hợp với bảy giá trị `after` cho 70 ô, 22 điểm thêm phần còn lại, tổng cộng 92: 32 tràn, 17 âm, 14 biên, 12 thường, 7 bảo vệ không, 5 cắt âm, 2 vượt switch, 2 làm tròn, 1 trap. Bản dựng lại `long` thất bại các ô tràn với `|before| > 1`, 26 ô, và một bản dựng lại ngưỡng của `grade` thất bại hai ô vượt switch, vì vậy cặp có vẻ hợp lý thất bại 28 trên 92 trong khi cả mười trường hợp ngây thơ đạt.

## Full answer

### One class per hazard

Kiểm thử vi sai cần hai hệ thống so sánh được nhận các trường hợp sinh cơ học, và phần khó là đánh giá kết quả. Ở đây bản gốc là oracle, vì vậy câu hỏi duy nhất là nơi hai bên có thể bất đồng, và mỗi lớp trả lời một câu hỏi như vậy. Các ô bảo vệ không lấy đường trả về sớm. Các ô âm kiểm tra rằng `-9 / 10` là 0 và `-10 / 10` là -1. Các ô làm tròn kiểm tra rằng `(105 - 100) * 100 / 100` là 5 chứ không phải 0. Các ô tràn làm `(after - before) * 100` vượt 32 bit. Ô trap duy nhất làm tích đã wrap bằng `INT_MIN` với `before` bằng -1: chênh lệch là 536870912, wrap thành -2147483648, và số chia là -1.

### Why overflow is in scope

Tràn có dấu không được xác định trong C, và một bộ sinh chương trình tránh hành vi không xác định làm vậy vì một bất đồng oracle ở đó là nhiễu. Oracle này là một object đã biên dịch có một hành vi cố định, vì vậy các ô tràn nằm trong phạm vi; bài học là biết những ô nào dựa trên tiêu chuẩn và những ô nào trên các byte đã biên dịch. Listing phân định nó: phép nhân giữ 32 bit thấp, và bản dựng lại cũng phải vậy.

### The host is part of the result

Trên x86-64 ô trap phát sinh ngoại lệ lỗi chia, vì thương không vừa trong 32 bit, và driver biến `SIGFPE` thành giá trị `trap`. Trên AArch64 `sdiv` không có trap và trả về -2147483648. Lần chạy được ghi trên một host arm64 cho thấy giá trị đó với `match: true`, và một lần chạy cùng lưới trên x86-64 ghi chuỗi `trap`. Báo cáo nêu kiến trúc cạnh mọi hàng, và một chứng minh không có tên host là không hoàn chỉnh.

### Model and run stay apart

Một mô hình Python của listing, với wrap 32 bit và một phép chia kiểu C, dự đoán mỗi ô; lần chạy quan sát nó. Không bất đồng nghĩa là mô hình và binary đồng ý trên mọi ô. Mô hình là bằng chứng derived và lần chạy là bằng chứng observed, và báo cáo giữ chúng trong các trường riêng thay vì làm tròn cái này thành cái kia.

## Follow-ups

- **Level 3:** Tại sao gồm các ô có hành vi không xác định trong C? Expected: oracle là một object đã biên dịch có một hành vi, và listing cho thấy chiều rộng, vì vậy bản dựng lại bị buộc theo byte chứ không theo tiêu chuẩn.
- **Level 3:** Trong 32 ô tràn, bản dựng lại `long` đạt bao nhiêu, và tại sao? Expected: sáu, những ô có `before` bằng 1 hoặc -1, vì thương 64 bit vô tình cắt trở lại giá trị đã wrap.
- **Level 4:** Lưới đạt trên một host arm64. Điều gì vẫn chưa chứng minh cho x86-64? Expected: ô trap, có kết quả gốc khác theo kiến trúc; chạy lại trên x86-64 hoặc đánh dấu bằng host.
- **Level 4:** Mở rộng lưới sang `total(const int *values, int count)`. Những lớp nào xuất hiện? Expected: count 0, một count âm, một phần tử, và các tổng wrap tại 32 bit, mỗi lớp với lệnh listing làm lý do.

## Wrong answers

- "Mười kiểm thử viết tay bao phủ nó." Chúng đạt trên cả hai bản dựng lại sai; không cái nào vượt chiều rộng hoặc biên switch.
- "Fuzz thay vì một lưới." Các đầu vào ngẫu nhiên tìm phân kỳ nhưng không nêu nguy cơ; một lớp mỗi lệnh cho bạn biết một thất bại nghĩa là gì và một lần đạt bao phủ gì.
- "Bỏ ô chia cho âm một; không ai làm vậy." Đó là ô duy nhất có kết quả phụ thuộc kiến trúc, và báo cáo phải nêu host.

## Taught in

[Bài học xây dựng lại](../../../phases/13-tools-and-protocols/36-rebuild-and-prove-equal/) xây lưới và driver, và [phần harness chứng minh](../../../manuals/reverse-engineering-101/sections/7-2-a-proof-harness-outside-rea.md) ghi lại 92 ô, 28 lần không khớp và hàng trap trên một host arm64.
