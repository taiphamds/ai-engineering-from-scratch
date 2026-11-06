# Fixtures for lesson 43

Mọi tệp ở đây được viết hoặc dựng trên máy này từ mã nguồn ở cạnh nó. `build_fixtures.sh` giữ các lệnh chính xác và viết `versions.txt` cùng `sha256.txt`. Không có gì được tải xuống.

| Thư mục | Mã nguồn | Các đầu ra được dựng | Văn bản oracle |
|---|---|---|---|
| `python/` | `ledger.py` (cùng bốn hàm như `ledger.c`, cộng một tuple `LABELS`) | `ledger.cpython-31N.pyc` (checked-hash) và `ledger.cpython-31N.timestamp.pyc` với N là 1, 2, 3, 4, được `compile_pyc.py` viết dưới mỗi trình thông dịch với `dfile="ledger.py"` | `ledger.cpython-31N.dis.txt` từ `python3.1N -m dis ledger.py`, `ledger.cpython-314.dis-caches.txt` từ `python3.14 -m dis -C -O ledger.py`, `ledger.cpython-314.adaptive.txt` từ `dis.dis(..., adaptive=True)` sau 200 lời gọi |
| `java/` | `Ledger.java` | `Ledger.class` (`javac`, JDK 21.0.12.1), `Ledger-g.class` (`javac -g`), `Ledger-gnone.class` (`javac -g:none`), `Ledger-jdk25.class` (`javac`, JDK 25.0.2) | `*.javap-c.txt` từ `javap -c -p`, `*.javap-v.txt` từ `javap -v -p`, cả hai với JDK 21 |
| `wasm/` | `ledger.wat` (được sao chép từ các fixture thủ công) | `ledger.wasm` (được sao chép, bằng từng byte với `wat2wasm ledger.wat`), `ledger-names.wasm` từ `wat2wasm --debug-names` | `*.wasm2wat.txt` từ `wasm2wat`, `*.objdump.txt` từ `wasm-objdump -h -x -d`, cả hai wabt 1.0.42 |
| `dotnet/` | `Ledger.cs` và `LedgerNet.csproj` | `LedgerNet.dll` (`dotnet build -c Release`, SDK 8.0.205, net8.0, `DebugType` none) | `LedgerNet.metadump.txt` từ `MetaDump/Program.cs`, một bộ đọc System.Reflection.Metadata in các bảng, phương thức, byte IL, và bảng `System.Reflection.Emit.OpCodes` |
| `native/` | `ledger.c` | `ledger-x86_64-O0.o`, được sao chép từ bài 33 (`clang -target x86_64-unknown-linux-gnu -O0 -fno-asynchronous-unwind-tables -c`) | `ledger-x86_64-O0.objdump.txt`, bản thu `llvm-objdump -d` bài 33 |

`java/Ledger-g.r2.txt`, `wasm/ledger.r2.txt`, và `dotnet/LedgerNet.r2.txt` giữ đầu ra `rabin2 -I` và `radare2 -qc` từ radare2 6.2.4, được dựng từ mã nguồn. Script dựng chỉ viết chúng khi `rabin2` và `radare2` nằm trên `PATH`.

Các trình thông dịch và công cụ được ghi trong `versions.txt`: Python 3.11.14, 3.12.12, 3.13.12, 3.14.6; javac 21.0.12.1 và 25.0.2; wabt 1.0.42; .NET SDK 8.0.205. Python 3.15 chưa được cài khi các fixture được dựng, nên số magic 3.15 trong `main.py` đến từ mã nguồn CPython chứ không phải từ một tệp ở đây.

Các tệp pyc timestamp lưu mtime của `ledger.py` tại thời điểm dựng, 1791975565, và kích thước của nó, 497. Một checkout mới cho mã nguồn một mtime mới, nên một lần import sẽ biên dịch lại. Các tệp checked-hash không phụ thuộc vào mtime.
