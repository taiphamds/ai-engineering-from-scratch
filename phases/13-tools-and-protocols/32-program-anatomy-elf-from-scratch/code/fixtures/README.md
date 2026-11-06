# Fixtures for lesson 32

Mỗi tệp ở đây là một chương trình bạn đã xây dựng. `ledger.c` là fixture chung của nhánh reverse engineering (cùng nguồn với `manuals/reverse-engineering-101/capture/fixtures/ledger.c`). Các object được dựng trên macOS 26.2 với Apple clang 17.0.0 (clang-1700.6.3.2) và SDK 26.2. `build_fixtures.sh` chạy mọi lệnh bên dưới.

| Tệp | Lệnh build chính xác |
|---|---|
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` |
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` |
| `ledger-x86_64-O2.o` | `clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O2.o` |
| `ledger-arm64-O1.o` | `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-arm64-O1.o` |
| `tiny-x86_64` | `python3 build_tiny_elf.py` |

Ba object x86-64 không cần Linux sysroot vì `ledger.c` không bao gồm header nào. Object arm64 mang một lệnh `LC_BUILD_VERSION` với phiên bản SDK, nên một bản build với SDK khác cho các byte khác. Các byte đã commit là fixture, và các bài kiểm tra đọc chúng, nên build không phải một phần của lần chạy kiểm tra.

Văn bản oracle, được thu bằng `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump` (Apple LLVM phiên bản 17.0.0):

| Tệp | Lệnh thu |
|---|---|
| `ledger-x86_64-O0.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O0.o` |
| `ledger-x86_64-O1.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O1.o` |
| `ledger-x86_64-O2.objdump.txt` | `llvm-objdump -h -t -r ledger-x86_64-O2.o` |
| `ledger-arm64-O1.objdump.txt` | `llvm-objdump -h -t -r ledger-arm64-O1.o` |
| `ledger-arm64-O1.load-commands.txt` | `llvm-objdump --macho --private-headers ledger-arm64-O1.o` |
| `tiny-x86_64.objdump.txt` | `llvm-objdump -h -t -r -p tiny-x86_64` |

SHA-256 của các object:

```
b2046c121930d3d1e5ba84ba796f9e9e161df2fe76f7b9dcf8db63f690447e13  ledger-x86_64-O0.o
9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f  ledger-x86_64-O1.o
ce31eaf10e7cb88fb8e313abfdb4f743964646339260c471ff97d60137bbe89b  ledger-x86_64-O2.o
fe67e3783e24427e4c3264e0e6ff9060f685cdd0939def1cdd99dad66e21c900  ledger-arm64-O1.o
```
