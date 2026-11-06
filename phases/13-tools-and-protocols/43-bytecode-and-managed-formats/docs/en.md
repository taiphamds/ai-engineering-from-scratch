# Beyond Native Code: Python, JVM, .NET, and WebAssembly Bytecode

> Một tệp bytecode là một chương trình cộng với các ghi chú của trình biên dịch về nó, và bài học này dựng các bộ đọc cho thấy mỗi container giữ những ghi chú nào.

**Type:** Build
**Languages:** Python, Java, C#, WebAssembly text
**Prerequisites:** Phase 13 · 32 (ELF from scratch), 33 (disassembly and control flow)
**Time:** ~150 minutes

## Learning Objectives

- Đọc header `.pyc` 16 byte từ PEP 552 và unmarshal đối tượng mã không cần mô-đun `marshal`, cho các tệp được viết bởi bốn phiên bản trình thông dịch.
- Phân tích một tệp class JVM từ JVMS Chương 4: constant pool, các trường, các phương thức, thuộc tính `Code`, và các bảng mà `javac -g` thêm.
- Disassemble các opcode JVM trong `Ledger.class` và chứng minh bản liệt kê với `javap -c` trên bốn bản dựng của cùng mã nguồn.
- Đọc một mô-đun WebAssembly từng section, giải mã mọi thân hàm, và chứng minh kết quả với `wasm-objdump -d`.
- Duyệt metadata ECMA-335 của một assembly .NET từ thư mục dữ liệu PE đến các hàng `MethodDef` và CIL của mỗi phương thức, được kiểm tra với thư viện đọc mà ILSpy dùng.
- Đo, cho một hàm trong năm container, mỗi định dạng giữ những tên, kiểu, và cấu trúc điều khiển nào và mất những gì.

## The Problem

Bạn dựng `ledger.py` và tìm thấy `ledger.cpython-314.pyc` trong `__pycache__`. Bạn hỏi một agent tệp chứa gì. Agent chạy một trình dịch ngược. Công cụ in `Unsupported opcode` và một dòng ghi `# WARNING: Decompyle incomplete`. Agent kết luận rằng tệp đã bị làm rối.

Tệp không bị làm rối. Hai byte đầu của nó là `2b 0e`, word little-endian 3627. Đó là số mà CPython 3.14 viết, và các bảng opcode của trình dịch ngược dừng ở 3.13. Công cụ đã lỗi thời. Agent không đọc header, nên nó không thể phân biệt.

Bài 33 cho thấy mã native mất gì: tên tham số, kiểu, và `switch` đã trở thành một bảng nhảy. Các container bytecode mất ít hơn, và mỗi loại mất thứ khác nhau. Một pyc giữ mọi tên biến và không kiểu nào. Một tệp class giữ các kiểu và chỉ giữ tên cục bộ khi bạn yêu cầu. Một mô-đun Wasm giữ cấu trúc điều khiển và bỏ các tên trừ khi một section tùy chỉnh mang chúng. Một assembly .NET giữ tên tham số trong một bảng và để các tên cục bộ cho một tệp riêng. Bạn không thể đánh giá đầu ra của một trình dịch ngược trên bất kỳ loại nào trong số chúng cho đến khi bạn biết container ban đầu có những ghi chú nào.

Bài học này dựng bốn bộ đọc trong thư viện chuẩn Python. Mỗi bộ đọc đọc container từ byte đầu tiên của nó, liệt kê một hàm, và được kiểm tra với công cụ riêng của định dạng trên các fixture bạn đã dựng. Mục cuối đặt `grade` từ `ledger` cạnh nhau trong cả năm container.

```figure
re-43-five-containers
```

## The pyc Header Is Four Words

PEP 552 định nghĩa header là bốn word 32 bit. Đầu tiên là số magic. Thứ hai là một trường bit. Bit 0 được đặt nghĩa là tệp dựa trên hash. Bit 1 được đặt nghĩa là `check_source`: trình thông dịch hash mã nguồn khi import và so sánh. Khi bit 0 không được đặt, các word thứ ba và thứ tư là mtime mã nguồn và kích thước mã nguồn. Khi bit 0 được đặt, chúng giữ một SipHash 64 bit của mã nguồn.

Số magic nằm trong `Include/internal/pycore_magic_number.h`. Quy tắc của nó từ 3.11 là Python 3.n bắt đầu tại 2900 + 50n, và mỗi thay đổi bytecode trong một chu kỳ phát hành cộng thêm một. Token được lưu là số 16 bit theo sau bởi `\r\n`, nên một pyc được mở ở chế độ văn bản nhận một magic sai. Các giá trị cuối cùng là 3495 cho 3.11, 3531 cho 3.12, 3571 cho 3.13, 3627 cho 3.14, và 3666 cho 3.15. Python 3.15.0 được phát hành vào 2026-10-09 và không được cài trên máy đã dựng các fixture này, nên số của nó đến từ tệp header chứ không từ một tệp ở đây.

Các fixture giữ hai tệp pyc cho mỗi trình thông dịch. `compile_pyc.py` viết chúng bằng `py_compile.compile(..., dfile="ledger.py")` để tên tệp được lưu là `ledger.py` chứ không phải đường dẫn của máy dựng. 16 byte đầu tiên của các tệp 3.14:

```text
checked-hash   2b 0e 0d 0a  03 00 00 00  c7 16 c7 fc c5 1d 81 01
timestamp      2b 0e 0d 0a  00 00 00 00  8d 60 cf 6a  f1 01 00 00
```

Đọc header timestamp từng word. `03 00 00 00` hoặc `00 00 00 00` là word cờ. `8d 60 cf 6a` là 0x6acf608d = 1791975565, mtime của `ledger.py` khi tệp được dựng. `f1 01 00 00` là 497, kích thước mã nguồn. Thay vào đó tệp checked-hash mang các cờ 3 và tám byte hash. Bốn trình thông dịch thống nhất về mọi thứ trong header trừ word magic:

| Trình thông dịch | Các byte magic | Word | Số byte tệp | Số byte `grade.co_code` | Số lệnh `grade` |
|---|---|---|---|---|---|
| 3.11.14 | `a7 0d 0d 0a` | 3495 | 1054 | 80 | 31 |
| 3.12.12 | `cb 0d 0d 0a` | 3531 | 937 | 62 | 26 |
| 3.13.12 | `f3 0d 0d 0a` | 3571 | 943 | 70 | 26 |
| 3.14.6 | `2b 0e 0d 0a` | 3627 | 965 | 96 | 35 |

`read_pyc_header()` trong `code/main.py` trả về các trường này và nêu phiên bản từ word. `importlib.util.MAGIC_NUMBER` cho cùng bốn byte cho trình thông dịch đang chạy. `python3 code/main.py compare` biên dịch mã nguồn với mọi `python3.11` đến `python3.15` được tìm thấy trên `PATH`. Với mỗi trình nó in header mà bộ đọc của chúng ta thấy bên cạnh các thông tin mà trình thông dịch đó báo cáo về chính nó.

## Marshal Writes the Code Object Field by Field

Byte 16 của mọi fixture là `e3`. Đó là `0x80 | ord('c')`: mã kiểu marshal cho một đối tượng mã với `FLAG_REF` được đặt, bảo bộ đọc nhớ đối tượng cho các tham chiếu `r` sau này. Tài liệu marshal nói định dạng được cố ý không ghi tài liệu và các đối tượng mã không tương thích giữa các phiên bản. Cả hai phát biểu đều đúng, và định dạng vẫn đủ nhỏ để đọc. `Python/marshal.c` liệt kê các mã kiểu: `N` None, `i` một int 32 bit, `s` bytes, `z` và `Z` các chuỗi ASCII ngắn, `(` và `)` các tuple, `c` một đối tượng mã, `r` một tham chiếu ngược. Các container dành ô tham chiếu của chúng trước các phần tử con, nên bộ đọc làm tương tự.

`w_complex_object()` viết một đối tượng mã theo một thứ tự cố định. Với 3.11 đến 3.15 đó là `argcount`, `posonlyargcount`, `kwonlyargcount`, `stacksize`, `flags` dưới dạng các int 32 bit, rồi `code`, `consts`, `names`, `localsplusnames`, `localspluskinds`, `filename`, `name`, `qualname` dưới dạng các đối tượng, rồi `firstlineno`, rồi `linetable` và `exceptiontable`. Giải mã đối tượng mã mô-đun của tệp 3.14 bằng tay từ byte 17:

```text
00 00 00 00   argcount 0
00 00 00 00   posonlyargcount 0
00 00 00 00   kwonlyargcount 0
01 00 00 00   stacksize 1
00 00 00 00   flags 0
f3 22 00 00 00   type 's' with FLAG_REF, 34 bytes of co_code follow
80 00  52 06  74 00  52 01  17 00  74 01 ...
```

Các byte mã là hai byte mỗi lệnh: `80 00` là `RESUME 0`, `52 06` là `LOAD_CONST 6`, `74 00` là `STORE_NAME 0`, và `17 00` là `MAKE_FUNCTION`. Bản liệt kê 3.14 trong các fixture in cùng năm câu lệnh cấp mô-đun. Sau `code` đến các hằng số, giữ bốn đối tượng mã lồng nhau, và sau chúng là `names`: `('LABELS', 'percent_change', 'grade', 'total', 'grade_label')`.

`Unmarshaller` trong `code/main.py` đọc bố cục này và bố cục cũ hơn mà 3.9 và 3.10 dùng, nơi `nlocals`, `varnames`, `freevars`, và `cellvars` là các trường riêng. Nó dựng một `CodeObject` với cùng các tên thuộc tính mà đối tượng thật có. `varnames` lọc `localsplusnames` theo bit `CO_FAST_LOCAL` của `localspluskinds`. Với `grade` trong mỗi tệp của bốn tệp, nó trả về `('score', 'bucket')`, `firstlineno` 10, và một `linetable` không rỗng. Kiểm thử `test_unmarshaller_agrees_with_the_running_interpreter` so sánh mọi trường với `marshal.loads()` trên tệp mà trình thông dịch đang chạy đã viết. Ba tệp còn lại đọc được bằng mã của chúng ta và không đọc được bằng `marshal` dưới trình thông dịch này.

## Four Interpreters, Four Bytecodes for grade

Tài liệu dis mang một cảnh báo trên mọi phiên bản: bytecode là một chi tiết triển khai của CPython và không có bảo đảm rằng nó giữ nguyên. Các fixture cho thấy điều đó nghĩa là gì cho mười một dòng Python. `python3.1N -m dis ledger.py` được thu lại cho mỗi trình thông dịch.

Trong 3.11 `grade` bắt đầu như thế này:

```text
 11           2 LOAD_FAST                0 (score)
              4 LOAD_CONST               1 (10)
              6 BINARY_OP                2 (//)
             10 STORE_FAST               1 (bucket)
 12          12 LOAD_FAST                1 (bucket)
             14 LOAD_CONST               2 (9)
             16 COMPARE_OP               5 (>=)
             22 POP_JUMP_FORWARD_IF_FALSE     2 (to 28)
```

`BINARY_OP` nằm tại độ lệch 6 và lệnh tiếp theo tại 10. Hai byte giữa chúng là một mục inline cache từ PEP 659, trình thông dịch thích nghi chuyên biệt hóa. `COMPARE_OP` tại 16 được theo sau bởi 22, nên nó sở hữu hai mục cache. Các cache bị ẩn trừ khi bạn truyền `show_caches=True`. 3.12 thay `LOAD_CONST` cộng `RETURN_VALUE` bằng `RETURN_CONST`, đổi tên bước nhảy thành `POP_JUMP_IF_FALSE`, và thu nhỏ `grade` từ 80 xuống 62 byte. 3.13 in các nhãn `L1` đến `L4` thay vì các độ lệch và cung cấp cho CLI `-C` cho cache và `-O` cho độ lệch. 3.14 lại loại bỏ `RETURN_CONST`, thêm `LOAD_SMALL_INT` và `LOAD_FAST_BORROW`, và chèn `NOT_TAKEN` sau mỗi bước nhảy có điều kiện:

```text
 12         20       LOAD_FAST_BORROW         1 (bucket)
            22       LOAD_SMALL_INT           9
            24       COMPARE_OP             188 (bool(>=))
            26       CACHE                    0 (counter: 0)
            28       POP_JUMP_IF_FALSE        3 (to L1)
            30       CACHE                    0 (counter: 0)
            32       NOT_TAKEN
```

Bản liệt kê `-C -O` hiển thị 13 mục `CACHE` bên trong `grade`: năm sau `BINARY_OP`, một sau mỗi `COMPARE_OP`, một sau mỗi `POP_JUMP_IF_FALSE`. Fixture thích nghi cho thấy các cache dùng để làm gì. Sau 200 lời gọi, `dis.dis(grade, adaptive=True)` in `RESUME_CHECK` và `COMPARE_OP_INT` tại nơi bản liệt kê thông thường có `RESUME` và `COMPARE_OP`, và `total` hiển thị `FOR_ITER_LIST`, `BINARY_OP_ADD_INT`, và `JUMP_BACKWARD_NO_JIT`. Các dạng chuyên biệt hóa nằm trong cùng các byte `co_code`. Một pyc không bao giờ chứa chúng, vì sự chuyên biệt hóa xảy ra trong bộ nhớ.

Đây là lý do các trình dịch ngược có mức trần phiên bản. uncompyle6 3.9.3 nói rằng nó chấp nhận bytecode từ Python 1.0 đến 3.8. decompyle3 3.9.3 đọc 3.7 và 3.8. xdis 6.3.0, trình disassemble xuyên phiên bản đằng sau cả hai, đọc đến 3.13. pycdc có các bảng opcode đến `python_3_13.cpp` trong tệp dựng của nó, và khi gặp một opcode không biết in `Unsupported opcode` và đánh dấu đầu ra là chưa hoàn chỉnh. PyLingual tuyên bố mọi phiên bản đã phát hành từ 3.6 và dùng các trình thông dịch từ 3.8 đến 3.15 để biên dịch lại và kiểm tra đầu ra của chính nó. Với một tệp 3.14, ba công cụ đầu từ chối hoặc thất bại, và chỉ hai công cụ cuối áp dụng được. Đọc word magic trước khi bạn chọn một công cụ.

## The Class File Keeps a Dictionary of Itself

JVMS Java SE 25, mục 4.1, cho bố cục dưới dạng một cấu trúc: `magic`, `minor_version`, `major_version`, `constant_pool_count`, constant pool, `access_flags`, `this_class`, `super_class`, các interface, các trường, các phương thức, các thuộc tính. Magic là `0xCAFEBABE`. Một máy ảo Java SE 25 chấp nhận các phiên bản major 45 đến 69, và một minor 65535 đánh dấu một tệp có tính năng preview. Mười byte đầu của `Ledger-g.class` là `ca fe ba be 00 00 00 41 00 5e`: major 65 là Java 21, và `0x5e` = 94 là số lượng constant pool. `Ledger-jdk25.class`, được dựng bằng javac 25.0.2 từ cùng mã nguồn, bắt đầu bằng `ca fe ba be 00 00 00 45`: major 69.

Constant pool là nơi tệp class giữ từ điển riêng của nó. Mục `#13` trong bản dựng `-g` là một `Methodref` trỏ đến lớp `#8` và tên-và-kiểu `#14`. Đi theo các chỉ mục cho `Ledger.grade:(I)I`, đúng là thứ `javap -v` in sau `//`. Descriptor `(I)I` là một tham số `int` và một kết quả `int`. `([I)I` trên `total` nói tham số là một mảng `int`. Mọi phương thức, trường, và lớp mà mã chạm đến đều có một mục như vậy, và bộ xác minh trong mục 4.10 từ chối một tệp có các lệnh không thống nhất với chúng. Lớp `ClassFile` trong `code/main.py` đọc cả 17 tag hằng từ bảng 4.4 và coi một `Long` hoặc `Double` là hai ô. Nó phát sinh ngoại lệ khi gặp một tag không biết và khi có các byte sau thuộc tính cuối cùng.

Các thuộc tính gắn vào lớp, mỗi trường, mỗi phương thức, và chính thuộc tính `Code`. JVMS nói máy ảo phải bỏ qua các thuộc tính nó không biết, đó là lý do các bảng gỡ lỗi có thể được thêm hoặc bỏ mà không thay đổi thân phương thức. Hướng dẫn javac nói `-g` tạo mọi thông tin gỡ lỗi bao gồm các biến cục bộ, mặc định chỉ tạo các số dòng và tệp nguồn, và `-g:none` không tạo gì. Ba bản dựng đo điều đó:

| Bản dựng | Byte | Số lượng constant pool | `LineNumberTable` | `LocalVariableTable` | `SourceFile` | Số byte mã `grade` |
|---|---|---|---|---|---|---|
| `javac -g` | 1832 | 94 | 7 phương thức | 6 phương thức | có | 50 |
| `javac` | 1581 | 82 | 7 phương thức | không có | có | 50 |
| `javac -g:none` | 1404 | 79 | không có | không có | không | 50 |

50 byte mã của `grade` giống hệt nhau trong cả ba tệp, và kiểm thử kiểm tra điều đó. Thứ `-g` thêm cho `grade` là một hàng `LocalVariableTable`: bắt đầu 0, độ dài 50, ô 0, tên `score`, descriptor `I`. Không có nó một trình dịch ngược thấy ô 0 có kiểu `int` và phải bịa ra một tên. `StackMapTable` ở lại trong mọi bản dựng vì bộ xác minh cần nó, và thuộc tính `BootstrapMethods` ở lại vì `main` nối các chuỗi qua `invokedynamic`.

## Decode tableswitch by Hand

Chương 6 của JVMS định nghĩa mỗi lệnh là một byte opcode và các toán hạng mà opcode đó nêu. Các độ lệch nhánh là các giá trị có dấu 16 bit tương đối với địa chỉ của opcode nhánh, khác với x86-64, nơi displacement tương đối với lệnh tiếp theo. `tableswitch` và `lookupswitch` bắt đầu bằng không đến ba byte đệm để các toán hạng 32 bit của chúng bắt đầu tại một địa chỉ là bội số của bốn.

Các byte của `grade` từ pc 4 trong `Ledger-g.class`:

```text
aa                 tableswitch at pc 4
00 00 00           padding to pc 8
00 00 00 2c        default: 4 + 44 = 48
00 00 00 06        low 6
00 00 00 0a        high 10
00 00 00 2a        case 6:  4 + 42 = 46
00 00 00 28        case 7:  4 + 40 = 44
00 00 00 26        case 8:  4 + 38 = 42
00 00 00 24        case 9:  4 + 36 = 40
00 00 00 24        case 10: 4 + 36 = 40
```

Ba mươi sáu byte, một lệnh, và toàn bộ `switch (score / 10)` với case dùng chung cho 9 và 10. Bản dựng native của cùng `switch` trong bài 33 cần một phép kiểm tra cận, một `lea`, một `movslq`, một `add`, một bước nhảy gián tiếp, và năm relocation trong một section khác. Ở đây các đích nằm trong lệnh, và cả thông tin rằng chúng thuộc về nhau cũng vậy.

`disassemble_jvm()` bao quát cả 202 opcode được định nghĩa với các độ rộng toán hạng của chúng, tuân theo quy tắc đệm, và kết xuất các toán hạng theo cách `javap` làm. `compare_with_javap()` phân tích văn bản `javap -c -p` đã thu lại, bao gồm khối `tableswitch` nhiều dòng, và kiểm tra độ lệch, mnemonic, và toán hạng cho mọi lệnh. Cả bốn bản dựng thống nhất trên 108 trên 108 lệnh. Kiểm thử `test_branch_offsets_are_relative_to_the_branch_instruction` kiểm tra `ifne` tại pc 1 đến 6, `if_icmpge` tại 13 đến 33, và `goto` tại 30 quay lại 10.

radare2 6.2.4, được dựng từ mã nguồn cho các bài học này, đọc cùng tệp. `rabin2 -I` báo cáo `arch java`, `lang java 21`, `linenum true`, và `lsyms true`, là cách nó đọc phiên bản và hai bảng gỡ lỗi. `pd 14 @ sym.Ledger.grade` in `tableswitch` với các mũi tên tới năm đích của nó. Nó cũng in `Unable to parse code attribute: 2` trên tệp này, là một giới hạn mà công cụ tự nêu và một lý do để giữ `javap` làm oracle. Các trình dịch ngược cho định dạng này trưởng thành khi so với Python. CFR 0.152 được cấp phép MIT. Procyon 0.6.0 và Vineflower 1.12.0 là Apache-2.0, và Vineflower là một fork Fernflower có hỗ trợ Java 21. Bản thân Fernflower nằm trong kho IntelliJ Community. JADX 1.5.6 bao quát định dạng Android DEX, và JD-GUI có bản phát hành cuối vào năm 2019. Harrand, Soto-Valero, Monperrus, và Baudry đo tám công cụ trong số chúng vào năm 2020. Công cụ tốt nhất tạo đầu ra đúng cú pháp cho 84 phần trăm các lớp và đầu ra tương đương ngữ nghĩa cho 78 phần trăm. Meta-decompiler của họ khôi phục 37.6 phần trăm các lớp mà không công cụ đơn lẻ nào xử lý được. Các kiểu, tên, và stack được xác minh khiến định dạng có thể dịch ngược. Chúng không khiến bất kỳ một trình dịch ngược nào trở nên hoàn chỉnh.

## A Wasm Module Is a List of Sections

Đặc tả lõi định nghĩa một mô-đun là phần mở đầu `00 61 73 6d 01 00 00 00`, chuỗi `\0asm` và phiên bản 1, theo sau bởi các section. Mỗi section là một byte id, một kích thước `u32` trong LEB128, và nội dung của nó. Các id 1 đến 13 là các section đã biết, mỗi section tối đa một lần và theo thứ tự. Id 0 là một section tùy chỉnh có tên, được phép ở bất kỳ đâu. Mọi số nguyên đều là LEB128, nên `e4 00` là 100 và `80 08` là 1024. `wasm-objdump -h` trên `ledger.wasm` liệt kê bảy section, và `WasmModule` tìm thấy cùng bảy section với cùng các độ lệch payload:

| Section | Payload | Số lượng | Nó giữ gì cho ledger |
|---|---|---|---|
| Type | 10 đến 26 | 3 | `(i32) -> nil`, `(i32, i32) -> i32`, `(i32) -> i32` |
| Import | 28 đến 39 | 1 | `env.log` với kiểu 0 |
| Function | 41 đến 46 | 4 | chỉ mục kiểu cho mỗi hàm được định nghĩa |
| Memory | 48 đến 51 | 1 | một trang, không có tối đa |
| Export | 53 đến 110 | 5 | `memory` và bốn tên hàm |
| Code | 113 đến 271 | 4 | các thân 23, 63, 44, và 23 byte |
| Data | 273 đến 290 | 1 | `F\0D\0C\0B\0A\0` tại độ lệch 1024 |

Sự tách biệt giữa các section Function và Code tồn tại để một trình duyệt có thể bắt đầu biên dịch trước khi toàn bộ tệp đến. Mỗi mục code là một kích thước, một vector các khai báo cục bộ, và một biểu thức. Với `grade` vector locals là `01 7f`: một nhóm của một `i32`. Đó là `bucket`, với kiểu của nó và không có tên của nó.

Luồng điều khiển có cấu trúc ngay từ cách xây dựng. Đặc tả nói các nhánh chỉ có thể nhắm đến các cấu trúc `block`, `loop`, hoặc `if` bao quanh. Các nhãn được đánh chỉ mục theo độ sâu lồng nhau. `br_table` thực hiện một nhánh gián tiếp qua một toán hạng đánh chỉ mục một danh sách nhãn. Giải mã switch của `grade` tại độ lệch tệp `0xa3`:

```text
0e                  br_table
0b                  11 labels follow
04 04 04 04 04 04   buckets 0 to 5: label 4, the outermost block, returns 0
03 02 01 00         buckets 6, 7, 8, 9: labels 3, 2, 1, 0
00                  bucket 10: label 0, shared with 9
04                  default label 4
```

Mỗi nhãn là một độ sâu. Nhãn 0 là `block` trong cùng, và mã sau `end` của nó là `i32.const 4` theo sau bởi `br 4` ra khỏi khối kết quả. Sáu lệnh `block` trước bảng, mười một nhãn, và năm lệnh `br` sau nó là toàn bộ `switch`, và một bộ xác thực từ chối bất kỳ nhánh nào rời khỏi cấu trúc. `disassemble_wasm()` theo dõi độ sâu để bản liệt kê thụt lề như `wasm-objdump`, bao quát mọi opcode một byte từ `unreachable` đến `i64.extend32_s`, và khớp với `wasm-objdump -d` đã thu lại trên 77 trên 77 lệnh cho cả hai bản dựng.

Các tên là thứ duy nhất một mô-đun thông thường bỏ đi. `wasm-objdump` vẫn in `<grade>` vì section Export ánh xạ chuỗi đó đến chỉ mục hàm 2, và bộ đọc làm tương tự. Các tên cục bộ không tồn tại ở đâu trong tệp 290 byte. `wat2wasm --debug-names` thêm một section tùy chỉnh có tên `name` với các subsection cho tên mô-đun, tên hàm, và tên cục bộ. Tệp tăng lên 425 byte. Bộ đọc tìm thấy `{0: 'score', 1: 'bucket'}` cho hàm 2 và `{0: 'values', 1: 'count', 2: 'sum', 3: 'i'}` cho hàm 3. `wasm-strip` lại loại bỏ section. Kho tool-conventions mô tả thêm hai phương tiện mang. DWARF có thể được nhúng dưới dạng các section tùy chỉnh `.debug_*`. Một section tùy chỉnh `sourceMappingURL` có thể trỏ đến một source map có các số cột là các độ lệch byte vào tệp nhị phân.

Các công cụ đã thay đổi trong năm 2026. wabt 1.0.42, được phát hành 2026-09-15, loại bỏ `wasm-decompile`, và bản dựng Homebrew trên máy này có đúng mười một công cụ còn lại. wasm-tools 1.261.0 cung cấp `print`, `objdump`, và `demangle`. Binaryen version_133 cung cấp `wasm-dis`. radare2 6.2.4 cũng đọc mô-đun. `rabin2 -I` của nó nói `arch wasm`. Ký hiệu của nó cho `grade` bắt đầu tại `0x8e`, nơi vector locals bắt đầu, trong khi `wasm-objdump` gắn nhãn hàm tại `0x8b`, nơi trường kích thước của nó bắt đầu. Bản liệt kê của nó dùng các mnemonic cũ hơn `get_local`, `set_local`, và `brtable 11 4 4 ...` với số lượng nhãn được in. Các byte giống nhau trong cả ba công cụ và cách viết khác nhau, nên một phép so sánh phải nêu công cụ mà nó được thu lại bằng. Nghiên cứu cho bài học này không tìm thấy mô-đun bộ xử lý WebAssembly trong thư mục bộ xử lý của Ghidra, và bản liệt kê đó không được đọc đầy đủ. ghidra-wasm-plugin v2.4.0 của bên thứ ba nhắm đến Ghidra 12.0. Bản thân đặc tả là một tài liệu sống. Trang W3C cho `wasm-core-2` là một Candidate Recommendation Draft ngày 13 tháng 10 năm 2026 có phần tóm tắt mô tả bản phát hành 3.0, và bản thảo của các biên tập viên mang cùng ngày.

## ECMA-335 Metadata Is the Program's Own Database

Một assembly .NET là một tệp PE. `LedgerNet.dll` bắt đầu bằng `MZ`, có ba section tên `.text`, `.rsrc`, và `.reloc`, và khai báo machine `0x14c` vì trình biên dịch đã phát ra mã trung lập nền tảng. Thư mục dữ liệu 14 của optional header, CLR Runtime Header, trỏ đến RVA `0x2008`. ECMA-335 II.25.3.3 định nghĩa 72 byte ở đó:

```text
48 00 00 00   Cb 72
02 00 05 00   MajorRuntimeVersion 2, MinorRuntimeVersion 5
78 21 00 00   MetaData RVA 0x2178
84 07 00 00   MetaData size 1924
01 00 00 00   Flags: COMIMAGE_FLAGS_ILONLY
05 00 00 06   EntryPointToken 0x06000005, MethodDef row 5, which is Main
```

Gốc metadata tại RVA `0x2178` bắt đầu bằng chữ ký `42 53 4a 42`, đọc là `BSJB`, rồi phiên bản 1.1 và chuỗi `v4.0.30319`. Năm header stream theo sau: `#~` tại độ lệch `0x6c`, rồi `#Strings`, `#US`, `#GUID`, và `#Blob`. II.24.2 nói mỗi loại stream xuất hiện tối đa một lần. Stream `#~` bắt đầu bằng một byte `HeapSizes`, bằng không ở đây, nên mọi chỉ mục string, GUID, và blob rộng hai byte, và một mask `Valid` 64 bit nêu các bảng có mặt. Mười bốn bit được đặt:

| Bảng | Id | Số hàng | Kích thước hàng | Các hàng nói gì |
|---|---|---|---|---|
| Module | 0x00 | 1 | 10 | tên mô-đun và GUID của nó |
| TypeRef | 0x01 | 21 | 6 | `System.Object`, `System.Console`, 19 mục nữa |
| TypeDef | 0x02 | 4 | 14 | `<Module>`, `Ledger`, và hai thành phần trợ giúp trình biên dịch |
| Field | 0x04 | 2 | 6 | `Labels` và một phần khởi tạo mảng tĩnh |
| MethodDef | 0x06 | 6 | 14 | năm phương thức và `.cctor` |
| Param | 0x08 | 5 | 6 | `before`, `after`, `score`, `values`, `score` |
| MemberRef | 0x0a | 16 | 6 | 12 hàm khởi tạo thuộc tính và 4 phương thức mà `Main` gọi |
| CustomAttribute | 0x0c | 12 | 6 | các thuộc tính mà trình biên dịch và SDK thêm |
| StandAloneSig | 0x11 | 3 | 2 | ba chữ ký biến cục bộ |
| Assembly, AssemblyRef, ClassLayout, FieldRva, NestedClass | | 1, 2, 1, 1, 1 | | danh tính, các tham chiếu, bố cục |

Một kích thước hàng không được lưu ở đâu cả. II.22 cho mỗi cột một loại, và II.24.2.6 cho quy tắc tính kích thước. Một chỉ mục heap dài hai hoặc bốn byte theo `HeapSizes`. Một chỉ mục bảng đơn giản dài hai byte khi bảng đó có ít hơn 65536 hàng. Một chỉ mục mã hóa có thể trỏ vào n bảng với b bit tag dài hai byte khi mỗi bảng trong số đó có ít hơn 2^(16-b) hàng. `CliAssembly` tính 14 kích thước hàng từ các quy tắc này và các số hàng. Bản dump System.Reflection.Metadata trong các fixture báo cáo cùng các kích thước và cùng các độ lệch bảng, là cách kiểm thử chứng minh phép tính.

III.1.9 định nghĩa token: byte cao là bảng, ba byte thấp là hàng đánh số từ 1. `0x06000002` là `MethodDef` hàng 2. Hàng đó có RVA `0x2060`, tên `Grade`, và một blob chữ ký `00 01 08 08`: quy ước gọi mặc định, một tham số, trả về `int32`, tham số `int32`. `ParamList` của nó trỏ đến hàng 3 của `Param`, có tên là `score`. Bảng Param là lý do ILSpy có thể in `Grade(int score)` từ một bản dựng release đã strip. Tại RVA `0x2060` thân phương thức bắt đầu bằng một fat header:

```text
13 30         flags 0x13: fat, init locals; size 3 dwords
02 00         MaxStack 2
2d 00 00 00   CodeSize 45
01 00 00 11   LocalVarSigTok 0x11000001
```

`StandAloneSig` hàng 1 giữ `07 01 08`: `LOCAL_SIG`, một biến cục bộ, `int32`. Biến cục bộ có một kiểu và không có tên. ECMA-335 giữ các tên cục bộ trong định dạng trao đổi gỡ lỗi của Partition V, và .NET SDK viết chúng vào một PDB. Fixture này được dựng với `DebugType` none, nên không bảng nào và không tệp nào mang tên `bucket`. Thay vào đó `PercentChange` có một tiny header: byte đầu của nó `3a` là `0x0e << 2 | 2`, một thân 14 byte không có biến cục bộ và một stack mặc định 8.

45 byte mã của `Grade` được giải mã bằng bảng opcode Partition III. `switch` là opcode `0x45` theo sau bởi một số lượng `u32` và chừng ấy đích `int32` tương đối với lệnh sau bảng:

```text
IL_0000: 02           ldarg.0
IL_0001: 1f 0a        ldc.i4.s 10
IL_0003: 5b           div
IL_0004: 0a           stloc.0
IL_0005: 06           ldloc.0
IL_0006: 1c           ldc.i4.6
IL_0007: 59           sub
IL_0008: 45 05 00 00 00 08 00 00 00 06 00 00 00 04 00 00 00 02 00 00 00 02 00 00 00
                      switch (IL_0029, IL_0027, IL_0025, IL_0023, IL_0023)
IL_0021: 2b 08        br.s IL_002b
IL_0023: 1a 2a        ldc.i4.4, ret
```

Trình biên dịch đã trừ 6 trước `switch`, nên case 6 là đích đầu tiên. `disassemble_cil()` kết xuất các token qua các bảng: `ldsfld Labels`, `call Grade`, `call System.Console::WriteLine`, và `ldstr ' '` từ heap `#US`. Oracle cho tất cả điều này là `MetaDump`, một chương trình C# ngắn trong các fixture được dựng trên `System.Reflection.Metadata`, thư viện bên trong ILSpy. Nó in số hàng, kích thước, và độ lệch của mọi bảng, RVA, chữ ký, tên tham số, và các byte IL của mọi phương thức, và 226 trường của `System.Reflection.Emit.OpCodes`. `compare_with_metadump()` thống nhất trên cả 246 phép kiểm tra. Bảng runtime có 218 opcode cộng tám placeholder `prefix`. Bảng của bài học có 219 mục vì nó bao gồm `no.` từ III.2.2, điều mà bảng Emit chưa bao giờ có.

Các công cụ cho định dạng: ILSpy 11.0 (MIT, được phát hành 2026-08-12) chạy trên macOS qua bản dựng desktop Avalonia của nó. `ilspycmd` 11.1.0.9782 in IL với `-il` và chọn một phương thức theo token với `-m 0x06000002`. dnSpyEx 6.6.0 tiếp nối dnSpy chỉ trên Windows. Trình disassemble IL `ildasm` được cung cấp dưới dạng các gói NuGet thay vì bên trong SDK. radare2 6.2.4 cũng đọc metadata: `rabin2 -I` nói `arch cil` và `class PE32`, và `is` liệt kê `Ledger.Grade(int:score):int` với tên tham số và cả hai kiểu được lấy từ các bảng Param và chữ ký. Nó không có trình disassemble CIL trong bản dựng này. Fixture này được dựng bằng .NET SDK 8.0.205 vì đó là SDK được cài trên máy dựng. .NET 10 đã là phiên bản hiện hành từ 2025-11-11 và viết cùng các cấu trúc ECMA-335.

## What Each Container Keeps

Đặt `grade` từ cả năm container vào một bảng. Mỗi hàng đến từ `python3 code/main.py keeps`, chạy các bộ đọc trên các fixture:

| Container | Số byte thân | Tên hàm | Tên tham số | Kiểu tham số và trả về | Tên cục bộ | Số dòng | Luồng điều khiển |
|---|---|---|---|---|---|---|---|
| Tệp đối tượng ELF, clang -O0 | 118 | `grade` trong `.symtab` | không có | không có | không có | không có, không có các section `.debug_*` | 5 bước nhảy và 1 bước nhảy gián tiếp qua một bảng relocation |
| CPython 3.14 pyc | 96 | `co_qualname` | `score` | không có | `bucket` | `co_linetable`, dòng đầu 10 | 4 cặp so sánh và `POP_JUMP_IF_FALSE` |
| Class JVM, `javac -g` | 50 | constant pool | `score` trong `LocalVariableTable` | `(I)I` | không có ngoài tham số | `LineNumberTable`, 6 hàng | 1 `tableswitch` |
| WebAssembly | 63 | section Export | chỉ khi có một section name | `(i32) -> i32` | chỉ khi có một section name | không có | 6 khối lồng nhau, 1 `br_table`, 4 `br` |
| Assembly .NET | 45 | `MethodDef` | `score` trong `Param` | `static int32(int32)` | không có, chỉ có kiểu trong `StandAloneSig` | không có nếu không có PDB | 1 `switch`, 1 `br.s` |

Bảng giải thích các kết quả trình dịch ngược mà bạn sẽ thấy. Bài 34 so sánh `int total(const int *, int)` với `int total(long param_1, uint param_2)` mà Ghidra suy ra từ mã native, vì mã native không giữ cột nào trong số này. Một pyc giữ mọi tên và không kiểu nào, và luồng điều khiển của nó là các bước nhảy có hình dạng thay đổi mỗi bản phát hành, nên các trình dịch ngược Python hỏng theo phiên bản và khôi phục các tên miễn phí. Một tệp class giữ các kiểu và stack đã xác minh, giữ các tên khi bật `-g`, và biểu diễn `switch` thành một lệnh. Một mô-đun Wasm giữ cấu trúc ngay từ cách xây dựng, nên `wasm2wat` là một vòng chuyển đổi không mất mát và sự mất mát duy nhất là các tên. Một assembly .NET giữ mô tả đầy đủ nhất, vì các bảng metadata mang tính quy phạm, và vẫn cần một PDB cho tên của một biến cục bộ.

Bảng cho bạn biết trình dịch ngược đã có gì để làm việc, và đầu ra nào của nó sao chép một thông tin được lưu và đầu ra nào suy ra một thông tin. Một tên tham số trong đầu ra ILSpy là một bản sao. Một tên cục bộ trong cùng đầu ra là một suy luận trừ khi có một PDB. Bài 35 ghi lại sự khác biệt đó là thẩm quyền của mỗi khẳng định.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
```

Đầu ra là một báo cáo JSON. Với mỗi pyc nó cho cả hai header, các kích thước tệp và `grade`, số lệnh và các tên opcode từ bản liệt kê đã thu lại, và liệu trình thông dịch đang chạy có thể đọc nó hay không. Với mỗi bản dựng class nó cho phiên bản, các kích thước, các số lượng bảng gỡ lỗi, và sự thống nhất `javap`. Với mỗi bản dựng Wasm nó cho các section, kiểu, hàm, nội dung section name, và sự thống nhất `wasm-objdump`. Với assembly nó cho header CLI, các stream, các số hàng bảng, các phương thức, và sự thống nhất System.Reflection.Metadata. Nó kết thúc bằng bảng keeps và danh sách các trình thông dịch được tìm thấy trên `PATH`.

Đọc `code/main.py` theo thứ tự này:

1. `Reader` giữ con trỏ vị trí và các độ rộng số nguyên. `uleb()` và `sleb()` là các bộ đọc LEB128 mà Wasm và heap blob .NET cần.
2. `read_pyc_header()`, `Unmarshaller`, và `PycFile` đọc một pyc. `parse_dis_text()` đọc các bản liệt kê `dis` đã thu lại để phép so sánh xuyên phiên bản không cần bốn trình thông dịch lúc kiểm thử.
3. `ClassFile` đọc tệp class và `disassemble_jvm()` giải mã mã của nó. `parse_javap_code()` và `compare_with_javap()` là phép kiểm tra oracle.
4. `WasmModule` đọc các section và `disassemble_wasm()` giải mã một biểu thức cùng độ sâu của nó. `compare_with_wasm_objdump()` là phép kiểm tra oracle.
5. `CliAssembly` duyệt PE, header CLI, gốc metadata, các stream, và các bảng. `TABLE_SCHEMAS` và `CODED_INDEXES` là II.22 và II.24.2.6 dưới dạng dữ liệu. `disassemble_cil()` giải mã một thân và `compare_with_metadump()` kiểm tra nó.
6. `NativeObject` đọc đủ ELF để liệt kê các ký hiệu hàm và lấy bản liệt kê bài 33 làm văn bản của nó. `what_each_keeps()` và `figure_data()` dựng phép so sánh.

Có thêm năm lệnh. `python3 code/main.py pyc FILE`, `class FILE`, `wasm FILE`, và `dll FILE` in cấu trúc và một bản liệt kê mọi hàm trong một tệp bạn đưa cho chúng. `python3 code/main.py compare` biên dịch `ledger.py` với mọi trình thông dịch trên `PATH` và in những gì mỗi trình đã viết.

## Use It

Dùng các bộ đọc theo thứ tự này trên một container bạn đã dựng.

1. Đọc các byte đầu và nêu định dạng. Hai byte rồi `0d 0a` là một pyc, `ca fe ba be` một tệp class, `00 61 73 6d` một mô-đun, `4d 5a` với thư mục dữ liệu 14 được đặt là một assembly.
2. Đọc header và viết ra phiên bản bên tạo mà nó nêu. Với một pyc đó là word magic, với một tệp class là phiên bản major, với một assembly là các chuỗi phiên bản runtime và metadata.
3. Kiểm tra mọi trình dịch ngược bạn dự định chạy với phiên bản đó trước khi bạn chạy nó. Ghi lại mức trần và nơi công cụ ghi tài liệu về nó.
4. Chạy bộ đọc và công cụ riêng của định dạng trên cùng tệp và so sánh chúng từng hàng. Một sự không khớp là một lỗi trong bộ đọc hoặc một thay đổi trong công cụ, và cả hai đều phải được hiểu trước khi bản liệt kê là bằng chứng.
5. Điền bảng keeps cho hàm bạn quan tâm. Đánh dấu mỗi thông tin là được giữ hoặc bị mất và nêu bảng, thuộc tính, hoặc section mà nó đến từ.
6. Chỉ sau đó đọc đầu ra trình dịch ngược. Đánh dấu mỗi tên và kiểu trong đó là một bản sao của một thông tin được giữ hoặc là một suy luận.

Giữ các tệp văn bản oracle cùng các container. Khi một phiên bản trình thông dịch, JDK, SDK, hoặc wabt thay đổi, dựng lại bằng `build_fixtures.sh` và thu lại, vì một bản liệt kê thay đổi là một fixture thay đổi.

## Interactive Lab

### Lab A: read the header, then the code object

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats/code
python3 -q
```

Chạy:

```python
from main import *
pyc = load_pyc("ledger.cpython-311.pyc")
pyc.header.to_dict()
pyc.module.names
pyc.functions()["grade"].varnames
len(pyc.functions()["grade"].code)
```

Viết ra word magic trước lời gọi đầu tiên. Sau đó nạp `ledger.cpython-314.pyc` và so sánh hai độ dài `code`. Sau đó thử `import marshal; marshal.loads(pyc.data[16:])` trên tệp 3.11 dưới trình thông dịch của bạn và đọc lỗi.

### Lab B: the constant pool chain

```python
cls = load_class("Ledger-g.class")
cls.constant(13)
cls.constant(14)
cls.describe_constant(13)
[row["text"] for row in jvm_listing(cls, "grade")]
```

Đi theo `#13` đến `#8` và `#14`, rồi đến các mục `Utf8`, bằng tay trước khi bạn gọi `describe_constant`. Sau đó nạp `Ledger-gnone.class` và gọi `cls.method("grade").attribute_names()` trên cả hai. Mảng `Code` giống nhau, các thuộc tính thì không.

### Lab C: depth and labels

```python
module = load_wasm("ledger.wasm")
[(row["depth"], row["text"]) for row in wasm_listing(module, "grade")]
module.function_name(2)
load_wasm("ledger-names.wasm").names["locals"][2]
```

Tìm hàng `br_table` và đọc độ sâu của nó. Đếm các hàng `end` sau nó và ghép mỗi hàng với một số nhãn trong bảng. Sau đó mở `ledger.wat` và tìm `block $six` mà nhãn 3 nêu.

### Lab D: from token to bytes

```python
asm = load_assembly("LedgerNet.dll")
asm.method("Grade")
body = asm.method_body(asm.method("Grade")["RVA"])
body.fat, body.max_stack, body.code_size, hex(body.local_signature_token)
asm.token_text(0x11000001)
[row["text"] for row in cil_listing(asm, "GradeLabel")]
```

Tính độ lệch tệp của RVA `0x2060` từ header section `.text` bằng tay và so sánh với `asm.rva_to_offset(0x2060)`. Sau đó tra `asm.row(0x08, 3)` và tìm nơi tên `score` tồn tại.

## Practice Lab

Thêm một ngôn ngữ nguồn thứ năm vào phép so sánh, hoặc một thông tin thứ sáu vào bảng.

Yêu cầu:

- Viết một hàm có một vòng lặp và một biến cục bộ bằng một ngôn ngữ mà bạn có trình biên dịch, ví dụ Kotlin thành một tệp class hoặc Rust thành một mô-đun Wasm. Commit đầu ra và bản liệt kê oracle với lệnh chính xác trong `build_fixtures.sh`.
- Làm cho bộ đọc tương ứng thống nhất với oracle trên mọi lệnh. Chỉ thêm opcode khi fixture cần chúng.
- Mở rộng `what_each_keeps()` với container mới, và với một thông tin nữa cho mọi container: liệu thân có mang một bảng ngoại lệ hoặc vùng `try` hay không.
- Thêm container mới vào `figure_data()` và tạo lại `site/figures-re-43.js`.
- Viết một kiểm thử thất bại khi một bộ đọc báo cáo một thông tin là được giữ mà không nêu bảng, thuộc tính, hoặc section giữ nó.

Thành công nghĩa là `python3 code/main.py keeps` hiển thị hàng mới với bằng chứng cho mọi ô, và mọi phép so sánh oracle vẫn thống nhất.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-bytecode-and-managed-formats.md`. Dùng nó để chuyển một container bytecode thành một báo cáo header, một bản liệt kê đã kiểm tra của một hàm, và một bảng thông tin đánh dấu mỗi tên, kiểu, và cấu trúc là được giữ hoặc bị mất. Nó yêu cầu công cụ riêng của định dạng làm oracle, một phép kiểm tra phiên bản trước bất kỳ trình dịch ngược nào, và một phát biểu về nơi mỗi thông tin bị mất lẽ ra tồn tại.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/43-bytecode-and-managed-formats
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- bốn header pyc mang các word magic 3495, 3531, 3571, và 3627, các cờ 3, và một hash 8 byte, và các tệp timestamp mang các cờ 0, mtime 1791975565, và kích thước 497
- mọi word magic cho 3.11 trở về sau nằm trong phạm vi mà quy tắc `2900 + 50n` cho bản phát hành của nó
- bộ unmarshal trả về cùng các tên, hằng số, byte mã, tên biến, và bảng dòng như `marshal.loads()` trên tệp mà trình thông dịch đang chạy đã viết
- cả bốn tệp giữ các tên mô-đun, `('score', 'bucket')` cho `grade`, dòng đầu 10, và `ledger.py` làm tên tệp
- `grade.co_code` dài 80, 62, 70, và 96 byte trên bốn phiên bản và các bản liệt kê đã thu lại có 31, 26, 26, và 35 lệnh
- bản liệt kê 3.11 có `POP_JUMP_FORWARD_IF_FALSE`, 3.12 và 3.13 có `RETURN_CONST`, và 3.14 có `LOAD_SMALL_INT`, `LOAD_FAST_BORROW`, và `NOT_TAKEN`
- bản liệt kê `-C -O` 3.14 hiển thị 13 mục cache trong `grade`, năm mục trong số đó sau `BINARY_OP`, và bản liệt kê thích nghi hiển thị `COMPARE_OP_INT`
- một header không có `0d 0a`, một header bị cắt ngắn, và một thân không phải đối tượng mã phát sinh `FormatError`
- một bản liệt kê lệnh chỉ tồn tại cho pyc được trình thông dịch đang chạy viết và khớp với đầu ra `dis` đã thu lại
- các tệp class có major 65 hoặc 69, các kích thước 1581, 1832, 1404, và 1581, và các số lượng constant pool 82, 94, 79, và 82
- hằng số `#13` phân giải thành `Method Ledger.grade:(I)I` và `#47` thành `String F`
- trình disassemble JVM thống nhất với `javap -c -p` trên 108 trên 108 lệnh trong cả bốn bản dựng
- `tableswitch` tại pc 4 dài 36 byte với low 6, high 10, default 48, và các đích 46, 44, 42, 40, 40
- ba mức gỡ lỗi thay đổi các số lượng thuộc tính và để 50 byte mã của `grade` giống hệt nhau
- các đích `ifne`, `if_icmpge`, và `goto` tương đối với opcode nhánh
- một magic sai, các byte thừa ở cuối, và một opcode không được định nghĩa phát sinh `FormatError`
- bảy section Wasm có các độ lệch payload mà `wasm-objdump -h` in, và bản dựng names thêm một section tùy chỉnh `name` tại 293 đến 425
- các kiểu, import `env.log`, năm export, và segment dữ liệu tại 1024 được giải mã như được viết trong `ledger.wat`
- trình disassemble Wasm thống nhất với `wasm-objdump -d` trên 77 trên 77 lệnh trong cả hai bản dựng
- `grade` có 6 khối lồng nhau, một `br_table` với các nhãn `4 4 4 4 4 4 3 2 1 0 0` và default 4 tại độ sâu 6, và một biến cục bộ `i32`
- các tên hàm đến từ các export khi không có một section name và các tên cục bộ chỉ khi có nó
- LEB128 `e4 00` là 100, `7f` là -1, `80 08` là 1024, và các kiểu khối kết xuất như `wasm-objdump`
- một phần mở đầu sai, phiên bản 2, và một opcode không biết phát sinh `FormatError`
- assembly là PE32 với machine `0x14c`, header CLI tại RVA `0x2008`, runtime 2.5, `ILONLY`, và điểm vào `0x06000005`
- phiên bản metadata là `v4.0.30319`, năm stream tồn tại, và 14 bảng có các số hàng và kích thước hàng mà oracle báo cáo
- bộ đọc .NET thống nhất với System.Reflection.Metadata trên 246 trên 246 phép kiểm tra
- `Grade` có tham số `score`, chữ ký `static int32(int32)`, một fat header với `MaxStack` 2 và 45 byte mã, và một biến cục bộ `int32` không có tên
- các đích CIL `switch`, các toán hạng `br.s`, `ldsfld`, `call`, và `ldstr` phân giải qua các bảng và heap
- bảng opcode CIL bao quát mọi opcode runtime và chỉ thêm `no.`
- bảng keeps báo cáo tên tham số trong bốn container và không có trong mã native, và các kiểu trong ba container
- mọi dòng oracle trong demo đọc là n trên n
- figure tương tác nhúng cùng dữ liệu mà `figure_data()` tạo ra

## Production Failure Modes

| Lỗi | Công cụ yếu báo cáo gì | Phân tích phải chứng minh gì |
|---|---|---|
| Trình dịch ngược cũ hơn trình thông dịch | `Unsupported opcode`, đầu ra được đánh dấu chưa hoàn chỉnh, hoặc một khẳng định bị làm rối | Word magic, bản phát hành nó nêu, và mức trần được ghi tài liệu của công cụ |
| pyc được đọc bằng sai trình thông dịch | `marshal.loads` phát sinh ngoại lệ hoặc trả về rác | Bộ unmarshal của chúng ta đọc các tên, hằng số, và kích thước từ bất kỳ tệp 3.9 đến 3.15 nào, và các lệnh đến từ `dis` tương ứng |
| Các opcode chuyên biệt hóa bị nhầm là nội dung tệp | `COMPARE_OP_INT` trong một bản liệt kê | Một pyc giữ dạng chưa chuyên biệt hóa, sự chuyên biệt hóa xảy ra trong bộ nhớ sau khi làm nóng |
| Các tên cục bộ được báo cáo cho một bản dựng javac mặc định | `var1`, `var2` được trình bày như các tên nguồn | `LocalVariableTable` chỉ có mặt với `-g`, 50 byte mã giống hệt nhau theo cả hai cách |
| Đích nhánh lệch bằng độ dài lệnh | Một bản liệt kê JVM có các bước nhảy đến giữa lệnh | Các độ lệch tương đối với opcode nhánh, được kiểm tra với `javap` |
| Phần đệm switch bị bỏ qua | Một `tableswitch` có default sai và các case bị dịch | Không đến ba byte đệm đến một pc căn chỉnh 4, 36 byte cho năm case |
| Các tên Wasm bị giả định là đã strip | "không có ký hiệu" | Các export đặt tên mọi hàm được export, các biến cục bộ cần section `name`, `wasm-strip` chỉ loại bỏ section đó |
| Ba công cụ, ba cách viết | `get_local` so với `local.get`, một hàm tại `0x8b` so với `0x8e` | Cùng các byte, và bản liệt kê mà phép so sánh được thu lại bằng |
| Kích thước hàng bảng được đoán | Mọi hàng sau bảng đầu tiên bị đọc sai | Các kích thước hàng từ `HeapSizes`, các số hàng, và các độ rộng chỉ mục mã hóa, bằng với của oracle |
| Các tên cục bộ được kỳ vọng trong một assembly release | `V_0` được trình bày như tên nguồn | Các biến cục bộ có kiểu trong `StandAloneSig` và tên chỉ trong một PDB mà `DebugType` none không viết |
| Bộ đọc đoán một opcode hoặc mã kiểu không biết | Một mnemonic có vẻ hợp lý | `FormatError` kèm độ lệch, và phép so sánh oracle dừng ở đó |
| Oracle được thu lại từ một bản dựng khác | Các kiểm thử đạt trên văn bản cũ | `build_fixtures.sh` nêu mọi phiên bản công cụ và viết `versions.txt` cùng `sha256.txt` |

## Operational Rule

Đọc header trước và nêu bên tạo mà nó trỏ đến. Đọc container bằng một bộ đọc từ chối những gì nó không biết, và kiểm tra bản liệt kê của nó với công cụ riêng của định dạng trên cùng tệp. Sau đó nói, với mọi tên và kiểu trong đầu ra của một trình dịch ngược, liệu container đã lưu nó hay công cụ đã suy ra nó.

## Further Reading

- [PEP 552: Deterministic pycs](https://peps.python.org/pep-0552/)
- [CPython `Include/internal/pycore_magic_number.h`](https://github.com/python/cpython/blob/main/Include/internal/pycore_magic_number.h)
- [Python `marshal` module documentation](https://docs.python.org/3/library/marshal.html)
- [CPython `Python/marshal.c`](https://github.com/python/cpython/blob/main/Python/marshal.c)
- [Python 3.14 `dis` module documentation](https://docs.python.org/3.14/library/dis.html)
- [PEP 659: Specializing Adaptive Interpreter](https://peps.python.org/pep-0659/)
- [PEP 626: Precise line numbers for debugging and other tools](https://peps.python.org/pep-0626/)
- [PEP 790: Python 3.15 Release Schedule](https://peps.python.org/pep-0790/)
- [uncompyle6 trên PyPI](https://pypi.org/project/uncompyle6/), [decompyle3 trên PyPI](https://pypi.org/project/decompyle3/), [xdis trên PyPI](https://pypi.org/project/xdis/), [pycdc trên GitHub](https://github.com/zrax/pycdc), [PyLingual trên GitHub](https://github.com/syssec-utd/pylingual)
- [The Java Virtual Machine Specification, Java SE 25, Chapter 4: The class File Format](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-4.html)
- [The Java Virtual Machine Specification, Java SE 25, Chapter 6: The Java Virtual Machine Instruction Set](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-6.html)
- [Hướng dẫn javac, Java SE 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html) và [Hướng dẫn javap](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javap.html)
- [CFR](https://www.benf.org/other/cfr/), [Procyon](https://github.com/mstrobel/procyon), [Vineflower](https://github.com/Vineflower/vineflower), [Fernflower trong intellij-community](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine), [JADX](https://github.com/skylot/jadx)
- [Harrand, Soto-Valero, Monperrus, Baudry, "Java Decompiler Diversity and its Application to Meta-decompilation" (JSS 2020)](https://arxiv.org/abs/2005.11315)
- [ECMA-335, Common Language Infrastructure, 6th edition (June 2012)](https://ecma-international.org/publications-and-standards/standards/ecma-335/)
- [PE Format, Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [System.Reflection.Metadata.Ecma335.TableIndex](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.metadata.ecma335.tableindex)
- [ILSpy trên GitHub](https://github.com/icsharpcode/ILSpy), [ilspycmd trên NuGet](https://www.nuget.org/packages/ilspycmd), [dnSpyEx trên GitHub](https://github.com/dnSpyEx/dnSpy)
- [Đặc tả lõi WebAssembly: Định dạng nhị phân, Mô-đun](https://webassembly.github.io/spec/core/binary/modules.html) và [Giá trị](https://webassembly.github.io/spec/core/binary/values.html)
- [WebAssembly Core Specification: Custom Sections (name section)](https://webassembly.github.io/spec/core/appendix/custom.html)
- [WebAssembly tool-conventions: Debugging](https://github.com/WebAssembly/tool-conventions/blob/main/Debugging.md)
- [Ghi chú phát hành wabt 1.0.42](https://github.com/WebAssembly/wabt/releases/tag/1.0.42), [wasm-tools](https://github.com/bytecodealliance/wasm-tools), [Binaryen](https://github.com/WebAssembly/binaryen), [ghidra-wasm-plugin](https://github.com/nneonneo/ghidra-wasm-plugin)
- [radare2 trên GitHub](https://github.com/radareorg/radare2), phiên bản 6.2.4 được dựng từ mã nguồn cho bài học này
