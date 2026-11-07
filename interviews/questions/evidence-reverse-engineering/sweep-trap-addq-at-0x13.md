---
id: sweep-trap-addq-at-0x13
title: Every byte decoded, and the jump lands inside an instruction
card: evidence-reverse-engineering
kind: debug
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [debugging, coding]
tags: [reverse-engineering, disassembly, linear-sweep, recursive-descent, oracle]
minutes: 8
lessons: [phases/13-tools-and-protocols/33-disassembly-and-control-flow, phases/13-tools-and-protocols/37-the-reverse-engineering-landscape]
manuals: []
practice: []
cheatsheet: [re-from-scratch-tools]
related: [evidence-reverse-engineering/addend-0x10-table-0x14]
updated: 2026-11-03
---

Một hàm 24 byte giữ một bảng bốn byte `31 c0 90 48` bên trong thân và nhảy qua nó bằng `jmp 0x14`. `llvm-objdump -d` in `xorl %eax, %eax`, `nop`, và `addq $0x1, %rax` tại `0x13`; mọi byte giải mã được và một `retq` hiện diện. Nêu ba cách listing này sai, nói phương pháp nào làm đúng và tại sao công cụ tham chiếu mắc cùng sai lầm, và nói sự đồng thuận giữa decoder của bạn và công cụ đó chứng minh và không chứng minh điều gì.

## Short answer

Listing sai ba lần: nhảy tại `0xe` nhắm `0x14` và không lệnh nào trong listing bắt đầu ở đó; lệnh chạy tại `0x14` là một lệnh 32 bit `addl $0x1, %eax`, trong khi listing hiển thị một `addq` 64 bit sớm một byte vì byte cuối bảng `48` bị nuốt như một REX prefix; và bốn byte bảng xuất hiện như mã. Duyệt đệ quy từ symbol theo nhảy, giải mã sáu lệnh, đọc `addl` tại đích và không nhận byte bảng hoặc đệm nào. Chính `llvm-objdump` là một lượt quét tuyến tính, vì vậy nó thừa hưởng điểm mù của lượt quét: đồng thuận với nó kiểm tra decoder trên các ranh giới lệnh, và chỉ duyệt đệ quy kiểm tra những lệnh nào chạy.

## Full answer

### Two methods, opposite failures

Một lượt quét tuyến tính bắt đầu tại byte đầu của code section, giải mã một lệnh, tiếp tục tại byte sau nó, và dừng ở cuối; dữ liệu trong mã bị giải mã thành lệnh, và trên x86 decoder thường đồng bộ lại trong vài byte, là lý do lỗi khó thấy và phương pháp được nói là thất bại âm thầm. Duyệt đệ quy bắt đầu tại một điểm vào đã biết, theo các nhảy trực tiếp và cả hai nhánh của một điều kiện, tiếp tục sau một call, dừng tại một return, và giữ một tập đã thăm. Thất bại của nó ngược lại: một nhảy gián tiếp không có đích trong các byte, vì vậy việc duyệt dừng ở đó và mọi block chỉ tới được qua nó giữ chưa biết, là điều xảy ra tại `jmpq *%rax` trong `grade` chưa tối ưu.

### The trap under five tools

Harness so sánh báo cáo lượt quét với 8 điểm bắt đầu lệnh trong vùng trap, với các điểm bắt đầu thêm tại `0x10`, `0x12` và `0x13` và thiếu một điểm bắt đầu tại `0x14`. Ba bộ xây graph báo cáo 6 điểm bắt đầu, 2 block và 1 cạnh, và để `0x10` đến `0x14` không được nhận. Một framework cũng bịa một hàm trên các byte bảng, hai lệnh trong một block bốn byte, vì vậy byte REX tại `0x13` không thuộc lệnh nào. Phát hiện cuối là phát hiện hữu ích: không bộ xây graph nào giải mã `0x10` đến `0x14`, vì vậy các byte đó nằm bên trong một hàm và là dữ liệu.

### What the oracle is for

Decoder phải đồng ý với `llvm-objdump -d` trên mọi lệnh của mọi fixture, và nó có, trên 86, 56, 84 và 11 lệnh, tổng cộng 237. Sự đồng thuận đó chứng minh decoder đọc prefix, opcode, ModRM, SIB, độ dời và giá trị tức thời theo cách tài liệu nói. Nó không chứng minh gì về khả năng tới được, vì oracle chưa bao giờ hỏi. Một phép đo chín disassembler trên 981 binary được trình biên dịch sinh thấy dữ liệu inline hiếm hơn tài liệu nghiên cứu giả định và điểm bắt đầu hàm là thao tác nguyên thủy khó; trap hiếm trong đầu ra trình biên dịch, và nhảy gián tiếp phổ biến.

### Byte accounting

So sánh hai phương pháp từng byte. Các byte chỉ lượt quét nhận là phần đệm, dữ liệu, mã đằng sau một nhảy gián tiếp, hoặc mã của một hàm không có điểm vào đã biết. Lượt quét giải mã toàn bộ section, vì vậy đây là các byte cần giải trình. Các byte duyệt đệ quy nhận là những byte nó tới từ điểm vào đó; đó là khả năng tới được, không phải bằng chứng chúng chạy.

## Follow-ups

- **Level 2:** Đổi byte bảng cuối từ `48` thành `e8` và dựng lại. Lượt quét in gì? Expected: một `callq` nuốt `addl` và `retq`, với một đích ngoài section; hàm có vẻ không có return.
- **Level 3:** Tại sao duyệt đệ quy dừng tại `jmpq *%rax` trong `grade` chưa tối ưu, và điều gì sửa nó? Expected: không đích nào trong các byte; resolver đọc năm relocation của bảng và đẩy bốn đích riêng biệt.
- **Level 3:** "Thất bại âm thầm" nghĩa là gì về vận hành? Expected: decoder đồng bộ lại trong vài byte và không phát hiện gì trừ khi gặp một opcode không hợp lệ, vì vậy một listing sai trông hoàn chỉnh.
- **Level 4:** Bạn phân loại các byte duyệt đệ quy không nhận như thế nào? Expected: phần đệm, dữ liệu, mã sau một nhảy gián tiếp, hoặc một phần hàm không có điểm vào đã biết; giải trình mọi byte là một trong những loại này hoặc được duyệt đệ quy tới.

## Wrong answers

- "Công cụ tham chiếu đúng vì nó là tham chiếu." Nó là một lượt quét; nó là oracle cho giải mã, không cho khả năng tới được.
- "Chỉ dùng duyệt đệ quy." Nó dừng tại các nhảy gián tiếp và để mã tới được chưa biết cho đến khi một bảng được khôi phục.
- "Mọi byte giải mã được, vì vậy listing hoàn chỉnh." Một listing nói những byte nào tạo thành lệnh nào, không nói những lệnh nào chạy.

## Taught in

[Bài học disassembly](../../../phases/13-tools-and-protocols/33-disassembly-and-control-flow/) xây cả hai phương pháp và fixture trap, và [bài học toàn cảnh](../../../phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/) chạy năm công cụ trên nó và giải trình mọi byte.
