# Entity Linking & Disambiguation

> NER tìm thấy "Paris." Liên kết thực thể quyết định: Paris, Pháp? Paris Hilton? Paris, Texas? Paris (hoàng tử thành Troia)? Không liên kết, đồ thị tri thức của bạn vẫn mơ hồ.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 minutes

## The Problem

Một câu viết: "Jordan đánh bại báo chí." NER của bạn gán nhãn "Jordan" là PERSON. Tốt. Nhưng Jordan *nào*?

- Michael Jordan (bóng rổ)?
- Michael B. Jordan (diễn viên)?
- Michael I. Jordan (giáo sư ML Berkeley — đúng, sự nhầm lẫn này là có thật trong các bài báo ML)?
- Jordan (quốc gia)?
- Jordan (tên riêng tiếng Hebrew)?

Liên kết thực thể (EL) phân giải mỗi lần nhắc về một mục duy nhất trong một cơ sở tri thức: Wikidata, Wikipedia, DBpedia hoặc KB lĩnh vực của bạn. Hai tác vụ con:

1. **Sinh ứng viên.** Với "Jordan", những mục KB nào hợp lý?
2. **Phân giải nhập nhằng.** Với ngữ cảnh, ứng viên nào là đúng?

Cả hai bước đều có thể học. Cả hai đều được benchmark. Pipeline kết hợp đã ổn định suốt một thập kỷ — thứ thay đổi là chất lượng của bộ phân giải nhập nhằng.

## The Concept

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Sinh ứng viên.** Với dạng bề mặt lần nhắc ("Jordan"), tra cứu các ứng viên trong một chỉ mục bí danh. Các từ điển bí danh Wikipedia bao phủ hầu hết các thực thể có tên: "JFK" → John F. Kennedy, Jacqueline Kennedy, sân bay JFK, JFK (phim). Chỉ mục điển hình trả 10-30 ứng viên cho mỗi lần nhắc.

**Phân giải nhập nhằng: ba cách tiếp cận.**

1. **Tiên nghiệm + ngữ cảnh (Milne & Witten, 2008).** `P(entity | mention) × context-similarity(entity, text)`. Hoạt động tốt, nhanh, không huấn luyện.
2. **Dựa trên embedding (ESS / REL / Blink).** Mã hóa lần nhắc + ngữ cảnh. Mã hóa mô tả mỗi ứng viên. Chọn cosine lớn nhất. Mặc định 2020-2024.
3. **Sinh (GENRE, 2021; dựa trên LLM, 2023+).** Giải mã tên chuẩn của thực thể từng token. Bị ràng buộc vào một trie các tên thực thể hợp lệ để đầu ra được bảo đảm là một id KB hợp lệ.

**Đầu cuối so với pipeline.** Các mô hình hiện đại (ELQ, BLINK, ExtEnD, GENRE) chạy NER + sinh ứng viên + phân giải nhập nhằng trong một lượt. Các hệ thống pipeline vẫn thống trị production vì bạn có thể hoán đổi các thành phần.

### The two measurements

- **Recall lần nhắc (sinh ứng viên).** Tỷ lệ các lần nhắc chuẩn mà mục KB đúng xuất hiện trong danh sách ứng viên. Mức sàn cho toàn bộ pipeline.
- **Accuracy / F1 phân giải nhập nhằng.** Với các ứng viên đúng, top-1 đúng bao nhiêu lần.

Luôn báo cáo cả hai. Một hệ thống có phân giải nhập nhằng 99% trên recall ứng viên 80% là một pipeline 80%.

```figure
gx-entity-linking
```

## Build It

### Step 1: build an alias index from Wikipedia redirects

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Dữ liệu bí danh Wikipedia: ~18M cặp (bí danh, thực thể). Tải từ các bản dump Wikidata. Lưu dưới dạng chỉ mục đảo.

### Step 2: context-based disambiguation

```python
def disambiguate(mention, context, alias_index, entity_desc):
    candidates = alias_index.get(mention.lower(), [])
    if not candidates:
        return None, 0.0
    context_words = set(tokenize(context))
    best, best_score = None, -1
    for entity_id in candidates:
        desc_words = set(tokenize(entity_desc[entity_id]))
        union = len(context_words | desc_words)
        score = len(context_words & desc_words) / union if union else 0.0
        if score > best_score:
            best, best_score = entity_id, score
    return best, best_score
```

Phần giao Jaccard là một ví dụ đồ chơi. Thay bằng cosine similarity trên các embedding (xem bước 2 trong `code/main.py` cho phiên bản transformer).

### Step 3: embedding-based (BLINK-style)

```python
from sentence_transformers import SentenceTransformer
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_mention(text, mention_span):
    start, end = mention_span
    marked = f"{text[:start]} [MENTION] {text[start:end]} [/MENTION] {text[end:]}"
    return encoder.encode([marked], normalize_embeddings=True)[0]

def embed_entity(entity_id, description):
    return encoder.encode([f"{entity_id}: {description}"], normalize_embeddings=True)[0]
```

Khi lập chỉ mục, embedding mỗi thực thể KB một lần. Khi truy vấn, embedding lần nhắc + ngữ cảnh một lần, tính tích vô hướng với tập ứng viên, chọn lớn nhất.

### Step 4: generative entity linking (concept)

GENRE giải mã tiêu đề Wikipedia của thực thể từng ký tự. Giải mã có ràng buộc (xem bài 20) bảo đảm chỉ các tiêu đề hợp lệ có thể được xuất. Tích hợp chặt với một trie dựa trên KB. Hậu duệ hiện đại là REL-GEN và EL được prompt bằng LLM với đầu ra có cấu trúc.

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

Kết hợp với một danh sách cho phép (`choice` của Outlines), đây là pipeline EL đơn giản nhất để phát hành năm 2026.

### Step 5: evaluate on AIDA-CoNLL

AIDA-CoNLL là benchmark EL tiêu chuẩn: 1,393 bài báo Reuters, 34k lần nhắc, các thực thể Wikipedia. Báo cáo accuracy trong KB (`P@1`) và tỷ lệ phát hiện NIL ngoài KB.

## Pitfalls

- **Xử lý NIL.** Một số lần nhắc không nằm trong KB (các thực thể mới nổi, những người ít được biết). Các hệ thống phải dự đoán NIL thay vì đoán sai thực thể. Được đo riêng.
- **Lỗi ranh giới lần nhắc.** NER phía trước bỏ sót các span bộ phận ("Bank of America" được gán nhãn chỉ là "Bank"). Recall EL giảm.
- **Thiên lệch độ phổ biến.** Các hệ thống được huấn luyện dự đoán quá nhiều các thực thể thường gặp. Một lần nhắc "Michael I. Jordan" trong một bài báo ML thường liên kết đến Jordan bóng rổ.
- **EL xuyên ngôn ngữ.** Ánh xạ các lần nhắc trong văn bản tiếng Trung sang các thực thể Wikipedia tiếng Anh. Yêu cầu một encoder đa ngôn ngữ hoặc một bước dịch.
- **KB cũ.** Các công ty, sự kiện, con người mới không nằm trong bản dump Wikipedia năm trước. Các pipeline production cần một vòng lặp làm mới.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Tiếng Anh đa dụng + Wikipedia | BLINK hoặc REL |
| Xuyên ngôn ngữ, KB = Wikipedia | mGENRE |
| Thân thiện LLM, ít lần nhắc/ngày | Prompt Claude/GPT-4 với danh sách ứng viên + JSON có ràng buộc |
| KB riêng lĩnh vực (y tế, pháp lý) | BERT tùy chỉnh với truy xuất nhận biết KB + fine-tune trên tập kiểu AIDA lĩnh vực |
| Độ trễ cực thấp | Chỉ tiên nghiệm khớp chính xác (baseline Milne-Witten) |
| SOTA nghiên cứu | GENRE / ExtEnD / LLM-EL sinh |

Mẫu production được phát hành năm 2026: NER → coref → EL trên mỗi lần nhắc → thu gọn các cụm thành một thực thể chuẩn mỗi cụm. Đầu ra: một id KB cho mỗi thực thể trong tài liệu, không phải một cho mỗi lần nhắc.

## Ship It

Lưu thành `outputs/skill-entity-linker.md`:

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```

## Exercises

1. **Dễ.** Triển khai bộ phân giải nhập nhằng tiên nghiệm+ngữ cảnh trong `code/main.py` trên 10 lần nhắc mơ hồ (Paris, Jordan, Apple). Gán nhãn thực thể đúng bằng tay. Đo accuracy.
2. **Trung bình.** Mã hóa 50 lần nhắc mơ hồ bằng một sentence transformer. Embedding mô tả của mỗi ứng viên. So sánh phân giải nhập nhằng dựa trên embedding với phần giao ngữ cảnh Jaccard.
3. **Khó.** Xây dựng một KB lĩnh vực 1k thực thể (ví dụ nhân viên + sản phẩm trong công ty bạn). Triển khai NER + EL đầu cuối. Đo precision và recall trên 100 câu được giữ lại.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Entity linking (EL) (Liên kết thực thể) | Liên kết đến Wikipedia | Ánh xạ một lần nhắc sang một mục KB duy nhất. |
| Candidate generation (Sinh ứng viên) | Đó có thể là ai? | Trả một danh sách ngắn các mục KB hợp lý cho một lần nhắc. |
| Disambiguation (Phân giải nhập nhằng) | Chọn đúng | Chấm điểm các ứng viên bằng ngữ cảnh, chọn bên thắng. |
| Alias index (Chỉ mục bí danh) | Bảng tra cứu | Ánh xạ từ dạng bề mặt → các thực thể ứng viên. |
| NIL | Không trong KB | Dự đoán tường minh rằng không mục KB nào khớp. |
| KB | Cơ sở tri thức | Wikidata, Wikipedia, DBpedia hoặc KB lĩnh vực của bạn. |
| AIDA-CoNLL | Benchmark | 1,393 bài báo Reuters với các liên kết thực thể chuẩn. |

## Further Reading

- [Milne, Witten (2008). Learning to Link with Wikipedia](https://researchcommons.waikato.ac.nz/entities/publication/b9a0b520-abc5-47c5-a86a-da6c579893ab) — cách tiếp cận tiên nghiệm+ngữ cảnh nền tảng.
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) — thành phần chủ lực dựa trên embedding.
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) — EL sinh với giải mã có ràng buộc.
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) — bài báo benchmark.
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) — ngăn xếp production mở.
