# Information Retrieval and Search

> BM25 chính xác nhưng mong manh. Truy xuất đặc giăng lưới rộng nhưng bỏ sót từ khóa. Lai là mặc định năm 2026. Mọi thứ khác là tinh chỉnh.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## The Problem

Người dùng gõ "điều gì xảy ra nếu ai đó nói dối để lấy tiền" và kỳ vọng tìm được điều luật thực sự bao quát điều đó: "Điều 420 IPC." Một tìm kiếm từ khóa bỏ lỡ hoàn toàn (không có từ vựng chung). Một tìm kiếm ngữ nghĩa bỏ lỡ nếu các embedding không được huấn luyện trên văn bản pháp lý. Tìm kiếm thực phải xử lý cả hai.

IR là pipeline bên dưới mọi hệ thống RAG, mọi thanh tìm kiếm, mọi tra cứu gần đúng của trang tài liệu. Kiến trúc năm 2026 hoạt động trong production không phải một phương pháp duy nhất. Nó là một chuỗi các phương pháp bổ sung nhau, mỗi phương pháp bắt các lỗi của phương pháp trước.

Bài học này xây dựng từng phần và nêu tên những lỗi mỗi phần bắt được.

## The Concept

![Hybrid retrieval: BM25 + dense + RRF + cross-encoder rerank](../assets/retrieval.svg)

Bốn tầng. Chọn những tầng bạn cần.

1. **Truy xuất thưa (BM25).** Nhanh, chính xác với các kết quả khớp chính xác, rất tệ về ngữ nghĩa. Chạy trên một chỉ mục đảo. Dưới 10ms mỗi truy vấn trên hàng triệu tài liệu. Lấy đúng các tham chiếu luật, mã sản phẩm, thông báo lỗi, thực thể có tên.
2. **Truy xuất đặc.** Mã hóa truy vấn và tài liệu thành các vector. Tìm kiếm láng giềng gần nhất. Nắm bắt diễn đạt lại và độ tương đồng ngữ nghĩa. Bỏ sót các kết quả khớp từ khóa chính xác khác nhau một ký tự. 50-200ms mỗi truy vấn với FAISS hoặc một DB vector.
3. **Kết hợp.** Gộp các danh sách xếp hạng từ thưa và đặc. Reciprocal Rank Fusion (RRF) là mặc định dễ dùng vì nó bỏ qua các điểm thô (nằm trên các thang khác nhau) và chỉ dùng các vị trí thứ hạng. Kết hợp có trọng số là một lựa chọn khi bạn biết một tín hiệu chi phối cho lĩnh vực của mình.
4. **Xếp hạng lại cross-encoder.** Lấy top-30 từ kết hợp. Chạy một cross-encoder (truy vấn + tài liệu cùng nhau, chấm điểm mỗi cặp). Giữ top-5. Cross-encoder chậm hơn bi-encoder trên mỗi cặp nhưng chính xác hơn nhiều. Bạn phân bổ chi phí bằng cách chỉ chạy chúng trên top-30.

Truy xuất ba hướng (BM25 + đặc + thưa được học như SPLADE) vượt hai hướng trong các benchmark năm 2026 nhưng cần hạ tầng cho các chỉ mục thưa được học. Với hầu hết các nhóm, hai hướng cộng xếp hạng lại cross-encoder là điểm cân bằng tốt.

```figure
gx-hybrid-retrieval
```

## Build It

### Step 1: BM25 from scratch

```python
import math
import re
from collections import Counter

TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text):
    return TOKEN_RE.findall(text.lower())


class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        if not corpus:
            raise ValueError("corpus must not be empty")
        self.corpus = [tokenize(d) for d in corpus]
        self.k1 = k1
        self.b = b
        self.n_docs = len(self.corpus)
        self.avg_dl = sum(len(d) for d in self.corpus) / self.n_docs
        self.df = Counter()
        for doc in self.corpus:
            for term in set(doc):
                self.df[term] += 1

    def idf(self, term):
        n = self.df.get(term, 0)
        return math.log(1 + (self.n_docs - n + 0.5) / (n + 0.5))

    def score(self, query, doc_idx):
        q_tokens = tokenize(query)
        doc = self.corpus[doc_idx]
        dl = len(doc)
        freq = Counter(doc)
        score = 0.0
        for term in q_tokens:
            f = freq.get(term, 0)
            if f == 0:
                continue
            numerator = f * (self.k1 + 1)
            denominator = f + self.k1 * (1 - self.b + self.b * dl / self.avg_dl)
            score += self.idf(term) * numerator / denominator
        return score

    def rank(self, query, top_k=10):
        scored = [(self.score(query, i), i) for i in range(self.n_docs)]
        scored.sort(reverse=True)
        return scored[:top_k]
```

Hai tham số cần biết. `k1=1.5` kiểm soát độ bão hòa tần suất thuật ngữ; cao hơn nghĩa là trọng số lớn hơn cho sự lặp thuật ngữ. `b=0.75` kiểm soát chuẩn hóa độ dài; 0 bỏ qua độ dài tài liệu, 1 chuẩn hóa hoàn toàn. Các mặc định là khuyến nghị của Robertson từ bài báo gốc và hiếm khi cần tinh chỉnh.

### Step 2: dense retrieval with a bi-encoder

```python
from sentence_transformers import SentenceTransformer
import numpy as np


def build_dense_index(corpus, model_id="sentence-transformers/all-MiniLM-L6-v2"):
    encoder = SentenceTransformer(model_id)
    embeddings = encoder.encode(corpus, normalize_embeddings=True)
    return encoder, embeddings


def dense_search(encoder, embeddings, query, top_k=10):
    q_emb = encoder.encode([query], normalize_embeddings=True)
    sims = (embeddings @ q_emb.T).flatten()
    order = np.argsort(-sims)[:top_k]
    return [(float(sims[i]), int(i)) for i in order]
```

Chuẩn hóa L2 các embedding để tích vô hướng bằng cosine. `all-MiniLM-L6-v2` có 384 chiều, nhanh và đủ mạnh cho hầu hết truy xuất tiếng Anh. Với công việc đa ngôn ngữ, dùng `paraphrase-multilingual-MiniLM-L12-v2`. Để có accuracy hàng đầu, `bge-large-en-v1.5` hoặc `e5-large-v2`.

### Step 3: Reciprocal Rank Fusion

```python
def reciprocal_rank_fusion(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for rank, (_, doc_idx) in enumerate(ranking):
            scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank + 1)
    fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [(score, doc_idx) for doc_idx, score in fused]
```

Hằng số `k=60` đến từ bài báo RRF gốc. `k` cao hơn làm phẳng đóng góp của các khác biệt thứ hạng; `k` thấp hơn khiến các thứ hạng đầu chi phối. 60 là mặc định đã công bố và hiếm khi cần tinh chỉnh.

### Step 4: hybrid search + rerank

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def hybrid_search(query, bm25, encoder, dense_embeddings, corpus, top_k=5, pool_size=30, reranker=reranker):
    sparse_ranking = bm25.rank(query, top_k=pool_size)
    dense_ranking = dense_search(encoder, dense_embeddings, query, top_k=pool_size)
    fused = reciprocal_rank_fusion([sparse_ranking, dense_ranking])[:pool_size]

    pairs = [(query, corpus[doc_idx]) for _, doc_idx in fused]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(scores, [doc_idx for _, doc_idx in fused]), reverse=True)
    return reranked[:top_k]
```

Ba giai đoạn được kết hợp. BM25 tìm các kết quả khớp từ vựng. Truy xuất đặc tìm các kết quả khớp ngữ nghĩa. RRF gộp hai bảng xếp hạng mà không cần hiệu chuẩn điểm. Cross-encoder chấm lại top-30 dùng các cặp truy vấn-tài liệu cùng nhau, nắm bắt tính liên quan chi tiết mà bi-encoder bỏ sót. Giữ top-5.

### Step 5: evaluation

| Thước đo | Ý nghĩa |
|--------|---------|
| Recall@k | Trong các truy vấn mà tài liệu đúng tồn tại, nó nằm trong top-k bao nhiêu lần? |
| MRR (Mean Reciprocal Rank) | Trung bình của 1/thứ hạng của tài liệu liên quan đầu tiên. |
| nDCG@k | Tính đến các mức độ liên quan, không chỉ nhị phân liên quan/không. |

Riêng với RAG, **Recall@k** của bộ truy xuất là con số quan trọng nhất. Bộ đọc của bạn không thể trả lời nếu đúng đoạn văn không nằm trong tập được truy xuất.

Mẹo gỡ lỗi: với các truy vấn thất bại, so sánh khác biệt giữa các bảng xếp hạng thưa và đặc. Nếu một bên tìm đúng tài liệu còn bên kia không, bạn có sự không khớp từ vựng (cách sửa: thêm nửa còn thiếu) hoặc sự nhập nhằng ngữ nghĩa (cách sửa: các embedding tốt hơn hoặc một bộ xếp hạng lại).

## Use It

Ngăn xếp năm 2026:

| Quy mô | Ngăn xếp |
|-------|-------|
| 1k-100k tài liệu | BM25 trong bộ nhớ + các embedding `all-MiniLM-L6-v2` + RRF. Không có DB riêng. |
| 100k-10M tài liệu | FAISS hoặc pgvector cho đặc + Elasticsearch / OpenSearch cho BM25. Chạy song song. |
| 10M+ tài liệu | Qdrant / Weaviate / Vespa / Milvus có hỗ trợ lai. Xếp hạng lại cross-encoder trên top-30. |
| Tuyến đầu chất lượng tốt nhất | Ba hướng (BM25 + đặc + SPLADE) + xếp hạng lại tương tác muộn ColBERT |

Dù chọn gì, hãy dành ngân sách cho đánh giá. Benchmark recall truy xuất trước khi benchmark độ chính xác RAG đầu cuối. Một bộ đọc không thể sửa những gì bộ truy xuất bỏ sót.

### The hard-won lessons from 2026 production RAG

- **80% các lỗi RAG bắt nguồn từ nạp dữ liệu và chia khối, không phải mô hình.** Các nhóm dành hàng tuần hoán đổi LLM và tinh chỉnh prompt trong khi truy xuất âm thầm trả sai ngữ cảnh cứ mỗi ba truy vấn. Sửa chia khối trước.
- **Chiến lược chia khối quan trọng hơn kích thước khối.** Các lần chia kích thước cố định phá các bảng, mã và tiêu đề lồng nhau. Nhận biết câu là mặc định; chia khối ngữ nghĩa hoặc dựa trên LLM đáng giá với tài liệu kỹ thuật và hướng dẫn sản phẩm.
- **Mẫu tài liệu cha.** Truy xuất các khối "con" nhỏ để có precision. Khi nhiều khối con từ cùng một phần cha xuất hiện, thay bằng khối cha để giữ ngữ cảnh. Điều này nâng chất lượng câu trả lời một cách nhất quán mà không huấn luyện lại.
- **k_rerank=3 thường là tối ưu.** Mọi khối thêm sau đó thêm chi phí token và độ trễ sinh mà không nâng chất lượng câu trả lời. Nếu k=8 vẫn tốt hơn k=3 với bạn, bộ xếp hạng lại đang hoạt động dưới mức.
- **HyDE / mở rộng truy vấn.** Sinh một câu trả lời giả định từ truy vấn, embedding nó, truy xuất. Nối khoảng cách cách diễn đạt giữa các câu hỏi ngắn và tài liệu dài. Nâng precision miễn phí không cần huấn luyện.
- **Ngân sách ngữ cảnh dưới 8K token.** Liên tục chạm giới hạn đó nghĩa là ngưỡng bộ xếp hạng lại quá lỏng.
- **Quản lý phiên bản mọi thứ.** Prompt, quy tắc chia khối, mô hình embedding, bộ xếp hạng lại. Bất kỳ độ trôi nào cũng âm thầm phá chất lượng câu trả lời. Các cổng CI dựa trên độ trung thành, precision ngữ cảnh và tỷ lệ câu hỏi không được trả lời chặn các hồi quy trước khi người dùng thấy chúng.
- **Truy xuất ba hướng (BM25 + đặc + thưa được học như SPLADE) vượt hai hướng** trên các benchmark năm 2026, đặc biệt với các truy vấn trộn danh từ riêng và ngữ nghĩa. Phát hành nó khi hạ tầng hỗ trợ các chỉ mục SPLADE.

Thiết kế truy xuất đúng giảm ảo giác 70-90% theo các phép đo trong ngành năm 2026. Hầu hết cải thiện hiệu năng RAG đến từ truy xuất tốt hơn, không phải fine-tuning mô hình.

## Ship It

Lưu thành `outputs/skill-retrieval-picker.md`:

```markdown
---
name: retrieval-picker
description: Pick a retrieval stack for a given corpus and query pattern.
version: 1.0.0
phase: 5
lesson: 14
tags: [nlp, retrieval, rag, search]
---

Given requirements (corpus size, query pattern, latency budget, quality bar, infra constraints), output:

1. Stack. BM25 only, dense only, hybrid (BM25 + dense + RRF), hybrid + cross-encoder rerank, or three-way (BM25 + dense + learned-sparse).
2. Dense encoder. Name the specific model. Match to language(s), domain, and context length.
3. Reranker. Name the specific cross-encoder model if used. Flag that rerank adds 30-100ms latency on top-30.
4. Evaluation plan. Recall@10 is the primary retriever metric. MRR for multi-answer. Baseline first, incremental improvements measured against it.

Refuse to recommend dense-only for corpora with named entities, error codes, or product SKUs unless the user has evidence dense handles exact matches. Refuse to skip reranking for high-stakes retrieval (legal, medical) where the final top-5 decides the user's answer.
```

## Exercises

1. **Dễ.** Triển khai `hybrid_search` ở trên trên một ngữ liệu 500 tài liệu. Kiểm thử 20 truy vấn. So sánh recall tại 5 giữa chỉ BM25, chỉ đặc và lai.
2. **Trung bình.** Thêm phép tính MRR. Với mỗi truy vấn kiểm thử có một tài liệu đúng đã biết, tìm thứ hạng tài liệu đúng trong các bảng xếp hạng BM25, đặc và lai. Báo cáo MRR cho mỗi bên.
3. **Khó.** Fine-tune một encoder đặc trên lĩnh vực của bạn bằng MultipleNegativesRankingLoss (Sentence Transformers). Xây dựng một tập huấn luyện từ 500 cặp truy vấn-tài liệu. So sánh recall trước và sau fine-tune.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| BM25 | Tìm kiếm từ khóa | Okapi BM25. Chấm điểm tài liệu theo tần suất thuật ngữ, IDF và độ dài. |
| Dense retrieval (Truy xuất đặc) | Tìm kiếm vector | Mã hóa truy vấn + tài liệu thành các vector, tìm các láng giềng gần nhất. |
| Bi-encoder | Mô hình embedding | Mã hóa truy vấn và tài liệu độc lập. Nhanh khi truy vấn. |
| Cross-encoder | Mô hình xếp hạng lại | Mã hóa truy vấn + tài liệu cùng nhau. Chậm nhưng chính xác. |
| RRF | Kết hợp thứ hạng | Kết hợp hai bảng xếp hạng bằng cách cộng `1/(k + rank)`. |
| Recall@k | Thước đo truy xuất | Tỷ lệ các truy vấn mà một tài liệu liên quan nằm trong top-k. |

## Further Reading

- [Robertson and Zaragoza (2009). The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) — cách trình bày BM25 đầy đủ nhất.
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) — DPR, bi-encoder kinh điển.
- [Formal et al. (2021). SPLADE: Sparse Lexical and Expansion Model](https://arxiv.org/abs/2107.05720) — bộ truy xuất thưa được học thu hẹp khoảng cách với đặc.
- [Cormack, Clarke, Büttcher (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) — bài báo RRF.
- [Khattab and Zaharia (2020). ColBERT: Efficient and Effective Passage Search](https://arxiv.org/abs/2004.12832) — truy xuất tương tác muộn.
