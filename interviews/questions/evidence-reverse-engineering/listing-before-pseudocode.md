---
id: listing-before-pseudocode
title: Four tests pass and the rebuild is 26 bytes long
card: evidence-reverse-engineering
kind: debug
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, coding]
tags: [reverse-engineering, decompiler, pseudocode, rebuild, integer-width]
minutes: 8
lessons: [phases/13-tools-and-protocols/34-lifting-to-pseudocode, phases/13-tools-and-protocols/36-rebuild-and-prove-equal]
manuals: [reverse-engineering-101#s-a-proof-harness-outside-rea]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/observed-derived-inferred]
updated: 2026-11-03
---

Từ pseudocode của decompiler, một agent xây dựng lại `percent_change`. Pseudocode là `undefined1 [16] percent_change(int param_1, int param_2, ulong param_3)` với `lVar1 = (long)((param_2 - param_1) * 100)`. Bản dựng lại là `(int)(((long)after - before) * 100 / before)`, và bốn kiểm thử viết tay đạt. Listing của cùng bản ghi là `IMUL EAX, ESI, 0x64`, `CDQ`, `IDIV EDI`. Điều gì sai, và quy tắc là gì?

## Short answer

Kiểu trả về 16 byte và tham số thứ ba là suy luận của decompiler, không phải chương trình: `idiv` ghi cặp `EDX:EAX`, đường không để `EDX` nguyên, vì vậy decompiler mô hình hóa một kết quả 16 byte và đọc `%rdx` như một đầu vào. Listing nói mọi thao tác rộng 32 bit, vì vậy bản dựng lại trung thực là `100 * (after - before) / before` trong `int`; phiên bản `long` chia tích chưa wrap và thất bại 26 ô tràn trong khi biên dịch thành 26 byte nơi bản gốc có 16. Quy tắc là đọc listing trước pseudocode, viết bản dựng lại từ chiều rộng thao tác, và dẫn id bản ghi nó đến từ.

## Full answer

### Instruction or guess, line by line

| Khác biệt | Phán quyết |
|---|---|
| kiểu trả về `undefined1 [16]` so với `int` | phỏng đoán; `idivl` ghi hai thanh ghi và không caller nào cố định chiều rộng |
| `param_3` | phỏng đoán theo từ điều đầu; `%rdx` chỉ được đọc trên đường không vì chiều rộng trả về bị đoán |
| `lVar1 / (long)param_1 & 0xffffffff` so với `/ param_1` | lệnh; `cltd` cộng `idivl` là một phép chia 32 bit mở rộng dấu, và cả hai văn bản mô tả nó |
| `if (param_1 != 0)` trước | thứ tự lệnh; nhánh nhảy đến trả về không, và bất kỳ nhánh con nào cũng có thể được in trước |

Một khác biệt có một lệnh đằng sau là một lựa chọn trình bày. Một khác biệt không có lệnh đằng sau là một phỏng đoán, và phỏng đoán có thể ở bất kỳ phía nào.

### Why four tests passed

Các trường hợp ngây thơ tránh mọi lớp khó. Các tích wrap và chưa wrap đồng ý bất cứ khi nào `(after - before) * 100` vừa trong 32 bit, vì vậy một kiểm thử không bao giờ vượt đường đó thấy hai hàm bằng nhau. Trên một lưới có các ô tràn, bản dựng lại `long` thất bại 26 ô, mọi ô với `|before| > 1`; với `before` bằng 1 hoặc -1 thương 64 bit cắt trở lại giá trị đã wrap và hai bên vô tình đồng ý.

### The size told you first

Được biên dịch với các cờ gốc, bản dựng lại `long` là 26 byte: `movslq`, `imulq`, `cqto` và `idivq` thay các dạng 32 bit. Kích thước là một chẩn đoán và không bao giờ là một chấp nhận, và listing đã cho thấy các chiều rộng trước bất kỳ lần biên dịch nào.

### What the research says about this pattern

Một nghiên cứu 2026 về các hệ thống decompilation tìm thấy các ứng viên đạt mọi kiểm thử trong một benchmark và vẫn phân kỳ trên các đầu vào fuzz. Mô hình tinh chỉnh mạnh nhất nâng tỷ lệ dựng từ 75 lên 90 phần trăm trong khi tỷ lệ khớp hành vi giảm từ 74 xuống 62 phần trăm, và nguyên nhân là các trường, kiểu, callee và điều kiện bảo vệ bị bịa thay thế các điều chưa biết hiển thị mà một decompiler để lại trong văn bản. Bản dựng lại `long` là một kiểu bị bịa.

## Follow-ups

- **Level 2:** Tại sao bốn kiểm thử không bắt được nó? Expected: không kiểm thử nào làm tích vượt 32 bit, và hai phiên bản đồng ý ở mọi nơi tích vừa.
- **Level 3:** Những đầu vào nào phơi bày khác biệt, và những đầu vào nào vô tình giấu nó? Expected: các ô tràn với `|before| > 1` thất bại; `before` bằng 1 hoặc -1 đồng ý vì thương rộng cắt về giá trị đã wrap.
- **Level 3:** Kích thước 26 byte cho bạn biết gì trước bất kỳ lần chạy nào? Expected: các dạng lệnh rộng hơn thay các dạng 32 bit, vì vậy ứng viên tính trong một chiều rộng khác listing.
- **Level 4:** Phát hiện về mô hình tinh chỉnh thay đổi cách bạn đọc pseudocode sạch như thế nào? Expected: một signature sạch đúng vì lý do sai khi nó lấp một điều chưa biết; giữ dạng xấu trung thực và ghi điều không lệnh nào hỗ trợ.

## Wrong answers

- "Decompiler hỏng; bỏ qua đầu ra của nó." Các lệnh của nó đúng; chỉ những phần các lệnh để mở bị đoán, và listing trong cùng bản ghi là phần sửa.
- "`& 0xffffffff` là một lỗi decompiler." Nó mô tả đúng việc cắt một phép chia mở rộng dấu.
- "Mười kiểm thử đạt, phát hành." Một lưới có các ô tràn, âm, làm tròn và trap là kiểm thử; mười trường hợp tránh mọi nguy cơ.

## Taught in

[Bài học lifting](../../../phases/13-tools-and-protocols/34-lifting-to-pseudocode/) điền bảng khác biệt, [bài học xây dựng lại](../../../phases/13-tools-and-protocols/36-rebuild-and-prove-equal/) chạy lưới, và [phần harness chứng minh](../../../manuals/reverse-engineering-101/sections/7-2-a-proof-harness-outside-rea.md) ghi lại 26 ô thất bại và ứng viên 26 byte.
