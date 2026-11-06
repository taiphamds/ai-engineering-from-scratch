# LLM Evaluation — RAGAS, DeepEval, G-Eval

> Khớp chính xác và F1 bỏ sót sự tương đương ngữ nghĩa. Rà soát của con người không mở rộng được. LLM-as-judge là câu trả lời production — với đủ hiệu chuẩn để tin con số.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## The Problem

Hệ thống RAG của bạn trả lời: "June 29th, 2007."
Tham chiếu chuẩn là: "June 29, 2007."
Exact Match chấm 0. F1 chấm ~75%. Một người sẽ chấm 100%.

Giờ nhân với 10,000 trường hợp kiểm thử. Nhân lần nữa với mọi thay đổi bộ truy xuất, chia khối, prompt hoặc mô hình. Bạn cần một bộ đánh giá hiểu ý nghĩa, chạy rẻ ở quy mô lớn, không nói dối về các hồi quy và đưa đúng các dạng lỗi lên.

Năm 2026 có ba framework nắm bài toán này.

- **RAGAS.** Retrieval-Augmented Generation ASsessment. Bốn thước đo RAG (độ trung thành, tính liên quan câu trả lời, precision ngữ cảnh, recall ngữ cảnh) với các backend NLI + LLM đánh giá. Có nghiên cứu hỗ trợ, nhẹ.
- **DeepEval.** Pytest cho LLM. Các thước đo G-Eval, hoàn thành tác vụ, ảo giác, thiên lệch. Tích hợp tự nhiên với CI/CD.
- **G-Eval.** Một phương pháp (và một thước đo DeepEval): LLM-as-judge với chain-of-thought, các tiêu chí tùy chỉnh, điểm 0-1.

Cả ba dựa vào LLM-as-judge. Bài học này xây dựng trực giác cho phương pháp và tầng tin cậy xung quanh nó.

## The Concept

![Four evaluation dimensions, LLM-as-judge architecture](../assets/llm-evaluation.svg)

**LLM-as-judge.** Thay một thước đo tĩnh bằng một LLM chấm các đầu ra theo một rubric. Với `(query, context, answer)`, prompt một LLM đánh giá: "Chấm 0-1 về độ trung thành." Trả điểm.

Vì sao nó hoạt động: LLM xấp xỉ phán đoán con người với một phần rất nhỏ chi phí. GPT-4o-mini ở mức ~$0.003 mỗi trường hợp được chấm cho phép các lượt đánh giá hồi quy 1000 mẫu với dưới $5.

Vì sao nó âm thầm thất bại:

1. **Thiên lệch giám khảo.** Các giám khảo thích các câu trả lời dài hơn, các câu trả lời từ họ mô hình của chính chúng, các câu trả lời khớp phong cách prompt.
2. **Các lỗi phân tích JSON.** JSON tệ → điểm NaN → âm thầm bị loại khỏi tổng hợp. Những người dùng RAGAS biết nỗi đau này. Chặn bằng try/except + dạng lỗi tường minh.
3. **Độ trôi qua các phiên bản mô hình.** Nâng cấp giám khảo thay đổi mọi thước đo. Cố định mô hình giám khảo + phiên bản.

**Bốn thước đo RAG.**

| Thước đo | Câu hỏi | Backend |
|--------|----------|---------|
| Độ trung thành | Mỗi khẳng định trong câu trả lời có đến từ ngữ cảnh truy xuất không? | Kéo theo dựa trên NLI |
| Tính liên quan câu trả lời | Câu trả lời có giải quyết câu hỏi không? | Sinh các câu hỏi giả định từ câu trả lời; so sánh với câu hỏi thực |
| Precision ngữ cảnh | Trong các khối truy xuất, tỷ lệ nào liên quan? | LLM đánh giá |
| Recall ngữ cảnh | Truy xuất có trả mọi thứ cần thiết không? | LLM đánh giá so với câu trả lời chuẩn |

**G-Eval.** Định nghĩa một tiêu chí tùy chỉnh: "Câu trả lời có trích dẫn đúng nguồn không?" Framework tự mở rộng thành các bước đánh giá chain-of-thought, rồi chấm 0-1. Tốt cho các chiều chất lượng riêng lĩnh vực mà RAGAS không bao phủ.

**Hiệu chuẩn.** Không bao giờ tin điểm giám khảo thô cho đến khi bạn có một tương quan với các nhãn con người. Chạy 100 ví dụ gán nhãn bằng tay. Vẽ giám khảo so với con người. Tính Spearman rho. Nếu rho < 0.7, rubric giám khảo của bạn cần được cải thiện.

```figure
n5-judge-gauge
```

## Build It

### Step 1: faithfulness with NLI (RAGAS-style)

```python
from typing import Callable
from transformers import pipeline

nli = pipeline("text-classification",
               model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
               top_k=None)

# `llm` is any callable: prompt str -> generated str.
# Example: llm = lambda p: client.messages.create(model="claude-haiku-4-5", ...).content[0].text
LLM = Callable[[str], str]


def atomic_claims(answer: str, llm: LLM) -> list[str]:
    prompt = f"""Break this answer into simple factual claims (one per line):
{answer}
"""
    return llm(prompt).splitlines()


def faithfulness(answer: str, context: str, llm: LLM) -> float:
    claims = atomic_claims(answer, llm)
    if not claims:
        return 0.0
    supported = 0
    for claim in claims:
        result = nli({"text": context, "text_pair": claim})[0]
        entail = next((s for s in result if s["label"] == "entailment"), None)
        if entail and entail["score"] > 0.5:
            supported += 1
    return supported / len(claims)
```

Phân rã câu trả lời thành các khẳng định nguyên tử. Kiểm tra NLI mỗi khẳng định theo ngữ cảnh truy xuất. Độ trung thành = tỷ lệ được hỗ trợ.

### Step 2: answer relevance

```python
import numpy as np
from sentence_transformers import SentenceTransformer

# encoder: any model implementing .encode(texts, normalize_embeddings=True) -> ndarray
# e.g., encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")

def answer_relevance(question: str, answer: str, encoder, llm: LLM, n: int = 3) -> float:
    prompt = f"Write {n} questions this answer could be the answer to:\n{answer}"
    generated = [line for line in llm(prompt).splitlines() if line.strip()][:n]
    if not generated:
        return 0.0
    q_emb = np.asarray(encoder.encode([question], normalize_embeddings=True)[0])
    g_embs = np.asarray(encoder.encode(generated, normalize_embeddings=True))
    sims = [float(q_emb @ g_emb) for g_emb in g_embs]
    return sum(sims) / len(sims)
```

Nếu câu trả lời hàm ý các câu hỏi khác với câu được hỏi, tính liên quan giảm.

### Step 3: G-Eval custom metric

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams, LLMTestCase

metric = GEval(
    name="Correctness",
    criteria="The answer should be factually accurate and match the expected output.",
    evaluation_steps=[
        "Read the expected output.",
        "Read the actual output.",
        "List factual claims in the actual output.",
        "For each claim, mark supported or unsupported by the expected output.",
        "Return score = fraction supported.",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
)

test = LLMTestCase(input="When was the first iPhone released?",
                   actual_output="June 29th, 2007.",
                   expected_output="June 29, 2007.")
metric.measure(test)
print(metric.score, metric.reason)
```

Các bước đánh giá là rubric. Các bước tường minh ổn định hơn các prompt ngầm "chấm 0-1".

### Step 4: CI gate

```python
import deepeval
from deepeval.metrics import FaithfulnessMetric, ContextualRelevancyMetric


def test_rag_system():
    cases = load_regression_cases()
    faith = FaithfulnessMetric(threshold=0.85)
    rel = ContextualRelevancyMetric(threshold=0.7)
    for case in cases:
        faith.measure(case)
        assert faith.score >= 0.85, f"faithfulness regression on {case.id}"
        rel.measure(case)
        assert rel.score >= 0.7, f"relevancy regression on {case.id}"
```

Phát hành dưới dạng một file pytest. Chạy trên mỗi PR. Chặn merge khi có hồi quy.

### Step 5: toy eval from scratch

Xem `code/main.py`. Các xấp xỉ chỉ stdlib của độ trung thành (phần giao các khẳng định câu trả lời với ngữ cảnh) và tính liên quan (phần giao token câu trả lời với token câu hỏi). Không phải production. Cho thấy hình dạng.

## Pitfalls

- **Không hiệu chuẩn.** Một giám khảo có tương quan 0.3 với các nhãn con người là nhiễu. Yêu cầu một lượt hiệu chuẩn trước khi phát hành.
- **Tự đánh giá.** Dùng cùng LLM để sinh và đánh giá thổi phồng điểm 10-20%. Dùng một họ mô hình khác cho giám khảo.
- **Thiên lệch vị trí trong đánh giá từng cặp.** Các giám khảo thích lựa chọn được trình bày đầu tiên. Luôn ngẫu nhiên hóa thứ tự và chạy cả hai.
- **Tổng hợp thô che giấu lỗi.** Điểm trung bình 0.85 thường che giấu 5% lỗi thảm họa. Luôn kiểm tra phân vị thấp nhất.
- **Mục nát tập dữ liệu chuẩn.** Các tập đánh giá không được quản lý phiên bản trôi theo thời gian phá so sánh theo thời gian. Gắn thẻ tập dữ liệu với mỗi thay đổi.
- **Chi phí LLM.** Ở quy mô lớn, các lời gọi giám khảo chi phối chi phí. Dùng mô hình rẻ nhất đáp ứng ngưỡng hiệu chuẩn. GPT-4o-mini, Claude Haiku, Mistral-small.

## Use It

Ngăn xếp năm 2026:

| Trường hợp sử dụng | Framework |
|---------|-----------|
| Giám sát chất lượng RAG | RAGAS (4 thước đo) |
| Các cổng hồi quy CI/CD | DeepEval + pytest |
| Các tiêu chí lĩnh vực tùy chỉnh | G-Eval trong DeepEval |
| Giám sát trực tuyến lưu lượng trực tiếp | RAGAS với chế độ không tham chiếu |
| Kiểm tra ngẫu nhiên có con người trong vòng lặp | LangSmith hoặc Phoenix với UI chú giải |
| Red-teaming / đánh giá an toàn | Promptfoo + DeepEval |

Ngăn xếp điển hình: RAGAS để giám sát, DeepEval cho CI, G-Eval cho các chiều mới. Chạy cả ba; chúng bất đồng một cách hữu ích.

## Ship It

Lưu thành `outputs/skill-eval-architect.md`:

```markdown
---
name: eval-architect
description: Design an LLM evaluation plan with calibrated judge and CI gates.
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

Given a use case (RAG / agent / generative task), output:

1. Metrics. Faithfulness / relevance / context-precision / context-recall + any custom G-Eval metrics with criteria.
2. Judge model. Named model + version, rationale for cost vs accuracy.
3. Calibration. Hand-labeled set size, target Spearman rho vs human > 0.7.
4. Dataset versioning. Tag strategy, change log, stratification.
5. CI gate. Thresholds per metric, regression-window logic, bottom-quantile alert.

Refuse to rely on a judge untested against ≥50 human-labeled examples. Refuse self-evaluation (same model generates + judges). Refuse aggregate-only reporting without bottom-10% surfacing. Flag any pipeline where judge upgrade lands without parallel baseline eval.
```

## Exercises

1. **Dễ.** Dùng RAGAS trên 10 ví dụ RAG có ảo giác đã biết. Xác minh thước đo độ trung thành bắt được từng ví dụ.
2. **Trung bình.** Gán nhãn thủ công 50 câu trả lời QA 0-1 về tính đúng đắn. Chấm bằng G-Eval. Đo Spearman rho giữa giám khảo và con người.
3. **Khó.** Xây dựng một cổng CI pytest với DeepEval. Cố ý làm bộ truy xuất suy giảm. Xác minh cổng không đạt. Thêm cảnh báo phân vị thấp nhất qua kiểm tra ngưỡng trên 10% thấp nhất.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| LLM-as-judge (LLM làm giám khảo) | Chấm điểm bằng một LLM | Prompt một mô hình giám khảo chấm các đầu ra 0-1 theo một rubric. |
| RAGAS | Thư viện thước đo RAG | Framework đánh giá mã nguồn mở với 4 thước đo RAG không tham chiếu. |
| Faithfulness (Độ trung thành) | Câu trả lời có căn cứ không? | Tỷ lệ các khẳng định câu trả lời được ngữ cảnh truy xuất kéo theo. |
| Context precision (Precision ngữ cảnh) | Các khối truy xuất có liên quan không? | Tỷ lệ các khối top-K thực sự quan trọng. |
| Context recall (Recall ngữ cảnh) | Truy xuất có tìm mọi thứ không? | Tỷ lệ các khẳng định câu trả lời chuẩn được các khối truy xuất hỗ trợ. |
| G-Eval | Giám khảo LLM tùy chỉnh | Rubric + các bước đánh giá chain-of-thought + điểm 0-1. |
| Calibration (Hiệu chuẩn) | Tin nhưng xác minh | Tương quan Spearman giữa điểm giám khảo và điểm con người. |

## Further Reading

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) — bài báo RAGAS.
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) — bài báo G-Eval.
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) — ngăn xếp production mở.
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — các thiên lệch, hiệu chuẩn, giới hạn.
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) — framework thống nhất tích hợp RAGAS, DeepEval, Phoenix.
