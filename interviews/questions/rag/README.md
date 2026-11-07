# RAG

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Chunking, truy xuất lai, xếp hạng lại và cách đo một pipeline truy xuất.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [The retriever model and the reranker model](bi-encoder-vs-cross-encoder.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Why vector search ranks by cosine](cosine-is-the-default.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Retrieval or fine-tuning for the policy wiki](rag-or-fine-tune.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The first metric to read after a wrong answer](recall-at-k-first.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Review a chunking choice before the first index build](chunk-size-by-query-type.md) | Đánh đổi | 2 Làm việc | 10 |
| [Count the work of a reranker over the whole index](cross-encoder-passes-per-query.md) | Ước lượng | 2 Làm việc | 8 |
| [Vector search misses the article with the exact error code](error-code-query-misses.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Faithfulness and answer relevance grade different things](faithfulness-vs-relevance.md) | Khái niệm | 2 Làm việc | 7 |
| [Filter on metadata ahead of the vector search](filter-before-search.md) | Thiết kế | 2 Làm việc | 8 |
| [Settle a chunk overlap argument with one ablation](overlap-measure-first.md) | Đánh đổi | 2 Làm việc | 8 |
| [Read the parent-document retrieval function](parent-child-dedupe.md) | Đọc mã | 2 Làm việc | 8 |
| [Which query rewriter fits a two-topic question](pick-the-query-rewriter.md) | Đánh đổi | 2 Làm việc | 9 |
| [Read the rank fusion function](read-the-rrf-function.md) | Đọc mã | 2 Làm việc | 8 |
| [The reranker is perfect offline and worse in production](reranker-magic-in-eval.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Why hybrid search fuses ranks and not scores](rrf-beats-score-sum.md) | Khái niệm | 2 Làm việc | 8 |
| [Read the four lines that score a BM25 term](bm25-idf-plus-one.md) | Đọc mã | 3 Cao cấp | 10 |
| [Design a question answering service over company documents](design-rag-over-company-docs.md) | Thiết kế | 3 Cao cấp | 30 |
| [Recall holds, MRR drops, nobody touched the retriever](diagnose-from-the-metric-table.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [The invented passage made code search worse](hyde-invents-a-symbol.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Faithfulness stays high while reviewers find invented facts](judge-grades-its-own-work.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Let the assistant say it does not know](refuse-when-confidence-is-low.md) | Thiết kế | 3 Cao cấp | 10 |
| [Pick how many candidates the reranker scores](rerank-pool-size.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Build the eval that picks a retrieval configuration](take-home-stratified-eval.md) | Làm ở nhà | 3 Cao cấp | 60 |
| [Design code search across ten repositories that stays fresh](design-cross-repo-code-search.md) | Thiết kế | 4 Staff | 30 |
| [Every metric is high and one unit still gets wrong answers](eval-passes-users-complain.md) | Thiết kế | 4 Staff | 15 |
| [The other jurisdiction's clause reached the answer](jurisdiction-leak-in-shared-index.md) | Thiết kế | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
