# Rebuild and Prove Equal: Differential Tests, Byte Comparison, and the Evidence Loop

> Qua các bài kiểm tra của bạn chứng minh sự đồng nhất trên các bài kiểm tra của bạn, nên tính bằng nhau cần một lưới chạm mọi biên và các byte khớp sau khi che relocation.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 34 (lifting to pseudocode), Phase 13 · 35 (evidence, confidence, and unknowns)
**Time:** ~110 minutes

## Learning Objectives

- Viết một bản dựng lại từ danh sách chỉ lệnh và nêu tên bản ghi bằng chứng mà nó đến từ đó.
- Xây dựng một lưới đầu vào với một lớp mỗi nguy cơ: điều kiện bảo vệ bằng không, giá trị âm, phép chia cắt, tràn 32 bit và một bẫy phép chia.
- Chạy bản gốc và bản dựng lại trong một chương trình và ghi mọi ô, bao gồm một bẫy.
- Biên dịch lại bản dựng lại với các cờ gốc và so sánh các byte hàm sau khi che các trường relocation.
- Đọc các hằng số mà một relocation trỏ tới và so sánh chúng, để một literal sai không thể qua.
- Điều khiển MCP server của rea từ một client stdio nhỏ và ghi mỗi bước với id bằng chứng của nó.
- Tạo một bản ghi bằng chứng fail-closed có id là một hash trên các khẳng định và liên kết bằng chứng của nó.

## The Problem

Bạn yêu cầu rea cung cấp hồ sơ hàm của `percent_change` trong fixture `ledger-x86_64-O1.o` của chúng ta. Ghidra 12.1.4 trả về mã giả, và agent viết C này từ nó:

```c
int percent_change(int before, int after) {
    if (before == 0) return 0;
    return (int)(((long)after - before) * 100 / before);
}
```

Bốn bài kiểm tra qua: `(100, 150)` cho 50, `(200, 100)` cho -50, `(0, 5)` cho 0, `(50, 100)` cho 100. Agent cũng dựng lại `grade` thành bốn câu lệnh `if` trên 90, 80, 70 và 60. Thêm sáu bài kiểm tra qua. Báo cáo nói "đã xác minh".

Báo cáo đó không trả lời câu hỏi nào trong số này:

- Bản gốc trả về gì khi `(after - before) * 100` không vừa trong 32 bit?
- Bản gốc trả về gì cho điểm 110?
- Bản dựng lại có biên dịch thành cùng 16 byte như bản gốc không?
- Khi hai hàm đã biên dịch chứa cùng các byte, các relocation của chúng có trỏ đến cùng các hằng số không?
- Bản dựng lại đến từ bản ghi bằng chứng nào, và agent đọc danh sách hay mã giả?
- Bằng chứng nhận trạng thái nào trên một host không có compiler C?

Mọi mục tiêu trong bài học này là một chương trình chúng tôi đã viết và biên dịch. Các quy tắc phạm vi và luật từ bài 32 áp dụng không thay đổi.

```figure
re-36-prove-equal
```

## What the Evidence Says

Vòng lặp agent trong `code/main.py` thực hiện sáu lần gọi đến rea 6.5.0 qua stdio. Lần chạy đã ghi là `code/fixtures/runs/agent-run.json`. Server trả lời `initialize` với phiên bản giao thức `2025-11-25`. Ba lần gọi trả về các bản ghi Evidence:

| Bước | Công cụ | Thời gian | Id bằng chứng |
|---|---|---|---|
| 2 | `analyze_function percent_change` | 6.31 s | `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd` |
| 3 | `analyze_function grade` | 0.02 s | `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1` |
| 4 | `read_bytes 0x1000b4, 20` | 0.00 s | `ev_c26146cfedf4c1ee146d8ff00cfa9a5d3f5335bdd9c97ccf4e1af5f6ea3ed6bc` |

Lần gọi đầu trả chi phí cho import Ghidra và phân tích tự động. Mỗi bản ghi mang `confidence: "observed"`, `authority: "shipped-artifact"` và SHA-256 của object, `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`. Ghidra tải object có thể tái định vị với `.text` tại `0x100000`, nên `percent_change` nằm tại `0x100000` và `grade` tại `0x100010`.

Mã giả cho `percent_change` là nơi `long` đến từ:

```c
undefined1  [16] percent_change(int param_1,int param_2,ulong param_3)
{
  long lVar1;
  undefined1 auVar3 [16];
  if (param_1 != 0) {
    lVar1 = (long)((param_2 - param_1) * 100);
    auVar3._0_8_ = lVar1 / (long)param_1 & 0xffffffff;
    auVar3._8_8_ = lVar1 % (long)param_1 & 0xffffffff;
    return auVar3;
  }
  ...
}
```

Decompiler thấy `cltd` và `idivl` ghi cả `edx` và `eax` và mô hình hóa một giá trị trả về 16 byte với một phép chia 64 bit. Danh sách trong cùng bản ghi nói điều đơn giản hơn:

```
0x100000: TEST EDI, EDI
0x100002: JZ 0x0010000d
0x100004: SUB ESI, EDI
0x100006: IMUL EAX, ESI, 0x64
0x100009: CDQ
0x10000a: IDIV EDI
0x10000c: RET
0x10000d: XOR EAX, EAX
0x10000f: RET
```

Mọi phép toán rộng 32 bit. `IMUL EAX, ESI, 0x64` nhân trong 32 bit và giữ nửa thấp. `CDQ` mở rộng dấu `eax` vào `edx`, và `IDIV EDI` chia cặp 64 bit cho một số chia 32 bit. Một bản dựng lại theo danh sách là `100 * (after - before) / before` trong `int`.

Bản ghi `grade` có cùng dạng. Mã giả nêu tên một bảng, `*(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4)`, và một biểu thức mặc định không thể đọc được xây từ `0x66666667`. Danh sách cho thấy phép chia cho 10 là `IMUL RAX, RAX, 0x66666667`, `SAR RCX, 0x22`, `SHR RAX, 0x3f`, `ADD ECX, EAX`. Rồi `ADD ECX, -0x6`, `CMP ECX, 0x4` và `JA` giữ hàng chục từ 6 đến 10. `XOR EAX, EAX` trước phép so sánh là mặc định 0. `LEA RCX, [0x1000b4]` và `MOV EAX, dword ptr [RCX + RAX*0x4]` đọc một bảng năm mục 4 byte.

Bước 4 đọc 20 byte đó: `01000000 02000000 03000000 04000000 04000000`. Bảng là `1, 2, 3, 4, 4` cho hàng chục 6, 7, 8, 9, 10. Đó là `switch` trong `ledger.c`, với `case 10` và `case 9` chia sẻ giá trị 4.

Cả hai bằng chứng trong các trang bằng chứng của chính rea bắt đầu từ danh sách và từ `read_bytes` của các hằng số. Mã giả DX-Ball đầu tiên là `FUN_00406400(void)` không có đầu vào stack, và góc nhìn chỉ lệnh sửa nó. Đọc danh sách trước. Trích id bản ghi, rồi viết C.

## Write the Candidates

Thư mục `code/fixtures/candidates/` chứa tám bản dựng lại, một hàm mỗi tệp. Bốn bản theo danh sách hoặc biên dịch thành cùng mã. Bốn bản có vẻ hợp lý và sai, hoặc sai theo cách một bài kiểm tra viết tay tìm thấy.

| Tệp | Nguồn | Nó làm gì |
|---|---|---|
| `percent_change_mul_first.c` | `100 * (after - before) / before` | danh sách trong C |
| `percent_change_split.c` | `(after * 100 - before * 100) / before` | văn bản khác, cùng các byte sau khi clang gộp nó |
| `percent_change_wide.c` | `(int)(((long)after - before) * 100 / before)` | `long` của mã giả, chia trước khi nó wrap |
| `percent_change_div_first.c` | `(after - before) / before * 100` | chia trước, nên làm tròn khác |
| `grade_switch.c` | `switch (score / 10)` với năm case | nguồn gốc |
| `grade_table.c` | `unsigned slot = score / 10 - 6; slot < 5 ? points[slot] : 0` | danh sách trong C |
| `grade_thresholds.c` | `if (score >= 90) return 4; ...` | không có cận trên trên dải cao nhất |
| `grade_case10_wrong.c` | `case 10: return 3;` | một mục bảng sai |

Mỗi tệp biên dịch với lệnh fixture, `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`. Các object đã biên dịch được commit cạnh các nguồn để các bài kiểm tra chạy trên một host không có clang.

## Leg One: Execute and Compare

Định nghĩa differential testing năm 1998 của McKeeman cần "hai hoặc nhiều hệ thống có thể so sánh" được đưa vào "các trường hợp kiểm tra được tạo cơ học", và coi một kết quả khác, treo hoặc crash là một ứng viên lỗi. Ông nêu tên phần khó: "Vấn đề xấu xí nhất trong kiểm thử là đánh giá kết quả của một bài kiểm tra." Hàm gốc là oracle ở đây. Chúng ta không cần biết câu trả lời đúng. Chúng ta cần bản gốc và bản dựng lại không bất đồng ở đâu trên một lưới chạm mọi nguy cơ.

### Design the grid

`input_grid()` trong `code/main.py` xây dựng 92 ô. Với `percent_change`, nó lấy mọi cặp từ mười giá trị `before` và bảy giá trị `after`:

```
before: 0, 1, -1, 3, -3, 7, 100, -100, 2147483647, -2147483648
after:  0, 5, -5, 105, 536870911, 2147483647, -2147483648
```

Với `grade`, nó lấy 22 điểm: cả hai phía của mỗi cạnh dải, các số âm, 0, 110 và hai giới hạn `int`. `classify()` gắn nhãn mỗi ô. Overflow có 32 ô, negative 17, boundary 14, plain 12 và zero guard 7. Negative truncation có 5, rounding 2, beyond the switch 2 và trap 1.

Mỗi lớp tồn tại vì một lý do. Các ô zero guard kiểm tra nhánh `TEST EDI, EDI`. Các ô âm kiểm tra phép chia cắt: C và `idiv` làm tròn về không, nên `-9 / 10` là 0 và `-10 / 10` là -1. Các ô làm tròn kiểm tra rằng phép nhân xảy ra trước phép chia, nên `(105 - 100) * 100 / 100` là 5 chứ không phải 0. Các ô tràn làm `(after - before) * 100` vượt 32 bit. Một ô trap làm tích đã wrap bằng `INT_MIN` với `before` bằng -1.

Yang, Chen, Eide và Regehr xây dựng Csmith để tạo các chương trình không có hành vi không xác định. Một bất đồng oracle trên hành vi không xác định là nhiễu và không bao giờ là một báo cáo lỗi. Tràn có dấu là không xác định trong C. Oracle của chúng ta là một object đã biên dịch với một hành vi cố định, nên các ô tràn thuộc phạm vi. Bài học là biết các ô nào dựa vào chuẩn và các ô nào dựa vào các byte đã biên dịch.

### The driver and the trap

`code/driver.c` đọc một ô mỗi dòng từ stdin và in các đầu vào, kết quả gốc và kết quả bản dựng lại. `build_harness()` biên dịch ứng viên với `-Dpercent_change=cand_percent_change -Dgrade=cand_grade`, để cả hai phiên bản liên kết vào một chương trình dưới các tên khác nhau. Trên một host Linux x86-64, bản gốc là chính object fixture. Trên mọi host khác, nó là `ledger.c` được biên dịch native, và báo cáo ghi `original_kind: fixture-source`.

Driver cài một handler `SIGFPE` với `sigsetjmp` và `siglongjmp`. Với `before = -1` và `after = 536870911`, hiệu là 536870912 và tích 32 bit wrap thành -2147483648. Trên x86-64, `idiv` với số bị chia đó và số chia -1 phát sinh ngoại lệ lỗi chia. Thương không vừa trong 32 bit (Intel SDM Tập 2, IDIV). Handler biến điều đó thành giá trị được ghi `trap`.

Trên AArch64, `sdiv` không có trap và trả về -2147483648 cho cùng các toán hạng. Lần chạy của chúng tôi trên một máy Mac arm64 ghi chính xác điều đó. Oracle phụ thuộc kiến trúc, và báo cáo nói kiến trúc nào đã chạy.

### Results

`prove_behaviour(PLAUSIBLE)` xây dựng bản dựng lại `long` và bản dựng lại ngưỡng. Mười trường hợp ngây thơ qua. Lưới thất bại trên 28 ô:

| Hàm | Đầu vào | Lớp | Bản gốc | Bản dựng lại |
|---|---|---|---|---|
| `percent_change` | 3, 2147483647 | overflow | -133 | -1431655899 |
| `percent_change` | 100, 2147483647 | overflow | -101 | 2147483547 |
| `percent_change` | 2147483647, 5 | overflow | 0 | -99 |
| `grade` | 110 | vượt switch | 0 | 4 |
| `grade` | 2147483647 | vượt switch | 0 | 4 |

Cả 26 thất bại `percent_change` là các ô tràn với `|before| > 1`. Với `before` bằng 1 hoặc -1, thương 64 bit cắt trở lại giá trị đã wrap, nên các ô đó đồng nhất do tình cờ. `grade` ngưỡng thất bại vì switch gốc không có case cho hàng chục 11 trở lên, và `110 / 10` là 11.

`prove_behaviour(EQUAL)` dựng `percent_change_mul_first.c` và `grade_switch.c`. Cả 92 ô đồng nhất. `percent_change_div_first.c` thất bại hai trong bốn trường hợp ngây thơ, chính là một trường hợp mà một bài kiểm tra viết tay tìm thấy.

`oracle_disagreements()` kiểm tra một điều thứ hai. `percent_change_model()` và `grade_model()` là các mô hình Python của danh sách, với `wrap32()` cho phép nhân 32 bit và `idiv32()` cho quy tắc kiến trúc. Báo cáo so sánh mô hình với bản gốc được quan sát trên mỗi ô. Không bất đồng nghĩa là mô hình và binary đồng nhất trên mỗi ô. Mô hình là bằng chứng derived và lần chạy là bằng chứng observed. Báo cáo giữ chúng trong các trường riêng.

## Leg Two: Recompile and Compare

Hành vi trên một lưới là một chân. Chân thứ hai hỏi liệu bản dựng lại, được biên dịch với cùng compiler và cờ, có tạo cùng các byte hay không. Dự án DX-Ball báo cáo "63 byte khớp" cho hàm hỗ trợ của nó. Dự án TH04 báo cáo một kết quả khớp 2,139 byte. Mỗi dự án sử dụng compiler của thời kỳ riêng của nó. Bản thân rea không thể làm điều này. `compare_functions` của nó diff từng dòng văn bản provider và đính kèm giới hạn "Assembly là văn bản provider mờ đục; chuẩn hóa relocation không có sẵn."

### Read the object

`ElfObject` trong `code/main.py` đọc một object có thể tái định vị ELF64 bằng `struct.unpack_from`. Nó kiểm tra magic, class 64 bit, dữ liệu little-endian, `e_machine` 62 và `e_type` 1. Rồi nó duyệt các section header, bảng chuỗi, `.symtab` và mọi section `.rela`. Trong fixture, `percent_change` bắt đầu tại offset `.text` 0 với kích thước 16 và `grade` tại `0x10` với kích thước 46. `total` bắt đầu tại `0x40` với kích thước 31 và `grade_label` tại `0x60` với kích thước 63.

16 byte của `percent_change` là `85 ff 74 09 29 fe 6b c6 64 99 f7 ff c3 31 c0 c3`. Hàm không có relocation. `grade` có một: offset `0x26` bên trong hàm, type `R_X86_64_PC32`, symbol `.rodata`, addend `0x10`. Nó thuộc về `leaq` 7 byte tại offset `0x23`, có bốn byte cuối là trường displacement.

### Mask, then compare the records

Trong một object RELA, addend nằm trong bản ghi relocation, và bốn byte trường bằng không. Ứng viên `grade_switch.o` cũng chứa không ở đó. Một phép so sánh byte thông thường qua trong khi hai relocation nêu tên các chỗ khác nhau. `mask_relocations()` vẫn đặt trường về không ở cả hai bên, để cùng phương pháp đúng cho các object REL và cho Mach-O, nơi trường mang addend.

Rồi `prove_bytes()` so sánh các bản ghi relocation theo offset, type và section đích. Bản gốc nói `.rodata+0x10` và ứng viên nói `.rodata-0x4`. Addend khác vì object ứng viên không có bảng `labels.rel` phía trước bảng switch của nó. Một addend khác là một offset khác, không phải một hàm khác.

### Read the constants the relocation points at

Với một trường tương đối theo PC kết thúc chỉ lệnh của nó, CPU cộng địa chỉ chỉ lệnh tiếp theo, nên đích là symbol cộng addend cộng 4. Trong bản gốc đó là `.rodata+0x14`, và trong ứng viên là `.rodata+0x0`. `read_table()` đọc năm mục 4 byte ở đó. Cả hai chứa `1, 2, 3, 4, 4`.

Số đếm năm đến từ danh sách: `CMP ECX, 0x4` với `JA` chấp nhận các chỉ số 0 đến 4, và `[RCX + RAX*0x4]` đọc 4 byte mỗi chỉ số. `CLAIMS` trong `code/main.py` ghi dạng đó cho `grade` và ghi không relocation cho `percent_change`.

Bước này tồn tại vì một lỗi mà dự án TH08 ghi nhận. Phép so sánh cũ của nó "phát lại địa chỉ đích vào trường relocation của chỉ lệnh, rồi so sánh các byte chỉ lệnh mà không kiểm tra dữ liệu literal dấu phẩy động tại địa chỉ đó. Nguồn `0.0` do đó có thể trông chính xác đối với đích `128.0`." Bản sửa kiểm toán 1,548 tham chiếu literal dấu phẩy động và sửa thêm mười hai. `grade_case10_wrong.c` là phiên bản của chúng ta của lỗi đó. 46 byte mã của nó bằng bản gốc, bản ghi relocation của nó có cùng dạng và bảng của nó là `1, 2, 3, 4, 3`. Chỉ kiểm tra hằng số làm nó thất bại.

### Results

| Ứng viên | Kích thước | Byte đã che | Bản ghi relocation | Bảng | Trạng thái |
|---|---|---|---|---|---|
| `percent_change_mul_first` | 16 so với 16 | bằng nhau | không có | không có | qua |
| `percent_change_split` | 16 so với 16 | bằng nhau | không có | không có | qua |
| `percent_change_wide` | 16 so với 26 | kích thước khác | không có | không có | thất bại |
| `percent_change_div_first` | 16 so với 18 | kích thước khác | không có | không có | thất bại |
| `grade_switch` | 46 so với 46 | bằng nhau | cùng dạng | cả hai `1,2,3,4,4` | qua |
| `grade_table` | 46 so với 46 | bằng nhau | cùng dạng | cả hai `1,2,3,4,4` | qua |
| `grade_thresholds` | 46 so với 39 | kích thước khác | 1 so với 0 | không có | thất bại |
| `grade_case10_wrong` | 46 so với 46 | bằng nhau | cùng dạng | `1,2,3,4,4` so với `1,2,3,4,3` | thất bại |

Hai kết quả đáng xem lại. `percent_change_split.c` có văn bản nguồn khác và các byte giống hệt, vì clang coi tràn có dấu là không xác định và gộp `after * 100 - before * 100` thành một phép nhân. `grade_table.c` cũng khớp từng byte, nên compiler đạt cùng bảng từ một chỉ số mảng và từ một `switch`. Một kết quả khớp byte chứng minh rằng compiler này, với các cờ này, tạo cùng mã từ ứng viên. Nó không chứng minh ứng viên là văn bản nguồn gốc.

Kích thước là một chẩn đoán chứ không phải một nghiệm thu. Các trang bằng chứng của rea ghi một ứng viên 1,825 byte có độ dài đúng và 467 byte khác nhau. Bản dựng lại `wide` là 26 byte vì `movslq`, `imulq`, `cqto` và `idivq` thay thế các dạng 32 bit. Danh sách đã nói cho chúng ta chiều rộng trước mọi lần biên dịch.

## The Agent Loop Over rea

Sáu mươi lăm công cụ MCP của rea không có lệnh CLI, và `verify_reconstruction` là một trong số đó. `McpStdioClient` trong `code/main.py` là client nhỏ nhất tới được chúng. Nó khởi động `npx -y rea-agents@6.5.0 mcp`, ghi một yêu cầu JSON-RPC mỗi dòng vào stdin và đọc một đối tượng JSON mỗi dòng từ stdout trên một luồng. Nó gửi `initialize` với phiên bản giao thức `2025-11-25`, rồi `notifications/initialized`, rồi `tools/call`. Thời hạn mặc định mỗi lần gọi là 330 s, cùng con số mà rea cho phép cho một cold start Ghidra.

`agent_loop()` thực hiện sáu lần gọi và ghi mỗi lần:

```json
{
  "step": 2,
  "tool": "analyze_function",
  "arguments": {"procedure": "percent_change"},
  "seconds": 6.31,
  "is_error": false,
  "evidence_id": "ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd",
  "confidence": "observed",
  "authority": "shipped-artifact",
  "limitations": ["Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals.", "..."],
  "result_sha256": "..."
}
```

Các bản ghi Evidence đầy đủ được lưu dưới các id của chúng trong cùng tệp. Mã giả và danh sách mà bản dựng lại đến từ đó là một phần của fixture. `table_address()` tìm toán hạng `LEA` trong danh sách `grade` và đưa nó vào `read_bytes`. `open_binary`, `get_evidence_bundle` và `close_binary` không trả về bản ghi Evidence và được ghi với một id null.

`run_agent(live=True)` điều khiển rea khi `npx` nằm trên path và `GHIDRA_INSTALL_DIR` nêu tên một thư mục. Nếu không, nó phát lại fixture và nói vậy trên stderr. Các bài kiểm tra đi thêm một bước. `code/tests/fake_rea_server.py` là một server thay thế trả lời mỗi `tools/call` bằng bản ghi đã ghi cho cùng công cụ và đối số. Client và vòng lặp chạy đối chiếu nó trên mỗi lần chạy kiểm tra, không cài rea, Ghidra hoặc Java.

### What rea's verifier can and cannot say

`verify_reconstruction` của rea nhận các khẳng định trỏ đến Evidence so sánh và trả về pass, fail hoặc unknown theo khẳng định. Giới hạn cố định của nó đọc là "Pass nghĩa là mọi khẳng định được khai báo đã qua; nó không xác lập tính tương đương triển khai toàn cục." Một khẳng định về một hàm so sánh văn bản provider từ `compare_functions`. Một khẳng định hành vi so sánh hai bản thu tiến trình đã ghi từ `compare_process_captures`. Khi một bản ghi nguồn có độ bao phủ gọi không đầy đủ, một khẳng định về các lần gọi là `unknown`. Không có gì bên trong rea biên dịch một hàm dựng lại hoặc chạy nó trên lưới đầu vào của bạn. Hai chân trong bài học này là phần rea để cho bạn.

Sổ nghĩa vụ của rea kỳ vọng một bản ghi bằng chứng với `predicate_type: "rea.reconstruction-proof"`, `operation: "verify_reconstruction_obligations"`, `confidence: "observed"` và `normalized_result.passed === true`. Không công cụ rea công khai nào phát ra một bản ghi như vậy. `build_proof()` trong `code/main.py` tạo nó:

```json
{
  "predicate_type": "rea.reconstruction-proof",
  "operation": "verify_reconstruction_obligations",
  "confidence": "observed",
  "authority": "controlled-replay",
  "normalized_result": {
    "passed": true,
    "status": "pass",
    "claims": [
      {"claim_id": "percent_change.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.behaviour", "kind": "behavioral", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "percent_change.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_e88b10dc..."]},
      {"claim_id": "grade.bytes", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]},
      {"claim_id": "grade.referenced-constants", "kind": "structural-function", "status": "pass", "evidence_ids": ["ev_67b6d3f9..."]}
    ]
  },
  "evidence_links": ["ev_e88b10dc...", "ev_67b6d3f9..."],
  "evidence_id": "ev_..."
}
```

Id là `ev_` cộng SHA-256 của bản ghi không có id, trên JSON gọn với khóa được sắp xếp. `aggregate()` là fail-closed: `fail` thắng, rồi `unknown`, và một danh sách khẳng định rỗng là `unknown`. Trên một host không có compiler C, hai khẳng định hành vi là `unknown`, nên bản ghi nói `unknown` ngay cả khi cả hai khẳng định byte qua. `authority` là `controlled-replay`, vì bằng chứng đến từ harness của riêng chúng ta chứ không chỉ từ tệp object.

## What the Research Says

Liu, Raff và Micinski đo tám hệ thống decompilation trong chín cấu hình năm 2026. Các ứng viên qua mọi bài kiểm tra mà benchmark bao gồm vẫn phân kỳ trên các đầu vào fuzz. Tỷ lệ là 4.9 phần trăm tổng thể và tới 13 phần trăm cho một hệ thống. Trên 300 hàm thư viện GitHub và 287 hàm có căn cứ CVE, mô hình tinh chỉnh mạnh nhất nâng tỷ lệ build của Ghidra từ 75 phần trăm lên 90 phần trăm. Trên cùng các hàm, tỷ lệ khớp hành vi giảm từ 74 phần trăm xuống 62 phần trăm. Họ truy nguyên nhân đến các trường, kiểu, callee và điều kiện bảo vệ được bịa thay thế các điều chưa biết nhìn thấy được mà một decompiler truyền thống để lại.

`percent_change_wide.c` của chúng ta là một trong những kiểu được bịa đó. Mã giả cung cấp một `long`, bản dựng lại giữ nó và kết quả biên dịch, qua mười bài kiểm tra và thất bại 26 ô tràn. Bản dựng lại ngưỡng grade là một điều kiện bảo vệ được bịa. Cả hai sẽ được tính là có thể thực thi lại theo chỉ số LLM4Decompile, biên dịch lại đầu ra và chạy các assertion của benchmark. Pseudo-C của chính Ghidra qua 20.12 phần trăm các assertion đó trên HumanEval-Decompile.

DecompileBench đo 23,400 hàm từ 130 chương trình thực. Nó thấy các phương pháp LLM thấp hơn 52.2 phần trăm về tính đúng chức năng so với các decompiler công nghiệp, với điểm dễ hiểu cao hơn.

Ba bằng chứng mà lĩnh vực sử dụng là ba chân bạn có thể xây dựng. Phoenix và DREAM biên dịch lại đầu ra và chạy các bài kiểm tra của chương trình gốc. McKeeman và Csmith chạy các đầu vào được tạo đối chiếu bản gốc với các đầu vào được giữ trong hành vi được định nghĩa. Ramos và Engler kiểm tra hai hàm C bằng thực thi ký hiệu có giới hạn, chứng minh tính bằng nhau trên mọi đường được khám phá tới một kích thước đầu vào. Bài học này xây dựng hai chân đầu. Chân thứ ba là bài thực hành trong sổ bằng chứng của bài 35 khi một lưới quá nhỏ để tin.

## Build It

Chạy harness dùng thư viện chuẩn:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
```

Với clang trên path, demo biên dịch cả hai cặp ứng viên và chạy 92 ô cho mỗi cặp. Nó biên dịch lại tám ứng viên, phát lại lần chạy agent và tạo bản ghi bằng chứng. Không có clang, nó đọc các object đã commit và báo cáo các khẳng định hành vi là `unknown`.

Dạng kỳ vọng trên một máy Mac arm64:

```json
{
  "host": "aarch64 Darwin",
  "originalKind": "fixture-source",
  "gridCells": 92,
  "plausible": {"naivePassed": true, "gridMismatches": 28, "oracleDisagreements": 0},
  "equal": {"naivePassed": true, "gridMismatches": 0, "oracleDisagreements": 0},
  "legTwo": {
    "percent_change_mul_first": {"status": "pass", "reasons": []},
    "percent_change_wide": {"status": "fail", "reasons": ["size 16 vs 26 bytes"]},
    "grade_case10_wrong": {"status": "fail", "reasons": ["referenced constants differ: [1, 2, 3, 4, 4] vs [1, 2, 3, 4, 3]"]}
  },
  "agentRun": {"mode": "replayed fixture", "server": {"name": "rea", "version": "6.5.0", "protocolVersion": "2025-11-25"}},
  "proof": {"status": "pass", "evidence_id": "ev_..."}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `wrap32()`, `c_div()`, `idiv32()` và hai hàm `*_model()` chứa ngữ nghĩa số nguyên của danh sách.
2. `input_grid()` và `classify()` xây dựng và gắn nhãn 92 ô.
3. `build_harness()` và `execute()` biên dịch một chương trình từ bản gốc, các ứng viên được đổi tên và `driver.c`, rồi chạy các ô.
4. `prove_behaviour()` trả về báo cáo chân một với các lần không khớp và bất đồng mô hình.
5. `ElfObject` đọc header, symbol và các bản ghi `.rela`. `mask_relocations()` và `read_table()` chuẩn bị phép so sánh.
6. `prove_bytes()` trả về báo cáo chân hai với kích thước, phạm vi đã che, dạng relocation và bảng.
7. `McpStdioClient` và `agent_loop()` điều khiển rea và ghi mỗi bước.
8. `build_proof()` và `aggregate()` tạo bản ghi fail-closed.

## Use It

Để chứng minh một hàm mới bằng nhau, lặp lại các bước này:

1. Tìm nạp `analyze_function` cho hàm và ghi id bằng chứng. Đọc danh sách trước mã giả.
2. Viết ứng viên từ các chiều rộng phép toán của danh sách. Giữ tên hàm của bản gốc.
3. Liệt kê mọi phép nhân, cộng, trừ và chia trong danh sách. Thêm các đầu vào lưới làm mỗi phép wrap ở chiều rộng của nó.
4. Thêm cả hai phía của mọi hằng số so sánh trong danh sách. Với `grade`, đó là 6 và 4 sau phép trừ.
5. Thêm mọi số chia có thể trap trên mục tiêu, và ghi kiến trúc nào chạy lưới.
6. Chạy cả hai chân và đọc các lý do trước trạng thái.
7. Giữ bản ghi bằng chứng cạnh ứng viên. `evidence_links` của nó nói cho người đọc các bản ghi nào mà khẳng định dựa vào.

Chạy lại cả hai chân sau mọi cập nhật compiler. Một kết quả khớp byte là một phát biểu về một compiler với một tập cờ.

## Interactive Lab

### Lab A: the model and the run

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal/code
python3 -q
```

Chạy:

```python
from main import *
percent_change_model(3, INT_MAX)
percent_change_model(-1, 536870911, "x86_64")
percent_change_model(-1, 536870911, "aarch64")
report = prove_behaviour(PLAUSIBLE)
report.naive_passed, len(report.mismatches), report.mismatches[0]
```

Lần gọi đầu cho -133, tích đã wrap chia cho 3. Lần thứ hai cho `'trap'` và lần thứ ba cho -2147483648. Báo cáo cho thấy mười trường hợp ngây thơ qua và 28 ô lưới thất bại. So sánh `report.oracle_disagreements` với một danh sách rỗng.

### Lab B: read the object

```python
obj = ElfObject(ORIGINAL_OBJECT)
grade = obj.function("grade")
grade.size, grade.data[0x26:0x2a].hex(), grade.relocations
read_table(obj, grade.relocations[0], 5, 4)
```

Các byte trường là `00000000`. Relocation nêu tên `.rodata` với addend `0x10`, và bảng đọc ra `[1, 2, 3, 4, 4]`.

### Lab C: break one constant

```python
report = prove_bytes("grade", CANDIDATES / "grade_case10_wrong.o")
report.masked_equal, report.relocations_match, report.tables_equal, report.reasons()
```

Các byte khớp, các bản ghi khớp và các bảng không khớp. Giờ chỉnh sửa `grade_case10_wrong.c` để `case 10` lại trả về 4, biên dịch lại nó bằng lệnh fixture và theo dõi trạng thái đổi thành `pass`.

### Lab D: drive rea

Với rea 6.5.0 và Ghidra 12.1.4 được cài:

```bash
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec \
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
python3 code/main.py --live
```

`analyze_function` đầu tiên mất vài giây trong khi Ghidra import object. So sánh các id bằng chứng mới với lần chạy đã commit. Cùng các byte dưới cùng analysis profile cho cùng các id, vì id là một hash nội dung loại trừ đường dẫn tệp.

## Practice Lab

Mở rộng cả hai chân sang `total` và `grade_label` từ cùng object.

Yêu cầu:

- Với `total`, đầu vào là một mảng và một số đếm. Xây dựng các ô với số đếm 0, một số đếm âm, một phần tử và các tổng wrap ở 32 bit.
- Với `grade_label`, hàm gọi `grade` inline và đọc `labels.rel`, một bảng năm offset chuỗi tương đối với các relocation riêng trong `.rela.rodata`.
- Thêm một mục `CLAIMS` cho `grade_label` với hai relocation và một bảng năm mục 4 byte, và so sánh các chuỗi mà các mục trỏ tới.
- Ghi các ô nào mà mô hình và lần chạy bất đồng, nếu có, và giải thích mỗi ô từ danh sách.
- Thêm một khẳng định mỗi chân mỗi hàm vào bản ghi bằng chứng và giữ tổng hợp fail-closed.

Thành công nghĩa là bản ghi bằng chứng liệt kê bốn hàm, mọi khẳng định mang một id bằng chứng và `grade_label` thất bại khi một chuỗi nhãn khác.

## Graded Lab

Năm câu hỏi về các fixture của bài học này. Tìm mỗi câu trả lời bằng mã bạn đã xây dựng, rồi ghi nó vào `code/lab_answers.json`. Viết số dưới dạng số hoặc chuỗi hex chẳng hạn `"0x40"`, và danh sách dưới dạng danh sách JSON.

1. `t1`: percent_change_model(3, 105) trên x86_64.
2. `t2`: percent_change_model(0, 5) trên x86_64.
3. `t3`: grade_model(100).
4. `t4`: số ô trong input_grid().
5. `t5`: số ô lưới mà mô hình x86_64 trap.

Kiểm tra các câu trả lời của bạn:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/lab.py
```

Bộ kiểm tra tính mỗi giá trị kỳ vọng từ `code/main.py` trên các fixture đã commit. Nó in `PASS`, `FAIL` hoặc `TODO` cho mỗi tác vụ và một điểm số, và nó chỉ thoát 0 khi cả năm qua. `python3 code/lab.py my-answers.json` kiểm tra một tệp khác. `code/tests/test_lab.py` chứng minh rằng bộ kiểm tra chấp nhận các câu trả lời đúng và từ chối một câu sai.

### See it run

Máy [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler) kết thúc bằng mã giả và xếp nó là inferred: trang không chứng minh nó. Bài học này là bước biến khẳng định đó thành một khẳng định được kiểm tra.

## Output Skill

Bài học này tạo ra `outputs/skill-rebuild-and-prove-equal.md`. Sử dụng nó để biến bằng chứng hàm và một bản dựng lại ứng viên thành một bằng chứng hai chân và một bản ghi bằng chứng. Skill yêu cầu danh sách trước mã giả, một lưới với mọi lớp nguy cơ, che relocation cộng một kiểm tra hằng số và một tổng hợp fail-closed.

## Verify It

Chạy demo và bộ kiểm tra:

```bash
cd phases/13-tools-and-protocols/36-rebuild-and-prove-equal
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

35 bài kiểm tra chứng minh:

- `c_div()` cắt về không và `wrap32()` theo bù hai
- mô hình cho -133 với `(3, INT_MAX)`, `trap` cho ô trap trên x86-64 và -2147483648 trên AArch64
- lưới có 92 ô và mọi lớp nguy cơ, và các trường hợp ngây thơ tránh mọi lớp khó
- trình đọc ELF tìm bốn hàm ở các offset và kích thước đã ghi
- `percent_change` là 16 byte không có relocation và `grade` có một `R_X86_64_PC32` tại `0x26`
- các byte trường relocation bằng không và việc che không thay đổi gì trong object RELA này
- cả tám ứng viên đã commit đạt trạng thái kỳ vọng, với các lý do đã ghi
- `grade_case10_wrong` qua các byte đã che và chỉ thất bại kiểm tra hằng số
- các lần chạy chân một đã ghi cho thấy mười lần qua ngây thơ, 28 lần không khớp và không bất đồng mô hình
- với một compiler, cả hai cặp dựng lại và chạy lại với cùng kết quả
- lần chạy agent nhắm đến object đã commit theo SHA-256, theo thứ tự, với các id `ev_` trên mọi bước Evidence
- bản ghi `read_bytes` bằng bảng mà trình đọc ELF tìm thấy
- client điều khiển server giả và ghi cùng các id bằng chứng như lần chạy thực
- một kết quả lỗi từ server đi vào bản ghi chạy
- `aggregate()` là fail-closed và id bằng chứng tính lại được từ nội dung của nó

## Production Failure Modes

| Lỗi | Báo cáo yếu nói gì | Harness phải chứng minh gì |
|---|---|---|
| Bản dựng lại giữ `long` của decompiler | "mười bài kiểm tra qua" | 26 ô tràn khác bản gốc |
| Các ngưỡng thay một switch | "mọi dải điểm qua" | 110 trở lên trả về 0 trong bản gốc |
| Chia trước nhân | "công thức bằng nhau về đại số" | các ô làm tròn khác, các trường hợp ngây thơ thất bại |
| Ô trap bị bỏ qua | "không crash" | x86-64 phát sinh `#DE`, AArch64 trả về `INT_MIN`, báo cáo nêu tên host |
| So sánh byte không che | "các byte bằng nhau" | các bản ghi relocation nêu tên các offset khác nhau |
| Che mà không đọc hằng số | "các byte bằng nhau sau khi che" | `1,2,3,4,3` khác `1,2,3,4,4` |
| Kích thước được coi là nghiệm thu | "cùng độ dài" | các byte khác nhau bên trong cùng độ dài |
| Compiler hoặc cờ khác | "các byte khác, bản dựng lại sai" | cùng nguồn cho các byte khác, nên phép so sánh vô hiệu |
| Mô hình được coi là quan sát | "mô hình đồng nhất" | lần chạy là observed, mô hình là derived, các bất đồng được liệt kê |
| Khẳng định không có id bằng chứng | "đã xác minh" | mọi khẳng định liên kết một bản ghi `ev_` của hàm mà nó bao phủ |
| Không compiler trên host CI | "đã qua" | các khẳng định hành vi là `unknown` và tổng hợp là `unknown` |
| Mã giả được đọc như nguồn | "decompiler nói long" | danh sách cho thấy `IMUL EAX`, `CDQ`, `IDIV EDI` |

## Operational Rule

Viết bản dựng lại từ danh sách và nêu tên bản ghi mà nó đến từ đó. Chạy nó đối chiếu bản gốc trên một lưới làm mọi giá trị trung gian wrap và vượt mọi hằng số so sánh. Biên dịch lại nó với các cờ gốc, che các trường relocation, so sánh các bản ghi và đọc các hằng số mà chúng trỏ tới. Ghi mỗi khẳng định với id bằng chứng của nó, và để một khẳng định chưa được xác minh giữ là chưa biết.

## Further Reading

- [McKeeman, Differential Testing for Software, Digital Technical Journal 10(1), 1998](https://www.cs.tufts.edu/comp/150FP/archive/bill-mckeeman/DifferentailTesting.pdf)
- [Yang, Chen, Eide, Regehr, Finding and Understanding Bugs in C Compilers, PLDI 2011](https://doi.org/10.1145/1993498.1993532)
- [Ramos, Engler, Practical, Low-Effort Equivalence Verification of Real Code, CAV 2011](https://doi.org/10.1007/978-3-642-22110-1_55)
- [Schwartz, Lee, Woo, Brumley, Native x86 Decompilation Using Semantics-Preserving Structural Analysis, USENIX Security 2013](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Liu, Raff, Micinski, When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370, 2026](https://arxiv.org/abs/2609.05370)
- [Gao et al., DecompileBench, Findings of ACL 2025](https://aclanthology.org/2025.findings-acl.1194/)
- [Tan et al., LLM4Decompile, arXiv 2403.05286, 2024](https://arxiv.org/abs/2403.05286)
- [System V gABI, Chapter 4, Relocation](https://www.sco.com/developers/gabi/latest/ch4.reloc.html)
- [x86-64 psABI repository, relocation types](https://gitlab.com/x86-psABIs/x86-64-ABI)
- [Intel 64 and IA-32 Architectures Software Developer's Manual, Volume 2, IDIV](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm Architecture Reference Manual for A-profile, DDI 0487, SDIV](https://developer.arm.com/documentation/ddi0487/latest)
- [rea 6.5.0 MCP contracts](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/mcp-contracts.md)
- [rea 6.5.0 reconstruction obligation ledgers](https://github.com/morluto/rea/blob/rea-agents-6.5.0/docs/reconstruction-obligation-ledgers.md)
