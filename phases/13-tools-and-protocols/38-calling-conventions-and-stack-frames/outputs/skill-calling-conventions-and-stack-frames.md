---
name: calling-conventions-and-stack-frames
description: Khôi phục quy ước gọi và stack frame của một hàm từ disassembly của nó, nêu tên quy tắc ABI đằng sau mọi suy luận và kiểm tra mỗi suy luận với chữ ký nguồn và dữ liệu unwind của chính compiler.
version: 1.0.0
phase: 13
lesson: 38
tags: [reverse-engineering, calling-conventions, abi, stack-frames, system-v, microsoft-x64, aapcs64, prologue, unwind]
---

Với một tệp object bạn tự dựng, danh sách `llvm-objdump -d -r` của nó và các chữ ký C của các hàm của nó, tạo các vị trí tham số, bố cục khung, thanh ghi trả về và một kiểm tra mọi suy luận với quy tắc ABI mà nó dựa vào. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp object, lệnh compiler chính xác và phiên bản compiler.
- Danh sách từ `llvm-objdump -d -r` của object đó, được lưu bên cạnh nó.
- Chữ ký C của mọi hàm đang nghiên cứu, với kích thước byte của mọi kiểu struct.
- ABI mà object được dựng cho. Đọc nó từ header: `e_machine` ELF 62 là System V AMD64 psABI, Machine COFF 0x8664 là Microsoft x64, `e_machine` ELF 183 là AAPCS64, `cputype` Mach-O 0x0100000c là Apple arm64.
- Analyzer từ bài 38 (`code/main.py`) hoặc một analyzer tương đương tách các lần đọc dữ liệu khỏi các lần đọc địa chỉ.
- Tùy chọn: object được dựng không có `-fno-asynchronous-unwind-tables`, cho `.eh_frame` hoặc `.pdata` và `.xdata`.

## Procedure

1. Xác định ABI từ object header, và viết ra sách quy tắc nào áp dụng trước khi đọc bất kỳ chỉ lệnh nào.
2. Đọc prologue: trên x86-64 là các push, `mov %rsp, %rbp` tùy chọn và `sub $N, %rsp`; trên AArch64 là `sub sp`, `stp` và `str` của x19 đến x30 với sp làm base, và `mov x29, sp` hoặc `add x29, sp, #k`. Ghi mỗi thanh ghi được lưu với offset của nó từ con trỏ stack lúc vào, và kích thước khung là con trỏ stack sâu nhất mà prologue đạt tới.
3. Duyệt thân một lần và ghi mọi thanh ghi lớp đối số được đọc trước khi ghi. Tính các thanh ghi base và index của các toán hạng bộ nhớ và của `lea` là các lần đọc. Coi đích của `mov`, `lea`, `cvtsi2sd` và mẫu bằng không `xor r, r` chỉ là một lần ghi. Sau một lần gọi, đánh dấu tập volatile là đã ghi.
4. Ghi mọi lần tải từ phía trên con trỏ stack lúc vào là một slot đối số stack: 8(%rsp) trở lên dưới System V, 40(%rsp) trở lên dưới Microsoft x64 phía trên shadow store 32 byte, 0(sp) trở lên dưới AAPCS64. Chuyển đổi các offset dựa trên `rbp` và `x29` qua offset con trỏ khung bạn đã ghi.
5. Tìm thanh ghi trả về: thanh ghi kết quả có truy cập cuối trước lối thoát là một lần ghi. Một lần đọc như một toán hạng dữ liệu giết ứng viên; một lần đọc như một base địa chỉ thì không. Một con trỏ kết quả ẩn là thanh ghi đối số đầu tiên vừa được lưu qua vừa được sao chép vào `rax`, hoặc `x8` trên AArch64.
6. Áp dụng các quy tắc ABI cho chữ ký C: System V phân lớp mỗi eightbyte INTEGER, SSE hoặc MEMORY và lấy các thanh ghi từ hai danh sách độc lập; Microsoft x64 gán slot k cho RCX/RDX/R8/R9 hoặc XMM0 đến XMM3 và truyền các struct không phải 1, 2, 4 hoặc 8 byte theo tham chiếu; AAPCS64 gán x[NGRN] và v[NSRN] và sử dụng x8 cho các kết quả lớn hơn 16 byte. So sánh các vị trí kỳ vọng với các vị trí quan sát được và ghi sự đồng nhất theo quy tắc.
7. Kiểm tra các quy tắc khung: các thanh ghi callee-saved được ghi phải xuất hiện trong tập được lưu; `(rsp + 8) % 16 == 0` hoặc `sp % 16 == 0` tại mọi lần gọi; ít nhất 32 byte dưới địa chỉ trả về tại mọi lần gọi Microsoft x64; không truy cập dưới con trỏ stack dưới Microsoft x64 hoặc AAPCS64, tối đa 128 byte dưới System V; epilogue khôi phục những gì prologue lưu và con trỏ stack trở lại giá trị lúc vào.
8. Khi dữ liệu unwind tồn tại, giải mã nó và so sánh: các mã `UWOP_PUSH_NONVOL` và `UWOP_ALLOC_*` với các push và cấp phát, các quy tắc `DW_CFA_offset` với các offset thanh ghi được lưu, offset CFA sâu nhất với con trỏ stack sâu nhất.
9. Khi một công cụ khác có sẵn, thu prototype hoặc danh sách đối số của nó cho cùng hàm với lệnh chính xác, và ghi nơi nó đồng nhất và nơi nó bất đồng với nguồn và với các byte.

## Required report

Với mọi hàm, báo cáo:

- tên object, định dạng, máy, ABI, compiler, lệnh build, đường dẫn danh sách
- byte và văn bản prologue, các thanh ghi được lưu với offset lúc vào, số byte khung, offset con trỏ khung hoặc không có
- các thanh ghi đối số được đọc trước khi ghi, các offset đối số stack, các thanh ghi đối số bị spill với offset, các lần lưu home dưới Microsoft x64
- thanh ghi trả về hoặc con trỏ ẩn, với chỉ lệnh đã đặt nó
- các độ sâu gọi, số byte shadow, số byte được sử dụng dưới con trỏ stack
- mọi kiểm tra dưới dạng quy tắc, kỳ vọng, quan sát, đồng nhất
- đối chiếu unwind theo hàm khi có sẵn
- các đầu ra công cụ khác với lệnh, và mỗi bất đồng như một phát hiện

## Hard rejects

- Đọc một object x86-64 như System V vì nó là x86-64. COFF nghĩa là Microsoft x64.
- Tính đích của `cvtsi2sd` hoặc `xor r, r` là một lần đọc, bịa một đối số dấu phẩy động hoặc số nguyên.
- Bỏ một thanh ghi chỉ được đọc như một base hoặc index `lea`, làm mất một đối số.
- Coi một thanh ghi được ghi rồi được tiêu thụ là một thanh ghi trả về.
- Coi `push rbp` là bằng chứng của một con trỏ khung. Chỉ `mov %rsp, %rbp` sau nó tạo một con trỏ như vậy.
- Báo cáo một đối số stack từ một `lea`; `lea` tính một địa chỉ và không tải gì.
- Đo việc sử dụng red zone từ con trỏ stack lúc vào thay vì từ con trỏ hiện tại.
- So sánh offset CFA sâu nhất với khung prologue khi thân đẩy các đối số đi ra.
- Chấp nhận prototype của một công cụ mà không có chữ ký nguồn hoặc các byte để kiểm tra đối chiếu.
- Phân tích một chương trình bạn không dựng hoặc không có quyền nghiên cứu.

## Produce

Trả về những phần này:

1. ABI: định dạng, máy, sách quy tắc, với các byte header đã quyết định nó.
2. Prologue và Khung: byte, thanh ghi được lưu, kích thước khung, con trỏ khung, việc sử dụng red zone hoặc shadow.
3. Tham số: các thanh ghi và slot stack được quan sát, kỳ vọng từ chữ ký, sự đồng nhất theo quy tắc.
4. Kết quả: thanh ghi trả về hoặc con trỏ ẩn và chỉ lệnh đã đặt nó.
5. Điểm Gọi: độ sâu, căn chỉnh, byte shadow, thanh ghi và lần lưu đi ra.
6. Đối chiếu Unwind: mã unwind hoặc các quy tắc CFI đối chiếu phép phân tích prologue.
7. Công cụ Khác: lệnh, đầu ra và mỗi bất đồng như một phát hiện.

Kết thúc bằng bất đồng đầu tiên. Nếu không có, nêu số kiểm tra đồng nhất và số hàm được bao phủ.
