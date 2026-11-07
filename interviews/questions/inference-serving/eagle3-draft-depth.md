---
id: eagle3-draft-depth
title: Pick the EAGLE3 draft depth for your concurrency
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer]
rounds: [design-review, ml-depth]
tags: [speculative-decoding, eagle3, draft-depth, concurrency, clock]
minutes: 10
lessons: []
manuals: [vllm-101#s-speed-up-decode-with-eagle3]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn bật một draft EAGLE3 cho Qwen/Qwen3-8B trên một L4 và phải đặt `num_speculative_tokens`. Cấu hình draft gợi ý một giá trị, nhưng bạn muốn tự đặt. Bạn chọn như thế nào, và giá trị đúng dịch chuyển theo số người dùng như thế nào?

## Short answer

Tự đặt độ sâu và quét ở mức đồng thời thật, vì độ sâu có lợi giảm khi thêm người dùng dùng chung mỗi bước. Trên L4 khóa xung của chúng ta ở 32 người dùng, độ sâu 3 cho 333.6 token đầu ra mỗi giây so với 208.8 không speculation, và độ sâu 5 giảm về 289.5, vì vậy các phỏng đoán thêm tốn hơn phần trả lại. Ở một người dùng độ sâu 3 và 5 hòa, vì vậy bắt đầu ở 3 và chỉ dịch chuyển theo một phép đo.

## Full answer

### Why the depth matters

Một draft sâu hơn có thể cho thêm token mỗi lượt target, nhưng mỗi phỏng đoán cũng tốn công trong phép kiểm tra. Với một người dùng GPU có tính toán dư trong mỗi bước, vì vậy các phỏng đoán thêm gần miễn phí. Với nhiều người dùng mỗi bước đã đầy, và phỏng đoán sai lấy tính toán khỏi các token thật.

### The sweep

Các độ sâu 1, 3 và 5 so với không speculation, với xung khóa ở 900 MHz, 512 token vào và 128 ra, mỗi loại hai seed:

| Người dùng | Cấu hình | TPOT trung vị | Token đầu ra/s | Xung SM trung vị |
|---|---|---|---|---|
| 32 | không speculation | 119.9 ms | 208.8 | 881 MHz |
| 32 | độ sâu 1 | 100.4 ms | 271.1 | 900 MHz |
| 32 | độ sâu 3 | 77.8 ms | 333.6 | 900 MHz |
| 32 | độ sâu 5 | 83.7 ms | 289.5 | 885 MHz |
| 1 | độ sâu 1 | 39.4 ms | 22.4 | 900 MHz |
| 1 | độ sâu 3 | 27.8 ms | 31.3 | 900 MHz |
| 1 | độ sâu 5 | 26.2 ms | 31.7 | 900 MHz |

Ở 32 người dùng độ sâu 3 cho đầu ra gấp 1.6 lần không speculation, và phạm vi seed không chồng bất kỳ cấu hình khác. Ở một người dùng độ sâu 3 cắt thời gian mỗi token từ 39.4 xuống 27.8 ms so với độ sâu 1, và độ sâu 5 như nhau trong phạm vi seed. Lần không speculation ở một người dùng giảm xuống 210 MHz, dưới khóa, vì vậy tài liệu không so sánh.

### The stream gets lumpier

TPOT trung vị giảm, nhưng các khoảng giữa các nhóm token tăng. Ở 32 người dùng ITL trung vị tăng từ 84 ms không speculation lên 133 ms ở độ sâu 3. Mỗi bước giờ gửi nhiều token cùng lúc, vì vậy stream đến thành các nhóm lớn hơn và ít thường xuyên hơn.

### The limits of the result

Lợi ích đúng cho prompt ngẫu nhiên và đầu ra 128 token. Các nhóm khác thấy prompt tổng hợp nói quá lợi ích trên prompt thật và độ sâu tốt nhất thay đổi theo kích thước batch. Một nghiên cứu thấy độ dài chấp nhận giảm từ khoảng 3.7 xuống khoảng 1.5 trên các câu trả lời chạy về phía 20,000 token. Kiểm thử riêng của tài liệu đến 4,096 token không thấy giảm đều; độ chấp nhận giữ gần 2.1 đến 2.8 token mỗi bước. Vì vậy kiểm thử trên các câu trả lời dài riêng trước khi tin lợi ích.

### Lock the clock before you compare

Các lần EAGLE3 đầu không có khóa. Ở một người dùng lần không speculation chạy tại 210 MHz và lần EAGLE3 tại khoảng 1,400 MHz. Khoảng cách lớn vậy che giấu tác động speculation, vì vậy các lần đó bị để riêng. Khóa xung SM bằng công cụ driver trước một phép so sánh và thả sau, và chỉ so sánh hai lần ở cùng xung.

### Choose

- Bắt đầu ở 3 cho Qwen3-8B với draft này. Nó cho đầu ra tốt nhất ở 32 người dùng và hòa ở một người.
- Với server bận, quét độ sâu trên mô hình riêng; độ sâu 5 mất đầu ra ở 32 người dùng tại đây.
- Nếu tải thay đổi nhiều trong ngày, vLLM có thể đặt độ sâu theo kích thước batch bằng `num_speculative_tokens_per_batch_size`. Tài liệu chưa kiểm thử.
- Đọc hai counter, `spec_decode_num_draft_tokens` và `spec_decode_num_accepted_tokens`, và chia; đọc ITL P99 và TTFT P99, không chỉ trung vị.

## Follow-ups

- **Level 3:** Tại sao độ sâu 5 thua độ sâu 3 ở 32 người dùng nhưng hòa ở một người? Expected: ở một người dùng bước có tính toán dư, vì vậy thêm hai phỏng đoán gần miễn phí; ở 32 người dùng bước đầy, và mỗi phỏng đoán bị từ chối lấy tính toán khỏi các token thật.
- **Level 3:** Thời gian trung vị mỗi token giảm và người dùng vẫn nói stream không đều. Tại sao? Expected: mỗi bước giờ gửi nhiều token cùng lúc, vì vậy token đến thành các nhóm lớn hơn và ít thường xuyên hơn; ITL trung vị tăng từ 84 lên 133 ms ở độ sâu 3 với 32 người dùng.
- **Level 4:** Tải dao động từ 2 người dùng ban đêm đến 32 ban ngày. Bạn đặt gì? Expected: quét độ sâu ở cả hai tải, vì độ sâu có lợi giảm theo batch; vLLM có thể đặt độ sâu theo kích thước batch, điều tài liệu chưa kiểm thử, vì vậy đo trước khi tin.

## Wrong answers

- "Sâu hơn tốt hơn, vì thêm phỏng đoán nghĩa là thêm token mỗi bước." Ở 32 người dùng độ sâu 5 cho 289.5 token mỗi giây so với 333.6 ở độ sâu 3; các phỏng đoán thêm tốn tính toán hơn phần trả lại.
- "Bỏ độ sâu và để cấu hình draft quyết định." Khi đó bạn không biết thứ gì chạy; tự đặt để con số trong lệnh là con số bạn đo.
- "So sánh speculation với baseline ở một người dùng và phát hành tỷ số." Baseline một người dùng chạy ở 210 MHz trong khi lần EAGLE3 chạy gần 1,400 MHz, vì vậy tỷ số đo xung; so sánh ở cùng xung và tại mức đồng thời bạn phục vụ.
- "Lợi ích trên dataset ngẫu nhiên chuyển sang chat." Prompt tổng hợp nói quá lợi ích và độ chấp nhận có thể giảm trên câu trả lời dài; đo độ chấp nhận trên lưu lượng riêng với độ dài đầu ra thật và không ignore-eos.

## Taught in

[Tăng tốc decode với EAGLE3](../../../manuals/vllm-101/sections/4-1-speed-up-decode-with-eagle3.md) có phép quét độ sâu, các bảng chấp nhận và quy tắc xung.
