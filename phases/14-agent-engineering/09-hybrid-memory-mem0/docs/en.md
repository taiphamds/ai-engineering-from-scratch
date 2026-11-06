# Hybrid Memory: Vector + Graph + KV

> Bộ nhớ lai chạy ba kho song song — vector cho độ tương tự ngữ nghĩa, KV cho tra cứu sự thật nhanh, đồ thị cho suy luận thực thể-quan hệ — với một lớp chấm điểm hợp nhất chúng khi truy xuất. Đây là một mẫu sản xuất được sử dụng rộng rãi cho bộ nhớ bên ngoài; Mem0 (Chhikara và cộng sự, 2025) là một triển khai tham chiếu.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích vì sao một kho duy nhất (chỉ vector, chỉ đồ thị, chỉ KV) là không đủ cho bộ nhớ agent.
- Nêu tên ba kho song song của Mem0 và điều mỗi kho tối ưu hóa.
- Mô tả chấm điểm hợp nhất của Mem0 — tính liên quan, tầm quan trọng, tính gần đây — và vì sao nó là một tổng có trọng số, không phải một hệ phân cấp.
- Triển khai một bộ nhớ ba kho mô phỏng bằng thư viện chuẩn với một `add()` ghi vào cả ba và một `search()` hợp nhất các kết quả.

## The Problem

Mỗi kho chỉ phù hợp với một trong ba lớp truy vấn:

- **Độ tương tự ngữ nghĩa** — "chúng ta đã thảo luận gì về sự trôi dạt agent tuần trước?" Vector thắng; KV và đồ thị bỏ lỡ.
- **Tra cứu sự thật** — "số điện thoại của người dùng là gì?" KV thắng; vector lãng phí, đồ thị quá mức cần thiết.
- **Suy luận quan hệ** — "những khách hàng nào dùng chung thực thể thanh toán?" Đồ thị thắng; vector và KV không thể trả lời.

Các agent sản xuất phát ra cả ba trong một phiên. Một bộ nhớ một kho luôn sai cho hai trong số chúng. Đóng góp của Mem0 là nối cả ba phía sau một bề mặt `add`/`search` duy nhất với một hàm chấm điểm hợp nhất chúng.

## The Concept

### Three stores in parallel

Mem0 (arXiv:2504.19413, tháng 4 năm 2025) trên `add(text, user_id, metadata)`:

1. Trích xuất các sự thật ứng viên từ văn bản (một bước do LLM điều khiển).
2. Ghi mỗi sự thật vào kho vector (embedding) cho tìm kiếm ngữ nghĩa.
3. Ghi mỗi sự thật vào kho KV được đánh khóa theo (user_id, fact_type, entity) cho tra cứu $O(1)$.
4. Ghi mỗi sự thật vào kho đồ thị (Mem0g) dưới dạng các cạnh có kiểu cho các truy vấn quan hệ.

Trên `search(query, user_id)`:

1. Kho vector trả về top-k theo cosine embedding.
2. Kho KV trả về các kết quả trúng trực tiếp được đánh khóa theo (user_id, type, entity) suy ra từ truy vấn.
3. Kho đồ thị trả về đồ thị con có thể đi tới từ các thực thể truy vấn.
4. Một lớp chấm điểm hợp nhất cả ba.

### Fusion scoring

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **Tính liên quan** — cosine vector, khớp chính xác KV, trọng số đường đi đồ thị.
- **Tầm quan trọng** — được gắn thẻ tại thời điểm ghi hoặc được học (một số sự thật quan trọng hơn: tên, ID, chính sách).
- **Tính gần đây** — suy giảm theo hàm mũ theo thời gian kể từ lần ghi hoặc đọc cuối.

Các trọng số được điều chỉnh theo sản phẩm. `w_recency` cao hơn cho các agent trò chuyện; `w_importance` cao hơn cho các agent tuân thủ; `w_relevance` cao hơn cho các agent truy xuất.

### Mem0g and temporal reasoning

Mem0g thêm một bộ phát hiện xung đột. Khi một sự thật mới mâu thuẫn với một cạnh hiện có, cạnh hiện có được đánh dấu không hợp lệ nhưng không bị xóa. Các truy vấn thời gian ("thành phố của người dùng vào tháng Ba là gì?") duyệt đồ thị con hợp lệ tại thời điểm đó.

Đây là hành vi cấp tuân thủ mà mẫu vô hiệu hóa của Letta khái quát hóa.

### Benchmark numbers

Bài báo Mem0 báo cáo (2025):

- **LoCoMo** (bộ nhớ hội thoại dạng dài): 91.6
- **LongMemEval** (bộ nhớ tình tiết tầm dài): 93.4
- **BEAM 1M** (benchmark bộ nhớ 1M token): 64.1

Các đường cơ sở so sánh (LLM toàn bộ ngữ cảnh 128k, kho vector phẳng, KV phẳng) đều thua 10+ điểm. Chỉ các benchmark không biện minh cho lựa chọn — hình thái vận hành làm điều đó — nhưng các con số cho thấy thiết kế hợp nhất không phải một sai số làm tròn.

### Scope taxonomy

Mem0 phân tách bộ nhớ theo phạm vi:

- **Bộ nhớ người dùng** — lưu giữ xuyên các phiên, được đánh khóa theo `user_id`.
- **Bộ nhớ phiên** — lưu giữ trong một luồng.
- **Bộ nhớ agent** — trạng thái của từng thể hiện agent.

Mọi lần ghi chọn một phạm vi. Truy xuất có thể truy vấn xuyên các phạm vi với các trọng số cho từng phạm vi. Trộn các phạm vi mà không suy nghĩ là cách bạn có các sự cố "trợ lý đã kể cho Alice về dự án của Bob".

### Where this pattern goes wrong

- **Trôi dạt embedding.** Các kết quả vector trông đúng trên một trăm truy vấn đầu suy giảm khi kho ngữ liệu tăng lên. Thêm việc tạo lại embedding định kỳ cho các bản ghi được dùng nhiều nhất top-N.
- **Schema KV mở rộng dần.** `(user_id, type, entity)` trông đơn giản cho đến khi mỗi nhóm thêm `type` riêng. Kiểm toán tập kiểu hàng quý.
- **Bùng nổ đồ thị.** Một bộ trích xuất nhiễu thêm 50 cạnh cho mỗi thông điệp. Giới hạn các lần ghi đồ thị cho mỗi lời gọi `add`; loại bỏ các cạnh độ tin cậy thấp.

```figure
ae-memory-fusion
```

## Build It

`code/main.py` triển khai mẫu ba kho bằng thư viện chuẩn:

- `VectorStore` — độ tương tự chồng lấp token đơn giản làm đại diện cho embedding.
- `KVStore` — dict được đánh khóa theo `(user_id, fact_type, entity)`.
- `GraphStore` — các cạnh có kiểu (subject, relation, object, valid).
- `Mem0` — facade cấp cao với `add()`, `search()`, chấm điểm hợp nhất và truy xuất có nhận biết phạm vi.
- Một trace được giải đầy đủ trên một hội thoại nhiều người dùng, nhiều phiên.

Chạy nó:

```
python3 code/main.py
```

Đầu ra cho thấy ba đường hồi tưởng riêng cộng top-k đã hợp nhất. Đổi các trọng số chấm điểm ở đầu `main()` và xem xếp hạng thay đổi.

## Use It

- **Mem0 (Apache 2.0)** — sẵn sàng cho sản xuất. Tự host với Postgres + Qdrant + Neo4j, hoặc sử dụng đám mây được quản lý.
- **Letta** — ba tầng cốt lõi/hồi tưởng/lưu trữ; mang các backend vector và đồ thị của riêng bạn.
- **Zep** — lựa chọn thương mại với KG thời gian và trích xuất sự thật.
- **Các bản dựng tùy chỉnh** — khi bạn cần kiểm soát chính xác bộ trích xuất (tuân thủ) hoặc các trọng số hợp nhất (các agent giọng nói nơi tính gần đây chiếm ưu thế).

## Ship It

`outputs/skill-hybrid-memory.md` tạo một khung bộ nhớ ba kho với một bộ chấm điểm hợp nhất, hệ phân loại phạm vi và vô hiệu hóa theo thời gian được nối sẵn.

## Exercises

1. Thay độ tương tự vector mô phỏng bằng một mô hình embedding thực (sentence-transformers, Ollama, OpenAI embeddings). Đo recall@10 trên một hội thoại dài tổng hợp. Xếp hạng có trôi dạt qua 1000 lần ghi không?
2. Thêm một truy vấn thời gian: `search(query, as_of=timestamp)`. Chỉ trả về các bản ghi hợp lệ tại hoặc trước thời điểm đó. Kho nào cần nhiều công việc nhất?
3. Triển khai một bộ phát hiện xung đột: nếu một sự thật đi vào mâu thuẫn với một cạnh đồ thị, vô hiệu hóa cạnh cũ và ghi log cả hai. Kiểm thử trên "người dùng sống ở Berlin" -> "người dùng sống ở Lisbon."
4. Chuyển bộ chấm điểm hợp nhất sang bao gồm một chiều `user_feedback` (thích trên các bản ghi được truy xuất). Bạn ngăn lách hệ thống như thế nào (agent chỉ trả về các bản ghi nó đã thích)?
5. Đọc tài liệu Mem0 (`docs.mem0.ai`). Chuyển bản mô phỏng sang các lời gọi client `mem0`. So sánh chất lượng truy xuất trên cùng 20 truy vấn kiểm thử.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Hybrid memory (Bộ nhớ lai) | "Vector cộng đồ thị cộng KV" | Ba kho được ghi song song, hợp nhất khi truy xuất |
| Fact extraction (Trích xuất sự thật) | "Nạp bộ nhớ" | Bước LLM chia văn bản thành các bộ (thực thể, quan hệ, sự thật) |
| Fusion scoring (Chấm điểm hợp nhất) | "Xếp hạng tính liên quan" | Tổng có trọng số của tính liên quan, tầm quan trọng, tính gần đây |
| Scope (Phạm vi) | "Không gian tên bộ nhớ" | người dùng / phiên / agent — quyết định ai nhìn thấy gì |
| Mem0g | "Đồ thị bộ nhớ" | Các cạnh có kiểu với hiệu lực thời gian cho các truy vấn quan hệ |
| Temporal invalidation (Vô hiệu hóa theo thời gian) | "Xóa mềm" | Đánh dấu các cạnh bị mâu thuẫn là không hợp lệ; không bao giờ xóa |
| Embedding drift (Trôi dạt embedding) | "Truy xuất mục nát" | Chất lượng vector suy giảm khi kho ngữ liệu tăng; tạo lại embedding định kỳ |

## Further Reading

- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) — bài báo gốc
- [Mem0 docs](https://docs.mem0.ai/platform/overview) — API sản xuất, các SDK, đám mây được quản lý
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — tiền thân ngữ cảnh ảo
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — thiết kế ba tầng cùng họ
