# Question Answering Systems

> Ba hệ thống định hình QA hiện đại. Trích xuất tìm các span. Tăng cường truy xuất đặt chúng trên căn cứ tài liệu. Sinh tạo ra các câu trả lời. Mọi trợ lý AI hiện đại là sự kết hợp của cả ba.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 11 (Machine Translation), Phase 5 · 10 (Attention Mechanism)
**Time:** ~75 minutes

## The Problem

Một người dùng gõ "Chiếc iPhone đầu tiên ra mắt khi nào?" và kỳ vọng "Ngày 29 tháng 6 năm 2007." Không phải "Lịch sử Apple dài và đa dạng." Không phải "2007" nằm riêng lẻ không có câu. Một câu trả lời trực tiếp, có căn cứ, đúng.

Ba kiến trúc đã thống trị QA trong thập kỷ qua.

- **QA trích xuất.** Với một câu hỏi và một đoạn văn được biết là chứa câu trả lời, tìm các chỉ số bắt đầu và kết thúc của span câu trả lời trong đoạn văn. SQuAD là benchmark kinh điển.
- **QA miền mở.** Đoạn văn không được cho sẵn. Truy xuất đoạn văn liên quan trước, rồi trích xuất hoặc sinh một câu trả lời. Đây là nền tảng của mọi pipeline RAG ngày nay.
- **QA sinh / Đóng sách.** Một mô hình ngôn ngữ lớn trả lời từ bộ nhớ tham số của nó. Không truy xuất. Nhanh nhất khi suy luận, ít đáng tin cậy nhất về các sự kiện.

Xu hướng năm 2026 là lai: truy xuất vài đoạn văn tốt nhất, rồi prompt một mô hình sinh trả lời dựa trên các đoạn văn đó. Đó là RAG, và bài 14 đề cập sâu nửa truy xuất. Bài học này xây dựng nửa QA.

## The Concept

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Trích xuất.** Mã hóa câu hỏi và đoạn văn cùng nhau bằng một transformer (họ BERT). Huấn luyện hai head dự đoán các chỉ số token bắt đầu và kết thúc của câu trả lời. Loss là cross-entropy trên các vị trí hợp lệ. Đầu ra là một span từ đoạn văn. Không bao giờ ảo giác (do cách xây dựng), không bao giờ xử lý các câu hỏi mà đoạn văn không thể trả lời (do cách xây dựng).

**Tăng cường truy xuất (RAG).** Hai giai đoạn. Thứ nhất, một bộ truy xuất tìm các đoạn văn top-`k` từ một ngữ liệu. Thứ hai, một bộ đọc (trích xuất hoặc sinh) tạo câu trả lời bằng các đoạn văn đó. Sự tách biệt bộ truy xuất-bộ đọc cho phép mỗi bên được huấn luyện và đánh giá độc lập. RAG hiện đại thường thêm một bộ xếp hạng lại giữa chúng.

**Sinh.** Một LLM chỉ decoder (GPT, Claude, Llama) trả lời từ các trọng số được học. Không có bước truy xuất. Xuất sắc với kiến thức phổ biến, thảm họa với các sự kiện hiếm hoặc gần đây. Tỷ lệ ảo giác tương quan nghịch với tần suất sự kiện trong dữ liệu tiền huấn luyện.

```figure
qa-span
```

## Build It

### Step 1: extractive QA with a pretrained model

```python
from transformers import pipeline

qa = pipeline("question-answering", model="deepset/roberta-base-squad2")

passage = (
    "Apple Inc. released the first iPhone on June 29, 2007. "
    "The device was announced by Steve Jobs at Macworld in January 2007."
)
question = "When was the first iPhone released?"

answer = qa(question=question, context=passage)
print(answer)
```

```python
{'score': 0.98, 'start': 57, 'end': 70, 'answer': 'June 29, 2007'}
```

`deepset/roberta-base-squad2` được huấn luyện trên SQuAD 2.0, bao gồm các câu hỏi không thể trả lời. Mặc định, pipeline `question-answering` trả span có điểm cao nhất ngay cả khi điểm null của mô hình thắng — nó *không* tự động trả một câu trả lời rỗng. Để có hành vi "không có câu trả lời" tường minh, truyền `handle_impossible_answer=True` vào lời gọi pipeline: pipeline sau đó chỉ trả một câu trả lời rỗng khi điểm null vượt mọi điểm span. Dù cách nào cũng luôn kiểm tra trường `score`.

### Step 2: a retrieval-augmented pipeline (sketch)

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

corpus = [
    "Apple Inc. released the first iPhone on June 29, 2007.",
    "Macworld 2007 featured the iPhone announcement by Steve Jobs.",
    "Android launched in 2008 as Google's mobile operating system.",
    "The first iPod was released in 2001.",
]
corpus_embeddings = encoder.encode(corpus, normalize_embeddings=True)


def retrieve(question, top_k=2):
    q_emb = encoder.encode([question], normalize_embeddings=True)
    sims = (corpus_embeddings @ q_emb.T).squeeze()
    order = np.argsort(-sims)[:top_k]
    return [corpus[i] for i in order]


def answer(question):
    passages = retrieve(question, top_k=2)
    combined = " ".join(passages)
    return qa(question=question, context=combined)


print(answer("When was the first iPhone released?"))
```

Pipeline hai giai đoạn. Bộ truy xuất đặc (Sentence-BERT) tìm các đoạn văn liên quan bằng độ tương đồng ngữ nghĩa. Bộ đọc trích xuất (RoBERTa-SQuAD) lấy span câu trả lời từ các đoạn văn hàng đầu được kết hợp. Hoạt động trên các ngữ liệu nhỏ. Với một ngữ liệu triệu tài liệu, dùng FAISS hoặc một cơ sở dữ liệu vector.

### Step 3: generative with RAG

```python
def rag_generate(question, llm):
    passages = retrieve(question, top_k=3)
    prompt = f"""Context:
{chr(10).join('- ' + p for p in passages)}

Question: {question}

Answer using only the context above. If the context does not contain the answer, say "I don't know."
"""
    return llm(prompt)
```

Mẫu prompt quan trọng. Yêu cầu rõ ràng mô hình dựa trên ngữ cảnh và trả "Tôi không biết" khi ngữ cảnh không đủ cắt giảm tỷ lệ ảo giác 40-60% so với prompting ngây thơ. Các mẫu phức tạp hơn thêm trích dẫn, điểm độ tin cậy và trích xuất có cấu trúc.

### Step 4: evaluation that reflects the real world

SQuAD dùng **Exact Match (EM)** và **F1 cấp token**. EM là khớp nghiêm ngặt sau chuẩn hóa (chữ thường, bỏ dấu câu, bỏ mạo từ) — hoặc dự đoán khớp chính xác hoặc nó được điểm 0. F1 được tính trên phần giao token giữa dự đoán và tham chiếu và cho điểm một phần. Cả hai cho thiếu điểm các cách diễn đạt lại: "June 29, 2007" so với "June 29th, 2007" thường nhận 0 EM (số thứ tự phá chuẩn hóa) nhưng vẫn nhận F1 đáng kể từ các token giao nhau.

Đối với QA production:

- **Độ chính xác câu trả lời** (do LLM hoặc con người đánh giá, vì các thước đo không nắm bắt sự tương đương ngữ nghĩa).
- **Độ chính xác trích dẫn.** Đoạn văn được trích dẫn có thực sự hỗ trợ câu trả lời không? Dễ kiểm tra tự động bằng khớp chuỗi giữa các trích dẫn được sinh và các đoạn văn được truy xuất.
- **Hiệu chuẩn từ chối.** Khi câu trả lời không nằm trong các đoạn văn được truy xuất, hệ thống có nói đúng "Tôi không biết" không? Đo tỷ lệ tự tin sai.
- **Recall truy xuất.** Trước khi đánh giá bộ đọc, đo liệu bộ truy xuất có đưa đúng đoạn văn vào top-`k` không. Một bộ đọc không thể sửa một đoạn văn bị thiếu.

### RAGAS: the 2026 production eval framework

`RAGAS` được xây dựng riêng cho các hệ thống RAG và là mặc định để phát hành năm 2026. Nó chấm bốn chiều mà không yêu cầu các tham chiếu chuẩn:

- **Độ trung thành.** Mỗi khẳng định trong câu trả lời có đến từ ngữ cảnh được truy xuất không? Được đo bằng quan hệ kéo theo dựa trên NLI. Thước đo ảo giác chính của bạn.
- **Tính liên quan câu trả lời.** Câu trả lời có giải quyết câu hỏi không? Được đo bằng cách sinh các câu hỏi giả định từ câu trả lời và so sánh với câu hỏi thực.
- **Precision ngữ cảnh.** Trong các khối được truy xuất, tỷ lệ nào thực sự liên quan? Precision thấp = nhiễu trong prompt.
- **Recall ngữ cảnh.** Tập được truy xuất có chứa mọi thông tin cần thiết không? Recall thấp = bộ đọc không thể thành công.

Chấm điểm không tham chiếu cho phép bạn đánh giá trên lưu lượng production trực tiếp mà không có các câu trả lời chuẩn được tuyển chọn. Thêm LLM-as-judge phía trên cho các câu hỏi mở mà các thước đo khớp chính xác vô dụng.

`pip install ragas`. Cắm bộ truy xuất + bộ đọc của bạn vào. Nhận bốn vô hướng mỗi truy vấn. Cảnh báo khi có hồi quy.

## Use It

Ngăn xếp năm 2026.

| Trường hợp sử dụng | Khuyến nghị |
|---------|-------------|
| Cho sẵn đoạn văn, tìm span câu trả lời | `deepset/roberta-base-squad2` |
| Trên một ngữ liệu cố định, đóng sách không được chấp nhận | RAG: bộ truy xuất đặc + bộ đọc LLM |
| Thời gian thực trên một kho tài liệu | RAG với bộ truy xuất lai (BM25 + đặc) + bộ xếp hạng lại (bài 14) |
| QA hội thoại (các câu hỏi tiếp nối) | LLM với lịch sử hội thoại + RAG ở mỗi lượt |
| Các lĩnh vực đòi hỏi tính đúng sự thật cao, chịu quy định | Trích xuất trên một ngữ liệu có thẩm quyền; không bao giờ chỉ sinh |

QA trích xuất lỗi thời vào năm 2026 vì RAG với LLM xử lý nhiều trường hợp hơn. Nó vẫn được phát hành trong các bối cảnh yêu cầu trích dẫn nguyên văn: nghiên cứu pháp lý, tuân thủ quy định, công cụ kiểm toán.

## Ship It

Lưu thành `outputs/skill-qa-architect.md`:

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```

## Exercises

1. **Dễ.** Thiết lập pipeline trích xuất SQuAD ở trên trên 10 đoạn văn Wikipedia. Tạo thủ công 10 câu hỏi. Đo tần suất câu trả lời đúng. Bạn sẽ thấy 7-9 câu đúng nếu các đoạn văn và câu hỏi sạch.
2. **Trung bình.** Thêm một bộ phân loại từ chối. Khi điểm truy xuất hàng đầu dưới một ngưỡng (chẳng hạn cosine 0.3), trả "Tôi không biết" thay vì gọi bộ đọc. Tinh chỉnh ngưỡng trên một tập được giữ lại.
3. **Khó.** Xây dựng một pipeline RAG trên một ngữ liệu 10,000 tài liệu tùy chọn. Triển khai truy xuất lai (BM25 + đặc) với kết hợp RRF (xem bài 14). Đo độ chính xác câu trả lời có và không có bước lai. Ghi lại những loại câu hỏi nào hưởng lợi nhất.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Extractive QA (QA trích xuất) | Tìm span câu trả lời | Dự đoán các chỉ số bắt đầu và kết thúc của câu trả lời trong một đoạn văn cho sẵn. |
| Open-domain QA (QA miền mở) | QA trên một ngữ liệu | Không có đoạn văn cho sẵn; phải truy xuất rồi trả lời. |
| RAG | Truy xuất rồi sinh | Sinh tăng cường truy xuất. Pipeline bộ truy xuất + bộ đọc. |
| SQuAD | Benchmark kinh điển | Stanford Question Answering Dataset. Các thước đo EM + F1. |
| Hallucination (Ảo giác) | Câu trả lời bịa ra | Đầu ra bộ đọc không được ngữ cảnh truy xuất hỗ trợ. |
| Refusal calibration (Hiệu chuẩn từ chối) | Biết khi nào im lặng | Hệ thống nói đúng "Tôi không biết" khi không thể trả lời. |

## Further Reading

- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) — bài báo benchmark.
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) — DPR, bộ truy xuất đặc kinh điển cho QA.
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) — bài báo đặt tên RAG.
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) — khảo sát RAG toàn diện.
