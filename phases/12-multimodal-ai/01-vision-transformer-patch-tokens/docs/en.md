# Vision Transformers and the Patch-Token Primitive

> Trước mọi thứ đa phương thức, một ảnh phải trở thành chuỗi token mà transformer có thể ăn. Bài báo ViT năm 2020 trả lời bằng patch 16x16 pixel, một phép chiếu tuyến tính và một embedding vị trí. Năm năm sau, mọi mô hình tiên tiến nhất năm 2026 (Claude Opus 4.7 ở 2576px nguyên bản, Gemini 3.1 Pro, Qwen3.5-Omni) vẫn bắt đầu như vậy — encoder đổi từ ViT sang DINOv2 rồi SigLIP 2, token thanh ghi được thêm vào, cơ chế vị trí thành 2D-RoPE, nhưng thành phần cơ bản vẫn giữ. Bài học này đọc pipeline patch-token từ đầu đến cuối và xây bằng stdlib Python để phần còn lại của Giai đoạn 12 có mô hình tư duy cụ thể về "token thị giác."

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 minutes

## Learning Objectives

- Chuyển ảnh HxWx3 thành chuỗi token patch với mã hóa vị trí đúng.
- Tính độ dài chuỗi, số tham số và FLOPs cho ViT có (kích thước patch, độ phân giải, chiều ẩn, độ sâu) cho trước.
- Nêu tên ba nâng cấp đưa ViT từ nghiên cứu năm 2020 đến sản xuất năm 2026: tiền huấn luyện tự giám sát (DINO / MAE), token thanh ghi và đóng gói độ phân giải nguyên bản.
- Chọn giữa pooling CLS, pooling trung bình và token thanh ghi cho tác vụ downstream.

## The Problem

Transformer hoạt động trên chuỗi vector. Văn bản đã là chuỗi (byte hoặc token). Ảnh là lưới pixel 2D với ba kênh màu — không phải chuỗi. Nếu làm phẳng mọi pixel, ảnh RGB 224x224 trở thành 150,528 token, và self-attention ở độ dài đó không khả thi (bậc hai theo độ dài chuỗi).

Các cách trước năm 2020 gắn bộ trích xuất đặc trưng CNN vào phía trước: ResNet tạo bản đồ đặc trưng 7x7 các vector 2048 chiều, đưa 49 token đó cho transformer. Điều này hoạt động nhưng kế thừa thiên lệch CNN (đẳng biến tịnh tiến, trường tiếp nhận cục bộ) và mất sự ham thích quy mô của transformer.

Dosovitskiy và cộng sự (2020) hỏi thẳng: nếu bỏ CNN thì sao? Chia ảnh thành patch kích thước cố định (chẳng hạn 16x16 pixel), chiếu tuyến tính mỗi patch thành vector, thêm embedding vị trí và đưa chuỗi vào transformer nguyên bản. Lúc đó đây là dị giáo — thị giác không tích chập. Với đủ dữ liệu (JFT-300M, rồi LAION), nó vượt ResNet trên ImageNet và tiếp tục cải thiện.

Đến năm 2026, thành phần cơ bản ViT là nền tảng không bị nghi ngờ. Tháp thị giác của mọi VLM trọng số mở là một hậu duệ nào đó (DINOv2, SigLIP 2, CLIP, EVA, InternViT). Câu hỏi không còn là "có nên dùng patch?" mà là "kích thước patch nào, lịch độ phân giải nào, mục tiêu tiền huấn luyện nào, mã hóa vị trí nào."

## The Concept

### Patches as tokens

Với ảnh `x` hình dạng `(H, W, 3)` và kích thước patch `P`, bạn chia ảnh thành lưới `(H/P) x (W/P)` patch không chồng lấp. Mỗi patch là khối pixel `P x P x 3`. Làm phẳng mỗi khối thành vector `3 P^2`. Áp dụng phép chiếu tuyến tính dùng chung `W_E` hình dạng `(3 P^2, D)` để ánh xạ mỗi patch vào chiều ẩn `D` của mô hình.

Với cấu hình chuẩn ViT-B/16:
- Độ phân giải 224, kích thước patch 16 → lưới 14x14 → 196 token patch.
- Mỗi patch có `16 x 16 x 3 = 768` giá trị pixel, được chiếu đến `D = 768`.
- Thêm token `[CLS]` có thể học → độ dài chuỗi 197.

Phép chiếu patch giống hệt về toán học với tích chập 2D có kích thước kernel `P`, stride `P` và `D` kênh đầu ra. Đó là cách mã sản xuất thực sự triển khai — `nn.Conv2d(3, D, kernel_size=P, stride=P)`. Cách nhìn "phép chiếu tuyến tính" mang tính khái niệm; cách nhìn kernel hiệu quả.

### Positional embeddings

Patch không có thứ tự vốn có — transformer thấy chúng như một túi. ViT ban đầu thêm embedding vị trí 1D có thể học (một vector 768 chiều mỗi vị trí, 197 vector). Hoạt động, nhưng buộc mô hình vào độ phân giải huấn luyện: khi suy luận bạn phải nội suy bảng vị trí nếu đổi lưới.

Backbone thị giác hiện đại dùng 2D-RoPE (M-RoPE của Qwen2-VL, mặc định SigLIP 2) hoặc vị trí 2D phân tách. 2D-RoPE quay vector query và key theo chỉ số (hàng, cột) của patch, để mô hình suy ra vị trí 2D tương đối từ góc quay. Không bảng vị trí. Mô hình xử lý kích thước lưới tùy ý khi suy luận.

### CLS token, pooled output, and register tokens

Biểu diễn cấp ảnh là gì? Ba lựa chọn cùng tồn tại:

1. Token `[CLS]`. Thêm vector có thể học vào đầu chuỗi patch. Sau mọi khối transformer, trạng thái ẩn của token CLS là biểu diễn ảnh. Kế thừa từ BERT. Được ViT gốc, CLIP dùng.
2. Pooling trung bình. Lấy trung bình trạng thái ẩn đầu ra của token patch. Được SigLIP, DINOv2, hầu hết VLM hiện đại dùng.
3. Token thanh ghi. Darcet và cộng sự (2023) quan sát ViT huấn luyện không có sink token rõ ràng phát triển patch "artifact" có chuẩn cao chiếm đoạt self-attention. Thêm 4–16 token thanh ghi có thể học hấp thụ tải này và cải thiện chất lượng dự đoán dày đặc (phân đoạn, độ sâu). DINOv2 và SigLIP 2 đều cung cấp thanh ghi.

Lựa chọn quan trọng cho tác vụ downstream. CLS phù hợp để phân loại. Với VLM đưa token patch vào LLM, bạn bỏ hoàn toàn pooling — mỗi patch thành token đầu vào LLM. Thanh ghi bị bỏ trước bàn giao (chúng là giàn giáo, không phải nội dung).

### Pretraining: supervised, contrastive, masked, self-distilled

ViT năm 2020 được tiền huấn luyện bằng phân loại có giám sát trên JFT-300M. Nhanh chóng bị thay bởi:

- CLIP (2021): tương phản ảnh-văn bản trên 400M cặp. Bài 12.02.
- MAE (2021, He và cộng sự): che 75% patch, tái dựng pixel. Tự giám sát, hoạt động trên ảnh thuần.
- DINO (2021) / DINOv2 (2023): tự chưng cất với học sinh-giáo viên, không nhãn, không chú thích. DINOv2 ViT-g/14 năm 2023 là backbone thuần thị giác mạnh nhất và mặc định cho trường hợp sử dụng "đặc trưng dày đặc."
- SigLIP / SigLIP 2 (2023, 2025): CLIP với loss sigmoid và NaFlex cho tỷ lệ khung hình nguyên bản. Tháp thị giác thống trị trong VLM mở năm 2026 (Qwen, Idefics2, LLaVA-OneVision).

Lựa chọn tiền huấn luyện quyết định backbone giỏi việc gì: CLIP/SigLIP cho khớp ngữ nghĩa với văn bản, DINOv2 cho đặc trưng thị giác dày đặc, MAE làm điểm khởi đầu cho finetuning downstream.

### Scaling laws

Mở rộng ViT (Zhai và cộng sự 2022) xác lập chất lượng ViT tuân các quy luật có thể dự đoán theo kích thước mô hình, kích thước dữ liệu và tính toán. Ở tính toán cố định:
- Mô hình lớn hơn + nhiều dữ liệu hơn → chất lượng tốt hơn.
- Kích thước patch là đòn bẩy giữa độ dài chuỗi và độ trung thực. Patch 14 (điển hình cho DINOv2/SigLIP SO400m) cho nhiều token mỗi ảnh hơn patch 16; tốt hơn cho OCR và tác vụ dày đặc, kém hơn về tốc độ.
- Độ phân giải là đòn bẩy lớn còn lại. Từ 224 lên 384 rồi 512 gần như luôn hữu ích, với chi phí FLOPs bậc hai.

ViT-g/14 (1B tham số, patch 14, độ phân giải 224 → 256 token) và SigLIP SO400m/14 (400M tham số, patch 14) là hai encoder chủ lực cho VLM mở năm 2026.

### Parameter count for a ViT

Phép tính đầy đủ nằm trong `code/main.py`. Với ViT-B/16 ở 224:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Ước lượng sơ bộ mọi ViT như vậy trước khi nạp checkpoint. Kích thước backbone đặt sàn VRAM trong mọi VLM downstream.

### 2026 production config

Encoder hầu hết VLM mở cung cấp năm 2026 là SigLIP 2 SO400m/14 ở độ phân giải nguyên bản (NaFlex). Nó có:
- 400M tham số.
- Kích thước patch 14, độ phân giải mặc định 384 → 729 token patch mỗi ảnh.
- Pooling trung bình cho tác vụ cấp ảnh; cả 729 patch chảy vào LLM cho VQA.
- 4 token thanh ghi, bỏ trước bàn giao LLM.
- 2D-RoPE với co giãn cấp ảnh cho tỷ lệ khung hình nguyên bản.

Mọi quyết định trong cấu hình đó truy về một bài báo bạn có thể đọc.

```figure
image-patch-tokens
```

## Use It

`code/main.py` là bộ token hóa patch và bộ tính hình học. Nó nhận (H, W ảnh, P patch, D ẩn, L độ sâu) và báo:

- Hình dạng lưới và độ dài chuỗi sau chia patch.
- Chuỗi token cho ảnh minh họa tổng hợp 8x8 pixel (đi qua đường làm phẳng + chiếu).
- Số tham số chia theo embedding patch, embedding vị trí, khối transformer và head.
- FLOPs mỗi forward pass ở độ phân giải đích.
- Bảng so sánh giữa ViT-B/16 @ 224, ViT-L/14 @ 336, DINOv2 ViT-g/14 @ 224, SigLIP SO400m/14 @ 384.

Chạy nó. Khớp số tham số với số đã công bố. Thử kích thước patch và độ phân giải để cảm nhận chi phí số token.

## Ship It

Bài học này tạo `outputs/skill-patch-geometry-reader.md`. Với cấu hình ViT (kích thước patch, độ phân giải, chiều ẩn, độ sâu), nó tạo ước lượng số token, số tham số và VRAM kèm lý giải. Dùng skill này mỗi khi chọn backbone thị giác cho VLM — nó ngăn bất ngờ "token bùng nổ và ngữ cảnh LLM của tôi đầy."

## Exercises

1. Tính độ dài chuỗi token patch cho Qwen2.5-VL với đầu vào nguyên bản 1280x720 và kích thước patch 14. So với biểu diễn chỉ CLS thế nào?

2. Khung 1080p (1920x1080) ở patch 14 tạo bao nhiêu token? Ở 30 FPS trong video 5 phút, tổng bao nhiêu token thị giác? Chi phí nào tiết kiệm nhiều nhất: pooling, lấy mẫu khung hay gộp token?

3. Triển khai pooling trung bình trên token patch bằng Python thuần. Xác minh pooling trung bình trên 196 token đầu ra DINOv2 khớp những gì `forward` của mô hình trả khi bạn yêu cầu embedding được pooling.

4. Đọc Mục 3 của "Vision Transformers Need Registers" (arXiv:2309.16588). Mô tả trong hai câu artifact mà thanh ghi hấp thụ và tại sao quan trọng với dự đoán dày đặc downstream.

5. Sửa `code/main.py` để hỗ trợ patch-n'-pack: với danh sách ảnh khác độ phân giải, tạo chuỗi đóng gói duy nhất và attention mask chéo khối. Xác minh với Bài 12.06 khi đến bài đó.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Patch (Mảnh ảnh) | "Hình vuông 16x16 pixel" | Vùng không chồng lấp kích thước cố định của ảnh đầu vào; trở thành một token |
| Patch embedding (Embedding patch) | "Phép chiếu tuyến tính" | Ma trận được học dùng chung (hoặc Conv2d với stride=P) ánh xạ pixel patch đã làm phẳng sang vector D chiều |
| CLS token (Token CLS) | "Token lớp" | Vector có thể học thêm đầu chuỗi, trạng thái ẩn cuối biểu diễn toàn ảnh; tùy chọn năm 2026 |
| Register token (Token thanh ghi) | "Sink token" | Token có thể học bổ sung hấp thụ artifact attention chuẩn cao mà ViT phát triển trong tiền huấn luyện |
| Position embedding (Embedding vị trí) | "Thông tin vị trí" | Vector hoặc phép quay theo vị trí giúp nhận biết thứ tự chuỗi; 2D-RoPE là mặc định hiện đại |
| Grid (Lưới) | "Lưới patch" | Mảng patch 2D (H/P) x (W/P) cho độ phân giải và kích thước patch cho trước |
| NaFlex | "Độ phân giải linh hoạt nguyên bản" | Tính năng SigLIP 2: một mô hình phục vụ nhiều tỷ lệ khung hình và độ phân giải không huấn luyện lại |
| Backbone (Mạng xương sống) | "Tháp thị giác" | Encoder ảnh đã tiền huấn luyện có đầu ra token patch cung cấp cho LLM trong VLM |
| Pooling (Gộp) | "Tóm tắt cấp ảnh" | Chiến lược biến token patch thành một vector: CLS, trung bình, attention pool hoặc dựa trên thanh ghi |
| Patch 14 vs 16 (Patch 14 so với 16) | "Lưới mịn hơn so với thô hơn" | Patch 14 tạo nhiều token mỗi ảnh hơn, độ trung thực OCR tốt hơn, chậm hơn; patch 16 là mặc định cổ điển |

## Further Reading

- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) — ViT gốc.
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) — MAE, tiền huấn luyện tự giám sát.
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) — tự chưng cất ở quy mô lớn, không nhãn.
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) — token thanh ghi và phân tích artifact.
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) — tháp thị giác mặc định năm 2026.
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) — quy luật mở rộng thực nghiệm.
