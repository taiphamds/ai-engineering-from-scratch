# Jamba — Hybrid SSM-Transformer

> Mô hình không gian trạng thái (SSM) và transformer muốn những điều khác nhau. Transformer đổi lấy chất lượng thông qua attention với chi phí bậc hai. SSM đổi lấy suy luận thời gian tuyến tính và bộ nhớ hằng số thông qua một phép truy hồi nhưng kém hơn về chất lượng. Jamba của AI21 (tháng 3 năm 2024) và Jamba 1.5 (tháng 8 năm 2024) đặt chúng vào cùng một mô hình: 1 lớp Transformer cho mỗi 7 lớp Mamba, MoE trên mỗi khối xen kẽ, và cửa sổ ngữ cảnh 256k vừa trên một GPU 80GB duy nhất. Mamba-3 (ICLR 2026) củng cố phía SSM bằng các không gian trạng thái giá trị phức và các phép chiếu MIMO. Bài học này đọc cả hai kiến trúc từ đầu đến cuối và giải thích tại sao công thức lai đã tồn tại qua ba năm mở rộng quy mô trong khi các nỗ lực ngữ cảnh dài thuần SSM và thuần Transformer thì không.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**Prerequisites:** Phase 10 · 14 (open-model architectures), Phase 10 · 17 (native sparse attention)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích ba thành phần cơ bản trong một khối Jamba — các lớp Transformer, các lớp Mamba, MoE — và công thức xen kẽ 1:7:chẵn.
- Nêu dạng truy hồi của một SSM ở mức khái quát và tại sao nó cho phép suy luận với bộ nhớ hằng số.
- Tính dung lượng KV cache của một mô hình Jamba ở ngữ cảnh 256k và so sánh với những gì một mô hình thuần Transformer sẽ cần.
- Nêu tên ba đổi mới của Mamba-3 (rời rạc hóa mũ-hình thang, cập nhật trạng thái giá trị phức, MIMO) và vấn đề mà mỗi đổi mới nhắm tới.

## The Problem

Attention có độ phức tạp bậc hai theo độ dài chuỗi. Các mô hình không gian trạng thái có độ phức tạp tuyến tính. Sự khác biệt đó cộng dồn: ở 256k token, bản đồ attention của Transformer có 65B phần tử mỗi head; trạng thái truy hồi của SSM có kích thước cố định bất kể độ dài chuỗi.

Các mô hình thuần SSM (Mamba, Mamba-2) đạt perplexity ngang Transformer ở quy mô nhỏ nhưng kém hơn trên các tác vụ theo dõi trạng thái và thất bại ở một số loại truy xuất trong ngữ cảnh. Trực giác: SSM nén lịch sử vào một trạng thái cố định, và khi lịch sử dài, thông tin rò rỉ. Attention nhớ mọi thứ chính xác nhưng trả chi phí bậc hai.

Cách khắc phục hiển nhiên: dùng cả hai. Đặt các lớp Transformer ở nơi việc nhớ lại chính xác quan trọng. Dùng các lớp SSM ở nơi khác. Tinh chỉnh tỷ lệ. Jamba là mô hình đầu tiên đạt cấp sản xuất phát hành công thức lai này ở quy mô lớn (tổng 52B, 12B hoạt động, ngữ cảnh 256k, một GPU 80GB duy nhất). Jamba 1.5 mở rộng họ mô hình lên tổng 398B / 94B hoạt động. Mamba-3 (ICLR 2026) là baseline thuần SSM tốt nhất hiện tại mà các mô hình lai có thể được xây dựng lại xoay quanh.

Bài học này đọc cả ba bài báo và tạo ra mô hình tư duy cho việc "chọn tỷ lệ phù hợp."

## The Concept

### An SSM in one page

Một mô hình không gian trạng thái xử lý chuỗi `x_1, ..., x_N` thông qua trạng thái kích thước cố định `h`:

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Ở mỗi bước, trạng thái tiến triển qua động lực học tuyến tính `A`, nhận đầu vào `B x_t` và phát đầu ra `C h_t`. `A, B, C` có thể được học. Lưu ý thuộc tính then chốt: tính `y_t` chỉ cần `h_{t-1}` và `x_t`, không cần bất kỳ `x` nào trước đó. Bộ nhớ là hằng số. Suy luận có độ phức tạp O(1) mỗi token.

Mẹo để có chất lượng mô hình hóa là cấu trúc của `A`. S4 (Gu 2021) dùng một ma trận có cấu trúc cao có thể được tính hiệu quả dưới dạng tích chập dài trong huấn luyện. Mamba (Gu, Dao 2023) thay `A, B, C` cố định bằng các giá trị phụ thuộc dữ liệu (phần "chọn lọc"). Mamba-2 (2024) đơn giản hóa cấu trúc thêm nữa. Mamba-3 (2026) thêm lại độ phức tạp ở những vị trí cụ thể.

Thuộc tính chính: với một LLM decoder, một lớp SSM là sự thay thế trực tiếp cho lớp attention, với trạng thái từng lớp kích thước cố định thay cho KV cache tăng dần.

### The Jamba block

Một khối Jamba xen kẽ các lớp theo hai con số:

- `l`: tỷ lệ attention trên Mamba. Jamba dùng `l = 8`, nghĩa là 1 lớp Transformer cho mỗi 7 lớp Mamba (7 Mamba + 1 Attention = 8 lớp mỗi nhóm).
- `e`: tần suất MoE. Jamba dùng `e = 2`, nghĩa là cứ cách một lớp lại áp dụng MoE.

Chuỗi lớp bên trong một khối:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Mỗi khối Jamba có 8 lớp. Ở độ sâu 4 khối (tổng 32 lớp), bạn có 28 lớp Mamba và 4 lớp Attention. 16 lớp trong số đó dùng MoE.

### Why the 1:7 ratio

AI21 đã chạy các thí nghiệm loại bỏ thành phần: tỷ lệ attention trên Mamba nào cho perplexity trên mỗi tham số VÀ khả năng nhớ lại trong ngữ cảnh tốt nhất trên các đánh giá ngữ cảnh dài của họ?

- Quá nhiều attention (1:1): chất lượng tăng nhưng bộ nhớ và tốc độ kém đi.
- Quá ít attention (1:15): bộ nhớ rất tốt nhưng truy xuất trong ngữ cảnh thất bại.
- Điểm tối ưu: 1:7 hoặc 1:8.

Trực giác: các lớp Transformer xử lý việc nhớ lại chính xác và theo dõi trạng thái. Các lớp Mamba xử lý phần lớn công việc với chi phí thấp.

### Positional encoding

Bản thân các lớp Mamba nhận biết vị trí (thông qua truy hồi). Các lớp attention trong các mô hình lai dựa trên Mamba ban đầu không dùng RoPE — các lớp SSM cung cấp thông tin vị trí. Jamba 1.5 thêm RoPE vào các lớp attention để khái quát hóa sang ngữ cảnh dài hơn, một cải tiến về sau dựa trên đánh giá ngữ cảnh dài thực nghiệm.

### The memory budget

Với hình dạng Jamba-1 (32 lớp: 28 Mamba + 4 Attention, kích thước ẩn 4096, 32 head attention):

- KV cache (chỉ các lớp attention): `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB` ở 256k BF16. Chỉ 4 lớp attention đóng góp.
- Trạng thái SSM: `28 * hidden * state_size` trên mỗi tiền tố token, nhưng đây là kích thước cố định cho mỗi lớp, không tăng theo độ dài chuỗi. Trạng thái Mamba điển hình là 16 trên mỗi đặc trưng, kích thước ẩn 4096: tổng `28 * 4096 * 16 * 2 = 3.7 MB`.

So sánh với một Transformer thuần 32 lớp, cùng kích thước ẩn, MHA đầy đủ với 32 head: `2 * 32 * 32 * 128 * 256k * 2 = 128 GB` ở 256k BF16. Giảm 8x KV cache. Ngay cả so với baseline GQA(8) mà phần lớn mô hình năm 2024 dùng (`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`), mô hình lai 1:7 của Jamba ở 16 GB vẫn nhỏ hơn 2x.

Đó là ý của AI21 khi nói "ngữ cảnh 256k trên một GPU 80GB duy nhất." KV cache của một Transformer thuần full-MHA sẽ không vừa; ngay cả baseline GQA cũng không để lại chỗ cho trọng số và activation; của Jamba thì có.

### Mamba-3: the pure-SSM baseline in 2026

Mamba-3 (ICLR 2026, arXiv:2603.15569) giới thiệu ba đổi mới ở phía thuần SSM:

1. **Rời rạc hóa mũ-hình thang.** Thay rời rạc hóa bằng phương pháp Euler trong Mamba-2 bằng một phép truy hồi có khả năng biểu đạt cao hơn. Phép toán giống tích chập được áp dụng trên đầu vào trạng thái bên trong truy hồi cốt lõi, thay vì dưới dạng tích chập bên ngoài trên `x_t`.

2. **Cập nhật trạng thái giá trị phức.** Các Mamba trước giảm ma trận trạng thái từ phức (S4) xuống đường chéo thực (Mamba) rồi ma trận đơn vị có tỷ lệ (Mamba-2). Mamba-3 thêm lại giá trị phức — tương đương với một rotary embedding phụ thuộc dữ liệu trên trạng thái. Điều này khôi phục khả năng theo dõi trạng thái mà các đơn giản hóa giá trị thực trước đó đã đánh đổi.

3. **Các phép chiếu nhiều đầu vào nhiều đầu ra (MIMO).** Thay vì các phép chiếu vô hướng theo từng đặc trưng, dùng các phép chiếu giá trị ma trận. Cải thiện năng lực mô hình hóa và mức sử dụng phần cứng khi suy luận mà không tăng độ trễ giải mã.

Ở 1.5B tham số, Mamba-3 cải thiện độ chính xác downstream trung bình 0.6 điểm so với Gated DeltaNet; biến thể MIMO thêm 1.2 điểm nữa để tổng mức tăng là 1.8 điểm. Ở cùng kích thước trạng thái, Mamba-3 ngang Mamba-2 với một nửa trạng thái.

Mamba-3 chưa được phát hành trong một mô hình lai sản xuất ở quy mô lớn — nhưng nó là ứng viên hiển nhiên cho phía SSM của mô hình loại Jamba tiếp theo.

### When to reach for a hybrid

Các mô hình lai thắng khi:

- Ngữ cảnh đủ dài để KV cache của Transformer thuần trở nên khó chịu (64k+).
- Các tác vụ kết hợp cấu trúc phạm vi ngắn (tốt cho SSM) với nhớ lại phạm vi dài (cần Transformer).
- Bạn muốn triển khai với ngân sách bộ nhớ một GPU mà riêng KV cache của Transformer đã không vừa.

Các mô hình lai thua khi:

- Ngữ cảnh ngắn (dưới 16k). Chi phí SSM bổ sung bị lãng phí; Transformer thuần là phù hợp.
- Các tác vụ cần attention từ mọi nơi đến mọi nơi (suy luận sâu, đối chiếu chéo nhiều tài liệu). Sự thưa thớt của các lớp attention trong mô hình lai gây hại.
- Bạn đang mở rộng lên các mô hình tiên tiến nhất nghìn tỷ tham số. Transformer thuần + MLA + MoE (kiểu DeepSeek-V3) hiện đang thắng cuộc đua năng lực.

### The competitive landscape

| Mô hình | Họ | Quy mô | Tuyên bố riêng |
|-------|--------|------|-------------|
| Mamba-2 | SSM thuần | 3B | thời gian tuyến tính, bộ nhớ hằng số |
| Jamba | lai | 52B/12B | 256k trên 80GB |
| Jamba 1.5 Large | lai | 398B/94B | ngữ cảnh dài cấp doanh nghiệp |
| Mamba-3 | SSM thuần | 1.5B (bài báo) | khôi phục theo dõi trạng thái |
| DeepSeek-V3 | Transformer thuần + MoE | 671B/37B | năng lực tiên tiến nhất |

Bức tranh năm 2026: MoE Transformer thuần thống trị tuyến đầu, nhưng các mô hình lai nắm giữ thị trường ngách ngữ cảnh trên 256k. Những thành công về theo dõi trạng thái của Mamba-3 có thể đẩy tỷ lệ lai xuống thấp hơn (nhiều SSM hơn, ít attention hơn) ở thế hệ tiếp theo.

```figure
swiglu-ffn
```

## Use It

`code/main.py` là bộ tính bộ nhớ cho các kiến trúc lai. Với một tỷ lệ SSM-Transformer và một cấu hình kích thước ẩn / số lớp, nó tính:

- KV cache ở ngữ cảnh đích.
- Bộ nhớ trạng thái SSM.
- Tổng bộ nhớ ở ngữ cảnh N cho một loạt hình dạng mô hình.

Bộ tính hỗ trợ:

- Baseline Transformer thuần (KV cache tăng theo N).
- Mô hình lai 1:7 kiểu Jamba.
- SSM thuần (hoàn toàn không có KV cache).

Các con số lấy trực tiếp từ các bài báo Jamba-1 và Jamba-1.5 cho các hình dạng đã công bố và được ngoại suy cho các biến thể giả định.

Các cân nhắc tích hợp cho một triển khai thực tế:

- Phần lớn máy chủ suy luận sản xuất (vLLM, SGLang) hỗ trợ Jamba và Mamba. Kiểm tra phiên bản cụ thể.
- Ở ngữ cảnh 256k, lợi thế bộ nhớ của Jamba thể hiện ở thông lượng yêu cầu đồng thời. Trên cùng VRAM, bạn chứa được nhiều chuỗi Jamba hơn chuỗi Transformer.
- Mamba-3 dưới dạng mô hình độc lập chưa được phát hành trong sản xuất — bản xem trước nghiên cứu ở 1.5B.

## Ship It

Bài học này tạo ra `outputs/skill-hybrid-picker.md`. Với một đặc tả khối lượng công việc (hồ sơ độ dài ngữ cảnh, hỗn hợp tác vụ, ngân sách bộ nhớ), nó khuyến nghị giữa Transformer thuần, mô hình lai kiểu Jamba và SSM thuần, với lập luận rõ ràng về những đánh đổi bộ nhớ và chất lượng.

## Exercises

1. Chạy `code/main.py` để tính KV cache ở ngữ cảnh 256k cho một Transformer thuần 32 lớp (kích thước ẩn 4096, 32 head) và cho mô hình lai Jamba-1 cùng hình dạng. Xác minh mức giảm bộ nhớ ~8x mà bài báo AI21 tuyên bố.

2. Sửa bộ tính để mô hình hóa một mô hình lai 1:3 (4 Mamba : 1 Attention) và một mô hình lai 1:15 (14 Mamba : 1 Attention). Vẽ KV cache theo tỷ lệ. Ở tỷ lệ nào KV cache bằng bộ nhớ trạng thái SSM?

3. Đọc Mục 3 của bài báo Jamba (arXiv:2403.19887). Giải thích tại sao AI21 dùng Mamba-1 thay vì Mamba-2 dù Mamba-2 nhanh hơn. Gợi ý: phần thí nghiệm loại bỏ thành phần của mô hình lai ghi lại điều này.

4. Tính chi phí tham số bổ sung của MoE ở mỗi lớp xen kẽ trong Jamba 1.5 Large (tổng 398B, 94B hoạt động). So sánh tỷ lệ hoạt động với DeepSeek-V3 (37B/671B) và giải thích tại sao kiến trúc Jamba đẩy tỷ lệ hoạt động lên cao hơn.

5. Đọc Mục 3 của bài báo Mamba-3 (arXiv:2603.15569). Giải thích trong ba câu tại sao một cập nhật trạng thái giá trị phức tương đương với rotary embedding phụ thuộc dữ liệu. Liên hệ câu trả lời với phép suy ra RoPE của Giai đoạn 7 · Bài 04.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| State space model (SSM) (Mô hình không gian trạng thái) | "Truy hồi với một trạng thái cố định" | Một lớp với phép truy hồi được học `h_t = A h_{t-1} + B x_t`; bộ nhớ hằng số mỗi token |
| Selective SSM (SSM chọn lọc) | "Mẹo của Mamba" | Các tham số A, B, C phụ thuộc dữ liệu mang lại cho mô hình tính chọn lọc giống gating ở thời gian tuyến tính |
| Attention-to-Mamba ratio (Tỷ lệ attention trên Mamba) | "Bao nhiêu lớp attention" | Trong Jamba, `l = 8` nghĩa là 1 lớp attention trên mỗi 7 lớp Mamba |
| Jamba block (Khối Jamba) | "Nhóm 8 lớp" | Một attention + bảy Mamba + MoE ở các vị trí xen kẽ |
| SSM state (Trạng thái SSM) | "Bộ đệm ẩn" | Trạng thái từng lớp kích thước cố định thay thế KV cache cho các lớp Mamba |
| 256k context (Ngữ cảnh 256k) | "Con số chủ lực của Jamba" | Độ dài chuỗi mà Jamba-1 chứa vừa trên một GPU 80GB duy nhất; Transformer thuần không thể ở kích thước đó |
| Mamba-3 | "SSM thuần năm 2026" | Kiến trúc SSM thuần tốt nhất hiện tại với trạng thái phức + MIMO; baseline mà các mô hình lai xây dựng lại xoay quanh |
| MIMO | "Nhiều đầu vào nhiều đầu ra" | Đổi mới của Mamba-3 dùng các phép chiếu giá trị ma trận thay vì vô hướng trên từng đặc trưng |
| Exponential-trapezoidal discretization (Rời rạc hóa mũ-hình thang) | "Truy hồi của Mamba-3" | Phép truy hồi có khả năng biểu đạt cao hơn bao hàm rời rạc hóa bằng phương pháp Euler của Mamba-2 |
| Hybrid architecture (Kiến trúc lai) | "Trộn attention và SSM" | Bất kỳ mô hình nào xen kẽ các lớp Transformer và SSM; Jamba là hình mẫu sản xuất |

## Further Reading

- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) — bài báo Jamba gốc, các thí nghiệm loại bỏ thành phần về tỷ lệ, tuyên bố ngữ cảnh 256k
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570) — họ mô hình được mở rộng quy mô, các bản phát hành công khai 398B/94B và 12B/52B
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) — bài báo SSM chọn lọc mà Jamba xây dựng dựa trên
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060) — mô hình kế nhiệm không gian trạng thái có cấu trúc được đơn giản hóa
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) — trạng thái giá trị phức, MIMO, tuyến đầu SSM thuần năm 2026
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) — bài báo S4, điểm khởi đầu của dòng phát triển SSM cho LLM
