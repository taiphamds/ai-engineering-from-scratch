# Natural Language Inference — Textual Entailment

> "t kéo theo h" nghĩa là một người đọc t sẽ kết luận h đúng. NLI là tác vụ dự đoán kéo theo / mâu thuẫn / trung lập. Bề ngoài nhàm chán, gánh tải trong production.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment Analysis), Phase 5 · 13 (Question Answering)
**Time:** ~60 minutes

## The Problem

Bạn xây dựng một bộ tóm tắt. Nó tạo một bản tóm tắt. Làm thế nào bạn biết bản tóm tắt không chứa một ảo giác?

Bạn xây dựng một chatbot. Nó trả lời "có." Làm thế nào bạn biết câu trả lời được đoạn văn truy xuất hỗ trợ?

Bạn cần phân loại 10,000 bài báo tin tức theo chủ đề. Bạn không có nhãn huấn luyện. Bạn có thể tái sử dụng một mô hình không?

Cả ba bài toán quy về Suy luận Ngôn ngữ Tự nhiên. NLI hỏi: với một tiền đề `t` và một giả thuyết `h`, `h` được `t` kéo theo, bị phủ định hay trung lập (không liên quan)?

- **Kiểm tra ảo giác:** `t` = tài liệu nguồn, `h` = khẳng định trong tóm tắt. Không kéo theo = ảo giác.
- **QA có căn cứ:** `t` = đoạn văn truy xuất, `h` = câu trả lời được sinh. Không kéo theo = bịa đặt.
- **Phân loại zero-shot:** `t` = tài liệu, `h` = nhãn được diễn đạt bằng lời ("Đây là về thể thao"). Kéo theo = nhãn dự đoán.

Một tác vụ, ba cách dùng production. Đây là lý do mọi framework đánh giá RAG cung cấp một mô hình NLI bên dưới.

## The Concept

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**Ba nhãn.**

- **Kéo theo.** `t` → `h`. "Con mèo ở trên tấm thảm" kéo theo "Có một con mèo."
- **Mâu thuẫn.** `t` → ¬`h`. "Con mèo ở trên tấm thảm" mâu thuẫn với "Không có con mèo nào."
- **Trung lập.** Không có suy luận theo hướng nào. "Con mèo ở trên tấm thảm" trung lập với "Con mèo đang đói."

**Không phải kéo theo logic.** NLI là suy luận ngôn ngữ *tự nhiên* — điều một người đọc thông thường sẽ suy ra, không phải logic nghiêm ngặt. "John dắt chó của mình đi dạo" kéo theo "John có một con chó" trong NLI, nhưng logic bậc nhất nghiêm ngặt chỉ chấp nhận nếu bạn tiên đề hóa sự sở hữu.

**Các tập dữ liệu.**

- **SNLI** (2015). 570k cặp được con người chú giải, chú thích ảnh làm tiền đề. Miền hẹp.
- **MultiNLI** (2017). 433k cặp trên 10 thể loại. Ngữ liệu huấn luyện tiêu chuẩn năm 2026.
- **ANLI** (2019). NLI đối kháng. Con người viết các ví dụ được thiết kế riêng để phá các mô hình hiện có. Khó hơn.
- **DocNLI, ConTRoL** (2020–21). Các tiền đề dài bằng tài liệu. Kiểm thử suy luận nhiều bước và xa.

**Kiến trúc.** Một encoder transformer (BERT, RoBERTa, DeBERTa) đọc `[CLS] premise [SEP] hypothesis [SEP]`. Biểu diễn `[CLS]` đưa vào một softmax 3 ngả. Huấn luyện trên MNLI, đánh giá trên các benchmark được giữ lại, đạt accuracy 90%+ trên các cặp trong phân phối.

**Zero-shot qua NLI.** Với một tài liệu và các nhãn ứng viên, biến mỗi nhãn thành một giả thuyết ("Văn bản này nói về thể thao"). Tính xác suất kéo theo cho mỗi nhãn. Chọn giá trị lớn nhất. Đây là cơ chế đằng sau pipeline `zero-shot-classification` của Hugging Face.

```figure
nli-router
```

## Build It

### Step 1: run a pretrained NLI model

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

Đối với NLI production, `facebook/bart-large-mnli` và `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` là các mặc định mở. DeBERTa-v3 đứng đầu các bảng xếp hạng.

### Step 2: zero-shot classification

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

Khuôn mặc định là "Ví dụ này nói về {label}." Tùy chỉnh bằng `hypothesis_template`. Không yêu cầu dữ liệu huấn luyện. Không fine-tuning. Hoạt động ngay khi dùng.

### Step 3: faithfulness check for RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

Đây là cốt lõi của độ trung thành RAGAS. Chia câu trả lời được sinh thành các khẳng định nguyên tử. Kiểm tra mỗi khẳng định theo ngữ cảnh truy xuất. Báo cáo tỷ lệ được kéo theo.

### Step 4: hand-rolled NLI classifier (conceptual)

Xem `code/main.py` để có một ví dụ đồ chơi chỉ dùng stdlib: tiền đề và giả thuyết được so sánh qua phần giao từ vựng + phát hiện phủ định. Không cạnh tranh với các mô hình transformer — nhưng cho thấy hình dạng tác vụ: hai văn bản vào, nhãn 3 ngả ra, loss = cross-entropy trên `{entail, contradict, neutral}`.

## Pitfalls

- **Các lối tắt chỉ giả thuyết.** Các mô hình có thể dự đoán nhãn chỉ từ giả thuyết ở mức ~60% trên SNLI vì "not", "nobody", "never" tương quan với mâu thuẫn. Baseline mạnh để phát hiện rò rỉ nhãn.
- **Heuristic phần giao từ vựng.** Heuristic dãy con ("mọi dãy con đều được kéo theo") vượt SNLI nhưng thất bại trên HANS/ANLI. Dùng các benchmark đối kháng.
- **Suy giảm ở độ dài tài liệu.** Các mô hình NLI một câu giảm 20+ F1 trên các tiền đề dài bằng tài liệu. Dùng các mô hình được huấn luyện trên DocNLI cho ngữ cảnh dài.
- **Độ nhạy khuôn zero-shot.** "Ví dụ này nói về {label}" so với "{label}" so với "Chủ đề là {label}" có thể làm accuracy dao động 10+ điểm. Tinh chỉnh khuôn.
- **Không khớp lĩnh vực.** MNLI huấn luyện trên tiếng Anh tổng quát. Văn bản pháp lý, y tế và khoa học cần các mô hình NLI riêng lĩnh vực (ví dụ, SciNLI, MedNLI).

## Use It

Ngăn xếp năm 2026:

| Trường hợp sử dụng | Mô hình |
|---------|-------|
| NLI đa dụng | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Nhanh / biên | `cross-encoder/nli-deberta-v3-base` |
| Phân loại zero-shot (nhẹ) | `facebook/bart-large-mnli` |
| NLI cấp tài liệu | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Đa ngôn ngữ | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| Phát hiện ảo giác trong RAG | Tầng NLI bên trong RAGAS / DeepEval |

Mẫu tổng quát năm 2026: NLI là băng keo của hiểu văn bản. Bất cứ khi nào bạn cần "A có hỗ trợ B không?" hoặc "A có mâu thuẫn B không?" — tìm đến NLI trước khi tìm đến một lời gọi LLM khác.

## Ship It

Lưu thành `outputs/skill-nli-picker.md`:

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## Exercises

1. **Dễ.** Chạy `facebook/bart-large-mnli` trên 20 bộ ba (tiền đề, giả thuyết, nhãn) tạo thủ công bao phủ cả ba lớp. Đo accuracy. Thêm các bẫy đối kháng "heuristic dãy con" ("Tôi đã không ăn chiếc bánh" so với "Tôi đã ăn chiếc bánh") và xem nó có hỏng không.
2. **Trung bình.** So sánh khuôn zero-shot `"This text is about {label}"` với `"The topic is {label}"` và `"{label}"` trên 100 tiêu đề AG News. Báo cáo dao động accuracy.
3. **Khó.** Xây dựng một bộ kiểm tra độ trung thành RAG: phân rã khẳng định nguyên tử + NLI cho mỗi khẳng định. Đánh giá trên 50 câu trả lời do RAG sinh với ngữ cảnh chuẩn. Đo tỷ lệ dương tính giả và âm tính giả so với nhãn thủ công.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| NLI | Suy luận Ngôn ngữ Tự nhiên | Phân loại 3 ngả quan hệ tiền đề-giả thuyết. |
| RTE | Nhận biết Kéo theo Văn bản | Tên cũ hơn cho NLI; cùng tác vụ. |
| Entailment (Kéo theo) | "t suy ra h" | Một người đọc thông thường sẽ kết luận h đúng khi biết t. |
| Contradiction (Mâu thuẫn) | "t loại trừ h" | Một người đọc thông thường sẽ kết luận h sai khi biết t. |
| Neutral (Trung lập) | "chưa quyết định" | Không có suy luận từ t đến h theo hướng nào. |
| Zero-shot classification (Phân loại zero-shot) | NLI làm bộ phân loại | Diễn đạt các nhãn thành giả thuyết, chọn kéo theo lớn nhất. |
| Faithfulness (Độ trung thành) | Câu trả lời có được hỗ trợ không? | NLI trên (ngữ cảnh truy xuất, câu trả lời được sinh). |

## Further Reading

- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) — SNLI.
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) — MultiNLI.
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) — benchmark ANLI.
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) — NLI làm bộ phân loại.
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) — thành phần chủ lực NLI năm 2026.
