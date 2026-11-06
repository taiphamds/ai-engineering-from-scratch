# Instruction-Following as Alignment Signal

> Mọi phê bình RLHF về sau đều lập luận phản đối pipeline này. Trước khi nghiên cứu cách áp lực tối ưu hóa làm méo một đại diện, bạn phải thấy đại diện đó. InstructGPT (Ouyang và cộng sự, 2022) xác định kiến trúc tham chiếu: tinh chỉnh có giám sát trên các cặp chỉ dẫn-phản hồi, một mô hình phần thưởng được huấn luyện trên xếp hạng ưu tiên theo cặp, và PPO đối với mô hình phần thưởng với hình phạt KL so với chính sách SFT. Một InstructGPT 1.3B được ưa thích hơn GPT-3 175B. Chỉ riêng kết quả đó là lý do mọi phòng thí nghiệm tiên tiến hàng đầu năm 2026 vẫn cung cấp pipeline hậu huấn luyện mang hình dạng RLHF.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 minutes

## Learning Objectives

- Nêu ba giai đoạn của pipeline InstructGPT và hàm mất mát dùng trong mỗi giai đoạn.
- Giải thích tại sao mô hình 1.3B được tinh chỉnh theo chỉ dẫn thắng GPT-3 175B thô trên đánh giá ưu tiên của con người.
- Nêu hình phạt KL trong giai đoạn 3 bảo vệ chống lại điều gì và tại sao loại bỏ nó dẫn đến sụp đổ vào hành vi tìm mode.
- Mô tả thuế căn chỉnh và biện pháp giảm thiểu PPO-ptx mà Ouyang và cộng sự dùng để chống lại nó.

## The Problem

Mô hình ngôn ngữ tiền huấn luyện hoàn thành văn bản. Chúng không trả lời câu hỏi. Yêu cầu GPT-3 "viết một hàm Python đảo ngược một danh sách" và bạn thường nhận lại một prompt khác, vì phần lớn phân phối huấn luyện là văn bản web tiếp tục bằng thêm văn bản web. Mô hình đang làm công việc của nó — công việc đó sai.

Đại diện mà mọi phòng thí nghiệm nghiêm túc dùng để sửa điều này là ưu tiên của con người. Hai phần hoàn thành đến người đánh giá; người đánh giá chọn phần tốt hơn; một mô hình phần thưởng học người đánh giá. Sau đó một vòng lặp RL dịch chuyển chính sách về phía đầu ra mà mô hình phần thưởng chấm cao. Đó là toàn bộ luận điểm InstructGPT trong ba câu. Phần còn lại của bài báo là kỹ thuật.

## The Concept

### Stage 1: supervised fine-tuning (SFT)

Thu thập các cặp prompt-phản hồi trong đó phản hồi là điều một người có thiện ý sẽ viết. Ouyang và cộng sự dùng 13k prompt từ người gắn nhãn và API OpenAI. Tinh chỉnh mô hình nền trên dữ liệu này bằng hàm mất mát cross-entropy tiêu chuẩn.

SFT mang lại cho bạn điều gì: mô hình giờ trả lời câu hỏi thay vì tiếp tục chúng. Nó không mang lại điều gì: bất kỳ tín hiệu nào về câu trả lời người đánh giá thích hơn khi nhiều câu đều hợp lý.

### Stage 2: reward model (RM)

Với mỗi prompt, lấy mẫu K phần hoàn thành từ mô hình SFT. Một người gắn nhãn xếp hạng chúng. Huấn luyện một mô hình phần thưởng chấm điểm bất kỳ cặp prompt-phản hồi nào sao cho, với các cặp mà `y_w` được ưa thích hơn `y_l`:

```math
L_{\text{RM}} = -\log \sigma\big(r(x, y_w) - r(x, y_l)\big)
```

Đây là hàm mất mát ưu tiên theo cặp Bradley-Terry. RM thường được khởi tạo từ mô hình SFT với đầu LM được thay bằng đầu vô hướng.

Mô hình phần thưởng nhỏ: 6B đã đủ cho InstructGPT 175B. Chúng cũng mong manh — phần 5 của bài báo chủ yếu về hành vi khai thác phần thưởng xuất hiện ở quy mô nhỏ.

### Stage 3: PPO with a KL penalty

Xác định mục tiêu:

```math
J(\pi) = \mathbb{E}_{x \sim D,\, y \sim \pi(\cdot \mid x)} \big[ r(x, y) \big] - \beta \, \mathrm{KL}\big(\pi(\cdot \mid x) \,\|\, \pi_{\text{SFT}}(\cdot \mid x)\big)
```

Tối đa hóa bằng PPO. Số hạng KL giữ `pi` không trôi xa chính sách SFT. Không có nó, bộ tối ưu tìm ra ví dụ đối kháng — các chuỗi được RM chấm cao vì RM chưa từng thấy chúng, không phải vì con người thực sự ưa thích chúng.

Hệ số KL `beta` là siêu tham số RLHF quan trọng nhất. Quá thấp: khai thác phần thưởng. Quá cao: không cải thiện so với SFT.

### The alignment tax

Sau RLHF, mô hình được con người ưa thích hơn nhưng suy giảm trên các phép đo chuẩn tiêu chuẩn (SQuAD, HellaSwag, DROP). Ouyang và cộng sự gọi đây là thuế căn chỉnh và sửa bằng PPO-ptx: trộn gradient tiền huấn luyện vào mục tiêu RL để mô hình không quên cách làm tác vụ hạ nguồn mà nó chưa bao giờ được thưởng.

```math
J_{\text{ptx}}(\pi) = J(\pi) + \gamma \, \mathbb{E}_{x \sim D_{\text{pretrain}}} \big[ \log \pi(x) \big]
```

PPO-ptx trở thành tiêu chuẩn. Anthropic, DeepMind và Meta đều dùng một biến thể nào đó.

### The result

Một InstructGPT 1.3B (SFT + RM + PPO-ptx) được người gắn nhãn ưa thích hơn GPT-3 nền 175B khoảng 70% số lần. Khoảng cách rộng hơn trên prompt kiểm thử ẩn từ lưu lượng sản xuất. Hai điều rút ra từ con số này:

1. Căn chỉnh là một trục khác với năng lực. Mô hình 175B có nhiều năng lực hơn; mô hình 1.3B có nhiều căn chỉnh hơn; người gắn nhãn ưa thích mô hình được căn chỉnh.
2. Sàn năng lực do mô hình nền đặt ra. Bạn không thể dùng RLHF khiến mô hình nền biết những sự thật nó chưa từng thấy.

### Why this is the reference point for Phase 18

Mọi phê bình trong các bài sau — khai thác phần thưởng (Bài 2), DPO (Bài 3), xu nịnh (Bài 4), CAI (Bài 5), agent ngủ ngầm (Bài 7), giả vờ căn chỉnh (Bài 9) — đều lập luận phản đối một phần của pipeline này. Khai thác phần thưởng tấn công giai đoạn 2. DPO gộp giai đoạn 2 và 3. CAI thay người gắn nhãn. Xu nịnh cho thấy người gắn nhãn là tín hiệu thiên lệch. Giả vờ căn chỉnh cho thấy chính sách có thể hoàn toàn đi vòng qua giai đoạn 3. Bạn không thể theo được bất kỳ phê bình nào trong số này nếu trước tiên không có pipeline trong đầu.

```figure
al-instruct-pipeline
```

## Use It

`code/main.py` mô phỏng ba giai đoạn trên dữ liệu ưu tiên đơn giản. "Chính sách" nền là một đồng xu thiên lệch trên các hành động {A, B, C}. SFT giai đoạn 1 bắt chước hành động người gắn nhãn trên 200 prompt. Giai đoạn 2 khớp mô hình phần thưởng Bradley-Terry từ 500 xếp hạng theo cặp. Giai đoạn 3 chạy cập nhật PPO giản lược với hình phạt KL so với chính sách SFT. Bạn có thể quan sát phần thưởng tăng, phân kỳ KL tăng và chính sách trôi — và bạn có thể tắt số hạng KL để thấy khai thác phần thưởng xuất hiện trong vòng 50 bước cập nhật.

Cần quan sát gì:

- Quỹ đạo phần thưởng với `beta = 0.1` so với `beta = 0.0`.
- $\mathrm{KL}(\pi \Vert \pi_{\text{SFT}})$ theo các bước huấn luyện.
- Phân phối hành động cuối so với ưu tiên của người gắn nhãn.

## Ship It

Bài học này tạo ra `outputs/skill-instructgpt-explainer.md`. Với mô tả pipeline RLHF hoặc tóm tắt bài báo, nó xác định giai đoạn nào trong ba giai đoạn đang được sửa đổi, hàm mất mát nào được dùng ở mỗi giai đoạn và có hình phạt KL hoặc bộ điều chuẩn tương đương hay không.

## Exercises

1. Chạy `code/main.py`. Đặt `beta = 0.0` và báo cáo phân phối hành động sau 200 bước PPO. Giải thích hành vi tìm mode trong một đoạn văn.

2. Sửa mô hình phần thưởng để có độ lệch +0.5 cho hành động B (một lỗi phần thưởng được mô phỏng). Chạy PPO với `beta = 0.1`. Hình phạt KL có ngăn chính sách khai thác độ lệch không? Ở `beta` nào việc khai thác trở nên nhìn thấy được?

3. Đọc Hình 1 của Ouyang và cộng sự (arXiv:2203.02155). Tái tạo đường cong ưu tiên người gắn nhãn bằng cách chạy PPO trong 1, 5, 20, 100 bước và đo ưu tiên so với mô hình SFT.

4. Phần 4.3 của bài báo báo cáo InstructGPT 1.3B thắng GPT-3 175B khoảng 70% số lần. Tại sao tỷ lệ cao hơn trên prompt sản xuất ẩn so với prompt của chính người gắn nhãn?

5. Thay hàm mất mát PPO bằng DPO (Giai đoạn 10 · 08) trên cùng dữ liệu ưu tiên. So sánh độ trôi chính sách cuối (KL so với SFT) và phần thưởng cuối. Phương pháp nào trôi xa hơn ở phần thưởng tương đương?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| SFT | "tinh chỉnh theo chỉ dẫn" | Giai đoạn 1: tinh chỉnh cross-entropy trên cặp prompt-phản hồi |
| Reward model (Mô hình phần thưởng) | "RM" | Bộ hồi quy vô hướng trên (prompt, phản hồi) được huấn luyện bằng Bradley-Terry trên nhãn theo cặp |
| Bradley-Terry | "hàm mất mát ưu tiên theo cặp" | $-\log \sigma(r_w - r_l)$; quy việc xếp hạng theo cặp về phân loại nhị phân |
| KL penalty (Hình phạt KL) | "bộ điều chuẩn" | `beta * KL(pi \|\| pi_SFT)` — giữ chính sách RL gần điểm neo SFT |
| PPO-ptx | "PPO có trộn tiền huấn luyện" | Thêm một phần log-likelihood tiền huấn luyện vào mục tiêu PPO để bù thuế căn chỉnh |
| Alignment tax (Thuế căn chỉnh) | "suy giảm RLHF" | Sụt giảm sau RLHF trên phép đo chuẩn tiêu chuẩn mà RLHF không nhắm đến |
| Labeler preference (Ưu tiên của người gắn nhãn) | "sự thật nền" | Mẫu xếp hạng của con người; RM là đại diện thống kê cho điều này, không phải cho "giá trị con người" |

## Further Reading

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) — bài báo InstructGPT, nền tảng cho mọi pipeline RLHF theo sau
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) — tiền thân RLHF cho tóm tắt
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) — công thức RL dựa trên ưu tiên ban đầu
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) — phần mở rộng HH của Anthropic cho pipeline InstructGPT
