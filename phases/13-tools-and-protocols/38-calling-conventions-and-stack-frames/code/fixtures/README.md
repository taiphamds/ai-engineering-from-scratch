# Fixtures for lesson 38

Mọi object ở đây được biên dịch trên máy này từ `convention.c` với các lệnh trong `build_fixtures.sh`. Không có gì được tải xuống. Compiler là Apple clang 17.0.0 (clang-1700.6.3.2); các danh sách đến từ `llvm-objdump` và `llvm-dwarfdump` của Apple LLVM 17.0.0 trong Command Line Tools. `toolchain-versions.txt` ghi các phiên bản, và `SHA256SUMS.txt` các digest.

`convention.c` tự khai báo `memcpy` và `strncpy` và chỉ bao gồm `stdarg.h` cùng `stddef.h`, vì không có sysroot Linux hoặc Windows được cài và chỉ các header riêng của clang phân giải cho các mục tiêu chéo. Các struct sử dụng `long long`, vì `long` là 4 byte trên mục tiêu MSVC và 8 byte trên các mục tiêu khác.

| Tệp | Được dựng bằng | Mục đích |
|---|---|---|
| `convention-x86_64-linux-O0.o`, `-O2.o` | `clang -target x86_64-unknown-linux-gnu -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | System V AMD64 psABI |
| `convention-x86_64-windows-O0.o`, `-O2.o` | `clang -target x86_64-pc-windows-msvc -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | Microsoft x64 |
| `convention-aarch64-linux-O0.o`, `-O2.o` | `clang -target aarch64-unknown-linux-gnu -O0/-O2 -fno-asynchronous-unwind-tables -c convention.c` | AAPCS64 |
| `convention-arm64-macos-O2.o` | `clang -target arm64-apple-macos -O2 -fno-asynchronous-unwind-tables -c convention.c` | các khác biệt Apple arm64 (slot variadic, vị trí frame record) |
| `convention-x86_64-windows-O2-seh.o` | giống object Windows `-O2` không có `-fno-asynchronous-unwind-tables` | các bảng unwind `.pdata` và `.xdata` (`.sections.txt`, `.xdata.txt`, `.relocs.txt`) |
| `convention-x86_64-linux-O2-eh.o`, `convention-aarch64-linux-O2-eh.o` | giống các object Linux `-O2` không có `-fno-asynchronous-unwind-tables` | thông tin call frame `.eh_frame` (`.eh-frame.txt` từ `llvm-dwarfdump --eh-frame`) |
| `convention-x86_64-linux-O0-noredzone.o` | Linux `-O0` với `-mno-red-zone` | khung leaf không có red zone |
| `convention-x86_64-linux-O2-fp.o` | Linux `-O2` với `-fno-omit-frame-pointer` | con trỏ khung được giữ ở `-O2` |
| `*.objdump.txt` | `llvm-objdump -d -r FILE.o` | các danh sách mà analyzer đọc |
| `*.symbols.txt` | `llvm-objdump -t FILE.o` | các bảng symbol để tham khảo |

`tools/` chứa các bản thu được `capture_tools.sh` tạo ngày 2026-10-14: radare2 6.2.4 (`afcl`, `afc`, `afi`, `afv`, `afs`, `afcr`), rizin 0.9.1 (`afcl`, `afc`, `afi`, `afvl`, `afcr`) và angr 10.0.3 (`angr_cc.py`: `CFGFast` rồi `CompleteCallingConventions`, in lớp quy ước được khôi phục và prototype). Mã bài học đọc các bản thu này; nó không cần các công cụ được cài.
