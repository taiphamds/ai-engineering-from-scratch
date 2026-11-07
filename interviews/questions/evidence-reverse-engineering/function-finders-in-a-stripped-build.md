---
id: function-finders-in-a-stripped-build
title: nm says one function, the file has five
card: evidence-reverse-engineering
kind: tradeoff
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [screen, system-design]
tags: [reverse-engineering, stripped-binary, function-starts, signatures, mach-o]
minutes: 8
lessons: [phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries]
manuals: []
practice: []
cheatsheet: [re-from-scratch-tools]
related: [evidence-reverse-engineering/sweep-trap-addq-at-0x13]
updated: 2026-11-03
---

Một executable arm64 đã strip giữ năm hàm, và `nm` liệt kê một tên. So sánh bốn cách khôi phục các điểm bắt đầu hàm, chấm mỗi cách so với bản song sinh chưa strip ở `-O0` và `-O2`, và nói bạn đặt tên các hàm sau đó như thế nào và việc đặt tên đó va chạm ở đâu.

## Short answer

Bảng riêng của trình biên tập liên kết thắng: `LC_FUNCTION_STARTS` là chín byte các độ lệch uleb128 liệt kê tất cả năm điểm bắt đầu ở cả hai mức, và `strip` không đụng nó. Một lượt quét prologue cho phép lưu frame đánh chỉ số trước tìm 0 trên 5, vì trình biên dịch phát `sub sp, sp, #N` trước; một mask cho `sub` đó tìm 5 trên 5 ở `-O0` và 1 trên 5 ở `-O2`, nơi bốn hàm lá hoàn toàn không có frame. Các đích call cộng điểm vào tìm 5 trên 5, vì một `bl` vào giữa một hàm là thứ trình biên dịch không phát cho C. Tên đến từ các chữ ký được xây từ các object riêng của bạn, một mẫu 32 byte với các byte relocation là wildcard và một CRC16 của đuôi; ở `-O2` hai hàm dùng chung 36 byte đầu vì một hàm inline hàm kia, và byte đuôi tại 44 cùng độ dài 60 so với 72 tách va chạm.

## Full answer

### The four finders

| Phương pháp | Nó đọc gì | `-O0` | `-O2` | Tại sao |
|---|---|---|---|---|
| `LC_FUNCTION_STARTS` | các độ lệch uleb128 trong `__LINKEDIT` | 5 trên 5 | 5 trên 5 | được viết cho unwinder và crash reporter; sống sót qua `strip` |
| prologue lưu frame | `stp x29, x30, [sp, #-0x10]!` | 0 trên 5 | 0 trên 5 | trình biên dịch lưu cặp tại một offset dương sau `sub sp` |
| mask `sub sp` | `(word & 0xff0003ff) == 0xd10003ff` | 5 trên 5 | 1 trên 5 | các hàm lá ở `-O2` không cấp phát frame; một hàm bắt đầu với `cbz` |
| các đích call | mọi `bl` trong `__text`, cộng mục vào `LC_MAIN` | 5 trên 5 | 5 trên 5 | không gì gọi `main`, vì vậy điểm vào được thêm bằng tay |

Không dương tính giả xuất hiện ở đây vì chương trình nhỏ. Các mẫu một byte như byte `push rbp` của x86-64 khớp bên trong các lệnh khác, là lý do các file mẫu thật ghép một mẫu bắt đầu với một byte phải kết thúc hàm trước. Ưu tiên các bảng trình biên tập liên kết viết, rồi các đích call để lấp khoảng trống, và quét byte cuối cùng.

### What strip leaves per format

Các tên loader ràng buộc sống sót ở mọi nơi: import và export trong bảng symbol động, các thư mục import và export của một PE image, bảng import nối chuỗi và exports trie của một Mach-O. Các điểm bắt đầu hàm sống sót dưới dạng dữ liệu unwind (`.eh_frame` trừ khi được dựng không có bảng unwind), dưới dạng các mục `.pdata` cho các hàm không phải lá trong một PE image, và dưới dạng `LC_FUNCTION_STARTS`. Bảng symbol tĩnh và các section debug biến mất. Một thư viện strip hoàn toàn có bảng symbol giữ không bản ghi vẫn liên kết, vì trình biên tập liên kết đọc exports trie.

### Signatures and the collision

Một chữ ký là 32 byte đầu của một hàm với mọi byte được relocation đánh dấu biến thể, một CRC16 trên các byte sau mẫu đến byte biến thể đầu, và các tên mà hàm tham chiếu. Được xây từ các object chưa strip và áp dụng tại mọi điểm bắt đầu được khôi phục, các chữ ký đặt tên tất cả năm hàm ở cả hai mức. Ở `-O2` hai hàm va chạm tạo các dòng mẫu và CRC giống hệt; báo cáo ghi cả hai ứng viên và byte quyết định chúng. Một va chạm không gì tách được giữ là một điều chưa biết. Tiền đề cũng được kiểm tra: mọi byte không biến thể của mỗi hàm object bằng byte tại cùng offset trong file đã liên kết, vì vậy trình biên tập liên kết chỉ thay đổi các word được relocation.

## Follow-ups

- **Level 2:** Tại sao lượt quét lưu frame không tìm gì ngay cả ở `-O0`? Expected: trình biên dịch phát `sub sp` trước và lưu bản ghi frame tại một offset dương, vì vậy dạng đánh chỉ số trước không bao giờ xuất hiện.
- **Level 3:** Tại sao `strip` không thể bỏ bảng điểm bắt đầu hàm? Expected: unwinder và crash reporter đọc nó, trình biên tập liên kết viết nó vào `__LINKEDIT`, và chỉ bảng symbol là của debugger.
- **Level 3:** Hai chữ ký khớp tại cùng điểm bắt đầu. Bạn ghi lại gì? Expected: cả hai ứng viên, byte đuôi và các độ dài tách chúng, và một điều chưa biết khi không gì tách được.
- **Level 4:** Bảng nào đóng vai trò này trong một PE image, và nó bỏ ai? Expected: `.pdata` với các mục `RUNTIME_FUNCTION`, bỏ các hàm lá không cấp phát stack và không gọi gì.

## Wrong answers

- "`nm` hiển thị một hàm, vì vậy có một hàm." Nó hiển thị bảng symbol; bảng điểm bắt đầu của trình biên tập liên kết liệt kê năm.
- "Quét prologue chuẩn." Ở `-O2` bốn trong năm hàm không có frame; lượt quét báo cáo điều trình biên dịch chọn phát.
- "Một CRC khớp chứng minh tên." Hai hàm dùng chung mẫu và CRC; byte đuôi và các độ dài quyết định, và bản ghi nói vậy.

## Taught in

[Bài học liên kết](../../../phases/13-tools-and-protocols/40-linking-loading-and-stripped-binaries/) chấm bốn bộ tìm so với bản song sinh chưa strip và xây các chữ ký va chạm ở `-O2`.
