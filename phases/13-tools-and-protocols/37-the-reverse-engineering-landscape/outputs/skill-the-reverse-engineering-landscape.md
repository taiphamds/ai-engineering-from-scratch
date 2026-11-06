---
name: the-reverse-engineering-landscape
description: Chạy nhiều disassembler và decompiler trên một object bạn đã dựng, chuẩn hóa các địa chỉ của chúng và báo cáo nơi chúng đồng nhất và nơi mỗi công cụ bịa hoặc bỏ lỡ mã.
version: 1.0.0
phase: 13
lesson: 37
tags: [reverse-engineering, tool-comparison, disassembly, control-flow-graph, intermediate-representation, ghidra, radare2, rizin, angr]
---

Với một object có thể tái định vị hoặc đã liên kết mà bạn tự dựng, lệnh compiler tạo ra nó và hai hoặc nhiều công cụ phân tích, tạo một phép so sánh nói, với mọi hàm, những công cụ nào đồng nhất về các điểm bắt đầu chỉ lệnh, khối và cạnh, và các byte nào mỗi công cụ giải mã mà các công cụ khác không. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp object và compiler cùng lệnh chính xác tạo ra nó.
- Bảng symbol của object (tên hàm, offset, kích thước) được đọc từ chính tệp.
- Với mỗi công cụ: chuỗi phiên bản, lệnh headless chính xác và đầu ra thô được thu vào một tệp cạnh object.
- Địa chỉ mà mỗi công cụ cho section `.text`, để mọi địa chỉ có thể được quy về một offset section.
- Harness bài 37 (`code/main.py`) hoặc một harness tương đương đọc các bản thu và không bao giờ tin một công cụ làm oracle.

## Procedure

1. Thu trước, so sánh sau. Chạy mọi công cụ một lần ở chế độ headless (`llvm-objdump -d -r`, `r2 -qc`, `rizin -qc`, một script angr, `analyzeHeadless -postScript`), lưu đầu ra và ghi lệnh cùng phiên bản trong một manifest. Không bao giờ so sánh đầu ra trực tiếp mà bạn không thể đọc lại.
2. Đọc các function symbol từ bảng symbol ELF. Chúng là ground truth chung duy nhất. Tính các khoảng trống padding giữa các hàm.
3. Chuẩn hóa mọi địa chỉ về một offset `.text` bằng cách trừ địa chỉ cơ sở mà mỗi công cụ báo cáo cho section. Kiểm tra rằng một hàm đã biết nằm ở cùng offset trong mọi công cụ trước khi bạn so sánh bất cứ thứ gì khác.
4. Với mỗi phạm vi hàm, thu thập tập các điểm bắt đầu chỉ lệnh theo công cụ. Lấy tập đa số trên các bộ dựng đồ thị và báo cáo, theo công cụ, các điểm bắt đầu nó thêm và các điểm bắt đầu nó thiếu.
5. Thu thập các điểm bắt đầu khối và các cạnh theo công cụ dưới dạng các cặp offset. Báo cáo các số đếm và liệu các tập khớp hay không. Khi các số đếm khác nhau, liệt kê các cạnh mà mỗi công cụ thiếu so với hợp, và đọc các ghi chú riêng của công cụ (phân giải switch, bước nhảy tính toán, đích không thể phân giải) trước khi phán đoán.
6. Hạch toán byte. Với mỗi công cụ, ghi các byte mã bên trong symbol, các byte padding được nhận và các byte symbol không được nhận. Đặt tên các byte một công cụ nhận mà đa số không nhận là mã được bịa, và các byte nó để lại mà đa số giải mã là mã bị bỏ lỡ. Các byte bên trong một symbol mà không bộ dựng đồ thị nào giải mã là dữ liệu.
7. So sánh đầu ra decompiler trên một hàm nhỏ với một mẫu đã biết (một phép chia cho một hằng số, một switch). Ghi chú công cụ nào gộp mẫu và công cụ nào để lại phép toán đã nâng.
8. Với các công cụ bạn chưa chạy, nói vậy trong báo cáo và chỉ mô tả chúng từ tài liệu của chúng.

## Output

Với object, báo cáo:

- compiler, lệnh, tên object và manifest các phiên bản công cụ cùng lệnh
- địa chỉ cơ sở mà mỗi công cụ sử dụng và kiểm tra offset trên một hàm
- theo hàm: sự đồng nhất điểm bắt đầu chỉ lệnh, các điểm bắt đầu thừa và thiếu theo công cụ, số khối, số cạnh, các tập cạnh thiếu theo công cụ
- theo công cụ: byte mã bên trong symbol, byte padding được nhận, byte symbol không được nhận, các phạm vi được bịa, các phạm vi bị bỏ lỡ
- các phạm vi dữ liệu bên trong symbol mà không bộ dựng đồ thị nào giải mã
- các hàm một công cụ bịa không có symbol, và các hàm nó bỏ lỡ
- đầu ra decompiler cho một hàm mỗi công cụ với mẫu được nêu tên
- danh sách các công cụ chỉ được mô tả từ tài liệu

## Failure modes

- So sánh các địa chỉ trước khi trừ địa chỉ cơ sở của mỗi công cụ, khiến mọi công cụ trông sai.
- Coi một công cụ là oracle. Một linear sweep đồng nhất với chính nó trên các byte dữ liệu.
- Đọc một số khối như một phép đo mã được tìm thấy. Một lần tách nhãn hoặc một heuristic padding thay đổi số đếm mà không thay đổi mã.
- Bỏ các ghi chú riêng của một công cụ (phân giải switch, bước nhảy không thể phân giải) khỏi báo cáo, che giấu vì sao các số cạnh khác nhau.
- Chạy các công cụ trực tiếp bên trong các bài kiểm tra. Các bản thu với lệnh và phiên bản được ghi lại là thứ khiến một bất đồng có thể tái tạo.
- Mô tả một công cụ bạn chưa chạy như thể bạn đã chạy nó.
- So sánh các bản thu được tạo từ các object khác nhau hoặc các phiên bản compiler khác nhau.
