---
id: why-subword-tokens
title: Why models read subwords and start from bytes
card: tokenization-decoding
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [screen, ml-breadth]
tags: [tokenization, subword, byte-level-bpe, unknown-token, vocabulary]
minutes: 6
lessons: [phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/01-tokenizers]
manuals: []
practice: []
cheatsheet: [tokenization]
related: []
updated: 2026-11-03
---

Tại sao mọi mô hình ngôn ngữ hiện tại đọc các token subword thay vì các từ đầy đủ hoặc các ký tự đơn, và tại sao phần lớn xây từ vựng trên các byte thô?

## Short answer

Một từ vựng từ không thể giữ mọi từ, nên mỗi từ mới trở thành một token không biết và mô hình mất tín hiệu. Các ký tự không bao giờ thất bại, nhưng chúng khiến các chuỗi dài hơn nhiều lần và tiêu attention vào đánh vần. Subword giữ nguyên các từ phổ biến và tách các từ hiếm thành các mảnh có ý nghĩa, và bắt đầu từ 256 giá trị byte nghĩa là mọi đầu vào trong mọi hệ chữ mã hóa với không token không biết.

## Full answer

### The three options

| Cấp | Từ vựng | Lỗi |
|---|---|---|
| Từ | khổng lồ, và vẫn chưa đầy đủ | token không biết cho bất cứ thứ gì chưa thấy; riêng tiếng Anh có hơn một triệu dạng từ |
| Ký tự | vài trăm | một câu 10 từ trở thành khoảng 50 token; mô hình học lại rằng t, h, e đánh vần một từ |
| Subword | 30K đến 128K | không điều nào ở trên; các từ hiếm tách thành các mảnh |

Một từ hiếm như "unhappiness" là 11 token ký tự hoặc 3 mảnh subword: un, happi, ness. Các mảnh mang ý nghĩa mà mô hình có thể dùng lại.

### Why bytes at the bottom

Một từ vựng cấp byte xem mỗi giá trị trong 256 giá trị byte là một token cơ sở và học các phép gộp bên trên. Bất kỳ chuỗi nào trong bất kỳ mã hóa nào là một chuỗi byte, nên không có gì không biết, và không ngôn ngữ nào cần xử lý đặc biệt. Một từ vựng 50,257 token nổi tiếng chính xác là 256 byte cộng 50,000 phép gộp cộng một token đặc biệt.

### Why it is architecture, not preprocessing

Tokenizer cố định những gì mô hình thấy cho cả đời. Một từ vựng tách một từ phổ biến thành bốn mảnh lãng phí ngữ cảnh và tính toán trên mọi yêu cầu, và lựa chọn không thể được hoàn tác sau huấn luyện. Giá theo từng token và độ trễ theo từng token, nên tokenizer cũng nằm trong mô hình chi phí.

## Follow-ups

- **Level 1:** Fertility đo gì? Expected: số token trung bình mỗi từ; 1.0 là một token mỗi từ và cao hơn nghĩa là mô hình làm việc nhiều hơn cho cùng văn bản.
- **Level 2:** Tại sao token không biết biến mất với các từ vựng cấp byte? Expected: mỗi byte tự nó là một token, nên mọi đầu vào phân rã thành các token đã biết trước khi bất kỳ phép gộp nào áp dụng.
- **Level 2:** Một từ vựng rất nhỏ tốn gì ở suy luận? Expected: các chuỗi dài hơn, nên nhiều lượt truyền xuôi hơn mỗi câu trả lời và ít văn bản hơn mỗi cửa sổ ngữ cảnh.
- **Level 3:** Tại sao bạn không thể sửa một tokenizer xấu sau huấn luyện? Expected: các dòng embedding và mọi trọng số được huấn luyện theo các id đó; các id mới không có ý nghĩa được học và văn bản cũ sẽ ánh xạ khác.

## Wrong answers

- "Các ký tự là lựa chọn an toàn nhất vì không có gì không biết." Byte cho cùng bảo đảm, và các ký tự khiến mọi chuỗi dài hơn nhiều lần.
- "Một danh sách từ lớn hơn giải quyết vấn đề không biết." Các từ mới, lỗi chính tả, mã và các ngôn ngữ khác tiếp tục xuất hiện; không danh sách từ nào đầy đủ.
- "Một token là một từ." Một token có thể là một byte, một mảnh từ, một từ, hoặc một cụm từ ngắn, tùy các phép gộp.

## Taught in

[Bài học token hóa subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) so sánh các thuật toán và [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) trình bày ba lựa chọn qua các ví dụ.
