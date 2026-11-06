# Lifting to Pseudocode: IR, SSA, and Structuring From Scratch

> Đầu ra decompiler là một khẳng định với một phép suy ra ẩn. Khi bạn tự xây dựng phép suy ra, mỗi dòng của đầu ra đó trở thành một thứ bạn có thể kiểm tra.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow)
**Time:** ~150 minutes

## Learning Objectives

- Nâng các chỉ lệnh x86-64 đã giải mã lên một IR nhỏ với cờ, tải, lưu, nhánh, lần gọi và lần trả về tường minh.
- Biến các slot khung thành biến cục bộ và các thanh ghi đối số System V thành tham số.
- Xây dựng SSA tối thiểu với các hàm phi trên các dominance frontier, rồi thế, đơn giản hóa và loại bỏ mã chết.
- Khôi phục `if`, `if` với `else`, `while` và `do while` từ đồ thị luồng điều khiển bằng post-dominator và back edge.
- Giải thích phép nhân với `0x66666667` là một phép chia cho 10 và chứng minh đồng nhất thức.
- Đọc mã giả Ghidra cho cùng các hàm từng dòng và nêu tên chỉ lệnh, hoặc phỏng đoán, đằng sau mỗi khác biệt.

## The Problem

Bạn yêu cầu rea cung cấp mã giả của `percent_change` trong `ledger-x86_64-O1.o`. Ghidra 12.1.4 trả lời trong khoảng mười giây:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)

{
  long lVar1;
  undefined1 auVar2 [16];
  undefined1 auVar3 [16];
  
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  auVar2._8_8_ = 0;
  auVar2._0_8_ = param_3;
  return auVar2 << 0x40;
}
```

Nguồn dài bốn dòng. Nó nhận hai giá trị `int` và trả về một `int`. Ghidra báo cáo một giá trị trả về 16 byte và một tham số thứ ba mà nguồn không có. Mười sáu byte mã máy là đúng, và Ghidra giải mã đúng từng byte. Chữ ký là một phỏng đoán, và không có gì trong văn bản đánh dấu nó như vậy.

rea trả về văn bản này như kết quả `procedure_pseudo_code` và đính kèm một giới hạn vào bản ghi. Giới hạn ghi "Mã giả là đầu ra decompiler Ghidra, không phải nguồn gốc và không tương đương văn bản với đầu ra Hopper". Công cụ `compare_functions` diff mã giả như các dòng văn bản. Bản ghi chiều của chính nó nói "Assembly là văn bản provider mờ đục" và rằng chuẩn hóa relocation không có sẵn. rea không thể nhìn bên trong văn bản, và một agent chỉ đọc nó cũng không thể.

Bản ghi DX-Ball của rea cho thấy chi phí. Kết quả decompiler đầu tiên là `FUN_00406400(void)` gọi `__ftol()`. Góc nhìn chỉ lệnh cho thấy một đầu vào stack và một biểu thức x87. Agent chỉ tiếp tục vì hai góc nhìn bất đồng.

Bài học này xây dựng phép suy ra mà decompiler che giấu. Bạn bắt đầu từ 56 chỉ lệnh mà bài 33 đã giải mã, nâng chúng lên một IR, đổi tên sang SSA, đơn giản hóa và cấu trúc hóa. Rồi bạn đặt mã giả của bạn cạnh mã của Ghidra cho `percent_change`, `grade` và `total`, và giải trình mỗi khác biệt. Các bài kiểm tra biên dịch đầu ra của bạn bằng clang và chạy nó đối chiếu nguồn trên một lưới đầu vào.

```figure
lifting-stages-percent-change
```

## The Fixture and the Oracle

`code/fixtures/ledger.c` là fixture chung của phần này của khóa học:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (after - before) * 100 / before;
}

int grade(int score) {
    switch (score / 10) {
    case 10:
    case 9: return 4;
    case 8: return 3;
    case 7: return 2;
    case 6: return 1;
    default: return 0;
    }
}

int total(const int *values, int count) {
    int sum = 0;
    for (int i = 0; i < count; i++) sum += values[i];
    return sum;
}
```

`grade_label` cũng có trong tệp và trong object, và demo cũng nâng nó. Ba hàm ở trên là những hàm mà bài học này kiểm tra.

Object được dựng bằng `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c`. Object `-O0` nằm bên cạnh nó cho phần slot stack. `code/fixtures/README.md` liệt kê cả hai lệnh, SHA-256 của mỗi object và lệnh rea tạo ra các fixture Ghidra. Bản build có thể tái tạo từng byte trên toolchain đã ghim.

Oracle cho decoder là `llvm-objdump -d -r`. Văn bản của nó cho cả hai object được commit dưới dạng `ledger-x86_64-O1.objdump.txt` và `ledger-x86_64-O0.objdump.txt`. Một bài kiểm tra phân tích các tệp đó và so sánh mỗi chỉ lệnh theo địa chỉ, theo byte và theo văn bản AT&T. Điều đó bao quát cả 56 chỉ lệnh ở `-O1` và mọi chỉ lệnh ở `-O0`. Khi `llvm-objdump` được cài tại đường dẫn đã ghim, một bài kiểm tra thứ hai chạy nó trực tiếp và so sánh lại.

Đây là `percent_change` như oracle in nó:

```text
0000000000000000 <percent_change>:
       0: 85 ff                        	testl	%edi, %edi
       2: 74 09                        	je	0xd <percent_change+0xd>
       4: 29 fe                        	subl	%edi, %esi
       6: 6b c6 64                     	imull	$0x64, %esi, %eax
       9: 99                           	cltd
       a: f7 ff                        	idivl	%edi
       c: c3                           	retq
       d: 31 c0                        	xorl	%eax, %eax
       f: c3                           	retq
```

## Stage 1: Bytes to Instructions

Bài 33 xây dựng decoder. Bài học này giữ một bản sao nhỏ để mã chạy độc lập. Bản sao bao quát chính xác các opcode mà clang phát ra cho `ledger.c` ở `-O0` và `-O1`. Với bất cứ thứ gì khác, nó phát sinh `DecodeError` với địa chỉ và byte opcode.

Decoder theo thứ tự byte của Intel SDM, Tập 2, mục 2.1. Prefix đến trước, rồi opcode, rồi ModR/M, rồi SIB, rồi displacement, rồi immediate. Mục 2.2.1 thêm REX prefix, một byte từ `0x40` đến `0x4F`, phải nằm ngay trước opcode. REX.W chọn một toán hạng 64 bit, REX.R mở rộng trường `reg`, REX.X mở rộng SIB index, và REX.B mở rộng `r/m` hoặc SIB base. Mục 2.1.3 định nghĩa ba trường ModR/M `mod`, `reg` và `r/m`, và ba trường SIB `scale`, `index` và `base`. Ở chế độ 64 bit, `mod = 00` với `r/m = 101` nghĩa là một displacement 32 bit tương đối với chỉ lệnh tiếp theo (mục 2.2.1.6).

| Byte opcode | Dạng | Ví dụ fixture |
|---|---|---|
| `01 29 31 39 85 89` | `op Ev, Gv` | `29 fe` `subl %edi, %esi` |
| `03 2b 3b 8b 8d` | `op Gv, Ev` | `03 04 97` `addl (%rdi,%rdx,4), %eax` |
| `63` với REX.W | `movsxd Gv, Ev` | `48 63 c7` `movslq %edi, %rax` |
| `69` và `6b` | `imul Gv, Ev, imm` | `48 69 c0 67 66 66 66` |
| `83 /0 /5 /7` | `add sub cmp Ev, imm8` | `83 c1 fa` `addl $-0x6, %ecx` |
| `c1 /5 /7` | `shr sar Ev, imm8` | `48 c1 f9 22` `sarq $0x22, %rcx` |
| `f7 /7` | `idiv Ev` | `f7 ff` `idivl %edi` |
| `ff /0 /4` | `inc Ev`, `jmp Ev` | `48 ff c2` `incq %rdx` |
| `70` đến `7f`, `eb`, `e8` | `jcc rel8`, `jmp rel8`, `call rel32` | `74 09` `je 0xd` |
| `99`, `c3`, `90`, `0f 1f` | `cltd`, `retq`, `nop` | `66 0f 1f 44 00 00` `nopw (%rax,%rax)` |

`leaq (%rip), %rcx` tại `grade+0x23` là bảy byte với một displacement bằng không. Object mang một relocation `R_X86_64_PC32.rodata+0x10` tại offset `0x36`, trường displacement. Lifter phân giải nó ở giai đoạn 3.

## Stage 2: Blocks and Dominators

Một basic block là một chuỗi câu lệnh với một điểm vào ở đầu và một điểm ra ở cuối. Đó là định nghĩa từ Allen (1970), và mọi bài báo decompiler tái sử dụng nó. `build_blocks()` thu thập leader: điểm vào hàm, mọi đích nhảy bên trong hàm và mọi địa chỉ sau một bước nhảy hoặc lần trả về. Mỗi khối nhận các kế nhiệm từ chỉ lệnh cuối của nó. Một bước nhảy có điều kiện có hai kế nhiệm và một `jmp` có một. Một `ret` không có, và một khối kết thúc bằng một chỉ lệnh thông thường đi tiếp xuống leader tiếp theo.

`total` ở `-O1` có năm khối:

| Khối | Chỉ lệnh | Kế nhiệm |
|---|---|---|
| `0x40` | `testl %esi, %esi` rồi `jle 0x5c` | `0x5c`, `0x44` |
| `0x44` | `movl %esi, %ecx`, `xorl %edx, %edx`, `xorl %eax, %eax`, `nopw` | `0x50` |
| `0x50` | `addl (%rdi,%rdx,4), %eax`, `incq %rdx`, `cmpq %rdx, %rcx`, `jne 0x50` | `0x50`, `0x5b` |
| `0x5b` | `retq` | thoát |
| `0x5c` | `xorl %eax, %eax` rồi `retq` | thoát |

`immediate_dominators()` là thuật toán lặp của Cooper, Harvey và Kennedy (2001). Nó duyệt các khối theo reverse postorder và lấy giao các dominator của các tiền nhiệm đã xử lý cho đến khi không có gì thay đổi. Trên các đồ thị nhỏ thế này, nó hoàn thành trong hai lượt. Với `total`, nó nói rằng `0x44` chi phối `0x50`. Nó cũng nói rằng `0x50` chi phối chính nó qua back edge, đó là cách giai đoạn 8 tìm vòng lặp.

Cùng hàm chạy thêm hai lần. `dominance_frontiers()` sử dụng nó cho SSA ở giai đoạn 5. `post_dominators()` chạy nó trên đồ thị đảo ngược với một nút thoát ảo để tìm các điểm nối ở giai đoạn 8.

## Stage 3: Lifting to a Small IR

IR có sáu loại câu lệnh: `Assign`, `Store`, `Branch`, `Jump`, `IndirectJump` và `Return`. Biểu thức là hằng số, biến, phép toán nhị phân với một chiều rộng, phép ép kiểu (`sext`, `zext`, `trunc`) và các lần tải. Thêm năm dạng chỉ tồn tại để được đơn giản hóa loại đi sau: `Flags`, `Cond`, `Concat`, `SignFill` và `Symbolic`.

Các thanh ghi là các biến được đặt tên theo họ 64 bit của chúng. Một lần ghi vào `%eax` là một `Assign` vào `rax` với chiều rộng 32, và một lần đọc `%eax` là một lần đọc `rax` ở chiều rộng 32. Ở chế độ 64 bit, một lần ghi 32 bit mở rộng bằng không vào toàn thanh ghi, nên một lần đọc 64 bit sau đó của cùng giá trị là một `zext`. Lifter không biết định nghĩa vươn tới, nên nó ghi chiều rộng đọc và để SSA chèn phép ép kiểu ở giai đoạn 5.

| Chỉ lệnh | Câu lệnh IR |
|---|---|
| `subl %edi, %esi` | `flags = cmp(esi, edi)` rồi `esi = esi - edi` |
| `testl %edi, %edi` | `flags = test(edi, edi)` |
| `je 0xd` | `if je(flags) goto 0xd else goto 0x4` |
| `xorl %eax, %eax` | `eax = 0` |
| `cltd` | `edx = signfill(eax)` |
| `idivl %edi` | `dividend = edx:eax`, `eax = dividend / edi`, `edx = dividend % edi` |
| `movslq %edi, %rax` | `rax = sext64(edi)` |
| `sarq $0x22, %rcx` | `rcx = rcx >>s 34` |
| `shrq $0x3f, %rax` | `rax = rax >>u 63` |
| `addl (%rdi,%rdx,4), %eax` | `flags = add(eax, load32(rdi + rdx * 4))` rồi `eax = eax + load32(rdi + rdx * 4)` |
| `leaq (%rip), %rcx` với relocation của nó | `rcx = &.rodata+0x14` |
| `pushq %rbp`, `movq %rsp, %rbp`, `subq $0x10, %rsp`, `popq %rbp` | không có gì, ghi sổ khung |
| `retq` | `return rax` |

### Flags are a variable

Mọi chỉ lệnh đặt các mã điều kiện ghi một biến tên `flags`, và mọi bước nhảy có điều kiện đọc nó. Một `cmp a, b` ghi `cmp(a, b)`, một `test a, b` ghi `test(a, b)`, và `sub` ghi cùng dạng `cmp` như một tác dụng phụ. Một `jcc` trở thành `Branch(Cond(cc, flags), target, fallthrough)`. Mã điều kiện quyết định toán tử so sánh khi hai thứ gặp nhau ở giai đoạn 6:

| Mã | Sau `cmp(a, b)` | Sau `test(a, a)` |
|---|---|---|
| `je` | `a == b` | `a == 0` |
| `jne` | `a != b` | `a != 0` |
| `jl`, `jge`, `jle`, `jg` | có dấu `<`, `>=`, `<=`, `>` | so sánh có dấu với 0 |
| `jb`, `jae`, `jbe`, `ja` | không dấu `<`, `>=`, `<=`, `>` | so sánh không dấu với 0 |

`xorl %eax, %eax` được nâng thẳng thành `eax = 0`. Các cờ nó đặt được viết dưới dạng cờ kiểu `add` mà không bước nhảy nào trong fixture đọc. Mẫu `xor` quan trọng trong `grade`, nơi Ghidra đã làm mất nó.

### cltd and idiv

`cltd` điền `%edx` bằng bit dấu của `%eax`. `idivl %edi` chia cặp 64 bit `%edx:%eax` cho `%edi`, đặt thương vào `%eax` và phần dư vào `%edx`. Lifter ghi cặp vào một biến tạm tên `dividend` trước. Câu lệnh phần dư sau đó đọc `%eax` cũ chứ không phải thương mới. Trong SSA, nửa cao xuất hiện dưới dạng `signfill` của nửa thấp. Bộ đơn giản hóa rút cặp về nửa thấp, và phép chia trở thành một `/` 32 bit.

### Stack slots at -O0

Ở `-O0`, clang giữ mọi biến cục bộ trong khung. `percent_change` lưu `%edi` vào `-0x8(%rbp)` và `%esi` vào `-0xc(%rbp)`, rồi đọc lại chúng cho mỗi lần dùng. Lifter theo dõi `pushq %rbp` theo sau bởi `movq %rsp, %rbp`. Sau prologue đó, một toán hạng bộ nhớ có base `%rbp`, không index và một displacement trở thành một biến tên `local_<hex>`. `-0x8(%rbp)` là `local_8`, `-0xc(%rbp)` là `local_c`.

Bản thân các chỉ lệnh khung không tạo IR, và `subq` cùng `addq` trên `%rsp` cũng không. Mọi toán hạng bộ nhớ khác vẫn là một `Load` hoặc `Store`.

### Relocations

`leaq (%rip), %rcx` trong `grade` có displacement bằng không trong tệp. Relocation tại offset `0x36` nói `R_X86_64_PC32.rodata+0x10`. Linker sẽ ghi `S + A - P` vào trường. `S` là địa chỉ của `.rodata`, `A` là addend `0x10` và `P` là địa chỉ của trường. Chỉ lệnh sau đó tính `next_ip + disp = (P + 4) + S + A - P = S + A + 4`.

Lifter áp dụng cùng phép tính mà không có linker. Offset đích là addend cộng khoảng cách từ trường đến cuối chỉ lệnh, `0x10 + 4 = 0x14`. IR nói `rcx = &.rodata+0x14`, và bảng ở đó chứa năm giá trị `int` `1, 2, 3, 4, 4`.

## Stage 4: Parameters From the Calling Convention

System V AMD64 psABI, mục 3.2.3, truyền các đối số lớp INTEGER trong `%rdi`, `%rsi`, `%rdx`, `%rcx`, `%r8`, `%r9`, theo thứ tự đó. Kết quả trả về trong `%rax` rồi `%rdx`. Mục 3.2.1 nói rằng `%rbp`, `%rbx` và `%r12` đến `%r15` thuộc caller và phải được bảo toàn. Mọi thứ khác thuộc callee.

`collect_params()` áp dụng một quy tắc: một thanh ghi đối số được đọc trước mọi lần ghi trong hàm là một tham số. Thanh ghi cao nhất như vậy cố định số lượng, nên một hàm đọc `%rsi` và không bao giờ đọc `%rdi` vẫn có hai tham số. `percent_change` đọc `%edi` và `%esi`, nên nó có `param_1` và `param_2`. `grade` chỉ đọc `%edi`. `total` đọc `%rdi` như một base 64 bit và `%esi` như một count 32 bit.

Giờ `param_3` của Ghidra có một lời giải thích. `idivl` ghi `%rdx`, và psABI cho phép một giá trị trả về INTEGER 128 bit trong `%rax:%rdx`. Trong một tệp object không có caller để nói giá trị trả về rộng bao nhiêu. Ghidra giữ cả hai thanh ghi làm giá trị trả về.

Trên đường bằng không, `xorl %eax, %eax` chỉ ghi `%eax`. Ghidra đọc `%rdx` ở đó như một đầu vào của hàm, và đầu vào đó trở thành `param_3`. Các chỉ lệnh đúng. Chữ ký là một phỏng đoán về những phần mà các chỉ lệnh để mở.

## Stage 5: SSA, One Name per Definition

Sau khi nâng, `grade` ghi `rax` bốn lần và `rcx` ba lần. Cytron, Ferrante, Rosen, Wegman và Zadeck (1991) định nghĩa dạng static single assignment. Mỗi biến được gán chính xác một lần, và các hàm phi tại các điểm nối chọn giữa các định nghĩa vươn tới chúng. Cách xây dựng của họ có hai bước. Mục 5.1 đặt các hàm phi bằng dominance frontier, và mục 5.2 đổi tên mọi định nghĩa và lần dùng bằng một phép duyệt cây dominator. `insert_phis()` và `rename()` theo hai mục đó.

Danh sách SSA của `total` cho thấy điều cách xây dựng tạo ra:

```text
block 0x44 -> 0x50
  ecx_1 = esi_0
  edx_1 = 0
  eax_1 = 0
block 0x50 -> 0x50, 0x5b
  eax_2 = phi(0x44: eax_1, 0x50: eax_3)
  rdx_2 = phi(0x44: edx_1, 0x50: rdx_3)
  flags_2 = phi(0x44: flags_1, 0x50: flags_5)
  flags_3 = add(eax_2, load32(rdi_0 + rdx_2 * 4))
  eax_3 = eax_2 + load32(rdi_0 + rdx_2 * 4)
  flags_4 = inc(rdx_2, 1)
  rdx_3 = rdx_2 + 1
  flags_5 = cmp(zext64(ecx_1), rdx_3)
  if jne(flags_5) goto 0x50 else goto 0x5b
```

Phiên bản 0 của một thanh ghi là giá trị của nó tại điểm vào. `esi_0` và `rdi_0` là các tham số. Loop header `0x50` có hai tiền nhiệm, khối thiết lập và chính nó, nên mọi biến có một định nghĩa trong vòng lặp nhận một phi ở đó. Phi `flags_2` chết ngay khi đến. SSA tối thiểu đặt nó vì `flags` có các định nghĩa trong cả hai tiền nhiệm, và giai đoạn 6 loại nó vì không có gì đọc nó.

Bước đổi tên cũng sửa chiều rộng. `edx_1 = 0` là một định nghĩa 32 bit và `rdx_3 = rdx_2 + 1` là 64 bit, nên phi `rdx_2` lấy chiều rộng lớn hơn. Lần đọc `%rcx` trong `cmpq %rdx, %rcx` là 64 bit trong khi định nghĩa của nó `ecx_1 = esi_0` là 32 bit, nên lần dùng trở thành `zext64(ecx_1)`. Mọi phép ép kiểu trong mã giả cuối đến từ một quy tắc này.

Phần "lite" là cách ra khỏi SSA. `coalesce_webs()` nối mỗi phi với các đối số của nó thành một biến, gọi là một web, và cho web một tên. Điều này hoạt động cho các dạng mà một compiler phát ra cho các hàm này. Nó có thể hỏng trên các bản sao song song, nơi hai phi tại một điểm nối trao đổi các giá trị, và bài học không xử lý trường hợp đó. Mục 7 của Cytron mô tả lối ra tổng quát qua tô màu.

## Stage 6: Simplify, Substitute, Remove Dead Code

`optimize()` lặp lại ba lượt cho đến khi không có gì thay đổi. Bộ đơn giản hóa viết lại các biểu thức từ dưới lên với các quy tắc này:

| Trước | Sau |
|---|---|
| `Cond(je, cmp(a, b))` | `a == b`, và tương tự cho chín mã khác |
| `Cond(jle, test(a, a))` | `a <= 0` |
| `x + (-6)` | `x - 6` |
| `trunc32(zext64(x))` khi `x` là 32 bit | `x` |
| `trunc32(a + b)` trên các toán hạng 64 bit | `trunc32(a) + trunc32(b)` |
| `(signfill(x): x) / d` | `x / d` ở chiều rộng 32 |
| `load32(base + idx * 4)` | `base[idx]` |
| `trunc32(p >>s 34) + trunc32(p >>u 63)` với `p = sext64(x) * 0x66666667` | `x / 10` |

Thế tiến chuyển một định nghĩa vào lần dùng duy nhất của nó. Quy tắc có ba điều kiện. Lần dùng nằm trong cùng khối. Lần dùng là một câu lệnh chứ không phải một phi. Khi định nghĩa chứa một lần tải, không có lần lưu hoặc lần gọi nào nằm giữa định nghĩa và lần dùng. Một hằng số hoặc một địa chỉ section được thế ở mọi nơi trừ vào một phi, vì một đối số phi phải giữ là một biến cho web.

Loại bỏ mã chết xóa một phép gán hoặc một phi có đích không có lần dùng và có biểu thức không có lần gọi. Thứ tự các lượt quan trọng. Trong `percent_change`, phần dư `edx_2 = dividend_1 % edi_0` là chết, nên nó đi trước. Điều đó để `edx_1 = signfill(eax_1)` có một lần dùng, nên nó được thế vào `dividend_1 = edx_1:eax_1`.

Quy tắc cặp sau đó rút `signfill(eax_1):eax_1` về `eax_1`, và phép chia trở thành `eax_1 / edi_0`. Giờ `eax_1 = esi_1 * 100` có một lần dùng, và `esi_1 = esi_0 - edi_0` có một lần dùng, và cả hai chuyển vào câu lệnh trả về. Các định nghĩa `flags` đã được thế vào các điều kiện nhánh và biến mất. Bốn chỉ lệnh trở thành một dòng:

```c
return (param_2 - param_1) * 100 / param_1;
```

### The 0x66666667 multiply

`grade` chia score cho 10, và clang không phát ra `idiv`. Nó phát ra `imulq $0x66666667, %rax, %rax`, rồi `sarq $0x22, %rcx` trên một bản sao, rồi `shrq $0x3f, %rax`, rồi cộng hai giá trị. Granlund và Montgomery, "Division by Invariant Integers using Multiplication" (PLDI 1994), mô tả phương pháp. Compiler chọn một hệ số nhân `m` và một độ dịch `s`. Với mọi `x` trong phạm vi, `(x * m) >> s` phải bằng `x / d`.

Ở đây `m = 0x66666667 = 1717986919` và `s = 34`. Phép tính đúng: `2^34 / 10 = 1717986918.4`, và giá trị trần là `1717986919`. Sai số là `m * 10 - 2^34 = 6`. Để đồng nhất thức đúng trên mọi `x` 32 bit, sai số nhân `2^31` phải giữ dưới `2^34`, nên sai số phải tối đa 8. Sáu tối đa là tám, nên `(x * m) >> 34` bằng `floor(x / 10)` với mọi `int` không âm.

Với `x` âm, floor làm tròn ra xa không trong khi C làm tròn về không. `shrq $0x3f` trích bit dấu của tích, bằng 1 chính xác khi `x` âm. Cộng nó sửa việc làm tròn.

`magic_divisor(m, s)` kiểm tra một cặp ứng viên. Nó tính `d` là thương nguyên của `2^s` cho `m` và thử `d` cùng `d + 1`. Nó chỉ chấp nhận một `d` khi `m` bằng giá trị trần của `2^s / d` và cận sai số đúng. Cùng hệ số nhân với `s = 33` cho `d = 5`, điều đó đúng, vì `0x66666667` cũng là giá trị trần của `2^33 / 5`. Một bài kiểm tra kiểm tra đồng nhất thức với `c_div(x, 10)` trên 2,406 giá trị bao gồm cả hai đầu của phạm vi `int`.

Khi bật nhận dạng, `grade` đọc là `ecx_1 = param_1 / 10 - 6;`. Khi tắt nhận dạng, demo in dạng thô:

```c
rax_1 = (long)param_1 * 0x66666667;
ecx_1 = (int)(rax_1 >> 34) + (int)((unsigned long)rax_1 >> 63) - 6;
```

Cả hai biên dịch và cả hai tính cùng các giá trị. Giữ công tắc. Khi bạn đọc mã từ một compiler bạn chưa nghiên cứu, dạng thô là dạng trung thực.

## Stage 7: Types From Use

Mã máy có chiều rộng và không có kiểu. `infer_types()` biến ba loại bằng chứng thành các kiểu C. Một web có các định nghĩa rộng 32 bit là `int`, và một web 64 bit là `long`. Một web là base của một truy cập phần tử `base[idx]` với các phần tử 4 byte là `int *`. Kiểu con trỏ lan dọc theo các bản sao và phi, nên `local_8 = param_1` ở `-O0` làm cả hai thành `int *`. Kiểu trả về là chiều rộng của giá trị trong các câu lệnh `return`.

Kết quả cho `total` là `int total(int *param_1, int param_2)`. Ghidra viết `int total(long param_1,uint param_2)`. Cả hai nhất quán với các chỉ lệnh. Lifter sử dụng lần tải có tỷ lệ làm bằng chứng con trỏ. Ghidra giữ chiều rộng thanh ghi và viết truy cập là `*(int *)(param_1 + uVar2 * 4)`. Không bên nào thấy được `const`, và không bên nào phân biệt được `int *` với `unsigned *`.

Lee, Avgerinos và Brumley (TIE, NDSS 2011) định hình khôi phục kiểu như giải ràng buộc trên một lattice. Kết quả là một cận trên và một cận dưới thay vì một phỏng đoán. Noonan, Loginov và Cok (Retypd, PLDI 2016) thêm tính đa hình và đệ quy. Họ báo cáo recall 98 phần trăm trên các chú thích con trỏ `const` từ các mẫu mà compiler để lại. Bài học này sử dụng hai quy tắc rẻ nhất từ dòng nghiên cứu đó và nêu tên những gì chúng không thể thấy.

Số học không dấu được giữ trong các biểu thức chứ không trong các kiểu biến. `ja` sau `cmpl $0x4, %ecx` in là `(unsigned int)ecx_1 > 4`, và `shrq` in là `(unsigned long)rax_1 >> 63`. Các biến giữ có dấu để người đọc thấy giá trị thanh ghi và một nơi mà chỉ lệnh coi nó là không dấu.

## Stage 8: Structuring From the Graph

Cifuentes (1994), chương 6, khớp các vùng của đồ thị với các dạng của một ngôn ngữ cấp cao. Vòng lặp đến trước (6.6.1), rồi điều kiện hai nhánh (6.6.2), rồi điều kiện n nhánh (6.6.3). Yakdan, Eschweiler, Gerhards-Padilla và Smith (NDSS 2015) đi đường khác. Họ suy ra điều kiện mà theo đó mỗi nút thực thi và xây dựng cấu trúc từ các điều kiện đó, không có dạng cố định. Động lực của họ là một phép đo. Hex-Rays trên một mẫu tạo ra 1,571 câu lệnh `goto` trong 49,514 dòng, một trên 32 dòng, và việc cấu trúc hóa của họ không tạo ra câu nào trên 1,530 hàm coreutils.

`structure()` là một thành viên nhỏ của họ đầu tiên. Nó cần hai sự kiện từ giai đoạn 2. Immediate post-dominator của một khối kết thúc bằng một `Branch` là điểm nối của điều kiện. Một back edge là một cạnh đến một khối chi phối nguồn của nó. Natural loop là tập các khối đến nguồn back edge mà không đi qua header.

Với một `Branch` có điểm nối `j`:

- Nếu `j` là đích nhảy, phát ra `if (!cond) { fallthrough region }` và tiếp tục tại `j`.
- Nếu `j` là fallthrough, phát ra `if (cond) { target region }` và tiếp tục tại `j`.
- Nếu `j` là điểm thoát hàm, cả hai nhánh trả về. Phát ra nhánh nhỏ hơn dưới dạng `if (cond) {... }` và nhánh kia sau nó, không có một `else`. Đây là lần trả về sớm trong `percent_change` và `total`.
- Nếu không, phát ra `if (cond) { target } else { fallthrough }` và tiếp tục tại `j`. Đây là `percent_change` ở `-O0`, nơi cả hai nhánh lưu `local_4` và gặp nhau tại epilogue.

Với một loop header:

- Nếu header kết thúc bằng một `Branch` có một kế nhiệm ngoài vòng lặp, phát ra `while (cond) { body }`. `total` ở `-O0` có dạng này: header so sánh `local_14` với `local_c` và rời trên `jge`.
- Nếu header cũng là khối có back edge, hoặc thay vào đó latch thoát, phát ra `do { body } while (cond);`. `total` ở `-O1` có dạng này: khối `0x50` cộng, tăng, so sánh và nhảy tới chính nó.

Một `IndirectJump` kết thúc một khối không có kế nhiệm. `grade` ở `-O0` là một jump table thực, `jmpq *%rax` qua năm offset tương đối tại `.rodata+0x0`, và bài 33 phân giải các đích đó. Ở đây lifter in một ghi chú thay thế. Bốn khối tại `0x76`, `0x7f`, `0x88` và `0x91` chỉ được tới qua bước nhảy gián tiếp và chưa được nâng. Bài thực hành thêm `switch`.

### What -O1 did to the switch

Ở `-O1`, clang không giữ một jump table cho `grade`. Nó tính `score / 10 - 6` và so sánh kết quả với 4 như một số không dấu. Rồi nó tải giá trị trả về từ một bảng năm mục `int` tại `.rodata+0x14`. So sánh không dấu là một chỉ lệnh bao quát cả `score / 10 < 6` và `score / 10 > 10`. Một hiệu âm là một giá trị không dấu lớn, nên nó thất bại cùng kiểm tra.

Bảng chứa `1, 2, 3, 4, 4` cho các thương 6 đến 10. `switch` với năm câu lệnh `return` trở thành một `if` và một lần đọc mảng. Lifter phát ra chính xác điều đó, và đặt tên bảng `lookup_14` theo offset section của nó.

Độ dài của bảng là một heuristic. `table_values()` đọc từ đầu bảng đến offset `.rodata` tiếp theo mà bất kỳ relocation `.text` nào tham chiếu, hoặc đến cuối section. Trong object này, offset được tham chiếu tiếp theo là `0x28`, bảng của `grade_label`, nên `lookup_14` có `(0x28 - 0x14) / 4 = 5` mục. So sánh không dấu với 4 đồng nhất. Ghidra cũng không biết độ dài. Nó viết `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, một địa chỉ byte cộng một offset, và để năm giá trị cho người đọc tra cứu.

## Side by Side With Ghidra

Demo in mỗi cặp. Văn bản Ghidra đến từ `code/fixtures/ghidra/*.json`, các bản ghi Evidence mà rea trả về ngày 2026-10-14. Lệnh là `npx -y rea-agents@6.5.0 decompile ledger-x86_64-O1.o <function> --provider ghidra --format json`. Mỗi bản ghi mang `confidence: observed` và `authority: shipped-artifact`. Văn bản được quan sát. Các khẳng định bên trong văn bản được suy ra, và các bản ghi không nói những khẳng định nào.

### percent_change

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int percent_change(int param_1, int param_2)   | undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{                                              | {
  if (param_1 == 0) {                          |   long lVar1;
    return 0;                                  |   undefined1 auVar2 [16];
  }                                            |   undefined1 auVar3 [16];
  return (param_2 - param_1) * 100 / param_1;  |   if (param_1 != 0) {
}                                              |     lVar1 = (long)((param_2 - param_1) * 100);
                                               |     auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
                                               |     auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
                                               |     return auVar3;
                                               |   }
                                               |   auVar2._8_8_ = 0;
                                               |   auVar2._0_8_ = param_3;
                                               |   return auVar2 << 0x40;
                                               | }
```

| Khác biệt | Chỉ lệnh hoặc phỏng đoán |
|---|---|
| Kiểu trả về `undefined1 [16]` so với `int` | Phỏng đoán. `idivl` ghi `%rax` và `%rdx`, và không caller nào cố định chiều rộng trả về. Cả hai thanh ghi được giữ. |
| `param_3` | Phỏng đoán suy ra từ điều đầu. Trên đường bằng không, chỉ `%eax` được ghi, nên `%rdx` được đọc như một đầu vào. |
| `lVar1 / (long)param_1 & 0xffffffff` so với `/ param_1` | Chỉ lệnh. `cltd` cộng `idivl` là một phép chia 64 bit của một giá trị 32 bit được mở rộng dấu, cắt xuống 32 bit. Cả hai văn bản mô tả nó. Văn bản của chúng ta rút cặp bằng quy tắc `signfill`. |
| Giữ `lVar1 % (long)param_1` | Suy ra từ kiểu trả về. Phần dư trong `%rdx` chết trong phân tích của chúng ta và sống trong phân tích của Ghidra. |
| `if (param_1 != 0)` với trường hợp bằng không sau nó | Thứ tự chỉ lệnh. `je 0xd` nhảy đến lần trả về không. Ghidra đặt nhánh được tính trước, chúng ta đặt nhánh nhỏ hơn trước. Cả hai đúng. |
| `return auVar2 << 0x40` | Phỏng đoán. Một giá trị 16 byte với `param_3` trong nửa thấp, được dịch vào nửa cao, là cách decompiler diễn đạt `%rax = 0` với `%rdx` chưa biết. |

Phiên bản được sửa trong `code/fixtures/ghidra/ledger-x86_64-O1.ghidra-repaired.c` chỉ chỉnh sửa hàm này, và bài kiểm tra so sánh nó với nguồn trên 81 cặp đầu vào.

### grade

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
static const int lookup_14[5] = {1, 2, 3, 4, 4}; | uint grade(int param_1)
int grade(int param_1)                         | {
{                                              |   uint uVar1;
  int eax_1;                                   |   uint uVar2;
  int ecx_1;                                   |   
                                               |   uVar2 = param_1 / 10 - 6;
  ecx_1 = param_1 / 10 - 6;                    |   uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  eax_1 = 0;                                   |   if (uVar2 < 5) {
  if ((unsigned int)ecx_1 <= 4) {              |     uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
    eax_1 = lookup_14[(unsigned long)(unsigned int)ecx_1]; |   }
  }                                            |   return uVar1;
  return eax_1;                                | }
}                                              |
```

| Khác biệt | Chỉ lệnh hoặc phỏng đoán |
|---|---|
| `param_1 / 10 - 6` trong cả hai | Chỉ lệnh. Cả hai nhận ra mẫu `0x66666667`. |
| `uVar1 = -(param_1 >> 0x1f) ^ (uint)(... >> 0x3f)` so với `eax_1 = 0` | Chỉ lệnh `xorl %eax, %eax` tại `grade+0x1a`. Thanh ghi bằng không. Ghidra diễn đạt `xor` là dấu của `param_1` exclusive-or bit dấu của tích, hai cách viết của cùng bit, và không triệt tiêu chúng. Giá trị là 0 cho mọi `int`, và bài kiểm tra chứng minh nó trên 141 điểm số. Một người đọc tin văn bản tin rằng mặc định phụ thuộc vào điểm số. |
| `uVar2 < 5` so với `(unsigned int)ecx_1 <= 4` | Chỉ lệnh `cmpl $0x4, %ecx` rồi `ja`. Cùng điều kiện. Ghidra gán kiểu `uVar2` là `uint`, chúng ta ép kiểu tại lần dùng. |
| `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)` so với `lookup_14[...]` | Chỉ lệnh cộng relocation. Ghidra tải object với `.rodata` tại `0x001000a0`, nên `0x001000b4` là `.rodata + 0x14`. Nó áp dụng relocation và giữ một địa chỉ byte. Chúng ta đặt tên bảng và đọc năm giá trị của nó. |
| Giá trị trả về `uint` so với `int` | Phỏng đoán ở cả hai bên. Các chỉ lệnh chỉ nói 32 bit. |

### total

```text
lifter                                         | ghidra
-----------------------------------------------+-----------------------------------------------
int total(int *param_1, int param_2)           | int total(long param_1,uint param_2)
{                                              | {
  int eax_1;                                   |   int iVar1;
  int ecx_1;                                   |   ulong uVar2;
  long rdx_1;                                  |   
                                               |   if (0 < (int)param_2) {
  if (param_2 <= 0) {                          |     uVar2 = 0;
    return 0;                                  |     iVar1 = 0;
  }                                            |     do {
  ecx_1 = param_2;                             |       iVar1 = iVar1 + *(int *)(param_1 + uVar2 * 4);
  rdx_1 = 0;                                   |       uVar2 = uVar2 + 1;
  eax_1 = 0;                                   |     } while (param_2 != uVar2);
  do {                                         |     return iVar1;
    eax_1 = eax_1 + param_1[rdx_1];            |   }
    rdx_1 = rdx_1 + 1;                         |   return 0;
  } while ((unsigned long)(unsigned int)ecx_1 != rdx_1); | }
  return eax_1;                                |
}                                              |
```

| Khác biệt | Chỉ lệnh hoặc phỏng đoán |
|---|---|
| `int *param_1` so với `long param_1` | Suy luận ở phía chúng ta từ `addl (%rdi,%rdx,4), %eax`. Ghidra giữ chiều rộng. |
| `uint param_2` và `(int)param_2` so với `int param_2` | Ghidra chọn không dấu vì `cmpq %rdx, %rcx` so sánh count được mở rộng bằng không. Chúng ta giữ `int` và ép kiểu tại phép so sánh. |
| `do { } while` trong cả hai | Chỉ lệnh `jne 0x50` từ khối đến chính nó. Compiler xoay vòng lặp. Object `-O0` giữ `while`. |
| Giữ `ecx_1 = param_2` so với `param_2 != uVar2` | Quy tắc thế của chúng ta giữ trong một khối. Bản sao `movl %esi, %ecx` nằm trong khối thiết lập và phép so sánh nằm trong vòng lặp, nên biến ở lại. Ghidra lan truyền nó. |
| `(unsigned long)(unsigned int)ecx_1` | Chỉ lệnh. `movl %esi, %ecx` mở rộng bằng không, và so sánh 64 bit đọc toàn thanh ghi. |

Bài kiểm tra hành vi biên dịch văn bản Ghidra cho `grade` và `total` không thay đổi. Nó thêm hai dòng `typedef` và một định nghĩa của `DAT_001000b4` từ hai mươi byte tại `.rodata+0x14`. Cả hai hàm khớp nguồn trên lưới.

## What the Research Says About Reading Pseudocode

LLM4Decompile (EMNLP 2024) đo riêng Ghidra ở khả năng thực thi lại 20.12 phần trăm trên HumanEval-Decompile. Khoảng một trong năm hàm biên dịch lại và qua các assertion đi kèm benchmark. Tinh chỉnh đầu ra Ghidra bằng mô hình 6.7B của họ nâng mức đó lên 52.74 phần trăm. DecompileBench (Findings of ACL 2025) chạy sáu decompiler công nghiệp và sáu cách tiếp cận LLM trên 23,400 hàm từ 130 chương trình. Các đầu ra LLM đọc hay hơn và có tính đúng chức năng thấp hơn 52.2 phần trăm.

Liu, Raff và Micinski (arXiv 2609.05370, tháng 9 năm 2026) giải thích khoảng cách. Họ sử dụng 300 hàm thư viện GitHub và 287 hàm có căn cứ CVE. Mô hình tinh chỉnh mạnh nhất nâng tỷ lệ build của Ghidra từ 75 lên 90 phần trăm trong khi tỷ lệ khớp hành vi giảm từ 74 xuống 62 phần trăm. Các ứng viên qua mọi bài kiểm tra trong benchmark vẫn phân kỳ trên các đầu vào fuzz. Điều đó xảy ra trong 4.9 phần trăm trường hợp trên tám hệ thống, và tới 13 phần trăm với một hệ thống. Tới một phần mười các lỗ hổng được công bố biến mất khỏi mã được tinh chỉnh.

Nguyên nhân họ truy ra đơn giản. Các trường, kiểu, callee và điều kiện bảo vệ được bịa ra thay thế các điều chưa biết nhìn thấy được mà decompiler đã để lại trong văn bản.

Đây là lý do lifter in `(unsigned long)(unsigned int)ecx_1` thay vì một tên đẹp hơn. Nó in một ghi chú thay vì một `switch` cho bước nhảy chưa phân giải, và `lookup_14` thay vì một nhãn mà một mô hình sẽ bịa ra. Mỗi dòng có một phép suy ra bạn có thể đọc trong `code/main.py`. `undefined1 [16]` của Ghidra xấu và trung thực. `int percent_change(int, int)` sạch của một mô hình tinh chỉnh đúng vì lý do sai. Cùng mô hình sẽ tạo ra một chữ ký sai sạch trên hàm tiếp theo.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
```

Demo giải mã cả bốn hàm của object `-O1` và so sánh mỗi chỉ lệnh với văn bản `llvm-objdump` đã commit. Với `percent_change`, `grade` và `total`, nó in IR trước SSA, danh sách SSA với các hàm phi và mã giả cạnh văn bản Ghidra. Rồi nó in `grade` với nhận dạng phép chia tắt, các phiên bản `-O0` của `percent_change`, `total` và `grade_label`, và một bản tóm tắt:

```json
{
  "functions": ["grade", "grade_label", "percent_change", "total"],
  "instructions": 56,
  "blocks": {"percent_change": 3, "grade": 3, "total": 5, "grade_label": 4},
  "phis": {"percent_change": 0, "grade": 1, "total": 2, "grade_label": 1},
  "objdumpDifferences": 0
}
```

Đọc `code/main.py` theo thứ tự này:

1. `read_object()` đọc section header, bảng symbol và các section `.rela` của một object có thể tái định vị ELF64.
2. `decode_one()` và `render_att()` giải mã một chỉ lệnh và in nó theo cách `llvm-objdump` làm.
3. `build_blocks()`, `immediate_dominators()` và `dominance_frontiers()` xây dựng các sự kiện đồ thị.
4. `lift_insn()` biến một chỉ lệnh thành các câu lệnh IR và phân giải relocation.
5. `insert_phis()` và `rename()` xây dựng SSA và chèn các phép ép kiểu chiều rộng.
6. `make_simplifier()`, `substitute_once()` và `remove_dead_code()` chạy bên trong `optimize()`.
7. `collect_params()`, `coalesce_webs()` và `infer_types()` đặt tên và gán kiểu các web.
8. `structure()` với `post_dominators()` và `natural_loops()` phát ra thân C.
9. `lift_function()` nối các giai đoạn với nhau và `lift_all()` nâng một object hoàn chỉnh với các chữ ký callee.

## Use It

Để nâng một hàm từ object của riêng bạn, dựng nó bằng `clang -target x86_64-unknown-linux-gnu -c` và gọi `lift_all(read_object(path))`. Khi decoder phát sinh `DecodeError`, đọc byte opcode từ thông báo và tìm nó trong bản đồ opcode SDM. Rồi thêm một mục vào các bảng ở đầu tệp. Khi lifter phát sinh ngoại lệ trên một mnemonic, thêm một quy tắc vào `lift_insn()`. Khi structurer phát ra một `goto`, in đồ thị bằng `IrPrinter` và quyết định quy tắc dạng nào còn thiếu. Mỗi phần bổ sung nhỏ và mỗi phần được kiểm tra với `llvm-objdump` hoặc clang bằng các bài kiểm tra hiện có.

Khi Ghidra được cài, chạy rea trên cùng hàm và đặt hai văn bản cạnh nhau. Điền bảng khác biệt trước khi tin bất kỳ văn bản nào. Một khác biệt có một chỉ lệnh đằng sau là một lựa chọn trình bày. Một khác biệt không có chỉ lệnh đằng sau là một phỏng đoán, và phỏng đoán có thể ở bất kỳ bên nào.

## Interactive Lab

### Lab A: one function through five stages

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode/code
python3 -q
```

Chạy:

```python
from main import *
obj = read_object(FIXTURES / "ledger-x86_64-O1.o")
lifted = lift_function(obj, "percent_change")
for insn in lifted.decoded: print(f"0x{insn.address:x}: {insn.raw.hex(' ')}  {insn.att()}")
print(lifted.ir_text)
print(lifted.ssa_text)
print(lifted.pseudocode)
```

Theo `%esi` từ `subl %edi, %esi` đến `esi_1 = esi_0 - edi_0` đến `(param_2 - param_1)`. Byte `fe` là ModR/M của `subl`, với `mod = 11`, `reg = edi` và `r/m = esi`.

### Lab B: the division idiom

```python
print(lift_function(obj, "grade", recognize_division=False).pseudocode)
print(magic_divisor(0x66666667, 34), magic_divisor(0x66666667, 33), magic_divisor(0x66666667, 31))
```

Dòng đầu in phép nhân và các phép dịch thô. Dòng thứ hai in `10 5 None`. Tìm hiểu vì sao cùng hệ số nhân chia cho 5 với một lần dịch ít hơn, và vì sao dịch 31 không đạt cận sai số.

### Lab C: a new object stops the decoder

Dựng fixture ở `-O2` và nâng nó:

```bash
clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c fixtures/ledger.c -o "$TMPDIR/ledger-O2.o"
python3 -c 'from main import *; from pathlib import Path; import os; lift_all(read_object(Path(os.environ["TMPDIR"]) / "ledger-O2.o"))'
```

Decoder dừng tại `0x56` với `opcode 81 is outside the fixture subset`. Opcode `81` là dạng nhóm 1 với một immediate 32 bit. Chỉ lệnh là `andl $0x7ffffff8, %edx`, và clang sử dụng nó trong vòng lặp được vector hóa của `total`. Thêm nó cạnh `0x83` trong `decode_one()`, chạy lại và ghi chú opcode nào dừng bạn tiếp theo. Tập con tăng từng mục một, và mỗi mục được kiểm tra với `llvm-objdump`.

### Lab D: Ghidra's default value in grade

```python
print(ghidra_pseudocode("grade"))
for score in (-25, 0, 59, 60, 100, 115):
    sign = -(score >> 31)
    product_sign = ((score * 0x66666667) & ((1 << 64) - 1)) >> 63
    print(score, sign ^ product_sign)
```

Mỗi hàng in 0. Biểu thức `uVar1` của Ghidra đúng và không thể đọc, và chỉ lệnh `xorl %eax, %eax` nói điều đó trong hai byte.

## Practice Lab

Thêm khôi phục `switch` cho `grade` ở `-O0`.

Yêu cầu:

- Đọc năm relocation trong `.rela.rodata` của `ledger-x86_64-O0.o`, mỗi relocation là `R_X86_64_PC32.text+offset`, và tính năm đích case từ bảng tại `.rodata+0x0`.
- Thêm một terminator `Switch` vào IR với biểu thức chỉ số, danh sách đích và mặc định từ `ja` trước lần tải bảng.
- Cho khối switch một kế nhiệm mỗi đích để dominator, post-dominator và SSA tiếp tục hoạt động.
- Phát ra `switch (local_10) { case 0:... }` với một `case` mỗi đích và epilogue dùng chung sau điểm nối.
- Giữ ghi chú cho mọi bước nhảy gián tiếp có bảng mà bạn không thể giới hạn.
- Biên dịch kết quả bằng clang và so sánh nó với nguồn trên lưới điểm số trong các bài kiểm tra.

Thành công nghĩa là `grade` ở `-O0` và `grade` ở `-O1` tạo cùng đầu ra trên lưới, với một `switch` và không có `goto`.

## Graded Lab

Năm câu hỏi về các fixture của bài học này. Tìm mỗi câu trả lời bằng mã bạn đã xây dựng, rồi ghi nó vào `code/lab_answers.json`. Viết số dưới dạng số hoặc chuỗi hex chẳng hạn `"0x40"`, và danh sách dưới dạng danh sách JSON.

1. `t1`: các tham số mà quy ước gọi cho percent_change ở -O1.
2. `t2`: các hàm phi trong dạng SSA của total ở -O1.
3. `t3`: số chia mà magic_divisor tìm cho 0x66666667 với độ dịch 34.
4. `t4`: câu lệnh cuối của mã giả percent_change ở -O1, dưới dạng một dòng văn bản.
5. `t5`: kiểu C được khôi phục của param_1 của total ở -O1.

Kiểm tra các câu trả lời của bạn:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/lab.py
```

Bộ kiểm tra tính mỗi giá trị kỳ vọng từ `code/main.py` trên các fixture đã commit. Nó in `PASS`, `FAIL` hoặc `TODO` cho mỗi tác vụ và một điểm số, và nó chỉ thoát 0 khi cả năm qua. `python3 code/lab.py my-answers.json` kiểm tra một tệp khác. `code/tests/test_lab.py` chứng minh rằng bộ kiểm tra chấp nhận các câu trả lời đúng và từ chối một câu sai.

### See it run

Máy [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?opt=O0) chạy bài học này như máy ép nâng, ghim kiểu, khuôn cấu trúc hóa và máy in của nó, với IR, SSA và mã giả mà `code/main.py` in. Liên kết này mở object `-O0`: ba slot stack trở thành biến cục bộ và khuôn đóng cả hai hàm kẹp cho if/else.

## Artifact

Bài học này tạo ra `outputs/skill-lifting-to-pseudocode.md`. Sử dụng nó để nâng một hàm với một phép suy ra cho mỗi dòng và để điền bảng khác biệt đối chiếu văn bản của một decompiler. Sản phẩm yêu cầu disassembly tham chiếu, các relocation, quy ước gọi, kiểm tra biên dịch, so sánh hành vi và một phán quyết cho mỗi dòng khác nhau.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/34-lifting-to-pseudocode
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bộ kiểm tra có 25 bài kiểm tra. Xác minh chứng minh:

- decoder đồng nhất với văn bản `llvm-objdump` đã commit trên mọi chỉ lệnh của cả hai object, và với một `llvm-objdump` chạy trực tiếp khi nó được cài
- REX, ModR/M, SIB và offset trường displacement của `leaq (%rip), %rcx` được giải mã như SDM mô tả
- một opcode ngoài tập con phát sinh `DecodeError` thay vì đoán
- trình đọc ELF liệt kê bốn hàm và ba relocation `.text`
- `total` có năm khối, `0x44` chi phối `0x50`, và `0x50` là một loop header với chính nó làm thân
- `%rdi` và `%rsi` trở thành `param_1` và `param_2`, và `param_1` trong `total` là `int *`
- `test` và `cmp` với `je`, `jle`, `ja` và `jge` trở thành `==`, `<=`, `>` không dấu và `<`
- SSA đặt hai hàm phi sống tại loop header của `total` và không hàm nào trong `percent_change`
- mã giả của `percent_change`, `grade` và `total` bằng văn bản kỳ vọng
- `grade` đọc là `param_1 / 10 - 6` khi bật nhận dạng và phép nhân thô khi tắt nhận dạng
- `0x66666667` với độ dịch 34 chia cho 10, với độ dịch 33 chia cho 5, và đồng nhất thức đúng trên lưới
- các slot stack ở `-O0` trở thành `local_4`, `local_8`, `local_c`, và con trỏ khung không bao giờ xuất hiện
- bảng tại `.rodata+0x14` đọc ra `1, 2, 3, 4, 4` qua relocation
- bước nhảy gián tiếp trong `grade` ở `-O0` được báo cáo với bốn khối chưa được nâng của nó
- các fixture Ghidra chứa giá trị trả về 16 byte, `param_3`, `xor` chưa đơn giản hóa và `long param_1`
- sáu đơn vị được phát ra biên dịch bằng `clang -std=c11 -Wall -Werror` cho `x86_64-unknown-linux-gnu`
- các hàm đã nâng, văn bản Ghidra được sửa và nguồn in cùng 232 dòng trên lưới đầu vào

## Production Failure Modes

| Lỗi | Cách đọc yếu báo cáo gì | Phép suy ra phải cho thấy gì |
|---|---|---|
| Decompiler mở rộng giá trị trả về | "trả về một struct 16 byte" | `idivl` ghi `%rdx`, và không caller nào cố định chiều rộng |
| Decompiler thêm một tham số | "nhận ba đối số" | Thanh ghi được đọc trên một đường chỉ vì chiều rộng trả về được đoán |
| Mẫu không được nhận ra | "nhân với một hằng số ma thuật" | Hệ số nhân là giá trị trần của `2^s / d` và cận sai số đúng |
| Mẫu được nhận ra và một `xor` bị mất | "mặc định phụ thuộc đầu vào" | `xorl %eax, %eax` ghi không, hai cách viết của một bit triệt tiêu |
| Con trỏ được gán kiểu số nguyên | "nhận một long" | Một lần tải 4 byte có tỷ lệ từ thanh ghi là bằng chứng con trỏ |
| Độ dài bảng chưa biết | "đọc vượt bảng" | Offset được tham chiếu tiếp theo hoặc cuối section giới hạn nó, và kiểm tra phạm vi đồng nhất |
| Dạng vòng lặp bị đọc sai | "vòng lặp while" | Header không có lối thoát, latch nhảy ngược, nên nó là `do while` |
| Bước nhảy gián tiếp được đoán | "switch với năm case" | Các đích đến từ `.rela.rodata`, hoặc bước nhảy được báo cáo là chưa phân giải |
| Thế qua một lần lưu | "một biểu thức" | Một giá trị được tải chuyển qua một lần lưu hoặc lần gọi thay đổi ý nghĩa |
| Mô hình tinh chỉnh chỉnh sửa văn bản | "biên dịch và trông đúng" | Tỷ lệ build tăng, khớp hành vi giảm, các điều kiện bảo vệ được bịa thay thế các điều chưa biết nhìn thấy được |
| Decoder đoán một opcode không biết | "disassembly trông ổn" | `DecodeError` với địa chỉ và byte, rồi một mục bảng được kiểm tra với `llvm-objdump` |

## Operational Rule

Coi mã giả là một phép suy ra bạn chưa thấy. Tái tạo nó từ các chỉ lệnh bằng một lifter bạn có thể đọc. Đặt hai văn bản cạnh nhau, và viết chỉ lệnh hoặc phỏng đoán đằng sau mỗi dòng khác nhau. Biên dịch cả hai và chạy cả hai đối chiếu nguồn khi bạn có nó. Một dòng không có một chỉ lệnh đằng sau vẫn là một phỏng đoán bất kể nó đọc sạch đến đâu.

## Further Reading

- [Intel SDM Volume 2, chapter 2, Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [System V AMD64 psABI, section 3.2, Function Calling Sequence](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Cytron et al., Efficiently Computing Static Single Assignment Form and the Control Dependence Graph, TOPLAS 1991](https://doi.org/10.1145/115372.115320)
- [Cooper, Harvey, Kennedy, A Simple, Fast Dominance Algorithm, 2001](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Cifuentes, Reverse Compilation Techniques, PhD thesis, QUT 1994](https://eprints.qut.edu.au/36820/)
- [Yakdan et al., No More Gotos, NDSS 2015](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Granlund, Montgomery, Division by Invariant Integers using Multiplication, PLDI 1994](https://doi.org/10.1145/178243.178249)
- [Lee, Avgerinos, Brumley, TIE, NDSS 2011](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, Polymorphic Type Inference for Machine Code, PLDI 2016](https://arxiv.org/abs/1603.05495)
- [LLM4Decompile, EMNLP 2024](https://arxiv.org/abs/2403.05286)
- [DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, 2026](https://arxiv.org/abs/2609.05370)
- [rea 6.5.0 Ghidra provider notes](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
- Nguồn rea 6.5.0 tại tag `3b79af2` mà bài học này mô tả: `src/domain/functionComparisonDimensions.ts`, `website/evidence/dx-ball-sound-pan.md`.
