# Capstone 08 — Production RAG Chatbot for a Regulated Vertical

> Harvey, Glean, Mendable và LlamaCloud đều chạy cùng hình dạng sản xuất năm 2026. Thu nạp bằng docling hoặc Unstructured và ColPali cho thị giác. Tìm kiếm lai. Xếp lại bằng bge-reranker-v2-gemma. Tổng hợp bằng Claude Sonnet 4.7 với lưu bộ nhớ đệm prompt ở tỷ lệ trúng 60-80%. Bảo vệ bằng Llama Guard 4 và NeMo Guardrails. Quan sát bằng Langfuse và Phoenix. Chấm RAGAS trên tập chuẩn 200 câu hỏi. Xây trong miền chịu quy định (pháp lý, lâm sàng, bảo hiểm), và bài tổng kết là vượt tập chuẩn, red team và bảng điều khiển độ trôi.

**Type:** Capstone
**Languages:** Python (pipeline + API), TypeScript (chat UI)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 hours

## Problem

RAG miền chịu quy định (hợp đồng pháp lý, quy trình thử nghiệm lâm sàng, hợp đồng bảo hiểm) là hình dạng sản xuất được triển khai nhiều nhất 2026 vì ROI rõ và mức hệ trọng cụ thể. Harvey (Allen & Overy) xây cho pháp lý. Mendable cung cấp dạng tài liệu nhà phát triển. Glean bao phủ tìm doanh nghiệp. Mẫu là: thu nạp trung thực cao, truy xuất lai có xếp lại, tổng hợp bắt buộc trích dẫn và lưu bộ nhớ đệm prompt, bảo vệ nhiều lớp an toàn, giám sát độ trôi liên tục.

Phần khó không là mô hình. Đó là tuân thủ nhận biết khu vực tài phán (HIPAA, GDPR, SOC2), khả năng kiểm toán cấp trích dẫn, kiểm soát chi phí (lưu bộ nhớ đệm prompt giảm giá 60-90% khi tỷ lệ trúng cao), phát hiện ảo giác qua tính trung thực RAGAS và phát hiện độ trôi khi tài liệu nguồn cập nhật nhưng chỉ mục chưa theo kịp. Bài tổng kết yêu cầu triển khai tất cả trên tập chuẩn 200 câu hỏi với bộ red-team đi kèm.

## Concept

Pipeline có hai phía. **Thu nạp**: docling hoặc Unstructured phân tích tài liệu có cấu trúc; ColPali xử lý tài liệu giàu thị giác; đoạn có tóm tắt, thẻ và nhãn truy cập dựa vai trò. Vector vào pgvector + pgvectorscale (dưới 50M vector) hoặc Qdrant Cloud; BM25 sparse chạy kèm. **Hội thoại**: LangGraph xử lý bộ nhớ và nhiều lượt; mỗi truy vấn chạy truy xuất lai, xếp lại bằng bge-reranker-v2-gemma-2b, tổng hợp Claude Sonnet 4.7 (lưu bộ nhớ đệm prompt), đưa đầu ra qua Llama Guard 4 và NeMo Guardrails, xuất phản hồi có neo trích dẫn.

Ngăn xếp đánh giá bốn lớp. **Tập chuẩn** (200 Q/A có nhãn và trích dẫn) cho tính đúng. **Red team** (jailbreak, nỗ lực trích PII, câu ngoài miền) cho an toàn. **RAGAS** cho tính trung thực / liên quan câu trả lời / độ chính xác ngữ cảnh tự động mỗi lượt. **Bảng điều khiển độ trôi** (Arize Phoenix) theo dõi chất lượng truy xuất và điểm ảo giác hằng tuần.

Lưu bộ nhớ đệm prompt là đòn bẩy chi phí. Claude 4.5+ và GPT-5+ hỗ trợ lưu system prompt + ngữ cảnh truy xuất. Ở tỷ lệ trúng 60-80%, chi phí mỗi truy vấn giảm 3-5x. Pipeline phải thiết kế tiền tố ổn định (system prompt + ngữ cảnh xếp lại trước) để tỷ lệ trúng bộ nhớ đệm cao.

## Architecture

```
documents (contracts, protocols, policies)
      |
      v
docling / Unstructured parse + ColPali for visuals
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- filter by role + jurisdiction
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.7, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision (online)
  Langfuse annotation queue (sampled)
  Arize Phoenix drift (weekly)
  red team suite (pre-release)
```

## Stack

- Thu nạp: Unstructured.io hoặc docling cho tài liệu có cấu trúc; ColPali cho PDF giàu thị giác
- DB vector: pgvector + pgvectorscale dưới 50M vector; nếu không Qdrant Cloud
- Sparse: BM25 Tantivy có trọng số trường
- Điều phối: LlamaIndex Workflows (thu nạp) + LangGraph (hội thoại)
- Bộ xếp lại: bge-reranker-v2-gemma-2b tự lưu trữ hoặc Voyage rerank-2 được lưu trữ
- LLM: Claude Sonnet 4.7 với lưu bộ nhớ đệm prompt; dự phòng Llama 3.3 70B tự lưu trữ
- Đánh giá: RAGAS 0.2 trực tuyến, DeepEval cho bộ ảo giác và jailbreak
- Khả năng quan sát: Langfuse tự lưu trữ với hàng đợi chú giải; Arize Phoenix cho độ trôi
- Chốt bảo vệ: bộ phân loại đầu vào/đầu ra Llama Guard 4, chính sách NeMo Guardrails v0.12, làm sạch PII Presidio
- Tuân thủ: nhãn truy cập dựa vai trò trên đoạn; thẻ khu vực tài phán GDPR/HIPAA

```figure
canary-rollout
```

## Build It

1. **Thu nạp.** Phân tích corpus (1000-10000 tài liệu cho bản xây nghiêm túc) bằng Unstructured hoặc docling. Với trang quét / nặng thị giác, định tuyến qua ColPali. Tạo đoạn có tóm tắt, nhãn vai trò, thẻ khu vực tài phán.

2. **Chỉ mục.** Embedding dense (Voyage-3 hoặc Nomic-embed-v2) vào pgvector + pgvectorscale. Chỉ mục phụ BM25 qua Tantivy. Bộ lọc vai trò và khu vực tài phán làm payload.

3. **Truy xuất lai.** Lọc vai trò+khu vực tài phán trước; rồi dense + BM25 song song; hợp bằng reciprocal rank fusion; top-20 đến bộ xếp lại; top-5 đến tổng hợp.

4. **Tổng hợp với lưu bộ nhớ đệm prompt.** System prompt + chính sách tĩnh trong đầu bộ nhớ đệm; ngữ cảnh xếp lại là phần mở rộng bộ nhớ đệm; câu hỏi người dùng là hậu tố không lưu. Mục tiêu tỷ lệ trúng 60-80% ở trạng thái ổn định.

5. **Chốt bảo vệ.** Llama Guard 4 trên đầu vào; rail NeMo Guardrails chặn câu ngoài miền hoặc chủ đề chính sách cấm; Presidio làm sạch PII vô tình ở đầu ra; hậu lọc bắt buộc trích dẫn.

6. **Tập chuẩn.** 200 cặp Q/A do chuyên gia miền gắn nhãn với (câu trả lời, trích dẫn). Chấm agent theo khớp trích dẫn chính xác, tính đúng câu trả lời, tính trung thực (RAGAS).

7. **Red team.** 50 prompt đối kháng: jailbreak (PAIR, TAP), nỗ lực đưa PII ra ngoài, ngoài miền, rò rỉ xuyên khu vực tài phán. Chấm đạt/không đạt và mức nghiêm trọng.

8. **Bảng điều khiển độ trôi.** Arize Phoenix theo dõi chất lượng truy xuất (nDCG, tính trung thực trích dẫn) hằng tuần. Cảnh báo giảm 5%.

9. **Báo cáo chi phí.** Langfuse: tỷ lệ trúng lưu bộ nhớ đệm prompt, token mỗi truy vấn, phân tách $/truy vấn theo giai đoạn.

## Use It

```
$ chat --role=analyst --jurisdiction=GDPR
> what is the data-retention obligation for EU user profiles under our contract?
[retrieve]  hybrid top-20 filtered to GDPR + analyst-role
[rerank]    top-5 kept
[synth]     claude-sonnet-4.7, cache hit 74%, 0.8s
answer:
  The contract (Section 12.4, Master Services Agreement dated 2024-03-11)
  obligates EU user profile deletion within 30 days of termination per GDPR
  Article 17. The DPA amendment (DPA-v2.1, Section 5) extends this to 14 days
  for "restricted" category data.
  citations: [MSA-2024-03-11 s12.4, DPA-v2.1 s5]
```

## Ship It

`outputs/skill-production-rag.md` mô tả sản phẩm bàn giao. Chatbot miền chịu quy định triển khai có nhãn tuân thủ, qua tiêu chí chấm, được quan sát bằng giám sát độ trôi trực tiếp.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Tính trung thực RAGAS + liên quan câu trả lời | Điểm trực tuyến trên tập chuẩn (200 Q/A) |
| 20 | Tính đúng trích dẫn | Tỷ phần câu trả lời có neo nguồn xác minh được |
| 20 | Bao phủ chốt bảo vệ | Tỷ lệ vượt Llama Guard 4 + kết quả bộ jailbreak |
| 20 | Kỹ thuật chi phí / độ trễ | Tỷ lệ trúng bộ nhớ đệm prompt, độ trễ p95, $/truy vấn |
| 15 | Bảng điều khiển giám sát độ trôi | Bảng Phoenix trực tiếp có xu hướng chất lượng truy xuất hằng tuần |
| **100** | | |

## Exercises

1. Xây lát corpus thứ hai thuộc khu vực tài phán khác (ví dụ: HIPAA cùng GDPR). Chứng minh lọc vai trò+khu vực ngăn rò rỉ chéo trên thăm dò xuyên khu vực 20 câu hỏi.

2. Đo tỷ lệ trúng bộ nhớ đệm prompt qua một tuần lưu lượng sản xuất. Xác định truy vấn phá tiền tố bộ nhớ đệm. Tái cấu trúc.

3. Thêm bộ nhớ nhiều lượt với bộ đệm tóm tắt 10k token. Đo tính trung thực có giảm khi hội thoại tăng không.

4. Đổi Claude Sonnet 4.7 sang Llama 3.3 70B tự lưu trữ. Đo $/truy vấn và chênh lệch tính trung thực.

5. Thêm chế độ "không chắc": nếu điểm xếp lại hàng đầu dưới ngưỡng, agent nói "Tôi không có trích dẫn đủ tin cậy" thay trả lời. Đo giảm tự tin sai.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Prompt caching (Lưu bộ nhớ đệm prompt) | "Hệ thống + ngữ cảnh lưu bộ nhớ đệm" | Tính năng Claude/OpenAI: token tiền tố lưu được giảm giá 60-90% khi trúng |
| RAGAS | "Bộ đánh giá RAG" | Chấm tự động tính trung thực, liên quan câu trả lời, độ chính xác ngữ cảnh |
| Golden set (Tập chuẩn) | "Đánh giá có nhãn" | 200+ Q/A chuyên gia gắn nhãn có trích dẫn; sự thật nền |
| Jurisdiction tag (Thẻ khu vực tài phán) | "Nhãn tuân thủ" | Phạm vi GDPR/HIPAA/SOC2 gắn đoạn; thực thi bằng lọc truy xuất |
| Citation faithfulness (Tính trung thực trích dẫn) | "Tỷ lệ câu trả lời có căn cứ" | Tỷ phần khẳng định được khoảng nguồn truy xuất được hỗ trợ |
| Drift (Độ trôi) | "Suy giảm chất lượng truy xuất" | Thay đổi hằng tuần nDCG hoặc điểm trích dẫn; ngưỡng cảnh báo 5% |
| Red team | "Đánh giá đối kháng" | Thăm dò jailbreak, trích PII, ngoài miền trước phát hành |

## Further Reading

- [Harvey AI](https://www.harvey.ai) — ngăn xếp sản xuất pháp lý tham chiếu
- [Glean enterprise search](https://www.glean.com) — RAG quy mô doanh nghiệp tham chiếu
- [Mendable documentation](https://mendable.ai) — RAG tài liệu nhà phát triển tham chiếu
- [LlamaCloud Parse + Index](https://docs.cloud.llamaindex.ai/llamaparse/getting_started) — thu nạp được quản lý
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — tham chiếu đòn bẩy chi phí
- [RAGAS 0.2 documentation](https://docs.ragas.io/) — framework đánh giá RAG kinh điển
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — khả năng quan sát độ trôi tham chiếu
- [Llama Guard 4](https://www.llama.com/docs/model-cards-and-prompt-formats/llama-guard-4/) — bộ phân loại an toàn 2026
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — framework rail chính sách
