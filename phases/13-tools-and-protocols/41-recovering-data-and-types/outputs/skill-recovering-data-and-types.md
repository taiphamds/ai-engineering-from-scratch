---
name: recovering-data-and-types
description: Chuyển một bản liệt kê disassembly và một bản dựng gỡ lỗi tùy chọn thành một bố cục struct có bằng chứng cho từng trường, một stride với các nguồn của nó, một phép so sánh với DWARF, và một danh sách những gì vẫn chưa biết.
version: 1.0.0
phase: 13
lesson: 41
tags: [reverse-engineering, x86-64, types, structs, dwarf, system-v-abi, itanium-abi, vtables]
---

Với một tệp đối tượng x86-64 do chính bạn dựng, bản liệt kê `llvm-objdump -d -r` của nó, và các hàm nhận một con trỏ đến kiểu đang nghiên cứu, hãy tạo bố cục trường mà các lệnh chứng minh, stride mà các vòng lặp chứng minh, phép so sánh với bố cục DWARF khi có một bản dựng `-g`, và các tên cùng qualifier mà không lệnh nào có thể cung cấp. Dùng skill này với Claude, Cursor, Codex, OpenClaw, Hermes, hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp đối tượng, trình biên dịch và lệnh chính xác đã tạo nó, và văn bản `llvm-objdump -d -r` được thu lại từ cùng tệp đối tượng.
- Tên của các hàm có tham số đầu tiên trỏ đến kiểu, hoặc các vị trí gọi truyền một đối tượng cho chúng.
- Khi có, một bản dựng `-g` của cùng mã nguồn và văn bản `llvm-dwarfdump --debug-info` của nó.
- Với một tệp đối tượng C++, bảng ký hiệu và các bản ghi relocation của các section `.data.rel.ro.*` giữ các vtable.
- Lượt xử lý và bộ đọc từ bài 41 (`code/main.py`) hoặc một bản tương đương ghi lại lệnh đằng sau mỗi trường.

## Procedure

1. Phân tích bản liệt kê thành các hàm. Gắn mỗi dòng relocation vào lệnh bên trên nó, để các lời gọi mang tên hàm được gọi.
2. Chạy vết tiến trên mỗi hàm với các thanh ghi đối số System V được khởi tạo làm con trỏ. Ghi lại mọi toán hạng bộ nhớ có cơ sở giữ một con trỏ dưới dạng một truy cập với gốc, độ lệch, độ rộng, loại, dấu, và cờ lưu. Ghi lại các lần tăng 64 bit, các nhánh ngược dưới dạng vòng lặp, và các giá trị đối số tại mỗi lời gọi.
3. Với mỗi vòng lặp, nhóm các truy cập cùng độ rộng qua một thanh ghi cơ sở. Nếu các độ lệch cách nhau `d` và bước vòng lặp là `k * d` với `k` độ lệch phân biệt, gộp chúng về một độ lệch và ghi lại `unrolled`. Không tin bất kỳ độ lệch nào vượt quá stride trước bước này.
4. Thu thập bằng chứng stride của mọi loại: các hệ số chỉ mục từ phép dịch và phép nhân, các bước vòng lặp, các hiệu độ lệch, và các độ lệch phần tử tại vị trí gọi. Stride là ước chung lớn nhất của tất cả chúng. Nêu loại của mỗi giá trị.
5. Dựng các trường. Gộp các truy cập tại một độ lệch và độ rộng. Đánh dấu một trường là con trỏ chỉ khi một giá trị được nạp từ nó sau đó được dùng làm cơ sở hoặc được tăng bằng `lea`. Ghi lại các truy cập chồng lấn có độ rộng khác nhau là xung đột.
6. Nếu có một bản dựng `-g`, đọc DWARF 5 của nó qua bảng viết tắt và các bảng `.debug_str_offsets` cùng `.debug_addr` đã áp dụng relocation. Kiểm tra header đơn vị, các độ lệch thành viên, và kích thước byte với `llvm-dwarfdump`. So sánh từng trường và gắn nhãn mỗi hàng là `match`, `no-evidence`, `size-mismatch`, `pointer-unproven`, `kind-mismatch`, hoặc `unexpected`.
7. Kiểm tra bố cục đã khôi phục với các quy tắc System V: mỗi trường tại một bội số của kích thước riêng của nó, kích thước là bội số của căn chỉnh nghiêm ngặt nhất, các khoảng trống ở nơi các quy tắc yêu cầu đệm. Một vi phạm có nghĩa là một packed struct, một bit-field, hoặc một trường sai.
8. Với một tệp đối tượng C++, đọc mỗi ký hiệu `_ZTV` từ các relocation của nó: độ lệch đến đỉnh, typeinfo, rồi các ô từ điểm địa chỉ cách vào 16 byte. Đọc mỗi `_ZTI` để lấy loại, chuỗi tên, và cơ sở của nó. Phân giải mọi `call *disp(%reg)` có thanh ghi được nạp từ độ lệch 0 của một đối tượng thành `disp / 8` và liệt kê các hàm ứng viên theo lớp. Giải mã mọi tên `_Z` và kiểm tra với `llvm-cxxfilt --no-strip-underscore`.
9. Viết mọi tên, qualifier, kiểu được trỏ đến, và giả định alias là chưa biết hoặc được suy ra. Các lệnh không cung cấp bất kỳ thứ nào trong số đó.

## Required report

Với kiểu, báo cáo:

- tên tệp đối tượng, trình biên dịch, lệnh dựng, và đường dẫn bản liệt kê
- các hàm nhân chứng và bằng chứng rằng chúng dùng chung một kiểu (các vị trí gọi hoặc một khẳng định của người phân tích)
- bảng trường với độ lệch, kích thước, loại, dấu, số lần truy cập, và địa chỉ của mỗi truy cập
- các bằng chứng con trỏ với lệnh giải tham chiếu
- bảng stride với mọi giá trị và loại của nó, các vòng lặp đã gộp, và stride cùng kích thước kết quả
- các hàng so sánh với DWARF khi có một bản dựng `-g`, và các giá trị header đơn vị đã được kiểm tra
- kiểm tra căn chỉnh với các quy tắc System V
- với C++: các vtable với ô và ký hiệu, loại và cơ sở typeinfo, các lời gọi ảo với ô và ứng viên, các tên đã giải mã
- mọi điều chưa biết: các thành viên không có bằng chứng, các con trỏ chưa được chứng minh, các tên, qualifier, các kiểu được trỏ đến

## Hard rejects

- Báo cáo một độ lệch vượt quá stride mà không kiểm tra vòng lặp có unroll hay không.
- Coi một lần tăng vòng lặp duy nhất là kích thước phần tử.
- Gọi một trường 8 byte là con trỏ mà không có phép giải tham chiếu.
- Gọi một phép so sánh 1 byte là char có dấu hoặc không dấu.
- Gộp các truy cập của nhiều hàm thành một struct mà không có bằng chứng vị trí gọi hoặc một khẳng định được ghi lại.
- Đọc `.debug_str` bằng chỉ mục thô, hoặc `.debug_addr` mà không có các relocation của nó, trong một tệp đối tượng có thể relocation.
- Phân tích một header DWARF 4 bằng bố cục DWARF 5.
- Đọc các ô vtable từ điểm bắt đầu ký hiệu thay vì điểm địa chỉ.
- Coi một vtable vắng mặt trong một tệp đối tượng là bằng chứng rằng lớp không có vtable.
- Sao chép tên kiểu của một trình dịch ngược vào báo cáo làm bằng chứng.
- Bịa ra một tên thành viên.

## Produce

Trả về những phần này:

1. Nhân chứng: các hàm, các gốc, và bằng chứng alias.
2. Truy cập: bảng truy cập đầy đủ có địa chỉ.
3. Bố cục: các trường, các bằng chứng con trỏ, các xung đột, các khoảng trống, và phép kiểm tra căn chỉnh.
4. Stride: mọi giá trị với loại của nó, các phép gộp đã áp dụng, stride, và kích thước.
5. DWARF: phép kiểm tra header đơn vị và các hàng so sánh, hoặc phát biểu rằng không có bản dựng gỡ lỗi.
6. C++: các vtable, typeinfo, các lời gọi ảo, và các tên đã giải mã, hoặc phát biểu rằng tệp đối tượng không có chúng.
7. Những điều chưa biết: mọi thành viên, loại, tên, và qualifier mà bằng chứng không chạm đến.

Kết thúc bằng điều chưa biết đầu tiên. Nếu không có, hãy nêu số thành viên khớp với DWARF và số nguồn stride đã thống nhất.
