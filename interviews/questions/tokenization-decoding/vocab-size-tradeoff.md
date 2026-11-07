---
id: vocab-size-tradeoff
title: Put numbers on growing the vocabulary to 128K
card: tokenization-decoding
kind: estimate
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [screen, system-design]
tags: [vocabulary-size, embedding-matrix, compression, inference-cost, estimation]
minutes: 8
lessons: [phases/10-llms-from-scratch/01-tokenizers, phases/05-nlp-foundations-to-advanced/19-subword-tokenization]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/why-subword-tokens]
updated: 2026-11-03
---

Một nhóm muốn tăng từ vựng của một mô hình mới từ 32K lên 128K token. Các embedding có 4,096 chiều. Đưa ra các con số cho chi phí của thay đổi và những gì nó mang lại.

## Short answer

Ma trận embedding đi từ 32,000 nhân 4,096, khoảng 131 triệu tham số, tới 128,000 nhân 4,096, khoảng 524 triệu, nên thêm khoảng 400M tham số chỉ từ tokenizer, và một head đầu ra không buộc trọng số tốn tương tự thêm một lần nữa. Đổi lại văn bản nén: một đoạn tiếng Anh khoảng 100 token ở 32K tốn khoảng 70 token ở 128K. Sinh cùng đoạn đó khi đó cần ít lượt truyền xuôi hơn khoảng 30 phần trăm, và các hệ chữ không phải tiếng Anh thu lợi nhiều nhất. Quy tắc kinh nghiệm của bài học là 32k dưới 1B tham số, 50 đến 100k từ 1 đến 10B, và 200k trở lên cho các mô hình đa ngôn ngữ hoặc tiên tiến hàng đầu.

## Full answer

### The cost side

```text
32,000  x 4,096 = about 131M parameters
128,000 x 4,096 = about 524M parameters
difference      = about 400M
```

Mỗi dòng là một embedding mà mô hình phải học, và các dòng hiếm nhận ít cập nhật gradient. Một mô hình nhỏ với một từ vựng khổng lồ tiêu một tỷ lệ lớn tham số trong một bảng tra.

### The benefit side

| Từ vựng | Token mỗi từ tiếng Anh |
|---|---|
| 30,522 | khoảng 1.4 |
| 50,257 | khoảng 1.3 |
| 100,256 | khoảng 1.2 |
| 128,256 | khoảng 1.1 |
| 200,019 | khoảng 1.0 |

Ít token mỗi từ hơn nghĩa là các chuỗi ngắn hơn, nên mỗi câu trả lời cần ít lượt truyền xuôi hơn và mỗi cửa sổ ngữ cảnh giữ nhiều văn bản hơn. Với một mô hình phục vụ hàng triệu yêu cầu, đầu ra loại đó cần ít lượt truyền xuôi hơn khoảng 30 phần trăm.

### Who gains the most

Tiếng Anh đã nén tốt ở 32K. Các hệ chữ mà một từ vựng thiên tiếng Anh tách thành byte thu lợi nhiều hơn xa, đó là lý do một họ mô hình tăng gấp bốn từ vựng từ 32K lên 128K.

### The decision

Kích thước từ vựng tăng theo mô hình và hỗn hợp ngôn ngữ. Dưới 1B tham số, embedding sẽ chi phối mô hình, nên giữ gần 32k. Giữa 1 và 10B, 50 đến 100k. Đa ngôn ngữ ở bất kỳ quy mô nào đẩy về 200k trở lên. Xác thực lựa chọn bằng token mỗi từ trên một tập giữ lại, tỷ lệ không biết, tỷ lệ nén và một round trip chính xác từng byte.

## Follow-ups

- **Level 2:** Tại sao ít token mỗi từ hơn khiến suy luận nhanh hơn? Expected: sinh là một lượt truyền xuôi mỗi token, nên ít token cho cùng văn bản nghĩa là ít lượt hơn.
- **Level 3:** Một từ vựng 128K làm gì với phía đầu ra của mô hình? Expected: head có một dòng mỗi token, nên nó tăng cùng embedding, và một head không buộc trọng số gấp đôi các tham số thêm.
- **Level 3:** Tại sao họ mô hình trong bài học chuyển từ 32K lên 128K? Expected: nén công bằng hơn qua các ngôn ngữ; từ vựng thiên tiếng Anh cho các hệ chữ khác một cửa sổ ngữ cảnh thực chất bằng nửa kích thước.
- **Level 4:** Bạn xác thực một kích thước từ vựng trước huấn luyện bằng cách nào? Expected: token mỗi từ mỗi ngôn ngữ trên văn bản giữ lại, tỷ lệ không biết, tỷ lệ nén so với một bộ mã hóa tham chiếu, và một round trip chính xác từng byte.

## Wrong answers

- "Một từ vựng lớn hơn luôn tốt hơn." Dưới 1B tham số, các dòng thêm chi phối mô hình và các dòng hiếm được huấn luyện thiếu.
- "Embedding là một sai số làm tròn cạnh mô hình." Ở 128K nhân 4,096, nó là khoảng 524M tham số.
- "Kích thước từ vựng không ảnh hưởng chi phí một yêu cầu." Token mỗi từ đặt độ dài chuỗi, và độ dài chuỗi đặt các lượt truyền xuôi và ngân sách ngữ cảnh.

## Taught in

[Bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) làm phép tính embedding và cung cấp bảng fertility, và [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) cung cấp heuristic kích thước và kế hoạch xác thực.
