---
id: pre-tokenization-regex
title: What the split before the merges is for
card: tokenization-decoding
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, ml-depth]
tags: [pre-tokenization, regex, bpe, whitespace, word-boundaries]
minutes: 8
lessons: [phases/10-llms-from-scratch/02-building-a-tokenizer, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/05-nlp-foundations-to-advanced/19-subword-tokenization]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/bpe-training-loop]
updated: 2026-11-03
---

Trước khi bất kỳ phép gộp nào chạy, một tokenizer production cắt văn bản thành các chunk bằng một biểu thức chính quy. Cho tôi thấy mẫu cổ điển làm gì với `Hello, world! Don't stop.` và giải thích tại sao việc cắt tồn tại, khi các phép gộp có thể chạy trên luồng thô.

## Short answer

Mẫu cắt câu thành tám chunk, `Hello`, `,`, ` world`, `!`, ` Don`, `'t`, ` stop` và `.`: mỗi từ sau từ đầu giữ dấu cách phía trước, các dạng rút gọn tách ở dấu nháy, và dấu câu đứng riêng. Các phép gộp sau đó chạy bên trong mỗi chunk và không bao giờ có thể nối các symbol qua một ranh giới chunk. Không có việc cắt, huấn luyện học các phép gộp trải qua các từ, từ vựng đầy các cụm từ hoàn chỉnh, và các mảnh khái quát kém hơn tới văn bản mới.

## Full answer

### The pattern

```text
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Theo thứ tự: các đuôi rút gọn phổ biến, một từ với một dấu cách đầu tùy chọn, một chuỗi chữ số với một dấu cách đầu tùy chọn, một chuỗi dấu câu, và khoảng trắng. Các lớp `\p{L}` và `\p{N}` cần mô-đun `regex` bên thứ ba; thư viện chuẩn quay về các lớp ASCII, sai với văn bản đa ngôn ngữ.

### Why the leading space travels with the word

` hello` và `hello` là các token khác nhau. Giữ dấu cách trên từ nghĩa là một mảnh đầu từ và một mảnh trong từ giữ khác biệt, và decoder có thể xây lại khoảng cách chỉ từ các token. Cùng lý do buộc mọi bên gọi tường minh về liệu một dấu cách tiền tố được thêm ở đầu một prompt không.

### Why cut at all

Vòng lặp gộp tham lam theo tần suất. Trong một luồng thô, cặp "e" theo sau bởi một dấu cách theo sau bởi "t" phổ biến, nên vòng lặp sẽ vui vẻ học một mảnh kết thúc một từ và bắt đầu từ tiếp theo. Các mảnh như vậy không chuyển giao: văn bản tiếp theo có các cặp từ khác. Cắt trước giữ mọi phép gộp bên trong một từ, đó là nơi các quy luật khái quát được nằm.

### The other design

Một tokenizer làm việc trên văn bản thô xem dấu cách là một symbol thông thường và để thuật toán gộp hoặc cắt tìm các ranh giới. Nó không cần các quy tắc ngôn ngữ và xử lý các hệ chữ không có dấu cách, và nó cho phép các mảnh liên từ, có thể nén tốt hơn một chút và đọc kém hơn một chút.

### The capstone's version

Một phép tách nhỏ theo khoảng trắng và dấu câu. Nó đủ để giữ các phép gộp bên trong các từ cho một tập huấn luyện nhỏ, và phần còn lại của pipeline giữ nguyên.

## Follow-ups

- **Level 2:** Tại sao một prompt bắt đầu không có dấu cách token hóa khác một prompt bắt đầu có dấu cách? Expected: dấu cách là một phần của token đầu từ, nên từ đầu ánh xạ tới một id khác; đặt hành vi dấu-cách-tiền-tố tường minh.
- **Level 3:** Tại sao mô-đun `regex` quan trọng với mẫu này? Expected: các lớp chữ cái và số Unicode bao phủ các hệ chữ ngoài ASCII, mà engine thư viện chuẩn thiếu.
- **Level 3:** Đánh đổi khi bỏ việc cắt và chạy trên văn bản thô là gì? Expected: không quy tắc ngôn ngữ và hành vi tốt cho các hệ chữ không có dấu cách, đổi lấy các mảnh liên từ nén tốt hơn một chút và ít diễn giải được hơn.
- **Level 3:** Một file tokenizer không đổi nhưng các id khác giữa hai máy. Điều gì trong giai đoạn này có thể gây ra? Expected: một máy quay về mẫu ASCII vì mô-đun `regex` bị thiếu, nên các chunk khác.

## Wrong answers

- "Tiền token hóa chỉ là tách theo dấu cách." Mẫu cũng xử lý các dạng rút gọn, chữ số, dấu câu và các chuỗi khoảng trắng, và nó giữ dấu cách gắn với từ.
- "Việc cắt chỉ là bề ngoài; các phép gộp sẽ tìm cùng các mảnh." Không có việc cắt, các phép gộp vượt ranh giới từ và từ vựng đầy các cụm từ.
- "Gắn dấu câu vào từ nó theo sau." Khi đó `world!` và `world` là các mảnh khác nhau, và từ vựng trả phí cho mọi biến thể dấu câu.

## Taught in

[Bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) cung cấp mẫu và đầu ra, [capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) giải thích tại sao các phép gộp giữ bên trong các từ, và [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) liệt kê cạm bẫy khoảng trắng.
