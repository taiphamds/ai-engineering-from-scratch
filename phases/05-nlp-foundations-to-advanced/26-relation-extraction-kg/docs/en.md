# Relation Extraction & Knowledge Graph Construction

> NER tìm thấy các thực thể. Liên kết thực thể neo chúng lại. Trích xuất quan hệ tìm các cạnh giữa chúng. Một đồ thị tri thức là tổng của các nút, các cạnh và nguồn gốc của chúng.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 minutes

## The Problem

Một nhà phân tích đọc: "Tim Cook trở thành CEO của Apple năm 2011." Bốn sự kiện:

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Trích xuất Quan hệ (RE) biến văn bản tự do thành các bộ ba có cấu trúc `(subject, relation, object)`. Tổng hợp trên một ngữ liệu và bạn có một đồ thị tri thức. Tổng hợp rồi truy vấn và bạn có một nền tảng suy luận cho RAG, phân tích hoặc kiểm toán tuân thủ.

Vấn đề năm 2026: LLM trích xuất các quan hệ một cách nhiệt tình. Quá nhiệt tình. Chúng ảo giác các bộ ba mà văn bản nguồn không hỗ trợ. Không có nguồn gốc, bạn không thể phân biệt các bộ ba thực với hư cấu hợp lý. Câu trả lời năm 2026 là các pipeline neo-và-xác minh kiểu AEVS.

## The Concept

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Dạng bộ ba.** `(subject_entity, relation_type, object_entity)`. Các quan hệ đến từ một ontology đóng (các thuộc tính Wikidata, FIBO, UMLS) hoặc một tập mở (kiểu OpenIE, gì cũng được).

**Ba cách tiếp cận trích xuất.**

1. **Dựa trên quy tắc / mẫu.** Các mẫu Hearst: "X chẳng hạn như Y" → `(Y, isA, X)`. Cộng regex thiết kế thủ công. Mong manh, chính xác, có thể giải thích.
2. **Bộ phân loại có giám sát.** Với hai lần nhắc thực thể trong một câu, dự đoán quan hệ từ một tập cố định. Được huấn luyện trên TACRED, ACE, KBP. Tiêu chuẩn 2015–2022.
3. **LLM sinh.** Prompt mô hình đưa ra các bộ ba. Hoạt động ngay khi dùng. Cần nguồn gốc, nếu không sẽ ảo giác rác có vẻ hợp lý.

**AEVS (Anchor-Extraction-Verification-Supplement, 2026).** Framework giảm thiểu ảo giác hiện tại:

- **Neo.** Xác định mọi span thực thể và span cụm từ quan hệ với các vị trí chính xác.
- **Trích xuất.** Sinh các bộ ba được liên kết với các span neo.
- **Xác minh.** Khớp mỗi phần tử bộ ba trở lại văn bản nguồn; từ chối bất kỳ thứ gì không được hỗ trợ.
- **Bổ sung.** Một lượt kiểm tra độ bao phủ bảo đảm không span được neo nào bị bỏ.

Ảo giác giảm mạnh. Đòi hỏi nhiều tính toán hơn nhưng có thể kiểm toán.

**Đánh đổi mở-so-với-đóng.**

- **Ontology đóng.** Danh sách thuộc tính cố định (ví dụ, 11,000+ thuộc tính của Wikidata). Dự đoán được. Truy vấn được. Khó bịa ra.
- **IE mở.** Bất kỳ cụm động từ nào cũng trở thành một quan hệ. Recall cao. Precision thấp. Lộn xộn để truy vấn.

Các KG production thường trộn: IE mở để khám phá, rồi chuẩn hóa các quan hệ lên một ontology đóng trước khi gộp vào đồ thị chính.

```figure
relation-triples
```

## Build It

### Step 1: pattern-based extraction

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

Xem `code/main.py` để có bộ trích xuất đồ chơi đầy đủ. Các mẫu Hearst vẫn được phát hành trong các pipeline riêng lĩnh vực vì chúng có thể gỡ lỗi.

### Step 2: supervised relation classification

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL là một bộ trích xuất quan hệ seq2seq: văn bản vào, các bộ ba ra, đã ở dạng các id thuộc tính Wikidata. Được fine-tune trên dữ liệu giám sát từ xa. Baseline trọng số mở tiêu chuẩn.

### Step 3: LLM-prompted extraction with anchoring

```python
prompt = f"""Extract (subject, relation, object) triples from the text.
For each triple, include the exact character span in the source text.

Text: {text}

Output JSON:
[{{"subject": {{"text": "...", "span": [start, end]}},
   "relation": "...",
   "object": {{"text": "...", "span": [start, end]}}}}, ...]

Only include triples fully supported by the text. No inference beyond what is stated.
"""
```

Xác minh mọi span được trả theo nguồn. Từ chối bất kỳ thứ gì mà `text[start:end] != triple_entity`. Đây là bước "xác minh" của AEVS ở dạng tối thiểu.

### Step 4: canonicalize onto a closed ontology

```python
RELATION_MAP = {
    "is the CEO of": "P169",       # "chief executive officer"
    "was born in":   "P19",         # "place of birth"
    "founded":        "P112",       # "founded by" (inverted subject/object)
    "works at":       "P108",       # "employer"
}


def canonicalize(relation):
    rel_low = relation.lower().strip()
    if rel_low in RELATION_MAP:
        return RELATION_MAP[rel_low]
    return None   # drop unmapped open relations or route to manual review
```

Chuẩn hóa thường là 60-80% công việc kỹ thuật. Dành ngân sách cho nó.

### Step 5: build a small graph and query

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

Đây là nguyên tử của mọi hệ thống RAG-trên-KG. Mở rộng nó bằng các kho bộ ba RDF (Blazegraph, Virtuoso), các đồ thị thuộc tính (Neo4j) hoặc các kho đồ thị được tăng cường vector.

## Pitfalls

- **Đồng tham chiếu trước RE.** "Anh ấy thành lập Apple" — RE cần biết "anh ấy" là ai. Chạy coref trước (bài 24).
- **Chuẩn hóa thực thể.** "Apple Inc" và "Apple" phải phân giải về cùng nút. Liên kết thực thể trước (bài 25).
- **Các bộ ba bị ảo giác.** LLM đưa ra các bộ ba mà văn bản không hỗ trợ. Buộc xác minh span.
- **Độ trôi chuẩn hóa quan hệ.** Các quan hệ IE mở không nhất quán ("sinh ra ở", "đến từ", "là người bản xứ của"). Thu gọn về các id chuẩn nếu không đồ thị không truy vấn được.
- **Các lỗi thời gian.** "Tim Cook là CEO của Apple" — đúng hiện tại, sai năm 2005. Nhiều quan hệ bị giới hạn thời gian. Dùng các định ngữ (`P580` thời gian bắt đầu, `P582` thời gian kết thúc trong Wikidata).
- **Không khớp lĩnh vực.** REBEL được huấn luyện trên Wikipedia. Văn bản pháp lý, y tế và khoa học thường cần các mô hình RE được fine-tune theo lĩnh vực.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Production nhanh, lĩnh vực tổng quát | REBEL hoặc LlamaPred với chuẩn hóa Wikidata |
| Riêng lĩnh vực (y sinh, pháp lý) | Fine-tune lĩnh vực kiểu SciREX + ontology tùy chỉnh |
| Được prompt bằng LLM, đầu ra được kiểm toán | Pipeline AEVS: neo → trích xuất → xác minh → bổ sung |
| IE tin tức khối lượng lớn | Lai dựa trên mẫu + có giám sát |
| Xây dựng một KG từ đầu | IE mở + lượt chuẩn hóa thủ công |
| KG thời gian | Trích xuất với các định ngữ (thời gian bắt đầu/kết thúc, thời điểm) |

Mẫu tích hợp: NER → coref → liên kết thực thể → trích xuất quan hệ → ánh xạ ontology → nạp đồ thị. Mỗi giai đoạn là một cổng chất lượng tiềm năng.

## Ship It

Lưu thành `outputs/skill-re-designer.md`:

```markdown
---
name: re-designer
description: Design a relation extraction pipeline with provenance and canonicalization.
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

Given a corpus (domain, language, volume) and downstream use (KG-RAG, analytics, compliance), output:

1. Extractor. Pattern-based / supervised / LLM / AEVS hybrid. Reason tied to precision vs recall target.
2. Ontology. Closed property list (Wikidata / domain) or open IE with canonicalization pass.
3. Provenance. Every triple carries source char-span + doc id. Non-negotiable for audit.
4. Merge strategy. Canonical entity id + relation id + temporal qualifiers; dedup policy.
5. Evaluation. Precision / recall on 200 hand-labelled triples + hallucination-rate on LLM-extracted sample.

Refuse any LLM-based RE pipeline without span verification (source provenance). Refuse open-IE output flowing into a production graph without canonicalization. Flag pipelines with no temporal qualifier on time-bounded relations (employer, spouse, position).
```

## Exercises

1. **Dễ.** Chạy bộ trích xuất mẫu trong `code/main.py` trên 5 câu bài báo tin tức. Kiểm tra precision bằng tay.
2. **Trung bình.** Dùng REBEL (hoặc một LLM nhỏ) trên cùng các câu. So sánh các bộ ba. Bộ trích xuất nào có precision cao hơn? Recall cao hơn?
3. **Khó.** Xây dựng pipeline AEVS: trích xuất bằng LLM + xác minh các span theo nguồn. Đo tỷ lệ ảo giác trước so với sau bước xác minh trên 50 câu kiểu Wikipedia.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Triple (Bộ ba) | Chủ thể-quan hệ-đối tượng | Tuple `(s, r, o)` là đơn vị nguyên tử của một KG. |
| Open IE (IE mở) | Trích xuất bất kỳ thứ gì | Các cụm từ quan hệ từ vựng mở; recall cao, precision thấp. |
| Closed ontology (Ontology đóng) | Schema cố định | Tập bị chặn các loại quan hệ (Wikidata, UMLS, FIBO). |
| Canonicalization (Chuẩn hóa về dạng chuẩn) | Chuẩn hóa mọi thứ | Ánh xạ các tên / quan hệ bề mặt sang các id chuẩn. |
| AEVS | Trích xuất có căn cứ | Pipeline Anchor-Extraction-Verification-Supplement (2026). |
| Provenance (Nguồn gốc) | Liên kết nguồn sự thật | Mỗi bộ ba mang một id tài liệu + span ký tự đến nguồn của nó. |
| Distant supervision (Giám sát từ xa) | Các nhãn rẻ | Căn chỉnh văn bản với một KG hiện có để tạo dữ liệu huấn luyện. |

## Further Reading

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) — bài báo giám sát từ xa.
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) — thành phần chủ lực RE seq2seq.
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) — IE kết hợp.
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) — thiết kế giảm thiểu ảo giác năm 2026.
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) — các truy vấn đồ thị chuẩn.
