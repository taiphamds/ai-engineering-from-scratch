---
id: parent-child-dedupe
title: Read the parent-document retrieval function
card: rag
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [chunking, parent-child, code-reading, context-budget]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag]
related: [rag/chunk-size-by-query-type, rag/cosine-is-the-default]
updated: 2026-11-03
---

Đọc hàm truy xuất này từ bài học chunking. Bố trí hai cấp giải quyết vấn đề gì, tập `seen` làm gì, và hàm có thể trả về bao nhiêu parent?

```python
def retrieve_parent(child_query, mapping, encoder, top_k=3):
    child_embs = encoder.encode([m["child"] for m in mapping], normalize_embeddings=True)
    q_emb = encoder.encode([child_query], normalize_embeddings=True)[0]
    scores = child_embs @ q_emb
    top = np.argsort(-scores)[:top_k]
    seen, parents = set(), []
    for i in top:
        if mapping[i]["parent_idx"] not in seen:
            parents.append(mapping[i]["parent"])
            seen.add(mapping[i]["parent_idx"])
    return parents
```

## Short answer

Các chunk child nhỏ được lập chỉ mục cho một kết quả khớp chính xác và parent lớn hơn được trả về để cung cấp ngữ cảnh, loại bỏ đánh đổi giữa một kết quả trúng chính xác và đủ văn bản xung quanh. Tập `seen` bỏ một parent mà nhiều child hàng đầu ánh xạ tới, nên prompt không nhận cùng văn bản hai lần. Với một mapping không trống và một `top_k` dương, hàm trả về từ một đến `top_k` parent, ít hơn khi các child dùng chung một parent; một mapping trống hoặc một `top_k` bằng không không trả về parent nào.

## Full answer

### The layout

Chunking chuẩn buộc một lựa chọn: các chunk nhỏ khớp chính xác nhưng thiếu ngữ cảnh, các chunk lớn mang ngữ cảnh nhưng bao phủ nhiều chủ đề. Bố trí hai cấp lập chỉ mục các child nhỏ và lưu parent mà mỗi child xuất phát. Bài học chunking chia parent ở 2048 và child ở 256 theo mặc định, và bài học RAG nâng cao vẽ một parent 512 token với bốn child 128 token. Một truy vấn về một chi tiết khớp chính xác một child, và prompt nhận toàn bộ parent, bao gồm các dòng quanh chi tiết.

### Walk the function

1. Mã hóa mọi child và truy vấn với chuẩn hóa được bật, để tích ma trận bằng cosine.
2. Sắp xếp các child theo điểm và giữ các chỉ số top k.
3. Với mỗi child hàng đầu, tra chỉ số parent của nó; nếu parent đó chưa được thấy, thêm văn bản parent và đánh dấu nó.
4. Trả về các parent theo thứ tự của child tốt nhất của chúng.

### Why de-duplicate

Nhiều child của một parent thường khớp cùng truy vấn, vì chúng nằm trong cùng phần. Không có tập đó, prompt sẽ nhận cùng parent hai hoặc ba lần và lãng phí ngân sách ngữ cảnh. Bài học gọi điều này là nhận thức then chốt của mẫu.

### What production changes

Hàm mã hóa lại mọi child trên mỗi lệnh gọi. Một chỉ mục thực lưu các vector child một lần và chỉ nhúng truy vấn. Bố trí hai cấp cũng suy giảm một cách nhẹ nhàng: một kết quả khớp child kém vẫn trả về một parent hợp lý.

## Follow-ups

- **Level 2:** Tại sao lập chỉ mục child mà không phải parent? Expected: một chunk nhỏ khớp chính xác một câu hỏi cụ thể, trong khi một chunk lớn bao phủ nhiều chủ đề và embedding của nó không chỉ tới đâu cụ thể.
- **Level 2:** Tại sao một tích ma trận thuần và không có cosine? Expected: các vector được chuẩn hóa ở thời điểm mã hóa, nên tích vô hướng bằng cosine.
- **Level 3:** Hàm này làm gì trên mỗi lệnh gọi mà mã production không được làm? Expected: nó mã hóa lại tất cả child; lưu các vector child một lần ở thời điểm lập chỉ mục và chỉ nhúng truy vấn.
- **Level 3:** Hai parent mỗi parent có một child khớp, và một parent thứ ba có ba child khớp dưới ngưỡng cắt. Hàm bỏ lỡ điều gì? Expected: nó chỉ xếp hạng theo child tốt nhất; một parent với nhiều child tốt không nhận thêm điểm trừ khi bạn tổng hợp các điểm child theo từng parent.

## Wrong answers

- "Trả về parent của mọi child hàng đầu, bao gồm bản trùng." Nhiều child ánh xạ tới một parent, và văn bản lặp lại lãng phí ngân sách ngữ cảnh.
- "Cho child lớn bằng parent." Khi đó không có lợi ích độ chính xác; mục đích là một đơn vị khớp nhỏ và một đơn vị ngữ cảnh lớn.
- "Hàm luôn trả về đúng top_k parent." Nó trả về ít hơn khi các child dùng chung một parent.

## Taught in

Bài học [chiến lược chunking](../../../phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/) cung cấp hàm này và nhận thức về khử trùng lặp, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) vẽ bố trí parent và child.
