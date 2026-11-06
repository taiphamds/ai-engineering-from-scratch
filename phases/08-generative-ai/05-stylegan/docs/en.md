# StyleGAN

> Hầu hết các bộ sinh trộn $z$ vào mọi lớp cùng lúc. StyleGAN tách nó ra: trước tiên ánh xạ $z$ sang một $w$ trung gian, rồi *đưa* $w$ vào ở mọi mức độ phân giải qua AdaIN. Một thay đổi đó đã gỡ rối không gian latent và biến khuôn mặt chân thực như ảnh chụp thành một bài toán đã được giải trong bảy năm liên tiếp.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 08 (Normalization), Phase 3 · 07 (CNNs)
**Time:** ~45 minutes

## The Problem

Một DCGAN ánh xạ $z$ sang một ảnh qua một chồng tích chập chuyển vị. Vấn đề: $z$ điều khiển mọi thứ — tư thế, ánh sáng, danh tính, nền — đan xen với nhau. Di chuyển dọc một trục của $z$, cả bốn đều thay đổi. Bạn không thể yêu cầu mô hình "cùng một người, tư thế khác" vì biểu diễn không phân tách theo cách đó.

Karras và cộng sự (2019, NVIDIA) đề xuất: ngừng đưa $z$ trực tiếp vào các lớp conv. Đưa một tensor hằng `4×4×512` làm đầu vào mạng. Học một MLP 8 lớp ánh xạ $z \in Z \to w \in W$. Đưa $w$ vào ở mọi độ phân giải qua *chuẩn hóa instance thích nghi* (AdaIN): chuẩn hóa từng bản đồ đặc trưng conv, rồi co giãn và dịch chuyển bằng các phép chiếu affine của $w$. Thêm nhiễu theo lớp cho chi tiết ngẫu nhiên (lỗ chân lông, sợi tóc).

Kết quả: $W$ có các trục gần trực giao cho "phong cách cấp cao" (tư thế, danh tính) so với "phong cách tinh" (ánh sáng, màu sắc). Bạn có thể hoán đổi phong cách giữa hai ảnh bằng cách dùng $w$ của ảnh A cho các mức độ phân giải thấp và $w$ của ảnh B cho các mức cao. Điều này mở ra chỉnh sửa, cách điệu xuyên miền và toàn bộ nhánh nghiên cứu "StyleGAN-inversion".

## The Concept

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mạng ánh xạ.** $f: Z \to W$, một MLP 8 lớp. $Z = \mathcal{N}(0, I)^{512}$. $W$ không bị buộc là Gaussian — nó học một hình dạng thích nghi với dữ liệu.

**Mạng tổng hợp.** Bắt đầu từ một hằng số được học `4×4×512`. Mỗi khối độ phân giải: `upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`. Độ phân giải tăng gấp đôi: 4, 8, 16, 32, 64, 128, 256, 512, 1024.

**AdaIN.**

```math
\mathop{\mathrm{AdaIN}}(x, y) = y_{\text{scale}} \cdot \frac{x - \mathop{\mathrm{mean}}(x)}{\mathop{\mathrm{std}}(x)} + y_{\text{bias}}
```

trong đó $y_{\text{scale}}$ và $y_{\text{bias}}$ đến từ các phép chiếu affine của $w$. Chuẩn hóa theo từng bản đồ đặc trưng, rồi tạo lại phong cách. "Phong cách" ở đây là các thống kê bậc nhất và bậc hai của bản đồ đặc trưng.

**Nhiễu theo lớp.** Nhiễu Gaussian một kênh được thêm vào mỗi bản đồ đặc trưng, được co giãn bởi một hệ số theo kênh được học. Điều khiển chi tiết ngẫu nhiên mà không ảnh hưởng cấu trúc toàn cục.

**Thủ thuật truncation.** Khi suy luận, lấy mẫu $z$, tính $w = \text{mapping}(z)$, rồi $w' = \hat{w} + \psi \cdot (w - \hat{w})$ trong đó $\hat{w}$ là trung bình $w$ trên nhiều mẫu. $\psi < 1$ đánh đổi đa dạng lấy chất lượng. Gần như mọi bản demo StyleGAN đều dùng $\psi \approx 0.7$.

## StyleGAN 1 → 2 → 3

| Phiên bản | Năm | Đổi mới |
|---------|------|------------|
| StyleGAN | 2019 | Mạng ánh xạ + AdaIN + nhiễu + phát triển lũy tiến. |
| StyleGAN2 | 2020 | Giải điều biến trọng số thay AdaIN (khắc phục lỗi giả giọt nước); kiến trúc skip/residual; regularization độ dài đường đi. |
| StyleGAN3 | 2021 | Tích chập không alias + kernel đẳng biến; loại bỏ kết cấu bám vào lưới pixel. |
| StyleGAN-XL | 2022 | Có điều kiện theo lớp, 1024², ImageNet. |
| R3GAN | 2024 | Đổi thương hiệu với regularization mạnh hơn; thu hẹp khoảng cách với khuếch tán trên FFHQ-1024 với ít tham số hơn 20x. |

Vào năm 2026 StyleGAN3 vẫn là mặc định cho (a) độ chân thực như ảnh chụp trong miền hẹp ở FPS cao, (b) thích nghi miền few-shot (huấn luyện trên một tập dữ liệu mới có 100 ảnh, đóng băng mạng ánh xạ), (c) chỉnh sửa dựa trên nghịch đảo (tìm $w$ tái dựng một ảnh chụp thật, rồi chỉnh sửa $w$ đó). Cho văn bản thành ảnh miền mở, nó không phải công cụ phù hợp — khuếch tán mới là.

```figure
gx-stylegan-mapping
```

## Build It

`code/main.py` triển khai một "style-GAN lite" đồ chơi trong 1-D: một MLP ánh xạ, một hàm tổng hợp nhận một vector hằng được học và điều biến nó bằng scale/bias suy ra từ $w$, và nhiễu theo lớp. Nó cho thấy đưa $w$ vào qua điều biến affine ngang bằng hoặc vượt việc nối $z$ vào đầu vào bộ sinh.

### Step 1: mapping network

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### Step 2: adaptive instance normalization

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Scale và bias theo từng bản đồ đặc trưng đến từ $w$ qua phép chiếu tuyến tính.

### Step 3: per-layer noise

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Sigma theo kênh có thể học được.

## Pitfalls

- **Lỗi giả giọt nước.** StyleGAN 1 tạo ra một giọt nước dạng đốm trong các bản đồ đặc trưng vì AdaIN đưa trung bình về không. Giải điều biến trọng số của StyleGAN 2 khắc phục bằng cách co giãn trọng số tích chập thay thế.
- **Kết cấu bám dính.** Kết cấu StyleGAN 1 và 2 đi theo tọa độ pixel, không phải tọa độ vật thể (nhìn thấy khi nội suy). Các tích chập không alias của StyleGAN 3 khắc phục điều này bằng bộ lọc sinc có cửa sổ.
- **Độ bao phủ mode.** Truncation `ψ < 0.7` trông sạch nhưng lấy mẫu từ một hình nón hẹp; dùng `ψ = 1.0` nếu bạn cần đa dạng.
- **Nghịch đảo có mất mát.** Nghịch đảo một ảnh chụp thật vào $W$ thường được làm qua tối ưu hóa hoặc một encoder (e4e, ReStyle, HyperStyle). Kết quả trôi qua nhiều lần lặp.

## Use It

| Trường hợp sử dụng | Cách tiếp cận |
|----------|----------|
| Khuôn mặt người chân thực như ảnh chụp (anime, sản phẩm, hẹp) | StyleGAN3 FFHQ / tinh chỉnh tùy chỉnh |
| Chỉnh sửa khuôn mặt từ một ảnh chụp | Nghịch đảo e4e + các hướng StyleSpace / InterFaceGAN |
| Hoán đổi khuôn mặt / tái diễn | StyleGAN + encoder + hòa trộn |
| Các pipeline avatar | StyleGAN3 với ADA cho tinh chỉnh ít dữ liệu |
| Thích nghi miền từ một vài ảnh | Đóng băng mạng ánh xạ, tinh chỉnh mạng tổng hợp |
| Sinh đa phương thức hoặc có điều kiện bằng văn bản | Đừng — dùng khuếch tán |

Với các bản demo cấp sản phẩm mà câu trả lời là "ảnh chụp khuôn mặt một người", StyleGAN đánh bại khuếch tán về chi phí suy luận (một lượt truyền xuôi, <10ms trên một 4090) và độ sắc nét ở cùng mức chất lượng.

## Ship It

Lưu `outputs/skill-stylegan-inversion.md`. Skill nhận một ảnh chụp thật và xuất ra: phương pháp nghịch đảo (e4e / ReStyle / HyperStyle), mất mát latent dự kiến, ngân sách chỉnh sửa (bạn có thể di chuyển xa bao nhiêu trong $W$ trước khi có lỗi giả), và một danh sách các hướng chỉnh sửa đã biết là tốt (tuổi, biểu cảm, tư thế).

## Exercises

1. **Dễ.** Chạy `code/main.py` với `adain_on=True` và `adain_on=False`. So sánh độ phân tán của đầu ra cho một latent cố định so với latent bị nhiễu.
2. **Trung bình.** Triển khai mixing regularization: với một batch huấn luyện, tính $w_a$, $w_b$, và áp dụng $w_a$ cho nửa đầu của quá trình tổng hợp và $w_b$ cho nửa sau. Decoder có học các phong cách tách biệt không?
3. **Khó.** Lấy một mô hình StyleGAN3 FFHQ được huấn luyện trước (ffhq-1024.pkl). Tìm hướng $w$ điều khiển "nụ cười" bằng cách huấn luyện một SVM trên các mẫu có nhãn; báo cáo bạn có thể đẩy xa đến đâu trước khi danh tính trôi.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Mapping network (Mạng ánh xạ) | "MLP" | $f: Z \to W$, 8 lớp, tách hình học latent khỏi thống kê dữ liệu. |
| W space (Không gian W) | "Không gian phong cách" | Đầu ra của mạng ánh xạ; gần như tách biệt. |
| AdaIN | "Chuẩn hóa instance thích nghi" | Chuẩn hóa bản đồ đặc trưng, rồi co giãn + dịch chuyển bằng phép chiếu $w$. |
| Truncation trick (Thủ thuật truncation) | "Psi" | $w = \text{mean} + \psi \cdot (w - \text{mean})$, $\psi<1$ đánh đổi đa dạng lấy chất lượng. |
| Path-length regularization (Regularization độ dài đường đi) | "PL reg" | Phạt các thay đổi lớn trong ảnh trên mỗi đơn vị thay đổi trong $w$; làm $W$ trơn hơn. |
| Weight demodulation (Giải điều biến trọng số) | "Cách khắc phục của StyleGAN2" | Chuẩn hóa trọng số conv thay vì activation; loại bỏ lỗi giả giọt nước. |
| Alias-free (Không alias) | "Thủ thuật của StyleGAN3" | Các bộ lọc sinc có cửa sổ; loại bỏ kết cấu bám vào lưới pixel. |
| Inversion (Nghịch đảo) | "Tìm w cho một ảnh thật" | Tối ưu hoặc mã hóa $x \to w$ sao cho $G(w) \approx x$. |

## Production note: why StyleGAN still ships in 2026

StyleGAN3 trên một 4090 sinh một khuôn mặt FFHQ 1024² trong dưới 10 ms — `num_steps = 1`, không giải mã VAE, không có lượt cross-attention. Theo ngôn ngữ production, đây là mức độ trễ tối thiểu cho bất kỳ bộ sinh ảnh nào. Một pipeline SDXL 50 bước + giải mã VAE ở cùng độ phân giải mất ~3 giây. Đó là một **khoảng cách 300×**, và với các sản phẩm miền hẹp (dịch vụ avatar, pipeline giấy tờ định danh, sinh khuôn mặt stock) nó thắng về TCO.

Hai hệ quả vận hành:

- **Không bộ lập lịch, không bộ gom batch.** Batch tĩnh ở mức chiếm dụng mục tiêu là tối ưu. Continuous batching (thiết yếu cho LLM và khuếch tán) không mang lại lợi ích vì mọi yêu cầu có cùng FLOPs.
- **Truncation `ψ` là nút điều chỉnh an toàn.** `ψ < 0.7` lấy mẫu từ một hình nón hẹp của miền giá trị mạng ánh xạ. Đây là đòn bẩy duy nhất lớp phục vụ có đối với phương sai mẫu. Giảm `ψ` ở tải đỉnh, tăng nó cho người dùng cao cấp.

## Further Reading

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) — StyleGAN.
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) — StyleGAN2.
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) — StyleGAN3.
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) — nghịch đảo e4e.
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) — StyleGAN-XL.
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) — công thức GAN tối giản hiện đại.
