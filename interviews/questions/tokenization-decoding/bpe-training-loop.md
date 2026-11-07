---
id: bpe-training-loop
title: One step of byte-pair training and what it leaves behind
card: tokenization-decoding
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [screen, coding]
tags: [bpe, merge-table, training, pair-counting, determinism]
minutes: 6
lessons: [phases/10-llms-from-scratch/01-tokenizers, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/05-nlp-foundations-to-advanced/19-subword-tokenization]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [tokenization-decoding/why-subword-tokens]
updated: 2026-11-03
---

Trình bày cho tôi một bước huấn luyện byte-pair encoding trên một kho ngữ liệu nhỏ, và cho tôi biết artifact đã huấn luyện thực sự là gì.

## Short answer

Bắt đầu với mọi từ được tách thành các symbol cơ sở, byte hoặc ký tự. Đếm mọi cặp liền kề trên kho ngữ liệu, có trọng số theo mức thường xuyên mỗi từ xuất hiện, gộp cặp phổ biến nhất thành một symbol mới với id trống tiếp theo, viết lại mọi lần xuất hiện, và lặp cho đến khi từ vựng đạt kích thước mục tiêu. Artifact là danh sách các phép gộp có thứ tự; từ vựng đi theo nó, và cùng danh sách được áp dụng theo cùng thứ tự là thứ mã hóa dùng sau đó.

## Full answer

### A worked step

Kho ngữ liệu: "lower" 5 lần, "lowest" 2 lần, "newest" 6 lần.

```text
l o w e r      (x5)
l o w e s t    (x2)
n e w e s t    (x6)

pair counts: (w,e): 13   (e,s): 8   (s,t): 8   (l,o): 7   (o,w): 7   (n,e): 6   (e,r): 5
merge (w,e) -> we

l o we r       (x5)
l o we s t     (x2)
n e we s t     (x6)
```

Đếm lại, và bước tiếp theo thấy (we,s) và (s,t) hòa ở 8. Triển khai của bài học phá hòa bằng cách sắp theo chính cặp, nên hai lần chạy trên cùng kho ngữ liệu tạo cùng bảng. Sau đủ các bước, "west" tồn tại như một symbol.

### The three facts the loop encodes

1. Trọng số tần suất khiến các cặp của các từ phổ biến thắng sớm.
2. Một lần tách trước theo khoảng trắng và dấu câu giữ các phép gộp bên trong một từ. Một dấu kết thúc từ cũng giữ "low" như một từ đầy đủ khác với "low" như phần đầu của "lower".
3. Danh sách gộp có thứ tự. Mã hóa áp dụng các phép gộp theo thứ tự huấn luyện, nên thứ tự là một phần của artifact.

### Byte level

Với byte làm cơ sở, 256 id đầu là các giá trị byte và phép gộp k nhận id 256 cộng k. Chi phí của một bước tuyến tính theo kho ngữ liệu như một danh sách các chuỗi symbol, và các chuỗi thu nhỏ khi các phép gộp diễn ra, nên một triệu từ tới mười nghìn id chạy trong vài giây.

### What you ship

Bảng gộp và bảng token đặc biệt. Từ vựng các chuỗi byte có thể được xây lại từ chúng.

## Follow-ups

- **Level 1:** Tại sao đặt trọng số các cặp theo tần suất từ thay vì đếm mỗi từ riêng biệt một lần? Expected: các phép gộp nên phục vụ văn bản mà mô hình sẽ thấy, và các từ phổ biến xuất hiện nhiều lần.
- **Level 2:** Tại sao một lần hòa số đếm cặp phải được phá một cách xác định? Expected: hai lần huấn luyện trên cùng kho ngữ liệu phải tạo cùng bảng, nếu không cùng văn bản sẽ nhận các id khác nhau.
- **Level 2:** Điều gì xảy ra với độ dài mã hóa của một câu khi từ vựng mục tiêu tăng từ 300 tới 600? Expected: nó giảm, vì nhiều phép gộp hơn bao phủ các mảnh dài hơn; đường cong đó là đường cong nén.
- **Level 3:** Tại sao tách kho ngữ liệu thành các từ trước khi đếm các cặp? Expected: không có điều đó, các phép gộp vượt ranh giới từ và từ vựng đầy các cụm từ hoàn chỉnh không khái quát được.

## Wrong answers

- "BPE chọn cặp tạo ra mảnh có ý nghĩa nhất." Nó chọn cặp phổ biến nhất; ý nghĩa là một tác dụng phụ, và biến thể dựa trên likelihood là một thuật toán khác.
- "Từ vựng là artifact; danh sách gộp có thể bị bỏ." Mã hóa cần các phép gộp theo thứ tự; chỉ từ vựng không nói cách tách văn bản mới.
- "Mọi phép gộp được chọn cùng lúc từ các số đếm cặp ban đầu." Mỗi phép gộp thay đổi các số đếm, nên vòng lặp đếm lại sau mỗi bước.

## Taught in

[Bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) giải ví dụ, [capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) xây vòng lặp với phá hòa xác định, và [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) nêu ba dữ kiện.
