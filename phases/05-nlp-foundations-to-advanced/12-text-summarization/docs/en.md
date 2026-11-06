# Text Summarization

> Các hệ thống trích xuất cho bạn biết tài liệu đã nói gì. Các hệ thống trừu tượng cho bạn biết tác giả muốn nói gì. Các tác vụ khác nhau, các cạm bẫy khác nhau.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 11 (Machine Translation)
**Time:** ~75 minutes

## The Problem

Một bài báo tin tức 2,000 từ xuất hiện trong bảng tin của bạn. Bạn cần 120 từ nắm bắt nó. Bạn có thể chọn ba câu quan trọng nhất từ bài báo (trích xuất) hoặc viết lại nội dung bằng lời của mình (trừu tượng). Cả hai được gọi là tóm tắt. Chúng là những bài toán hoàn toàn khác nhau.

Tóm tắt trích xuất là một bài toán xếp hạng. Chấm điểm mọi câu, trả top-`k`. Đầu ra luôn đúng ngữ pháp vì được lấy nguyên văn. Rủi ro là bỏ sót nội dung phân bố khắp bài báo.

Tóm tắt trừu tượng là một bài toán sinh. Một transformer tạo văn bản mới được điều kiện hóa theo đầu vào. Đầu ra trôi chảy và cô đọng nhưng có thể ảo giác các sự kiện không có trong nguồn. Rủi ro là bịa đặt tự tin.

Bài học này xây dựng cả hai, với dạng lỗi riêng của mỗi loại.

## The Concept

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Trích xuất.** Coi bài báo là một đồ thị mà các nút là các câu và các cạnh là độ tương đồng. Chạy PageRank (hoặc thứ gì giống nó) trên đồ thị để chấm điểm các câu theo mức chúng kết nối với mọi thứ khác. Các câu có điểm cao nhất là bản tóm tắt. Triển khai kinh điển là **TextRank** (Mihalcea và Tarau, 2004).

**Trừu tượng.** Fine-tune một encoder-decoder transformer (BART, T5, Pegasus) trên các cặp tài liệu-tóm tắt. Khi suy luận, mô hình đọc tài liệu và sinh bản tóm tắt từng token qua cross-attention. Riêng Pegasus dùng một mục tiêu tiền huấn luyện câu bị khuyết khiến nó xuất sắc trong tóm tắt mà không cần nhiều fine-tuning.

Đánh giá bằng **ROUGE** (Recall-Oriented Understudy for Gisting Evaluation). ROUGE-1 và ROUGE-2 chấm phần giao unigram và bigram. ROUGE-L chấm dãy con chung dài nhất. Cao hơn là tốt hơn nhưng 40 ROUGE-L là "tốt" và 50 là "xuất sắc." Mọi bài báo báo cáo cả ba. Dùng gói `rouge-score`.

```figure
summarize-collapse
```

## Build It

### Step 1: TextRank (extractive)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

Hai điều cần nêu tên. Hàm tương đồng dùng phần giao từ được chuẩn hóa log, là biến thể TextRank gốc. Cosine của các vector TF-IDF cũng hoạt động. Hệ số suy giảm 0.85 và số lần lặp là các mặc định PageRank.

### Step 2: abstractive with BART

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-large-CNN được fine-tune trên ngữ liệu CNN/DailyMail. Nó tạo các bản tóm tắt kiểu tin tức ngay khi dùng. Với các lĩnh vực khác (bài báo khoa học, hội thoại, pháp lý), dùng checkpoint Pegasus tương ứng hoặc fine-tune trên dữ liệu đích của bạn.

### Step 3: ROUGE evaluation

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

Luôn dùng stemming. Không có nó, "running" và "run" được đếm là các từ khác nhau và ROUGE đếm thiếu.

### Beyond ROUGE (2026 summarization eval)

ROUGE là thước đo tóm tắt chủ đạo suốt hai mươi năm và riêng nó là không đủ vào năm 2026. Một phân tích tổng hợp quy mô lớn các bài báo NLG cho thấy:

- **BERTScore** (độ tương đồng embedding theo ngữ cảnh) có thêm chỗ đứng đến năm 2023 và hiện được báo cáo cùng ROUGE trong hầu hết các bài báo tóm tắt.
- **BARTScore** coi đánh giá là sinh: chấm điểm bản tóm tắt theo mức xác suất một BART tiền huấn luyện gán cho nó khi biết nguồn.
- **MoverScore** (Earth Mover's Distance trên các embedding theo ngữ cảnh) đạt vị trí hàng đầu trong các benchmark tóm tắt năm 2025 vì nó nắm bắt phần giao ngữ nghĩa tốt hơn ROUGE.
- **FactCC** và **độ trung thành dựa trên QA** phổ biến trong 2021-2023, hiện thường được thay bằng **G-Eval** (một chuỗi prompt GPT-4 chấm độ mạch lạc, tính nhất quán, độ trôi chảy, tính liên quan với suy luận chain-of-thought).
- **G-Eval** và các cách tiếp cận LLM làm giám khảo tương tự khớp phán đoán con người ~80% số lần khi rubric được thiết kế tốt.

Khuyến nghị production: báo cáo ROUGE-L để so sánh với trước đây, BERTScore cho phần giao ngữ nghĩa, G-Eval cho độ mạch lạc và tính đúng sự thật. Hiệu chuẩn theo 50-100 bản tóm tắt được con người gán nhãn.

### Step 4: the factuality problem

Các bản tóm tắt trừu tượng dễ ảo giác. Các bản tóm tắt trích xuất mang rủi ro ảo giác thấp hơn nhiều vì đầu ra được lấy nguyên văn từ nguồn, dù chúng vẫn có thể gây hiểu lầm nếu các câu nguồn bị tách khỏi ngữ cảnh, lỗi thời hoặc được trích dẫn sai thứ tự. Đây là lý do lớn nhất các hệ thống production vẫn ưu tiên các phương pháp trích xuất cho nội dung gần với tuân thủ.

Các loại ảo giác cần nêu tên:

- **Hoán đổi thực thể.** Nguồn nói "John Smith." Tóm tắt nói "John Brown."
- **Độ trôi con số.** Nguồn nói "25,000." Tóm tắt nói "25 triệu."
- **Đảo sắc thái.** Nguồn nói "từ chối lời đề nghị." Tóm tắt nói "chấp nhận lời đề nghị."
- **Bịa sự kiện.** Nguồn không nhắc CEO. Tóm tắt nói CEO đã phê duyệt.

Các cách tiếp cận đánh giá hoạt động:

- **FactCC.** Một bộ phân loại nhị phân được huấn luyện trên quan hệ kéo theo giữa câu nguồn và câu tóm tắt. Dự đoán đúng sự thật/không đúng sự thật.
- **Tính đúng sự thật dựa trên QA.** Hỏi một mô hình QA các câu hỏi có câu trả lời trong nguồn. Nếu bản tóm tắt hỗ trợ các câu trả lời khác, đánh dấu.
- **F1 cấp thực thể.** So sánh các thực thể có tên trong nguồn với tóm tắt. Các thực thể chỉ có trong tóm tắt là đáng ngờ.

Với bất kỳ thứ gì hướng đến người dùng mà tính đúng sự thật quan trọng (tin tức, y tế, pháp lý, tài chính), trích xuất là mặc định an toàn hơn. Trừu tượng cần một kiểm tra tính đúng sự thật trong vòng lặp.

## Use It

Ngăn xếp năm 2026:

| Trường hợp sử dụng | Khuyến nghị |
|---------|-------------|
| Tin tức, tóm tắt 3-5 câu, tiếng Anh | `facebook/bart-large-cnn` |
| Các bài báo khoa học | `google/pegasus-pubmed` hoặc một T5 được tinh chỉnh |
| Nhiều tài liệu, dạng dài | Bất kỳ LLM nào có ngữ cảnh 32k+, được prompt |
| Tóm tắt hội thoại | `philschmid/bart-large-cnn-samsum` |
| Trích xuất, rủi ro ảo giác thấp ngay từ cách xây dựng | TextRank hoặc LSA / LexRank của `sumy` |

Các LLM có ngữ cảnh dài thường thắng các mô hình chuyên biệt năm 2026 khi tính toán không phải ràng buộc. Đánh đổi là chi phí và khả năng tái lập; các mô hình chuyên biệt cho đầu ra nhất quán hơn.

## Ship It

Lưu thành `outputs/skill-summary-picker.md`:

```markdown
---
name: summary-picker
description: Pick extractive or abstractive, named library, factuality check.
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

Given a task (document type, compliance requirement, length, compute budget), output:

1. Approach. Extractive or abstractive. Explain in one sentence why.
2. Starting model / library. Name it. `sumy.TextRankSummarizer`, `facebook/bart-large-cnn`, `google/pegasus-pubmed`, or an LLM prompt.
3. Evaluation plan. ROUGE-1, ROUGE-2, ROUGE-L (use rouge-score with stemming). Plus factuality check if abstractive.
4. One failure mode to probe. Entity swap is the most common in abstractive news summarization; flag samples where source entities do not appear in summary.

Refuse abstractive summarization for medical, legal, financial, or regulated content without a factuality gate. Flag input over the model's context window as needing chunked map-reduce summarization (not just truncation).
```

## Exercises

1. **Dễ.** Chạy TextRank trên 5 bài báo tin tức. So sánh top-3 câu với một bản tóm tắt tham chiếu. Đo ROUGE-L. Bạn sẽ thấy 30-45 ROUGE-L trên các bài báo kiểu CNN/DailyMail.
2. **Trung bình.** Triển khai tính đúng sự thật cấp thực thể: trích xuất các thực thể có tên từ nguồn và tóm tắt (spaCy), tính recall của các thực thể nguồn trong tóm tắt và precision của các thực thể tóm tắt so với nguồn. Precision cao và recall thấp nghĩa là an toàn nhưng ngắn gọn; precision thấp nghĩa là các thực thể bị ảo giác.
3. **Khó.** So sánh BART-large-CNN với một LLM (Claude hoặc GPT-4) trên 50 bài CNN/DailyMail. Báo cáo ROUGE-L, tính đúng sự thật (bằng F1 thực thể) và chi phí mỗi bản tóm tắt. Ghi lại nơi mỗi bên thắng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Extractive (Trích xuất) | Chọn câu | Trả các câu nguyên văn từ nguồn. Không bao giờ ảo giác. |
| Abstractive (Trừu tượng) | Viết lại | Sinh văn bản mới được điều kiện hóa theo nguồn. Có thể ảo giác. |
| ROUGE | Thước đo tóm tắt | Phần giao n-gram / LCS giữa đầu ra hệ thống và tham chiếu. |
| TextRank | Trích xuất dựa trên đồ thị | PageRank trên đồ thị độ tương đồng câu. |
| Factuality (Tính đúng sự thật) | Nó có đúng không | Liệu các khẳng định trong tóm tắt có được nguồn hỗ trợ. |
| Hallucination (Ảo giác) | Nội dung bịa ra | Nội dung trong tóm tắt mà nguồn không hỗ trợ. |

## Further Reading

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) — bài báo trích xuất kinh điển.
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) — bài báo BART.
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) — Pegasus và mục tiêu câu bị khuyết.
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/) — bài báo ROUGE.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) — bài báo về bức tranh tính đúng sự thật.
