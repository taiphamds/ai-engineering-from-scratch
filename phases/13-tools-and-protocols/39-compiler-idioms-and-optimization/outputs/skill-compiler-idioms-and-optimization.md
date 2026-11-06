---
name: compiler-idioms-and-optimization
description: Nhận dạng các mẫu compiler trong một danh sách disassembly của một chương trình bạn đã dựng, giải mã mỗi mẫu trở lại cấu trúc nguồn của nó với một phép suy ra và xác minh kết quả với nguồn.
version: 1.0.0
phase: 13
lesson: 39
tags: [reverse-engineering, x86-64, arm64, compiler-idioms, division-by-constant, switch-lowering, vectorization, inlining, tail-calls]
---

Với một danh sách `llvm-objdump -d -r` của một object bạn tự biên dịch, tệp object và nguồn C, tạo một danh sách các mẫu compiler được nhận dạng. Mỗi mục nêu tên loại, các chỉ lệnh bằng chứng, dạng nguồn đã giải mã và liệu nguồn xác nhận nó hay không. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Nguồn C và compiler, mục tiêu, mức tối ưu hóa và các cờ chính xác tạo ra object.
- Tệp object và danh sách `llvm-objdump -d -r` của nó được thu từ object đó.
- Bộ nhận dạng từ bài 39 (`code/main.py`) hoặc một bộ tương đương báo cáo các địa chỉ bằng chứng cho mọi khẳng định.
- Để so sánh, đầu ra của ít nhất một decompiler trên cùng object, được thu với phiên bản của nó.

## Procedure

1. Phân tích danh sách thành các hàm và chỉ lệnh. Gắn mỗi dòng relocation vào chỉ lệnh trước nó. Ghi kiến trúc từ dòng định dạng tệp.
2. Tìm các phép chia cho một hằng số. Trên x86-64, tìm `imul` với một immediate 32 bit hoặc một `mov $imm` cung cấp cho `imul`, rồi các phép dịch và sửa dấu hoặc sửa cộng. Trên AArch64, tìm `mov` và `movk` xây hằng số, rồi `smull` hoặc `umull` và các phép dịch. Khôi phục số chia từ hệ số nhân và tổng độ dịch bằng cận Granlund-Montgomery, và chỉ chấp nhận nó khi thuật toán cho lại cùng các hằng số.
3. Tìm các modulo dưới dạng một thương được nhận dạng được nhân lại với số chia và bị trừ, dưới dạng `msub` hoặc dưới dạng thiên lệch và mask lũy thừa hai. Khi một thương cũng cung cấp cho một lần dùng khác, giữ cả phép chia và modulo.
4. Phân loại mọi switch theo cách hạ của nó: jump table (bước nhảy gián tiếp qua một bảng địa chỉ, các mục từ relocation hoặc byte), bảng tra cứu (lần tải giá trị có chỉ số, các mục từ các byte tại địa chỉ được tái định vị cộng 4 cho một trường tương đối theo RIP), ánh xạ tuyến tính (số học affine được chọn bởi một phép so sánh biên), cây so sánh (các kiểm tra bằng nhau được chia bởi các phép so sánh có thứ tự), chuỗi so sánh (chỉ các kiểm tra bằng nhau) hoặc chuỗi select. Đọc kiểm tra biên cho số mục và so sánh các mục với các case nguồn, cho phép một hệ số hằng mà compiler đã gộp vào.
5. Tìm các vòng lặp từ các nhánh ngược có đích có thể đến lại chúng. Một thân vòng lặp sử dụng các thanh ghi SIMD được vector hóa: báo cáo lane, bộ tích lũy, phần tử mỗi vòng lặp, mask số lượt lặp, điều kiện bảo vệ số lượt tối thiểu, phép rút gọn và vòng lặp phần dư vô hướng. Một thân với N lần tải tại các offset liên tiếp từ một base được unroll theo N.
6. Tìm tail call (một `jmp` hoặc `b` mang một relocation gọi), callee inline (một lần gọi nguồn không có chỉ lệnh gọi và dạng thân của callee hiện diện trong caller), thay thế thư viện (`memset` và `memcpy` được tới từ một vòng lặp hoặc một bản sao cố định) và mở rộng inline (một cặp tải và lưu 16 byte).
7. Giải mã các select không nhánh bằng cách đánh giá mã đường thẳng trước `cmov`, `setcc`, `csel`, `cneg` hoặc `cset` với các tên tham số từ nguồn.
8. Báo cáo riêng các dạng tăng cường bảo vệ: stack protector (lần tải guard, slot, phép so sánh, `__stack_chk_fail`) và `endbr64`.
9. Xác minh mọi mẫu với nguồn: số chia xuất hiện sau `/` hoặc `%`, switch tồn tại và các case của nó khớp, vòng lặp tồn tại, callee được gọi, select tồn tại. Đánh dấu mỗi mẫu đã xác minh hay chưa và liệt kê những mẫu chưa xác minh trước.
10. So sánh với đầu ra decompiler: với mỗi mẫu nêu liệu công cụ gộp nó, để nó như số học hay in thứ khác, và trích văn bản của công cụ.

## Required report

Với object, báo cáo:

- compiler, mục tiêu, mức, cờ và phiên bản công cụ liệt kê
- theo hàm, mọi mẫu với loại, dạng nguồn đã giải mã, các địa chỉ bằng chứng và trạng thái xác minh
- với các phép chia, hệ số nhân, tổng độ dịch, số chia, sai số và liệu các hằng số của compiler khớp thuật toán hay không
- với các switch, loại hạ, số mục, vị trí bảng, các mục hoặc đích và loại bằng chứng (relocation hoặc byte)
- với các vòng lặp, lane, bộ tích lũy, phần tử mỗi vòng lặp, vòng lặp phần dư hoặc hệ số unroll
- ma trận loại theo mức tối ưu hóa và liệu hai mức tạo cùng mã hay không
- phép so sánh decompiler với đầu ra được trích và phiên bản công cụ
- mọi mẫu mà nguồn không xác nhận, với lý do

## Hard rejects

- Nêu tên một số chia chỉ từ hệ số nhân không có độ dịch. Cùng hệ số nhân nghĩa là các số chia khác nhau ở các độ dịch khác nhau.
- Báo cáo một bảng tra cứu là một jump table hoặc một jump table là mã chết.
- Đọc các mục bảng từ các byte bằng không trong một object có thể tái định vị khi các mục là relocation.
- Đếm một nhánh ngược tới một khối mặc định dùng chung là một vòng lặp.
- Gọi một tail call thư viện là một lần trả về từ hàm.
- Coi phép chia phần cứng `-O0` là bằng chứng rằng không có phép nhân ma thuật cho compiler đó.
- Khẳng định một decompiler gộp một mẫu mà không trích đầu ra của nó trên object này.
- Báo cáo một mẫu mà nguồn không chứa mà không đánh dấu nó chưa được xác minh.

## Produce

Trả về những phần này:

1. Build: compiler, mục tiêu, mức, cờ, công cụ liệt kê.
2. Mẫu: theo hàm, loại, dạng nguồn, bằng chứng, đã xác minh.
3. Phép chia: bảng ma thuật với số chia, hệ số nhân, độ dịch, sai số, dạng cộng và khớp thuật toán.
4. Switch: cách hạ theo hàm theo mức với các mục và loại bằng chứng.
5. Vòng lặp: các sự kiện vector và unroll theo vòng lặp.
6. Decompiler: theo mẫu, được gộp hay không, với văn bản được trích và phiên bản.
7. Chưa xác minh: mọi mẫu mà nguồn không xác nhận.

Kết thúc bằng danh sách chưa xác minh. Nếu nó rỗng, nêu số mẫu được nhận dạng và số phép chia có các hằng số khớp thuật toán.
