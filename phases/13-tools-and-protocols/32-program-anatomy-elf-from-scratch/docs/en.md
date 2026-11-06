# Program Anatomy: An ELF Reader From Scratch

> Một chương trình đã biên dịch là một tập các bảng trỏ đến nhau. Một trình đọc bạn viết cho đầu ra mà bạn có thể kiểm tra từng byte.

**Type:** Build
**Languages:** Python (stdlib), C (fixture only)
**Prerequisites:** Phase 0 · 01 (Dev Environment) with clang installed, Python 3.10 or later, hexadecimal arithmetic
**Time:** ~120 minutes

## Learning Objectives

- Nêu quy tắc ủy quyền cho mọi mục tiêu trong nhánh này và bốn giới hạn của 17 U.S.C. 1201(f).
- Đọc ELF header, bảng section header và cả hai bảng chuỗi bằng `struct.unpack`.
- Giải mã các mục `.symtab` và các bản ghi `.rela` với tên từ gABI và x86-64 psABI.
- Trả về các byte chính xác của một hàm được đặt tên và ánh xạ mỗi file offset đến cấu trúc sở hữu nó.
- Đọc program header và ánh xạ một địa chỉ ảo đến một file offset qua `PT_LOAD`.
- Đọc các load command của một object Mach-O và nêu tên ý tưởng ELF mà mỗi lệnh tương ứng.

## Before You Start: Authorization and the Law

Mọi mục tiêu trong bài 32 đến 36 là một chương trình bạn đã viết và biên dịch. Nguồn là `code/fixtures/ledger.c`, bốn hàm C ngắn. Bạn sở hữu nguồn, lệnh compiler và các tệp object nó tạo ra. Không có giấy phép để đọc, không có bảo vệ để vượt qua và không có bên thứ ba nào có mã mà bạn mở. Nhánh không bao giờ bao quát các bảo vệ phần mềm, kiểm tra giấy phép hoặc các chương trình bạn không sở hữu.

Quy tắc tồn tại vì luật coi disassembly là sao chép. Trong *Sega Enterprises Ltd. v. Accolade, Inc.*, 977 F.2d 1510 (9th Cir. 1992), tòa án phán rằng các bản sao trung gian được tạo trong disassembly là các bản sao theo Copyright Act. Sau đó tòa phán rằng "khi disassembly là cách duy nhất để tiếp cận các ý tưởng và yếu tố chức năng được thể hiện trong một chương trình máy tính có bản quyền và khi có một lý do chính đáng để tìm kiếm sự tiếp cận đó, disassembly là fair use của tác phẩm có bản quyền, theo pháp luật." 

Vụ thứ hai là *Sony Computer Entertainment, Inc. v. Connectix Corp.*, 203 F.3d 596 (9th Cir. 2000). Connectix sao chép PlayStation BIOS khi xây dựng một trình giả lập, và tòa án phán các bản sao đó là fair use. Cả hai vụ bảo vệ việc nghiên cứu. Không vụ nào bảo vệ mã được sao chép trong sản phẩm cuối.

Hai đạo luật đặt các giới hạn. 17 U.S.C. 1201(f) cho phép một người "đã có được hợp pháp quyền sử dụng một bản sao của một chương trình máy tính" vượt qua một kiểm soát truy cập "chỉ nhằm mục đích xác định và phân tích những yếu tố của chương trình cần thiết để đạt tính tương tác của một chương trình máy tính được tạo độc lập với các chương trình khác". Bốn giới hạn cộng dồn: một bản sao hợp pháp, mục đích tương tác, các yếu tố chưa "sẵn có dễ dàng" và phân tích không vi phạm theo các khía cạnh khác. Mục 1201(f) chỉ là một ngoại lệ đối với quy tắc chống vượt qua. Câu hỏi sao chép vẫn thuộc fair use.

Trong Liên minh Châu Âu, Điều 5(3) của Chỉ thị 2009/24/EC bao quát việc nghiên cứu. Một người có quyền sử dụng một bản sao có thể "quan sát, nghiên cứu hoặc kiểm tra hoạt động của chương trình để xác định các ý tưởng và nguyên tắc làm nền tảng cho bất kỳ yếu tố nào của chương trình". Quyền áp dụng trong khi tải, hiển thị, chạy, truyền hoặc lưu trữ chương trình.

Điều 6 cho phép decompilation không cần sự cho phép của chủ thể quyền khi nó "không thể thiếu để có được thông tin cần thiết nhằm đạt tính tương tác của một chương trình máy tính được tạo độc lập". Các điều kiện khớp 1201(f). Một bên được cấp phép thực hiện các hành vi, thông tin chưa sẵn có dễ dàng và các hành vi nằm trong các phần cần thiết. Điều 6(2) cấm sử dụng kết quả cho bất kỳ mục tiêu khác hoặc cho một chương trình tương tự đáng kể về hình thức thể hiện. Điều 8 làm các điều khoản hợp đồng trái với Điều 6 hoặc Điều 5(3) vô hiệu.

| Nguồn | Điều nó cho phép | Điều kiện |
|---|---|---|
| 17 U.S.C. 1201(f) | Vượt qua một kiểm soát truy cập để phân tích một chương trình | Bản sao hợp pháp, mục đích tương tác, thông tin không sẵn có dễ dàng, không vi phạm |
| Chỉ thị 2009/24/EC Điều 5(3) | Quan sát, nghiên cứu và kiểm tra một chương trình đang chạy | Quyền sử dụng bản sao, các hành vi trong việc tải và chạy thông thường |
| Chỉ thị 2009/24/EC Điều 6 | Decompilation | Bên được cấp phép, mục đích tương tác, thông tin không sẵn có dễ dàng, giới hạn trong các phần cần thiết |
| *Sega v. Accolade* | Disassembly như fair use | Cách duy nhất để tiếp cận các ý tưởng và yếu tố chức năng, một lý do chính đáng |
| *Sony v. Connectix* | Các bản sao trung gian trong reverse engineering | Một sản phẩm cuối không vi phạm |

Các ghi chú này đến từ các đạo luật và các phán quyết, và chúng không phải tư vấn pháp lý. Khi một mục tiêu tương lai không phải của bạn, có được sự cho phép bằng văn bản trước khi mở tệp và giữ sự cho phép cùng bằng chứng của bạn. Mục 2.1 của sổ tay Reverse Engineering 101 cung cấp các trích dẫn đầy đủ và các vụ CJEU.

## The Problem

Bạn biên dịch `ledger.c` và chạy `llvm-objdump -t` trên object. Đầu ra liệt kê `percent_change` ở giá trị `0000000000000000` với kích thước `0000000000000010`. 16 byte nào của tệp 1,768 byte là hàm đó? Danh sách cũng hiển thị `R_X86_64_PC32 .rodata+0x10` ở offset `0x36`, và bốn byte tại chỗ đó trong tệp bằng không. Chúng sẽ trở thành gì, và vì sao addend là `0x10` khi bảng bắt đầu ở `0x14`?

rea trả lời các câu hỏi bố cục bằng `inspect_binary_layout`, và công cụ đó chỉ tồn tại trên Linux x64 với pwntools 4.15.0 đằng sau `REA_PWNTOOLS_PYTHON`. Trên máy Mac này nó vắng mặt. `address_to_file_offset` cần một phiên Ghidra và một bản sao đầy đủ của các byte tệp gốc với SHA-256 khớp. `inspect_artifact` liệt kê những gì một container chứa theo đường dẫn và hash nội dung. Nó không bao giờ mở các bảng bên trong một tệp object. Vì vậy bạn tự viết trình đọc trong khoảng 950 dòng Python bằng `struct.unpack` và không dependency. Các bài kiểm tra so sánh mọi bảng với văn bản `llvm-objdump` được thu một lần vào các fixture.

```figure
elf-byte-map
```

## The File Is Tables That Point at Tables

System V gABI, chương 4, Hình 4-1, vẽ hai góc nhìn của một tệp. Góc nhìn liên kết có một ELF header, một bảng program header tùy chọn, các section và một bảng section header bắt buộc. Góc nhìn thực thi có một ELF header, một bảng program header bắt buộc, các segment và một bảng section header tùy chọn. gABI thêm một câu chi phối toàn bộ trình đọc: "Chỉ ELF header có vị trí cố định trong tệp". Mọi cấu trúc khác được tìm bằng một offset lưu trong một cấu trúc khác.

gABI cũng cố định các kiểu vô hướng và nói rằng "ELF không sử dụng bit-field". `Elf64_Addr` và `Elf64_Off` là 8 byte, `Elf64_Half` là 2, `Elf64_Word` là 4 và `Elf64_Xword` là 8. x86-64 psABI, mục 4.1.1, yêu cầu `ELFCLASS64`, `ELFDATA2LSB`, `e_machine` `EM_X86_64` (62) và `e_flags` 0. Little-endian với chiều rộng cố định nghĩa là `struct.unpack` với tiền tố `<` đọc mỗi bản ghi trong một lần gọi.

64 byte đầu tiên của `ledger-x86_64-O1.o`:

```text
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 2804 0000 0000 0000  ........(.......
00000030: 0000 0000 4000 0000 0000 4000 0b00 0100  ....@.....@.....
```

Đọc chúng đối chiếu trang "ELF Header" của gABI. `e_ident` là 16 byte `7f 45 4c 46` (magic), class 2 (64 bit), data 1 (little-endian), version 1, OS ABI 0 (System V) và padding.

Sau đó `e_type` `0x0001` là `ET_REL`, một object có thể tái định vị. `e_machine` `0x003e` là 62, `EM_X86_64`. `e_entry` bằng không vì một object không có điểm vào. `e_phoff` bằng không vì một object không có program header. `e_shoff` là `0x428`, file offset của bảng section header. Hàng cuối chứa `e_ehsize` `0x40`, `e_phentsize` 0, `e_phnum` 0, `e_shentsize` `0x40`, `e_shnum` `0x0b` (11 header) và `e_shstrndx` `0x0001`.

Trình đọc biến hàng đó thành một lần gọi:

```python
fields = struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
```

Chuỗi định dạng là hình gABI đọc từ trái sang phải: hai halfword, một word, ba giá trị 8 byte, một word và sáu halfword. Trình đọc từ chối một tệp có magic, class hoặc thứ tự byte khác, và nó từ chối các giá trị `e_shentsize` hoặc `e_phentsize` không phải 64 và 56. Một chiều rộng sai sẽ làm mọi offset sau đó sai, nên kiểm tra nằm ở đầu.

## Section Headers and Two String Tables

Mỗi section header là một `Elf64_Shdr` 64 byte (gABI Hình 4-8): `sh_name`, `sh_type`, `sh_flags`, `sh_addr`, `sh_offset`, `sh_size`, `sh_link`, `sh_info`, `sh_addralign` và `sh_entsize`. Chuỗi định dạng là `<IIQQQQIIQQ`. `sh_name` là một offset vào section có chỉ số `e_shstrndx`, và tên kết thúc tại byte không đầu tiên. Trong object này `e_shstrndx` là 1, và clang đặt tên section đó là `.strtab`, nên một bảng phục vụ cả tên section và tên symbol.

Trình đọc in 11 header của object -O1:

```text
Idx Name             Type         Flags   Offset     Size       Addr Link Info Align
  0                  NULL                    0x0      0x0        0x0    0    0     0
  1 .strtab          STRTAB                0x368     0xbe        0x0    0    0     1
  2 .text            PROGBITS     AX        0x40     0x9f        0x0    0    0    16
  3 .rela.text       RELA         I        0x2a8     0x48        0x0   10    2     8
  4 .rodata          PROGBITS     A         0xe0     0x50        0x0    0    0     8
  5 .rela.rodata     RELA         I        0x2f0     0x78        0x0   10    4     8
  6 .rodata.str1.1   PROGBITS     AMS      0x130      0xa        0x0    0    0     1
  7 .comment         PROGBITS     MS       0x13a     0x2f        0x0    0    0     1
  8 .note.GNU-stack  PROGBITS              0x169      0x0        0x0    0    0     1
  9 .llvm_addrsig    LLVM_ADDRSIG E        0x368      0x0        0x0   10    0     1
 10 .symtab          SYMTAB                0x170    0x138        0x0    1    9     8
```

Chỉ số 0 là null header được dành riêng. `.text` chứa 159 byte mã ở file offset `0x40`, ngay sau header, với các cờ `A` (được cấp phát trong bộ nhớ) và `X` (có thể thực thi). `.rodata` chứa 80 byte dữ liệu chỉ đọc. `.rodata.str1.1` chứa năm chuỗi nhãn `F\0D\0C\0B\0A\0`, 10 byte, với các cờ `M` (có thể gộp) và `S` (chuỗi).

`.comment` chứa dấu compiler 47 byte `\0Apple clang version 17.0.0 (clang-1700.6.3.2)\0`. `.llvm_addrsig` có kiểu `0x6fff4c03`, bên trong phạm vi đặc thù hệ điều hành `SHT_LOOS` đến `SHT_HIOS` mà gABI dành riêng, và `ELF.h` của LLVM đặt tên nó. Cờ `E` của nó là `SHF_EXCLUDE`, nên một linker bỏ nó.

Các cột `sh_link` và `sh_info` là các con trỏ giữa các bảng. `.rela.text` có `sh_info` 2 và `sh_link` 10: nó vá section 2 và lấy các symbol từ section 10. `.symtab` có `sh_link` 1, bảng chuỗi cho tên symbol, và `sh_info` 9, chỉ số của symbol không cục bộ đầu tiên. `sh_addr` bằng không trong mọi hàng vì một object chưa có địa chỉ. Linker gán chúng.

Hai quy tắc gABI cho phép trình đọc vẽ một bản đồ đầy đủ của tệp. Các section "liên tục và không chồng lấp", và một tệp "có thể chứa không gian không hoạt động". Trình đọc sắp xếp mọi cấu trúc theo offset và lấp các lỗ:

```text
     0x0 +64    header   ELF header
    0x40 +159   section  .text
    0xdf +1     gap      inactive space
    0xe0 +80    section  .rodata
   0x130 +10    section  .rodata.str1.1
   0x13a +47    section  .comment
   0x169 +7     gap      inactive space
   0x170 +312   section  .symtab
   0x2a8 +72    section  .rela.text
   0x2f0 +120   section  .rela.rodata
   0x368 +190   section  .strtab
   0x426 +2     gap      inactive space
   0x428 +704   table    section header table
```

Ba khoảng trống tổng cộng 10 byte, và mỗi khoảng là căn chỉnh. `.rodata` có `sh_addralign` 8, nên nó bắt đầu ở `0xe0` thay vì `0xdf`. `.symtab` có căn chỉnh 8, nên bảy byte nằm không dùng sau `.comment`. Bản thân bảng section header được căn chỉnh tới 8.

Các section kiểu `SHT_NOBITS` hoàn toàn không chiếm byte tệp nào, nên bản đồ bỏ qua chúng. Không có gì trong object này có kiểu đó. Một `.bss` trong chương trình đã liên kết thì có, và một trình đọc tin `sh_size` ở đó đọc vượt tệp.

## Symbols: Binding, Type, Section, Value, Size

Một `Elf64_Sym` là 24 byte (gABI Hình 4-18): `st_name`, `st_info`, `st_other`, `st_shndx`, `st_value`, `st_size`, định dạng `<IBBHQQ`. `st_info` đóng gói hai trường: binding trong bốn bit cao và type trong bốn bit thấp. gABI đặt tên các binding `STB_LOCAL` 0, `STB_GLOBAL` 1, `STB_WEAK` 2, và các type `STT_NOTYPE` 0, `STT_OBJECT` 1, `STT_FUNC` 2, `STT_SECTION` 3, `STT_FILE` 4. Hai bit thấp của `st_other` chứa visibility, ở đây toàn bộ là `STV_DEFAULT` 0.

```text
Idx            Value   Size Bind   Type    Section          Name
  0              0x0      0 LOCAL  NOTYPE  *UND*
  1              0x0      0 LOCAL  FILE    *ABS*            ledger.c
  2              0x0     20 LOCAL  OBJECT  .rodata          labels.rel
  3              0x0      0 LOCAL  SECTION .rodata          .rodata
  4              0x2      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.1
  5              0x4      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.2
  6              0x6      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.3
  7              0x8      2 LOCAL  OBJECT  .rodata.str1.1   .L.str.4
  8              0x0      0 LOCAL  SECTION .rodata.str1.1   .rodata.str1.1
  9              0x0     16 GLOBAL FUNC    .text            percent_change
 10             0x10     46 GLOBAL FUNC    .text            grade
 11             0x40     31 GLOBAL FUNC    .text            total
 12             0x60     63 GLOBAL FUNC    .text            grade_label
```

Chỉ số 0 là symbol không xác định được dành riêng. `st_shndx` nêu tên section định nghĩa symbol, với ba giá trị dành riêng: `SHN_UNDEF` 0, `SHN_ABS` `0xfff1` cho tên tệp và `SHN_COMMON` `0xfff2`. Các section symbol có tên rỗng, nên `llvm-objdump` in tên của chính section cho chúng, và trình đọc làm tương tự. Quy tắc gABI rằng "mọi symbol có binding STB_LOCAL đứng trước các symbol weak và global" thể hiện ở chín hàng đầu, và `.symtab` ghi 9 trong `sh_info` vì lý do đó.

Trong một object có thể tái định vị, `st_value` là một offset bên trong section của symbol, vì `sh_addr` bằng không. File offset của một hàm do đó là `sh_offset + st_value - sh_addr`, và độ dài của nó là `st_size`:

```python
section = elf.sections[symbol.st_shndx]
file_offset = section.sh_offset + (symbol.st_value - section.sh_addr)
code = elf.data[file_offset : file_offset + symbol.st_size]
```

Với `percent_change` đó là `0x40 + 0`, và 16 byte là `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`. Các kích thước quan trọng ngang các điểm bắt đầu. `grade` kết thúc ở offset `.text` `0x3e`. Hai byte `66 90` theo sau là một `nop` mà compiler thêm để `total` bắt đầu ở `0x40`, một ranh giới 16 byte. Hai byte đó không thuộc symbol nào. Bài 33 sử dụng `st_size` làm điều kiện dừng cho một disassembler, và bài 36 che chúng đi trước khi so sánh một bản build lại.

## Relocations: What the Zero Bytes Mean

Một `Elf64_Rela` là 24 byte (gABI Hình 4-23): `r_offset`, `r_info` và một `r_addend` có dấu, định dạng `<QQq`. gABI tách `r_info` bằng hai macro: `ELF64_R_SYM(i)` là `i >> 32` và `ELF64_R_TYPE(i)` là `i & 0xffffffff`. Trong một tệp có thể tái định vị, `r_offset` là một offset bên trong section được `sh_info` của bảng nêu tên. Các tên type và công thức đến từ x86-64 psABI, Bảng 4.9. Ở đó `S` là giá trị symbol, `A` là addend, `P` là vị trí được vá và `L` là mục PLT. `R_X86_64_64` là `S + A`, `R_X86_64_PC32` là `S + A - P`, và `R_X86_64_PLT32` là `L + A - P`.

Object -O1 có tám bản ghi:

```text
  .rela.text       0x36 R_X86_64_PC32          .rodata+0x10
  .rela.text       0x84 R_X86_64_PC32          .rodata+0x24
  .rela.text       0x93 R_X86_64_PC32          .rodata-0x4
  .rela.rodata      0x0 R_X86_64_PC32          .rodata.str1.1
  .rela.rodata      0x4 R_X86_64_PC32          .L.str.1+0x4
  .rela.rodata      0x8 R_X86_64_PC32          .L.str.2+0x8
  .rela.rodata      0xc R_X86_64_PC32          .L.str.3+0xc
  .rela.rodata     0x10 R_X86_64_PC32          .L.str.4+0x10
```

Tách bản ghi đầu tiên. Offset `0x36` nằm bên trong `grade`, trải từ `0x10` đến `0x3e`. Chỉ lệnh tại `0x33` là `48 8d 0d 00 00 00 00`, một `lea` của một địa chỉ tương đối theo RIP, và displacement bốn byte của nó nằm ở `0x36`. Bộ xử lý cộng displacement vào địa chỉ của chỉ lệnh tiếp theo, `0x3a`.

Compiler muốn kết quả là `.rodata + 0x14`, nơi một bảng năm mục các giá trị 32 bit `1, 2, 3, 4, 4` bắt đầu. Vì vậy giá trị lưu phải là `(.rodata + 0x14) - 0x3a`. Công thức `S + A - P` với `P = 0x36` cho `.rodata + A - 0x36`. Đặt hai biểu thức bằng nhau cho `A = 0x14 - 4 = 0x10`. Addend mang offset đích trừ bốn byte giữa displacement và cuối chỉ lệnh.

Bảng đó là cách clang biên dịch `switch` trong `grade` ở -O1. Mã tính `score / 10` bằng một phép nhân với `0x66666667` và hai phép dịch, trừ 6, so sánh với 4 và đánh chỉ số vào bảng. Object ELF -O1 không giữ symbol cho bảng. Tham chiếu là section symbol `.rodata` cộng một addend, và chỉ bản build arm64 của cùng nguồn đặt tên nó `l_switch.table.grade`. Bản ghi thứ hai, ở `0x84` trong `grade_label`, trỏ đến một bảng thứ hai các giá trị 8 byte ở `.rodata + 0x28`. Bản ghi thứ ba, ở `0x93`, trỏ đến `.rodata + 0x0`, điểm bắt đầu của `labels.rel`.

Năm bản ghi `.rela.rodata` điền `labels.rel`. Mỗi mục nằm ở offset `4i` và nhận addend `4i`, nên `S + A - P` rút gọn thành địa chỉ chuỗi trừ địa chỉ cơ sở của bảng. `grade_label` đọc một mục bằng `movslq`, cộng lại địa chỉ cơ sở của bảng và có con trỏ. Bản ghi đầu nêu tên section symbol `.rodata.str1.1` với addend 0 vì chuỗi `F` là byte đầu tiên của section đó. Các bản ghi khác nêu tên `.L.str.1` đến `.L.str.4`, các nhãn cục bộ của compiler cho `D`, `C`, `B` và `A`.

Cùng nguồn biên dịch thành ba bảng khác nhau ở ba mức tối ưu hóa. Trình đọc cho thấy khác biệt mà không cần disassembler:

| Bản build | Nơi `labels` nằm | Cách `grade` chọn | Cách `grade_label` đến `grade` |
|---|---|---|---|
| -O0 | `.data`, năm con trỏ 8 byte, năm bản ghi `R_X86_64_64` | Một jump table trong `.rodata`: năm bản ghi `R_X86_64_PC32` trỏ vào `.text` | Một lần gọi với `R_X86_64_PLT32 grade-0x4` |
| -O1 | `.rodata` dưới dạng `labels.rel`, năm mục tương đối 32 bit | Một bảng giá trị tại `.rodata+0x14`, một `R_X86_64_PC32` | Inline, không có lần gọi |
| -O2 | Giống -O1 | Giống -O1 | Inline, `total` tăng lên 140 byte |

Ở -O0, `switch` là một jump table thực có năm mục trỏ ngược vào `.text` tại `+0x91`, `+0x8c`, `+0x87`, `+0x82` và `+0x86`. Lần gọi đến `grade` mang cùng addend `-0x4` vì cùng lý do như `lea`. Ở -O1, optimizer thấy rằng mọi case trả về một hằng số và thay các bước nhảy bằng một bảng kết quả. Bài 33 giải mã cả hai dạng.

## Program Headers: The Loader's View

Một object có thể tái định vị không có program header, nên `e_phnum` là 0. Một executable hoặc một shared object có chúng, và loader không đọc gì khác. Một `Elf64_Phdr` là 56 byte (gABI Hình 5-1): `p_type`, `p_flags`, `p_offset`, `p_vaddr`, `p_paddr`, `p_filesz`, `p_memsz`, `p_align`, định dạng `<IIQQQQQQ`. gABI cố định ba quy tắc cho các mục `PT_LOAD`. Chúng xuất hiện theo thứ tự `p_vaddr` tăng dần, và một `p_memsz` lớn hơn `p_filesz` nghĩa là điền không. `p_vaddr` đồng dư với `p_offset` theo modulo `p_align`.

Mọi mục tiêu trong nhánh này là một chương trình bạn đã xây dựng, và không linker nào trên máy Mac này tạo một executable Linux từ `ledger.o`. Vì vậy fixture `tiny-x86_64` đến từ `code/fixtures/build_tiny_elf.py`, ghi 736 byte bằng `struct.pack`. Tệp chứa một ELF header, hai program header, một `_start` 36 byte, một `.rodata` 3 byte, một bảng symbol và sáu section header. `_start` ghi `ok\n` vào file descriptor 1 và thoát với trạng thái 42. Trên Linux x86-64 nó chạy. Ở đây nó là một fixture cho đường program header.

```text
Program headers:
  PT_LOAD          r-x offset=0x0 vaddr=0x400000 filesz=0x2e0 memsz=0x2e0 align=0x1000
  PT_GNU_STACK     rw- offset=0x0 vaddr=0x0 filesz=0x0 memsz=0x0 align=0x10

entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

`PT_LOAD` duy nhất ánh xạ toàn bộ tệp 736 byte tại `0x400000`. Trình đọc ánh xạ một địa chỉ thành một file offset bằng cách tìm `PT_LOAD` chứa nó và tính `p_offset + (address - p_vaddr)`. Với điểm vào, đó là `0 + (0x4000b0 - 0x400000) = 0xb0`, điểm bắt đầu của `.text`.

Đây là phép tính đằng sau `address_to_file_offset` của rea. Với một mục tiêu Ghidra, công cụ đó trả về `{address, file_offset}`. Provider Hopper cũng trả về `provider_file_offset` và `image_base_file_offset`. Công cụ cần một bản sao gốc đầy đủ của tệp, và SHA-256 của bản sao đó phải khớp mục tiêu. Tài liệu của `inspect_binary_layout` của rea thêm một dòng cần giữ: "Một địa chỉ đã liên kết không phải một địa chỉ runtime". Một executable độc lập vị trí tải ở một địa chỉ cơ sở mà kernel chọn, và file offset là tọa độ ổn định duy nhất.

Program header cũng giải thích vì sao một executable đã strip vẫn chạy. Một linker có thể loại bỏ hoàn toàn bảng section header, và `e_shoff` trở thành không. Một công cụ duyệt các section sau đó không thấy gì. Loader chưa bao giờ nhìn chúng.

## The Same Ideas in Mach-O

Apple không công bố đặc tả văn xuôi cho Mach-O. Các header trong nguồn XNU là đặc tả: `EXTERNAL_HEADERS/mach-o/loader.h`, `nlist.h` và `reloc.h`. Fixture `ledger-arm64-O1.o` là cùng `ledger.c` được dựng bằng `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c`.

Một `mach_header_64` là 32 byte: `magic`, `cputype`, `cpusubtype`, `filetype`, `ncmds`, `sizeofcmds`, `flags`, `reserved`. Magic là `0xfeedfacf`, `MH_MAGIC_64`. `cputype` là `0x0100000c`, `CPU_TYPE_ARM64`. `filetype` là 1, `MH_OBJECT`. `ncmds` là 5 và `sizeofcmds` là 616: các load command chiếm 616 byte sau header, và mỗi lệnh bắt đầu bằng `{cmd, cmdsize}`. Cờ `0x2000` là `MH_SUBSECTIONS_VIA_SYMBOLS`.

```text
Load commands:
  0 LC_SEGMENT_64                cmdsize=472 at 0x20
  1 LC_BUILD_VERSION             cmdsize=24 at 0x1f8
  2 LC_LINKER_OPTIMIZATION_HINT  cmdsize=16 at 0x210
  3 LC_SYMTAB                    cmdsize=24 at 0x220
  4 LC_DYSYMTAB                  cmdsize=80 at 0x238
```

`LC_SEGMENT_64` (0x19) là câu trả lời của Mach-O cho cả hai bảng ELF. `segment_command_64` của nó có `segname`, `vmaddr`, `vmsize`, `fileoff`, `filesize`, `maxprot`, `initprot`, `nsects` và `flags`. Rồi `nsects` bản ghi kiểu `section_64`, mỗi bản ghi 80 byte, theo sau trong cùng lệnh. Bình luận trong `loader.h` về `MH_OBJECT` nói các section nằm "trong một segment không tên duy nhất không có segment padding". Fixture cho thấy điều đó: một segment với tên rỗng, `fileoff` 648, `filesize` 456 và năm section.

```text
  Idx Section                    Addr   Size Offset Reloff Nreloc Type
    1 __TEXT,__text               0x0   0xd0    648   1104      6 S_REGULAR
    2 __DATA,__const             0xd0   0x28    856   1152      5 S_REGULAR
    3 __TEXT,__cstring           0xf8    0xa    896      0      0 S_CSTRING_LITERALS
    4 __TEXT,__const            0x108   0x40    912      0      0 S_REGULAR
    5 __LD,__compact_unwind     0x148   0x80    976   1192      4 S_REGULAR
```

Mỗi section nêu tên segment cha trong `segname`, nên hai section tên `__const` là khác nhau vì một là `__DATA,__const` và cái kia `__TEXT,__const`. Relocation theo section qua `reloff` và `nreloc`, trong khi ELF có một section `.rela.X` riêng mỗi mục tiêu.

Mỗi `relocation_info` là 8 byte. Một `r_address` có dấu đứng trước. Một trường 32 bit theo sau, được đóng gói thành `r_symbolnum` (24 bit), `r_pcrel` (1), `r_length` (2), `r_extern` (1) và `r_type` (4). Sáu bản ghi `__text` là ba cặp `ARM64_RELOC_PAGE21` và `ARM64_RELOC_PAGEOFF12`, một cặp mỗi tham chiếu bảng. Một `adrp` cộng `add` của arm64 làm điều một `lea` x86-64 làm, nên mỗi tham chiếu cần hai bản ghi. Năm bản ghi `__DATA,__const` là `ARM64_RELOC_UNSIGNED` với `r_length` 3, nên mỗi bản ghi vá một con trỏ tuyệt đối 8 byte.

Ở -O1, bản build arm64 giữ `labels` là các con trỏ thông thường trong khi bản build x86-64 tạo một bảng tương đối.

`LC_SYMTAB` (0x2) chứa `symoff` 1240, `nsyms` 17, `stroff` 1512, `strsize` 176, và 1512 cộng 176 là 1688, kích thước tệp. Mỗi `nlist_64` là 16 byte: `n_strx`, `n_type`, `n_sect`, `n_desc`, `n_value`. `n_type` là một bit field. `N_TYPE` (mask `0x0e`) bằng `N_SECT` (`0xe`) nghĩa là được định nghĩa trong section có số thứ tự bắt đầu từ 1 là `n_sect`. `N_EXT` (`0x01`) đánh dấu một symbol bên ngoài.

`nlist_64` không có trường kích thước. Để lấy 24 byte của `_percent_change`, trình đọc lấy địa chỉ symbol tiếp theo trong cùng section, `_grade` tại `0x18`. Các symbol C mang một `_` ở đầu ở đây, nên hàm là `_percent_change`.

`LC_DYSYMTAB` (0xb) ghi cùng quy tắc local trước như `sh_info` ELF: `ilocalsym` 0, `nlocalsym` 13, `iextdefsym` 13, `nextdefsym` 4. `LC_BUILD_VERSION` (0x32) ghi `platform` 1 (macOS), `minos` 26.0 và `sdk` 26.2 dưới dạng các số nguyên đóng gói `XXXX.YY.ZZ`. Lệnh đó là lý do fixture arm64 được commit dưới dạng byte. Một bản build trên một máy Mac với SDK khác tạo ra một tệp khác.

`compare_formats` của trình đọc đặt hai tệp cạnh nhau:

| Ý tưởng | ELF, `ledger-x86_64-O1.o` | Mach-O, `ledger-arm64-O1.o` |
|---|---|---|
| Danh tính tệp | `e_ident` `7f 45 4c 46`, class 64, data LSB | `magic` `0xfeedfacf` |
| Máy | `e_machine` 62, `EM_X86_64` | `cputype` `0x100000c`, `CPU_TYPE_ARM64` |
| Loại tệp | `e_type` 1, `ET_REL` | `filetype` 1, `MH_OBJECT` |
| Nơi các bảng nằm | `e_shoff` `0x428`, 11 section header | 5 load command, 616 byte sau header |
| Mã | `.text` tại `0x40`, kích thước `0x9f`, cờ `AX` | `__TEXT,__text` tại 648, kích thước `0xd0`, trong segment không tên |
| Tên symbol | `.symtab` (section 10), tên trong `.strtab` qua `sh_link` 1 | `LC_SYMTAB` `symoff` 1240, `nsyms` 17, tên tại `stroff` 1512 |
| Kích thước symbol | `st_size`: `percent_change` là 16 byte | Không có trường: symbol tiếp theo trừ symbol này, 24 byte |
| Relocation | `.rela.text`, 3 bản ghi, `R_X86_64_PC32` | `__text` `reloff` 1104, 6 bản ghi, `PAGE21` và `PAGEOFF12` |
| Byte của hàm | `percent_change`: 16 byte tại `0x40` | `_percent_change`: 24 byte tại `0x288` |

rea đọc Mach-O qua `inspect_macho`, chạy `otool -h -l`, `nm -gjU`, `dyld_info -imports -exports` và `dwarfdump --uuid` qua `xcrun`. Trình đọc của bạn không cần công cụ nào trong số đó, và nó đọc cùng `symoff` và `stroff` mà `otool -l` in ra. Công cụ `open_binary` của rea phát hiện ELF, MZ, PE và Mach-O thin hoặc universal từ các byte magic. Nó cũng tự đọc `e_machine` tại offset 18. Đó là 20 byte đầu của thứ bạn xây dựng ở đây. Với một tệp không có header, bạn cung cấp `format: raw-binary`, kiến trúc và địa chỉ vào. Provider Ghidra từ chối một universal binary và yêu cầu một slice đã được làm mỏng. Trình đọc của bạn làm tương tự khi nó thấy `0xcafebabe`.

## Build It

Chạy trình đọc dùng thư viện chuẩn:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
```

Demo đọc `ledger-x86_64-O1.o` và in header, section, symbol, relocation và bản đồ file offset của nó. Sau đó nó in bốn chuỗi byte hàm, đọc `ledger-arm64-O1.o` và in bảng so sánh. Nó kết thúc bằng các program header của `tiny-x86_64`. Các dòng kỳ vọng:

```text
percent_change: 16 bytes at file offset 0x40: 85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3
grade: 46 bytes at file offset 0x50: 48 63 c7 48 69 c0 67 66 66 66 ...
entry 0x4000b0 is file offset 0xb0 through PT_LOAD
```

Truyền một đường dẫn để đọc một tệp: `python3 code/main.py code/fixtures/ledger-x86_64-O0.o`. Trình đọc chọn ELF hoặc Mach-O từ bốn byte đầu.

Đọc `code/main.py` theo thứ tự này:

1. `ElfFile._read_header()` kiểm tra magic, class, thứ tự byte và kích thước mục, rồi unpack header.
2. `ElfFile._read_sections()` và `read_cstring()` đọc bảng section header và phân giải tên qua `e_shstrndx`.
3. `ElfFile._read_symbols()` tách `st_info`, phân giải tên qua `sh_link` và giữ các chỉ số section dành riêng dễ đọc.
4. `ElfFile._read_relocations()` duyệt mọi section `SHT_RELA`, tách `r_info` và đặt tên type từ Bảng 4.9.
5. `ElfFile.function_span()` và `function_bytes()` biến một symbol thành một phạm vi tệp và các byte trong đó.
6. `ElfFile.file_offset_map()` sắp xếp mọi cấu trúc theo offset và lấp không gian không hoạt động.
7. `ElfFile._read_program_headers()` và `address_to_file_offset()` xử lý các executable.
8. `MachOFile` đọc header, các load command, `LC_SEGMENT_64` với các section của nó, `LC_SYMTAB`, `LC_BUILD_VERSION` và các relocation theo section.
9. `compare_formats()` nêu tên cùng ý tưởng trong cả hai tệp với các giá trị đọc từ mỗi tệp.

## Use It

Import trình đọc từ các bài sau bằng `from main import ElfFile` sau khi thêm thư mục `code` của bài này vào `sys.path`. Bài 33 yêu cầu nó cung cấp `function_bytes` và `relocations_for(".text")`. Bài 35 ghi lại đầu ra của nó làm bằng chứng quan sát được. Bài 36 yêu cầu nó cung cấp các offset relocation để che trước một phép so sánh byte.

Biên dịch C của riêng bạn thành một object bằng cùng lệnh `clang -target x86_64-unknown-linux-gnu -c` và chạy trình đọc trên nó. Chỉ thêm một tên relocation khi Bảng 4.9 của x86-64 psABI liệt kê nó. Chỉ thêm một section type khi gABI hoặc toolchain tạo ra nó ghi tài liệu về nó. Khi trình đọc gặp một giá trị mà nó không có tên, nó in số ở hệ thập lục phân thay vì đoán.

## Interactive Lab

### Lab A: the header by hand

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/code
python3 -q
```

Chạy:

```python
import struct
from main import ElfFile, FIXTURES
data = (FIXTURES / "ledger-x86_64-O1.o").read_bytes()
data[:4], data[4], data[5]
struct.unpack_from("<HHIQQQIHHHHHH", data, 16)
elf = ElfFile(data)
elf.header.e_shoff, elf.header.e_shnum, elf.sections[elf.header.e_shstrndx].name
```

Tuple hiển thị `e_type` 1, `e_machine` 62 và `e_shoff` 1064, tức `0x428`. Dòng cuối cho thấy section 1, `.strtab`, chứa các tên section.

### Lab B: the value table behind the switch

```python
rodata = elf.section_bytes(elf.section(".rodata"))
[int.from_bytes(rodata[i : i + 4], "little") for i in range(0x14, 0x28, 4)]
[int.from_bytes(rodata[i : i + 8], "little") for i in range(0x28, 0x50, 8)]
[r for r in elf.relocations_for(".text") if r.symbol == ".rodata"]
```

Cả hai bảng đọc ra `1, 2, 3, 4, 4`. Kiểm tra chúng với `ledger.c`: `grade(65)` tính `65 / 10 - 6 = 0` và đọc mục 0, là 1, giá trị của `case 6`. `grade(100)` đọc mục 4, là 4, giá trị chung của `case 10` và `case 9`.

### Lab C: three builds of one source

```python
for level in ("O0", "O1", "O2"):
    obj = ElfFile.from_path(FIXTURES / f"ledger-x86_64-{level}.o")
    print(level, [s.name for s in obj.sections if s.name in (".data", ".rodata")])
    print(level, sorted({r.type_name for r in obj.relocations}))
    print(level, {s.name: s.st_size for s in obj.symbols if s.type == "FUNC"})
```

Object -O0 có một section `.data` và ba relocation type. Các object -O1 và -O2 không có `.data` và có một type. `total` là 66 byte ở -O0, 31 ở -O1 và 140 ở -O2.

### Lab D: the same function in Mach-O

```python
from main import MachOFile
macho = MachOFile.from_path(FIXTURES / "ledger-arm64-O1.o")
[(c.name, c.cmdsize) for c in macho.load_commands]
macho.function_span("_percent_change")
macho.function_bytes("_percent_change")[:4].hex()
```

Phạm vi là 24 byte ở file offset 648. Bốn byte đầu là `a0000034`, dạng little-endian của chỉ lệnh `0x340000a0`, mà `llvm-objdump -d` in là `cbz w0, 0x14`. Đó là điều kiện bảo vệ `before == 0`, cùng kiểm tra mà bản build x86-64 mã hóa thành `85 ff 74 09`.

## Practice Lab

Mở rộng trình đọc sang một chương trình đã liên kết. Trên một máy Linux x86-64, dựng `clang -O1 -shared -fPIC code/fixtures/ledger.c -o libledger.so` và `clang -O1 code/fixtures/ledger.c -o ledger_main` với một `main` bạn thêm, rồi chạy trình đọc trên cả hai.

Yêu cầu:

- Đọc `.dynsym` với cùng bố cục `Elf64_Sym`, vì `SHT_DYNSYM` là 11 và bản ghi không thay đổi.
- Đọc `.dynamic` dưới dạng các bản ghi `Elf64_Dyn` của `d_tag` và `d_val`, và đặt tên `DT_NEEDED`, `DT_STRTAB`, `DT_SYMTAB`, `DT_RELA` và `DT_JMPREL` từ trang "Dynamic Section" của gABI.
- Liệt kê các symbol không xác định với `st_shndx` `SHN_UNDEF` làm các import, và các bản ghi `R_X86_64_JUMP_SLOT` trong `.rela.plt` làm các điểm gọi đến chúng.
- Ánh xạ mỗi segment `PT_LOAD` đến các section nó chứa, sử dụng quy tắc gABI rằng "một segment tệp object chứa một hoặc nhiều section".
- Chứng minh bằng `address_to_file_offset` rằng các byte của mỗi hàm được định nghĩa trong shared object là các byte mà `function_bytes` trả về.
- Thu văn bản `llvm-objdump -h -t -r -p` và `llvm-objdump -T` cho cả hai tệp vào `code/fixtures/` và so sánh trình đọc với chúng trong các bài kiểm tra.

Thành công nghĩa là danh sách import, bản đồ segment và mọi phạm vi hàm đồng nhất với đầu ra công cụ đã thu, không chạy công cụ trong các bài kiểm tra.

## Graded Lab

Năm câu hỏi về các fixture của bài học này. Tìm mỗi câu trả lời bằng mã bạn đã xây dựng, rồi ghi nó vào `code/lab_answers.json`. Viết số dưới dạng số hoặc chuỗi hex chẳng hạn `"0x40"`, và danh sách dưới dạng danh sách JSON.

1. `t1`: e_shoff của ledger-x86_64-O1.o, dưới dạng một số.
2. `t2`: st_size của percent_change trong ledger-x86_64-O1.o.
3. `t3`: file offset của .text trong ledger-x86_64-O1.o, dưới dạng hex.
4. `t4`: tên các relocation type trong ledger-x86_64-O0.o, được sắp xếp, dưới dạng một danh sách.
5. `t5`: năm giá trị int tại .rodata+0x14 trong ledger-x86_64-O1.o, dưới dạng một danh sách.

Kiểm tra các câu trả lời của bạn:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/lab.py
```

Bộ kiểm tra tính mỗi giá trị kỳ vọng từ `code/main.py` trên các fixture đã commit. Nó in `PASS`, `FAIL` hoặc `TODO` cho mỗi tác vụ và một điểm số, và nó chỉ thoát 0 khi cả năm qua. `python3 code/lab.py my-answers.json` kiểm tra một tệp khác. `code/tests/test_lab.py` chứng minh rằng bộ kiểm tra chấp nhận các câu trả lời đúng và từ chối một câu sai.

### See it run

Máy [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler) chạy bài học này như hai trạm đầu tiên của nó. Cuộn đọc header của tệp object chứa `percent_change`, và tủ mở `.text` và đọc symbol. Tắt Symbols để thấy những sự kiện nào mà bảng symbol mang theo.

## Lesson Artifact

Bài học này tạo ra `outputs/skill-program-anatomy-elf-from-scratch.md`. Sử dụng nó với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md. Skill biến một object đã biên dịch hoặc executable mà người dùng xây dựng thành một báo cáo bố cục. Báo cáo cho phạm vi tệp của mọi cấu trúc, symbol và relocation, được kiểm tra với đầu ra công cụ đã thu.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bộ kiểm tra chứng minh:

- mọi chỉ số section, tên, kích thước, địa chỉ và loại khớp văn bản `llvm-objdump -h` đã thu cho ba object x86-64 và executable nhỏ
- mọi giá trị symbol, binding, type, section, kích thước và tên khớp văn bản `llvm-objdump -t` đã thu
- mọi offset relocation, tên type, symbol và addend khớp văn bản `llvm-objdump -r` đã thu, bao gồm `R_X86_64_PLT32` và `R_X86_64_64` ở -O0
- cả hai program header của `tiny-x86_64` khớp văn bản `llvm-objdump -p` đã thu, và các object không có program header
- `percent_change` là 16 byte ở file offset `0x40` với các byte kỳ vọng, và mọi hàm nằm bên trong `.text`
- bản đồ file offset bao phủ mỗi byte của mọi fixture một lần, với ba khoảng trống căn chỉnh của object -O1 ở đúng chỗ
- điểm vào của `tiny-x86_64` ánh xạ đến file offset `0xb0` qua `PT_LOAD`, và một object có thể tái định vị từ chối ánh xạ địa chỉ
- Mach-O header, mọi load command, segment, năm section, `LC_SYMTAB` và `LC_BUILD_VERSION` khớp văn bản `--private-headers` đã thu
- các symbol Mach-O và 15 relocation khớp văn bản `llvm-objdump` đã thu, và `_percent_change` là 24 byte ở offset 648
- một magic sai, một class 32 bit, một tệp big-endian, một bảng bị cắt ngắn, một universal binary và một tệp nguồn C đều phát sinh `FormatError`
- `build_tiny_elf.py` tái tạo `tiny-x86_64` đã commit từng byte
- mô-đun hình `site/figures-re-32.js` mang các byte chính xác của `ledger-x86_64-O1.o`

## Production Failure Modes

| Lỗi | Cách đọc yếu báo cáo gì | Trình đọc phải chứng minh gì |
|---|---|---|
| `st_value` được dùng như một file offset | "`percent_change` ở 0" | Offset là `sh_offset + st_value - sh_addr`, ở đây `0x40` |
| Padding được tính là mã | "`grade` là 48 byte" | `st_size` là 46 và `66 90` sau nó không thuộc symbol nào |
| Tên section đọc từ sai bảng | Tên rác hoặc một ngoại lệ | `e_shstrndx` nêu tên bảng, ở đây section 1 |
| Tin `sh_size` cho `SHT_NOBITS` | Một lần đọc vượt cuối tệp | `.bss` không có byte tệp và bản đồ bỏ qua nó |
| Các byte không được đọc như toán hạng | "`lea 0(%rip)`" | Bản ghi `.rela.text` tại `0x36` nêu tên `.rodata+0x10` |
| Addend được đọc như offset đích | "bảng bắt đầu tại `0x10`" | `S + A - P` với cuối chỉ lệnh cho `0x14` |
| Duyệt các section trên một executable đã strip | "tệp không có mã" | `PT_LOAD` ánh xạ mọi địa chỉ mà loader sử dụng |
| Một địa chỉ đã liên kết được coi như một địa chỉ runtime | Một offset sai dưới một địa chỉ cơ sở ngẫu nhiên | File offset từ `PT_LOAD` là tọa độ ổn định |
| Một section Mach-O được tra cứu chỉ bằng `sectname` | Hai section `__const` gộp thành một | `segname,sectname` là tên |
| Kỳ vọng một trường kích thước trong `nlist_64` | Một ngoại lệ hoặc không byte | Symbol tiếp theo trong cùng section kết thúc hàm |
| Một universal binary được đọc như một Mach-O | "magic `0xcafebabe` không biết" | Từ chối nó và yêu cầu một slice đã được làm mỏng |
| Object arm64 được dựng lại trên một máy Mac khác | "fixture đã thay đổi" | `LC_BUILD_VERSION` ghi SDK, nên các byte đã commit là fixture |

## Operational Rule

Đọc header bạn có thể tin, đi theo các offset nó chứa và đặt tên mọi trường từ đặc tả định nghĩa nó. Giữ đầu ra công cụ bạn đã so sánh làm một fixture đã commit, để phép so sánh chạy không cần công cụ. Khi một giá trị không có tên trong đặc tả, in số. Trình đọc bạn có thể kiểm tra từng byte là trình đọc mà mọi bài sau xây dựng trên đó.

## Further Reading

- [System V gABI, chương 4: Object Files](https://www.sco.com/developers/gabi/latest/ch4.intro.html) và các trang [ELF Header](https://www.sco.com/developers/gabi/latest/ch4.eheader.html), [Sections](https://www.sco.com/developers/gabi/latest/ch4.sheader.html), [Symbol Table](https://www.sco.com/developers/gabi/latest/ch4.symtab.html) và [Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [System V gABI, chương 5: Program Header](https://www.sco.com/developers/gabi/latest/ch5.pheader.html) và [Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V ABI, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI), Bảng 4.9 Relocation Types
- [Apple XNU `loader.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h), [`nlist.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h) và [`reloc.h`](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/reloc.h)
- [17 U.S.C. 1201](https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title17-section1201&num=0&edition=prelim) và [Chỉ thị 2009/24/EC](https://eur-lex.europa.eu/eli/dir/2009/24/oj/eng)
- [Sega v. Accolade, 977 F.2d 1510](https://law.resource.org/pub/us/case/reporter/F2/977/977.F2d.1510.92-15655.html) và [Sony v. Connectix, 203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html)
- [rea 6.5.0 `docs/binary-diagnostics.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/binary-diagnostics.md) và [`docs/ghidra-provider.md`](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/ghidra-provider.md)
