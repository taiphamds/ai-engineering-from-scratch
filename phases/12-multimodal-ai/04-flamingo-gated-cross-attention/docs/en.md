# Flamingo and Gated Cross-Attention for Few-Shot VLMs

> Flamingo của DeepMind (2022) làm hai điều trước mọi người khác. Nó cho thấy một mô hình duy nhất xử lý được chuỗi ảnh, video và văn bản xen kẽ tùy ý. Và nó cho thấy VLM học được trong ngữ cảnh — đưa prompt few-shot với ba cặp ví dụ (ảnh, chú thích) và mô hình chú thích ảnh mới không có bước gradient nào. Cơ chế: lớp cross-attention có cổng, chèn giữa các lớp hiện có của LLM đóng băng, với cổng tanh được học bắt đầu bằng không để năng lực văn bản LLM được giữ khi khởi tạo. Bài học này đi qua Perceiver resampler và kiến trúc cross-attention có cổng của Flamingo — tổ tiên đầu vào xen kẽ Gemini và token thị giác Idefics2.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## Learning Objectives

- Giải thích cách cross-attention có cổng giữ năng lực văn bản LLM đóng băng khi khởi tạo qua tanh(gate) = 0.
- Đi qua Perceiver resampler: N patch ảnh → K query "tiềm ẩn" cố định qua cross-attention.
- Mô tả cách Flamingo xử lý chuỗi ảnh-văn bản xen kẽ bằng che nhân quả tôn trọng vị trí ảnh.
- Tái hiện cấu trúc prompt đa phương thức few-shot (3 ví dụ ảnh-chú thích rồi ảnh truy vấn).

## The Problem

BLIP-2 đưa 32 token thị giác vào lớp đầu vào LLM đóng băng. Hoạt động cho một ảnh mỗi prompt. Nhưng nếu muốn đưa *nhiều* ảnh xen văn bản, như "đây là ảnh A, chú thích nó; đây là ảnh B, chú thích nó; giờ đây là ảnh C, chú thích nó"? Self-attention của LLM phải xử lý token ảnh và token văn bản trong một luồng, và câu hỏi vị trí nào attend được ảnh nào trở nên rắc rối.

Câu trả lời Flamingo: không đổi luồng đầu vào LLM chút nào. Chèn thêm lớp cross-attention giữa khối LLM hiện có. Token văn bản vẫn chảy qua self-attention nhân quả LLM như thường. Giữa mỗi vài khối LLM, token văn bản cũng cross-attend đến đặc trưng ảnh qua lớp có cổng mới. Cổng (khởi tạo bằng không) nghĩa là tại bước không các lớp mới không làm gì — mô hình hành xử đúng như LLM tiền huấn luyện. Khi huấn luyện tiến triển cổng mở và thông tin thị giác bắt đầu chảy.

Câu hỏi thứ hai Flamingo trả lời: xử lý số ảnh thay đổi (0, 1 hoặc nhiều) mỗi prompt thế nào? Perceiver resampler — mô-đun cross-attention nhỏ nhận bất kỳ số patch nào và tạo số token tiềm ẩn thị giác cố định. Lớp cross-attention LLM thấy cùng hình dạng bất kể bao nhiêu ảnh trong prompt.

## The Concept

### The frozen LLM

Flamingo bắt đầu với LLM Chinchilla 70B đóng băng. Cả 70B trọng số không bị chạm. Self-attention văn bản và FFN hiện có hoạt động bình thường.

### Perceiver resampler

Với mỗi ảnh trong prompt, ViT tạo N token patch. Perceiver resampler có K biến tiềm ẩn cố định có thể học (Flamingo dùng K=64). Mỗi khối resampler là hai bước con:

1. Cross-attention: K biến tiềm ẩn attend trên N token patch (Q từ biến tiềm ẩn, K/V từ patch).
2. Self-attention + FFN trong các biến tiềm ẩn.

Sau 6 khối resampler, đầu ra là K=64 token thị giác chiều 1024, bất kể ViT tạo bao nhiêu patch. Ảnh 224x224 (196 patch) và ảnh 480x480 (900 patch) đều ra thành 64 token resampler.

Với video, resampler áp dụng theo thời gian: patch mỗi khung tạo 64 biến tiềm ẩn và mã hóa vị trí thời gian cho mô hình phân biệt t=0 với t=N. Toàn video thành T * 64 token thị giác.

### Gated cross-attention

Giữa mỗi M lớp LLM đóng băng (Flamingo dùng M=4), chèn khối cross-attention có cổng mới:

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha` là vô hướng có thể học khởi tạo bằng không.
- `tanh(0) = 0`, nên khi khởi tạo nhánh có cổng đóng góp không.
- Khi `alpha` rời khỏi không, đóng góp cross-attention tăng trơn.
- Kết nối residual nghĩa là ngay cả cổng mở hoàn toàn cũng không ghi đè biểu diễn văn bản LLM; chỉ thêm thông tin thị giác bên trên.

Đây là lựa chọn thiết kế quan trọng nhất trong Flamingo: điều kiện hóa thị giác là cộng thêm, có cổng và bằng không khi khởi tạo. Flamingo ở bước 0 là Chinchilla 70B hoàn hảo trên đầu vào chỉ văn bản.

### Masked cross-attention for interleaved inputs

Trong prompt như "<image A> caption A <image B> caption B <image C> ?", mỗi token văn bản chỉ nên thấy ảnh đến trước trong chuỗi. Cross-attention mask cưỡng chế: token văn bản ở vị trí `t` chỉ attend đến token resampler ảnh có chỉ số ảnh `i < i_t` trong đó `i_t` là ảnh gần nhất trước vị trí `t`. "Chỉ thấy ảnh cuối phía trước" hoặc "thấy mọi ảnh phía trước" đều là lựa chọn hợp lệ; Flamingo chọn cách đầu.

### In-context few-shot learning

Prompt Flamingo trông như:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

Mô hình thấy mẫu hoàn thành và xuất "chim" (hoặc bất kỳ thứ gì image3 thể hiện). Không bước gradient. Năng lực học trong ngữ cảnh của LLM đóng băng truyền qua cross-attention có cổng — đây là điểm chính bài báo và lý do nó quan trọng.

### Training data

Flamingo huấn luyện trên ba bộ dữ liệu:

1. MultiModal MassiveWeb (M3W): 43M trang web với ảnh và văn bản xen kẽ, tái dựng thứ tự đọc.
2. Image-Text Pairs (ALIGN + LTIP): 4.4B cặp.
3. Video-Text Pairs (VTP): 27M đoạn video ngắn.

OBELICS (2023) là tái tạo mở ngữ liệu web xen kẽ, mà Idefics, Idefics2 và hầu hết mô hình mở "giống Flamingo" huấn luyện trên đó.

### OpenFlamingo and Otter

OpenFlamingo (2023) là tái tạo mở. Kiến trúc giống hệt (Perceiver resampler + cross-attention có cổng trên LLaMA hoặc MPT đóng băng). Checkpoint ở 3B, 4B, 9B. Chất lượng kém Flamingo vì LLM cơ sở nhỏ hơn và ít dữ liệu hơn.

Otter (2023) xây trên OpenFlamingo với instruction tuning trên MIMIC-IT (bộ dữ liệu chỉ dẫn đa phương thức), cho thấy cross-attention có cổng cũng hoạt động cho làm theo chỉ dẫn.

### The descendants

- Idefics / Idefics2 / Idefics3: dòng cross-attention có cổng của Hugging Face, dần đơn giản hơn (Idefics2 bỏ resampler để dùng token patch trực tiếp với pooling thích nghi).
- Chuyển Flamingo sang Chameleon: đến năm 2024 nhiều nhóm chuyển sang hợp nhất sớm (Bài 12.11); cross-attention có cổng kiểu Flamingo vẫn trong sản xuất nơi cần đóng băng backbone.
- Đầu vào xen kẽ Gemini: về khái niệm kế thừa tính linh hoạt định dạng xen kẽ Flamingo, dù cơ chế chính xác là độc quyền.

### Comparison to BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Cầu nối thị giác | Q-Former một lần ở đầu vào | Cross-attention có cổng mỗi M lớp |
| Token thị giác | 32 mỗi ảnh | 64 mỗi ảnh mỗi lớp cross-attn |
| LLM đóng băng | Có | Có |
| Few-shot trong ngữ cảnh | Yếu | Mạnh — trọng tâm bài báo |
| Đầu vào xen kẽ | Không hỗ trợ nguyên bản | Có, mục tiêu thiết kế |
| Dữ liệu huấn luyện | 130M cặp | 1.3B cặp + 43M trang xen kẽ |
| Số tham số | 188M được huấn luyện | ~10B được huấn luyện (lớp cross-attn) |
| Tính toán | Vài ngày trên 8 A100 | Nhiều tuần trên hàng nghìn TPUv4 |

Chọn BLIP-2 cho VQA một ảnh tiết kiệm ngân sách. Chọn Flamingo/Idefics2 cho suy luận xen kẽ, few-shot hoặc nhiều ảnh.

```figure
cross-attention-fusion
```

## Use It

`code/main.py` minh họa:

1. Perceiver resampler trên 36 token patch giả với 8 biến tiềm ẩn có thể học (cross-attention Python thuần).
2. Bước cross-attention có cổng với `alpha = 0` → đầu ra bằng đầu vào (LLM không đổi), rồi `alpha = 2.0` → đóng góp thị giác được trộn vào.
3. Bộ xây mask xen kẽ tạo attention mask 2D cho chuỗi "(ảnh 1) (văn bản 1) (ảnh 2) (văn bản 2)".

## Ship It

Bài học này tạo `outputs/skill-gated-bridge-diagnostic.md`. Với cấu hình VLM mở (resampler có/không, tần suất cross-attn, cơ chế cổng), nó xác định thành phần dòng Flamingo và giải thích chiến lược đóng băng. Hữu ích để gỡ lỗi tại sao fine-tune làm giảm hiệu năng văn bản (câu trả lời: cổng mở quá rộng quá nhanh).

## Exercises

1. Tính số tham số thị giác Flamingo-9B: LLM 9B + lớp cross-attention có cổng 1.4B + resampler 64M. Tỷ phần nào trong tổng tham số được huấn luyện?

2. Triển khai residual có cổng `y = tanh(alpha) * cross + x` bằng PyTorch. Cho thấy qua thí nghiệm với `alpha=0`, `y==x` chính xác khi khởi tạo.

3. Đọc Mục 3.2 OpenFlamingo (arXiv:2308.01390) về xử lý nhiều ảnh trong batch khi mỗi prompt có số ảnh khác nhau. Mô tả chiến lược padding.

4. Tại sao cross-attention mask Flamingo cho token văn bản attend đến *chỉ ảnh gần nhất* phía trước thay vì mọi ảnh phía trước? Đọc Mục 2.4 bài báo Flamingo và giải thích đánh đổi.

5. Few-shot trong ngữ cảnh: xây prompt với 4 ví dụ "ảnh → màu đối tượng chính" cho biến thể Flamingo mới. Mô tả mẫu độ chính xác kỳ vọng khi đổi số ví dụ từ 0 đến 8.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Perceiver resampler | "Cross-attention biến tiềm ẩn cố định" | Mô-đun tạo K token cố định từ số patch đầu vào thay đổi |
| Gated cross-attention (Cross-attention có cổng) | "Cầu nối cổng tanh" | Lớp residual `y = tanh(alpha)*cross + x`, alpha có thể học, khởi tạo 0 |
| Interleaved input (Đầu vào xen kẽ) | "Chuỗi hỗn hợp" | Định dạng prompt với ảnh và văn bản trộn tự do theo thứ tự đọc |
| Frozen LLM (LLM đóng băng) | "Không gradient LLM" | Trọng số LLM văn bản không cập nhật; chỉ resampler + lớp cross-attn huấn luyện |
| Few-shot (Ít ví dụ) | "Ví dụ trong ngữ cảnh" | Đưa vài cặp (ảnh, câu trả lời) trong prompt; mô hình khái quát hóa không finetuning |
| OBELICS | "Ngữ liệu web xen kẽ" | Bộ dữ liệu mở 141M trang web có ảnh và văn bản theo thứ tự đọc |
| Chinchilla | "Cơ sở 70B đóng băng" | LLM văn bản đóng băng của Flamingo, từ bài báo Chinchilla DeepMind |
| Gate schedule (Lịch cổng) | "Cách alpha di chuyển" | Tốc độ cổng cross-attention mở trong huấn luyện |
| Cross-attn frequency (Tần suất cross-attn) | "Mỗi M lớp" | Tần suất chèn khối cross-attention có cổng; Flamingo dùng M=4 |
| OpenFlamingo | "Tái tạo mở" | Checkpoint mở MosaicML/LAION ở 3-9B; kiến trúc giống hệt Flamingo |

## Further Reading

- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) — bài báo gốc.
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) — tái tạo mở.
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) — ngữ liệu web xen kẽ.
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) — kiến trúc Perceiver tổng quát.
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) — hậu duệ Flamingo được instruction-tuned.
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) — đơn giản hóa hiện đại cách tiếp cận Flamingo.
