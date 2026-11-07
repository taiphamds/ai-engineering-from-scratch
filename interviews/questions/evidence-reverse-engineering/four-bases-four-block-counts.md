---
id: four-bases-four-block-counts
title: Three addresses for grade and four block counts
card: evidence-reverse-engineering
kind: debug
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, design-review]
tags: [reverse-engineering, tool-comparison, load-address, basic-blocks, jump-table]
minutes: 10
lessons: [phases/13-tools-and-protocols/37-the-reverse-engineering-landscape, phases/13-tools-and-protocols/33-disassembly-and-control-flow]
manuals: []
practice: []
cheatsheet: [re-from-scratch-tools, reverse-engineering]
related: [evidence-reverse-engineering/sweep-trap-addq-at-0x13]
updated: 2026-11-03
---

Một agent chạy bốn công cụ trên một object có thể tái định vị và báo cáo rằng `grade` nằm tại `0x08000050` trong một công cụ, `0x400010` trong công cụ khác và `0x100010` trong công cụ thứ ba, vì vậy các công cụ không đồng ý về vị trí hàm. Trên object `-O0` nó rồi báo cáo 3, 8, 8 và 9 basic block cho cùng hàm. Giải thích cả hai báo cáo, và nói một số đếm block đo gì.

## Short answer

Object không có địa chỉ nạp, vì vậy mỗi công cụ chọn một địa chỉ: `0x08000000` cho file trong hai công cụ, đặt `.text` tại `0x08000040`, `0x400000` trong công cụ thứ ba, `0x100000` trong công cụ thứ tư, và lượt quét in offset hoàn toàn không có base. Trừ địa chỉ `.text` của mỗi công cụ và mọi đáp án là `0x10`, đúng như bảng symbol nói. Các số đếm block là bốn đáp án cho việc mỗi công cụ theo một nhảy gián tiếp xa đến đâu và cắt ở đâu: 3 block là một công cụ dừng tại `jmp rax` và để 36 byte không được tới, 8 với 11 cạnh là một công cụ đọc năm relocation đằng sau bảng và tìm bốn đích riêng biệt, 8 với 7 cạnh là một công cụ có các case block tồn tại nhưng chuyển điều khiển tại `0x62` đi đến một nút không giải quyết được, và 9 với 12 cạnh là một công cụ có phân tích switch đặt một nhãn trên nhảy tại `0x74` và mô hình block của nó bắt đầu một block mới tại một nhãn.

## Full answer

### Reduce before you compare

Harness đọc base từ mỗi capture và so sánh sau khi rút về. Một bất đồng trên các địa chỉ thô là một bất đồng về loader, và kiểm thử rằng mọi công cụ đặt `grade` tại offset `0x10` từ base riêng là điều đầu tiên cần cố định. Các loader cũng khác nhau về relocation: một xử lý chúng khi import, một áp dụng chúng, và một in một gợi ý rằng relocation chưa được áp dụng trừ khi một thiết lập nói vậy. Điều một loader làm với relocation quyết định mọi giai đoạn sau có thể thấy gì.

### Compare in order, read the notes

Các điểm bắt đầu lệnh trước: trong trường hợp đồng thuận cả bốn công cụ báo cáo cùng điểm bắt đầu trong mọi hàm, và bốn bộ xây graph báo cáo 3, 3, 5 và 4 block với các tập cạnh giống hệt. Rồi block, rồi cạnh, và ghi chú riêng của mỗi công cụ trước khi phán xét một số đếm: một `switch_op` với năm case và bốn đích riêng biệt, một luồng `COMPUTED_JUMP` với bốn đích, hoặc một nút đích không giải quyết được giải thích phần lớn khác biệt. Cả bốn công cụ giải mã cùng 33 lệnh khi tới được chúng. Graph bài học-33 có 8 block và 11 cạnh, và một công cụ khớp chính xác; công cụ có 9 và 12 tìm cùng bốn đích và tách một block tại một nhãn.

### Where tools invent and miss

Một framework kết thúc một block tại một `call`, vì IR block của nó là một đầu vào nhiều đầu ra, vì vậy một hàm gọi hàm khác báo cáo 2 block nơi ba công cụ còn lại báo cáo 1 cho cùng các lệnh. Cùng framework bịa các hàm tại những khoảng đệm không có symbol, 9 trên bốn object, và thêm một trên bảng trap. Lượt quét giải mã các byte đệm mà không bộ xây graph nào coi là mã. Harness nêu một vùng bị bỏ sót trong một công cụ, 36 byte case của `grade`, và không hàm bị bỏ sót trong bất kỳ công cụ nào.

### What was run and what was read

Hai công cụ thương mại chỉ được mô tả từ tài liệu và được đánh dấu là chưa chạy trong figure và bảng. Một mô tả là bằng chứng hữu ích thuộc loại khác với một capture, và báo cáo nói cái nào là cái nào. Mọi capture được lưu với lệnh, phiên bản và ngày; một bất đồng bạn không thể đọc lại không phải một phát hiện.

## Follow-ups

- **Level 3:** Một công cụ báo cáo 9 block và 12 cạnh, công cụ khác 8 và 11, cho cùng luồng điều khiển. Ai sai? Expected: không ai; một nhãn trên nhảy gián tiếp bắt đầu một block mới, và cả hai tìm cùng bốn đích được tính.
- **Level 3:** Trên hàm gọi `grade`, một công cụ báo cáo hai block và các công cụ còn lại một. Giải thích. Expected: IR block của công cụ đó kết thúc tại một call; tập lệnh giống nhau.
- **Level 4:** Một listing hiển thị bốn case block là mã chết. Bạn phân loại các byte đó như thế nào? Expected: bị bỏ sót bởi một lần duyệt đã dừng, vì ba công cụ tới chúng qua bảng; việc tính byte nêu vùng và công cụ.
- **Level 4:** Bạn không thể chạy hai công cụ thương mại. Chúng xuất hiện trong báo cáo như thế nào? Expected: từ tài liệu của chúng, được đánh dấu là chưa chạy, không có con số đo được gán cho chúng.

## Wrong answers

- "Công cụ có nhiều block nhất tìm nhiều mã nhất." Block thêm là một lần tách nhãn; cả bốn giải mã cùng các lệnh ở nơi chúng tới được.
- "So sánh các địa chỉ thô; các công cụ bất đồng." Object có thể tái định vị, và mỗi công cụ chọn một base; offset đồng ý.
- "Công cụ quét hỏng vì nó in `0x10`." Nó in các offset section không có base, là đáp án đúng khi base được bỏ.

## Taught in

[Bài học toàn cảnh](../../../phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/) rút bốn base về và giải thích mỗi số đếm block từ ghi chú riêng của công cụ, và [bài học disassembly](../../../phases/13-tools-and-protocols/33-disassembly-and-control-flow/) xây graph mà các số đếm được so với.
