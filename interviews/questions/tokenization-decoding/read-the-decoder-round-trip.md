---
id: read-the-decoder-round-trip
title: Two decoders, one breaks on an emoji
card: tokenization-decoding
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, debugging]
tags: [bpe, decoding, utf-8, round-trip, code-reading]
minutes: 8
lessons: [phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/10-llms-from-scratch/01-tokenizers, phases/10-llms-from-scratch/02-building-a-tokenizer]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/merge-order-at-encode]
updated: 2026-11-03
---

Hai phiên bản của hàm giải mã một tokenizer cấp byte được đưa tới review. `vocab` ánh xạ mỗi id tới một đối tượng `bytes`.

```python
def decode_a(self, ids):
    byte_sequence = b"".join(self.vocab[t] for t in ids)
    return byte_sequence.decode("utf-8", errors="replace")

def decode_b(self, ids):
    return "".join(self.vocab[t].decode("utf-8") for t in ids)
```

Cả hai vượt qua các kiểm thử tiếng Anh. Phiên bản nào đúng cho một emoji có các byte bị tách qua hai token, tại sao phiên bản đúng luôn kết thúc, và `errors="replace"` để làm gì?

## Short answer

Nối tất cả các byte trước và giải mã một lần, đó là điều `decode_a` làm. Một ký tự nhiều byte như một emoji, 4 byte trong UTF-8, có thể bị tách qua hai token trở lên, nên giải mã riêng các byte của từng token gặp một chuỗi chưa đầy đủ và phát sinh lỗi hoặc phát các ký tự thay thế. Phép nối hoạt động vì mỗi id hoặc là một trong 256 byte thô hoặc là phần nối của hai id trước, nên mở rộng các id thành byte luôn kết thúc ở các byte thô, và chuỗi byte đầy đủ là UTF-8 hợp lệ bất cứ khi nào đầu vào hợp lệ. Tùy chọn `replace` giữ decoder khỏi phát sinh lỗi khi một mô hình phát ra một ký tự một phần ở cuối stream.

## Full answer

### Why the split happens

Một từ vựng cấp byte bắt đầu từ các byte đơn và học các phép gộp từ kho ngữ liệu. Một emoji hiếm trong huấn luyện có thể không có phép gộp bao phủ cả 4 byte, nên bộ mã hóa để nó thành hai token, có thể 3 byte và 1 byte. Mỗi token riêng không phải UTF-8 hợp lệ. Các ký tự của một hệ chữ với các ký tự 3 byte có cùng vấn đề bất cứ khi nào một phép gộp bao phủ một phần ký tự.

### Why the join terminates and round-trips

Capstone nêu bảo đảm: mã hóa rồi giải mã trả về chính xác các byte đầu vào. Decoder nối phần mở rộng byte của mọi id theo thứ tự. Vì mỗi id là một byte thô hoặc phần nối của hai id đã biết, phần mở rộng đệ quy chạm đáy ở các byte thô, và phần nối tất cả các token là chuỗi byte gốc. Giải mã UTF-8 sau đó khôi phục văn bản. Bộ kiểm thử ghim đặc tính trên một câu chưa thấy, trên một câu có một emoji, và trên một câu chứa một chuỗi token đặc biệt nguyên văn.

### Special tokens on the way out

Decoder của capstone kiểm tra một bảng token đặc biệt trước và thêm các byte UTF-8 của dấu, rồi chuyển tiếp tới từ vựng, và phát sinh lỗi trên một id không nằm trong bảng nào. Điều đó giữ một id dành riêng khỏi được tra như một phép gộp.

### What `errors="replace"` is for

Một mô hình có thể dừng giữa một ký tự, hoặc một stream có thể bị cắt giữa hai token chia sẻ một ký tự. Giải mã nghiêm ngặt phát sinh lỗi; `replace` phát một ký tự thay thế và tiếp tục. Trong một decoder streaming, mẫu tốt hơn là đệm các byte cuối cho đến khi chúng tạo một ký tự đầy đủ, và chỉ dùng `replace` ở lần đẩy cuối.

## Follow-ups

- **Level 2:** Tại sao `decode_b` vượt các kiểm thử tiếng Anh? Expected: các ký tự ASCII là các byte đơn, nên không token nào giữ một ký tự một phần và mọi mảnh tự giải mã được.
- **Level 3:** Thiết kế decoder streaming trong hai câu. Expected: tích lũy các byte và chỉ phát tiền tố dài nhất là UTF-8 đầy đủ, giữ phần còn lại; đẩy với thay thế ở cuối stream.
- **Level 3:** Tại sao một tokenizer cấp từ không thể cho bảo đảm round trip? Expected: các từ chưa thấy ánh xạ tới một id không biết, và id không biết không thể được ánh xạ lại thành văn bản gốc.
- **Level 3:** Bộ kiểm thử capstone dùng ba đầu vào nào cho round trip? Expected: một câu chưa thấy, một câu có một emoji, và một câu chứa chuỗi token đặc biệt nguyên văn.

## Wrong answers

- "Giải mã mỗi token thành một chuỗi và nối các chuỗi." Một token có thể giữ một phần ký tự, và UTF-8 một phần không phải một chuỗi.
- "Bảo decoder bỏ qua các lỗi để không gì phát sinh lỗi." Bỏ qua loại các byte âm thầm và round trip không còn chính xác; ký tự thay thế ít nhất đánh dấu mất mát.
- "Round trip chỉ quan trọng cho dữ liệu huấn luyện." Mọi câu trả lời được sinh đi qua decode, và một server phát sinh lỗi trên một emoji làm rớt yêu cầu.

## Taught in

[Capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) nêu và kiểm thử bảo đảm round trip, [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) cung cấp hàm nối-rồi-giải-mã, và [bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) cung cấp số byte cho emoji và các hệ chữ khác.
