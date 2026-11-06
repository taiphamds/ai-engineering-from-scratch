# Fixtures for lesson 41

Mọi object ở đây được biên dịch trên máy này từ hai nguồn bên cạnh nó. Không có gì được tải xuống. `build_fixtures.sh` chứa các lệnh chính xác và `SHA256SUMS.txt` các hash kết quả. `capture_tools.sh` chứa các lệnh tạo ra các tệp trong `tools/`.

## Sources

| Tệp | Mục đích |
|---|---|
| `account.c` | `struct account` với các thành viên tại các offset 0, 4, 8, 16, 24 và kích thước 32; `bump`, `sum_balances`, `tag`, `projected`, `label_length`, mỗi hàm chạm các thành viên khác nhau; `main` in bố cục và truyền một mảng ba phần tử cho cả năm |
| `shapes.cpp` | `Shape` với một destructor ảo, một `area()` thuần ảo và một `name()` ảo; `Rect : Shape`; `describe` thực hiện một lần gọi ảo |

Cả hai nguồn tự khai báo `printf` để chúng biên dịch cho mục tiêu Linux mà không có một system header.

## Objects and captured text

Được dựng bằng Apple clang 17.0.0 (clang-1700.6.3.2). Các tệp văn bản cạnh mỗi object đến từ `llvm-objdump`, `llvm-dwarfdump` và `llvm-cxxfilt` của Apple Command Line Tools, tất cả "Apple LLVM version 17.0.0". `toolchain-versions.txt` ghi bốn dòng phiên bản.

| Tệp | Lệnh | Vai trò |
|---|---|---|
| `account-x86_64-O0-g.o`, `-O1-g.o`, `-O2-g.o` | `clang -target x86_64-unknown-linux-gnu -g -O{0,1,2} -fno-asynchronous-unwind-tables -fdebug-compilation-dir=. -c account.c` | các object DWARF 5 ở ba mức tối ưu hóa; lượt đọc các danh sách của chúng, trình đọc phân tích object `-O0` |
| `account-x86_64-O1.o` | tương tự không có `-g` | object mà các công cụ thấy không có thông tin gỡ lỗi |
| `*.objdump.txt` | `llvm-objdump -d -r FILE.o` | các danh sách mà lượt đọc |
| `account-x86_64-O0-g.dwarfdump.txt` | `llvm-dwarfdump --debug-info` | oracle cho các bài kiểm tra trình đọc DWARF |
| `account-x86_64-O0-g.dwarfdump-tables.txt` | `llvm-dwarfdump --debug-abbrev --debug-str-offsets --debug-addr --debug-str` | bảng viết tắt và hai bảng gián tiếp |
| `account-x86_64-O0-g.relocs.txt` | `llvm-objdump -r` | mọi relocation, bao gồm các relocation trên các debug section |
| `shapes-x86_64-O0-g.o`, `shapes-x86_64-O1-g.o` | `clang++ -target x86_64-unknown-linux-gnu -g -O{0,1} -fno-asynchronous-unwind-tables -fdebug-compilation-dir=. -c shapes.cpp` | object `-O0` mang cả hai vtable; object `-O1` không có |
| `shapes-x86_64-O0-g.symbols.txt`, `.relocs.txt`, `.dwarfdump.txt` | `llvm-objdump -t`, `llvm-objdump -r`, `llvm-dwarfdump --debug-info` | symbol, relocation vtable và các mục lớp |
| `shapes-x86_64-O0-g.mangled.txt`, `.cxxfilt.txt` | các tên symbol bắt đầu bằng `_Z`, và `llvm-cxxfilt --no-strip-underscore` trên chúng | oracle demangler |
| `account-native.run.txt` | `clang -g -O0 -o account account.c && ./account` trên host arm64 | báo cáo của chính chương trình về bố cục của nó |

`-fdebug-compilation-dir=.` làm `DW_AT_comp_dir` thành chuỗi `.` để các object không phụ thuộc thư mục mà chúng được dựng trong đó. Các object có thể tái tạo từng byte.

## Tool captures in `tools/`

Được `capture_tools.sh` tạo ngày 2026-10-14 trên macOS 26.2 arm64. Phiên bản của mỗi công cụ nằm trong `*-version.txt` tương ứng.

| Tệp | Công cụ và lệnh |
|---|---|
| `ghidra-account-dwarf.txt`, `ghidra-account-nodwarf.txt`, `ghidra-shapes-dwarf.txt` | Ghidra 12.1.4 `analyzeHeadless ... -import FILE.o -postScript ListTypes.java` với OpenJDK 21.0.12.1; `ghidra/ListTypes.java` liệt kê mọi `Structure` trong Data Type Manager và decompile năm hàm account |
| `rizin-account.txt`, `rizin-account-nodwarf.txt` | rizin 0.9.1 với `ts`, `tsc account`, `afvd` và `pdf` trên `sym.bump`, với `bin.dbginfo=true` cho object `-g` |
| `radare2-account.txt` | radare2 6.2.4 với cùng các lệnh và `bin.relocs.apply=true` |
| `lldb-account.txt`, `lldb-shapes.txt` | Apple lldb-1703.0.236.21, `image lookup -t account`, `image lookup -n bump`, `image lookup -t Rect`, `image lookup -t Shape` |
| `pyelftools-account.txt` | `pyelftools_struct.py` dưới Python 3.12.12 với pyelftools 0.33 |

radare2 và rizin được dựng từ nguồn vào một prefix cục bộ cho khóa học này. Ghidra đến từ công thức Homebrew `ghidra`. Script thu bỏ qua mọi công cụ vắng mặt và in nó đã bỏ qua công cụ nào.
