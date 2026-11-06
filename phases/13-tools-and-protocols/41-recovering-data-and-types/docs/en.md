# Recovering Data and Types: Structs, Arrays, C++ Objects, and DWARF

> Một decompiler in `a->balance` khi nó có một bảng kiểu và `*(int *)(param_1 + 4)` khi không có. Bài học này xây dựng bảng từ các truy cập, đọc bảng thực từ DWARF 5 và cho thấy nơi hai bảng đồng nhất.

**Type:** Build
**Languages:** Python, C, C++, x86-64 assembly
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~140 minutes

## Learning Objectives

- Đọc một truy cập thành viên struct là thanh ghi base cộng displacement, và một truy cập mảng là base cộng index nhân stride, từ các quy tắc định địa chỉ Intel SDM.
- Áp dụng các quy tắc căn chỉnh System V bằng tay cho `struct account` và giải thích mỗi byte padding.
- Xây dựng một lượt khôi phục kiểu biến các truy cập trong một danh sách thành các offset trường, chiều rộng, loại, một stride và một kích thước, với bằng chứng cho mỗi thứ.
- Viết một trình đọc DWARF 5 cho `.debug_info`, `.debug_abbrev`, `.debug_str_offsets` và `.debug_addr` của một object có thể tái định vị, và kiểm tra nó với `llvm-dwarfdump`.
- So sánh bố cục được khôi phục với bố cục DWARF và nêu tên mọi khác biệt là bằng chứng thiếu, một truy cập được gộp hoặc một loại không thể chứng minh.
- Đọc một vtable C++ Itanium, typeinfo của nó và các tên được mangle của nó từ các relocation, và phân giải một lần gọi ảo thành một slot.

## The Problem

Bạn biên dịch `account.c` không có `-g` và hỏi một agent `bump` làm gì. Agent gửi object tới Ghidra 12.1.4 và nhận lại điều này:

```c
void bump(long param_1,int param_2)
{
  *(int *)(param_1 + 4) = param_2 + *(int *)(param_1 + 4);
  return;
}
```

Cùng nguồn được biên dịch với `-g` cho điều này từ cùng decompiler:

```c
int bump(account *a,int by)
{
  a->balance = by + a->balance;
  return a->balance;
}
```

Các chỉ lệnh giống hệt trong cả hai object. Khác biệt là một bảng kiểu. Có bảng, decompiler biết tham số đầu trỏ đến một cấu trúc 32 byte có trường tại offset 4 là một `int` 4 byte tên `balance`. Không có nó, decompiler chỉ biết rằng thứ gì đó rộng 8 byte đến trong `%rdi` và rằng 4 byte tại `+4` được đọc và ghi.

Mọi thứ trong bảng đó có một nguồn. Offset 4 đến từ byte displacement của `addl 0x4(%rax), %ecx`. Chiều rộng 4 đến từ hậu tố `l`. Tên đến từ một mục `DW_TAG_member` trong `.debug_info`. Bài học này xây dựng cả hai nửa: một lượt khôi phục những gì các chỉ lệnh chứng minh, và một trình đọc giải mã những gì compiler ghi lại. Khoảng cách giữa chúng là giá của một tên kiểu.

```figure
re-41-struct-recovery
```

## A Member Access Is a Displacement

Intel SDM Tập 1, mục 3.7.5, định nghĩa địa chỉ hiệu dụng là `Offset = Base + (Index * Scale) + Displacement`, với scale 1, 2, 4 hoặc 8 và một displacement 8, 16 hoặc 32 bit. Mục 3.7.5.1 thêm dạng chế độ 64 bit `RIP + Displacement`. Một truy cập thành viên struct sử dụng dạng đầu không có index: thanh ghi base chứa địa chỉ của đối tượng và displacement là offset thành viên. Một truy cập mảng thêm số hạng index, và scale hoặc một phép nhân riêng mang kích thước phần tử.

Lấy `bump` ở `-O0`. Danh sách từ `llvm-objdump -d -r` đọc là:

```text
       4: 48 89 7d f8                  	movq	%rdi, -0x8(%rbp)
       e: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      12: 03 48 04                     	addl	0x4(%rax), %ecx
      15: 89 48 04                     	movl	%ecx, 0x4(%rax)
```

Giải mã `03 48 04` bằng các quy tắc từ bài 33. `03` là `ADD r32, r/m32`. ModRM `48` là `01 001 000`: `mod = 01` nghĩa là một toán hạng bộ nhớ với một displacement 8 bit, `reg = 001` là `%ecx`, `r/m = 000` là `%rax`. Byte displacement là `04`. Chỉ lệnh đọc 4 byte tại `%rax + 4` và cộng chúng vào `%ecx`. Hậu tố `l` mà `llvm-objdump` in là kích thước toán hạng, nên trường rộng 4 byte. `%rax` đến từ slot khung tại `-0x8(%rbp)`, và slot đó nhận `%rdi`, đối số số nguyên đầu tiên dưới quy ước gọi System V. Ba sự kiện suy ra: tham số đầu là một con trỏ, đối tượng nó trỏ tới có một trường 4 byte tại offset 4 và `bump` đọc và ghi trường đó.

Không có gì trong các byte này nói `int`, `balance` hoặc `struct account`. Không có gì nói đối tượng lớn bao nhiêu. 28 byte còn lại của struct vô hình với `bump`.

## The System V Layout Rules

x86-64 psABI, mục 3.1.2, cho ba quy tắc cho aggregate. "Cấu trúc và union nhận căn chỉnh của thành phần được căn chỉnh nghiêm ngặt nhất của chúng. Mỗi thành viên được gán offset khả dụng thấp nhất với căn chỉnh thích hợp. Kích thước của mọi đối tượng luôn là một bội của căn chỉnh đối tượng." Hình 3.1 của cùng tài liệu cho các kích thước vô hướng và căn chỉnh: `char` 1 và 1, `short` 2 và 2, `int` 4 và 4, `double` 8 và 8, mọi con trỏ 8 và 8.

Áp dụng các quy tắc cho struct trong `account.c`:

```c
struct account {
    char kind;
    int balance;
    short code;
    double rate;
    const char *label;
};
```

| Thành viên | Kích thước | Căn chỉnh | Offset thấp nhất vừa | Padding trước |
|---|---|---|---|---|
| `kind` | 1 | 1 | 0 | 0 |
| `balance` | 4 | 4 | 4 | 3 (byte 1 đến 3) |
| `code` | 2 | 2 | 8 | 0 |
| `rate` | 8 | 8 | 16 | 6 (byte 10 đến 15) |
| `label` | 8 | 8 | 24 | 0 |

Thành viên cuối kết thúc tại 32. Căn chỉnh nghiêm ngặt nhất là 8, và 32 là một bội của 8, nên kích thước là 32 không có tail padding. Chín byte trong 32 là padding, và psABI nói "Nội dung của mọi padding là không xác định".

Thứ tự các thành viên quyết định kích thước. Cùng năm thành viên dưới dạng `double, pointer, int, short, char` lấp các offset 0, 8, 16, 20, 22 và kết thúc tại 23, được làm tròn lên 24. `sysv_layout()` trong `code/main.py` áp dụng ba quy tắc và tạo cả hai kết quả. Mô-đun `ctypes` của Python áp dụng cùng các quy tắc qua quy ước của compiler host, và `ctypes.sizeof`, `ctypes.alignment` cùng `.offset` của mỗi trường cho 32, 8 và `0, 4, 8, 16, 24` cho cùng struct. Chính chương trình in bản sao thứ ba khi bạn dựng và chạy nó trên máy này:

```text
sizeof 32 align 8
kind 0 balance 4 code 8 rate 16 label 24
sum 315 tag -3 projected 318.75 label_length 7
```

Bản build native đó là arm64. Arm AAPCS64 nêu cùng các quy tắc aggregate trong mục 5.10.1 của nó, và tài liệu arm64 của Apple giữ năm kích thước vô hướng này, nên các con số đồng nhất trên hai mục tiêu. Các object x86-64 của bài học được biên dịch bằng `-target x86_64-unknown-linux-gnu` để trình đọc ELF từ bài 33 và trình đọc DWARF bên dưới hoạt động trên chúng.

## Read the Rest of the Struct by Hand

`bump` thấy một trường. Bốn hàm khác trong `account.c` thấy phần còn lại, và mỗi hàm cho thấy một dạng chỉ lệnh khác nhau. Mọi địa chỉ bên dưới đến từ `account-x86_64-O0-g.objdump.txt`.

`sum_balances` đánh chỉ số một mảng của struct:

```text
      51: 48 8b 45 f8                  	movq	-0x8(%rbp), %rax
      55: 48 63 4d ec                  	movslq	-0x14(%rbp), %rcx
      59: 48 c1 e1 05                  	shlq	$0x5, %rcx
      5d: 48 01 c8                     	addq	%rcx, %rax
      60: 8b 40 04                     	movl	0x4(%rax), %eax
```

`%rax` là `list`, `%rcx` là `i` được mở rộng dấu thành 64 bit, và `shlq $0x5` nhân nó với 32. Sau `addq`, `%rax` là `list + 32 * i`, và lần tải đọc 4 byte tại offset 4 của phần tử `i`. Số đếm dịch là nơi duy nhất trong object này nơi kích thước struct xuất hiện như một số. Vòng lặp chứa các chỉ lệnh này chạy từ `0x49` đến `jmp 0x49` tại `0x72`.

`tag` đọc hai trường hẹp:

```text
      8c: 0f be 00                     	movsbl	(%rax), %eax
      98: 0f bf 48 08                  	movswl	0x8(%rax), %ecx
```

`movsbl` tải một byte tại offset 0 và mở rộng dấu nó, nên trường tại 0 là một số nguyên 1 byte có dấu. `movswl` tải hai byte tại offset 8 với mở rộng dấu, nên trường tại 8 là một số nguyên 2 byte có dấu. Ở `-O1`, truy cập đầu trở thành `cmpb $0x6c, (%rdi)`, vẫn nói 1 byte tại offset 0 và không nói gì về dấu.

`projected` đọc một float:

```text
      cc: f2 0f 2a 40 04               	cvtsi2sdl	0x4(%rax), %xmm0
      d5: f2 0f 59 40 10               	mulsd	0x10(%rax), %xmm0
```

`cvtsi2sdl` chuyển một số nguyên 32 bit có dấu từ bộ nhớ sang một double, xác nhận rằng offset 4 chứa một số nguyên 4 byte có dấu. `mulsd` nhân với một double từ bộ nhớ, nên offset 16 chứa một giá trị dấu phẩy động 8 byte.

`label_length` đọc một con trỏ rồi đi theo nó:

```text
      f3: 48 8b 40 18                  	movq	0x18(%rax), %rax
      f7: 48 63 4d f4                  	movslq	-0xc(%rbp), %rcx
      fb: 80 3c 08 00                  	cmpb	$0x0, (%rax,%rcx)
```

`movq` đọc 8 byte tại offset 24. Riêng nó thì đó là một số nguyên 8 byte hoặc một con trỏ. `cmpb` sử dụng giá trị được tải làm base của một toán hạng bộ nhớ. Một giá trị được sử dụng như một địa chỉ là một con trỏ. `cmpb` đọc 1 byte tại index `%rcx` từ nó, và ở `-O1` con trỏ được tăng bằng `leaq 0x1(%rcx), %rcx` bên trong vòng lặp, nên các phần tử được trỏ tới cách nhau 1 byte.

Đặt năm hàm cùng nhau và struct là `{ i8 at 0, i32 at 4, i16 at 8, f64 at 16, pointer at 24 }` với một stride 32. Các khoảng trống tại 1 đến 3 và 10 đến 15 chính xác là padding mà các quy tắc psABI dự đoán. Điều các chỉ lệnh không nói: các tên thành viên, rằng con trỏ là `const char *`, kiểu được khai báo của byte có dấu tại 0, mà nguồn viết là `char`, và rằng năm hàm nhận cùng kiểu. Khẳng định cuối đến từ `main`, truyền một đối tượng khung cho cả năm. Ở `-O0`, các điểm gọi làm điều đó nhìn thấy được: `leaq -0x70(%rbp), %rdi` theo sau bởi `addq $0x20, %rdi` trước `callq bump`, và `addq $0x40, %rdi` trước `callq tag`. Các offset 0, `0x20` và `0x40` là ba phần tử của một mảng, và `memcpy` `0x60` byte điền nó là 96 byte, tức ba phần tử 32.

## The Pass

`trace_function()` trong `code/main.py` duyệt các chỉ lệnh của một hàm theo thứ tự địa chỉ và giữ một trạng thái trừu tượng nhỏ. Một holder là một thanh ghi 64 bit hoặc một slot khung chẳng hạn `-0x8(%rbp)`. Mỗi holder có một trong ba giá trị. Một `Pointer` là một gốc cộng một offset hằng cộng một tập stride, nơi một stride ghi rằng một bội chưa biết của số byte đó đã được cộng. Một `Index` là một số nguyên chưa biết giá trị là một bội của một scale. Mọi thứ khác là không gì cả.

Trạng thái bắt đầu với sáu thanh ghi đối số System V chứa `Pointer("param0", 0)` đến `Pointer("param5", 0)`. Rồi mỗi chỉ lệnh áp dụng một quy tắc:

- Một `movq` giữa một thanh ghi 64 bit và một slot khung sao chép giá trị. Một lần ghi 32 bit hoặc hẹp hơn vào một thanh ghi làm nó thành một `Index` với scale 1.
- Một `leaq` có một base con trỏ tạo ra một con trỏ với displacement được cộng, và với một thanh ghi index nó thêm `scale * index_scale` vào các stride. Một `leaq` có base là `%rbp` hoặc `%rsp` nêu tên một đối tượng khung, chính là cách `main` truyền `rows`.
- `shlq $n` trên một `Index` nhân scale của nó với `2^n`, và `imulq $k` nhân với `k`.
- `addq` của một con trỏ và một index giữ con trỏ và thêm scale index vào các stride. `addq $k` vào một con trỏ di chuyển offset của nó và cũng được ghi như một lần tăng của thanh ghi đó.
- Một lần gọi làm mọi thanh ghi caller-saved thành chưa biết, và các thanh ghi đối số chứa con trỏ được ghi như một điểm gọi.
- Mọi toán hạng bộ nhớ có thanh ghi base chứa một con trỏ trở thành một `Access` với gốc và offset của con trỏ, chiều rộng và loại từ mnemonic và một cờ lưu.

Chiều rộng và loại chỉ đến từ mnemonic. `access_width()` ánh xạ các hậu tố `b`, `w`, `l` và `q` thành 1, 2, 4 và 8 byte, `movsbl` và `movswl` thành các lần tải hẹp có dấu, `movzbl` thành không dấu, các chỉ lệnh SSE vô hướng `sd` và `ss` thành các float 8 byte và 4 byte, `cvtsi2sdl` thành một nguồn số nguyên 4 byte có dấu và họ `movaps` 16 byte thành một vector. `leaq` và các dạng `nop` không phải các truy cập.

```python
if memory.base in FRAME_REGISTERS:
    return Pointer(f"frame({memory.base}{format_signed(memory.displacement) if memory.displacement else ''})", 0)
base = env.get(memory.base)
if not isinstance(base, Pointer):
    return Unknown
strides = set(base.strides)
if memory.index is not None:
    index_value = env.get(memory.index)
    strides.add((index_value.scale if isinstance(index_value, Index) else 1) * memory.scale)
return Pointer(base.root, base.offset + memory.displacement, frozenset(strides), base.origin)
```

Một lần tải 8 byte qua một con trỏ tạo một con trỏ mới có gốc nêu tên trường mà nó đến từ đó, chẳng hạn `param0->0x18`. Khi giá trị đó sau này được sử dụng làm một base, hoặc tăng bằng `leaq`, trường mà nó đến từ đó được đánh dấu là một con trỏ đã chứng minh. Đó là quy tắc biến offset 24 từ "8 byte" thành "con trỏ".

### Four kinds of stride evidence

`infer_layout()` gộp các truy cập của mọi hàm chứng kiến và thu stride từ bốn nguồn, mỗi nguồn với chỉ lệnh tạo ra nó.

| Loại | Nó đến từ đâu | Bản build cho thấy nó |
|---|---|---|
| `scale` | một `Index` có scale trên 1 đến một con trỏ, từ `shlq $0x5` hoặc `imulq` | `-O0`, `shlq $0x5, %rcx` tại `0x59` |
| `loop-step` | một lần tăng 64 bit của thanh ghi base hoặc index bên trong một vòng lặp cũng chứa truy cập | `-O1`, `addq $0x20, %rdx` tại `0x24` |
| `offset-delta` | các truy cập cùng chiều rộng qua một thanh ghi base bên trong một vòng lặp, tại các offset cách nhau một hằng số | `-O2`, tám lần tải cách nhau 32 |
| `call-site` | các offset mà tại đó một đối tượng khung được truyền cho các hàm chứng kiến | `-O0`, `main` truyền `rows`, `rows+0x20`, `rows+0x40` |

Một vòng lặp là một `jmp` ngược hoặc nhánh có điều kiện, và một lần tăng chỉ được tính khi phạm vi vòng lặp chứa cả lần tăng và truy cập. Quy tắc đó loại `addl $0x1, %eax` tăng `i` ở `-O0`, vì nó là một phép cộng 32 bit và vì truy cập không đi qua `%eax`. Stride cuối là ước chung lớn nhất của mọi giá trị được tìm thấy. Kích thước là stride khi stride ít nhất lớn bằng cuối của trường cuối.

### The vectorised loop at -O2

Ở `-O2`, clang vector hóa `sum_balances`. Thân vòng lặp từ `0x50` đến `0xaa` đọc tám phần tử mỗi lượt:

```text
      3b: 48 8d 87 e4 00 00 00         	leaq	0xe4(%rdi), %rax
      50: 66 0f 6e 50 80               	movd	-0x80(%rax), %xmm2
      55: 66 0f 6e 98 60 ff ff ff      	movd	-0xa0(%rax), %xmm3
      61: 66 0f 6e 90 40 ff ff ff      	movd	-0xc0(%rax), %xmm2
      69: 66 0f 6e a0 20 ff ff ff      	movd	-0xe0(%rax), %xmm4
      7d: 66 0f 6e 10                  	movd	(%rax), %xmm2
      81: 66 0f 6e 58 e0               	movd	-0x20(%rax), %xmm3
      8a: 66 0f 6e 50 c0               	movd	-0x40(%rax), %xmm2
      8f: 66 0f 6e 60 a0               	movd	-0x60(%rax), %xmm4
      a0: 48 05 00 01 00 00            	addq	$0x100, %rax
      aa: 75 a4                        	jne	0x50 <sum_balances+0x40>
```

`%rax` bắt đầu tại `list + 0xe4`. Tám displacement đặt các lần tải tại các offset `0x04, 0x24, 0x44, 0x64, 0x84, 0xa4, 0xc4, 0xe4` từ `list`, tức `4, 36, 68, 100, 132, 164, 196, 228`. Lần tăng là `0x100`, tức 256. Một lượt ghi các offset khi thấy chúng báo cáo tám trường và một struct ít nhất 232 byte. Danh sách đúng và kết luận sai.

`fold_unrolled()` áp dụng một quy tắc. Bên trong một vòng lặp, lấy các truy cập cùng chiều rộng qua một thanh ghi base. Các offset của chúng cách nhau `d`, ở đây 32. Nếu bước vòng lặp là `k * d` và có chính xác `k` offset phân biệt, vòng lặp được unroll `k` lần, và mọi truy cập là cùng truy cập phần tử tại offset `(offset - lowest) mod d`. Ở đây `256 = 8 * 32` với tám offset, nên cả tám lần tải gộp về offset 4, và bằng chứng stride ghi `offset-delta 32`, `unrolled 32` và `loop-step 256`. Vòng lặp phần dư vô hướng tại `0xe0` thêm `scale 32` từ `shlq $0x5, %rdx` và `loop-step 32` từ `addq $0x20, %rdx`. Ước chung lớn nhất của cả năm giá trị là 32.

Hình có một nút tắt việc gộp. Khi nó tắt, bản build `-O2` hiển thị bảy trường vượt byte 32 và không có kích thước. Trạng thái đó là điều một người đọc thấy khi tin displacement mà không có vòng lặp.

## DWARF 5 From the Bytes

Bản build `-g` của `account.c` mang tám debug section. `.debug_info` là 493 byte, `.debug_abbrev` 179, `.debug_str` 230, `.debug_str_offsets` 124, `.debug_addr` 112, `.debug_line` 312, `.debug_line_str` 12 và `.debug_frame` 264. Phần giới thiệu của chuẩn DWARF 5 liệt kê `.debug_str_offsets`, `.debug_addr` và `.debug_line_str` là mới trong Phiên bản 5. Trình đọc trong `code/main.py` cần năm section đầu.

### The unit header

Mục 7.5.1.1 của chuẩn cho compilation unit header đầy đủ: `unit_length`, `version`, `unit_type`, `address_size` và `debug_abbrev_offset`. Mười hai byte đầu của `.debug_info` là:

```text
e9 01 00 00   unit_length = 0x1e9 = 489
05 00         version = 5
01            unit_type = DW_UT_compile
08            address_size = 8
00 00 00 00   debug_abbrev_offset = 0
```

Byte `unit_type` mới trong Phiên bản 5, và chuẩn nói vậy trong cùng mục. Độ dài đếm các byte sau chính nó, nên unit tiếp theo sẽ bắt đầu tại `4 + 489 = 493`, cuối section. `llvm-dwarfdump --debug-info` in cùng năm giá trị trên dòng `Compile Unit:` của nó, và bài kiểm tra đầu phân tích dòng đó và so sánh.

### Abbreviations

Mục 2.1 nói mỗi debugging information entry "gồm một tag nhận dạng và một chuỗi thuộc tính". Bản thân mục chỉ lưu một mã viết tắt. Mã chọn một khai báo trong `.debug_abbrev` (mục 7.5.3) nêu tên tag, nói liệu các mục con theo sau hay không và liệt kê mỗi thuộc tính với dạng của nó. Object này có 14 khai báo. Hai khai báo quan trọng ở đây:

```text
[12] DW_TAG_structure_type  DW_CHILDREN_yes
     DW_AT_name              DW_FORM_strx1
     DW_AT_byte_size         DW_FORM_data1
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
[13] DW_TAG_member           DW_CHILDREN_no
     DW_AT_name              DW_FORM_strx1
     DW_AT_type              DW_FORM_ref4
     DW_AT_decl_file         DW_FORM_data1
     DW_AT_decl_line         DW_FORM_data1
     DW_AT_data_member_location  DW_FORM_data1
```

`parse_abbreviations()` đọc mã ULEB128, tag ULEB128, một byte children, rồi các cặp thuộc tính và dạng cho đến một cặp `0, 0`. Mục 7.5.6 cho các mã hóa dạng: `data1` là một byte, `ref4` là một offset 4 byte tương đối với unit, `strx1` là một chỉ số 1 byte vào bảng string offset, `sec_offset` và `data4` là 4 byte, `addrx` là một chỉ số ULEB128 vào bảng địa chỉ, `exprloc` là một độ dài ULEB128 và số byte đó, và `flag_present` hoàn toàn không có byte.

### Decode the balance member by hand

Mục cấu trúc cho `account` bắt đầu tại offset `0x195` với các byte `0c 15 20 00 03`. Mã viết tắt là 12, cấu trúc. `DW_AT_name` là chỉ số chuỗi `0x15`, `DW_AT_byte_size` là `0x20` = 32, `DW_AT_decl_file` là 0 và `DW_AT_decl_line` là 3, chính là dòng của `struct account {` trong nguồn.

Mục thành viên thứ hai bắt đầu tại `0x1a3` với `0d 10 88 01 00 00 00 05 04`:

1. `0d` là viết tắt 13, một thành viên.
2. `10` là `DW_AT_name` dưới dạng `strx1`: chỉ số chuỗi 16.
3. `88 01 00 00` là `DW_AT_type` dưới dạng `ref4`: offset `0x188` từ đầu unit, chính là mục `DW_TAG_base_type` tên `int`.
4. `00` là `DW_AT_decl_file` và `05` là `DW_AT_decl_line`: dòng 5 của `account.c`.
5. `04` là `DW_AT_data_member_location`: offset 4.

Mục 5.7.6 nói một mục thành viên "có thể có một thuộc tính DW_AT_data_member_location hoặc một thuộc tính DW_AT_data_bit_offset" và rằng một hằng số nguyên "là offset tính bằng byte từ đầu thực thể chứa". Byte đó là cùng con số như displacement trong `addl 0x4(%rax), %ecx`, và `compare_layouts()` là hàm đặt hai thứ cạnh nhau.

### Strings and addresses go through two tables

Chỉ số chuỗi 16 không phải một offset vào `.debug_str`. Trình đọc lấy `DW_AT_str_offsets_base` từ mục unit, là 8, và đọc mục 4 byte tại `8 + 4 * 16` trong `.debug_str_offsets`. Mục đó chứa offset của `"balance"` trong `.debug_str`. Cùng sự gián tiếp áp dụng cho các địa chỉ. Mục cho `sum_balances` bắt đầu bằng các byte `07 07`: viết tắt 7, một subprogram, rồi `DW_AT_low_pc` dưới dạng chỉ số `addrx` 7. Mục 8 byte tại `8 + 8 * 7` trong `.debug_addr` là `0x30`, địa chỉ của hàm trong `.text`. Sáu mục đầu của bảng đó là các địa chỉ của sáu literal chuỗi.

Trong một object có thể tái định vị, không bảng nào chứa các giá trị cuối của nó. Mọi mục trong `.debug_str_offsets` bằng không trong tệp, và `.rela.debug_str_offsets` chứa 29 relocation `R_X86_64_32` đối với `.debug_str` với offset thật trong addend. `.debug_addr` có 13 relocation `R_X86_64_64` đối với `.text` và `.rodata.str1.1`. `.debug_info` có bốn relocation riêng: offset viết tắt, `DW_AT_str_offsets_base` dưới dạng `.debug_str_offsets+0x8`, `DW_AT_stmt_list` và `DW_AT_addr_base` dưới dạng `.debug_addr+0x8`. `ElfObject.relocated()` áp dụng `S + A` cho các type 32 bit và 64 bit trước khi trình đọc phân tích một section. Một section symbol có giá trị 0 trong một tệp object, nên trường nhận addend. `llvm-dwarfdump` làm cùng phân giải, đó là lý do đầu ra của nó hiển thị tên và địa chỉ với mọi chỉ số được phân giải.

### Types, functions, and locations

`DwarfInfo.type_name()` đi theo các tham chiếu `DW_AT_type`. Thành viên `label` trỏ đến một `DW_TAG_pointer_type`, trỏ đến một `DW_TAG_const_type`, trỏ đến base type `char`, nên tên ghép thành `const char *`. `type_size()` trả về `DW_AT_byte_size` cho các base type và cấu trúc, 8 cho một con trỏ và số đếm nhân kích thước phần tử cho một mảng. `type_kind()` rút `DW_AT_encoding` của một base type về `int` với một dấu, hoặc `float`, và một pointer type về `pointer`, là bộ từ vựng mà phép so sánh sử dụng.

`DwarfInfo.functions()` đọc sáu mục `DW_TAG_subprogram`. `bump` chạy từ `0x0` đến `0x21`, tức `DW_AT_low_pc` cộng độ dài `DW_AT_high_pc`. Frame base của nó là `DW_OP_reg6 RBP`, và tham số `a` của nó có biểu thức vị trí `91 78`: `DW_OP_fbreg` với giá trị SLEB128 `0x78`, tức -8. Đó là slot khung `-0x8(%rbp)` mà danh sách lưu `%rdi` vào tại địa chỉ `0x4`. Thông tin gỡ lỗi và các chỉ lệnh mô tả cùng slot từ hai phía.

## Compare the Two Layouts

`compare_layouts()` duyệt các thành viên DWARF và tìm một trường suy ra tại cùng offset. Một thành viên không có trường là `no-evidence`. Một trường có kích thước khác là `size-mismatch`. Một thành viên con trỏ có trường chưa bao giờ được dereference là `pointer-unproven`. Một loại bất đồng, chẳng hạn một float nơi các chỉ lệnh sử dụng số học nguyên, là `kind-mismatch`. Các trường suy ra bắt đầu bên trong một thành viên hoặc bên trong padding là `unexpected`. Kích thước so sánh stride với `DW_AT_byte_size`.

Các con số cho ba bản build, từ `python3 code/main.py`:

| Bản build | Truy cập qua tham số đầu | Trường | Bằng chứng stride | Thành viên khớp | Kích thước |
|---|---|---|---|---|---|
| `-O0` | 11 | 5 | `scale 32`, `call-site 32`, `call-site 64` | 5 trên 5 | 32, khớp |
| `-O1` | 9 | 5 | `loop-step 32` | 5 trên 5 | 32, khớp |
| `-O2` | 17 | 5 sau gộp, 12 trước | `offset-delta 32`, `unrolled 32`, `loop-step 256`, `scale 32`, `loop-step 32` | 5 trên 5 | 32, khớp |

Các khoảng trống suy ra là các byte 1 đến 3 và 10 đến 15 trong mọi bản build, và đó chính xác là các byte padding của bố cục DWARF. Mọi trường suy ra nằm tại một bội của kích thước riêng của nó, chính là điều các quy tắc psABI yêu cầu, và `natural_alignment_ok()` ghi điều đó.

Thêm các hàm từng hàm một và bức tranh thay đổi. Chỉ với `bump`, bố cục là một trường tại offset 4, kích thước chưa biết và cận dưới là 8. `sum_balances` thêm stride. `tag` thêm các offset 0 và 8. `projected` thêm float tại 16. `label_length` thêm con trỏ tại 24 và chứng minh nó là một con trỏ. `main` thêm các điểm gọi ở `-O0` và không thêm gì ở `-O1` và `-O2`, vì compiler inline mọi lần gọi. Hình đi từng bước qua thứ tự này cho mỗi bản build.

Ba điều vẫn ngoài tầm với. Các tên không có trong các chỉ lệnh. Qualifier `const` không có trong các chỉ lệnh. Pointee type của `label` chỉ là "các phần tử cách nhau 1 byte" từ `leaq 0x1(%rcx), %rcx` trong vòng lặp chuỗi, nhất quán với `char` và với `unsigned char` cùng `_Bool`. Ở `-O1`, dấu của byte tại offset 0 chưa biết, vì `cmpb $0x6c, (%rdi)` so sánh mà không mở rộng. Lượt báo cáo `int8` ở đó và `i8` ở `-O0`, nơi `movsbl` mở rộng dấu. Đây là các sự kiện mà bài 35 ghi là các điều chưa biết.

## C++ Objects

`shapes.cpp` định nghĩa `Shape` với một destructor ảo, một `area()` thuần ảo và một `name()` ảo, và `Rect`, kế thừa từ `Shape` và thêm hai thành viên `int`. Itanium C++ ABI chi phối cách clang bố trí chúng trên Linux x86-64.

### Mangled names

Mục 5.1.2 của ABI nói rằng "một tên được mã hóa bằng cách thêm tiền tố `_Z` vào một mã hóa của tên đó". Tệp đối tượng có 19 ký hiệu như vậy. `_ZNK4Rect4areaEv` được đọc là `_Z`, rồi `N` cho một tên lồng nhau, `K` cho một hàm thành viên const, `4Rect` và `4area` là các tên nguồn có tiền tố độ dài, `E` để đóng tên lồng nhau, và `v` cho danh sách tham số rỗng. `llvm-cxxfilt` in `Rect::area() const`. `_Z8describeRK5Shapei` là `describe(Shape const&, int)`: `R` là tham chiếu, `K` là const, `5Shape` là lớp, `i` là `int`. Các tên đặc biệt trong mục 5.1.4 là `_ZTV` cho vtable, `_ZTI` cho typeinfo, và `_ZTS` cho chuỗi tên typeinfo. Hàm khởi tạo và hàm hủy là `C1`, `C2`, `D0`, `D1`, và `D2`, nên `_ZN4RectD0Ev` và `_ZN4RectD2Ev` đều được in thành `Rect::~Rect()`: hàm hủy xóa và hàm hủy đối tượng cơ sở dùng chung một tên nguồn.

`Demangler` trong `code/main.py` bao quát tập con đó cùng các mã kiểu dựng sẵn của mục 5.1.5.2 và các phép thay thế `S_` của mục 5.1.10. Kiểm thử chạy nó trên cả 19 tên và so sánh với đầu ra `llvm-cxxfilt --no-strip-underscore` đã thu lại. Cờ này có ý nghĩa trên macOS, nơi công cụ mặc định loại bỏ một dấu gạch dưới đầu tiên rồi không nhận ra `Z8describe...`.

### The vtable from its relocations

Mục 2.5.2 của ABI liệt kê các thành phần của một bảng ảo theo thứ tự: các độ lệch lời gọi ảo, các độ lệch cơ sở ảo, độ lệch đến đỉnh, con trỏ typeinfo, rồi các con trỏ hàm ảo. Điểm địa chỉ, giá trị mà vptr của một đối tượng giữ, là địa chỉ của con trỏ hàm đầu tiên (mục 2.6.2). `Rect` không có cơ sở ảo, nên bảng của nó gồm độ lệch đến đỉnh, typeinfo, và các hàm.

Ký hiệu `_ZTV4Rect` dài 0x30 byte, sáu ô 8 byte. Trong tệp đối tượng mọi byte đều bằng không. Nội dung nằm trong `.rela.data.rel.ro._ZTV4Rect`:

```text
0000000000000008 R_X86_64_64              _ZTI4Rect
0000000000000010 R_X86_64_64              _ZN4RectD2Ev
0000000000000018 R_X86_64_64              _ZN4RectD0Ev
0000000000000020 R_X86_64_64              _ZNK4Rect4areaEv
0000000000000028 R_X86_64_64              _ZNK4Rect4nameEv
```

Ô 0 giữ độ lệch đến đỉnh, bằng 0 và không cần relocation. Ô 1 là typeinfo. Điểm địa chỉ nằm tại `+16`. Từ đó, ô 0 là hàm hủy đối tượng hoàn chỉnh, ô 1 là hàm hủy xóa, ô 2 là `area`, ô 3 là `name`. `read_vtable()` đọc kích thước ký hiệu, các relocation trong phạm vi của nó, và số không tại độ lệch 0. Bảng của `Shape` có cùng hình dạng với `__cxa_pure_virtual` ở ô 2, là hàm runtime mà một lời gọi thuần ảo đi đến.

### RTTI

Mục 2.9.4 mô tả `std::type_info` là một vptr theo sau bởi một con trỏ đến tên kiểu đã mã hóa, và liệt kê các lớp dẫn xuất. `_ZTI4Rect` có ba relocation: `_ZTVN10__cxxabiv120__si_class_type_infoE+0x10`, `_ZTS4Rect`, và `_ZTI5Shape`. Đầu tiên là vtable của `__si_class_type_info`, lớp mà ABI dùng cho một kiểu có một cơ sở công khai không ảo duy nhất tại độ lệch không, và `+0x10` là điểm địa chỉ của vtable đó. Thứ hai trỏ đến chuỗi `4Rect`, là tên kiểu đã mã hóa, và `name()` trên một `type_info` trả về đúng chuỗi đó. Thứ ba là cơ sở. `_ZTI5Shape` dùng `__class_type_info` và không có con trỏ cơ sở. `read_typeinfo()` trả về ba thông tin này.

### The virtual call

`describe` tại `-O0` thực hiện một lời gọi ảo:

```text
       f: 48 8b 7d f8                  	movq	-0x8(%rbp), %rdi
      13: 48 8b 07                     	movq	(%rdi), %rax
      16: ff 50 10                     	callq	*0x10(%rax)
```

`movq` đầu tiên nạp con trỏ đối tượng. Lệnh thứ hai đọc 8 byte tại độ lệch 0 của đối tượng, là vptr, vì ABI đặt nó đầu tiên trong một lớp có hàm ảo. `callq` đi qua vị trí cách vptr `0x10`, và `0x10 / 8` là ô 2. `find_virtual_calls()` khớp mẫu và báo cáo cả hai ứng viên: `Rect::area() const` từ `_ZTV4Rect` và `__cxa_pure_virtual` từ `_ZTV5Shape`. Hàm nào chạy phụ thuộc vào đối tượng, đó là lý do lời gọi là gián tiếp.

DWARF ghi lại cùng ô đó. Các mục `DW_TAG_subprogram` cho `area` trong cả hai lớp mang `DW_AT_vtable_elem_location (DW_OP_constu 0x2)`, `name` mang ô 3, và các hàm hủy mang ô 0. `Rect` là một `DW_TAG_structure_type` 16 byte với một mục `DW_TAG_inheritance` cho `Shape` tại độ lệch 0 và các thành viên `w` tại 8 và `h` tại 12. `Shape` dài 8 byte với một thành viên nhân tạo `_vptr$Shape`. Hai phép suy ra độc lập cho ô 2 đối với `area`: bảng relocation và các mục gỡ lỗi.

Tại `-O1` tệp đối tượng hoàn toàn không có vtable. `main` tạo `Rect` làm biến cục bộ, nên trình biên dịch đã phân giải `r.name()` và `describe(r, 2)` tại thời điểm biên dịch và nội tuyến chúng. Không có gì lấy địa chỉ của bảng, nên bảng không được phát ra. `describe` vẫn chứa `movq (%rdi), %rax` và `callq *0x10(%rax)`, vì tham số của nó có thể là bất kỳ `Shape` nào. Một vtable vắng mặt là một thông tin về một tệp đối tượng, và kiểm thử `test_the_optimised_object_keeps_the_call_pattern_but_drops_the_vtables` kiểm tra cả hai nửa.

ABI của Microsoft khác ở từng chi tiết này. Các tên được trang trí bắt đầu bằng `?` và mã hóa quy ước gọi, nên `void test(void)` được biên dịch dưới dạng C++ `__cdecl` là `?test@@ZAXXZ`. Bộ định vị RTTI nằm tại `vfptr[-1]` dưới dạng một `_RTTICompleteObjectLocator`, và các ký hiệu là `??_7` cho vftable và `??_R4` cho bộ định vị. Tài liệu của chính Microsoft nói rằng "không có tiêu chuẩn cho việc đặt tên C++ giữa các nhà cung cấp trình biên dịch". Các fixture của bài học này chỉ dùng Itanium.

## How the Tools Present Recovered Types

Mỗi hàng bên dưới có nêu một đầu ra đều được tạo trên máy này và thu lại vào `code/fixtures/tools/`. Các hàng cho những công cụ không được cài ở đây mô tả tài liệu của chúng và nói rõ điều đó.

| Công cụ | Phiên bản, giấy phép | Nơi các kiểu tồn tại | Trên các fixture của chúng ta |
|---|---|---|---|
| Ghidra | 12.1.4, 2026-09-21, Apache-2.0 | Data Type Manager với các kiểu dựng sẵn, do người dùng định nghĩa, và dẫn xuất; các kho lưu trữ `.gdt`; các kiểu được một chương trình sử dụng được sao chép vào chương trình đó | Có DWARF: `/DWARF/account.c/account size=32 align=8` và `a->balance = by + a->balance;`. Không có: `*(int *)(param_1 + 4)` với `long param_1`, `tag(char *param_1)`, và `*(char **)(param_1 + 0x18)` |
| IDA Pro | 9.4, 2026-07-13, thương mại; IDA Free dành cho mục đích phi thương mại với một trình dịch ngược trên đám mây chỉ cho x86 | Cửa sổ Local Types, các thư viện kiểu `.til`, nhập DWARF và PDB vào một thư mục `dwarf` hoặc `pdb` | Chưa cài đặt. Chỉ dựa trên tài liệu |
| Binary Ninja | 6.0, 2026-09-03, thương mại với một bản Free | Chỉnh sửa kiểu, nhập và xuất header, các kho lưu trữ kiểu, thông tin gỡ lỗi từ DWARF và PDB, các thư viện kiểu, các kiểu nền tảng | Chưa cài đặt. Chỉ dựa trên tài liệu |
| radare2 | 6.2.4, 2026-10-05, LGPLv3 | `ts`, `tsc`, `afvd` | `ts` và `tsc account` không in gì cho tệp đối tượng có thể relocation với `bin.dbginfo=true`; `pdf` hiển thị `mov dword [rax + 4], ecx` với chú thích dòng nguồn từ DWARF |
| rizin | 0.9.1, 2026-06-29, lõi LGPL | `ts`, `tsc`, `afvd` | `tsc account` in `struct account { char kind; int balance; short code; double rate; const char *label; };` từ DWARF; bản dựng không có `-g` chỉ liệt kê các kiểu header đi kèm của nó |
| lldb | lldb-1703.0.236.21 | `image lookup -t` | `byte-size = 32` và toàn bộ văn bản `compiler_type` từ tệp đối tượng ELF |
| gdb | chưa cài đặt ở đây | `ptype /o` in "các độ lệch và kích thước của các trường trong một struct" với các khoảng trống được đánh dấu | Chỉ dựa trên tài liệu |
| pyelftools | 0.33, phạm vi công cộng | API Python trên `.debug_info` | Một script 43 dòng in cùng năm thành viên và `unit version 5` |
| llvm-dwarfdump | Apple LLVM 17.0.0 | `--debug-info`, `--debug-abbrev`, `--debug-str-offsets` | Oracle cho mọi kiểm thử bộ đọc |

Đầu ra của Ghidra không có DWARF cho thấy cùng hai quy tắc đang hoạt động. Trình dịch ngược của nó gán `char *` cho tham số của `tag` vì hàm so sánh một byte thông qua nó, và `char **` cho trường tại `0x18` vì `label_length` giải tham chiếu giá trị đã nạp và so sánh các byte. Đó là cùng hai quy tắc mà lượt xử lý trong bài học này áp dụng: độ rộng từ lệnh, con trỏ từ phép giải tham chiếu. Tài liệu trình dịch ngược của Ghidra nói rằng các varnode p-code "không nhất thiết có một kiểu dữ liệu gắn với chúng" và trình dịch ngược "cuối cùng gán một kiểu dữ liệu chính thức" bằng sự lan truyền. Tùy chọn "Infer constant pointers" mở rộng cùng sự lan truyền sang các hằng số. Ghidra 12.1 đã thêm khôi phục bitfield vào trình dịch ngược, điều mà các fixture của bài học này không thực hiện.

Bảng làm thủ công là nửa còn lại của câu chuyện. Data Type Manager của Ghidra, Local Types của IDA, các kho lưu trữ kiểu của Binary Ninja, và `td` của rizin đều cho phép bạn nhập struct từ bố cục đã khôi phục và xem trình dịch ngược kết xuất lại. Lượt xử lý cho bạn biết cần nhập gì và những trường nào bạn đang đoán.

rea 6.5.0 với provider Ghidra của nó trả về văn bản trình dịch ngược dưới dạng một bản ghi. Mọi thứ trong hàng Ghidra đều áp dụng cho nó, và bản ghi mang các tên kiểu mà không có bằng chứng đã tạo ra chúng. Chạy `python3 code/main.py infer` trên cùng bản liệt kê cho bạn bằng chứng đó.

## Type Inference Research

Lượt xử lý ở đây là nửa tạo ràng buộc của một hệ thống suy luận kiểu, giới hạn ở một struct được tiếp cận từ một tham số. Lĩnh vực này đã tiến xa hơn.

- TIE (Lee, Avgerinos, Brumley, NDSS 2011) trình bày việc tái tạo kiểu dưới dạng tạo và giải ràng buộc trên một IR nhị phân, đo tính bảo thủ và độ chính xác, và so sánh với một trình dịch ngược thương mại trên 87 chương trình coreutils.
- Retypd (Noonan, Loginov, Cok, PLDI 2016) thêm kiểu con, tính đa hình, và các kiểu đệ quy, và báo cáo việc tái tạo các chú thích `const` của con trỏ với recall 98%. Một triển khai mã nguồn mở tồn tại dưới tên GrammaTech.
- OSPREY (Zhang và những người khác, IEEE S&P 2021) coi mỗi vị trí bộ nhớ là một biến ngẫu nhiên và suy ra các kiểu có xác suất cao nhất.
- DIRTY (Chen và những người khác, USENIX Security 2022) và ReSym (Xie và những người khác, CCS 2024) hậu xử lý đầu ra trình dịch ngược bằng các mô hình đã học, và ReSym báo cáo precision 72.9% trên các bố cục struct đầy đủ.
- RecStruct (Chen và những người khác, USENIX Security 2026) khôi phục các struct lồng nhau mà không cần trình dịch ngược, bằng thực thi ký hiệu không nhạy luồng và union-find trên các ô stack.

Struct trên stack là thứ đầu tiên lượt xử lý của bài học này bỏ qua. Tại `-O1`, `main` giữ `rows` trên stack và mã nội tuyến đọc `0x24(%rsp)`, `0x40(%rsp)`, `0x48(%rsp)`, `0x30(%rsp)`, và `0x38(%rsp)`. Các độ lệch đó modulo 32 là 4, 0, 8, 16, và 24: cùng struct, không có tham số để khởi tạo từ đó. Practice Lab yêu cầu bạn khôi phục nó.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
```

Đầu ra là một báo cáo JSON có năm phần. `dwarf` giữ header đơn vị, các cấu trúc, và các hàm của tệp đối tượng `-O0`. `oracles` giữ bố cục theo quy tắc psABI, bố cục `ctypes`, bố cục DWARF, lần chạy native, và một cờ `agree`. `builds` giữ các truy cập, bố cục được suy ra, và phép so sánh cho mỗi tệp trong ba tệp đối tượng. `cxx` giữ các tên đã giải mã, cả hai vtable, cả hai bản ghi typeinfo, lời gọi ảo, và các ô DWARF. `tools` liệt kê các đầu ra công cụ đã thu lại.

Dạng kỳ vọng:

```json
{
  "dwarf": {"unit": {"unitLength": 489, "version": 5, "unitType": "DW_UT_compile", "addressSize": 8, "abbrevOffset": 0}, "...": "..."},
  "oracles": {"agree": true, "psabiRules": {"size": 32, "align": 8, "...": "..."}, "...": "..."},
  "builds": {
    "O0": {"layout": {"stride": 32, "size": 32, "gaps": [1, 2, 3, 10, 11, 12, 13, 14, 15], "...": "..."}, "comparison": {"matches": 5, "members": 5, "...": "..."}},
    "O1": {"...": "..."},
    "O2": {"...": "..."}
  },
  "cxx": {"virtualCalls": [{"slot": 2, "candidates": {"Shape": "__cxa_pure_virtual", "Rect": "_ZNK4Rect4areaEv"}, "...": "..."}], "...": "..."}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `ElfObject` đọc các section, ký hiệu, và relocation, và `relocated()` áp dụng `S + A` cho một section gỡ lỗi.
2. `parse_abbreviations()` và `DwarfInfo._parse_unit()` đọc header, bảng viết tắt, và các mục, rồi phân giải `strx` và `addrx` qua hai bảng.
3. `DwarfInfo.struct_layouts()` và `functions()` chuyển các mục thành các bản ghi `StructLayout` và `FunctionInfo`, với `type_name()`, `type_size()`, và `type_kind()`.
4. `parse_listing()`, `parse_memory()`, và `access_width()` đọc văn bản `llvm-objdump`.
5. `trace_function()` là máy trạng thái trừu tượng, và `fold_unrolled()` cùng `infer_layout()` chuyển các truy cập thành một bố cục.
6. `compare_layouts()` tạo các hàng trạng thái, và `sysv_layout()` cùng `ctypes_layout()` là hai oracle còn lại.
7. `Demangler`, `read_vtable()`, `read_typeinfo()`, và `find_virtual_calls()` bao quát tệp đối tượng C++.

Có thêm bốn lệnh. `python3 code/main.py dwarf FILE.o` in các cấu trúc và hàm của bất kỳ tệp đối tượng có thể relocation DWARF 5 nào. `python3 code/main.py infer LISTING.txt [FILE.o]` chạy lượt xử lý trên một bản liệt kê và, khi có một tệp đối tượng, so sánh với DWARF của nó. `python3 code/main.py demangle NAME...` và `python3 code/main.py vtable FILE.o` bao quát nửa C++.

## Use It

Trên một tệp đối tượng mới do chính bạn dựng:

1. Thu lại `llvm-objdump -d -r` của tệp đối tượng và giữ nó cạnh tệp đối tượng. Lượt xử lý đọc văn bản đó.
2. Chạy `python3 code/main.py infer` trên bản liệt kê. Đọc dòng nhân chứng trước: nó nêu các hàm có tham số đầu tiên được dùng làm cơ sở bộ nhớ. Nếu thiếu một hàm, tham số của nó chưa bao giờ đến một toán hạng bộ nhớ, hoặc đã đến qua một đường mà lượt xử lý không theo dõi.
3. Đọc mỗi trường cùng số lần truy cập của nó. Một truy cập là một nhân chứng. Ghi nhận một trường có một nhân chứng duy nhất là được suy ra.
4. Đọc bằng chứng stride. Một mục `call-site` hoặc `scale` là mạnh. Một mục `loop-step` duy nhất mà không có loại nào khác là yếu, vì một vòng lặp đã unroll báo cáo bước của nhiều phần tử. Nếu `unrolled` xuất hiện, hãy kiểm tra phép gộp bằng tay.
5. Nếu có một bản dựng `-g`, hãy chạy phép so sánh và đọc mọi hàng không phải `match`. Một hàng `no-evidence` nêu một thành viên mà không hàm nào chạm đến. Một hàng `unexpected` nêu một truy cập mà lượt xử lý không thể đặt vào vị trí.
6. Nhập bố cục vào trình quản lý kiểu của công cụ dưới dạng một struct, và ghi lại những trường, tên, và loại nào là phỏng đoán.

Giữ ba oracle trong tầm sử dụng. Khi các quy tắc, `ctypes`, và DWARF không thống nhất về một bố cục bạn viết, bạn đã tìm thấy một packed struct, một bit-field, hoặc một đích có các quy tắc khác.

## Interactive Lab

### Lab A: decode the member entry

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types/code
python3 -q
```

Chạy:

```python
from main import *
elf = load_object("account-x86_64-O0-g.o")
dwarf = DwarfInfo(elf)
dwarf.header()
elf.section(".debug_info").data[0x1a3:0x1ac].hex(" ")
dwarf.dies[0x1a3].attributes
dwarf.type_name(dwarf.type_of(dwarf.dies[0x1a3]))
```

Giải mã chín byte trên giấy với mục viết tắt 13 trước khi bạn xem từ điển. Sau đó đọc section thô không có relocation, `elf.section(".debug_str_offsets").data[8:16].hex()`, và section đã áp dụng relocation, `elf.relocated(".debug_str_offsets")[8:16].hex()`, và giải thích sự khác biệt.

### Lab B: trace one function

```python
listing = load_listing("account-x86_64-O0-g.objdump.txt")
trace = trace_function("label_length", listing["label_length"])
[(hex(a.address), a.root, a.offset, a.width, a.kind) for a in trace.accesses]
trace.pointer_uses
trace_function("sum_balances", listing["sum_balances"]).loops
```

Viết ra, trước khi chạy, truy cập nào chứng minh rằng độ lệch 24 là một con trỏ. Sau đó chạy cùng các dòng trên bản liệt kê `-O1` và tìm `leaq 0x1(%rcx), %rcx` trong `trace.increments`.

### Lab C: fold the vectorised loop

```python
o2 = load_listing("account-x86_64-O2-g.objdump.txt")
trace = trace_function("sum_balances", o2["sum_balances"])
sorted({a.offset for a in trace.accesses})
folded, evidence = fold_unrolled(trace, trace.accesses)
sorted({a.offset for a in folded}), [(e.kind, e.value, e.text) for e in evidence]
```

Sau đó chạy `analyze_build("O2", fold=False)["comparison"]` và đếm các hàng `unexpected`. Thay đổi quy tắc gộp để nó yêu cầu bước vòng lặp phải chính xác là `k * d` với `k` ít nhất bằng 2, và xác nhận rằng vòng lặp `-O1`, với một truy cập và bước 32, được giữ nguyên.

### Lab D: the vtable and the names

```python
shapes = load_object("shapes-x86_64-O0-g.o")
read_vtable(shapes, "_ZTV4Rect")
read_typeinfo(shapes, "_ZTI4Rect")
demangle("_ZNK4Rect4areaEv"), demangle("_Z8describeRK5Shapei")
find_virtual_calls(load_listing("shapes-x86_64-O0-g.objdump.txt"), [read_vtable(shapes, "_ZTV5Shape"), read_vtable(shapes, "_ZTV4Rect")])
```

Tính ô từ `callq *0x10(%rax)` trên giấy, rồi xác nhận nó với `DwarfInfo(shapes).struct("Rect").virtual_methods`. Sau đó nạp `shapes-x86_64-O1-g.o` và thử `read_vtable` trên nó. Đọc `ElfError` và giải thích tại sao ký hiệu vắng mặt.

## Practice Lab

Khôi phục struct trên stack trong `main` tại `-O1`.

Yêu cầu:

- Mở rộng `trace_function()` để một vùng ô frame có thể là một gốc. Khởi tạo nó từ các phép lưu `movaps` điền `0x0(%rsp)` đến `0x5f(%rsp)` từ `.data.rel.ro`, là phần khởi tạo 96 byte của `rows`.
- Quy các truy cập nội tuyến `0x24(%rsp)`, `0x40(%rsp)`, `0x48(%rsp)`, `0x30(%rsp)`, và `0x38(%rsp)` về gốc đó và báo cáo các độ lệch của chúng modulo một stride ứng viên.
- Suy ra stride 32 từ vòng lặp tại `0x120` đến `0x12c`, nơi `%r14` bắt đầu ở 4 và tiến thêm `0x20` đến `0x64`, và chỉ ra rằng cận vòng lặp `0x64` là ba phần tử cộng với độ lệch trường.
- So sánh kết quả với bố cục DWARF và đạt năm mục khớp, và ghi lại những loại nào vẫn chưa được chứng minh.
- Thêm một kiểm thử thất bại khi gốc frame được quy về một tham số.

Thành công nghĩa là `python3 code/main.py infer` trên bản liệt kê `-O1` liệt kê `main` như một nhân chứng có một gốc frame, và phép so sánh hiển thị năm mục khớp chỉ từ `main`.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-recovering-data-and-types.md`. Dùng nó để chuyển một bản liệt kê và một bản dựng gỡ lỗi tùy chọn thành một bố cục struct có bằng chứng cho từng trường, một stride với các nguồn của nó, một phép so sánh với DWARF, và một danh sách những gì vẫn chưa biết. Nó yêu cầu bảng truy cập, bằng chứng stride, phép kiểm tra gộp, oracle DWARF khi có, và một phát biểu về những tên và qualifier mà không lệnh nào có thể cung cấp.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/41-recovering-data-and-types
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- header đơn vị, 14 mục viết tắt, và năm độ lệch thành viên khớp với `llvm-dwarfdump`
- các tên đến qua bảng `.debug_str_offsets` đã áp dụng relocation và `str_offsets_base` cùng `addr_base` của đơn vị bằng 8
- sáu hàm mang các phạm vi, `DW_OP_reg6 RBP`, và các vị trí `DW_OP_fbreg` mà bản dump hiển thị, và các địa chỉ thấp của chúng bằng các điểm bắt đầu hàm trong bản liệt kê
- một tệp đối tượng không có `.debug_info` phát sinh ngoại lệ, và các bộ giải mã LEB128 xử lý `0x78` là -8
- `pyelftools` và `lldb` in cùng bố cục với bộ đọc
- các quy tắc psABI, `ctypes`, DWARF, và lần chạy native cho các độ lệch `0, 4, 8, 16, 24` và kích thước 32, và struct được sắp xếp lại dài 24 byte
- bộ phân tích bản liệt kê đọc 13 lệnh trong `bump`, gắn `R_X86_64_PLT32 bump-0x4` vào lời gọi tại `0x194`, và tìm thấy bước nhảy ngược tại `0x72`
- các toán hạng bộ nhớ, độ rộng, loại, và dấu được giải mã từ văn bản AT&T và mnemonic
- `bump` tại `-O0` đọc lại con trỏ của nó từ ô frame và thực hiện ba truy cập tại độ lệch 4
- stride đến từ `shlq $0x5` tại `-O0`, từ `addq $0x20, %rdx` tại `-O1`, và từ tám phép nạp được gộp theo bước 256 tại `-O2`
- `label_length` chứng minh con trỏ tại độ lệch 24 bằng cách giải tham chiếu nó
- `main` truyền một đối tượng frame tại các độ lệch 0, `0x20`, và `0x40` tại `-O0` và không gọi gì ngoài `printf` tại `-O1`
- mọi bản dựng khớp năm trên năm thành viên với kích thước 32 và các khoảng trống bằng phần đệm DWARF
- không có phép gộp, bản dựng `-O2` báo cáo bảy trường vượt quá byte 32 và không có kích thước
- bộ giải mã tên tái tạo cả 19 chuỗi `llvm-cxxfilt`
- cả hai vtable, cả hai bản ghi typeinfo, và lời gọi ảo tại `0x16` phân giải thành ô 2, và DWARF đồng ý
- tệp đối tượng C++ `-O1` giữ mẫu lời gọi và không có vtable
- các bản thu Ghidra, rizin, và radare2 hiển thị struct khi có DWARF và các độ lệch thô khi không có nó
- hình tương tác nhúng cùng dữ liệu mà phân tích tạo ra

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Vòng lặp đã unroll | Tám trường cách nhau 32 byte và một struct 232 byte | Bước vòng lặp 256 bằng 8 lần hiệu độ lệch 32, nên là một trường tại độ lệch 4 |
| Stride được đọc từ một lần tăng | `sizeof` 256 từ `addq $0x100` | Ước chung lớn nhất của mọi nguồn stride, cùng `addq $0x20` của phần đuôi vô hướng |
| Trường 8 byte được gọi là con trỏ | `void *` tại độ lệch 24 | Một truy cập sau dùng giá trị đã nạp làm cơ sở, hoặc loại vẫn là `int64` |
| Con trỏ được gọi là số nguyên | `long` tại độ lệch 24 | Phép giải tham chiếu tại `0xfb`, được ghi lại làm bằng chứng con trỏ |
| Phép so sánh hẹp | `char` có dấu | `cmpb` không mang dấu; chỉ `movsbl` hoặc `movzbl` mang dấu |
| Năm hàm được giả định dùng chung một kiểu | Một struct không có bằng chứng aliasing | Các vị trí gọi trong `main` truyền một đối tượng frame, hoặc một khẳng định rõ ràng của người phân tích |
| Các chuỗi được đọc từ `.debug_str` theo chỉ mục | Các tên rác từ một tệp đối tượng có thể relocation | `str_offsets_base` cộng với mục `.debug_str_offsets` đã áp dụng relocation |
| Các địa chỉ được đọc như các số | `low_pc` bằng 0 cho mọi hàm | `addrx` qua bảng `.debug_addr` đã áp dụng relocation |
| Tệp đối tượng DWARF 4 | Một bộ đọc phân tích sai header | Kiểm tra phiên bản trên trường header thứ hai; 4 không có byte `unit_type` |
| Vtable vắng mặt | "lớp không có hàm ảo" | Tệp đối tượng `-O1` nội tuyến mọi lời gọi; tệp đối tượng `-O0` có bảng và các relocation của nó |
| Ô vtable được đọc từ sai cơ sở | Các số ô lệch hai | Điểm địa chỉ nằm cách ký hiệu 16 byte, sau offset-to-top và typeinfo |
| Tên đã mã hóa bị loại bỏ tiền tố | `Z8describeRK5Shapei` được để nguyên | `--no-strip-underscore` trên macOS, hoặc một bộ giải mã tên kiểm tra `_Z` |
| Struct được nhập kiểu từ phỏng đoán của một công cụ | `char *param_1` được coi là kiểu trường | Độ rộng và phép giải tham chiếu, được viết làm bằng chứng, và tên được đánh dấu là phỏng đoán |

## Operational Rule

Khôi phục một trường từ một truy cập và một stride từ một vòng lặp, và gắn lệnh vào từng thứ. Gộp các vòng lặp đã unroll trước khi bạn tin một độ lệch vượt quá stride. Đọc DWARF qua các mục viết tắt và các bảng đã áp dụng relocation của nó, không bao giờ bằng chỉ mục vào một section chuỗi. So sánh từng trường và viết mọi thành viên không có bằng chứng, mọi con trỏ chưa được chứng minh, và mọi tên là chưa biết. Trong một tệp đối tượng C++, đọc vtable từ các relocation của nó và ô từ lời gọi, rồi dùng DWARF để xác nhận ô bạn đã đọc.

## Further Reading

- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, section 3.1.2: Data Representation](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64), section 5.10: Composite Types](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [Writing ARM64 code for Apple platforms](https://developer.apple.com/documentation/xcode/writing-arm64-code-for-apple-platforms)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 1, section 3.7.5: Specifying an Offset](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [DWARF Debugging Information Format Version 5, sections 2.1, 5.7.6, 7.5.1.1, 7.5.3, 7.5.6](https://dwarfstd.org/doc/DWARF5.pdf)
- [Itanium C++ ABI, sections 2.5 (Virtual Table Layout), 2.9 (Run-Time Type Information), 5.1 (External Names)](https://itanium-cxx-abi.github.io/cxx-abi/abi.html)
- [Microsoft Learn: Tên được trang trí](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170) và [Trang trí tên](https://learn.microsoft.com/en-us/cpp/error-messages/tool-errors/name-decoration?view=msvc-170)
- [Hướng dẫn lệnh llvm-dwarfdump](https://llvm.org/docs/CommandGuide/llvm-dwarfdump.html) và [Hướng dẫn lệnh llvm-cxxfilt](https://llvm.org/docs/CommandGuide/llvm-cxxfilt.html)
- [Python ctypes: Structure layout, sizeof, alignment](https://docs.python.org/3/library/ctypes.html)
- [Data Type Manager của Ghidra](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Base/src/main/help/help/topics/DataTypeManagerPlugin/data_type_manager_description.htm), [Các khái niệm của trình dịch ngược](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerConcepts.html), [Các tùy chọn của trình dịch ngược](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/Decompiler/src/main/help/help/topics/DecompilePlugin/DecompilerOptions.html), và [Bản phát hành Ghidra 12.1.4](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build)
- [Hướng dẫn người dùng IDA 9.1: Kiểu](https://docs.hex-rays.com/9.1/user-guide/types), [Bài viết phát hành IDA 9.4](https://hex-rays.com/blog/ida-9.4-release-a-new-dyld-shared-cache-swift-analysis-new-teams-add-on-and-more-), và [IDA Free](https://hex-rays.com/ida-free)
- [Hướng dẫn người dùng Binary Ninja: Kiểu](https://docs.binary.ninja/guide/types/) và [Binary Ninja 6.0 Krypton](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [Bản phát hành radare2 6.2.4](https://github.com/radareorg/radare2/releases/tag/6.2.4) và [Bản phát hành rizin v0.9.1](https://github.com/rizinorg/rizin/releases/tag/v0.9.1)
- [GDB manual: Examining the Symbol Table, ptype /o](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Symbols.html)
- [pyelftools on PyPI](https://pypi.org/project/pyelftools/)
- [Lee, Avgerinos, Brumley, "TIE: Principled Reverse Engineering of Types in Binary Programs" (NDSS 2011)](https://www.ndss-symposium.org/ndss2011/tie-principled-reverse-engineering-of-types-in-binary-programs/)
- [Noonan, Loginov, Cok, "Polymorphic Type Inference for Machine Code" (PLDI 2016)](https://arxiv.org/abs/1603.05495) và [kho retypd](https://github.com/GrammaTech/retypd)
- [Zhang et al., "OSPREY: Recovery of Variable and Data Structure via Probabilistic Analysis for Stripped Binary" (IEEE S&P 2021)](https://ieeexplore.ieee.org/document/9519451/)
- [Chen et al., "Augmenting Decompiler Output with Learned Variable Names and Types" (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/chen-qibin)
- [Xie et al., "ReSym: Harnessing LLMs to Recover Variable and Data Structure Symbols from Stripped Binaries" (CCS 2024)](https://dl.acm.org/doi/10.1145/3658644.3670340)
- [Chen et al., "RecStruct" (USENIX Security 2026)](https://www.usenix.org/conference/usenixsecurity26/presentation/chen-yuxin)
