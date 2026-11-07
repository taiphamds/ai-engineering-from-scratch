---
id: bpe-wordpiece-unigram
title: Three ways to build a subword vocabulary
card: tokenization-decoding
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [ml-breadth, screen]
tags: [bpe, wordpiece, unigram, sentencepiece, vocabulary]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/01-tokenizers]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/bpe-training-loop]
updated: 2026-11-03
---

Ba thuật toán subword chiếm ưu thế: byte-pair encoding, WordPiece và Unigram. Đối chiếu cách mỗi thuật toán xây từ vựng, cho tôi biết thuật toán nào có thể cố ý cho hai cách phân đoạn khác nhau của cùng từ, và nêu các thư viện bạn sẽ dùng.

## Short answer

Byte-pair encoding gộp cặp liền kề phổ biến nhất, từ dưới lên. WordPiece cũng gộp từ dưới lên nhưng chấm một cặp bằng số đếm của mảnh được gộp chia tích các số đếm của các phần, nên nó ưu tiên các cặp đồng xuất hiện nhiều hơn ngẫu nhiên, và nó đánh dấu các mảnh tiếp nối bằng một tiền tố hai dấu thăng. Unigram làm từ trên xuống: nó bắt đầu từ một tập ứng viên lớn, gán mỗi mảnh một xác suất, và cắt các mảnh mà việc loại bỏ làm hại likelihood kho ngữ liệu ít nhất, đó là lý do nó cũng có thể lấy mẫu các phân đoạn thay thế để regularization.

## Full answer

### The criteria side by side

```text
BPE merge criterion:        count(A, B)
WordPiece merge criterion:  count(AB) / (count(A) * count(B))
Unigram:                    prune the piece whose removal least lowers the corpus log-likelihood
```

Thuật toán đầu hỏi cặp nào xuất hiện nhiều nhất. Thuật toán thứ hai hỏi cặp nào xuất hiện cùng nhau thường xuyên hơn bạn sẽ mong đợi từ các phần. Thuật toán thứ ba hỏi kho ngữ liệu có thể thiếu các mảnh nào tốt nhất.

### Who uses what

| Thuật toán | Hướng | Dấu | Được dùng bởi |
|---|---|---|---|
| Byte-pair encoding | gộp lên | dấu cách đầu được giữ trên các mảnh đầu từ | phần lớn các họ decoder, với từ vựng 50,257, 128,256 và hơn |
| WordPiece | gộp lên theo tỷ số likelihood | `##` cho các mảnh tiếp nối | encoder cổ điển với 30,522 token |
| Unigram | cắt xuống | `▁` cho một dấu cách khi được huấn luyện không có tiền token hóa | một họ encoder-decoder với 32,000 token |

### Sampling segmentations

Một mô hình Unigram mang tính xác suất ở suy luận. Nó có thể trả về phân đoạn có khả năng nhất hoặc lấy mẫu một phân đoạn khác, tạo regularization subword trong huấn luyện: cùng từ đến trong nhiều dạng và mô hình học các mảnh vững hơn. Các thuật toán dựa trên phép gộp là xác định.

### Libraries

Một thư viện huấn luyện các từ vựng cho thuật toán gộp hoặc cắt trực tiếp trên văn bản thô, mã hóa dấu cách như một symbol hiển thị và không cần tiền token hóa, đó là lý do nó là mặc định cho công việc đa ngôn ngữ. Một bộ mã hóa thứ hai, dựa trên Rust, nhanh và khớp các từ vựng của một họ API được dùng rộng rãi, nhưng nó chỉ mã hóa. Một thư viện thứ ba huấn luyện và phục vụ cả hai thuật toán ở một nơi.

### Picking

Huấn luyện một mô hình đơn ngữ: byte-pair encoding. Huấn luyện đa ngôn ngữ: Unigram với độ bao phủ ký tự gần 0.9995. Phục vụ theo một từ vựng API hiện có: thư viện chỉ mã hóa. Suy luận edge với một mô hình nhỏ: Unigram với một từ vựng nhỏ hơn.

## Follow-ups

- **Level 2:** Regularization subword là gì? Expected: huấn luyện trên các phân đoạn được lấy mẫu từ một mô hình Unigram để cùng từ xuất hiện trong nhiều dạng.
- **Level 2:** Symbol dấu cách hiển thị mang lại gì? Expected: dấu cách trở thành một symbol thông thường, nên tokenizer không cần tiền token hóa và hoạt động cho các hệ chữ không có dấu cách.
- **Level 3:** Thuật toán và thiết lập nào cho một từ vựng đa ngôn ngữ? Expected: Unigram được huấn luyện trên văn bản thô với độ bao phủ ký tự gần 0.9995, để các hệ chữ hiếm được giữ thay vì ánh xạ thành không biết.
- **Level 3:** Tại sao một thư viện chỉ-mã-hóa không thể huấn luyện tokenizer của bạn? Expected: nó cung cấp các từ vựng được xây sẵn và một bộ mã hóa nhanh; bước huấn luyện nằm trong hai thư viện kia.

## Wrong answers

- "WordPiece và byte-pair encoding cho cùng từ vựng trên cùng kho ngữ liệu." Các tiêu chí khác nhau, nên các phép gộp khác nhau; tỷ số likelihood ưu tiên các cặp bất ngờ hơn các cặp chỉ phổ biến.
- "Unigram xác định như các thuật toán gộp." Nó mang tính xác suất và có thể cố ý lấy mẫu các phân đoạn.
- "Thư viện mã hóa dấu cách như một symbol tự nó là một thuật toán." Nó là một thư viện huấn luyện thuật toán gộp hoặc cắt trên văn bản thô.

## Taught in

[Bài học token hóa subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) đối chiếu ba thuật toán và các thư viện, và [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) cung cấp các tiêu chí gộp và các kích thước từ vựng.
