# GPT — Causal Language Modeling

> BERT thấy cả hai phía. GPT chỉ thấy quá khứ. Mặt nạ tam giác là dòng mã đơn lẻ có hệ quả lớn nhất trong AI hiện đại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 06 (BERT)
**Time:** ~75 minutes

## The Problem

Một mô hình ngôn ngữ trả lời một câu hỏi: cho `t-1` token đầu, phân phối xác suất trên token `t` là gì? Huấn luyện trên tín hiệu đó — dự đoán token tiếp theo — và bạn nhận một mô hình có thể sinh văn bản tùy ý từng token một.

Để huấn luyện nó đầu cuối trên cả một chuỗi song song, bạn cần dự đoán của mỗi vị trí chỉ phụ thuộc các vị trí trước. Nếu không mô hình dễ dàng gian lận bằng cách nhìn câu trả lời.

Mặt nạ nhân quả làm điều này. Nó là một ma trận tam giác trên duy nhất các giá trị `-inf` được thêm vào các điểm attention trước softmax. Sau softmax, các vị trí đó trở thành 0. Mỗi vị trí chỉ có thể chú ý chính nó và các vị trí trước. Và vì bạn áp dụng nó một lần cho toàn chuỗi, bạn nhận N dự đoán token tiếp theo song song trong một lượt truyền xuôi.

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2025), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi — tất cả đều là transformer nhân quả chỉ decoder với cùng vòng lặp cốt lõi. Thứ phân biệt chúng là chất lượng dữ liệu, quy mô và các tinh chỉnh kiến trúc, cùng hậu huấn luyện (SFT, RLHF, DPO và các phương pháp kế tiếp).

## The Concept

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### The mask

Cho một chuỗi có độ dài $N$, xây dựng một ma trận $N \times N$:

```math
M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}
```

Cộng `M` vào các điểm attention thô trước softmax. $\exp(-\infty) = 0$, vì vậy các vị trí bị che đóng góp trọng số bằng không. Mỗi hàng của ma trận attention là một phân phối xác suất chỉ trên các vị trí trước đó.

Chi phí triển khai: một lời gọi `torch.tril()`. Thời gian tính: nano giây. Tác động lên lĩnh vực: mọi thứ.

### Where the triangle comes from

Mặt nạ thường được trình bày như một miếng vá gắn vào attention. Chạy suy dẫn theo chiều ngược và nó ngừng bí ẩn: attention là tinh chỉnh thứ ba của một trung bình tiền tố, và tam giác là các giới hạn vòng lặp của trung bình đó, được viết thành một ma trận.

**Giai đoạn 1 — trung bình tiền tố.** Bản tóm tắt nhân quả ngớ ngẩn nhất của một chuỗi: vị trí $i$ trở thành trung bình các vị trí $0 \ldots i$. Dưới dạng vòng lặp, đó là `out[i] = X[:i+1].mean(0)`. Cùng phép tính là một phép nhân ma trận. Lấy một ma trận tam giác dưới toàn số một, chia mỗi hàng cho số đếm của nó, nhân:

```python
import numpy as np

A = np.tril(np.ones((n, n)))
A = A / A.sum(axis=1, keepdims=True)
out = A @ X
```

Hàng $i$ của $A$ là $[1/(i+1), \ldots, 1/(i+1), 0, \ldots, 0]$. Các số không trên đường chéo là tính nhân quả. Không có gì về tương lai bị che đi; tương lai chưa bao giờ nằm trong tổng.

**Giai đoạn 2 — các trọng số được học.** Một trung bình đều coi mọi token quá khứ liên quan ngang nhau. Thay các số một bằng một ma trận điểm được học `S`. Giờ các hàng không còn có tổng bằng một do cách xây dựng, nên chuẩn hóa mỗi hàng bằng softmax thay vì chia cho số đếm. Softmax không bao giờ xuất một số không chính xác, điều phá tính nhân quả — trừ khi các điểm tương lai đi vào dưới dạng `-inf`, vì `exp(-inf) = 0`:

```python
def softmax(x, axis):
    e = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

S = S + np.triu(np.full((n, n), -np.inf), k=1)
A = softmax(S, axis=1)
out = A @ X
```

Cùng tam giác, cùng ma trận ngẫu nhiên theo hàng, cùng một phép nhân ma trận. Mặt nạ `-inf` không phải bộ máy mới. Nó là các phần tử không của giai đoạn 1, được chuyển sang miền đầu vào của softmax.

**Giai đoạn 3 — các trọng số phụ thuộc nội dung.** Trong giai đoạn 2, `S` cố định sau huấn luyện: vị trí 7 luôn gán trọng số cho vị trí 3 như nhau, bất kể các token nói gì. Để các điểm phụ thuộc chính các token: `S = Q @ K.T / sqrt(d_k)`. Không có gì khác thay đổi. Mặt nạ, softmax, nhân ma trận — giống hệt.

Ba giai đoạn, một bất biến: một ma trận ngẫu nhiên theo hàng tam giác dưới nhân chuỗi. Trung bình đều, các trọng số tĩnh được học, các trọng số phụ thuộc nội dung. Mặt nạ chưa bao giờ được thêm vào attention. Nó sống sót từ trung bình.

```figure
mask-derivation
```

### Parallel training, serial inference

Huấn luyện: truyền xuôi toàn bộ chuỗi `(N, d_model)` một lần, tính N cross-entropy loss (một cho mỗi vị trí), cộng, lan truyền ngược. Song song dọc chuỗi. Đây là lý do huấn luyện GPT mở rộng được — bạn xử lý 1M token trong một batch trong một lượt GPU.

Suy luận: bạn sinh từng token. Đưa `[t1, t2, t3]`, nhận `t4`. Đưa `[t1, t2, t3, t4]`, nhận `t5`. Đưa `[t1, t2, t3, t4, t5]`, nhận `t6`. KV cache (Bài 12) lưu các trạng thái ẩn của `t1…tn` để bạn không tính lại chúng mỗi bước. Nhưng độ sâu nối tiếp khi suy luận = độ dài đầu ra. Đó là thuế tự hồi quy và lý do giải mã là nút thắt độ trễ của mọi LLM.

### The loss — shift-by-one

Cho các token `[t1, t2, t3, t4]`:

- Đầu vào: `[t1, t2, t3]`
- Các đích: `[t2, t3, t4]`

Với mỗi vị trí `i`, tính `-log P(target_i | inputs[:i+1])`. Cộng. Đây là cross-entropy cho toàn chuỗi.

Mọi LM transformer bạn đã nghe đều huấn luyện trên loss này. Tiền huấn luyện, fine-tuning, SFT — cùng loss, dữ liệu khác nhau.

### Decoding strategies

Sau huấn luyện, các lựa chọn lấy mẫu quan trọng hơn mọi người nghĩ.

| Phương pháp | Nó làm gì | Khi nào dùng |
|--------|--------------|-------------|
| Tham lam | Argmax mỗi bước | Các tác vụ tất định, hoàn thành mã |
| Temperature | Chia logits cho T, lấy mẫu | Các tác vụ sáng tạo, T cao hơn = đa dạng hơn |
| Top-k | Chỉ lấy mẫu từ các token top-k | Loại các đuôi xác suất thấp |
| Top-p (nucleus) | Lấy mẫu từ tập nhỏ nhất có xác suất tích lũy ≥ p | Mặc định từ 2020+; thích nghi với hình dạng phân phối |
| Min-p | Giữ các token có `p > min_p * max_p` | Từ 2024+; tốt hơn top-p trong việc loại các đuôi dài |
| Speculative decoding | Mô hình nháp đề xuất N token, mô hình lớn xác minh | Giảm độ trễ 2–3× ở cùng chất lượng |

Năm 2026, min-p + temperature 0.7 là một mặc định hợp lý cho các mô hình trọng số mở. Speculative decoding là điều kiện tối thiểu cho bất kỳ ngăn xếp suy luận production nào.

### What made the "GPT recipe" work

1. **Chỉ decoder.** Không chi phí phụ encoder. Một lượt attention + FFN mỗi tầng.
2. **Mở rộng quy mô.** 124M → 1.5B → 175B → hàng nghìn tỷ. Các quy luật mở rộng Chinchilla (Bài 13) cho bạn biết cách chi tiêu tính toán.
3. **Học trong ngữ cảnh.** Xuất hiện quanh 6B–13B. Mô hình có thể theo các ví dụ few-shot không cần fine-tuning.
4. **RLHF.** Hậu huấn luyện trên các ưu tiên con người chuyển văn bản tiền huấn luyện thô thành các trợ lý trò chuyện.
5. **Pre-norm + RoPE + SwiGLU.** Huấn luyện ổn định ở quy mô lớn.

Kiến trúc cốt lõi không thay đổi nhiều từ GPT-2. Mọi điều thú vị xảy ra ở dữ liệu, quy mô và hậu huấn luyện.

```figure
causal-mask
```

## Build It

### Step 1: the causal mask

Xem `code/main.py`. Một dòng:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Thêm nó vào các điểm attention trước softmax. Đó là toàn bộ cơ chế.

### Step 2: a 2-layer GPT-ish model

Xếp hai khối decoder (self-attention được che + FFN, không cross-attention). Thêm một embedding token, một mã hóa vị trí và một unembedding (buộc chung với ma trận embedding token — một thủ thuật tiêu chuẩn từ GPT-2).

### Step 3: next-token prediction, end-to-end

Trên một từ vựng đồ chơi 20 token, tạo logits ở mọi vị trí. Tính cross-entropy loss so với đích dịch một vị trí. Không gradient — đây là một kiểm tra hợp lý lượt truyền xuôi.

### Step 4: sampling

Triển khai tham lam, temperature, top-k, top-p, min-p. Chạy mỗi loại trên một prompt cố định và so sánh các đầu ra. Một hàm lấy mẫu dài 10 dòng.

## Use It

PyTorch, cách viết năm 2026:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

Bên dưới, `generate()` chạy lượt truyền xuôi, lấy logits vị trí cuối, lấy mẫu token tiếp theo, nối nó và lặp lại. Mọi ngăn xếp suy luận LLM production (vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX) triển khai cùng vòng lặp với tối ưu hóa mạnh — prefill theo batch, batching liên tục, phân trang KV cache, speculative decoding.

**GPT so với BERT, mỗi loại một dòng:** GPT dự đoán $P(x_t \mid x_{<t})$. BERT dự đoán $P(x_{\text{masked}} \mid x_{\text{unmasked}})$. Loss quyết định mô hình có thể sinh hay không.

## Ship It

Xem `outputs/skill-sampling-tuner.md`. Skill chọn các tham số lấy mẫu cho một tác vụ sinh mới và đánh dấu khi cần giải mã tất định.

## Exercises

1. **Dễ.** Chạy `code/main.py` và xác minh ma trận attention nhân quả là tam giác dưới sau softmax. Kiểm tra ngẫu nhiên: hàng 3 chỉ nên có các trọng số ở cột 0–3.
2. **Trung bình.** Triển khai beam search độ rộng 4. So sánh perplexity của beam-4 với tham lam trên 10 prompt ngắn. Beam có luôn thắng không? (Gợi ý: thường cho dịch, không phải cho trò chuyện mở.)
3. **Khó.** Triển khai speculative decoding: dùng một mô hình 2 tầng tí hon làm nháp và một mô hình 6 tầng làm bộ xác minh. Đo mức tăng tốc thời gian thực trên 100 lượt hoàn thành dài 64. Xác nhận các đầu ra khớp tham lam của bộ xác minh.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Causal mask (Mặt nạ nhân quả) | "Tam giác" | Ma trận `-inf` tam giác trên được thêm vào các điểm attention để vị trí `i` chỉ thấy các vị trí `≤ i`. |
| Next-token prediction (Dự đoán token tiếp theo) | "Loss" | Cross-entropy của phân phối mô hình so với token tiếp theo thật ở mọi vị trí. |
| Autoregressive (Tự hồi quy) | "Sinh từng cái một" | Đưa đầu ra trở lại làm đầu vào; tính song song chỉ trong huấn luyện, không trong sinh. |
| Logits | "Các điểm trước softmax" | Đầu ra thô của head LM trước softmax; lấy mẫu xảy ra trên chúng. |
| Temperature | "Nút điều chỉnh sáng tạo" | Chia logits cho $T$; $T \to 0$ = tham lam, $T \to \infty$ = đều. |
| Top-p | "Lấy mẫu nucleus" | Cắt phân phối về tập nhỏ nhất có tổng $\ge p$; lấy mẫu từ phần còn lại. |
| Min-p | "Tốt hơn top-p" | Giữ các token mà `p ≥ min_p × max_p`; điều chỉnh ngưỡng cắt theo độ nhọn phân phối. |
| Speculative decoding (Giải mã suy đoán) | "Nháp + xác minh" | Mô hình rẻ đề xuất N token; mô hình lớn xác minh song song. |
| Teacher forcing | "Thủ thuật huấn luyện" | Khi huấn luyện, đưa token trước thật vào, không phải dự đoán của mô hình. Tiêu chuẩn cho mọi LM seq2seq. |

## Further Reading

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) — GPT-1.
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) — GPT-2.
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) — GPT-3 và học trong ngữ cảnh.
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — bài báo giải mã suy đoán.
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) — mã tham chiếu LM nhân quả kinh điển.
