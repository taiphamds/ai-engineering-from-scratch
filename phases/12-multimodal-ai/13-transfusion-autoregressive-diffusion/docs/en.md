# Transfusion: Autoregressive Text + Diffusion Image in One Transformer

> Chameleon và Emu3 đặt cược mọi thứ vào token rời rạc. Chúng hoạt động, nhưng nút thắt lượng tử hóa hiện rõ — chất lượng ảnh chững lại dưới các mô hình khuếch tán trong không gian liên tục. Transfusion (Meta, Zhou và cộng sự, tháng 8 năm 2024) đặt cược theo hướng ngược lại: giữ ảnh liên tục, loại bỏ hoàn toàn VQ-VAE và huấn luyện một transformer với hai hàm mất mát. Token văn bản nhận dự đoán token tiếp theo. Patch ảnh nhận hàm mất mát flow matching / khuếch tán. Cả hai mục tiêu tối ưu cùng các trọng số. Kiến trúc bên dưới Stable Diffusion 3 (MMDiT) là một họ hàng gần. Bài học này đọc luận điểm của Transfusion, xây dựng một bộ huấn luyện hai hàm mất mát đơn giản và lần theo mặt nạ attention cho phép một transformer làm cả hai việc.

**Type:** Build
**Languages:** Python (stdlib, two-loss trainer on MNIST-scale toy)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 8 (Generative AI)
**Time:** ~180 minutes

## Learning Objectives

- Kết nối một transformer chạy hai hàm mất mát (NTP trên token văn bản, MSE khuếch tán trên patch ảnh) trên một backbone.
- Giải thích tại sao attention hai chiều giữa các patch ảnh cộng với attention nhân quả trên token văn bản là lựa chọn mặt nạ phù hợp.
- So sánh kiểu Transfusion (ảnh liên tục, hàm mất mát khuếch tán) với kiểu Chameleon (ảnh rời rạc, NTP) về tính toán, chất lượng và độ phức tạp mã.
- Nêu đóng góp của MMDiT: trọng số riêng cho từng phương thức tại mỗi khối, attention chung tại luồng phần dư.

## The Problem

Cuộc tranh luận token ảnh rời rạc so với liên tục có trước LLM. Biểu diễn liên tục (pixel thô, biến tiềm ẩn VAE) giữ lại chi tiết. Token rời rạc (chỉ số VQ) phù hợp với bộ từ vựng gốc của transformer nhưng mất chi tiết ở bước lượng tử hóa.

Chameleon / Emu3 chọn rời rạc: một hàm mất mát, một kiến trúc, nhưng độ trung thực ảnh bị giới hạn bởi chất lượng tokenizer.

Các mô hình khuếch tán chọn liên tục: chất lượng ảnh vượt trội, nhưng là mô hình tách biệt với LLM, kỹ thuật thiết kế lịch nhiễu phức tạp và không có sự tích hợp rõ ràng với tạo văn bản.

Transfusion đặt câu hỏi: chúng ta có thể có cả hai không? Giữ ảnh liên tục, vẫn huấn luyện một mô hình, dùng hai hàm mất mát ghép vào một bước gradient.

## The Concept

### The two-loss architecture

Một transformer chỉ có bộ giải mã duy nhất xử lý một chuỗi chứa:

- Token văn bản (rời rạc, từ bộ từ vựng BPE).
- Patch ảnh (liên tục, các khối pixel 16x16 được chiếu vào chiều ẩn qua embedding tuyến tính — giống đầu vào của bộ mã hóa ViT).
- Các thẻ `<image>` và `</image>` đánh dấu nơi các patch liên tục nằm.

Lượt truyền xuôi chạy một lần. Hàm mất mát chọn một trong hai head cho mỗi token:

- Với token văn bản: cross-entropy tiêu chuẩn trên head logit từ vựng.
- Với patch ảnh: hàm mất mát khuếch tán trên patch liên tục — dự đoán nhiễu đã được thêm vào mỗi patch.

Gradient đi qua phần thân transformer dùng chung. Cả hai hàm mất mát đồng thời cải thiện các trọng số dùng chung.

### Attention mask: causal text + bidirectional image

Token văn bản phải có tính nhân quả — bạn không thể để một token văn bản chú ý đến văn bản tương lai, nếu không teacher forcing sẽ hỏng. Tuy nhiên, các patch ảnh biểu diễn một ảnh chụp; chúng nên chú ý lẫn nhau theo hai chiều trong cùng khối ảnh.

Mặt nạ:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i)   # text attends to images that closed before it
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Được triển khai dưới dạng mặt nạ tam giác theo khối khi huấn luyện và suy luận.

### Diffusion loss inside the transformer

Hàm mất mát khuếch tán là tiêu chuẩn: thêm nhiễu vào patch ảnh, yêu cầu mô hình dự đoán nhiễu (hoặc tương đương là patch sạch). Phiên bản của Transfusion sử dụng flow matching — dự đoán trường vận tốc từ nhiễu đến sạch.

Trong quá trình huấn luyện:
1. Với mỗi patch ảnh $x_0$, lấy mẫu một bước thời gian ngẫu nhiên $t$.
2. Lấy mẫu nhiễu $\epsilon$, tính $x_t = (1-t) \cdot x_0 + t \cdot \epsilon$ (nội suy tuyến tính cho flow matching).
3. Transformer dự đoán $v_\theta(x_t, t)$; $\text{loss} = \mathop{\mathrm{MSE}}(v_\theta(x_t, t), \epsilon - x_0)$.
4. Lan truyền ngược cùng các hàm mất mát NTP văn bản từ cùng chuỗi.

Khi suy luận, quá trình tạo sinh là:
- Token văn bản: lấy mẫu tự hồi quy tiêu chuẩn.
- Patch ảnh: vòng lặp lấy mẫu khuếch tán (thường 10-30 bước) được điều kiện hóa trên các token văn bản trước đó.

### MMDiT: Stable Diffusion 3's variant

Stable Diffusion 3 (Esser và cộng sự, tháng 3 năm 2024) phát hành MMDiT (Multimodal Diffusion Transformer) vào khoảng cùng thời điểm với Transfusion. Các kiến trúc là anh em.

Các khác biệt then chốt của MMDiT:

- Trọng số riêng cho từng phương thức ở mỗi khối. Mỗi khối transformer có trọng số Q, K, V và MLP riêng cho token văn bản so với patch ảnh. Attention là chung (chéo phương thức); mọi thứ còn lại là riêng cho từng phương thức.
- Huấn luyện rectified flow. Một biến thể flow matching cụ thể với cách lấy mẫu đã biết và phép toán đơn giản hơn DDPM.
- Quy mô. MMDiT là backbone cho SD3 (các biến thể 2B và 8B tham số). Bài báo Transfusion mở rộng đến 7B.

Cả hai hội tụ về cùng ý tưởng cốt lõi: một transformer chạy NTP trên văn bản và khuếch tán trên biểu diễn ảnh liên tục.

### Why this beats Chameleon-style

Khoảng cách chất lượng giữa khuếch tán liên tục và NTP rời rạc trong tạo ảnh có thể đo được. Bài báo Transfusion báo cáo:

- Ở 7B tham số, vượt mô hình kiểu Chameleon cùng kích thước về FID 3-5 điểm.
- Không cần huấn luyện tokenizer — bộ mã hóa ảnh đơn giản hơn (phép chiếu tuyến tính vào chiều ẩn, giống lớp đầu vào của ViT).
- Suy luận có thể song song hóa việc khử nhiễu patch ảnh, khác với token ảnh tự hồi quy.

Nhược điểm: Transfusion là mô hình hai hàm mất mát, khiến động lực huấn luyện khó xử lý hơn. Trọng số hàm mất mát cần được điều chỉnh. Sự không khớp lịch giữa NTP và khuếch tán có thể khiến một head chiếm ưu thế.

### What sits downstream

Janus-Pro (Bài học 12.15) tinh chỉnh ý tưởng của Transfusion bằng cách tách bộ mã hóa thị giác cho hiểu và tạo sinh — SigLIP cho bên này, VQ cho bên kia — trong khi dùng chung phần thân transformer. Show-o (Bài học 12.14) thay khuếch tán bằng khuếch tán rời rạc (dự đoán có mặt nạ). Họ mô hình tạo sinh thống nhất phân nhánh nhanh chóng sau Transfusion.

Các mô hình thương mại đóng xuất hình ảnh trực tiếp có thể sử dụng một hậu duệ nào đó của họ này, nhưng kiến trúc của chúng không được công bố, vì vậy hãy xem mọi khẳng định như vậy là một phỏng đoán.

```figure
cfg-guidance-scale
```

## Use It

`code/main.py` xây dựng một Transfusion đơn giản trên bài toán nhỏ giống MNIST:

- Chú thích văn bản là các chuỗi số nguyên ngắn mô tả một chữ số (0-9).
- Ảnh là các lưới byte 4x4.
- Một cặp phép chiếu tuyến tính dùng chung trọng số đóng vai trò thay thế transformer; hàm mất mát NTP trên văn bản, hàm mất mát MSE trên patch nhiễu.
- Vòng lặp huấn luyện luân phiên hai hàm mất mát, mặt nạ attention được thể hiện tường minh.
- Một bản demo mặt nạ in mẫu attention tam giác khối cho một chuỗi văn bản, hình ảnh, văn bản. Việc tạo sinh không được chạy: một bộ lấy mẫu thực sẽ giải mã văn bản theo từng token, rồi khử nhiễu các patch hình ảnh qua nhiều bước, như các bài tập bên dưới đếm.

Transformer là mô hình đơn giản. Phần kết nối hai hàm mất mát, xây dựng mặt nạ attention và vòng lặp suy luận mới là các sản phẩm thực sự.

## Ship It

Bài học này tạo ra `outputs/skill-two-loss-trainer-designer.md`. Với một tác vụ huấn luyện đa phương thức mới (văn bản + ảnh, văn bản + âm thanh, văn bản + video), nó thiết kế lịch hai hàm mất mát (trọng số hàm mất mát, hình dạng mặt nạ, khối dùng chung so với riêng cho từng phương thức) và chỉ ra rủi ro triển khai.

## Exercises

1. Một mô hình kiểu Transfusion huấn luyện 70% token văn bản và 30% patch ảnh. Hàm mất mát khuếch tán ảnh có độ lớn ~10x hàm mất mát NTP văn bản. Trọng số hàm mất mát nào cân bằng chúng?

2. Triển khai mặt nạ tam giác theo khối cho chuỗi: `[T, T, <image>, P, P, P, P, </image>, T]`. Đánh dấu mỗi phần tử là 0 hoặc 1.

3. MMDiT có trọng số QKV riêng cho từng phương thức. Điều này thêm bao nhiêu tham số so với transformer dùng chung hoàn toàn của Transfusion? Ở 7B tham số, có đáng không?

4. Tạo sinh: với một prompt văn bản, mô hình chạy NTP cho 50 token, rồi gặp `<image>`, rồi chạy khuếch tán trên 256 patch qua 20 bước khử nhiễu. Tổng cộng bao nhiêu lượt truyền xuôi?

5. Đọc Mục 3 của bài báo SD3. Mô tả rectified flow và tại sao nó hội tụ với ít bước suy luận hơn DDPM.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Two-loss training (Huấn luyện hai hàm mất mát) | "NTP + khuếch tán" | Một transformer duy nhất tối ưu cả cross-entropy trên token văn bản và MSE trên patch ảnh liên tục trong cùng bước gradient |
| Flow matching | "Rectified flow" | Biến thể khuếch tán dự đoán trường vận tốc từ nhiễu đến dữ liệu sạch; phép toán đơn giản hơn DDPM |
| MMDiT | "DiT đa phương thức" | Kiến trúc của Stable Diffusion 3: attention chung, MLP và norm riêng cho từng phương thức |
| Block-triangular mask (Mặt nạ tam giác theo khối) | "Văn bản nhân quả + ảnh hai chiều" | Mặt nạ attention có tính nhân quả trên văn bản nhưng hai chiều trong các vùng ảnh |
| Continuous image representation (Biểu diễn ảnh liên tục) | "Không VQ" | Patch ảnh dưới dạng vector giá trị thực, thay vì chỉ số codebook nguyên |
| Velocity prediction (Dự đoán vận tốc) | "Tham số hóa v" | Đầu ra mạng là trường vận tốc giữa nhiễu và dữ liệu, thay vì bản thân nhiễu |

## Further Reading

- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
