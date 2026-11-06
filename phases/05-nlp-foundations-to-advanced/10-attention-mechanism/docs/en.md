# Attention Mechanism — The Breakthrough

> Decoder ngừng nheo mắt nhìn một bản tóm tắt được nén và bắt đầu nhìn toàn bộ nguồn. Mọi thứ sau đây là attention cộng kỹ thuật.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 09 (Sequence-to-Sequence Models)
**Time:** ~45 minutes

## The Problem

Bài 09 kết thúc ở một thất bại được đo lường. Một GRU encoder-decoder được huấn luyện trên một tác vụ sao chép đồ chơi đi từ accuracy 89% ở độ dài 5 xuống gần mức ngẫu nhiên ở độ dài 80. Lý do có tính cấu trúc, không phải lỗi huấn luyện: mọi bit thông tin encoder thu được phải vừa trong một trạng thái ẩn kích thước cố định, và decoder không bao giờ thấy bất kỳ thứ gì khác.

Bahdanau, Cho và Bengio công bố một cách sửa ba dòng năm 2014. Thay vì chỉ cho decoder trạng thái encoder cuối, giữ mọi trạng thái encoder. Ở mỗi bước decoder, tính một trung bình có trọng số của các trạng thái encoder mà các trọng số nói "decoder cần nhìn vào vị trí encoder `i` ngay lúc này bao nhiêu?" Trung bình có trọng số đó là ngữ cảnh, và nó thay đổi ở mỗi bước decoder.

Đó là toàn bộ ý tưởng. Transformer mở rộng nó. Self-attention áp dụng nó cho một chuỗi duy nhất. Multi-head attention chạy nó song song. Nhưng phiên bản năm 2014 đã phá nút thắt, và một khi bạn có nó, bước chuyển sang transformer là kỹ thuật, không phải khái niệm.

## The Concept

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

Ở mỗi bước decoder `t`:

1. Dùng trạng thái ẩn decoder trước `s_{t-1}` làm một **truy vấn**.
2. Chấm điểm nó với mọi trạng thái ẩn encoder `h_1, ..., h_T`. Một vô hướng cho mỗi vị trí encoder.
3. Softmax các điểm để có các trọng số attention `α_{t,1}, ..., α_{t,T}` có tổng bằng 1.
4. Vector ngữ cảnh `c_t = Σ α_{t,i} * h_i`. Trung bình có trọng số của các trạng thái encoder.
5. Decoder nhận `c_t` cộng token đầu ra trước, tạo token tiếp theo.

Trung bình có trọng số là điểm chính. Khi decoder cần dịch "Je" thành "I", nó gán trọng số cao cho trạng thái encoder trên "Je" và thấp cho những trạng thái khác. Khi cần "not", nó gán trọng số cao cho "pas". Vector ngữ cảnh đổi hình dạng ở mỗi bước.

## Shapes (the thing that bites everyone)

Đây là nơi mọi triển khai attention sai ở lần đầu tiên. Đọc chậm.

| Thành phần | Hình dạng | Ghi chú |
|-------|-------|-------|
| Các trạng thái ẩn encoder `H` | `(T_enc, d_h)` | Nếu BiLSTM, `d_h = 2 * d_hidden` |
| Trạng thái ẩn decoder `s_{t-1}` | `(d_s,)` | Một vector |
| Điểm attention `e_{t,i}` | vô hướng | Một cho mỗi vị trí encoder |
| Trọng số attention `α_{t,i}` | vô hướng | Sau softmax trên tất cả `i` |
| Vector ngữ cảnh `c_t` | `(d_h,)` | Cùng hình dạng với một trạng thái encoder |

**Điểm Bahdanau (cộng).** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`.

- `s_{t-1}` có hình dạng `(d_s,)`, `h_i` có hình dạng `(d_h,)`.
- `W_a` có hình dạng `(d_attn, d_s)`. `U_a` có hình dạng `(d_attn, d_h)`.
- Tổng của chúng bên trong tanh có hình dạng `(d_attn,)`.
- `v_α` có hình dạng `(d_attn,)`. Tích trong với `v_α` thu về một vô hướng. **Đây là điều `v_α` làm.** Nó không phải phép thuật. Nó là phép chiếu biến một vector chiều attention thành một điểm vô hướng.

**Điểm Luong (nhân).** Ba biến thể:

- `dot`: `e_{t,i} = s_t^T * h_i`. Yêu cầu `d_s == d_h`. Ràng buộc cứng. Bỏ qua nếu encoder của bạn là hai chiều.
- `general`: `e_{t,i} = s_t^T * W * h_i` với `W` có hình dạng `(d_s, d_h)`. Loại bỏ ràng buộc số chiều bằng nhau.
- `concat`: về cơ bản là dạng Bahdanau. Hiếm khi dùng vì hai dạng đầu rẻ hơn.

**Một cạm bẫy Bahdanau / Luong cần nêu tên.** Bahdanau dùng `s_{t-1}` (trạng thái decoder *trước* khi sinh từ hiện tại). Luong dùng `s_t` (trạng thái *sau*). Nhầm chúng tạo ra các gradient sai tinh vi cực kỳ khó gỡ lỗi. Chọn một bài báo và bám theo quy ước của nó.

```figure
attention-heatmap
```

## Build It

### Step 1: additive (Bahdanau) attention

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

Kiểm tra các hình dạng của bạn theo bảng ở trên. `encoder_states` có hình dạng `(T_enc, d_h)`. `projected_enc` có hình dạng `(T_enc, d_attn)`. `projected_dec` có hình dạng `(d_attn,)` và broadcast. `combined` có hình dạng `(T_enc, d_attn)`. `scores` có hình dạng `(T_enc,)`. `weights` có hình dạng `(T_enc,)`. `context` có hình dạng `(d_h,)`. Phát hành nó.

### Step 2: Luong dot and general

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

Mỗi dạng ba dòng. Đây là lý do bài báo của Luong tạo được ảnh hưởng. Cùng accuracy trên hầu hết tác vụ, ít mã hơn rất nhiều.

### Step 3: a worked numerical example

Cho ba trạng thái encoder (đại khái là "cat", "sat", "mat") và một trạng thái decoder căn chỉnh nhiều nhất với trạng thái đầu, phân phối attention tập trung vào vị trí 0. Nếu trạng thái decoder dịch chuyển để căn chỉnh với trạng thái cuối, attention chuyển đến vị trí 2. Vector ngữ cảnh theo sát.

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

Hàng đầu thắng. Rồi đưa trạng thái decoder gần trạng thái encoder thứ ba hơn và quan sát các trọng số dịch chuyển. Chỉ vậy thôi. Attention là căn chỉnh tường minh.

### Step 4: why this is the bridge to transformers

Chuyển ngôn ngữ ở trên sang Q/K/V:

- **Query** = trạng thái decoder `s_{t-1}`
- **Key** = các trạng thái encoder (thứ chúng ta chấm điểm với)
- **Value** = các trạng thái encoder (thứ chúng ta gán trọng số và cộng)

Trong attention cổ điển, key và value là cùng một thứ. Self-attention tách chúng: bạn có thể truy vấn một chuỗi với chính nó, với các phép chiếu được học khác nhau cho K và V. Multi-head attention chạy nó song song với các phép chiếu được học khác nhau. Transformer xếp chồng toàn bộ công đoạn nhiều lần và bỏ RNN.

Phần toán giống nhau. Các hình dạng giống nhau. Bước nhảy sư phạm từ attention Bahdanau sang scaled dot-product attention chủ yếu là ký hiệu.

## Use It

PyTorch và TensorFlow cung cấp attention trực tiếp.

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

Đó là một tầng attention transformer. Batch query có 5 vị trí, batch key/value có 10 vị trí, mỗi vị trí 128 chiều, 8 head. `output` là các query mới được tăng cường ngữ cảnh. `weights` là ma trận căn chỉnh 5x10 mà bạn có thể trực quan hóa.

### When classical attention still matters

- Sư phạm. Phiên bản một head, một tầng, dựa trên RNN khiến mọi khái niệm hiện rõ.
- Các tác vụ chuỗi trên thiết bị mà transformer không vừa.
- Bất kỳ bài báo nào từ 2014-2017. Bạn sẽ đọc sai nó nếu không biết quy ước của Bahdanau.
- Phân tích căn chỉnh chi tiết trong MT. Các trọng số attention thô là một công cụ diễn giải ngay cả trên các mô hình transformer, và đọc chúng đòi hỏi biết chúng là gì.

### The attention-weight-as-explanation trap

Các trọng số attention có vẻ diễn giải được. Chúng là các trọng số có tổng bằng một trên các vị trí; bạn có thể vẽ chúng; cao nghĩa là "đã nhìn vào đây." Những người đánh giá yêu thích chúng.

Chúng không dễ diễn giải như vẻ ngoài. Jain và Wallace (2019) cho thấy các phân phối attention có thể được hoán vị và thay bằng các phương án tùy ý mà không thay đổi các dự đoán mô hình cho một số tác vụ. Không bao giờ báo cáo các trọng số attention làm bằng chứng suy luận mà không có một kiểm tra loại bỏ thành phần hoặc phản thực.

## Ship It

Lưu thành `outputs/prompt-attention-shapes.md`:

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

Given a broken attention implementation, you identify the shape mismatch. Output:

1. Which matrix has the wrong shape. Name the tensor.
2. What its shape should be, derived from (d_s, d_h, d_attn, T_enc, T_dec, batch_size).
3. One-line fix. Transpose, reshape, or project.
4. A test to catch regressions. Typically: assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`.

Refuse to recommend fixes that silently broadcast. Broadcast-hiding bugs surface later as silent accuracy degradation, the worst kind of attention bug.

For Bahdanau confusion, insist the decoder input is `s_{t-1}` (pre-step state). For Luong, `s_t` (post-step state). For dot-product, flag dimension mismatch between query and key as the most common first-time error.
```

## Exercises

1. **Dễ.** Triển khai masking `softmax` để các token đệm trong encoder nhận trọng số attention bằng không. Kiểm thử trên một batch có các chuỗi độ dài thay đổi.
2. **Trung bình.** Thêm multi-head attention vào dạng Luong `general`. Chia `d_h` thành `n_heads` nhóm, chạy attention cho mỗi head, nối lại. Xác minh trường hợp một head khớp triển khai trước của bạn.
3. **Khó.** Huấn luyện một GRU encoder-decoder với attention Bahdanau trên tác vụ sao chép đồ chơi từ bài 09. Vẽ accuracy theo độ dài chuỗi. So sánh với baseline không attention. Bạn sẽ thấy khoảng cách nới rộng khi độ dài tăng, xác nhận attention gỡ nút thắt.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Attention | Nhìn vào các thứ | Trung bình có trọng số của một chuỗi value, các trọng số được tính từ độ tương đồng query-key. |
| Query, Key, Value (Truy vấn, Khóa, Giá trị) | QKV | Ba phép chiếu: Q hỏi, K là thứ cần khớp, V là thứ cần trả về. |
| Additive attention (Attention cộng) | Bahdanau | Điểm truyền xuôi: `v^T tanh(W q + U k)`. |
| Multiplicative attention (Attention nhân) | Luong dot / general | Điểm là `q^T k` hoặc `q^T W k`. Rẻ hơn, cùng accuracy trên hầu hết tác vụ. |
| Alignment matrix (Ma trận căn chỉnh) | Bức hình đẹp | Các trọng số attention dưới dạng một lưới `(T_dec, T_enc)`. Đọc nó để thấy mô hình đã chú ý vào đâu. |

## Further Reading

- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — bài báo.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) — ba biến thể điểm và so sánh của chúng.
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) — lưu ý về khả năng diễn giải.
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) — hướng dẫn chạy được với PyTorch.
