# Chunking Strategies for RAG

> Cấu hình chia khối ảnh hưởng chất lượng truy xuất nhiều ngang lựa chọn mô hình embedding (Vectara NAACL 2025). Làm sai chia khối và không lượng xếp hạng lại nào cứu được bạn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 14 (Information Retrieval), Phase 5 · 22 (Embedding Models)
**Time:** ~60 minutes

## The Problem

Bạn đưa một hợp đồng 50 trang vào một hệ thống RAG. Người dùng hỏi: "Điều khoản chấm dứt là gì?" Bộ truy xuất trả trang bìa. Tại sao? Vì mô hình được huấn luyện trên các khối 512 token và điều khoản chấm dứt nằm ở trang thứ 20, bị chia qua một ngắt trang, không có các từ khóa cục bộ gắn nó với truy vấn.

Cách sửa không phải "mua một mô hình embedding tốt hơn." Cách sửa là chia khối. Lớn đến đâu? Chồng lấn? Chia ở đâu? Với ngữ cảnh xung quanh?

Các benchmark tháng 2 năm 2026 cho thấy các kết quả đáng ngạc nhiên:

- Nghiên cứu năm 2026 của Vectara: chia khối đệ quy 512 token thắng chia khối ngữ nghĩa với accuracy 69% → 54%.
- SPLADE + Mistral-8B trên Natural Questions: chồng lấn không mang lại lợi ích đo được nào.
- Vách ngữ cảnh: chất lượng phản hồi giảm mạnh quanh 2,500 token ngữ cảnh.

Câu trả lời "hiển nhiên" (chia khối ngữ nghĩa, chồng lấn 20%, 1000 token) thường sai. Bài học này xây dựng trực giác cho sáu chiến lược và cho bạn biết khi nào chọn loại nào.

## The Concept

![Six chunking strategies visualized on one passage](../assets/chunking.svg)

**Chia khối cố định.** Chia mỗi N ký tự hoặc token. Baseline đơn giản nhất. Ngắt giữa câu. Nén tốt, độ mạch lạc kém.

**Đệ quy.** `RecursiveCharacterTextSplitter` của LangChain. Thử chia theo `\n\n` trước, rồi `\n`, rồi `.`, rồi khoảng trắng. Quay về phương án dự phòng gọn gàng. Mặc định năm 2026.

**Ngữ nghĩa.** Embedding mỗi câu. Tính cosine similarity giữa các câu liền kề. Chia nơi độ tương đồng giảm dưới một ngưỡng. Giữ độ gắn kết chủ đề. Chậm hơn; đôi khi tạo các mảnh 40 token nhỏ gây hại truy xuất.

**Câu.** Chia tại các ranh giới câu. Một câu mỗi khối hoặc một cửa sổ N câu. Ngang chia khối ngữ nghĩa đến ~5k token với một phần chi phí.

**Tài liệu cha.** Lưu các khối con nhỏ để truy xuất *và* khối cha lớn hơn cho ngữ cảnh. Truy xuất theo con; trả cha. Suy giảm êm: các khối con tệ vẫn trả các khối cha hợp lý.

**Chia khối muộn (2024).** Embedding toàn bộ tài liệu ở cấp token trước, rồi pooling các embedding token thành các embedding khối. Giữ ngữ cảnh xuyên khối. Hoạt động với các bộ embedding ngữ cảnh dài (BGE-M3, Jina v3). Tính toán cao hơn.

**Truy xuất theo ngữ cảnh (Anthropic, 2024).** Thêm vào đầu mỗi khối một bản tóm tắt do LLM sinh về vị trí của nó trong tài liệu ("Khối này là phần 3.2 của các điều khoản chấm dứt..."). Cải thiện truy xuất 35-50% trong benchmark riêng của Anthropic. Tốn kém để lập chỉ mục.

### The rule that beats every default

Khớp kích thước khối với loại truy vấn:

| Loại truy vấn | Kích thước khối |
|------------|-----------|
| Sự kiện ngắn ("tên CEO là gì?") | 256-512 token |
| Phân tích / nhiều bước | 512-1024 token |
| Hiểu toàn bộ phần | 1024-2048 token |

Benchmark năm 2026 của NVIDIA. Khối nên đủ lớn để chứa câu trả lời cộng ngữ cảnh cục bộ, đủ nhỏ để các kết quả top-K của bộ truy xuất tập trung vào câu trả lời thay vì nhiễu ngữ cảnh.

```figure
n5-chunk-cuts
```

## Build It

### Step 1: fixed and recursive chunking

```python
def chunk_fixed(text, size=512, overlap=0):
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text), step)]


def chunk_recursive(text, size=512, seps=("\n\n", "\n", ". ", " ")):
    if len(text) <= size:
        return [text]
    for sep in seps:
        if sep not in text:
            continue
        parts = text.split(sep)
        chunks = []
        buf = ""
        for p in parts:
            if len(p) > size:
                if buf:
                    chunks.append(buf)
                    buf = ""
                chunks.extend(chunk_recursive(p, size=size, seps=seps[1:] or (" ",)))
                continue
            candidate = buf + sep + p if buf else p
            if len(candidate) <= size:
                buf = candidate
            else:
                if buf:
                    chunks.append(buf)
                buf = p
        if buf:
            chunks.append(buf)
        return [c for c in chunks if c.strip()]
    return chunk_fixed(text, size)
```

### Step 2: semantic chunking

```python
def chunk_semantic(text, encoder, threshold=0.6, min_chars=200, max_chars=2048):
    sentences = split_sentences(text)
    if not sentences:
        return []
    embs = encoder.encode(sentences, normalize_embeddings=True)
    chunks = [[sentences[0]]]
    for i in range(1, len(sentences)):
        sim = float(embs[i] @ embs[i - 1])
        current_len = sum(len(s) for s in chunks[-1])
        if sim < threshold and current_len >= min_chars:
            chunks.append([sentences[i]])
        else:
            chunks[-1].append(sentences[i])

    result = []
    for group in chunks:
        text_group = " ".join(group)
        if len(text_group) > max_chars:
            result.extend(chunk_recursive(text_group, size=max_chars))
        else:
            result.append(text_group)
    return result
```

Tinh chỉnh `threshold` trên lĩnh vực của bạn. Quá cao → các mảnh. Quá thấp → một khối khổng lồ.

### Step 3: parent-document

```python
def chunk_parent_child(text, parent_size=2048, child_size=256):
    parents = chunk_recursive(text, size=parent_size)
    mapping = []
    for p_idx, parent in enumerate(parents):
        children = chunk_recursive(parent, size=child_size)
        for child in children:
            mapping.append({"child": child, "parent_idx": p_idx, "parent": parent})
    return mapping


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

Nhận thức then chốt: khử trùng lặp các khối cha. Nhiều khối con có thể ánh xạ đến cùng một khối cha; trả tất cả sẽ lãng phí ngữ cảnh.

### Step 4: contextual retrieval (Anthropic pattern)

```python
def contextualize_chunks(document, chunks, llm):
    context_prompts = [
        f"""<document>{document}</document>
Here is the chunk to situate: <chunk>{c}</chunk>
Write 50-100 words placing this chunk in the document's context."""
        for c in chunks
    ]
    contexts = llm.batch(context_prompts)
    return [f"{ctx}\n\n{c}" for ctx, c in zip(contexts, chunks)]
```

Lập chỉ mục các khối được ngữ cảnh hóa. Khi truy vấn, truy xuất hưởng lợi từ tín hiệu xung quanh bổ sung.

### Step 5: evaluate

```python
def recall_at_k(queries, corpus_chunks, encoder, k=5):
    chunk_embs = encoder.encode(corpus_chunks, normalize_embeddings=True)
    hits = 0
    for q_text, gold_idxs in queries:
        q_emb = encoder.encode([q_text], normalize_embeddings=True)[0]
        top = np.argsort(-(chunk_embs @ q_emb))[:k]
        if any(i in gold_idxs for i in top):
            hits += 1
    return hits / len(queries)
```

Luôn benchmark. Chiến lược "tốt nhất" cho ngữ liệu của bạn có thể không khớp bất kỳ bài blog nào.

## Pitfalls

- **Chia khối chỉ được đánh giá trên các truy vấn sự kiện ngắn.** Các truy vấn nhiều bước cho thấy những phương pháp thắng rất khác. Dùng một tập đánh giá phân tầng theo loại truy vấn.
- **Chia khối ngữ nghĩa không có kích thước tối thiểu.** Tạo các mảnh 40 token gây hại truy xuất. Luôn buộc `min_tokens`.
- **Chồng lấn như một sự bắt chước mù quáng.** Các nghiên cứu năm 2026 thấy chồng lấn thường không mang lại lợi ích nào và tăng gấp đôi chi phí chỉ mục. Đo lường, đừng giả định.
- **Không buộc tối thiểu/tối đa.** Các khối 5 token hoặc 5000 token đều phá truy xuất. Chặn trong khoảng.
- **Chia khối xuyên tài liệu.** Không bao giờ để một khối trải qua hai tài liệu. Luôn chia khối từng tài liệu, rồi gộp.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chiến lược |
|-----------|----------|
| Lần xây dựng đầu, ngữ liệu chưa biết | Đệ quy, 512 token, không chồng lấn |
| QA sự kiện ngắn | Đệ quy, 256-512 token |
| Phân tích / nhiều bước | Đệ quy, 512-1024 token + tài liệu cha |
| Nhiều tham chiếu chéo (hợp đồng, bài báo) | Chia khối muộn hoặc truy xuất theo ngữ cảnh |
| Ngữ liệu hội thoại / đối thoại | Các khối cấp lượt + metadata người nói |
| Các phát ngôn ngắn (tweet, đánh giá) | Một tài liệu = một khối |

Bắt đầu với đệ quy 512. Đo recall@5 trên một tập đánh giá 50 truy vấn. Tinh chỉnh từ đó.

## Ship It

Lưu thành `outputs/skill-chunker.md`:

```markdown
---
name: chunker
description: Pick a chunking strategy, size, and overlap for a given corpus and query distribution.
version: 1.0.0
phase: 5
lesson: 23
tags: [nlp, rag, chunking]
---

Given a corpus (document types, avg length, domain) and query distribution (factoid / analytical / multi-hop), output:

1. Strategy. Recursive / sentence / semantic / parent-document / late / contextual. Reason.
2. Chunk size. Token count. Reason tied to query type.
3. Overlap. Default 0; justify if >0.
4. Min/max enforcement. `min_tokens`, `max_tokens` guards.
5. Evaluation plan. Recall@5 on 50-query stratified eval set (factoid, analytical, multi-hop).

Refuse any chunking strategy without min/max chunk size enforcement. Refuse overlap above 20% without an ablation showing it helps. Flag semantic chunking recommendations without a min-token floor.
```

## Exercises

1. **Dễ.** Chia khối một tài liệu 20 trang bằng fixed(512, 0), recursive(512, 0) và recursive(512, 100). So sánh số khối và chất lượng ranh giới.
2. **Trung bình.** Xây dựng một tập đánh giá 30 truy vấn trên 5 tài liệu. Đo recall@5 cho đệ quy, ngữ nghĩa và tài liệu cha. Phương pháp nào thắng? Nó có khớp các bài blog không?
3. **Khó.** Triển khai truy xuất theo ngữ cảnh. Đo cải thiện MRR so với baseline đệ quy. Báo cáo chi phí chỉ mục (các lời gọi LLM) so với mức tăng accuracy.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Chunk (Khối) | Một phần tài liệu | Đơn vị dưới tài liệu được embedding, lập chỉ mục và truy xuất. |
| Overlap (Chồng lấn) | Biên an toàn | N token dùng chung giữa các khối liền kề; thường vô dụng trong các benchmark năm 2026. |
| Semantic chunking (Chia khối ngữ nghĩa) | Chia khối thông minh | Chia nơi độ tương đồng embedding của các câu liền kề giảm. |
| Parent-document (Tài liệu cha) | Truy xuất hai cấp | Truy xuất các khối con nhỏ, trả các khối cha lớn hơn. |
| Late chunking (Chia khối muộn) | Chia khối sau embedding | Embedding toàn bộ tài liệu ở cấp token, pooling thành các vector khối. |
| Contextual retrieval (Truy xuất theo ngữ cảnh) | Thủ thuật của Anthropic | Bản tóm tắt do LLM sinh được thêm vào đầu mỗi khối trước khi lập chỉ mục. |
| Context cliff (Vách ngữ cảnh) | Bức tường 2500 token | Mức giảm chất lượng quan sát được quanh 2.5k token ngữ cảnh trong RAG (tháng 1 năm 2026). |

## Further Reading

- [Yepes et al. / LangChain — Recursive Character Splitting docs](https://python.langchain.com/docs/how_to/recursive_text_splitter/) — mặc định trong production.
- [Vectara (2024, NAACL 2025). Chunking configurations analysis](https://arxiv.org/abs/2410.13070) — chia khối quan trọng ngang lựa chọn embedding.
- [Jina AI — Late Chunking in Long-Context Embedding Models (2024)](https://jina.ai/news/late-chunking-in-long-context-embedding-models/) — bài báo chia khối muộn.
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — cải thiện truy xuất 35-50% với các tiền tố ngữ cảnh do LLM sinh.
- [NVIDIA 2026 chunk-size benchmark — Premai summary](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/) — kích thước khối theo loại truy vấn.
