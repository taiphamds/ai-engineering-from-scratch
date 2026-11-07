---
id: byte-match-is-not-source
title: Same 46 bytes, same relocation, wrong table
card: evidence-reverse-engineering
kind: design
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [reverse-engineering, rebuild, relocation-masking, byte-comparison, proof]
minutes: 10
lessons: [phases/13-tools-and-protocols/36-rebuild-and-prove-equal]
manuals: [reverse-engineering-101#s-a-proof-harness-outside-rea, reverse-engineering-101#s-compare-and-compare-functions]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/listing-before-pseudocode, evidence-reverse-engineering/addend-0x10-table-0x14]
updated: 2026-11-03
---

Thiết kế nhánh thứ hai của một chứng minh xây dựng lại: xây mọi ứng viên dưới trình biên dịch và các cờ đã tạo bản gốc, rồi so sánh với hàm gốc. Tám ứng viên đang được xem xét, trong đó có một cặp bản dựng lại `percent_change` có các dòng mã nguồn được viết khác nhau, một ứng viên `grade` có 46 byte mã và hình dạng relocation khớp bản gốc nhưng `case 10` trả về 3, và các ứng viên có addend relocation khác bản gốc. Nói phép so sánh làm gì ở mỗi bước, mỗi bước chặn ứng viên nào, và một lần đạt có nghĩa gì.

## Short answer

Ba bước theo thứ tự: mask mọi trường relocation bằng cách đặt các byte của nó về không ở cả hai phía và so sánh mã; so sánh các bản ghi relocation theo offset, kiểu và section đích, không theo addend, vì bản gốc nói `.rodata+0x10` và mọi ứng viên nói `.rodata-0x4` và đó là một vị trí bảng khác, không phải một hàm khác; rồi đọc các byte mỗi relocation trỏ tới, ở đây năm word 4 byte, và so sánh chúng. Ứng viên sai hằng số đạt hai bước đầu và chỉ thất bại bước ba, `1, 2, 3, 4, 4` so với `1, 2, 3, 4, 3`. Một lần đạt chứng minh rằng trình biên dịch này với các cờ này tạo cùng mã và cùng dữ liệu được tham chiếu từ ứng viên; nó không chứng minh ứng viên là văn bản mã nguồn gốc, vì hai bản dựng lại `percent_change` có văn bản khác biên dịch thành 16 byte giống hệt.

## Full answer

### Where each candidate stops

| Ứng viên | Kích thước | Byte đã mask | Bản ghi | Bảng | Trạng thái |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 và 16 | bằng | không có | không có | đạt |
| `percent_change_split` | 16 và 16 | bằng | không có | không có | đạt |
| `percent_change_wide` | 16 và 26 | khác kích thước | không có | không có | không đạt |
| `percent_change_div_first` | 16 và 18 | khác kích thước | không có | không có | không đạt |
| `grade_switch` | 46 và 46 | bằng | cùng hình dạng | bằng | đạt |
| `grade_table` | 46 và 46 | bằng | cùng hình dạng | bằng | đạt |
| `grade_thresholds` | 46 và 39 | khác kích thước | 1 so với 0 | không có | không đạt |
| `grade_case10_wrong` | 46 và 46 | bằng | cùng hình dạng | khác | không đạt |

Kích thước là một chẩn đoán và không bao giờ là một chấp nhận: một project tái dựng được ghi lại báo cáo một ứng viên có độ dài đúng và hàng trăm byte khác.

### Why mask when the field is already zero

Trong một object RELA addend nằm trong bản ghi và bốn byte trường bằng không ở cả hai phía, vì vậy một phép so sánh thông thường sẽ đạt trong khi hai relocation nêu các vị trí khác nhau. Vẫn mask giữ một phương pháp cho object REL và cho Mach-O, nơi trường mang addend. Các addend khác nhau vì object gốc giữ một bảng khác trong `.rodata` trước bảng switch và object ứng viên không có.

### Why read the constants

Bước này tồn tại vì một lỗi được tài liệu hóa trong một project tái dựng khác: một phép so sánh phát lại địa chỉ đích vào trường relocation, so sánh các byte lệnh, và không bao giờ kiểm tra dữ liệu tại địa chỉ đó, vì vậy một literal mã nguồn `0.0` trông chính xác so với một literal đích `128.0` cho đến khi 1,548 tham chiếu dấu phẩy động được kiểm toán. Ứng viên sai hằng số là phiên bản khuyết điểm đó của fixture này, và việc đọc bảng là kiểm toán. Số lượng năm đến từ listing: một phép so sánh với 4 cùng một nhảy không dấu cho phép các chỉ số 0 đến 4, và phép nạp đọc 4 byte mỗi chỉ số.

### What the tool's own compare can see

Công cụ so sánh so khác từng dòng văn bản provider trên tám chiều, và chiều assembly của nó mang hai giới hạn cố định: văn bản provider chính xác được so sánh không có chuẩn hóa địa chỉ hoặc tên được sinh, và assembly là văn bản provider mờ đục không có chuẩn hóa relocation. Một chiều assembly `unchanged` nghĩa là văn bản bằng nhau từ một engine, một chiều `changed` nghĩa là văn bản khác, và không cái nào là một phát biểu về byte. Hai bản sao cùng mã tại các địa chỉ khác nhau được so là thay đổi. Chứng minh cấp byte là phần công cụ để cho bạn.

## Follow-ups

- **Level 3:** Tại sao addend bị bỏ khi hai bản ghi relocation được ghép? Expected: addend mã hóa nơi bảng nằm trong `.rodata` của object đó, phụ thuộc vào thứ khác object giữ, không phải hàm làm gì.
- **Level 3:** Một chiều assembly `changed` trong công cụ so sánh cho bạn biết gì về byte của hai hàm? Expected: không gì; nó là một phép so văn bản có địa chỉ bên trong, và một object có thể tái định vị so với image đã liên kết của nó được so là thay đổi.
- **Level 4:** Hai ứng viên có văn bản mã nguồn khác nhau đạt mọi phép kiểm tra byte. Bạn đã chứng minh gì? Expected: rằng trình biên dịch này gộp cả hai thành cùng mã và dữ liệu, không phải một trong hai là văn bản gốc; tràn số có dấu là không xác định cho phép trình biên dịch gộp hai phép nhân.
- **Level 4:** Một ứng viên đạt byte và hằng số. Hành vi đã được phân định chưa? Expected: trên cùng kiến trúc có, vì mã và dữ liệu được tham chiếu bằng nhau; ô trap vẫn phụ thuộc vào host chạy lưới, vì vậy chứng minh nêu host đó.

## Wrong answers

- "Cùng kích thước nghĩa là cùng hàm." Kích thước là một chẩn đoán; một ứng viên có độ dài đúng có thể khác hàng trăm byte.
- "Một lần khớp byte khôi phục mã nguồn." Văn bản mã nguồn khác nhau có thể biên dịch thành các byte giống hệt; lần khớp là một phát biểu về một trình biên dịch và một tập cờ.
- "Công cụ so sánh nói không đổi, vì vậy các byte khớp." Nó so sánh văn bản decompiler có địa chỉ bên trong và nói vậy trong các giới hạn riêng.

## Taught in

[Bài học xây dựng lại](../../../phases/13-tools-and-protocols/36-rebuild-and-prove-equal/) xây dựng việc mask, so sánh bản ghi và đọc bảng, [phần harness chứng minh](../../../manuals/reverse-engineering-101/sections/7-2-a-proof-harness-outside-rea.md) ghi lại tám ứng viên, và [phần so sánh](../../../manuals/reverse-engineering-101/sections/5-5-compare-and-compare-functions.md) nêu giới hạn assembly.
