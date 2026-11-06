---
name: lifting-to-pseudocode
description: Nâng một hàm đã biên dịch thành mã giả với một phép suy ra cho mỗi dòng, rồi đối chiếu nó với văn bản của decompiler.
version: 1.0.0
phase: 13
lesson: 34
tags: [reverse-engineering, decompilation, ir, ssa, structuring, ghidra, rea]
---

Với một hàm trong một tệp object hoặc executable mà bạn xây dựng hoặc được phép phân tích, tạo ra hai thứ. Thứ nhất, mã giả nơi mỗi dòng truy ngược về các chỉ lệnh. Thứ hai, một bảng khác biệt đối chiếu đầu ra của decompiler. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp mục tiêu, SHA-256 của nó, compiler và các cờ tạo ra nó, và sự cho phép bằng văn bản để phân tích nó.
- Tên hàm hoặc địa chỉ vào và section chứa nó.
- Một disassembly tham chiếu từ `llvm-objdump -d -r` hoặc góc nhìn chỉ lệnh của decompiler.
- Các bản ghi relocation áp dụng cho thân hàm.
- Quy ước gọi của mục tiêu (System V AMD64 psABI mục 3.2.3 cho các object Linux x86-64).
- Văn bản decompiler cho cùng hàm, với tên provider và phiên bản, ví dụ Ghidra 12.1.4 qua rea 6.5.0.
- Nguồn của hàm khi mục tiêu là fixture của riêng bạn, cho phép so sánh hành vi.

## Procedure

1. Giải mã hàm từ byte đầu của nó đến điểm bắt đầu hàm tiếp theo. So sánh mỗi chỉ lệnh với disassembly tham chiếu theo địa chỉ, byte và văn bản. Dừng ở bất đồng đầu tiên.
2. Chia các chỉ lệnh thành basic block tại các đích nhảy và sau mỗi bước nhảy hoặc lần trả về. Ghi các kế nhiệm và tiền nhiệm. Tính immediate dominator theo reverse postorder.
3. Nâng mỗi chỉ lệnh thành các câu lệnh IR. Mô hình hóa các chỉ lệnh đặt cờ như các lần ghi vào một biến `flags` và mỗi bước nhảy có điều kiện như một lần đọc nó. Giữ con trỏ stack và con trỏ khung ngoài IR và biến các slot khung thành các biến cục bộ có tên.
4. Phân giải mọi toán hạng tương đối theo RIP qua relocation của nó: đích = symbol + addend + khoảng cách từ trường displacement đến cuối chỉ lệnh. Đặt tên đích theo section và offset.
5. Lấy các tham số từ quy ước gọi. Một thanh ghi trong chuỗi đối số được đọc trước mọi lần ghi là một tham số. Thanh ghi cao nhất như vậy cố định số lượng. Không bao giờ lấy một thanh ghi callee-saved làm một tham số.
6. Xây dựng SSA: đặt các hàm phi trên dominance frontier lặp của các định nghĩa của mỗi biến, rồi đổi tên bằng một phép duyệt cây dominator. Ghi chiều rộng của mọi định nghĩa.
7. Đơn giản hóa: gộp các mã điều kiện với `cmp` và `test`, gộp các phép ép kiểu, biến các lần tải có tỷ lệ thành truy cập phần tử và chỉ nhận dạng mẫu chia bằng nhân-và-dịch khi hệ số nhân bằng giá trị trần của một lũy thừa hai chia cho số chia và cận sai số đúng.
8. Thế một giá trị vào lần dùng duy nhất của nó khi lần dùng nằm trong cùng khối và không có lần lưu hoặc lần gọi nằm giữa chúng. Thế các hằng số ở mọi nơi trừ vào một phi. Loại các định nghĩa không có lần dùng và không có tác dụng phụ. Lặp lại cho đến khi không có gì thay đổi.
9. Hợp nhất mỗi phi với các đối số của nó thành một biến. Cho các biến những tên cho thấy thanh ghi hoặc slot mà chúng đến từ đó. Suy ra `int` hoặc `long` từ chiều rộng và một kiểu con trỏ từ việc dùng làm base của một lần tải có tỷ lệ, và chia sẻ kiểu dọc theo các bản sao.
10. Cấu trúc hóa: sử dụng immediate post-dominator làm điểm nối của một điều kiện. Phát ra `if`, `if` với `else` hoặc một lần trả về sớm. Phát hiện các vòng lặp từ back edge. Phát ra `while` khi header thoát và `do while` khi latch thoát. Báo cáo một bước nhảy gián tiếp là chưa phân giải thay vì đoán các đích.
11. Biên dịch mã giả với target triple và `-Wall -Werror`. Khi nguồn có sẵn, biên dịch nguồn và mã giả thành các chương trình riêng với một driver và so sánh đầu ra của chúng trên một lưới đầu vào.
12. Đặt văn bản decompiler cạnh mã giả. Với mỗi dòng khác nhau, viết chỉ lệnh giải thích khác biệt, hoặc viết rằng khác biệt là một phỏng đoán decompiler không có chỉ lệnh đằng sau.

## Required matrix

Với mọi hàm, báo cáo:

- tên hàm, phạm vi địa chỉ, số chỉ lệnh, số khối và số phi
- sự đồng nhất decoder với disassembly tham chiếu: mọi chỉ lệnh hoặc địa chỉ đầu tiên khác nhau
- mỗi tham số với thanh ghi, chiều rộng và kiểu suy ra của nó
- mỗi lần đọc bảng với relocation, offset section, chiều rộng phần tử và cận cố định độ dài của nó
- mỗi mẫu được nhận ra, với phép tính biện minh cho nó
- mỗi cấu trúc được phát ra (if, if-else, trả về sớm, while, do while, bước nhảy gián tiếp chưa phân giải)
- kết quả biên dịch và kết quả so sánh hành vi với lưới đầu vào được sử dụng
- bảng khác biệt đối chiếu decompiler: dòng, văn bản của chúng ta, văn bản của họ, chỉ lệnh hoặc phỏng đoán

## Hard rejects

- Tin một chữ ký, kiểu trả về hoặc số tham số decompiler mà không kiểm tra các lần đọc và ghi thanh ghi đằng sau nó.
- Lấy một thanh ghi callee-saved hoặc một thanh ghi được ghi lần đầu bên trong hàm làm một tham số.
- Gộp một phép nhân-và-dịch thành một phép chia mà không kiểm tra hệ số nhân và cận sai số.
- Đoán các đích của một bước nhảy gián tiếp từ mã lân cận.
- Đọc một bảng vượt địa chỉ được tham chiếu tiếp theo hoặc cuối section.
- Thế một giá trị được tải qua một lần lưu hoặc một lần gọi.
- Phát ra `goto` cho một dạng mà một `if`, `while` hoặc `do while` bao quát.
- Tuyên bố mã giả đúng vì nó biên dịch. Biên dịch chứng minh cú pháp, so sánh hành vi chứng minh ngữ nghĩa.
- Chấp nhận một chỉnh sửa của mô hình tinh chỉnh thay một điều chưa biết nhìn thấy được bằng một trường, kiểu, callee hoặc điều kiện bảo vệ được bịa.
- Phân tích phần mềm bạn không sở hữu hoặc không được phép phân tích.

## Produce

Trả về những phần này:

1. Mục tiêu: tệp, SHA-256, compiler, cờ, sự cho phép.
2. Đồng nhất Decoder: số chỉ lệnh và kết quả so sánh tham chiếu.
3. Đồ thị: khối, kế nhiệm, immediate dominator, vòng lặp.
4. IR và SSA: các danh sách câu lệnh với phiên bản và hàm phi.
5. Mã giả: văn bản có cấu trúc với các định nghĩa dữ liệu của nó.
6. Kiểu: mỗi tham số, biến cục bộ và kiểu trả về với bằng chứng cho mỗi thứ.
7. So sánh Decompiler: bảng khác biệt với chỉ lệnh hoặc phỏng đoán cho mỗi dòng.
8. Bằng chứng: kết quả biên dịch và phép so sánh hành vi trên lưới đầu vào.
9. Điều chưa biết: các bước nhảy chưa phân giải, các relocation chưa áp dụng, các kiểu mà mã máy không thể cố định.

Kết thúc bằng dòng đầu tiên của văn bản decompiler mà không chỉ lệnh nào hỗ trợ. Nếu mọi dòng được hỗ trợ, nêu lưới đầu vào đã chứng minh hành vi bằng nhau.
