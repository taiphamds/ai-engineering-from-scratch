---
name: binary-diffing-and-symbolic-execution
description: Ghép các hàm của hai bản dựng bạn đã biên dịch bằng các chữ ký theo giai đoạn và độ tin cậy được nêu, giải thích mọi hàm chưa được ghép hoặc đã thay đổi, và giải để tìm các đầu vào đến một đường đi đã chọn bằng một phép tìm kiếm có giới hạn và một bộ giải production.
version: 1.0.0
phase: 13
lesson: 44
tags: [reverse-engineering, binary-diffing, function-matching, relocations, symbolic-execution, constraint-solving, angr, z3, ghidra, radare2]
---

Với hai tệp đối tượng x86-64 có thể relocation hoặc đã liên kết do chính bạn dựng, các bản liệt kê tham chiếu của chúng, và một hàm mà bạn muốn các đầu vào, hãy tạo một phép diff ở mức hàm có mọi mục khớp nêu chữ ký đã tạo nó, và một báo cáo đường đi có mọi lá mang một đầu vào đã giải. Dùng skill này với Claude, Cursor, Codex, OpenClaw, Hermes, hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Hai tệp đối tượng, trình biên dịch và lệnh chính xác cho mỗi tệp, và SHA-256 của mỗi tệp.
- Một bản liệt kê tham chiếu từ `llvm-objdump -d` cho mỗi tệp đối tượng, được thu lại từ cùng các byte.
- Các bảng ký hiệu với các kích thước hàm và các section `.rela.*` khi các tệp đối tượng chưa được liên kết.
- Bộ so sánh khác biệt bài 44 (`code/main.py`) hoặc một bản tương đương đọc các byte, relocation, mnemonic, và khối.
- Với nhiệm vụ giải: IR của hàm từ bài 34 hoặc một bản nâng bằng tay với một địa chỉ lệnh cho mỗi câu lệnh, các độ rộng tham số, và các bảng cụ thể mà hàm đọc.
- Tùy chọn: radiff2, Ghidra với Version Tracking, angr, và z3 cho các phép kiểm tra chéo.

## Procedure

1. Xác minh mỗi bản liệt kê với tệp đối tượng của nó từng byte. Dừng tại điểm không khớp đầu tiên. Một bản liệt kê cũ là một fixture đã thay đổi.
2. Dựng một bản ghi cho mỗi hàm: các byte, các byte với các trường relocation được đặt về không, chuỗi mnemonic, các khối cơ bản có thể tiếp cận với các cạnh có kiểu, các đích bảng nhảy từ `.rela.rodata`, và bảng mà relocation `lea` trỏ đến khi có một phép kiểm tra cận và một phép nạp theo chỉ mục.
3. Chạy các giai đoạn theo thứ tự và ghi lại giai đoạn đã tạo mỗi mục khớp: byte chính xác, byte được che, mnemonic, hình dạng đồ thị luồng, tên. Một chữ ký chỉ khớp khi giá trị của nó duy nhất ở cả hai phía. Ghi lại chất lượng của giai đoạn cùng mục khớp.
4. Chạy lại các giai đoạn với các tên ở thứ hai khi có các ký hiệu. So sánh hai tập mục khớp. Một mục khớp cấu trúc mà giai đoạn tên mâu thuẫn là một mục khớp sai; báo cáo nó với hình dạng đã gây ra nó.
5. Với mọi mục khớp, so sánh các bảng được tham chiếu. Cùng mã với các hằng số khác nhau là một hàm đã sửa đổi.
6. Lặp lại phép diff trên các ảnh đã nạp: bố trí các section được cấp phát, áp dụng `S + A - P` cho mọi trường tương đối PC và `S + A` cho mọi trường tuyệt đối, và so sánh khác biệt lần nữa. Một hàm khớp trên các byte chính xác trong các tệp đối tượng và chỉ trên các byte được che trong các ảnh đã di chuyển tương đối với dữ liệu của nó.
7. Tính một độ tương tự cho mọi cặp là `1 - levenshtein / max(len)` trên các byte thô và nêu những byte nào được đưa vào nó. Khi so sánh với radiff2, nêu liệu các relocation đã được áp dụng hay không, vì fingerprint thay đổi.
8. Với hàm cần giải: liệt kê các đường đi trên IR, thêm mỗi điều kiện nhánh vào đường đi, và bỏ một nhánh phân tách mà bộ giải không thể thỏa mãn. Đặt cận mọi bộ đếm vòng lặp ký hiệu hoặc đặt mức trần các khối cho mỗi đường đi, và báo cáo các đường đi mà mức trần đã cắt.
9. Giải mỗi lá để tìm các đầu vào bạn muốn: một giá trị trả về, một khối được tiếp cận, hoặc một đẳng thức giữa hai bản dựng. Báo cáo cận của phép tìm kiếm và số lượng, giá trị nhỏ nhất, lớn nhất, và một mẫu bên trong nó.
10. Khi có một bộ giải production, chạy cùng các truy vấn qua angr hoặc z3 và so sánh các cận lớp, tính thỏa mãn, và các mô hình. Đánh giá mọi mô hình bằng bộ đánh giá IR trước khi bạn báo cáo nó.

## Output

Với phép diff, báo cáo:

- các tên tệp đối tượng, trình biên dịch, các lệnh, hash, và tệp bản liệt kê
- với mỗi hàm: kích thước, số lệnh, khối, cạnh, relocation, và năm chữ ký
- danh sách mục khớp với giai đoạn, chất lượng, các chữ ký thống nhất, độ tương tự, sự thống nhất tên, và sự bằng nhau của bảng
- các hàm chưa được ghép ở mỗi phía với ứng viên gần nhất và độ tương tự của nó
- các kết quả cách nhìn tệp đối tượng và cách nhìn ảnh cạnh nhau, với bố cục section và displacement đã thay đổi
- bảng so sánh công cụ: giai đoạn của bạn, kết luận và tỷ lệ radiff2, các correlator Ghidra đã khớp

Với việc giải, báo cáo:

- IR với một địa chỉ lệnh cho mỗi câu lệnh và phép kiểm tra rằng nó bao phủ bản liệt kê một lần
- danh sách đường đi với vết, điều kiện, biểu thức trả về, và trạng thái (đã trả về hoặc bị cắt ngắn)
- với mỗi lá: số đầu vào đã giải, giá trị nhỏ nhất, lớn nhất, mẫu, và cận đã dùng
- câu trả lời của bộ giải production cho cùng truy vấn và liệu các lớp có thống nhất hay không
- cận vòng lặp hoặc mức trần bước và nó đã cắt bao nhiêu đường đi

## Failure modes

- Tin một hash byte trên một ảnh đã nạp. Các displacement đã relocation khác nhau khi các section di chuyển; che các trường hoặc so sánh khác biệt các tệp đối tượng.
- Tin một hash được che trên một tệp đối tượng có thể relocation. Các trường đã bằng không, nên việc che không thay đổi gì và các bản ghi relocation cùng các hằng số được tham chiếu mang sự khác biệt.
- Chấp nhận một mục khớp hình dạng đồ thị luồng mà không có một chữ ký thứ hai. Các hình thoi nhỏ là hình dạng của nhiều hàm.
- Chạy các giai đoạn cấu trúc trước các tên trên một bản dựng có các ký hiệu rồi không kiểm tra kết quả với các tên.
- So sánh một tỷ lệ tương tự với tỷ lệ của một công cụ mà không có cùng các byte. radiff2 lấy fingerprint các khối mà phân tích của nó tìm thấy, và số lượng thay đổi khi các relocation được áp dụng.
- Báo cáo một mô hình bộ giải là đầu vào. Nó là một mô hình; một bộ giải khác trả về một mô hình khác.
- Chạy một vòng lặp ký hiệu không có cận hoặc mức trần và chờ.
- Báo cáo một kết quả tìm kiếm có giới hạn là không thỏa mãn được. Nó chỉ không thỏa mãn được bên trong cận.
- Tuyên bố thống nhất với một công cụ bạn không chạy. Mô tả các công cụ đóng từ tài liệu của chúng và nói rõ như vậy.
