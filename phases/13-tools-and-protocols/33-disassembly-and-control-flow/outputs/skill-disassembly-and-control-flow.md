---
name: disassembly-and-control-flow
description: Biến một tệp object và một tên hàm thành một danh sách đã kiểm tra, basic block, cạnh có kiểu, dominator và một bản ghi của mọi chuyển giao chưa phân giải.
version: 1.0.0
phase: 13
lesson: 33
tags: [reverse-engineering, x86-64, disassembly, control-flow-graph, dominators, jump-tables, relocations]
---

Với một object x86-64 có thể tái định vị hoặc đã liên kết mà bạn tự dựng và một hàm trong đó, tạo một disassembly có các ranh giới chỉ lệnh được kiểm tra, một đồ thị luồng điều khiển có các cạnh mang bằng chứng của chúng và một danh sách những điều vẫn chưa biết. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp object và compiler cùng lệnh chính xác tạo ra nó.
- Một danh sách tham chiếu từ `llvm-objdump -d` được thu từ cùng object và lưu bên cạnh nó.
- Tên hàm hoặc địa chỉ vào, và section chứa mã.
- Bảng symbol với kích thước hàm, và các section `.rela.*` khi object chưa liên kết.
- Decoder từ bài 33 (`code/main.py`) hoặc một decoder tương đương phát sinh ngoại lệ với một opcode không biết.

## Procedure

1. Chạy decoder như một linear sweep trên toàn bộ code section và so sánh mỗi chỉ lệnh với danh sách tham chiếu theo địa chỉ, byte và văn bản. Dừng và sửa decoder ở lần không khớp đầu tiên. Ghi lại số chỉ lệnh đồng nhất.
2. Chạy recursive descent từ điểm vào hàm với phạm vi hàm làm giới hạn. Ghi lại thứ tự thăm, các xung đột và mọi bước nhảy hoặc lần gọi gián tiếp chưa phân giải với địa chỉ của nó.
3. Với mỗi bước nhảy gián tiếp chưa phân giải, khớp mẫu bảng: thanh ghi mà bước nhảy đọc, `add` tạo ra nó, lần tải có chỉ số, `lea` tương đối theo RIP và kiểm tra biên. Phân giải `lea` qua relocation của nó bằng `S + A + (end - P)`. Đọc các mục qua `.rela.rodata` khi object có thể tái định vị, hoặc từ các byte khi nó đã liên kết. Ghi loại bằng chứng cho mỗi đích.
4. Chạy lại descent với các bảng đã khôi phục và xây dựng các basic block: leader là điểm vào, mọi đích trực tiếp hoặc bảng và mọi chỉ lệnh sau một chuyển giao. Gắn nhãn mỗi cạnh `fallthrough`, `taken`, `jump` hoặc `table`.
5. Tính các immediate dominator bằng thuật toán lặp theo reverse postorder. Liệt kê các back edge như các vòng lặp.
6. Hạch toán mỗi byte trong phạm vi hàm là được descent nhận, chỉ được sweep nhận hoặc không cách nào nhận. Phân loại nhóm thứ hai là padding hoặc dữ liệu và nhóm thứ ba là không thể tới hoặc thiếu.
7. Tìm các lần tải qua một `lea` tương đối theo RIP không cung cấp cho một bước nhảy. Báo cáo mỗi lần là một value table với các mục và bằng chứng của nó, và nói rằng nó thay đổi một lần tải và không phải luồng điều khiển.
8. Viết mọi chuyển giao gián tiếp, xung đột và byte không thể giải mã còn lại như một điều chưa biết với địa chỉ của nó và các byte bạn thấy.

## Required report

Với hàm, báo cáo:

- tên object, compiler, lệnh build và đường dẫn danh sách tham chiếu
- sự đồng nhất oracle dưới dạng số chỉ lệnh đồng nhất trên số được so sánh
- số chỉ lệnh dưới sweep, descent thuần và descent có bảng
- danh sách khối với điểm bắt đầu, kết thúc và số chỉ lệnh
- danh sách cạnh với loại và, với các cạnh `table`, relocation hoặc byte offset tạo ra đích
- immediate dominator của mỗi khối và các back edge
- hạch toán byte: mã được nhận, padding được sweep nhận, byte dữ liệu, byte không bao giờ được tới
- mọi bảng với section, offset, kích thước mục, số lượng, các mục và loại bằng chứng
- mọi điều chưa biết với địa chỉ, byte và lý do phân tích dừng

## Hard rejects

- Tin một danh sách vì mọi byte được giải mã.
- Coi sự đồng nhất với `llvm-objdump` là bằng chứng về khả năng tới. Bản thân oracle là một linear sweep.
- Đoán một opcode mà decoder không biết thay vì phát sinh ngoại lệ.
- Đọc hơn 15 byte cho một chỉ lệnh hoặc đọc vượt cuối section.
- Phân giải một toán hạng tương đối theo RIP mà không cộng khoảng cách từ trường relocation đến cuối chỉ lệnh.
- Đọc một jump table từ các byte không trong một object có thể tái định vị thay vì từ các relocation của nó.
- Báo cáo một value table là một jump table, hoặc một jump table là mã chết.
- Bỏ một chuyển giao gián tiếp chưa phân giải khỏi báo cáo.
- Đếm padding sau lần trả về cuối là mã hàm.
- Tính các dominator trên các khối mà điểm vào không thể tới.
- Thu oracle từ một compiler hoặc object khác với đối tượng đang phân tích.

## Produce

Trả về những phần này:

1. Oracle: các chỉ lệnh được so sánh, các chỉ lệnh đồng nhất, lần không khớp đầu tiên nếu có.
2. Phương pháp: số chỉ lệnh và byte cho sweep, descent và descent có bảng.
3. Khối và Cạnh: đồ thị có kiểu với bằng chứng cho mỗi cạnh bảng.
4. Dominator và Vòng lặp: bảng immediate dominator và các back edge.
5. Bảng: jump table và value table với các mục và loại bằng chứng.
6. Hạch toán Byte: được nhận, padding, dữ liệu, chưa tới, với các phạm vi địa chỉ.
7. Điều chưa biết: mọi địa chỉ nơi phân tích dừng và vì sao.

Kết thúc bằng điều chưa biết đầu tiên. Nếu không có, nêu số lượng đồng nhất oracle và số đích bảng được chứng minh bằng relocation.
