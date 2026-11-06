# Machine Translation

> Dịch là tác vụ đã trả tiền cho nghiên cứu NLP suốt ba mươi năm và hiện vẫn tiếp tục trả.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 10 (Attention Mechanism), Phase 5 · 04 (GloVe, FastText, Subword)
**Time:** ~75 minutes

## The Problem

Một mô hình đọc một câu trong một ngôn ngữ và tạo một câu trong ngôn ngữ khác. Độ dài thay đổi. Thứ tự từ thay đổi. Một số từ nguồn ánh xạ sang nhiều từ đích và ngược lại. Thành ngữ từ chối ánh xạ một-một. "Tôi nhớ bạn" trong tiếng Pháp là "tu me manques" — nghĩa đen là "bạn đang thiếu đối với tôi." Không sự căn chỉnh cấp từ nào sống sót qua điều đó.

Dịch máy là tác vụ buộc NLP phát minh encoder-decoder, attention, transformer và cuối cùng toàn bộ mô thức LLM. Mọi bước tiến xuất hiện vì chất lượng dịch đo được và khoảng cách giữa con người với máy móc rất dai dẳng.

Bài học này bỏ qua bài học lịch sử và dạy pipeline hoạt động của năm 2026: encoder-decoder đa ngôn ngữ được tiền huấn luyện (NLLB-200 hoặc mBART), tokenization từ con, beam search, đánh giá BLEU và chrF, cùng một số dạng lỗi vẫn lọt vào production mà không bị phát hiện.

## The Concept

![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

MT hiện đại là một encoder-decoder transformer được huấn luyện trên văn bản song song. Encoder đọc nguồn theo tokenization của ngôn ngữ đó. Decoder sinh đích, từng từ con một, dùng đầu ra encoder qua cross-attention (bài 10). Giải mã dùng beam search để tránh bẫy giải mã tham lam. Đầu ra được ghép token, hoàn tác chuẩn hóa kiểu chữ và chấm điểm so với một bản tham chiếu.

Ba lựa chọn vận hành chi phối chất lượng MT thực tế.

- **Tokenizer.** SentencePiece BPE được huấn luyện trên một ngữ liệu trộn ngôn ngữ. Từ vựng dùng chung giữa các ngôn ngữ là điều cho phép các cặp zero-shot trong NLLB.
- **Kích thước mô hình.** NLLB-200 distilled 600M vừa trên máy tính xách tay. NLLB-200 3.3B là mặc định production đã công bố. 54.5B là mức trần nghiên cứu.
- **Giải mã.** Độ rộng beam 4-5 cho nội dung tổng quát. Phạt độ dài để tránh đầu ra quá ngắn. Giải mã có ràng buộc khi bạn cần tính nhất quán thuật ngữ.

```figure
seq2seq-alignment
```

## Build It

### Step 1: a pretrained MT call

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

Ba điều quan trọng ở đây. `src_lang` cho tokenizer biết cần áp dụng hệ chữ và phân đoạn nào. `forced_bos_token_id` cho decoder biết cần sinh ngôn ngữ nào. Cả hai là các thủ thuật riêng cho NLLB; mBART và M2M-100 dùng các quy ước riêng và chúng không thể hoán đổi.

### Step 2: BLEU and chrF

BLEU đo phần giao n-gram giữa đầu ra và tham chiếu. Bốn kích thước n-gram tham chiếu (1-4), trung bình nhân của precision, phạt độ ngắn cho đầu ra quá ngắn. Điểm nằm trong [0, 100]. Được dùng phổ biến. Khó diễn giải đến bực bội: 30 BLEU là "dùng được"; 40 là "tốt"; 50 là "xuất sắc"; các khác biệt dưới 1 BLEU là nhiễu.

chrF đo F-score cấp ký tự. Nhạy hơn với các ngôn ngữ giàu hình thái mà BLEU đếm thiếu các kết quả khớp. Thường được báo cáo cùng BLEU.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

Luôn dùng `sacrebleu`. Nó chuẩn hóa tokenization để các điểm so sánh được giữa các bài báo. Tự xây dựng phép tính BLEU là cách các benchmark gây hiểu lầm xuất hiện.

### The three-tier evaluation hierarchy (2026)

Đánh giá MT hiện đại dùng ba họ thước đo bổ sung cho nhau. Phát hành với ít nhất hai.

- **Heuristic** (BLEU, chrF). Nhanh, dựa trên tham chiếu, có thể diễn giải, không nhạy với diễn đạt lại. Dùng cho so sánh với trước đây và phát hiện hồi quy.
- **Được học** (COMET, BLEURT, BERTScore). Các mô hình nơ-ron được huấn luyện trên phán đoán con người; so sánh độ tương đồng ngữ nghĩa của bản dịch với nguồn và tham chiếu. COMET có mức liên hệ cao nhất với nghiên cứu MT từ năm 2023 và là mặc định production năm 2026 ở nơi chất lượng quan trọng.
- **LLM-as-judge** (không tham chiếu). Prompt một mô hình lớn chấm điểm các bản dịch theo độ trôi chảy, độ đầy đủ, giọng điệu, tính phù hợp văn hóa. GPT-4-as-judge khớp sự đồng thuận của con người ~80% số lần khi rubric được thiết kế tốt. Dùng cho nội dung mở nơi không có tham chiếu.

Ngăn xếp thực dụng năm 2026: `sacrebleu` cho BLEU và chrF, `unbabel-comet` cho COMET và một LLM được prompt cho tín hiệu cuối hướng đến con người. Hiệu chuẩn mọi thước đo theo 50-100 ví dụ được con người gán nhãn trước khi tin nó trên dữ liệu production.

Các thước đo không tham chiếu (COMET-QE, BLEURT-QE, LLM-as-judge) cho phép bạn đánh giá các bản dịch không cần tham chiếu, điều quan trọng cho các cặp ngôn ngữ đuôi dài nơi không tồn tại bản dịch tham chiếu.

### Step 3: what breaks in production

Pipeline hoạt động ở trên sẽ dịch trôi chảy 80% số lần và âm thầm thất bại 20% còn lại. Các dạng lỗi được nêu tên:

- **Ảo giác.** Mô hình bịa nội dung không có trong nguồn. Phổ biến với từ vựng lĩnh vực xa lạ. Triệu chứng: đầu ra trôi chảy nhưng khẳng định các sự kiện nguồn không nêu. Giảm thiểu: giải mã có ràng buộc trên các thuật ngữ lĩnh vực, con người rà soát nội dung chịu quy định, giám sát đầu ra dài hơn nhiều so với đầu vào.
- **Sinh sai đích.** Mô hình dịch sang sai ngôn ngữ. NLLB dễ mắc điều này đến ngạc nhiên trên các cặp ngôn ngữ hiếm. Giảm thiểu: xác minh `forced_bos_token_id` và luôn giải mã với một kiểm tra mô hình nhận dạng ngôn ngữ trên đầu ra.
- **Độ trôi thuật ngữ.** "Đăng ký" trở thành "s'inscrire" trong tài liệu 1 và "créer un compte" trong tài liệu 2. Với văn bản UI và các chuỗi hướng đến người dùng, tính nhất quán quan trọng hơn chất lượng thô. Giảm thiểu: giải mã có ràng buộc bằng bảng thuật ngữ hoặc từ điển hậu biên tập.
- **Không khớp mức trang trọng.** "tu" so với "vous" trong tiếng Pháp, các mức lịch sự tiếng Nhật. Mô hình chọn dạng phổ biến hơn trong huấn luyện. Với nội dung hướng đến khách hàng điều này thường sai. Giảm thiểu: thêm tiền tố prompt bằng một token mức trang trọng nếu mô hình hỗ trợ, hoặc fine-tune một mô hình nhỏ trên các ngữ liệu chỉ trang trọng.
- **Bùng nổ độ dài trên đầu vào ngắn.** Các câu đầu vào rất ngắn thường tạo các bản dịch quá dài vì phạt độ dài giảm đột ngột dưới ~5 token nguồn. Giảm thiểu: giới hạn độ dài tối đa cứng tỷ lệ với độ dài nguồn.

### Step 4: fine-tuning for a domain

Các mô hình được tiền huấn luyện là mô hình tổng quát. Dịch pháp lý, y tế hoặc hội thoại trò chơi hưởng lợi đo được từ fine-tuning trên dữ liệu song song lĩnh vực. Công thức không lạ lẫm:

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

Vài nghìn ví dụ song song chất lượng cao thắng vài trăm nghìn ví dụ nhiễu thu thập từ web. Chất lượng dữ liệu huấn luyện là đòn bẩy production lớn nhất.

## Use It

Ngăn xếp production năm 2026 cho MT:

| Trường hợp sử dụng | Điểm khởi đầu được khuyến nghị |
|---------|---------------------------|
| Bất kỳ sang bất kỳ, 200 ngôn ngữ | `facebook/nllb-200-distilled-600M` (máy tính xách tay) hoặc `nllb-200-3.3B` (production) |
| Lấy tiếng Anh làm trung tâm, chất lượng cao, 50 ngôn ngữ | `facebook/mbart-large-50-many-to-many-mmt` |
| Các lượt chạy ngắn, suy luận rẻ, tiếng Anh-Pháp/Đức/Tây Ban Nha | Các mô hình Helsinki-NLP / Marian |
| Phía trình duyệt đòi hỏi độ trễ nghiêm ngặt | Marian được lượng tử hóa ONNX (~50 MB) |
| Chất lượng tối đa, sẵn sàng trả phí | GPT-4 / Claude / Gemini với các prompt dịch |

LLM hiện vượt các mô hình MT chuyên biệt trên một số cặp ngôn ngữ tính đến năm 2026, đặc biệt trên nội dung thành ngữ và ngữ cảnh dài. Đánh đổi là chi phí theo token và độ trễ. Chọn một LLM khi độ dài ngữ cảnh, tính nhất quán phong cách hoặc thích nghi lĩnh vực qua prompting quan trọng hơn thông lượng.

## Ship It

Lưu thành `outputs/skill-mt-evaluator.md`:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

Given a source text and a candidate translation, output:

1. Automatic score estimate. BLEU and chrF ranges you would expect. State whether a reference is available.
2. Five-point human-verifiable check list: (a) content preservation (no hallucinations), (b) correct language, (c) register / formality match, (d) terminology consistency with glossary if provided, (e) no truncation or length explosion.
3. One domain-specific issue to probe. E.g., for legal: named entities and statute citations. For medical: drug names and dosages. For UI: placeholder variables `{name}`.
4. Confidence flag. "Ship" / "Ship with review" / "Do not ship". Tie to the severity of issues found in step 2.

Refuse to ship a translation without a language-ID check on output. Refuse to evaluate without a reference unless the user explicitly opts in to reference-free scoring (COMET-QE, BLEURT-QE). Flag any content over 1000 tokens as likely needing chunked translation.
```

## Exercises

1. **Dễ.** Dịch một đoạn tiếng Anh 5 câu sang tiếng Pháp rồi trở lại tiếng Anh bằng `nllb-200-distilled-600M`. Đo mức gần của bản dịch đi-về với bản gốc. Bạn sẽ thấy ngữ nghĩa được giữ với sự trôi lựa chọn từ.
2. **Trung bình.** Triển khai một kiểm tra nhận dạng ngôn ngữ trên các đầu ra dịch bằng `fasttext lid.176` hoặc `langdetect`. Tích hợp vào lời gọi MT để các lần sinh sai đích được phát hiện trước khi trả về.
3. **Khó.** Fine-tune `nllb-200-distilled-600M` trên một ngữ liệu lĩnh vực 5,000 cặp tùy chọn. Đo BLEU trên một tập được giữ lại trước và sau fine-tuning. Báo cáo những loại câu nào cải thiện và những loại nào suy giảm.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| BLEU | Điểm dịch | Precision n-gram với phạt độ ngắn. [0, 100]. |
| chrF | F-score ký tự | F-score cấp ký tự. Nhạy hơn cho các ngôn ngữ giàu hình thái. |
| NMT | MT nơ-ron | Encoder-decoder transformer được huấn luyện trên văn bản song song. Mặc định từ 2017+. |
| NLLB | No Language Left Behind | Họ mô hình MT 200 ngôn ngữ của Meta. |
| Constrained decoding (Giải mã có ràng buộc) | Đầu ra được kiểm soát | Buộc các token hoặc n-gram cụ thể xuất hiện / không xuất hiện trong đầu ra. |
| Hallucination (Ảo giác) | Nội dung bịa ra | Đầu ra mô hình không được nguồn hỗ trợ. |

## Further Reading

- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672) — bài báo NLLB.
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/) — vì sao `sacrebleu` là cách đúng duy nhất để báo cáo BLEU.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/) — bài báo chrF.
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) — hướng dẫn fine-tuning thực hành.
