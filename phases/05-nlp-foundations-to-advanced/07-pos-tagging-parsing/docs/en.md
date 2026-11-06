# POS Tagging and Syntactic Parsing

> Ngữ pháp từng lỗi thời trong một thời gian. Rồi mọi pipeline LLM cần xác thực trích xuất có cấu trúc, và nó quay trở lại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## The Problem

Bài 01 hứa rằng lemmatization cần một nhãn từ loại. Không biết `running` là một động từ, một lemmatizer không thể đưa nó về `run`. Không biết `better` là một tính từ, nó không thể đưa về `good`.

Lời hứa đó ẩn một phân ngành đầy đủ. Gán nhãn từ loại gán các loại ngữ pháp. Phân tích cú pháp khôi phục cấu trúc cây của câu: từ nào bổ nghĩa cho từ nào, động từ nào chi phối những tham tố nào. NLP cổ điển dành hai mươi năm tinh chỉnh cả hai. Rồi deep learning gộp chúng thành một tác vụ phân loại token trên một transformer được tiền huấn luyện, và cộng đồng nghiên cứu chuyển đi.

Cộng đồng ứng dụng thì không. Mọi pipeline trích xuất có cấu trúc vẫn dùng POS và cây phụ thuộc bên dưới. JSON do LLM sinh được xác thực theo các ràng buộc ngữ pháp. Các hệ thống hỏi đáp phân rã truy vấn bằng các phân tích phụ thuộc. Các bộ đánh giá chất lượng dịch máy kiểm tra sự căn chỉnh của các cây phân tích.

Đáng để biết. Bài học này giới thiệu các tập nhãn, các baseline và điểm mà bạn ngừng triển khai từ đầu để gọi spaCy.

## The Concept

**Gán nhãn POS** gán cho mỗi token một loại ngữ pháp. Tập nhãn **Penn Treebank (PTB)** là mặc định tiếng Anh. 36 nhãn với các phân biệt mà người đọc thông thường thấy cầu kỳ: `NN` danh từ số ít, `NNS` danh từ số nhiều, `NNP` danh từ riêng số ít, `VBD` động từ thì quá khứ, `VBZ` động từ ngôi thứ 3 số ít hiện tại, vân vân. Tập nhãn **Universal Dependencies (UD)** thô hơn (17 nhãn) và không phụ thuộc ngôn ngữ; nó trở thành mặc định cho công việc xuyên ngôn ngữ.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Phân tích cú pháp** tạo ra một cây. Hai kiểu chính:

- **Phân tích thành tố.** Các cụm danh từ, cụm động từ, cụm giới từ lồng vào nhau. Đầu ra là một cây các loại không kết thúc (NP, VP, PP) với các từ làm lá.
- **Phân tích phụ thuộc.** Mỗi từ có một từ trung tâm duy nhất mà nó phụ thuộc, được gán nhãn bằng một quan hệ ngữ pháp. Đầu ra là một cây mà mọi cạnh là một bộ ba (trung tâm, phụ thuộc, quan hệ).

Phân tích phụ thuộc thắng trong những năm 2010 vì nó khái quát gọn gàng giữa các ngôn ngữ, đặc biệt những ngôn ngữ có thứ tự từ tự do.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```

```figure
pos-tagger
```

```figure
dependency-arcs
```

## Build It

### Step 1: most-frequent-tag baseline

Bộ gán nhãn POS ngớ ngẩn nhất nhưng hoạt động được. Với mỗi từ, dự đoán nhãn nó có thường xuyên nhất trong huấn luyện.

```python
from collections import Counter, defaultdict


def train_mft(train_examples):
    word_tag_counts = defaultdict(Counter)
    all_tags = Counter()
    for tokens, tags in train_examples:
        for token, tag in zip(tokens, tags):
            word_tag_counts[token.lower()][tag] += 1
            all_tags[tag] += 1
    word_best = {w: c.most_common(1)[0][0] for w, c in word_tag_counts.items()}
    default_tag = all_tags.most_common(1)[0][0]
    return word_best, default_tag


def predict_mft(tokens, word_best, default_tag):
    return [word_best.get(t.lower(), default_tag) for t in tokens]
```

Trên ngữ liệu Brown, baseline này đạt accuracy ~85%. Không tốt, nhưng là mức sàn mà không mô hình nghiêm túc nào nên thấp hơn.

### Step 2: bigram HMM tagger

Mô hình hóa xác suất đồng thời của chuỗi:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

Hai bảng: các xác suất chuyển tiếp (nhãn khi biết nhãn trước), các xác suất phát xạ (từ khi biết nhãn). Ước lượng cả hai từ các số đếm với làm trơn Laplace. Giải mã bằng Viterbi (quy hoạch động trên lưới nhãn).

```python
import math


def train_hmm(train_examples, alpha=0.01):
    transitions = defaultdict(Counter)
    emissions = defaultdict(Counter)
    tags = set()
    vocab = set()

    for tokens, ts in train_examples:
        prev = "<BOS>"
        for token, tag in zip(tokens, ts):
            transitions[prev][tag] += 1
            emissions[tag][token.lower()] += 1
            tags.add(tag)
            vocab.add(token.lower())
            prev = tag
        transitions[prev]["<EOS>"] += 1

    return transitions, emissions, tags, vocab


def log_prob(table, given, key, smooth_denom, alpha):
    return math.log((table[given].get(key, 0) + alpha) / smooth_denom)


def viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01):
    tags_list = list(tags)
    n = len(tokens)
    V = [[0.0] * len(tags_list) for _ in range(n)]
    back = [[0] * len(tags_list) for _ in range(n)]

    for j, tag in enumerate(tags_list):
        em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
        tr_denom = sum(transitions["<BOS>"].values()) + alpha * (len(tags_list) + 1)
        tr = log_prob(transitions, "<BOS>", tag, tr_denom, alpha)
        em = log_prob(emissions, tag, tokens[0].lower(), em_denom, alpha)
        V[0][j] = tr + em
        back[0][j] = 0

    for i in range(1, n):
        for j, tag in enumerate(tags_list):
            em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
            em = log_prob(emissions, tag, tokens[i].lower(), em_denom, alpha)
            best_prev = 0
            best_score = -1e30
            for k, prev_tag in enumerate(tags_list):
                tr_denom = sum(transitions[prev_tag].values()) + alpha * (len(tags_list) + 1)
                tr = log_prob(transitions, prev_tag, tag, tr_denom, alpha)
                score = V[i - 1][k] + tr + em
                if score > best_score:
                    best_score = score
                    best_prev = k
            V[i][j] = best_score
            back[i][j] = best_prev

    last_best = max(range(len(tags_list)), key=lambda j: V[n - 1][j])
    path = [last_best]
    for i in range(n - 1, 0, -1):
        path.append(back[i][path[-1]])
    return [tags_list[j] for j in reversed(path)]
```

HMM bigram trên Brown đạt accuracy ~93%. Bước nhảy từ 85% lên 93% chủ yếu là các xác suất chuyển tiếp — mô hình học rằng `DET NOUN` phổ biến và `NOUN DET` hiếm.

### Step 3: why modern taggers beat this

Các xác suất chuyển tiếp + phát xạ có tính cục bộ. Chúng không thể nắm bắt rằng `saw` là danh từ trong "Tôi đã mua một cái cưa" nhưng là động từ trong "Tôi đã xem bộ phim." Một CRF với các đặc trưng tùy ý (hậu tố, hình dạng từ, từ trước và sau, bản thân từ) đạt ~97%. Một BiLSTM-CRF hoặc transformer đạt ~98%+.

Mức trần của tác vụ này do sự bất đồng giữa người chú giải quyết định. Những người chú giải đồng ý khoảng 97% số lần trên Penn Treebank. Các mô hình vượt 98% có lẽ đang overfit tập kiểm thử.

### Step 4: dependency parsing sketch

Phân tích phụ thuộc đầy đủ từ đầu nằm ngoài phạm vi; cách trình bày giáo trình kinh điển nằm trong Jurafsky và Martin. Hai họ cổ điển cần biết:

- Các bộ phân tích **dựa trên chuyển tiếp** (arc-eager, arc-standard) hoạt động như một bộ phân tích shift-reduce: chúng đọc token, đẩy chúng lên một ngăn xếp và áp dụng các hành động reduce tạo các cung. Giải mã tham lam nhanh. Triển khai kinh điển là MaltParser. Phiên bản nơ-ron hiện đại: bộ phân tích dựa trên chuyển tiếp của Chen và Manning.
- Các bộ phân tích **dựa trên đồ thị** (thuật toán Eisner, biaffine Dozat-Manning) chấm điểm mọi cạnh trung tâm-phụ thuộc có thể và chọn cây khung cực đại. Chậm hơn nhưng chính xác hơn.

Đối với hầu hết công việc ứng dụng, gọi spaCy:

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

Đọc cột `dep` từ dưới lên và cấu trúc ngữ pháp của câu tự xuất hiện.

## Use It

Mọi thư viện NLP production cung cấp các bộ gán nhãn POS và phân tích phụ thuộc như một phần của pipeline tiêu chuẩn.

- **spaCy** (`en_core_web_sm` / `md` / `lg` / `trf`). Nhanh, chính xác, tích hợp với tokenization + NER + lemmatization. `token.tag_` (Penn), `token.pos_` (UD), `token.dep_` (quan hệ phụ thuộc).
- **Stanford NLP (stanza)**. Sự kế thừa CoreNLP của Stanford. Tiên tiến nhất trên 60+ ngôn ngữ.
- **trankit**. Dựa trên transformer, accuracy UD tốt.
- **NLTK**. `pos_tag`. Dùng được, chậm, cũ hơn. Phù hợp để giảng dạy.

### Where this still matters in 2026

- **Lemmatization.** Bài 01 cần POS để đưa về dạng từ điển đúng. Luôn luôn.
- **Trích xuất có cấu trúc từ các đầu ra LLM.** Xác thực rằng một câu được sinh tôn trọng các ràng buộc ngữ pháp (ví dụ, hòa hợp chủ ngữ-động từ, các thành phần bổ nghĩa bắt buộc).
- **Cảm xúc theo khía cạnh.** Các phân tích phụ thuộc cho bạn biết tính từ nào bổ nghĩa danh từ nào.
- **Hiểu truy vấn.** "các phim do Wes Anderson đạo diễn có Bill Murray đóng" phân rã thành các ràng buộc có cấu trúc qua phân tích.
- **Chuyển giao xuyên ngôn ngữ.** Các nhãn UD và quan hệ phụ thuộc không phụ thuộc ngôn ngữ, cho phép phân tích có cấu trúc zero-shot các ngôn ngữ mới.
- **Các pipeline ít tính toán.** Nếu bạn không thể phát hành một transformer, POS + phân tích phụ thuộc + từ điển thực thể đưa bạn đi xa một cách đáng ngạc nhiên.

## Ship It

Lưu thành `outputs/skill-grammar-pipeline.md`:

```markdown
---
name: grammar-pipeline
description: Design a classical POS + dependency pipeline for a downstream NLP task.
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

Given a downstream task (information extraction, rewrite validation, query decomposition, lemmatization), you output:

1. Tagset to use. Penn Treebank for English-only legacy pipelines, Universal Dependencies for multilingual or cross-lingual.
2. Library. spaCy for most production, stanza for academic-grade multilingual, trankit for highest UD accuracy. Name the specific model ID.
3. Integration pattern. Show the 3-5 lines that call the library and consume the needed attributes (`.pos_`, `.dep_`, `.head`).
4. Failure mode to test. Noun-verb ambiguity (`saw`, `book`, `can`) and PP-attachment ambiguity are the classical traps. Sample 20 outputs and eyeball.

Refuse to recommend rolling your own parser. Building parsers from scratch is a research project, not an application task. Flag any pipeline that consumes POS tags without handling lowercase/uppercase variants as fragile.
```

## Exercises

1. **Dễ.** Dùng baseline nhãn thường gặp nhất trên một ngữ liệu gán nhãn nhỏ (ví dụ, tập con Brown của NLTK), đo accuracy trên các câu được giữ lại. Xác minh kết quả ~85%.
2. **Trung bình.** Huấn luyện HMM bigram ở trên và báo cáo precision/recall theo nhãn. HMM nhầm những nhãn nào nhiều nhất?
3. **Khó.** Dùng phân tích phụ thuộc của spaCy để trích xuất các bộ ba chủ ngữ-động từ-tân ngữ từ một mẫu 1000 câu. Đánh giá trên 50 bộ ba được gán nhãn thủ công. Ghi lại nơi việc trích xuất thất bại (thường là bị động, kết hợp đẳng lập và chủ ngữ bị lược).

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| POS tag (Nhãn từ loại) | Loại của từ | Loại ngữ pháp. PTB có 36; UD có 17. |
| Penn Treebank | Tập nhãn tiêu chuẩn | Riêng cho tiếng Anh. Các thì động từ và số danh từ chi tiết. |
| Universal Dependencies | Tập nhãn đa ngôn ngữ | Thô hơn PTB; trung lập ngôn ngữ; các mặc định cho công việc xuyên ngôn ngữ. |
| Dependency parse (Phân tích phụ thuộc) | Cây câu | Mỗi từ có một trung tâm, mỗi cạnh có một quan hệ ngữ pháp. |
| Viterbi | Quy hoạch động | Tìm chuỗi nhãn có xác suất cao nhất khi biết các phát xạ và chuyển tiếp. |

## Further Reading

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) — cách trình bày giáo trình kinh điển về POS và phân tích cú pháp.
- [Universal Dependencies project](https://universaldependencies.org/) — tập nhãn xuyên ngôn ngữ và bộ sưu tập treebank được mọi bộ phân tích đa ngôn ngữ sử dụng.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) — tham chiếu thực hành cho mọi thuộc tính được cung cấp trên `Token`.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) — bài báo đưa các bộ phân tích nơ-ron vào dòng chính.
