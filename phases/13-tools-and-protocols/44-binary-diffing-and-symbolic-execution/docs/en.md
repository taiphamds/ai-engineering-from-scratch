# Binary Diffing and Symbolic Execution: Matching Functions and Solving for Inputs

> Một mục khớp giữa hai hàm là một khẳng định được đưa ra bởi một chữ ký với một chất lượng, và một đầu vào được giải là một mô hình của một điều kiện đường đi; bài học này dựng cả hai và kiểm tra chúng với radiff2, Ghidra, angr, và z3.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 33 (disassembly and control flow), 34 (lifting to pseudocode), 36 (rebuild and prove equal)
**Time:** ~150 minutes

## Learning Objectives

- Dựng năm chữ ký hàm từ một tệp đối tượng và bản liệt kê của nó: các byte chính xác, các byte với các trường relocation bị che, chuỗi mnemonic, hình dạng đồ thị luồng, và tên ký hiệu.
- Chạy một bộ ghép tham lam theo giai đoạn theo phong cách BinDiff, nơi một chữ ký chỉ khớp khi nó duy nhất ở cả hai phía, và ghi lại giai đoạn cùng chất lượng đằng sau mỗi mục khớp.
- Tái tạo trường hợp hai hàm giống hệt từng byte thất bại ở một correlator byte trên các ảnh đã nạp và đạt sau khi che, với phép tính relocation giải thích bốn byte đã thay đổi.
- Tái tạo các tỷ lệ tương tự của radiff2 từ khoảng cách Levenshtein và giải thích tại sao một tỷ lệ chỉ xuất hiện khi phép so sánh dùng 82 byte mà radare2 đã đi đến.
- Liệt kê các đường đi của một hàm trên một IR nhỏ, mang một điều kiện cho mỗi đường đi, và giải mỗi lá để tìm các đầu vào bằng một phép tìm kiếm có giới hạn.
- Đo sự bùng nổ đường đi trên một vòng lặp có một cận ký hiệu và so sánh các số lượng, lớp, và mô hình với angr 10.0.3 và z3 5.1.0.

## The Problem

Bạn dựng lại `ledger.c` tại `-O2` và hỏi một agent liệu có gì thay đổi kể từ bản dựng `-O1` không. Agent chạy một bộ so sánh khác biệt và báo cáo rằng `grade` đã được sửa đổi, vì các byte của nó khác nhau trong hai chương trình đã nạp. Sau đó nó dùng hết ngân sách giải thích một thay đổi không tồn tại. 46 byte của `grade` giống hệt nhau trong hai tệp đối tượng. Bộ so sánh khác biệt đã so sánh các ảnh sau relocation, và `.rodata` nằm xa hơn 0x70 byte trong chương trình `-O2`, nên một displacement trong `grade` tăng thêm 0x70.

Cùng chiều hôm đó bạn hỏi điểm số nào khiến `grade` trả về 4. Agent đọc mã giả và trả lời "90". Đó là một câu trả lời. Hàm trả về 4 cho mọi điểm từ 90 đến 109, và câu hỏi không có cận, nên câu trả lời của agent là một mẫu trong khi bạn cần một tập hợp.

Cả hai thất bại đến từ cùng một khoảng trống. Một mục khớp và một đầu vào được giải mỗi thứ là một khẳng định có một phương pháp đằng sau. Bài học này dựng hai phương pháp bằng Python thư viện chuẩn và chạy các công cụ production bên cạnh chúng. Nơi các công cụ và mã thống nhất bạn có hai phép suy ra. Nơi chúng không thống nhất bạn có một địa chỉ, một byte, hoặc một cận để xem xét.

```figure
re-44-matches-and-paths
```

## A Function Signature Is a Claim With a Quality

Flake trình bày binary diffing vào năm 2004 là việc xây dựng một phép đẳng cấu giữa các tập hàm của hai tệp thực thi tương tự. Dullien và Rolles mở rộng nó vào năm 2005 sang các khối cơ bản và các lệnh. Trang khái niệm BinDiff mô tả chiến lược xuất phát từ công việc đó. Tính một thuộc tính cho mọi hàm ở cả hai phía. Một giá trị xuất hiện đúng một lần ở mỗi phía là một mục khớp. Một giá trị xuất hiện hơn một lần là mơ hồ và được đi sâu bằng thuộc tính tiếp theo bên trong lớp tương đương đó. Một giá trị không có đối ứng vẫn chưa được ghép. Sau mỗi lượt, các hàm gọi và được gọi của các mục khớp mới tạo thành các tập nhỏ nơi thuộc tính tiếp theo có khả năng là duy nhất, và quá trình lặp lại với thuộc tính tiếp theo.

Mỗi thuật toán ghép mang một chất lượng. Trang đánh giá ghép hash các byte hàm thô và ghép hash tên là rất tốt, chỉ số MD đồ thị luồng và ghép chữ ký số nguyên tố (mỗi mnemonic một số nguyên tố nhỏ, tích trên hàm) là tốt, các tham chiếu chuỗi là trung bình, và số vòng lặp hoặc chuỗi địa chỉ là kém. Độ tin cậy của một mục khớp là chất lượng trung bình của các thuật toán đã tạo nó, được lấy trọng số bằng một sigmoid. Độ tương tự hàm gồm khoảng 25% các cạnh đồ thị luồng được ghép, 15% các khối cơ bản được ghép, 10% các lệnh được ghép, và 50% sự khác biệt trong chỉ số MD đồ thị luồng, nhân với độ tin cậy.

Bài học này giữ năm thuộc tính đó và một quy tắc có ý nghĩa: duy nhất ở cả hai phía hoặc không khớp. Nó bỏ chỉ số MD, vì trang khái niệm nêu nó mà không có công thức, và dùng một dãy bậc thông thường thay cho nó. Các nhãn chất lượng ở lại, vì một mục khớp chỉ tốt bằng thông tin yếu nhất đã tạo ra nó.

## Five Signatures From One Function Record

Bộ so sánh khác biệt đọc hai thứ cho mỗi tệp đối tượng. ELF cho các byte, các kích thước ký hiệu, và các bản ghi `.rela.*`. Bản liệt kê `llvm-objdump -d` cho các ranh giới lệnh và mnemonic, và bài 33 đã chứng minh một bộ giải mã bằng với bản liệt kê đó trên mọi lệnh của các tệp đối tượng này. `function_record()` kiểm tra rằng các byte của mọi lệnh được liệt kê bằng các byte của tệp đối tượng tại địa chỉ đó và phát sinh ngoại lệ nếu không. Một bản liệt kê cũ là một fixture đã thay đổi.

Lấy `grade` trong `ledger-x86_64-O1.o`. Ký hiệu nói độ lệch 0x10 và kích thước 46, nên bản ghi bao quát 0x10 đến 0x3e và loại trừ `nop` hai byte căn chỉnh hàm tiếp theo.

Chữ ký byte chính xác là SHA-256 của 46 byte. Chữ ký byte được che đặt mọi trường relocation về không trước. Có một trường: bản ghi `R_X86_64_PC32 .rodata+0x10` tại độ lệch 0x36, rộng bốn byte, displacement của `leaq (%rip), %rcx` tại 0x33. Trong một tệp đối tượng RELA, bốn byte đó đã giữ số không, nên hai chữ ký thống nhất trên mọi hàm của mọi tệp đối tượng ở đây. Mask tồn tại cho mục tiếp theo.

Chữ ký mnemonic hash chuỗi 14 mnemonic:

```text
movslq imulq movq sarq shrq addl addl xorl cmpl ja movl leaq movl retq
```

Chữ ký hình dạng đồ thị luồng đến từ các khối cơ bản và các cạnh có kiểu của bài 33, giới hạn ở các khối mà điểm vào có thể tiếp cận. `grade` tại `-O1` có ba khối và ba cạnh. Khối 0x10 kết thúc bằng `ja 0x3d` với một cạnh được đi và một cạnh fallthrough, khối 0x31 đi fallthrough đến 0x3d, và 0x3d trả về. Dãy bậc liệt kê (vào, ra) cho mỗi khối theo thứ tự đã sắp xếp, nên chữ ký đọc là `3b 3e [0/2,1/1,2/0]`. Với `grade` tại `-O0` bản ghi phân giải bước nhảy gián tiếp qua năm mục `.rela.rodata` đúng như bài 33 đã làm, cho tám khối và mười một cạnh với bốn cạnh `table`.

Chữ ký tên là tên ký hiệu. Nó là thông tin mạnh nhất khi tồn tại và không là gì khi bản dựng đã strip.

Một trường nữa đi cùng cho trường hợp bản vá sau này. Khi một hàm có một relocation `lea` vào `.rodata`, một phép kiểm tra cận, và một phép nạp theo chỉ mục, `referenced_table()` đọc bảng theo cách bài 36 đã làm: `cmpl $0x4` trước `ja` cho năm mục và phép nạp `movl (%rcx,%rax,4), %eax` cho bốn byte mỗi mục. Với `grade` tại `-O1` bảng tại `.rodata+0x14` đọc là `1, 2, 3, 4, 4`.

## The Greedy Matcher

`match_functions()` chạy các giai đoạn theo thứ tự. Với mỗi giai đoạn nó nhóm các hàm vẫn chưa được ghép ở mỗi phía theo chữ ký của giai đoạn đó và chấp nhận mọi giá trị có đúng một hàm ở mỗi phía. Mục khớp ghi lại giai đoạn, chất lượng của giai đoạn, mọi chữ ký khác cũng thống nhất, và một tỷ lệ tương tự.

```python
for stage in order:
    for signature, candidates in left_groups.items():
        partners = right_groups.get(signature, [])
        if len(candidates) != 1 or len(partners) != 1:
            continue
        a, b = candidates[0], partners[0]
        agreeing = [s.id for s in STAGES if a.signatures()[s.id] == b.signatures()[s.id]]
        matches.append(Match(a, b, stage, agreeing, radare2_ratio(a.raw, b.raw), data_equal))
```

Thứ tự bài học chạy bốn giai đoạn cấu trúc trước và các tên sau cùng, để các giai đoạn cấu trúc được kiểm tra và các tên chấm chúng sau đó. Với `-O1` so với `-O2`:

| Hàm | Giai đoạn | Các chữ ký thống nhất | Độ tương tự |
|---|---|---|---|
| `percent_change` | byte chính xác | cả năm | 1.000 |
| `grade` | byte chính xác | cả năm | 1.000 |
| `total` | tên | chỉ tên | 0.171 |
| `grade_label` | byte chính xác | cả năm | 1.000 |

`total` tăng từ 31 byte và 13 lệnh lên 140 byte và 41 lệnh, vì clang vector hóa vòng lặp bằng SSE2 và giữ một vòng lặp phần dư vô hướng. Hình dạng của nó đi từ năm khối và năm cạnh đến mười khối và mười ba cạnh. Không có gì về cấu trúc còn lại, và chỉ ký hiệu liên kết hai bên.

Với `-O0` so với `-O1` cùng thứ tự tạo ra một mục khớp sai:

| Hàm tại -O0 | Được ghép tại -O1 | Giai đoạn | Các tên thống nhất |
|---|---|---|---|
| `percent_change` | `grade_label` | hình dạng đồ thị luồng | không |
| `grade` | `grade` | tên | có |
| `total` | `total` | tên | có |
| `grade_label` | chưa được ghép | | |

`percent_change` tại `-O0` là một hình thoi bốn khối: một điểm vào rẽ nhánh theo `before == 0`, hai nhánh, và một điểm nối trả về. Dãy bậc của nó là `0/2, 1/1, 1/1, 2/0`. `grade_label` tại `-O1` có `grade` được nội tuyến và cùng hình thoi quanh phép kiểm tra cận. Hình dạng là duy nhất ở cả hai phía và quy tắc chấp nhận nó. Nhãn chất lượng trung bình là cảnh báo, và giai đoạn tên, chạy sau đó, mâu thuẫn với nó. Mục khớp sai cũng dùng mất `grade_label` ở bên phải, nên các cặp `percent_change` và `grade_label` thật vẫn chưa được ghép.

Thứ tự BinDiff chạy ghép tên làm giai đoạn thứ hai khi có các tên thật, và `BINDIFF_ORDER` trong mã làm tương tự. Với thứ tự đó cả bốn hàm `-O0` khớp với các phiên bản `-O1` của chúng theo tên, là kết quả Ghidra báo cáo bên dưới. Bài học giữ cả hai thứ tự trong demo để thất bại nhìn thấy được. Một hình dạng đồ thị luồng bốn nút là hình dạng của mọi `if` và `else` nối lại trước khi trả về.

## Identical Bytes, Relocated Operand

Ghidra áp dụng các relocation khi nhập một tệp đối tượng. Vì vậy correlator byte của nó so sánh các ảnh đã nạp, và bài 36 che các trường relocation vì lý do này. `load_image()` tái tạo việc nhập. Nó duyệt các section được cấp phát theo thứ tự header, căn chỉnh mỗi section theo `sh_addralign`, và bố trí chúng từ 0x100000. Sau đó nó áp dụng mọi bản ghi: `S + A - P` được viết dưới dạng một giá trị có dấu 32 bit cho `R_X86_64_PC32` và `R_X86_64_PLT32`, `S + A` dưới dạng 64 bit cho `R_X86_64_64`.

Bố cục thống nhất với Ghidra 12.1.4 trên mọi điểm bắt đầu section trong cả hai chương trình, điều mà bộ kiểm thử kiểm tra với đầu ra Version Tracking đã thu lại:

| Section | Chương trình `-O1` | Chương trình `-O2` |
|---|---|---|
| `.text` | 0x100000, 159 byte | 0x100000, 271 byte |
| `.rodata` | 0x1000a0 | 0x100110 |
| `.rodata.str1.1` | 0x1000f0 | 0x100160 |

`.text` dài hơn 112 byte tại `-O2`, sự tăng trưởng của `total`, nên `.rodata` bắt đầu xa hơn 0x70 byte. `grade` nằm tại 0x100010 trong cả hai chương trình. `leaq` của nó tại độ lệch 0x33 có trường displacement tại 0x36 và kết thúc tại 0x3a. Addend relocation 0x10 cộng với 4 thông thường đặt bảng tại `.rodata+0x14`.

Trong ảnh `-O1`: `0x1000a0 + 0x14 - 0x10003a = 0x7a = 122`. Trong ảnh `-O2`: `0x100110 + 0x14 - 0x10003a = 0xea = 234`. Các byte trường là `7a 00 00 00` trong một ảnh và `ea 00 00 00` trong ảnh kia. Một byte trong 46 byte khác nhau, tỷ lệ Levenshtein là 0.978, và giai đoạn byte chính xác thất bại. Giai đoạn byte được che đặt trường về không và đạt. `grade_label` di chuyển cùng 0x70 như bảng của nó, nên các displacement của nó vẫn bằng nhau và nó đạt trên các byte chính xác trong cả hai cách nhìn.

Ghidra báo cáo cùng sự phân chia. Trên `-O1` so với `-O2`, Exact Function Bytes Match tìm thấy `percent_change` và `grade_label`, Exact Function Instructions Match tìm thấy hai hàm đó cộng `grade`, và Exact Function Mnemonics Match tìm thấy cùng ba hàm. Correlator lệnh che các toán hạng, bao quát displacement. Cách nhìn ảnh của bài học cho các mục khớp byte chính xác đối với đúng hai hàm mà correlator byte của Ghidra tìm thấy và sự thống nhất byte được che đối với đúng ba hàm mà correlator lệnh của nó tìm thấy. Bộ kiểm thử khẳng định cả hai đẳng thức.

`compare_functions` của rea 6.5.0 so sánh khác biệt văn bản provider theo dòng. Trên chiều assembly nó gắn giới hạn "chuẩn hóa relocation không khả dụng". Loader và mask trong bài học này cung cấp sự chuẩn hóa đó.

## What radiff2 Measures

radare2 6.2.4 cung cấp `radiff2`. Với `-AC` nó phân tích cả hai tệp và in một hàng cho mỗi hàm: kích thước và địa chỉ bên trái, MATCH hoặc UNMATCH, một tỷ lệ, và kích thước cùng địa chỉ bên phải. Các hàng đã thu lại cho các tệp đối tượng của chúng ta:

| Cặp | `percent_change` | `grade` | `total` | `grade_label` |
|---|---|---|---|---|
| `-O0` so với `-O1` | UNMATCH 0.130435 | UNMATCH 0.426829 | UNMATCH 0.106061 | UNMATCH 0.269841 |
| `-O1` so với `-O2` | MATCH 1.000000 | MATCH 1.000000 | UNMATCH 0.171429 | MATCH 1.000000 |
| `-O1` so với `-O1` | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 | MATCH 1.000000 |

Tỷ lệ trong mã nguồn radare2 là `1 - distance / max(len_a, len_b)`, trong đó khoảng cách là khoảng cách Levenshtein giữa hai fingerprint hàm và một fingerprint là phép nối các khối cơ bản của hàm theo thứ tự địa chỉ. Ngưỡng khớp là 0.7. `radare2_ratio()` trong `code/main.py` triển khai cùng công thức trên các byte hàm thô và tái tạo 0.130435, 0.106061, 0.269841, và 0.171429 đến sáu chữ số thập phân.

Nó không tái tạo 0.426829 cho `grade` tại `-O0`. Trên 118 byte của hàm tỷ lệ là 0.296610. radare2 in `118` trong cột kích thước. Fingerprint của nó ngắn hơn. Không có các relocation được áp dụng nó không thể phân giải bảng nhảy, nên phân tích của nó đến được khối điểm vào, khối kết thúc bằng `jmpq *%rax`, case mặc định, và phần trả về: 82 byte, cùng 82 byte mà phép duyệt đệ quy thông thường của bài 33 đã khẳng định. Khoảng cách Levenshtein giữa 82 byte đó và 46 byte tại `-O1` là 47, và `1 - 47/82 = 0.426829`. Với `-e bin.relocs.apply=true` radare2 tìm thấy cả 118 byte và in 0.288136, bằng tỷ lệ của bài học trên các ảnh đã áp dụng relocation, nơi bốn byte displacement khác với các trường không của tệp đối tượng. Hai công cụ chỉ thống nhất khi chúng so sánh cùng các byte, và cột kích thước không nói những byte nào đã được đưa vào.

`-O` giới hạn fingerprint ở các byte opcode và đặt các toán hạng về không. Các tỷ lệ `-O0` so với `-O1` tăng lên 0.239130, 0.512195, 0.303030, và 0.523810, và `total` tại `-O1` so với `-O2` tăng lên 0.192857. Các khoảng cách toàn tệp cũng tồn tại: `-s` (Myers) báo cáo độ tương tự 0.956 và khoảng cách 162 giữa hai tệp đối tượng, `-ss` (Levenshtein) 0.927 và 137. Các con số đó bao gồm các header, bảng ký hiệu, và section relocation và không nói gì về các hàm.

## Ghidra Version Tracking Correlators

Công cụ Version Tracking của Ghidra ghép một chương trình nguồn với một chương trình đích bằng các correlator. Các correlator hàm là Exact Function Bytes Match, Exact Function Instructions Match (các toán hạng được che), Exact Function Mnemonics Match, và Duplicate Function Instructions Match (1:N và N:M). Các correlator dữ liệu là Exact, Duplicate, và Similar Data Match. Các correlator ký hiệu ghép các tên chính xác, như các bản trùng, hoặc theo độ tương tự. Các correlator tham chiếu dùng các mục khớp được chấp nhận để tìm thêm. Các hàm phải được định nghĩa trong chương trình đích, và độ dài hàm tối thiểu mặc định là 10 byte. Auto Version Tracking chạy Exact Symbol Name, Exact Data, Exact Function Bytes, Exact Function Instructions, Exact Function Mnemonics, Duplicate Function Instructions, rồi một correlator tham chiếu, và tạo các mục khớp ngụ ý cho những mục được chấp nhận. Một correlator BSim được thêm trong 11.2.

Bài học thu lại các correlator ở chế độ headless. `capture_ghidra_vt.sh` nhập ba tệp đối tượng vào một dự án và chạy `ListVersionTrackingMatches.java`, một script ngắn mở rộng `AbstractGhidraVersionTrackingScript`, mở các chương trình nguồn và đích theo đường dẫn, chạy sáu correlator không tham chiếu theo thứ tự Auto Version Tracking, và in một dòng cho mỗi khối, hàm, correlator, và mục khớp. Mọi con số trong mục này đến từ hai tệp văn bản đó.

| Correlator | `-O0` đến `-O1` | `-O1` đến `-O2` |
|---|---|---|
| Exact Symbol Name Match | 4 hàm | 4 hàm, 5 mục dữ liệu (`labels.rel`, `.L.str.1` đến `.L.str.4`) |
| Exact Data Match | 0 | 0 |
| Exact Function Bytes Match | 0 | 2 (`percent_change`, `grade_label`) |
| Exact Function Instructions Match | 0 | 3 (thêm `grade`) |
| Exact Function Mnemonics Match | 0 | 3 |
| Duplicate Function Instructions Match | 0 | 0 |

Mọi hàm thay đổi giữa `-O0` và `-O1`, nên chỉ các tên khớp, là kết quả bộ ghép của bài học cho theo thứ tự BinDiff. Mọi mục khớp in độ tương tự 1.000 và độ tin cậy 10.000. Trang trợ giúp mô tả các correlator chính xác là độ tương tự 1.0 và độ tin cậy 1.0, nên thang đo của độ tin cậy được in là một câu hỏi mở mà bài học này ghi lại và không giải quyết.

Program Differences, dưới Tools, là một thứ khác. Nó so sánh hai chương trình có cùng không gian địa chỉ trên các byte, nhãn, đơn vị mã, tham chiếu, chú thích, và hàm tại các địa chỉ bằng nhau. Nó là một phép diff căn chỉnh theo địa chỉ và không ghép thứ gì đã di chuyển.

## Diaphora and Binary Ninja, From Their Documentation

Diaphora là một plugin IDA Pro, được phát hành lần đầu năm 2015 và ở phiên bản 3.4.2 tính đến 2026-08-18. Nó là AGPL-3.0 từ 2.0 và cần IDAPython, nên nó chạy trong IDA Home hoặc IDA Pro và không trong IDA Free. Nó export mỗi cơ sở dữ liệu sang SQLite và chạy các heuristic của nó dưới dạng các truy vấn SQL. Mỗi heuristic có một tên, một danh mục Best, Partial, hoặc Unreliable, một loại tỷ lệ, và các cờ tùy chọn như SAME_CPU hoặc SLOW. Các tên trong mã nguồn hiện tại đọc như các giai đoạn của bài học này với nhiều hơn: Bytes hash, Same address and mnemonics, Same cleaned assembly, Mnemonics small-primes-product, Same nodes, edges, loops and strongly connected components, Topological sort hash, và các fuzzy hash mã giả cần trình dịch ngược Hex-Rays. Ghi chú phát hành của nó cho thấy lịch sử tinh chỉnh: các heuristic chậm chỉ chạy dưới khoảng 2,000 hàm, và "Same graph" chuyển sang danh mục không đáng tin cậy. Sự chuyển đó là hình thoi bốn khối của bài học này, được thấy ở quy mô lớn.

Binary Ninja 6.0, được phát hành 2026-09-03, thêm Binary Similarity dưới dạng một framework với các provider và resolver. Nó cung cấp BinDiff làm một provider cấu trúc và WARP cho các mục khớp hàm chính xác chấp nhận các toán hạng có thể relocation, và hướng dẫn của nó nói dùng WARP khi các hàm khớp ngoài các lệnh có thể relocation và BinDiff khi chúng vẫn liên quan về cấu trúc sau khi biên dịch lại. Tính năng chỉ có trong bản Ultimate. Binary Ninja không có bản cài qua trình quản lý gói ở đây và không được chạy, nên đoạn này đến từ tài liệu của nó và không gì khác.

Bản thân BinDiff đã là mã nguồn mở từ 2023-09-25 theo Apache-2.0, với v8 là bản phát hành mới nhất. Nó cần một trình disassemble và plugin BinExport, hỗ trợ IDA Pro 9.4 trở về sau, Binary Ninja, và Ghidra. Con đường miễn phí cho người học là Ghidra cộng BinExport cộng dòng lệnh BinDiff. Bài học không chạy nó, và Practice Lab của nó yêu cầu bạn làm.

## Same Code, Different Constant

Bài 36 giữ một bản dựng lại ứng viên của `grade` có bảng với 3 ở mục cuối, nơi bản gốc có 4. `grade_case10_wrong.o` có cùng 46 byte mã như `grade` tại `-O1`. Bộ ghép ghép chúng trên các byte chính xác với mọi chữ ký thống nhất. Phép kiểm tra bảng được tham chiếu đọc `1, 2, 3, 4, 4` qua một relocation và `1, 2, 3, 4, 3` qua relocation kia và báo cáo `dataEqual: false`. Ba hàm `-O1` còn lại chưa được ghép ở bên trái, vì tệp đối tượng ứng viên giữ một hàm.

Đây là hình dạng phân tích bản vá. Một bộ so sánh khác biệt hàm dừng ở các byte nói không có gì thay đổi. Exact Data Match của Ghidra và ghép tham chiếu chuỗi của BinDiff tồn tại vì cùng lý do. Phiên bản của bài học nhỏ: với mọi cặp được ghép, so sánh các byte mà các relocation của mỗi hàm trỏ đến, với số lượng từ phép kiểm tra cận và độ rộng từ phép nạp.

## Symbolic Execution: Paths, Conditions, Solvers

King mô tả thực thi ký hiệu vào năm 1976. Các đầu vào trở thành các ký hiệu. Mỗi câu lệnh cập nhật một kho lưu trữ ký hiệu. Mỗi nhánh thêm một điều kiện vào đường đi, và một bộ giải quyết định liệu đường đi có khả thi và tạo ra một đầu vào cụ thể đi theo nó. Một hàm có các nhánh trở thành một cây đường đi, và một lá là một lệnh trả về có điều kiện gắn kèm.

Baldoni, Coppa, D'Elia, Demetrescu, và Finocchi khảo sát lĩnh vực này vào năm 2018. Mục 5 của họ nêu sự bùng nổ đường đi là chi phí trung tâm: một bộ thực thi có thể phân nhánh tại mỗi nhánh, nên số trạng thái có thể tăng theo hàm mũ theo số nhánh, và một vòng lặp có cận phụ thuộc vào một đầu vào ký hiệu cho một tập đường đi không bị chặn. Các biện pháp giảm thiểu họ liệt kê là cắt các đường đi không thể thực hiện bằng cách giải tại mỗi nhánh, các bản tóm tắt cho các hàm và vòng lặp, gộp trạng thái, và xấp xỉ dưới. Thực thi concolic chạy chương trình đồng thời một cách cụ thể và ký hiệu, ghi lại các điều kiện dọc theo lần chạy cụ thể, phủ định một điều kiện, và hỏi bộ giải để tìm đầu vào tiếp theo. DART (2005), CUTE (2005), và SAGE (2008) là các hệ thống được nêu tên.

KLEE (Cadar, Dunbar, Engler, OSDI 2008) là một máy ảo ký hiệu trên LLVM bitcode, nên đầu vào của nó là đầu ra `clang -emit-llvm` chứ không phải một tệp nhị phân. Nó cung cấp một mô hình môi trường POSIX và một thư viện phát lại. Trên 89 chương trình GNU coreutils nó đạt độ bao phủ dòng 84.5% so với 67.7% cho các kiểm thử của nhà phát triển và tìm thấy 56 lỗi nghiêm trọng. KLEE 3.2 được phát hành 2025-12-23 theo giấy phép NCSA, với LLVM 16 được khuyến nghị.

angr hoạt động trên các tệp nhị phân. `angr.Project` giữ một loader CLE ánh xạ tệp đối tượng và áp dụng các relocation, một lifter chuyển một khối thành VEX IR (`block.vex`) với pypcode là một lựa chọn thay thế, và một factory cho các trạng thái. Một `SimState` giữ các thanh ghi, bộ nhớ, và một bộ giải. Một `SimulationManager` chạy bước các stash trạng thái tên `active`, `deadended`, `found`, `avoided`, và `errored`, và `explore(find=..., avoid=...)` bọc nó. Với mỗi bước các engine chạy theo thứ tự: lỗi, syscall, hook, unicorn cho dữ liệu cụ thể, và VEX làm phương án dự phòng. claripy là front end bộ giải trên Z3, và trong angr 10.0 nó là một triển khai Rust được đóng gói được import là `from angr import claripy`. angr 10.0.3 được tải lên vào 2026-10-10, là BSD-2-Clause, và cần Python 3.12 trở về sau. Z3 5.1.0, được phát hành 2026-08-16 theo MIT, là bộ giải đằng sau angr, Triton, và backend tùy chọn của KLEE.

## A Tiny Executor Over the Lesson 34 IR

Bộ thực thi trong `code/main.py` dùng một IR nhỏ với các dạng câu lệnh của bài 34: `Assign`, `Branch`, `Jump`, `Return`, cộng terminator `Switch` mà Practice Lab của bài 34 đã yêu cầu. Các biểu thức là `Const`, `Var`, `Bin` có một độ rộng, `Cast`, `Load` từ một bảng cụ thể có tên, và `Not`. Bốn hàm fixture được nâng bằng tay ở mức mà bài 34 đạt sau khi đơn giản hóa, nơi phép nhân `0x66666667` đã trở thành `score / 10`, và mọi khối IR liệt kê các địa chỉ lệnh mà nó đến từ. `check_ir_against_listing()` khẳng định rằng các địa chỉ bao phủ bản liệt kê của hàm đúng một lần.

`grade` tại `-O0` trong IR đó:

```text
0x30: local_8 = score; local_10 = score / 10 - 6; if (local_10 >u 4) goto 0x9a else 0x62
0x62: switch local_10 -> 0x91, 0x88, 0x7f, 0x76, 0x76
0x76: local_4 = 4; goto 0xa1        0x7f: local_4 = 3; goto 0xa1
0x88: local_4 = 2; goto 0xa1        0x91: local_4 = 1; goto 0xa1
0x9a: local_4 = 0                    0xa1: return local_4
```

Các đích switch đến từ `jump_table_targets()`, cùng phép tính relocation như bài 33, nên IR đọc fixture.

`execute()` giữ một danh sách công việc các trạng thái đường đi. Một trạng thái có khối hiện tại, vết các khối, danh sách điều kiện, và một môi trường ánh xạ mỗi biến đến một biểu thức trên các đầu vào. `Assign` thay thế môi trường vào nguồn và lưu kết quả. `Branch` thay thế vào điều kiện, rồi hỏi bộ giải hai lần: một lần với điều kiện được thêm, một lần với phủ định của nó. Một phía mà bộ giải không thể thỏa mãn bị bỏ, là việc cắt tỉa sớm mà khảo sát mô tả. `Switch` nhóm các mục bảng theo đích và phân nhánh một lần cho mỗi đích phân biệt với phép tuyển của các đẳng thức mục, cũng là cách angr xử lý một đích nhảy ký hiệu. `Return` thay thế vào giá trị và đóng lá. Một vết dài hơn giới hạn bước đánh dấu đường đi là bị cắt ngắn và dừng nó.

Đi theo đường đến `return 4` bằng tay. Điểm vào gán `local_10 = score / 10 - 6`. Điều kiện nhánh `local_10 >u 4` sai trên đường đi này, nên danh sách điều kiện giữ `!(score / 10 - 6 >u 4)`. Các mục switch 3 và 4 đều trỏ đến 0x76, nên nhánh phân tách đến 0x76 thêm `score / 10 - 6 == 3 || score / 10 - 6 == 4`. Khối 0x76 gán `local_4 = 4`, nhảy đến 0xa1, và lệnh trả về thay thế thành `4`. Lá là cặp điều kiện đó và giá trị đó.

Bộ giải là `BoundedSearch`. Nó giữ một miền hữu hạn cho mỗi đầu vào, liệt kê tích của các miền, và đánh giá mỗi ràng buộc với ngữ nghĩa C: quay vòng 32 bit, phép chia cắt cụt, các phép so sánh có dấu và không dấu, và các phép dịch số học hoặc logic. Một phép chia cho không hoặc một chỉ mục bảng ngoài bảng khiến phép gán đó không thỏa ràng buộc. Với `score` trong -200 đến 1200, năm đường đi của `grade` tốn 44,460 lần đánh giá và vài mili giây. Giải mỗi lá để tìm tập đầu vào cho:

| Lá | Trả về | Điều kiện | Các điểm số trong cận |
|---|---|---|---|
| 0x76 | 4 | `!(q >u 4) && (q == 3 \|\| q == 4)` | 90 đến 109, 20 đầu vào |
| 0x7f | 3 | `!(q >u 4) && q == 2` | 80 đến 89, 10 đầu vào |
| 0x88 | 2 | `!(q >u 4) && q == 1` | 70 đến 79, 10 đầu vào |
| 0x91 | 1 | `!(q >u 4) && q == 0` | 60 đến 69, 10 đầu vào |
| 0x9a | 0 | `q >u 4` | 1,351 đầu vào, phần còn lại của cận |

`q` đại diện cho `score / 10 - 6`. Cùng các lớp xuất hiện từ `grade` tại `-O1`, nơi IR có hai đường đi, đường đi bảng trả về `lookup_14[q]` và đường đi mặc định trả về 0, và câu hỏi trở thành một ràng buộc trên giá trị trả về, vì không có khối case để đến. Bảng `lookup_14` được đọc từ `.rodata` của tệp đối tượng tại 0x14.

Cận là giới hạn của phương pháp. Một phép tìm kiếm có giới hạn là đầy đủ bên trong miền của nó và im lặng bên ngoài nó. Trong -200 đến 1200 không điểm số nào trong 60 đến 109 trả về 0 và không điểm số từ 110 trở lên trả về một giá trị khác không. z3 chứng minh cả hai cho tất cả 2^32 điểm số, và mục tiếp theo cho thấy nơi hai phương pháp trả về các nhân chứng khác nhau.

## Path Explosion Measured

`total` tại `-O1` là vòng lặp của bài 33: một phép kiểm tra trên `count`, một thân vòng lặp cộng `values[rdx]` và tăng `rdx`, và một `jne` trở lại thân khi `rdx != rcx`. Trong IR `rcx` là `zext64(count)` và `rdx` bắt đầu tại 0. Mỗi lần đi qua cạnh ngược phân nhánh theo `rdx != count` với `rdx` là một hằng số, nên đường đi cho `count = c` chạy thân `c` lần và thoát. Với `count` được giới hạn từ 0 đến 2 bộ thực thi tìm thấy 3 đường đi. Với 0 đến 4 nó tìm thấy 5, và với 0 đến 8 nó tìm thấy 9. Mỗi đường đi trả về tổng tam giác của số đếm của nó: (0, 0), (1, 1), (2, 3), đến (8, 36). angr báo cáo 3, 5, và 9 trạng thái deadended và cùng chín cặp số đếm-và-tổng ở cả ba mức tối ưu hóa, bao gồm `-O2`, có vòng lặp vector cần số đếm ít nhất bằng 8 và do đó không bao giờ thay đổi số đường đi trong phạm vi này.

Không có cận bộ thực thi không bao giờ hoàn tất, vì mỗi số lần lặp là thêm một đường đi khả thi. Mức trần 24 khối cho mỗi đường đi của bài học, chạy với `count` đến 64, trả về 22 đường đi, cắt ngắn 2, và không bao giờ bắt đầu 41 đường đi còn lại trong 65 đường đi tồn tại. Báo cáo cho ba con số đó. Chi phí giải cũng tăng: 33 lần đánh giá tại cận 2, 115 tại 4, 531 tại 8, và 6,900 cho lần chạy có mức trần.

## angr and z3 on the Same Questions

`capture_angr.py` chạy angr 10.0.3 trên ba tệp đối tượng. CLE nạp mỗi tệp đối tượng có thể relocation bằng backend ELF tại 0x400000, áp dụng 13 relocation cho `-O0` và 8 cho các bản khác, và phân giải bốn ký hiệu. Với `grade` có một đối số ký hiệu 64 bit, `run()` kết thúc với 5 trạng thái deadended tại `-O0` và 2 tại `-O1` và `-O2`, trong 0.475, 0.408, và 0.318 giây. Thêm `eax == v` vào mỗi trạng thái deadended và hỏi bộ giải để tìm giá trị nhỏ nhất và lớn nhất có dấu cho 60 đến 69, 70 đến 79, 80 đến 89, và 90 đến 109 với `v` từ 1 đến 4 ở mọi mức, và -2147483648 đến 2147483647 cho 0. Cả hai phép kiểm tra chéo đều unsat.

Dạng đến-một-khối dùng CFGFast trên `grade` tại `-O0`, liệt kê tám khối mà bài 33 tìm thấy, rồi `explore(find=0x400076)` cho khối lưu 4. Nó tìm thấy một trạng thái với ba trạng thái vẫn active trong 0.47 giây, với giá trị nhỏ nhất 90 và lớn nhất 109 trên đối số và các mẫu 91, 93, 94, 97, và 101.

Với `percent_change`, hai trạng thái deadended với các ràng buộc `before[31:0] != 0` và `before[31:0] == 0`. Hỏi trạng thái khác không để tìm `eax == 50` cho `before = 21055744, after = 332315210` tại `-O0`, `40566804, 834296877` tại `-O1`, và `-24484867, 993934694` tại `-O2`. Phép tìm kiếm có giới hạn trong -16 đến 16 trả lời `before = -10, after = -15`. z3, được hỏi cùng câu hỏi trên bản liệt kê bài 34, trả lời `before = -25092599, after = 305712160`. Bộ kiểm thử đánh giá cả năm cặp bằng bộ đánh giá IR và mỗi cặp cho 50. Một mô hình chứng minh rằng một đầu vào tồn tại. Nó không phải đầu vào duy nhất, và ba công cụ đúng cho ba đầu vào khác nhau.

`capture_z3.py` mô hình hóa bản liệt kê `-O1` của `grade` bằng các bit-vector 32 bit với phép nhân, hai phép dịch, và bảng, và hỏi thêm bốn câu hỏi. Bản liệt kê khác với `switch` mã nguồn cho một điểm số 32 bit nào đó: unsat trong 0.068 giây, nên hàm đã biên dịch bằng với mã nguồn trên tất cả 2^32 đầu vào. Bản liệt kê khác với bản dựng lại theo ngưỡng của bài 36: sat tại điểm số 706346536, nơi `score / 10` là 70634653 và switch rơi vào mặc định trong khi các ngưỡng trả về 4. Cùng sự khác biệt giới hạn trong 0 đến 109: unsat, đó là lý do lưới của bài 36 không thể thấy nó. Với `percent_change`, `before == 3` với kết quả -133 là sat với `after = 1073741823`, ô tràn của bài 36, và phép tìm kiếm có giới hạn tìm thấy một nhân chứng thứ hai bên trong miền của nó, `after = -1`, nơi `(-1 - 3) * 100 / 3` cắt cụt thành -133 mà hoàn toàn không tràn.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
```

Đầu ra là một báo cáo JSON. `diffs` giữ các mục khớp tệp đối tượng và ảnh đã nạp cho `-O0` so với `-O1` và `-O1` so với `-O2`, cộng cặp `-O0` theo thứ tự BinDiff. `toolComparison` đặt giai đoạn của bài học cạnh kết luận và tỷ lệ radiff2 cùng các correlator Ghidra cho mọi hàm. `patch` là trường hợp `grade_case10_wrong.o`. `radare2Ratios` tái tạo các con số radiff2, `gradeRelocationCase` hiển thị bố cục và hai displacement, và `symbolic` giữ các đường đi, lớp, và số lượng bùng nổ.

Đọc `code/main.py` theo thứ tự này:

1. `ElfObject` đọc các section, ký hiệu, và bản ghi `.rela.*`. `parse_listing()` đọc văn bản `llvm-objdump`.
2. `jump_table_targets()` và `build_cfg()` cho các khối có thể tiếp cận và các cạnh có kiểu. `FunctionRecord.signatures()` dựng năm chữ ký.
3. `load_image()` bố trí các section được cấp phát và áp dụng `S + A - P` và `S + A`.
4. `match_functions()` là bộ ghép theo giai đoạn. `levenshtein()` và `radare2_ratio()` cho độ tương tự.
5. `parse_radiff2()` và `parse_ghidra_vt()` đọc các đầu ra công cụ đã thu lại cho phép so sánh.
6. `evaluate()`, `substitute()`, và `BoundedSearch` là ngữ nghĩa biểu thức và bộ giải.
7. `execute()` liệt kê các đường đi. `solve_returns()` hỏi mỗi lá để tìm một tập đầu vào.
8. `grade_ir_o0()`, `grade_ir_o1()`, `percent_change_ir_o1()`, và `total_ir_o1()` là các bản nâng bằng tay với các địa chỉ lệnh của chúng.

Có thêm ba lệnh. `python3 code/main.py diff A.o B.o` so sánh khác biệt hai tệp đối tượng có các bản liệt kê nằm cạnh chúng, và `--image` so sánh khác biệt các ảnh đã nạp của chúng. `python3 code/main.py paths grade O0` in các đường đi và lớp của một hàm, `paths total 8` in vòng lặp có một cận. `python3 code/main.py figure-data` in dữ liệu mà figure tương tác nhúng.

## Use It

Dùng bộ so sánh khác biệt và bộ thực thi theo thứ tự này trên hai bản dựng của chương trình của chính bạn.

1. Thu lại một bản liệt kê cho mỗi tệp đối tượng và để `function_record()` xác minh nó với các byte. Sửa bản liệt kê trước bất cứ điều gì khác.
2. So sánh khác biệt các tệp đối tượng trước. Đọc giai đoạn của mọi mục khớp và coi các mục khớp hình dạng đồ thị luồng là các gợi ý cho đến khi một chữ ký thứ hai thống nhất.
3. So sánh khác biệt các ảnh đã nạp. Một hàm rơi từ byte chính xác xuống byte được che đã di chuyển tương đối với dữ liệu của nó, và phép tính displacement nêu section đã di chuyển.
4. Với mọi mục khớp, so sánh các bảng được tham chiếu. Cùng mã với các hằng số khác nhau là một hàm đã sửa đổi.
5. Chạy giai đoạn tên và so sánh. Khi bản dựng có các ký hiệu, chạy thứ tự BinDiff và chỉ dùng kết quả cấu trúc để chấm các giai đoạn.
6. Khi một công cụ báo cáo một tỷ lệ, tìm hiểu những byte nào được đưa vào nó trước khi bạn so sánh nó với tỷ lệ của chính bạn.
7. Với hàm mà bạn muốn các đầu vào, viết IR với một địa chỉ cho mỗi câu lệnh, chạy `execute()` với một cận trên mọi bộ đếm vòng lặp ký hiệu, và giải mỗi lá. Báo cáo cận cùng kết quả.
8. Chạy cùng truy vấn qua angr hoặc z3 khi chúng có sẵn và so sánh các cận lớp. Một mẫu là một mô hình.

## Interactive Lab

### Lab A: five signatures by hand

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution/code
python3 -q
```

Chạy:

```python
from main import *
grade = {r.name: r for r in fixture_records("ledger-x86_64-O1.o")}["grade"]
grade.raw.hex(" ")
grade.masked_bytes() == grade.raw
grade.mnemonics
grade.cfg_shape()
grade.signatures()
```

Viết ra bốn byte tại độ lệch 0x26 của hàm trước khi bạn in `grade.raw`. Sau đó chạy cùng các dòng trên `grade` từ `ledger-x86_64-O0.o` và đếm các cạnh `table` trong `grade.edges`.

### Lab B: watch the relocation break the byte hash

```python
case = grade_relocation_case()
case["layout"]
case["displacements"], case["rodataShift"]
case["objectBytesEqual"], case["imageBytesEqual"], case["maskedImageBytesEqual"]
```

Tính `0x100110 + 0x14 - 0x10003a` trên giấy trước khi bạn đọc `displacements`. Sau đó thay cơ sở trong `load_image()` thành 0x400000 và xác nhận rằng các displacement không thay đổi, vì cả hai toán hạng di chuyển cùng nhau.

### Lab C: the false match and the order that avoids it

```python
report = diff_fixtures("ledger-x86_64-O1.o", "ledger-x86_64-O2.o")
[(m.left.name, m.right.name, m.stage) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o")
[(m.left.name, m.right.name, m.stage, m.names_agree) for m in report.matches]
report = diff_fixtures("ledger-x86_64-O0.o", "ledger-x86_64-O1.o", stages=BINDIFF_ORDER)
[(m.left.name, m.right.name, m.stage) for m in report.matches]
```

In `records(...)["percent_change"].cfg_shape()` cho `-O0` và `grade_label` cho `-O1` và đọc hai dãy bậc. Sau đó viết một giai đoạn thứ sáu hash các mnemonic đã sắp xếp, để thứ tự không còn quan trọng, và xem liệu nó có tách chúng hay không.

### Lab D: paths and the bound

```python
report = grade_paths("O0")
[(p["trace"], p["condition"], p["returns"]) for p in report["paths"]]
report["returns"]["4"]
total_paths(2), total_paths(4), total_paths(8)
total_paths(64, step_limit=24)["truncated"]
```

Thay `SCORE_DOMAIN` thành `range(0, 110)` và chạy lại `grade_paths("O0")`. Lớp cho 0 thu nhỏ xuống 60 đầu vào và hai phép kiểm tra chéo vẫn đúng. Sau đó đặt miền thành `range(90, 100)` và đọc những lá nào hoàn toàn không có mô hình.

## Practice Lab

Chạy BinDiff trên các fixture và so sánh nó với ba kết quả bạn đã có.

Yêu cầu:

- Cài extension BinExport trong Ghidra 12.1.4 và export ba chương trình ledger. Ghi lại tag phát hành BinExport và phiên bản Ghidra.
- Cài dòng lệnh BinDiff 8 và tạo các kết quả `-O0` so với `-O1` và `-O1` so với `-O2` với tùy chọn chỉ độ tương tự.
- Thu lại độ tương tự và độ tin cậy theo hàm vào `code/fixtures/` với các lệnh chính xác trong `build_fixtures.sh`.
- Mở rộng `tool_comparison()` với một cột `bindiff` và thêm một kiểm thử so sánh tập được ghép của BinDiff trên `-O1` so với `-O2` với tập byte được che của bài học.
- Viết một đoạn nêu thuật toán BinDiff đã dùng cho `grade` và liệu nó có so sánh các ảnh đã nạp hay không.

Thành công nghĩa là demo in bốn cột công cụ cho mỗi hàm và kiểm thử mới nêu một đẳng thức hoặc một sự khác biệt được giải thích.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-binary-diffing-and-symbolic-execution.md`. Dùng nó để chuyển hai bản dựng và một hàm thành một phép diff theo giai đoạn có chất lượng được nêu cho mỗi mục khớp, một lời giải thích cho mọi hàm chưa được ghép hoặc đã thay đổi, và một báo cáo đường đi với một tập đầu vào đã giải cho mỗi lá và cận đã tạo ra nó.

## Verify It

Chạy demo và bộ kiểm thử:

```bash
cd phases/13-tools-and-protocols/44-binary-diffing-and-symbolic-execution
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- các bảng ký hiệu cho bốn hàm với các kích thước 46, 118, 66, 39 tại `-O0`, 16, 46, 31, 63 tại `-O1`, và 16, 46, 140, 63 tại `-O2`
- các bản ghi `.rela.text` của tệp đối tượng `-O1` được mô tả như `llvm-objdump -r` in chúng
- mọi lệnh được liệt kê nằm trong phạm vi ký hiệu của nó và các byte của nó bằng tệp đối tượng, và một byte thay đổi gây ngoại lệ
- `total` tại `-O1` có năm khối, năm cạnh, và một vòng tự lặp, và chuỗi hình dạng của nó có tính xác định
- `grade` tại `-O0` khôi phục năm đích bảng nhảy từ `.rela.rodata` và có tám khối và mười một cạnh
- không có bảng, `grade` tại `-O0` tiếp cận 82 byte trong bốn khối
- `percent_change` tại `-O0` và `grade_label` tại `-O1` có cùng hình dạng bốn khối
- các hash chính xác và được che thống nhất trên mọi hàm của một tệp đối tượng có thể relocation
- `-O1` và `-O2` dùng chung các byte cho ba hàm, `-O0` và `-O1` không dùng chung hàm nào
- bảng được tham chiếu của `grade` đọc là `1, 2, 3, 4, 4` và của ứng viên đọc là `1, 2, 3, 4, 3`
- loader đặt `.text`, `.rodata`, và `.rodata.str1.1` ở nơi Ghidra đặt chúng trong cả hai chương trình
- `R_X86_64_PC32` được viết là `S + A - P` và cho displacement 122, và các mục `R_X86_64_64` trong `.data` nhận các địa chỉ chuỗi
- các byte `grade` thống nhất trong các tệp đối tượng và khác trong các ảnh bởi một sự dịch chuyển 0x70, và việc che khôi phục mục khớp
- `-O1` so với `-O2` ghép ba hàm trên các byte chính xác và `total` theo tên; cách nhìn ảnh ghép `grade` bằng các byte được che với độ tương tự 1 - 1/46
- thứ tự bài học tạo một mục khớp hình dạng đồ thị luồng sai trên `-O0` so với `-O1`, và thứ tự BinDiff ghép cả bốn theo tên
- ứng viên bản vá khớp trên các byte và thất bại trên dữ liệu được tham chiếu
- tỷ lệ Levenshtein tái tạo 0.130435, 0.106061, 0.269841, 0.171429, 0.426829 trên 82 byte, và các tỷ lệ byte đã relocation mà radiff2 in với các relocation được áp dụng
- tập MATCH của radiff2 bằng giai đoạn byte chính xác, và các correlator byte và lệnh của Ghidra bằng các tập chính xác và được che của cách nhìn ảnh
- Ghidra chỉ tìm thấy các tên trên `-O0` so với `-O1`, với độ tương tự 1.0 và độ tin cậy 10.0 trên mọi mục khớp
- IR được nâng bằng tay bao phủ mọi lệnh được liệt kê một lần, và bộ đánh giá tuân theo ngữ nghĩa C
- `grade` có năm đường đi tại `-O0` với các điều kiện switch và hai tại `-O1` với cùng các lớp
- các lớp có giới hạn 60 đến 69, 70 đến 79, 80 đến 89, 90 đến 109 bằng của angr ở cả ba mức và của z3, với 5 và 2 trạng thái deadended và phạm vi đến-một-khối 90 đến 109
- hai phép kiểm tra chéo không có mô hình trong cận, trong angr, hoặc trong z3, và z3 chứng minh bản liệt kê bằng với switch mã nguồn
- mọi mô hình `percent_change` từ phép tìm kiếm có giới hạn, angr, và z3 được đánh giá thành giá trị yêu cầu
- `total` cho 3, 5, 9 đường đi với các tổng tam giác, giống angr, và mức trần bước trả về 22 và cắt ngắn 2
- dữ liệu figure mang cả hai cách nhìn, các con số relocation, và năm lá cùng các tập đầu vào của chúng, và mô-đun site nhúng cùng dữ liệu

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Hash byte trên một ảnh đã nạp | "grade bị sửa đổi" giữa hai bản dựng có mã giống hệt | Độ lệch trường, hai displacement, và sự dịch chuyển section; hash được che khớp |
| Hash được che trên một tệp đối tượng có thể relocation | "việc che không tạo khác biệt" | Các trường đã bằng không; các bản ghi relocation và các hằng số được tham chiếu mang thay đổi |
| Chỉ hình dạng đồ thị luồng | Một cặp tự tin gồm các hàm không liên quan | Một chữ ký thứ hai thống nhất, hoặc các tên mâu thuẫn và mục khớp bị bỏ |
| Các tên trước cấu trúc trên một bản dựng đã strip | Không có gì khớp | Các giai đoạn cấu trúc với các chất lượng của chúng, và danh sách chưa được ghép |
| Một tỷ lệ được so sánh giữa các công cụ | "radiff2 nói 0.43 và bài học nói 0.30" | Những byte nào mỗi phía đã lấy fingerprint; 82 byte không có relocation, 118 khi có |
| Cùng mã, hằng số khác | "khớp chính xác" | Bảng được đọc qua relocation và phép kiểm tra cận |
| Một mô hình được báo cáo là đầu vào | "điểm số là 90" | Lớp 90 đến 109 cùng số lượng của nó, và cận mà nó được tìm thấy trong |
| Phép tìm kiếm có giới hạn được báo cáo là unsat | "không đầu vào nào cho -133" | Chỉ unsat bên trong cận; z3 tìm thấy 1073741823 bên ngoài nó |
| Vòng lặp ký hiệu không có cận | Một timeout | Cận hoặc mức trần, các đường đi được trả về, bị cắt ngắn, và chưa bao giờ bắt đầu |
| Công cụ đóng được mô tả là đã chạy | Các con số không có bản thu | Một tệp bản thu có lệnh và phiên bản, hoặc một câu nói chỉ dựa trên tài liệu |

## Operational Rule

Ghép trên từng chữ ký một, chỉ chấp nhận các giá trị duy nhất ở cả hai phía, và giữ giai đoạn cùng chất lượng của nó với mục khớp. So sánh khác biệt các tệp đối tượng và các ảnh đã nạp và giải thích mọi hàm thay đổi giai đoạn giữa hai cách. Liệt kê các đường đi với một bộ giải tại mọi nhánh, đặt cận mọi vòng lặp ký hiệu, và báo cáo một tập đầu vào cùng cận của nó. Một mô hình đơn lẻ không có cận là một mẫu.

## Further Reading

- [BinDiff concepts: matching strategy, algorithms, and quality ratings](https://github.com/google/bindiff/blob/main/docs/concepts.md)
- [BinDiff repository and the v8 open-source release](https://github.com/google/bindiff/releases/tag/v8)
- [BinExport README: IDA Pro, Binary Ninja, and Ghidra exporters](https://github.com/google/binexport)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004) and Dullien, Rolles, "Graph-based comparison of Executable Objects" (SSTIC 2005), shipped in the BinDiff repository](https://github.com/google/bindiff/tree/main/docs/papers)
- [Diaphora README and heuristics source](https://github.com/joxeankoret/diaphora)
- [Ghidra Version Tracking correlators help page](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/VersionTracking/src/main/help/help/topics/VersionTrackingPlugin/VT_Correlators.html)
- [Ghidra Auto Version Tracking help page](https://www.ghidradocs.com/11.0_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_AutoVT.html)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Ghi chú phát hành Binary Ninja 6.0 "Krypton"](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html) và [Hướng dẫn người dùng Binary Similarity](https://docs.binary.ninja/guide/similarity.html)
- [Sách radare2: radiff2](https://book.rada.re/tools/radiff2/intro.html) và [Mã nguồn radare2 6.2.4](https://github.com/radareorg/radare2/releases/tag/6.2.4)
- [King, "Symbolic execution and program testing" (CACM 1976)](https://dl.acm.org/doi/10.1145/360248.360252)
- [Baldoni et al., "A Survey of Symbolic Execution Techniques" (ACM Computing Surveys 2018)](https://dl.acm.org/doi/10.1145/3182657)
- [Cadar, Sen, "Symbolic execution for software testing: three decades later" (CACM 2013)](https://dl.acm.org/doi/10.1145/2408776.2408795)
- [Cadar, Dunbar, Engler, "KLEE: Unassisted and Automatic Generation of High-Coverage Tests for Complex Systems Programs" (OSDI 2008)](https://www.usenix.org/legacy/events/osdi08/tech/full_papers/cadar/cadar.pdf) và [Bản phát hành KLEE 3.2](https://github.com/klee/klee/releases/tag/v3.2)
- [Shoshitaishvili et al., "SoK: (State of) The Art of War: Offensive Techniques in Binary Analysis" (IEEE S&P 2016)](https://oaklandsok.github.io/papers/shoshitaishvili2016.pdf)
- [Tài liệu angr: nạp, các trình quản lý mô phỏng, và pipeline mô phỏng](https://docs.angr.io/en/latest/core-concepts/toplevel.html) và [angr 10.0.3 trên PyPI](https://pypi.org/project/angr/)
- [Z3 5.1.0 release](https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0)
- [Triton dynamic binary analysis library](https://github.com/JonathanSalwan/Triton)
- [System V Application Binary Interface, AMD64 Architecture Processor Supplement, Table 4.9: Relocation Types](https://gitlab.com/x86-psABIs/x86-64-ABI)
