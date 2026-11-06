# Linking, Loading, and Stripped Binaries: PLT, GOT, Imports, Fixups, and Function Identification

> Một chương trình đã liên kết gọi các hàm mà nó không chứa. Bài học này đọc các bảng mà link editor viết cho các lần gọi đó trong ba định dạng, đi theo một lần gọi đến slot mà loader điền và tìm các hàm của một bản build sau khi các tên của nó đã mất.

**Type:** Build
**Languages:** Python, C, x86-64 and arm64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch), 33 (disassembly and control flow), 38 (calling conventions)
**Time:** ~160 minutes

## Learning Objectives

- Quyết định từ một bản ghi relocation và các bảng symbol điều link editor làm với nó: một khoảng cách cố định, một mục PLT với một slot GOT hoặc một relocation động.
- Đọc dynamic section, PLT và GOT của một executable ELF độc lập vị trí và đi theo một lần gọi qua chúng bằng các công thức psABI.
- Đọc một object COFF (file header 20 byte, mục section 40 byte, symbol 18 byte, relocation 10 byte) và các thư mục import, export và base relocation của một image PE32+.
- Giải mã một chuỗi chained fixup Mach-O từng word và khớp mỗi word với `dyld_info`.
- Nêu điều `strip` loại bỏ và điều sống sót trong mỗi định dạng, và chạy chương trình đã strip để chứng minh rằng nó vẫn hoạt động.
- Khôi phục các điểm bắt đầu hàm của một bản build arm64 đã strip bằng `LC_FUNCTION_STARTS`, quét prologue và đích gọi, chấm điểm mỗi phương pháp với bảng symbol của bản song sinh chưa strip và đặt tên các hàm bằng một chữ ký dạng FLIRT.

## The Problem

Bạn liên kết `main.c` với `libledger.dylib` và hỏi một agent hàm nào mà `main` gọi tại `0x1000005a0`. Agent disassemble chỉ lệnh và đọc `bl 0x100000694`. Địa chỉ đó chứa mười hai byte: `adrp x16`, `ldr x16, [x16, #0x38]`, `br x16`. Agent đi theo lần tải đến `0x100004038`, đọc tám byte `00 00 00 00 00 00 10 80` và báo cáo một lần gọi qua một con trỏ hỏng vào không gian kernel.

Rồi bạn strip bản build tĩnh của cùng chương trình và hỏi nó có bao nhiêu hàm. Agent chạy `nm`, thấy một tên, `__mh_execute_header`, và trả lời một.

Cả hai câu trả lời đọc tệp như thể nó là tiến trình đang chạy. Word tại `0x100004038` là một chained fixup. Bit 63 nói bind, mười hai bit nói nơi fixup tiếp theo nằm và các bit thấp nói import nào cần bind. dyld thay word bằng địa chỉ của `_puts` trước khi `main` chạy. Tệp đã strip mất bảng symbol và giữ `LC_FUNCTION_STARTS`, liệt kê cả năm điểm bắt đầu hàm trong chín byte.

Bài học này xây dựng năm trình đọc bằng Python thư viện chuẩn. Một trình đọc COFF cho các object của riêng chúng ta và một trình đọc PE32+ cho các thư mục import, export và base relocation. Một trình đọc Mach-O cho load command, stub, bảng symbol gián tiếp, chuỗi chained fixup và exports trie, được kiểm tra từng word với `dyld_info`. Một trình đọc ELF cho dynamic section, PLT và GOT, cộng một planner nói một lần liên kết PIE các object của chúng ta sẽ tạo gì. Một bộ tìm hàm cho một bản build đã strip với bốn phương pháp và một điểm cho mỗi phương pháp. Một bộ dựng chữ ký theo dạng FLIRT, với các byte relocation được wildcard và một CRC16 của đuôi.

Chỉ Mach-O liên kết trên máy này. Các executable arm64 và dylib được liên kết, strip và chạy. Các object ELF và COFF biên dịch ở đây bằng `clang -target`, và không link editor ELF hoặc PE nào được cài, nên hai image đã liên kết trong các định dạng đó được hai script Python trong thư mục fixture viết từng byte từ các đặc tả. `llvm-objdump` đọc chúng, và thăm dò thư viện cũng vậy. Chúng chưa được chạy, và văn bản nói vậy ở nơi quan trọng.

```figure
re-40-call-through-three-formats
```

## What the Link Editor Does With a Relocation

Bài 32 đọc các bản ghi relocation và bài 33 áp dụng `S + A - P` cho một `lea`. Một bản ghi nêu tên một vị trí `P`, một type, một symbol `S` và một addend `A`. Bảng 4.9 của x86-64 psABI cho một công thức mỗi type, với `L` cho vị trí mục PLT của symbol, `G` cho offset GOT của nó, `GOT` cho địa chỉ GOT và `B` cho địa chỉ tải cơ sở của image. Ba kết quả bao quát các object của chúng ta.

Link editor ghi giá trị vào trường và bản ghi biến mất. `R_X86_64_PC32` đối với một symbol được định nghĩa trong các đầu vào là trường hợp này. Khoảng cách giữa hai byte của một image không bao giờ thay đổi, bất kể địa chỉ tải.

Link editor tạo một mục PLT và một slot GOT. `R_X86_64_PLT32` đối với một hàm không xác định là trường hợp này. Lần gọi nhận `L + A - P`, khoảng cách đến mục. Mục nhảy qua slot. Một bản ghi `R_X86_64_JUMP_SLOT` trong `.rela.plt` nói dynamic linker điền slot.

Link editor giữ một relocation cho loader. `R_X86_64_64` là một địa chỉ tuyệt đối tám byte, và một executable độc lập vị trí không biết địa chỉ của nó cho đến khi tải. Bản ghi trở thành `R_X86_64_RELATIVE` với công thức `B + A` trong `.rela.dyn`.

`main-x86_64-O1.o` có 18 bản ghi: 14 trong `.text`, 2 trong `.data.rel.ro` và 2 trong `.rodata`. `plan_dynamic_link()` trong `code/main.py` áp dụng ba quy tắc cho chúng cùng với `ledger-x86_64-O1.o`:

| Bản ghi | Số lượng | Quyết định | Vì sao |
|---|---|---|---|
| `R_X86_64_PC32` tới `.rodata`, `.L.str`, `fns`, bảng trong `.rodata` | 16 | tại chỗ | symbol được định nghĩa trong các đầu vào |
| `R_X86_64_PLT32` tới `percent_change`, `grade`, `total`, `grade_label` | 4 | trực tiếp, không PLT | được định nghĩa trong `ledger-x86_64-O1.o`, nên link editor rút PLT32 về PC32 |
| `R_X86_64_PLT32` tới `puts` hai lần và `printf` hai lần | 4 | mục PLT và slot GOT | không xác định, được cung cấp bởi một thư viện dùng chung |
| `R_X86_64_64` tới `grade` trong `fns[]` | 2 | `R_X86_64_RELATIVE` | một trường tuyệt đối trong một PIE |

Hai import cho một `.plt` 48 byte (PLT0 cộng hai mục 16), một `.got.plt` 40 byte (ba slot dành riêng cộng hai) và một `.rela.plt` 48 byte. Hai bản ghi tương đối cho một `.rela.dyn` 48 byte. Các con số này đến từ đặc tả được áp dụng cho các bản ghi của chúng ta. `tiny-dyn-x86_64` dựng tay triển khai phần PLT của kế hoạch này cho cùng hai import, và các kích thước của nó khớp kế hoạch.

Compiler ghi `PLT32` trên mọi lần gọi, được định nghĩa hoặc không xác định, từ binutils 2.31 (H.J. Lu, 2018-02-13) và LLVM 7.0.0 (D43383, 2018-02-20). Link editor quyết định. Một `PLT32` trong một object do đó nói "một lần gọi", và không nói gì về liệu một mục PLT sẽ tồn tại hay không. Thêm hai type xuất hiện trong các bản build khác. `R_X86_64_GOTPCRELX` và `R_X86_64_REX_GOTPCRELX` (`G + GOT + A - P`) yêu cầu một slot GOT không có PLT, được `-fno-plt` tạo ra và link editor có thể nới thành một `lea` hoặc `call` trực tiếp khi symbol cục bộ (psABI Phụ lục B). `R_X86_64_32` và `R_X86_64_32S` không thể chứa một địa chỉ trong một PIE và liên kết thất bại. Không loại nào xảy ra trong hai object của chúng ta.

## The Dynamic Section, the PLT, and the GOT

Chương 5 của gABI nói rằng một executable tham gia liên kết động có một program header `PT_INTERP`, phải đứng trước mọi segment có thể tải, và một `PT_DYNAMIC`, bao phủ section `.dynamic`. Section là một mảng các cặp `Elf64_Dyn`, một tag có dấu và một giá trị, kết thúc bằng `DT_NULL`.

`tiny-dyn-x86_64` là 5,184 byte được `build_tiny_dyn_elf.py` viết từ gABI và psABI. Dynamic section của nó chứa mười hai cặp tại `0x1000`:

| Tag | Số | Giá trị | Ý nghĩa |
|---|---|---|---|
| `DT_NEEDED` | 1 | `libc.so.6` | một offset bảng chuỗi, `0xb`, thư viện cần tải |
| `DT_HASH` | 4 | `0x1a0` | bảng hash SysV |
| `DT_STRTAB` | 5 | `0x188` | `.dynstr` |
| `DT_SYMTAB` | 6 | `0x140` | `.dynsym`, 24 byte mỗi mục |
| `DT_STRSZ` | 10 | `0x15` | 21 byte chuỗi |
| `DT_SYMENT` | 11 | `0x18` | 24 |
| `DT_PLTGOT` | 3 | `0x10c0` | `.got.plt` |
| `DT_PLTRELSZ` | 2 | `0x30` | hai bản ghi 24 byte |
| `DT_PLTREL` | 20 | 7 | các bản ghi là `DT_RELA` |
| `DT_JMPREL` | 23 | `0x1b8` | `.rela.plt` |
| `DT_FLAGS_1` | `0x6ffffffb` | `0x08000000` | `DF_1_PIE`, một tag GNU |
| `DT_NULL` | 0 | 0 | kết thúc |

gABI nói vì sao `DT_JMPREL` riêng biệt: nó "chứa địa chỉ các mục relocation chỉ liên quan đến procedure linkage table. Tách các mục relocation này cho phép dynamic linker bỏ qua chúng trong khởi tạo tiến trình, nếu lazy binding được bật." `DF_BIND_NOW` trong `DT_FLAGS`, `DF_1_NOW` trong `DT_FLAGS_1` hoặc `LD_BIND_NOW` trong môi trường tắt lazy binding và dynamic linker xử lý chúng lúc khởi động.

### PLT0 and the entry for puts

Mục 5.2 của psABI cho hai dạng trong Hình 5.2. Đây là các byte của tệp chúng ta:

```text
     1f0: ff 35 d2 0e 00 00    pushq  0xed2(%rip)      # 0x10c8 = GOT+8
     1f6: ff 25 d4 0e 00 00    jmpq   *0xed4(%rip)     # 0x10d0 = GOT+16
     1fc: 0f 1f 40 00          nopl   (%rax)

     200: ff 25 d2 0e 00 00    jmpq   *0xed2(%rip)     # 0x10d8 = GOT+24, the slot for puts
     206: 68 00 00 00 00       pushq  $0x0             # index 0 into DT_JMPREL
     20b: e9 e0 ff ff ff       jmp    0x1f0            # PLT0
```

Làm phép tính một lần. Displacement tương đối theo RIP tương đối với chỉ lệnh tiếp theo. `0x1f6 + 0xed2 = 0x10c8`, tức `.got.plt + 8`. `0x1fc + 0xed4 = 0x10d0`, tức `.got.plt + 16`. `0x206 + 0xed2 = 0x10d8`, slot thứ tư. `0x210 - 0x20 = 0x1f0`, PLT0. Mọi mục là 16 byte, nên mục cho `exit` bắt đầu tại `0x210`, đẩy `$0x1` và đọc `0x10e0`.

GOT dành riêng ba slot. psABI 5.2: mục không chứa địa chỉ của `_DYNAMIC`, và "các mục một và hai trong global offset table cũng được dành riêng". `.got.plt` của chúng ta đọc ra `0x1000, 0, 0, 0x206, 0x216`. glibc điền slot một bằng `struct link_map` của nó và slot hai bằng `_dl_runtime_resolve` khi nó tải tệp. Slot ba chứa `0x206` trong tệp, chính là `pushq` bên trong `puts@plt`. psABI: slot "ban đầu ... chứa địa chỉ của chỉ lệnh pushq theo sau".

Vì vậy lần gọi đầu chạy `call 0x200`, `jmpq *0x10d8` đến `pushq $0`, `jmp 0x1f0` đẩy GOT+8 và nhảy qua GOT+16 vào resolver, đọc bản ghi 0 của `DT_JMPREL`, `R_X86_64_JUMP_SLOT puts`, tra `puts` trong `libc.so.6`, ghi địa chỉ của nó vào `0x10d8` và nhảy đến đó. Lần gọi thứ hai chạy `call`, `jmpq *0x10d8` và đến nơi. Drepper viết rằng "chi phí bổ sung cho mọi lần gọi trừ lần đầu do đó 'chỉ' là một bước nhảy gián tiếp". Chú thích psABI về `%r11` giải thích một lựa chọn thanh ghi trong bài 38: nó là một thanh ghi tạm để "mã trong PLT không cần spill bất kỳ thanh ghi nào".

Điểm gọi trong `.text` đọc ra `e8 d4 ff ff ff` tại `0x227`, và `0x22c - 0x2c = 0x200`. `llvm-objdump` in `callq 0x200 <puts@plt>` cho nó và đặt tên mục từ bản ghi `.rela.plt`, cũng là cách `plt_entries()` đặt tên nó.

### What the file does not have

Tệp không có `PT_GNU_RELRO`. Jakub Jelinek đề xuất RELRO trên danh sách binutils ngày 2004-01-06: chuyển các section chỉ được ghi trong relocation đến đầu segment có thể ghi, để dynamic linker có thể `mprotect` chúng thành chỉ đọc sau đó. Script mặc định của GNU ld đặt `.init_array`, `.fini_array`, `.data.rel.ro`, `.dynamic` và `.got` bên trong, và chỉ giữ ba slot dành riêng của `.got.plt` bên trong, 24 byte, vì các slot khác được ghi lười. Đó là partial RELRO. `-z now` đặt `DF_BIND_NOW` và chuyển toàn bộ `.got.plt` vào trong, full RELRO, vì không có gì được ghi sau khởi động. `_dl_protect_relro` của glibc gọi `mprotect(start, end - start, PROT_READ)` trên phạm vi được căn theo trang. `-fno-plt` đi thêm một bước ở phía compiler: các lần gọi đi qua `jmpq *name@GOTPCREL(%rip)`, lazy binding là không thể và sổ tay GCC nói rằng "mọi symbol bên ngoài được phân giải lúc tải".

Tệp cũng không có các section phiên bản. Một lần liên kết thật với `libc.so.6` thêm `.gnu.version`, một `Elfxx_Half` mỗi mục `.dynsym`, và `.gnu.version_r`, một `Verneed` cho mỗi thư viện với các bản ghi `Vernaux` cho mỗi tên phiên bản. `printf@GLIBC_2.2.5` nghĩa là: mục của `printf` trong `.gnu.version` chứa một chỉ số, `Vernaux` có `vna_other` bằng chỉ số đó có `vna_name` "GLIBC_2.2.5", dưới `Verneed` có `vn_file` là "libc.so.6". Chỉ số 0 là local, 1 là global, và bit 15 (`VERSYM_HIDDEN`, `0x8000`) ẩn một phiên bản khỏi link editor.

Bảng hash là một `DT_HASH` SysV với một bucket và một chuỗi ba mục, 24 byte. Dynamic linker cần `DT_HASH` hoặc `DT_GNU_HASH` để tra các symbol trong tệp. Tệp này không export gì, và nó chưa được chạy ở đây, nên liệu glibc có chấp nhận một bảng một bucket hay không là chưa xác minh.

### .dynsym, .symtab, and strip

gABI làm `.dynsym` và `.dynstr` thành các section được cấp phát và `.symtab` cùng `.strtab` thành các section không được cấp phát. Dynamic linker đọc cặp đầu và không bao giờ cặp thứ hai. Drepper: "Bảng symbol thông thường không được sử dụng lúc chạy và do đó không cần thiết phải strip nó khỏi một binary. Nó không có tác động đến hiệu năng."

GNU `strip --strip-all` loại `.symtab`, `.strtab`, `.debug_*` và `.comment`. Mọi section được cấp phát ở lại: `.interp`, `.dynsym`, `.dynstr`, `.gnu.hash`, `.gnu.version*`, `.rela.dyn`, `.rela.plt`, `.plt`, `.text`, `.rodata`, `.eh_frame`, `.init_array`, `.dynamic`, `.got`, `.got.plt`, `.data`, `.bss` và các note. Các section header ở lại trừ khi bạn thêm `--strip-section-headers` (binutils 2.41) hoặc chạy `llvm-strip --strip-sections`. `--strip-debug` giữ các symbol. `--only-keep-debug` ghi tệp debug mà `--add-gnu-debuglink` nêu tên từ tệp đã strip, với một CRC32 trong `.gnu_debuglink`, và `ld --build-id` ghi `.note.gnu.build-id` để một debugger có thể khớp hai tệp.

## The COFF Object

`clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c` tạo `main-x86_64.obj` và `ledger-x86_64.obj`. Trang PE Format định nghĩa object: một file header 20 byte, không optional header, một bảng section với các mục 40 byte, một bảng symbol với các bản ghi 18 byte và các bản ghi relocation 10 byte theo section.

`CoffObject` trong `code/main.py` đọc cả bốn. File header nói machine `0x8664`, 10 section, 37 bản ghi symbol, `SizeOfOptionalHeader` 0. Bảng section nêu tên `.text`, `.data`, `.bss`, sáu section tên `.rdata` và `/16`. Một tên bắt đầu bằng `/` là một offset thập phân vào bảng chuỗi, bắt đầu bằng kích thước bốn byte của chính nó; `/16` phân giải thành `.llvm_addrsig`, chính là tên mà `llvm-objdump -h` in.

37 bản ghi bao gồm các bản ghi phụ trợ. Một section symbol (storage class 3) mang một bản ghi chứa độ dài section, số relocation, một checksum và một lựa chọn COMDAT. Năm trong các section `.rdata` có selection 2, "any", và mỗi section chứa một literal chuỗi dưới một tên được mangle theo MSVC: `??_C@_04JDDJEAHN@even?$AA@` là chuỗi "even". Link editor giữ một bản sao mỗi chuỗi. Bản ghi cuối là `.file` với bản ghi phụ trợ "main.c". `llvm-objdump -t` in chúng là `[ 0]`, `AUX scnlen ...`, `[ 2]` và tiếp tục, bỏ qua các chỉ số phụ trợ, và bài kiểm tra so sánh các cặp chỉ số và tên của chúng ta với văn bản đó.

Các relocation: 14 `IMAGE_REL_AMD64_REL32` trong `.text` và 4 `IMAGE_REL_AMD64_ADDR64` trong `.rdata`. `REL32` là "địa chỉ tương đối 32 bit từ byte theo sau relocation". Đó là `R_X86_64_PC32` với `-4` tích hợp: bản ghi ELF mang addend `-4` vì bản ghi có một trường addend, và bản ghi COFF không có. `ledger-x86_64.obj` có ba `REL32` tại `0x36`, `0x84` và `0x93`, và `ledger-x86_64-O1.o` của bài 32 có ba `R_X86_64_PC32` của nó tại cùng ba offset. Mã giống nhau, và các định dạng chỉ khác ở nơi số bốn được viết. `ADDR64` là một địa chỉ tuyệt đối tám byte, bảng `labels` của các con trỏ chuỗi, và nó trở thành một base relocation trong image, như `R_X86_64_64` trở thành `R_X86_64_RELATIVE`.

| | ELF `Elf64_Rela` | relocation COFF | Mach-O `relocation_info` |
|---|---|---|---|
| kích thước bản ghi | 24 byte | 10 byte | 8 byte |
| trường | offset, type và symbol trong `r_info`, addend | offset, chỉ số symbol, type | địa chỉ, rồi một word 32 bit với symbolnum:24, pcrel:1, length:2, extern:1, type:4 |
| addend | tường minh | không có, nằm trong trường | không có, hoặc một bản ghi `ARM64_RELOC_ADDEND` trước bản ghi thật |
| lần gọi tới `puts` | `R_X86_64_PLT32 puts-0x4` | `IMAGE_REL_AMD64_REL32 puts` | `ARM64_RELOC_BRANCH26 _puts` |

## The PE Image: Imports, Exports, and Base Relocations

`tiny-x86_64.exe` là 2,560 byte được `build_tiny_pe.py` viết. Nó có cùng công việc như ELF nhỏ: gọi `puts` và `exit` từ `msvcrt.dll`. Nó cũng export một tên và mang một base relocation, nên cả ba thư mục bài học này cần đều hiện diện. `pefile` 2024.8.26 và `llvm-objdump -p` đều đọc nó, và cả hai bản thu là fixture.

Duyệt các header. Stub MS-DOS bắt đầu bằng `MZ` và tại offset `0x3c` chứa `e_lfanew`, `0x40`. Tại `0x40` là chữ ký `PE\0\0`. Rồi file header COFF: machine `0x8664`, 4 section, `SizeOfOptionalHeader` 240, characteristics `0x22` (image thực thi, nhận biết địa chỉ lớn). Optional header bắt đầu với trường `Magic`, `0x20b`, nghĩa là PE32+. `AddressOfEntryPoint` là `0x1000`, `ImageBase` là `0x140000000`, `SectionAlignment` `0x1000`, `FileAlignment` `0x200`, `SizeOfImage` `0x5000`, `Subsystem` 3 (console). `DllCharacteristics` `0x8160` giải mã thành `HIGH_ENTROPY_VA 0x0020`, `DYNAMIC_BASE 0x0040`, `NX_COMPAT 0x0100` và `TERMINAL_SERVER_AWARE 0x8000`. Rồi 16 data directory gồm RVA và kích thước. Bốn mục được đặt: Export tại `0x2080` kích thước `0x4d`, Import tại `0x2000` kích thước `0x28`, Base Relocation tại `0x4000` kích thước `0xc`, IAT tại `0x2040` kích thước `0x18`.

Các địa chỉ trong một image là RVA, offset từ địa chỉ tải cơ sở. Bảng section ánh xạ chúng đến file offset: RVA `.text` `0x1000` tại tệp `0x200`, RVA `.rdata` `0x2000` tại `0x400`, RVA `.data` `0x3000` tại `0x600`, RVA `.reloc` `0x4000` tại `0x800`. `PeImage.rva_to_offset()` là bảng đó.

### The import directory

Tại RVA `0x2000` là một mảng import descriptor 20 byte kết thúc bằng một descriptor bằng không. Bản của chúng ta có một: Import Lookup Table `0x2028`, timestamp 0, forwarder chain 0, name `0x2068`, Import Address Table `0x2040`. RVA tên trỏ đến "msvcrt.dll". Bảng tra cứu chứa các mục 64 bit kết thúc bằng không. Bit 63 được đặt nghĩa là import theo ordinal, với ordinal trong các bit 15 đến 0. Bit 63 không được đặt nghĩa là các bit 30 đến 0 là RVA của một mục hint/name: một hint 16 bit, "một chỉ số vào export name pointer table", rồi tên ASCII. Các mục của chúng ta là `0x2058` (hint 0, "puts") và `0x2060` (hint 0, "exit").

Đặc tả nói IAT "giống hệt nội dung của import lookup table cho đến khi image được bind". IAT của chúng ta tại `0x2040` chứa cùng hai RVA, và bài kiểm tra kiểm tra rằng 24 byte tại `0x2028` bằng 24 byte tại `0x2040`. "Trong binding, các mục trong import address table được ghi đè bằng các địa chỉ 32 bit (cho PE32) hoặc 64 bit (cho PE32+) của các symbol đang được import." Loader Windows làm điều đó trước khi điểm vào chạy. Không có lazy binding và không stub. Mã đến slot trực tiếp:

```text
    100b: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1011 + 0x102f = 0x2040, the IAT slot of puts
    1013: ff 15 2f 10 00 00    call qword ptr [rip + 0x102f]   # 0x1019 + 0x102f = 0x2048, the IAT slot of exit
```

`FF /2` là lần gọi near gián tiếp. Hai chỉ lệnh có cùng các byte vì mỗi chỉ lệnh nằm sau chỉ lệnh kia tám byte và đọc một slot sau slot kia tám byte. `iat_calls()` quét code section tìm `ff 15`, cộng sáu và displacement, và đặt tên slot từ import directory.

### The export directory

Tại RVA `0x2080` là bảng export directory 40 byte: cờ, timestamp, version, một RVA tên trỏ đến "tiny-x86_64.exe", ordinal base 1, 1 mục address table, 1 name pointer. Ba bảng theo sau. Export Address Table tại `0x20a8` chứa một RVA, `0x1000`. Export Name Pointer Table tại `0x20ac` chứa một RVA tới chuỗi "tiny_entry". Export Ordinal Table tại `0x20b0` chứa một chỉ số không thiên lệch 16 bit, 0. Tên `k` ánh xạ đến mục địa chỉ `ordinals[k]`, và ordinal được export là `ordinals[k] + ordinal base`. Đặc tả thêm một quy tắc chúng ta không sử dụng: một mục địa chỉ trỏ bên trong export section là một chuỗi forwarder chẳng hạn `MYDLL.expfunc`, và name pointer table được "sắp xếp theo từ điển để cho phép tìm kiếm nhị phân".

### Base relocations

`.reloc` chứa các khối. Mỗi khối bắt đầu với một RVA trang và một kích thước khối, rồi các mục 16 bit với type trong bốn bit trên và một offset trang trong mười hai bit thấp. Một khối của chúng ta: page `0x3000`, size 12, entry `0xa000`, type 10, `IMAGE_REL_BASED_DIR64`, offset 0 và một mục padding type 0, `IMAGE_REL_BASED_ABSOLUTE`. Tám byte tại RVA `0x3000` chứa `0x1400020d0`, image base cộng RVA của chuỗi "linked by hand". Nếu loader đặt image ở bất kỳ nơi khác, nó cộng hiệu vào trường đó. Đặc tả: "Các tệp image không chứa relocation COFF ... Một image chứa thông tin relocation dưới dạng các base relocation trong section .reloc (trừ khi image có thuộc tính IMAGE_FILE_RELOCS_STRIPPED)." `/DYNAMICBASE` bật mặc định trong link.exe hiện tại, nên các image mang `.reloc` và `DYNAMIC_BASE`.

Một image PE không có bảng symbol để strip. `PointerToSymbolTable` của file header "nên bằng không cho một image vì thông tin gỡ lỗi COFF đã lỗi thời", và các tên nằm trong một PDB riêng. Điều sống sót trong mọi image là import directory, export directory và, với mã 64 bit, `.pdata`, có các mục `RUNTIME_FUNCTION` nêu tên điểm bắt đầu và kết thúc của mọi hàm cấp phát stack hoặc gọi một hàm khác. Các hàm leaf vắng mặt khỏi nó.

## The Mach-O Image: Load Commands, Stubs, and the Indirect Symbol Table

`ledger_main` là executable arm64 đã liên kết. `otool -h` in 19 load command và các cờ `0x00200085`. `MH_NOUNDEFS 0x1`, `MH_DYLDLINK 0x4`, `MH_TWOLEVEL 0x80` và `MH_PIE 0x200000` cộng thành giá trị đó. 19 lệnh là bốn `LC_SEGMENT_64` (`__PAGEZERO`, `__TEXT`, `__DATA_CONST`, `__LINKEDIT`), hai `LC_LOAD_DYLIB` (`@rpath/libledger.dylib` rồi `/usr/lib/libSystem.B.dylib`) và một mỗi loại `LC_DYLD_CHAINED_FIXUPS`, `LC_DYLD_EXPORTS_TRIE`, `LC_SYMTAB`, `LC_DYSYMTAB`, `LC_LOAD_DYLINKER`, `LC_UUID`, `LC_BUILD_VERSION`, `LC_SOURCE_VERSION`, `LC_MAIN`, `LC_RPATH`, `LC_FUNCTION_STARTS`, `LC_DATA_IN_CODE` và `LC_CODE_SIGNATURE`. `MachoFile.command_names()` trả về cùng danh sách theo cùng thứ tự như `otool -l`.

`__TEXT` bắt đầu tại `0x100000000`. `__text` là 256 byte tại `0x100000558`, `main` và không gì khác, vì bốn hàm ledger nằm trong dylib. `__stubs` là 84 byte tại `0x100000658`, bảy stub mười hai byte. `__DATA_CONST` bắt đầu tại `0x100004000` với `__got`, 64 byte, tám slot con trỏ có section type `S_NON_LAZY_SYMBOL_POINTERS`, và `__const`, 32 byte, các bảng `fns[]` và `names[]` của `main.c`.

### One stub, by hand

Stub cho `_puts` ở `0x100000694`:

```text
    30 00 00 90    adrp x16, 0x100004000
    10 1e 40 f9    ldr  x16, [x16, #0x38]
    00 02 1f d6    br   x16
```

`0x90000030` là `adrp`. Thanh ghi là năm bit thấp, 16. `immlo` là các bit 30 đến 29, 0. `immhi` là các bit 23 đến 5, 1. Giá trị là `immhi << 2 | immlo = 4`, theo các trang 4,096 byte, nên trang đích là trang của chỉ lệnh, `0x100000000`, cộng `0x4000`. `0xf9401e10` là `ldr` với một offset 12 bit không dấu được nhân tỷ lệ 8: các bit 21 đến 10 là 7, nhân 8 là `0x38`, nên lần tải đọc `0x100004038`. `0xd61f0200` là `br x16`. Stub arm64 trong nguồn ld64 là chính `StubAtom` ba chỉ lệnh này.

Tên nào thuộc slot đến từ bảng symbol gián tiếp. `LC_DYSYMTAB` trỏ đến 15 chỉ số vào bảng symbol. Một stubs section nói trong `reserved1` nơi dãy chỉ số của nó bắt đầu và trong `reserved2` mỗi stub lớn bao nhiêu (12). Một pointer section sử dụng `reserved1` và tám byte mỗi slot. `__stubs` bắt đầu tại chỉ số 0 và `__got` tại chỉ số 7, nên stub 5 ánh xạ đến mục bảng symbol 10, `_puts`, và slot 7 của `__got` ánh xạ đến cùng mục. `otool -Iv` in cả hai dãy, và `indirect_table()` tái tạo mọi hàng.

### Two-level namespace

`nm -m` in `(undefined) external _puts (from libSystem)` và `(undefined) external _grade (from libledger)`. Thư viện đến từ chính bản ghi symbol. `nlist.h` định nghĩa `GET_LIBRARY_ORDINAL(n_desc)` là các bit 15 đến 8 của `n_desc`, 1 cho `LC_LOAD_DYLIB` đầu, 2 cho lệnh thứ hai, `0xfe` cho tra cứu động, `0xff` cho executable. `ld(1)`: "Với -two_levelnamespace (mặc định), linker chỉ tìm các symbol trong các dylib trên dòng lệnh và ghi lại chúng được tìm thấy trong dylib nào." `nm_lines()` kết xuất mười hai bản ghi từ `n_type`, `n_sect`, `n_desc` và `n_value`, và bài kiểm tra so sánh đầu ra của nó từng dòng với `nm -m` đã thu. Liên kết lại bằng `-Wl,-flat_namespace` và đọc `otool -h` để thấy bit `MH_TWOLEVEL` biến mất.

## Chained Fixups, Byte for Byte

`LC_DYLD_CHAINED_FIXUPS` là một `linkedit_data_command`: `dataoff 0x8000`, `datasize 208`. 208 byte theo `fixup-chains.h`.

Header là bảy trường 32 bit: `fixups_version 0`, `starts_offset 32`, `imports_offset 80`, `symbols_offset 112`, `imports_count 8`, `imports_format 1` (`DYLD_CHAINED_IMPORT`), `symbols_format 0` (không nén). `llvm-objdump --macho --chained-fixups` in bảy giá trị này và bài kiểm tra so sánh chúng.

Tại offset 32, `dyld_chained_starts_in_image`: `seg_count 4` và bốn offset, một mỗi segment, không cho các segment không có fixup. Chỉ `__DATA_CONST` có một. `dyld_chained_starts_in_segment` của nó đọc là `size 24`, `page_size 0x4000`, `pointer_format 6` (`DYLD_CHAINED_PTR_64_OFFSET`, "đích là vm offset"), `segment_offset 0x4000`, `max_valid_pointer 0`, `page_count 1` và một `page_start` 0. `DYLD_CHAINED_PTR_START_NONE`, `0xffff`, sẽ nghĩa là một trang không có fixup.

Chuỗi bắt đầu tại file offset `0x4000 + 0`. Mỗi word 64 bit mang hai thứ: ghi gì ở đó và word tiếp theo ở đâu.

```text
  dyld_chained_ptr_64_bind    ordinal:24  addend:8  reserved:19  next:12  bind:1 = 1
  dyld_chained_ptr_64_rebase  target:36   high8:8   reserved:7   next:12  bind:1 = 0
```

Đọc word đầu, `0x8010000000000000`. Bit 63 được đặt, một bind. `next` là các bit 62 đến 51, `0x002`, theo đơn vị 4 byte, nên fixup tiếp theo cách 8 byte. Ordinal là 0. Đọc word thứ mười hai tại `0x4058`, `0x00000000000006db`. Bit 63 không được đặt, một rebase. `next` là 0, cuối chuỗi. Đích là `0x6db`, một vm offset, và image base `0x100000000` làm nó thành `0x1000006db`, chuỗi "odd" trong `__cstring`. Word trước nó, `0x00100000000006d6`, rebase `names[0]` thành "even".

Phép duyệt thăm mười hai word: tám bind trong `__got` với ordinal 0 đến 7, hai bind trong `__const` với ordinal 0 (cả hai mục của `fns[]` trỏ đến `_grade`) và hai rebase của `names[]`. `chained_fixups()` trả về chúng với các file offset và word thô của chúng, và bài kiểm tra so sánh mười hai cặp `(offset, raw)` với `dyld_info -fixup_chain_details`, in `raw: 0x8010000000000000 bind: (next: 002, bindOrdinal: 0x000000)` cho word đầu.

Bảng import tại offset 80 có tám mục 32 bit: `lib_ordinal:8`, `weak_import:1`, `name_offset:23`, với tên tại offset 112. Các ordinal 0 đến 3 là `_grade`, `_grade_label`, `_percent_change`, `_total` từ thư viện 1, và 4 đến 7 là `___stack_chk_fail`, `___stack_chk_guard`, `_printf`, `_puts` từ thư viện 2. `fixup_rows()` join hai bảng thành các dòng mà `dyld_info -fixups` in, chẳng hạn `__DATA_CONST __got 0x100004038 bind libSystem/_puts`, và bài kiểm tra so sánh cả mười hai.

Vì vậy "con trỏ hỏng" tại `0x100004038` là import 7. dyld duyệt chuỗi này một lần, lúc tải, và ghi địa chỉ của `_puts` vào slot. Phiên WWDC22 của Apple diễn đạt như sau: "trong vị trí con trỏ 64 bit trong DATA, một số bit chứa offset đến vị trí fixup tiếp theo. Cũng được đóng gói trong đó là một bit nói fixup là bind hay rebase." Xcode 13 làm định dạng thành mặc định cho một deployment target macOS 12 hoặc iOS 15, và Xcode 13.3 mở rộng nó đến macOS 11 và iOS 13.4. Không có lazy binding trong định dạng này. Mọi slot được bind trước khi `main` chạy.

### The layout it replaced

`ledger_main_nochain` là cùng lần liên kết với `-Wl,-no_fixup_chains`. Thay vào đó nó có `LC_DYLD_INFO_ONLY`, với bốn bảng mã byte: rebase 8 byte, bind 72, lazy bind 120, export 64. Nó cũng có ba section mà tệp chained thiếu: `__TEXT,__stub_helper` (108 byte), một `__got` chỉ 16 byte chứa `___stack_chk_guard` và `dyld_stub_binder`, và `__DATA,__la_symbol_ptr` (56 byte, bảy slot). `dyld_info -fixups` liệt kê bảy hàng `lazy-bind` và bảy rebase trỏ mỗi slot lazy đến trampoline riêng của nó trong `__stub_helper`. Trampoline đẩy một chỉ số và nhảy đến `dyld_stub_binder`, phân giải tên và ghi slot. Đó là PLT và GOT của phần trước theo các dạng Mach-O: `__la_symbol_ptr` là `.got.plt`, `__stub_helper` là PLT0 và `pushq $index`, và `dyld_stub_binder` là `_dl_runtime_resolve`. `code/main.py` báo cáo các offset và section của tệp này và không giải mã các opcode bind; bài thực hành yêu cầu điều đó.

### The exports trie

`LC_DYLD_EXPORTS_TRIE` là một cây tiền tố. Mỗi nút là một kích thước terminal uleb128, rồi, nếu nó khác không, các cờ uleb128 và một offset uleb128, rồi một byte số con và, cho mỗi con, một cạnh chuỗi và một offset nút uleb128. `exports_trie()` duyệt nó. Trên `libledger.dylib`, nó trả về `_percent_change 0x410`, `_grade 0x428`, `_total 0x464`, `_grade_label 0x498`, bốn offset mà `dyld_info -exports` in. Trên executable, nó trả về `__mh_execute_header`, `_fns` và `_main`.

## What strip Leaves

`strip(1)` của Apple nói rằng không có tùy chọn trên một executable liên kết động, nó hành xử như `-u -r`: giữ các symbol không xác định và các symbol được tham chiếu động. `-x` loại các symbol cục bộ. `-N` loại toàn bộ bảng symbol và bảng chuỗi. "Với các thư viện dùng chung động, mức strip tối đa thường là -x", vì "Chỉ các symbol toàn cục được sử dụng bởi quá trình liên kết động".

Quan sát trên các fixture của chúng ta. `strip ledger_main` đưa `LC_SYMTAB` từ 12 xuống 10 bản ghi và loại `_main`, `_fns` và `_names`. Tám import không xác định ở lại, vì dyld cần các tên của chúng để bind, và `__mh_execute_header` ở lại vì nó là `REFERENCED_DYNAMICALLY`. Bản ghi thứ mười là một stab type `N_OPT` tên `radr://5614542`, mà các công cụ Apple viết để bảng không bao giờ rỗng; `nm` không in nó. Chương trình đã strip in cùng ba dòng như bản gốc và thoát 0. `LC_FUNCTION_STARTS` vẫn có một điểm bắt đầu, `main`.

`strip libledger.dylib` không có tùy chọn đi xa hơn `-x` thông thường của man page: `LC_SYMTAB` có 0 bản ghi và `nm` in "no symbols". Exports trie vẫn liệt kê bốn hàm tại cùng các offset, vì dyld bind qua trie và không bao giờ qua `LC_SYMTAB`. `LC_FUNCTION_STARTS` vẫn liệt kê bốn điểm bắt đầu. Lab C liên kết một `main.c` mới với dylib đã strip để cho thấy link editor cũng được trie phục vụ.

| Điều gì | ELF sau `--strip-all` | Image PE | Mach-O sau `strip` |
|---|---|---|---|
| bảng symbol tĩnh | mất | không bao giờ hiện diện trong một image | tên cục bộ và được định nghĩa mất, import không xác định ở lại |
| các tên mà loader bind | `.dynsym` và `.dynstr` ở lại | import directory ở lại | import ở lại trong `LC_SYMTAB` và trong bảng chained import |
| tên được export | `.dynsym` ở lại | export directory ở lại | exports trie ở lại |
| điểm bắt đầu hàm | các FDE `.eh_frame`, trừ khi dựng không có bảng unwind | `.pdata` cho các hàm không phải leaf | `LC_FUNCTION_STARTS` ở lại |
| thông tin gỡ lỗi | `.debug_*` mất | trong PDB, không bao giờ trong image | trong dSYM, không bao giờ trong image |
| section header hoặc load command header | ở lại trừ khi `--strip-section-headers` | ở lại | ở lại |

## Finding Functions Without Symbols

`static-arm64-O2` liên kết `main-arm64-O2.o` và `ledger-arm64-O2.o` thành một executable với năm hàm trong `__text`. `nm -n` của tệp chưa strip là ground truth: `_main` tại `0x100000500` (244 byte), `_percent_change` tại `0x1000005f4` (24), `_grade` tại `0x10000060c` (60), `_total` tại `0x100000648` (248), `_grade_label` tại `0x100000740` (72). `static-arm64-O2.stripped` không có symbol `N_SECT` bên trong `__text`. `FunctionFinder` chạy bốn phương pháp trên nó và `score()` so sánh mỗi danh sách với sự thật.

### LC_FUNCTION_STARTS

Lệnh trỏ đến chín byte trong `__LINKEDIT`: `80 0a f4 01 18 3c f8 01 00`. Định dạng là các delta uleb128, delta đầu từ địa chỉ `__TEXT`. `80 0a` là `0x500`, nên điểm bắt đầu đầu tiên là `0x100000500`. `f4 01` là `0xf4`, nên `0x1000005f4`. `18` cho `0x10000060c`, `3c` cho `0x100000648`, `f8 01` cho `0x100000740`, và `00` kết thúc danh sách. Năm trên năm, không dương tính giả, ở `-O0` và ở `-O2`. Link editor viết bảng này cho unwinder và crash reporter, và `strip` không chạm nó. Ghidra đọc nó trong analyzer "Mach-O Function Starts", `dyld_info -function_starts` in nó và LIEF cung cấp nó là `function_starts`.

### Prologue scans

Các mẫu điểm bắt đầu AARCH64 của Ghidra bắt đầu bằng `fd 7b bf a9`, tức `stp x29, x30, [sp, #-0x10]!`. Trên các tệp của chúng ta, nó tìm 0 trên 5 ở cả hai mức. clang phát ra `sub sp, sp, #N` trước rồi `stp x29, x30, [sp, #M]` với một offset dương, nên dạng pre-index không bao giờ xảy ra. Một mask cho `sub sp, sp, #imm`, `(word & 0xff0003ff) == 0xd10003ff`, tìm 5 trên 5 ở `-O0`, nơi mọi hàm có một khung, và 1 trên 5 ở `-O2`, nơi `percent_change`, `grade`, `total` và `grade_label` là các hàm leaf hoàn toàn không có khung. `percent_change` bắt đầu bằng `cbz w0, ...`. Một phép quét prologue báo cáo những gì compiler chọn phát ra, và bài 38 cho thấy thường xuyên đó là không gì cả.

Không phép quét nào tạo một dương tính giả ở đây, vì chương trình nhỏ. Các mẫu một byte chẳng hạn `55` x86-64 của `push rbp` khớp bên trong các chỉ lệnh khác, đó là lý do các tệp mẫu x86-64 của Ghidra ghép một post-pattern như `55 48 89 e5` với một pre-pattern chẳng hạn `ret` hoặc `nop` phải kết thúc hàm trước.

### Call targets

Mọi `bl` trong `__text` nêu tên một điểm bắt đầu hàm, vì một `bl` vào giữa một hàm là thứ một compiler không phát ra cho C. Mã hóa là `0x94000000` với một offset word 26 bit có dấu. `bl` tại `0x1000005a0` đọc ra `3d 00 00 94`: `0x3d` là 61, nhân 4 là `0xf4`, nên đích là `0x100000694`. Trong `ledger_main`, đó là stub cho `_puts`. Trong bản build tĩnh, `call_targets()` thu các đích bên trong `__text`, bỏ các đích rơi trong `__stubs` và thêm điểm vào `LC_MAIN`, vì không có gì gọi `main`. Năm trên năm ở cả hai mức. Nucleus (Andriesse, Slowinska, Bos, 2017) xây dựng phát hiện hàm của nó trên ý tưởng này cho mã do compiler tạo, và Andriesse cùng những người khác đo năm 2016 rằng các ranh giới hàm là phần khó của disassembly, khó hơn các ranh giới chỉ lệnh.

## A FLIRT-Shaped Signature

Hex-Rays mô tả FLIRT trong tài liệu của nó: một mẫu là "32 byte đầu của một hàm nơi mọi byte biến thể được đánh dấu", các byte biến thể đến từ fixup và tham chiếu bên ngoài, các mẫu nằm trong một cây, và ngoài mẫu "chúng ta tính CRC16 của các byte bắt đầu từ vị trí 33 cho đến byte biến thể đầu tiên" và lưu độ dài đó. Hai hàm có cùng mẫu và CRC được phân biệt bởi một byte đuôi tại một vị trí nơi chúng khác nhau, rồi bởi các tên mà chúng tham chiếu. Một va chạm mà không có gì phân biệt được "được giải quyết bằng trí thông minh tự nhiên". Các hàm ngắn hơn bốn byte không có tham chiếu bên ngoài bị loại, và "tệp chữ ký không chứa byte nào từ các thư viện gốc, trừ các tên hàm".

`signatures_from_object()` xây dựng điều đó từ `ledger-arm64-O2.o` và `main-arm64-O2.o`, theo cách FLAIR xây dựng nó từ các object của một thư viện. Mọi bản ghi `relocation_info` bao phủ một word bốn byte, và các byte đó trở thành biến thể. Bố cục dòng `.pat`, được ghi tài liệu trong parser của rizin, là mẫu, độ dài CRC, CRC16, độ dài hàm, `:0000` và tên, và `^offset name` cho mỗi tên được tham chiếu:

```text
A00000342800004B890C8052087D091B000DC01AC0035FD6 00 0000 0018 :0000 _percent_change
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 003C :0000 _grade ^0000 l_switch.table.grade ^0001 l_switch.table.grade
E8CC8C52C8CCAC72087C289B09FD7FD308FD62930801090B081900511F110071 04 9AAF 0048 :0000 _grade_label ^0000 l_switch.table.grade_label ^0001 l_switch.table.grade_label ^0002 _labels ^0003 _labels
```

`_percent_change` là 24 byte, nên mẫu của nó là toàn bộ hàm và độ dài CRC là 0. `_grade` là 60 byte với relocation đầu tại byte 36, nên CRC bao phủ bốn byte. CRC16 là CRC mà các parser `.pat` công khai sử dụng: đa thức `0x8408`, giá trị đầu `0xffff`, lấy bù, rồi đổi chỗ hai byte. Giá trị của nó cho chuỗi ASCII "123456789" là `0x6e90`, và bài kiểm tra ghim điều đó.

`match_signatures()` thử mọi chữ ký tại mọi điểm bắt đầu hàm của bản build đã strip, mẫu trước, rồi CRC. Ở `-O0`, cả năm hàm nhận các tên của chúng và không có gì va chạm. Ở `-O2`, hai dòng ở trên va chạm. `grade_label` inline `grade`, nên hai hàm chia sẻ 36 byte đầu và bốn byte CRC của chúng. Cả hai chữ ký khớp tại `0x10000060c` và tại `0x100000740`. Đuôi tách chúng: tại byte 44, `_grade` có `20` và `_grade_label` có `28`, tức `ldr w0, [x9, w8, uxtw #2]` so với `ldr x8, [x9, w8, uxtw #3]`, và các độ dài là 60 so với 72. Báo cáo ghi cả hai va chạm và byte quyết định chúng. Năm trên năm được đặt tên, ở cả hai mức.

Bài kiểm tra `test_object_bytes_equal_linked_bytes_outside_relocated_words` kiểm tra tiền đề: mọi byte không biến thể của mỗi hàm object bằng byte ở cùng offset trong executable đã liên kết, nên link editor chỉ thay đổi các word được tái định vị. `_total` không có relocation và hoàn toàn không byte biến thể.

### What the tools do with the same idea

IDA Pro 9.4 phát hành các chữ ký FLIRT theo bộ xử lý và công cụ `sigmake` để dựng chúng; IDA Free chỉ bao quát x86 và x86-64 và dành cho sử dụng phi thương mại. Lumina là một server đặt khóa metadata hàm theo một md5 của hàm và bỏ qua các hàm dưới 32 byte. Ghidra 12.1.4 (Apache-2.0) có Function ID: một hash đầy đủ trên mnemonic và các chế độ định địa chỉ "bền vững trước các thay đổi do liên kết" và một hash cụ thể thêm các toán hạng hằng số, được chấm điểm theo chỉ lệnh khớp, với các hàm cha và con làm tiêu chí phân xử; các cơ sở dữ liệu đi kèm của nó chỉ bao quát các thư viện Visual Studio, và bạn điền bản của riêng bạn từ các binary của riêng bạn. Binary Ninja 6.0 Krypton (thương mại, với một phiên bản Free) sử dụng WARP (Apache-2.0): GUID hàm là một UUIDv5 trên các GUID basic block, mỗi GUID là một UUIDv5 trên các byte khối sau khi đặt không "mọi chỉ lệnh có thể tái định vị" và bỏ NOP, với các hàm được gọi, caller và hàm liền kề làm các ràng buộc. BinDiff 8 (Apache-2.0) khớp các hàm giữa hai binary với một thứ tự bước cố định, từ khớp hash qua các MD index đồ thị luồng đến khớp chuỗi gọi, và tính trọng số độ tương đồng từ các cạnh, khối, chỉ lệnh được khớp và MD index đồ thị luồng. Diaphora 3.4.3 (AGPL-3.0, chỉ IDA) thêm tích các số nguyên tố nhỏ, nơi mỗi mnemonic ánh xạ đến một số nguyên tố và một hàm là tích, một dấu vân tay đa tập không thứ tự. radare2 6.2.4 (LGPL-3.0) có zignature (`zg`, `z/`, `zb`) và đọc các tệp FLIRT `.sig` bằng `zfs`; rizin 0.9.1 (LGPL-3.0) tạo `.pat` hoặc `.sig` từ một binary đang mở bằng `Fc` và áp dụng một chữ ký bằng `Fs`.

IDA và Binary Ninja đóng và được mô tả ở đây từ tài liệu của chúng. radare2 và rizin không được cài trên máy này, và các lệnh của chúng được trích từ các sách và nguồn của chúng. Các công cụ đã chạy trên các fixture này là `clang`, `ld`, `llvm-objdump`, `otool`, `nm`, `strip` và `dyld_info` từ Command Line Tools, và LIEF 1.0.0, pyelftools 0.33 và pefile 2024.8.26 qua thăm dò. LIEF đọc mọi định dạng ở đây, bao gồm các object COFF, mà nó hỗ trợ từ 0.17.0, và báo cáo mười binding và hai rebase trên `ledger_main`, cùng mười hai fixup. pyelftools chỉ đọc các tệp ELF. pefile từ chối `main-x86_64.obj` với `PEFormatError: 'DOS Header magic not found.'` và đọc image nhỏ.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
```

Đầu ra là một báo cáo JSON với năm phần. `elf` chứa các số relocation của hai object, kế hoạch liên kết và dynamic section, PLT, GOT của `tiny-dyn-x86_64`. `coff` chứa các section, relocation, hàm và tên không xác định của hai object. `pe` chứa các header, directory, import, export, base relocation và lần gọi IAT của `tiny-x86_64.exe`. `macho` chứa `ledger_main` với các stub, chained fixup, hàng fixup và export của nó, bố cục cũ của `ledger_main_nochain`, dylib và hai báo cáo strip. `identification` chứa sự thật, bốn phương pháp với điểm số và các chữ ký với các va chạm của chúng, ở `-O0` và `-O2`.

Dạng kỳ vọng:

```json
{
  "elf": {"linkPlan": {"pltSymbols": ["puts", "printf"], "sizes": {".plt": 48, ".got.plt": 40, ".rela.plt": 48, ".rela.dyn": 48}, "...": "..."}, "tiny-dyn-x86_64": {"...": "..."}},
  "coff": {"main-x86_64.obj": {"...": "..."}},
  "pe": {"imports": [{"dll": "msvcrt.dll", "iat": "0x2040", "...": "..."}], "...": "..."},
  "macho": {"ledger_main": {"flags": "0x200085", "fixupRows": ["__DATA_CONST __got 0x100004000 bind libledger/_grade", "..."], "...": "..."}, "strip": {"...": "..."}},
  "identification": {"O2": {"methods": {"functionStarts": {"recall": "5/5"}, "prologueSub": {"recall": "1/5"}, "...": "..."}, "correctNames": 5}}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `ElfFile` đọc header, section, cả hai bảng symbol và relocation, và `dynamic_entries()`, `jump_slots()`, `plt_entries()` và `plt0()` đọc image đã liên kết.
2. `plan_dynamic_link()` áp dụng Bảng 4.9 và mục 5.2 cho các bản ghi relocation của các object có thể tái định vị.
3. `CoffObject` đọc file header, bảng section, các symbol 18 byte với các bản ghi phụ trợ của chúng và các relocation 10 byte.
4. `PeImage` đọc stub MS-DOS, chữ ký PE, optional header, data directory, section và các directory import, export, base relocation, và `iat_calls()` giải mã `ff 15`.
5. `MachoFile` đọc load command, segment, bản ghi `nlist`, bảng symbol gián tiếp, stub, chained fixup, exports trie và relocation object.
6. `FunctionFinder` chạy bốn bộ tìm điểm bắt đầu và `score()` so sánh mỗi bộ với sự thật.
7. `signatures_from_object()` và `match_signatures()` xây dựng và áp dụng các chữ ký dạng FLIRT.
8. Các hàm `parse_*` đọc văn bản công cụ đã thu mà các bài kiểm tra so sánh đối chiếu.

Thêm các lệnh: `python3 code/main.py elf FILE`, `coff FILE`, `pe FILE` và `macho FILE` in một báo cáo. `python3 code/main.py plan OBJECT...` in kế hoạch liên kết cho bất kỳ tập object ELF nào. `python3 code/main.py functions STRIPPED UNSTRIPPED OBJECT...` chấm điểm các bộ tìm và các chữ ký trên một cặp bản build khác của riêng bạn.

## Use It

Sử dụng các trình đọc theo thứ tự này trên một chương trình bạn đã dựng.

1. Đọc các header và nêu tên định dạng và loại: object có thể tái định vị, executable hoặc thư viện dùng chung. Trình đọc từ chối những gì nó không biết, và sự từ chối đó là thông tin.
2. Liệt kê các import với provider của chúng: `DT_NEEDED` và `.dynsym`, import directory hoặc bảng chained import và `LC_LOAD_DYLIB`. Mọi lần gọi đến một tên trên danh sách đó rời image.
3. Đi theo một lần gọi bằng tay đến slot của nó. Viết ra các byte gọi, các byte stub hoặc PLT, địa chỉ slot, word trong tệp và điều loader ghi ở đó. Nếu word trong tệp trông như rác, giải mã nó như một fixup trước khi gọi nó là rác.
4. So sánh bảng symbol với các export và các điểm bắt đầu hàm. Các tên mà loader cần sống sót qua `strip`. Các tên mà chỉ debugger cần thì không. Nói một tên thiếu thuộc nhóm nào.
5. Trong một bản build đã strip, chạy các bộ tìm bạn có thể chạy và chấm điểm chúng với bản song sinh chưa strip trong khi bạn vẫn có một bản. Ưu tiên các bảng mà link editor viết, `LC_FUNCTION_STARTS`, `.pdata` hoặc `.eh_frame`, hơn các mẫu byte, và sử dụng các đích gọi để lấp các khoảng trống.
6. Xây dựng các chữ ký từ các object của riêng bạn và áp dụng chúng. Ghi mọi va chạm và byte tách nó. Một tên mà hai chữ ký nhận là một điều chưa biết cho đến khi đuôi hoặc một tên được tham chiếu quyết định nó.

Giữ văn bản công cụ đã thu cùng các tệp. Khi toolchain thay đổi, thu lại, vì một danh sách thay đổi là một fixture thay đổi.

## Interactive Lab

### Lab A: the PLT by hand

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code
python3 -q
```

Chạy:

```python
from main import *
elf = load_elf("tiny-dyn-x86_64")
[(e.tag_name, e.text) for e in elf.dynamic_entries()]
elf.plt0()
[(e.symbol, hex(e.address), hex(e.slot), hex(e.slot_initial)) for e in elf.plt_entries()]
[hex(w) for w in elf.got_plt_words()]
```

Trước mỗi lần gọi, tính câu trả lời từ các byte trong văn bản ở trên. Rồi thay `IMPORTS` trong `build_tiny_dyn_elf.py` thành ba tên, dựng lại và dự đoán các kích thước mới của `.plt`, `.got.plt` và `.rela.plt` trước khi đọc chúng.

### Lab B: one chained fixup

```python
exe = load_macho("ledger_main")
stub = next(s for s in exe.stubs() if s.symbol == "_puts")
stub.lines()
raw = int.from_bytes(exe.read(stub.slot, 8), "little")
hex(raw), raw >> 63, (raw >> 51) & 0xfff, raw & 0xffffff
[(i.index, i.name, i.library) for i in exe.chained_fixups()["imports"]]
```

Giải mã word bind trên giấy trước: bit bind, trường `next` theo đơn vị bốn byte, ordinal. Rồi đọc word cách tám byte và xác nhận nó là fixup tiếp theo. Rồi đọc word cuối của chuỗi tại `0x100004058` và giải thích vì sao `next` của nó bằng không.

### Lab C: strip and relink

Trong thư mục fixture, liên kết một chương trình mới với dylib đã strip hoàn toàn:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/code/fixtures
clang -target arm64-apple-macos -O1 main.c -L. -lledger.stripped -Wl,-rpath,@executable_path -o /tmp/relinked
nm /tmp/relinked | grep ' U '
dyld_info -exports libledger.stripped.dylib
```

Liên kết thành công với một thư viện có `LC_SYMTAB` rỗng, vì link editor đọc exports trie. Rồi chạy `python3 ../main.py macho libledger.stripped.dylib` và so sánh `symtab`, `exports` và `functionStarts`. Rồi thay vào đó strip bản build tĩnh bằng `-N` và thấy điều `dyld_info -function_starts` vẫn in.

### Lab D: the collision

```python
from main import *
stripped = load_macho("static-arm64-O2.stripped")
sigs = signatures_from_object(load_macho("ledger-arm64-O2.o"))
[s.pat_line() for s in sigs]
starts = FunctionFinder(stripped).function_starts()
match_signatures(sigs, stripped, starts)
```

Đọc hai bản ghi va chạm. Rồi xây dựng các chữ ký từ `ledger-arm64-O0.o`, khớp chúng với `static-arm64-O0.stripped` và giải thích từ các dòng `.pat` vì sao không có va chạm xảy ra ở `-O0`. Rồi rút `PATTERN_LENGTH` xuống 16 và đếm bao nhiêu hàm va chạm.

## Practice Lab

Giải mã các bảng binding cũ và thêm bộ tìm PE.

Yêu cầu:

- Giải mã các luồng opcode rebase, bind và lazy bind `LC_DYLD_INFO_ONLY` của `ledger_main_nochain` thành các hàng với segment, section, địa chỉ, type và đích, và làm chúng bằng 21 hàng trong văn bản `dyld_info -fixups` đã thu.
- Thêm một program header `PT_GNU_RELRO` và một `DT_FLAGS` với `DF_BIND_NOW` vào `build_tiny_dyn_elf.py`, chuyển `.got.plt` vào trong phạm vi được bao phủ và làm `llvm-objdump -p` hiển thị header mới. Nói trong README fixture phần nào của full RELRO mà điều này tái tạo và phần nào chỉ glibc có thể thực hiện.
- Viết một trình đọc `.pdata` cho một image PE32+ và một bộ tìm hàm sử dụng các địa chỉ bắt đầu `RUNTIME_FUNCTION`. Dựng một object bằng `clang -target x86_64-pc-windows-msvc -c` không có `-fno-asynchronous-unwind-tables`, đọc các relocation `.pdata` của nó và nêu những hàm nào của nó là các hàm leaf mà bảng bỏ qua.
- Viết một bài kiểm tra cho mỗi trình đọc so sánh với văn bản công cụ đã thu.

Thành công nghĩa là `python3 code/main.py macho ledger_main_nochain` in cùng 21 hàng fixup mà `dyld_info` in, ELF nhỏ mang một `PT_GNU_RELRO` mà `llvm-objdump` liệt kê, và bộ tìm `.pdata` nêu tên các hàm nó có thể và liệt kê các hàm leaf nó không thể.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-linking-loading-and-stripped-binaries.md`. Sử dụng nó để biến một chương trình bạn đã dựng thành một danh sách các import với provider của chúng, một lần gọi được truy vết đến slot mà loader điền, một phát biểu về điều `strip` loại bỏ và điều sống sót, và một khôi phục có chấm điểm các điểm bắt đầu hàm cùng tên trong một bản build đã strip. Nó yêu cầu bản song sinh chưa strip làm ground truth, một danh sách công cụ đã thu cho mọi khẳng định và một bản ghi của mọi va chạm.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries
python3 code/main.py
python3 code/tests/test_main.py
```

Xác minh nên chứng minh:

- dynamic section của `tiny-dyn-x86_64` khớp `llvm-objdump -p` từng tag, và `DT_FLAGS_1` mang `DF_1_PIE`
- hai bản ghi `R_X86_64_JUMP_SLOT` khớp `llvm-objdump -R` và nêu tên `puts` và `exit`
- PLT0 đẩy GOT+8 và nhảy qua GOT+16, mỗi mục đọc slot của nó và đẩy chỉ số của nó, và mỗi slot chứa địa chỉ `pushq` riêng của nó
- các section và program header của ELF nhỏ khớp `llvm-objdump -h -p`
- các bản ghi relocation của hai object ELF khớp `llvm-objdump -r`
- kế hoạch liên kết tìm hai symbol PLT, bốn lần gọi trực tiếp, hai relocation tương đối và các kích thước của image nhỏ
- bảng section COFF, 37 bản ghi symbol với các bản ghi phụ trợ và các relocation khớp `llvm-objdump -h -t -r`, và `/16` phân giải thành `.llvm_addrsig`
- ba bản ghi COFF `REL32` của `ledger` nằm tại ba offset ELF `PC32`
- các header PE, `DllCharacteristics` và các data directory khớp `llvm-objdump -p`
- import directory, các mục hint/name và IAT khớp `llvm-objdump` và `pefile`, và IAT bằng lookup table trước binding
- export directory và base relocation `DIR64` giải mã được, và con trỏ được tái định vị nêu tên chuỗi "linked by hand"
- `ff 15` tại RVA `0x100b` phân giải đến slot IAT của `puts`
- các cờ Mach-O, 19 tên load command và hai thư viện khớp `otool`
- bảy stub giải mã thành tám slot `__got` và bảng symbol gián tiếp khớp `otool -Iv`
- header chained fixup khớp `llvm-objdump --macho --chained-fixups`
- phép duyệt chuỗi tái tạo cả mười hai word thô của `dyld_info -fixup_chain_details`
- các hàng fixup và bảng import khớp `dyld_info -fixups` và `-imports`
- exports trie khớp `dyld_info -exports` cho dylib và cho bản sao đã strip của nó
- `nm_lines()` bằng `nm -m` cho executable và bản sao đã strip của nó
- `strip` loại `_main`, `_fns` và `_names`, giữ chín tên và một stab `radr://5614542`, và chương trình đã strip in cùng đầu ra
- bố cục cũ có `LC_DYLD_INFO_ONLY`, bảy con trỏ lazy và các rebase vào `__stub_helper`
- các relocation object arm64 khớp `llvm-objdump -r`
- `LC_FUNCTION_STARTS` khôi phục năm trên năm ở cả hai mức và bằng `nm` cùng `dyld_info -function_starts`
- phép quét `sub sp` tìm năm trên năm ở `-O0` và một trên năm ở `-O2`, và phép quét khung `stp` không tìm gì
- các đích `bl` cộng điểm vào `LC_MAIN` khôi phục năm trên năm
- các chữ ký đặt tên cả năm hàm ở cả hai mức và ghi va chạm `grade` được tách bằng byte 44
- CRC16 của "123456789" là `0x6e90`, và tám byte dưới cặp tải GOT của `main` là biến thể
- mọi byte object không biến thể bằng byte đã liên kết
- demo và dữ liệu hình báo cáo cùng các địa chỉ, và mô-đun site nhúng cùng dữ liệu trong ES5

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Một `bl` hoặc `call` đến một stub | "gọi một hàm không tên tại 0x694" | các byte stub, slot nó tải và import mà slot bind |
| Một word GOT đọc từ tệp | "con trỏ hỏng 0x8010000000000007" | bit 63 là bind, `next` là 2, ordinal 7 là `_puts` từ thư viện 2 |
| `PLT32` trong một object | "mọi lần gọi đi qua PLT" | các symbol được định nghĩa được rút về một khoảng cách trực tiếp, chỉ các symbol không xác định có một mục |
| Partial RELRO được đọc như full | "GOT chỉ đọc" | các slot `.got.plt` sau ba slot dành riêng nằm ngoài `PT_GNU_RELRO` khi không có `-z now` |
| COFF `REL32` được so sánh với ELF `PC32` | "bản build Windows có các relocation khác" | cùng các offset, `-4` nằm trong addend ELF và trong trường COFF |
| IAT được đọc trước khi tải | "các import trỏ đến chuỗi" | IAT bằng lookup table cho đến khi loader bind, và các chuỗi là các mục hint/name |
| Một dylib đã strip | "không symbol, không gì được export" | exports trie và `LC_FUNCTION_STARTS` liệt kê mọi hàm |
| `nm` trên một executable đã strip | "một hàm" | `LC_FUNCTION_STARTS` liệt kê năm điểm bắt đầu, dài chín byte |
| Một phép quét prologue ở `-O2` | "một hàm" | bốn hàm leaf không có khung, các đích gọi và bảng điểm bắt đầu tìm chúng |
| Hai hàm chia sẻ 36 byte | "grade_label là grade" | byte đuôi tại 44 và các độ dài 60 và 72 tách va chạm |
| Một công cụ chạy trên bản build của máy khác | các con số trong văn bản này | thu lại mọi danh sách từ các fixture của riêng bạn |

## Operational Rule

Đi theo mọi lần gọi bên ngoài từ điểm gọi đến slot mà loader điền, và giải mã word trong slot đó như định dạng định nghĩa nó trước khi gọi nó là một địa chỉ. Chỉ strip sau khi bạn đã ghi những gì loader vẫn cần. Khôi phục các điểm bắt đầu hàm từ các bảng mà link editor viết trước khi bạn quét các byte, chấm điểm mọi bộ tìm với một bản song sinh có symbol và ghi mỗi va chạm chữ ký với byte đã tách nó.

## Further Reading

- [System V gABI, chapter 5: Program Loading and Dynamic Linking](https://www.sco.com/developers/gabi/latest/ch5.dynamic.html)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement: section 5.2 and Table 4.9](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Drepper, "How To Write Shared Libraries", version 4.1.2](https://akkadia.org/drepper/dsohowto.pdf)
- [Drepper, "ELF Symbol Versioning"](https://akkadia.org/drepper/symbol-versioning)
- [Jelinek, "Little hardening DSOs/executables against exploits", binutils list, 2004-01-06](https://www.sourceware.org/ml/binutils/2004-01/msg00070.html)
- [Taylor, "Linker relro", 2008](https://www.airs.com/blog/archives/189)
- [Commit binutils bd7ab16b: PLT32 cho các lần gọi, 2018-02-13](https://gnu.googlesource.com/binutils-gdb/+/bd7ab16b4537788ad53521c45469a1bdae84ad4a) và [LLVM D43383](https://reviews.llvm.org/D43383)
- [GNU Binutils: strip](https://sourceware.org/binutils/docs/binutils/strip.html) và [llvm-objcopy](https://llvm.org/docs/CommandGuide/llvm-objcopy.html)
- [Microsoft, PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [CALL instruction reference, FF /2](https://www.felixcloutier.com/x86/call)
- [Apple, mach-o/loader.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/loader.h) và [mach-o/nlist.h](https://github.com/apple-oss-distributions/xnu/blob/main/EXTERNAL_HEADERS/mach-o/nlist.h)
- [Apple dyld, mach-o/fixup-chains.h](https://github.com/apple-oss-distributions/dyld/blob/main/include/mach-o/fixup-chains.h)
- [Apple ld64, stub_arm64.hpp](https://github.com/apple-oss-distributions/ld64/blob/main/src/ld/passes/stubs/stub_arm64.hpp)
- [Ghi chú phát hành Xcode 13: chained fixup](https://developer.apple.com/documentation/xcode-release-notes/xcode-13-release-notes) và [phiên WWDC22 110362, "Link fast: Improve build and launch times"](https://developer.apple.com/videos/play/wwdc2022/110362/)
- [strip(1)](https://keith.github.io/xcode-man-pages/strip.1.html), [ld(1)](https://keith.github.io/xcode-man-pages/ld.1.html) và [dyld(1)](https://keith.github.io/xcode-man-pages/dyld.1.html)
- [Hex-Rays, IDA F.L.I.R.T. Technology: In-Depth](https://docs.hex-rays.com/core/flirt/concepts/ida-f.l.i.r.t.-technology-in-depth) và [Tổng quan Lumina](https://docs.hex-rays.com/add-ons/lumina/overview)
- [Trợ giúp Ghidra Function ID](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/src/main/help/help/topics/FunctionID/FunctionID.html) và [các mẫu điểm bắt đầu hàm AARCH64](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Processors/AARCH64/data/patterns/AARCH64_LE_patterns.xml)
- [Vector 35, WARP](https://github.com/Vector35/warp) và [hướng dẫn Binary Ninja WARP](https://docs.binary.ninja/guide/warp.html)
- [Sổ tay BinDiff](https://www.zynamics.com/bindiff/manual/) và [nguồn BinDiff](https://github.com/google/bindiff)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [rizin pat.c, parser .pat](https://github.com/rizinorg/rizin/blob/dev/librz/sign/pat.c), [radare2 flirt.c](https://github.com/radareorg/radare2/blob/master/libr/anal/flirt.c) và [sách radare2: Zignatures](https://book.rada.re/signatures/zignatures.html)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse) và [Andriesse, Slowinska, Bos, "Compiler-Agnostic Function Detection in Binaries" (EuroS&P 2017)](https://danielandriesse.com/papers/eurosp-2017.pdf)
- [Bao et al., ByteWeight (USENIX Security 2014)](https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/bao) và [Shin, Song, Moazzezi, "Recognizing Functions in Binaries with Neural Networks" (USENIX Security 2015)](https://www.usenix.org/conference/usenixsecurity15/technical-sessions/presentation/shin)
- [Nhật ký thay đổi LIEF](https://lief.re/doc/latest/changelog.html), [pyelftools](https://github.com/eliben/pyelftools) và [pefile](https://github.com/erocarrera/pefile)
