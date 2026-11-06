# Conditional GANs & Pix2Pix

> Bước mở khóa lớn đầu tiên giai đoạn 2014-2017 là điều khiển thứ GAN tạo ra. Gắn một nhãn, hoặc một ảnh, hoặc một câu. Pix2Pix làm phiên bản ảnh và nó vẫn đánh bại mọi mô hình văn bản thành ảnh tổng quát trên các tác vụ ảnh sang ảnh hẹp.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 minutes

## The Problem

Một GAN vô điều kiện lấy mẫu các khuôn mặt tùy ý. Hữu ích cho một bản demo, vô dụng trong vận hành thực tế. Bạn muốn: *ánh xạ một bản phác thảo thành một bức ảnh*, *ánh xạ một bản đồ thành một ảnh chụp từ trên không*, *ánh xạ một cảnh ban ngày thành ban đêm*, *tô màu một ảnh thang xám*. Trong tất cả các trường hợp này, bạn được cho một hình ảnh đầu vào $x$ và phải xuất ra $y$ với một sự tương ứng ngữ nghĩa nào đó. Có nhiều $y$ hợp lý cho mỗi $x$. Sai số bình phương trung bình làm phẳng chúng thành một khối nhão. Loss đối kháng thì không, vì "trông thật" là sắc nét.

GAN có điều kiện (Mirza & Osindero, 2014) thêm một điều kiện $c$ làm đầu vào cho cả $G$ và $D$. Pix2Pix (Isola et al., 2017) chuyên biệt hóa điều này: điều kiện là một ảnh đầu vào đầy đủ, bộ sinh là một U-Net, bộ phân biệt là một bộ phân loại *dựa trên patch* (PatchGAN), và hàm mất mát là đối kháng + L1. Công thức đó vượt các mô hình văn bản thành ảnh từ đầu trên các miền ảnh sang ảnh hẹp ngay cả vào năm 2026 vì nó được huấn luyện trên *dữ liệu ghép cặp* — bạn có đúng tín hiệu bạn cần.

## The Concept

![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**G có điều kiện.** $G(x, z) \to y$. Trong Pix2Pix, $z$ là dropout bên trong G (không có nhiễu đầu vào — Isola nhận thấy nhiễu tường minh bị bỏ qua).

**D có điều kiện.** $D(x, y) \to [0, 1]$. Đầu vào là *cặp* (điều kiện, đầu ra). Đây là khác biệt chính: D phải đánh giá liệu $y$ có nhất quán với $x$ hay không, chứ không chỉ liệu $y$ có trông thật hay không.

**Bộ sinh U-Net.** Encoder-decoder với các kết nối tắt xuyên qua nút thắt cổ chai. Quan trọng đối với các tác vụ mà đầu vào và đầu ra chia sẻ cấu trúc cấp thấp (cạnh, hình bóng). Không có các kết nối tắt, chi tiết tần số cao biến mất.

**Bộ phân biệt PatchGAN.** Thay vì xuất ra một điểm thật/giả duy nhất, D xuất ra một lưới $N \times N$ trong đó mỗi ô đánh giá một trường tiếp nhận ~70×70 pixel. Lấy trung bình. Đây là một giả định trường ngẫu nhiên Markov: tính chân thực là cục bộ. Huấn luyện nhanh hơn nhiều, ít tham số hơn, đầu ra sắc nét hơn.

**Hàm mất mát.**

```math
\begin{aligned}
\text{loss}_G &= -\log D(x, G(x)) + \lambda \cdot \lVert y - G(x) \rVert_1 \\
\text{loss}_D &= -\log D(x, y) - \log(1 - D(x, G(x)))
\end{aligned}
```

Hạng tử L1 ổn định huấn luyện và đẩy G về mục tiêu đã biết. L1 cho các cạnh sắc nét hơn L2 (trung vị, không phải trung bình). $\lambda = 100$ là mặc định của Pix2Pix.

## CycleGAN — when you don't have pairs

Pix2Pix cần dữ liệu $(x, y)$ ghép cặp. CycleGAN (Zhu et al., 2017) bỏ yêu cầu này với cái giá là một hàm mất mát bổ sung: hàm mất mát *nhất quán chu trình*. Hai bộ sinh $G: X \to Y$ và $F: Y \to X$. Huấn luyện chúng sao cho $F(G(x)) \approx x$ và $G(F(y)) \approx y$. Điều này cho phép bạn chuyển ngựa thành ngựa vằn, mùa hè thành mùa đông, mà không có ví dụ ghép cặp.

Vào năm 2026, ảnh sang ảnh không ghép cặp phần lớn được làm qua khuếch tán (ControlNet, IP-Adapter) thay vì CycleGAN, nhưng ý tưởng nhất quán chu trình tồn tại trong gần như mọi bài báo thích nghi miền không ghép cặp.

```figure
gx-patchgan
```

## Build It

`code/main.py` triển khai một GAN có điều kiện nhỏ trên dữ liệu 1-D. Điều kiện $c$ là một nhãn lớp (0 hoặc 1). Tác vụ: tạo ra một mẫu từ phân phối có điều kiện cho lớp đã cho.

### Step 1: append condition to both G and D inputs

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

Mã hóa one-hot là cách đơn giản nhất. Các mô hình lớn hơn dùng embedding được học, điều biến FiLM, hoặc cross-attention.

### Step 2: train conditional

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

Bộ sinh phải khớp phân phối thật *cho điều kiện đã cho*, không phải phân phối biên.

### Step 3: verify per-class output

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## Pitfalls

- **Điều kiện bị bỏ qua.** G học lấy biên, D không bao giờ phạt vì tín hiệu điều kiện yếu. Cách khắc phục: điều kiện hóa D mạnh hơn (lớp sớm, không chỉ lớp muộn), dùng bộ phân biệt chiếu (Miyato & Koyama 2018).
- **Trọng số L1 quá thấp.** G trôi sang các đầu ra trông thật tùy ý, không phải các đầu ra trung thành. Bắt đầu $\lambda \approx 100$ cho các tác vụ kiểu Pix2Pix.
- **Trọng số L1 quá cao.** G tạo ra các đầu ra mờ vì L1 vẫn là một chuẩn $L_p$. Giảm dần khi huấn luyện đã ổn định.
- **Rò rỉ ground-truth trong D.** Nối $(x, y)$ làm đầu vào D, không chỉ $y$. Không có điều này D không thể kiểm tra tính nhất quán.
- **Sụp đổ mode theo lớp.** Mỗi lớp có thể sụp đổ độc lập. Chạy kiểm tra độ đa dạng có điều kiện theo lớp.

## Use It

Hiện trạng các tác vụ ảnh sang ảnh năm 2026:

| Tác vụ | Cách tiếp cận tốt nhất |
|------|---------------|
| Phác thảo → ảnh chụp, cùng miền, dữ liệu ghép cặp | Pix2Pix / Pix2PixHD (vẫn nhanh, vẫn sắc nét) |
| Phác thảo → ảnh chụp, không ghép cặp | ControlNet với một mô hình điều kiện hóa Scribble |
| Phân đoạn ngữ nghĩa → ảnh chụp | SPADE / GauGAN2 hoặc SD + ControlNet-Seg |
| Chuyển phong cách | Khuếch tán với IP-Adapter hoặc LoRA; các phương pháp GAN là di sản |
| Độ sâu → ảnh chụp | ControlNet-Depth trên Stable Diffusion |
| Siêu phân giải | Real-ESRGAN (GAN), ESRGAN-Plus, hoặc SD-Upscale (khuếch tán) |
| Tô màu | ColTran, các bộ tô màu dựa trên khuếch tán, hoặc Pix2Pix-color |
| Ban ngày → ban đêm, mùa, thời tiết | CycleGAN hoặc dựa trên ControlNet |

Pix2Pix vẫn là công cụ đúng khi (a) bạn có hàng nghìn ví dụ ghép cặp, (b) tác vụ hẹp và có thể lặp lại, và (c) bạn cần suy luận nhanh. Trên các tác vụ miền mở tổng quát, khuếch tán thắng.

## Ship It

Lưu `outputs/skill-img2img-chooser.md`. Skill nhận một mô tả tác vụ, tính sẵn có của dữ liệu (ghép cặp so với không ghép cặp, N mẫu), và ngân sách độ trễ/chất lượng, rồi xuất ra: cách tiếp cận (Pix2Pix, CycleGAN, biến thể ControlNet, SDXL + IP-Adapter), yêu cầu dữ liệu huấn luyện, chi phí suy luận, và quy trình đánh giá (LPIPS, FID, riêng cho tác vụ).

## Exercises

1. **Dễ.** Sửa `code/main.py` để thêm một lớp thứ ba. Xác nhận G vẫn ánh xạ nhiễu của mỗi lớp sang mode đúng.
2. **Trung bình.** Thay L1 bằng một hàm mất mát kiểu cảm nhận trong bối cảnh 1-D (ví dụ một D nhỏ được đóng băng làm bộ trích xuất đặc trưng). Nó có thay đổi độ sắc nét của phân phối có điều kiện không?
3. **Khó.** Phác thảo một CycleGAN trong bối cảnh 1-D: hai phân phối, hai bộ sinh, hàm mất mát chu trình. Chứng minh nó học ánh xạ giữa chúng mà không có dữ liệu ghép cặp.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Conditional GAN (GAN có điều kiện) | "GAN có nhãn" | G(z, c), D(x, c). Cả hai mạng đều thấy điều kiện. |
| Pix2Pix | "GAN ảnh sang ảnh" | cGAN ghép cặp với G U-Net và D PatchGAN + hàm mất mát L1. |
| U-Net | "Encoder-decoder có kết nối tắt" | Mạng conv đối xứng; kết nối tắt giữ lại tần số cao. |
| PatchGAN | "Bộ phân loại tính chân thực cục bộ" | D xuất ra điểm theo patch thay vì điểm toàn cục. |
| CycleGAN | "Chuyển đổi ảnh không ghép cặp" | Hai G + hàm mất mát nhất quán chu trình; không có dữ liệu ghép cặp. |
| SPADE | "GauGAN" | Chuẩn hóa các activation trung gian bằng bản đồ ngữ nghĩa; phân đoạn thành ảnh. |
| FiLM | "Điều biến tuyến tính theo đặc trưng" | Phép biến đổi affine theo từng đặc trưng từ điều kiện; điều kiện hóa rẻ. |

## Production note: Pix2Pix as a latency-bound baseline

Khi bạn có dữ liệu ghép cặp và một tác vụ hẹp (phác thảo → kết xuất, bản đồ ngữ nghĩa → ảnh chụp, ngày → đêm), suy luận một lần của Pix2Pix đánh bại khuếch tán một bậc độ lớn về độ trễ. So sánh production thường là:

| Đường đi | Số bước | Độ trễ điển hình ở 512² trên một L4 |
|------|-------|----------------------------------------|
| Pix2Pix (truyền xuôi U-Net) | 1 | ~30 ms |
| SD-Inpaint hoặc SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL cơ sở | 20-30 | ~3-5 s |

Pix2Pix thắng về thông lượng trong các batch tĩnh (mọi yêu cầu có cùng FLOPs). Khuếch tán thắng về chất lượng và khả năng khái quát hóa. Cách làm hiện đại thường là triển khai một mô hình chưng cất kiểu Pix2Pix cho tác vụ hẹp và một phương án khuếch tán dự phòng cho các đầu vào ít gặp.

## Further Reading

- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) — bài báo cGAN.
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) — Pix2Pix.
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) — CycleGAN.
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) — Pix2PixHD.
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) — SPADE / GauGAN.
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) — D chiếu.
