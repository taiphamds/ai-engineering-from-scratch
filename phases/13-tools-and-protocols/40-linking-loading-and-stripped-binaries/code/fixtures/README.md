# Fixtures for lesson 40

Mỗi tệp ở đây là một chương trình bạn đã dựng. `ledger.c` là fixture chung của nhánh reverse engineering (cùng nguồn với bài 32). `main.c` gọi bốn hàm của nó, `puts` và `printf`, và chứa một bảng con trỏ chuỗi (`names`) và một bảng con trỏ hàm (`fns`), nên image đã liên kết cần cả bind và rebase. Các object và image được dựng trên macOS 26.2 với Apple clang 17.0.0 (clang-1700.6.3.2), `ld` từ PROJECT:ld-1230.1 và SDK 26.2. `build_fixtures.sh` chạy mọi lệnh bên dưới. Các byte đã commit là fixture, và các bài kiểm tra đọc chúng, nên build không phải một phần của lần chạy kiểm tra.

Chỉ Mach-O liên kết trên máy này. Các object ELF và COFF biên dịch ở đây bằng `clang -target`, và không link editor ELF hoặc PE nào được cài, nên hai image đã liên kết trong các định dạng đó được hai script Python viết từng byte từ các đặc tả. Chúng chưa được chạy; `llvm-objdump` và thăm dò thư viện đọc chúng.

| Tệp | Lệnh build chính xác |
|---|---|
| `libledger.dylib` | `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables -dynamiclib -install_name @rpath/libledger.dylib ledger.c -o libledger.dylib` |
| `ledger_main` | `clang -target arm64-apple-macos -O1 -fno-asynchronous-unwind-tables main.c -L. -lledger -Wl,-rpath,@executable_path -o ledger_main` |
| `ledger_main_nochain` | lệnh `ledger_main` cộng `-Wl,-no_fixup_chains` |
| `ledger_main.stripped` | `cp ledger_main ledger_main.stripped && strip ledger_main.stripped` |
| `libledger.stripped.dylib` | `cp libledger.dylib libledger.stripped.dylib && strip libledger.stripped.dylib` |
| `ledger-arm64-O0.o`, `main-arm64-O0.o` | `clang -target arm64-apple-macos -O0 -fno-asynchronous-unwind-tables -c FILE.c` |
| `ledger-arm64-O2.o`, `main-arm64-O2.o` | tương tự với `-O2` |
| `static-arm64-O0`, `static-arm64-O2` | `clang -target arm64-apple-macos -OLEVEL -fno-asynchronous-unwind-tables main-arm64-OLEVEL.o ledger-arm64-OLEVEL.o -o static-arm64-OLEVEL` |
| `static-arm64-O0.stripped`, `static-arm64-O2.stripped` | `cp` rồi `strip` |
| `ledger-x86_64-O1.o`, `main-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c FILE.c` |
| `tiny-dyn-x86_64` | `python3 build_tiny_dyn_elf.py` |
| `ledger-x86_64.obj`, `main-x86_64.obj` | `clang -target x86_64-pc-windows-msvc -O1 -fno-asynchronous-unwind-tables -c FILE.c` |
| `tiny-x86_64.exe` | `python3 build_tiny_pe.py` |

`ledger-x86_64-O1.o` có cùng SHA-256 như fixture bài 32 cùng tên.

Văn bản công cụ đã thu, với lệnh chính xác. `llvm-objdump` là `/Library/Developer/CommandLineTools/usr/bin/llvm-objdump` (Apple LLVM phiên bản 17.0.0); `otool`, `nm`, `strip` và `dyld_info` là các công cụ trong `/usr/bin`.

| Tệp | Lệnh thu |
|---|---|
| `ledger_main.otool-h.txt` | `otool -h ledger_main` |
| `ledger_main.otool-l.txt`, `ledger_main_nochain.otool-l.txt`, `ledger_main.stripped.otool-l.txt` | `otool -l FILE` |
| `ledger_main.otool-Iv.txt` | `otool -Iv ledger_main` |
| `ledger_main.stubs.txt` | `otool -v -s __TEXT __stubs ledger_main` |
| `ledger_main.dyld-fixups.txt`, `ledger_main_nochain.dyld-fixups.txt` | `dyld_info -fixups FILE` |
| `ledger_main.dyld-chain-details.txt` | `dyld_info -fixup_chain_details ledger_main` |
| `ledger_main.dyld-imports.txt` | `dyld_info -imports ledger_main` |
| `libledger.dyld-exports.txt`, `libledger.stripped.dyld-exports.txt` | `dyld_info -exports FILE` |
| `libledger.stripped.function-starts.txt`, `static-arm64-*.stripped.function-starts.txt` | `dyld_info -function_starts FILE` |
| `ledger_main.chained-fixups.txt` | `llvm-objdump --macho --chained-fixups ledger_main` |
| `ledger_main.nm.txt`, `ledger_main.stripped.nm.txt`, `libledger.nm.txt`, `libledger.stripped.nm.txt` | `nm -m FILE` |
| `static-arm64-*.nm.txt`, `static-arm64-*.stripped.nm.txt` | `nm -n FILE` |
| `static-arm64-*.stripped.objdump.txt` | `llvm-objdump --macho -d FILE` |
| `ledger-arm64-*.objdump-r.txt`, `main-arm64-*.objdump-r.txt` | `llvm-objdump -r FILE.o` |
| `ledger-x86_64-O1.objdump.txt`, `main-x86_64-O1.objdump.txt` | `llvm-objdump -h -t -r FILE.o` |
| `tiny-dyn-x86_64.objdump.txt` | `llvm-objdump -h -p -T -R -d tiny-dyn-x86_64` |
| `ledger-x86_64.obj.objdump.txt`, `main-x86_64.obj.objdump.txt` | `llvm-objdump -h -t -r FILE.obj` |
| `tiny-x86_64.exe.objdump.txt` | `llvm-objdump -h -p tiny-x86_64.exe` |
| `ledger_main.run.txt`, `ledger_main.stripped.run.txt`, `static-arm64-O2.stripped.run.txt` | `./FILE; echo exit=$?` |
| `probe-libs.txt` | `python3 -I probe_libs.py` với lief 1.0.0, pyelftools 0.33, pefile 2024.8.26 được cài |

SHA-256 của các tệp đã dựng:

```
a6dd27ce057df5c4bdb815d2c0f63a9859200abbcc564d31ed39b77adcc1cca8  libledger.dylib
de687d408ac5fd0f9818d9bedb0cf8622a0bf3dac28553c6eba4f247e5b04ccc  ledger_main
5270e88803cc98d3c6cc2e18ded438e6037c2b81ab1e34846c29822a574870c0  ledger_main_nochain
70d5da586f7bc1142bb99779d458a7e326afec364239807dff021c3fe02bcd96  static-arm64-O0
f10bd475ac4f4d1aa7d30110e35eec5445bfab4f1d5a57b75337309e9dfd2164  static-arm64-O2
859dee59fb5e04047149720b9ff28d4bd8147106c01a13c4f9f31efdac2d3ff3  ledger-arm64-O0.o
3cb939fa89e947a1d4288946889c8b626db93be0c31ddc1259eba3cb2935af46  ledger-arm64-O2.o
5e49ce821ceca207bc4cf1d137e96599771e633cd76f732ad997f0990ba95b2d  main-arm64-O0.o
81a89ba01c9e085a457520cbf5f131889dd5077321dce419f668a1a78082045f  main-arm64-O2.o
9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f  ledger-x86_64-O1.o
b9574afdb10559ad8e5602a6010fb0882780057a17221217b9441f859b8a71d3  main-x86_64-O1.o
cd38a47432f17ec18d57755d3476443ddb9932e364f51742f734de54248655ad  tiny-dyn-x86_64
a81df8a4df50758b9d1fb36e5bad5b644e4f5324e692029852f1d46e0cbf63d5  ledger-x86_64.obj
7e24e1ec4a9815b2bfa627e063631656a1babafddbd79cee659d87ee3ce7ca91  main-x86_64.obj
d6ae0aba3b6b07b5180b68de9dd1106d0ea9a1cd8e00ac79149b6f40c46456a2  tiny-x86_64.exe
```
