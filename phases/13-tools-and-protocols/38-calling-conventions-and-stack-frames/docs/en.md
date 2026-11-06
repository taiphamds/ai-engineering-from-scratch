# Calling Conventions and Stack Frames: System V, Windows x64, and AArch64

> Một disassembly cho thấy các thanh ghi nào một hàm đọc. Chỉ ABI nói các thanh ghi đó có nghĩa gì, và ABI được chọn bởi object header, nên bài học này đọc header trước rồi kiểm tra mỗi thanh ghi với quy tắc đặt nó ở đó.

**Type:** Build
**Languages:** Python, C, x86-64 and AArch64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow)
**Time:** ~140 minutes

## Learning Objectives

- Chọn quy ước gọi từ object header: ELF x86-64 là System V psABI, COFF AMD64 là Microsoft x64, ELF AArch64 là AAPCS64, Mach-O arm64 là biến thể của Apple.
- Giải mã prologue của một hàm từng byte cho mỗi ABI và đặt mỗi thanh ghi được lưu, địa chỉ trả về và con trỏ khung tại offset của nó từ con trỏ stack lúc vào.
- Suy ra các thanh ghi tham số của một hàm từ các thanh ghi nó đọc trước khi ghi chúng, và các slot đối số stack từ các lần tải phía trên con trỏ stack lúc vào.
- Phân biệt các chuỗi thanh ghi độc lập của System V với các slot theo vị trí của Microsoft x64, và cả hai với các bộ đếm NGRN và NSRN của AAPCS64.
- Kiểm tra mọi suy luận với chữ ký nguồn, quy tắc trong đặc tả và dữ liệu unwind của chính compiler trong `.pdata`, `.xdata` và `.eh_frame`.
- So sánh cách Ghidra, IDA, Binary Ninja, radare2, rizin và angr đặt tên và khôi phục cùng các sự kiện, và ghi lại nơi đầu ra của chúng bất đồng với nguồn.

## The Problem

Bạn biên dịch `convention.c` cho Linux x86-64 ở `-O2` và yêu cầu radare2 6.2.4 cung cấp các đối số của `eight_args`. Nó trả lời với bảy: `rdi`, `rsi`, `rdx`, `r8`, `r9`, `rsp+0x8` và `rsp+0x10`. Nguồn C có tám tham số. Các byte đọc `%rcx` chính xác một lần, trong `leaq (%rdx,%rcx), %rax`, và việc khôi phục biến của công cụ không đếm một thanh ghi chỉ xuất hiện bên trong một địa chỉ.

Rồi bạn mở bản build Windows của cùng tệp trong rizin 0.9.1. Nó báo cáo quy ước là `amd64` và tìm `r8`, `rcx`, `rdx` và ba slot stack. Object là COFF, nên quy ước là Microsoft x64, đối số thanh ghi thứ tư là `r9`, và có bốn slot stack. Hai công cụ bỏ lỡ các thanh ghi khác nhau trong cùng nguồn.

Một danh sách là một chuỗi chỉ lệnh. Một quy ước gọi là một hợp đồng nằm ngoài danh sách: các thanh ghi nào mang đối số, những thanh ghi nào callee phải bảo toàn, nơi địa chỉ trả về và các đối số stack nằm, và điều caller phải để phía trên con trỏ stack. Bốn tài liệu định nghĩa các hợp đồng quan trọng ở đây. System V AMD64 psABI (Phiên bản 1.0, bản dựng đề ngày 12 tháng 3 năm 2025) mục 3.2.1 đến 3.2.3. Các trang quy ước gọi Microsoft x64, sử dụng stack và prolog cùng epilog (ngày trang từ 2018-12-17 đến 2025-03-19). Arm AAPCS64 bản phát hành 2025Q4 (23 tháng 1 năm 2026) mục 6.1 đến 6.9. Các ghi chú nền tảng arm64 của Apple. Bài học này đọc các quy tắc đó, áp dụng chúng cho một tệp C được biên dịch ba cách và xây dựng analyzer biến một danh sách thành một danh sách đã kiểm tra của các vị trí tham số, thanh ghi được lưu và offset khung.

```figure
re-38-three-frames
```

## One Header Picks the Rulebook

`convention.c` có mười hai hàm: `leaf_add`, `eight_args`, `mixed`, `by_value`, `big_ret`, `sum_varargs`, `keeps` và năm caller của các hàm `extern` có cùng các dạng. Các struct sử dụng `long long`, vì `long` là 4 byte trên mục tiêu MSVC và 8 byte trên các mục tiêu khác, và một struct thay đổi kích thước thay đổi quy ước. Apple clang 17.0.0 biên dịch nó bảy lần từ máy này: `-target x86_64-unknown-linux-gnu`, `x86_64-pc-windows-msvc` và `aarch64-unknown-linux-gnu` ở `-O0` và `-O2`, và `arm64-apple-macos` ở `-O2`. Không có header Linux hoặc Windows được cài, nên tệp khai báo những gì nó cần và chỉ bao gồm `stdarg.h` cùng `stddef.h` riêng của clang.

`describe_object()` trong `code/main.py` đọc số magic 4 byte và một trường máy và nêu tên hợp đồng:

| Header | Trường | Giá trị | Sách quy tắc |
|---|---|---|---|
| `7f 45 4c 46` ELF | `e_machine` tại offset 0x12 | 62 | System V AMD64 psABI |
| `64 86` COFF | `Machine` tại offset 0 | 0x8664 | Microsoft x64 |
| `7f 45 4c 46` ELF | `e_machine` | 183 | AAPCS64 |
| `cf fa ed fe` Mach-O 64 | `cputype` tại offset 4 | 0x0100000c | AAPCS64 với các khác biệt Apple |

Ba hợp đồng bất đồng trên gần như mọi hàng của bảng theo sau. Mọi giá trị được trích từ tài liệu nêu tên trong hàng header, và mỗi giá trị được một bài kiểm tra đối chiếu với các fixture.

| Quy tắc | System V psABI | Microsoft x64 | AAPCS64 |
|---|---|---|---|
| Đối số số nguyên | `%rdi %rsi %rdx %rcx %r8 %r9`, thanh ghi trống tiếp theo | `RCX RDX R8 R9`, theo vị trí | `x0` đến `x7`, theo NGRN |
| Đối số dấu phẩy động | `%xmm0` đến `%xmm7`, thanh ghi trống tiếp theo | `XMM0` đến `XMM3`, theo vị trí | `v0` đến `v7`, theo NSRN |
| Kết quả số nguyên | `%rax`, rồi `%rdx` | `RAX` | `x0`, rồi `x1` |
| Kết quả dấu phẩy động | `%xmm0`, rồi `%xmm1` | `XMM0` | `v0` |
| Kết quả quá lớn cho các thanh ghi | địa chỉ được truyền trong `%rdi` "như thể nó là đối số đầu tiên", được trả về trong `%rax` | con trỏ trong `RCX`, các đối số dịch sang phải, được trả về trong `RAX` | địa chỉ trong `x8`, `x0` đến `x7` nguyên vẹn |
| Callee-saved | `%rbp %rbx %r12` đến `%r15` | `RBX RBP RDI RSI RSP R12` đến `R15`, `XMM6` đến `XMM15` | `r19` đến `r29`, `SP`, 64 bit thấp của `v8` đến `v15` |
| Đối số stack đầu tiên lúc vào | `8(%rsp)` | `40(%rsp)`, phía trên một shadow store 32 byte | `0(sp)` |
| Bên dưới con trỏ stack | red zone 128 byte | "được coi là volatile" | không red zone (Apple: 128 byte) |
| Căn chỉnh tại lần gọi | `(%rsp + 8)` là bội của 16 lúc vào | căn chỉnh 16 byte ngoài prolog và epilog | `SP mod 16 = 0` |
| Dấu variadic | `%al` chứa một cận trên của các thanh ghi vector được sử dụng | float được nhân đôi trong thanh ghi số nguyên | không có trong các thanh ghi; Apple sử dụng các slot stack 8 byte |

## System V: Two Independent Register Sequences and a Red Zone

psABI 3.2.3 phân loại mỗi eightbyte của mỗi đối số là INTEGER, SSE hoặc MEMORY rồi gán các thanh ghi từ hai danh sách không tương tác. "INTEGER" lấy "thanh ghi khả dụng tiếp theo của chuỗi %rdi, %rsi, %rdx, %rcx, %r8 và %r9". SSE lấy `%xmm0` đến `%xmm7`. "Nếu không có thanh ghi khả dụng cho bất kỳ eightbyte nào của một đối số, toàn bộ đối số được truyền trên stack", và các đối số bộ nhớ "được đẩy trên stack theo thứ tự đảo ngược (phải sang trái)".

`eight_args(a, b, c, d, e, f, g, h)` ở `-O2` là 27 byte:

```text
      10: 48 01 fe                     	addq	%rdi, %rsi
      13: 48 8d 04 0a                  	leaq	(%rdx,%rcx), %rax
      17: 48 01 f0                     	addq	%rsi, %rax
      1a: 4c 01 c0                     	addq	%r8, %rax
      1d: 4c 01 c8                     	addq	%r9, %rax
      20: 48 03 44 24 08               	addq	0x8(%rsp), %rax
      25: 48 03 44 24 10               	addq	0x10(%rsp), %rax
      2a: c3                           	retq
```

Sáu thanh ghi, rồi hai lần tải tại `8(%rsp)` và `16(%rsp)`. Hình 3.3 của psABI đặt "eightbyte đối số bộ nhớ 0" tại `16(%rbp)` khi `%rbp` là địa chỉ cơ sở khung, tức `8(%rsp)` lúc vào trước bất kỳ push nào. `g` ở 8, `h` ở 16.

`mixed(int i, double d, long long l, float f)` cho thấy hai danh sách. Các int lấy `%edi` và `%rsi`, các thanh ghi INTEGER thứ nhất và thứ hai. Double và float lấy `%xmm0` và `%xmm1`, các thanh ghi SSE thứ nhất và thứ hai. Chỉ lệnh đầu là `cvtsi2sd %edi, %xmm2`, và `%xmm2` là một thanh ghi tạm mà hàm ghi trước khi đọc. Một analyzer coi đích của `cvtsi2sd` là một lần đọc bịa một đối số dấu phẩy động thứ ba. radare2 làm chính xác điều đó và báo cáo `mixed` là `(double arg1, double arg2, double arg3)` trong `xmm0`, `xmm1`, `xmm2`.

`by_value(struct pair p)` truyền một struct 16 byte như hai eightbyte INTEGER trong `%rdi` và `%rsi`, và trả về nó cùng cách: `leaq 0x1(%rdi), %rax; leaq -0x1(%rsi), %rdx; retq`. `big_ret(long long seed)` trả về 32 byte, là lớp MEMORY, và psABI nói "caller cung cấp không gian cho giá trị trả về và truyền địa chỉ của vùng lưu trữ này trong %rdi như thể nó là đối số đầu tiên". `seed` chuyển sang `%rsi`, và hàm bắt đầu bằng `movq %rdi, %rax` vì "Khi trả về %rax sẽ chứa địa chỉ đã được caller truyền vào trong %rdi".

Red zone là dấu hiệu System V khác. psABI 3.2.2: "Vùng 128 byte vượt vị trí được %rsp trỏ tới được coi là dành riêng và không được sửa đổi bởi các handler tín hiệu hoặc ngắt." Ở `-O0`, `eight_args` là `pushq %rbp; movq %rsp, %rbp` rồi sáu lần lưu vào `-0x8(%rbp)` đến `-0x30(%rbp)` không có `subq`. Các lần lưu nằm 48 byte dưới con trỏ stack. Bản build `-O2` của `sum_varargs` cấp phát 88 byte bằng `subq $0x58, %rsp` rồi ghi vùng lưu thanh ghi tại `-0x58(%rsp)` xuống `-0x80(%rsp)`: 128 byte dưới con trỏ stack, toàn bộ red zone. Dựng cùng tệp bằng `-mno-red-zone` và `leaf_add` có thêm một `pushq %rax` và một `addq $0x8, %rsp` để chứa 8 byte biến cục bộ của nó phía trên con trỏ stack.

Các lần gọi variadic thêm một thanh ghi. "%al được sử dụng như đối số ẩn để chỉ định số thanh ghi vector được sử dụng", một cận trên từ 0 đến 8. `call_varargs` đặt nó bằng `xorl %eax, %eax` ở `-O2` và `movb $0x0, %al` ở `-O0`. `sum_varargs` đọc nó trước: `testb %al, %al; je` bỏ qua tám lần lưu `movaps %xmmN` khi không thanh ghi vector nào được sử dụng.

## Microsoft x64: Positions, a Shadow Store, and No Red Zone

Các quy tắc Microsoft theo vị trí. "Các đối số số nguyên được truyền trong các thanh ghi RCX, RDX, R8 và R9. Các đối số dấu phẩy động được truyền trong XMM0L, XMM1L, XMM2L và XMM3L." và "Mọi đối số dấu phẩy động và độ chính xác kép trong bốn tham số đầu được truyền trong XMM0 - XMM3, tùy vị trí." Cùng `mixed` đến dưới dạng `%ecx`, `%xmm1`, `%r8`, `%xmm3`: slot 0 là một int, nên `RCX`; slot 1 là một double, nên `XMM1`; slot 3 là một float, nên `XMM3`. `XMM0` và `XMM2` giữ rỗng.

Caller cũng phải để chỗ. "Caller phải luôn cấp phát đủ không gian để lưu bốn tham số thanh ghi, ngay cả khi callee không nhận nhiều tham số đến vậy." Các trang gọi nó là shadow store hoặc các địa chỉ home, và bốn slot "thực tế thuộc sở hữu của hàm được gọi". Lúc vào, `0(%rsp)` là địa chỉ trả về, `8(%rsp)` đến `39(%rsp)` là bốn home, và đối số stack đầu tiên ở `40(%rsp)`. `eight_args` ở `-O2` đọc `0x28(%rsp)`, `0x30(%rsp)`, `0x38(%rsp)`, `0x40(%rsp)`: 40, 48, 56, 64.

Phía caller cho thấy phép tính. `call8` ở `-O2` là `subq $0x48, %rsp` rồi các lần lưu 5, 6, 7, 8 tại `0x20(%rsp)` đến `0x38(%rsp)` trước `movl $1, %ecx` và các lệnh tương tự. 72 byte là 32 cho shadow store, 32 cho bốn đối số stack và 8 để địa chỉ trả về nằm trên một ranh giới 16 byte. `call_varargs` chỉ có các đối số thanh ghi và vẫn cấp phát `subq $0x28, %rsp`: 32 cho shadow store và 8 cho căn chỉnh. `keeps` đẩy ba thanh ghi nonvolatile (24 byte) rồi `subq $0x20, %rsp`, để `ext` tìm shadow store 32 byte của nó dưới địa chỉ trả về.

Các struct theo quy tắc riêng. "Mọi đối số không vừa trong 8 byte, hoặc không phải 1, 2, 4 hoặc 8 byte, phải được truyền theo tham chiếu." và "Các đối số 16 byte được truyền theo tham chiếu." `by_value` do đó nhận một con trỏ đến một bản sao trong `%rdx`, sau một con trỏ kết quả ẩn trong `%rcx`: "caller phải cấp phát bộ nhớ cho giá trị trả về và truyền một con trỏ tới nó như đối số đầu tiên. Các đối số còn lại sau đó được dịch một đối số sang phải." `call_pair` xây dựng bản sao tại `0x20(%rsp)` bằng `movaps`, truyền `leaq 0x20(%rsp), %rdx`, truyền bộ đệm kết quả bằng `leaq 0x38(%rsp), %rcx` và đọc lại `.b` từ `0x40(%rsp)`.

Không có red zone. "Mọi bộ nhớ vượt địa chỉ hiện tại của RSP được coi là volatile: Hệ điều hành, hoặc một debugger, có thể ghi đè bộ nhớ này trong một phiên gỡ lỗi người dùng, hoặc một handler ngắt." `-O0` `leaf_add` cần 8 byte biến cục bộ và có chúng bằng `pushq %rax` lúc vào và `popq %rcx` trước `retq`, hai chỉ lệnh một byte thay vì một `subq` và một `addq`. Trang sử dụng stack định nghĩa leaf có thể làm điều này: "Một hàm leaf là một hàm không yêu cầu một mục bảng hàm. Nó không thể thay đổi bất kỳ thanh ghi nonvolatile nào, bao gồm RSP".

Các callee variadic đưa các thanh ghi về home. "Với các hàm vararg hoặc không có prototype, mọi giá trị dấu phẩy động phải được nhân đôi trong thanh ghi đa dụng tương ứng." `sum_varargs` ở `-O2` lưu `%rdx`, `%r8`, `%r9` vào `0x18(%rsp)`, `0x20(%rsp)`, `0x28(%rsp)` sau một `pushq %rax`, tức các offset lúc vào 16, 24, 32: các home của tham số thanh ghi thứ hai, thứ ba và thứ tư. `va_list` của nó là `leaq 0x18(%rsp), %rax`, home của `%rdx`, đối số không tên đầu tiên.

## AAPCS64, and What Apple Changes

AAPCS64 6.8.2 duyệt một danh sách quy tắc với hai bộ đếm. C.9: một đối số số nguyên "được sao chép vào các bit ít quan trọng nhất trong x[NGRN]" và NGRN tăng. C.1 làm tương tự cho các đối số dấu phẩy động với NSRN. C.12: một composite tối đa `8 - NGRN` double-word được "sao chép vào các thanh ghi đa dụng liên tiếp". C.13 đặt "NGRN được đặt thành 8" khi một đối số đi vào stack, nên không có gì quay lại các thanh ghi sau đó. `eight_args` sử dụng `x0` đến `x7` và không bao giờ chạm stack. `mixed` là `w0`, `d0`, `x1`, `s1`. `by_value` là `x0` và `x1` vào và ra.

6.9 nói một kết quả sẽ được truyền trong các thanh ghi "được trả về trong cùng các thanh ghi", nếu không "Địa chỉ của khối bộ nhớ phải được truyền như một đối số bổ sung cho hàm trong x8". `big_ret` ghi `str x0, [x8]`, `stur q0, [x8, #0x8]`, `str x9, [x8, #0x18]` và không bao giờ ghi `x0`. `call_big` đặt `mov x8, sp`, và `seed` giữ trong `x0`, vì 6.9 thêm "không có yêu cầu cho callee bảo toàn giá trị được lưu trong x8" và `x8` không phải một trong các thanh ghi đối số.

6.1.1: "Một lần gọi chương trình con phải bảo toàn nội dung các thanh ghi r19-r29 và SP." 6.4.5.2: tại một giao diện công khai "SP mod 16 = 0". Stack là full-descending và "Không luồng nào được phép truy cập (để đọc hoặc để ghi) vùng không hoạt động" bên dưới nó, nên Linux `-O0` `leaf_add` phát ra `sub sp, sp, #0x10` cho 8 byte biến cục bộ nơi System V sử dụng red zone.

6.4.6 định nghĩa frame record: "một frame record gồm hai giá trị 64 bit trên stack ... Double-word có địa chỉ thấp nhất phải trỏ đến frame record trước và double-word có địa chỉ cao nhất phải chứa giá trị được truyền trong LR lúc vào hàm hiện tại." và "Vị trí của frame record bên trong một stack frame không được chỉ định." clang cho thấy cả hai vị trí trong một tệp này. `keeps` ở `-O2` trên Linux đặt record ở đáy bằng `stp x29, x30, [sp, #-0x30]!; mov x29, sp`. Cùng hàm ở `-O0` đặt nó ở đỉnh bằng `sub sp, sp, #0x20; stp x29, x30, [sp, #0x10]; add x29, sp, #0x10`.

Các ghi chú arm64 của Apple giữ các thanh ghi và căn chỉnh và thay đổi khung, red zone và các lần gọi variadic. "Thanh ghi con trỏ khung (x29) phải luôn trỏ đến một frame record hợp lệ. Một số hàm, chẳng hạn các hàm leaf hoặc tail call, có thể chọn không tạo một mục trong danh sách này." Bản build Apple của `keeps` lưu `x22, x21, x20, x19` trước và đặt record trên đỉnh: `stp x29, x30, [sp, #0x20]; add x29, sp, #0x20`. "Các nền tảng dành riêng thanh ghi x18. Không sử dụng thanh ghi này." "Red zone ARM64 gồm 128 byte ngay dưới con trỏ stack", và clang vẫn phát ra `sub sp, sp, #0x10` cho leaf `-O0`, nên compiler không sử dụng nó mặc định. Các đối số variadic được gán "cho số slot stack 8 byte thích hợp" và "kiểu va_list là một bí danh cho char*". `call_varargs` trên Apple lưu 10, 20, 30 vào `[sp]`, `[sp, #8]`, `[sp, #0x10]` và chỉ truyền `w0`; bản build Linux truyền `w1`, `w2`, `w3` và tail-call bằng `b extva`. `sum_varargs` Apple đọc `add x8, sp, #0x10`, con trỏ stack của caller, làm `va_list` của nó; `sum_varargs` Linux lưu `x1` đến `x7` và `q0` đến `q7` vào một khung 224 byte và khởi tạo các trường cấu trúc `__gr_offs` thành -56 và `__vr_offs` thành -128 bằng một `mov x8, #-0x38; movk x8, #0xff80, lsl #32`.

Các symbol cũng khác. Mach-O thêm tiền tố `_` vào mọi symbol C, nên danh sách hiển thị `_keeps` và hàm đầu xuất hiện dưới nhãn riêng `ltmp0`. Analyzer đổi tên các nhãn qua bảng symbol.

## Decode One Prologue by Hand, Three Times

`keeps(int n)` gọi `ext(i)` trong một vòng lặp và giữ `n`, `i` và `acc` qua lần gọi, nên mọi ABI phải lưu các thanh ghi. Đọc các byte đầu của bản build `-O2` cho mỗi mục tiêu.

System V, 4 byte:

1. `55` là `push r64` với thanh ghi trong ba bit thấp: `50 + 5`, `%rbp`. Độ sâu 8, `%rbp` được lưu tại offset lúc vào -8.
2. `41 56`: `41` là REX với `B` được đặt, `56` là `50 + 6`. REX.B mở rộng 6 thành 14: `pushq %r14` tại -16.
3. `53` là `50 + 3`: `pushq %rbx` tại -24.

Ba push là 24 byte. Địa chỉ trả về thêm 8, và 32 là bội của 16, nên `callq ext` bên trong vòng lặp được căn chỉnh không cần một `subq`. Không có `movq %rsp, %rbp`, nên bản build này không có con trỏ khung. Thân sử dụng `%rbp` như thanh ghi callee-saved chứa `acc` (`xorl %ebp, %ebp`, `addl %eax, %ebp`). Epilogue là hình phản chiếu: `5b 41 5e 5d c3`.

Microsoft x64, 7 byte:

1. `56` là `pushq %rsi` tại -8. `57` là `pushq %rdi` tại -16. `53` là `pushq %rbx` tại -24. Cả ba là nonvolatile ở đây, và `RDI` cùng `RSI` là các thanh ghi đối số dưới System V.
2. `48 83 ec 20`: REX.W, opcode `83 /5` với một immediate 8 bit, ModRM `ec` là `11 101 100`: `subq $0x20, %rsp`. Độ sâu 56.

56 cộng địa chỉ trả về là 64, được căn chỉnh. 32 byte là shadow store mà `ext` được hưởng. Trang epilog chỉ cho phép "một add RSP,constant hoặc lea RSP,constant[FPReg], theo sau bởi một chuỗi không hoặc nhiều lần pop thanh ghi 8 byte và một return hoặc một jmp", và các byte là `48 83 c4 20 5b 5f 5e c3`.

AArch64, 16 byte trong bốn word, little-endian:

1. `a9bd7bfd` là `stp` với pre-index. Các bit 31:30 `10` chọn các thanh ghi 64 bit, các bit 25:23 `011` chọn pre-index, bit 22 là 0 cho store. imm7 tại các bit 21:15 là `1111010`, tức -6, được nhân tỷ lệ 8: -48. Rt2 tại 14:10 là 30, Rn tại 9:5 là 31 (`sp`), Rt tại 4:0 là 29. `stp x29, x30, [sp, #-0x30]!`: con trỏ stack giảm 48, `x29` đi đến -48 và `x30` đến -40.
2. `f9000bf5` là `str` với một offset 12 bit không dấu được nhân tỷ lệ 8: imm12 tại 21:10 là 2, Rn là `sp`, Rt là 21. `str x21, [sp, #0x10]`, offset lúc vào -32.
3. `910003fd` là `add` immediate: imm12 là 0, Rn là `sp`, Rd là 29. `mov x29, sp`: con trỏ khung trỏ đến record tại -48.
4. `a9024ff4` là `stp` với một offset có dấu: imm7 là 4, được nhân tỷ lệ thành 32. Rt2 là 19, Rt là 20. `stp x20, x19, [sp, #0x20]`: `x20` tại -16, `x19` tại -8.

Khung là 48 byte: `x29` tại 0, `x30` tại 8, `x21` tại 16, 8 byte padding tại 24, `x20` tại 32, `x19` tại 40. Word thấp nhất của record trỏ đến record trước và word tiếp theo chứa LR, như 6.4.6 yêu cầu. `cmp w0, #0x1` nằm giữa lần lưu đầu và thứ hai; scheduler chuyển nó vào prologue, và analyzer chấp nhận một phép so sánh hoặc một chỉ lệnh số học giữa các thao tác stack.

## The Compiler Wrote the Same Facts Twice

Một phép phân tích prologue là một phép suy ra. Compiler phát ra một phép thứ hai cho unwinder, và hai phép phải đồng nhất.

Trên Windows, phép suy ra thứ hai là `.pdata` và `.xdata`. Dựng object `-O2` không có `-fno-asynchronous-unwind-tables` và `llvm-objdump -h` hiển thị `.xdata` 0x34 byte và `.pdata` 0x48 byte. 0x48 là 72, sáu mục `RUNTIME_FUNCTION` 12 byte với ba relocation `IMAGE_REL_AMD64_ADDR32NB` mỗi mục. Sáu mục là `sum_varargs`, `keeps`, `call8`, `call_varargs`, `call_pair` và `call_big`. Sáu hàm kia là leaf, và trang xử lý ngoại lệ nói "Nếu tìm kiếm không tìm thấy một mục bảng hàm, mã được giả định là một phần của một hàm leaf, và RSP trực tiếp trỏ đến con trỏ trả về."

Các byte `.xdata` cho `keeps` là `01 07 04 00 07 32 03 30 02 70 01 60`. `UNWIND_INFO` bắt đầu với Version trong 3 bit và Flags trong 5 bit: phiên bản 1, không cờ. SizeOfProlog là 7, CountOfCodes là 4, FrameRegister và FrameOffset là 0. Mỗi `UNWIND_CODE` là một offset trong prolog và một byte opcode cùng info. `07 32`: tại offset 7, op 2 là `UWOP_ALLOC_SMALL`, info 3 nghĩa là `3 * 8 + 8 = 32` byte. `03 30`: op 0 là `UWOP_PUSH_NONVOL`, thanh ghi 3 là `rbx`. `02 70`: `rdi`. `01 60`: `rsi`. Các mã được lưu theo thứ tự thực thi đảo ngược, và chúng nêu tên cùng ba push và cùng cấp phát 32 byte như các byte `56 57 53 48 83 ec 20`. Mục `sum_varargs` là `01 01 01 00 01 02 00 00`: một prolog 1 byte với một mã, `UWOP_ALLOC_SMALL` 8 byte. Đó là cách unwinder thấy `pushq %rax`: một cấp phát, vì `%rax` là volatile và không có gì được lưu.

Trên Linux, phép suy ra thứ hai là `.eh_frame`, được psABI 4.2.4 định nghĩa và DWARF 5 mục 6.4 mã hóa. `llvm-dwarfdump --eh-frame` trên object có thể tái định vị in một FDE mỗi hàm và phân giải các relocation `R_X86_64_PC32`, nên các phạm vi dùng được. Với `keeps`:

```text
  DW_CFA_def_cfa_offset: +16
  DW_CFA_def_cfa_offset: +24
  DW_CFA_def_cfa_offset: +32
  DW_CFA_offset: RBX -32
  DW_CFA_offset: R14 -24
  DW_CFA_offset: RBP -16
```

CFA là con trỏ stack trước lần gọi, cao hơn con trỏ stack lúc vào 8, nên `RBP -16` là offset lúc vào -8, `R14 -24` là -16, `RBX -32` là -24, và offset CFA sâu nhất 32 là khung 24 byte cộng địa chỉ trả về. FDE AArch64 cho `keeps` nói `DW_CFA_def_cfa: W29 +48` với `W29 -48`, `W30 -40`, `W21 -32`, `W20 -16`, `W19 -8`. Ở đó CFA là chính con trỏ stack lúc vào, nên các offset là offset khung không cần chuyển đổi, và CFA được định nghĩa từ `x29` trong khi frame record còn sống. `eh_frame_cross_check()` chạy phép so sánh này cho cả 12 FDE của cả hai object. Một mục cần cẩn thận: `call8` dưới System V đẩy hai đối số đi ra giữa thân, nên offset CFA sâu nhất của nó là 32 trong khi khung prologue của nó là 8, và kiểm tra so sánh độ sâu con trỏ stack lớn nhất mà thân đạt tới, 24, cộng 8.

## What the Tools Call This

Mọi công cụ trong lĩnh vực này có một cấu trúc dữ liệu cho quy ước gọi và một lượt gán một quy ước cho một hàm. Các tên khác nhau và các khoảng trống khác nhau. Các công cụ đóng được mô tả từ tài liệu của chúng; các công cụ mở được chạy trên các fixture và đầu ra của chúng được thu cạnh các object.

**Ghidra 12.1.4 (Apache-2.0).** Các quy tắc nằm trong các tệp đặc tả compiler, `.cspec`, cạnh ngôn ngữ SLEIGH. `x86-64-gcc.cspec` khai báo một `<default_proto>` tên `__stdcall`, "Được suy ra từ System V Application Binary Interface AMD64 Architecture Processor Supplement tháng 4 năm 2016", với các danh sách `<pentry>` cho `XMM0_Qa` đến `XMM7_Qa` và `RDI, RSI, RDX, RCX, R8, R9`, một mục stack tại offset 8, một quy tắc `join_dual_class` cho các kiểu tới 16 byte, các đầu ra `XMM0_Qa, XMM1_Qa, RAX, RDX` và `hidden_return` cho phần còn lại. `x86-64-win.cspec` khai báo `__fastcall` với bốn phần tử `<group>` ghép `XMM0_Qa` với `RCX`, `XMM1_Qa` với `RDX` và tiếp tục, chính là quy tắc theo vị trí, một mục stack tại offset 40, `convert_to_ptr` cho các struct 3, 5, 6 hoặc 7 byte với bình luận "chỉ các struct kích thước 8,16,32,64 bit có thể được đóng gói vào thanh ghi", `unaffected` liệt kê `RBX RBP RDI RSI RSP R12` đến `R15` và `XMM6` đến `XMM15`, và một `localrange` của stack 8 đến 39, chính là shadow store. `AARCH64.cspec` khai báo `__cdecl` có mục đầu là `x8` với `storage="hiddenret"`, rồi `q0` đến `q7` và `x0` đến `x7`, `convert_to_ptr` cho các struct 17 byte trở lên, và `killedbycall` bao gồm `x8` với bình luận "thanh ghi vị trí kết quả gián tiếp, không được phản ánh trong danh sách pentry". Giai đoạn cuối của decompiler tên là "Establish Function's Prototype"; các analyzer là "Call Convention ID" và "Decompiler Parameter ID"; tùy chọn chương trình "Prototype Evaluation" chọn mô hình mặc định.

**IDA Pro và IDA Free (Hex-Rays, thương mại; bản phát hành hiện tại 9.4, bản dựng 9.4.260714).** Kiểu hàm là một khai báo C được đặt qua SetType, và "IDA sẽ sử dụng thông tin kiểu để chú thích disassembly bằng thông tin về các đối số hàm." Các vị trí mà không quy ước chuẩn nào tạo ra được viết trong quy ước riêng của IDA: `int __usercall func@<ebx>(int x, int y@<esi>)` đặt kết quả trong `EBX` và `y` trong `ESI`, và `@<^12.4>` nêu tên một vị trí stack theo offset và kích thước. `__userpurge` giống vậy với dọn stack bởi callee. Cùng trang liệt kê `__spoils` cho tập bị ghi đè, `__hidden`, `__return_ptr` và `__struct_ptr` cho các đối số ngầm mà bài học này khôi phục bằng tay. Hành động "Decompile as call" của decompiler chấp nhận một prototype `__usercall` cho một chỉ lệnh. IDA Free chỉ hỗ trợ x86 và x86-64.

**Binary Ninja 6.0 "Krypton" (Vector 35, thương mại, với một phiên bản Free decompile x86, x86_64, ARMv7 và AArch64).** Một `Platform` "chứa mọi thông tin liên quan đến môi trường thực thi của binary, chủ yếu các quy ước gọi được sử dụng, hệ điều hành và kiến trúc", và danh sách bao gồm `linux-x86_64`, `windows-x86_64`, `linux-aarch64` và `mac-aarch64`, mỗi nền tảng có một `default_calling_convention`. Một `CallingConvention` có `int_arg_regs`, `float_arg_regs`, `callee_saved_regs`, `caller_saved_regs`, `int_return_reg`, `high_int_return_reg`, `float_return_reg` và hai cờ trực tiếp mã hóa các khác biệt trong bài học này: `arg_regs_share_index`, "Khi True, đối số thứ N tiêu thụ slot thứ N của cả danh sách thanh ghi số nguyên và float bất kể kiểu của nó", và `stack_reserved_for_arg_regs`, "không gian shadow/home được sử dụng bởi quy ước gọi Windows x64". `eligible_for_heuristics`, `required_arg_regs` và `required_clobbered_regs` điều khiển phát hiện quy ước heuristic của nó. Các kiểu nền tảng là các header C dưới `types/platform/`, một mỗi tên nền tảng.

**radare2 6.2.4 (LGPL-3.0, đã chạy ở đây).** `afcl` liệt kê các quy ước mà plugin kiến trúc biết: `amd64 amd64syscall dlang golang golang_abi0 ms p9 reg swift` cho x86-64 và `arm64 dlang golang p9 reg swift` cho AArch64. `afc` báo cáo quy ước của hàm hiện tại, `afcr` in `cc.amd64.arg0: rdi` đến `arg5: r9` và `ret0: rax`, và các profile là các tệp SDB tên `cc-ARCH-BITS.sdb`. radare2 chọn `amd64` cho object ELF và `ms` cho object COFF, là sự phân chia đúng. `afv` liệt kê đối số và biến, và `afs` in một chữ ký. Trên object Linux `-O2`, `afv` tìm bảy đối số cho `eight_args` và bỏ `rcx`; trên object Windows nó tìm `rcx, rdx, r8` và bốn slot stack và bỏ `r9`. Cả hai thanh ghi thiếu chỉ xuất hiện bên trong một `lea`. Trên `mixed`, nó báo cáo `double arg1 @ xmm0, arg2 @ xmm1, arg3 @ xmm2` trên Linux và hoàn toàn không có đối số trên Windows. Trên AArch64 nó tìm `x0` đến `x7` cho `eight_args`, và với `big_ret` nó liệt kê `x0` và `double arg2 @ d1` nơi hàm đọc `x8` và tải một hằng số vào `q1`. Mọi chữ ký `afs` bắt đầu bằng `void`, vì kiểu trả về không được suy ra. Ở `-O0`, nơi mọi đối số được lưu vào khung, `afv` tìm cả tám đối số của `eight_args` với `rbp+0x10` và `rbp+0x18` cho cặp stack.

**rizin 0.9.1 (LGPL-3.0, đã chạy ở đây) và Cutter 2.5.0.** `afcl` liệt kê `amd64 amd64syscall ms reg swift`. `afc` trả về `amd64` cho object COFF, nên profile Microsoft tồn tại và chưa được chọn từ định dạng. `afi` liệt kê bảy đối số cho `eight_args` trên Linux, lại không có `rcx`, và trên Windows `r8, rcx, rdx` với ba slot stack, không có `r9` và không có slot tại `0x40`. `afv` không tồn tại; lệnh liệt kê là `afvl`. Cutter là front end đồ họa trên rizin.

**angr 10.0.3 (BSD-2, đã chạy ở đây).** `CFGFast` theo sau bởi `CompleteCallingConventions(recover_variables=True)` đặt `function.calling_convention` thành `SimCCSystemVAMD64`, `SimCCMicrosoftAMD64` hoặc `SimCCAArch64`, theo định dạng binary, và `function.prototype` thành một chữ ký. Nó khôi phục cả tám đối số của `eight_args` trên cả ba mục tiêu, con trỏ ẩn của `big_ret` trên x86-64 là `(BOT*, long long) -> BOT*`, struct theo tham chiếu của `by_value` Windows là `(BOT*, BOT*) -> BOT*` và `sum_varargs` variadic System V là `(long long, ...)`. Các khoảng trống của nó khác của radare2: `mixed` trở về là `(long long, long long, double, float)` trên System V và AArch64, các thanh ghi đúng theo thứ tự sai, vì danh sách số nguyên được in trước danh sách float; `big_ret` AArch64 trở về là `(long long) -> double`, nên quy ước `x8` bị bỏ lỡ và các lần lưu vector được đọc như một kết quả; và `sum_varargs` AArch64 trở về với 16 tham số, toàn bộ vùng lưu thanh ghi.

**Các công cụ khác.** Hopper 6.6.0 là một disassembler và decompiler thương mại cho macOS và Linux; việc xử lý quy ước của nó chưa được chạy hoặc ghi tài liệu cho bài học này. lldb 1703 và gdb hiển thị khung đang hoạt động bằng `frame info` và `register read`, chính là góc nhìn động của bài 42 về cùng các offset. Compiler Explorer hiển thị ba danh sách cạnh nhau từ nguồn, là cách nhanh nhất để xác nhận một quy tắc trước khi bạn tìm nó trong các byte.

| Khái niệm | Ghidra | IDA | Binary Ninja | radare2 / rizin | angr | bài học này |
|---|---|---|---|---|---|---|
| Đối tượng quy ước | `prototype` trong một `.cspec` | từ khóa quy ước gọi trong kiểu hàm | `CallingConvention` trên một `Platform` | tên `afc`, `cc-ARCH-BITS.sdb` | lớp con `SimCC` | `expected_locations(abi, name)` |
| Mặc định theo mục tiêu | `<default_proto>` theo cspec | thiết lập compiler | `Platform.default_calling_convention` | `afc=`, `anal.cc` | theo định dạng | `describe_object()` |
| Thanh ghi đối số | danh sách `<pentry>`, `<group>` cho theo vị trí | `@<reg>` trong `__usercall` | `int_arg_regs`, `float_arg_regs`, `arg_regs_share_index` | `cc.NAME.argN` | `ARG_REGS`, `FP_ARG_REGS` | `INT_ARG_REGS`, `FLOAT_ARG_REGS` |
| Shadow store | stack `localrange` 8 đến 39 | ngầm | `stack_reserved_for_arg_regs` | `cc.ms.argn=stack` | `STACKARG_SP_DIFF` | `STACK_ARG_BASE[WIN64] = 40` |
| Con trỏ kết quả ẩn | `hidden_return`, `storage="hiddenret"` | `__return_ptr`, `__hidden` | kiểu trả về quá lớn cho `int_return_reg` | không được mô hình hóa | đối số đầu `BOT*` | `HIDDEN_RETURN_REG` |
| Callee-saved | `<unaffected>` | `__spoils` liệt kê điều ngược lại | `callee_saved_regs` | profile | `CALLEE_CLEANUP` và arch | `CALLEE_SAVED` |
| Gán một quy ước cho một hàm | analyzer "Call Convention ID", "Establish Function's Prototype" | người dùng hoặc thư viện kiểu | phát hiện heuristic với `required_arg_regs` | `afc`, `afva`, `aaft` | `CallingConventionAnalysis` | đọc-trước-ghi cộng sách quy tắc |

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
```

Đầu ra là một báo cáo JSON. Với mỗi trong bảy object, nó nêu tên định dạng, máy và ABI, và với mỗi trong mười hai hàm, nó cho các byte prologue, các thanh ghi được lưu với offset lúc vào, kích thước khung, con trỏ khung, các thanh ghi tham số, các offset đối số stack, các spill, thanh ghi trả về hoặc con trỏ ẩn, các độ sâu gọi và các thanh ghi cùng lần lưu đi ra của các caller. Mỗi hàm kết thúc bằng các kiểm tra của nó: quy tắc, giá trị kỳ vọng từ chữ ký, giá trị quan sát từ các byte và liệu chúng đồng nhất hay không. Báo cáo kết thúc bằng hai đối chiếu unwind và các bản thu công cụ. Trên 84 phân tích hàm, 489 kiểm tra chạy và cả 489 đồng nhất.

Dạng kỳ vọng:

```json
{
  "objects": {
    "convention-x86_64-windows-O2": {
      "format": "COFF", "machine": "AMD64", "abi": "Microsoft x64", "checks": "73/73 agree",
      "functions": {
        "keeps": {
          "prologue": ["56  pushq %rsi", "57  pushq %rdi", "53  pushq %rbx", "48 83 ec 20  subq $0x20, %rsp"],
          "frameBytes": 56,
          "savedRegisters": [{"register": "rsi", "entryOffset": -8}, {"register": "rdi", "entryOffset": -16}, {"register": "rbx", "entryOffset": -24}],
          "parameterRegisters": ["rcx"],
          "returnRegisters": ["rax"],
          "calls": [{"callee": "ext", "depth": 56}],
          "checks": [{"rule": "Microsoft x64: the caller must always allocate ...", "expected": "at least 32 bytes ...", "observed": [56], "agree": true}, "..."]
        }
      }
    }
  },
  "sehCrossCheck": ["..."],
  "ehFrameCrossCheck": {"...": "..."}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `describe_object()` đọc header ELF, COFF hoặc Mach-O và bảng symbol và trả về ABI cùng danh sách hàm.
2. `parse_listing()` chia văn bản `llvm-objdump -d -r` thành các hàm, giữ đích relocation của mọi lần gọi và bước nhảy, và loại bình luận bằng dấu của cú pháp đúng: `#` cho AT&T, `//` và `;` cho AArch64, nơi `#` mở đầu một immediate.
3. `effect_x86()` và `effect_arm()` biến một chỉ lệnh thành các lần đọc, đọc địa chỉ, ghi, tải, lưu và một delta con trỏ stack. Toán hạng AT&T cuối là đích; toán hạng AArch64 đầu là đích trừ trong các lần lưu, so sánh và nhánh. `lea` đọc một địa chỉ và không tải gì. Đích của `mov`, `cvtsi2sd`, `setcc` và mẫu bằng không `xor r, r` chỉ là một lần ghi. Một lần gọi ghi toàn bộ tập volatile. Một lần lưu pre-index di chuyển `sp` trước truy cập và một lần tải post-index di chuyển nó sau.
4. `analyze_function()` duyệt thân một lần tới `ret` hoặc bước nhảy đuôi đầu tiên. Nó theo dõi độ sâu con trỏ stack dưới giá trị lúc vào, nên một toán hạng bộ nhớ `disp(%rsp)` ở offset lúc vào `disp - depth` và `disp(%rbp)` ở `frame_pointer + disp`. Nó ghi các thanh ghi lớp đối số được đọc trước khi ghi, các lần tải ở hoặc trên offset đối số stack đầu của ABI, các lần lưu thanh ghi đối số vào khung, các truy cập dưới con trỏ stack hiện tại và độ sâu tại mọi lần gọi.
5. `_return_registers()` giữ một thanh ghi kết quả khi truy cập cuối của nó trước lối thoát là một lần ghi. Một lần đọc như một toán hạng dữ liệu giết ứng viên; một lần đọc như một base địa chỉ thì không, chính điều đó giữ `rax` sống trong `big_ret` dưới Microsoft x64, nơi `movq %rcx, %rax` được theo sau bởi các lần lưu qua `(%rax)`.
6. `expected_locations()` áp dụng ba sách quy tắc cho một chữ ký C: hai danh sách System V với các lớp eightbyte, các slot Microsoft theo vị trí với struct theo tham chiếu và các bộ đếm AAPCS64 với `x8` cho các kết quả trên 16 byte.
7. `run_checks()` so sánh hai bên và thêm các quy tắc khung: các thanh ghi callee-saved được ghi phải được lưu, `(rsp + 8) % 16 == 0` hoặc `sp % 16 == 0` tại mọi lần gọi, 32 byte shadow tại mọi lần gọi Microsoft, không truy cập dưới con trỏ stack dưới Microsoft và AAPCS64 và tối đa 128 byte dưới System V, và một epilogue phản chiếu prologue với con trỏ stack trở lại giá trị lúc vào.
8. `seh_cross_check()` và `eh_frame_cross_check()` đọc dữ liệu unwind của các object được dựng không có `-fno-asynchronous-unwind-tables` và so sánh nó với phép phân tích prologue.

Có thêm ba lệnh. `python3 code/main.py analyze convention-x86_64-windows-O2 keeps` in một hàm. `python3 code/main.py object FILE` in phán quyết của header. `python3 code/main.py seh` in `UNWIND_INFO` đã giải mã của mọi hàm có một mục như vậy.

## Use It

Sử dụng analyzer theo thứ tự này trên một object mới bạn đã dựng.

1. Chạy `python3 code/main.py object FILE.o` và viết ra ABI nó nêu tên. Nếu header và lệnh build của bạn bất đồng, dừng; một trong chúng sai.
2. Thu `llvm-objdump -d -r FILE.o` cạnh object và chạy phân tích. Đọc các byte prologue và các thanh ghi được lưu trước mọi thứ khác, và so sánh kích thước khung với các push và `sub`.
3. Đọc các thanh ghi tham số và các offset stack đối chiếu chữ ký nguồn của bạn. Một thanh ghi mà chữ ký không giải thích là một con trỏ ẩn, một dấu variadic hoặc một thanh ghi tạm mà analyzer nhầm là một đối số. Trường hợp cuối là một lỗi trong bảng hiệu ứng. Sửa nó bằng một quy tắc tổng quát cho chỉ lệnh đó.
4. Đọc các kiểm tra bất đồng, nếu có. Mỗi kiểm tra nêu tên quy tắc mà nó dựa vào, nên điều đầu tiên cần kiểm tra là quy tắc, rồi các byte, rồi analyzer.
5. Khi object có dữ liệu unwind, chạy đối chiếu. Hai phép suy ra đồng nhất là bằng chứng mạnh nhất mà bài học này tạo ra.
6. Khi một công cụ khác được cài, thu đầu ra của nó với lệnh chính xác và so sánh. Nơi nó đồng nhất bạn có ba phép suy ra. Nơi nó khác bạn có một thanh ghi cụ thể và một chỉ lệnh cụ thể để nhìn, và đó là một phát hiện cho bài 35.

## Interactive Lab

### Lab A: one instruction, three effects

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames/code
python3 -q
```

Chạy:

```python
from main import *
effect(Instruction(0, "48 8d 04 0a", "leaq", "(%rdx,%rcx), %rax"), SYSV)
effect(Instruction(0, "f2 0f 2a d7", "cvtsi2sd", "%edi, %xmm2"), SYSV)
effect(Instruction(0, "a9bd7bfd", "stp", "x29, x30, [sp, #-0x30]!"), AAPCS64)
```

Viết ra các lần đọc, các lần đọc địa chỉ, các lần ghi và delta stack bạn kỳ vọng trước mỗi lần gọi. Rồi thay `[sp, #-0x30]!` thành `[sp], #0x30` với `ldp` và theo dõi delta chuyển từ `sp_delta` sang `post_sp_delta`.

### Lab B: the frame of keeps

```python
info, listing = load_fixture("convention-aarch64-linux-O2")
keeps = analyze_function("keeps", listing["keeps"], info.abi)
keeps.saved
keeps.frame_pointer
[c.to_dict() for c in frame_cells(keeps)]
```

So sánh các offset với giải mã bằng tay ở trên. Rồi tải `convention-arm64-macos-O2` và chạy cùng ba dòng; record chuyển đến -16 và bốn thanh ghi nằm dưới nó. Rồi tải `convention-x86_64-linux-O2-fp` và đọc `saved` cho `keeps`: con trỏ khung trở lại, và một `pushq %rax` có công việc duy nhất là làm `(rsp + 8)` thành bội của 16 tại lần gọi cũng vậy.

### Lab C: read-before-write on mixed

```python
info, listing = load_fixture("convention-x86_64-linux-O2")
mixed = analyze_function("mixed", listing["mixed"], info.abi)
mixed.param_registers
mixed.return_registers
expected_locations(SYSV, "mixed")["parameters"]
expected_locations(WIN64, "mixed")["parameters"]
```

Danh sách System V là `rdi, xmm0, rsi, xmm1` và danh sách Microsoft là `rcx, xmm1, r8, xmm3`. Giờ tải object Windows và chạy lại ba dòng đầu. Rồi mở bản thu radare2 cho object Linux và tìm `[afv mixed]`: ba double. Tìm chỉ lệnh giải thích double thứ ba.

### Lab D: the unwinder's second opinion

```python
for row in seh_cross_check():
    print(row["function"], row["sizeOfProlog"], row["unwindPushes"], row["unwindAllocBytes"], row["agree"])
for row in eh_frame_cross_check("convention-x86_64-linux-O2-eh"):
    print(row["function"], row["cfiSaved"], row["cfiMaxOffset"], row["deepestStack"], row["agree"])
```

Tìm `pushq %rax` của `sum_varargs` trong bảng SEH và giải thích vì sao mã unwind ghi nó là một cấp phát. Rồi tìm `call8` trong bảng `.eh_frame` và giải thích 32.

## Practice Lab

Thêm một mục tiêu thứ tư và một sách quy tắc thứ tư.

Yêu cầu:

- Biên dịch `convention.c` với `-target x86_64-apple-macos -O2` và thu danh sách của nó. Mở rộng `describe_object()` để đọc `cputype` Mach-O 0x01000007 và ánh xạ nó sang System V psABI, mà Apple theo trên x86-64, với tiền tố symbol `_`.
- Kiểm tra rằng mọi hàm đồng nhất với các kiểm tra System V. Ghi một khác biệt bạn tìm thấy trong các prologue: Darwin giữ con trỏ khung ở mọi mức tối ưu hóa.
- Thêm một bản build `-fstack-protector-strong` của object Linux x86-64. Mở rộng phép quét prologue để lần tải canary từ `%fs:0x28` và lần lưu dưới các biến cục bộ được ghi là một ô `canary`, và phép so sánh trước `ret` là kiểm tra bảo vệ epilogue.
- Thêm một bài kiểm tra thất bại khi một lần lưu canary được tính là một đối số bị spill.
- Viết khung của mã kiểu `with_canary` bằng tay trước khi chạy analyzer, và giữ bản vẽ cạnh bài kiểm tra.

Thành công nghĩa là `python3 code/main.py` báo cáo object mới với mọi kiểm tra đồng nhất, và các ô khung của hàm được bảo vệ cho thấy canary giữa các biến cục bộ và các thanh ghi được lưu.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-calling-conventions-and-stack-frames.md`. Sử dụng nó để biến một object bạn đã dựng, danh sách của nó và các chữ ký C thành các vị trí tham số, một bố cục khung, một thanh ghi trả về và một kiểm tra mọi suy luận với quy tắc mà nó dựa vào và với dữ liệu unwind của compiler. Nó yêu cầu phán quyết ABI của header trước, cấm đọc các đích `cvtsi2sd` hoặc `xor r, r` như các lần đọc và kết thúc bằng bất đồng đầu tiên.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/38-calling-conventions-and-stack-frames
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- các header ELF, COFF và Mach-O của bảy object nêu tên System V, Microsoft x64, AAPCS64 và Apple arm64
- bảng symbol của mọi object liệt kê cùng mười hai hàm, với tiền tố `_` Mach-O và nhãn `ltmp0` được phân giải
- parser danh sách giữ `ext` làm đích gọi và giữ nguyên các immediate AArch64 chẳng hạn `#-0x30`
- `leaq (%rdx,%rcx), %rax` đọc hai thanh ghi địa chỉ và không tải gì; `xorl %eax, %eax` và `cvtsi2sd` chỉ ghi; một `stp` pre-index di chuyển `sp` trước lần lưu và một `ldp` post-index sau lần tải
- `keeps` ở `-O2` là `55 41 56 53` trên System V với một khung 24 byte và không con trỏ khung, `56 57 53 48 83 ec 20` trên Microsoft x64 với một khung 56 byte và `a9bd7bfd` đầu tiên trên AArch64 với record tại -48
- bản build Apple đặt record tại -16 phía trên bốn thanh ghi được lưu
- mọi hàm có một con trỏ khung ở `-O0` trên Linux và không có ở `-O2`, và `-fno-omit-frame-pointer` mang nó trở lại với một push căn chỉnh
- leaf `-O0` sử dụng 8 byte red zone dưới System V, `pushq %rax` dưới Microsoft x64 và `sub sp, sp, #0x10` dưới AAPCS64; `-mno-red-zone` loại việc sử dụng red zone
- mọi epilogue phản chiếu prologue của nó và con trỏ stack trở lại lúc vào
- `eight_args` đọc sáu thanh ghi và các slot 8 cùng 16, bốn thanh ghi và các slot 40 đến 64, hoặc `x0` đến `x7`, ở cả hai mức tối ưu hóa
- `mixed` là `rdi, xmm0, rsi, xmm1` dưới System V và `rcx, xmm1, r8, xmm3` dưới Microsoft x64, với `xmm0` làm kết quả ở cả hai
- struct 16 byte đi trong hai thanh ghi dưới System V và AAPCS64 và theo tham chiếu sau một con trỏ ẩn dưới Microsoft x64
- struct 32 byte trả về qua `rdi`, `rcx` hoặc `x8`
- callee variadic đọc `%al`, đưa `rdx, r8, r9` về home tại 16, 24, 32, lưu `x1` đến `x7` và `q0` đến `q7`, hoặc đọc con trỏ stack của caller trên Apple
- các caller đặt các thanh ghi kỳ vọng, lưu 7 và 8 tại 0 và 8 hoặc 5 đến 8 tại 32 đến 56, đặt `%al` bằng không cho lần gọi variadic và truyền địa chỉ bộ đệm kết quả trong `rdi`, `rcx` hoặc `x8`
- cả 489 kiểm tra đồng nhất với các quy tắc của chúng
- sáu mục `UNWIND_INFO` khớp phép phân tích prologue và các leaf không có mục nào
- 24 FDE khớp các offset thanh ghi được lưu và con trỏ stack sâu nhất
- các bản thu công cụ ghi `amd64` và `ms` của radare2, `amd64` của rizin trên object COFF, `rcx` bị thiếu, ba double và các prototype của angr
- dữ liệu hình được nhúng trong mô-đun site bằng đầu ra của analyzer

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Object COFF được đọc như System V | `rdi` và `rsi` làm các đối số mà hàm không bao giờ đọc | Header nói 0x8664; quy ước là Microsoft x64 |
| Thanh ghi chỉ được đọc bên trong một `lea` | Bảy đối số cho một hàm tám đối số | Các thanh ghi base và index là các lần đọc |
| Đích `cvtsi2sd` được tính là một lần đọc | Một đối số double thứ ba trong `xmm2` | Lần ghi đầu vào `xmm2` là một lần ghi; `mixed` có hai đối số SSE |
| Các slot theo vị trí được đọc như các chuỗi | `xmm0` được nêu tên là đối số double trên Windows | Slot 1 là `XMM1`, slot 3 là `XMM3` |
| `push rbp` được coi là một con trỏ khung | Một con trỏ khung trong một hàm `-O2` sử dụng `rbp` làm một bộ tích lũy | Chỉ `mov %rsp, %rbp` sau push tạo một con trỏ như vậy |
| Red zone được đo từ con trỏ stack lúc vào | 216 byte "dưới con trỏ stack" | 128 byte dưới con trỏ stack hiện tại sau một `sub` 88 byte |
| Shadow store được coi là biến cục bộ | Các đối số stack tại 8 đến 32 | Các đối số stack Microsoft bắt đầu tại 40 |
| `lea` được coi là một lần tải | Một đối số stack tại `0x60(%rsp)` trong một callee variadic | `lea` tính `overflow_arg_area`; nó không tải gì |
| Con trỏ ẩn được đọc như một đối số thường | `big_ret(void *, long long)` | Con trỏ được lưu qua và sao chép vào `rax`, `rax`, hoặc giữ trong `x8` |
| CFA sâu nhất được so sánh với khung prologue | Một lần không khớp trên một caller đẩy các đối số đi ra | So sánh với con trỏ stack sâu nhất mà thân đạt tới |
| Quy ước được khẳng định từ ISA | `amd64` cho một object COFF | Định dạng chọn sách quy tắc, rồi ISA chọn các thanh ghi |
| Tin prototype từ một công cụ | Ba double, hoặc mười sáu tham số variadic | Chữ ký nguồn hoặc một phép suy ra thứ hai phải đồng nhất |

## Operational Rule

Đọc header trước chỉ lệnh đầu tiên, và nêu tên sách quy tắc. Đặt mỗi thanh ghi được lưu và mỗi đối số tại một offset từ con trỏ stack lúc vào, và kiểm tra nó với quy tắc đã đặt nó ở đó và với dữ liệu unwind mà compiler viết cho cùng khung. Coi prototype của một công cụ là một khẳng định cho đến khi các byte hoặc nguồn xác nhận nó.

## Further Reading

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Version 1.0 (sections 3.2.1 to 3.2.3, 4.2.4)](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Microsoft x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)
- [Microsoft x64 stack usage](https://learn.microsoft.com/en-us/cpp/build/stack-usage)
- [Microsoft x64 prolog and epilog](https://learn.microsoft.com/en-us/cpp/build/prolog-and-epilog)
- [Microsoft x64 exception handling: RUNTIME_FUNCTION, UNWIND_INFO, UNWIND_CODE](https://learn.microsoft.com/en-us/cpp/build/exception-handling-x64)
- [Arm Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), release 2025Q4](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Apple: Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [DWARF Debugging Information Format Version 5, section 6.4 Call Frame Information](https://dwarfstd.org/doc/DWARF5.pdf)
- [Clang driver frame-pointer defaults, `useFramePointerForTargetByDefault` in `CommonArgs.cpp`](https://github.com/llvm/llvm-project/blob/main/clang/lib/Driver/ToolChains/CommonArgs.cpp)
- [Clang command line reference: `-fomit-frame-pointer`, `-momit-leaf-frame-pointer`](https://clang.llvm.org/docs/ClangCommandLineReference.html)
- [Fedora 38 change: frame pointers by default](https://fedoraproject.org/wiki/Changes/fno-omit-frame-pointer)
- [Ubuntu 24.04: performance engineering with frame pointers by default](https://ubuntu.com/blog/ubuntu-performance-engineering-with-frame-pointers-by-default)
- [Ghidra compiler specification: `x86-64-gcc.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-gcc.cspec)
- [Ghidra compiler specification: `x86-64-win.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/x86/data/languages/x86-64-win.cspec)
- [Ghidra compiler specification: `AARCH64.cspec`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/languages/AARCH64.cspec)
- [Hex-Rays: SetType and the `__usercall` convention](https://docs.hex-rays.com/ida-actions/settype)
- [Hex-Rays: Decompile as call](https://docs.hex-rays.com/ida-actions/hx_userdefinedcall)
- [Binary Ninja API 6.0: `callingconvention` module](https://api.binary.ninja/binaryninja.callingconvention-module.html)
- [Binary Ninja API 6.0: `platform` module](https://api.binary.ninja/binaryninja.platform-module.html)
- [Binary Ninja user documentation: platform types](https://docs.binary.ninja/guide/types/platformtypes.html)
- [The Official Radare2 Book: calling conventions](https://book.rada.re/analysis/calling_conventions.html)
- [The Official Radare2 Book: code analysis](https://book.rada.re/analysis/code_analysis.html)
- [angr documentation: decompiler analysis passes, including calling convention recovery](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 6.2.4 release](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [rizin 0.9.1 release](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
