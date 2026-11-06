# Disassembly and Control Flow: From Bytes to a Graph You Can Check

> Một danh sách disassembly là một khẳng định về những byte nào là chỉ lệnh, và bài học này xây dựng decoder và đồ thị kiểm tra khẳng định đó.

**Type:** Build
**Languages:** Python, C, x86-64 assembly
**Prerequisites:** Phase 13 · 32 (ELF from scratch)
**Time:** ~150 minutes

## Learning Objectives

- Giải mã tập con chỉ lệnh x86-64 trong các fixture ledger từ các quy tắc trong Intel SDM Tập 2, Chương 2.
- Chứng minh decoder với `llvm-objdump -d` trên mọi chỉ lệnh của mọi bản build fixture.
- Chạy một linear sweep và một recursive descent trên cùng các byte và giải thích mỗi cách sai ở đâu.
- Cắt các chỉ lệnh thành basic block và xây dựng một đồ thị luồng điều khiển với các cạnh có kiểu.
- Tính immediate dominator bằng thuật toán lặp của Cooper, Harvey và Kennedy, và tìm các vòng lặp từ back edge.
- Khôi phục các đích của một bước nhảy gián tiếp từ các mục relocation trỏ đến bảng của nó.

## The Problem

Bạn biên dịch `ledger.c` ở `-O0` và hỏi một agent `grade` làm gì. Agent gọi một disassembler, đọc danh sách và trả lời rằng hàm kết thúc ở `jmpq *%rax` không có đích đã biết. Rồi nó viết mã giả với một `return 0` duy nhất.

Bạn mở cùng object trong `llvm-objdump -d` và thấy bốn khối sau bước nhảy lưu 4, 3, 2 và 1. Danh sách đã có chúng từ đầu. Không có gì trong danh sách nói cách thực thi đến chúng, nên công cụ coi chúng là mã chết.

Một danh sách chỉ trả lời một câu hỏi: các byte nào tạo thành chỉ lệnh nào. Nó không nói các chỉ lệnh nào chạy, theo thứ tự nào hoặc từ đâu. Để trả lời chúng bạn cần thêm ba cấu trúc: các byte mà luồng điều khiển có thể tới, các basic block và các cạnh giữa chúng.

rea 6.5.0 không có disassembler riêng. Để phân tích sâu, README của nó yêu cầu bạn mang Ghidra, Hopper hoặc IDA. Để kiểm tra ngoại tuyến, rea cũng có thể gọi một GNU objdump hoặc một Rizin mà bạn cài. Call graph của nó dừng ở các đích chưa phân giải: "Các caller/callee chỉ chứa các hàm đã phân giải.... Luồng tính toán không có đích vẫn chưa biết.". Bài học này xây dựng phần tạo ra những sự kiện đó, để bạn có thể phán đoán chúng khi một công cụ báo cáo chúng.

```figure
re-33-sweep-vs-descent
```

## The Instruction Format Has One Rule Per Field

Intel SDM Tập 2, Hình 2-1 cho thứ tự byte của mọi chỉ lệnh. Trước hết là các prefix tùy chọn, rồi một đến ba byte opcode, rồi một byte ModRM tùy chọn và một byte SIB tùy chọn. Một displacement 0, 1, 2 hoặc 4 byte theo sau, rồi một immediate 0, 1, 2 hoặc 4 byte. Toàn chỉ lệnh tối đa 15 byte (SDM 2.3.11). AMD APM Tập 3, Chương 1, Mục 1.1 đến 1.7 mô tả cùng định dạng trong ít trang hơn và là một đối chiếu tốt.

Mỗi trường quyết định trường tiếp theo có nghĩa gì. Một decoder do đó là một chuỗi quyết định nhỏ, và mỗi quyết định có một câu trong sổ tay đằng sau nó.

### Prefixes come in four groups

SDM 2.1.1 liệt kê các legacy prefix. Nhóm 1 chứa lock `F0` và các repeat prefix `F2` và `F3`. Nhóm 2 chứa sáu segment override (`2E` là `%cs`) và các branch hint. Nhóm 3 là `66`, operand-size override. Nhóm 4 là `67`, address-size override.

Sổ tay nói có thể sử dụng một prefix từ mỗi nhóm. Compiler phát ra nhiều hơn. Padding căn chỉnh trong `ledger-x86_64-O0.o` tại offset `0xf2` đọc ra `66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00`, năm bản sao `66` liên tiếp. `llvm-objdump` in nó là `nopw %cs:(%rax,%rax)` và decoder bạn xây dựng cũng vậy. Decoder thu thập mọi byte prefix nó thấy và hỏi sau những byte nào có ý nghĩa.

`66` có một công việc thứ hai. Với các chỉ lệnh SSE, nó là một prefix bắt buộc chọn opcode, nên `66 0f ef c0` là `pxor %xmm0, %xmm0` và không phải bất cứ thứ gì 16 bit. `F3 0f 6f` là `movdqu`. Decoder trước hết tra cặp prefix bắt buộc và byte opcode thứ hai. Chỉ khi cặp đó không có mục nào thì `66` mới có nghĩa là một toán hạng 16 bit.

### REX adds four bits and must sit next to the opcode

SDM 2.2.1 định nghĩa REX là một byte từ `40` đến `4F` có dạng `0100WRXB`. `W` chọn một toán hạng 64 bit. `R` mở rộng trường reg ModRM. `X` mở rộng trường index SIB. `B` mở rộng trường r/m ModRM, trường base SIB hoặc thanh ghi trong byte opcode (Bảng 2-4). REX phải đến ngay trước opcode hoặc các byte escape, và một REX theo sau bởi một legacy prefix bị bỏ qua.

Trong `48 89 e5`, byte `48` là REX với `W` được đặt. Opcode `89` là `MOV r/m, r`, và ModRM `e5` chọn `%rsp` vào `%rbp`. Loại REX và cùng các byte là `movl %esp, %ebp`.

REX cũng thay đổi tên các thanh ghi byte. Khi có bất kỳ REX nào, các mã hóa 4 đến 7 chọn `%spl`, `%bpl`, `%sil` và `%dil` thay vì `%ah`, `%ch`, `%dh` và `%bh`. Decoder giữ hai bảng vì lý do đó.

### Opcodes live in two maps

Một opcode một byte là trường hợp phổ biến. `0F` escape sang bản đồ hai byte, và `0F 38` hoặc `0F 3A` escape sang các bản đồ ba byte mà các fixture không bao giờ sử dụng (SDM 2.1.2). Một số opcode sử dụng trường reg ModRM làm thêm ba bit opcode, viết là `/digit` trong sổ tay. `83 /7` là `cmp` với một immediate 8 bit, `83 /5` là `sub` và `FF /4` là `jmp` gián tiếp.

Decoder trong `code/main.py` bao quát các opcode trong bốn object fixture cộng vài opcode lân cận. Danh sách là tám dạng số học, `mov`, `lea`, `movslq`, `movzbl`, `imul`, các phép dịch, `test` và `idiv`. Nó tiếp tục với `push`, `pop`, `call`, `ret`, mười sáu bước nhảy có điều kiện, `nop` nhiều byte và năm opcode SSE2. Bất kỳ opcode nào khác phát sinh `DecodeError` với địa chỉ và lý do. Một decoder đoán thì tệ hơn một decoder dừng.

### ModRM and SIB select the operands

SDM 2.1.3 tách ModRM thành `mod` (bit 7:6), `reg` (5:3) và `r/m` (2:0). `mod = 11` nghĩa là r/m là một thanh ghi. `mod = 00`, `01` và `10` nghĩa là bộ nhớ không displacement, một displacement 8 bit hoặc một displacement 32 bit. `r/m = 100` nghĩa là một byte SIB theo sau. SIB tách thành `scale` (7:6), `index` (5:3) và `base` (2:0), và một index `100` nghĩa là không có thanh ghi index.

Hai hàng đặc biệt trong Bảng 2-2 quan trọng ở chế độ 64 bit. `mod = 00` với `r/m = 101` không phải `(%rbp)`. Nó là một displacement 32 bit tương đối với chỉ lệnh tiếp theo (SDM 2.2.1.6). `mod = 00` với một SIB base `101` là một displacement 32 bit không có thanh ghi base.

Lấy `8d 44 08 fa` từ `grade` ở `-O0`. Opcode `8D` là `lea`. ModRM `44` là `01 000 100`: một displacement 8 bit, reg `%eax` và một SIB theo sau. SIB `08` là `00 001 000`: scale 1, index `%rcx`, base `%rax`. Byte displacement `fa` là -6. Văn bản AT&T là `leal -0x6(%rax,%rcx), %eax`, tính `score / 10 - 6`, chỉ số switch.

### The displacement is where the link editor writes

`48 8d 0d 00 00 00 00` là `leaq (%rip), %rcx`. Bốn byte không là trường displacement của một toán hạng tương đối theo RIP. Trong một object có thể tái định vị, chúng là các chỗ giữ chỗ. Mục trong `.rela.text` tại offset `0x69` nói `R_X86_64_PC32.rodata-0x4`. psABI (Bảng 4.9) định nghĩa `R_X86_64_PC32` là `S + A - P`: địa chỉ symbol cộng addend trừ địa chỉ của trường.

Bộ xử lý cộng trường vào địa chỉ của chỉ lệnh tiếp theo, nên đích cuối là `S + A + (end - P)`. Với `lea` này, trường là bốn byte cuối, nên `end - P` là 4 và đích là `.rodata + (-4) + 4 =.rodata + 0x0`. Addend -4 bù trước cho bốn byte đó. Mọi toán hạng tương đối theo RIP trong các fixture mang -4 này bên trong addend của nó, nên `.rodata+0x10` trên `-O1` `lea` nghĩa là `.rodata+0x14`.

Decoder ghi offset của trường displacement bên trong mỗi chỉ lệnh. `resolve_reference()` tra offset đó trong bảng relocation và báo cáo nơi toán hạng sẽ trỏ tới sau liên kết. Một hàm đó là thứ biến `leaq (%rip), %rcx` thành "bảng tại `.rodata+0x0`".

### Immediates are 32 bits at most, with one exception

SDM 2.2.1.5 nói immediate vẫn tối đa 32 bit ở chế độ 64 bit và được mở rộng dấu. Ngoại lệ là `MOV r64, imm64` (`B8+r` với `REX.W`), mà cú pháp AT&T gọi là `movabsq`. Decoder đọc immediate 8 bit là có dấu cho số học (`83 c1 fa` là `addl $-0x6, %ecx`) và không dấu cho số đếm dịch cùng bộ chọn shuffle (`pshufd $0xee`). Sự phân chia đó khớp những gì `llvm-objdump` in.

Các nhánh near, `push` và `pop` mặc định một toán hạng 64 bit và bỏ qua `66` (SDM 2.2.1.7). Đó là lý do decoder đặt tên chúng `pushq`, `popq`, `callq` và `retq` mà không đọc một operand-size prefix.

## Decode One Instruction by Hand

Trước khi tin mã, giải mã `48 69 c0 67 66 66 66` từ `grade` trên giấy.

1. `48` nằm trong `40` đến `4F`, nên nó là REX với `W = 1`. Kích thước toán hạng là 64 bit.
2. `69` là `IMUL r, r/m, imm32`.
3. `c0` là ModRM `11 000 000`: dạng thanh ghi, reg `%rax`, r/m `%rax`.
4. Bốn byte tiếp theo là immediate, little-endian: `0x66666667`.
5. Thứ tự AT&T là immediate, nguồn, đích: `imulq $0x66666667, %rax, %rax`.

Đó là bảy byte, và `llvm-objdump` in cùng văn bản. Hằng số là nghịch đảo cho phép clang chia cho 10 bằng một phép nhân và `sarq $0x22` theo sau, dịch 34. Bạn sẽ gặp lại cặp đó trong bài 34, nơi lifter biến nó trở lại thành `score / 10`.

Decoder làm năm bước này trong `Decoder.decode()`, `_State.modrm()` và `_State.finish()`. Đọc chúng theo thứ tự đó và khớp mỗi nhánh với mục SDM được nêu tên trong docstring của nó.

## Linear Sweep

Schwarz, Debray và Andrews mô tả linear sweep trong Mục 3.1 của "Disassembly of Executable Code Revisited" (WCRE 2002). Bắt đầu ở byte đầu tiên của code section, giải mã một chỉ lệnh, tiếp tục ở byte sau nó và dừng ở cuối. `objdump` hoạt động theo cách này, và `llvm-objdump` cũng vậy.

```python
def linear_sweep(code: bytes, start: int = 0, end: int | None = None) -> SweepResult:
    position = start
    while position < end:
        try:
            instruction = decode(code[:end], position)
        except DecodeError:
            undecodable.append((position, code[position]))
            position += 1
            continue
        instructions.append(instruction)
        position = instruction.end
```

Phương pháp có một chế độ lỗi, và Hình 1 của bài báo cho thấy nó. Các byte là dữ liệu được giải mã thành chỉ lệnh, và decoder sau đó bỏ lỡ các ranh giới chỉ lệnh thật trong một lúc. Trên x86, decoder thường đồng bộ lại trong vài byte, chính điều đó khiến lỗi khó thấy. Phát hiện chỉ xảy ra trên một opcode không hợp lệ, và kết luận của bài báo là các thuật toán này "thất bại âm thầm".

Sweep cũng là oracle cho bài học này. Decoder phải đồng nhất với `llvm-objdump -d` trên mọi chỉ lệnh của mọi fixture, và bản thân `llvm-objdump` là một linear sweep. Văn bản đã thu nằm trong `code/fixtures/*.objdump.txt`. Bài kiểm tra phân tích mỗi dòng thành địa chỉ, byte và văn bản, bỏ các bình luận sau `#` và so sánh. Bốn object chứa 86, 56, 84 và 11 chỉ lệnh, tổng cộng 237, và decoder khớp tất cả chúng.

## Recursive Descent

Mục 3.2 của cùng bài báo gọi phương pháp thứ hai là recursive traversal. Bắt đầu ở một điểm vào đã biết và giải mã cho đến một chuyển giao điều khiển. Với một bước nhảy trực tiếp, tiếp tục tại đích. Với một nhánh có điều kiện, tiếp tục tại cả đích và chỉ lệnh tiếp theo, và với một lần gọi, tiếp tục sau nó, vì callee trả về. Với một lần trả về, dừng. Giữ một tập các địa chỉ đã thăm để phép duyệt kết thúc.

```python
if instruction.flow == "branch":
    worklist.append(instruction.target)
    address = instruction.end
elif instruction.flow == "indirect-jump":
    table = resolver(instruction, instructions) if resolver else None
    if table is None:
        unresolved.append(instruction)
        break
```

Chế độ lỗi là điều ngược lại. Một bước nhảy gián tiếp không có đích trong các byte của nó. Phép duyệt dừng ở đó, và mọi khối chỉ có thể đến qua bước nhảy vẫn chưa biết. Hình 2 của bài báo cho thấy một nguy cơ thứ hai: một tập đích suy ra từ relocation trỏ vào giữa một chỉ lệnh. Descent trong `main.py` ghi trường hợp đó như một xung đột và dừng đường đó, để chồng lấp nhìn thấy được thay vì âm thầm giải mã hai lần.

Andriesse và những người khác đo chín disassembler trên 981 binary do compiler tạo (USENIX Security 2016). Dữ liệu inline và mã chồng lấp hiếm hơn trong đầu ra compiler thực so với giả định của tài liệu, và primitive khó là khôi phục ranh giới hàm. Giữ cả hai phát hiện trong đầu. Bẫy trong phần tiếp theo hiếm trong đầu ra compiler. Bước nhảy gián tiếp trong `grade` phổ biến.

## A Fixture Where the Sweep Is Wrong and the Descent Is Right

`code/fixtures/sweep-trap.s` là 24 byte assembly viết tay với một bảng bốn byte bên trong thân hàm. Hàm đánh chỉ số vào bảng bằng `movzbl (%rcx,%rax), %eax` và nhảy qua nó.

```asm
lookup:
        movslq  %edi, %rax
        leaq    .Ltable(%rip), %rcx
        movzbl  (%rcx,%rax), %eax
        jmp     .Ldone
.Ltable:
        .byte   0x31, 0xc0, 0x90, 0x48
.Ldone:
        addl    $1, %eax
        retq
```

Dựng nó bằng `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s`. Bốn byte bảng được chọn để chúng giải mã thành các chỉ lệnh có vẻ hợp lý. `31 c0` là `xorl %eax, %eax`. `90` là `nop`. `48` là một REX prefix, nên sweep nối nó với ba byte của `addl $1, %eax` thật và in `addq $0x1, %rax`. Đầu ra `llvm-objdump` đã thu cho thấy chính xác điều đó:

```text
       e: eb 04                        	jmp	0x14 <lookup+0x14>
      10: 31 c0                        	xorl	%eax, %eax
      12: 90                           	nop
      13: 48 83 c0 01                  	addq	$0x1, %rax
      17: c3                           	retq
```

Không có gì trong danh sách này trông hỏng. Mọi byte được giải mã, mọi mnemonic là thật và `retq` hiện diện. Danh sách vẫn sai theo ba cách. Bước nhảy tại `0xe` nhắm đến `0x14`, và không chỉ lệnh nào trong danh sách bắt đầu tại `0x14`. Chỉ lệnh thực sự chạy tại `0x14` là một `addl` 32 bit, và danh sách hiển thị một `addq` 64 bit sớm hơn một byte. Bốn byte bảng xuất hiện như mã.

Recursive descent từ symbol `lookup` giải mã sáu chỉ lệnh, đi theo bước nhảy tới `0x14` và báo cáo `addl $0x1, %eax`. Nó không nhận bất kỳ byte nào trong bốn byte bảng và tám byte padding trước `plus_one`. `trap_report()` trong `main.py` in phép so sánh:

```json
"linearSweep": {
  "instructions": 9,
  "atJumpTarget": {"starts": "0x13", "text": "addq\t$0x1, %rax", "startsAtTarget": false},
  "claimedDataBytes": 4,
  "claimedPaddingBytes": 8
},
"recursiveDescent": {
  "instructions": 6,
  "atJumpTarget": "addl\t$0x1, %eax",
  "claimedDataBytes": 0,
  "claimedPaddingBytes": 0
}
```

Bài kiểm tra `test_sweep_and_objdump_share_the_same_mistake` khẳng định rằng `llvm-objdump` in `addq $0x1, %rax` tại `0x13`. Oracle là một linear sweep và thừa hưởng điểm mù của nó. Sự đồng nhất với oracle kiểm tra decoder, và descent kiểm tra những chỉ lệnh nào chạy.

## Basic Blocks

Allen định nghĩa basic block trong "Control Flow Analysis" (1970). Nó là một chuỗi chỉ lệnh chỉ được vào ở chỉ lệnh đầu tiên và chỉ được rời ở chỉ lệnh cuối cùng. Yakdan và những người khác phát biểu lại nó cho decompilation trong Mục II.A.2 của "No More Gotos" (NDSS 2015), với nút header là điểm vào hàm.

Việc xây dựng là một phép quét hai lượt trên các chỉ lệnh đã giải mã, sắp xếp theo địa chỉ. Lượt đầu thu thập các leader. Một leader là điểm vào, một đích nhánh hoặc bước nhảy, một đích bảng hoặc chỉ lệnh sau bất kỳ chuyển giao điều khiển nào. Lượt thứ hai bắt đầu một khối mới tại mỗi leader và tại mỗi khoảng trống trong chuỗi địa chỉ.

```python
for instruction in self.instructions:
    if instruction.address in leaders or current is None or current.end != instruction.address:
        current = Block(instruction.address, [])
        self.blocks[instruction.address] = current
    current.instructions.append(instruction)
```

Các cạnh suy ra từ chỉ lệnh cuối của mỗi khối. Một lần trả về không có kế nhiệm. Một bước nhảy có một, gắn nhãn `jump`. Một nhánh có điều kiện có hai, gắn nhãn `taken` và `fallthrough`. Một chỉ lệnh thông thường ở cuối một khối đi tiếp xuống khối tiếp theo, điều xảy ra khi chỉ lệnh tiếp theo là một đích nhánh. Một bước nhảy gián tiếp có các đích của bảng của nó, gắn nhãn `table`, hoặc không có, và khối được ghi trong `unresolved`.

Thêm hai sự kiện xuất phát từ cùng phép quét. Một khối mà điểm vào không thể đến là không thể tới, và sweep trên `grade` ở `-O0` tạo ra năm khối như vậy. Một khối có địa chỉ bắt đầu nằm bên trong một chỉ lệnh của danh sách phương pháp khác là trường hợp chồng lấp từ bẫy.

## The Control-Flow Graph of total

`total` ở `-O1` là 31 byte và 13 chỉ lệnh:

```text
      40: 85 f6                        	testl	%esi, %esi
      42: 7e 18                        	jle	0x5c <total+0x1c>
      44: 89 f1                        	movl	%esi, %ecx
      46: 31 d2                        	xorl	%edx, %edx
      48: 31 c0                        	xorl	%eax, %eax
      4a: 66 0f 1f 44 00 00            	nopw	(%rax,%rax)
      50: 03 04 97                     	addl	(%rdi,%rdx,4), %eax
      53: 48 ff c2                     	incq	%rdx
      56: 48 39 d1                     	cmpq	%rdx, %rcx
      59: 75 f5                        	jne	0x50 <total+0x10>
      5b: c3                           	retq
      5c: 31 c0                        	xorl	%eax, %eax
      5e: c3                           	retq
```

Các leader là `0x40` (điểm vào), `0x44` (sau `jle`), `0x50` (đích của `jne`), `0x5b` (sau `jne`) và `0x5c` (đích của `jle`). Năm khối, năm cạnh:

| Từ | Đến | Loại | Vì sao |
|---|---|---|---|
| `0x40` | `0x44` | fallthrough | không lấy nhánh `jle`, count dương |
| `0x40` | `0x5c` | taken | count bằng không hoặc âm, trả về 0 |
| `0x44` | `0x50` | fallthrough | `nopw` là căn chỉnh bên trong khối, thực thi đi qua nó |
| `0x50` | `0x50` | taken | `jne 0x50`, vòng lặp |
| `0x50` | `0x5b` | fallthrough | thoát vòng lặp, trả về tổng |

`nopw` sáu byte tại `0x4a` là padding để đầu vòng lặp tại `0x50` nằm trên một ranh giới 16 byte. Nó có thể tới, nên nó thuộc khối `0x44`. `nop` một byte tại `0x5f` sau `retq` cuối cùng cũng là padding, và không có gì đến nó. Sweep trên hàm tạo một khối thứ sáu cho nó, và `unreachable()` liệt kê nó.

Ở `-O2`, cùng hàm là 140 byte với hai vòng lặp. Thân SSE2 tại `0x80` cộng tám giá trị mỗi lượt bằng `paddd`, và phần dư vô hướng chạy tại `0xc0`. CFG có hai back edge, `0x80 -> 0x80` và `0xc0 -> 0xc0`, và bộ kiểm tra kiểm tra cả hai.

## Dominators With the Iterative Algorithm

Một khối `d` chi phối một khối `b` khi mọi đường từ điểm vào đến `b` đi qua `d`. Immediate dominator của `b` là dominator của `b` gần `b` nhất. Khái niệm bắt nguồn từ Prosser (1959) qua Allen (1970), và nó là cấu trúc mà bài 34 cần để đặt `if` và `while` đúng.

Cooper, Harvey và Kennedy viết "A Simple, Fast Dominance Algorithm" (2001). Họ lập luận rằng công thức luồng dữ liệu, chạy theo reverse postorder với một biểu diễn gọn, đánh bại Lengauer-Tarjan (1979) trên các đồ thị dưới khoảng một nghìn nút. Bài báo của họ nói mục đích của nó là "không trình bày một thuật toán mới". Nó cho thấy các thuật toán đơn giản có thể thắng trong thực tế và là các công cụ giảng dạy tốt. Một CFG hàm gần như không bao giờ có một nghìn nút.

```python
def intersect(first: int, second: int) -> int:
    while first != second:
        while number[first] > number[second]:
            first = idom[first]
        while number[second] > number[first]:
            second = idom[second]
    return first

changed = True
while changed:
    changed = False
    for start in order[1:]:
        processed = [p for p in self.predecessors(start) if p in idom]
        candidate = processed[0]
        for other in processed[1:]:
            candidate = intersect(other, candidate)
        if idom.get(start) != candidate:
            idom[start] = candidate
            changed = True
```

`number` chứa vị trí reverse postorder của mỗi khối, với điểm vào ở 0. `intersect` di chuyển hai ngón tay lên cây dominator hiện tại cho đến khi chúng gặp nhau. Bài báo viết phép so sánh với số postorder và `<`. Mã này sử dụng số reverse postorder, nên phép so sánh là `>`. Mọi thứ khác theo mã giả của bài báo.

Với `total` ở `-O1`, kết quả là `idom(0x44) = 0x40`, `idom(0x50) = 0x44`, `idom(0x5b) = 0x50` và `idom(0x5c) = 0x40`. Cạnh `0x50 -> 0x50` là một back edge vì đích của nó chi phối nguồn của nó, và một back edge đánh dấu một vòng lặp (Allen 1970). `back_edges()` trả về nó. Bài kiểm tra `test_dominators_on_a_hand_built_diamond_with_a_loop` chạy cùng mã trên một chuỗi 16 byte với một điểm nối, để `intersect` thấy hai tiền nhiệm.

## The Jump Table in grade at -O0

Ở `-O0`, clang biên dịch `switch` trong `grade` thành mẫu jump table độc lập vị trí:

```text
      5d: 83 e8 04                     	subl	$0x4, %eax
      60: 77 38                        	ja	0x9a <grade+0x6a>
      62: 48 8b 45 f0                  	movq	-0x10(%rbp), %rax
      66: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000069:  R_X86_64_PC32	.rodata-0x4
      6d: 48 63 04 81                  	movslq	(%rcx,%rax,4), %rax
      71: 48 01 c8                     	addq	%rcx, %rax
      74: ff e0                        	jmpq	*%rax
```

Đọc nó như bốn sự kiện. `subl $0x4` theo sau bởi `ja` là một kiểm tra biên: các chỉ số trên 4 đi đến case mặc định tại `0x9a`, nên bảng có năm mục. `leaq` với relocation của nó đặt địa chỉ bảng vào `%rcx`, và phần trước cho thấy địa chỉ đó là `.rodata+0x0`. `movslq` tải một mục 32 bit có dấu được nhân tỷ lệ 4. `addq` cộng địa chỉ cơ sở của bảng, nên mỗi mục là khoảng cách từ bảng đến khối case của nó.

Trong tệp object, mọi byte bảng bằng không. Các đích chỉ tồn tại dưới dạng relocation trong `.rela.rodata`:

```text
RELOCATION RECORDS FOR [.rodata]:
OFFSET           TYPE                     VALUE
0000000000000000 R_X86_64_PC32            .text+0x91
0000000000000004 R_X86_64_PC32            .text+0x8c
0000000000000008 R_X86_64_PC32            .text+0x87
000000000000000c R_X86_64_PC32            .text+0x82
0000000000000010 R_X86_64_PC32            .text+0x86
```

Áp dụng `S + A - P` cho mục `k` tại offset `4k`. Giá trị lưu là `.text + A - (.rodata + 4k)`, và mã cộng `.rodata + 0` vào nó, nên đích là `.text + A - 4k`. Mục 0 là `0x91 - 0 = 0x91`, mục 1 là `0x8c - 4 = 0x88` và mục 2 là `0x87 - 8 = 0x7f`. Mục 3 và 4 là `0x82 - 12 = 0x76` và `0x86 - 16 = 0x76`. Các case 6, 7, 8, 9 và 10 của `score / 10` đi đến các khối lưu 1, 2, 3, 4 và 4. Điều đó khớp nguồn C từng dòng, bao gồm case dùng chung cho 9 và 10.

`recover_table()` làm phép tính này. `jump_table_resolver()` khớp mẫu ngược từ `jmpq`. Nó tìm `addq` tạo thanh ghi, `movslq` tải nó, `leaq` tạo địa chỉ cơ sở và `ja` giới hạn. Descent sau đó đẩy bốn đích phân biệt và tiếp tục. Một executable đã liên kết có các giá trị cuối trong bảng và không có relocation. Cùng hàm sau đó đọc các mục 32 bit có dấu và cộng địa chỉ bảng, và `evidence` ghi đường nào tạo ra các đích.

Các con số cho `grade` ở `-O0`, từ `python3 code/main.py cfg code/fixtures/ledger-x86_64-O0.o grade`:

| Phương pháp | Chỉ lệnh | Khối | Cạnh | Byte | Điều gì sai |
|---|---|---|---|---|---|
| linear sweep | 34 | 9 | 7 | 118 mã + 10 padding | 5 khối không thể tới, không có cạnh vào bốn khối case, padding được giải mã là `nopw` |
| recursive descent | 25 | 3 | 2 | 82 mã | 36 byte mã không bao giờ được tới, `jmpq *%rax` tại `0x74` chưa phân giải |
| descent với bảng | 33 | 8 | 11 | 118 mã | không có gì |

Với bảng, cây dominator đầy đủ. `idom` của mỗi khối case là `0x62`, khối có bước nhảy. `idom` của `0xa1` là điểm vào `0x30`, vì đường mặc định từ `0x9a` đến `0xa1` mà không đi qua `0x62`.

## What the Optimizer Did to grade at -O1

Bạn sẽ thấy `grade` được mô tả như một switch biên dịch thành một jump table. Các byte nói điều cụ thể hơn. Ở `-O1` và `-O2` hoàn toàn không có bước nhảy gián tiếp trong `grade`:

```text
      2c: 83 f9 04                     	cmpl	$0x4, %ecx
      2f: 77 0c                        	ja	0x3d <grade+0x2d>
      31: 89 c8                        	movl	%ecx, %eax
      33: 48 8d 0d 00 00 00 00         	leaq	(%rip), %rcx
		0000000000000036:  R_X86_64_PC32	.rodata+0x10
      3a: 8b 04 81                     	movl	(%rcx,%rax,4), %eax
      3d: c3                           	retq
```

Addend relocation `0x10` cộng 4 thông thường đặt bảng tại `.rodata+0x14`. Lần tải là một `movl` thông thường, và các byte ở đó là `01 00 00 00 02 00 00 00 03 00 00 00 04 00 00 00 04 00 00 00`. Compiler thay năm khối case bằng một bảng năm giá trị trả về. Có một relocation, một bảng và một kiểm tra biên. Luồng điều khiển là ba khối và ba cạnh với một nhánh có điều kiện. `find_value_tables()` báo cáo nó là một `value-table` với các mục `[1, 2, 3, 4, 4]` và `evidence: "bytes"`.

`grade_label` ở `-O2` tiến thêm một bước. Mảng `labels` gồm năm con trỏ chuỗi trở thành một bảng năm offset 32 bit tại `.rodata+0x0`. Mỗi mục mang một relocation `R_X86_64_PC32` đối với section chuỗi, và hàm cộng địa chỉ bảng vào mục nó tải. `recover_table()` đọc năm relocation đó và trả về các offset `0, 2, 4, 6, 8` vào `.rodata.str1.1`, chứa `F`, `D`, `C`, `B` và `A`. Cùng phép tính khôi phục một jump table khôi phục một bảng dữ liệu tương đối, vì cả hai là `S + A - P` tại một offset đã biết.

Bài học từ hai bản build là đặt tên điều các byte cho thấy. Một jump table thay đổi đồ thị luồng điều khiển. Một value table thay đổi một lần tải. Gọi cả hai là "switch" che giấu khác biệt mà bài 34 phải tái dựng.

## What rea and Ghidra Give You Here

rea 6.5.0 với provider Ghidra 12.1.4 trả về văn bản Listing của một hàm từ `procedure_assembly` dưới dạng một chuỗi. `inspect_native_instruction` trả về byte, độ dài, văn bản decoder, token toán hạng, tham chiếu có kiểu và luồng của một chỉ lệnh, với lần trả về được phân loại từ p-code. `xrefs` trả về các địa chỉ nguồn duy nhất đã sắp xếp từ `ReferenceManager.getReferencesTo` của Ghidra. `analyze_function` mang CFG và `body` của hàm. `procedure_info` cung cấp body dưới dạng các phạm vi bao gồm hai đầu và cảnh báo rằng "Các khoảng trống và đuôi dùng chung không được coi là các byte được sở hữu".

Mỗi sự kiện trong số đó là recursive descent của Ghidra cộng các analyzer của nó, được tuần tự hóa. Hồ sơ phân tích rea ghim các phiên bản hợp đồng cho `instruction_flow_evidence`, `function_references` và `jump_table_evidence`. Một kết quả do đó nêu tên các quy tắc tạo ra nó. Điều nó không thể làm là cho thấy cách làm. Khi Ghidra không tìm được bảng, luồng là "chưa biết", và các khối case thiếu khỏi caller, callee và CFG.

Giờ bạn có cách làm. Chạy `python3 code/main.py cfg` trên cùng object và so sánh các điểm bắt đầu khối, số cạnh và bảng được khôi phục với những gì provider trả về. Nơi chúng đồng nhất, bạn có hai phép suy ra độc lập. Nơi chúng khác nhau, bạn có một địa chỉ cụ thể để nhìn, chính là điều bài 35 ghi lại như một điều chưa biết.

Một ghi chú về decoder như một chương trình. Capstone 6.0.0-Alpha10 (2026-07-21) sửa các lần đọc và ghi ngoài biên dưới CVE-2026-55893 và CVE-2026-55894, và 5.0.9 (2026-05-28) backport các bản sửa CVE. Một decoder đọc các byte mà nó không viết. Giới hạn 15 byte, kiểm tra cắt ngắn trong `_Cursor.byte()` và việc từ chối đoán một opcode không biết bảo vệ `main.py` khỏi đầu vào mà nó không được xây dựng cho.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
```

Đầu ra là một báo cáo JSON. Với mỗi object fixture, nó cho sự đồng nhất oracle. Với mỗi hàm, nó cho số chỉ lệnh, khối và cạnh dưới ba phương pháp. Nó cũng liệt kê các khối không thể tới, các bước nhảy gián tiếp chưa phân giải, back edge, immediate dominator và mọi bảng. Nó kết thúc bằng phép so sánh bẫy.

Dạng kỳ vọng:

```json
{
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "oracle": "86/86 instructions agree with llvm-objdump",
      "functions": {
        "grade": {
          "range": "0x30-0xa6",
          "paddingBytes": 10,
          "linearSweep": {"instructions": 34, "blocks": 9, "edges": 7, "unreachableBlocks": ["0x76", "0x7f", "0x88", "0x91", "0xa6"], "...": "..."},
          "recursiveDescent": {"instructions": 25, "blocks": 3, "edges": 2, "unresolvedIndirectJumps": ["0x74"], "...": "..."},
          "recursiveDescentWithTables": {"instructions": 33, "blocks": 8, "edges": 11, "...": "..."},
          "tables": [{"kind": "jump-table", "table": ".rodata+0x0", "count": 5, "entries": ["0x91", "0x88", "0x7f", "0x76", "0x76"], "evidence": "relocation", "...": "..."}]
        }
      }
    }
  },
  "sweepTrap": {"...": "..."}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `ElfObject` đọc section header, symbol và các mục `.rela.*`, và `symbolize()` đặt tên một địa chỉ theo cách `llvm-objdump` làm.
2. `Decoder.decode()` đọc prefix và REX, rồi phân phối trên bản đồ opcode một byte hoặc hai byte.
3. `_State.modrm()` đọc ModRM, SIB và displacement, và ghi offset trường displacement.
4. `resolve_reference()` áp dụng `S + A - P` cho relocation trên một trường displacement hoặc immediate.
5. `linear_sweep()` và `recursive_descent()` là hai phương pháp, mỗi phương pháp với lỗi của nó được ghi lại.
6. `recover_table()` và `jump_table_resolver()` đọc một bảng qua các relocation hoặc các byte của nó.
7. `ControlFlowGraph` xây dựng leader, khối và các cạnh có kiểu, và `dominators()` là thuật toán lặp.
8. `analyze_function()` chạy mọi phương pháp trên một hàm và `compare_with_oracle()` kiểm tra decoder.

Có thêm hai lệnh. `python3 code/main.py disasm FILE.o` in một danh sách với đích relocation sau mỗi chỉ lệnh có một đích như vậy. `python3 code/main.py cfg FILE.o FUNCTION` in phân tích của một hàm.

## Use It

Sử dụng ba phương pháp theo thứ tự này trên một object mới.

1. Chạy phép so sánh oracle trước. Một decoder bất đồng với `llvm-objdump` trên một chỉ lệnh thông thường có một lỗi, và mọi cấu trúc sau đó thừa hưởng nó.
2. Chạy recursive descent từ mọi function symbol và đọc `unresolved`. Mỗi mục là một bước nhảy hoặc lần gọi gián tiếp mà bạn chưa có các đích.
3. Với mỗi bước nhảy chưa phân giải, tìm mẫu bảng và relocation trỏ đến nó. Nếu mẫu không khớp, đọc các byte trước bước nhảy và viết ra điều bạn thấy. Ghi chú đó là điều chưa biết đầu tiên trong bài 35.
4. So sánh sweep và descent từng byte. Các byte chỉ sweep nhận là padding hoặc dữ liệu. Các byte không cách nào nhận là không thể tới hoặc thuộc một hàm bạn chưa tìm thấy.
5. Xây dựng CFG từ descent với các bảng đã khôi phục và đọc các back edge. Mỗi cạnh là một vòng lặp mà bài 34 sẽ biến thành `while` hoặc `for`.

Giữ các tệp văn bản oracle cùng các object. Khi bạn chuyển sang một phiên bản compiler mới, thu lại chúng, vì một danh sách thay đổi là một fixture thay đổi.

## Interactive Lab

### Lab A: decode on paper, then check

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow/code
python3 -q
```

Chạy:

```python
from main import *
decode(bytes.fromhex("48 8d 0d 00 00 00 00"), 0).text
decode(bytes.fromhex("8d 44 08 fa"), 0).text
decode(bytes.fromhex("66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00"), 0).length
```

Viết ra điều bạn kỳ vọng trước mỗi lần gọi. Rồi loại `48` khỏi lần đầu và thấy kích thước toán hạng thay đổi. Rồi thử `decode(bytes.fromhex("0f 0a"), 0)` và đọc `DecodeError`.

### Lab B: the relocation on a lea

```python
elf = load_fixture("ledger-x86_64-O0.o")
code = elf.section(".text").data
lea = decode(code, 0x66)
lea.displacement_offset
resolve_reference(elf, lea)
```

Tham chiếu nói `.rodata+0x0`. Đổi địa chỉ thành `0x116` trong `grade_label` và đọc tham chiếu vào `.data`. Rồi giải mã `callq` tại `0x10e` và phân giải nó. Trường immediate mang `R_X86_64_PLT32 grade-0x4`, và đích đã phân giải là `0x30`, tức `grade`.

### Lab C: watch the two methods disagree

```python
trap = load_fixture("sweep-trap.o")
text = trap.section(".text").data
[i.text for i in linear_sweep(text, 0, 0x20).instructions]
[i.text for i in recursive_descent(text, [0], 0x20).sorted_instructions()]
```

Đếm các chỉ lệnh trong mỗi danh sách và tìm chỉ lệnh bắt đầu tại `0x13`. Rồi đổi byte bảng cuối trong `sweep-trap.s` từ `0x48` thành `0xe8`, dựng lại và chạy lại cả hai. Sweep giờ nuốt `addl` và `retq` vào một `callq` có đích ngoài section. Hàm có vẻ không có lần trả về.

### Lab D: dominators by hand

```python
analysis = analyze_function(load_fixture("ledger-x86_64-O1.o"), "total")
analysis.cfg.edges
analysis.cfg.reverse_postorder()
analysis.cfg.dominators()
analysis.cfg.back_edges()
```

Vẽ năm khối trên giấy và tính các dominator trước khi nhìn kết quả. Rồi chạy cùng bốn dòng trên `grade` ở `-O0` và giải thích vì sao `idom(0xa1)` là `0x30` chứ không phải `0x62`.

## Practice Lab

Thêm một điểm gọi gián tiếp vào các fixture và mở rộng phân tích.

Yêu cầu:

- Viết một hàm C gọi qua một con trỏ hàm được chọn từ một mảng nhỏ. Dựng nó ở `-O0` và `-O1` và commit các object với văn bản `llvm-objdump` của chúng.
- Làm decoder đồng nhất với oracle trên cả hai object. Chỉ thêm opcode khi một chỉ lệnh trong fixture cần chúng.
- Mở rộng `recursive_descent()` để một lần gọi gián tiếp ghi điểm gọi trong `calls` với `None` làm đích và tiếp tục sau nó.
- Viết một resolver đọc mảng con trỏ hàm qua các relocation của nó và báo cáo các callee có thể có.
- Thêm tập callee vào báo cáo hàm dưới dạng `indirectCalls` với loại bằng chứng cho mỗi đích.
- Viết một bài kiểm tra thất bại khi resolver trả về một đích không phải function symbol.

Thành công nghĩa là `python3 code/main.py cfg` nêu tên mọi callee có thể có với relocation chứng minh nó, và phép so sánh oracle vẫn qua trên mọi object.

## Graded Lab

Năm câu hỏi về các fixture của bài học này. Tìm mỗi câu trả lời bằng mã bạn đã xây dựng, rồi ghi nó vào `code/lab_answers.json`. Viết số dưới dạng số hoặc chuỗi hex chẳng hạn `"0x40"`, và danh sách dưới dạng danh sách JSON.

1. `t1`: các chỉ lệnh mà recursive descent giải mã trong grade ở -O1.
2. `t2`: các basic block trong total ở -O1.
3. `t3`: địa chỉ của loop header trong total ở -O1, dưới dạng hex.
4. `t4`: trong sweep-trap.o, địa chỉ nơi chỉ lệnh linear sweep bao phủ 0x14 bắt đầu, dưới dạng hex.
5. `t5`: các mục trong jump table của grade ở -O0.

Kiểm tra các câu trả lời của bạn:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/lab.py
```

Bộ kiểm tra tính mỗi giá trị kỳ vọng từ `code/main.py` trên các fixture đã commit. Nó in `PASS`, `FAIL` hoặc `TODO` cho mỗi tác vụ và một điểm số, và nó chỉ thoát 0 khi cả năm qua. `python3 code/lab.py my-answers.json` kiểm tra một tệp khác. `code/tests/test_lab.py` chứng minh rằng bộ kiểm tra chấp nhận các câu trả lời đúng và từ chối một câu sai.

### See it run

Máy [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?program=trap&sweep=linear) chạy bài học này như bệ giải mã và bảng khối của nó. Liên kết này mở `sweep-trap.o` với linear sweep: bệ cho thấy bốn byte dữ liệu được giải mã thành mã, và một ghim đánh dấu đích nhảy tại `0x14` bên trong `addq` tại `0x13`. Chuyển decoder sang recursive descent để thấy bước nhảy bỏ qua dữ liệu.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-disassembly-and-control-flow.md`. Sử dụng nó để biến một object và một tên hàm thành một danh sách đã kiểm tra, khối, cạnh có kiểu, dominator và mọi chuyển giao chưa phân giải. Nó yêu cầu một phép so sánh oracle, cả hai phương pháp disassembly, hạch toán byte, bằng chứng relocation cho mỗi bảng được khôi phục và một phát biểu về điều vẫn chưa biết.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/33-disassembly-and-control-flow
python3 code/main.py
python3 code/tests/test_main.py
```

Xác minh nên chứng minh:

- decoder đồng nhất với `llvm-objdump -d` trên cả 237 chỉ lệnh của bốn object fixture
- REX.W chọn toán hạng 64 bit và REX.R cùng REX.B mở rộng các trường thanh ghi
- ModRM và SIB kết xuất toán hạng bộ nhớ AT&T, bao gồm scale, index và displacement có dấu
- một displacement tương đối theo RIP được ghi với offset trường của nó bên trong chỉ lệnh
- các legacy prefix lặp lại và một segment override giải mã như oracle
- một prefix `66` bắt buộc chọn opcode SSE và để các thanh ghi 32 bit
- các immediate 8 bit được mở rộng dấu cho số học và không dấu cho số đếm dịch
- một chỉ lệnh trên 15 byte, một chỉ lệnh bị cắt ngắn và một opcode không biết phát sinh `DecodeError`
- `R_X86_64_PC32` trên một `lea` phân giải đến bảng và `R_X86_64_PLT32` trên một `call` phân giải đến callee
- sweep giải mã bảng bẫy thành mã và không có chỉ lệnh tại đích nhảy
- descent không bao giờ nhận bảng hoặc padding và đọc `addl $0x1, %eax` tại đích
- `llvm-objdump` mắc cùng lỗi như sweep trên bẫy
- một điểm vào bên trong một chỉ lệnh được ghi như một xung đột
- một bước nhảy gián tiếp chưa phân giải dừng descent và được liệt kê
- `total` ở `-O1` có năm khối, năm cạnh có kiểu, một back edge và các immediate dominator kỳ vọng
- một hình thoi dựng tay có một vòng lặp cho các dominator mà thuật toán định nghĩa
- `total` ở `-O2` có hai vòng lặp
- `grade` ở `-O0` cho một jump table năm mục từ `.rela.rodata` với các đích `0x91, 0x88, 0x7f, 0x76, 0x76`
- không có bảng, `grade` ở `-O0` có ba khối và một bước nhảy chưa phân giải
- `grade` ở `-O1` và `-O2` là một value table `[1, 2, 3, 4, 4]` không có bước nhảy gián tiếp
- `grade_label` ở `-O2` đọc một bảng chuỗi tương đối qua năm relocation
- hình tương tác nhúng cùng dữ liệu mà phân tích tạo ra

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Dữ liệu bên trong `.text` | Một danh sách có vẻ hợp lý với mọi byte được giải mã | Descent không nhận byte dữ liệu nào và đích nhảy bắt đầu một chỉ lệnh |
| Padding sau lần trả về cuối | Một chỉ lệnh `nopw` ở cuối hàm | Các byte không thể tới từ điểm vào |
| Bước nhảy gián tiếp qua một bảng | "jmp rax" và bốn khối chết | Địa chỉ bảng từ relocation `lea`, số mục từ kiểm tra biên, các đích từ `.rela.rodata` |
| Switch được biến thành một value table | "một jump table với một relocation" | Một lần tải `movl` từ `.rodata+0x14`, ba khối, không có chuyển giao gián tiếp |
| Lần gọi với displacement bằng không | `callq 0x113`, chỉ lệnh tiếp theo | `R_X86_64_PLT32 grade-0x4` phân giải đến `0x30` |
| Decoder đoán một opcode không biết | Một mnemonic trông đúng | `DecodeError` với địa chỉ, và sweep ghi byte |
| Chỉ lệnh dài hơn 15 byte | Một "chỉ lệnh" rất dài | Cursor phát sinh ngoại lệ trước khi đọc byte 16 |
| Nhánh vào giữa một chỉ lệnh | Hai danh sách chồng lấp | Một bản ghi xung đột với cả hai địa chỉ |
| Vòng lặp được báo cáo như mã đường thẳng | Không có `while` trong mã giả | Một back edge có đích chi phối nguồn của nó |
| Oracle được thu từ một compiler khác | Các bài kiểm tra qua trên văn bản cũ | README fixture nêu compiler và lệnh chính xác |

## Operational Rule

Giải mã đối chiếu một oracle, duyệt luồng điều khiển từ các điểm vào đã biết và hạch toán mỗi byte là được nhận, padding, dữ liệu hoặc không thể tới. Khôi phục mỗi đích gián tiếp từ một relocation hoặc một bảng mà bạn có thể chỉ ra. Ghi phần còn lại là chưa biết, với địa chỉ.

## Further Reading

- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, Chapter 2: Instruction Format](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [AMD64 Architecture Programmer's Manual Volume 3, Chapter 1: Instruction Encoding](https://docs.amd.com/v/u/en-US/24594_3.38_APM_Vol3_PUB)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Schwarz, Debray, Andrews, "Disassembly of Executable Code Revisited" (WCRE 2002)](https://www2.cs.arizona.edu/~debray/Publications/disasm.pdf)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Allen, "Control Flow Analysis" (1970)](https://doi.org/10.1145/800028.808479)
- [Cooper, Harvey, Kennedy, "A Simple, Fast Dominance Algorithm" (2001)](https://www.cs.tufts.edu/~nr/cs257/archive/keith-cooper/dom14.pdf)
- [Lengauer, Tarjan, "A fast algorithm for finding dominators in a flowgraph" (1979)](https://doi.org/10.1145/357062.357071)
- [Capstone 6.0.0-Alpha10 release notes](https://github.com/capstone-engine/capstone/releases/tag/6.0.0-Alpha10)
- Nguồn rea 6.5.0 tại tag `3b79af2` mà bài học này mô tả: `README.md`, `docs/ghidra-provider.md`, `docs/ghidra-dos.md`, `docs/reverse-engineering-tools.md`, `bridge/ghidra/ReaGhidraBridge.java`, `src/contracts/officialToolContracts.ts`, `src/ghidra/GhidraAnalysisProfile.ts`.
