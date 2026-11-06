---
name: dynamic-analysis-of-your-own-program
description: Điều khiển lldb hoặc gdb ở chế độ batch trên một chương trình bạn đã biên dịch, ghi lại các thanh ghi và bộ nhớ tại mỗi lần dừng, và chấm mỗi khẳng định tĩnh là được xác nhận, bị bác bỏ, hoặc không được quan sát cho lần chạy đó.
version: 1.0.0
phase: 13
lesson: 42
tags: [reverse-engineering, dynamic-analysis, lldb, gdb, breakpoints, watchpoints, core-dumps, evidence]
---

Với một chương trình bạn đã viết và biên dịch cùng thông tin gỡ lỗi, một bản liệt kê disassembly của bản dựng đó, và một danh sách các khẳng định tĩnh từ phân tích trước, hãy tạo một lần chạy debugger có bản ghi được lưu, và một bản ghi bằng chứng cho mỗi khẳng định tại mỗi lần dừng. Dùng skill này với Claude, Cursor, Codex, OpenClaw, Hermes, hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Mã nguồn, lệnh biên dịch chính xác, và tệp nhị phân nó tạo ra. Chỉ gỡ lỗi các bản dựng do chính bạn tạo.
- Một bản liệt kê từ `llvm-objdump -d` hoặc `objdump -d` của tệp nhị phân đó, để các địa chỉ breakpoint đến từ bản liệt kê chứ không từ trí nhớ.
- Bản dump DWARF của các kiểu struct mà các khẳng định đề cập, hoặc bố cục `ctypes`, làm nguồn các độ lệch trường.
- Các khẳng định cần kiểm tra, mỗi khẳng định là một câu với hàm, thanh ghi hoặc địa chỉ, giá trị hoặc cạnh kỳ vọng, và bài học hoặc tài liệu nó đến từ.
- Một trình gỡ lỗi: lldb từ Command Line Tools hoặc Xcode trên macOS, lldb hoặc gdb trên Linux. Ghi lại chuỗi phiên bản.

## Procedure

1. Đọc bản liệt kê. Với mỗi hàm trong các khẳng định, ghi lại địa chỉ bắt đầu và kết thúc của nó. Với mỗi nhánh có điều kiện trong một hàm có một khẳng định cạnh, ghi lại địa chỉ nhánh, đích của nó, và địa chỉ fall-through của nó.
2. Viết các lệnh debugger vào một tệp trước khi bạn chạy bất cứ thứ gì: một `breakpoint set -n` cho mỗi hàm, một `breakpoint set -a ADDR -s MODULE` cho mỗi nút kế tiếp của nhánh, một stop hook đọc các thanh ghi đối số, bộ nhớ đằng sau đối số đầu tiên, và các biến frame, rồi `run`, watchpoint bạn muốn, một ngân sách cố định `continue`, và `breakpoint list` cùng `watchpoint list -v` ở cuối.
3. Chạy debugger ở chế độ batch với `settings set interpreter.stop-command-source-on-error false` để một lệnh thất bại sau khi tiến trình thoát không kết thúc phiên. Lưu toàn bộ đầu ra làm bản ghi với dòng lệnh và phiên bản debugger trong một header.
4. Phân tích bản ghi thành các lần dừng. Mỗi lần dừng có một bộ đếm chương trình, một hàm, một lý do dừng, các thanh ghi và bộ nhớ mà hook đã in, và các biến frame. Gắn đầu ra hook vào báo cáo dừng theo sau nó.
5. Chấm mỗi khẳng định tại mỗi lần dừng có thể kiểm tra nó. Một khẳng định thanh ghi so sánh thanh ghi với biến frame. Một khẳng định độ lệch trường giải mã các word bộ nhớ qua các độ lệch DWARF và so sánh chúng với các trường biến frame. Một khẳng định cạnh đọc giá trị được so sánh tại điểm vào hàm và kiểm tra rằng lần dừng tiếp theo là nút kế tiếp mà điều kiện đã nâng dự đoán. Một khẳng định cạnh gọi đếm các lần dừng điểm vào sau khi tiến trình đã thoát.
6. Viết `confirmed` khi quan sát đồng ý, `refuted` khi nó không đồng ý, và `not-observed` khi không lần dừng nào có thể kiểm tra khẳng định. Nói lý do nó không được quan sát: breakpoint chưa bao giờ chạm, watchpoint chưa bao giờ được đặt, hoặc tiến trình không thoát.
7. Lặp lại trên một bản dựng được tối ưu của cùng mã nguồn. Kỳ vọng các breakpoint phân giải được với số lần chạm 0 ở nơi trình biên dịch đã nội tuyến hàm, và giữ các khẳng định đó là `not-observed` trừ khi khẳng định là về chính cạnh gọi, điều mà lần chạy đầy đủ bác bỏ.
8. Nếu lần chạy không thể bắt đầu, ghi lại lỗi chính xác. Trên macOS một shell trong sandbox báo cáo `attach failed ((os/kern) invalid address)`, và một đích được harden không có `com.apple.security.get-task-allow` từ chối cổng tác vụ. Không điều nào là bằng chứng về chương trình.

## Required report

- trình biên dịch, phiên bản debugger, hệ điều hành, và các cờ dựng của mọi tệp nhị phân được dùng
- các tên tệp bản ghi và lệnh đã tạo từng tệp
- các lần dừng theo thứ tự với bộ đếm chương trình, hàm, lý do, và các thanh ghi đã đọc
- mọi khẳng định cùng kết luận, các chỉ mục lần dừng đã tạo kết luận, và văn bản quan sát
- các số lần chạm breakpoint và số lần chạm watchpoint từ cuối lần chạy
- trạng thái thoát tiến trình và đầu ra chuẩn của nó
- các khẳng định vẫn `not-observed` và lý do cho từng khẳng định

## Hard rejects

- Coi một breakpoint phân giải được là bằng chứng rằng mã chạy.
- Coi số lần chạm bằng không là bằng chứng rằng một hàm là mã chết.
- Đọc một struct qua một con trỏ mà không có các độ lệch trường từ DWARF hoặc từ các quy tắc ABI.
- So sánh một thanh ghi đối số tại một lần dừng không phải điểm vào hàm, nơi thanh ghi có thể giữ một giá trị còn lại.
- Chấm một khẳng định cạnh chỉ từ lệnh nhánh thay vì từ lần dừng tại nút kế tiếp.
- Đặt một watchpoint trên một biến cục bộ nằm trong thanh ghi ở một bản dựng được tối ưu và báo cáo sự im lặng làm bằng chứng.
- Chạy debugger với một tệp nhị phân bạn không dựng, hoặc attach vào một tiến trình bạn không sở hữu.
- Xóa bản ghi sau khi chấm. Bản ghi là bằng chứng; các kết luận được suy ra từ nó.
- Báo cáo một lần chạy trên một đầu vào như một phát biểu về mọi đầu vào.

## Produce

Trả về những phần này:

1. Bản dựng: trình biên dịch, các cờ, debugger, và các tệp bản liệt kê cùng DWARF được dùng.
2. Kế hoạch: tệp lệnh như đã viết, với địa chỉ của mọi breakpoint và nơi nó đến từ.
3. Các lần dừng: dòng thời gian, một hàng cho mỗi lần dừng.
4. Các kết luận: một hàng cho mỗi khẳng định với các số lượng được xác nhận, bị bác bỏ, và không được quan sát và kết luận cuối cùng.
5. Không được quan sát: mỗi khẳng định không lần dừng nào kiểm tra, kèm lý do.
6. Các thông tin môi trường: các cờ ký của tệp nhị phân, số watchpoint phần cứng, và bất kỳ lỗi khởi chạy nào.

Kết thúc bằng khẳng định bị bác bỏ đầu tiên. Nếu không có, hãy nêu số lần dừng và số khẳng định được chúng xác nhận.
