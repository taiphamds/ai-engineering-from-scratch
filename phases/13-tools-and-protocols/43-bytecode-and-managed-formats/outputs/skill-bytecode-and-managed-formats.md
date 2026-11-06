---
name: bytecode-and-managed-formats
description: Đọc một .pyc, một tệp class JVM, một assembly .NET, hoặc một mô-đun WebAssembly từ header đến các lệnh của nó, kiểm tra việc đọc với công cụ riêng của định dạng, và báo cáo container giữ những tên, kiểu, và cấu trúc điều khiển nào.
version: 1.0.0
phase: 13
lesson: 43
tags: [reverse-engineering, bytecode, cpython, pyc, jvm, class-file, ecma-335, cil, webassembly, metadata]
---

Với một container bytecode do chính bạn dựng, hãy tạo một báo cáo header, một bản liệt kê của một hàm, và một bảng những gì container lưu bên cạnh các lệnh. Dùng skill này với Claude, Cursor, Codex, OpenClaw, Hermes, hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp bytecode và phiên bản cùng lệnh chính xác của trình biên dịch, trình thông dịch, hoặc assembler đã tạo ra nó.
- Mã nguồn mà nó được dựng từ, được giữ cạnh nó.
- Một bản liệt kê tham chiếu từ công cụ riêng của định dạng được thu lại từ cùng tệp: `python3.N -m dis` cho một pyc, `javap -c -p` cho một tệp class, `wasm-objdump -h -x -d` cho một mô-đun, một bản dump System.Reflection.Metadata hoặc `ilspycmd -il` cho một assembly.
- Các bộ đọc từ bài 43 (`code/main.py`) hoặc các bản tương đương phát sinh ngoại lệ khi gặp một mã kiểu, opcode, hoặc bảng không biết.
- Hàm cần báo cáo.

## Procedure

1. Nhận diện container từ các byte đầu của nó: hai byte rồi `0d 0a` là một pyc, `ca fe ba be` là một tệp class, `00 61 73 6d` là một mô-đun Wasm, `4d 5a` với thư mục dữ liệu 14 được đặt là một assembly .NET. Dừng nếu không có gì khớp.
2. Đọc header và viết ra các thông tin phiên bản: word magic và các cờ pyc, phiên bản major và minor class, phiên bản nhị phân Wasm, phiên bản runtime CLI và chuỗi phiên bản metadata. Nêu phiên bản bên tạo mà những thông tin đó cho phép.
3. Đọc toàn bộ container bằng bộ đọc. Một pyc cho đối tượng mã mô-đun và các đối tượng mã lồng nhau của nó. Một tệp class cho constant pool, các trường, phương thức, và thuộc tính. Một mô-đun cho các section, kiểu, import, export, thân mã, dữ liệu, và bất kỳ section name nào của nó. Một assembly cho các stream, các số hàng bảng, các hàng TypeDef, MethodDef, Param, và Field, và các thân phương thức.
4. Disassemble hàm đã chọn. Với một pyc, chỉ dùng `dis` khi trình thông dịch đang chạy đã viết tệp, nếu không dùng bản liệt kê đã thu lại từ trình thông dịch tương ứng. Với ba loại còn lại, dùng trình disassemble của bộ đọc.
5. So sánh bản liệt kê với bản tham chiếu theo độ lệch, byte, và mnemonic. Dừng và sửa bộ đọc tại điểm không khớp đầu tiên. Ghi lại số lượng đã thống nhất.
6. Điền bảng thông tin cho hàm: tên hàm, tên tham số, kiểu tham số, kiểu trả về, tên cục bộ, số dòng, kích thước thân, và hình dạng luồng điều khiển (các bước nhảy, lệnh switch, các khối lồng nhau).
7. Viết ra những thông tin nào container đã mất và nơi chúng lẽ ra tồn tại: PDB cho các tên cục bộ .NET, section tùy chỉnh name cho các tên Wasm, `javac -g` cho các tên cục bộ JVM, DWARF cho mã native.
8. Trước khi chạy bất kỳ trình dịch ngược nào, kiểm tra rằng mức trần phiên bản được ghi tài liệu của nó bao quát phiên bản header từ bước 2. Ghi lại mức trần và nguồn của khẳng định đó.

## Required report

- container, phiên bản bên tạo, lệnh dựng, và lệnh bản liệt kê tham chiếu
- các thông tin header với các byte thô mà chúng đến từ
- sự thống nhất tham chiếu dưới dạng số hàng thống nhất trên số hàng được so sánh
- bản liệt kê hàm với các độ lệch, byte, và văn bản
- bảng thông tin với được giữ hoặc bị mất cho mỗi hàng và bằng chứng cho từng hàng
- các trình dịch ngược được xem xét, các mức trần phiên bản của chúng, và liệu tệp có nằm trong các mức đó hay không
- mọi phạm vi byte mà bộ đọc không thể diễn giải, kèm độ lệch của nó

## Hard rejects

- Đoán phiên bản bên tạo từ tên tệp thay vì các byte header.
- Liệt kê các lệnh pyc bằng mô-đun `dis` của một phiên bản trình thông dịch khác.
- Đọc một đích nhánh tệp class là tương đối với lệnh tiếp theo. JVMS làm nó tương đối với opcode nhánh.
- Bỏ qua phần đệm căn chỉnh trước `tableswitch` và `lookupswitch`.
- Coi một tên export Wasm là một tên biến cục bộ, hoặc một section name vắng mặt là một tệp nhị phân đã strip.
- Đọc một token .NET mà không kiểm tra byte bảng của nó, hoặc tính kích thước một hàng bảng mà không có các bit HeapSizes và các số hàng.
- Báo cáo một container là bị làm rối vì một trình dịch ngược đã in một opcode không được hỗ trợ.
- So sánh với một bản liệt kê tham chiếu được thu lại từ một bản dựng khác của cùng mã nguồn.

## Produce

Trả về những phần này:

1. Container và Phiên bản: các byte header và bên tạo mà chúng nêu.
2. Tham chiếu: số hàng được so sánh, số hàng thống nhất, điểm không khớp đầu tiên nếu có.
3. Bản liệt kê: hàm với các độ lệch, byte, và văn bản.
4. Các thông tin: tên, tham số, kiểu, biến cục bộ, dòng, kích thước, hình dạng luồng điều khiển, mỗi thông tin được đánh dấu được giữ hoặc bị mất cùng bằng chứng của nó.
5. Các giới hạn trình dịch ngược: các công cụ được xem xét và các mức trần được ghi tài liệu của chúng đối chiếu với phiên bản header.
6. Những điều chưa biết: mọi độ lệch mà bộ đọc đã bỏ qua hoặc từ chối và lý do.

Kết thúc bằng điều chưa biết đầu tiên. Nếu không có, hãy nêu số lượng thống nhất tham chiếu và số thông tin container đã giữ trên sáu.
