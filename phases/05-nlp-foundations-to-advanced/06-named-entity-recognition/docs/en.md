# Named Entity Recognition

> Lấy các tên ra. Nghe có vẻ dễ cho đến khi bạn xử lý các ranh giới mơ hồ, thực thể lồng nhau và biệt ngữ lĩnh vực.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## The Problem

"Apple kiện Google về thỏa thuận tìm kiếm iPhone của hãng tại Mỹ." Năm thực thể: Apple (ORG), Google (ORG), iPhone (PRODUCT), thỏa thuận tìm kiếm (có lẽ), US (GPE). Một hệ thống NER tốt trích xuất tất cả chúng với đúng loại. Một hệ thống tệ bỏ sót iPhone, nhầm Apple là trái cây với Apple là công ty và gán nhãn "US" là PERSON.

NER là thành phần chủ lực bên dưới mọi pipeline trích xuất có cấu trúc. Phân tích hồ sơ xin việc, quét nhật ký tuân thủ, ẩn danh hồ sơ y tế, hiểu truy vấn tìm kiếm, tạo căn cứ cho phản hồi chatbot, trích xuất hợp đồng pháp lý. Bạn không bao giờ thấy rõ nó; bạn luôn phụ thuộc vào nó.

Bài học này đi theo con đường cổ điển (dựa trên quy tắc, HMM, CRF) vào con đường hiện đại (BiLSTM-CRF, rồi transformer). Mỗi bước giải quyết một hạn chế cụ thể của bước trước. Mẫu đó là bài học.

## The Concept

**Gán nhãn BIO** (hoặc BILOU) biến trích xuất thực thể thành một bài toán gán nhãn chuỗi. Gán nhãn mỗi token bằng `B-TYPE` (bắt đầu thực thể), `I-TYPE` (bên trong thực thể) hoặc `O` (bên ngoài mọi thực thể).

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

Các thực thể nhiều token nối thành chuỗi: `New B-GPE`, `York I-GPE`, `City I-GPE`. Một mô hình hiểu BIO có thể trích xuất các span tùy ý.

Tiến trình kiến trúc:

- **Dựa trên quy tắc.** Regex + tra cứu từ điển thực thể. Precision cao trên các thực thể đã biết, không bao phủ các thực thể mới.
- **HMM.** Mô hình Markov ẩn. Xác suất phát xạ của token khi biết nhãn, xác suất chuyển từ nhãn sang nhãn. Giải mã Viterbi. Được huấn luyện trên dữ liệu có nhãn.
- **CRF.** Trường ngẫu nhiên có điều kiện. Giống HMM nhưng có tính phân biệt, nên bạn có thể trộn các đặc trưng tùy ý (hình dạng từ, viết hoa, các từ lân cận). Vẫn là thành phần chủ lực production cổ điển năm 2026 cho các triển khai ít tài nguyên.
- **BiLSTM-CRF.** Các đặc trưng nơ-ron thay cho thiết kế thủ công. LSTM đọc câu theo cả hai hướng, tầng CRF phía trên buộc các chuỗi nhãn nhất quán.
- **Dựa trên transformer.** Fine-tune BERT với một head phân loại token. Accuracy tốt nhất. Nhiều tính toán nhất.

```figure
ner-bio-tagging
```

## Build It

### Step 1: BIO tagging helpers

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### Step 2: hand-crafted features

Đối với NER cổ điển (phi nơ-ron), đặc trưng là yếu tố quyết định. Các đặc trưng hữu ích:

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")` trả về `xXxxxx`. `word_shape("USA-2024")` trả về `XXX-dddd`. Các mẫu viết hoa mang tín hiệu mạnh cho danh từ riêng.

### Step 3: a simple rule-based + dictionary baseline

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

Các từ điển thực thể production có hàng triệu mục được thu thập từ Wikipedia và DBpedia. Độ bao phủ tốt. Phân giải nhập nhằng (`Apple` là công ty so với trái cây) rất tệ. Đó là lý do các mô hình thống kê thắng.

### Step 4: the CRF step (sketch, not full impl)

CRF đầy đủ từ đầu trong 50 dòng không giúp sáng tỏ nếu thiếu nền tảng lý thuyết xác suất. Thay vào đó dùng `sklearn-crfsuite`:

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1` và `c2` là điều chuẩn L1 và L2. `all_possible_transitions=True` cho phép mô hình học rằng các chuỗi không hợp lệ (ví dụ, `I-ORG` sau `O`) ít có khả năng xảy ra, đó là cách một CRF buộc tính nhất quán BIO mà không cần bạn viết ràng buộc.

### Step 5: what a BiLSTM-CRF adds

Các đặc trưng trở thành được học. Đầu vào: các embedding token (GloVe hoặc fastText). LSTM đọc từ trái sang phải và từ phải sang trái. Các trạng thái ẩn được nối đi qua một tầng đầu ra CRF. CRF vẫn buộc tính nhất quán chuỗi nhãn; LSTM thay các đặc trưng thiết kế thủ công bằng các đặc trưng được học.

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

Với tầng CRF, dùng `torchcrf.CRF` (pip install pytorch-crf). Mức cải thiện so với CRF thiết kế thủ công đo được nhưng nhỏ hơn bạn kỳ vọng trừ khi bạn có hàng chục nghìn câu được gán nhãn.

## Use It

spaCy cung cấp NER cấp production ngay khi dùng.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

Chú ý `iPhone` được gán nhãn `ORG` thay vì `PRODUCT` — mô hình nhỏ của spaCy có độ bao phủ thực thể sản phẩm yếu. Mô hình lớn (`en_core_web_lg`) làm tốt hơn. Mô hình transformer (`en_core_web_trf`) còn làm tốt hơn nữa.

Hugging Face cho NER dựa trên BERT:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"` gộp các token B-X, I-X liền nhau thành một span. Không có nó, bạn nhận các nhãn cấp token và phải tự gộp.

### LLM-based NER (the 2026 option)

NER LLM zero-shot và few-shot hiện cạnh tranh được với các mô hình được fine-tune trên nhiều lĩnh vực, và tốt hơn rõ rệt khi dữ liệu có nhãn khan hiếm.

- **Prompting zero-shot.** Cho LLM một danh sách các loại thực thể và một schema ví dụ. Yêu cầu đầu ra JSON. Hoạt động ngay khi dùng; accuracy vừa phải trên các lĩnh vực mới.
- **Prompting kiểu ZeroTuneBio.** Phân rã tác vụ thành trích xuất ứng viên → giải thích ý nghĩa → phán đoán → kiểm tra lại. Một prompt nhiều giai đoạn (không phải one-shot) nâng accuracy đáng kể trên NER y sinh. Cùng mẫu đó hoạt động cho các lĩnh vực pháp lý, tài chính và khoa học.
- **Prompting động với RAG.** Truy xuất các ví dụ có nhãn tương tự nhất từ một tập hạt giống nhỏ được chú giải cho mỗi lời gọi suy luận; xây dựng prompt few-shot ngay khi chạy. Trong các benchmark năm 2026, điều này nâng F1 NER y sinh của GPT-4 thêm 11-12% so với prompting tĩnh.
- **Phân rã theo loại thực thể.** Đối với tài liệu dài, một lời gọi duy nhất trích xuất tất cả các loại thực thể cùng lúc mất recall khi độ dài tăng. Chạy một lượt trích xuất cho mỗi loại thực thể. Chi phí suy luận cao hơn, accuracy cao hơn đáng kể. Đây là mẫu tiêu chuẩn cho ghi chú lâm sàng và hợp đồng pháp lý.

Khuyến nghị production tính đến năm 2026: bắt đầu với một baseline LLM zero-shot trước khi thu thập dữ liệu huấn luyện. Thường F1 đủ tốt để bạn không bao giờ cần fine-tune.

### Where classical NER still wins

Ngay cả khi có LLM, NER cổ điển thắng khi:

- Ngân sách độ trễ dưới 50ms.
- Bạn có hàng nghìn ví dụ có nhãn và cần F1 98%+.
- Lĩnh vực có một ontology ổn định mà một CRF hoặc BiLSTM được tiền huấn luyện chuyển giao tốt.
- Các ràng buộc quy định yêu cầu một mô hình tại chỗ, phi sinh.

### Where it falls apart

- **Dịch chuyển lĩnh vực.** NER được huấn luyện trên CoNLL dùng trên các hợp đồng pháp lý hoạt động kém hơn một từ điển thực thể. Fine-tune trên lĩnh vực của bạn.
- **Các thực thể lồng nhau.** "Bank of America Tower" đồng thời là một ORG và một FACILITY. BIO tiêu chuẩn không thể biểu diễn các span chồng lấn. Bạn cần NER lồng nhau (các mô hình nhiều lượt hoặc dựa trên span).
- **Các thực thể dài.** "United States Federal Deposit Insurance Corporation." Các mô hình cấp token đôi khi chia nó. Dùng `aggregation_strategy` hoặc hậu xử lý.
- **Các loại thưa.** Các nhãn NER y tế như DRUG_BRAND, ADVERSE_EVENT, DOSE. Các mô hình đa dụng không biết gì. Scispacy và BioBERT là các điểm bắt đầu ở đó.

## Ship It

Lưu thành `outputs/skill-ner-picker.md`:

```markdown
---
name: ner-picker
description: Pick the right NER approach for a given extraction task.
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

Given a task description (domain, label set, language, latency, data volume), output:

1. Approach. Rule-based + gazetteer, CRF, BiLSTM-CRF, or transformer fine-tune.
2. Starting model. Name it (spaCy model ID, Hugging Face checkpoint ID, or "custom, trained from scratch").
3. Labeling strategy. BIO, BILOU, or span-based. Justify in one sentence.
4. Evaluation. Use `seqeval`. Always report entity-level F1 (not token-level).

Refuse to recommend fine-tuning a transformer for under 500 labeled examples unless the user already has a pretrained domain model. Flag nested entities as needing span-based or multi-pass models. Require a gazetteer audit if the user mentions "production scale" and labels are unchanged from CoNLL-2003.
```

## Exercises

1. **Dễ.** Triển khai `bio_to_spans` (phép nghịch đảo của `spans_to_bio`) và xác minh tính nhất quán đi-về trên 10 câu.
2. **Trung bình.** Huấn luyện CRF sklearn-crfsuite ở trên trên tập dữ liệu NER tiếng Anh CoNLL-2003. Báo cáo F1 theo thực thể bằng `seqeval`. Kết quả điển hình: ~84 F1.
3. **Khó.** Fine-tune `distilbert-base-cased` trên một tập dữ liệu NER theo lĩnh vực (y tế, pháp lý hoặc tài chính). So sánh với mô hình nhỏ của spaCy. Ghi lại các kiểm tra rò rỉ dữ liệu và viết lại điều khiến bạn ngạc nhiên.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| NER | Trích xuất tên | Gán nhãn các span token bằng các loại (PERSON, ORG, GPE, DATE, ...). |
| BIO | Hệ gán nhãn | `B-X` bắt đầu, `I-X` tiếp tục, `O` bên ngoài. |
| BILOU | BIO tốt hơn | Thêm `L-X` (cuối), `U-X` (đơn vị) cho các ranh giới rõ hơn. |
| CRF | Bộ phân loại có cấu trúc | Mô hình hóa các chuyển tiếp giữa nhãn, không chỉ các phát xạ. Buộc các chuỗi hợp lệ. |
| Nested NER (NER lồng nhau) | Các thực thể chồng lấn | Một span là một thực thể khác với một span con của nó. BIO không thể biểu đạt điều này. |
| Entity-level F1 (F1 cấp thực thể) | Thước đo NER đúng | Span được dự đoán phải khớp span thực chính xác. F1 cấp token phóng đại accuracy. |

## Further Reading

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) — bài báo BiLSTM-CRF. Kinh điển.
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) — giới thiệu mẫu phân loại token đã trở thành tiêu chuẩn.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) — tham chiếu thực hành cho mọi thuộc tính trên `Doc.ents` và `Span`.
- [seqeval](https://github.com/chakki-works/seqeval) — thư viện thước đo đúng. Luôn dùng nó.
