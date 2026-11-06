# Differential Attention (V2)

> Attention softmax trải một lượng xác suất nhỏ lên mọi token không khớp. Qua 100k token, nhiễu cộng dồn và nhấn chìm tín hiệu. Differential Transformer (Ye và cộng sự, ICLR 2025) sửa bằng tính attention như hiệu hai softmax, trừ nền nhiễu chung. DIFF V2 (Microsoft, tháng 1 năm 2026) là bản viết lại cho bộ production: độ trễ decode khớp Transformer cơ sở, không kernel tùy chỉnh, tương thích FlashAttention. Bài này đi từ V1 đến V2 đầu cuối, với triển khai đồ chơi chạy được của phép hiệu bằng Python stdlib.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 02 (self-attention), Phase 7 · 15 (attention variants), Phase 10 · 14 (architecture walkthrough)
**Time:** ~60 minutes

## Learning Objectives

- Nêu chính xác vì sao attention softmax có nền nhiễu và vì sao nó tăng theo độ dài ngữ cảnh.
- Suy ra công thức attention vi sai và giải thích vì sao phép trừ triệt thành phần nhiễu chung trong khi giữ tín hiệu.
- Duyệt diff V1 sang V2: thứ gì nhanh hơn, đơn giản hơn, ổn định hơn, và vì sao mỗi thay đổi cần cho huấn luyện trước production.
- Triển khai attention vi sai từ đầu bằng Python thuần và xác minh thực nghiệm tính khử nhiễu trên query tín hiệu-cộng-nhiễu tổng hợp.

## The Problem

Softmax attention tiêu chuẩn có một tính chất toán học trở thành một vấn đề vận hành khó chịu ở quy mô lớn. Đối với một query `q`, các trọng số attention là `softmax(qK^T / sqrt(d))`. Softmax không bao giờ tạo được các giá trị 0 chính xác: mọi token không khớp nhận một lượng xác suất dương nào đó. Lượng xác suất còn dư đó là nhiễu, và nó tăng theo độ dài ngữ cảnh. Ở 128k token, ngay cả khi mỗi token không khớp chỉ nhận 0.0001% xác suất, 127,999 token đó kết hợp đóng góp khoảng 13% tổng số. Mô hình phải học cách định tuyến vòng qua một nền nhiễu tăng theo ngữ cảnh.

Thực nghiệm cho thấy nhiễu giữa head attention: trích dẫn ảo giác trong RAG ngữ cảnh dài, thất bại lost-in-the-middle trên truy xuất 100k token, và suy giảm chính xác tinh tế trên benchmark needle-in-haystack quá 32k. Bài báo Differential Transformer (arXiv:2410.05258, ICLR 2025) đo khoảng cách: DIFF Transformer đạt perplexity thấp hơn, chính xác ngữ cảnh dài cao hơn và ít ảo giác hơn baseline cùng kích thước.

DIFF V1 có ba vấn đề ngăn nó vào pipeline huấn luyện trước hàng đầu. Cache value phải tải hai lần mỗi bước decode, cần kernel CUDA tùy chỉnh phá tương thích FlashAttention, và RMSNorm theo head làm bất ổn huấn luyện dài ở quy mô 70B trở lên. DIFF V2 (blog Microsoft unilm, ngày 20 tháng 1 năm 2026) sửa cả ba. Bài này duyệt cả hai bản, xây toán tử hiệu và benchmark khử nhiễu trên query đồ chơi.

## The Concept

### The noise floor of softmax

Với query `q` và key `K = [k_1, ..., k_N]`, trọng số attention là:

```math
w_i = \frac{\exp(q \cdot k_i / \sqrt{d})}{\sum_j \exp(q \cdot k_j / \sqrt{d})}
```

Không `w_i` nào bằng không. Nếu `k_i` hoàn toàn không liên quan `q`, điểm `q . k_i` không phải 0 — nó dao động quanh không với phương sai `||q||^2 / d`. Sau chuẩn hóa softmax, mỗi token không liên quan vẫn đóng góp `O(1/N)` vào tổng có trọng số. Tổng đóng góp token không liên quan là `O((N-1)/N) = O(1)` — không phải lượng nhỏ.

Mô hình muốn thứ như top-k cứng: trọng số cao trên token khớp, gần không ở mọi nơi khác. Softmax quá trơn để làm trực tiếp.

### The differential idea

Chia phép chiếu Q và K mỗi head thành hai: $Q = (Q_1, Q_2)$ và $K = (K_1, K_2)$. Tính hai bản đồ attention:

```math
\begin{aligned}
A_1 &= \mathop{\mathrm{softmax}}(Q_1 K_1^T / \sqrt{d}) \\
A_2 &= \mathop{\mathrm{softmax}}(Q_2 K_2^T / \sqrt{d})
\end{aligned}
```

Đầu ra:

```math
\mathop{\mathrm{DiffAttn}} = (A_1 - \lambda \cdot A_2) V
```

Phép trừ triệt mọi phân phối nhiễu hai bản đồ chung. Nếu cả hai có trọng số gần đều trên 127k token không liên quan (điều sẽ xảy ra ở khởi tạo ngẫu nhiên), chúng triệt. Tín hiệu — trọng số nhọn trên vài token thực sự liên quan — chỉ triệt nếu xuất hiện ở cả hai cùng độ lớn, điều sẽ không xảy ra khi mô hình huấn luyện.

`lambda` là vô hướng có thể học mỗi head, tham số hóa thành `lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`. Nó có thể âm. `lambda_init` mặc định số dương nhỏ như 0.8.

### Why this matches headed noise-canceling

Nghĩ hai micro nhiều nhiễu thu cùng giọng. Cả hai thu người nói cộng nhiễu nền tương quan. Trừ một khỏi kia và nhiễu chung mất. Giọng sống sót vì hai tín hiệu khác pha hoặc biên độ đủ ngăn triệt hoàn toàn. `lambda` theo head học chính cân bằng này.

### V1 vs V2: the diff

V1 giữ tham số bằng Transformer cơ sở. Để có hai query mỗi head, nó giảm nửa số chiều head. Điều đó tốn sức biểu đạt head và — đau hơn — giảm nửa cache value mỗi head. Decode phải tải cache value hai lần mỗi bước (mỗi nhánh softmax một lần). Kết quả: decode chậm hơn baseline dù cùng số tham số.

V2 tăng gấp đôi số head query và giữ head KV như cũ (mượn tham số từ phép chiếu lên). Số chiều head giữ như baseline. Sau phép trừ, chiều bổ sung được chiếu xuống lại để khớp phép chiếu $O_W$ của Transformer cơ sở. Ba thứ đồng thời xảy ra:

1. Tốc độ decode khớp baseline (KV cache tải một lần).
2. FlashAttention chạy không đổi (không kernel tùy chỉnh).
3. Cường độ số học khi decode tăng (nhiều tính toán mỗi byte tải từ HBM).

V2 cũng bỏ RMSNorm theo head mà V1 dùng để ổn định phép trừ. Ở quy mô huấn luyện trước hạng 70B, RMSNorm đó gây bất ổn cuối huấn luyện. V2 thay bằng cách khởi tạo đơn giản hơn giữ huấn luyện ổn định không mô-đun bổ sung.

### When to reach for it

| Khối lượng công việc | Lợi ích |
|----------|---------|
| RAG ngữ cảnh dài (64k+) | Bản đồ attention sạch hơn, ít trích dẫn ảo giác hơn |
| Benchmark needle-in-haystack | Tăng chính xác đáng kể quá 32k |
| Hỏi đáp nhiều tài liệu | Ít nhiễu chéo tài liệu hơn |
| Hoàn thành mã ở 8k | Nhỏ, không đáng thay kiến trúc |
| Chat ngắn (< 4k) | Về cơ bản không phân biệt baseline |

Giá trị tăng theo độ dài ngữ cảnh. Ở 4k token, nền nhiễu đủ nhỏ để attention tiêu chuẩn ổn. Ở 128k nó đang gây hại.

### How it stacks with other 2026 knobs

| Tính năng | Tương thích DIFF V2? |
|---------|------------------------|
| GQA | Có (V2 tăng head Q, không head KV) |
| MLA (DeepSeek) | Có về nguyên tắc, chưa bài công bố kết hợp |
| MoE | Có (attention độc lập khối MLP) |
| RoPE | Có (không đổi) |
| YaRN / co giãn ngữ cảnh dài | Có (chính nơi DIFF giúp nhất) |
| FlashAttention | Có ở V2 (không ở V1) |
| Speculative decoding | Có (thay attention vô hình với vòng spec-decode) |

```figure
differential-attention
```

## Build It

`code/main.py` triển khai attention vi sai bằng Python thuần. Query đồ chơi có cấu trúc tín hiệu-cộng-nhiễu đã biết cho phép đo trực tiếp tỷ lệ khử nhiễu.

### Step 1: standard softmax attention

Phép ma trận stdlib: danh sách của danh sách, nhân ma trận thủ công, softmax trừ cực đại để ổn định số.

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Step 2: split Q, K into two halves

Kiểu V1: giảm nửa số chiều head. Kiểu V2: giữ số chiều head và tăng gấp đôi số head. Triển khai đồ chơi dùng V1 cho rõ sư phạm — toán giống hệt, chỉ khác sổ sách.

### Step 3: two softmax branches + subtraction

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Lưu ý: trọng số đầu ra có thể âm. Điều đó ổn — cache value vẫn xử lý đóng góp có dấu. Phép chiếu V sau hấp thụ dấu.

### Step 4: noise cancellation measurement

Xây chuỗi tổng hợp dài 1024. Đặt token tín hiệu ở vị trí biết trước, lấp phần còn lại bằng nhiễu. Tính (a) trọng số attention softmax tiêu chuẩn trên vị trí tín hiệu và (b) trọng số attention vi sai. Đo tỷ lệ tín hiệu/nhiễu mỗi cách. DIFF attention tạo tỷ lệ tín hiệu/nhiễu cao hơn đáng tin cậy với hệ số 3x-10x tùy mức hai nhánh được huấn luyện để khác.

### Step 5: V1 vs V2 parameter accounting

Với cấu hình (hidden=4096, heads=32, d_head=128), in:

- Transformer cơ sở: Q, K, V mỗi cái kích thước `hidden * hidden`, MLP ở 4 * hidden.
- DIFF V1: Q, K mỗi cái kích thước `hidden * hidden`, V kích thước `hidden * hidden` (không đổi), số chiều head giảm nửa nội bộ. Thêm tham số `lambda` theo head $(O(\text{heads} \cdot d_{\text{head}}))$.
- DIFF V2: Q kích thước `2 * hidden * hidden`, K kích thước `hidden * hidden`, V kích thước `hidden * hidden`. Chiều thêm được chiếu xuống lại trước $O_W$. Thêm cùng tham số `lambda`.

Mô hình đồ chơi đo chi phí tham số thêm cho V2 (khoảng thêm `hidden * hidden` mỗi khối attention) và in ra.

## Use It

DIFF V2 chưa được cung cấp trong mọi máy chủ suy luận production tính đến tháng 4 năm 2026, nhưng tích hợp đang diễn ra trong vLLM và SGLang. Trong khi đó mô thức xuất hiện ở:

- Mô hình production ngữ cảnh dài nội bộ Microsoft.
- Các bản tái lập nghiên cứu trong vài lần huấn luyện mô hình mở nhắm ngữ cảnh 256k trở lên.
- Kiến trúc lai kết hợp DIFF attention với attention cửa sổ trượt ở lớp xen kẽ.

Khi nào bạn sẽ dùng vào năm 2026:

- Huấn luyện mô hình mới từ đầu nhắm ngữ cảnh hiệu dụng 64k trở lên. Thêm attention vi sai ngay từ đầu; huấn luyện lại sau đắt.
- Tinh chỉnh mô hình ngữ cảnh dài mà thất bại lost-in-the-middle chi phối đánh giá. LoRA trên phép chiếu Q có thể xấp xỉ cấu trúc DIFF.

Khi nào không:

- Bạn đang phục vụ mô hình dense huấn luyện trước có hiệu năng ngữ cảnh dài ổn định. Chi phí huấn luyện lại hiếm khi hoàn vốn trên trọng số hiện có.
- Ngữ cảnh luôn dưới 16k. Nền nhiễu không đáng kể.

## Ship It

Bài này tạo ra `outputs/skill-diff-attention-integrator.md`. Với kiến trúc mô hình, ngữ cảnh mục tiêu, đặc điểm ảo giác và ngân sách huấn luyện, nó tạo kế hoạch tích hợp thêm attention vi sai vào lần huấn luyện trước mới hoặc tinh chỉnh LoRA.

## Exercises

1. Chạy `code/main.py`. Xác minh tỷ lệ tín hiệu/nhiễu được báo cho attention vi sai cao hơn softmax tiêu chuẩn trên query tổng hợp. Thay biên độ nhiễu và cho thấy điểm giao nơi attention tiêu chuẩn không dùng được.

2. Tính độ chênh số tham số từ baseline sang DIFF V1 và từ baseline sang DIFF V2 cho mô hình hạng 7B (hidden=4096, heads=32, d_head=128, 32 lớp). Cho thấy thành phần nào tăng tham số, thành phần nào giữ nguyên.

3. Đọc Mục 3 bài DIFF V1 (arXiv:2410.05258) và Mục 2 blog Hugging Face DIFF V2. Trong hai câu, giải thích vì sao RMSNorm theo head V1 cần thiết và vì sao V2 bỏ được mà không gây phân kỳ huấn luyện.

4. Triển khai thử nghiệm loại bỏ: tính attention vi sai với `lambda = 0` (softmax đầu thuần) và `lambda = 1` (trừ đầy đủ). Trên query tổng hợp, đo tín hiệu/nhiễu đổi qua phép quét. Xác định `lambda` tối đa tín hiệu/nhiễu.

5. Mở rộng mô hình đồ chơi sang GQA + DIFF V2. Chọn 8 head KV và 32 head Q. Cho thấy kích thước KV cache khớp mô hình GQA cơ sở cùng cấu hình (8, 32).

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Differential attention (Attention vi sai) | "Hai softmax trừ nhau" | Chia Q, K thành hai nửa, tính hai bản đồ softmax, trừ bản thứ hai (co giãn bằng $\lambda$) khỏi thứ nhất, rồi nhân V |
| Noise floor (Nền nhiễu) | "Đuôi khác không của softmax" | Trọng số $O(1/N)$ softmax đặt trên mọi token không liên quan, cộng thành $O(1)$ qua ngữ cảnh dài |
| lambda | "Hệ số phép trừ" | Vô hướng có thể học theo head tham số hóa thành `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`; có thể âm |
| DIFF V1 | "Phiên bản ICLR 2025" | Differential Transformer gốc; giảm nửa số chiều head để giữ tham số, cần kernel tùy chỉnh, decode chậm hơn |
| DIFF V2 | "Bản sửa tháng 1 năm 2026" | Tăng gấp đôi head Q, giữ head KV; khớp tốc độ decode cơ sở và chạy với FlashAttention |
| Per-head RMSNorm (RMSNorm theo head) | "Bộ ổn định V1" | Norm thêm V1 áp dụng sau hiệu; V2 bỏ để ngăn bất ổn cuối huấn luyện |
| Signal-to-noise ratio (Tỷ lệ tín hiệu trên nhiễu) | "Bao nhiêu attention lãng phí" | Tỷ lệ trọng số trên vị trí tín hiệu thật so với trọng số trung bình trên vị trí không liên quan |
| Lost in the middle (Lạc ở giữa) | "Kiểu thất bại ngữ cảnh dài" | Hiện tượng thực nghiệm độ chính xác truy xuất giảm với tài liệu giữa ngữ cảnh dài — DIFF attention giảm điều này |
| Arithmetic intensity (Cường độ số học) | "FLOPs mỗi byte tải" | Tỷ lệ V2 tăng khi decode bằng gấp đôi query mỗi lần tải KV; quan trọng cho decode giới hạn bộ nhớ |

## Further Reading

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) — bài báo gốc với lý thuyết khử nhiễu và thử nghiệm loại bỏ ngữ cảnh dài
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) — viết lại cho bộ production, khớp decode cơ sở, tương thích FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333) — phân tích lý thuyết vì sao phép trừ khôi phục cấu trúc attention huấn luyện trước
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) — biến thể chia sẻ tham số
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) — Transformer cơ sở mà DIFF trừ từ đó
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) — benchmark ngữ cảnh dài DIFF attention nhắm đến
