# Fixtures for lesson 44

Mọi tệp đối tượng ở đây được biên dịch trên máy này từ mã nguồn ở cạnh nó, và mọi đầu ra công cụ được thu lại trên máy này từ các tệp đối tượng đó. Không có gì được tải xuống. `build_fixtures.sh` chạy mọi lệnh bên dưới theo thứ tự.

## Objects

| Tệp | Được dựng bằng | Mục đích |
|---|---|---|
| `ledger.c` | mã nguồn dùng chung với các bài 32 đến 36 | bốn hàm: `percent_change`, `grade`, `total`, `grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c` | `grade` giữ một bảng nhảy với năm mục `.rela.rodata` |
| `ledger-x86_64-O1.o` | cùng lệnh với `-O1` | `grade` đọc một bảng giá trị, `total` là một vòng lặp vô hướng |
| `ledger-x86_64-O2.o` | cùng lệnh với `-O2` | `total` được vector hóa bằng SSE2 và tăng từ 31 lên 140 byte |
| `grade_case10_wrong.c` | bản sao của ứng viên bài 36 | cùng 46 byte mã như `grade` tại `-O1` với mục bảng cho case 10 đổi thành 3 |
| `grade_case10_wrong.o` | cùng lệnh với `-O1` | fixture phân tích bản vá: mã giống hệt từng byte, hằng số khác |
| `*.objdump.txt` | `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d FILE.o` (Apple LLVM 17.0.0) | các bản liệt kê mà bộ so sánh khác biệt đọc để lấy ranh giới lệnh và mnemonic |

Trình biên dịch là Apple clang 17.0.0 (clang-1700.6.3.2). SHA-256 của ba tệp đối tượng `ledger`: `b2046c12...` (O0), `9a4a8082...` (O1), `ce31eaf1...` (O2). Chúng giống từng byte với các tệp đối tượng của bài 33.

## Tool captures

| Tệp | Lệnh | Phiên bản công cụ |
|---|---|---|
| `radiff2-AC-O0-vs-O1.txt`, `radiff2-AC-O1-vs-O2.txt`, `radiff2-AC-O1-vs-O1.txt` | `radiff2 -AC A.o B.o`, các dòng nêu một `sym.` | radare2 6.2.4 (`radiff2-version.txt`) |
| `radiff2-AC-relocs-O0-vs-O1.txt` | `radiff2 -e bin.relocs.apply=true -AC` | như trên |
| `radiff2-AOC-*.txt` | `radiff2 -AOC`, chỉ các byte opcode | như trên |
| `radiff2-s-O1-vs-O2.txt`, `radiff2-ss-O1-vs-O2.txt` | `radiff2 -s` (Myers) và `-ss` (Levenshtein) trên toàn bộ các tệp | như trên |
| `ghidra-vt-O0-vs-O1.txt`, `ghidra-vt-O1-vs-O2.txt` | `capture_ghidra_vt.sh`: `analyzeHeadless` nhập ba tệp đối tượng, rồi chạy `ghidra/ListVersionTrackingMatches.java` làm một post-script với các đường dẫn chương trình nguồn và đích làm đối số | Ghidra 12.1.4, OpenJDK 21 (`ghidra-version.txt`) |
| `angr-runs.json` | `capture_angr.py` trong một venv Python 3.12 với angr 10.0.3 | angr 10.0.3, claripy được đóng gói dưới dạng `angr.rustylib.claripy` |
| `z3-runs.json` | `capture_z3.py` trong cùng venv | z3-solver 5.1.0.0 |

`ListVersionTrackingMatches.java` chạy sáu correlator Auto Version Tracking từng cái một theo thứ tự được ghi tài liệu và in một dòng `VT|` cho mỗi khối chương trình, mỗi hàm, mỗi correlator, và mỗi mục khớp. Shell script giữ các thư mục thiết lập, cache, và tạm của Ghidra dưới một thư mục làm việc để một lần chạy không để lại gì trong thư mục home.

Các kiểm thử đọc các bản thu đã commit, nên chúng đạt trên một máy không có radare2, Ghidra, angr, hoặc z3. Các kiểm thử so sánh với một bản thu được bỏ qua khi tệp bản thu vắng mặt.
