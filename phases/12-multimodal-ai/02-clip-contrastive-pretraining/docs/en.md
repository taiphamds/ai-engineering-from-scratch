# CLIP and Contrastive Vision-Language Pretraining

> CLIP của OpenAI (2021) chứng minh một ý tưởng đủ lớn để cung cấp sức mạnh cho năm năm tiếp theo: căn chỉnh encoder ảnh và encoder văn bản trong cùng không gian vector chỉ bằng cặp ảnh-chú thích web nhiễu và loss tương phản. Không nhãn có giám sát. 400M cặp. Không gian embedding tạo ra thực hiện phân loại zero-shot, truy xuất ảnh-văn bản và cắm vào mọi VLM năm 2026 làm tháp thị giác. SigLIP 2 (2025) thay softmax bằng sigmoid và mở rộng vượt CLIP với chi phí thấp hơn. Bài học này đi qua toán từ InfoNCE đến loss sigmoid từng cặp và xây bước huấn luyện bằng stdlib Python.

**Type:** Build
**Languages:** Python (stdlib, InfoNCE + sigmoid loss implementations)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 7 (Transformers)
**Time:** ~180 minutes

## Learning Objectives

- Suy ra loss InfoNCE từ thông tin tương hỗ và triển khai phiên bản vector hóa ổn định số học.
- Giải thích tại sao loss sigmoid từng cặp (SigLIP) mở rộng đến batch 32768+ mà không chi phí all-gather softmax đòi hỏi.
- Chạy phân loại ImageNet zero-shot bằng xây khuôn mẫu văn bản (`a photo of a {class}`) và lấy argmax trên cosine similarity.
- Nêu tên bốn đòn bẩy tiền huấn luyện CLIP / SigLIP cho bạn: batch size, temperature, khuôn mẫu prompt, chất lượng dữ liệu.

## The Problem

Thị giác trước CLIP là có giám sát. Thu bộ dữ liệu gán nhãn (ImageNet: 1.2M ảnh, 1000 lớp), huấn luyện CNN, phát hành. Nhãn đắt, nhãn thiên lệch theo điều người gán nhãn đồng ý được và nhãn không chuyển giao sang tác vụ mới mà không finetuning.

Web ảnh-chú thích có hơn một tỷ cặp gán nhãn lỏng miễn phí. Hình chó golden retriever với văn bản thay thế "chó Max của tôi trong công viên" mang tín hiệu giám sát — văn bản mô tả ảnh. Câu hỏi: có thể biến thành huấn luyện hữu ích không?

Câu trả lời CLIP: xem cặp ảnh-chú thích là tác vụ khớp. Với batch N ảnh và N chú thích, học khớp mỗi ảnh với chú thích riêng trước N-1 mồi nhiễu. Giám sát là "hai thứ này thuộc về nhau; N-1 thứ này thì không." Không nhãn lớp. Không chú giải con người. Chỉ loss tương phản.

Không gian embedding tạo ra làm nhiều hơn điều CLIP được huấn luyện. ImageNet zero-shot hoạt động vì "ảnh một con mèo" được nhúng gần ảnh mèo chưa bao giờ được gán nhãn mèo rõ ràng. Đây là đặt cược sinh ra mọi VLM năm 2026.

## The Concept

### The dual encoder

CLIP có hai tháp:

- Encoder ảnh `f`: ViT hoặc ResNet, xuất vector D chiều mỗi ảnh.
- Encoder văn bản `g`: transformer nhỏ, xuất vector D chiều mỗi chú thích.

Cả hai tháp chuẩn hóa đầu ra về độ dài đơn vị. Độ tương đồng là `cos(f(x), g(y)) = f(x)^T g(y)` vì cả hai có chuẩn đơn vị.

Với batch $N$ cặp (ảnh, chú thích), xây ma trận tương đồng `S` hình dạng `(N, N)`:

```math
S[i, j] = \cos(f(x_i), g(y_j)) / \tau
```

trong đó `tau` là temperature được học (CLIP khởi tạo 0.07; học trong không gian log).

### InfoNCE loss

CLIP dùng cross-entropy đối xứng trên hàng và cột:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

Đây là InfoNCE. Softmax trong CE buộc mỗi ảnh khớp chú thích của nó hơn mọi chú thích khác trong batch. Các "âm" là mọi mục khác của batch. Batch lớn hơn = nhiều âm hơn = tín hiệu mạnh hơn. CLIP huấn luyện ở batch 32k; quy mô quan trọng.

### Temperature

`tau` kiểm soát độ sắc nhọn của softmax. $\tau$ thấp → phân phối sắc nhọn, hiệu ứng khai thác mẫu âm khó. $\tau$ cao → mềm, mọi mẫu đều đóng góp. CLIP học $\log(1/\tau)$, được clip để ngăn sụp đổ. SigLIP 2 cố định $\tau$ ban đầu và sử dụng một bias được học thay thế.

### Why sigmoid scales better (SigLIP)

Softmax cần toàn ma trận tương đồng đồng bộ. Trong huấn luyện phân tán phải all-gather mọi embedding đến mọi replica, rồi làm softmax. Giao tiếp này bậc hai theo world size.

SigLIP thay softmax bằng sigmoid từng phần tử: với mỗi cặp `(i, j)`, loss là phân loại nhị phân "đây có phải cặp khớp?" nhãn lớp dương ở đường chéo, mọi thứ khác âm. Loss là:

```math
L = -\frac{1}{N} \sum_{(i, j)} \Big[ y_{ij} \log \mathop{\mathrm{sigmoid}}(S[i,j]) + (1-y_{ij}) \log \mathop{\mathrm{sigmoid}}(-S[i,j]) \Big]
```

`y_ij = 1` nếu `i == j`, nếu không 0. Loss mỗi cặp độc lập. Không cần all-gather. Mỗi GPU tính khối cục bộ và cộng. SigLIP 2 mở rộng rẻ đến batch 32k-512k nơi CLIP cần giao tiếp nhiều hơn tương ứng.

### Zero-shot classification

Với N tên lớp, cho mỗi lớp xây khuôn mẫu văn bản:

```
"a photo of a {class}"
```

Nhúng mỗi khuôn mẫu bằng encoder văn bản. Nhúng ảnh bằng encoder ảnh. Argmax cosine similarity = lớp dự đoán. Không huấn luyện trên lớp đích.

Khuôn mẫu prompt quan trọng. Bài báo CLIP gốc dùng 80 khuôn mẫu mỗi lớp (đơn giản, nghệ thuật, ảnh, tranh, v.v.) và lấy trung bình embedding. +3 điểm ImageNet. Cách dùng hiện đại thường chọn một hoặc hai khuôn mẫu.

### Linear probes and finetuning

Zero-shot là baseline. Linear probe (huấn luyện một lớp tuyến tính trên đặc trưng CLIP đóng băng cho lớp đích) thắng zero-shot trên tác vụ trong miền. Finetuning toàn phần thắng linear probe trong miền nhưng có thể hại chuyển giao zero-shot. Ba chế độ với ba đánh đổi.

### SigLIP 2: NaFlex and dense features

SigLIP 2 (2025) thêm:
- NaFlex: một mô hình xử lý tỷ lệ khung hình và độ phân giải thay đổi.
- Đặc trưng dày đặc tốt hơn cho phân đoạn và ước lượng độ sâu, nhắm dùng làm backbone đóng băng trong VLM.
- Đa ngôn ngữ: huấn luyện trên 100+ ngôn ngữ trong khi CLIP chỉ tiếng Anh.
- Quy mô 1B tham số nơi CLIP đạt đỉnh 400M.

Trong VLM mở năm 2026, SigLIP 2 SO400m/14 là tháp thị giác mặc định. CLIP vẫn mặc định cho truy xuất ảnh-văn bản thuần nơi phân phối huấn luyện LAION-2B cụ thể khớp mẫu truy vấn của bạn.

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN (Google, 2021): cùng ý tưởng CLIP, quy mô 1.8B cặp, 90% nhiễu. Chứng minh dữ liệu nhiễu mở rộng được. OpenCLIP (LAION): tái tạo mở CLIP trên LAION-400M / 2B, nhiều quy mô, checkpoint mở được ưu tiên. EVA-CLIP: khởi tạo từ mô hình hóa ảnh che; backbone mạnh cho VLM. BASIC: lai CLIP+ALIGN của Google. Cùng họ, khác dữ liệu và tinh chỉnh.

### The zero-shot ceiling

Mô hình loại CLIP đạt trần khoảng 76% ImageNet zero-shot (CLIP-G, OpenCLIP-G). Vượt cần dữ liệu lớn hơn nhiều (SigLIP 2 đạt 80%+) hoặc đổi kiến trúc (head có giám sát, nhiều tham số hơn). Benchmark đang bão hòa; giá trị thực là không gian embedding VLM downstream tiêu thụ.

```figure
multimodal-fusion
```

## Use It

`code/main.py` triển khai:

1. Encoder đôi minh họa (đặc trưng ảnh theo hash, đặc trưng ký tự văn bản) để thấy hình dạng InfoNCE không cần numpy.
2. Loss InfoNCE bằng Python thuần (ổn định số qua log-sum-exp).
3. Loss sigmoid từng cặp để so sánh.
4. Quy trình phân loại zero-shot: tính cosine similarity so với tập prompt văn bản, argmax để dự đoán.

Chạy và xem đường cong loss. Số tuyệt đối là minh họa; hình dạng khớp thứ trainer CLIP thực phát.

## Ship It

Bài học này tạo `outputs/skill-clip-zero-shot.md`. Với tập ảnh (qua đường dẫn) và danh sách lớp đích, nó xây prompt văn bản bằng khuôn mẫu CLIP, nhúng hai phía bằng checkpoint nêu rõ (ví dụ `openai/clip-vit-large-patch14`) và trả dự đoán top-1 / top-5 kèm điểm tương đồng. Skill từ chối khẳng định về lớp không trong danh sách prompt.

## Exercises

1. Triển khai InfoNCE cho batch 4 cặp bằng tay. Xây ma trận tương đồng 4x4, chạy softmax, lấy đường chéo, tính cross-entropy. Xác minh triển khai Python so với phép tính tay này.

2. SigLIP dùng tham số bias `b` ngoài temperature: `S'[i,j] = S[i,j]/tau + b`. `b` đóng vai trò gì khi batch mất cân bằng lớp lớn (nhiều âm hơn dương mỗi hàng)? Đọc Mục 3 SigLIP (arXiv:2303.15343).

3. Xây bộ phân loại zero-shot mèo so với chó. Thử hai khuôn mẫu prompt: `a photo of a {class}` và `a picture of a {class}`. Đo độ chính xác trên 100 ảnh kiểm thử. Tổ hợp khuôn mẫu có thắng một khuôn mẫu không?

4. Tính chi phí giao tiếp softmax InfoNCE so với sigmoid từng cặp cho lượt chạy 512 GPU ở batch 32k. Loại nào tăng $O(N)$, loại nào $O(N^2)$? Trích Mục 4 SigLIP.

5. Đọc bài báo quy luật mở rộng OpenCLIP (arXiv:2212.07143, Cherti và cộng sự). Tái hiện kết luận mở rộng dữ liệu từ hình: ở kích thước mô hình cố định, quan hệ log-tuyến tính giữa độ chính xác ImageNet zero-shot và kích thước dữ liệu huấn luyện là gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| InfoNCE | "Loss tương phản" | Cross-entropy trên ma trận tương đồng batch; dương của mỗi mục là mục ghép cặp, âm là mọi thứ khác |
| Sigmoid loss (Loss sigmoid) | "Loss SigLIP" | Binary cross-entropy mỗi cặp; không softmax, không all-gather, mở rộng rẻ trong huấn luyện phân tán |
| Temperature | "tau" | Vô hướng co giãn logit trước softmax/sigmoid; kiểm soát độ sắc phân phối |
| Zero-shot (Không ví dụ) | "phân loại không finetune" | Dùng prompt văn bản xây embedding lớp và phân loại theo cosine similarity; không huấn luyện trên lớp đích |
| Prompt template (Khuôn mẫu prompt) | "ảnh chụp một ..." | Khung văn bản quanh tên lớp; ảnh hưởng độ chính xác zero-shot 1-5 điểm |
| Dual encoder (Encoder đôi) | "Hai tháp" | Một encoder ảnh + một encoder văn bản, đầu ra trong không gian D chiều dùng chung |
| Hard negative (Âm khó) | "Mồi nhiễu khó" | Âm đủ tương tự dương để mô hình phải nỗ lực tách chúng |
| Linear probe (Thăm dò tuyến tính) | "Đóng băng + một lớp" | Chỉ huấn luyện bộ phân loại tuyến tính trên đặc trưng đóng băng; đo chất lượng đặc trưng |
| NaFlex | "Độ phân giải linh hoạt nguyên bản" | Năng lực SigLIP 2 nhận ảnh mọi tỷ lệ khung hình và độ phân giải không đổi kích thước |
| Temperature scaling (Co giãn temperature) | "tau tham số hóa log" | CLIP tham số hóa `log(1/tau)` để gradient hoạt động đúng; cắt ngưỡng ngăn sụp về tau gần không |

## Further Reading

- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) — bài báo CLIP.
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) — SigLIP.
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) — đa ngôn ngữ + NaFlex.
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) — mở rộng bằng dữ liệu web nhiễu.
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) — quy luật mở rộng OpenCLIP.
