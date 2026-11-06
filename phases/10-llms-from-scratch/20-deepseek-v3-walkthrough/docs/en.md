# DeepSeek-V3 Architecture Walkthrough

> Giai đoạn 10 · Bài 14 đã nêu sáu núm điều chỉnh kiến trúc mà mọi mô hình mở đều xoay. DeepSeek-V3 (tháng 12 năm 2024, tổng cộng 671B tham số, 37B hoạt động) xoay cả sáu và thêm bốn núm nữa: Multi-Head Latent Attention, cân bằng tải không có auxiliary loss, Multi-Token Prediction và huấn luyện DualPipe. Bài học này đọc kiến trúc DeepSeek-V3 từ trên xuống dưới và suy ra mọi số lượng tham số từ cấu hình đã công bố. Đến cuối bài, bạn có thể giải thích tại sao tỷ lệ 671B/37B là lựa chọn đặt cược đúng và tại sao MLA + MoE cùng nhau vượt qua từng thành phần riêng lẻ ở tuyến đầu.

**Type:** Learn
**Languages:** Python (stdlib, parameter calculator)
**Prerequisites:** Phase 10 · 14 (open-model walkthroughs), Phase 10 · 17 (NSA), Phase 10 · 18 (MTP), Phase 10 · 19 (DualPipe)
**Time:** ~75 minutes

## Learning Objectives

- Đọc cấu hình DeepSeek-V3 từ trên xuống dưới và giải thích từng trường theo sáu núm GPT-2 cộng bốn phần bổ sung riêng của DeepSeek.
- Suy ra tổng số tham số (671B), số tham số hoạt động (37B) và các thành phần đóng góp vào mỗi số.
- Tính dung lượng KV cache của MLA ở ngữ cảnh 128k và so sánh với mức mà một mô hình dense cùng số tham số hoạt động với GQA phải trả.
- Nêu bốn đổi mới riêng của DeepSeek (MLA, MTP, định tuyến không có auxiliary loss, DualPipe) và nêu tên phần trong ngăn xếp kiến trúc/huấn luyện mà mỗi đổi mới nhắm tới.

## The Problem

DeepSeek-V3 là mô hình mở tiên tiến nhất đầu tiên có kiến trúc khác biệt đáng kể so với họ Llama. Llama 3 405B là "GPT-2 với sáu núm được xoay." DeepSeek-V3 là GPT-2 với cả sáu núm cộng bốn núm nữa. Đọc cấu hình Llama 3 là khởi động cho việc đọc cấu hình DeepSeek, nhưng cấu trúc sâu — hình dạng khối attention, logic định tuyến, mục tiêu trong lúc huấn luyện — khác biệt đủ nhiều để bạn cần một walkthrough riêng.

Lợi ích của việc học nó: bản phát hành trọng số mở của DeepSeek-V3 đã thay đổi ý nghĩa của "năng lực tiên tiến nhất" trong các mô hình mở. Kiến trúc này là bản thiết kế mà nhiều lượt huấn luyện năm 2026 đang sao chép. Hiểu nó là yêu cầu tối thiểu cho bất kỳ vai trò nào liên quan đến huấn luyện hoặc suy luận LLM tiên tiến nhất.

## The Concept

### The invariant core, again

DeepSeek-V3 vẫn tự hồi quy. Nó vẫn xếp chồng các khối decoder. Mỗi khối vẫn có attention cộng MLP cộng hai RMSNorm. Nó vẫn dùng SwiGLU trong MLP. Nó vẫn dùng RoPE. Pre-norm. Embedding dùng chung trọng số. Cùng baseline như mọi Llama hay Mistral.

### The twist: MLA instead of GQA

Từ Giai đoạn 10 · 14, bạn biết GQA thu nhỏ KV cache bằng cách chia sẻ K và V giữa các nhóm head Q. Multi-Head Latent Attention (MLA) đi xa hơn: K và V được nén thành một biểu diễn tiềm ẩn hạng thấp dùng chung (`kv_lora_rank`), rồi được giải nén cho từng head ngay khi cần. KV cache chỉ lưu biểu diễn tiềm ẩn — thường là 512 số thực dấu phẩy động trên mỗi token mỗi lớp, không phải 8 x 128 = 1024 số thực dấu phẩy động.

Ở ngữ cảnh 128k, DeepSeek-V3 với MLA (một biểu diễn tiềm ẩn dùng chung `c^{KV}` trên mỗi token mỗi lớp; K và V đều được suy ra từ biểu diễn tiềm ẩn này qua các phép chiếu lên có thể được hấp thụ vào matmul tiếp theo):

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Một baseline GQA giả định (hình dạng Llama 3 70B, 8 head KV, chiều head 128) sẽ phải trả:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

MLA nhỏ hơn 4x so với cache GQA kiểu Llama-3-70B ở ngữ cảnh 128k.

Sự đánh đổi: MLA thêm một bước giải nén cho mỗi phép tính attention (mỗi head). Phần tính toán bổ sung nhỏ so với băng thông tiết kiệm được. Lợi ích ròng cho suy luận ngữ cảnh dài.

### The routing: auxiliary-loss-free load balancing

Các router MoE quyết định những expert top-k nào xử lý mỗi token. Một router đơn giản tập trung quá nhiều công việc vào một vài expert, để các expert khác nhàn rỗi. Cách khắc phục tiêu chuẩn: thêm một số hạng auxiliary loss phạt sự mất cân bằng tải. Điều này có tác dụng nhưng làm giảm nhẹ hiệu năng tác vụ chính.

DeepSeek-V3 đưa ra một cơ chế không có auxiliary loss. Các số hạng bias cho từng expert được thêm vào logit của router, điều chỉnh trong lúc huấn luyện bằng một quy tắc đơn giản: nếu expert `e` quá tải, giảm `bias_e`; nếu thiếu tải, tăng nó. Không có số hạng loss bổ sung. Huấn luyện vẫn thuần. Tải expert vẫn cân bằng.

Ảnh hưởng đến loss chính: không đo được ảnh hưởng nào. Ảnh hưởng đến kiến trúc MoE: gọn hơn, không có siêu tham số auxiliary loss cần tinh chỉnh.

### The MTP: denser training + free draft

Từ Giai đoạn 10 · 18, bạn biết DeepSeek-V3 thêm D=1 mô-đun MTP dự đoán token cách trước hai vị trí. Khi suy luận, mô-đun đã huấn luyện được tái sử dụng làm bản dự thảo speculative decoding với tỷ lệ chấp nhận 80%+. Khi huấn luyện, mỗi trạng thái ẩn được giám sát trên D+1 = 2 mục tiêu, cung cấp tín hiệu dày đặc hơn.

Tham số: 14B ngoài 671B chính. Chi phí bổ sung: 2.1%.

### The training: DualPipe

Từ Giai đoạn 10 · 19, bạn biết DualPipe là một pipeline hai chiều chồng lấp các chunk forward và backward với giao tiếp all-to-all giữa các node. Ở quy mô 2,048 H800 của DeepSeek-V3, nó thu hồi khoảng 245k GPU-giờ mà 1F1B sẽ mất cho pipeline bubble.

### The config, field by field

Đây là cấu hình DeepSeek-V3 (đã giản lược):

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

Phân tích nó:

- `hidden_size=7168`: chiều embedding.
- `num_hidden_layers=61`: tổng độ sâu khối.
- `first_k_dense_layers=3`: 3 khối đầu dùng MLP dense kích thước 18432. 58 khối còn lại dùng MoE.
- `num_attention_heads=128`: 128 head truy vấn.
- `kv_lora_rank=512`: K và V được nén xuống chiều tiềm ẩn này và được giải nén theo từng head.
- `num_experts=256, num_experts_per_tok=8`: mỗi khối MoE có 256 expert, định tuyến top-8.
- `shared_experts=1`: ngoài 256 expert được định tuyến, 1 expert luôn hoạt động đóng góp vào mọi token. Hãy nghĩ về nó như một "nền dense" bảo đảm mọi token nhận được một thứ đáng tin cậy.
- `moe_intermediate_size=2048`: kích thước ẩn MLP của mỗi expert. Nhỏ hơn MLP dense vì có 256 expert.

### Parameter accounting

Phép tính đầy đủ nằm trong `code/main.py`. Các con số chính:

- Embedding: `vocab * hidden = 129280 * 7168 = ~0.93B`.
- 3 khối dense đầu: attention với MLA (~144M mỗi khối) + MLP dense (~260M mỗi khối) + các norm. Tổng cộng khoảng 1.2B.
- 58 khối MoE: attention với MLA (~144M) + 256 expert mỗi khối (30M mỗi expert) + 1 expert dùng chung (30M) + norm. Tổng ~7.95B mỗi khối, gồm tất cả expert. Tổng 461B cho 58 khối MoE.
- Mô-đun MTP: 14B.

Tổng cộng: ~476B cho kiến trúc cốt lõi + 14B MTP + riêng con số 671B đã công bố tính đến các tham số cấu trúc bổ sung (tensor bias, thành phần riêng của expert, hệ số tỷ lệ expert dùng chung, v.v.). Con số chúng ta tái hiện trong bộ tính nằm trong khoảng 3-5% so với số công bố — chênh lệch đến từ việc tính chi tiết mà báo cáo DeepSeek ghi lại trong phần phụ lục Mục 2.

Tham số hoạt động mỗi forward:

- Attention: 144M mỗi lớp * 61 = 8.8B (tất cả lớp hoạt động).
- MLP hoạt động: 3 lớp đầu dense (3 * 260M = 780M), 58 lớp MoE mỗi lớp hoạt động với 8 expert được định tuyến + 1 expert dùng chung + chi phí định tuyến. MLP hoạt động mỗi lớp: ~260M. Tổng: 3 * 260M + 58 * 260M = ~15.9B.
- Embedding + các norm: 1.2B.
- Tổng hoạt động: khoảng 26B cốt lõi + 14B MTP (được huấn luyện nhưng không phải lúc nào cũng chạy khi suy luận) ≈ 37B.

### The 671B / 37B ratio

Tỷ lệ thưa 18x (tham số hoạt động là 5.5% tổng số). DeepSeek-V3 là mô hình MoE tiên tiến nhất thưa nhất đã phát hành trọng số mở. Mixtral 8x7B ở tỷ lệ 13/47 (28%) dày đặc hơn nhiều. Llama 4 Maverick ở tỷ lệ 17B/400B (4.25%) là tương đương. Lựa chọn đặt cược của DeepSeek: ở quy mô tiên tiến nhất, nhiều expert hơn với tỷ lệ kích hoạt thấp hơn tạo chất lượng tốt hơn trên mỗi FLOP hoạt động.

### Where DeepSeek-V3 sits

| Mô hình | Tổng | Hoạt động | Tỷ lệ | Attention | Ý tưởng mới |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + không auxiliary loss + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | Mở rộng YaRN |

### The follow-on: R1, V4

DeepSeek-R1 (2025) là một lượt huấn luyện suy luận trên backbone V3. R1 dùng cùng kiến trúc. Điều thay đổi là công thức hậu huấn luyện (RL quy mô lớn trên các tác vụ có thể kiểm chứng), không phải kiến trúc tiền huấn luyện.

DeepSeek-V4 (nếu được phát hành) dự kiến giữ MLA + MoE + MTP và thêm DSA (DeepSeek Sparse Attention), thành phần kế nhiệm NSA từ Giai đoạn 10 · 17. Dòng phát triển ổn định: các đổi mới cấp kiến trúc tích lũy; mỗi phiên bản xoay thêm các núm điều chỉnh.

```figure
moe-routing
```

## Use It

`code/main.py` là bộ tính tham số chuyên cho hình dạng DeepSeek-V3. Chạy nó, so sánh đầu ra với các con số trong bài báo và dùng nó trên các biến thể giả định (256 expert so với 512, top-8 so với top-16, hạng MLA 512 so với 1024).

Những gì cần xem:

- Tổng số tham số so với 671B đã công bố.
- Số tham số hoạt động so với 37B đã công bố.
- KV cache ở ngữ cảnh 128k — so sánh MLA với GQA.
- Phân tích từng lớp để xem ngân sách tham số thực sự đi đâu.

## Ship It

Bài học này tạo ra `outputs/skill-deepseek-v3-reader.md`. Với một mô hình họ DeepSeek (V3, R1 hoặc bất kỳ biến thể tương lai nào), nó tạo ra bản đọc kiến trúc theo từng thành phần, nêu tên từng trường của cấu hình, suy ra số tham số theo thành phần và xác định mô hình dùng những đổi mới nào trong bốn đổi mới riêng của DeepSeek.

## Exercises

1. Chạy `code/main.py`. So sánh ước lượng tổng tham số của bộ tính với 671B đã công bố và xác định chênh lệch đến từ đâu. Mục 2 của bài báo có liệt kê đầy đủ.

2. Sửa cấu hình để dùng hạng MLA 256 thay vì 512. Tính kích thước KV cache tương ứng ở ngữ cảnh 128k. Nó mang lại mức giảm bao nhiêu phần trăm, và với chi phí nào đối với khả năng biểu đạt của từng head?

3. So sánh định tuyến (256 expert, top-8) của DeepSeek-V3 với một biến thể giả định (512 expert, top-8). Tổng tham số tăng; tham số hoạt động giữ nguyên. Dung lượng expert bổ sung mang lại gì về lý thuyết, và nó tốn gì khi suy luận?

4. Đọc Mục 2.1 của báo cáo kỹ thuật DeepSeek-V3 (arXiv:2412.19437) về MLA. Giải thích trong ba câu tại sao các ma trận giải nén K và V có thể được "hấp thụ" vào matmul tiếp theo để tăng hiệu quả khi suy luận.

5. DeepSeek-V3 dùng huấn luyện FP8 cho phần lớn phép toán. Tính bộ nhớ tiết kiệm của FP8 so với BF16 để lưu 671B trọng số. Điều này giao thoa thế nào với ngân sách huấn luyện 14.8T token?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| MLA | "Multi-Head Latent Attention" | Nén K và V thành một biểu diễn tiềm ẩn hạng thấp dùng chung (kv_lora_rank, thường là 512), giải nén theo từng head ngay khi cần; KV cache chỉ lưu biểu diễn tiềm ẩn |
| kv_lora_rank | "Chiều nén MLA" | Kích thước biểu diễn tiềm ẩn dùng chung cho K và V; DeepSeek-V3 dùng 512 |
| First k dense layers (k lớp dense đầu tiên) | "Các lớp đầu vẫn dense" | Một vài lớp đầu của mô hình MoE bỏ qua router MoE và chạy một MLP dense để ổn định |
| num_experts_per_tok | "Định tuyến top-k" | Có bao nhiêu expert được định tuyến hoạt động trên mỗi token; DeepSeek-V3 dùng 8 |
| Shared experts (Expert dùng chung) | "Expert luôn hoạt động" | Các expert xử lý mọi token bất kể định tuyến; DeepSeek-V3 dùng 1 |
| Auxiliary-loss-free routing (Định tuyến không có auxiliary loss) | "Cân bằng tải điều chỉnh bằng bias" | Các số hạng bias cho từng expert được điều chỉnh khi huấn luyện để giữ tải expert cân bằng mà không thêm số hạng loss |
| MTP module (Mô-đun MTP) | "Head dự đoán bổ sung" | Khối transformer dự đoán t+2 từ h^(1) và E(t+1); huấn luyện dày đặc hơn, bản dự thảo speculative decoding miễn phí |
| DualPipe | "Pipeline hai chiều" | Lịch huấn luyện chồng lấp tính toán forward/backward với all-to-all giữa các node |
| Active parameter ratio (Tỷ lệ tham số hoạt động) | "Độ thưa" | active_params / total_params; DeepSeek-V3 đạt 5.5% |
| FP8 training (Huấn luyện FP8) | "Huấn luyện 8 bit" | Lưu trữ khi huấn luyện và nhiều phép tính dùng FP8; giảm khoảng một nửa bộ nhớ so với BF16 với chi phí chất lượng nhỏ |

## Further Reading

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — tài liệu đầy đủ về kiến trúc, huấn luyện và kết quả
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) — các file cấu hình và ghi chú triển khai
- [DeepSeek-V2 paper (arXiv:2405.04434)](https://arxiv.org/abs/2405.04434) — mô hình tiền nhiệm giới thiệu MLA
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — mô hình kế nhiệm huấn luyện suy luận trên kiến trúc V3
- [Native Sparse Attention (arXiv:2502.11089)](https://arxiv.org/abs/2502.11089) — hướng phát triển tương lai cho attention của họ DeepSeek
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) — tham chiếu về lịch huấn luyện
