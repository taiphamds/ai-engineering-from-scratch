# Topic Modeling — LDA and BERTopic

> LDA: tài liệu là các hỗn hợp chủ đề, chủ đề là các phân phối trên từ. BERTopic: tài liệu tạo cụm trong không gian embedding, các cụm là chủ đề. Cùng mục tiêu, các cách phân rã khác nhau.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 minutes

## The Problem

Bạn có 10,000 phiếu hỗ trợ khách hàng, 50,000 bài báo tin tức hoặc 200,000 tweet. Bạn cần biết bộ sưu tập nói về gì mà không đọc nó. Bạn không có các danh mục được gán nhãn. Bạn thậm chí không biết có bao nhiêu danh mục.

Mô hình hóa chủ đề trả lời điều đó không cần giám sát. Cho nó một ngữ liệu, nhận lại một tập nhỏ các chủ đề mạch lạc và, với mỗi tài liệu, một phân phối trên các chủ đề đó.

Hai họ thuật toán thống trị. LDA (2003) coi mỗi tài liệu là một hỗn hợp các chủ đề tiềm ẩn và mỗi chủ đề là một phân phối trên từ. Suy luận là Bayes. Nó vẫn được phát hành trong production nơi bạn cần các phép gán chủ đề thuộc hỗn hợp và các phân phối xác suất cấp từ có thể giải thích.

BERTopic (2020) mã hóa tài liệu bằng BERT, giảm số chiều bằng UMAP, phân cụm bằng HDBSCAN và trích xuất các từ chủ đề qua TF-IDF dựa trên lớp. Nó thắng trên văn bản ngắn, mạng xã hội và bất kỳ thứ gì mà độ tương đồng ngữ nghĩa quan trọng hơn phần giao từ. Một tài liệu nhận một chủ đề, là một hạn chế với nội dung dạng dài.

Bài học này xây dựng trực giác cho cả hai và nêu nên chọn phương pháp nào cho một ngữ liệu nhất định.

## The Concept

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**Câu chuyện sinh của LDA.** Mỗi chủ đề là một phân phối trên từ. Mỗi tài liệu là một hỗn hợp chủ đề. Để sinh một từ trong một tài liệu, lấy mẫu một chủ đề từ hỗn hợp của tài liệu, rồi lấy mẫu một từ từ phân phối của chủ đề đó. Suy luận đảo ngược điều này: với các từ được quan sát, suy ra phân phối chủ đề cho mỗi tài liệu và phân phối từ cho mỗi chủ đề. Lấy mẫu Gibbs thu gọn hoặc Bayes biến phân thực hiện phần toán.

Đầu ra LDA then chốt:

- `doc_topic`: ma trận `(n_docs, n_topics)`, mỗi hàng có tổng bằng 1 (hỗn hợp chủ đề của tài liệu).
- `topic_word`: ma trận `(n_topics, vocab_size)`, mỗi hàng có tổng bằng 1 (phân phối từ của chủ đề).

**Pipeline BERTopic.**

1. Mã hóa mỗi tài liệu bằng một sentence transformer (ví dụ, `all-MiniLM-L6-v2`). Các vector 384 chiều.
2. Giảm số chiều bằng UMAP xuống ~5 chiều. Các embedding BERT có số chiều quá cao để phân cụm.
3. Phân cụm bằng HDBSCAN. Dựa trên mật độ, tạo các cụm có kích thước thay đổi và một nhãn "ngoại lệ".
4. Với mỗi cụm, tính TF-IDF dựa trên lớp trên các tài liệu của cụm để trích xuất các từ hàng đầu.

Đầu ra là một chủ đề cho mỗi tài liệu (cộng một nhãn ngoại lệ -1). Tùy chọn, tư cách thành viên mềm qua vector xác suất của HDBSCAN.

```figure
topic-drift
```

## Build It

### Step 1: LDA via scikit-learn

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np


def fit_lda(documents, n_topics=5, max_features=1000):
    cv = CountVectorizer(
        max_features=max_features,
        stop_words="english",
        min_df=2,
        max_df=0.9,
    )
    X = cv.fit_transform(documents)
    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=50,
        learning_method="online",
    )
    doc_topic = lda.fit_transform(X)
    feature_names = cv.get_feature_names_out()
    return lda, cv, doc_topic, feature_names


def print_top_words(lda, feature_names, n_top=10):
    for idx, topic in enumerate(lda.components_):
        top_idx = np.argsort(-topic)[:n_top]
        words = [feature_names[i] for i in top_idx]
        print(f"topic {idx}: {' '.join(words)}")
```

Chú ý: stopword bị loại bỏ, min_df và max_df lọc các thuật ngữ hiếm và có mặt khắp nơi, CountVectorizer (không phải TfidfVectorizer) vì LDA kỳ vọng các số đếm thô.

### Step 2: BERTopic (production)

```python
from bertopic import BERTopic

topic_model = BERTopic(
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    min_topic_size=15,
    verbose=True,
)

topics, probs = topic_model.fit_transform(documents)
info = topic_model.get_topic_info()
print(info.head(20))
valid_topics = info[info["Topic"] != -1]["Topic"].tolist()
for topic_id in valid_topics[:5]:
    print(f"topic {topic_id}: {topic_model.get_topic(topic_id)[:10]}")
```

Bộ lọc trên `Topic != -1` loại nhóm ngoại lệ của BERTopic (các tài liệu HDBSCAN không thể phân cụm). `min_topic_size` kiểm soát kích thước cụm tối thiểu của HDBSCAN; mặc định thư viện BERTopic là 10. Ví dụ này đặt rõ ràng thành 15 cho quy mô bài học. Với các ngữ liệu trên 10,000 tài liệu, tăng lên 50 hoặc 100.

### Step 3: evaluation

Cả hai phương pháp xuất các từ chủ đề. Câu hỏi là liệu các từ đó có gắn kết.

- **Độ gắn kết chủ đề (c_v).** Kết hợp NPMI (thông tin tương hỗ theo điểm được chuẩn hóa) của các cặp từ hàng đầu trên các ngữ cảnh cửa sổ trượt, tổng hợp các điểm thành các vector chủ đề và so sánh các vector đó qua cosine similarity. Cao hơn là tốt hơn. Dùng `gensim.models.CoherenceModel` với `coherence="c_v"`.
- **Độ đa dạng chủ đề.** Tỷ lệ các từ duy nhất trên các từ hàng đầu của mọi chủ đề. Cao hơn là tốt hơn (các chủ đề không chồng lấn).
- **Kiểm tra định tính.** Đọc các từ hàng đầu của mỗi chủ đề. Chúng có gọi tên một thứ thực không? Phán đoán con người vẫn là tuyến phòng thủ cuối.

## When to pick which

| Tình huống | Chọn |
|-----------|------|
| Văn bản ngắn (tweet, đánh giá, tiêu đề) | BERTopic |
| Tài liệu dài với các hỗn hợp chủ đề | LDA |
| Không GPU / tính toán hạn chế | LDA hoặc NMF |
| Cần các phân phối đa chủ đề cấp tài liệu | LDA |
| Tích hợp LLM để gán nhãn chủ đề | BERTopic (hỗ trợ trực tiếp) |
| Triển khai biên hạn chế tài nguyên | LDA |
| Độ gắn kết ngữ nghĩa tối đa | BERTopic |

Cân nhắc thực tế lớn nhất là độ dài tài liệu. Các embedding BERT cắt cụt; các số đếm LDA hoạt động trên bất kỳ độ dài nào. Với các tài liệu dài hơn ngữ cảnh của mô hình embedding, hoặc chia khối + tổng hợp hoặc dùng LDA.

## Use It

Ngăn xếp năm 2026:

- **BERTopic.** Mặc định cho văn bản ngắn và bất kỳ thứ gì mà ngữ nghĩa quan trọng.
- **`gensim.models.LdaModel`.** LDA cổ điển cho production, trưởng thành, được kiểm chứng thực tế.
- **`sklearn.decomposition.LatentDirichletAllocation`.** LDA dễ dùng cho các thử nghiệm.
- **NMF.** Phân rã ma trận không âm. Phương án thay thế nhanh cho LDA, chất lượng tương đương trên văn bản ngắn.
- **Top2Vec.** Thiết kế tương tự BERTopic. Cộng đồng nhỏ hơn nhưng tốt trên một số benchmark.
- **FASTopic.** Mới hơn, nhanh hơn BERTopic trên các ngữ liệu rất lớn.
- **Gán nhãn dựa trên LLM.** Chạy bất kỳ cách phân cụm nào, rồi prompt một mô hình đặt tên mỗi cụm.

## Ship It

Lưu thành `outputs/skill-topic-picker.md`:

```markdown
---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Given a corpus description (document count, avg length, domain, language, compute budget), output:

1. Algorithm. LDA / NMF / BERTopic / Top2Vec / FASTopic. One-sentence reason.
2. Configuration. Number of topics: `recommended = max(5, round(sqrt(n_docs)))`, clamped to 200 for corpora under 40,000 docs; permit >200 only when the corpus is genuinely large (>40k) and note the increased compute cost. `min_df` / `max_df` filters and embedding model for neural approaches also belong here.
3. Evaluation. Topic coherence (c_v) via `gensim.models.CoherenceModel`, topic diversity, and a 20-sample human read.
4. Failure mode to probe. For LDA, "junk topics" absorbing stopwords and frequent terms. For BERTopic, the -1 outlier cluster swallowing ambiguous documents.

Refuse BERTopic on documents longer than the embedding model's context window without a chunking strategy. Refuse LDA on very short text (tweets, reviews under 10 tokens) as coherence collapses. Flag any n_topics choice below 5 as likely wrong; flag >200 on corpora under 40k docs as likely over-splitting.
```

## Exercises

1. **Dễ.** Khớp LDA với 5 chủ đề trên tập dữ liệu 20 Newsgroups. In 10 từ hàng đầu cho mỗi chủ đề. Gán nhãn mỗi chủ đề bằng tay. Thuật toán có tìm thấy các danh mục thực không?
2. **Trung bình.** Khớp BERTopic trên cùng tập con 20 Newsgroups. So sánh số chủ đề tìm thấy, các từ hàng đầu và độ gắn kết định tính với LDA. Phương pháp nào đưa các danh mục thực lên rõ hơn?
3. **Khó.** Tính độ gắn kết c_v cho cả LDA và BERTopic trên ngữ liệu của bạn. Chạy mỗi phương pháp với 5, 10, 20, 50 chủ đề. Vẽ độ gắn kết theo số chủ đề. Báo cáo phương pháp nào ổn định hơn qua các số chủ đề.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Topic (Chủ đề) | Một thứ ngữ liệu nói đến | Một phân phối xác suất trên từ (LDA) hoặc một cụm các tài liệu tương tự (BERTopic). |
| Mixed membership (Tư cách thành viên hỗn hợp) | Tài liệu thuộc nhiều chủ đề | LDA gán cho mỗi tài liệu một phân phối trên mọi chủ đề. |
| UMAP | Giảm số chiều | Học đa tạp giữ cấu trúc cục bộ; được dùng trong BERTopic. |
| HDBSCAN | Phân cụm mật độ | Tìm các cụm kích thước thay đổi; tạo nhãn "nhiễu" (-1) cho các ngoại lệ. |
| c_v coherence | Chỉ số chất lượng chủ đề | NPMI của các từ đứng đầu chủ đề trên các cửa sổ trượt, được chuyển thành các vector ngữ cảnh và so sánh bằng độ tương đồng cosine. |

## Further Reading

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) — bài báo LDA.
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) — bài báo BERTopic.
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) — bài báo giới thiệu c_v và các thước đo liên quan.
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) — tham chiếu production. Các ví dụ xuất sắc.
