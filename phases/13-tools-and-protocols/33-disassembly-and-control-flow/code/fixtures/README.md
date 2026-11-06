# Fixtures for lesson 33

Mọi object ở đây được biên dịch trên máy này từ nguồn bên cạnh nó. Không có gì được tải xuống.

| Tệp | Được dựng bằng | Mục đích |
|---|---|---|
| `ledger.c` | nguồn dùng chung với `manuals/reverse-engineering-101/capture/fixtures/ledger.c` | bốn hàm: `percent_change`, `grade`, `total`, `grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `grade` chứa một jump table thực: `jmpq *%rax` với năm mục `.rela.rodata` |
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` | `grade` trở thành một lần tải bảng giá trị, `total` là một vòng lặp vô hướng |
| `ledger-x86_64-O2.o` | `clang -target x86_64-unknown-linux-gnu -O2 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O2.o` | `total` được vector hóa bằng SSE2 và có hai vòng lặp |
| `sweep-trap.s` | viết tay | một bảng byte bên trong `.text` mà một linear sweep giải mã thành mã |
| `sweep-trap.o` | `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s -o sweep-trap.o` | bẫy đã dựng |
| `*.objdump.txt` | `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d FILE.o` (Apple LLVM 17.0.0) | oracle mà các bài kiểm tra decoder so sánh với |

Compiler là Apple clang 17.0.0 (clang-1700.6.3.2). Ba object `ledger` giống hệt từng byte với các fixture thu trong `manuals/reverse-engineering-101/capture/fixtures/`.
