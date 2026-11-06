# Evaluation — FID, CLIP Score, Human Preference

> Mọi bảng xếp hạng mô hình sinh đều dẫn FID, điểm CLIP và một tỷ lệ thắng từ đấu trường sở thích của con người. Mỗi con số có một kiểu thất bại mà một nhà nghiên cứu quyết tâm có thể thao túng. Nếu bạn không biết các kiểu thất bại, bạn không thể phân biệt một cải thiện thật với một lần chạy thao túng.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 01 (Taxonomy), Phase 2 · 04 (Evaluation Metrics)
**Time:** ~45 minutes

## The Problem

Một mô hình sinh được đánh giá theo *chất lượng mẫu* và *bám sát điều kiện hóa*. Không cái nào có một thước đo dạng đóng. Mô hình của bạn phải kết xuất 10,000 ảnh; thứ gì đó phải gán các con số cho chúng; bạn phải tin các con số xuyên các họ mô hình, xuyên độ phân giải, xuyên kiến trúc. Ba thước đo đã sống sót qua thử thách 2014-2026:

- **FID (Khoảng cách Fréchet Inception).** Một khoảng cách giữa hai phân phối — thật và được sinh — trong không gian đặc trưng của một mạng Inception. Thấp hơn là tốt hơn.
- **Điểm CLIP.** Độ tương đồng cosine giữa embedding CLIP-image của một ảnh được sinh và embedding CLIP-text của một prompt. Cao hơn là tốt hơn. Đo bám sát prompt.
- **Sở thích của con người.** Cho hai mô hình đối đầu trên cùng một prompt, để con người (hoặc một mô hình hạng GPT-4) chọn cái tốt hơn, tổng hợp thành một điểm Elo.

Bạn cũng sẽ thấy: IS (điểm inception, phần lớn đã nghỉ hưu), KID, CMMD, ImageReward, PickScore, HPSv2, MJHQ-30k. Mỗi cái sửa một thất bại của cái trước.

## The Concept

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID — sample quality

Heusel và cộng sự (2017). Các bước:

1. Trích xuất đặc trưng Inception-v3 (2048-D) cho N ảnh thật và N ảnh được sinh.
2. Khớp một Gaussian với mỗi tập: tính trung bình $\mu_r, \mu_g$ và hiệp phương sai $\Sigma_r, \Sigma_g$.
3. $\text{FID} = \lVert \mu_r - \mu_g \rVert^2 + \mathop{\mathrm{Tr}}\left(\Sigma_r + \Sigma_g - 2 \cdot (\Sigma_r \cdot \Sigma_g)^{0.5}\right)$.

Diễn giải: khoảng cách Fréchet giữa hai Gaussian đa biến trong không gian đặc trưng. Thấp hơn = các phân phối giống nhau hơn.

Các kiểu thất bại:
- **Bị chệch khi N nhỏ.** FID là bình phương trung bình trên phân phối đặc trưng — N nhỏ ước lượng thấp hiệp phương sai, cho FID thấp giả. Luôn dùng $N \ge 10{,}000$.
- **Phụ thuộc Inception.** Inception-v3 được huấn luyện trên ImageNet. Các miền xa ImageNet (khuôn mặt, nghệ thuật, ảnh văn bản) cho FID vô nghĩa. Dùng một bộ trích xuất đặc trưng riêng cho miền.
- **Thao túng.** Overfit tiên nghiệm Inception cho FID thấp mà không cải thiện chất lượng thị giác. Đánh bại nó bằng CMMD (bên dưới).

### CLIP score — prompt adherence

Radford và cộng sự (2021). Với một ảnh được sinh + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Lấy trung bình trên 30k ảnh được sinh → một vô hướng có thể so sánh giữa các mô hình.

Các kiểu thất bại:
- **Các điểm mù của chính CLIP.** CLIP suy luận kết hợp yếu ("một khối lập phương đỏ trên một hình cầu xanh" thường thất bại). Các mô hình có thể xếp hạng tốt về điểm CLIP mà không thực sự làm theo các prompt phức tạp.
- **Thiên lệch prompt ngắn.** Prompt ngắn có nhiều ảnh CLIP khớp hơn ngoài thực tế. Prompt dài hơn có điểm CLIP thấp hơn một cách máy móc.
- **Thao túng prompt.** Đưa "chất lượng cao, 4k, kiệt tác" vào prompt làm tăng điểm CLIP mà không cải thiện liên kết ảnh-văn bản.

CMMD (Jayasumana và cộng sự, 2024) khắc phục một số điều này: dùng đặc trưng CLIP thay vì Inception, độ sai khác trung bình tối đa thay vì Fréchet. Tốt hơn trong phát hiện những khác biệt chất lượng tinh vi.

### Human preference — the ground truth

Chọn một tập prompt. Sinh bằng mô hình A và mô hình B. Cho con người (hoặc một LLM giám khảo mạnh) xem các cặp. Tổng hợp các chiến thắng thành một điểm Elo hoặc Bradley-Terry. Các benchmark:

- **PartiPrompts (Google)**: 1,600 prompt đa dạng, 12 loại.
- **HPSv2**: 107k chú giải của con người, được dùng rộng rãi làm đại diện tự động.
- **ImageReward**: 137k cặp sở thích prompt-ảnh, giấy phép MIT.
- **PickScore**: được huấn luyện trên 2.6M sở thích Pick-a-Pic.
- **Các đấu trường ảnh kiểu Chatbot-Arena**: https://imagearena.ai/ và những nơi khác.

Các kiểu thất bại:
- **Phương sai giám khảo.** Người không chuyên có sở thích khác chuyên gia. Dùng cả hai.
- **Phân phối prompt.** Prompt được chọn có lợi thiên vị một họ. Luôn ghi lại.
- **Reward hacking giám khảo LLM.** Giám khảo GPT-4 bị đánh lừa bởi các đầu ra đẹp nhưng sai. Đối chiếu với con người.

## Use together

Một báo cáo đánh giá production nên bao gồm:

1. FID trên 10-30k mẫu so với một phân phối thật giữ lại (chất lượng mẫu).
2. Điểm CLIP / CMMD trên cùng các mẫu so với prompt của chúng (bám sát).
3. Tỷ lệ thắng trong một đấu trường mù so với mô hình trước (sở thích tổng thể).
4. Phân tích kiểu thất bại: 50 đầu ra được lấy mẫu ngẫu nhiên, được đánh dấu các vấn đề đã biết (giải phẫu bàn tay, kết xuất văn bản, số lượng vật thể nhất quán).

Bất kỳ thước đo đơn lẻ nào cũng là một lời nói dối. Ba thước đo xác nhận lẫn nhau + rà soát định tính là một tuyên bố.

```figure
gx-fid-distributions
```

## Build It

`code/main.py` triển khai FID, dạng điểm CLIP và tổng hợp Elo trên các "vector đặc trưng" tổng hợp (chúng ta dùng các vector 4-D thay cho đặc trưng Inception). Bạn thấy:

- Tính FID trên N nhỏ và trên N lớn — độ chệch.
- "Điểm CLIP" như độ tương đồng cosine giữa các tập đặc trưng.
- Quy tắc cập nhật Elo từ một luồng sở thích tổng hợp.

### Step 1: FID in four lines

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### Step 2: CLIP-style cosine-similarity

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### Step 3: Elo aggregation

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## Pitfalls

- **FID ở N=1000.** Heuristic không đáng tin dưới N=10k. Các bài báo báo cáo FID N thấp đang thao túng.
- **So sánh FID xuyên độ phân giải.** Việc đổi kích thước 299×299 của Inception thay đổi phân phối đặc trưng. Chỉ so sánh ở độ phân giải khớp nhau.
- **Báo cáo một seed.** Chạy tối thiểu 3 seed. Báo cáo độ lệch chuẩn.
- **Tăng điểm CLIP qua prompt âm.** Một số pipeline tăng CLIP bằng cách overfit prompt. Kiểm tra bão hòa thị giác.
- **Thiên lệch Elo do trùng lặp prompt.** Nếu cả hai mô hình đã thấy một prompt benchmark trong huấn luyện, Elo vô nghĩa. Dùng các tập prompt giữ lại.
- **Độ lệch đánh giá con người từ đám đông được trả tiền.** Người chú giải Prolific, MTurk thiên về trẻ hơn / thân thiện công nghệ. Kết hợp với các chuyên gia nghệ thuật/thiết kế được tuyển.

## Use It

Quy trình đánh giá production năm 2026:

| Trụ cột | Tối thiểu | Đề xuất |
|--------|---------|-------------|
| Chất lượng mẫu | FID trên 10k so với tập thật giữ lại | + CMMD trên 5k + FID trên tập con theo loại |
| Bám sát prompt | Điểm CLIP trên 30k | + HPSv2 + ImageReward + trả lời câu hỏi kiểu VQA |
| Sở thích | 200 cặp mù so với baseline | + 2000 cặp do con người đánh giá + giám khảo LLM + Chatbot Arena |
| Phân tích thất bại | 50 được đánh dấu thủ công | 500 được đánh dấu thủ công + bộ phân loại an toàn tự động |

Cả bốn trụ cột trong một báo cáo = tuyên bố. Bất kỳ một cái riêng lẻ = tiếp thị.

## Ship It

Lưu `outputs/skill-eval-report.md`. Skill nhận một checkpoint mô hình mới + baseline và xuất ra một kế hoạch đánh giá đầy đủ: kích thước mẫu, thước đo, các phép dò kiểu thất bại, tiêu chí phê duyệt.

## Exercises

1. **Dễ.** Chạy `code/main.py`. So sánh FID ở N=100 so với N=1000 trên cùng các phân phối tổng hợp. Báo cáo độ lớn độ chệch.
2. **Trung bình.** Triển khai CMMD từ các đặc trưng kiểu CLIP tổng hợp (xem Jayasumana và cộng sự, 2024 cho công thức). So sánh độ nhạy với các khác biệt chất lượng so với FID.
3. **Khó.** Tái lập thiết lập HPSv2: lấy 1000 cặp ảnh-prompt từ một tập con Pick-a-Pic, tinh chỉnh một bộ chấm điểm nhỏ dựa trên CLIP trên các sở thích, và đo mức đồng thuận của nó với một tập giữ lại.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| FID | "Khoảng cách Fréchet Inception" | Khoảng cách Fréchet của các phép khớp Gaussian với đặc trưng Inception thật so với được sinh. |
| CLIP score (Điểm CLIP) | "Độ tương đồng văn bản-ảnh" | Độ tương đồng cosine giữa embedding ảnh và văn bản CLIP. |
| CMMD | "Thứ thay thế FID" | MMD đặc trưng CLIP; ít chệch hơn, không giả định Gaussian. |
| IS | "Điểm Inception" | Exp KL(p(y|x) || p(y)); tương quan kém trên các mô hình hiện đại, đã nghỉ hưu. |
| HPSv2 / ImageReward / PickScore | "Các đại diện sở thích được học" | Các mô hình nhỏ được huấn luyện trên sở thích của con người; dùng làm giám khảo tự động. |
| Elo | "Xếp hạng cờ vua" | Tổng hợp Bradley-Terry của các chiến thắng theo cặp. |
| PartiPrompts | "Tập prompt benchmark" | 1,600 prompt do Google tuyển chọn trên 12 loại. |
| FD-DINO | "Thay thế tự giám sát" | FD dùng đặc trưng DINOv2; tốt hơn cho các miền ngoài ImageNet. |

## Production note: evaluation is an inference workload too

Chạy FID trên 10k mẫu nghĩa là sinh 10k ảnh. Với một mô hình cơ sở SDXL 50 bước ở 1024² trên một L4, đó là ~11 giờ suy luận từng yêu cầu. Ngân sách đánh giá là thực, và cách đặt vấn đề chính là kịch bản suy luận ngoại tuyến (tối đa hóa thông lượng, bỏ qua TTFT):

- **Gom batch mạnh tay, quên độ trễ.** Đánh giá ngoại tuyến = gom batch tĩnh ở kích thước lớn nhất vừa bộ nhớ. `pipe(...).images` với `num_images_per_prompt=8` trên một H100 80GB chạy nhanh hơn 4-6× theo thời gian thực so với từng yêu cầu.
- **Cache các đặc trưng thật.** Trích xuất đặc trưng Inception (FID) hoặc CLIP (điểm CLIP, CMMD) trên tập tham chiếu thật được chạy *một lần*, lưu thành một `.npz`. Đừng tính lại cho mỗi lần đánh giá.

Cho các cổng CI / hồi quy: chạy FID + điểm CLIP trên một tập con 500 mẫu mỗi PR (~30 phút); chạy FID 10k đầy đủ + HPSv2 + Elo mỗi đêm.

## Further Reading

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) — bài báo FID.
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) — CMMD.
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) — CLIP.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) — HPSv2.
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) — ImageReward.
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) — PartiPrompts.
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) — khảo sát các kiểu thất bại.
