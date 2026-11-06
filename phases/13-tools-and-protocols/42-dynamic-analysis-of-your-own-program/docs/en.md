# Dynamic Analysis of Your Own Program: Debuggers, Traces, and Confirming Static Claims

> Một lần chạm breakpoint là một quan sát về một lần chạy của một bản dựng. Bài học này dựng harness chuyển các quan sát đó thành các kết luận được xác nhận, bị bác bỏ, và không được quan sát đối với các khẳng định mà các bài học tĩnh đã đưa ra.

**Type:** Build
**Languages:** Python, C, arm64 assembly, lldb command language
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), Phase 13 · 35 (evidence, confidence, and unknowns)
**Time:** ~130 minutes

## Learning Objectives

- Giải thích một trình gỡ lỗi cần gì từ hệ điều hành trên Linux (`ptrace`) và trên macOS (các cổng tác vụ Mach và các cổng ngoại lệ), và tại sao một shell trong sandbox không thể khởi chạy một chương trình được gỡ lỗi.
- Đặt các breakpoint phần mềm theo tên và theo địa chỉ bản liệt kê, đặt một watchpoint phần cứng, và đọc các giới hạn mà bộ xử lý áp đặt lên cả hai.
- Điều khiển lldb ở chế độ batch từ Python với một stop hook ghi lại các thanh ghi, bộ nhớ, và các biến frame tại mỗi lần dừng, và phân tích bản ghi trở lại thành một dòng thời gian.
- Kiểm tra các khẳng định tĩnh từ các bài 32, 33, 34, và 41 với dòng thời gian đó: các thanh ghi đối số, các độ lệch trường struct, cạnh nào một nhánh có điều kiện đã đi, và những lời gọi nào đã xảy ra.
- Chạy cùng kế hoạch với một bản dựng `-O2`, đọc các breakpoint phân giải được và không bao giờ chạm, và nói điều đó chứng minh và không chứng minh điều gì.
- Lưu và nạp một tệp core, và nêu những gì một core kiểu stack bỏ lại.
- Đối chiếu các tập lệnh gdb và lldb, và đặt `strace`, `ltrace`, `bpftrace`, `dtrace`, và `rr` vào đúng hệ điều hành với các phiên bản và giấy phép của chúng.
- Nêu các thông tin ký mã macOS cho phép lldb gỡ lỗi một tệp nhị phân do chính bạn dựng, và hai điều kiện khiến nó từ chối.

## The Problem

Bài 41 đọc `struct account` từ DWARF và nói `balance` nằm tại độ lệch 4. Bài 33 dựng đồ thị luồng điều khiển của `classify` và nói nhánh đầu tiên đi đến khối `return -1` khi số dư âm. Bài 32 nói hai đối số đầu tiên đến trong `x0` và `x1`. Mỗi câu trong số đó đều được suy ra từ các byte. Không câu nào được quan sát.

Sau đó một agent đọc cùng chương trình và báo cáo "main gọi `bump`, `classify`, và `sum_balances`". Bảng ký hiệu liệt kê cả ba, nên câu đó trông có vẻ an toàn. Bạn dựng chương trình tại `-O2`, đặt một breakpoint trên mỗi hàm, và chạy nó. Tiến trình in bốn dòng của nó và thoát. Mọi breakpoint báo cáo `hit count = 0`.

Agent không sai về mã nguồn. Nó sai về bản dựng mà nó được hỏi. Trình biên dịch đã nội tuyến cả ba lời gọi và gộp `sum_balances(rows, 3)` thành hằng số 315. Cách duy nhất để biết điều đó cho tệp nhị phân này trên máy này là chạy nó dưới một trình gỡ lỗi và xem.

Bài học này dựng một harness thực hiện việc xem đó. Nó biên dịch `account.c`, đọc bản liệt kê, lập kế hoạch một phiên lldb, chạy nó, và chấm từng khẳng định tĩnh theo những gì các lần dừng cho thấy. Việc chấm có ba kết quả. `confirmed` nghĩa là một lần dừng cho thấy khẳng định đúng cho lần chạy này. `refuted` nghĩa là một lần dừng cho thấy nó sai. `not-observed` nghĩa là không lần dừng nào có thể kiểm tra nó, và bản ghi nói lý do. Sau đó Bài 35 lưu mỗi kết luận dưới dạng một bản ghi `observed` với thẩm quyền `controlled-replay`.

```figure
re-42-run-timeline
```

## A Debugger Is Three System Services and a Table

Một trình gỡ lỗi làm bốn việc với một tiến trình mà nó không sở hữu mã. Nó dừng tiến trình, đọc và ghi các thanh ghi của tiến trình, đọc và ghi bộ nhớ của tiến trình, và được thông báo khi tiến trình dừng lần nữa. Kernel cung cấp mỗi việc này dưới dạng một dịch vụ, và các dịch vụ khác nhau theo hệ điều hành.

Trên Linux dịch vụ đó là `ptrace(2)`. Trang hướng dẫn nói nó "cung cấp một phương tiện để một tiến trình (tracer) có thể quan sát và điều khiển việc thực thi của một tiến trình khác". `PTRACE_TRACEME` cho phép một tiến trình con thông báo rằng tiến trình cha sẽ theo vết nó, `PTRACE_ATTACH` lấy một tiến trình không liên quan, `PTRACE_PEEKDATA` đọc "một word tại địa chỉ addr trong bộ nhớ của tracee", `PTRACE_GETREGS` đọc các thanh ghi, và `PTRACE_SINGLESTEP` chạy một lệnh. Mô-đun Yama giới hạn việc attach: `/proc/sys/kernel/yama/ptrace_scope` ở mặc định 1 nghĩa là "tiến trình đích phải là hậu duệ của bên gọi", 2 nghĩa là chỉ quản trị viên có thể attach, và 3 nghĩa là không ai có thể.

Trên macOS `ptrace` là một giao diện nhỏ hơn. Hướng dẫn của Apple liệt kê `PT_TRACE_ME`, `PT_ATTACHEXC`, `PT_STEP`, `PT_CONTINUE`, và `PT_KILL`, và nói rằng với `PT_ATTACHEXC` "Các tín hiệu từ tiến trình con đến tiến trình cha dưới dạng các ngoại lệ Mach". Bộ nhớ và các thanh ghi hoàn toàn không đi qua `ptrace`. `debugserver` của lldb gọi `task_for_pid()` để lấy một cổng tác vụ Mach cho tiến trình, rồi `task_set_exception_ports()` để các breakpoint đến dưới dạng thông điệp ngoại lệ. Daemon hệ thống `taskgated` quyết định ai có thể gọi `task_for_pid`.

Bạn có thể thấy cái giá của thiết kế đó trong một bản ghi mà bài học này giữ lại. Shell của phiên chạy dưới một sandbox Seatbelt. Cùng kế hoạch tạo ra mười một lần dừng bên ngoài sandbox tạo ra điều này bên trong nó:

```text
(lldb) run
error: process exited with status -1 (attach failed ((os/kern) invalid address))
```

Tiến trình đã được tạo rồi không thể được tiếp nhận. Lỗi này nói về quyền của trình gỡ lỗi, và nó không nói gì về chương trình. Harness ghi lại nó là một lỗi khởi chạy, với không lần dừng và không kết luận.

Bảng đó là bảng breakpoint. Trình gỡ lỗi nhớ nó đã thay byte lệnh nào tại địa chỉ nào, để có thể đặt bản gốc trở lại khi bạn tiếp tục, và nó đếm số lần chạm theo vị trí. `breakpoint list` in bảng đó, và harness đọc nó ở cuối mỗi lần chạy.

## Breakpoints: One Byte or One Word Replaced

Một breakpoint phần mềm là một lệnh khiến bộ xử lý trap, được ghi đè lên các byte đầu của lệnh bạn muốn dừng tại đó. Trên x86-64 đó là `INT3`, opcode `CC`, dài một byte, được hướng dẫn Intel mô tả là "dành cho việc gọi trình xử lý ngoại lệ gỡ lỗi". Trên arm64 đó là `BRK #imm16`, một lệnh bốn byte có ngoại lệ "ghi lại ngoại lệ trong ESR_ELx, dùng giá trị EC 0x3C". Hướng dẫn Arm thêm rằng địa chỉ trả về ưu tiên là chính lệnh `BRK`, đó là lý do một lần dừng báo cáo địa chỉ của lệnh bị thay thế chứ không phải lệnh sau nó.

lldb đặt breakpoint theo tên, theo tệp và dòng, hoặc theo địa chỉ. Theo tên, nó bỏ qua prologue:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O0`bump + 12 at account.c:13:19, address = 0x00000001000004bc
```

`bump + 12` là lệnh thứ tư. Ba lệnh trước nó là `sub sp, sp, #0x10`, `str x0, [sp, #0x8]`, và `str w1, [sp, #0x4]`, phần thiết lập frame mà bảng dòng DWARF quy cho dòng mở đầu của hàm. Tại lần dừng, `x0` và `x1` vẫn giữ các đối số, vì prologue chỉ sao chép chúng.

Theo địa chỉ, lldb cần biết địa chỉ thuộc mô-đun nào. Một `breakpoint set -a 0x100000504` trần trước khi tiến trình tồn tại là một địa chỉ nạp không có section đằng sau, và trong kiểm thử đầu tiên nó vẫn `unresolved` suốt cả lần chạy với `hit count = 0`. Dạng mà harness dùng nêu tên mô-đun:

```text
(lldb) breakpoint set -a 0x100000504 -s account-O0
Breakpoint 4: address = 0x0000000100000504
```

Với `-s` con số là một địa chỉ tệp bên trong `account-O0`, lldb cộng độ trượt nạp, và sau lần chạy vị trí ghi `resolved, hit count = 2`. Bản liệt kê bài 33 cho các địa chỉ tệp, nên đây là dạng kết nối một bản liệt kê tĩnh với một lần dừng động.

### Decode the branch by hand

Nhánh có điều kiện đầu tiên trong `classify` tại `-O0` là word `36f800a8` tại `0x1000004f0`, mà `llvm-objdump` in là `tbz w8, #0x1f, 0x100000504`. Giải mã nó từ mã hóa Arm A64 của `TBZ`.

1. Bit 31 là `b5`, bit cao của số bit. Nó bằng 0.
2. Các bit 30 đến 25 là `011011`, nhóm kiểm tra và rẽ nhánh. Bit 24 bằng 0, chọn `TBZ` chứ không phải `TBNZ`.
3. Các bit 23 đến 19 là `b40`, năm bit thấp của số bit: `11111` = 31. Với `b5` = 0 bit được kiểm tra là 31, bit dấu của một giá trị 32 bit.
4. Các bit 18 đến 5 là `imm14`: `00000000000101` = 5. Độ lệch nhánh là `imm14 * 4` = 20 = `0x14`, nên đích là `0x1000004f0 + 0x14 = 0x100000504`.
5. Các bit 4 đến 0 là `Rt`: `01000` = 8, nên thanh ghi là `w8`.

`w8` đã được nạp trước đó một lệnh bởi `ldr w8, [x8, #0x4]`, là `a->balance` tại độ lệch 4. `TBZ` rẽ nhánh khi bit bằng không. Nhánh được đi khi bit dấu không được đặt, tức `balance >= 0`. Mã nguồn viết `if (a->balance < 0) return -1;`, nên trình biên dịch đã đảo điều kiện: cạnh được đi bỏ qua khối `return -1`, và fall-through tại `0x1000004f4` đi vào nó. Vì vậy khẳng định tĩnh mà harness mang là một khẳng định cạnh có vị từ: được đi khi `a->balance >= 0`, fall-through nếu ngược lại. Việc nâng nhánh thứ hai hoạt động theo cùng cách. `subs w8, w8, #0xc8` tính `balance - 200` và `b.le 0x100000524` được đi khi kết quả tối đa bằng không, tức `balance <= 200`.

## Watchpoints Are Hardware and Few

Một watchpoint dừng tiến trình khi bộ nhớ tại một địa chỉ được truy cập. Nó không thể là một lệnh được thay thế, vì bất kỳ lệnh nào ở bất kỳ đâu cũng có thể thực hiện truy cập. Vì vậy các bộ xử lý mang một tập nhỏ các bộ so sánh địa chỉ. Trên x86-64 chúng là các thanh ghi gỡ lỗi: `DR0` đến `DR3` giữ "các địa chỉ của tối đa 4 breakpoint", và `DR7` bật từng cái và đặt điều kiện của nó (thực thi, ghi, hoặc đọc-ghi) và độ dài của nó (1, 2, 4, hoặc 8 byte). Trên arm64 các cặp là `DBGWVR<n>_EL1`, "giữ địa chỉ ảo dữ liệu được dùng để khớp watchpoint", và `DBGWCR<n>_EL1` cho các điều khiển, và hướng dẫn Arm nói "Một triển khai có thể bao gồm từ 2-64 watchpoint".

lldb báo cáo số lượng nó được cấp:

```text
(lldb) watchpoint set variable a->balance
Watchpoint created: Watchpoint 1: addr = 0x16fdfe00c size = 4 state = enabled type = m
(lldb) watchpoint list
Number of supported hardware watchpoints: 4
```

Bốn trên máy này. Địa chỉ được theo dõi `0x16fdfe00c` là `x0 + 4`: con trỏ struct tại lần dừng `bump` cộng độ lệch DWARF của `balance`. `size = 4` là `int`. `type = m` nghĩa là sửa đổi. Khi hết các ô, lldb từ chối watchpoint tiếp theo, và vì một vùng không căn chỉnh hoặc không phải lũy thừa của hai có thể chiếm hai ô, số watchpoint bạn có thể đặt có thể nhỏ hơn bốn.

Các watchpoint dữ liệu báo cáo sau truy cập. Hướng dẫn Intel nói "một lệnh ghi bộ nhớ ghi đè dữ liệu gốc trước khi ngoại lệ gỡ lỗi do một breakpoint dữ liệu tạo ra được tạo ra", và lldb giữ giá trị cũ trong cache riêng của nó để in cả hai:

```text
Watchpoint 1 hit:
old value: 250
new value: 255
* thread #1, queue = 'com.apple.main-thread', stop reason = watchpoint 1
    frame #0: 0x00000001000004d0 account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:14:12
```

Lần dừng nằm tại `0x1000004d0`, lệnh sau `str w8, [x9, #0x4]` tại `0x1000004cc`. Có một điểm đặc thù nên biết trước khi bạn phân tích đầu ra. Ngay sau `watchpoint set`, lldb in `Watchpoint 1 hit:` với một giá trị cũ rỗng và `new value: 250`. Đó là lần đọc ban đầu, và harness bỏ qua một lần chạm không có giá trị cũ.

## Stepping, Stop Hooks, and Batch Mode

Ngữ pháp lệnh của lldb là `<noun> <verb> [-options] [arguments]`. Các động từ bước là `thread step-in` (`s`), `thread step-over` (`n`), `thread step-inst` (`si`), `thread step-inst-over` (`ni`), và `thread step-out` (`finish`). `thread until 12` chạy đến một dòng. `thread return <expr>` trả về sớm với một giá trị. Harness không chạy từng bước. Nó dừng tại các địa chỉ đã lên kế hoạch và để một stop hook thực hiện việc đọc:

```text
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
```

`-o` có thể được lặp lại, và các lệnh chạy theo thứ tự tại mỗi lần dừng. `register read` nêu hai thanh ghi đối số và bộ đếm chương trình. `memory read -s4 -fx -c24 $x0` in 24 word bốn byte ở dạng hex từ địa chỉ trong `x0`, tức 96 byte, ba hàng `struct account`. `frame variable -P 1` in các đối số và biến cục bộ và mở rộng các con trỏ một cấp, nên `a` hiển thị năm trường của nó.

Chế độ batch là `lldb -b`. Hướng dẫn nói `--batch` chạy các lệnh từ `-s`, `-S`, `-o`, và `-O` rồi thoát, và nếu một lệnh dừng "do một tín hiệu hoặc sự cố, trình gỡ lỗi sẽ trở về dấu nhắc tương tác". Harness viết kế hoạch vào một tệp và truyền nó với `-s`. Một thiết lập có ý nghĩa: `settings set interpreter.stop-command-source-on-error false`. Không có nó, `continue` đầu tiên sau khi tiến trình đã thoát kết thúc toàn bộ tệp, và `breakpoint list` không bao giờ chạy. Có nó, lldb in `error: Process must be launched.` và tiếp tục.

Hai thông tin về hình dạng đầu ra quyết định cách bộ phân tích hoạt động. Thứ nhất, đầu ra hook được in khi hook chạy, và khối `Process N stopped` với dòng `frame #0` của nó được in sau đó. Vì vậy bộ phân tích thu thập các dòng thanh ghi, bộ nhớ, và biến vào một khối đang chờ và gắn khối đó vào dòng `frame #0` tiếp theo nó thấy. Một khối có bộ đếm chương trình nằm trong `dyld` tại `_dyld_start` là lần dừng đầu vào trước khi chương trình chạy, và không có `frame #0` nào nhận nó. Thứ hai, một breakpoint có `--auto-continue` hoàn toàn không báo cáo lần dừng của nó, và một stop hook không chạy cho nó. Một phiên bản đầu tiên của harness này dùng auto-continue và không ghi lại gì. Thay vào đó kế hoạch dùng các breakpoint thông thường và một ngân sách cố định các lệnh `continue`.

## The Plan Comes From the Listing

`Plan.commands()` dựng tệp lệnh từ văn bản `llvm-objdump -d` của tệp nhị phân nó sẽ chạy. Với `account-O0`:

```text
breakpoint set -n bump
breakpoint set -n classify
breakpoint set -n sum_balances
breakpoint set -a 0x100000504 -s account-O0
breakpoint set -a 0x1000004f4 -s account-O0
breakpoint set -a 0x100000524 -s account-O0
breakpoint set -a 0x100000514 -s account-O0
target stop-hook add -o "register read x0 x1 pc" -o "memory read -s4 -fx -c24 $x0" -o "frame variable -P 1"
run
watchpoint set variable a->balance
watchpoint list
continue
...
breakpoint list
watchpoint list -v
```

Ba breakpoint theo tên là các điểm vào hàm. Bốn breakpoint địa chỉ là đích và fall-through của mỗi nhánh có điều kiện mà `Listing.conditional_branches()` tìm thấy trong `classify`: `tbz` tại `0x1000004f0` và `b.le` tại `0x100000510`. Watchpoint được đặt tại lần dừng đầu tiên, mà kế hoạch kỳ vọng là `bump`. Mười sáu lệnh `continue` theo sau, nhiều hơn bất kỳ lần chạy nào cần, và các lệnh thừa thất bại vô hại sau khi thoát. Ngân sách không phải kiến thức về chương trình. Nó là một mức trần.

Các khẳng định được dựng từ cùng đầu vào bởi `claims_for()`:

| Id | Loại | Khẳng định | Nguồn |
|---|---|---|---|
| `arg-registers` | argument-register | tại mọi điểm vào các đối số đầu tiên đến trong `x0` và `x1` | bài 32 và AAPCS64 |
| `field-offsets` | field-offset | `struct account` dài 32 byte với `kind` tại 0, `balance` tại 4, `code` tại 8, `rate` tại 16, `label` tại 24 | bài 41 và bản dump DWARF |
| `branch-1` | branch-taken | `tbz` tại `0x1000004f0` đi đến `0x100000504` khi `a->balance >= 0`, nếu ngược lại đến `0x1000004f4` | các cạnh bài 33 và phép nâng bài 34 |
| `branch-2` | branch-taken | `b.le` tại `0x100000510` đi đến `0x100000524` khi `a->balance <= 200`, nếu ngược lại đến `0x100000514` | các cạnh bài 33 và phép nâng bài 34 |
| `calls` | call-edge | `main` gọi `bump` một lần, `classify` ba lần, `sum_balances` một lần | văn bản nguồn và `nm` |
| `store-once` | store | `bump` ghi `a->balance` một lần và giá trị mới là giá trị cũ cộng `by` | mã giả bài 34 |
| `stride` | struct-stride | `list[i].balance` nằm tại `list + 32*i + 4` | bài 41 và quy tắc aggregate psABI |
| `output` | behaviour | chương trình in `class 0 1 -1` và `sum 315` | phép tính trong mã nguồn |

Các độ lệch trường đến từ `struct_layout()`, đọc `DW_TAG_structure_type` với `DW_AT_byte_size (0x20)` và năm mục `DW_TAG_member` với `DW_AT_data_member_location` của chúng từ bản dump dSYM. Kế hoạch không bao giờ nhập số 4. Nó đọc số đó.

## The Run at -O0: Eleven Stops

Lần dừng đầu tiên là breakpoint `bump`. Hook đã in điều này trước khối dừng:

```text
      x0 = 0x000000016fdfe008
      x1 = 0x0000000000000005
      pc = 0x00000001000004bc  account-O0`bump + 12 at account.c:13:19
0x16fdfe008: 0x00000073 0x000000fa 0x00000009 0x00000000
0x16fdfe018: 0x00000000 0x3ff40000 0x00000719 0x00000001
0x16fdfe028: 0x0000006c 0xffffffd8 0x00000003 0x00000000
0x16fdfe038: 0x00000000 0x40000000 0x00000721 0x00000001
(account *) a = 0x000000016fdfe008 {
  kind = 's'
  balance = 250
  code = 9
  rate = 1.25
  label = 0x0000000100000719 "savings"
}
(int) by = 5
```

Đọc tám word của hàng đầu tiên đối chiếu với các độ lệch DWARF. Word 0 tại độ lệch 0 là `0x73`, tức `'s'`, byte `kind`, theo sau bởi ba byte đệm. Word 1 tại độ lệch 4 là `0xfa` = 250, `balance`. Word 2 tại độ lệch 8 là `0x9`, `code`, một `short` ở nửa thấp với hai byte đệm ở phía trên. Word 3 tại độ lệch 12 là phần đệm trước `double` căn chỉnh 8 byte. Các word 4 và 5 tại độ lệch 16 là `0x3ff4000000000000`, là mã hóa IEEE-754 của 1.25. Các word 6 và 7 tại độ lệch 24 là `0x100000719`, con trỏ `label` vào `__TEXT`. Tám word tiếp theo bắt đầu bằng `0x6c` = `'l'` và `0xffffffd8` = -40: hàng thứ ba, `loan`, cách 32 byte sau đó. Mọi con số khớp với `frame variable`, nên `_check_layout()` ghi `field-offsets` là `confirmed` tại lần dừng này, và làm vậy lần nữa tại mỗi lần trong mười một lần dừng nơi `x0` giữ một con trỏ struct.

`x0` bằng `a` và `x1` bằng `by`, nên `arg-registers` được xác nhận tại điểm vào này. Harness chỉ so sánh các đối số được khai báo. Tại các lần dừng `classify`, `x1` vẫn đọc là `0x5`, một phần còn lại từ `bump`, và `classify` có một đối số, nên không có gì được so sánh với nó. Một thanh ghi không có đối số nào nằm trong là nhiễu, và khẳng định bài 32 không nói gì về nó.

Lần dừng thứ hai là watchpoint, giá trị cũ 250, giá trị mới 255, `by` = 5. Một lần chạm trong cả lần chạy, nên `store-once` được xác nhận. Sau đó đến ba lần kích hoạt `classify`, mỗi lần có lần dừng điểm vào và một hoặc hai lần dừng cạnh:

| Lần dừng | Địa chỉ | Lý do dừng | Nó kiểm tra gì |
|---|---|---|---|
| 2 | `0x1000004e8` | breakpoint 2.1 | điểm vào, `a->balance` = 100, `x0` = `a` |
| 3 | `0x100000504` | breakpoint 4.1 | `tbz` được đi, 100 >= 0, `branch-1` được xác nhận |
| 4 | `0x100000524` | breakpoint 6.1 | `b.le` được đi, 100 <= 200, `branch-2` được xác nhận |
| 5 | `0x1000004e8` | breakpoint 2.1 | điểm vào, `a->balance` = 255 |
| 6 | `0x100000504` | breakpoint 4.1 | `tbz` được đi, 255 >= 0 |
| 7 | `0x100000514` | breakpoint 7.1 | `b.le` đi fall-through, 255 > 200 |
| 8 | `0x1000004e8` | breakpoint 2.1 | điểm vào, `a->balance` = -40 |
| 9 | `0x1000004f4` | breakpoint 5.1 | `tbz` đi fall-through, -40 < 0 |
| 10 | `0x100000544` | breakpoint 3.1 | điểm vào `sum_balances`, `x1` = 3 |

`_check_branches()` nhóm các lần dừng thành các lần kích hoạt, đọc số dư tại điểm vào, và với mỗi lần dừng cạnh tính nút kế tiếp mà vị từ đã nâng dự đoán. Năm lần dừng cạnh, năm lần thống nhất: `branch-1` được xác nhận ba lần, `branch-2` hai lần. Lần dừng 5 hiển thị số dư là 255, là giá trị mà watchpoint đã thấy được ghi. Lần chạy là một chương trình và bằng chứng kết nối với nhau.

Tại lần dừng 10 hook đọc 24 word từ `list`. `_check_stride()` lấy word 1, word 9, và word 17, là các độ lệch 4, 36, và 68: 100, 255, và -40. Nó so sánh từng giá trị với số dư mà `classify` thấy tại cùng địa chỉ, cộng chúng thành 315, và so sánh tổng với dòng `sum 315` mà chương trình đã in. Sau đó tiến trình thoát với trạng thái 0 và `breakpoint list` hiển thị các số lần chạm 1, 3, 1 cho các tên và 2, 1, 1, 1 cho bốn cạnh. Cả tám khẳng định kết thúc là `confirmed`, với 25 bản ghi đằng sau chúng, 23 bản gắn với một lần dừng và hai bản với lần chạy đã hoàn tất.

## The Run at -O2: Zero Stops

Cùng mã nguồn tại `-O2` là một chương trình khác. `llvm-objdump -d` của `main` có bốn lệnh `bl`, tất cả đến `printf`. Thay cho các lời gọi nó có `mov w8, #-0x1`, `mov w8, #0x1`, một số không thông qua `xzr`, và `mov w8, #0x13b`, tức 315. Trình biên dịch đã tính mọi kết quả tại thời điểm biên dịch. `nm` vẫn liệt kê `_bump`, `_classify`, và `_sum_balances`, vì chúng là các hàm bên ngoài và các bản sao ngoài dòng phải tồn tại để các tệp đối tượng khác gọi. dSYM có các mục `DW_TAG_subprogram` cho cả bốn hàm và không mục `DW_TAG_inlined_subroutine` nào, nên ngay cả thông tin gỡ lỗi cũng không ghi lại việc nội tuyến.

Kế hoạch cho bản dựng này có ba breakpoint theo tên và không breakpoint cạnh. `classify` tại `-O2` gồm sáu lệnh, `ldr`, `cmp`, `cset`, `cmp`, `csinv`, `ret`, không có nhánh có điều kiện trong đó. Các khẳng định cạnh từ bản liệt kê `-O0` không có địa chỉ trong tệp nhị phân này, và harness không mang chúng sang. Một khẳng định về một cạnh thuộc về bản dựng có bản liệt kê chứa cạnh đó.

Lần chạy:

```text
(lldb) breakpoint set -n bump
Breakpoint 1: where = account-O2`bump at account.c:13:16, address = 0x0000000100000460
(lldb) run
sizeof 32 align 8
offsets 0 4 8 16 24
class 0 1 -1
sum 315
Process 48444 exited with status = 0 (0x00000000)
(lldb) watchpoint set variable a->balance
error: Command requires a process which is currently stopped.
(lldb) breakpoint list
1: name = 'bump', locations = 1, resolved = 1, hit count = 0
```

Mỗi breakpoint đều phân giải được. Địa chỉ tồn tại, ký hiệu tồn tại, và lldb đã ghi một `BRK` ở đó. Số lần chạm bằng không vì không lần lấy lệnh nào từng đến địa chỉ đó. Các kết luận:

| Khẳng định | Kết luận | Bản ghi |
|---|---|---|
| `calls` | bị bác bỏ | sau một lần chạy đầy đủ với trạng thái thoát 0, các lần dừng điểm vào bump 0, classify 0, sum_balances 0 |
| `output` | được xác nhận | bốn dòng và trạng thái thoát 0 |
| `arg-registers` | không được quan sát | không lần dừng nào kiểm tra nó, các số lần chạm đều 0 |
| `field-offsets` | không được quan sát | không lần dừng nào kiểm tra nó |
| `store-once` | không được quan sát | không lần dừng trong bump, nên watchpoint chưa bao giờ được đặt |
| `stride` | không được quan sát | không lần dừng trong sum_balances |

Hãy chính xác về điều mà sự bác bỏ nói. Khẳng định là `main` gọi ba hàm trong chương trình này. Với bản dựng này và lần chạy này nó không gọi, và harness đã kiểm tra rằng lần chạy hoàn tất, vì số lần chạm bằng không trước khi thoát chỉ có nghĩa là lần chạy chưa đến lời gọi. Khẳng định không nói các hàm là mã chết, và lần chạy cũng không nói điều đó: chúng được export và một tệp đối tượng khác có thể gọi chúng. Bốn khẳng định còn lại không được xác nhận cũng không bị bác bỏ. Struct vẫn có `balance` tại độ lệch 4 trong bản dựng này, và DWARF `-O2` nói vậy, nhưng không lần dừng nào trong lần chạy này đọc bộ nhớ để cho thấy điều đó. `not-observed` giữ sự phân biệt đó, và bài 35 giữ điều chưa biết mở cho đến khi một lần chạy thực sự quan sát nó.

## Core Dumps

Một tệp core là bộ nhớ và các thanh ghi của tiến trình được ghi ra đĩa, để trình gỡ lỗi có thể đọc một chương trình đã dừng sau khi chương trình không còn. `core(5)` của Apple nói "Một số ít tín hiệu gây chấm dứt bất thường một tiến trình cũng khiến một bản ghi trạng thái trong bộ nhớ của tiến trình được ghi ra đĩa", vào `/cores/core.pid`, "miễn là tiến trình đã chấm dứt có quyền ghi trong thư mục, và thư mục tồn tại". Trên máy này `sysctl` báo cáo `kern.coredump: 1` và `kern.corefile: /cores/core.%P`, `/cores` tồn tại với mode `drwxrwxr-t root admin`, và `ulimit -c` của shell là 0. Không core kernel nào được ghi cho đến khi bạn tăng giới hạn bằng `ulimit -c unlimited`, hoặc trên toàn hệ thống bằng `launchctl limit core unlimited`.

lldb viết một core theo yêu cầu mà không cần sự cố. Tại breakpoint `bump`:

```text
(lldb) process save-core --style stack account-O0-stack.core
Saving 49152 bytes of data for memory region at 0x16fdf4000

Modified-memory or stack-memory only corefile created.  This corefile may 
not show library/framework/app binaries on a different system, or when 
those binaries have been updated/modified. Copies are not included
in this corefile.  Use --style full to include all process memory.
```

Tệp dài 53,248 byte. Việc nạp nó cần tệp nhị phân ở cạnh nó:

```text
(lldb) target create "./account-O0" --core "account-O0-stack.core"
(lldb) bt
* thread #1, stop reason = ESR_EC_BRK_AARCH64 (fault address: 0x0)
  * frame #0: 0x00000001000004bc account-O0`bump(a=0x000000016fdfe008, by=5) at account.c:13:19
    frame #1: 0x0000000100000640 account-O0`main at account.c:40:5
    frame #2: 0x000000019a949d54 dyld`start + 7184
(lldb) frame variable *a
(account) *a = (kind = 's', balance = 250, code = 9, rate = 1.25, label = "")
(lldb) frame variable a->label
(const char *) a->label = 0x0000000100000719 ""
```

Backtrace và các trường số nguyên còn nguyên, vì chúng nằm trên stack mà core đã lưu. `label` được in thành một chuỗi rỗng với con trỏ còn nguyên. Con trỏ `0x100000719` là đúng; các byte nó trỏ đến là literal `"savings"` trong segment `__TEXT` của tệp thực thi, và một core kiểu stack không bao gồm segment đó. Con trỏ là một quan sát. Chuỗi không khả dụng, và lldb không bịa ra nó. `--style full` bao gồm toàn bộ bộ nhớ tiến trình, và một core đầy đủ của chương trình 34 KB này trên máy nghiên cứu dài 2.1 GB, vì tiến trình ánh xạ shared cache. Lý do dừng ghi `ESR_EC_BRK_AARCH64`: core ghi lại ngoại lệ `BRK` mà breakpoint đã gây ra.

Trên Linux kernel viết core theo `/proc/sys/kernel/core_pattern`, một mẫu với `%p` cho PID, `%e` cho tên lệnh, `%s` cho tín hiệu, và `%t` cho thời gian, và một `|` đầu tiên dẫn bản dump qua pipe đến một chương trình. Các bản phân phối systemd dùng pipe đó cho `systemd-coredump`, và `coredumpctl list`, `info`, `dump`, và `debug` lấy lại những gì nó đã lưu. `gdb prog core` và `lldb -c core prog` đều mở kết quả.

## gdb and lldb Side by Side

Hai trình gỡ lỗi làm cùng công việc với các từ khác nhau. `COMMAND_MAP` trong harness giữ 35 hàng, được in bởi `python3 code/main.py commands`. Những hàng bài học này dùng:

| Tác vụ | gdb | lldb | Alias lldb |
|---|---|---|---|
| dừng tại một hàm | `break bump` | `breakpoint set -n bump` | `b bump` |
| dừng tại một địa chỉ trong một mô-đun | `break *0x1000004f0` | `breakpoint set -a 0x1000004f0 -s account-O0` | |
| chạy các lệnh tại mọi lần dừng | `define hook-stop` ... `end` | `target stop-hook add -o '...'` | |
| liệt kê các breakpoint với số lần chạm | `info breakpoints` | `breakpoint list` | `br l` |
| theo dõi một biến đối với các lần ghi | `watch a->balance` | `watchpoint set variable a->balance` | `wa s v a->balance` |
| liệt kê các watchpoint | `info watchpoints` | `watchpoint list -v` | `wa l -v` |
| đọc một thanh ghi | `p $x0` | `register read x0` | |
| đọc bộ nhớ dưới dạng word | `x/8xw 0x16fdfe008` | `memory read -s4 -fx -c8 0x16fdfe008` | `x -s4 -fx -c8 0x16fdfe008` |
| hiển thị các đối số | `info args` | `frame variable --no-locals` | |
| bước một lệnh | `stepi` | `thread step-inst` | `si` |
| chạy đến khi hàm trả về | `finish` | `thread step-out` | `finish` |
| viết một tệp core | `gcore core` | `process save-core --style stack core` | |
| mở một tệp core | `gdb account-O0 core` | `lldb -c core account-O0` | |

`p` của lldb là một alias của `dwim-print`, in một biến thông thường qua đường `frame variable` và quay sang `expression` cho mọi thứ khác. `v` là `frame variable`. Ưu tiên `frame variable` trong một harness: nó đọc các vị trí DWARF và không bao giờ chạy mã trong chương trình được gỡ lỗi.

Các phiên bản và giấy phép vào 2026-10-14. lldb mang số phiên bản LLVM, và bản phát hành llvm.org hiện tại là LLVM 23.1.3 ngày 2026-10-06, theo Apache License 2.0 với các ngoại lệ LLVM. Homebrew cung cấp nó dưới dạng formula riêng `lldb`. Command Line Tools trên máy này cung cấp `lldb-1703.0.236.21`, cách đánh số riêng của Apple, với Python nhúng 3.9.6, và lldb của Apple đã được ký để gỡ lỗi. GDB 18.1 được phát hành ngày 2026-09-25 theo GPL-3.0-or-later. Ghi chú phát hành của nó liệt kê các thay đổi Windows, `.gdb_index`, AArch64 `FPMR`, và Python `gdb.Corefile` và không có mục Darwin. GDB không có hỗ trợ native cho các tiến trình Apple silicon đến 18.1: một loạt 15 bản vá "Hỗ trợ AArch64-Darwin ban đầu" đã được đăng vào tháng 10 năm 2025, và vào tháng 2 năm 2026 một người bảo trì trình bày lộ trình đưa nó vào thông qua chuyển nhượng bản quyền và các bản vá BFD trước. Formula Homebrew `gdb` có các bottle arm64 và dựng với một `--target=x86_64-apple-darwin20` giả, và pull request đã thêm chúng nói "không thể gỡ lỗi các tệp nhị phân aarch64-darwin qua GDB". Bất kỳ trình gỡ lỗi nào không phải của Apple trên macOS cũng cần một chứng chỉ tự ký và entitlement `com.apple.security.cs.debugger`, hoặc `task_for_pid` thất bại với "(os/kern) failure (0x5)". Vị trí của gdb trong khóa học này là Linux, nơi Debian stable cung cấp gdb 16.3 cho arm64, và nơi `rr` tồn tại.

## Tracing: What the Program Asked the Kernel For

Một trình gỡ lỗi cho thấy trạng thái của chương trình tại một lần dừng. Một tracer cho thấy các tác động của chương trình lên hệ thống mà không dừng nó lâu. Các công cụ là theo từng hệ điều hành.

| Công cụ | OS | Phiên bản | Giấy phép | Nó ghi lại gì |
|---|---|---|---|---|
| `strace` | Linux | 7.2, 2026-08-18 | LGPL-2.1-or-later | các lời gọi hệ thống với đối số và giá trị trả về |
| `ltrace` | Linux | tarball cuối 0.7.3, các snapshot git trong Debian | GPL-2.0 | các lời gọi thư viện động |
| `bpftrace` | Linux | v0.27.0, 2026-09-10 | Apache-2.0 | các probe kernel và người dùng thông qua eBPF |
| `dtrace` và `dtruss` | macOS | `Sun D 1.19` trong macOS 26.2 | CDDL, từ OpenSolaris của Sun | các probe D; `dtruss` in các lời gọi hệ thống |

`dtruss` nói trong hướng dẫn của nó rằng "Vì điều này dùng DTrace, chỉ người dùng có quyền root có thể chạy lệnh này". `dtrace(1)` của Apple thêm rằng "Với các thiết lập System Integrity Protection mặc định, các chương trình D không được phép truy cập các giá trị địa chỉ kernel hoặc nội dung bộ nhớ kernel" và các hành động phá hủy không được phép dưới SIP. `sudo dtruss ./account-O0` trên máy này không được chạy trong bài học này, vì harness chạy không có root, và bài học ghi lại điều đó là chưa được xác minh. Một bản trace trả lời câu hỏi khác với harness: "lần chạy này có phát một `write` cho mỗi dòng `printf` không" là câu hỏi trace, "`x1` có giữ 5 tại `bump` không" là câu hỏi debugger. Cả hai đều theo từng lần chạy.

## Record and Replay

`rr` ghi lại một lần chạy một lần và phát lại nó một cách xác định dưới gdb, với thực thi ngược: đặt một watchpoint trên giá trị bạn quan tâm và `reverse-cont` chạy ngược đến lần ghi. Dự án tự mô tả là "Bạn ghi lại một lỗi một lần, rồi gỡ lỗi bản ghi, một cách xác định, bao nhiêu lần tùy bạn muốn". Bản phát hành hiện tại là 5.9.0 ngày 2025-02-13, theo giấy phép MIT với một khối BSD-2-Clause. Nó chỉ dành cho Linux. Nó cần các bộ đếm hiệu năng phần cứng để đếm các nhánh, nên nó chạy trên Intel Nehalem trở về sau, một số lõi AMD Zen, và "một số vi kiến trúc AArch64 (ví dụ ARM Neoverse N1 hoặc Apple Silicon M-series)" dưới Linux. Bên trong một máy ảo các bộ đếm phải được ảo hóa, và wiki dự án nói "Không có giải pháp ảo hóa nào khác trên Mac làm được điều đó cả", nên Docker và Colima trên máy này không thể chạy nó. Pernosco là dịch vụ thương mại được xây dựng trên các bản ghi rr.

gdb có một bộ ghi phần mềm riêng. `record full` ghi "một nhật ký việc thực thi tiến trình" với giới hạn mặc định 200,000 lệnh, và `record btrace` dùng theo vết nhánh Intel và "không ghi dữ liệu". Cả hai đều không có trong lldb. Trên máy macOS này, bản ghi đã lưu của harness là bản ghi: cùng kế hoạch trên cùng tệp nhị phân tạo ra cùng các lần dừng theo cùng thứ tự, và các kiểm thử fixture ghim thứ tự đó.

## What One Run Proves

Một lần chạy chứng minh một đầu vào trên một bản dựng. Tiêu chuẩn C định nghĩa hành vi không xác định là "hành vi, khi sử dụng một cấu trúc chương trình không có tính khả chuyển hoặc sai hoặc dữ liệu sai, mà tài liệu này không áp đặt yêu cầu nào", nên một chương trình tràn một `int` có dấu có thể hợp lệ khi in các kết quả khác nhau tại `-O0` và `-O2`. Bài 36 đã gặp điều này với các ô tràn `percent_change`. UBSan chuyển câu hỏi thành một lần dừng: `-fsanitize=signed-integer-overflow -fsanitize-trap=undefined` khiến phép tràn "thực thi một lệnh trap", đi vào lldb dưới dạng một lần dừng có lý do.

Mã được tối ưu cũng di chuyển thứ bạn muốn theo dõi. Hướng dẫn GDB nói "bộ tối ưu đã sắp xếp lại mã của bạn; trình gỡ lỗi cho bạn thấy những gì thực sự có ở đó" và một biến bị tối ưu đến mức không còn tồn tại là biến "GDB không bao giờ thấy". GDB in một giá trị như vậy là `<optimized out>`, và mã nguồn của nó phân biệt điều đó với `<unavailable>`: optimized out "không thực sự tồn tại trong chương trình", unavailable "tồn tại trong chương trình (ở mức máy), nhưng GDB không có phương tiện để tiếp cận nó". lldb in `<variable not available>` khi bộ đếm chương trình nằm ngoài mọi phạm vi của danh sách vị trí DWARF của biến. Một watchpoint trên một biến cục bộ nằm trong thanh ghi không bao giờ kích hoạt, vì một thanh ghi không phải bộ nhớ. Lần chạy `-O2` ở trên cho thấy trường hợp cực đoan: toàn bộ hàm đã bị gộp đi, và sự im lặng của một watchpoint chưa bao giờ được đặt không chứng minh điều gì.

Vì vậy harness viết ba loại bản ghi và không bao giờ một loại thứ tư. Một lần dừng đã kiểm tra khẳng định và đồng ý là `confirmed`. Một lần dừng đã kiểm tra nó và không đồng ý là `refuted`. Một khẳng định không lần dừng nào có thể kiểm tra là `not-observed`, kèm lý do, và các số lần chạm breakpoint là một phần của lý do đó. Sổ cái của Bài 35 chấp nhận hai loại đầu làm các bản ghi `observed` với thẩm quyền `controlled-replay`, và giữ loại thứ ba là một điều chưa biết đang mở.

## Debugging Only Your Own Builds on macOS

Trên Apple silicon linker ký cho bạn. `ld(1)` của Apple nói về `-adhoc_codesign`: "Mặc định cho các tệp nhị phân Apple Silicon là được ký mã ad-hoc." `codesign -dvvv account-O0` trên fixture in:

```text
Format=Mach-O thin (arm64)
CodeDirectory v=20400 size=387 flags=0x20002(adhoc,linker-signed) hashes=9+0 location=embedded
Signature=adhoc
TeamIdentifier=not set
```

`0x20002` là `CS_ADHOC` (`0x2`) cộng `CS_LINKER_SIGNED` (`0x20000`), "Được linker ký tự động" trong header ký mã của Apple. `codesign -d --entitlements -` không in gì sau tên tệp thực thi: tệp nhị phân không có entitlement. lldb đã khởi chạy nó, chạm mọi breakpoint, đặt một watchpoint phần cứng, và viết một core, với `DevToolsSecurity -status` báo cáo "Chế độ nhà phát triển hiện đang tắt" và System Integrity Protection được bật.

Hai entitlement kiểm soát ai có thể gỡ lỗi cái gì, và chúng nằm ở hai phía đối diện. `com.apple.security.cs.debugger` dành cho trình gỡ lỗi: "Một giá trị Boolean cho biết ứng dụng có phải trình gỡ lỗi và có thể attach vào các tiến trình khác hoặc lấy các cổng tác vụ hay không". `debugserver` của Apple mang dạng riêng tư của nó, và `codesign -d --entitlements -` trên bản sao Command Line Tools liệt kê `com.apple.private.cs.debugger`, `com.apple.private.set-exception-port`, `com.apple.private.thread-set-state`, và `com.apple.private.logging.diagnostic`. `com.apple.security.get-task-allow` dành cho đích. Xcode chèn nó vào các bản dựng gỡ lỗi, loại bỏ nó khi export, và việc công chứng từ chối một tệp nhị phân vẫn còn nó. Các kỹ sư Apple nêu quy tắc cho sự từ chối: cổng tác vụ bị từ chối khi đích bật hardened runtime và không có `get-task-allow`. Một bản dựng `clang` thông thường không được harden và không kích hoạt điều kiện nào. Nếu bạn từng ký một fixture bằng `codesign --options runtime`, hãy ký lại nó bằng `codesign -s - -f --entitlements get-task-allow.plist` trước khi gỡ lỗi.

Ba thông tin nữa khép lại mục này. Thứ nhất, bạn có thể thấy hộp thoại "Developer Tools Access cần nắm quyền điều khiển một tiến trình khác để tiếp tục gỡ lỗi" lần đầu trong một phiên đăng nhập; `sudo DevToolsSecurity -enable` loại bỏ mật khẩu bổ sung cho các thành viên của các nhóm `admin` hoặc `_developer`. Thứ hai, bạn không tắt SIP để gỡ lỗi mã của chính mình. Apple nói "Bạn không cần tắt SIP để chạy và gỡ lỗi các ứng dụng từ Xcode", và thành phần SIP duy nhất chạm đến gỡ lỗi là thành phần mà `csrutil enable --without debug` nới lỏng, cho các tiến trình của người khác. Thứ ba, sandbox Seatbelt trong phiên này chặn hoàn toàn `task_for_pid`, và fixture `sandbox-O0.lldb.txt` cho thấy kết quả. Một lần chạy không thể bắt đầu là một thông tin môi trường, và harness báo cáo nó như vậy.

Mọi thứ trong bài học này áp dụng cho các chương trình bạn đã biên dịch. Cùng các lệnh đó chỉ attach vào một tiến trình khác nếu chủ sở hữu của nó đã đồng ý, và không có gì ở đây dạy cách thay đổi điều đó.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
```

Đầu ra là một báo cáo JSON trên các bản ghi đã lưu. Với mỗi bản dựng nó liệt kê các breakpoint cùng trạng thái phân giải và số lần chạm, số watchpoint phần cứng, mọi lần dừng cùng các thanh ghi và đối số, trạng thái thoát, đầu ra chương trình, các lỗi lldb đã in, và các khẳng định cùng kết luận và các bản ghi bằng chứng đằng sau chúng. Nó thêm vòng lưu-nạp core, các kết quả API Python, lỗi sandbox, và những công cụ bên ngoài nào vắng mặt trên máy này.

Dạng kỳ vọng:

```json
{
  "program": "account.c",
  "variants": {
    "O0": {
      "binary": "account-O0",
      "breakpoints": {"1": {"spec": "name=bump", "address": "0x1000004bc", "resolved": true, "hits": 1}, "...": "..."},
      "hardwareWatchpoints": 4,
      "watchpoints": {"1": {"address": "0x16fdfe00c", "size": 4, "type": "m", "hits": [[250, 255]], "hitCount": 1}},
      "stops": [{"index": 0, "pc": "0x1000004bc", "function": "bump", "kind": "entry", "registers": {"x0": "0x16fdfe008", "x1": "0x5"}, "...": "..."}],
      "exitStatus": 0,
      "claims": [{"id": "arg-registers", "verdict": "confirmed", "confirmed": 5, "refuted": 0, "not-observed": 0, "...": "..."}],
      "evidence": [{"claim": "arg-registers", "verdict": "confirmed", "stop": 0, "observation": "bump: x0 = 0x16fdfe008 and a = 0x000000016fdfe008, x1 = 0x5 and by = 5"}]
    },
    "O2": {"stops": [], "claims": [{"id": "calls", "verdict": "refuted", "...": "..."}], "...": "..."}
  },
  "core": {"savedAt": {"function": "bump", "pc": "0x1000004bc"}, "labelString": "", "...": "..."},
  "types": {"python": "3.9.6", "size": 32, "...": "..."},
  "sandbox": {"stops": 0, "errors": ["process exited with status -1 (attach failed ((os/kern) invalid address))"]},
  "absentTools": ["bpftrace", "gdb", "llvm-objdump", "ltrace", "rr", "strace"]
}
```

Đọc `code/main.py` theo thứ tự này:

1. `Listing` phân tích văn bản `llvm-objdump -d` thành các hàm và lệnh, và `Function.conditional_branches()` tìm các nhánh cùng đích và fall-through của chúng.
2. `struct_layout()` đọc các mục cấu trúc và thành viên từ văn bản `llvm-dwarfdump`.
3. `lift_condition()` chuyển một nhánh có điều kiện thành một vị từ, bước bài 34 cho `tbz`, `cbz`, và các dạng so sánh và rẽ nhánh.
4. `Plan.commands()` viết tệp lệnh lldb từ bản liệt kê, và `Plan.lldb_command()` là lời gọi batch.
5. `parse_transcript()` duyệt đầu ra theo thứ tự và dựng các bản ghi `Stop` với các thanh ghi, bộ nhớ, biến, và giá trị watchpoint, cùng bảng breakpoint và trạng thái thoát.
6. `claims_for()` nêu tám khẳng định, và `evaluate()` chấm chúng từng lần dừng bằng các hàm `_check_*`.
7. `rollup()` rút các bản ghi về một kết luận cho mỗi khẳng định, với bị bác bỏ được ưu tiên hơn được xác nhận.
8. `capture()` và `capture_extras()` đã tạo các fixture, và `live()` lặp lại toàn bộ vòng trên một bản dựng mới khi `clang` và `lldb` có thể chạy.

Có thêm bốn lệnh. `python3 code/main.py plan O0` in tệp lệnh cho một bản dựng. `python3 code/main.py commands` in bảng gdb và lldb. `python3 code/main.py tools` báo cáo những công cụ bên ngoài nào nằm trên `PATH`. `python3 code/main.py live O0` biên dịch `account.c` vào một thư mục tạm, lập kế hoạch từ bản liệt kê mới của nó, chạy lldb, và chấm các khẳng định theo lần chạy đó. Bên trong một sandbox nó báo cáo rằng lldb không thể khởi chạy tiến trình, kèm lỗi, và thoát 1.

## Use It

Dùng harness trên một chương trình của chính bạn theo thứ tự này.

1. Dựng nó với `-g` và mức tối ưu hóa bạn sẽ phát hành. Giữ tệp nhị phân, dSYM hoặc DWARF của nó, và văn bản `llvm-objdump -d` cùng nhau.
2. Viết các khẳng định trước khi bạn chạy. Mỗi khẳng định nêu một hàm, một thanh ghi hoặc một địa chỉ hoặc một độ lệch, một giá trị hoặc cạnh kỳ vọng, và bài học hoặc tài liệu nó đến từ. Một khẳng định bạn viết sau khi thấy lần dừng mô tả lần dừng và không kiểm tra gì.
3. Tạo kế hoạch từ bản liệt kê và đọc nó. Mọi địa chỉ trong đó nên truy được về một dòng trong bản liệt kê. Nếu một breakpoint không có dòng như vậy, hãy loại bỏ nó.
4. Chạy một lần ở chế độ batch và giữ bản ghi với dòng lệnh và phiên bản trình gỡ lỗi trong header của nó. Bản ghi là bằng chứng. Các kết luận được suy ra từ nó, và bất kỳ ai cũng có thể suy ra lại chúng.
5. Chấm. Đọc mọi bản ghi `not-observed` và lý do của nó trước khi bạn đọc các xác nhận. Các lý do cho bạn biết những khẳng định nào cần một đầu vào khác, một bản dựng khác, hoặc một breakpoint khác.
6. Chạy bản dựng được tối ưu với cùng các khẳng định. Kỳ vọng các breakpoint phân giải được với không lần chạm ở nơi trình biên dịch đã nội tuyến, và giữ các khẳng định đó mở.
7. Đưa các bản ghi được xác nhận và bị bác bỏ vào sổ cái bài 35 dưới dạng `observed`, thẩm quyền `controlled-replay`, một bản ghi cho mỗi lần dừng. Để các bản không được quan sát là những điều chưa biết với các số lần chạm breakpoint được đính kèm.

## Interactive Lab

### Lab A: read a stop by hand

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program/code
python3 -q
```

Chạy:

```python
from main import *
t = load_transcript("session-O0.lldb.txt")
s = t.stops[0]
hex(s.pc), s.function, s.reason, s.registers
[hex(w) for w in s.memory[:8]]
s.struct_pointer().fields
```

Trước dòng thứ hai, viết ra word nào bạn kỳ vọng giữ 250 và hai word nào giữ 1.25. Sau đó chạy `struct.unpack("<d", struct.pack("<II", s.memory[4], s.memory[5]))` và so sánh. Sau đó nhìn vào `t.stops[1].watch_hit` và `t.stops[1].pc`, và tìm địa chỉ đó trong `account-O0.objdump.txt`: đó là lệnh sau phép lưu.

### Lab B: the branch and its successor

```python
plan = make_plan("O0")
plan.branches()
classify = plan.listing.function("classify")
[lift_condition(classify, b, "a->balance")[0] for b in plan.branches()]
[(hex(s.pc), s.struct_pointer().field_int("balance")) for s in t.stops_in("classify")]
```

Ghép mỗi lần dừng cạnh với lần dừng điểm vào của nó và quyết định, trước khi bạn xem bằng chứng, nút kế tiếp nào mà vị từ dự đoán. Sau đó chạy `[e.to_dict() for e in evaluate(plan, t, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim.startswith("branch")]` và so sánh.

### Lab C: the run that never stopped

```python
o2 = load_transcript("session-O2.lldb.txt")
len(o2.stops), o2.exit_status, o2.hits()
o2.errors[:3]
make_plan("O2").branches()
rollup(evaluate(make_plan("O2"), o2, struct_layout(open("fixtures/account-O2.dwarfdump.txt").read(), "account")))
```

Giải thích mỗi `not-observed` bằng lời của bạn, rồi mở `account-O2.objdump.txt` và tìm bốn hằng số trong `main` đã thay thế các lời gọi. Sau đó đếm `DW_TAG_inlined_subroutine` trong `account-O2.dwarfdump.txt` bằng `count_tags()`.

### Lab D: break the evidence

```python
text = open("fixtures/session-O0.lldb.txt").read().replace("x1 = 0x0000000000000005", "x1 = 0x0000000000000006", 1)
broken = parse_transcript(text)
[e.to_dict() for e in evaluate(plan, broken, struct_layout(open("fixtures/account-O0.dwarfdump.txt").read(), "account")) if e.claim == "arg-registers"][:2]
```

Một giá trị thanh ghi được chỉnh sửa chuyển bản ghi `arg-registers` đầu tiên thành `refuted` và cả kết quả tổng hợp theo nó, trong khi bốn điểm vào khác vẫn `confirmed`. Sau đó xóa dòng `old value: 250` trước lần dừng watchpoint và xem `store-once` rơi xuống `not-observed`. Một bộ chấm không thể bị làm cho thất bại thì không đang chấm.

Nếu lldb có thể khởi chạy một tiến trình trong shell của bạn, kết thúc bằng `python3 main.py live O0` và `python3 main.py live O2`. Các địa chỉ stack sẽ khác với các fixture. Các kết luận thì không nên khác.

## Practice Lab

Mở rộng harness với một khẳng định về vòng lặp trong `sum_balances`.

Yêu cầu:

- Tìm cạnh ngược vòng lặp của `sum_balances` trong bản liệt kê `-O0` bằng `conditional_branches()` và thêm một breakpoint tại header vòng lặp.
- Thêm một khẳng định rằng header thực thi `count + 1` lần với `count` = 3, là cạnh ngược bài 33 cộng phép kiểm tra thoát.
- Mở rộng stop hook hoặc kế hoạch để hook đọc ô stack của bộ đếm vòng lặp tại mỗi lần dừng header, và viết một `_check_loop()` ghi lại chuỗi các giá trị bộ đếm.
- Thu lại bản ghi bằng `python3 main.py capture O0` trên một máy nơi lldb có thể khởi chạy, và chạy lại bộ kiểm thử. Kiểm thử kế hoạch sẽ thất bại cho đến khi tệp lệnh đã commit khớp với kế hoạch mới, đó là mục đích của kiểm thử đó.
- Thêm một kiểm thử chỉnh sửa một giá trị bộ đếm trong bản ghi và khẳng định rằng khẳng định chuyển thành `refuted`.

Thành công nghĩa là báo cáo hiển thị các lần dừng header theo thứ tự cùng các giá trị bộ đếm, và lần chạy `-O2` giữ khẳng định mới là `not-observed` với lý do vòng lặp đã được vector hóa hoặc gộp đi.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-dynamic-analysis-of-your-own-program.md`. Dùng nó để chuyển một chương trình bạn đã dựng, bản liệt kê của nó, và một danh sách các khẳng định tĩnh thành một bản ghi debugger đã lưu và một kết luận cho mỗi khẳng định, với lần dừng đã tạo từng kết luận và lý do cho mọi khẳng định vẫn không được quan sát. Nó áp dụng cho Claude, Cursor, Codex, OpenClaw, Hermes, hoặc bất kỳ agent nào đọc SKILL.md.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/42-dynamic-analysis-of-your-own-program
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Bộ kiểm thử chạy không cần lldb. Nó đọc các bản ghi được thu một lần vào `code/fixtures/`. Việc xác minh nên chứng minh:

- bộ phân tích bản liệt kê tìm thấy bốn hàm cùng phạm vi của chúng và hai nhánh có điều kiện của `classify` tại `-O0` với đích và fall-through
- phép nâng của `tbz w8, #0x1f` là `a->balance >= 0` và phép nâng của `subs` cộng `b.le` là `a->balance <= 200`
- `main` tại `-O0` gọi `bump`, `classify` ba lần, và `sum_balances`, và `main` tại `-O2` chỉ gọi `printf`
- các mnemonic `j<cc>` x86-64 là có điều kiện và `jmp` cùng `callq` thì không
- bản dump DWARF cho một struct 32 byte với các thành viên tại 0, 4, 8, 16, và 24
- DWARF `-O2` có bốn chương trình con và không mục chương trình con nội tuyến nào, và `nm` vẫn liệt kê ba hàm
- kế hoạch bằng tệp lệnh đã commit cho cả hai bản dựng, và header bản ghi ghi lại lệnh lldb đã chạy nó
- bản ghi `-O0` có mười một lần dừng trong các hàm kỳ vọng, trạng thái thoát 0, và bốn dòng đầu ra
- đầu ra hook được gắn vào lần dừng theo sau nó, với `x1` = 5, bộ nhớ bắt đầu tại `x0`, và chuỗi nhãn
- bảng breakpoint mang trạng thái phân giải và các số lần chạm 1, 3, 1, 2, 1, 1, 1
- watchpoint là 4 byte loại sửa đổi tại `x0 + 4`, chạm một lần với giá trị cũ 250 và giá trị mới 255, và bốn ô phần cứng được báo cáo
- bản ghi `-O2` có không lần dừng, ba breakpoint phân giải được với không lần chạm, không watchpoint, và một lỗi cho mỗi `continue` không dùng
- việc khởi chạy trong sandbox thất bại trước bất kỳ lần dừng nào với lỗi attach
- vòng lưu-nạp core giữ backtrace và `balance` = 250 và mất chuỗi đằng sau `label`
- API Python đọc năm trường, kích thước 32, và các phạm vi hàm mà không có một tiến trình
- một bản ghi x86-64 viết tay được phân tích với `rdi`, `rsi`, và `rip`
- mọi khẳng định được xác nhận tại `-O0` với 5, 11, 3, 2, 1, 1, 1, 1 bản ghi
- bằng chứng nhánh nêu giá trị, điều kiện, và cạnh
- bằng chứng độ lệch trường giải mã các word qua bố cục DWARF
- bằng chứng lưu và stride mang giá trị cũ và mới và các số dư của ba hàng
- lần chạy `-O2` bác bỏ các cạnh gọi và để các khẳng định khác không được quan sát
- một giá trị thanh ghi được chỉnh sửa bị bác bỏ, một lần chạm watchpoint bị xóa là không được quan sát, và bị bác bỏ thắng kết quả tổng hợp
- bản đồ lệnh có các dạng gdb và lldb cho mọi hàng, và bảng phần cứng nêu bốn thanh ghi gỡ lỗi x86
- demo liệt kê các công cụ vắng mặt thay vì thất bại, và chế độ trực tiếp báo cáo công cụ thiếu theo tên
- dữ liệu figure đến từ cả hai phiên và mô-đun site nhúng cùng dữ liệu

## Production Failure Modes

| Lỗi | Báo cáo yếu nói gì | Harness phải chứng minh gì |
|---|---|---|
| Breakpoint phân giải được với không lần chạm | "hàm chạy" hoặc "hàm là mã chết" | một lần chạy đầy đủ với trạng thái thoát, các số lần chạm, và kết luận `refuted` chỉ cho cạnh gọi |
| Đọc thanh ghi tại sai lần dừng | "`x1` = 5 bên trong `classify`" | chỉ so sánh các đối số được khai báo tại lần dừng điểm vào |
| Đọc struct không có độ lệch | một cột các word hex | mọi word được ánh xạ tới một `DW_AT_data_member_location` và được so sánh với `frame variable` |
| Nhánh được chấm từ mnemonic | "`tbz` nghĩa là được đi khi âm" | vị từ được nâng từ mã hóa và lần dừng tại nút kế tiếp |
| Watchpoint trên một biến cục bộ nằm trong thanh ghi | "không có lần ghi nào xảy ra" | watchpoint được đặt trên một địa chỉ và đã chạm, hoặc bản ghi là `not-observed` |
| Các breakpoint auto-continue | một bản ghi sạch không có lần dừng | các breakpoint thông thường, một stop hook, và một ngân sách continue |
| Breakpoint địa chỉ không có mô-đun | `unresolved, hit count = 0` | `-s MODULE` để địa chỉ bản liệt kê phân giải thành một địa chỉ nạp |
| Lỗi lệnh đầu tiên kết thúc batch | không có `breakpoint list` ở cuối | `interpreter.stop-command-source-on-error false` |
| Core kiểu stack được đọc như bộ nhớ đầy đủ | `label = ""` được báo cáo là giá trị của chương trình | kiểu core, con trỏ, và segment nó trỏ vào |
| Shell trong sandbox | "lldb bị hỏng" | `attach failed ((os/kern) invalid address)` được ghi lại như một thông tin môi trường |
| Đích được harden không có `get-task-allow` | "macOS cấm gỡ lỗi" | hai điều kiện từ quy tắc của Apple, và việc ký lại tệp nhị phân của chính bạn |
| Bản ghi bị loại bỏ sau khi chấm | các kết luận không có nguồn | tệp bản ghi, dòng lệnh của nó, và phiên bản trình gỡ lỗi |

## Operational Rule

Lập kế hoạch các lần dừng từ bản liệt kê, chạy một lần ở chế độ batch, giữ bản ghi, và chấm mọi khẳng định tĩnh tại mọi lần dừng có thể kiểm tra nó. Chỉ viết được xác nhận hoặc bị bác bỏ từ một lần dừng, viết không được quan sát cùng các số lần chạm và lý do, và không bao giờ để một breakpoint phân giải được thay cho một lần chạy. Chỉ gỡ lỗi các bản dựng bạn đã tạo.

## Further Reading

- [LLDB Tutorial: command grammar, breakpoints, watchpoints, stop hooks](https://lldb.llvm.org/use/tutorial.html)
- [lldb(1) manual page: --batch, --one-line, --source, --core](https://lldb.llvm.org/man/lldb.html)
- [GDB to LLDB Command Map](https://lldb.llvm.org/use/map.html)
- [LLDB Python Reference: SBTarget, SBFrame, SBValue, and the embedded interpreter](https://lldb.llvm.org/use/python-reference.html)
- [LLDB Caveats: the Python build lldb links against](https://lldb.llvm.org/resources/caveats.html)
- [LLVM 23.1.3 release](https://github.com/llvm/llvm-project/releases/tag/llvmorg-23.1.3)
- [GDB 18.1 release announcement, 2026-09-25](https://sourceware.org/pipermail/gdb-announce/2026/000150.html)
- [GDB manual: Process Record and Replay](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Process-Record-and-Replay.html)
- [GDB manual: Debugging Optimized Code](https://sourceware.org/gdb/current/onlinedocs/gdb.html/Optimized-Code.html)
- [GDB wiki: Permissions on Darwin, code signing a debugger](https://sourceware.org/gdb/wiki/PermissionsDarwin)
- [gdb-patches: Initial AArch64-Darwin support series, October 2025](https://sourceware.org/pipermail/gdb-patches/2025-October/222196.html)
- [Homebrew gdb formula pull request adding arm64 bottles](https://github.com/Homebrew/homebrew-core/pull/209753)
- [ptrace(2), Linux manual page](https://man7.org/linux/man-pages/man2/ptrace.2.html)
- [lldb debugserver MachTask.mm: task_for_pid and task_set_exception_ports](https://github.com/llvm/llvm-project/blob/main/lldb/tools/debugserver/source/MacOSX/MachTask.mm)
- [Intel SDM Volume 2: INT n, INTO, INT3, INT1](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Intel SDM Volume 3: debug registers DR0 to DR7 (Debug, Branch Profile, TSC, and Resource Monitoring Features)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm A64 ISA: BRK, Breakpoint instruction](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/BRK--Breakpoint-instruction-)
- [Arm A64 ISA: TBZ, Test bit and branch if zero](https://developer.arm.com/documentation/ddi0602/latest/Base-Instructions/TBZ--Test-bit-and-branch-if-zero-)
- [Arm Architecture Reference Manual, D2.9 Watchpoint exceptions](https://developer.arm.com/documentation/ddi0487/latest/)
- [Apple ld(1): -adhoc_codesign](https://keith.github.io/xcode-man-pages/ld.1.html)
- [Apple ld64 LinkEdit.hpp: CS_LINKER_SIGNED](https://github.com/apple-oss-distributions/ld64/blob/59a99ab60399c5e6c49e6945a9e1049c42b71135/src/ld/LinkEdit.hpp)
- [Apple: Debugging Tool Entitlement, com.apple.security.cs.debugger](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.debugger)
- [Apple: Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime)
- [Apple: Resolving common notarization issues, the get-task-allow entitlement](https://developer.apple.com/documentation/security/resolving-common-notarization-issues)
- [Apple: Disabling and Enabling System Integrity Protection](https://developer.apple.com/documentation/security/disabling-and-enabling-system-integrity-protection)
- [Apple Developer Forums: debugserver may not get the taskport of a hardened process](https://developer.apple.com/forums/thread/127544)
- [Apple DevToolsSecurity(8)](https://keith.github.io/xcode-man-pages/DevToolsSecurity.8.html)
- [Apple core(5)](https://keith.github.io/xcode-man-pages/core.5.html)
- [Apple Technical Note TN2124: Mac OS X Debugging Magic, core dumps](https://developer.apple.com/library/archive/technotes/tn2124/_index.html)
- [lldb `process save-core` help text](https://github.com/llvm/llvm-project/pull/143126)
- [core(5), Linux manual page](https://man7.org/linux/man-pages/man5/core.5.html)
- [coredumpctl(1)](https://man7.org/linux/man-pages/man1/coredumpctl.1.html)
- [Apple dtrace(1)](https://keith.github.io/xcode-man-pages/dtrace.1.html)
- [Apple dtruss(1m)](https://keith.github.io/xcode-man-pages/dtruss.1m.html)
- [strace releases](https://github.com/strace/strace/releases)
- [ltrace](https://ltrace.org/)
- [bpftrace CHANGELOG](https://github.com/bpftrace/bpftrace/blob/master/CHANGELOG.md)
- [rr project](https://rr-project.org/)
- [rr 5.9.0 release](https://github.com/rr-debugger/rr/releases/tag/5.9.0)
- [rr wiki: Building And Installing, hardware and VM requirements](https://github.com/rr-debugger/rr/wiki/Building-And-Installing)
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [ISO/IEC 9899:2024 working draft N3220, clause 3.5 undefined behavior](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf)
- [DWARF Debugging Information Format Version 5](https://dwarfstd.org/doc/DWARF5.pdf)
- [Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)](https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement](https://gitlab.com/x86-psABIs/x86-64-ABI)
