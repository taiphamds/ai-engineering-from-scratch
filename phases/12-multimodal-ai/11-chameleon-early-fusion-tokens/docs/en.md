# Chameleon and Early-Fusion Token-Only Multimodal Models

> Mọi VLM đã thấy đến nay giữ ảnh và văn bản riêng. Token thị giác đến từ encoder thị giác, chảy vào projector, rồi gặp văn bản trong LLM. Từ vựng thị giác và văn bản không bao giờ chồng lấp. Chameleon (Meta, tháng 5 năm 2024) hỏi: nếu có thì sao? Huấn luyện VQ-VAE biến ảnh thành chuỗi token rời rạc từ từ vựng dùng chung. Mọi tài liệu đa phương thức giờ là một chuỗi — token văn bản và token ảnh xen kẽ, một loss tự hồi quy duy nhất. Tác dụng phụ: mô hình sinh được đầu ra hỗn hợp phương thức — luân phiên token văn bản và ảnh trong một lệnh gọi suy luận. Bài học này đọc luận điểm hợp nhất sớm và xây phiên bản minh họa từ đầu đến cuối.

**Type:** Build
**Languages:** Python (stdlib, VQ-VAE tokenizer + interleaved decoder)
**Prerequisites:** Phase 12 · 05, Phase 8 (Generative AI)
**Time:** ~180 minutes

## Learning Objectives

- Giải thích tại sao từ vựng dùng chung + một loss thay đổi điều mô hình làm được.
- Mô tả cách VQ-VAE token hóa ảnh thành chuỗi rời rạc tương thích mục tiêu token tiếp theo của transformer.
- Nêu tên thủ thuật ổn định huấn luyện Chameleon: QK-Norm, vị trí dropout, thứ tự LayerNorm.
- So Chameleon với cách Q-Former BLIP-2 và mô tả khi nào mỗi loại là lựa chọn đúng.

## The Problem

VLM dựa trên adapter (LLaVA, BLIP-2, Qwen-VL) xem văn bản và ảnh là hai thứ khác nhau. Token văn bản đi qua `embed(text_token)`; ảnh qua `visual_encoder(image) → projector → ... pseudo_tokens`. Mô hình có hai đường đầu vào hợp lại giữa chừng.

Ba hệ quả:

1. LLM chỉ tiêu thụ ảnh, không phát ảnh. Đầu ra chỉ văn bản.
2. Tài liệu hỗn hợp phương thức (đoạn văn và ảnh luân phiên, như bài viết) khó xử lý — hoặc phân tích đầu vào đa phương thức ngoài mô hình hoặc nối các lần sinh.
3. Không khớp phân phối. Token thị giác và văn bản nằm trong vùng khác của không gian ẩn, tạo vấn đề căn chỉnh tinh tế.

Chameleon bác tiền đề: ảnh chỉ là chuỗi token rời rạc từ từ vựng dùng chung. Huấn luyện mô hình trên tài liệu xen kẽ, một loss, một decoder tự hồi quy và mở khóa sinh hỗn hợp phương thức miễn phí.

## The Concept

### VQ-VAE as image tokenizer

Tokenizer là autoencoder biến phân lượng tử hóa vector. Kiến trúc:

- Encoder: CNN + ViT ánh xạ ảnh sang bản đồ đặc trưng không gian, chẳng hạn đặc trưng 32x32 chiều 256.
- Codebook: từ vựng được học gồm K vector (Chameleon dùng 8192), cũng chiều 256.
- Lượng tử hóa: với mỗi đặc trưng không gian, tra mục codebook gần nhất theo khoảng cách L2. Thay đặc trưng liên tục bằng chỉ số nguyên.
- Decoder: CNN đưa đặc trưng lượng tử hóa về pixel.

Huấn luyện: loss tái dựng VAE + loss cam kết + loss codebook. Chỉ số codebook tạo bảng chữ cái rời rạc cho ảnh.

Đối với Chameleon: một hình ảnh trở thành 32*32 = 1024 token được lấy từ một từ vựng 8192. Đặt các ID hình ảnh đó trong cùng không gian ID với các token BPE văn bản. Tokenizer duy nhất của Chameleon có 65,536 phần tử, và số lượng đó đã bao gồm 8192 mã hình ảnh và các token đặc biệt như các dấu phân cách hình ảnh. Transformer nhìn thấy một chuỗi, một loss.

### The shared vocabulary

Từ vựng Chameleon kết hợp token văn bản, token ảnh và dấu phân cách phương thức. Mỗi token có một ID. Lớp embedding đầu vào ánh xạ mọi ID sang vector ẩn D chiều. Phép chiếu đầu ra ánh xạ ẩn về logit từ vựng. Softmax chọn token tiếp, bất kể phương thức.

Dấu phân cách quan trọng: thẻ `<image>` và `</image>` bao chuỗi token ảnh. Khi sinh, nếu mô hình phát `<image>`, phần mềm downstream biết 1024 token tiếp là chỉ số VQ gửi decoder để kết xuất pixel.

### Mixed-modality generation

Suy luận là dự đoán token tiếp trong từ vựng dùng chung. Prompt ví dụ: "Vẽ mèo và mô tả nó." Chameleon phát:

```
<image> 4821 1029 2891 ... (1024 image tokens) </image>
The cat is orange, sitting on a windowsill...
```

Mô hình tự chọn thứ tự — có thể tạo ảnh rồi văn bản, văn bản rồi ảnh hoặc xen kẽ. Cùng decoder, cùng loss.

So với VLM adapter nơi sinh chỉ văn bản. Chameleon mở lại câu hỏi phương thức đầu ra mô hình.

### Training stability — QK-Norm, dropout, LayerNorm ordering

Huấn luyện hợp nhất sớm bất ổn ở quy mô lớn. Bài báo Chameleon ghi ba thủ thuật:

- QK-Norm. Áp dụng LayerNorm cho phép chiếu query và key trong attention, trước tích vô hướng. Ngăn độ lớn logit bùng nổ ở độ sâu. Nhiều mô hình lớn sau năm 2024 dùng.
- Vị trí dropout. Dropout sau mọi phép cộng residual, không chỉ sau attention và MLP. Cần chính quy hóa hơn khi gradient token ảnh có thể chi phối.
- Thứ tự LayerNorm. Pre-LN trên nhánh residual (tiêu chuẩn), cộng LN thêm trên kết nối skip khối cuối. Ổn định luồng gradient lớp cuối.

Không các thủ thuật này, huấn luyện Chameleon 34B tham số phân kỳ ở nhiều checkpoint. Có chúng, hội tụ. Công thức huấn luyện đóng góp ngang kiến trúc.

### The tokenizer's reconstruction ceiling

VQ-VAE mất thông tin. Với 8192 mục codebook và 1024 token mỗi ảnh 512x512, PSNR tái dựng đạt trần khoảng 26-28 dB. Đủ cho sinh ảnh nhận biết được nhưng thấy rõ kém hơn diffusion không gian liên tục (Stable Diffusion 3 đạt 32+ dB).

Tokenizer là nút thắt. Tokenizer tốt hơn (MAGVIT-v2, IBQ, SBER-MoVQGAN) nâng trần. Emu3 (Bài 12.12) đạt sinh chất lượng SDXL chỉ nhờ tokenizer tốt hơn.

### Chameleon vs BLIP-2 / LLaVA

Chameleon (hợp nhất sớm, từ vựng chung):
- Một loss, một decoder.
- Sinh đầu ra hỗn hợp phương thức.
- Tokenizer là trần chất lượng.
- Đắt: decoder VQ-VAE mỗi ảnh sinh trên đường suy luận.

BLIP-2 / LLaVA (hợp nhất muộn, tháp riêng):
- Thị giác vào, chỉ văn bản ra.
- Tái sử dụng LLM đã tiền huấn luyện.
- Không nút thắt tokenizer cho hiểu.
- Rẻ: một forward pass.

Chọn theo tác vụ. Nếu cần sinh ảnh, họ Chameleon. Nếu chỉ cần hiểu, VLM adapter đơn giản hơn và tái sử dụng nhiều tính toán tiền huấn luyện hơn.

### Fuyu and AnyGPT

Fuyu (Adept, 2023) là cách liên quan: bỏ hoàn toàn encoder thị giác riêng, đưa patch ảnh thô qua phép chiếu đầu vào LLM như token, không tokenizer. Đơn giản hơn Chameleon, mất sinh đầu ra từ vựng dùng chung.

AnyGPT (Zhan và cộng sự, 2024) mở rộng Chameleon sang bốn phương thức: văn bản, ảnh, lời nói, nhạc. Cùng thủ thuật VQ-VAE cho từng loại, transformer chung. Sinh bất kỳ sang bất kỳ. Trình bày thêm trong Bài 12.16.

```figure
vq-codebook
```

## Use It

`code/main.py` xây mô hình hợp nhất sớm minh họa từ đầu đến cuối:

- Bộ lượng tử hóa nhỏ kiểu VQ-VAE ánh xạ patch 8x8 thành chỉ số codebook (K=16).
- Từ vựng chung gồm (ID văn bản 0..31) + (ID ảnh 32..47) + (dấu phân cách 48, 49).
- Decoder tự hồi quy minh họa (bảng bigram) huấn luyện trên chú thích tổng hợp + chuỗi token ảnh.
- Vòng lặp lấy mẫu phát token văn bản + ảnh luân phiên với prompt cho trước.

Mã cố ý giữ transformer nhỏ (bigram) để theo dấu luồng tín hiệu từ đầu đến cuối.

## Ship It

Bài học này tạo `outputs/skill-tokenizer-vs-adapter-picker.md`. Với đặc tả sản phẩm (chỉ hiểu so với hiểu + sinh, chất lượng ảnh cần, ngân sách chi phí), nó chọn giữa họ Chameleon (hợp nhất sớm) và họ LLaVA (hợp nhất muộn) và lý giải bằng quy tắc kinh nghiệm định lượng.

## Exercises

1. Chameleon dùng K=8192 mục codebook và 1024 token mỗi ảnh 512x512. Ước lượng tỷ lệ nén so với ảnh RGB 24 bit. Có mất thông tin không? Mất bao nhiêu?

2. Ảnh 4K (3840x2160) ở cùng mật độ VQ-VAE tạo bao nhiêu token ảnh? Mô hình kiểu Chameleon sinh được ảnh 4K trong một lệnh gọi suy luận không? Thứ gì hỏng trước — ngữ cảnh, chất lượng tokenizer hay KV cache?

3. Triển khai QK-Norm bằng Python thuần. Với query và key 64 chiều, cho tích vô hướng trước và sau LayerNorm. Tại sao kiểm soát độ lớn quan trọng ở độ sâu?

4. Đọc Mục 2.3 Chameleon về ổn định huấn luyện. Mô tả chính xác dạng thất bại bài báo quan sát ở 34B không QK-Norm. Dấu hiệu "bùng nổ chuẩn" là gì?

5. Mở rộng decoder minh họa phát phản hồi hỗn hợp phương thức từ prompt chỉ văn bản. Đo tần suất chọn ảnh trước so với văn bản trước với phân phối dữ liệu huấn luyện 60% văn bản trước / 40% ảnh trước.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Early fusion (Hợp nhất sớm) | "Token thống nhất" | Ảnh chuyển thành token rời rạc chung từ vựng transformer từ bước đầu |
| VQ-VAE | "Tokenizer ảnh" | CNN + ViT + codebook ánh xạ ảnh thành chỉ số nguyên transformer dự đoán được |
| Shared vocabulary (Từ vựng dùng chung) | "Một từ điển" | Một không gian ID token bao văn bản + ảnh + dấu phân cách phương thức |
| QK-Norm | "Bộ ổn định attention" | LayerNorm áp dụng query và key trước tích vô hướng, ngăn chuẩn bùng nổ |
| Mixed-modality generation (Sinh hỗn hợp phương thức) | "Đầu ra văn bản + ảnh" | Suy luận tự tạo token văn bản và ảnh xen kẽ trong một lượt |
| Codebook size (Kích thước codebook) | "K mục" | Số vector rời rạc VQ-VAE lượng tử hóa tới; đánh đổi nén lấy độ trung thực |
| Tokenizer ceiling (Trần tokenizer) | "Giới hạn tái dựng" | PSNR tốt nhất đạt được khi giải mã token VQ; giới hạn chất lượng ảnh mô hình |

## Further Reading

- [Chameleon Team — Chameleon: Mixed-Modal Early-Fusion Foundation Models (arXiv:2405.09818)](https://arxiv.org/abs/2405.09818)
- [Aghajanyan et al. — CM3 (arXiv:2201.07520)](https://arxiv.org/abs/2201.07520)
- [Yu et al. — CM3Leon (arXiv:2309.02591)](https://arxiv.org/abs/2309.02591)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Adept — Fuyu-8B blog (adept.ai)](https://www.adept.ai/blog/fuyu-8b)
