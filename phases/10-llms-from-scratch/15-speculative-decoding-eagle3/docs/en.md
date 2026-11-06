# Speculative Decoding and EAGLE-3

> Giai đoạn 7 · Bài 16 chứng minh toán: quy tắc loại bỏ Leviathan giữ chính xác phân phối bộ xác minh. Bài này là góc nhìn bộ huấn luyện của speculative decoding production năm 2026. EAGLE-3 biến mô hình nháp từ xấp xỉ rẻ thành mạng nhỏ chuyên dụng huấn luyện trên trạng thái ẩn của chính bộ xác minh, rồi thêm vòng kiểm thử lúc huấn luyện căn khớp phân phối huấn luyện và suy luận. Kết quả: tăng tốc đầu cuối 3× đến 6.5×, tỷ lệ chấp nhận mỗi token trên 0.9 ở chat, không đánh đổi phân phối. Mọi bộ suy luận production năm 2026 cung cấp mặc định.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16 (speculative decoding math), Phase 10 · 12 (inference optimization)
**Time:** ~75 minutes

## Learning Objectives

- Phát biểu định lý Leviathan trong một câu và chứng minh vòng suy đoán tạo mẫu có phân phối giống hệt bộ xác minh.
- Duyệt tiến trình hai năm từ spec-decoding nguyên bản (Leviathan 2023) qua EAGLE, EAGLE-2 và EAGLE-3, nêu đúng hạn chế mỗi bước loại bỏ.
- Tính tăng tốc kỳ vọng từ tỷ lệ chấp nhận `α` và tỷ lệ chi phí nháp/bộ xác minh `c`, chọn độ dài nháp tối ưu `N` cho mỗi chế độ.
- Triển khai toàn vòng suy đoán từ đầu: nháp, xác minh, lấy mẫu loại bỏ từ phần dư, hoàn tác KV cache khi loại, phát token thưởng khi chấp nhận toàn bộ.

## The Problem

Giải mã tự hồi quy trên mô hình 70B chạy có lẽ 35 token mỗi giây trên H100. GPU còn xa bão hòa. Băng thông bộ nhớ là trần: mỗi token tải 70B trọng số từ HBM, làm một bước số học và tạo một float. Đơn vị tính phần lớn nhàn rỗi.

Speculative decoding biến nó thành bài toán thông lượng bạn thực sự giải được. Nháp rẻ đề xuất `N` token trong `N` lượt truyền xuôi nhỏ. Bộ xác minh chạy một lần trên tiền tố cộng cả `N` nháp. Nếu phân phối bộ xác minh ở vị trí `i` đồng ý nháp (theo nghĩa thống kê sẽ làm chính xác), ta chấp nhận; nếu không, loại và lấy mẫu hiệu chỉnh từ phân phối phần dư. Một lượt mô hình lớn tạo tối đa `N+1` token được nhận thay vì một.

Định lý quan trọng là Leviathan, Kalman, Matias (ICML 2023): phân phối đầu ra giống hệt thứ lấy mẫu trực tiếp từ bộ xác minh sẽ tạo. Không xấp xỉ. Giống hệt. Đây là toàn lý do speculative decoding chấp nhận được trong production — nó là tối ưu độ trễ thuần không đánh đổi chất lượng.

Giai đoạn 7 · Bài 16 cho bạn toán. Bài này cho bộ huấn luyện. Nháp tốt đáng giá tăng tốc hơn 2× so với nháp rẻ. EAGLE, EAGLE-2 và EAGLE-3 (Li và cộng sự, 2024–2025) biến "nháp = bản nhỏ hơn cùng mô hình" thành kỷ luật kỹ thuật chính xác. Máy chủ suy luận production năm 2026 mặc định EAGLE-3.

## The Concept

### The invariant: Leviathan rejection sampling

Gọi `p(t)` là phân phối nháp cho token tiếp theo với tiền tố nào đó, và `q(t)` là của bộ xác minh. Lấy mẫu token nháp `d ~ p`. Chấp nhận với xác suất `min(1, q(d) / p(d))`. Khi loại, lấy mẫu từ phân phối phần dư `(q - p)_+ / ||(q - p)_+||_1`. Mẫu thu được phân phối theo `q`. Điều này đúng bất kể `p` tệ đến đâu — càng tệ, càng loại thường xuyên, nhưng đầu ra vẫn chính xác.

Xếp `N` lệnh gọi liên tiếp này bằng một lượt truyền xuôi bộ xác minh trên `prefix + d_1 + ... + d_N`. Bộ xác minh trả `q_1, q_2, ..., q_{N+1}` đồng thời. Đi trái sang phải. Khi loại đầu ở vị trí `j`, lấy mẫu từ `residual(q_j, p_j)` rồi dừng. Khi nhận toàn bộ, lấy thêm một token thưởng từ `q_{N+1}`.

### What determines speedup

Gọi `α` là tỷ lệ chấp nhận kỳ vọng mỗi token nháp. Gọi `c = cost(draft) / cost(verifier)` là tỷ lệ chi phí. Số token chấp nhận kỳ vọng mỗi lượt bộ xác minh là:

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

Tổng thời gian thực kỳ vọng mỗi token chấp nhận là `(N * c + 1) / E[accepted]`. Tối thiểu hóa theo `N` và có điểm tốt nhất. Với `α = 0.8, c = 0.05`: `N` tối ưu khoảng 5–7, tăng tốc 3.2×. Với `α = 0.95, c = 0.02`: `N` tối ưu khoảng 8–10, tăng tốc tiến tới 5×.

Đòn bẩy lớn nhất là `α`. Đi từ `α = 0.6` (nháp nguyên bản) đến `α = 0.9` (EAGLE-3) ở `N = 5` cố định đưa từ 2.2 token chấp nhận kỳ vọng mỗi lượt bộ xác minh lên 4.1. Thông lượng gần 2× từ cùng bộ xác minh.

### The two-year progression

**Suy đoán nguyên bản (Leviathan, 2023).** Mô hình nháp là LLM nhỏ hơn huấn luyện độc lập cùng họ. Dễ nối, `α ≈ 0.6`, tốt nhất tăng tốc khoảng 2×.

**EAGLE-1 (Li và cộng sự, 2024).** Nháp là transformer nhỏ — thường một hoặc hai lớp — nhận trạng thái ẩn lớp cuối bộ xác minh và trực tiếp dự đoán token kế. Vì nháp thấy biểu diễn đặc trưng của bộ xác minh, phân phối gần hơn nhiều. `α` tăng lên 0.7–0.8.

**EAGLE-2 (Li và cộng sự, 2024).** Thêm cây nháp động: thay vì đề xuất một chuỗi `N` token, đề xuất cây ứng viên nhỏ, chấm từng cái bằng bộ xác minh trong một lượt (tree attention), rồi đi đường xác suất cao nhất. Độ dài nháp thích nghi theo bước. `α` mỗi token đường được nhận tăng trên 0.85.

**EAGLE-3 (Li và cộng sự, 2025, NeurIPS).** Thêm hai thay đổi. Đầu tiên, bỏ hoàn toàn mất mát dự đoán đặc trưng — EAGLE-1/2 huấn luyện nháp khớp trạng thái ẩn bộ xác minh, giới hạn lợi ích dữ liệu. EAGLE-3 huấn luyện trực tiếp dự đoán token. Thứ hai, kiểm thử lúc huấn luyện (TTT): trong huấn luyện nháp, đưa dự đoán trước của chính nháp trở lại đầu vào qua nhiều bước, như lúc suy luận. Điều này căn khớp phân phối huấn luyện và kiểm thử, dừng tích lũy sai số. Tăng tốc đo được: tối đa 6.5× ở chat, cải thiện thông lượng 38% ở batch 64 trong SGLang trên H100.

### KV cache rollback

Xác minh mở rộng KV cache bộ xác minh thêm `N` mục trong một lượt. Nếu loại ở vị trí `j`, nội dung cache sau `j-1` giờ sai. Hai triển khai phổ biến: ghi bộ đệm tạm rồi commit khi nhận (vLLM, TensorRT-LLM), hoặc giữ KV cache vật lý cộng độ dài logic và cắt khi loại. Dù cách nào, chi phí hoàn tác là byte mỗi lớp mỗi head, không đáng kể so chi phí truyền xuôi.

Với tìm kiếm cây EAGLE-2, bộ xác minh chạy attention với mặt nạ phi nhân quả tôn trọng cấu trúc cây. Kỹ thuật lắt léo nhưng tính toán là lệnh gọi flash-attention tiêu chuẩn với mặt nạ tùy chỉnh.

### Draft architectures in 2026

| Chiến lược | Loại nháp | `α` | Tăng tốc | Chi phí huấn luyện |
|----------|-----------|-----|---------|---------------|
| Nguyên bản | LLM nhỏ riêng | 0.55-0.70 | 1.8-2.3× | Không (dùng lại mô hình nhỏ hiện có) |
| Medusa | Head LM thêm trên bộ xác minh | 0.65-0.75 | 2-3× | ~1B token SFT |
| EAGLE-1 | Transformer 1 lớp trên trạng thái ẩn | 0.70-0.80 | 2.5-3× | ~60B token |
| EAGLE-2 | EAGLE-1 + cây nháp động | 0.80-0.88 | 3-4× | ~60B token |
| EAGLE-3 | Hợp nhất đặc trưng nhiều lớp + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B token |
| Lookahead | Không nháp (lặp Jacobi) | N/A | 1.3-1.6× | Không |

Trong production năm 2026: vLLM và SGLang mặc định EAGLE-3 khi có, nếu không EAGLE-2. TensorRT-LLM có đường Medusa nhanh nhất cho mô hình công khai Meta và NVIDIA. llama.cpp cung cấp nháp nguyên bản cho triển khai CPU.

```figure
l5-spec-decode-eagle
```

## Build It

Xem `code/main.py`. Đây là toàn vòng suy đoán Leviathan với đủ phần: nháp N token, lượt xác minh song song, loại từng vị trí, lấy mẫu phần dư, token thưởng, hoàn tác KV và xác minh thực nghiệm phân phối đầu ra khớp lấy mẫu trực tiếp từ `q`.

### Step 1: the rejection rule

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### Step 2: residual distribution

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### Step 3: a full speculative step

Hàm `spec_step` nháp `N` token từ `p`, rồi xác minh tất cả trong một lần tính `q` song song. Với mỗi token nháp, nó áp dụng quy tắc loại, và ở lần loại đầu lấy mẫu hiệu chỉnh từ phần dư. Nếu mọi thứ được nhận, nó phát token thưởng từ `q_{N+1}`.

### Step 4: KV rollback bookkeeping

Bộ mô phỏng theo dõi `kv_length` logic mỗi worker. Khi nhận `k` nháp, `kv_length += k`. Khi loại ở vị trí `j`, cache đã ghi quá `j`, nhưng độ dài logic được đặt thành `prefix_length + j + 1` — một vị trí sau token hiệu chỉnh. Các lần đọc sau cắt về độ dài logic.

### Step 5: the Leviathan check

Chạy 50,000 bước suy đoán. Đếm phân phối thực nghiệm token được nhận. So với 50,000 mẫu trực tiếp từ `q`. Thống kê chi bình phương nên thấp hơn nhiều giá trị tới hạn. Định lý vượt kiểm thử trong thực tế.

### Step 6: speedup vs. α

Quét chất lượng nháp bằng làm lệch `p` khỏi `q` ở biên độ khác nhau. Đo `α`, rồi vẽ token kỳ vọng mỗi lệnh gọi xác minh theo `α` và `N`. Mã in bảng cho thấy chất lượng nháp hạng EAGLE-3 (`α ≈ 0.9`) mở khóa 4–5 token mỗi lệnh gọi xác minh.

## Use It

`vllm serve` cấp production với EAGLE-3:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

SGLang với EAGLE-3 ở batch 64 trên H100: khoảng thông lượng nhiều hơn 1.38× so với giải mã nguyên bản batch-64, theo bài báo EAGLE-3.

Khi nào dùng speculative decoding:

- Mọi tác vụ chat tương tác mà độ trễ p50 quan trọng hơn thông lượng đỉnh.
- Sinh mã và đầu ra có cấu trúc (JSON, SQL). `α` trên 0.9 vì phân phối đích rất dễ đoán.
- Sinh dài (hàng nghìn token). Tăng tốc được phân bổ tiếp tục đem lợi ích.

Khi nào không:

- Mô hình rất nhỏ (< 3B). Nháp không rẻ hơn bộ xác minh nhiều đến vậy.
- Triển khai CPU batch-1 nhỏ. Chi phí bộ nhớ thêm mô hình nháp có thể không đáng.
- Lấy mẫu sáng tạo temperature rất cao nơi `α` sụp đổ.

## Ship It

Bài này tạo ra `outputs/skill-eagle3-tuner.md`. Với khối lượng suy luận (mô hình, batch, độ trễ mục tiêu, đặc điểm tác vụ), nó đề xuất chiến lược speculative-decoding và tham số điều chỉnh (họ nháp, `N`, độ sâu cây, chuyển đổi nhận biết temperature).

## Exercises

1. Chạy `code/main.py`. Xác nhận thống kê chi bình phương trên kiểm tra phân phối Leviathan giữ dưới giá trị tới hạn 95% trên 50,000 mẫu.

2. Quét `N` từ 1 đến 10 với `α` giữ 0.9 và `c` giữ 0.04. Vẽ token kỳ vọng mỗi lệnh gọi xác minh và thời gian thực mỗi token. Tìm `N` giảm thiểu thời gian thực. Giải thích hình dạng đường cong.

3. Sửa mã mô phỏng tìm kiếm cây EAGLE-2: mỗi bước, nháp đề xuất cây hình dạng `[2, 2, 2]` (tám đường ứng viên). Bộ xác minh chạy một lần, và đường được nhận xác suất cao nhất thắng. Tính `α` mỗi lá và tổng token mỗi lệnh gọi xác minh. So với spec-decoding chuỗi tuyến tính ở tính toán tương đương.

4. Triển khai bộ mô phỏng hoàn tác KV theo batch cho hai chuỗi đồng thời. Chuỗi A có mọi nháp được nhận; chuỗi B loại ở vị trí 2. Cho thấy `kv_length` đúng được cập nhật theo chuỗi và không công việc nào lãng phí.

5. Đọc Mục 4 bài báo EAGLE-3 (Training-Time Test). Giải thích trong hai câu vì sao huấn luyện nháp đơn giản không TTT chịu exposure bias, và vì sao đưa dự đoán của chính nháp khi huấn luyện khắc phục. Kết nối với tài liệu scheduled-sampling trong seq2seq.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Leviathan rule (Quy tắc Leviathan) | "min(1, q trên p)" | Chấp nhận/loại Bernoulli với xác suất `min(1, q(d)/p(d))`, giữ chính xác phân phối bộ xác minh khi lấy mẫu phần dư lúc loại |
| Residual distribution (Phân phối phần dư) | "(q trừ p) phần dương, chuẩn hóa" | `(q - p)_+` chặn ở không rồi chuẩn hóa lại — phân phối đúng để lấy mẫu khi loại |
| Acceptance rate α (Tỷ lệ chấp nhận α) | "tần suất nháp đúng" | Xác suất thành công Bernoulli kỳ vọng mỗi token theo quy tắc loại; chi phối toàn toán tăng tốc |
| EAGLE-1 | "nháp trạng thái ẩn" | Nháp transformer nhỏ có điều kiện theo trạng thái ẩn lớp cuối bộ xác minh (Li và cộng sự, 2024) |
| EAGLE-2 | "cây nháp động" | EAGLE-1 cộng cây phần tiếp nối ứng viên chấm bằng tree attention trong một lượt xác minh |
| EAGLE-3 | "kiểm thử lúc huấn luyện" | Bỏ mất mát dự đoán đặc trưng, huấn luyện dự đoán token trực tiếp với nháp nhận đầu ra chính nó khi huấn luyện |
| Training-time test (TTT) (Kiểm thử lúc huấn luyện) | "cách sửa exposure bias" | Chạy nháp tự hồi quy khi huấn luyện để phân phối đầu vào huấn luyện và kiểm thử khớp — tương ứng trực tiếp scheduled sampling |
| KV rollback (Hoàn tác KV) | "hoàn tác nháp bị loại" | Theo dõi sổ sách đặt lại KV cache bộ xác minh về độ dài tiền tố được nhận sau lần loại |
| Bonus token (Token thưởng) | "cái miễn phí" | Khi cả `N` nháp được nhận, lấy thêm một token từ `q_{N+1}` không thêm chi phí xác minh |
| Tree attention (Attention cây) | "xác minh nhiều ứng viên cùng lúc" | Attention với mặt nạ phi nhân quả tôn trọng cấu trúc cây nháp; tính `q_i` mỗi nút trong cây bằng một lượt truyền xuôi |

## Further Reading

- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) — bài báo nền tảng và định lý tương đương
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) — giới thiệu độc lập đồng thời với chứng minh rõ ràng
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) — EAGLE-1, nháp có điều kiện theo trạng thái ẩn
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) — tìm kiếm cây động
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) — mặc định production năm 2026
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) — cách thay thế không nháp
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html) — tham chiếu production chuẩn với mọi chiến lược được kết nối
