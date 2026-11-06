# Coreference Resolution

> "Cô ấy gọi anh ấy. Anh ấy không trả lời. Bác sĩ đang ăn trưa." Ba tham chiếu đến hai người và không ai được nêu tên. Phân giải đồng tham chiếu tìm ra ai là ai.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 minutes

## The Problem

Trích xuất mọi lần nhắc đến Apple Inc. từ một bài báo 300 từ. Dễ khi bài báo nói "Apple." Khó khi nó nói "công ty", "họ", "gã khổng lồ công nghệ của Cupertino" hoặc "hãng của Jobs." Không phân giải các lần nhắc này về cùng thực thể, pipeline NER của bạn bỏ sót 60-80% các lần nhắc.

Phân giải đồng tham chiếu liên kết mọi biểu thức đề cập đến cùng một thực thể ngoài đời thành một cụm. Nó là chất keo giữa NLP cấp bề mặt (NER, phân tích cú pháp) và ngữ nghĩa phía sau (IE, QA, tóm tắt, KG).

Vì sao nó quan trọng năm 2026:

- Tóm tắt: "CEO đã thông báo..." so với "Tim Cook đã thông báo..." — bản tóm tắt nên nêu tên CEO.
- Hỏi đáp: "Cô ấy đã gọi ai?" đòi hỏi phân giải "cô ấy."
- Trích xuất thông tin: một đồ thị tri thức có "PER1 thành lập Apple" và "Jobs thành lập Apple" là các mục riêng thì sai.
- IE nhiều tài liệu: gộp các lần nhắc giữa các bài báo về cùng sự kiện là đồng tham chiếu xuyên tài liệu.

## The Concept

![Coreference clustering: mentions → entities](../assets/coref.svg)

**Tác vụ.** Đầu vào: một tài liệu. Đầu ra: một phân cụm các lần nhắc (span) mà mỗi cụm đề cập đến một thực thể.

**Các loại lần nhắc.**

- **Thực thể có tên.** "Tim Cook"
- **Danh ngữ.** "CEO", "công ty"
- **Đại từ.** "anh ấy", "cô ấy", "họ", "nó"
- **Đồng vị.** "Tim Cook, CEO của Apple,"

**Các kiến trúc.**

1. **Dựa trên quy tắc (Hobbs, 1978).** Phân giải đại từ dựa trên cây cú pháp bằng các quy tắc ngữ pháp. Baseline tốt. Khó bị đánh bại đến ngạc nhiên trên các đại từ.
2. **Bộ phân loại cặp lần nhắc.** Với mọi cặp lần nhắc $(m_i, m_j)$, dự đoán liệu chúng có đồng tham chiếu. Phân cụm bằng bao đóng bắc cầu. Tiêu chuẩn trước 2016.
3. **Xếp hạng lần nhắc.** Với mỗi lần nhắc, xếp hạng các tiền ngữ ứng viên (bao gồm "không tiền ngữ"). Chọn đầu bảng.
4. **Đầu cuối dựa trên span (Lee và cộng sự, 2017).** Encoder transformer. Liệt kê mọi span ứng viên đến một giới hạn độ dài. Dự đoán các điểm lần nhắc. Dự đoán xác suất tiền ngữ cho mỗi span. Phân cụm tham lam. Mặc định hiện đại.
5. **Sinh (2024+).** Prompt một LLM: "Liệt kê mọi đại từ trong văn bản này và tiền ngữ của nó." Hoạt động tốt trên các trường hợp dễ, chật vật trên các tài liệu dài và các đối tượng quy chiếu hiếm.

**Các thước đo đánh giá.** Năm thước đo tiêu chuẩn (MUC, B³, CEAF, BLANC, LEA) vì không thước đo đơn lẻ nào nắm bắt chất lượng phân cụm. Báo cáo trung bình của ba thước đo đầu làm CoNLL F1. Tiên tiến nhất năm 2026 trên CoNLL-2012: ~83 F1.

**Các trường hợp khó đã biết.**

- Các mô tả xác định đề cập đến các thực thể được giới thiệu nhiều trang trước.
- Hồi chỉ bắc cầu ("các bánh xe" → một chiếc xe được nhắc trước đó).
- Hồi chỉ rỗng trong các ngôn ngữ như tiếng Trung và Nhật.
- Khứ chỉ (đại từ trước đối tượng quy chiếu): "Khi **cô ấy** bước vào, Mary mỉm cười."

```figure
coref-links
```

## Build It

### Step 1: pretrained neural coreference (AllenNLP / spaCy-experimental)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said it would ship them soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

Trên một tài liệu dài hơn, bạn nhận thứ gì đó như:
- Cụm 1: [Apple, The company, it]
- Cụm 2: [new products, them]

### Step 2: rule-based pronoun resolver (teaching)

Xem `code/main.py` để có một triển khai chỉ stdlib:

1. Trích xuất các lần nhắc: các thực thể có tên (span viết hoa), các đại từ (tra cứu dict), các mô tả xác định ("the X").
2. Với mỗi đại từ, nhìn K lần nhắc trước và chấm điểm chúng theo:
   - hòa hợp giới/số (heuristic)
   - độ gần thời gian (gần hơn thắng)
   - vai trò cú pháp (ưu tiên chủ ngữ)
3. Liên kết tiền ngữ có điểm cao nhất.

Không cạnh tranh với các mô hình nơ-ron. Nhưng nó cho thấy không gian tìm kiếm và các quyết định một mô hình đầu cuối phải đưa ra.

### Step 3: using LLMs for coreference

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

Hai dạng lỗi cần theo dõi. Thứ nhất, LLM gộp quá mức ("anh ấy" và "cô ấy" đề cập đến hai người riêng biệt). Thứ hai, LLM âm thầm bỏ các lần nhắc trong tài liệu dài. Luôn xác minh bằng các kiểm tra độ lệch span.

### Step 4: evaluation

Script conll-2012 tiêu chuẩn tính MUC, B³, CEAF-φ4 và báo cáo trung bình. Với đánh giá nội bộ, bắt đầu bằng precision và recall cấp span trên tập kiểm thử được chú giải của bạn, rồi thêm F1 liên kết lần nhắc.

## Pitfalls

- **Bùng nổ cụm đơn.** Một số hệ thống báo cáo mỗi lần nhắc là một cụm riêng. B³ khoan dung. MUC phạt điều này. Luôn kiểm tra cả ba thước đo.
- **Các đại từ trong ngữ cảnh dài.** Hiệu năng giảm ~15 F1 trên các tài liệu hơn 2,000 token. Chia khối cẩn thận.
- **Các giả định giới.** Các quy tắc giới viết cứng hỏng trên các đối tượng quy chiếu phi nhị nguyên, tổ chức, động vật. Dùng các mô hình được học hoặc chấm điểm trung lập.
- **Độ trôi LLM trên tài liệu dài.** Một lời gọi API duy nhất không thể phân cụm các lần nhắc đáng tin cậy trên 50+ đoạn văn. Dùng cửa sổ trượt + gộp.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Tiếng Anh, một tài liệu | `en_coreference_web_trf` (spaCy-experimental) hoặc neural coref AllenNLP |
| Đa ngôn ngữ | SpanBERT / XLM-R được huấn luyện trên OntoNotes hoặc Multilingual CoNLL |
| Đồng tham chiếu sự kiện xuyên tài liệu | Các mô hình đầu cuối chuyên biệt (SOTA 2025–26) |
| Baseline LLM nhanh | GPT-4o / Claude với prompt coref đầu ra có cấu trúc |
| Các hệ thống hội thoại production | Dự phòng dựa trên quy tắc + chính nơ-ron + rà soát thủ công cho các slot trọng yếu |

Mẫu tích hợp được phát hành năm 2026: chạy NER trước, chạy coref, gộp các cụm coref vào các thực thể NER. Các tác vụ phía sau thấy một thực thể cho mỗi cụm, không phải một thực thể cho mỗi lần nhắc.

## Ship It

Lưu thành `outputs/skill-coref-picker.md`:

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## Exercises

1. **Dễ.** Chạy bộ phân giải dựa trên quy tắc trong `code/main.py` trên 5 đoạn văn tạo thủ công. Đo độ chính xác liên kết lần nhắc so với ground truth.
2. **Trung bình.** Dùng một mô hình coref nơ-ron được tiền huấn luyện trên một bài báo tin tức. So sánh các cụm với chú giải thủ công của bạn. Nó thất bại ở đâu?
3. **Khó.** Xây dựng một pipeline NER được tăng cường coref: NER trước, rồi gộp qua các cụm coref. Đo cải thiện độ bao phủ thực thể so với chỉ NER trên 100 bài báo.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Mention (Lần nhắc) | Một tham chiếu | Một span văn bản đề cập đến một thực thể (tên, đại từ, cụm danh từ). |
| Antecedent (Tiền ngữ) | Thứ "nó" đề cập đến | Lần nhắc trước mà một lần nhắc sau đồng tham chiếu với. |
| Cluster (Cụm) | Các lần nhắc của thực thể | Tập các lần nhắc đều đề cập đến cùng một thực thể ngoài đời. |
| Anaphora (Hồi chỉ) | Tham chiếu ngược | Lần nhắc sau đề cập đến lần trước ("anh ấy" → "John"). |
| Cataphora (Khứ chỉ) | Tham chiếu xuôi | Lần nhắc trước đề cập đến lần sau ("Khi anh ấy đến, John..."). |
| Bridging (Bắc cầu) | Tham chiếu ngầm | "Tôi mua một chiếc xe. Các bánh xe tệ." (các bánh của CHIẾC XE ĐÓ.) |
| CoNLL F1 | Con số trên các bảng xếp hạng | Trung bình các điểm F1 MUC, B³, CEAF-φ4. |

## Further Reading

- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) — chương giáo trình kinh điển.
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) — đầu cuối dựa trên span.
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) — tiền huấn luyện cải thiện coref.
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) — benchmark.
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) — tác phẩm kinh điển dựa trên quy tắc.
