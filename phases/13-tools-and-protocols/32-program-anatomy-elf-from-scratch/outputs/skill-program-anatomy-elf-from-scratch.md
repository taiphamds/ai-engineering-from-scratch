---
name: program-anatomy-elf-from-scratch
description: Đọc một tệp ELF64 hoặc Mach-O mà người dùng đã dựng và báo cáo mọi cấu trúc, symbol và relocation với phạm vi tệp của nó.
version: 1.0.0
phase: 13
lesson: 32
tags: [reverse-engineering, elf, mach-o, binary-formats, relocations, fixtures]
---

Với một object đã biên dịch hoặc executable mà người dùng dựng từ nguồn của chính họ, tạo một báo cáo bố cục chỉ từ các byte tệp. Chứng minh báo cáo với đầu ra công cụ được thu vào các fixture. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp nguồn và lệnh compiler chính xác tạo ra mục tiêu, để mục tiêu là một chương trình người dùng đã dựng.
- Tệp mục tiêu: một object có thể tái định vị, executable hoặc shared object ELF64 little-endian, hoặc một tệp Mach-O 64 bit thin.
- Văn bản đã thu từ `llvm-objdump -h -t -r` (và `-p` cho một executable), hoặc `llvm-objdump --macho --private-headers` cho Mach-O, với phiên bản công cụ được ghi lại.
- Các trang đặc tả đặt tên các trường: System V gABI chương 4 và 5, x86-64 psABI Bảng 4.9 và `loader.h`, `nlist.h` cùng `reloc.h` của Apple.
- Các câu hỏi mà báo cáo phải trả lời, ví dụ phạm vi tệp của một hàm được đặt tên.

## Procedure

1. Xác nhận sự cho phép trước. Mục tiêu phải là một chương trình người dùng đã viết và biên dịch, hoặc một chương trình có sự cho phép bằng văn bản mà người dùng có thể trình ra. Dừng khi không điều nào đúng.
2. Đọc các byte đầu. `7f 45 4c 46` là ELF, và `cf fa ed fe` theo thứ tự tệp là một Mach-O 64 bit little-endian. `ca fe ba be` là một universal binary cần một slice đã được làm mỏng. Từ chối một class 32 bit, một tệp big-endian hoặc một magic không biết với các byte quan sát được trong thông báo.
3. Với ELF, unpack header 64 byte bằng `<HHIQQQIHHHHHH` từ offset 16. Kiểm tra `e_shentsize` là 64 và `e_phentsize` là 56 trước khi đọc bất kỳ bảng nào.
4. Đọc bảng section header tại `e_shoff` và phân giải tên qua section tại `e_shstrndx`. Ghi lại type, cờ, offset, kích thước, địa chỉ, link, info và căn chỉnh cho mỗi section. Đánh dấu các section `SHT_NOBITS` là không sở hữu byte tệp nào.
5. Đọc `.symtab` dưới dạng các bản ghi `Elf64_Sym` 24 byte và tách `st_info` thành binding và type. Phân giải tên qua `sh_link`. In `*UND*`, `*ABS*` và `*COM*` cho các chỉ số section dành riêng.
6. Đọc mọi section `SHT_RELA` dưới dạng các bản ghi 24 byte và tách `r_info` thành symbol và type. Đặt tên type từ bảng psABI cho `e_machine` của tệp. In symbol với addend có dấu của nó, và in một type không biết dưới dạng số của nó.
7. Tính phạm vi tệp của mọi hàm là `sh_offset + st_value - sh_addr` với độ dài `st_size`, và trả về các byte chính xác. Báo cáo các byte giữa các hàm là padding không thuộc symbol nào.
8. Xây dựng bản đồ file offset. Sắp xếp header, bảng program header, mỗi section có byte tệp và bảng section header theo offset. Đặt tên mỗi khoảng trống là không gian không hoạt động và từ chối các chồng lấp.
9. Với một executable hoặc shared object, đọc program header và ánh xạ các địa chỉ qua `PT_LOAD` bằng `p_offset + (address - p_vaddr)`. Báo cáo rằng một object có thể tái định vị chỉ có các địa chỉ tương đối theo section.
10. Với Mach-O, đọc `mach_header_64` và duyệt `ncmds` load command theo `cmdsize`. Đọc `LC_SEGMENT_64` với các bản ghi `section_64` của nó, `LC_SYMTAB` với các mục `nlist_64`, `LC_BUILD_VERSION` và relocation theo section. Định danh đầy đủ mỗi section là `segname,sectname`. Tính độ dài một hàm là khoảng cách đến symbol tiếp theo trong section của nó.
11. So sánh mỗi bảng với văn bản công cụ đã thu từng trường một. Báo cáo mỗi bất đồng với tên trường, giá trị của trình đọc và giá trị của công cụ.
12. Trả lời các câu hỏi của người dùng bằng các giá trị đã tính và trích trường đặc tả mà mỗi giá trị đến từ đó.

## Required report

Với mỗi mục tiêu, báo cáo:

- danh tính tệp: định dạng, class, thứ tự byte, máy, loại tệp và kích thước tệp
- các trường header định vị mọi bảng
- mọi section hoặc section Mach-O với chỉ số, tên, type, cờ, file offset, kích thước tệp, địa chỉ và các bảng mà nó liên kết tới
- mọi symbol với binding, type, section, giá trị, kích thước và tên
- mọi relocation với bảng, section đích, offset, tên type, symbol và addend của nó
- mọi program header hoặc segment với type, cờ, offset, địa chỉ, kích thước tệp, kích thước bộ nhớ và căn chỉnh
- bản đồ file offset với mỗi khoảng trống được đặt tên là không gian không hoạt động và tổng số byte được ánh xạ
- phạm vi tệp và các byte chính xác của mỗi hàm mà người dùng hỏi
- phép so sánh với đầu ra công cụ đã thu: các trường được so sánh, các trường đồng nhất, các trường khác nhau

## Hard rejects

- Phân tích một chương trình mà người dùng không xây dựng và không thể trình sự cho phép bằng văn bản cho nó.
- Coi `st_value` là một file offset, hoặc `sh_size` của một section `SHT_NOBITS` là các byte tệp.
- Bịa ra một tên cho một section type, relocation type, load command hoặc cờ mà đặc tả không liệt kê.
- Đọc các byte toán hạng tại một trường được tái định vị như giá trị cuối cùng.
- Ánh xạ một địa chỉ đã liên kết qua các section khi các mục `PT_LOAD` tồn tại, hoặc gọi một địa chỉ đã liên kết là một địa chỉ runtime.
- Tra cứu một section Mach-O chỉ bằng `sectname`.
- Kỳ vọng một trường kích thước trong `nlist_64`.
- Đọc một universal binary như một Mach-O.
- Chạy công cụ so sánh bên trong các bài kiểm tra thay vì so sánh với văn bản đã thu được commit.
- Báo cáo sự đồng nhất với công cụ mà không liệt kê các trường được so sánh.

## Produce

Trả về những phần này:

1. Sự cho phép: nguồn, lệnh build và ai sở hữu mục tiêu.
2. Danh tính: định dạng, máy, loại, kích thước và các trường header định vị các bảng.
3. Section: bảng với offset, kích thước, cờ và liên kết.
4. Symbol: bảng với binding, type, section, giá trị và kích thước.
5. Relocation: các bản ghi với tên type từ đặc tả và phép tính addend cho mỗi relocation mà người dùng hỏi.
6. Segment: program header hoặc các bản ghi `LC_SEGMENT_64` và quy tắc địa chỉ-thành-offset.
7. Bản đồ file offset: mỗi phạm vi byte và chủ sở hữu của nó, với các khoảng trống được đặt tên.
8. Byte hàm: các phạm vi và byte được yêu cầu.
9. So sánh oracle: các trường được so sánh, các điểm đồng nhất, các điểm bất đồng.

Kết thúc bằng bất đồng đầu tiên giữa trình đọc và đầu ra công cụ đã thu. Khi không có, nêu phiên bản công cụ mà bản thu đến từ đó.
