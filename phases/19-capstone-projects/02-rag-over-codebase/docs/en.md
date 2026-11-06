# Capstone 02 — RAG over Codebase (Cross-Repo Semantic Search)

> Mọi tổ chức kỹ thuật nghiêm túc năm 2026 vận hành tìm kiếm mã nội bộ hiểu ý nghĩa, không chỉ chuỗi. Sourcegraph Amp, trả lời codebase Cursor, đồ thị doanh nghiệp Augment, repomap Aider, MCP nội bộ Pinterest — cùng hình dạng. Thu nạp nhiều repo, phân tích bằng tree-sitter, tạo embedding đoạn cấp hàm và lớp, tìm kiếm lai, xếp hạng lại, trả lời có trích dẫn. Bài tổng kết yêu cầu xây hệ thống xử lý 2M dòng mã trên 10 repo và trụ qua tái lập chỉ mục tăng dần trên mỗi git push.

**Type:** Capstone
**Languages:** Python (ingestion), TypeScript (API + UI)
**Prerequisites:** Phase 5 (NLP foundations), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure)
**Phases exercised:** P5 · P7 · P11 · P13 · P17
**Time:** 30 hours

## Problem

Đến 2026, mọi agent lập trình tiên tiến hàng đầu có lớp truy xuất codebase vì chỉ cửa sổ ngữ cảnh không giải quyết câu hỏi xuyên repo. Ngữ cảnh 1M token Claude giúp; không loại nhu cầu truy xuất có xếp hạng. Tìm cosine đơn giản trên đoạn thô làm nhiễu kết quả ở mã được sinh, trùng lặp monorepo và đuôi dài ký hiệu hiếm import. Câu trả lời sản xuất là tìm kiếm lai (dense + BM25) trên đoạn nhận biết AST có bộ xếp hạng lại, dựa trên đồ thị tham chiếu ký hiệu.

Bạn học bằng lập chỉ mục tập repo thực — không phải một repo hướng dẫn — và đo MRR@10, tính trung thực trích dẫn, độ mới tăng dần. Chế độ lỗi thuộc hạ tầng: monorepo 100k file, lần push chạm lại nửa số file, truy vấn cần qua bốn repo để trả lời đúng.

## Concept

Pipeline thu nạp nhận biết AST phân tích mỗi file bằng tree-sitter, trích nút hàm và lớp, chia đoạn ở ranh giới nút thay vì cửa sổ token cố định. Mỗi đoạn có ba biểu diễn: embedding dense (Voyage-code-3 hoặc nomic-embed-code), từ BM25 sparse và tóm tắt ngôn ngữ tự nhiên ngắn. Tóm tắt thêm phương thức truy xuất thứ ba — người dùng hỏi "X được phân quyền thế nào" và tóm tắt nhắc "authz", ngay cả khi mã chỉ có `check_permission`.

Truy xuất là lai. Truy vấn kích hoạt cả tìm dense và BM25, hợp nhất top-k rồi chuyển hợp cho bộ xếp hạng lại cross-encoder (Cohere rerank-3 hoặc bge-reranker-v2-gemma-2b). Danh sách xếp lại đến bộ tổng hợp ngữ cảnh dài (Claude Sonnet 4.7 với lưu bộ nhớ đệm prompt, hoặc Llama 3.3 70B tự lưu trữ) kèm chỉ dẫn trích mọi khẳng định bằng file và khoảng dòng. Câu trả lời không trích dẫn bị hậu lọc từ chối.

Độ mới tăng dần là vấn đề hạ tầng. Git push kích hoạt diff: file nào đổi, ký hiệu nào đổi. Chỉ đoạn bị ảnh hưởng được tạo embedding lại. Cạnh ký hiệu xuyên file bị ảnh hưởng (import, gọi phương thức) được tính lại. Chỉ mục nhất quán không cần xử lý lại 2M dòng mỗi commit.

## Architecture

```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## Stack

- Phân tích: tree-sitter với 17 ngữ pháp ngôn ngữ (Python, TS, Rust, Go, Java, C++, v.v.)
- Embedding dense: Voyage-code-3 (được lưu trữ) hoặc nomic-embed-code-v1.5 (tự lưu trữ), dự phòng bge-code-v1
- Chỉ mục sparse: Tantivy (Rust) với BM25F, trọng số trường tên ký hiệu so với thân
- DB vector: Qdrant 1.12 có tìm kiếm lai, hoặc pgvector + pgvectorscale cho nhóm dưới 50M vector
- Mô hình tóm tắt đoạn: Claude Haiku 4.5 hoặc Gemini 2.5 Flash, có lưu bộ nhớ đệm prompt
- Bộ xếp hạng lại: Cohere rerank-3 hoặc bge-reranker-v2-gemma-2b tự lưu trữ
- Điều phối: LlamaIndex Workflows cho thu nạp, LangGraph cho agent truy vấn
- Bộ tổng hợp: Claude Sonnet 4.7 (ngữ cảnh 1M) với lưu bộ nhớ đệm prompt
- Đồ thị ký hiệu: Neo4j (được quản lý) hoặc kuzu (nhúng) cho cạnh import và gọi
- Khả năng quan sát: span Langfuse mỗi bước truy xuất + tổng hợp

```figure
ce-hybrid-retrieval
```

## Build It

1. **Bộ duyệt thu nạp.** Duyệt lịch sử git trên mỗi hook push. Thu file thay đổi. Với mỗi file, phân tích bằng tree-sitter, trích nút hàm và lớp cùng toàn khoảng nguồn. Xuất bản ghi đoạn `{repo, path, start_line, end_line, symbol, body}`.

2. **Bộ tóm tắt đoạn.** Gom lô đoạn thành lệnh gọi Haiku 4.5 với lưu bộ nhớ đệm prompt trên phần mở đầu hệ thống. Prompt: "Tóm tắt hàm này trong một câu, nêu hợp đồng công khai và tác dụng phụ." Lưu tóm tắt cùng đoạn.

3. **Bể embedding.** Hai hàng đợi song song: dense (Voyage-code-3 lô 128) và tóm tắt (cùng mô hình nhưng trên chuỗi tóm tắt). Ghi vector vào Qdrant với payload `{repo, path, start_line, end_line, symbol, kind}`.

4. **Chỉ mục BM25.** Chỉ mục Tantivy trọng số trường: tên ký hiệu trọng số 4, thân ký hiệu trọng số 1, tóm tắt trọng số 2. Cho truy vấn "tìm hàm tên X" cùng "tìm hàm làm X".

5. **Đồ thị ký hiệu.** Với mỗi đoạn, ghi cạnh: import (file này dùng ký hiệu Y từ repo Z), gọi (hàm này gọi phương thức M trên lớp C), kế thừa. Lưu trong kuzu. Dùng lúc truy vấn để mở truy xuất qua ranh giới repo.

6. **Agent truy vấn.** LangGraph có ba nút. `retrieve` kích hoạt dense + BM25 song song, khử trùng theo (repo, path, symbol). `rerank` chạy cross-encoder trên top-50, giữ top-10. `synth` gọi Claude Sonnet 4.7 với đoạn xếp lại trong ngữ cảnh, lưu bộ nhớ đệm system prompt, yêu cầu trích dẫn file:line.

7. **Thực thi trích dẫn.** Phân tích đầu ra mô hình; mọi khẳng định không có neo `(repo/path:start-end)` bị đánh dấu để hỏi lại hoặc loại. Trả câu trả lời chỉ có trích dẫn cho người dùng.

8. **Tái lập chỉ mục tăng dần.** Mỗi webhook, tính diff cấp ký hiệu. Chỉ tạo embedding lại đoạn thay văn bản. Tính lại cạnh ký hiệu cho đoạn đổi import. Đo: push 50 file được tái lập chỉ mục dưới 60 giây cho tập repo 2M LOC.

9. **Đánh giá.** Gắn nhãn 100 câu hỏi xuyên repo bằng câu trả lời file:line chuẩn. Đo MRR@10, nDCG@10, tính trung thực trích dẫn (tỷ phần khẳng định có neo xác minh được) và độ trễ p50/p99.

## Use It

```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

## Ship It

Skill bàn giao `outputs/skill-codebase-rag.md`. Với corpus repo, dựng pipeline thu nạp, chỉ mục lai và agent truy vấn, trả câu trả lời có trích dẫn cho mọi câu hỏi xuyên repo. Tiêu chí chấm:

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Chất lượng truy xuất | MRR@10 và nDCG@10 trên tập giữ riêng 100 câu hỏi |
| 20 | Tính trung thực trích dẫn | Tỷ phần khẳng định câu trả lời có neo file:line xác minh được |
| 20 | Độ trễ và quy mô | Độ trễ truy vấn p95 ở 10k QPS trên kích thước corpus đã lập chỉ mục |
| 20 | Tính đúng lập chỉ mục tăng dần | Thời gian từ git push đến tìm kiếm được trên commit 50 file |
| 15 | UX và định dạng câu trả lời | Khả năng bấm trích dẫn, xem trước đoạn mã, khả năng hỏi tiếp |
| **100** | | |

## Exercises

1. Đổi Voyage-code-3 sang nomic-embed-code tự lưu trữ. Đo chênh lệch MRR@10. Báo cáo khoảng cách có khép khi bật xếp hạng lại không.

2. Đưa 20% mã được sinh (mã khuôn LLM tạo) vào corpus và đánh giá lại. Quan sát đầu độc truy xuất. Thêm cờ "generated" vào payload và giảm trọng số kết quả đó.

3. Đo chuẩn tìm kiếm lai Qdrant so với pgvector + pgvectorscale ở kích thước corpus của bạn. Báo cáo p99 ở kích thước lô 1.

4. Thêm kiểm tra độ trôi dựa trên lấy mẫu: hằng tuần, chạy lại đánh giá 100 câu hỏi. Cảnh báo khi MRR@10 giảm > 5%.

5. Mở rộng phân giải ký hiệu xuyên ngôn ngữ: hàm Python gọi dịch vụ Go qua gRPC. Dùng đồ thị ký hiệu liên kết chúng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| AST-aware chunking (Chia đoạn nhận biết AST) | "Chia cấp hàm" | Cắt mã tại ranh giới nút tree-sitter thay cửa sổ token cố định |
| Hybrid search (Tìm kiếm lai) | "Dense + sparse" | Chạy BM25 và tìm vector song song, hợp nhất top-k, xếp hạng lại |
| Cross-encoder rerank (Xếp hạng lại cross-encoder) | "Xếp hạng giai đoạn hai" | Mô hình chấm cùng cặp (truy vấn, ứng viên), chính xác hơn cosine |
| Prompt caching (Lưu bộ nhớ đệm prompt) | "System prompt lưu bộ nhớ đệm" | Tính năng Claude / OpenAI 2026 giảm giá token tiền tố lặp tới 90% |
| Symbol graph (Đồ thị ký hiệu) | "Đồ thị mã" | Cạnh import, gọi, kế thừa xuyên file và repo |
| Citation faithfulness (Tính trung thực trích dẫn) | "Tỷ lệ câu trả lời có căn cứ" | Tỷ phần khẳng định người dùng xác minh bằng bấm neo và đọc khoảng được tham chiếu |
| Incremental re-index (Tái lập chỉ mục tăng dần) | "Thời gian push-đến-tìm" | Thời gian thực từ git push đến truy vấn được ký hiệu thay đổi |

## Further Reading

- [Sourcegraph Amp](https://ampcode.com) — hiểu mã xuyên repo trong sản xuất
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) — phân tích sâu tham chiếu cho bài tổng kết
- [Aider repo-map](https://aider.chat/docs/repomap.html) — khung nhìn repo xếp hạng bằng tree-sitter
- [Augment Code enterprise graph](https://www.augmentcode.com) — RAG đồ thị ký hiệu thương mại
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) — triển khai tham chiếu
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) — chi tiết Voyage-code-3
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) — tham chiếu cross-encoder
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) — tham chiếu nền tảng nội bộ
