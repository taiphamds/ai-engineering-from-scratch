---
id: take-home-bpe-tokenizer
title: Take-home, a byte-level tokenizer with tests
card: tokenization-decoding
kind: take-home
level: 3
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [take-home, coding]
tags: [take-home, bpe, byte-level, special-tokens, round-trip]
minutes: 15
lessons: [phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/10-llms-from-scratch/02-building-a-tokenizer, phases/10-llms-from-scratch/01-tokenizers]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [tokenization-decoding/bpe-training-loop, tokenization-decoding/read-the-decoder-round-trip]
updated: 2026-11-03
---

Đây là một bài làm ở nhà chúng tôi gửi: triển khai một tokenizer byte-pair cấp byte với huấn luyện, mã hóa và giải mã, hai token đặc biệt dành riêng, và một bộ kiểm thử. Mô tả thiết kế bạn sẽ nộp, các kiểm thử bạn sẽ cung cấp, và một hình bạn sẽ đưa vào báo cáo.

## Short answer

Dành các id 0 đến 255 cho các byte thô và một block nhỏ phía trên chúng cho các dấu kết thúc văn bản và pad, tách kho ngữ liệu theo khoảng trắng và dấu câu, huấn luyện bằng cách đếm các cặp liền kề có trọng số tần suất và gộp cặp hàng đầu với phá hòa xác định, mã hóa bằng cách áp dụng phép gộp có thứ hạng thấp nhất khớp cho đến khi không phép nào khớp, và giải mã bằng cách nối các phần mở rộng byte và giải mã UTF-8 một lần. Các kiểm thử ghim round trip chính xác từng byte trên một câu chưa thấy, trên một emoji và trên một chuỗi token đặc biệt nguyên văn với cờ allow bật và tắt, cùng đặc tính thứ tự gộp và các id dành riêng. Hình là đường cong nén: độ dài mã hóa của một câu giữ lại khi từ vựng mục tiêu tăng từ 300 lên 600.

## Full answer

### The design

```text
ids 0..255        raw bytes
next few ids      <|endoftext|>, <|pad|>
then              one id per merge, in training order
```

- **Giữ các byte đầu vào** nguyên trạng, để round trip chính xác từng byte. Chuẩn hóa tương thích ánh xạ một chữ ghép hoặc một chữ cái toàn chiều rộng về dạng thuần và có mất mát, nên chỉ thêm nó nếu báo cáo giới hạn lời hứa round trip vào văn bản đã chuẩn hóa.
- **Tách trước** thành các từ và dấu câu để các phép gộp giữ bên trong một từ; mẫu regex của các tokenizer production lớn là một mở rộng tùy chọn.
- **Huấn luyện**: đếm các cặp liền kề trên kho ngữ liệu đã tách có trọng số theo tần suất từ, gộp cặp hàng đầu thành id trống tiếp theo, ghi phép gộp, lặp tới kích thước mục tiêu. Phá hòa theo chính cặp để hai lần chạy cho cùng bảng.
- **Mã hóa**: khớp chính xác các token đặc biệt trước khi cờ allow bật; với văn bản thông thường bắt đầu từ các byte và lặp áp dụng phép gộp có thể áp dụng có thứ hạng thấp nhất.
- **Giải mã**: các id đặc biệt ánh xạ tới các chuỗi dấu, mọi id khác tới các byte; nối mọi byte, rồi giải mã một lần với thay thế cho một ký tự cuối chưa đầy đủ.

### The tests

1. Round trip trên một câu tokenizer chưa bao giờ thấy.
2. Round trip trên một câu có một emoji, nơi 4 byte của ký tự có thể trải qua các token.
3. Round trip trên một câu chứa chuỗi kết thúc văn bản nguyên văn, với cờ tắt nó trở thành các byte và với cờ bật nó trở thành id dành riêng.
4. Thứ tự gộp: một từ giữ lại mã hóa thành các id được ghi, và một bảng bị xáo trộn không như vậy.
5. Các id dành riêng không bao giờ xuất hiện như các đích gộp và không bao giờ va chạm với các id byte.
6. Tính xác định: huấn luyện hai lần trên cùng kho ngữ liệu cho cùng bảng.

### The figure

Huấn luyện tới nhiều kích thước mục tiêu, mã hóa cùng câu giữ lại mỗi lần, và vẽ số token theo kích thước từ vựng. Số lượng giảm khi các phép gộp bao phủ các mảnh dài hơn. Một đường thứ hai với tỷ lệ nén, token chia byte đầu vào nơi 0.50 nghĩa là số token bằng nửa số byte, cho thấy cùng điều trong một đơn vị chuyển được giữa các kho ngữ liệu.

### What a reviewer grades

Tính đúng đắn của round trip, tính xác định, tách sạch đường token đặc biệt khỏi đường gộp, chất lượng các kiểm thử, và một báo cáo nêu bug mà ứng viên gặp. Tốc độ không được chấm: Python ở quy mô này hoàn tất trong dưới một giây khá xa, và các thư viện production bằng ngôn ngữ được biên dịch nhanh hơn 10 đến 100 lần cho cùng thuật toán.

## Follow-ups

- **Level 2:** Tại sao các byte thô lấy id 0 đến 255 trước bất cứ thứ gì? Expected: mọi đầu vào khi đó có thể được biểu diễn trong từ vựng trước khi bất kỳ phép gộp nào tồn tại, nên không có gì không biết.
- **Level 3:** Đầu vào viết dấu kết thúc văn bản thành văn bản thuần. Cờ allow thay đổi gì? Expected: tắt, chuỗi là các byte và mảnh thông thường; bật, nó ánh xạ tới id dành riêng và được vòng lặp gộp bỏ qua.
- **Level 3:** Tại sao một lần hòa số đếm cặp phải được phá một cách xác định? Expected: hai lần chạy trên cùng kho ngữ liệu phải cho cùng bảng, nếu không cùng văn bản nhận các id khác qua các máy.
- **Level 4:** Thay phép tách đơn giản bằng mẫu regex production. Bạn so sánh gì? Expected: các từ vựng và các độ dài mã hóa trên cùng kho ngữ liệu, xem cách xử lý các dạng rút gọn, chữ số và dấu cách đầu.

## Wrong answers

- "Dùng các code point Unicode làm các symbol cơ sở." Các code point lên tới hàng trăm nghìn và để khoảng trống cho các ký tự chưa thấy; byte là 256 và đầy đủ.
- "Giải mã mỗi token thành một chuỗi và nối các chuỗi." Một token có thể giữ một phần ký tự nhiều byte; nối các byte trước và giải mã một lần.
- "Bỏ tách trước để có nén tốt hơn." Các phép gộp khi đó vượt ranh giới từ và từ vựng đầy các cụm từ không chuyển giao.

## Taught in

[Capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) định nghĩa thiết kế, các token đặc biệt và các kiểm thử, [bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) thêm chuẩn hóa và mở rộng regex, và [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) định nghĩa tỷ lệ nén.
