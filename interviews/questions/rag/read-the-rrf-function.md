---
id: read-the-rrf-function
title: Read the rank fusion function
card: rag
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [coding, screen]
tags: [rrf, code-reading, hybrid-search]
minutes: 8
lessons: [phases/11-llm-engineering/07-advanced-rag, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense]
manuals: []
practice: [reciprocal-rank-fusion]
cheatsheet: [rag-production]
related: [rag/rrf-beats-score-sum]
updated: 2026-11-03
---

Đọc hàm hợp nhất này từ bài học RAG nâng cao. Giải thích `+ 1` trong mẫu số, nói hàm cố ý bỏ qua gì, và mô tả điều xảy ra với một tài liệu chỉ xuất hiện trong một trong các danh sách.

```python
def reciprocal_rank_fusion(ranked_lists, k=60):
    scores = {}
    for ranked_list in ranked_lists:
        for rank, (doc_id, _) in enumerate(ranked_list):
            if doc_id not in scores:
                scores[doc_id] = 0.0
            scores[doc_id] += 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return fused
```

## Short answer

`enumerate` bắt đầu từ không, nên `+ 1` biến chỉ số thành một thứ hạng bắt đầu từ một, và tài liệu đầu nhận 1/61 như công thức đã công bố định nghĩa. Hàm bỏ điểm đi cùng mỗi tài liệu, vì thứ hạng là đơn vị có thể so sánh giữa các retriever. Một tài liệu hiện diện trong một danh sách nhận một đóng góp và không có hình phạt cho danh sách kia, nên nó vẫn có thể có vị trí tốt nếu nó được xếp cao ở nơi xuất hiện.

## Full answer

### Walk the loop

1. Vòng lặp ngoài thăm từng danh sách đã xếp hạng, chẳng hạn danh sách vector và danh sách BM25.
2. Vòng lặp trong đọc từng mục như một cặp và bỏ phần tử thứ hai, điểm riêng của retriever.
3. Đóng góp cho một tài liệu ở chỉ số tính từ không `rank` là `1.0 / (k + rank + 1)`, tức một chia cho k cộng thứ hạng tính từ một.
4. Các đóng góp được cộng theo từng id tài liệu trên các danh sách.
5. Kết quả được sắp theo tổng đóng góp, cao nhất trước.

### What the caller does

Tìm kiếm lai trong cùng bài học yêu cầu mỗi retriever lấy ba lần top k cuối cùng, hợp nhất hai danh sách và trả về top k đầu tiên của kết quả hợp nhất. Các danh sách ứng viên sâu hơn cho phép một tài liệu tốt ở cả hai retriever đến danh sách cuối ngay cả khi nó không đứng đầu ở bên nào.

### The capstone version

Bài học truy xuất lai thêm một danh sách `weights` với một hệ số nhân cho mỗi danh sách đã xếp hạng, áp dụng cho mỗi đóng góp thứ hạng, và phát sinh một lỗi khi số trọng số không khớp số danh sách. Nó cũng giữ một ánh xạ từ id tài liệu sang tài liệu để có thể trả về các tài liệu thay vì id.

### The key

Hợp nhất chạy trên id tài liệu. Hai chunk của cùng tài liệu là hai khóa. Bài học capstone khuyến nghị khử trùng lặp theo tài liệu, vì một thuật ngữ ngoài từ vựng của BM25 cho không và retriever dense vẫn trả về nhiễu; hợp nhất theo từng tài liệu hấp thụ điều đó.

## Follow-ups

- **Level 2:** Điều gì thay đổi nếu bạn xóa `+ 1`? Expected: tài liệu đầu nhận 1/60 thay vì 1/61, đường cong dịch một ít, và hằng số không còn khớp định nghĩa đã công bố.
- **Level 2:** Tại sao bên gọi lấy ba lần k cuối cùng từ mỗi retriever? Expected: một danh sách sâu hơn cho phép một tài liệu xếp hạng tốt ở cả hai retriever đến top k hợp nhất ngay cả khi nó không đứng đầu ở bên nào.
- **Level 3:** Phiên bản capstone cho phép bạn ưu ái một retriever bằng cách nào? Expected: một danh sách weights với một hệ số nhân cho mỗi danh sách đã xếp hạng, áp dụng cho đóng góp thứ hạng, với một lỗi khi các độ dài khác nhau.
- **Level 3:** Khóa hợp nhất là gì, và tại sao điều đó quan trọng với chunk? Expected: id tài liệu; các chunk của một tài liệu là các khóa riêng trừ khi bạn khử trùng lặp theo tài liệu, điều bài học khuyến nghị.

## Wrong answers

- "Hàm lấy trung bình hai điểm." Nó không bao giờ đọc các điểm; nó cộng một hàm của các thứ hạng.
- "Một tài liệu thiếu ở một danh sách bị phạt." Nó không nhận đóng góp từ danh sách đó, điều không phải một hình phạt; nó vẫn có thể xếp đầu nếu nó đứng đầu ở danh sách kia.
- "k là số kết quả cần giữ." k là hằng số suy giảm trong mẫu số; bên gọi cắt danh sách hợp nhất thành top k cuối cùng.

## Taught in

Bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp hàm này và bên gọi của nó, và bài học [truy xuất lai](../../../phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/) thêm các trọng số và lời khuyên khử trùng lặp.
