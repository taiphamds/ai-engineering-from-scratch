---
id: bm25-idf-plus-one
title: Read the four lines that score a BM25 term
card: rag
kind: code-reading
level: 3
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [bm25, code-reading, idf, lexical]
minutes: 10
lessons: [phases/11-llm-engineering/07-advanced-rag, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense]
manuals: []
practice: [bm25]
cheatsheet: [rag-production]
related: [rag/error-code-query-misses, rag/rrf-beats-score-sum]
updated: 2026-11-03
---

Đọc bốn dòng này của một bộ chấm điểm BM25 từ bài học truy xuất nâng cao. Giải thích `+ 1` bên trong logarithm, nói `k1` và `b` kiểm soát gì, và mô tả điều xảy ra với một thuật ngữ xuất hiện trong hơn một nửa các tài liệu.

```python
idf = math.log((self.n_docs - df + 0.5) / (df + 0.5) + 1)
numerator = tf * (self.k1 + 1)
denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self.avg_dl)
score += idf * numerator / denominator
```

## Short answer

`+ 1` bên trong log là tần suất tài liệu nghịch đảo được làm trơn: không có nó, một thuật ngữ có trong phần lớn các tài liệu nhận trọng số âm, và có nó thì trọng số giữ dương. `k1` đặt mức nhanh mà các lần xuất hiện lặp lại ngừng thêm điểm, và `b` đặt mức phạt một tài liệu dài. Một thuật ngữ trong phần lớn tài liệu nhận trọng số gần không, đó là cách xử lý đúng cho một stop word.

## Full answer

### The inverse document frequency

Tỷ số bên trong log là số tài liệu không có thuật ngữ, cộng một nửa, chia cho số có thuật ngữ, cộng một nửa. Khi số tài liệu chứa thuật ngữ ít hơn số không chứa, tỷ số lớn hơn một và log dương. Khi thuật ngữ vượt qua ranh giới nửa kho ngữ liệu, tỷ số giảm dưới một và riêng log trở thành âm. `+ 1` giữ nó dương. Bài học capstone lưu ý điều này quan trọng với stop word, xuất hiện trong phần lớn tài liệu, và trong các kho ngữ liệu nhỏ nơi một thuật ngữ phổ biến có thể vượt ranh giới.

### Term frequency saturation

Hệ số tần suất thuật ngữ là `tf * (k1 + 1)` chia cho `tf + k1 * (...)`. Khi `tf` tăng, hệ số tiến tới `k1 + 1`, nên một tài liệu lặp một thuật ngữ 50 lần không liên quan hơn 50 lần so với một tài liệu có nó một lần. Bài học RAG nâng cao mặc định `k1` là 1.2; bài học capstone dùng 1.5 và gọi đó là khuyến nghị đã công bố, với lời khuyên không thay đổi nó khi chưa có benchmark.

### Length normalization

`b` điều chỉnh hạng độ dài. Ở `b` bằng không, độ dài tài liệu bị bỏ qua. Ở `b` bằng một, mức phạt độ dài là đầy đủ. Cả hai bài học mặc định là 0.75: các tài liệu dài hơn bị phạt, nhưng không tuyến tính.

### Field weights

Capstone triển khai trọng số trường như một hệ số nhân trên số lần xuất hiện thuật ngữ ở thời điểm lập chỉ mục, chẳng hạn tên symbol được lặp phía trên phần thân. Mã chấm điểm giữ nguyên.

## Follow-ups

- **Level 3:** Trọng số của một thuật ngữ xuất hiện trong mọi tài liệu là gì? Expected: df bằng số tài liệu, tỷ số bên trong log gần không, log của khoảng một gần không, nên thuật ngữ hầu như không thêm gì.
- **Level 3:** Một tài liệu lặp một thuật ngữ truy vấn 50 lần. Điểm của nó so với một lần xuất hiện thế nào? Expected: nó không cao hơn 50 lần; hệ số tần suất thuật ngữ bão hòa về k1 cộng 1.
- **Level 4:** Khi nào bạn thay đổi `b`? Expected: tăng khi các tài liệu dài thực sự nói ít hơn trên mỗi từ, và giảm về không khi độ dài tài liệu không liên quan tới chủ đề.
- **Level 4:** Hai bài học đặt mặc định `k1` khác nhau. Bạn làm gì? Expected: giữ mặc định đã công bố trừ khi một benchmark trên kho ngữ liệu của bạn nói khác, và tinh chỉnh k1 và b bằng cách chạy lại bộ đánh giá thay vì bằng trực giác.

## Wrong answers

- "Dấu +1 tránh logarithm của không." Tỷ số không bao giờ bằng không vì có một nửa ở tử số; dấu +1 giữ trọng số không trở thành âm khi thuật ngữ vượt quá nửa kho ngữ liệu.
- "k1 là số kết quả cần giữ." k1 là hằng số bão hòa tần suất thuật ngữ.
- "Một b cao hơn ưu ái các tài liệu dài." Một b cao hơn phạt độ dài nhiều hơn; b bằng không bỏ qua độ dài.

## Taught in

Bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp bộ chấm điểm này, và bài học [truy xuất lai](../../../phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/) giải thích IDF được làm trơn, các mặc định và trọng số trường.
