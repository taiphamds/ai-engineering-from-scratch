# Native Sparse Attention (DeepSeek NSA)

> Ở 64k token, attention chiếm 70-80% độ trễ decode. Mọi phòng thí nghiệm mô hình mở có kế hoạch sửa. NSA của DeepSeek (bài xuất sắc nhất ACL 2025) là cách trụ lại: ba nhánh attention song song — token thô được nén, token tinh được giữ chọn lọc, và cửa sổ trượt cho ngữ cảnh cục bộ — kết hợp qua cổng được học. Nó phù hợp phần cứng (thân thiện kernel), huấn luyện được nguyên bản (hoạt động trong huấn luyện trước, không gắn thêm lúc suy luận), và ở decode 64k chạy nhanh hơn FlashAttention trong khi ngang hoặc vượt chất lượng attention đầy đủ. Bài này xây ba nhánh đầu cuối và cho thấy vì sao tính thưa khả vi đầu cuối.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba nhánh attention NSA và mỗi nhánh nắm bắt gì.
- Giải thích vì sao NSA "huấn luyện được nguyên bản" trong khi phương pháp attention thưa trước chỉ suy luận.
- Tính tiết kiệm tính toán attention NSA so với đầy đủ ở ngữ cảnh 64k theo kích thước khối nén và top-k chọn.
- Triển khai kết hợp ba nhánh bằng Python stdlib trên chuỗi tổng hợp ngắn và xác minh trọng số cổng hoạt động.

## The Problem

Attention đầy đủ ở chuỗi dài N tốn thời gian `O(N^2)` và KV cache `O(N)` mỗi lớp. Ở 64k token, con số tính toán và băng thông bộ nhớ thảm khốc. Ước tính lý thuyết được đo từ bài NSA: attention chiếm 70-80% tổng độ trễ decode ở 64k. Mọi thứ phía sau — TTFT, token/giây, chi phí mỗi triệu token — bị chi phí attention chi phối.

Attention thưa là câu trả lời hiển nhiên. Các nỗ lực trước thuộc hai nhóm. Thưa mẫu cố định (cửa sổ trượt, bước nhảy, cục bộ theo khối) bỏ thông tin và thất bại ở nhớ lại tầm xa. Thưa lúc suy luận (cắt tỉa KV cache, H2O, StreamingLLM) áp dụng cho mô hình huấn luyện trước trên attention dense và chỉ thu một phần tăng tốc tiềm năng vì mô hình chưa từng được yêu cầu định tuyến thông tin qua mẫu thưa.

Native Sparse Attention (Yuan và cộng sự, DeepSeek + PKU + UW, bài xuất sắc nhất ACL 2025, arXiv:2502.11089) làm cả hai: mẫu thưa mô hình học khi huấn luyện trước, triển khai bằng thuật toán phù hợp kernel thực sự đem tiết kiệm tính toán khi suy luận. Hai năm nữa, NSA hoặc hậu duệ trực tiếp là attention mặc định trên mọi mô hình ngữ cảnh dài hàng đầu.

## The Concept

### Three parallel branches

Với mỗi query, NSA chạy attention ba lần, với ba góc nhìn KV cache khác nhau:

1. **Nhánh nén.** Token được nhóm thành khối kích thước `l` (thường 32 hoặc 64). Mỗi khối nén thành một token tóm tắt qua MLP nhỏ được học. Query chú ý trên token nén, có góc nhìn thô toàn chuỗi.

2. **Nhánh chọn lọc.** Dùng điểm attention từ nhánh nén, xác định top-k khối liên quan nhất với query hiện tại. Token tinh (chưa nén) từ các khối đó được đọc và query chú ý tất cả. Nghĩ attention nhánh nén là tín hiệu định tuyến cho lựa chọn.

3. **Nhánh cửa sổ trượt.** Query chú ý `W` token gần nhất (thường 512) cho ngữ cảnh cục bộ. Nhánh này nắm mẫu tầm ngắn giàu cấu trúc (cú pháp, đồng tham chiếu cục bộ) mà hai nhánh kia có thể bỏ sót.

Ba đầu ra nhánh kết hợp qua cổng theo vị trí được học:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win` là trọng số cổng từ MLP nhỏ trên query. Chúng không cần tổng bằng 1 — có thể đặt trọng số các nhánh độc lập.

### Why this is "natively trainable"

Bước chọn (khối top-k) rời rạc. Phép rời rạc phá luồng gradient. Công trình attention thưa trước hoặc bỏ truyền ngược qua chọn (hạn chế huấn luyện) hoặc dùng nới lỏng liên tục không cho tính thưa thực khi suy luận.

NSA né điều này: attention nhánh nén CHÍNH LÀ attention thô khả vi trên toàn chuỗi. Phép top-k chỉ dùng lại điểm attention cao nhất từ nhánh nén để chọn khối tinh cần tải. Gradient truyền qua điểm nhánh nén (ảnh hưởng cả đầu ra nén VÀ logic chọn), và đóng góp của khối được chọn vào đầu ra cuối cũng khả vi. Phép `top_k` không khả vi là no-op trên đồ thị tính toán xuôi — nó chỉ điều khiển khối nào được tải từ bộ nhớ.

Đây là lý do NSA dùng được trong huấn luyện trước đầu cuối. Mô hình học định tuyến thông tin chung qua ba nhánh, tạo mẫu thưa thực sự mang tăng tốc hứa hẹn khi suy luận.

### Hardware-aligned kernel

Kernel NSA thiết kế cho phân cấp bộ nhớ GPU hiện đại. Kernel tải query theo nhóm GQA (vòng ngoài), lấy khối KV thưa tương ứng mỗi nhóm (vòng trong), và chạy attention trên SRAM. Vì mỗi nhóm query thấy cùng khối được chọn (chọn theo nhóm query, không theo head query), tải KV được phân bổ trên nhóm. Cường độ số học giữ cao.

Bài báo báo kernel Triton chạy nhanh hơn FlashAttention 9x trên decode 64k, với tỷ lệ tăng tốc tăng theo độ dài chuỗi. Cả kernel truyền xuôi và ngược được cung cấp.

### The compute budget

Gọi `N` là độ dài chuỗi, `l` kích thước khối nén, `k` số chọn top-k, `w` cửa sổ trượt, `b` kích thước khối chọn (thường bằng `l`).

- Nhánh nén: `O(N/l)` key mỗi query, nên tổng `O(N * N / l)`.
- Nhánh chọn lọc: `O(k * b)` key mỗi query, nên `O(N * k * b)`.
- Nhánh trượt: `O(w)` key mỗi query, nên `O(N * w)`.

Tổng: `O(N * (N/l + k*b + w))`.

Với `N = 64k, l = 64, k = 16, b = 64, w = 512`: chi phí mỗi query là `1000 + 1024 + 512 = 2536 keys`. Attention đầy đủ là `64000 keys`. Giảm tính toán 25x.

Với `N = 128k, l = 64, k = 16, b = 64, w = 512`: chi phí mỗi query là `2000 + 1024 + 512 = 3536 keys`. Attention đầy đủ là `128000 keys`. Giảm 36x. Lợi ích tăng theo độ dài chuỗi, chính là toàn bộ điểm chính.

### How does it compare

| Phương pháp | Khả vi | Tăng tốc suy luận thực | Nhớ lại tầm xa |
|--------|---------------|----------------------|-------------------|
| Chỉ cửa sổ trượt | có | có | thất bại |
| Bước nhảy / thưa theo khối | có | có | một phần |
| Cắt tỉa KV (H2O, StreamingLLM) | N/A (lúc suy luận) | có | một phần |
| MoBA (Moonshot) | một phần | có | tốt |
| NSA | có (nguyên bản) | có (9x ở 64k) | ngang attention đầy đủ |

MoBA (Moonshot, arXiv:2502.13189) công bố đồng thời và dùng cách ba-tốt-hơn-một tương tự, áp dụng nguyên tắc MoE cho khối attention. NSA và MoBA là hai kiến trúc cần biết cho huấn luyện trước ngữ cảnh dài năm 2026.

```figure
sliding-window-attention
```

## Build It

`code/main.py` triển khai ba nhánh trên chuỗi tổng hợp ngắn và cho thấy:

- MLP nén (baseline mean-pool đơn giản dùng cho rõ sư phạm; NSA thực dùng MLP được học).
- Chọn khối top-k do điểm nhánh nén điều khiển.
- Attention cửa sổ trượt trên `w` token cuối.
- Kết hợp có cổng.
- Bản in số tính toán so với attention đầy đủ.

### Step 1: compress tokens into blocks

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### Step 2: compressed-branch attention

Chạy attention softmax của query với key nén. Điểm nhánh nén đồng thời làm tín hiệu chọn top-k.

### Step 3: top-k block selection

Chọn chỉ số `k` khối nén có điểm cao nhất. Tải token gốc chưa nén từ các khối đó và chạy attention trên chúng.

### Step 4: sliding-window attention

Lấy `w` token cuối và chạy attention tiêu chuẩn với chúng.

### Step 5: gate + combine

MLP nhỏ trên query tạo ba trọng số cổng. Đầu ra cuối là tổng có trọng số ba đầu ra nhánh.

### Step 6: compute counting

In số key được chú ý mỗi query cho từng nhánh và tổng. So với `N` (attention đầy đủ). Trên chuỗi tổng hợp 1024 token với `l = 32, k = 4, w = 128`, NSA thấy `32 + 128 + 128 = 288` key mỗi query so với 1024 đầy đủ — ít hơn 3.5x.

## Use It

NSA đang được cung cấp trong pipeline huấn luyện trước ngữ cảnh dài riêng DeepSeek. Tình trạng tích hợp trong bộ suy luận công khai tính đến tháng 4 năm 2026:

- **Nội bộ DeepSeek**: nguyên bản, trọng số công bố dùng NSA hoặc kế nhiệm DSA (Deepseek Sparse Attention).
- **vLLM**: hỗ trợ NSA thử nghiệm đang phát triển cho trọng số DeepSeek-V3.x.
- **SGLang**: benchmark NSA đã công bố; đường production theo vLLM.
- **llama.cpp / CPU**: không hỗ trợ; chi phí phân rã kernel không đáng ở thông lượng CPU.

Khi nào dùng NSA:

- Lần huấn luyện trước hoặc tiếp tục huấn luyện nhắm ngữ cảnh 64k trở lên với ngân sách tính toán nghiêm túc.
- Suy luận checkpoint ngữ cảnh dài riêng DeepSeek. Trọng số nguyên bản NSA.

Khi nào không:

- Phục vụ mô hình hiện có huấn luyện trước bằng attention dense. Không thể lắp NSA nếu không tiếp tục huấn luyện.
- Ngữ cảnh dưới 16k. Chi phí ba nhánh chi phối tiết kiệm.
- Chat tương tác batch-1. Decode nhạy độ trễ có lợi, nhưng chỉ ở ngữ cảnh dài.

## Ship It

Bài này tạo ra `outputs/skill-nsa-integrator.md`. Với đặc tả lần huấn luyện trước ngữ cảnh dài, nó tạo kế hoạch tích hợp NSA: kích thước khối nén, top-k, cửa sổ trượt, độ rộng MLP cổng, chọn kernel và đánh giá ngữ cảnh dài cụ thể biện minh thay kiến trúc.

## Exercises

1. Chạy `code/main.py` trên chuỗi tổng hợp 1024 token. Quét `(l, k, w)` qua ba thiết lập sẵn và in số tính toán. Xác định thiết lập có số key mỗi query thấp nhất trong khi giữ 95% recall so attention đầy đủ trên kiểm thử needle-in-haystack.

2. Thay bộ nén mean-pool bằng MLP nhỏ được học (2 lớp, hidden 32). Huấn luyện trên tác vụ tổng hợp mà tín hiệu là trung bình một khối. Đo khoảng cách perplexity so baseline mean-pool trên dữ liệu giữ lại.

3. Triển khai MLP cổng. Nó nhận query và xuất ba vô hướng. Cho thấy cổng hành xử hợp lý: trọng số gần đều trên query ngẫu nhiên, trọng số lớn cho nhánh chọn lọc khi query trúng khối xa phía trước.

4. Tính ngân sách bộ nhớ KV cache cho mô hình 70B bật NSA ở ngữ cảnh 128k. Head KV là 8, số chiều head 128, BF16. So attention đầy đủ và MLA (Giai đoạn 10 · 14 đã cho con số MLA). Xác định độ dài chuỗi nơi KV cache nhánh tinh NSA bằng attention đầy đủ.

5. Đọc Mục 4 bài NSA (arXiv:2502.11089) và giải thích trong ba câu vì sao điểm attention nhánh nén dùng lại để chọn top-k thay vì tính điểm định tuyến riêng. Gắn câu trả lời với luồng gradient.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Compressed branch (Nhánh nén) | "Góc nhìn thô" | Attention trên key trung bình khối cho ngữ cảnh toàn cục với O(N/l) key mỗi query |
| Selected branch (Nhánh chọn lọc) | "Khối top-k" | Attention tinh trên `k` khối có điểm nhánh nén cao nhất |
| Sliding window (Cửa sổ trượt) | "Ngữ cảnh cục bộ" | Attention trên `W` token cuối cho mẫu tầm ngắn |
| Native trainability (Khả năng huấn luyện nguyên bản) | "Huấn luyện trước khi bật tính thưa" | Mẫu thưa được học khi huấn luyện trước, không gắn thêm lúc suy luận |
| Compression block size l (Kích thước khối nén l) | "Kích thước nhóm cho góc nhìn thô" | Bao nhiêu token gộp thành một tóm tắt; thường 32-64 |
| Top-k | "Khối cần giữ" | Số khối nén có token chưa nén được đọc; thường 16 |
| Sliding window W (Cửa sổ trượt W) | "Bán kính attention cục bộ" | Thường 512; ngắn hơn hại mạch lạc cục bộ, dài hơn lãng phí tính toán |
| Branch gate (Cổng nhánh) | "Cách trộn ba nhánh" | Đầu ra MLP theo vị trí đặt trọng số đóng góp ba nhánh |
| Hardware alignment (Phù hợp phần cứng) | "Tính thưa thân thiện kernel" | Mẫu thưa chọn để kernel GPU thực đạt tăng tốc lý thuyết |
| DSA | "Kế nhiệm NSA" | Deepseek Sparse Attention, kiến trúc theo sau NSA trong dòng DeepSeek |

## Further Reading

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) — bài báo
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — họ kiến trúc NSA nhắm đến
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) — công trình đồng thời, attention kiểu MoE trên khối
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) — nguồn gốc cửa sổ trượt
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) — baseline thưa lúc suy luận NSA cải thiện
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) — baseline attention đầy đủ kernel NSA vượt ở 64k
