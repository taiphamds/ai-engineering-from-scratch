# Multilingual NLP

> Một mô hình, 100+ ngôn ngữ, không dữ liệu huấn luyện cho hầu hết chúng. Chuyển giao xuyên ngôn ngữ là phép màu thực tế của những năm 2020.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 04 (GloVe, FastText, Subword), Phase 5 · 11 (Machine Translation)
**Time:** ~45 minutes

## The Problem

Tiếng Anh có hàng tỷ ví dụ được gán nhãn. Tiếng Urdu có hàng nghìn. Tiếng Maithili gần như không có. Bất kỳ hệ thống NLP thực tế nào phục vụ người dùng toàn cầu đều phải hoạt động trên phần đuôi dài của các ngôn ngữ nơi dữ liệu huấn luyện riêng cho tác vụ không tồn tại.

Các mô hình đa ngôn ngữ giải quyết điều này bằng cách huấn luyện một mô hình trên nhiều ngôn ngữ đồng thời. Biểu diễn dùng chung cho phép mô hình chuyển các kỹ năng học được trong các ngôn ngữ nhiều tài nguyên sang các ngôn ngữ ít tài nguyên. Fine-tune mô hình trên phân tích cảm xúc tiếng Anh, và nó tạo các dự đoán cảm xúc tốt đến ngạc nhiên trên tiếng Urdu ngay khi dùng. Đó là chuyển giao xuyên ngôn ngữ zero-shot, và nó đã định hình lại cách NLP được phát hành ra thế giới.

Bài học này nêu tên các đánh đổi, các mô hình kinh điển và một quyết định làm các nhóm mới với công việc đa ngôn ngữ vấp ngã: chọn một ngôn ngữ nguồn để chuyển giao.

## The Concept

![Cross-lingual transfer via shared multilingual embedding space](../assets/multilingual.svg)

**Từ vựng dùng chung.** Các mô hình đa ngôn ngữ dùng một tokenizer SentencePiece hoặc WordPiece được huấn luyện trên văn bản từ mọi ngôn ngữ đích. Từ vựng được dùng chung: cùng một đơn vị từ con biểu diễn cùng một hình vị giữa các ngôn ngữ có quan hệ. `anti-` trong tiếng Anh và tiếng Ý nhận cùng token.

**Biểu diễn dùng chung.** Một transformer được tiền huấn luyện bằng mô hình hóa ngôn ngữ che mặt nạ trên nhiều ngôn ngữ học rằng các câu tương tự về ngữ nghĩa trong các ngôn ngữ khác nhau tạo các trạng thái ẩn tương tự. mBERT, XLM-R và NLLB đều thể hiện điều này. Các embedding cho "cat" trong tiếng Anh tạo cụm gần "chat" trong tiếng Pháp và "gato" trong tiếng Tây Ban Nha, và các embedding toàn câu cũng vậy.

**Chuyển giao zero-shot.** Fine-tune mô hình trên dữ liệu có nhãn trong một ngôn ngữ (thường là tiếng Anh). Khi suy luận, chạy nó trên bất kỳ ngôn ngữ nào khác mà mô hình hỗ trợ. Không cần các nhãn ngôn ngữ đích. Kết quả mạnh với các ngôn ngữ có quan hệ về loại hình và yếu hơn với các ngôn ngữ xa nhau.

**Fine-tuning few-shot.** Thêm 100-500 ví dụ có nhãn trong ngôn ngữ đích. Accuracy nhảy lên 95-98% của baseline tiếng Anh trên các tác vụ phân loại. Đây là đòn bẩy hiệu quả chi phí nhất trong NLP đa ngôn ngữ.

## The models

| Mô hình | Năm | Độ bao phủ | Ghi chú |
|-------|------|----------|-------|
| mBERT | 2018 | 104 ngôn ngữ | Được huấn luyện trên Wikipedia. LM đa ngôn ngữ thực tế đầu tiên. Yếu trên ít tài nguyên. |
| XLM-R | 2019 | 100 ngôn ngữ | Được huấn luyện trên CommonCrawl (lớn hơn nhiều so với Wikipedia). Đặt baseline xuyên ngôn ngữ. Base 270M, Large 550M. |
| XLM-V | 2023 | 100 ngôn ngữ | XLM-R với từ vựng 1M token (so với 250k). Tốt hơn trên ít tài nguyên. |
| mT5 | 2020 | 101 ngôn ngữ | Kiến trúc T5 cho sinh đa ngôn ngữ. |
| NLLB-200 | 2022 | 200 ngôn ngữ | Mô hình dịch của Meta; bao gồm 55 ngôn ngữ ít tài nguyên. |
| BLOOM | 2022 | 46 ngôn ngữ + 13 ngôn ngữ lập trình | LLM mở 176B được huấn luyện đa ngôn ngữ. |
| Aya-23 | 2024 | 23 ngôn ngữ | LLM đa ngôn ngữ của Cohere. Mạnh trên tiếng Ả Rập, Hindi, Swahili. |

Chọn theo trường hợp sử dụng. Phân loại hoạt động tốt với XLM-R-base làm mặc định hợp lý. Các tác vụ sinh cần mT5 hoặc NLLB tùy dịch hay sinh mở. Công việc kiểu LLM ghép với Aya-23 hoặc Claude dùng prompting đa ngôn ngữ tường minh.

## The source-language decision (2026 research)

Hầu hết các nhóm mặc định tiếng Anh là nguồn fine-tuning. Nghiên cứu gần đây (2026) cho thấy điều này thường sai.

Độ tương đồng ngôn ngữ dự đoán chất lượng chuyển giao tốt hơn kích thước ngữ liệu thô. Với các đích Slav, tiếng Đức hoặc Nga thường thắng tiếng Anh. Với các đích Ấn, tiếng Hindi thường thắng tiếng Anh. Thước đo tương đồng **qWALS** (2026, dựa trên các đặc trưng World Atlas of Language Structures) định lượng điều này. **LANGRANK** (Lin và cộng sự, ACL 2019) là một phương pháp riêng, sớm hơn, xếp hạng các ngôn ngữ nguồn ứng viên từ sự kết hợp của độ tương đồng ngôn ngữ, kích thước ngữ liệu và quan hệ họ hàng ngôn ngữ.

Quy tắc thực tế: nếu ngôn ngữ đích của bạn có một ngôn ngữ họ hàng nhiều tài nguyên gần về loại hình, thử fine-tuning trên ngôn ngữ đó trước, rồi so sánh với fine-tune tiếng Anh.

```figure
n5-crosslingual-bridge
```

## Build It

### Step 1: zero-shot cross-lingual classification

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tok = AutoTokenizer.from_pretrained("joeddav/xlm-roberta-large-xnli")
model = AutoModelForSequenceClassification.from_pretrained("joeddav/xlm-roberta-large-xnli")


def classify(text, candidate_labels, hypothesis_template="This text is about {}."):
    scores = {}
    for label in candidate_labels:
        hypothesis = hypothesis_template.format(label)
        inputs = tok(text, hypothesis, return_tensors="pt", truncation=True)
        with torch.no_grad():
            logits = model(**inputs).logits[0]
        entail_score = torch.softmax(logits, dim=-1)[2].item()
        scores[label] = entail_score
    return dict(sorted(scores.items(), key=lambda x: -x[1]))


print(classify("I love this product!", ["positive", "negative", "neutral"]))
print(classify("मुझे यह उत्पाद पसंद है!", ["positive", "negative", "neutral"]))
print(classify("J'adore ce produit !", ["positive", "negative", "neutral"]))
```

Một mô hình, ba ngôn ngữ, cùng API. XLM-R được huấn luyện trên dữ liệu NLI chuyển giao tốt sang phân loại qua thủ thuật kéo theo.

### Step 2: multilingual embedding space

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

pairs = [
    ("The cat is sleeping.", "Le chat dort."),
    ("The cat is sleeping.", "El gato está durmiendo."),
    ("The cat is sleeping.", "Die Katze schläft."),
    ("The cat is sleeping.", "The dog is barking."),
]

for eng, other in pairs:
    emb_eng = model.encode([eng], normalize_embeddings=True)[0]
    emb_other = model.encode([other], normalize_embeddings=True)[0]
    sim = float(np.dot(emb_eng, emb_other))
    print(f"  {eng!r} <-> {other!r}: cos={sim:.3f}")
```

Các bản dịch nằm gần nhau trong không gian embedding. Một câu tiếng Anh khác nằm xa hơn. Đây là điều khiến truy xuất xuyên ngôn ngữ, phân cụm và độ tương đồng hoạt động.

### Step 3: few-shot fine-tuning strategy

```python
from transformers import TrainingArguments, Trainer
from datasets import Dataset


def few_shot_finetune(base_model, base_tokenizer, examples):
    ds = Dataset.from_list(examples)

    def tokenize_fn(ex):
        out = base_tokenizer(ex["text"], truncation=True, max_length=128)
        out["labels"] = ex["label"]
        return out

    ds = ds.map(tokenize_fn)
    args = TrainingArguments(
        output_dir="out",
        per_device_train_batch_size=8,
        num_train_epochs=5,
        learning_rate=2e-5,
        save_strategy="no",
    )
    trainer = Trainer(model=base_model, args=args, train_dataset=ds)
    trainer.train()
    return base_model
```

Với 100-500 ví dụ ngôn ngữ đích, `num_train_epochs=5` và `learning_rate=2e-5` là các mặc định an toàn. Các tốc độ học cao hơn khiến sự căn chỉnh đa ngôn ngữ sụp đổ và bạn nhận một mô hình chỉ tiếng Anh.

## Evaluation that actually works

- **Accuracy theo ngôn ngữ trên các tập được giữ lại.** Không tổng hợp. Tổng hợp che giấu phần đuôi dài.
- **Benchmark so với baseline đơn ngôn ngữ.** Với các ngôn ngữ có đủ dữ liệu, một mô hình đơn ngôn ngữ được huấn luyện từ đầu đôi khi thắng mô hình đa ngôn ngữ. Kiểm thử.
- **Các kiểm thử cấp thực thể.** Các thực thể có tên trong ngôn ngữ đích. Các mô hình đa ngôn ngữ thường có tokenization yếu cho các hệ chữ xa Latin.
- **Tính nhất quán xuyên ngôn ngữ.** Cùng ý nghĩa trong hai ngôn ngữ nên tạo cùng dự đoán. Đo khoảng cách.

## Use It

Ngăn xếp năm 2026:

| Tác vụ | Khuyến nghị |
|-----|-------------|
| Phân loại, 100 ngôn ngữ | XLM-R-base (~270M) được fine-tune |
| Phân loại văn bản zero-shot | `joeddav/xlm-roberta-large-xnli` |
| Các embedding câu đa ngôn ngữ | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Dịch, 200 ngôn ngữ | `facebook/nllb-200-distilled-600M` (xem bài 11) |
| Sinh đa ngôn ngữ | Claude, GPT-4, Aya-23, mT5-XXL |
| NLP ngôn ngữ ít tài nguyên | XLM-V hoặc một fine-tune theo lĩnh vực trên ngôn ngữ nhiều tài nguyên có quan hệ |

Luôn dành ngân sách cho fine-tuning trong ngôn ngữ đích nếu hiệu năng quan trọng. Zero-shot là một điểm khởi đầu, không phải câu trả lời cuối.

### The tokenization tax (what goes wrong for low-resource languages)

Các mô hình đa ngôn ngữ dùng chung một tokenizer trên mọi ngôn ngữ của chúng. Từ vựng đó được huấn luyện trên một ngữ liệu bị chi phối bởi tiếng Anh, Pháp, Tây Ban Nha, Trung, Đức. Với bất kỳ ngôn ngữ nào ngoài tập chi phối, ba khoản thuế âm thầm cộng dồn:

- **Thuế độ phân mảnh token.** Văn bản ngôn ngữ ít tài nguyên tokenize thành nhiều token mỗi từ hơn tiếng Anh rất nhiều. Một câu Hindi có thể cần số token gấp 3-5 lần một câu tiếng Anh tương đương. Mức 3-5 lần đó ăn vào cửa sổ ngữ cảnh, hiệu quả huấn luyện và độ trễ của bạn.
- **Thuế khôi phục biến thể.** Mọi lỗi gõ, biến thể dấu phụ, sự không khớp chuẩn hóa Unicode hoặc biến thể kiểu chữ trở thành một chuỗi khởi đầu lạnh không liên quan trong không gian embedding. Mô hình không thể học các tương ứng chính tả mà người bản ngữ coi là hiển nhiên.
- **Thuế lan tràn năng lực.** Các khoản thuế 1 và 2 tiêu thụ các vị trí ngữ cảnh, độ sâu tầng và số chiều embedding. Phần còn lại cho suy luận thực nhỏ hơn một cách có hệ thống so với những gì một ngôn ngữ nhiều tài nguyên nhận từ cùng mô hình.

Triệu chứng thực tế: mô hình của bạn huấn luyện bình thường trên tiếng Hindi, đường cong loss trông đúng, perplexity đánh giá trông hợp lý và các đầu ra production sai tinh vi. Hình thái sụp đổ giữa câu. Các biến tố hiếm vẫn không khôi phục được. **Bạn không thể mở rộng dữ liệu để thoát khỏi một tokenizer hỏng.**

Các biện pháp giảm thiểu: chọn một tokenizer có độ bao phủ tốt cho ngôn ngữ đích của bạn (từ vựng 1M token của XLM-V là một cách sửa trực tiếp); xác minh độ phân mảnh tokenization trên văn bản đích được giữ lại trước huấn luyện; dùng phương án dự phòng cấp byte (SentencePiece `byte_fallback=True`, BPE cấp byte kiểu GPT-2) cho các hệ chữ thực sự thuộc đuôi dài để không có gì là OOV.

## Ship It

Lưu thành `outputs/skill-multilingual-picker.md`:

```markdown
---
name: multilingual-picker
description: Pick source language, target model, and evaluation plan for a multilingual NLP task.
version: 1.0.0
phase: 5
lesson: 18
tags: [nlp, multilingual, cross-lingual]
---

Given requirements (target languages, task type, available labeled data per language), output:

1. Source language for fine-tuning. Default English; check LANGRANK or qWALS if target language has a typologically close high-resource language.
2. Base model. XLM-R (classification), mT5 (generation), NLLB (translation), Aya-23 (generative LLM).
3. Few-shot budget. Start with 100-500 target-language examples if available. Zero-shot only if labeling is infeasible.
4. Evaluation plan. Per-language accuracy (not aggregate), cross-lingual consistency, entity-level F1 on non-Latin scripts.

Refuse to ship a multilingual model without per-language evaluation — aggregate metrics hide long-tail failures. Flag scripts with low tokenization coverage (Amharic, Tigrinya, many African languages) as needing a model with byte-fallback (SentencePiece with byte_fallback=True, or byte-level tokenizer like GPT-2).
```

## Exercises

1. **Dễ.** Chạy pipeline phân loại zero-shot trên 10 câu mỗi ngôn ngữ qua tiếng Anh, Pháp, Hindi và Ả Rập. Báo cáo accuracy trên mỗi ngôn ngữ. Bạn sẽ thấy tiếng Pháp mạnh, Hindi khá, Ả Rập thay đổi.
2. **Trung bình.** Dùng `paraphrase-multilingual-MiniLM-L12-v2` để xây dựng một bộ truy xuất xuyên ngôn ngữ trên một ngữ liệu trộn ngôn ngữ nhỏ. Truy vấn bằng tiếng Anh, truy xuất tài liệu trong bất kỳ ngôn ngữ nào. Đo recall@5.
3. **Khó.** So sánh fine-tuning nguồn tiếng Anh và nguồn tiếng Hindi cho một tác vụ phân loại tiếng Hindi. Dùng 500 ví dụ ngôn ngữ đích cho fine-tuning few-shot dưới cả hai chế độ. Báo cáo nguồn nào tạo accuracy Hindi tốt hơn và bao nhiêu. Đây là luận điểm LANGRANK thu nhỏ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Multilingual model (Mô hình đa ngôn ngữ) | Một mô hình, nhiều ngôn ngữ | Từ vựng và tham số dùng chung giữa các ngôn ngữ. |
| Cross-lingual transfer (Chuyển giao xuyên ngôn ngữ) | Huấn luyện trên một ngôn ngữ, chạy trên ngôn ngữ khác | Fine-tune trên nguồn, đánh giá trên đích mà không có nhãn ngôn ngữ đích. |
| Zero-shot | Không nhãn ngôn ngữ đích | Chuyển giao không fine-tuning trên ngôn ngữ đích. |
| Few-shot | Ít nhãn đích | 100-500 ví dụ ngôn ngữ đích được dùng cho fine-tuning. |
| mBERT | LM đa ngôn ngữ đầu tiên | BERT 104 ngôn ngữ được tiền huấn luyện trên Wikipedia. |
| XLM-R | Baseline xuyên ngôn ngữ tiêu chuẩn | RoBERTa 100 ngôn ngữ được tiền huấn luyện trên CommonCrawl. |
| NLLB | MT 200 ngôn ngữ của Meta | No Language Left Behind. Bao gồm 55 ngôn ngữ ít tài nguyên. |

## Further Reading

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) — bài báo XLM-R.
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) — bài báo phân tích mở đầu hướng nghiên cứu chuyển giao xuyên ngôn ngữ.
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) — bài báo NLLB-200.
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) — Aya, LLM đa ngôn ngữ của Cohere.
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) — bài báo ngôn ngữ nguồn qWALS / LANGRANK.
