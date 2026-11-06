# Embedding Models — The 2026 Deep Dive

> Word2Vec cho bạn một vector cho mỗi từ. Các mô hình embedding hiện đại cho bạn một vector cho mỗi đoạn văn, xuyên ngôn ngữ, với các góc nhìn thưa, đặc và đa vector, có kích thước vừa chỉ mục của bạn. Chọn sai và RAG của bạn truy xuất sai thứ.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec), Phase 5 · 14 (Information Retrieval)
**Time:** ~60 minutes

## The Problem

Hệ thống RAG của bạn truy xuất sai đoạn văn 40% số lần. Thủ phạm hiếm khi là cơ sở dữ liệu vector hoặc prompt. Nó là mô hình embedding.

Chọn một embedding năm 2026 nghĩa là chọn trên năm trục:

1. **Đặc so với thưa so với đa vector.** Một vector cho mỗi đoạn văn, hoặc một cho mỗi token, hoặc một bag of words thưa có trọng số.
2. **Độ bao phủ ngôn ngữ.** Các mô hình tiếng Anh đơn ngôn ngữ vẫn thắng trên các tác vụ chỉ tiếng Anh. Các mô hình đa ngôn ngữ thắng khi các ngữ liệu được trộn.
3. **Độ dài ngữ cảnh.** 512 token so với 8,192 so với 32,768 — và dung lượng hiệu dụng thực thường là 60-70% mức tối đa được quảng bá.
4. **Ngân sách số chiều.** 3,072 số float ở độ chính xác đầy đủ = 12 KB mỗi vector. Với 100M vector, lưu trữ là $1,300/tháng. Cắt ngắn Matryoshka giảm điều này 4×.
5. **Mở so với được lưu trữ.** Trọng số mở nghĩa là bạn kiểm soát ngăn xếp và dữ liệu. Được lưu trữ nghĩa là bạn đổi quyền kiểm soát lấy luôn mới nhất.

Bài học này nêu tên các đánh đổi để bạn có thể chọn dựa trên bằng chứng, không dựa trên bất kỳ thứ gì phổ biến quý trước.

## The Concept

![Dense, sparse, and multi-vector embeddings](../assets/embedding-modes.svg)

**Các embedding đặc.** Một vector cho mỗi đoạn văn (thường 384-3,072 chiều). Cosine similarity xếp hạng các đoạn văn theo độ gần ngữ nghĩa. `text-embedding-3-large` của OpenAI, chế độ đặc BGE-M3, Voyage-3. Lựa chọn mặc định.

**Các embedding thưa.** Kiểu SPLADE. Một transformer dự đoán một trọng số cho mọi token từ vựng, rồi đặt hầu hết chúng thành không. Kết quả là một vector thưa kích thước |vocab|. Nắm bắt khớp từ vựng (như BM25) nhưng với các trọng số thuật ngữ được học. Mạnh trên các truy vấn nhiều từ khóa.

**Đa vector (tương tác muộn).** ColBERTv2, Jina-ColBERT. Một vector cho mỗi token. Chấm điểm bằng MaxSim: với mỗi token truy vấn, tìm token tài liệu tương tự nhất, cộng các điểm. Tốn kém hơn để lưu và chấm, nhưng thắng trên các truy vấn dài và các ngữ liệu theo lĩnh vực.

**BGE-M3: cả ba cùng lúc.** Một mô hình duy nhất xuất các biểu diễn đặc, thưa và đa vector đồng thời. Mỗi biểu diễn có thể được truy vấn độc lập; các điểm kết hợp qua tổng có trọng số. Mặc định năm 2026 khi bạn muốn sự linh hoạt từ một checkpoint.

**Matryoshka Representation Learning.** Được huấn luyện sao cho N chiều đầu của vector tạo thành một embedding độc lập hữu ích. Cắt một vector 1,536 chiều xuống 256 chiều và trả ~1% accuracy để tiết kiệm lưu trữ 6×. Được hỗ trợ bởi OpenAI text-3, Cohere v4, Voyage-4, Jina v5, Gemini Embedding 2, Nomic v1.5+.

### The MTEB leaderboard tells a partial story

Massive Text Embedding Benchmark — 56 tác vụ trên 8 loại tác vụ khi ra mắt (2022), mở rộng thành 100+ tác vụ trong MTEB v2. Đầu năm 2026, Gemini Embedding 2 đứng đầu truy xuất (67.71 MTEB-R). Cohere embed-v4 dẫn đầu tổng quát (65.2 MTEB). BGE-M3 dẫn đầu đa ngôn ngữ trọng số mở (63.0). Bảng xếp hạng cần thiết nhưng không đủ — luôn benchmark trên lĩnh vực của bạn.

### The three-tier pattern

| Trường hợp sử dụng | Mẫu |
|----------|---------|
| Lượt đầu nhanh | Bi-encoder đặc (BGE-M3, text-3-small) |
| Tăng recall | Thưa (SPLADE, BGE-M3 thưa) + kết hợp RRF |
| Precision trên top-50 | Đa vector (ColBERTv2) hoặc bộ xếp hạng lại cross-encoder |

Hầu hết các ngăn xếp production dùng cả ba.

```figure
gx-matryoshka
```

## Build It

### Step 1: baseline — dense embeddings with Sentence-BERT

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")
corpus = [
    "The first iPhone launched in 2007.",
    "Apple released the iPod in 2001.",
    "Android is an operating system from Google.",
]
emb = encoder.encode(corpus, normalize_embeddings=True)

query = "When was the iPhone released?"
q_emb = encoder.encode([query], normalize_embeddings=True)[0]
scores = emb @ q_emb
print(sorted(enumerate(scores), key=lambda x: -x[1]))
```

`normalize_embeddings=True` khiến tích vô hướng bằng cosine similarity. Luôn đặt nó.

### Step 2: Matryoshka truncation

```python
def truncate(vectors, dim):
    out = vectors[:, :dim]
    return out / np.linalg.norm(out, axis=1, keepdims=True)

emb_256 = truncate(emb, 256)
emb_128 = truncate(emb, 128)
```

Chuẩn hóa lại sau cắt ngắn. Nomic v1.5, OpenAI text-3 và Voyage-4 được huấn luyện sao cho điều này không mất mát cho vài mức đầu. Các mô hình không phải Matryoshka (Sentence-BERT gốc) suy giảm mạnh khi bị cắt ngắn.

### Step 3: BGE-M3 multi-functionality

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

output = model.encode(
    corpus,
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True,
)
# output["dense_vecs"]:    (n_docs, 1024)
# output["lexical_weights"]: list of dict {token_id: weight}
# output["colbert_vecs"]:  list of (n_tokens, 1024) arrays
```

Ba chỉ mục, một lời gọi suy luận. Kết hợp điểm:

```python
dense_score = ... # cosine over dense_vecs
sparse_score = model.compute_lexical_matching_score(q_lex, d_lex)
colbert_score = model.colbert_score(q_col, d_col)
final = 0.4 * dense_score + 0.2 * sparse_score + 0.4 * colbert_score
```

Tinh chỉnh các trọng số trên lĩnh vực của bạn.

### Step 4: MTEB eval on a custom task

```python
from mteb import MTEB

tasks = ["ArguAna", "SciFact", "NFCorpus"]
evaluation = MTEB(tasks=tasks)
results = evaluation.run(encoder, output_folder="./mteb-results")
```

Chạy các mô hình ứng viên trên một tập con *đại diện*. Đừng chỉ tin thứ hạng bảng xếp hạng — lĩnh vực của bạn quan trọng.

### Step 5: hand-rolled cosine from scratch

Xem `code/main.py`. Các embedding Averaged Hashing Trick (chỉ stdlib). Không cạnh tranh với các embedding transformer, nhưng cho thấy hình dạng: tokenize → vector → chuẩn hóa → tích vô hướng.

## Pitfalls

- **Cùng mô hình cho truy vấn và tài liệu.** Một số mô hình (Voyage, Jina-ColBERT) dùng mã hóa bất đối xứng — truy vấn và tài liệu đi qua các đường khác nhau. Luôn kiểm tra thẻ mô hình.
- **Thiếu tiền tố.** Các mô hình `bge-*` cần `"Represent this sentence for searching relevant passages: "` được thêm vào đầu các truy vấn. Khoảng cách recall 3-5 điểm nếu bạn quên.
- **Cắt Matryoshka quá mức.** 1,536 → 256 thường an toàn. 1,536 → 64 thì không. Xác thực trên tập đánh giá của bạn.
- **Cắt cụt ngữ cảnh.** Hầu hết các mô hình âm thầm cắt cụt đầu vào vượt độ dài tối đa. Các tài liệu dài cần chia khối (xem bài 23).
- **Bỏ qua đuôi độ trễ.** Các điểm MTEB che giấu độ trễ p99. Một mô hình 600M có thể thắng một mô hình 335M 2 điểm nhưng tốn hơn 3× mỗi truy vấn.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Chỉ tiếng Anh, nhanh, API | `text-embedding-3-large` hoặc `voyage-3-large` |
| Trọng số mở, tiếng Anh | `BAAI/bge-large-en-v1.5` |
| Trọng số mở, đa ngôn ngữ | `BAAI/bge-m3` hoặc `Qwen3-Embedding-8B` |
| Ngữ cảnh dài (32k+) | Voyage-3-large, Cohere embed-v4, Qwen3-Embedding-8B |
| Triển khai chỉ CPU | Nomic Embed v2 (137M tham số, MoE) |
| Lưu trữ hạn chế | Cắt ngắn Matryoshka + lượng tử hóa int8 |
| Các truy vấn nhiều từ khóa | Thêm SPLADE thưa, kết hợp RRF với đặc |

Mẫu năm 2026: bắt đầu với BGE-M3 hoặc text-3-large, đánh giá trên lĩnh vực của bạn bằng MTEB, hoán đổi nếu một mô hình theo lĩnh vực thắng hơn 3 điểm.

## Ship It

Lưu thành `outputs/skill-embedding-picker.md`:

```markdown
---
name: embedding-picker
description: Pick embedding model, dimension, and retrieval mode for a given corpus and deployment.
version: 1.0.0
phase: 5
lesson: 22
tags: [nlp, embeddings, retrieval]
---

Given a corpus (size, languages, domain, avg length), deployment target (cloud / edge / on-prem), latency budget, and storage budget, output:

1. Model. Named checkpoint or API. One-sentence reason.
2. Dimension. Full / Matryoshka-truncated / int8-quantized. Reason tied to storage budget.
3. Mode. Dense / sparse / multi-vector / hybrid. Reason.
4. Query prefix / template if required by the model card.
5. Evaluation plan. MTEB tasks relevant to domain + held-out domain eval with nDCG@10.

Refuse recommendations that truncate Matryoshka to <64 dims without domain validation. Refuse ColBERTv2 for corpora under 10k passages (overhead not justified). Flag long-document corpora (>8k tokens) routed to models with 512-token windows.
```

## Exercises

1. **Dễ.** Mã hóa 100 câu bằng `bge-small-en-v1.5` ở số chiều đầy đủ (384), rồi tại Matryoshka 128. Đo mức giảm MRR trên 10 truy vấn.
2. **Trung bình.** So sánh các chế độ đặc, thưa và colbert của BGE-M3 trên 500 đoạn văn từ lĩnh vực của bạn. Chế độ nào thắng về recall@10? Kết hợp RRF có thắng chế độ đơn tốt nhất không?
3. **Khó.** Chạy MTEB trên ba mô hình ứng viên trên top-2 tác vụ lĩnh vực của bạn. Báo cáo điểm MTEB, độ trễ p99 trên một batch 100 truy vấn và $/1M truy vấn. Chọn mô hình tối ưu Pareto.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Dense embedding (Embedding đặc) | Vector | Một vector kích thước cố định cho mỗi văn bản. Cosine similarity để xếp hạng. |
| Sparse embedding (Embedding thưa) | BM25 được học | Một trọng số cho mỗi token từ vựng; chủ yếu là không; được huấn luyện đầu cuối. |
| Multi-vector (Đa vector) | Kiểu ColBERT | Một vector cho mỗi token; chấm điểm MaxSim; chỉ mục lớn hơn, recall tốt hơn. |
| Matryoshka | Thủ thuật búp bê Nga | N chiều đầu tự chúng là một embedding nhỏ hơn hợp lệ. |
| MTEB | Benchmark | Massive Text Embedding Benchmark — 56 tác vụ khi ra mắt, 100+ trong v2. |
| BEIR | Benchmark truy xuất | 18 tác vụ truy xuất zero-shot; thường được trích dẫn cho độ vững xuyên lĩnh vực. |
| Asymmetric encoding (Mã hóa bất đối xứng) | Đường truy vấn ≠ tài liệu | Mô hình dùng các phép chiếu khác nhau cho truy vấn và tài liệu. |

## Further Reading

- [Reimers, Gurevych (2019). Sentence-BERT](https://arxiv.org/abs/1908.10084) — bài báo bi-encoder.
- [Muennighoff et al. (2022). MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316) — bài báo bảng xếp hạng.
- [Chen et al. (2024). BGE-M3: Multi-lingual, Multi-functionality, Multi-granularity](https://arxiv.org/abs/2402.03216) — mô hình ba chế độ thống nhất.
- [Kusupati et al. (2022). Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) — mục tiêu huấn luyện thang số chiều.
- [Santhanam et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction](https://arxiv.org/abs/2112.01488) — tương tác muộn trong production.
- [MTEB leaderboard on Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) — các thứ hạng trực tiếp.
