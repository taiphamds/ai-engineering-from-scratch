# Long-Context Evaluation — NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro quảng bá ngữ cảnh 10M token. Ở 1M token, MRCR 8 kim giảm xuống 26.3%. Quảng bá ≠ dùng được. Đánh giá ngữ cảnh dài cho bạn biết dung lượng thực của mô hình mà bạn đang dựa vào để phát hành.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 23 (Chunking Strategies)
**Time:** ~60 minutes

## The Problem

Bạn có một hợp đồng 200 trang. Mô hình tuyên bố ngữ cảnh 1M token. Bạn dán hợp đồng vào và hỏi: "Điều khoản chấm dứt là gì?" Mô hình trả lời — nhưng trả lời từ trang bìa vì điều khoản chấm dứt nằm sâu ở 120k token, vượt nơi mô hình thực sự chú ý.

Đây là khoảng cách dung lượng ngữ cảnh năm 2026. Các bảng thông số nói 1M hoặc 10M. Thực tế nói 60-70% trong đó dùng được, và "dùng được" phụ thuộc tác vụ.

- **Truy xuất (một kim trong đống cỏ):** gần hoàn hảo đến mức tối đa được quảng bá trên các mô hình tiên phong.
- **Nhiều bước / tổng hợp:** suy giảm mạnh sau ~128k trên hầu hết các mô hình.
- **Suy luận trên các sự kiện phân tán:** tác vụ đầu tiên thất bại.

Đánh giá ngữ cảnh dài đo các trục này. Bài học này nêu tên các benchmark, mỗi benchmark thực sự đo gì và cách xây dựng một kiểm thử kim tùy chỉnh cho lĩnh vực của bạn.

## The Concept

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack (NIAH, 2023).** Đặt một sự kiện ("từ thần kỳ là dứa") ở một độ sâu được kiểm soát trong một ngữ cảnh dài. Yêu cầu mô hình truy xuất nó. Quét độ sâu × độ dài. Benchmark ngữ cảnh dài gốc. Các mô hình tiên phong hiện bão hòa benchmark này; nó là một baseline cần thiết nhưng không đủ.

**RULER (Nvidia, 2024).** 13 loại tác vụ trên 4 nhóm: truy xuất (một / nhiều khóa / nhiều giá trị), lần theo nhiều bước (theo dõi biến), tổng hợp (tần suất từ phổ biến), QA. Độ dài ngữ cảnh có thể cấu hình (4k đến 128k+). Bộc lộ các mô hình bão hòa NIAH nhưng thất bại ở nhiều bước. Trong bản phát hành năm 2024, chỉ một nửa của 17 mô hình tuyên bố ngữ cảnh 32k+ duy trì chất lượng tại 32k.

**LongBench v2 (2024).** 503 câu hỏi trắc nghiệm, các ngữ cảnh 8k-2M từ, sáu nhóm tác vụ: QA một tài liệu, QA nhiều tài liệu, học trong ngữ cảnh dài, hội thoại dài, kho mã, dữ liệu có cấu trúc dài. Benchmark production cho hành vi ngữ cảnh dài thực tế.

**MRCR (Multi-Round Coreference Resolution).** Đồng tham chiếu nhiều lượt ở quy mô lớn. Các biến thể 8 kim, 24 kim, 100 kim. Bộc lộ bao nhiêu sự kiện một mô hình có thể xử lý đồng thời trước khi attention suy giảm.

**NoLiMa.** "Kim phi từ vựng." Kim và truy vấn không có phần giao nguyên văn; truy xuất đòi hỏi một bước suy luận ngữ nghĩa. Khó hơn NIAH.

**HELMET.** Nối nhiều tài liệu, hỏi một câu hỏi từ bất kỳ tài liệu nào. Kiểm thử attention có chọn lọc.

**BABILong.** Nhúng các chuỗi suy luận bAbI trong các đống cỏ không liên quan. Kiểm thử suy luận-trong-đống-cỏ, không chỉ truy xuất.

### What to actually report

- **Cửa sổ ngữ cảnh được quảng bá.** Con số trên bảng thông số.
- **Độ dài truy xuất hiệu dụng.** Vượt NIAH tại một ngưỡng nào đó (ví dụ, 90%).
- **Độ dài suy luận hiệu dụng.** Vượt nhiều bước hoặc tổng hợp tại ngưỡng đó.
- **Đường cong suy giảm.** Accuracy theo độ dài ngữ cảnh, được vẽ cho mỗi loại tác vụ.

Hai con số cho bảng thông số của bạn: hiệu dụng truy xuất và hiệu dụng suy luận. Thường hiệu dụng suy luận là 25-50% của cửa sổ được quảng bá.

```figure
gx-niah-decay
```

## Build It

### Step 1: a custom NIAH for your domain

Xem `code/main.py`. Khung:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

Quét `depth_ratio` ∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens` ∈ {1k, 4k, 16k, 64k}. Vẽ bản đồ nhiệt. Đó là thẻ NIAH cho mô hình đích của bạn.

### Step 2: a multi-needle variant

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

Các câu hỏi như "Ba từ thần kỳ là gì?" yêu cầu truy xuất cả ba. Thành công một kim không dự đoán thành công nhiều kim.

### Step 3: multi-hop variable tracing (RULER-style)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

Câu trả lời yêu cầu nối ba phép gán. Các mô hình tiên phong tại 128k thường giảm xuống accuracy 50-70% ở đây.

### Step 4: LongBench v2 on your stack

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

Báo cáo accuracy theo nhóm. Các điểm tổng hợp che giấu các khác biệt lớn ở cấp tác vụ.

## Pitfalls

- **Đánh giá chỉ NIAH.** Vượt NIAH tại 1M token không nói gì về nhiều bước. Luôn chạy RULER hoặc một kiểm thử nhiều bước tùy chỉnh.
- **Lấy mẫu độ sâu đồng đều.** Nhiều triển khai chỉ kiểm thử depth=0.5. Kiểm thử depth=0, 0.25, 0.5, 0.75, 1.0 — hiệu ứng "lạc ở giữa" là có thật.
- **Phần giao từ vựng với phần đệm.** Nếu kim có chung từ khóa với phần đệm, truy xuất trở nên tầm thường. Dùng các kim không giao nhau kiểu NoLiMa.
- **Bỏ qua độ trễ.** Các prompt 1M token mất 30-120 giây để prefill. Đo thời gian đến token đầu cùng accuracy.
- **Các con số nhà cung cấp tự báo cáo.** OpenAI, Google, Anthropic đều công bố các điểm riêng. Luôn chạy lại độc lập trên trường hợp sử dụng của bạn.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Benchmark |
|-----------|-----------|
| Kiểm tra hợp lý nhanh | NIAH tùy chỉnh tại 3 độ sâu × 3 độ dài |
| Lựa chọn mô hình cho production | RULER (13 tác vụ) tại độ dài đích của bạn |
| Chất lượng QA thực tế | Tập con QA một tài liệu LongBench v2 |
| Suy luận nhiều bước | BABILong hoặc lần theo biến tùy chỉnh |
| Hội thoại / đối thoại | MRCR 8 kim tại độ dài đích của bạn |
| Hồi quy nâng cấp mô hình | Bộ chạy kiểm thử NIAH + RULER nội bộ cố định, chạy trên mỗi mô hình mới |

Quy tắc kinh nghiệm cho production: không bao giờ tin một cửa sổ ngữ cảnh cho đến khi bạn có NIAH + 1 tác vụ suy luận tại độ dài dự định.

## Ship It

Lưu thành `outputs/skill-long-context-eval.md`:

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

## Exercises

1. **Dễ.** Xây dựng một NIAH với 3 độ sâu (0.25, 0.5, 0.75) × 3 độ dài (1k, 4k, 16k). Chạy trên bất kỳ mô hình nào. Vẽ tỷ lệ đạt thành một bản đồ nhiệt 3×3.
2. **Trung bình.** Thêm một biến thể 3 kim. Đo truy xuất cả 3 ở mỗi độ dài. So sánh với tỷ lệ đạt một kim tại cùng độ dài.
3. **Khó.** Xây dựng một tác vụ lần theo biến (X1 → X2 → X3, với 3 bước) được nhúng trong 64k phần đệm. Đo accuracy trên 3 mô hình tiên phong. Báo cáo độ dài suy luận hiệu dụng cho mỗi mô hình.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| NIAH | Kim trong đống cỏ | Cài một sự kiện trong phần đệm, yêu cầu mô hình truy xuất nó. |
| RULER | NIAH được tăng cường | 13 loại tác vụ trên truy xuất / nhiều bước / tổng hợp / QA. |
| Effective context (Ngữ cảnh hiệu dụng) | Dung lượng thực | Độ dài mà accuracy vẫn giữ trên ngưỡng. |
| Lost in the middle (Lạc ở giữa) | Thiên lệch độ sâu | Các mô hình chú ý không đủ đến nội dung ở giữa các đầu vào dài. |
| Multi-needle (Nhiều kim) | Nhiều sự kiện cùng lúc | Nhiều phần được cài; kiểm thử xử lý attention đồng thời, không chỉ truy xuất. |
| MRCR | Đồng tham chiếu nhiều lượt | Đồng tham chiếu 8, 24 hoặc 100 kim; bộc lộ bão hòa attention. |
| NoLiMa | Kim phi từ vựng | Kim và truy vấn không có token nguyên văn chung; đòi hỏi suy luận. |

## Further Reading

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) — kho NIAH gốc.
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) — benchmark đa tác vụ.
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) — đánh giá ngữ cảnh dài thực tế.
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) — các kim khó hơn.
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) — suy luận-trong-đống-cỏ.
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) — bài báo thiên lệch độ sâu.
