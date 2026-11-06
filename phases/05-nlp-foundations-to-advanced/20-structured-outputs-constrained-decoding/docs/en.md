# Structured Outputs & Constrained Decoding

> Yêu cầu một LLM xuất JSON. Nhận JSON hầu hết số lần. Trong production, "hầu hết" là vấn đề. Giải mã có ràng buộc biến "hầu hết" thành "luôn luôn" bằng cách chỉnh logits trước khi lấy mẫu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## The Problem

Một bộ phân loại prompt một LLM: "Trả về một trong {positive, negative, neutral}." Mô hình trả "Cảm xúc là tích cực — đánh giá này hết sức thuận lợi vì khách hàng nêu rõ rằng họ ...". Bộ phân tích của bạn sập. F1 của bộ phân loại là 0.0.

Sinh tự do không phải một hợp đồng. Nó là một gợi ý. Một hệ thống production cần một hợp đồng.

Ba tầng tồn tại vào năm 2026.

1. **Prompting.** Yêu cầu lịch sự. "Chỉ trả đối tượng JSON." Hoạt động ~80% trên các mô hình tiên phong, ít hơn trên các mô hình nhỏ hơn.
2. **Các API đầu ra có cấu trúc gốc.** `response_format` của OpenAI, dùng công cụ của Anthropic, chế độ JSON của Gemini. Đáng tin cậy trên các schema được hỗ trợ. Bị khóa vào nhà cung cấp.
3. **Giải mã có ràng buộc.** Sửa logits ở mỗi bước sinh để mô hình *không thể* đưa ra các token không hợp lệ. Hợp lệ 100% do cách xây dựng. Hoạt động trên bất kỳ mô hình cục bộ nào.

Bài học này xây dựng trực giác cho cả ba và nêu khi nào nên chọn loại nào.

## The Concept

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Cách giải mã có ràng buộc hoạt động.** Ở mỗi bước sinh, LLM tạo một vector logit trên toàn bộ từ vựng (~100k token). Một *bộ xử lý logit* nằm giữa mô hình và bộ lấy mẫu. Nó tính những token nào hợp lệ khi biết vị trí hiện tại trong ngữ pháp đích — JSON Schema, regex, ngữ pháp phi ngữ cảnh — và đặt logits của mọi token không hợp lệ thành âm vô cực. Softmax trên các logits còn lại chỉ đặt khối lượng xác suất lên các phần tiếp nối hợp lệ.

Các triển khai năm 2026:

- **Outlines.** Biên dịch JSON Schema hoặc regex thành một máy trạng thái hữu hạn. Mỗi token có một tra cứu token tiếp theo hợp lệ $O(1)$. Dựa trên FSM, nên các schema đệ quy cần làm phẳng.
- **XGrammar / llguidance.** Các engine ngữ pháp phi ngữ cảnh. Xử lý JSON Schema đệ quy. Chi phí phụ giải mã gần bằng không. OpenAI ghi nhận llguidance trong triển khai đầu ra có cấu trúc năm 2025 của họ.
- **Giải mã có hướng dẫn vLLM.** `guided_json`, `guided_regex`, `guided_choice`, `guided_grammar` tích hợp qua các backend Outlines, XGrammar hoặc lm-format-enforcer.
- **Instructor.** Lớp bọc dựa trên Pydantic trên bất kỳ LLM nào. Thử lại khi xác thực thất bại. Xuyên nhà cung cấp, nhưng không sửa logits — nó dựa vào thử lại + các prompt nhận biết đầu ra có cấu trúc.

### The counterintuitive result

Giải mã có ràng buộc thường *nhanh hơn* sinh không ràng buộc. Hai lý do. Thứ nhất, nó thu hẹp không gian tìm kiếm token tiếp theo. Thứ hai, các triển khai thông minh bỏ qua hoàn toàn việc sinh token cho các token bắt buộc (khung như `{"name": "` — mọi byte đều được xác định).

### The pitfall that costs you

Thứ tự trường quan trọng. Đặt `answer` trước `reasoning`, và mô hình chốt một câu trả lời trước khi suy nghĩ. JSON hợp lệ. Câu trả lời sai. Không xác thực nào phát hiện nó.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Thứ tự trường schema là logic, không phải định dạng.

```figure
constrained-decoder
```

## Build It

### Step 1: regex-constrained generation from scratch

Xem `code/main.py` để có một triển khai FSM độc lập. Ý tưởng cốt lõi trong 30 dòng:

```python
def mask_logits(logits, valid_token_ids):
    mask = [float("-inf")] * len(logits)
    for tid in valid_token_ids:
        mask[tid] = logits[tid]
    return mask


def generate_constrained(model, tokenizer, prompt, fsm):
    ids = tokenizer.encode(prompt)
    state = fsm.initial_state
    while not fsm.is_accept(state):
        logits = model.next_token_logits(ids)
        valid = fsm.valid_tokens(state, tokenizer)
        logits = mask_logits(logits, valid)
        tok = sample(logits)
        ids.append(tok)
        state = fsm.transition(state, tok)
    return tokenizer.decode(ids)
```

FSM theo dõi những phần nào của ngữ pháp chúng ta đã thỏa mãn đến nay. `valid_tokens(state, tokenizer)` tính những token từ vựng nào có thể đưa FSM tiến lên mà không rời một đường dẫn chấp nhận.

### Step 2: Outlines for JSON Schema

```python
from pydantic import BaseModel
from typing import Literal
import outlines


class Review(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float
    evidence_span: str


model = outlines.models.transformers("meta-llama/Llama-3.2-3B-Instruct")
generator = outlines.generate.json(model, Review)

result = generator("Classify: 'The wait staff was attentive and the food arrived hot.'")
print(result)
# Review(sentiment='positive', confidence=0.93, evidence_span='attentive ... hot')
```

Không lỗi xác thực. Không bao giờ. FSM khiến đầu ra không hợp lệ không thể đạt tới.

### Step 3: Instructor for provider-agnostic Pydantic

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field


class Invoice(BaseModel):
    vendor: str
    total_usd: float = Field(ge=0)
    line_items: list[str]


client = instructor.from_anthropic(Anthropic())
invoice = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    response_model=Invoice,
    messages=[{"role": "user", "content": "Extract from: 'Acme Corp $420. Widget, Gizmo.'"}],
)
```

Cơ chế khác. Instructor không chạm logits. Nó định dạng schema vào prompt, phân tích đầu ra và thử lại khi xác thực thất bại (mặc định 3 lần). Hoạt động với bất kỳ nhà cung cấp nào. Các lần thử lại thêm độ trễ và chi phí. Khả năng di chuyển xuyên nhà cung cấp là điểm bán hàng.

### Step 4: native vendor APIs

```python
from openai import OpenAI

client = OpenAI()
response = client.responses.create(
    model="gpt-5",
    input=[{"role": "user", "content": "Classify: 'The food was cold.'"}],
    text={"format": {"type": "json_schema", "name": "sentiment",
          "schema": {"type": "object", "required": ["sentiment"],
                     "properties": {"sentiment": {"type": "string",
                                                  "enum": ["positive", "negative", "neutral"]}}}}},
)
print(response.output_parsed)
```

Giải mã có ràng buộc phía máy chủ. Độ tin cậy ngang Outlines cho các schema được hỗ trợ. Không quản lý mô hình cục bộ. Khóa bạn vào nhà cung cấp.

## Pitfalls

- **Các schema đệ quy.** Outlines làm phẳng đệ quy đến một độ sâu cố định. Các đầu ra cấu trúc cây (bình luận lồng nhau, AST) cần XGrammar hoặc llguidance (dựa trên CFG).
- **Các enum khổng lồ.** Enum 10,000 lựa chọn biên dịch chậm hoặc hết thời gian. Chuyển sang một bộ truy xuất: dự đoán các ứng viên top-k trước, ràng buộc vào chúng.
- **Ngữ pháp quá nghiêm.** Ép regex `date: "YYYY-MM-DD"` và mô hình không thể xuất `"unknown"` cho ngày bị thiếu. Mô hình bù bằng cách bịa một ngày. Cho phép `null` hoặc một giá trị đánh dấu.
- **Chốt quá sớm.** Xem cạm bẫy thứ tự trường ở trên. Luôn đặt suy luận trước.
- **Chế độ JSON nhà cung cấp không schema.** Chế độ JSON thuần chỉ bảo đảm JSON hợp lệ, không phải hợp lệ *cho trường hợp sử dụng của bạn*. Luôn cung cấp một schema đầy đủ.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Mô hình OpenAI/Anthropic/Google, schema đơn giản | Đầu ra có cấu trúc gốc của nhà cung cấp |
| Bất kỳ nhà cung cấp nào, quy trình Pydantic, có thể chấp nhận thử lại | Instructor |
| Mô hình cục bộ, cần tính hợp lệ 100%, schema phẳng | Outlines (FSM) |
| Mô hình cục bộ, schema đệ quy | XGrammar hoặc llguidance |
| Máy chủ suy luận tự lưu trữ | Giải mã có hướng dẫn vLLM |
| Xử lý batch chấp nhận thử lại | Instructor + mô hình rẻ nhất |

## Ship It

Lưu thành `outputs/skill-structured-output-picker.md`:

```markdown
---
name: structured-output-picker
description: Choose a structured output approach, schema design, and validation plan.
version: 1.0.0
phase: 5
lesson: 20
tags: [nlp, llm, structured-output]
---

Given a use case (provider, latency budget, schema complexity, failure tolerance), output:

1. Mechanism. Native vendor structured output, Instructor retries, Outlines FSM, or XGrammar CFG. One-sentence reason.
2. Schema design. Field order (reasoning first, answer last), nullable fields for "unknown", enum vs regex, required fields.
3. Failure strategy. Max retries, fallback model, graceful `null` handling, out-of-distribution refusal.
4. Validation plan. Schema compliance rate (target 100%), semantic validity (LLM-judge), field-coverage rate, latency p50/p99.

Refuse any design that puts `answer` or `decision` before reasoning fields. Refuse to use bare JSON mode without a schema. Flag recursive schemas behind an FSM-only library.
```

## Exercises

1. **Dễ.** Prompt một mô hình trọng số mở nhỏ (ví dụ, Llama-3.2-3B) không có giải mã có ràng buộc cho `Review(sentiment, confidence, evidence_span)`. Đo tỷ lệ phân tích được thành JSON hợp lệ trên 100 đánh giá.
2. **Trung bình.** Cùng ngữ liệu với chế độ JSON Outlines. So sánh tỷ lệ tuân thủ, độ trễ và độ chính xác ngữ nghĩa.
3. **Khó.** Triển khai một decoder bị ràng buộc bằng regex từ đầu cho số điện thoại (`\d{3}-\d{3}-\d{4}`). Xác minh 0 đầu ra không hợp lệ trên 1000 mẫu.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Constrained decoding (Giải mã có ràng buộc) | Ép đầu ra hợp lệ | Che logits token không hợp lệ ở mỗi bước sinh. |
| Logit processor (Bộ xử lý logit) | Thứ tạo ràng buộc | Hàm: `(logits, state) -> masked_logits`. |
| FSM | Máy trạng thái hữu hạn | Biểu diễn ngữ pháp đã biên dịch; tra cứu token tiếp theo hợp lệ $O(1)$. |
| CFG | Ngữ pháp phi ngữ cảnh | Ngữ pháp xử lý đệ quy; chậm hơn nhưng có sức biểu đạt lớn hơn FSM. |
| Schema field order (Thứ tự trường schema) | Nó có quan trọng không? | Có — trường đầu chốt; luôn đặt suy luận trước câu trả lời. |
| Guided decoding (Giải mã có hướng dẫn) | Tên vLLM đặt cho nó | Cùng khái niệm, được tích hợp vào máy chủ suy luận. |
| JSON mode (Chế độ JSON) | Phiên bản đầu của OpenAI | Bảo đảm cú pháp JSON; KHÔNG bảo đảm khớp schema. |

## Further Reading

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) — bài báo Outlines.
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) — giải mã có ràng buộc nhanh dựa trên CFG.
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) — tích hợp máy chủ suy luận.
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) — tham chiếu API + các cạm bẫy.
- [Instructor library](https://python.useinstructor.com/) — Pydantic + thử lại xuyên các nhà cung cấp.
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) — benchmark 6 framework giải mã có ràng buộc.
