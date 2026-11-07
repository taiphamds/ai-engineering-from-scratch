---
id: addend-0x10-table-0x14
title: The table starts at 0x14 and the addend says 0x10
card: evidence-reverse-engineering
kind: code-reading
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [coding, screen]
tags: [reverse-engineering, elf, relocation, symbol-table, file-offset]
minutes: 8
lessons: [phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch, phases/13-tools-and-protocols/33-disassembly-and-control-flow]
manuals: []
practice: []
cheatsheet: [re-from-scratch-tools]
related: []
updated: 2026-11-03
---

Từ một object có thể tái định vị: symbol `grade` có `st_value 0x10`, `st_size 46`, section `.text`; `.text` có `sh_offset 0x40` và `sh_addr 0`. Bảng relocation giữ một bản ghi tại offset `0x36`, kiểu `R_X86_64_PC32`, symbol `.rodata`, addend `0x10`, và lệnh tại `0x33` là `leaq (%rip), %rcx` có bốn byte cuối bằng không. Trả lời ba câu hỏi: những byte file nào là `grade`, các byte không trở thành gì, và tại sao addend là `0x10` khi bảng giá trị trả về bắt đầu tại `.rodata+0x14`.

## Short answer

File offset của một hàm là `sh_offset + st_value - sh_addr`, ở đây `0x40 + 0x10`, vì vậy `grade` là 46 byte tại file offset `0x50`, và chỉ `st_value` là một offset bên trong section, không phải một vị trí trong file. Các byte không là trường độ dời của một toán hạng tương đối RIP; trình biên tập liên kết ghi `S + A - P` vào chúng, giá trị symbol cộng addend trừ địa chỉ trường. Bộ xử lý cộng trường đó vào địa chỉ lệnh tiếp theo, `0x3a`, cách trường bốn byte, vì vậy đích cuối là `.rodata + 0x10 + 4 = .rodata + 0x14`; addend mang offset đích trừ bốn byte giữa trường và cuối lệnh.

## Full answer

### Tables that point at tables

Chỉ ELF header có vị trí cố định trong file. Mọi cấu trúc khác được tìm bằng một offset lưu trong một cấu trúc khác: `e_shoff` nêu bảng section header, `sh_offset` nêu các byte của một section, `st_value` là một offset bên trong section do `st_shndx` nêu trong khi `sh_addr` bằng không trong một object. Kích thước quan trọng ngang vị trí bắt đầu: `grade` kết thúc ở offset `.text` `0x3e`, và hai byte `66 90` sau nó là một `nop` trình biên dịch thêm để hàm tiếp theo bắt đầu trên một ranh giới 16 byte. Chúng không thuộc symbol nào, một disassembler dừng tại `st_size`, và một phép so sánh byte mask chúng.

### Three relocation outcomes

| Kiểu | Công thức | Trình biên tập liên kết làm gì |
|---|---|---|
| `R_X86_64_PC32` đến một symbol đã định nghĩa | `S + A - P` | ghi khoảng cách và bản ghi biến mất |
| `R_X86_64_PLT32` đến một hàm chưa định nghĩa | `L + A - P` | tạo một mục PLT và một vị trí GOT khi symbol vẫn có thể bị preempt; khi liên kết ràng buộc symbol, ghi khoảng cách trực tiếp |
| `R_X86_64_64` trong một image độc lập vị trí | `S + A` | giữ một bản ghi tương đối cho loader |

Cùng phép bù xuất hiện trên mọi toán hạng tương đối RIP trong các fixture: một lời gọi `grade` mang `grade-0x4` vì cùng lý do. Năm word tại `.rodata+0x14` đọc là `1, 2, 3, 4, 4`, là cách trình biên dịch biến `switch` thành một bảng giá trị trả về ở `-O1`.

### The jump table at -O0 uses the same arithmetic

Trong object chưa tối ưu mọi byte bảng bằng không và các đích chỉ tồn tại dưới dạng năm bản ghi trong `.rela.rodata`. Áp dụng `S + A - P` cho mục `k` tại offset `4k`: giá trị được lưu là `.text + A - (.rodata + 4k)`, mã cộng `.rodata` trở lại, vì vậy đích là `.text + A - 4k`. Mục 0 là `0x91`, mục 1 là `0x8c - 4 = 0x88`, mục 2 là `0x7f`, các mục 3 và 4 đều là `0x76`, case dùng chung.

### When the section headers are gone

Một linker có thể loại bảng section header và `e_shoff` trở thành không; một công cụ duyệt các section không thấy gì. Loader chưa bao giờ nhìn chúng: `PT_LOAD` ánh xạ một địa chỉ đến một file offset bằng `p_offset + (address - p_vaddr)`. Một địa chỉ đã liên kết cũng không phải địa chỉ runtime, vì một executable độc lập vị trí nạp tại một base do kernel chọn, và file offset là tọa độ ổn định.

## Follow-ups

- **Level 2:** Hai byte ngay sau `grade` là gì, và của ai? Expected: phần đệm căn chỉnh, một `nop`, không symbol nào sở hữu; `st_size` là điều kiện dừng.
- **Level 3:** Trong object `-O0` các byte bảng nhảy đều bằng không. Các đích ở đâu? Expected: trong năm bản ghi relocation; đích bằng addend trừ `4k`, và mã cộng base bảng trở lại.
- **Level 3:** Executable bị bỏ các section header. Bạn tìm các byte đằng sau một địa chỉ như thế nào? Expected: qua program header `PT_LOAD`, `p_offset + (address - p_vaddr)`.
- **Level 4:** Một decompiler hiển thị bảng dưới một tên `DAT_` tại một địa chỉ tuyệt đối. Đối chiếu nó với `.rodata+0x14`. Expected: nó đặt object tại base riêng và áp dụng relocation; trừ base nó cho `.rodata` và offset là `0x14`.

## Wrong answers

- "`grade` ở file offset `0x10`." Đó là `st_value`, một offset bên trong `.text`; file offset cộng `sh_offset`.
- "Bảng bắt đầu tại `0x10` vì addend nói vậy." Addend bù cho bốn byte đến cuối lệnh; đích là `0x14`.
- "Lệnh là `lea 0(%rip)`." Các số không là chỗ giữ chỗ mà trình biên tập liên kết điền; bản ghi relocation nêu toán hạng.

## Taught in

[Bài học bộ đọc ELF](../../../phases/13-tools-and-protocols/32-program-anatomy-elf-from-scratch/) suy ra file offset và addend bằng tay, và [bài học disassembly](../../../phases/13-tools-and-protocols/33-disassembly-and-control-flow/) áp dụng cùng công thức cho bảng nhảy.
