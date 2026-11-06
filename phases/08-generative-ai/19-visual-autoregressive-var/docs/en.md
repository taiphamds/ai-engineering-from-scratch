# Visual Autoregressive Modeling (VAR): Next-Scale Prediction

> Các mô hình khuếch tán lấy mẫu lặp theo thời gian (các bước khử nhiễu). VAR lấy mẫu lặp theo thang — nó dự đoán một token 1x1, rồi 2x2, rồi 4x4, lên đến độ phân giải cuối, mỗi thang có điều kiện theo thang trước. Bài báo năm 2024 cho thấy VAR tuân theo các quy luật mở rộng kiểu GPT cho sinh ảnh và đánh bại DiT ở cùng ngân sách tính toán. Bài học này xây dựng cơ chế cốt lõi.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## The Problem

Sinh tự hồi quy chi phối mô hình hóa ngôn ngữ vì nó mở rộng quy mô có thể dự đoán: nhiều tính toán hơn, nhiều tham số hơn, perplexity thấp hơn, đầu ra tốt hơn. Sinh ảnh có hai nỗ lực AR chính trước năm 2024: PixelRNN/PixelCNN (từng pixel) và DALL-E 1 / Parti / MuseGAN (từng token trên mã VQ-VAE).

Cả hai đều chịu vấn đề thứ tự sinh. Pixel và token được sắp xếp trong một lưới 2D, nhưng mô hình AR phải đi qua chúng theo một thứ tự raster 1D. Một pixel góc được sinh sớm không biết ảnh cuối cùng trở thành gì. Chất lượng sinh mở rộng kém hơn GPT trên văn bản và chưa bao giờ đạt chất lượng mô hình khuếch tán ở tính toán tương đương.

VAR khắc phục vấn đề thứ tự sinh bằng cách thay đổi thứ đang được sinh. Thay vì dự đoán các token ảnh lần lượt trong không gian, VAR dự đoán toàn bộ ảnh ở các độ phân giải tăng dần. Bước 1: dự đoán một token 1x1 ("bản tóm tắt" tổng thể của ảnh). Bước 2: dự đoán một lưới token 2x2 (các đặc trưng thô hơn). Bước 3: dự đoán một lưới 4x4. Bước K: dự đoán lưới (H/8)x(W/8) cuối cùng.

Mỗi thang chú ý đến tất cả các thang trước (theo nhân quả trong "thứ tự thang") và song song trong chính thang của nó. Vấn đề thứ tự biến mất: toàn bộ ảnh ở thang k được tạo ra trong một lượt transformer.

## The Concept

### VQ-VAE Multi-Scale Tokenizer

VAR cần một **tokenizer rời rạc đa thang**. Với một ảnh $x$, nó tạo ra một chuỗi các lưới token có độ phân giải cao dần:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Mỗi $z_k$ dùng cùng codebook (kích thước điển hình 4096-16384). Token hóa ở mỗi thang không độc lập — nó được huấn luyện để tổng các phần dư ở mỗi thang tái dựng $f$:

```math
f \approx \mathop{\mathrm{upsample}}(\mathop{\mathrm{embed}}(z_1), \text{target\_size}) + \cdots + \mathop{\mathrm{upsample}}(\mathop{\mathrm{embed}}(z_K), \text{target\_size})
```

Đây là một biến thể **VQ phần dư**. Thang $k$ nắm bắt những gì các thang $1 \ldots k-1$ bỏ sót. Decoder nhận tổng của tất cả embedding thang và tạo ra ảnh.

Tokenizer VQ đa thang được huấn luyện một lần (như VQGAN) rồi đóng băng. Toàn bộ công việc sinh được thực hiện bởi mô hình tự hồi quy ở trên.

### Next-Scale Prediction

Mô hình sinh là một transformer thấy các token từ tất cả các thang trước và dự đoán các token ở thang tiếp theo.

Cấu trúc chuỗi đầu vào:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Embedding vị trí mã hóa cả chỉ số thang tỷ lệ và vị trí không gian trong thang đó. Attention có tính nhân quả theo thứ tự thang tỷ lệ và theo khối bên trong một thang: token ở thang $k$, vị trí $(i, j)$ có thể chú ý đến mọi token ở các thang $1 \ldots k$, bao gồm mọi vị trí của chính thang $k$. Không có thứ tự trong cùng thang và không có tính nhân quả trong cùng thang, vì vậy mọi vị trí trong một thang được dự đoán song song.

Hàm mất mát huấn luyện: ở mỗi thang $k$, dự đoán các token $z_k$ với tất cả token của các thang trước. Hàm mất mát cross-entropy trên các mã VQ rời rạc. Cùng cấu trúc như GPT ngoại trừ "chuỗi" giờ có cấu trúc theo thang.

### Generation

Khi suy luận:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

Với $K = 10$ thang, sinh là 10 lượt truyền xuôi transformer. Mỗi lượt tạo ra toàn bộ thang của nó song song — không tự hồi quy theo token trong một thang. Với một ảnh 256x256, đây là khoảng 10 lượt so với 28-50 của DiT.

### Why Next-Scale Wins Over Next-Token

Ba lợi thế cấu trúc:
1. **Từ thô đến tinh phù hợp với các thống kê ảnh tự nhiên.** Cảm nhận thị giác của con người và các tập dữ liệu ảnh đều thể hiện các quy luật phụ thuộc thang: cấu trúc tần số thấp ổn định và có thể dự đoán; chi tiết tần số cao có điều kiện theo nội dung tần số thấp. Dự đoán thang tiếp theo khai thác điều này.
2. **Sinh song song trong thang.** Khác với token AR kiểu GPT, VAR tạo ra tất cả token ở một thang trong một bước. Độ dài sinh hiệu dụng là theo thang log thay vì tuyến tính.
3. **Không thiên lệch thứ tự sinh.** Token ở thang k thấy toàn bộ thang k-1; không có thiên lệch "bên trái" hay "phía trên" buộc các token sớm phải quyết định trước khi ngữ cảnh muộn có sẵn.

### Scaling Law

Tian và cộng sự chứng minh VAR tuân theo một đường cong mở rộng dạng luật lũy thừa cho FID trên ImageNet — giống như GPT đối với perplexity. Tăng gấp đôi tham số hoặc tính toán giảm một nửa sai số một cách đáng tin cậy. Đây là mô hình sinh ảnh đầu tiên thể hiện kiểu hành vi mở rộng này rõ ràng như các mô hình ngôn ngữ. Kết quả là các dự đoán ở quy mô VAR trở nên có thể dự đoán từ tính toán, không phải phỏng đoán thực nghiệm theo kiến trúc.

### Relationship to Diffusion

VAR và khuếch tán chia sẻ cùng câu chuyện nén dữ liệu: cả hai chia bài toán sinh thành một chuỗi các bài toán con dễ hơn.

- Khuếch tán: dần thêm nhiễu, học hoàn tác một bước.
- VAR: dần thêm độ phân giải, học dự đoán thang tiếp theo.

Chúng là các trục khác nhau xuyên qua bài toán. Cả hai đều cho các phân phối có điều kiện tính toán được. Theo thực nghiệm VAR suy luận nhanh hơn (ít lượt hơn, tất cả song song trong một thang) và ngang bằng hoặc đánh bại DiT trên ImageNet có điều kiện theo lớp. VAR có điều kiện bằng văn bản (VARclip, HART) là một hướng nghiên cứu sôi nổi.

```figure
gx-var-next-scale
```

## Build It

Trong `code/main.py` bạn sẽ:
1. Xây dựng một **tokenizer VQ đa thang** nhỏ trên dữ liệu "ảnh" tổng hợp (các vòng Gaussian 2D).
2. Huấn luyện một **transformer kiểu VAR** để dự đoán các token ở thang tiếp theo.
3. Lấy mẫu bằng cách gọi transformer 4 lần (4 thang) và giải mã.
4. Xác minh huấn luyện theo thứ tự thang làm việc sinh song song trong một thang.

Đây là một triển khai đồ chơi. Điểm chính là thấy mặt nạ attention có cấu trúc theo thang và việc sinh song song trong thang thực sự hoạt động.

## Ship It

Bài học này tạo ra `outputs/skill-var-tokenizer-designer.md` — một skill để thiết kế một tokenizer đa thang: số thang, tỷ lệ thang, kích thước codebook, chia sẻ phần dư, kiến trúc decoder.

## Exercises

1. **Thử nghiệm loại bỏ về số thang.** Huấn luyện VAR với 4, 6, 8, 10 thang. Đo chất lượng tái dựng so với số lượt tự hồi quy. Nhiều thang hơn = phần dư tinh hơn = chất lượng tốt hơn nhưng nhiều lượt hơn.

2. **Kích thước codebook.** Huấn luyện các tokenizer với kích thước codebook 512, 4096, 16384. Codebook lớn hơn cho tái dựng tốt hơn nhưng dự đoán khó hơn. Tìm điểm gấp khúc.

3. **Kiểm tra song song trong thang.** Với một VAR đã huấn luyện, đo rõ mô thức attention. Trong thang k, mô hình có chú ý đến các vị trí xuyên thang nhưng không nội thang không? Xác minh triển khai mặt nạ.

4. **Mở rộng quy mô VAR so với DiT.** Với cùng tác vụ ImageNet có điều kiện theo lớp, huấn luyện VAR và DiT ở các ngân sách tham số khớp nhau (ví dụ 33M, 130M, 458M). Vẽ FID theo tính toán. VAR nên vượt lên DiT ở mỗi kích thước — tái lập kết quả bài báo ở quy mô nhỏ.

5. **Điều kiện hóa bằng văn bản.** Mở rộng VAR để nhận một embedding văn bản (CLIP pooled) làm một đầu vào điều kiện hóa bổ sung qua adaLN. Đây là công thức HART. FID cải thiện bao nhiêu trên lấy mẫu phù hợp văn bản?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| VAR | "Tự hồi quy thị giác" | Sinh ảnh bằng dự đoán thang tiếp theo trên một kim tự tháp các lưới token VQ |
| Next-scale prediction (Dự đoán thang tiếp theo) | "Dự đoán thô hơn, rồi tinh hơn" | Mô hình dự đoán các token ở các thang độ phân giải tăng dần, có điều kiện theo tất cả các thang trước |
| Multi-scale VQ tokenizer (Tokenizer VQ đa thang) | "VQ phần dư" | VQ-VAE tạo ra K lưới token có độ phân giải tăng dần, với decoder cộng tất cả các thang |
| Scale k (Thang k) | "Mức kim tự tháp k" | Một trong K mức độ phân giải, từ 1x1 ở k=1 lên đến (H/p)x(W/p) ở k=K |
| Parallel-within-scale (Song song trong thang) | "Một lượt truyền xuôi mỗi thang" | Tất cả token ở thang k được dự đoán trong một lượt transformer, không tự hồi quy |
| Causal-across-scales (Nhân quả xuyên thang) | "Attention theo thứ tự thang" | Token ở thang $k$ có thể chú ý đến toàn bộ các thang $1 \ldots k$ nhưng không đến các thang $k+1 \ldots K$ |
| Residual VQ (VQ phần dư) | "Token hóa cộng" | Các token của mỗi thang mã hóa phần dư do các thang thấp hơn để lại; decoder cộng tất cả embedding thang |
| VAR scaling law (Quy luật mở rộng VAR) | "Mở rộng GPT ảnh" | FID tuân theo một luật lũy thừa có thể dự đoán theo tính toán, như perplexity của các mô hình ngôn ngữ |
| HART | "VAR lai + văn bản" | Biến thể VAR có điều kiện bằng văn bản kết hợp giải mã lặp kiểu MaskGIT với cấu trúc thang của VAR |
| Scale position embedding (Embedding vị trí thang) | "Bộ ba (thang, hàng, cột)" | Mã hóa vị trí mang cả chỉ số thang và tọa độ không gian trong thang |

## Further Reading

- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) — bài báo VAR, tham chiếu chuẩn
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) — DiT, baseline so sánh khuếch tán
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) — VQGAN, họ tokenizer mà tokenizer đa thang của VAR mở rộng
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) — VQ-VAE, nền tảng của token hóa ảnh rời rạc
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) — VAR có điều kiện bằng văn bản
