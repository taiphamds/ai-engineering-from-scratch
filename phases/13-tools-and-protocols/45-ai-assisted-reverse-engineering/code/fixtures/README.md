# Fixtures for lesson 45

Mọi tệp ở đây là của chúng ta. `ledger.c` là cùng mã nguồn như trong các bài 33, 35, và 36. Tám bản tái tạo ứng viên trong `candidates/` được viết bằng tay cho bài học này để đại diện cho các đầu ra mô hình điển hình. Chúng không phải đầu ra của bất kỳ mô hình nào, và mỗi báo cáo nói rõ điều đó trong trường `label` của nó.

Lệnh dựng và thu lại, được ghi vào 2026-10-14 với Apple clang phiên bản 17.0.0 (clang-1700.6.3.2) và Apple LLVM phiên bản 17.0.0 `llvm-objdump` cùng `llvm-dwarfdump` từ Command Line Tools macOS:

```
sh build_fixtures.sh
```

Các cờ trình biên dịch cho mọi tệp đối tượng là `clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c`. Ba tệp đối tượng ledger chỉ khác ở các tên ký hiệu, section gỡ lỗi, và dữ liệu chỉ đọc. 159 byte `.text` của chúng giống hệt nhau và giống `ledger-x86_64-O1.o` trong bài 36.

| Tệp | Nội dung |
|---|---|
| `ledger.c` | nguồn gốc: `percent_change`, `grade`, `total`, `grade_label` |
| `ledger-poisoned.c` | cùng mã nguồn cộng một chuỗi chỉ đọc nói với người phân tích |
| `ledger-x86_64-O1-renamed.o` | đích. Được dựng với `-Dpercent_change=f1 -Dgrade=f2 -Dtotal=f3 -Dgrade_label=f4`, nên các ký hiệu là `f1` đến `f4`. SHA-256 `3561e8175748e19d631552d52869fe235a82471137528ac2e5ef6b6145967d0c` |
| `ledger-x86_64-O1-g.o` | ground truth. Được dựng với các tên gốc và `-g`, DWARF 5. SHA-256 `7bbe0c151e24f58ff70f2057239b12c4538852805d35e1390b9b51e286be853e` |
| `ledger-x86_64-O1-poisoned.o` | `ledger-poisoned.c` với các tên đổi, cho bài lab nội dung không đáng tin cậy. SHA-256 `c2ed0a89156ac36162d33c03f740930d8480b75244047aa31b5e8e8708a695bc` |
| `ledger-x86_64-O1-renamed.objdump.txt` | `llvm-objdump -d -r` của đích, nguồn của mọi immediate mà phép kiểm tra trích dẫn chấp nhận |
| `ledger-x86_64-O1-renamed.symtab.txt` | `llvm-objdump -t` của đích |
| `ledger-x86_64-O1-g.dwarfdump.txt`, `ledger-x86_64-O1-g.abbrev.txt` | `llvm-dwarfdump --debug-info` và `--debug-abbrev` của ground truth |
| `ledger-x86_64-O1-poisoned.sections.txt` | `llvm-objdump -s` của hai section chỉ đọc của tệp đối tượng bị đầu độc |
| `candidates/<id>.c` | một bản tái tạo ứng viên cho mỗi tệp, bốn cho mỗi hàm đích |
| `candidates/<id>.report.json` | báo cáo của ứng viên: đích, các khẳng định, trích dẫn, nhãn, công cụ, chi phí |
| `candidates/<id>.o`, `candidates/<id>.objdump.txt` | mỗi ứng viên được biên dịch với các cờ fixture, và bản liệt kê của nó |
| `build-record.json` | bản ghi thu lại: danh tính trình biên dịch, các cờ, và các digest mã nguồn và tệp đối tượng gắn mỗi tệp đối tượng ứng viên đã commit với mã nguồn của nó |
| `runs/scorecards-aarch64-darwin.json` | một lần chạy `python3 code/main.py --save-runs` trên một Mac arm64, nguồn của dữ liệu figure |

Các ứng viên theo đích và loại:

| Ứng viên | Đích | Loại | Được viết để đại diện cho |
|---|---|---|---|
| `f1_mul_first` | `f1` | đúng | bản liệt kê trong C |
| `f1_wide_long` | `f1` | có vẻ hợp lý nhưng sai | một giá trị trung gian 64 bit bỏ qua phép tràn 32 bit |
| `f1_base_64` | `f1` | hằng số sai | byte `0x64` được đọc là số thập phân 64 |
| `f1_safe_div` | `f1` | thành phần trợ giúp được bịa ra | một thành phần trợ giúp và một thông điệp không tồn tại, trên mã biên dịch thành các byte gốc |
| `f2_switch` | `f2` | đúng | `switch` gốc |
| `f2_thresholds` | `f2` | có vẻ hợp lý nhưng sai | các phép kiểm tra ngưỡng không có cận trên, dưới một tên khác |
| `f2_case10_wrong` | `f2` | hằng số sai | một mục bảng sai |
| `f2_clamp` | `f2` | thành phần trợ giúp được bịa ra | một thành phần trợ giúp clamp và một thông điệp không tồn tại |

Các kiểm thử đọc các tệp đối tượng, bản liệt kê, và lần chạy đã ghi được commit, nên chúng đạt trên một máy không có clang. Khi có clang chúng cũng dựng lại mọi ứng viên và chạy lại lưới cùng corpus. Phép so sánh bản dựng lại chỉ chạy khi clang được cài báo cáo danh tính được ghi ở trên và trong `build-record.json`: hợp đồng so sánh byte là cùng trình biên dịch và các cờ, nên bất kỳ clang nào khác được coi như không có clang và các tệp đối tượng đã commit thay thế trong khi `build-record.json` vẫn ghép chúng với các mã nguồn ứng viên. Một mã nguồn được chỉnh sửa để trường byte là `unknown` thay vì đánh giá tệp đối tượng đã commit cũ. `build-record.json` là metadata fixture đã commit — `--save-runs` chỉ viết lại các snapshot trong `runs/`, không bao giờ bản ghi thu lại.
