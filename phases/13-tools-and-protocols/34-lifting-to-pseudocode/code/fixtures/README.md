# Fixtures for lesson 34

`ledger.c` là fixture chung của Reverse Engineering 101. Bài học giữ bản sao riêng để mã chạy độc lập.

## Objects

Được dựng trên macOS 26.2 arm64 với Apple clang 17.0.0 (clang-1700.6.3.2). Cả hai bản build có thể tái tạo từng byte.

| Tệp | Lệnh | SHA-256 |
|---|---|---|
| `ledger-x86_64-O1.o` | `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o` | `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f` |
| `ledger-x86_64-O0.o` | `clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O0.o` | `b2046c121930d3d1e5ba84ba796f9e9e161df2fe76f7b9dcf8db63f690447e13` |

## Reference disassembly

`ledger-x86_64-O1.objdump.txt` và `ledger-x86_64-O0.objdump.txt` là đầu ra của:

```bash
/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r ledger-x86_64-O1.o
/Library/Developer/CommandLineTools/usr/bin/llvm-objdump -d -r ledger-x86_64-O0.o
```

Apple LLVM phiên bản 17.0.0. Các bài kiểm tra yêu cầu decoder trong `../main.py` đồng nhất với mọi dòng.

## Ghidra pseudocode through rea

`ghidra/percent_change.json`, `ghidra/grade.json` và `ghidra/total.json` là các bản ghi Evidence mà rea 6.5.0 trả về cho verb `decompile` (thao tác `procedure_pseudo_code`) với provider Ghidra 12.1.4. Chạy ngày 2026-10-14 trên macOS 26.2 arm64 với OpenJDK 21.0.12.1:

```bash
export GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" percent_change --provider ghidra --format json
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" grade --provider ghidra --format json
npx -y rea-agents@6.5.0 decompile "$PWD/ledger-x86_64-O1.o" total --provider ghidra --format json
```

Mỗi lần gọi mất khoảng 10 giây. Trường `subject.local_path` ghi đường dẫn của bản sao dưới `manuals/reverse-engineering-101/capture/fixtures/`, có cùng SHA-256.

`ghidra/ledger-x86_64-O1.ghidra.c` chứa nguyên văn ba chuỗi `raw_result.value`.

`ghidra/ledger-x86_64-O1.ghidra-repaired.c` là cùng văn bản với những chỉnh sửa nhỏ nhất làm nó biên dịch được. Các chỉnh sửa là:

1. `typedef unsigned int uint;` và `typedef unsigned long ulong;` vì Ghidra in các tên kiểu riêng của nó.
2. `DAT_001000b4` được định nghĩa là 20 byte tại offset `.rodata` 0x14 của object, để `&DAT_001000b4 + (ulong)uVar2 * 4` giữ là phép toán byte như Ghidra muốn. Ghidra đặt `.rodata` tại 0x001000a0 trong dự án tạm thời của nó, nên 0x001000b4 là `.rodata + 0x14`.
3. Trong `percent_change`, kiểu trả về `undefined1 [16]` trở thành `int`, tham số thứ ba `param_3` được loại bỏ và hai biến tạm `auVar` 16 byte trở thành tám byte thấp của thương được cắt xuống `int`. Các hàm `grade` và `total` không thay đổi.

Bài kiểm tra `test_lifted_functions_behave_like_the_source_on_an_input_grid` biên dịch tệp này cạnh `ledger.c` và đầu ra lifter và so sánh cả ba trên cùng các đầu vào.
