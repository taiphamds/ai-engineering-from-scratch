# Any-Resolution Vision: Patch-n'-Pack and NaFlex

> Ảnh thực không phải hình vuông 224x224. Hóa đơn là 9:16, biểu đồ là 16:9, ảnh quét y tế có thể 4096x4096, ảnh chụp màn hình di động là 9:19.5. Câu trả lời VLM trước năm 2024 — đổi mọi thứ về hình vuông cố định — bỏ đi tín hiệu khiến OCR, hiểu tài liệu và phân tích cảnh độ phân giải cao hoạt động. NaViT (Google, 2023) cho thấy có thể đóng gói patch khác độ phân giải thành một batch transformer với mask chéo khối. M-RoPE của Qwen2-VL (2024) bỏ hoàn toàn bảng vị trí tuyệt đối. AnyRes của LLaVA-NeXT chia ảnh độ phân giải cao thành ảnh cơ sở + ảnh con. Biến thể NaFlex của SigLIP 2 (2025) giờ là encoder mặc định cho VLM mở muốn một checkpoint phục vụ mọi tỷ lệ khung hình. Bài học này triển khai patch-n'-pack từ đầu đến cuối.

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Learning Objectives

- Đóng gói patch từ batch ảnh khác độ phân giải vào một chuỗi và xây attention mask chéo khối.
- Chọn giữa chia ô AnyRes (LLaVA-NeXT), NaFlex (SigLIP 2) và M-RoPE (Qwen2-VL) cho tác vụ cho trước.
- Tính ngân sách token cho OCR, biểu đồ và nhiếp ảnh mà không đổi kích thước.
- Nêu tên ba dạng thất bại của đổi kích thước vuông: văn bản méo, nội dung bị cắt, token lãng phí trên padding.

## The Problem

Transformer kỳ vọng chuỗi. Batch là chồng các chuỗi cùng độ dài. Nếu ảnh 224x224, bạn nhận 196 token patch mỗi lần, không cần padding, xong việc. Huấn luyện ở 224, suy luận ở 224, không nghĩ độ phân giải nữa.

Thế giới không hợp tác. Tài liệu dọc (8.5x11 inch, khoảng 2:3). Ảnh chụp biểu đồ ngang (16:9). Hóa đơn cao và mảnh (1:3). Ảnh y tế có ở 2048x2048 hoặc lớn hơn. Ảnh chụp thiết bị di động là 1170x2532 (0.46:1).

Ba lựa chọn trước năm 2024 và tại sao mỗi loại thất bại:

1. Đổi về hình vuông cố định (224x224 hoặc 336x336). Ép hình làm méo văn bản và mặt. Thu nhỏ phá nhãn biểu đồ và nội dung OCR. Thực hành tiêu chuẩn đến LLaVA-1.5.
2. Crop theo tỷ lệ khung hình cố định. Bạn bỏ phần lớn ảnh, và chọn vị trí crop là bài toán thị giác riêng.
3. Pad theo cạnh dài nhất. Sửa méo nhưng lãng phí 50%+ token cho padding ảnh dọc. Chi phí attention bậc hai trên mọi token pad đó.

Câu trả lời 2024-2025: để transformer ăn patch ở độ phân giải nguyên bản ảnh, và tìm cách đóng gói batch không đồng nhất thành một chuỗi không lãng phí tính toán.

## The Concept

### NaViT and patch-n'-pack

NaViT (Dehghani và cộng sự, 2023) là bài báo cho thấy điều này hoạt động ở quy mô lớn. Ý tưởng mang tính cơ học:

1. Với mỗi ảnh trong batch, tính lưới patch nguyên bản ở kích thước patch chọn (chẳng hạn 14).
2. Làm phẳng patch mỗi ảnh thành chuỗi độ dài thay đổi riêng.
3. Nối patch mọi ảnh thành một chuỗi dài cho batch.
4. Xây attention mask chéo khối để patch ảnh A chỉ attend trong ảnh A.
5. Mang thông tin vị trí mỗi patch (RoPE 2D hoặc embedding vị trí phân số).

Batch ba ảnh ở 336x336 (576 token), 224x224 (256 token) và 448x336 (768 token) thành một chuỗi 1600 token với mask chéo khối 1600x1600. Không padding. Không lãng phí tính toán. Transformer xử lý tỷ lệ khung hình tùy ý.

NaViT cũng giới thiệu bỏ patch theo tỷ phần trong huấn luyện — bỏ ngẫu nhiên 50% patch trên batch — vừa chính quy hóa vừa tăng tốc huấn luyện. SigLIP 2 kế thừa.

### AnyRes (LLaVA-NeXT)

AnyRes LLaVA-NeXT là phương án thực dụng. Với ảnh độ phân giải cao và encoder cố định (CLIP hoặc SigLIP ở 336), chia ô ảnh:

1. Chọn bố trí lưới từ tập định sẵn — (1x1), (1x2), (2x1), (1x3), (3x1), (2x2), v.v. — khớp nhất tỷ lệ khung hình.
2. Chia toàn ảnh vào lưới; mỗi ô thành crop 336x336.
3. Cũng tạo ảnh thu nhỏ: toàn ảnh đổi kích thước về 336x336 làm token ngữ cảnh toàn cục.
4. Mã hóa mọi ô qua encoder 336 đóng băng. Nối token ô + token ảnh thu nhỏ.

Với ảnh 672x672 ở lưới 2x2 cộng ảnh thu nhỏ: 4 * 576 + 576 = 2880 token thị giác. Đắt nhưng hiệu quả — LLM thấy cả chi tiết cục bộ và ngữ cảnh toàn cục.

AnyRes là đường ưu tiên khi encoder đóng băng và chỉ hỗ trợ một độ phân giải. Nó làm số token bùng nổ cho ảnh lớn (ảnh 1344x1344 ở lưới 4x4 là 9216 + 576 ≈ 9800 token, lấp phần lớn ngữ cảnh LLM 8k).

### M-RoPE (Qwen2-VL)

Qwen2-VL giới thiệu Multimodal Rotary Position Embedding. Thay vị trí phân số NaViT hoặc chia ô-và-ảnh thu nhỏ AnyRes, mỗi patch mang vị trí 3D (thời gian, chiều cao, chiều rộng). Phép quay query/key xử lý H, W và độ dài thời gian tùy ý.

M-RoPE cung cấp độ phân giải động nguyên bản không huấn luyện lại. Khi suy luận đưa bất kỳ ảnh HxW, bộ nhúng patch tạo H/14 x W/14 token, mỗi token nhận vị trí (t=0, r=row, c=col), RoPE quay attention với tần số đúng, xong. Qwen2.5-VL và Qwen3-VL tiếp tục. V2PE InternVL3 cùng ý tưởng với mã hóa thay đổi theo phương thức.

Khác AnyRes, M-RoPE có O(H x W / P^2) token ở độ phân giải nguyên bản — không chi phí ô nhân thêm. Khác NaViT, nó vẫn kỳ vọng một ảnh mỗi forward. Batch giữa các độ phân giải vẫn cần patch-n'-pack bên trên.

### NaFlex (SigLIP 2)

NaFlex là chế độ native-flex của checkpoint SigLIP 2. Một mô hình phục vụ nhiều độ dài chuỗi (256, 729, 1024 token) khi suy luận. Bên trong dùng patch-n'-pack kiểu NaViT trong huấn luyện và vị trí phân số tuyệt đối mỗi patch. Điểm bán: một checkpoint, chọn ngân sách token khi suy luận theo tác vụ.

Cho tác vụ ngữ nghĩa (phân loại, truy xuất), 256 token. Cho OCR hoặc hiểu biểu đồ, 1024 token. Không huấn luyện lại.

### The packing mask

Mask chéo khối là nơi hầu hết triển khai vấp. Với chuỗi đóng gói dài `N_total` bao quát ảnh `i=0..B-1` có độ dài `n_i`, mask `M` hình dạng `(N_total, N_total)` là 1 nếu hai chỉ số trong cùng khối ảnh, nếu không 0. Có thể xây từ danh sách độ dài tích lũy:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

Đây là một dòng PyTorch với `torch.block_diag` hoặc gather tường minh. Đường độ dài thay đổi của FlashAttention (`cu_seqlens`) bỏ hoàn toàn mask và attend trong chuỗi bằng tensor độ dài tích lũy trực tiếp — nhanh hơn ~10x mask dày đặc cho batch điển hình.

### Token budgets

Chọn chiến lược theo tác vụ:

- OCR / tài liệu: 1024-4096 token. SigLIP 2 NaFlex ở 1024 hoặc AnyRes 3x3 + ảnh thu nhỏ.
- Biểu đồ và UI: 729-1024 token ở 384-448 nguyên bản. Độ phân giải động Qwen2.5-VL với trần pixel tối đa.
- Ảnh tự nhiên: 256-576 token phù hợp. LLM downstream thấy đủ. Trả tiền token nơi mật độ nội dung cao.
- Video: 64-128 token mỗi khung sau pooling không gian, 2-8 FPS. Bài 12.17 trình bày.

Quy tắc sản xuất năm 2026: chọn trần pixel tối đa mỗi tác vụ, mã hóa ở tỷ lệ khung hình nguyên bản đến trần, đóng gói batch và bỏ padding. Qwen2.5-VL mở `min_pixels` và `max_pixels` cho đúng núm này.

```figure
mm-patch-n-pack
```

## Use It

`code/main.py` triển khai patch-n'-pack cho batch ảnh không đồng nhất với tọa độ pixel nguyên. Nó:

- Nhận danh sách kích thước ảnh (H, W).
- Tính độ dài chuỗi patch mỗi ảnh ở kích thước patch 14.
- Đóng gói chúng thành một chuỗi tổng dài `sum(n_i)`.
- Xây attention mask chéo khối (dày đặc, để rõ).
- So chi phí đóng gói với đổi kích thước vuông và chia ô AnyRes.
- In bảng ngân sách token cho batch hỗn hợp (hóa đơn, biểu đồ, ảnh chụp màn hình, ảnh chụp).

Chạy nó. Những con số xuất hiện là lý do mọi VLM mở năm 2026 dùng patch-n'-pack.

## Ship It

Bài học này tạo `outputs/skill-resolution-budget-planner.md`. Với khối lượng công việc hỗn hợp tỷ lệ khung hình (OCR, biểu đồ, ảnh, khung video) và ngân sách tổng token, nó chọn chiến lược đúng (NaFlex, AnyRes, M-RoPE hoặc vuông cố định) và phát cấu hình mỗi yêu cầu. Dùng skill khi định cỡ VLM cho sản phẩm — nó ngăn bùng token âm thầm 10x giết ngân sách độ trễ.

## Exercises

1. Hóa đơn là 600x1500 (1:2.5). Ở kích thước patch 14, bao nhiêu token độ phân giải nguyên bản? Bao nhiêu sau đổi kích thước vuông về 336? Loại nào mất nhiều độ chính xác OCR hơn trong thực tế?

2. Xây mask chéo khối cho batch bốn ảnh có độ dài 256, 576, 729, 1024. Xác minh ma trận attention là 2585x2585 và có đúng `256^2 + 576^2 + 729^2 + 1024^2` phần tử khác không.

3. Với ảnh 1792x896 ở patch 14, so: (a) đổi kích thước vuông về 336 rồi mã hóa, (b) AnyRes 2x1 + ảnh thu nhỏ, (c) M-RoPE nguyên bản. Loại nào ít token nhất? Loại nào giữ nhiều chi tiết nhất?

4. Triển khai bỏ patch theo tỷ phần: với chuỗi đóng gói, bỏ ngẫu nhiên đều 50% token và cập nhật mask chéo khối tương ứng. Đo thay đổi độ thưa mask.

5. Đọc Mục 3.2 bài báo Qwen2-VL (arXiv:2409.12191). Mô tả trong hai câu `min_pixels` và `max_pixels` kiểm soát gì và tại sao cả hai cận quan trọng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Patch-n'-pack | "Đóng gói kiểu NaViT" | Nối chuỗi patch độ dài thay đổi từ các ảnh khác nhau vào một chiều batch |
| Block-diagonal mask (Mask chéo khối) | "Mask đóng gói" | Attention mask giới hạn patch mỗi ảnh chỉ attend đến chính chúng, không hàng xóm trong gói |
| AnyRes | "Chia ô LLaVA-NeXT" | Chia ảnh độ phân giải cao thành lưới ô kích thước cố định cộng ảnh thu nhỏ toàn cục; mã hóa mọi ô bằng encoder cố định |
| NaFlex | "Native-flex SigLIP 2" | Một checkpoint SigLIP 2 phục vụ ngân sách 256/729/1024 token khi suy luận không huấn luyện lại |
| M-RoPE | "RoPE đa phương thức" | Mã hóa vị trí quay 3D (thời gian, hàng, cột) xử lý H, W, T tùy ý không bảng vị trí |
| cu_seqlens | "Đóng gói FlashAttention" | Tensor độ dài tích lũy đường varlen FlashAttention dùng thay mask chéo khối dày đặc |
| min_pixels / max_pixels | "Cận độ phân giải" | Núm mỗi yêu cầu Qwen2.5-VL giới hạn số token trên đầu vào rất nhỏ hoặc rất lớn |
| Visual token budget (Ngân sách token thị giác) | "Bao nhiêu token mỗi ảnh" | Số token patch sơ bộ phát mỗi ảnh; đặt ngân sách prompt LLM và chi phí attention |

## Further Reading

- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
