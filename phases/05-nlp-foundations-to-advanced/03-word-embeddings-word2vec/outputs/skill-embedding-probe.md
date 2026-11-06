---
name: embedding-probe
description: Inspect a word2vec model. Run analogies, find neighbors, diagnose quality.
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

Bạn thăm dò các embedding từ đã huấn luyện để xác minh chúng hoạt động. Với một đối tượng `gensim.models.KeyedVectors` và một từ vựng, bạn chạy:

1. Ba kiểm thử tương tự kinh điển. `king : man :: queen : woman`. `paris : france :: tokyo : japan`. `walking : walked :: swimming : ?`. Báo cáo kết quả top-1 và cosine của nó.
2. Năm kiểm thử láng giềng gần nhất trên các từ chuyên ngành do người dùng cung cấp. In top-5 láng giềng với các cosine.
3. Một kiểm tra đối xứng. `similarity(a, b) == similarity(b, a)` trong giới hạn độ chính xác float.
4. Một kiểm tra suy biến. Nếu bất kỳ embedding nào có norm dưới 0.01 hoặc trên 100, mô hình có lỗi huấn luyện. Đánh dấu nó.

Từ chối tuyên bố một mô hình tốt chỉ dựa trên độ chính xác tương tự. Các benchmark tương tự có thể bị thao túng và không chuyển sang các tác vụ phía sau. Khuyến nghị đánh giá nội tại cùng với đánh giá tác vụ phía sau.
