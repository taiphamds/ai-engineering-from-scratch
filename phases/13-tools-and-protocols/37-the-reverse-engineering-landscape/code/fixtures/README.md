# Fixtures for lesson 37

Mọi object ở đây được biên dịch trên máy này từ nguồn bên cạnh nó, và mọi đầu ra công cụ được thu trên máy này từ các object đó. Không có gì được tải xuống. Các object giống hệt từng byte với các fixture của bài 33.

## Programs

| Tệp | Được dựng bằng | Mục đích |
|---|---|---|
| `ledger.c` | nguồn dùng chung với bài 33 | bốn hàm: `percent_change`, `grade`, `total`, `grade_label` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `grade` chứa một jump table mà các công cụ phân giải khác nhau |
| `ledger-x86_64-O1.o` | cùng lệnh với `-O1` | trường hợp đồng nhất: mọi công cụ tìm 3, 3, 5, 4 khối |
| `ledger-x86_64-O2.o` | cùng lệnh với `-O2` | `total` được vector hóa, 10 khối trong mọi công cụ |
| `sweep-trap.s` | viết tay | bốn byte dữ liệu bên trong `.text` |
| `sweep-trap.o` | `clang -target x86_64-unknown-linux-gnu -c sweep-trap.s -o sweep-trap.o` | linear sweep giải mã dữ liệu thành mã |

Compiler: Apple clang phiên bản 17.0.0 (clang-1700.6.3.2). `build_fixtures.sh` chứa các lệnh chính xác.

## Captures

`capture_tools.py` chạy mọi công cụ một lần và ghi `captures.json`, ghi lại ngày, host, mọi phiên bản công cụ và lệnh chính xác đằng sau mỗi tệp. Mã bài học và các bài kiểm tra chỉ đọc các tệp này. Chúng không bao giờ khởi động một công cụ.

| Công cụ | Phiên bản | Tệp | Lệnh |
|---|---|---|---|
| llvm-objdump | Apple LLVM phiên bản 17.0.0 | `*.objdump.txt` | `llvm-objdump -d -r FILE.o` |
| radare2 | 6.2.4 | `*.radare2.json` | `r2 -e scr.color=0 -qc 'iSj' FILE.o`, rồi `aaa; aflj`, và theo hàm `aaa; afbj @ ADDR`, `aaa; pdfj @ ADDR`, `aaa; pdc @ ADDR` |
| rizin | 0.9.1 | `*.rizin.json` | `rizin -e scr.color=0 -qc '<same commands without pdc>' FILE.o` |
| angr | 10.0.3 (pyvex 10.0.3, cle 10.0.3) | `*.angr.json` | `python capture_angr.py FILE.o OUT.json`: `CFGFast(normalize=True, data_references=True)` và `Decompiler` trên mọi hàm symbol |
| Ghidra | 12.1.4 | `*.ghidra.json` | `analyzeHeadless PROJECT_DIR lesson37 -import FILE.o -scriptPath . -postScript ExportAnalysis.java OUT.json -deleteProject` |
| pyvex, pypcode, radare2, rizin | 10.0.3, 4.0.1, 6.2.4, 0.9.1 | `ir-lifts.json` | `python capture_ir.py`, rồi `r2 -a x86 -b 64 -qc 'e asm.esil=true; wx HEX; pd 1' -` và `rizin -a x86 -b 64 -qc 'wx HEX; aoi 1' malloc://16` |

Mỗi bản thu JSON giữ các địa chỉ riêng của công cụ. Các công cụ ánh xạ `.text` tại các địa chỉ cơ sở khác nhau: llvm-objdump in offset section, radare2 và rizin ánh xạ object tại `0x08000040`, angr tại `0x400000`, Ghidra tại `0x100000`. Mã bài học trừ mỗi địa chỉ cơ sở.

`ExportAnalysis.java` liệt kê các chỉ lệnh bên trong mỗi thân hàm Ghidra, các basic block của `BasicBlockModel` với loại luồng của chúng, P-code thô của mọi chỉ lệnh, C được decompile và các tham chiếu dữ liệu. Nó không liệt kê các chỉ lệnh ngoài các thân hàm.

Ghidra cần JDK 21. Bên trong một sandbox từ chối thư mục tạm Java mặc định, đặt `JAVA_TOOL_OPTIONS=-Djava.io.tmpdir=$TMPDIR`.

IDA Pro và Binary Ninja chưa được chạy. Bài học mô tả chúng từ tài liệu của chúng.
