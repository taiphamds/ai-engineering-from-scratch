---
id: merge-order-at-encode
title: Why the encoder replays the merge list in order
card: tokenization-decoding
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, ml-depth]
tags: [bpe, merge-rank, encoding, determinism, tokenizer]
minutes: 8
lessons: [phases/10-llms-from-scratch/01-tokenizers, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/05-nlp-foundations-to-advanced/19-subword-tokenization]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [tokenization-decoding/bpe-training-loop]
updated: 2026-11-03
---

Ở thời điểm mã hóa, một tokenizer BPE giữ bảng gộp hoàn chỉnh. Tại sao nó phải phát lại các phép gộp theo thứ tự chúng được học, và điều gì sai khi hai phép gộp có thể kích hoạt ở cùng một chỗ?

## Short answer

Mã hóa phải tái tạo điều huấn luyện đã làm với cùng văn bản, và huấn luyện thấy các phép gộp từng cái một theo thứ tự đó. Nếu phép gộp một tạo "th" và phép gộp năm tạo "the" từ "th" cộng "e", thì "the" chỉ có thể hình thành sau khi "th" tồn tại. Khi hai phép gộp có thể áp dụng ở một vị trí, phép có thứ hạng thấp hơn, được học sớm hơn, thắng; thay quy tắc đó và cùng văn bản cho các id khác nhau, nên mô hình thấy một phân phối id nó chưa bao giờ được huấn luyện trên đó.

## Full answer

### The naive encoder

```python
def encode_bpe(word, merges):
    symbols = list(word) + ["</w>"]
    for a, b in merges:
        i = 0
        while i < len(symbols) - 1:
            if symbols[i] == a and symbols[i + 1] == b:
                symbols = symbols[:i] + [a + b] + symbols[i + 2:]
            else:
                i += 1
    return symbols
```

Nó duyệt toàn bộ bảng cho mọi từ, nên chi phí là độ dài từ nhân số phép gộp. Đúng cho một bảng gộp được huấn luyện trên các ký tự, và chậm.

### The rank-based encoder

Phiên bản capstone bắt đầu từ phần tách byte và lặp: tìm phép gộp có thể áp dụng với thứ hạng thấp nhất ở bất cứ đâu trong chuỗi hiện tại, áp dụng nó, và quét lại, cho đến khi không phép gộp nào trong bảng áp dụng. Các bộ mã hóa production giữ cùng ngữ nghĩa với một phép tra thứ hạng và một hàng đợi ưu tiên các cặp ứng viên, chạy trong thời gian gần tuyến tính.

### Why the rule is the contract

Vòng lặp huấn luyện và bộ mã hóa dùng chung bảng gộp, và sự dùng chung đó là toàn bộ hợp đồng. Huấn luyện gộp cặp phổ biến nhất trước, nên một đầu vào chứa cả hai nửa của một phép gộp sớm luôn được gộp theo cách đó trong dữ liệu huấn luyện. Một bộ mã hóa ưu tiên một phép gộp sau, hoặc mảnh dài nhất, tạo một phân đoạn mô hình chưa bao giờ thấy. Không có gì gặp sự cố; các id đơn giản là khác.

### What special tokens do here

Các chuỗi dành riêng như dấu kết thúc văn bản được khớp chính xác trước khi vòng lặp gộp chạy và ánh xạ tới các id cố định. Chúng không bao giờ tham gia một phép gộp, nên không thứ tự bảng nào có thể tách hoặc nối chúng.

## Follow-ups

- **Level 2:** Tại sao vòng lặp ngây thơ chậm? Expected: nó quét toàn bộ bảng gộp cho mọi từ, nên chi phí tăng theo kích thước bảng nhân độ dài từ.
- **Level 3:** Các bộ mã hóa production đạt thời gian gần tuyến tính bằng cách nào? Expected: một phép tra thứ hạng cho mỗi cặp liền kề và một hàng đợi ưu tiên luôn đưa lên phép gộp có thể áp dụng có thứ hạng thấp nhất.
- **Level 3:** Hai tokenizer được huấn luyện trên các kho ngữ liệu khác nhau tới cùng kích thước từ vựng. Chúng có cho cùng các id không? Expected: không; các kho ngữ liệu khác nhau cho các bảng gộp khác nhau và các thứ hạng khác nhau.
- **Level 3:** Kiểm thử nào ghim thứ tự? Expected: mã hóa một từ giữ lại và so với các id được ghi; các kiểm thử của capstone cũng ghim round trip và việc dành riêng token đặc biệt.

## Wrong answers

- "Tham lam lấy token dài nhất trong từ vựng khớp." Đó là một thuật toán khác và cho một phân đoạn khác với lần huấn luyện.
- "Thứ tự không quan trọng vì các phép gộp giao hoán." Một phép gộp sau phụ thuộc vào các symbol mà các phép gộp trước tạo, nên chúng không giao hoán.
- "Sắp các phép gộp theo độ dài token." Độ dài không phải thứ hạng; một mảnh dài có thể được học sớm và một mảnh ngắn muộn.

## Taught in

[Bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) giải thích bảng có thứ tự, [capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) triển khai bộ mã hóa dựa trên thứ hạng, và [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) cung cấp vòng lặp ngây thơ và chi phí.
