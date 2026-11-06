# Fixtures for lesson 39

Mọi object ở đây được biên dịch trên máy này từ nguồn bên cạnh nó bằng `build_fixtures.sh`. Không có gì được tải xuống. Compiler là Apple clang 17.0.0 (clang-1700.6.3.2) và các danh sách đến từ `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r` (Apple LLVM 17.0.0). `toolchain.txt` ghi cả hai chuỗi phiên bản lúc build.

| Tệp | Được dựng bằng | Mục đích |
|---|---|---|
| `idioms.c` | nguồn | 25 hàm nhỏ, một hoặc hai mẫu mỗi hàm: chia và modulo cho hằng số, năm dạng switch, select, một tail call, một callee inline, các vòng lặp vector hóa hoặc unroll, các vòng lặp lưu và sao chép, và `digest`, chứa năm mẫu trong một thân |
| `idioms-x86_64-O{0,1,2,3}.{o,s,objdump.txt}` | `clang -target x86_64-unknown-linux-gnu -O<N> -fno-asynchronous-unwind-tables -c idioms.c` và tương tự với `-S` | bốn mức trên x86-64 |
| `idioms-arm64-O{0,1,2,3}.{o,s,objdump.txt}` | `clang -target aarch64-unknown-linux-gnu -O<N> -fno-asynchronous-unwind-tables -c idioms.c` | bốn mức trên AArch64 |
| `idioms-x86_64-nofastisel-O0.*` | `-O0 -mllvm -fast-isel=false` | phép nhân ma thuật xuất hiện ở `-O0` khi FastISel tắt |
| `idioms-x86_64-nojt-O2.*` | `-O2 -fno-jump-tables` | mọi bảng trở thành một cây so sánh |
| `idioms-x86_64-novec-O2.*` | `-O2 -fno-vectorize -fno-slp-vectorize` | các vòng lặp unroll theo 8 thay vì vector hóa |
| `idioms-x86_64-nobuiltin-O2.*` | `-O2 -fno-builtin` | vòng lặp lưu không bị biến thành `memset` và `memcpy(…, 16)` vẫn là một lần gọi |
| `idioms-arm64-jt4-O2.*` | `-O2 -mllvm -min-jump-table-entries=4` | `call_switch` 5 case vẫn là một cây so sánh trên AArch64 |
| `dispatch.c`, `dispatch-{x86_64,arm64}-O2.*` | `-O2` cho cả hai mục tiêu | một switch 16 case của các tail call: một jump table relocation trên x86-64, một jump table byte nén trên AArch64 |
| `canary.c`, `canary-x86_64-ssp-O2.*`, `canary-arm64-ssp-O2.*` | `-O2 -fstack-protector-strong` | các dạng stack protector trên cả hai mục tiêu |
| `canary-x86_64-cet-O2.*` | `-O2 -fcf-protection=full` | `endbr64` như chỉ lệnh đầu của mọi hàm |
| `idioms-x86_64-O2.angr.json` | `venv/bin/python capture_angr.py idioms-x86_64-O2.o idioms-x86_64-O2.angr.json` với angr 10.0.3 | số khối CFG và đầu ra decompiler cho 20 hàm |
| `idioms-x86_64-O2.lifts.json` | `venv/bin/python capture_lifts.py idioms-x86_64-O2.o idioms-x86_64-O2.lifts.json` với Capstone 5.0.7 và pypcode 4.0.1 | đầu ra decoder với các nhóm chỉ lệnh, và P-code thô cho `div10s` và `mod8s` |
| `idioms-x86_64-O2.radare2.txt` | `r2 -e scr.color=0 -qc '...' idioms-x86_64-O2.o` với radare2 6.2.4 | `afl`, `pdf` và `pdc` trên các hàm chia, bảng và select |
| `idioms-x86_64-O2.rizin.txt` | `rizin -e scr.color=0 -qc '...' idioms-x86_64-O2.o` với rizin 0.9.1 | `afl`, `pdf` và RzIL của `imul` |
| `idioms-x86_64-O2.lldb.txt` | `lldb -b -o 'disassemble -n div10s' ...` với lldb-1703.0.236.21 | cùng các chỉ lệnh qua disassembler của debugger |

Các lệnh chính xác cho mọi mục nằm ở dòng đầu của mỗi bản thu văn bản và trong `build_fixtures.sh`.
