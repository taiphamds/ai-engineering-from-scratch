# Compiler Idioms: What Optimization Does to Your Code and How to Read It Back

> Một compiler tối ưu hóa thay các cấu trúc nguồn bằng các dạng chỉ lệnh rẻ hơn. Mỗi dạng có một phép suy ra, và bài học này xây dựng bộ nhận dạng chạy ngược phép suy ra và kiểm tra nó với nguồn.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, AArch64 assembly
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode), Phase 13 · 38 (calling conventions)
**Time:** ~150 minutes

## Learning Objectives

- Suy ra số ma thuật và độ dịch cho phép chia cho bất kỳ hằng số nào bằng cận Granlund-Montgomery, và khôi phục số chia từ các hằng số mà clang phát ra.
- Nêu tên năm cách LLVM hạ một `switch` và đọc số mục, vị trí bảng và các mục từ object.
- Đọc một vòng lặp được vector hóa dưới dạng lane, bộ tích lũy, phần tử mỗi vòng lặp, mask số lượt lặp, phép rút gọn và vòng lặp phần dư.
- Nhận dạng tail call, callee inline, select không nhánh và các vòng lặp trở thành `memset` hoặc `memcpy`.
- Báo cáo mọi mẫu với các chỉ lệnh bằng chứng và dạng nguồn đã giải mã của nó, trên x86-64 và trên AArch64, ở `-O0` đến `-O3`.
- So sánh kết quả với những gì Ghidra, angr, radare2, rizin và lldb hiển thị cho cùng các byte.

## The Problem

Bạn biên dịch `idioms.c` ở `-O2` và hỏi một agent `div7u` làm gì. Agent đọc `imulq $0x24924925, %rax, %rax` và trả lời rằng hàm nhân với 613566757, dịch và cộng. Mọi từ đều đúng. Hàm tính `x / 7`.

Cùng object chứa một `switch` với bảy case hoàn toàn không có bước nhảy, một `switch` với năm case là một jump table, một `switch` với hai case là một `sete` và một `cmovne`, và một vòng lặp trên `n` số nguyên chạy tám số nguyên mỗi vòng lặp trong hai thanh ghi `xmm` rồi hoàn thành phần còn lại trong một vòng lặp thứ hai. Ở `-O0`, cùng nguồn tạo ra `divl`, các jump table bảy mục và một vòng lặp vô hướng. Ở `-O1`, switch bảy case trở thành một bảng giá trị và vòng lặp vector chưa tồn tại.

Các dạng này là idiom. Một compiler phát ra mỗi dạng từ một quy tắc bạn có thể đọc trong nguồn của nó, và mỗi dạng có thể được giải mã trở lại cấu trúc mà nó đến từ đó. Việc giải mã là số học, và số học có thể được kiểm tra. Bài 34 chứng minh một trong số đó, phép nhân với `0x66666667`. Bài học này xây dựng bộ nhận dạng cho tất cả chúng, chạy nó trên 18 bản build mã của riêng chúng ta và xác minh cả 373 báo cáo với nguồn C.

```figure
re-39-idioms-by-level
```

## An Idiom Is a Shape With a Derivation

Một idiom là một chuỗi chỉ lệnh mà compiler phát ra cho một cấu trúc nguồn. Ba điều khiến nó có thể nhận dạng. Nó có một dạng cố định, các toán hạng mang các hằng số mà phép suy ra dự đoán, và dạng khác với những gì một lập trình viên sẽ viết bằng tay.

Bộ nhận dạng trong `code/main.py` hoạt động trên văn bản của `llvm-objdump -d -r`, mà bài 33 xác lập là oracle cho các ranh giới chỉ lệnh. Nó phân tích mỗi hàm thành các chỉ lệnh với địa chỉ, byte, mnemonic, toán hạng và dòng relocation theo sau nó. Nó chỉ đọc tệp object cho hai thứ: các byte của `.rodata`, nơi các value table nằm, và các mục `.rela.rodata`, nơi các đích jump table nằm trước liên kết.

Mỗi phát hiện là một bản ghi `Idiom` với một `kind`, một dạng `source` đã giải mã, một danh sách địa chỉ `evidence`, một từ điển `detail` và một cờ `verified`. Cờ đến từ nguồn C. `parse_source()` đọc `idioms.c`, tìm mỗi hàm và trích các số chia sau `/` và `%`, các hệ số nhân sau `*`, các case `switch` và giá trị của chúng, các toán tử `? :`, các vòng lặp `for` và các callee. Một mẫu chia được xác minh khi số chia của nó nằm trong danh sách phép chia của hàm. Một bảng tra cứu được xác minh khi các mục của nó khớp các giá trị case, sai khác tối đa một hệ số hằng. Một tail call được xác minh khi callee được gọi trong nguồn. Báo cáo demo kết thúc bằng một danh sách `unverified`, và bộ kiểm tra khẳng định rằng danh sách rỗng cho cả 18 bản build.

Giải mã cần tên. Bộ nhận dạng chạy một bộ đánh giá ký hiệu nhỏ trên các basic block của mỗi hàm, theo thứ tự danh sách, với các tên tham số từ nguồn trong các thanh ghi đối số của các quy ước System V và AAPCS64 từ bài 38. Các slot stack được theo dõi theo văn bản toán hạng của chúng để mã `-O0` đọc qua các spill của nó. Tại mỗi điểm vào khối, các trạng thái của các tiền nhiệm được gộp, và nơi chúng khác nhau một tên mà một mẫu trước đó gán thắng một hằng số. Đó là cách `cmovll %edx, %eax` trong `digest` đọc trở lại thành `sum % 10 < 5 ? sum % 10 : 5`: mẫu vòng lặp đặt tên bộ tích lũy `sum`, mẫu chia đặt tên thương của nó `sum / 10` và mẫu modulo đặt tên kết quả của nó `sum % 10`. Nguồn viết `rem > 5 ? 5 : rem`. Cả hai biểu thức cho giá trị nhỏ hơn của `rem` và 5, và chúng đồng nhất tại `rem == 5`.

## Division by a Constant

Granlund và Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994), thay `n / d` bằng một phép nhân và một phép dịch. Chọn một độ dịch `s` và một hệ số nhân `m = ceil(2^s / d)`. Rồi `floor(n * m / 2^s)` bằng `floor(n / d)` với mọi `n` trong phạm vi khi sai số `e = m * d - 2^s` đủ nhỏ. Với `n` 32 bit không dấu, cận là `e <= 2^(s - 32)`. Với `n` có dấu với `|n| < 2^31`, cận là `e <= 2^(s - 31)`, và một sửa dấu cộng 1 khi `n` âm, vì floor làm tròn sai chiều cho các thương âm.

`magic_numbers(d, bits, signed)` trong `main.py` tìm `s` tăng dần từ 32 và trả về cặp đầu tiên đáp ứng cận. Tìm kiếm đó tái tạo mọi hằng số clang phát ra trong các fixture.

### Unsigned 10 by hand

`2^35 / 10 = 3435973836.8`. Giá trị trần là `3435973837 = 0xCCCCCCCD`. Sai số là `0xCCCCCCCD * 10 - 2^35 = 2`, và cận tại `s = 35` là `2^3 = 8`. Tại `s = 34`, sai số sẽ là 6 so với cận 4, nên 35 là độ dịch nhỏ nhất. Kiểm tra với `n = 123`: `123 * 3435973837 = 422624781951`, và `422624781951 >> 35 = 12`.

clang phát ra chính xác điều này cho `div10u` ở `-O2` trên x86-64:

```text
       0: 89 f9                        	movl	%edi, %ecx
       2: b8 cd cc cc cc               	movl	$0xcccccccd, %eax
       7: 48 0f af c1                  	imulq	%rcx, %rax
       b: 48 c1 e8 23                  	shrq	$0x23, %rax
```

`0x23` là 35. `movl %edi, %ecx` mở rộng bằng không đối số 32 bit vào một thanh ghi 64 bit, là dạng không dấu. Bộ nhận dạng đọc hệ số nhân từ `movl $imm` cung cấp cho `imulq` hai toán hạng, đọc độ dịch và gọi `divisor_from_magic(0xCCCCCCCD, 35)`. Hàm đó thử `2^35 // m = 10` và 11, và chấp nhận 10 vì `magic_numbers(10)` cho lại cùng hệ số nhân và độ dịch.

Trên AArch64, cùng hàm là `mov w8, #0xcccd; movk w8, #0xcccc, lsl #16; umull x8, w0, w8; lsr x0, x8, #35`. Hằng số đến trong hai nửa 16 bit, phép nhân là `umull` và độ dịch được viết trong hệ thập phân. Bộ nhận dạng lắp ráp các nửa và báo cáo cùng số chia.

### Unsigned 7 by hand, with the add fix-up

`2^35 / 7 = 4908534052.57`. Giá trị trần là `4908534053 = 0x124924925`, cần 33 bit. Sai số là 3 so với cận 8, nên độ dịch là 35, và không độ dịch nhỏ hơn nào hoạt động. Một phép nhân 32 bit không thể chứa hệ số nhân, nên compiler nhân với 32 bit thấp `0x24924925` và cộng lại số bị chia theo một chuỗi cố định:

```text
      32: 48 69 c0 25 49 92 24         	imulq	$0x24924925, %rax, %rax
      39: 48 c1 e8 20                  	shrq	$0x20, %rax
      3d: 29 c7                        	subl	%eax, %edi
      3f: d1 ef                        	shrl	%edi
      41: 01 f8                        	addl	%edi, %eax
      43: c1 e8 02                     	shrl	$0x2, %eax
```

Đọc nó là `t = (n * 0x24924925) >> 32`, rồi `q = (((n - t) >> 1) + t) >> 2`. Tổng độ dịch là `32 + 1 + 2 = 35`. Với `n = 100`: `t = 14`, `(100 - 14) >> 1 = 43`, `43 + 14 = 57`, `57 >> 2 = 14`. Bộ nhận dạng phát hiện đuôi `sub`, `shr`, `add`, `shr` sau một độ dịch 32 bit, cộng lại `2^32` vào hệ số nhân và khôi phục 7. `evaluate_division()` chạy chính xác chuỗi này và bài kiểm tra kiểm tra nó với `n // 7` trên các giá trị biên 32 bit. Dạng AArch64 là `sub w9, w0, w8; add w8, w8, w9, lsr #1; lsr w0, w8, #2`, ngắn hơn một chỉ lệnh vì phép cộng có dịch là một chỉ lệnh.

### Signed 3 by hand

`2^32 / 3 = 1431655765.33`, giá trị trần `1431655766 = 0x55555556`, sai số 2, và cận có dấu tại `s = 32` là `2^1 = 2`. Cận đúng không còn dư địa, nên độ dịch là 32 và clang sử dụng `shrq $0x20`. Với `n = -7`: tích là `-10021590362`, phép dịch số học 32 cho `-3`, bit dấu được đặt, nên sửa dấu cộng 1 và kết quả là `-2`, tức `-7 / 3` trong C. Các fixture có dấu `div10s` và `div3s` đều mang sửa dấu dưới dạng `shrq $0x3f` trên một bản sao của tích theo sau bởi `addl`.

### What the constants are not

Chỉ hệ số nhân không nêu tên số chia nào. `0x66666667` với độ dịch 34 là 10. Cùng hệ số nhân với độ dịch 33 là 5, như bài 34 cho thấy. Bộ nhận dạng do đó luôn ghép hệ số nhân với tổng độ dịch, và trường `clangMatchesAlgorithm` ghi rằng cặp là cặp mà tìm kiếm tạo ra. Các lũy thừa hai không bao giờ sử dụng phép nhân. `magic_numbers()` từ chối chúng, vì compiler phát ra một phép dịch với một thiên lệch dấu thay thế, và `mod8s` trong phần tiếp theo cho thấy dạng đó.

### The idiom belongs to the instruction selector

Ở `-O0`, `div10u` là `movl $0xa, %ecx; xorl %edx, %edx; divl %ecx`. `div10s` là `cltd; idivl %ecx`. Trong cùng object, `digest` chia tổng vòng lặp của nó cho 10 bằng `imulq $0x66666667`. Một cờ giải thích khác biệt. Fixture `idioms-x86_64-nofastisel-O0.o` được dựng bằng `-O0 -mllvm -fast-isel=false`, và trong nó mọi phép chia là phép nhân, bao gồm `div10u` với `movl $0xcccccccd, %ecx; imulq %rcx, %rax; shrq $0x23`. Phép chia phần cứng là lựa chọn của bộ chọn chỉ lệnh nhanh ở `-O0`. Phép nhân là cách hạ của SelectionDAG, chính là điều mà `UnsignedDivisionByConstantInfo` và `SignedDivisionByConstantInfo` của LLVM tạo ra. Khối `digest` chứa phép chia cũng chứa một `switch`, và khối đó đi tới SelectionDAG. Bộ nhận dạng báo cáo cả hai dạng, `hardware idivl` và `magic multiply`, và hình cho thấy hàm `-O0` hỗn hợp.

## Modulo Follows the Quotient

`x % d` là `x - (x / d) * d`. Compiler tính thương bằng mẫu ở trên, nhân nó trở lại và trừ. Trên x86-64, phép nhân trở lại với 10 là `addl %ecx, %ecx; leal (%rcx,%rcx,4), %ecx`, tức `2 * q * 5`. Trên AArch64, nó là một chỉ lệnh, `msub w0, w8, w9, w0`, tính `w0 - w8 * w9` với `w9 = 10`. Bộ nhận dạng đi theo thanh ghi thương qua các bản sao, theo dõi hệ số tích lũy qua `add`, `lea`, `shl` và `imul`, và chấp nhận một `sub` khi hệ số bằng số chia.

Khi cùng thương cũng cung cấp cho một biểu thức khác, cả hai mẫu ở lại trong báo cáo. Ở `-O1`, compiler tính `sum / 10` một lần trong `digest` và sử dụng nó cho chỉ số `switch` và cho modulo. Trên x86-64 nó thậm chí kết hợp thương hai lần, `leal (%rax,%rsi), %edi` cho modulo và `addl %esi, %eax` cho switch. Bộ nhận dạng báo cáo một phép chia và một modulo và đánh dấu thương là dùng chung. Một báo cáo làm mất phép chia ở đây sẽ khiến chỉ số `switch` không thể đọc.

Modulo có dấu với một lũy thừa hai có dạng riêng, vì thương không bao giờ được tính:

```text
      92: 8d 48 07                     	leal	0x7(%rax), %ecx
      95: 85 ff                        	testl	%edi, %edi
      97: 0f 49 cf                     	cmovnsl	%edi, %ecx
      9a: 83 e1 f8                     	andl	$-0x8, %ecx
      9d: 29 c8                        	subl	%ecx, %eax
```

Với một `x` âm, mã thêm thiên lệch 7 trước khi mask, để việc cắt làm tròn về không như C yêu cầu. Giá trị được mask là `x` được làm tròn đến một bội của 8, và phép trừ để lại `x % 8`. AArch64 làm điều đó bằng `negs w8, w0; and w9, w0, #0x7; and w8, w8, #0x7; csneg w0, w9, w8, mi`: mask cả `x` và `-x`, rồi chọn và đổi dấu theo dấu. Ghidra đặt tên quy tắc của nó cho điều này là `RuleSignMod2nOpt`, với mô tả ngắn "Chuyển các dạng INT_SREM: `(V + (sign >> (64-n)) & (2^n-1)) - (sign >> (64-n)) => V s% 2^n`".

Ở `-O0`, AArch64 viết modulo là `sdiv w9, w8, w10; mul w9, w9, w10; subs w0, w8, w9`. Bộ nhận dạng cũng chấp nhận dạng đó và báo cáo `hardware sdiv + mul + subs`.

## Five Ways to Lower a switch

LLVM quyết định dạng của một `switch` ở hai nơi. `SimplifyCFG::simplifySwitchLookup` chạy ở `-O1` trở lên và biến một switch có các case đều tạo hằng số thành một bảng giá trị, khi có ít nhất ba case và mục tiêu có thể xây dựng các bảng tra cứu. Các loại bảng của nó là `SingleValueKind`, `LinearMapKind`, `BitMapKind` và `ArrayKind`. Pipeline `-O0` không bao giờ chạy lượt này. Các switch còn lại đến `SwitchLowering::findJumpTables` trong chọn chỉ lệnh, xây dựng một jump table khi cụm có ít nhất `min-jump-table-entries` mục, mặc định 4, và đủ dày: `NumCases * 100 >= Range * MinDensity` với `jump-table-density` 10 cho các hàm thông thường và 40 dưới `-Os`. Phần còn lại trở thành một tìm kiếm nhị phân trên các hằng số case, với `splitWorkItem` chọn pivot. Các fixture chứa một hàm mỗi kết quả.

| Hàm | Nguồn | `-O0` x86-64 | `-O2` x86-64 | `-O2` AArch64 |
|---|---|---|---|---|
| `linear_switch` | case 0 đến 6 trả về 10 đến 70 | jump table, 7 mục | ánh xạ tuyến tính `10*k + 10`, mặc định -1 | `madd` và `csinv` |
| `table_switch` | case 0 đến 6 trả về 10 đến 60 rồi 71 | jump table, 7 mục | bảng tra cứu tại `.rodata+0x28` | bảng tra cứu tại `.rodata+0x0` |
| `call_switch` | case 0 đến 4 gọi một trong năm con trỏ | jump table, 5 mục | jump table, 5 mục | cây so sánh, pivot 1 |
| `sparse_switch` | case 1, 100, 10000, 1000000, 100000000 | chuỗi so sánh | cây so sánh, pivot 9999 | cây so sánh, pivot 9999 |
| `two_cases` | case 3 và 4 trả về 7 và 9 | chuỗi so sánh | chuỗi select `k != 3 ? (k == 4)*9 : 7` | hai `csel` |

### The lookup table, read from the object

`table_switch` ở `-O2`:

```text
      d0: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      d5: 83 ff 06                     	cmpl	$0x6, %edi
      d8: 77 0c                        	ja	0xe6 <table_switch+0x16>
      da: 89 f8                        	movl	%edi, %eax
      dc: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		00000000000000df:  R_X86_64_PC32	.rodata+0x24
      e3: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      e6: c3                           	retq
```

Kiểm tra biên `cmpl $6; ja` nghĩa là 7 mục hợp lệ. Addend relocation `0x24` cộng 4 byte của trường tương đối theo RIP đặt bảng tại `.rodata+0x28`, quy tắc mà bài 33 suy ra. Các byte ở đó là `0a 00 00 00 14 00 00 00 ...`, nên các mục là `[10, 20, 30, 40, 50, 60, 71]`, và chúng bằng các giá trị case nguồn. Assembler đặt tên bảng này `.Lswitch.table.table_switch` trong tệp `.s`, với một bình luận `@switch.table.table_switch`. Trong object chỉ relocation và các byte còn lại. Không có bước nhảy, nên đồ thị luồng điều khiển có ba khối.

Dạng AArch64 ghép địa chỉ bảng bằng `adrp x8` và `add x8, x8, #0x0`, mỗi lệnh mang relocation riêng tới `.rodata`, và tải bằng `ldr w0, [x8, w0, uxtw #2]`. Bộ nhận dạng đọc addend từ relocation `add`.

### The linear map, with no table at all

`linear_switch` trả về `10 * (k + 1)` cho `k` trong 0 đến 6. `simplifySwitchLookup` phát hiện quan hệ affine và phát ra số học:

```text
      b0: 83 ff 07                     	cmpl	$0x7, %edi
      b3: 8d 04 bf                     	leal	(%rdi,%rdi,4), %eax
      b6: 8d 4c 00 0a                  	leal	0xa(%rax,%rax), %ecx
      ba: b8 ff ff ff ff               	movl	$0xffffffff, %eax
      bf: 0f 42 c1                     	cmovbl	%ecx, %eax
```

Bộ đánh giá đọc `leal (%rdi,%rdi,4)` là `5*k`, `leal 0xa(%rax,%rax)` là `10*k + 10`, và `cmovb` sau `cmpl $7` là `k < 7 ? 10*k + 10 : -1`. Bộ nhận dạng sau đó kiểm tra công thức với mọi case nguồn và đánh dấu mẫu đã xác minh. AArch64 đạt cùng biểu thức bằng `madd w8, w0, w8, w9` và `csinv w0, w8, wzr, lo`, nơi `csinv` với `wzr` cho `-1` trên đường mặc định.

### The jump table, read from relocations

`call_switch` ở `-O2` là dạng mà bài 33 khôi phục trong `grade` ở `-O0`: `cmpl $4; ja`, một `leaq` tới `.rodata-0x4`, một `movslq` của một mục 4 byte, `addq` và `jmpq *%rax`. Năm mục là các relocation trong `.rela.rodata`, và `target = addend - 4k` cho `0x10c, 0x107, 0x10e, 0x110, 0x109`, năm khối phân biệt, mỗi khối tail-jump qua một con trỏ hàm. Fixture `dispatch` mở rộng điều này lên 16 case: 16 mục relocation trên x86-64, và trên AArch64 một bảng nén 16 byte đơn được đọc bằng `ldrb w11, [x9, x8]`, nhân tỷ lệ 4 bằng `add x10, x10, x11, lsl #2`, và dựa trên một `adr` của khối case đầu. Bộ nhận dạng giải mã `[0x24, 0x74, 0x54, ...]` từ bảng byte và báo cáo `compressed: true`.

### The same switch at four levels

`digest` chứa một switch trên `sum / 10` với case 6 đến 10 và các giá trị 1, 2, 4, 8, 8, rồi nhân kết quả với 16. Trên x86-64 nó là một jump table ở `-O0`, một bảng tra cứu ở `-O1` với các mục `[16, 32, 64, 128, 128]`, và lại một jump table ở `-O2` và `-O3` có bốn khối case lưu `0x10`, `0x20`, `0x40`, `0x80`. Từ `-O1` trở lên, phép nhân với 16 đã chuyển vào các case. Ở `-O0`, các case lưu 1, 2, 4 và 8, và phép nhân ở lại sau switch. Với bảng tra cứu `-O1`, bộ nhận dạng so sánh các mục với các giá trị nguồn, tìm một tỷ số hằng và báo cáo `foldedFactor: 16`. Trên AArch64, dạng `-O2` là một cây so sánh với một pivot tại 8, các kiểm tra bằng nhau cho 6, 7 và 8, và một kiểm tra phạm vi `sub w9, w9, #9; cmp w9, #2; b.hs` bao quát case 9 và 10 trong hai chỉ lệnh. Bộ nhận dạng báo cáo `rangeTests: [[9, 10]]`.

Hai cờ di chuyển các ranh giới này. `-fno-jump-tables` biến `table_switch`, `call_switch` và switch `digest` thành các cây so sánh trên x86-64, với pivot 2 và 4 cho hàm bảy case. Trên AArch64, `-mllvm -min-jump-table-entries=4` để `call_switch` là một cây so sánh, nên trên mục tiêu đó số mục không phải đầu vào quyết định cho một switch năm case của các lần gọi gián tiếp. Fixture `idioms-arm64-jt4-O2.o` ghi lần chạy đó.

GCC đặt cả hai quyết định trong `tree-switch-conversion.cc`, với các lớp `jump_table_cluster`, `bit_test_cluster`, `switch_decision_tree` và `switch_conversion`. `-ftree-switch-conversion` của nó bật ở `-O2`, `-fjump-tables` và `-fbit-tests` ở `-O1`, và ngưỡng jump table đến từ `case-values-threshold`, có mặc định là giá trị của máy. Không GCC nào được cài trên máy này, nên các tên đó đến từ nguồn và sổ tay GCC, và Compiler Explorer là nơi bạn kiểm tra chúng.

## Loops: Vectorized, Unrolled, or Replaced

Loop vectorizer của LLVM bật ở `-O2`, `-O3` và `-Os`, và tắt ở `-O0` cùng `-O1`, một quy tắc có từ LLVM 3.4 tháng 1 năm 2014. `sum_n` ở `-O2` cho thấy mọi phần của dạng:

```text
     1f6: 83 fe 07                     	cmpl	$0x7, %esi
     1f9: 77 09                        	ja	0x204 <sum_n+0x14>
     206: 81 e2 f8 ff ff 7f            	andl	$0x7ffffff8, %edx
     230: f3 0f 6f 14 37               	movdqu	(%rdi,%rsi), %xmm2
     235: 66 0f fe c2                  	paddd	%xmm2, %xmm0
     239: f3 0f 6f 54 37 10            	movdqu	0x10(%rdi,%rsi), %xmm2
     23f: 66 0f fe ca                  	paddd	%xmm2, %xmm1
     243: 48 83 c6 20                  	addq	$0x20, %rsi
     24a: 75 e4                        	jne	0x230 <sum_n+0x40>
     24c: 66 0f fe c8                  	paddd	%xmm0, %xmm1
     250: 66 0f 70 c1 ee               	pshufd	$0xee, %xmm1, %xmm0
     262: 66 0f 7e c8                  	movd	%xmm1, %eax
     270: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
     279: 75 f5                        	jne	0x270 <sum_n+0x80>
```

Điều kiện bảo vệ `cmpl $7; ja` gửi các số lượt lặp dưới 8 tới vòng lặp vô hướng. Mask `andl $0x7ffffff8` làm tròn số lượt lặp xuống một bội của 8. Thân tải 32 byte mỗi vòng lặp vào hai bộ tích lũy `xmm`, mỗi bộ bốn lane 32 bit, nên hệ số vector hóa là 4 và hệ số đan xen là 2. Sau vòng lặp, `paddd`, hai `pshufd`, thêm hai `paddd` và `movd` rút tám lane về một số nguyên. Vòng lặp tại `0x270` là phần dư vô hướng cho 0 đến 7 phần tử cuối. Bộ nhận dạng tìm vòng lặp từ back edge của nó, thấy các thanh ghi SIMD, đọc số lane từ `paddd`, đếm các bộ tích lũy phân biệt, chia bước `0x20` cho 4 và báo cáo `4 lanes x 2 accumulators = 8 elements per iteration`, với mask, điều kiện bảo vệ, phép rút gọn và vòng lặp phần dư làm các trường. AArch64 làm tương tự bằng `ldp q2, q3`, hai `add v.4s`, `addv s0, v0.4s` và `fmov w8, s0`.

Một số lượt lặp cố định loại vòng lặp. `sum4` là một `movdqu`, phép rút gọn và `movd`, không có back edge. `poly8` không thể vector hóa, vì mỗi vòng lặp phụ thuộc bộ tích lũy trước, nên compiler unroll nó tám lần: tám lần tải tại các offset 0 đến `0x1c` từ `%rdi`, mỗi lần theo sau bởi một phép dịch 5 và một phép trừ tính `acc * 31`. Bộ nhận dạng đếm các lần tải tại các offset liên tiếp từ một base và báo cáo `loop unrolled by 8, no back edge`. Trên AArch64, cùng các lần tải đến dưới dạng bốn cặp `ldp`.

Tắt vectorizer bằng `-fno-vectorize -fno-slp-vectorize` và `sum_n` trở thành một vòng lặp vô hướng unroll theo 8, với tám `addl k(%rdi,%rdx,4), %eax` và `addq $8`, cộng một vòng lặp phần dư. `sum4` trở thành bốn phép cộng. Bộ nhận dạng báo cáo `unrolled loop` với `copies: 8` và `indexStep: 8` cho hàm đầu và `copies: 4` cho hàm thứ hai.

Bài 33 tìm hai back edge trong `total` ở `-O2` và gọi chúng là hai vòng lặp. Bài học này đặt tên chúng: một thân vector và một phần dư vô hướng của cùng vòng lặp nguồn. Một back edge chỉ là một vòng lặp khi đích của nó có thể đến lại nó. `is_loop()` kiểm tra điều đó, vì `digest` trên AArch64 chứa các nhánh ngược tới một khối mặc định dùng chung không phải các vòng lặp, và phiên bản đầu của bộ nhận dạng đếm chúng là các vòng lặp vector.

### Loops that become library calls

`LoopIdiomRecognize` biến một vòng lặp lưu không vào mọi byte thành một lần gọi `memset`, từ `-O1` trở lên. `fill` ở `-O2` là `testl %esi, %esi; jle; movl %esi, %edx; xorl %esi, %esi; jmp memset@PLT`. Lần gọi là một bước nhảy đuôi với relocation `R_X86_64_PLT32 memset-0x4`, và `retq` của hàm chỉ trên đường rỗng. Bộ nhận dạng báo cáo `store loop recognized as memset(...)` và xác minh nó với vòng lặp nguồn, vì nguồn không bao giờ nêu tên `memset`.

`copy16` gọi `memcpy` với một hằng số 16, và backend x86 mở rộng nó inline thành `movups (%rsi), %xmm0; movups %xmm0, (%rdi)`, trong giới hạn 8 lần lưu mỗi `memcpy` của nó. Ở `-O0`, cùng lần gọi là hai cặp `movq` 8 byte. Với `-fno-builtin`, lần gọi vẫn là một lần gọi, `jmp memcpy@PLT` với `movl $0x10, %edx`, và `fill` giữ vòng lặp của nó, mà vectorizer sau đó biến thành một vòng lặp hai lần lưu `movups` 16 byte mỗi vòng lặp. Bộ nhận dạng báo cáo `vectorized store loop: 2 x 16-byte stores = 32 bytes per iteration` cho bản build đó.

## Calls That Disappear or Become Jumps

`tail_caller` trả về `tail_target(x + 1)`. Ở `-O0`, nó là `addl $0x1, %edi; callq tail_target@PLT; addq $0x10, %rsp; popq %rbp; retq`. Ở `-O2`, nó là `incl %edi; jmp tail_target@PLT` và không gì khác. Khung của caller đã mất và callee trả về cho caller của caller. Trên AArch64, bước nhảy là `b tail_target` với `R_AARCH64_JUMP26`. Bộ nhận dạng coi một `jmp` hoặc `b` mang một relocation gọi là một tail call. Recursive descent của bài 33 phải coi nó là một lối thoát hàm, vì đích nằm ngoài hàm.

`twice_sum` gọi `leaf_add`. Ở `-O0`, lần gọi có đó, `callq leaf_add@PLT`. Từ `-O1`, thân của `leaf_add`, `leal (%rdi,%rsi), %eax`, xuất hiện bên trong `twice_sum` và không lần gọi nào còn lại. Ở `-O0`, clang đánh dấu mọi hàm `optnone` và `noinline` và chỉ chạy always-inliner. Bộ nhận dạng biết từ nguồn rằng `twice_sum` gọi `leaf_add`, không tìm thấy lần gọi hoặc bước nhảy đuôi tới nó, rồi tìm dạng thân của callee trong caller: mnemonic và các toán hạng nguồn với đích được loại bỏ, để `add w8, w1, w0` trong caller AArch64 khớp `add w0, w1, w0` trong callee. Một lần khớp là bằng chứng.

`dispatch` kết hợp cả hai: một jump table 16 mục mà mọi case là `movl %esi, %edi; jmp fN@PLT`. Bộ nhận dạng báo cáo một switch và 16 tail call, tất cả được xác minh với 16 lần gọi trong nguồn.

## Branches That Became Data Moves

`clamp_max` là `movl %esi, %eax; cmpl %esi, %edi; cmovgl %edi, %eax`. Bộ đánh giá đặt tên `%edi` là `a` và `%esi` là `b`, ghi phép so sánh và đọc `cmovg` là `a > b ? a : b`, chính là văn bản nguồn. `abs_int` là `movl %edi, %eax; negl %eax; cmovsl %edi, %eax` và đọc là `-x < 0 ? x : -x`; AArch64 viết nó là `cmp w0, #0; cneg w0, w0, mi` và đọc là `x < 0 ? -x : x`. `is_pos` là `xorl %eax, %eax; testl %edi, %edi; setg %al`, đọc là `(x > 0)`. Đây là `-fif-conversion` theo từ ngữ của GCC và chọn `cmov` trong LLVM. Lượt `X86CmovConversion` của LLVM có thể biến một `cmov` trở lại thành các nhánh khi nó đánh giá điều đó có lợi, đó là lý do cùng nguồn có thể hiển thị bất kỳ dạng nào trong một vòng lặp.

Ở `-O0`, không dạng nào trong số này tồn tại. `clamp_max` là một phép so sánh, một `jle`, hai lần lưu vào cùng slot và một lần tải. Bộ nhận dạng không báo cáo gì cho nó ở `-O0` và `branchless select` từ `-O1`, chính là một trong những sự kiện mà hình làm rõ.

`mul9` là một `leal (%rdi,%rdi,8), %eax`, và bộ nhận dạng báo cáo `strength reduction` với `x * 9`, vì nguồn nhân với 9. Nó chỉ làm vậy khi nguồn có hệ số; một `lea` nhân tỷ lệ một chỉ số bảng không phải một phép nhân.

## Two Hardening Features That Look Like Idioms

Stack protector là một tính năng compiler, và nó để lại một dạng mà một agent nếu không sẽ đọc như logic chương trình. `canary.c` được biên dịch bằng `-fstack-protector-strong` cho Linux x86-64 cho:

```text
       7: 64 48 8b 04 25 28 00 00 00   	movq	%fs:0x28, %rax
      10: 48 89 44 24 40               	movq	%rax, 0x40(%rsp)
      26: 64 48 8b 0c 25 28 00 00 00   	movq	%fs:0x28, %rcx
      2f: 48 3b 4c 24 40               	cmpq	0x40(%rsp), %rcx
      34: 75 05                        	jne	0x3b <with_canary+0x3b>
      3b: e8 00 00 00 00               	callq	0x40 <plain_leaf>
		000000000000003c:  R_X86_64_PLT32	__stack_chk_fail-0x4
```

`%fs:0x28` là `stack_guard` trong `tcbhead_t` của glibc, tại byte offset 40, và `getIRStackGuard` của LLVM nêu tên slot đó cho glibc, bionic và Fuchsia. Prologue sao chép guard phía trên buffer, epilogue so sánh và đường thất bại gọi `__stack_chk_fail`. Trên Linux AArch64, guard đến từ biến toàn cục `__stack_chk_guard` qua GOT bằng `adrp` và `ldr`, và thất bại là `bl __stack_chk_fail`. Bộ nhận dạng báo cáo nguồn guard, slot, phép so sánh và lần gọi thất bại. `plain_leaf`, không có mảng, không có canary dưới `strong`, bảo vệ các hàm có mảng, `alloca` hoặc biến cục bộ được lấy địa chỉ. Các ghi chú nghiên cứu cũng ghi dạng MSVC dưới `/GS`, một cookie trộn với `%rsp` và được kiểm tra bởi `__security_check_cookie`; không linker MSVC nào tồn tại trên máy này, nên dạng đó chỉ được mô tả từ đầu ra assembly của compiler.

`-fcf-protection=full` đặt `endbr64`, các byte `f3 0f 1e fa`, làm chỉ lệnh đầu của mọi hàm. Nó là một landing pad cho các nhánh gián tiếp trên các bộ xử lý có thực thi luồng điều khiển, và nó thực thi như một `nop` ở nơi khác. Các mẫu điểm bắt đầu hàm x86-64 của Ghidra bao gồm các biến thể tiền tố `endbr64` của `push rbp; mov rbp, rsp` vì lý do này. Bộ nhận dạng báo cáo nó là `cet landing pad`, để một hàm bắt đầu bằng bốn byte bất thường không bị nhầm là dữ liệu.

## What the Decompilers Fold

Mọi decompiler trong bài 37 chạy một số phép suy ra này như các quy tắc viết lại. Decompiler của Ghidra đặt tên chúng trong `ruleaction.cc`. `RuleDivOpt` là "Chuyển các dạng INT_MULT và dịch thành INT_DIV hoặc INT_SDIV", với các dạng `sub( (zext(V)*c), d) >> e => V / (2^n/(c-1)) where n = d*8 + e` và biến thể có dấu với `sext` và `s>>`. `RuleModOpt` là "Đơn giản hóa các biểu thức tối ưu hóa INT_REM và INT_SREM". `RuleDivTermAdd` xử lý sửa cộng, `RuleSignDiv2` biến `(V + -1*(V s>> 31)) s>> 1` thành `V s/ 2`, và `RulePositiveDiv` biến một phép chia có dấu của các giá trị có bit dấu không được đặt thành phép chia không dấu. Bài 37 thu Ghidra 12.1.4 trên `grade` của bài 33 ở `-O1`, và đầu ra đọc là `uVar2 = param_1 / 10 - 6;`. Phép chia được gộp.

Đầu vào cho các quy tắc đó nhìn thấy được không cần Java. pypcode 4.0.1 của venv nâng bằng cùng đặc tả SLEIGH mà Ghidra sử dụng, và `code/fixtures/idioms-x86_64-O2.lifts.json` chứa P-code thô cho `div10s`: 112 mục cho bảy chỉ lệnh, trong đó 7 là các dấu `IMARK` mở mỗi chỉ lệnh, trong số chúng `RAX = RAX * unique[95a00:8]` sau `unique[95a00:8] = sext(0x66666667)`, `RCX = RCX >> unique[d1a00:4]` và `RAX = RAX s>> unique[c5c00:4]`. `shrq` mang 41 thao tác và `sarq` mang 40, và phần lớn chúng tính các cờ. `RuleDivOpt` khớp phép nhân và hai phép dịch trong luồng này, và loại bỏ mã chết loại các cờ mà không có gì đọc.

angr 10.0.3 chạy trên object `-O2` của chúng ta, và `idioms-x86_64-O2.angr.json` chứa đầu ra decompiler của nó cho 20 hàm. Nó gộp dạng không dấu: `div10u` là `return a0 / 10;`. Nó không gộp dạng có dấu: `div10s` là `v1 = a0 * 1717986919; return ((long long)(v1) >> 0x22) + (v1 >> 63);` và `mod10s` là `a0 - (...) * 2 * 5`. Với `div7u`, nó in `(a0 / 7 + ((a0 * 6 / 7 & 0xffffffff) >> 1 & 0xffffffff) & 0xffffffff) >> 2`, nơi các số hạng sửa còn lại như số học. Nó gộp `mul9` thành `a0 * 9`, `linear_switch` thành `(a0 < 7 ? a0 * 10 + 10 : 0xffffffff)`, `clamp_max` thành `((int)a1 < (int)a0 ? a0 : a1)`, `is_pos` thành `a0 > 0` và `fill` thành `return memset(a0, 0, a1);`. Nó in `table_switch` là một lần tải `*(int *)(4 * a0 + 4195400)` không có các giá trị, `sum_n` với các intrinsic `_mm_add_epi32` và `_mm_shuffle_epi32`, và `tail_caller` là `tail_target(); return;` với đối số bị mất. Trong `digest`, jump table trở thành `goto *((void *)(...))` với phép toán bảng được viết ra.

radare2 6.2.4 và rizin 0.9.1, được dựng từ nguồn vào cache nghiên cứu, được chạy trên cùng object. `pdc` của radare2 in `div10s` là `rax = rax * 0x66666667; rcx >>>= 0x3f; rax >>= 0x22; eax += ecx`, pseudo-C cấp thanh ghi không gộp, và `table_switch` là `eax = dword [rcx + rax*4]` với một bình luận `RELOC 32 .rodata` trên `lea`. rizin không có decompiler tích hợp; `aoi` của nó in RzIL của `imul` như một tích 128 bit. lldb-1703.0.236.21 tải object ELF và `disassemble -n div10s` của nó in cùng bảy chỉ lệnh như `llvm-objdump`, vì cả hai sử dụng disassembler của LLVM. Capstone 5.0.7 giải mã cùng các byte và báo cáo các nhóm chẳng hạn `ret` và `mode64`; nó là một decoder, và một idiom không bao giờ nằm trong đầu ra của một decoder. IDA Pro và Binary Ninja chưa được chạy ở đây. Tài liệu của chúng mô tả các giai đoạn nơi việc viết lại như vậy xảy ra, tối ưu hóa microcode và các lượt MLIL sang HLIL, và bài học này không đưa ra khẳng định về các mẫu nào chúng gộp.

Compiler Explorer là công cụ cho chiều xuôi. Dán `idioms.c`, chọn một mục compiler chẳng hạn "x86-64 clang 18.1.0" hoặc "ARM64 GCC 14.2.0" và đặt các cờ. Dịch vụ liệt kê khoảng 1,050 mục compiler C và có một API: `GET /api/compilers/c` trả về các định danh và `POST /api/compiler/<id>/compile` trả về assembly dưới dạng JSON. Bài viết ACM Queue năm 2019 của Matt Godbolt đi qua các mẫu chia, population count, điều kiện nối chuỗi và tính tổng bằng công cụ này. Sử dụng nó cho đầu ra GCC, mà máy này không thể tạo, và so sánh các ngưỡng jump table của GCC cùng mặc định vector hóa `-O2` từ GCC 12 với đầu ra clang trong các fixture.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
```

Đầu ra là một báo cáo JSON. Với mỗi trong 18 bản build, nó liệt kê mọi hàm và các mẫu của nó, với loại, dạng nguồn, địa chỉ bằng chứng, xác minh và các trường chi tiết. Nó kết thúc bằng một ma trận loại theo bản build, phép so sánh `-O2` với `-O3` cho cả hai kiến trúc và danh sách `unverified`.

Dạng kỳ vọng:

```json
{
  "builds": {
    "idioms-x86_64-O2": {
      "arch": "x86_64", "level": "O2", "flags": "x86_64",
      "functions": {
        "div7u": [{"kind": "division", "source": "x / 7", "evidence": ["0x30", "0x32", "0x39", "0x3d", "0x3f", "0x41", "0x43"], "verified": true, "form": "magic multiply with add fix-up", "magic": "0x24924925", "effectiveMagic": "0x124924925", "shift": 35, "...": "..."}],
        "table_switch": [{"kind": "switch", "source": "switch (k) as lookup table", "table": ".rodata+0x28", "entries": 7, "values": [10, 20, 30, 40, 50, 60, 71], "...": "..."}],
        "sum_n": [{"kind": "vector loop", "lanes": 4, "accumulators": 2, "elementsPerIteration": 8, "...": "..."}]
      }
    }
  },
  "kindMatrix": {"idioms-x86_64-O2": {"division": 5, "modulo": 3, "switch": 6, "vector loop": 3, "...": "..."}},
  "sameCodeAtO2AndO3": {"x86_64": {"identical": true}, "arm64": {"identical": false, "differences": ["..."]}},
  "unverified": []
}
```

Đọc `code/main.py` theo thứ tự này:

1. `parse_listing()` biến văn bản `llvm-objdump -d -r` thành các hàm, chỉ lệnh và relocation đính kèm cho cả hai kiến trúc.
2. `ElfFile` đọc section, symbol và các mục `.rela.*`, và `words()` đọc các mục bảng.
3. `magic_numbers()`, `divisor_from_magic()` và `evaluate_division()` là phép suy ra Granlund-Montgomery theo chiều xuôi, ngược và dưới dạng chuỗi chỉ lệnh.
4. `parse_source()` trích các cấu trúc mà xác minh cần từ tệp C.
5. `Evaluator` là lượt ký hiệu từng khối đặt tên các thanh ghi và slot stack.
6. `find_divisions()` và `find_modulos()` khớp các dạng nhân, dịch, sửa, nhân lại và lũy thừa hai.
7. `find_switches()` phân loại jump table, bảng tra cứu, ánh xạ tuyến tính, chuỗi select, cây so sánh và chuỗi so sánh.
8. `find_vector_loops()`, `find_unrolled_loops()`, `find_tail_calls()`, `find_inlined_calls()`, `find_selects()`, `find_memory_builtins()`, `find_stack_protector()`, `find_cet()` và `find_strength_reduction()` bao quát phần còn lại.
9. `analyze_function()` chạy chúng theo thứ tự, đưa tên kết quả của mỗi mẫu vào lượt evaluator tiếp theo.

Có thêm ba lệnh. `python3 code/main.py scan FILE.objdump.txt [FUNCTION]` chạy bộ nhận dạng trên một danh sách, với object và tệp C khớp được tìm bên cạnh nó. `python3 code/main.py magic DIVISOR [signed]` in hệ số nhân, độ dịch, sai số và liệu đồng nhất thức đúng trên các giá trị biên hay không. `python3 code/main.py figure-data` in dữ liệu mà hình nhúng.

## Use It

Sử dụng bộ nhận dạng theo thứ tự này trên một object mới bạn đã dựng.

1. Thu `llvm-objdump -d -r` từ object và giữ lệnh compiler chính xác cạnh nó. Bộ nhận dạng đọc kiến trúc từ header danh sách.
2. Chạy `scan` trên danh sách và đọc các mục `unverified` trước. Mỗi mục hoặc là một cấu trúc mà source parser không thấy hoặc một dạng mà bộ nhận dạng đọc sai, và cả hai xứng đáng được nhìn vào các địa chỉ bằng chứng.
3. Với mọi phép chia, đọc trường `algorithm`. Khi `clangMatchesAlgorithm` đúng, compiler chọn độ dịch hợp lệ nhỏ nhất. Khi nó sai, compiler có một lý do bạn chưa biết; viết ra các hằng số.
4. Với mọi switch, so sánh `lowering` trên các mức bạn đã dựng. Một bảng trở thành một cây, hoặc một cây trở thành một bảng, đánh dấu một ngưỡng bạn có thể nêu tên từ nguồn LLVM.
5. Với mọi vòng lặp, đọc `elementsPerIteration` và `scalarRemainderLoop`, rồi xác nhận hai back edge mà bài 33 báo cáo là một vòng lặp nguồn.
6. Chạy một decompiler trên cùng object, trích văn bản của nó cạnh mỗi mẫu và ghi những mẫu nào nó gộp. Bản ghi đó là baseline cho bài 45.

## Interactive Lab

### Lab A: derive a magic number, then find it

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization/code
python3 -q
```

Chạy:

```python
from main import *
magic_numbers(10), magic_numbers(10, signed=True)
magic_numbers(7), magic_numbers(7, signed=True)
divisor_from_magic(0x66666667, 34, signed=True), divisor_from_magic(0x66666667, 33, signed=True)
```

Tính `ceil(2^35 / 10)` trên giấy trước lần gọi đầu. Rồi thêm một hàm `unsigned div13(unsigned x) { return x / 13; }` vào một bản sao của `idioms.c`, dựng nó ở `-O2` bằng lệnh trong `build_fixtures.sh` và kiểm tra hằng số trong danh sách với `magic_numbers(13)`.

### Lab B: the table and the tree

```python
listing = load_listing("idioms-x86_64-O2.objdump.txt")
elf = load_elf("idioms-x86_64-O2.o")
sources = load_source("idioms.c")
[i.to_dict() for i in analyze_function(listing, "table_switch", elf, sources)]
[i.to_dict() for i in analyze_function(listing, "sparse_switch", elf, sources)]
elf.words(".rodata", 0x28, 7)
```

Thay `71` trở lại `70` trong một bản sao của `table_switch`, dựng lại ở `-O2` và theo dõi bảng tra cứu trở thành một ánh xạ tuyến tính. Rồi thay một giá trị case thành 1000 và theo dõi nó vẫn là một bảng `ArrayKind`.

### Lab C: the loop at three settings

```python
for name in ("idioms-x86_64-O1", "idioms-x86_64-O2", "idioms-x86_64-novec-O2"):
    print(name, [i.source for i in analyze_function(load_listing(name + ".objdump.txt"), "sum_n", load_elf(name + ".o"), sources)])
```

Vẽ đồ thị luồng điều khiển của `sum_n` ở `-O2` bằng tay, đánh dấu điều kiện bảo vệ, mask, thân vector, phép rút gọn và vòng lặp phần dư, và so sánh với các trường `detail`.

### Lab D: the shared quotient

```python
for name in ("idioms-x86_64-O1", "idioms-arm64-O1"):
    print([(i.kind, i.source, i.detail.get("sharedQuotient")) for i in analyze_function(load_listing(name + ".objdump.txt"), "digest", load_elf(name + ".o"), sources)])
```

Đọc danh sách `-O1` của `digest` và tìm hai chỉ lệnh kết hợp thương với sửa dấu của nó trên x86-64. Rồi giải thích vì sao bản build AArch64 chỉ cần một.

## Practice Lab

Thêm các thủ thuật bit vào các fixture và mở rộng bộ nhận dạng.

Yêu cầu:

- Viết các hàm `popcount`, `ctz` và `rotl` bằng các builtin GCC và một phép quay dịch-or, dựng chúng ở `-O2` có và không có `-mpopcnt -mbmi`, và commit các object với các danh sách của chúng.
- Nhận dạng chuỗi population-count `0x55555555`, `0x33333333`, `0x0f0f0f0f`, `0x01010101` mà `TargetLowering::expandCTPOP` phát ra, và báo cáo nó là `popcount` với bốn hằng số làm bằng chứng.
- Nhận dạng `rep bsfl` là mã hóa `tzcnt`-hoặc-`bsf` và `roll %cl` là phép quay, và giải mã cả hai về builtin.
- Thêm các loại mới vào xác minh `parse_source()`, để một mẫu `popcount` chỉ được xác minh khi nguồn gọi `__builtin_popcount`.
- Thêm một bài kiểm tra mỗi mẫu đọc các hằng số từ danh sách fixture.

Thành công nghĩa là `python3 code/main.py` báo cáo ba loại mới với `verified: true` trong cả hai bản build, và bộ kiểm tra vẫn báo cáo một danh sách `unverified` rỗng.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-compiler-idioms-and-optimization.md`. Sử dụng nó để biến một danh sách, một object và nguồn của nó thành một báo cáo mẫu đã xác minh với một phép so sánh decompiler. Nó yêu cầu các địa chỉ bằng chứng cho mọi khẳng định, phép suy ra số ma thuật cho mọi phép chia, loại hạ và nguồn mục cho mọi switch, và một dòng decompiler được trích cho mọi mẫu.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/39-compiler-idioms-and-optimization
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- parser danh sách đọc 25 hàm từ object `-O2`, giữ các byte và gắn `R_X86_64_PC32 .rodata+0x24` vào `leaq` trong `table_switch`
- trình đọc ELF trả về `[10, 20, 30, 40, 50, 60, 71]` từ `.rodata+0x28` và mười relocation trong `.rela.rodata`
- `magic_numbers` trả về `0xcccccccd` với độ dịch 35, `0x66666667` với 34, `0x124924925` với 35 và dạng cộng, `0x55555556` với 32 và `0xaaaaaaab` với 33
- đồng nhất thức đúng trên các giá trị biên 32 bit cho mọi số chia từ 2 đến 64 không phải một lũy thừa hai, có dấu và không dấu
- `divisor_from_magic` khôi phục 10, 5, 7 và 3 từ các cặp của chúng và từ chối một cặp sai
- chuỗi sửa cộng tính `n // 7` chính xác
- bốn phép chia x86-64 báo cáo đúng hệ số nhân, độ dịch, số chia và dạng, và bốn phép chia AArch64 giải mã `mov` và `movk`
- `-O0` sử dụng `divl` và `idivl`, `-O0 -fast-isel=false` sử dụng phép nhân, và `digest` ở `-O0` trộn hai dạng
- modulo được nhận dạng là nhân lại, `msub`, lũy thừa hai, `sdiv` cộng `mul` cộng `subs`, và `idivl` phần cứng
- một thương dùng chung giữ cả phép chia và modulo ở `-O1`
- năm cách hạ được phân loại ở `-O2` trên cả hai kiến trúc, với công thức, các giá trị, các đích, các pivot và biểu thức select
- các switch `-O0` là các jump table trên x86-64 và các chuỗi so sánh trên AArch64
- switch `digest` là một jump table, rồi một bảng tra cứu với hệ số được gộp 16, rồi một jump table với bốn đích phân biệt trên x86-64, và một cây so sánh với kiểm tra phạm vi 9 đến 10 trên AArch64
- `-fno-jump-tables` tạo các cây so sánh, và `dispatch` 16 case đọc các đích của nó từ relocation trên x86-64 và từ một bảng byte nén trên AArch64
- vòng lặp vector báo cáo 4 lane, 2 bộ tích lũy, 8 phần tử mỗi vòng lặp, mask, điều kiện bảo vệ, phép rút gọn và vòng lặp phần dư
- các vòng lặp số lượt cố định được vector hóa hoàn toàn hoặc unroll hoàn toàn, và `-fno-vectorize` unroll theo 8
- `-O1` không có vector hóa, `-O2` và `-O3` giống hệt trên x86-64, và trên AArch64 chúng chỉ khác ở `call_switch`, nơi `-O3` có 17 chỉ lệnh và `-O2` có 18
- `-fno-builtin` biến vòng lặp lưu thành một vòng lặp lưu được vector hóa và giữ `memcpy` là một lần gọi
- các tail call, thay thế `memset`, bản sao 16 byte inline và bản sao hai lần chuyển `-O0` được nhận dạng
- callee inline được tìm từ `-O1` qua dạng thân của nó
- các select giải mã thành `a > b ? a : b`, `-x < 0 ? x : -x`, `(x > 0)` và `sum % 10 < 5 ? sum % 10 : 5`
- stack protector báo cáo `%fs:0x28`, slot và `__stack_chk_fail`, và `endbr64` được báo cáo trên mọi hàm của bản build CET
- source parser đọc các tham số con trỏ hàm, các case switch, các lần gọi và các tên bộ tích lũy
- mọi mẫu trong mọi bản build được xác minh và các ma trận loại khớp
- hình tương tác nhúng cùng dữ liệu mà phân tích tạo ra

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Nhân với một hằng số lẻ lớn | "nhân với 1717986919" | Hằng số là `ceil(2^s / d)` cho một `d`, sai số đáp ứng cận và độ dịch là độ dịch hợp lệ nhỏ nhất |
| Sửa cộng sau một độ dịch 32 bit | Năm chỉ lệnh số học | Hệ số nhân rộng 33 bit và đuôi là dạng cộng của cùng phương pháp |
| Cùng hệ số nhân, độ dịch khác | Cùng số chia | Độ dịch chọn số chia: 34 là 10, 33 là 5 |
| Modulo có dấu với lũy thừa hai | "cộng 7, mask, trừ" | Thiên lệch làm tròn về không và kết quả là `x % 8` |
| Lần tải có chỉ số từ `.rodata` | "một jump table" | Một bảng tra cứu giá trị, với các mục đọc từ các byte tại addend cộng 4 |
| Số học affine và một `cmov` | "tính 10k + 10" | Một switch được hạ thành một ánh xạ tuyến tính, được xác minh với mọi case nguồn |
| Chuỗi so sánh với các lần tách có thứ tự | "một chuỗi if" | Một tìm kiếm nhị phân trên các hằng số case với các pivot được nêu tên |
| Nhánh ngược tới một khối mặc định | "một vòng lặp" | Đích rời vùng bằng một bước nhảy vô điều kiện; nó là một đuôi dùng chung |
| Hai back edge trong một hàm | "hai vòng lặp" | Một vòng lặp nguồn: thân vector và phần dư vô hướng của nó |
| `jmp memset@PLT` không có `ret` | "hàm không có lần trả về" | Một tail call trả về qua callee, thay thế một vòng lặp lưu |
| Callee thiếu khỏi call graph | "không bao giờ được gọi" | Inline: dạng thân của callee xuất hiện trong caller |
| Lần tải và so sánh `%fs:0x28` | "đọc dữ liệu thread-local" | Canary stack protector, với đường thất bại tới `__stack_chk_fail` |
| Bốn byte lạ ở điểm bắt đầu hàm | "dữ liệu trước hàm" | `endbr64`, landing pad CET |
| Decompiler hiển thị số học thô | "công cụ sai" | Công cụ không áp dụng một phép gộp; phép suy ra cho dạng nguồn và đầu ra được trích ghi khoảng trống |

## Operational Rule

Khớp dạng, chạy ngược phép suy ra và viết các hằng số chứng minh nó. Báo cáo mọi mẫu với các địa chỉ bằng chứng và dạng nguồn đã giải mã của nó, xác minh mỗi mẫu với nguồn bạn đã biên dịch và trích những gì mỗi decompiler in cho cùng các byte.

## Further Reading

- [Granlund, Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994)](https://gmplib.org/~tege/divcnst-pldi94.pdf)
- [Warren, Hacker's Delight, 2nd edition, Chapter 10: Integer Division By Constants](https://www.informit.com/store/hackers-delight-9780321842688)
- [Lemire, Kaser, Kurz, "Faster Remainder by Direct Computation" (2019)](https://arxiv.org/abs/1902.01961)
- [libdivide, header-only division by runtime constants](https://github.com/ridiculousfish/libdivide)
- [LLVM `DivisionByConstantInfo.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Support/DivisionByConstantInfo.cpp)
- [LLVM `SwitchLoweringUtils.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/SwitchLoweringUtils.cpp) và [`TargetLoweringBase.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/TargetLoweringBase.cpp)
- [LLVM `SimplifyCFG.cpp`, `simplifySwitchLookup`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Utils/SimplifyCFG.cpp)
- [Tài liệu Auto-Vectorization LLVM](https://llvm.org/docs/Vectorizers.html) và [ghi chú phát hành LLVM 3.4](https://releases.llvm.org/3.4/docs/ReleaseNotes.html)
- [LLVM `LoopIdiomRecognize.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Transforms/Scalar/LoopIdiomRecognize.cpp)
- [LLVM `X86CmovConversion.cpp`](https://github.com/llvm/llvm-project/blob/release/20.x/llvm/lib/Target/X86/X86CmovConversion.cpp)
- [LLVM `StackProtector.cpp`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/CodeGen/StackProtector.cpp) và [`X86ISelLoweringCall.cpp`, `getIRStackGuard`](https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86ISelLoweringCall.cpp)
- [glibc `sysdeps/x86_64/nptl/tls.h`, `tcbhead_t`](https://sourceware.org/git/?p=glibc.git;a=blob;f=sysdeps/x86_64/nptl/tls.h)
- [GCC `tree-switch-conversion.cc`](https://github.com/gcc-mirror/gcc/blob/master/gcc/tree-switch-conversion.cc), [Các tùy chọn tối ưu hóa GCC](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html) và [ghi chú phát hành GCC 12](https://gcc.gnu.org/gcc-12/changes.html)
- [Ghidra decompiler `ruleaction.cc`](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/decompile/cpp/ruleaction.cc)
- [angr decompiler documentation](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [radare2 book: decompilers](https://book.rada.re/arch/decompile.html)
- [Compiler Explorer API](https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md)
- [Godbolt, "Optimizations in C++ Compilers: A practical journey", ACM Queue 17(5), 2019](https://queue.acm.org/detail.cfm?id=3372264)
- [Microsoft, `/GS` (Buffer Security Check)](https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check)
