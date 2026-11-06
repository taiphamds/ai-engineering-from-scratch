# Text Processing — Tokenization, Stemming, Lemmatization

> Ngôn ngữ là liên tục. Mô hình là rời rạc. Tiền xử lý là cây cầu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## The Problem

Một mô hình không thể đọc "Những con mèo đang chạy." Nó đọc các số nguyên.

Mọi hệ thống NLP đều mở đầu với cùng ba câu hỏi. Một từ bắt đầu ở đâu. Gốc của từ là gì. Làm thế nào chúng ta coi "run", "running", "ran" là cùng một thứ khi điều đó hữu ích, và là những thứ khác nhau khi điều đó không hữu ích.

Làm sai tokenization và mô hình học từ rác. Nếu tokenizer của bạn coi `don't` là một token nhưng `do n't` là hai, phân phối huấn luyện bị chia tách. Nếu stemmer của bạn gộp `organization` và `organ` thành cùng một gốc từ, mô hình hóa chủ đề chết. Nếu lemmatizer của bạn cần ngữ cảnh từ loại nhưng bạn không truyền vào, các động từ bị coi là danh từ.

Bài học này xây dựng ba bước tiền xử lý từ đầu, rồi cho thấy cách NLTK và spaCy làm cùng công việc để bạn có thể thấy các đánh đổi.

## The Concept

Ba phép toán. Mỗi phép có một công việc và một dạng lỗi.

**Tokenization** chia một chuỗi thành các token. "Token" được cố ý để mơ hồ vì độ hạt phù hợp phụ thuộc vào tác vụ. Cấp từ cho NLP cổ điển. Từ con cho transformer. Ký tự cho các ngôn ngữ không có khoảng trắng.

**Stemming** cắt các hậu tố bằng quy tắc. Nhanh, mạnh tay, ngớ ngẩn. `running -> run`. `organization -> organ`. Trường hợp thứ hai đó là dạng lỗi.

**Lemmatization** đưa một từ về dạng từ điển của nó bằng kiến thức ngữ pháp. Chậm hơn, chính xác, cần một bảng tra cứu hoặc bộ phân tích hình thái. `ran -> run` (cần biết "ran" là thì quá khứ của "run"). `better -> good` (cần biết các dạng so sánh hơn).

Quy tắc kinh nghiệm. Lấy gốc từ khi tốc độ quan trọng và bạn có thể chấp nhận nhiễu (lập chỉ mục tìm kiếm, phân loại sơ bộ). Đưa về dạng từ điển khi ý nghĩa quan trọng (hỏi đáp, tìm kiếm ngữ nghĩa, bất kỳ thứ gì người dùng sẽ đọc).

```figure
edit-distance
```

## Build It

### Step 1: a regex word tokenizer

Tokenizer hữu ích đơn giản nhất chia tại các ký tự không phải chữ hoặc số trong khi giữ dấu câu thành các token riêng. Không hoàn hảo, không phải cuối cùng, nhưng chạy trong một dòng.

```python
import re

def tokenize(text):
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?|[0-9]+|[^\sA-Za-z0-9]", text)
```

Ba mẫu theo thứ tự ưu tiên. Các từ với dấu nháy đơn bên trong tùy chọn (`don't`, `it's`). Các số thuần túy. Bất kỳ ký tự đơn nào không phải khoảng trắng và không phải chữ hoặc số đều là một token độc lập (dấu câu).

```python
>>> tokenize("The cats weren't running at 3pm.")
['The', 'cats', "weren't", 'running', 'at', '3', 'pm', '.']
```

Các dạng lỗi cần chú ý. `3pm` tách thành `['3', 'pm']` vì chúng ta luân phiên giữa các dãy chữ cái và các dãy chữ số. Đủ tốt cho hầu hết tác vụ. URL, email, hashtag đều hỏng. Cho production, thêm các mẫu trước những mẫu tổng quát.

### Step 2: a Porter stemmer (step 1a only)

Thuật toán Porter đầy đủ có năm giai đoạn quy tắc. Chỉ riêng bước 1a đã bao phủ các hậu tố tiếng Anh thường gặp nhất và dạy mẫu này.

```python
def stem_step_1a(word):
    if word.endswith("sses"):
        return word[:-2]
    if word.endswith("ies"):
        return word[:-2]
    if word.endswith("ss"):
        return word
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word
```

```python
>>> [stem_step_1a(w) for w in ["caresses", "ponies", "caress", "cats"]]
['caress', 'poni', 'caress', 'cat']
```

Đọc các quy tắc từ trên xuống. Quy tắc `ies -> i` là lý do `ponies -> poni`, không phải `pony`. Porter thực có bước 1b sẽ sửa điều đó. Các quy tắc cạnh tranh. Các quy tắc trước thắng. Thứ tự quan trọng hơn bất kỳ quy tắc đơn lẻ nào.

### Step 3: a lookup-based lemmatizer

Lemmatization đúng nghĩa cần hình thái học. Một phiên bản giảng dạy có thể xử lý được sử dụng một bảng lemma nhỏ và một phương án dự phòng.

```python
LEMMA_TABLE = {
    ("running", "VERB"): "run",
    ("ran", "VERB"): "run",
    ("runs", "VERB"): "run",
    ("better", "ADJ"): "good",
    ("best", "ADJ"): "good",
    ("cats", "NOUN"): "cat",
    ("cat", "NOUN"): "cat",
    ("were", "VERB"): "be",
    ("was", "VERB"): "be",
    ("is", "VERB"): "be",
}

def lemmatize(word, pos):
    key = (word.lower(), pos)
    if key in LEMMA_TABLE:
        return LEMMA_TABLE[key]
    if pos == "VERB" and word.endswith("ing"):
        return word[:-3]
    if pos == "NOUN" and word.endswith("s"):
        return word[:-1]
    return word.lower()
```

```python
>>> lemmatize("running", "VERB")
'run'
>>> lemmatize("cats", "NOUN")
'cat'
>>> lemmatize("better", "ADJ")
'good'
>>> lemmatize("watched", "VERB")
'watched'
```

Trường hợp cuối là thời điểm giảng dạy then chốt. `watched` không có trong bảng của chúng ta và phương án dự phòng chỉ xử lý `ing`. Lemmatization thực bao phủ `ed`, các động từ bất quy tắc, tính từ so sánh hơn, số nhiều có biến đổi âm (`children -> child`). Đây là lý do các hệ thống production dùng WordNet, morphologizer của spaCy hoặc một bộ phân tích hình thái đầy đủ.

### Step 4: pipe them together

```python
def preprocess(text, pos_tagger=None):
    tokens = tokenize(text)
    stems = [stem_step_1a(t.lower()) for t in tokens]
    tags = pos_tagger(tokens) if pos_tagger else [(t, "NOUN") for t in tokens]
    lemmas = [lemmatize(word, pos) for word, pos in tags]
    return {"tokens": tokens, "stems": stems, "lemmas": lemmas}
```

Mảnh còn thiếu là một bộ gán nhãn POS. Phase 5 · 07 (POS Tagging) xây dựng một bộ. Hiện tại, mặc định mọi thứ là `NOUN` và thừa nhận hạn chế.

## Use It

NLTK và spaCy cung cấp các phiên bản production. Mỗi thư viện chỉ vài dòng.

### NLTK

```python
import nltk
nltk.download("punkt_tab")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger_eng")

from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk import pos_tag

text = "The cats were running."
tokens = word_tokenize(text)
stems = [PorterStemmer().stem(t) for t in tokens]
lemmatizer = WordNetLemmatizer()
tagged = pos_tag(tokens)


def nltk_pos_to_wordnet(tag):
    if tag.startswith("V"):
        return "v"
    if tag.startswith("J"):
        return "a"
    if tag.startswith("R"):
        return "r"
    return "n"


lemmas = [lemmatizer.lemmatize(t, nltk_pos_to_wordnet(tag)) for t, tag in tagged]
```

`word_tokenize` xử lý các dạng rút gọn, Unicode, các trường hợp biên mà regex của bạn bỏ sót. `PorterStemmer` chạy cả năm giai đoạn. `WordNetLemmatizer` cần nhãn POS được chuyển từ hệ Penn Treebank của NLTK sang tập viết tắt của WordNet. Phần kết nối chuyển đổi ở trên là phần mà hầu hết hướng dẫn bỏ qua.

### spaCy

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running.")

for token in doc:
    print(token.text, token.lemma_, token.pos_)
```

```
The      the     DET
cats     cat     NOUN
were     be      AUX
running  run     VERB
.        .       PUNCT
```

spaCy ẩn toàn bộ pipeline phía sau `nlp(text)`. Tokenization, gán nhãn POS và lemmatization đều chạy. Nhanh hơn NLTK ở quy mô lớn. Chính xác hơn ngay khi dùng. Đánh đổi là bạn không thể dễ dàng hoán đổi từng thành phần.

### When to pick which

| Tình huống | Chọn |
|-----------|------|
| Giảng dạy, nghiên cứu, hoán đổi thành phần | NLTK |
| Production, đa ngôn ngữ, tốc độ quan trọng | spaCy |
| Pipeline transformer (dù sao bạn cũng sẽ tokenize bằng tokenizer của mô hình) | Dùng `tokenizers` / `transformers` và bỏ qua tiền xử lý cổ điển |

### The two failure modes nobody warns you about

Hầu hết hướng dẫn dạy các thuật toán rồi dừng lại. Hai điều sẽ gây rắc rối cho một pipeline tiền xử lý thực, và chúng gần như không bao giờ được đề cập.

**Độ trôi khả năng tái lập.** NLTK và spaCy thay đổi hành vi tokenization và lemmatizer giữa các phiên bản. Thứ tạo ra `['do', "n't"]` trong spaCy 2.x có thể tạo ra `["don't"]` trong 3.x. Mô hình của bạn được huấn luyện trên một phân phối. Suy luận hiện chạy trên một phân phối khác. Độ chính xác âm thầm suy giảm và không ai biết tại sao. Ghim các phiên bản thư viện trong `requirements.txt`. Viết một kiểm thử hồi quy tiền xử lý cố định tokenization dự kiến của 20 câu mẫu. Chạy nó ở mỗi lần nâng cấp.

**Sự không khớp giữa huấn luyện / suy luận.** Huấn luyện với tiền xử lý mạnh tay (chuyển chữ thường, loại bỏ stopword, stemming), triển khai trên đầu vào thô của người dùng, nhìn hiệu năng sụp đổ. Đây là lỗi NLP production phổ biến nhất. Nếu bạn tiền xử lý khi huấn luyện, bạn phải chạy hàm giống hệt khi suy luận. Phát hành tiền xử lý dưới dạng một hàm bên trong gói mô hình, không phải dưới dạng một ô notebook mà nhóm phục vụ viết lại.

## Ship It

Một prompt tái sử dụng giúp các kỹ sư chọn chiến lược tiền xử lý mà không phải đọc ba giáo trình.

Lưu thành `outputs/prompt-preprocessing-advisor.md`:

```markdown
---
name: preprocessing-advisor
description: Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
phase: 5
lesson: 01
---

You advise on classical NLP preprocessing. Given a task description, you output:

1. Tokenization choice (regex, NLTK word_tokenize, spaCy, or transformer tokenizer). Explain why.
2. Whether to stem, lemmatize, both, or neither. Explain why.
3. Specific library calls. Name the functions. Quote the POS-tag translation if NLTK is involved.
4. One failure mode the user should test for.

Refuse to recommend stemming for user-visible text. Refuse to recommend lemmatization without POS tags. Flag non-English input as needing a different pipeline.
```

## Exercises

1. **Dễ.** Mở rộng `tokenize` để giữ URL thành các token đơn. Kiểm thử: `tokenize("Visit https://example.com today.")` phải tạo ra một token URL.
2. **Trung bình.** Triển khai bước 1b của Porter. Nếu một từ chứa một nguyên âm và kết thúc bằng `ed` hoặc `ing`, loại bỏ nó. Xử lý quy tắc phụ âm kép (`hopping -> hop`, không phải `hopp`).
3. **Khó.** Xây dựng một lemmatizer dùng WordNet làm bảng tra cứu nhưng quay về Porter stemmer của bạn khi WordNet không có mục tương ứng. Đo độ chính xác trên một ngữ liệu được gán nhãn so với WordNet thuần và Porter thuần.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Token | Một từ | Bất kỳ đơn vị nào mô hình tiêu thụ. Có thể là từ, từ con, ký tự hoặc byte. |
| Stem (Gốc từ) | Gốc của một từ | Kết quả của việc cắt hậu tố dựa trên quy tắc. Không phải lúc nào cũng là một từ thực. |
| Lemma (Dạng từ điển) | Dạng từ điển | Dạng bạn sẽ tra cứu. Cần ngữ cảnh ngữ pháp để tính đúng. |
| POS tag (Nhãn từ loại) | Từ loại | Loại như NOUN, VERB, ADJ. Cần để đưa về dạng từ điển chính xác. |
| Morphology (Hình thái học) | Các quy tắc hình dạng từ | Cách một từ đổi dạng dựa trên thì, số, cách. Lemmatization phụ thuộc vào nó. |

## Further Reading

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) — bài báo gốc, năm trang, vẫn là lời giải thích rõ ràng nhất.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) — cách một pipeline thực được kết nối.
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) — các trường hợp biên tokenization bạn còn chưa nghĩ tới.
