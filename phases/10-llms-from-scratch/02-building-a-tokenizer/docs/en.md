# Building a Tokenizer from Scratch

> Bài 01 cho bạn một món đồ chơi. Bài này cho bạn một vũ khí.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 10, Lesson 01 (Tokenizers: BPE, WordPiece, SentencePiece)
**Time:** ~90 minutes

## Learning Objectives

- Xây dựng một tokenizer BPE cấp production xử lý Unicode, chuẩn hóa khoảng trắng và token đặc biệt
- Triển khai phương án dự phòng cấp byte để tokenizer có thể mã hóa bất kỳ đầu vào nào (gồm emoji, CJK và mã) mà không có token không biết
- Thêm các mẫu regex tiền token hóa tách văn bản ở ranh giới từ trước khi áp dụng các phép gộp BPE
- Huấn luyện một tokenizer tùy chỉnh trên một corpus và đánh giá tỷ lệ nén của nó so với tiktoken trên văn bản đa ngôn ngữ

## The Problem

Tokenizer BPE của bạn từ Bài 01 hoạt động trên văn bản tiếng Anh. Giờ ném tiếng Nhật vào nó. Hoặc emoji. Hoặc mã Python trộn tab và khoảng trắng.

Nó hỏng.

Không phải vì BPE sai -- vì triển khai chưa đầy đủ. Một tokenizer production xử lý byte thô trong bất kỳ mã hóa nào, chuẩn hóa Unicode trước khi tách, quản lý các token đặc biệt không bao giờ được gộp, nối tiền token hóa với tách từ con, và làm tất cả đủ nhanh để không gây nghẽn một pipeline huấn luyện xử lý 15 nghìn tỷ token.

Tokenizer GPT-2 có 50,257 token. Llama 3 có 128,256. GPT-4 có khoảng 100,000. Đây không phải các con số đồ chơi. Các bảng gộp sau các từ vựng đó được huấn luyện trên hàng trăm gigabyte văn bản, và bộ máy xung quanh -- chuẩn hóa, tiền token hóa, chèn token đặc biệt, định dạng chat template -- là thứ phân biệt một tokenizer xử lý "hello world" với một tokenizer xử lý toàn bộ internet.

Bạn sẽ xây dựng bộ máy đó.

## The Concept

### The Full Pipeline

Một tokenizer production không phải một thuật toán. Nó là một pipeline năm giai đoạn, mỗi giai đoạn giải một bài toán khác.

```mermaid
graph LR
    A[Raw Text] --> B[Normalize]
    B --> C[Pre-Tokenize]
    C --> D[BPE Merge]
    D --> E[Special Tokens]
    E --> F[Token IDs]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style B fill:#1a1a2e,stroke:#e94560,color:#fff
    style C fill:#1a1a2e,stroke:#e94560,color:#fff
    style D fill:#1a1a2e,stroke:#e94560,color:#fff
    style E fill:#1a1a2e,stroke:#e94560,color:#fff
    style F fill:#1a1a2e,stroke:#e94560,color:#fff
```

Mỗi giai đoạn có một công việc cụ thể:

| Giai đoạn | Nó làm gì | Vì sao quan trọng |
|-------|-------------|----------------|
| Chuẩn hóa | Unicode NFKC, chữ thường tùy chọn, bỏ dấu tùy chọn | Chữ ghép "fi" (U+FB01) thành "fi" (hai ký tự). Không có điều này, cùng từ nhận các token khác nhau. |
| Tiền token hóa | Tách văn bản thành các khối trước BPE | Ngăn BPE gộp xuyên ranh giới từ. "the cat" không bao giờ nên tạo một token "e c". |
| Gộp BPE | Áp dụng các quy tắc gộp đã học lên các chuỗi byte | Phần nén cốt lõi. Biến byte thô thành token từ con. |
| Token đặc biệt | Chèn [BOS], [EOS], [PAD], các dấu chat template | Các token này có ID cố định. Chúng không bao giờ tham gia các phép gộp BPE. Mô hình cần chúng cho cấu trúc. |
| Ánh xạ ID | Chuyển chuỗi token thành ID số nguyên | Mô hình thấy số nguyên, không phải chuỗi. |

### Byte-Level BPE

Tokenizer Bài 01 hoạt động trên byte UTF-8. Đó là quyết định đúng. Nhưng chúng ta bỏ qua một điều quan trọng: điều gì xảy ra khi các byte đó không phải UTF-8 hợp lệ?

BPE cấp byte giải quyết điều này bằng cách coi mọi giá trị byte có thể (0-255) là một token hợp lệ. Từ vựng cơ sở của bạn có đúng 256 mục. Bất kỳ file nào -- văn bản, nhị phân, hỏng -- đều có thể được token hóa mà không tạo ra token không biết.

GPT-2 thêm một thủ thuật: ánh xạ mỗi byte sang một ký tự Unicode in được để từ vựng vẫn đọc được bởi con người. Byte 0x20 (khoảng trắng) trở thành ký tự "G" trong ánh xạ của họ. Điều này thuần túy hình thức. Thuật toán không quan tâm.

Sức mạnh thực sự: BPE cấp byte xử lý mọi ngôn ngữ trên trái đất. Mỗi ký tự tiếng Trung là 3 byte UTF-8. Tiếng Nhật có thể là 3-4 byte. Tiếng Ả Rập, Devanagari, emoji -- tất cả chỉ là các chuỗi byte. Thuật toán BPE tìm các mẫu trong các chuỗi byte này chính xác như cách nó tìm mẫu trong các byte ASCII tiếng Anh.

### Pre-Tokenization

Trước khi BPE chạm vào văn bản, bạn cần tách nó thành các khối. Điều này ngăn thuật toán gộp tạo các token trải qua ranh giới từ.

GPT-2 dùng một mẫu regex để tách văn bản:

```
'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
```

Mẫu này tách các dạng rút gọn ("don't" thành "don" + "'t"), từ có khoảng trắng đầu tùy chọn, số, dấu câu và khoảng trắng. Khoảng trắng đầu được giữ gắn với từ -- nên "the cat" trở thành [" the", " cat"], không phải ["the", " ", "cat"].

Llama dùng SentencePiece, bỏ qua regex hoàn toàn. Nó coi luồng byte thô là một chuỗi dài và để thuật toán BPE tìm ra các ranh giới. Điều này đơn giản hơn nhưng cho BPE nhiều tự do hơn để tạo token xuyên từ.

Lựa chọn này quan trọng. Regex GPT-2 ngăn tokenizer học rằng "the" ở cuối một từ và "the" ở đầu từ tiếp theo nên gộp lại. SentencePiece cho phép, đôi khi tạo nén hiệu quả hơn nhưng token ít dễ diễn giải hơn.

### Special Tokens

Mọi tokenizer production dành riêng ID token cho các dấu cấu trúc:

| Token | Mục đích | Được dùng bởi |
|-------|---------|---------|
| `[BOS]` / `<s>` | Đầu chuỗi | Llama 3, GPT |
| `[EOS]` / `</s>` | Cuối chuỗi | Mọi mô hình |
| `[PAD]` | Đệm để căn chỉnh batch | BERT, T5 |
| `[UNK]` | Token không biết (BPE cấp byte loại bỏ điều này) | BERT, WordPiece |
| `<\|im_start\|>` | Bắt đầu ranh giới tin nhắn chat | ChatGPT, Qwen |
| `<\|im_end\|>` | Kết thúc ranh giới tin nhắn chat | ChatGPT, Qwen |
| `<\|user\|>` | Dấu lượt người dùng | Llama 3 |
| `<\|assistant\|>` | Dấu lượt trợ lý | Llama 3 |

Token đặc biệt không bao giờ bị BPE tách. Chúng được khớp chính xác trước khi thuật toán gộp chạy, thay bằng ID cố định, và văn bản xung quanh được token hóa bình thường.

### Chat Templates

Đây là nơi hầu hết mọi người bối rối và hầu hết triển khai hỏng.

Khi bạn gửi tin nhắn đến một mô hình chat, API nhận một danh sách tin nhắn:

```
[
  {"role": "system", "content": "You are helpful."},
  {"role": "user", "content": "Hello"},
  {"role": "assistant", "content": "Hi there!"}
]
```

Mô hình không thấy JSON. Nó thấy một chuỗi token phẳng. Chat template chuyển tin nhắn thành chuỗi phẳng đó bằng token đặc biệt. Mỗi mô hình làm điều này khác nhau:

```
Llama 3:
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are helpful.<|eot_id|><|start_header_id|>user<|end_header_id|>

Hello<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Hi there!<|eot_id|>

ChatGPT:
<|im_start|>system
You are helpful.<|im_end|>
<|im_start|>user
Hello<|im_end|>
<|im_start|>assistant
Hi there!<|im_end|>
```

Làm sai template và mô hình tạo rác. Nó được huấn luyện trên đúng một định dạng. Bất kỳ sai lệch nào -- thiếu một xuống dòng, đảo một token, thêm một khoảng trắng -- đưa đầu vào ra ngoài phân phối huấn luyện.

### Speed

Python quá chậm cho token hóa production.

tiktoken (OpenAI) được viết bằng Rust với binding Python. HuggingFace tokenizers cũng là Rust. SentencePiece là C++. Chúng đạt tăng tốc 10-100x so với Python thuần.

Để hình dung: token hóa 15 nghìn tỷ token cho huấn luyện trước Llama 3 ở 1 triệu token mỗi giây (Python nhanh) sẽ mất 174 ngày. Ở 100 triệu token mỗi giây (Rust), mất 1.7 ngày.

Bạn đang xây dựng bằng Python để hiểu thuật toán. Trong production, bạn sẽ dùng một triển khai được biên dịch và chỉ chạm vào wrapper Python.

```figure
weight-tying
```

## Build It

### Step 1: Byte-Level Encoding

Nền tảng. Chuyển bất kỳ chuỗi nào thành một chuỗi byte, ánh xạ mỗi byte sang một ký tự in được để hiển thị, và đảo ngược quá trình.

```python
def bytes_to_tokens(text):
    return list(text.encode("utf-8"))

def tokens_to_text(token_bytes):
    return bytes(token_bytes).decode("utf-8", errors="replace")
```

Kiểm thử trên văn bản đa ngôn ngữ để thấy số byte:

```python
texts = [
    ("English", "hello"),
    ("Chinese", "你好"),
    ("Emoji", "🔥"),
    ("Mixed", "hello你好🔥"),
]

for label, text in texts:
    b = bytes_to_tokens(text)
    print(f"{label}: {len(text)} chars -> {len(b)} bytes -> {b}")
```

"hello" là 5 byte. "你好" là 6 byte (3 mỗi ký tự). Emoji ngọn lửa là 4 byte. Tokenizer cấp byte không quan tâm đó là ngôn ngữ nào. Byte là byte.

### Step 2: Pre-Tokenizer with Regex

Tách văn bản thành các khối bằng mẫu regex GPT-2. Mỗi khối được BPE token hóa độc lập.

```python
import re

try:
    import regex
    GPT2_PATTERN = regex.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+"""
    )
except ImportError:
    GPT2_PATTERN = re.compile(
        r"""'(?:[sdmt]|ll|ve|re)| ?[a-zA-Z]+| ?[0-9]+| ?[^\s\w]+|\s+(?!\S)|\s+"""
    )

def pre_tokenize(text):
    return [match.group() for match in GPT2_PATTERN.finditer(text)]
```

Mô-đun `regex` hỗ trợ các escape thuộc tính Unicode (`\p{L}` cho chữ cái, `\p{N}` cho số). Mô-đun thư viện chuẩn `re` không hỗ trợ, nên chúng ta quay về các lớp ký tự ASCII. Với tokenizer đa ngôn ngữ production, cài `regex`.

Thử nó:

```python
print(pre_tokenize("Hello, world! Don't stop."))
# ['Hello', ',', ' world', '!', ' Don', "'t", ' stop', '.']
```

Dấu cách đứng đầu vẫn gắn với từ theo sau nó. Từ đầu tiên không có dấu cách trước nó, vì vậy phần của nó là `Hello`. Các dạng rút gọn tách tại dấu nháy đơn. Dấu câu trở thành một phần riêng. BPE sẽ không bao giờ gộp các token qua những ranh giới này.

### Step 3: BPE on Byte Sequences

Thuật toán cốt lõi từ Bài 01, nhưng giờ hoạt động độc lập trên các khối đã tiền token hóa.

```python
from collections import Counter

def get_byte_pairs(chunks):
    pairs = Counter()
    for chunk in chunks:
        byte_seq = list(chunk.encode("utf-8"))
        for i in range(len(byte_seq) - 1):
            pairs[(byte_seq[i], byte_seq[i + 1])] += 1
    return pairs

def apply_merge(byte_seq, pair, new_id):
    merged = []
    i = 0
    while i < len(byte_seq):
        if i < len(byte_seq) - 1 and byte_seq[i] == pair[0] and byte_seq[i + 1] == pair[1]:
            merged.append(new_id)
            i += 2
        else:
            merged.append(byte_seq[i])
            i += 1
    return merged
```

### Step 4: Special Token Handling

Token đặc biệt cần khớp chính xác và ID cố định. Chúng bỏ qua BPE hoàn toàn.

```python
class SpecialTokenHandler:
    def __init__(self):
        self.special_tokens = {}
        self.pattern = None

    def add_token(self, token_str, token_id):
        self.special_tokens[token_str] = token_id
        escaped = [re.escape(t) for t in sorted(self.special_tokens.keys(), key=len, reverse=True)]
        self.pattern = re.compile("|".join(escaped))

    def split_with_specials(self, text):
        if not self.pattern:
            return [(text, False)]
        parts = []
        last_end = 0
        for match in self.pattern.finditer(text):
            if match.start() > last_end:
                parts.append((text[last_end:match.start()], False))
            parts.append((match.group(), True))
            last_end = match.end()
        if last_end < len(text):
            parts.append((text[last_end:], False))
        return parts
```

### Step 5: Full Tokenizer Class

Nối mọi thứ lại: chuẩn hóa, tách theo token đặc biệt, tiền token hóa, gộp BPE, ánh xạ sang ID.

```python
import unicodedata

class ProductionTokenizer:
    def __init__(self):
        self.merges = {}
        self.vocab = {i: bytes([i]) for i in range(256)}
        self.special_handler = SpecialTokenHandler()
        self.next_id = 256

    def normalize(self, text):
        return unicodedata.normalize("NFKC", text)

    def train(self, text, num_merges):
        text = self.normalize(text)
        chunks = pre_tokenize(text)
        chunk_bytes = [list(chunk.encode("utf-8")) for chunk in chunks]

        for i in range(num_merges):
            pairs = Counter()
            for seq in chunk_bytes:
                for j in range(len(seq) - 1):
                    pairs[(seq[j], seq[j + 1])] += 1
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            new_id = self.next_id
            self.next_id += 1
            self.merges[best] = new_id
            self.vocab[new_id] = self.vocab[best[0]] + self.vocab[best[1]]
            chunk_bytes = [apply_merge(seq, best, new_id) for seq in chunk_bytes]

    def add_special_token(self, token_str):
        token_id = self.next_id
        self.next_id += 1
        self.special_handler.add_token(token_str, token_id)
        self.vocab[token_id] = token_str.encode("utf-8")
        return token_id

    def encode(self, text):
        text = self.normalize(text)
        parts = self.special_handler.split_with_specials(text)
        all_ids = []
        for part_text, is_special in parts:
            if is_special:
                all_ids.append(self.special_handler.special_tokens[part_text])
            else:
                for chunk in pre_tokenize(part_text):
                    byte_seq = list(chunk.encode("utf-8"))
                    for pair, new_id in self.merges.items():
                        byte_seq = apply_merge(byte_seq, pair, new_id)
                    all_ids.extend(byte_seq)
        return all_ids

    def decode(self, ids):
        byte_parts = []
        for token_id in ids:
            if token_id in self.vocab:
                byte_parts.append(self.vocab[token_id])
        return b"".join(byte_parts).decode("utf-8", errors="replace")

    def vocab_size(self):
        return len(self.vocab)
```

### Step 6: Multilingual Test

Phép thử thực. Ném tiếng Anh, tiếng Trung, emoji và mã vào nó.

```python
corpus = (
    "The quick brown fox jumps over the lazy dog. "
    "The quick brown fox runs through the forest. "
    "Machine learning models process natural language. "
    "Deep learning transforms how we build software. "
    "def train(model, data): return model.fit(data) "
    "def predict(model, x): return model(x) "
)

tok = ProductionTokenizer()
tok.train(corpus, num_merges=50)

bos = tok.add_special_token("<|begin|>")
eos = tok.add_special_token("<|end|>")

test_texts = [
    "The quick brown fox.",
    "你好世界",
    "Hello 🌍 World",
    "def foo(x): return x + 1",
    f"<|begin|>Hello<|end|>",
]

for text in test_texts:
    ids = tok.encode(text)
    decoded = tok.decode(ids)
    print(f"Input:   {text}")
    print(f"Tokens:  {len(ids)} ids")
    print(f"Decoded: {decoded}")
    print()
```

Mỗi ký tự tiếng Trung tạo 3 byte. Emoji tạo 4 byte. Không thứ nào làm tokenizer sập. Không thứ nào tạo token không biết. Đó là sức mạnh của BPE cấp byte.

## Use It

### Comparing Real Tokenizers

Tải các tokenizer thực từ Llama 3, GPT-4 và Mistral. Xem mỗi cái xử lý cùng đoạn văn đa ngôn ngữ thế nào.

```python
import tiktoken

gpt4_enc = tiktoken.get_encoding("cl100k_base")

test_paragraph = "Machine learning is powerful. 机器学习很强大。 L'apprentissage automatique est puissant. 🤖💪"

tokens = gpt4_enc.encode(test_paragraph)
pieces = [gpt4_enc.decode([t]) for t in tokens]
print(f"GPT-4 ({len(tokens)} tokens): {pieces}")
```

```python
from transformers import AutoTokenizer

llama_tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
mistral_tok = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")

for name, tok in [("Llama 3", llama_tok), ("Mistral", mistral_tok)]:
    tokens = tok.encode(test_paragraph)
    pieces = tok.convert_ids_to_tokens(tokens)
    print(f"{name} ({len(tokens)} tokens): {pieces[:20]}...")
```

Bạn sẽ thấy số token khác nhau cho cùng văn bản. Llama 3 với từ vựng 128K mạnh hơn trong gộp các mẫu phổ biến. GPT-4 với 100K nằm giữa. Mistral với 32K tạo nhiều token hơn nhưng có lớp embedding nhỏ hơn.

Đánh đổi luôn giống nhau: từ vựng lớn hơn nghĩa là chuỗi ngắn hơn nhưng nhiều tham số hơn.

## Ship It

Bài học này tạo ra một prompt để xây dựng và gỡ lỗi tokenizer production. Xem `outputs/prompt-tokenizer-builder.md`.

## Exercises

1. **Dễ:** Thêm một phương thức `get_token_bytes(id)` hiển thị các byte thô cho bất kỳ ID token nào. Dùng nó để kiểm tra các token gộp phổ biến nhất thực sự biểu diễn gì.
2. **Trung bình:** Triển khai bộ tiền token hóa kiểu Llama tách theo khoảng trắng và chữ số nhưng giữ khoảng trắng đầu. So sánh từ vựng của nó với cách regex GPT-2 trên cùng corpus.
3. **Khó:** Thêm một phương thức chat template nhận một danh sách tin nhắn `{"role": ..., "content": ...}` và tạo chuỗi token đúng cho định dạng chat Llama 3. Kiểm thử nó với triển khai HuggingFace.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Byte-level BPE (BPE cấp byte) | "Tokenizer hoạt động trên byte" | BPE với từ vựng cơ sở 256 giá trị byte -- xử lý bất kỳ đầu vào nào mà không có token không biết |
| Pre-tokenization (Tiền token hóa) | "Tách trước BPE" | Tách dựa trên regex hoặc quy tắc ngăn BPE gộp xuyên ranh giới từ |
| NFKC normalization (Chuẩn hóa NFKC) | "Dọn Unicode" | Phân rã chuẩn tắc rồi tổ hợp tương thích -- chữ ghép "fi" thành "fi", "A" toàn chiều rộng thành "A" |
| Chat template (Mẫu chat) | "Cách tin nhắn thành token" | Định dạng chính xác để chuyển một danh sách tin nhắn vai trò/nội dung thành một chuỗi token phẳng -- riêng theo mô hình và phải khớp định dạng huấn luyện |
| Special tokens (Token đặc biệt) | "Token điều khiển" | ID token dành riêng bỏ qua BPE -- [BOS], [EOS], [PAD], các dấu chat -- khớp chính xác trước gộp |
| Fertility | "Token mỗi từ" | Tỷ lệ token đầu ra trên từ đầu vào -- 1.3 cho tiếng Anh trong GPT-4, 2-3 cho tiếng Hàn, cao hơn nghĩa là lãng phí ngữ cảnh |
| tiktoken | "Tokenizer OpenAI" | Triển khai BPE Rust với binding Python -- nhanh hơn Python thuần 10-100x |
| Merge table (Bảng gộp) | "Từ vựng" | Danh sách có thứ tự các phép gộp cặp byte học trong huấn luyện -- đây CHÍNH LÀ kiến thức được học của tokenizer |

## Further Reading

- [OpenAI tiktoken source](https://github.com/openai/tiktoken) -- triển khai BPE Rust được GPT-3.5/4 dùng
- [HuggingFace tokenizers](https://github.com/huggingface/tokenizers) -- thư viện tokenizer Rust hỗ trợ BPE, WordPiece, Unigram
- [Llama 3 paper (Meta, 2024)](https://arxiv.org/abs/2407.21783) -- chi tiết về từ vựng 128K và huấn luyện tokenizer
- [SentencePiece (Kudo & Richardson, 2018)](https://arxiv.org/abs/1808.06226) -- token hóa độc lập ngôn ngữ
- [GPT-2 tokenizer source](https://github.com/openai/gpt-2/blob/master/src/encoder.py) -- ánh xạ byte sang Unicode gốc
