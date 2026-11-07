---
id: cosine-is-the-default
title: Why vector search ranks by cosine
card: rag
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [embeddings, cosine, vector-search]
minutes: 5
lessons: [phases/11-llm-engineering/06-rag, phases/05-nlp-foundations-to-advanced/13-question-answering]
manuals: []
practice: [cosine-top-k]
cheatsheet: [embeddings-vector-search]
related: []
updated: 2026-11-03
---

Bạn viết bước tìm kiếm của một pipeline truy xuất. Một đồng đội muốn xếp hạng các chunk theo tích vô hướng thô giữa vector truy vấn và từng vector chunk. Bạn dùng gì thay vào đó, và khi nào tích vô hướng là lựa chọn đúng?

## Short answer

Dùng độ tương đồng cosine, là tích vô hướng chia cho độ dài của hai vector. Nó chỉ đo góc, nên một chunk dài và một chunk ngắn cạnh tranh theo hướng chứ không theo kích thước. Tích vô hướng thô chỉ đúng khi độ dài vector mang ý nghĩa mà bạn muốn thưởng.

## Full answer

### Three measures

| Thước đo | Nó làm gì | Hành vi |
|---|---|---|
| Cosine | cosine của góc giữa hai vector, từ -1 đến 1 | bỏ qua độ dài, mặc định cho truy xuất |
| Tích vô hướng | tổng các tích của từng cặp giá trị | các vector dài hơn có điểm cao hơn |
| Khoảng cách L2 | khoảng cách đường thẳng giữa hai điểm | nhỏ hơn là gần hơn, nhạy với độ dài |

Cosine chuẩn hóa theo độ dài, nên các chunk có kích thước khác nhau chỉ so sánh theo hướng. Khi ai đó nói tìm kiếm vector, họ gần như luôn muốn nói cosine.

### The code

```python
def cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
```

Biện pháp bảo vệ trả về không khi một vector không có độ dài, nên một chunk trống không chia cho không.

### When the two agree

Nhiều mô hình embedding trả về các vector có độ dài đơn vị, hoặc bên gọi yêu cầu đầu ra đã chuẩn hóa. Bài học hỏi đáp mã hóa với chuẩn hóa được bật rồi xếp hạng bằng một phép nhân ma trận thuần. Với các vector đơn vị, tích vô hướng bằng cosine, nên phép toán rẻ hơn cho cùng thứ tự.

## Follow-ups

- **Level 1:** Các giá trị 1, 0 và -1 có ý nghĩa gì với cosine? Expected: cùng hướng, trực giao, và các hướng đối nhau.
- **Level 2:** Bộ nhúng của bạn trả về các vector đơn vị. Lựa chọn còn quan trọng không? Expected: không, vì với các vector đơn vị tích vô hướng và cosine bằng nhau, đó là lý do bài học chuẩn hóa rồi dùng một phép nhân ma trận.
- **Level 2:** Tại sao khoảng cách L2 xử lý một chunk dài và một chunk ngắn khác nhau? Expected: nó đo khoảng cách đường thẳng, nên một vector dài hơn nằm xa hơn ngay cả khi nó chỉ cùng hướng.
- **Level 3:** Khi nào bạn cố ý giữ tích vô hướng thô? Expected: khi mô hình đã được huấn luyện để độ dài mang một tín hiệu, như nhiều nội dung hơn trong một tài liệu dài hơn, và bạn muốn tín hiệu đó trong thứ hạng.

## Wrong answers

- "Tích vô hướng và cosine cho cùng thứ tự." Chỉ khi mọi vector có cùng độ dài; nếu không các vector dài hơn thắng theo tích vô hướng.
- "Một cosine nhỏ hơn nghĩa là một kết quả khớp gần hơn." Một cosine lớn hơn nghĩa là một góc nhỏ hơn; nhỏ hơn chỉ gần hơn với một khoảng cách như L2.
- "Dùng bất cứ thứ gì kho vector mặc định." Thước đo phải khớp cách các vector được tạo và chuẩn hóa, nên kiểm tra bộ nhúng trước kho.

## Taught in

Bài học [RAG](../../../phases/11-llm-engineering/06-rag/) định nghĩa ba thước đo và biện pháp bảo vệ, và bài học [hỏi đáp](../../../phases/05-nlp-foundations-to-advanced/13-question-answering/) xếp hạng các vector đã chuẩn hóa bằng một phép nhân ma trận.
