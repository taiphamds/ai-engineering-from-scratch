# Fixtures for lesson 42

Mọi tệp ở đây là một chương trình chúng ta đã viết và biên dịch trên máy này, hoặc đầu ra của một công cụ chạy trên chương trình đó. Không có gì được tải xuống. Trình gỡ lỗi chỉ từng chạy với hai bản dựng này.

| Tệp | Nó là gì |
|---|---|
| `account.c` | Chương trình của bài học: `struct account` với năm trường, `bump`, `classify`, `sum_balances`, và một `main` gọi chúng một lần, ba lần, và một lần. |
| `account-O0`, `account-O0.dSYM/` | `clang -g -O0 -o account-O0 account.c`. Mach-O arm64, được linker ký ad-hoc, DWARF 5 trong gói dSYM. |
| `account-O2`, `account-O2.dSYM/` | `clang -g -O2 -o account-O2 account.c`. Cùng mã nguồn, mọi lời gọi trong `main` được nội tuyến và gộp. |
| `account-O0.objdump.txt`, `account-O2.objdump.txt` | `llvm-objdump -d` của mỗi tệp nhị phân. Harness đọc các phạm vi hàm và các nhánh có điều kiện từ chúng. |
| `account-O0.nm.txt`, `account-O2.nm.txt` | `nm` của mỗi tệp nhị phân. Cả hai liệt kê `_bump`, `_classify`, `_sum_balances`. |
| `account-O0.dwarfdump.txt`, `account-O2.dwarfdump.txt` | `llvm-dwarfdump --debug-info` của mỗi dSYM. Bố cục struct mà harness dùng để kiểm tra bộ nhớ. |
| `account-O0.codesign.txt` | `codesign -dvvv` và `codesign -d --entitlements -` của tệp nhị phân `-O0`. |
| `session-O0.lldb`, `session-O2.lldb` | Các tệp lệnh mà `python3 ../main.py capture` đã viết từ kế hoạch. Các kiểm thử kiểm tra chúng bằng kế hoạch. |
| `session-O0.lldb.txt`, `session-O2.lldb.txt` | Các bản ghi lldb batch của những phiên đó, với dòng lệnh, phiên bản lldb, và ngày trong một header `#`. |
| `core-save-O0.lldb`, `core-save-O0.lldb.txt` | Dừng tại `bump`, rồi `process save-core --style stack`. Bản thân tệp core không được giữ lại. |
| `core-load-O0.lldb`, `core-load-O0.lldb.txt` | Nạp core đó bằng `lldb -c` và đọc backtrace, struct, và bộ nhớ. |
| `types-O0.lldb`, `types-O0.lldb.txt` | API Python của lldb không có một tiến trình: phiên bản Python nhúng, các trường struct, kích thước struct, các phạm vi hàm. |
| `sandbox-O0.lldb.txt` | Cùng kế hoạch `session-O0` chạy bên trong sandbox Seatbelt của phiên. Việc khởi chạy thất bại trước bất kỳ lần dừng nào. |
| `build_fixtures.sh` | Các lệnh chính xác đã tạo mọi tệp ở trên. |

Các phiên bản công cụ vào 2026-10-14, macOS 26.2 (Darwin 25.2.0), Apple silicon:

- Apple clang 17.0.0 (clang-1700.6.3.2), Command Line Tools với SDK 26.2
- lldb-1703.0.236.21, Python nhúng 3.9.6
- `llvm-objdump` và `llvm-dwarfdump` từ `/Library/Developer/CommandLineTools/usr/bin`, Apple LLVM phiên bản 17.0.0

Dựng lại mọi thứ bằng `sh build_fixtures.sh` từ thư mục này. Bước thu lại cần một shell có thể khởi chạy các tiến trình dưới lldb. Bên trong một sandbox Seatbelt, thay vào đó nó viết một bản ghi như `sandbox-O0.lldb.txt`. Các địa chỉ stack trong một lần thu mới khác với các bản ghi đã commit khi môi trường khác, nên các kiểm thử ghim các bản ghi đã commit và chế độ trực tiếp tự chấm một lần chạy mới.
