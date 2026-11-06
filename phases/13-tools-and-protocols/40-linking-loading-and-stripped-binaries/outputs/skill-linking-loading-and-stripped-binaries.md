---
name: linking-loading-and-stripped-binaries
description: Biến một chương trình bạn đã dựng thành danh sách import với provider, một lần gọi được truy vết đến slot mà loader điền, một bản ghi điều strip loại bỏ và điều sống sót, và một khôi phục có chấm điểm các điểm bắt đầu hàm cùng tên trong một bản build đã strip.
version: 1.0.0
phase: 13
lesson: 40
tags: [reverse-engineering, linking, elf, pe, coff, mach-o, plt, got, iat, chained-fixups, strip, function-identification, flirt]
---

Với một executable hoặc thư viện dùng chung đã liên kết mà bạn tự dựng, bản song sinh chưa strip của nó và các object mà nó được liên kết từ đó, tạo một báo cáo nêu tên provider của mọi lần gọi bên ngoài, cho thấy một lần gọi được đi theo từ điểm gọi đến slot do loader ghi với phép tính, nêu điều `strip` loại bỏ và điều loader vẫn cần, và chấm điểm mọi bộ tìm hàm cùng chữ ký với bảng symbol của bản song sinh. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp đã liên kết, lệnh liên kết chính xác và các phiên bản toolchain.
- Bản song sinh chưa strip, hoặc tệp trước `strip`, làm ground truth cho các điểm bắt đầu hàm và tên.
- Các object có thể tái định vị mà tệp được liên kết từ đó, với các bản ghi relocation của chúng, cho các chữ ký và kế hoạch liên kết.
- Văn bản công cụ được thu từ cùng các tệp: `llvm-objdump -h -p -T -R -d` hoặc `-h -t -r` cho ELF và COFF, `llvm-objdump -p` cho PE, và `otool -h -l -Iv`, `dyld_info -fixups -fixup_chain_details -imports -exports -function_starts` cùng `nm -m` cho Mach-O.
- Các trình đọc từ bài 40 (`code/main.py`) hoặc các trình đọc tương đương từ chối các định dạng không biết thay vì đoán.

## Procedure

1. Đọc các header và nêu tên định dạng và loại. Ghi magic, type hoặc filetype, machine và các cờ với tên của chúng. Dừng với bất cứ thứ gì trình đọc không biết.
2. Liệt kê các import với provider của chúng. ELF: `DT_NEEDED` và các mục `.dynsym` không xác định, với tên phiên bản khi `.gnu.version_r` tồn tại. PE: mọi import descriptor với DLL, lookup table, IAT và các mục hint/name của nó. Mach-O: bảng chained import với các ordinal thư viện được ánh xạ theo thứ tự `LC_LOAD_DYLIB`, hoặc các ordinal thư viện `nlist`.
3. Đi theo một lần gọi đến slot của nó. Ghi các byte gọi và địa chỉ, các byte stub hoặc mục PLT với phép tính displacement, địa chỉ slot, word trong tệp và điều loader ghi. Với một mục PLT, ghi chỉ số `pushq` và bản ghi `DT_JMPREL`. Với một chained fixup, giải mã bind hoặc rebase, `next`, ordinal hoặc đích. Với một slot IAT, cho thấy lookup table và IAT bằng nhau trước binding.
4. Từ các object, lập kế hoạch liên kết: với mỗi relocation quyết định tại chỗ, trực tiếp, PLT và slot GOT, chỉ slot GOT hoặc một relocation động, với công thức Bảng 4.9. So sánh các kích thước PLT, GOT và `.rela.plt` được lập kế hoạch với tệp đã liên kết khi có một tệp như vậy.
5. So sánh bảng symbol trước và sau `strip`. Liệt kê các tên bị loại, các tên được giữ với lý do loader cần mỗi tên và các bảng sống sót: export, điểm bắt đầu hàm, bảng unwind, section header hoặc load command header. Chạy chương trình đã strip và ghi đầu ra của nó cạnh bản gốc.
6. Trong tệp đã strip, chạy mọi bộ tìm bạn có thể: bảng điểm bắt đầu của link editor (`LC_FUNCTION_STARTS`, `.pdata`, `.eh_frame`), các phép quét prologue với mẫu byte hoặc mask chính xác và các đích gọi cộng điểm vào. Chấm điểm mỗi bộ với bản song sinh: số khớp, dương tính thật, dương tính giả, bị bỏ lỡ.
7. Xây dựng các chữ ký từ các object: 32 byte đầu với các byte được tái định vị đánh dấu biến thể, CRC16 của các byte sau 32 đến byte biến thể đầu, độ dài hàm và các tên được tham chiếu. Khớp chúng tại các điểm bắt đầu được khôi phục. Ghi mọi va chạm và byte đuôi hoặc tên được tham chiếu đã tách nó, hoặc rằng không có gì làm được.
8. Viết mọi khẳng định với dòng công cụ đã thu hỗ trợ nó, và mọi lần không khớp giữa trình đọc và công cụ như một điều chưa biết với địa chỉ.

## Required report

- tệp, định dạng, loại, cờ, lệnh liên kết, các phiên bản toolchain và các lệnh thu
- các import với provider, ordinal hoặc phiên bản và slot mà mỗi import bind
- lần gọi được truy vết: điểm gọi, stub hoặc mục, slot, word trong tệp, hành động loader, với phép tính được hiển thị
- kế hoạch liên kết với số đếm theo quyết định và các kích thước được lập kế hoạch, và các kích thước đo được khi một tệp đã liên kết tồn tại
- so sánh strip: các bản ghi trước và sau, các tên bị loại, các tên được giữ với lý do, các bảng sống sót, đầu ra chương trình trước và sau
- điểm bộ tìm: với mỗi phương pháp, tìm được, dương tính thật, dương tính giả, bỏ lỡ, recall
- chữ ký: mọi dòng `.pat`, mọi tên được gán, mọi va chạm với cách giải quyết của nó
- điều chưa biết: mọi địa chỉ nơi trình đọc và công cụ bất đồng hoặc nơi không phương pháp nào đặt tên một hàm

## Hard rejects

- Đọc một word GOT, IAT hoặc `__got` từ tệp và gọi nó là một địa chỉ mà không giải mã nó như định dạng định nghĩa.
- Báo cáo một mục PLT cho một lần gọi có symbol được định nghĩa trong các đầu vào.
- Coi đầu ra `nm` trên một tệp đã strip là số hàm khi một bảng điểm bắt đầu tồn tại.
- Chấm điểm một bộ tìm mà không có bản song sinh chưa strip.
- Khẳng định partial hoặc full RELRO mà không đọc `PT_GNU_RELRO` và `DF_BIND_NOW`.
- So sánh COFF `REL32` với ELF `PC32` mà không tính đến addend trong bản ghi ELF.
- Đặt tên một hàm từ một chữ ký đã va chạm với một chữ ký khác và chưa được tách bằng một byte đuôi hoặc một tên được tham chiếu.
- Xây dựng một chữ ký từ các byte dưới một relocation mà không đánh dấu chúng là biến thể.
- Trích một con số từ một lần chạy công cụ trên một bản build khác hoặc một máy khác.
- Strip một thư viện dùng chung dưới mức mà loader cần mà không ghi điều bảng export vẫn mang.

## Produce

Trả về những phần này:

1. Danh tính: định dạng, loại, cờ, máy, toolchain, lệnh.
2. Import: provider theo tên, slot mà mỗi import bind và thời điểm binding (lười, lúc tải hoặc không có).
3. Một Lần Gọi: đường được truy vết với byte và phép tính.
4. Kế hoạch Liên kết: quyết định, số đếm, kích thước được lập kế hoạch và đo được.
5. Strip: trước và sau, bị loại, được giữ với lý do, các bảng sống sót, đầu ra chương trình.
6. Bộ tìm: điểm theo phương pháp với các trường hợp bỏ lỡ được nêu tên.
7. Chữ ký: các dòng `.pat`, các phép gán, các va chạm và cách giải quyết của chúng.
8. Điều chưa biết: mọi bất đồng và mọi điểm bắt đầu không tên.

Kết thúc bằng điều chưa biết đầu tiên. Nếu không có, nêu số fixup hoặc relocation khớp văn bản công cụ và số hàm được đặt tên.
