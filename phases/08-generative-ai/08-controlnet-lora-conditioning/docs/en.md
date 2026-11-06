# ControlNet, LoRA & Conditioning

> Chỉ văn bản là một tín hiệu điều khiển vụng về. ControlNet cho phép bạn sao chép một mô hình khuếch tán đã huấn luyện trước và điều khiển nó bằng một bản đồ độ sâu, khung xương tư thế, nét nguệch ngoạc hoặc ảnh cạnh. LoRA cho phép bạn tinh chỉnh một mô hình 2B tham số bằng cách huấn luyện 10 triệu tham số. Cùng nhau chúng biến Stable Diffusion từ một món đồ chơi thành pipeline ảnh năm 2026 được triển khai ở mọi agency.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — for LoRA foundation)
**Time:** ~75 minutes

## The Problem

Một prompt như "một phụ nữ mặc váy đỏ dắt chó đi trên một con phố đông đúc" không cho mô hình thông tin nào về việc con chó ở *đâu*, người phụ nữ ở *tư thế nào*, hay *phối cảnh* của con phố. Văn bản xác định khoảng 10% những gì bạn cần để đặc tả một ảnh. Phần còn lại là thị giác và không thể mô tả hiệu quả bằng từ ngữ.

Huấn luyện một mô hình có điều kiện mới từ đầu cho mỗi tín hiệu (tư thế, độ sâu, canny, phân đoạn) tốn kém đến mức không khả thi. Bạn muốn giữ backbone SDXL 2.6B tham số đóng băng, gắn một mạng phụ nhỏ đọc điều kiện hóa và để nó đẩy nhẹ các đặc trưng trung gian của backbone. Đó là ControlNet.

Bạn cũng muốn dạy mô hình các khái niệm mới (khuôn mặt của bạn, sản phẩm của bạn, phong cách của bạn) mà không huấn luyện lại toàn bộ mô hình. Bạn muốn một delta nhỏ hơn 100x. Đó là LoRA — các adapter hạng thấp cắm vào các trọng số attention hiện có.

ControlNet + LoRA + văn bản = bộ công cụ của người thực hành năm 2026. Hầu hết pipeline ảnh production xếp 2-5 LoRA, 1-3 ControlNet và một IP-Adapter lên trên một mô hình cơ sở SDXL / SD3 / Flux.

## The Concept

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

Lấy một SD được huấn luyện trước. *Sao chép* nửa encoder của U-Net. Đóng băng bản gốc. Huấn luyện bản sao nhận một đầu vào điều kiện hóa bổ sung (cạnh, độ sâu, tư thế). Kết nối bản sao trở lại nửa decoder của bản gốc bằng các kết nối tắt *zero-convolution* (conv 1×1 được khởi tạo bằng không — bắt đầu như một no-op, học một delta).

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Khởi tạo zero-conv nghĩa là ControlNet bắt đầu như đồng nhất — không gây hại ngay cả trước huấn luyện. Huấn luyện trên 1M bộ ba (prompt, điều kiện, ảnh) với hàm mất mát khuếch tán tiêu chuẩn.

Các ControlNet theo phương thức được cung cấp dưới dạng các mô hình phụ nhỏ (~360M cho SDXL, ~70M cho SD 1.5). Bạn có thể kết hợp chúng khi suy luận:

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### LoRA (Hu et al., 2021)

Với bất kỳ lớp tuyến tính $W \in \mathbb{R}^{d \times d}$ nào trong mô hình, đóng băng $W$ và thêm một delta hạng thấp:

```math
W' = W + \Delta W, \quad \Delta W = B A, \quad A \in \mathbb{R}^{r \times d}, \quad B \in \mathbb{R}^{d \times r}
```

với $r \ll d$. Hạng 4-16 là tiêu chuẩn cho attention, hạng 64-128 cho tinh chỉnh nặng. Số tham số mới: $2 \cdot d \cdot r$ thay vì $d^2$. Với attention SDXL có $d=640$, $r=16$: 20k tham số mỗi adapter thay vì 410k — giảm 20x. Trên toàn mô hình: một LoRA thường là 20-200MB so với mô hình cơ sở 5GB.

Khi suy luận bạn có thể co giãn LoRA: $W' = W + \alpha \cdot B A$. $\alpha = 0.5\text{-}1.5$ là bình thường. Nhiều LoRA cộng chồng lên nhau (với lưu ý thông thường rằng chúng tương tác theo những cách phi tuyến).

### IP-Adapter (Ye et al., 2023)

Một adapter nhỏ nhận một *ảnh* làm điều kiện hóa (cùng văn bản). Dùng encoder ảnh CLIP để tạo các token ảnh, đưa chúng vào cross-attention cùng các token văn bản. ~20MB mỗi mô hình cơ sở. Cho phép bạn làm "sinh một ảnh theo phong cách của tham chiếu này" mà không có LoRA.

## Composability matrix

| Công cụ | Nó điều khiển gì | Kích thước | Khi nào dùng |
|------|------------------|------|-------------|
| ControlNet | Cấu trúc không gian (tư thế, độ sâu, cạnh) | 70-360MB | Bố cục chính xác, bố trí |
| LoRA | Phong cách, chủ thể, khái niệm | 20-200MB | Cá nhân hóa, phong cách |
| IP-Adapter | Phong cách hoặc chủ thể từ ảnh tham chiếu | 20MB | Không văn bản nào có thể mô tả diện mạo |
| Textual Inversion | Một khái niệm đơn lẻ như một token mới | 10KB | Đời cũ, phần lớn được thay bằng LoRA |
| DreamBooth | Tinh chỉnh toàn bộ trên một chủ thể | 2-5GB | Danh tính mạnh, tính toán cao |
| T2I-Adapter | Lựa chọn thay thế ControlNet nhẹ hơn | 70MB | Thiết bị biên, ngân sách suy luận |

ControlNet ≈ không gian. LoRA ≈ ngữ nghĩa. Dùng cả hai.

```figure
v4-controlnet-zero
```

## Build It

`code/main.py` mô phỏng hai cơ chế trên 1-D:

1. **LoRA.** Một lớp tuyến tính được huấn luyện trước $W$. Đóng băng nó. Huấn luyện một $BA$ hạng thấp sao cho $W + BA$ khớp một lớp tuyến tính mục tiêu. Cho thấy $r = 1$ đủ để học hoàn hảo một hiệu chỉnh hạng 1.

2. **ControlNet-lite.** Một bộ dự đoán "cơ sở đóng băng" và một "mạng phụ" đọc một tín hiệu bổ sung. Đầu ra của mạng phụ được đặt cổng bằng một vô hướng có thể học được khởi tạo bằng không (phiên bản zero-conv của chúng ta). Huấn luyện và xem cổng tăng dần.

### Step 1: LoRA math

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### Step 2: zero-init side network

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

Ở bước 0 đầu ra giống hệt mô hình cơ sở. Huấn luyện ban đầu cập nhật `gate` chậm — không có trôi thảm khốc.

## Pitfalls

- **Co giãn LoRA quá mức.** $\alpha = 2$ hoặc $\alpha = 3$ là một mẹo "làm nó mạnh hơn" phổ biến tạo ra các đầu ra quá cách điệu / hỏng. Giữ $\alpha \le 1.5$.
- **Xung đột trọng số ControlNet.** Dùng một Pose ControlNet ở trọng số 1.0 và một Depth ControlNet ở trọng số 1.0 thường vượt quá mức. Tổng trọng số ≈ 1.0 là một mặc định an toàn.
- **LoRA trên sai mô hình cơ sở.** Các LoRA SDXL âm thầm không làm gì trên SD 1.5 vì số chiều attention không khớp. Diffusers sẽ cảnh báo ở 0.30+.
- **Trôi Textual Inversion.** Các token được huấn luyện trên một checkpoint trôi nghiêm trọng trên một checkpoint khác. LoRA dễ chuyển hơn.
- **Gộp và lưu trữ trọng số LoRA.** Bạn có thể tích hợp một LoRA vào các trọng số mô hình cơ sở để suy luận nhanh hơn (không cộng lúc chạy), nhưng bạn mất khả năng co giãn $\alpha$ lúc chạy. Giữ cả hai phiên bản.

## Use It

| Mục tiêu | Pipeline năm 2026 |
|------|---------------|
| Tái tạo phong cách nghệ thuật của một thương hiệu | LoRA được huấn luyện trên ~30 ảnh tuyển chọn ở hạng 32 |
| Đặt khuôn mặt tôi vào một ảnh được sinh | DreamBooth hoặc LoRA + IP-Adapter-FaceID |
| Tư thế cụ thể + prompt | ControlNet-Openpose + SDXL + văn bản |
| Bố cục nhận biết độ sâu | ControlNet-Depth + SD3 |
| Tham chiếu + prompt | IP-Adapter + văn bản |
| Bố cục chính xác | ControlNet-Scribble hoặc ControlNet-Canny |
| Thay nền | ControlNet-Seg + Inpainting (Bài 09) |
| Phong cách 1 bước nhanh | LCM-LoRA trên SDXL-Turbo |

## Ship It

Lưu `outputs/skill-sd-toolkit-composer.md`. Skill nhận một tác vụ (tài nguyên đầu vào: prompt, ảnh tham chiếu tùy chọn, tư thế tùy chọn, độ sâu tùy chọn, nét nguệch ngoạc tùy chọn) và xuất ra bộ công cụ, trọng số và một quy trình seed có thể tái lập.

## Exercises

1. **Dễ.** Trong `code/main.py`, thay đổi hạng LoRA `r` từ 1 đến 4. Ở hạng nào LoRA khớp chính xác một delta mục tiêu hạng 2?
2. **Trung bình.** Huấn luyện hai LoRA riêng trên hai phép biến đổi mục tiêu. Tải chúng cùng nhau và cho thấy tương tác cộng của chúng. Khi nào tương tác phá vỡ tính tuyến tính?
3. **Khó.** Dùng diffusers để xếp chồng: SDXL-base + Canny-ControlNet (trọng số 0.8) + một LoRA phong cách ($\alpha$ 0.8) + IP-Adapter (trọng số 0.6). Đo đánh đổi FID so với bám sát prompt khi các trọng số của bộ thay đổi.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| ControlNet | "Điều khiển không gian" | Encoder sao chép + các kết nối tắt zero-conv; đọc một ảnh điều kiện hóa. |
| Zero convolution (Tích chập không) | "Bắt đầu như đồng nhất" | Conv 1×1 được khởi tạo bằng không; ControlNet bắt đầu như no-op. |
| LoRA | "Adapter hạng thấp" | $W + BA$, $r \ll d$; ít tham số hơn 100x so với tinh chỉnh toàn bộ. |
| rank r (hạng r) | "Nút điều chỉnh" | Nén LoRA; 4-16 điển hình, 64+ cho cá nhân hóa nặng. |
| $\alpha$ | "Cường độ LoRA" | Co giãn delta LoRA lúc chạy. |
| IP-Adapter | "Ảnh tham chiếu" | Adapter điều kiện hóa ảnh nhỏ qua các token CLIP-image. |
| DreamBooth | "Tinh chỉnh toàn bộ chủ thể" | Huấn luyện toàn bộ mô hình trên ~30 ảnh của một chủ thể. |
| Textual Inversion | "Token mới" | Chỉ học một word embedding mới; đời cũ, phần lớn đã được thay thế. |

## Production note: LoRA swaps, ControlNet lanes, multi-tenant serving

Một SaaS văn bản thành ảnh thực phục vụ hàng trăm LoRA và khoảng mười hai ControlNet trên cùng checkpoint cơ sở. Bài toán phục vụ rất giống đa khách thuê LLM (tài liệu production trình bày trường hợp LLM dưới continuous batching và LoRAX / S-LoRA):

- **Hoán đổi nóng LoRA, đừng gộp.** Gộp $W' = W + \alpha \cdot B \cdot A$ vào mô hình cơ sở cho suy luận mỗi bước nhanh hơn ~3-5% nhưng đóng băng $\alpha$ và mô hình cơ sở. Giữ các LoRA nóng trong VRAM như các delta hạng r; diffusers cung cấp `pipe.load_lora_weights()` + `pipe.set_adapters([...], adapter_weights=[...])` để kích hoạt theo yêu cầu. Chi phí hoán đổi là các trọng số `2 · d · r · num_layers` — quy mô MB, dưới một giây.
- **ControlNet như một làn attention thứ hai.** Encoder sao chép chạy song song với mô hình cơ sở. Hai ControlNet ở trọng số 1.0 mỗi cái = hai lượt truyền xuôi bổ sung mỗi bước, không phải một lượt gộp. Dư địa kích thước batch giảm theo bậc hai. Dự trù ~1.5× chi phí mỗi bước cho mỗi ControlNet hoạt động.
- **LoRA cũng được lượng tử hóa.** Nếu bạn đã lượng tử hóa mô hình cơ sở (xem Bài 07, Flux trên 8GB), delta LoRA cũng lượng tử hóa tốt xuống 8-bit hoặc 4-bit. Tải kiểu QLoRA cho phép bạn xếp 5-10 LoRA lên một mô hình cơ sở Flux 4-bit mà không làm bùng bộ nhớ.

Riêng cho Flux: notebook Flux-on-8GB của Niels lượng tử hóa mô hình cơ sở xuống 4-bit; xếp một LoRA phong cách (`pipe.load_lora_weights("user/style-lora")`) lên mô hình cơ sở đã lượng tử hóa đó ở `weight_name="pytorch_lora_weights.safetensors"` vẫn hoạt động. Đây là công thức mà hầu hết agency SaaS triển khai vào năm 2026.

## Further Reading

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) — ControlNet.
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) — LoRA (ban đầu cho LLM; chuyển sang khuếch tán).
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) — IP-Adapter.
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) — lựa chọn thay thế ControlNet nhẹ hơn.
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242) — DreamBooth.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) — các pipeline tham chiếu.
