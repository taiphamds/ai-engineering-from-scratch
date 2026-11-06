# Reward Modeling & RLHF

> Con người không thể viết một hàm phần thưởng cho "phản hồi trợ lý tốt," nhưng họ có thể so sánh hai phản hồi và chọn cái tốt hơn. Khớp một mô hình phần thưởng với các so sánh đó, rồi huấn luyện RL mô hình ngôn ngữ theo nó. Christiano 2017. InstructGPT 2022. Công thức đã biến GPT-3 thành ChatGPT. Vào năm 2026 nó phần lớn đang được DPO thay thế — nhưng mô hình tư duy vẫn còn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 minutes

## The Problem

Bạn đã huấn luyện một mô hình ngôn ngữ trên mục tiêu dự đoán token tiếp theo. Nó viết tiếng Anh đúng ngữ pháp. Nó cũng nói dối, lan man và từ chối việc từ chối. Bạn không thể sửa điều này bằng thêm huấn luyện trước — văn bản web là vấn đề, không phải phương thuốc.

Bạn muốn một *phần thưởng vô hướng* nói rằng "phản hồi A tốt hơn phản hồi B cho chỉ dẫn X." Viết tay hàm phần thưởng đó là không thể. "Tính hữu ích" không phải một biểu thức dạng đóng trên token. Nhưng con người có thể so sánh hai đầu ra và đánh dấu một sở thích. Điều đó thu thập rẻ ở quy mô lớn.

RLHF (Christiano và cộng sự 2017; Ouyang và cộng sự 2022) chuyển sở thích thành một mô hình phần thưởng, rồi tối ưu LM bằng PPO theo phần thưởng đó. Trong ba bước: SFT → RM → PPO. Đó là công thức đã đưa ChatGPT, Claude, Gemini và mọi LLM được căn chỉnh khác đến người dùng trong 2023–2025.

Vào năm 2026 bước PPO phần lớn được thay bằng DPO (Giai đoạn 10 · 08) vì nó rẻ hơn và gần tốt bằng cho tinh chỉnh căn chỉnh. Nhưng phần *mô hình phần thưởng* vẫn làm nền tảng cho mọi bộ lấy mẫu Best-of-N, mọi pipeline RL từ phần thưởng có thể xác minh, và mọi mô hình suy luận dùng mô hình phần thưởng quá trình. Hiểu RLHF và bạn hiểu toàn bộ bộ công cụ căn chỉnh.

## The Concept

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Giai đoạn 1: Tinh chỉnh có giám sát (SFT).** Bắt đầu từ một mô hình cơ sở được huấn luyện trước. Tinh chỉnh trên các minh họa hành vi mục tiêu do con người viết (phản hồi tuân theo chỉ dẫn, trả lời hữu ích, v.v.). Kết quả: một mô hình $\pi_{\text{SFT}}$ *thiên về hành vi tốt* nhưng vẫn có một không gian hành động không bị chặn.

**Giai đoạn 2: Huấn luyện mô hình phần thưởng.**

- Thu thập các cặp phản hồi $(y_+, y_-)$ cho các prompt $x$, được con người gán nhãn là "y_+ được ưa thích hơn y_-."
- Huấn luyện một mô hình phần thưởng $R_\phi(x, y)$ để gán điểm cao hơn cho $y_+$.
- Hàm mất mát: **logistic theo cặp Bradley-Terry**:

  $L(\phi) = -\mathbb{E}[ \log \sigma(R_\phi(x, y_+) - R_\phi(x, y_-)) ]$

  $\sigma$ là sigmoid. Hiệu phần thưởng ngụ ý một log-odds của sở thích. BT là tiêu chuẩn từ năm 1952 (Bradley-Terry) và là lựa chọn chi phối trong RLHF hiện đại.

- $R_\phi$ thường được khởi tạo từ mô hình SFT với một head vô hướng ở trên. Cùng backbone transformer; một lớp tuyến tính duy nhất xuất ra phần thưởng.

**Giai đoạn 3: PPO theo RM với phạt KL.**

- Khởi tạo chính sách có thể huấn luyện $\pi_\theta$ từ $\pi_{\text{SFT}}$. Giữ một *tham chiếu* đóng băng $\pi_{\text{ref}} = \pi_{\text{SFT}}$.
- Phần thưởng ở cuối một phản hồi $y$:

  $r_{\text{total}}(x, y) = R_\phi(x, y) - \beta \cdot \mathrm{KL}(\pi_\theta(\cdot \mid x) \Vert \pi_{\text{ref}}(\cdot \mid x))$

  Khoản phạt KL ngăn $\pi_\theta$ trôi tùy ý khỏi $\pi_{\text{SFT}}$ — nó là một *regularizer*, không phải một miền tin cậy cứng. $\beta$ thường là 0.01-0.05.
- Chạy PPO (Bài 08) với phần thưởng này. Lợi thế được tính trên quỹ đạo cấp token, nhưng RM chỉ chấm điểm toàn bộ phản hồi.

**Vì sao KL?** Không có nó, PPO sẽ vui vẻ tìm các chiến lược reward-hacking — RM chỉ được huấn luyện trên các phần hoàn thành trong phân phối. Một phản hồi ngoài phân phối có thể đạt điểm cao hơn bất kỳ phản hồi nào do con người viết. KL giữ $\pi_\theta$ gần đa tạp nơi RM đã được huấn luyện. Nó là nút điều chỉnh quan trọng nhất trong RLHF.

**Tình trạng năm 2026:**

- **DPO** (Rafailov 2023): đại số dạng đóng gộp Giai đoạn 2+3 thành một hàm mất mát có giám sát duy nhất trên dữ liệu sở thích. Không RM, không PPO. Cùng chất lượng trên các benchmark căn chỉnh với một phần nhỏ tính toán. Được trình bày trong Giai đoạn 10 · 08.
- **GRPO** (DeepSeek 2024–2025): PPO với một baseline tương đối theo nhóm thay cho critic, phần thưởng từ một *bộ xác minh* (mã chạy / đáp án toán khớp) thay cho một RM được con người huấn luyện. Chi phối các mô hình suy luận. Được trình bày trong Giai đoạn 9 · 12.
- **Mô hình phần thưởng quá trình (PRM):** chấm điểm các lời giải một phần (mỗi bước suy luận), được dùng trong cả các biến thể RLHF và GRPO cho suy luận.
- **Constitutional AI / RLAIF:** dùng một LLM được căn chỉnh để sinh sở thích thay cho con người. Mở rộng quy mô ngân sách sở thích.

```figure
reward-model
```

## Build It

Bài học này dùng các "prompt" và "phản hồi" tổng hợp nhỏ được biểu diễn thành chuỗi. RM là một bộ chấm điểm tuyến tính trên một biểu diễn túi token. Không LLM thực — *cấu trúc* của pipeline quan trọng, không phải quy mô. Xem `code/main.py`.

### Step 1: synthetic preference data

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

Trong RLHF thực, điều này được thay bằng người gán nhãn. Cấu trúc — `(prompt, preferred_response, rejected_response)` — giống hệt.

### Step 2: Bradley-Terry reward model

Điểm tuyến tính: `R(x, y) = w · bag(y)`. Huấn luyện để tối thiểu hóa hàm mất mát log theo cặp BT:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

Sau vài trăm cập nhật, `w` gán trọng số dương cho các token từ tốt và âm cho các token từ xấu.

### Step 3: PPO-like policy on top of RM

Chính sách đồ chơi của chúng ta tạo ra một token duy nhất từ một từ vựng. Chúng ta chấm điểm token theo RM, tính $\log \pi_\theta(\text{token} \mid \text{prompt})$, thêm một khoản phạt KL đến tham chiếu, và áp dụng mục tiêu thay thế PPO được cắt.

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # ppo-style update on theta, treating reward as the return
    ...
```

### Step 4: monitor the KL

Theo dõi trung bình $\mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$ sau mỗi lần cập nhật. Nếu nó tăng dần vượt `~5-10` (KL theo phản hồi tính bằng nat, được cộng trên các token, đơn vị mà TRL ghi log), chính sách đã trôi xa khỏi $\pi_{\text{SFT}}$: hoặc $\beta$ quá thấp (tăng nó để kéo chính sách trở lại) hoặc reward hacking đang bắt đầu. Đây là phép chẩn đoán hàng đầu trong RLHF thực tế.

### Step 5: the production recipe with TRL

Khi bạn hiểu pipeline đồ chơi, đây là cùng vòng lặp như một người dùng thư viện thực viết. [TRL](https://huggingface.co/docs/trl) của Hugging Face là triển khai tham chiếu — `RewardTrainer` cho Giai đoạn 2 và `PPOTrainer` (với KL đến tham chiếu tích hợp sẵn) cho Giai đoạn 3.

```python
# Stage 2: reward model from pairwise preferences
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3: PPO against the RM with KL penalty to the SFT reference
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats includes: mean_kl, clip_frac, value_loss — the three PPO diagnostics
```

Ba điều thư viện làm cho bạn. `adap_kl_ctrl=True` triển khai lịch β thích nghi: nếu KL quan sát được vượt `target_kl`, β tăng gấp đôi; nếu dưới một nửa, β giảm một nửa. Mô hình tham chiếu được đóng băng theo quy ước — bạn không được vô tình chia sẻ tham số với `policy`. Và head giá trị nằm trên cùng backbone với chính sách (`AutoModelForCausalLMWithValueHead` gắn một head MLP vô hướng), đó là lý do TRL báo cáo `policy/kl` và `value/loss` riêng.

## Pitfalls

- **Tối ưu quá mức / reward hacking.** RM không hoàn hảo; $\pi_\theta$ tìm các phần hoàn thành đối kháng đạt điểm cao nhưng xấu. Triệu chứng: phần thưởng tăng vô hạn trong khi điểm đánh giá con người chững lại hoặc giảm. Cách khắc phục: dừng sớm, tăng $\beta$, mở rộng dữ liệu huấn luyện RM.
- **Thao túng độ dài.** Các RM được huấn luyện trên phản hồi hữu ích thường ngầm thưởng độ dài. Chính sách học kéo dài phản hồi. Khắc phục: phần thưởng chuẩn hóa theo độ dài, hoặc RLAIF với một RM nhận biết độ dài.
- **RM quá nhỏ.** RM cần ít nhất lớn bằng chính sách. Một RM nhỏ không thể chấm điểm trung thực các đầu ra của chính sách.
- **Điều chỉnh KL.** β quá thấp → trôi và reward hacking. β quá cao → chính sách hầu như không đổi. Thủ thuật tiêu chuẩn là một β *thích nghi* nhắm một KL cố định mỗi bước.
- **Nhiễu dữ liệu sở thích.** ~30% nhãn con người nhiều nhiễu hoặc mơ hồ. Hiệu chuẩn bằng cách huấn luyện RM trên dữ liệu được lọc theo đồng thuận hoặc dùng một temperature trên BT.
- **Vấn đề off-policy.** Dữ liệu PPO hơi off-policy sau epoch đầu. Theo dõi tỷ lệ cắt như trong Bài 08.

## Use It

RLHF năm 2026 được phân lớp:

| Lớp | Mục tiêu | Phương pháp |
|-------|--------|--------|
| Tuân theo chỉ dẫn, hữu ích, vô hại | Căn chỉnh | DPO (Giai đoạn 10 · 08) được ưu tiên hơn RLHF-PPO. |
| Tính đúng đắn suy luận (toán, mã) | Năng lực | GRPO với phần thưởng bộ xác minh (Giai đoạn 9 · 12). |
| Tác vụ nhiều bước chân trời dài | Có tính agent | PPO / GRPO với mô hình phần thưởng quá trình trên các bước. |
| An toàn / hành vi từ chối | An toàn | RLHF-PPO với RM an toàn riêng, hoặc Constitutional AI. |
| Best-of-N khi suy luận | Căn chỉnh nhanh | Dùng RM lúc giải mã; không cần huấn luyện chính sách. |
| Chưng cất phần thưởng | Tính toán suy luận | Huấn luyện một "head phần thưởng" nhỏ trên một LM đóng băng. |

RLHF là *phương pháp* trong 2022–2024. Vào năm 2026, các pipeline căn chỉnh production ưu tiên DPO, chỉ dùng PPO cho các bước cần nhiều RM hoặc quan trọng về an toàn.

## Ship It

Lưu thành `outputs/skill-rlhf-architect.md`:

```markdown
---
name: rlhf-architect
description: Design an RLHF / DPO / GRPO alignment pipeline for a language model, including RM, KL, and data strategy.
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

Given a base LM, a target behavior (alignment / reasoning / refusal / agent), and a preference or verifier budget, output:

1. Stage. SFT? RM? DPO? GRPO? With justification.
2. Preference or verifier source. Humans, AI feedback, rule-based, unit-test-pass, or reward distillation.
3. KL strategy. Fixed β, adaptive β, or DPO (implicit KL).
4. Diagnostics. Mean KL, reward stability, over-optimization guard (holdout human eval).
5. Safety gate. Red-team set, refusal rate, safety RM separate from helpfulness RM.

Refuse to ship RLHF-PPO without a KL monitor. Refuse to use an RM smaller than the target policy. Refuse length-only rewards. Flag any pipeline that does not hold back a blind human-eval set as lacking over-optimization protection.
```

## Exercises

1. **Dễ.** Huấn luyện mô hình phần thưởng Bradley-Terry trong `code/main.py` trên 500 cặp sở thích tổng hợp. Đo độ chính xác theo cặp trên 100 cặp giữ lại. Nên vượt 90%.
2. **Trung bình.** Chạy vòng lặp PPO-RLHF đồ chơi với $\beta \in \lbrace 0.0, 0.1, 1.0 \rbrace$. Với mỗi trường hợp, vẽ điểm RM theo KL đến tham chiếu qua các cập nhật. Những lần chạy nào reward-hack?
3. **Khó.** Triển khai DPO (hàm mất mát likelihood sở thích dạng đóng) trên cùng dữ liệu sở thích và so sánh với pipeline RLHF-PPO về tính toán đã dùng và điểm RM cuối cùng đạt được.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| RLHF | "RL căn chỉnh" | Pipeline ba giai đoạn SFT + RM + PPO (Christiano 2017, Ouyang 2022). |
| Reward Model (RM) (Mô hình phần thưởng) | "Mạng chấm điểm" | Hàm vô hướng được học khớp với các sở thích theo cặp qua Bradley-Terry. |
| Bradley-Terry | "Hàm mất mát logistic theo cặp" | $P(y_+ \succ y_-) = \sigma(R(y_+) - R(y_-))$; mục tiêu RM tiêu chuẩn. |
| KL penalty (Phạt KL) | "Ở gần tham chiếu" | $\beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$ trong phần thưởng; bộ regularization chống reward-hacking. |
| Reward hacking (Thao túng phần thưởng) | "Định luật Goodhart" | Chính sách khai thác khuyết điểm RM; triệu chứng: phần thưởng tăng, đánh giá con người đi ngang. |
| RLAIF | "Sở thích do AI gán nhãn" | RLHF trong đó nhãn đến từ một LM khác thay vì con người. |
| PRM | "Mô hình phần thưởng quá trình" | Chấm điểm các bước suy luận một phần; dùng trong các pipeline suy luận. |
| Constitutional AI | "Phương pháp của Anthropic" | Sở thích do AI sinh được hướng dẫn bằng các quy tắc tường minh. |

## Further Reading

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) — bài báo khởi đầu RLHF.
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — công thức đằng sau ChatGPT.
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) — RLHF trước đó cho tóm tắt.
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) — DPO; mặc định sau RLHF vào năm 2026.
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) — RLAIF và vòng lặp tự phê bình.
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) — bài báo HH.
- [Hugging Face TRL library](https://huggingface.co/docs/trl) — `RewardTrainer` và `PPOTrainer` production. Đọc nguồn trainer để biết chi tiết KL thích nghi và head giá trị.
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf) của Lambert, Castricato, von Werra, Havrilla — hướng dẫn chuẩn về pipeline ba giai đoạn với sơ đồ.
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) — thư viện; `examples/` có các script RLHF đầu cuối cho Llama, Mistral và Qwen.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) — góc nhìn giả thuyết phần thưởng; điều kiện tiên quyết thiết yếu để nghĩ về reward hacking.
