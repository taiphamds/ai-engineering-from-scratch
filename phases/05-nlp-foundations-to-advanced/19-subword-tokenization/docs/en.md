# Subword Tokenization — BPE, WordPiece, Unigram, SentencePiece

> Tokenizer từ nghẹn với các từ chưa thấy. Tokenizer ký tự làm độ dài chuỗi bùng nổ. Tokenizer từ con dung hòa hai bên. Mọi LLM hiện đại được phát hành dựa trên một tokenizer như vậy.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 5 · 04 (GloVe / FastText / Subword)
**Time:** ~60 minutes

## The Problem

Từ vựng của bạn có 50,000 từ. Một người dùng gõ "untokenizable". Tokenizer của bạn trả `[UNK]`. Mô hình giờ không có tín hiệu về từ đó. Tệ hơn: tài liệu ở phân vị thứ 90 trong ngữ liệu của bạn có 40 từ hiếm, nghĩa là 40 bit thông tin bị bỏ mỗi tài liệu.

Tokenization từ con giải quyết điều này. Các từ phổ biến vẫn là token đơn. Các từ hiếm phân rã thành các mảnh có ý nghĩa: `untokenizable` → `un`, `token`, `izable`. Dữ liệu huấn luyện bao phủ mọi thứ vì bất kỳ chuỗi nào cuối cùng cũng là một chuỗi byte.

Mọi LLM tiên phong năm 2026 được phát hành trên một trong ba thuật toán (BPE, Unigram, WordPiece), được bọc trong một trong ba thư viện (tiktoken, SentencePiece, HF Tokenizers). Bạn không thể phát hành một mô hình ngôn ngữ mà không chọn một.

## The Concept

![BPE vs Unigram vs WordPiece, character-by-character](../assets/subword-tokenization.svg)

**BPE (Byte-Pair Encoding).** Bắt đầu với một từ vựng cấp ký tự. Đếm mọi cặp liền kề. Gộp cặp thường gặp nhất thành một token mới. Lặp lại đến khi đạt kích thước từ vựng đích. Thuật toán chủ đạo: GPT-2/3/4, Llama, Gemma, Qwen2, Mistral.

**BPE cấp byte.** Cùng thuật toán nhưng trên các byte thô (256 token cơ sở) thay cho ký tự Unicode. Bảo đảm không có token `[UNK]` — mọi chuỗi byte đều mã hóa được. GPT-2 dùng 50,257 token (256 byte + 50,000 phép gộp + 1 đặc biệt).

**Unigram.** Bắt đầu với một từ vựng khổng lồ. Gán cho mỗi token một xác suất unigram. Lặp việc cắt tỉa các token mà việc loại bỏ chúng làm tăng log-likelihood ngữ liệu ít nhất. Có tính xác suất khi suy luận: có thể lấy mẫu các cách tokenization (hữu ích để tăng cường dữ liệu qua điều chuẩn từ con). Được dùng bởi T5, mBART, ALBERT, XLNet, Gemma.

**WordPiece.** Gộp các cặp tối đa hóa likelihood của ngữ liệu huấn luyện thay vì tần suất thô. Được dùng bởi BERT, DistilBERT, ELECTRA.

**SentencePiece so với tiktoken.** SentencePiece là thư viện *huấn luyện* các từ vựng (BPE hoặc Unigram) trực tiếp trên văn bản Unicode thô, mã hóa khoảng trắng thành `▁`. tiktoken là *bộ mã hóa* nhanh của OpenAI trên các từ vựng có sẵn; nó không huấn luyện.

Quy tắc kinh nghiệm:

- **Huấn luyện một từ vựng mới:** SentencePiece (đa ngôn ngữ, không tiền tokenization) hoặc HF Tokenizers.
- **Suy luận nhanh trên từ vựng GPT:** tiktoken (cl100k_base, o200k_base).
- **Cả hai:** HF Tokenizers — một thư viện, huấn luyện + phục vụ.

```figure
bpe-merge
```

## Build It

### Step 1: BPE from scratch

Xem `code/main.py`. Vòng lặp:

```python
def train_bpe(corpus, num_merges):
    vocab = {tuple(word) + ("</w>",): count for word, count in corpus.items()}
    merges = []
    for _ in range(num_merges):
        pairs = Counter()
        for symbols, freq in vocab.items():
            for a, b in zip(symbols, symbols[1:]):
                pairs[(a, b)] += freq
        if not pairs:
            break
        best = pairs.most_common(1)[0][0]
        merges.append(best)
        vocab = apply_merge(vocab, best)
    return merges
```

Ba sự thật thuật toán mã hóa. `</w>` đánh dấu kết thúc từ để "low" (hậu tố) và "lower" (tiền tố) vẫn khác biệt. Gán trọng số tần suất khiến các cặp tần suất cao thắng sớm. Danh sách phép gộp có thứ tự — suy luận áp dụng các phép gộp theo thứ tự huấn luyện.

### Step 2: encode with the learned merges

```python
def encode_bpe(word, merges):
    symbols = list(word) + ["</w>"]
    for a, b in merges:
        i = 0
        while i < len(symbols) - 1:
            if symbols[i] == a and symbols[i + 1] == b:
                symbols = symbols[:i] + [a + b] + symbols[i + 2:]
            else:
                i += 1
    return symbols
```

$O(n \cdot \lvert \text{merges} \rvert)$ ngây thơ. Các triển khai production (tiktoken, HF Tokenizers) dùng tra cứu thứ hạng phép gộp với các hàng đợi ưu tiên và chạy trong thời gian gần tuyến tính.

### Step 3: SentencePiece in practice

```python
import sentencepiece as spm

spm.SentencePieceTrainer.train(
    input="corpus.txt",
    model_prefix="my_tokenizer",
    vocab_size=8000,
    model_type="bpe",          # or "unigram"
    character_coverage=0.9995, # lower for CJK (e.g. 0.9995 for English, 0.995 for Japanese)
    normalization_rule_name="nmt_nfkc",
)

sp = spm.SentencePieceProcessor(model_file="my_tokenizer.model")
print(sp.encode("untokenizable", out_type=str))
# ['▁un', 'token', 'izable']
```

Chú ý: không yêu cầu tiền tokenization, khoảng trắng được mã hóa thành `▁`, `character_coverage` kiểm soát mức mạnh tay giữ các ký tự hiếm so với ánh xạ sang `<unk>`.

### Step 4: tiktoken for OpenAI-compatible vocabs

```python
import tiktoken
enc = tiktoken.get_encoding("o200k_base")
print(enc.encode("untokenizable"))        # [127340, 101028]
print(len(enc.encode("Hello, world!")))   # 4
```

Chỉ mã hóa. Nhanh (backend Rust). Khớp chính xác tokenization GPT-4/5 để đếm byte, ước lượng chi phí, lập ngân sách cửa sổ ngữ cảnh.

## Pitfalls that still ship in 2026

- **Độ trôi tokenizer.** Huấn luyện trên từ vựng A, triển khai trên từ vựng B. Các ID token khác nhau; mô hình xuất rác. Kiểm tra hash `tokenizer.json` trong CI.
- **Nhập nhằng khoảng trắng.** BPE "hello" so với " hello" tạo các token khác nhau. Luôn chỉ định `add_special_tokens` và `add_prefix_space` rõ ràng.
- **Huấn luyện đa ngôn ngữ không đủ.** Các ngữ liệu thiên về tiếng Anh tạo các từ vựng chia các hệ chữ phi Latin thành nhiều token hơn 5-10 lần. Cùng prompt tốn hơn 5-10 lần bằng tiếng Nhật/Ả Rập trên GPT-3.5. o200k_base sửa một phần điều này.
- **Chia tách emoji.** Một emoji duy nhất có thể mất 5 token. Kiểm tra cách xử lý emoji khi lập ngân sách ngữ cảnh.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Huấn luyện một mô hình đơn ngôn ngữ từ đầu | HF Tokenizers (BPE) |
| Huấn luyện một mô hình đa ngôn ngữ | SentencePiece (Unigram, `character_coverage=0.9995`) |
| Phục vụ một API tương thích OpenAI | tiktoken (`o200k_base` cho GPT-4+) |
| Từ vựng theo lĩnh vực (mã, toán, protein) | Huấn luyện BPE tùy chỉnh trên ngữ liệu lĩnh vực, gộp với từ vựng cơ sở |
| Suy luận biên, mô hình nhỏ | Unigram (các từ vựng nhỏ hơn hoạt động tốt hơn) |

Kích thước từ vựng là một quyết định mở rộng quy mô, không phải hằng số. Heuristic sơ bộ: 32k cho <1B tham số, 50-100k cho 1-10B, 200k+ cho đa ngôn ngữ/tiên phong.

## Ship It

Lưu thành `outputs/skill-bpe-vs-wordpiece.md`:

```markdown
---
name: tokenizer-picker
description: Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
version: 1.0.0
phase: 5
lesson: 19
tags: [nlp, tokenization]
---

Given a corpus (size, languages, domain) and deployment target (training from scratch / fine-tuning / API-compatible inference), output:

1. Algorithm. BPE, Unigram, or WordPiece. One-sentence reason.
2. Library. SentencePiece, HF Tokenizers, or tiktoken. Reason.
3. Vocab size. Rounded to nearest 1k. Reason tied to model size and language coverage.
4. Coverage settings. `character_coverage`, `byte_fallback`, special-token list.
5. Validation plan. Average tokens-per-word on held-out set, OOV rate, compression ratio, round-trip decode equality.

Refuse to train a character-coverage <0.995 tokenizer on corpora with rare-script content. Refuse to ship a vocab without a frozen `tokenizer.json` hash check in CI. Flag any monolingual tokenizer under 16k vocab as likely under-spec.
```

## Exercises

1. **Dễ.** Huấn luyện một BPE 500 phép gộp trên ngữ liệu nhỏ của `code/main.py`. Mã hóa ba từ được giữ lại. Bao nhiêu từ tạo chính xác 1 token so với >1 token?
2. **Trung bình.** So sánh các số đếm token trên 100 câu Wikipedia tiếng Anh giữa `cl100k_base`, `o200k_base` và một SentencePiece BPE bạn huấn luyện với vocab=32k. Báo cáo tỷ lệ nén của mỗi loại.
3. **Khó.** Huấn luyện cùng ngữ liệu bằng BPE, Unigram và WordPiece. Đo accuracy tác vụ phía sau khi dùng mỗi loại trên một bộ phân loại cảm xúc nhỏ. Lựa chọn có tạo khác biệt hơn 1 điểm F1 không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| BPE | Mã hóa cặp byte | Gộp tham lam các cặp ký tự thường gặp nhất đến khi đạt kích thước từ vựng đích. |
| Byte-level BPE (BPE cấp byte) | Không bao giờ có token không biết | BPE trên 256 byte thô; GPT-2 / Llama dùng cách này. |
| Unigram | Tokenizer có tính xác suất | Cắt tỉa từ một tập ứng viên lớn bằng log-likelihood; được dùng bởi T5, Gemma. |
| SentencePiece | Loại khoảng trắng | Thư viện huấn luyện BPE/Unigram trên văn bản thô; khoảng trắng được mã hóa thành `▁`. |
| tiktoken | Loại nhanh | Bộ mã hóa BPE của OpenAI dựa trên Rust cho các từ vựng có sẵn. Không huấn luyện. |
| Merge list (Danh sách phép gộp) | Các con số kỳ diệu | Danh sách có thứ tự các phép gộp `(a, b) → ab`; suy luận áp dụng theo thứ tự. |
| Character coverage (Độ bao phủ ký tự) | Hiếm đến đâu là quá hiếm? | Tỷ lệ các ký tự trong ngữ liệu huấn luyện mà tokenizer phải bao phủ; thường ~0.9995. |

## Further Reading

- [Sennrich, Haddow, Birch (2015). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — bài báo BPE.
- [Kudo (2018). Subword Regularization with Unigram Language Model](https://arxiv.org/abs/1804.10959) — bài báo Unigram.
- [Kudo, Richardson (2018). SentencePiece: A simple and language independent subword tokenizer](https://arxiv.org/abs/1808.06226) — thư viện.
- [Hugging Face — Summary of the tokenizers](https://huggingface.co/docs/transformers/tokenizer_summary) — tham chiếu súc tích.
- [OpenAI tiktoken repo](https://github.com/openai/tiktoken) — cookbook + danh sách mã hóa.
