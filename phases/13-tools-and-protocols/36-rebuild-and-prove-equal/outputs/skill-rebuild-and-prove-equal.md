---
name: rebuild-and-prove-equal
description: Chứng minh một hàm dựng lại bằng bản gốc với một lưới vi sai, một phép so sánh byte có nhận biết relocation và một bản ghi bằng chứng có bằng chứng hỗ trợ.
version: 1.0.0
phase: 13
lesson: 36
tags: [reverse-engineering, differential-testing, elf, relocations, mcp, evidence]
---

Với một tệp object gốc chúng ta sở hữu, bằng chứng hàm từ một provider phân tích và một bản dựng lại ứng viên bằng C, tạo một bằng chứng hai chân và một bản ghi bằng chứng nêu tên mọi id bằng chứng mà nó dựa vào. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Object hoặc executable gốc, SHA-256 của nó và bằng chứng rằng chúng ta đã viết và biên dịch nó.
- Compiler, phiên bản, mục tiêu và cờ chính xác đã dựng bản gốc.
- Danh sách chỉ lệnh và mã giả của mỗi hàm mục tiêu, với các id bằng chứng của chúng.
- Bản dựng lại ứng viên, một hàm mỗi tệp, với cùng tên hàm như bản gốc.
- Chiều rộng số nguyên và tính có dấu của mọi toán hạng, đọc từ danh sách.
- Kiến trúc mà bằng chứng chạy trên đó, và liệu object gốc có thể được liên kết trên nó hay không.
- Với mỗi relocation bên trong một hàm: offset, type, chiều rộng, section đích và dạng của dữ liệu mà nó trỏ tới.

## Procedure

1. Đọc danh sách trước mã giả. Viết bản dựng lại từ các phép toán mà danh sách cho thấy.
2. Ghi id bằng chứng của mọi bản ghi mà bản dựng lại đến từ đó.
3. Xây dựng một lưới đầu vào với một lớp mỗi nguy cơ: điều kiện bảo vệ bằng không, âm, làm tròn, tràn, trap và mỗi ranh giới nhánh.
4. Thêm các đầu vào làm mọi giá trị trung gian wrap ở chiều rộng mà danh sách sử dụng.
5. Biên dịch bản gốc, ứng viên được đổi tên và một driver vào một chương trình. Liên kết object gốc khi host có thể chạy nó.
6. Cài một handler `SIGFPE` trong driver để một trap phép chia trở thành một kết quả được ghi.
7. Chạy lưới. Ghi mọi ô với các đầu vào, đầu ra gốc, đầu ra ứng viên và lớp.
8. Kiểm tra cột gốc với một mô hình ngữ nghĩa mục tiêu. Báo cáo mọi bất đồng.
9. Biên dịch lại ứng viên với các cờ gốc chính xác.
10. Đọc cả hai object: offset và kích thước symbol, các byte hàm và các bản ghi `.rela` bên trong hàm.
11. Che mọi trường relocation, rồi so sánh kích thước và byte.
12. So sánh các bản ghi relocation theo offset, type và section đích. Coi một addend khác là một offset khác, không phải một thất bại.
13. Đọc các hằng số mà mỗi relocation trỏ tới và so sánh chúng từng mục.
14. Viết một khẳng định mỗi chân mỗi hàm với trạng thái `pass`, `fail` hoặc `unknown`.
15. Tổng hợp fail trước, rồi unknown. Không bao giờ báo cáo `pass` cho một khẳng định chưa chạy.
16. Tạo bản ghi bằng chứng với `predicate_type`, `operation`, `confidence`, `authority`, các khẳng định và các liên kết bằng chứng. Hash nó cho id của nó.

## Required matrix

Với mọi hàm, báo cáo:

- tên hàm, offset gốc và kích thước theo byte
- các id bằng chứng của các bản ghi danh sách và mã giả
- kích thước lưới và số đếm theo lớp
- số bài kiểm tra ngây thơ và kết quả
- các lần không khớp lưới với ba ô đầu đầy đủ
- kiến trúc host và liệu bản gốc là object fixture hay một bản build native của nguồn của nó
- các bất đồng mô hình với bản gốc được quan sát
- kích thước ứng viên, các phạm vi đã che, các offset khác nhau
- các bản ghi relocation ở cả hai bên với section đích và addend
- các hằng số được tham chiếu ở cả hai bên
- các trạng thái khẳng định và trạng thái tổng hợp
- id bản ghi bằng chứng

## Hard rejects

- Gọi một bản dựng lại là bằng nhau vì các bài kiểm tra viết tay đã qua.
- Một lưới không có đầu vào tràn cho mọi phép nhân, cộng hoặc trừ trong hàm.
- Một lưới bỏ qua ô trap phụ thuộc kiến trúc mà không nói vậy.
- So sánh byte mà không che các trường relocation.
- Che các trường relocation mà không so sánh các hằng số mà chúng trỏ tới.
- Báo cáo tính bằng nhau byte trên các compiler, phiên bản hoặc cờ khác nhau.
- Coi tính bằng nhau kích thước là nghiệm thu.
- Đọc đầu ra của một mô hình như một quan sát. Mô hình là bằng chứng derived.
- Một khẳng định có trạng thái `pass` và không có id bằng chứng.
- Một tổng hợp `pass` trong khi bất kỳ khẳng định nào là `unknown`.
- Một bản ghi bằng chứng có id không tính lại được từ nội dung của nó.
- Bất kỳ phân tích nào của một chương trình chúng ta không sở hữu hoặc không có sự cho phép bằng văn bản.

## Produce

Trả về những phần này:

1. Bằng chứng: các bản ghi mà bản dựng lại đến từ đó, theo id, với các giới hạn của chúng.
2. Ứng viên: văn bản C và các phép toán danh sách mà nó ánh xạ tới.
3. Chân Một: thiết kế lưới, số đếm theo lớp, kết quả ngây thơ, các lần không khớp, kiểm tra mô hình, host và loại bản gốc.
4. Chân Hai: kích thước, các phạm vi đã che, kết quả byte, các bản ghi relocation, các hằng số được tham chiếu.
5. Khẳng định: một hàng mỗi khẳng định với trạng thái và các id bằng chứng.
6. Bản ghi Bằng chứng: bản ghi JSON và id `ev_` của nó.
7. Điều chưa biết: mọi lớp đầu vào, kiến trúc hoặc compiler mà bằng chứng không bao phủ.

Kết thúc bằng khẳng định thất bại đầu tiên. Nếu mọi khẳng định qua, nêu lưới, cờ và kiến trúc mà lần qua bao phủ.
