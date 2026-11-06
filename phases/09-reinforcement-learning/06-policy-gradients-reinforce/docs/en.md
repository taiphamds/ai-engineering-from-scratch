# Policy Gradient — REINFORCE from Scratch

> Ngừng ước lượng giá trị. Tham số hóa trực tiếp chính sách, tính gradient của lợi tức kỳ vọng, bước lên dốc. Williams (1992) viết nó trong một định lý. Đó là lý do PPO, GRPO và mọi vòng lặp RL cho LLM tồn tại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 03 (Monte Carlo), Phase 9 · 04 (TD Learning)
**Time:** ~75 minutes

## The Problem

Q-learning và DQN tham số hóa hàm *giá trị*. Bạn chọn hành động bằng `argmax Q`. Điều đó phù hợp cho hành động rời rạc và trạng thái rời rạc. Nó hỏng khi hành động liên tục (`argmax` nào trên một mô-men xoắn 10 chiều?) hoặc khi bạn muốn một chính sách ngẫu nhiên (`argmax` tất định theo cách xây dựng).

Gradient chính sách thay vào đó tham số hóa *chính sách*. $\pi_\theta(a \mid s)$ là một mạng nơ-ron xuất ra một phân phối trên các hành động. Lấy mẫu từ nó để hành động. Tính gradient của lợi tức kỳ vọng theo $\theta$. Bước lên dốc. Không `argmax`. Không đệ quy Bellman. Chỉ gradient ascent trên $J(\theta) = \mathbb E_{\pi_\theta}[G]$.

Định lý REINFORCE (Williams 1992) cho bạn biết gradient này tính được: $\nabla J(\theta) = \mathbb E_\pi[ G \cdot \nabla_\theta \log \pi_\theta(a \mid s) ]$. Chạy một episode. Tính lợi tức. Nhân với $\nabla \log \pi_\theta(a \mid s)$ ở mỗi bước. Lấy trung bình. Gradient-ascent. Xong.

Mọi thuật toán LLM-RL năm 2026 — PPO, DPO, GRPO — đều là một cải tiến của REINFORCE. Hiểu nó đến mức thuần tay là điều kiện tiên quyết cho phần còn lại của giai đoạn này, và cho Giai đoạn 10 · 07 (triển khai RLHF) và Giai đoạn 10 · 08 (DPO).

## The Concept

![Policy gradient: softmax policy, log-π gradient, return-weighted update](../assets/policy-gradient.svg)

**Định lý gradient chính sách.** Với bất kỳ chính sách $\pi_\theta$ nào được tham số hóa bởi $\theta$:

```math
\nabla J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[ \sum_{t=0}^{T} G_t \cdot \nabla_\theta \log \pi_\theta(a_t \mid s_t) ]
```

trong đó $G_t = \sum_{k=t}^{T} \gamma^{k-t} r_{k+1}$ là lợi tức chiết khấu từ bước $t$. Kỳ vọng được lấy trên các quỹ đạo đầy đủ $\tau$ được lấy mẫu từ $\pi_\theta$.

**Chứng minh ngắn.** Lấy đạo hàm $J(\theta) = \sum_\tau P(\tau; \theta) G(\tau)$ dưới kỳ vọng. Dùng $\nabla P(\tau; \theta) = P(\tau; \theta) \nabla \log P(\tau; \theta)$ (thủ thuật đạo hàm log). Phân tích $\log P(\tau; \theta) = \sum \log \pi_\theta(a_t \mid s_t) + \text{environment terms that do not depend on } \theta$. Các hạng tử môi trường biến mất. Hai dòng đại số cho bạn định lý.

**Các thủ thuật giảm phương sai.** REINFORCE nguyên bản có phương sai khủng khiếp — lợi tức nhiều nhiễu, $\nabla \log \pi$ nhiều nhiễu, tích của chúng rất nhiều nhiễu. Hai cách khắc phục tiêu chuẩn:

1. **Trừ baseline.** Thay $G_t$ bằng $G_t - b(s_t)$ cho bất kỳ baseline $b(s_t)$ nào không phụ thuộc $a_t$. Không chệch vì $\mathbb{E}[b(s_t) \cdot \nabla \log \pi(a_t \mid s_t)] = 0$. Lựa chọn điển hình: $b(s_t) = \hat{V}(s_t)$ được học bởi một critic → actor-critic (Bài 07).
2. **Reward-to-go.** Thay $\sum_t G_t \cdot \nabla \log \pi_\theta(a_t \mid s_t)$ bằng $\sum_t G_t^{\text{from } t} \cdot \nabla \log \pi_\theta(a_t \mid s_t)$. Chỉ các lợi tức tương lai quan trọng với một hành động cho trước — phần thưởng quá khứ đóng góp nhiễu trung bình bằng không.

Kết hợp lại, bạn có:

```math
\nabla J \approx (1/N) \sum_{i=1}^{N} \sum_{t=0}^{T_i} [ G_t^{(i)} - \hat{V}(s_t^{(i)}) ] \cdot \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)})
```

đó là REINFORCE với một baseline — tổ tiên trực tiếp của A2C (Bài 07) và PPO (Bài 08).

**Tham số hóa chính sách softmax.** Với hành động rời rạc, lựa chọn tiêu chuẩn:

```math
\pi_\theta(a \mid s) = \exp(f_\theta(s, a)) / \sum_{a'} \exp(f_\theta(s, a'))
```

trong đó $f_\theta$ là bất kỳ mạng nơ-ron nào xuất ra một điểm cho mỗi hành động. Gradient có một dạng rõ ràng:

```math
\nabla_\theta \log \pi_\theta(a \mid s) = \nabla_\theta f_\theta(s, a) - \sum_{a'} \pi_\theta(a' \mid s) \nabla_\theta f_\theta(s, a')
```

tức là, điểm của hành động đã thực hiện trừ giá trị kỳ vọng của nó theo chính sách.

**Chính sách Gaussian cho hành động liên tục.** $\pi_\theta(a \mid s) = N(\mu_\theta(s), \sigma_\theta(s))$. $\nabla \log N(a; \mu, \sigma)$ có một dạng đóng. Đó là tất cả những gì SAC ở Giai đoạn 9 · 07 cần.

```figure
policy-gradient-landscape
```

## Build It

### Step 1: softmax policy network

```python
def policy_logits(theta, state_features):
    return [dot(theta[a], state_features) for a in range(N_ACTIONS)]

def softmax(logits):
    m = max(logits)
    exps = [exp(l - m) for l in logits]
    Z = sum(exps)
    return [e / Z for e in exps]
```

Dùng một chính sách tuyến tính (một vector trọng số mỗi hành động) cho một môi trường dạng bảng. Với Atari, thay vào một CNN và giữ head softmax.

### Step 2: sampling and log-probability

```python
def sample_action(probs, rng):
    x = rng.random()
    cum = 0
    for a, p in enumerate(probs):
        cum += p
        if x <= cum:
            return a
    return len(probs) - 1

def log_prob(probs, a):
    return log(probs[a] + 1e-12)
```

### Step 3: rollout with log-probs captured

```python
def rollout(theta, env, rng, gamma):
    trajectory = []
    s = env.reset()
    while not done:
        logits = policy_logits(theta, s)
        probs = softmax(logits)
        a = sample_action(probs, rng)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r, probs))
        s = s_next
    return trajectory
```

### Step 4: REINFORCE update

```python
def reinforce_step(theta, trajectory, gamma, lr, baseline=0.0):
    returns = compute_returns(trajectory, gamma)
    for (s, a, _, probs), G in zip(trajectory, returns):
        advantage = G - baseline
        grad_log_pi_a = [-p for p in probs]
        grad_log_pi_a[a] += 1.0
        for i in range(N_ACTIONS):
            for j in range(len(s)):
                theta[i][j] += lr * advantage * grad_log_pi_a[i] * s[j]
```

Gradient $\nabla \log \pi(a \mid s) = e_a - \pi(\cdot \mid s)$ (onehot của $a$ trừ các xác suất) là trái tim của gradient chính sách softmax. Khắc nó vào trí nhớ cơ bắp.

### Step 5: baselines

Một trung bình tích lũy của $G$ trên các episode gần đây đủ giảm phương sai để một GridWorld 4×4 hoạt động; nó mất ~500 episode để hội tụ. Nâng cấp baseline thành một $\hat{V}(s)$ được học và bạn có actor-critic.

## Pitfalls

- **Bùng nổ gradient.** Lợi tức có thể rất lớn. Luôn chuẩn hóa $G$ về `~N(0, 1)` trên batch trước khi nhân với $\nabla \log \pi$.
- **Sụp đổ entropy.** Chính sách hội tụ về một hành động gần tất định quá sớm, ngừng khám phá, bị kẹt. Cách khắc phục: thêm thưởng entropy $\beta \cdot H(\pi(\cdot \mid s))$ vào mục tiêu.
- **Phương sai cao.** REINFORCE nguyên bản cần hàng nghìn episode. Một baseline critic (Bài 07) hoặc miền tin cậy của TRPO/PPO (Bài 08) là cách khắc phục tiêu chuẩn.
- **Kém hiệu quả mẫu.** On-policy nghĩa là bạn vứt bỏ mọi chuyển tiếp sau một lần cập nhật. Hiệu chỉnh off-policy qua lấy mẫu quan trọng mang dữ liệu trở lại, với cái giá là phương sai (tỷ số của PPO là một trọng số IS được cắt).
- **Gradient phi dừng.** Cùng gradient từ 100 episode trước dùng $\pi$ cũ. Các phương pháp on-policy cập nhật mỗi vài rollout vì lý do này.
- **Gán công trạng.** Không có reward-to-go, các phần thưởng quá khứ đóng góp nhiễu. Luôn dùng reward-to-go.

## Use It

Vào năm 2026, REINFORCE hiếm khi được chạy trực tiếp nhưng công thức gradient của nó ở khắp nơi:

| Trường hợp sử dụng | Phương pháp suy ra |
|----------|---------------|
| Điều khiển liên tục | PPO / SAC với chính sách Gaussian |
| RLHF cho LLM | PPO với phạt KL, chạy trên chính sách cấp token |
| Suy luận LLM (DeepSeek) | GRPO — REINFORCE với baseline tương đối theo nhóm, không critic |
| Đa agent | REINFORCE với critic tập trung (MADDPG, COMA) |
| Robot học hành động rời rạc | A2C, A3C, PPO |
| Bối cảnh chỉ có sở thích | DPO — REINFORCE được viết lại thành một hàm mất mát likelihood sở thích, không lấy mẫu |

Khi bạn đọc `loss = -advantage * log_prob` trong một script huấn luyện năm 2026, đó là REINFORCE với một baseline. Toàn bộ các bài báo (DPO, GRPO, RLOO) là các thủ thuật giảm phương sai trên một dòng này.

## Ship It

Lưu thành `outputs/skill-policy-gradient-trainer.md`:

```markdown
---
name: policy-gradient-trainer
description: Produce a REINFORCE / actor-critic / PPO training config for a given task and diagnose variance issues.
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

Given an environment (discrete / continuous actions, horizon, reward stats), output:

1. Policy head. Softmax (discrete) or Gaussian (continuous) with parameter counts.
2. Baseline. None (vanilla), running mean, learned `V̂(s)`, or A2C critic.
3. Variance controls. Reward-to-go on by default, return normalization, gradient clip value.
4. Entropy bonus. Coefficient β and decay schedule.
5. Batch size. Episodes per update; on-policy data freshness contract.

Refuse REINFORCE-no-baseline on horizons > 500 steps. Refuse continuous-action control with a softmax head. Flag any run with `β = 0` and observed policy entropy < 0.1 as entropy-collapsed.
```

## Exercises

1. **Dễ.** Triển khai REINFORCE trên GridWorld 4×4 với một chính sách softmax tuyến tính. Huấn luyện trong 1,000 episode không có baseline. Vẽ đường cong học; đo phương sai (độ lệch chuẩn của lợi tức).
2. **Trung bình.** Thêm một baseline trung bình tích lũy. Huấn luyện lại. So sánh hiệu quả mẫu và phương sai với lần chạy nguyên bản. Baseline giảm số bước đến hội tụ bao nhiêu?
3. **Khó.** Thêm một thưởng entropy $\beta \cdot H(\pi)$. Quét $\beta \in \lbrace 0, 0.01, 0.1, 1.0 \rbrace$. Vẽ lợi tức cuối cùng và entropy chính sách. Điểm tốt nhất trên tác vụ này ở đâu?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Policy gradient (Gradient chính sách) | "Huấn luyện trực tiếp chính sách" | $\nabla J(\theta) = \mathbb{E}[G \cdot \nabla \log \pi_\theta(a \mid s)]$; suy ra từ thủ thuật đạo hàm log. |
| REINFORCE | "Thuật toán PG gốc" | Williams (1992); lợi tức Monte Carlo nhân với gradient log chính sách. |
| Log-derivative trick (Thủ thuật đạo hàm log) | "Bộ ước lượng hàm score" | $\nabla P(\tau;\theta) = P(\tau;\theta) \cdot \nabla \log P(\tau;\theta)$; làm gradient của kỳ vọng tính toán được. |
| Baseline (Đường cơ sở) | "Giảm phương sai" | Bất kỳ $b(s)$ nào được trừ khỏi $G$; không chệch vì $\mathbb{E}[b \cdot \nabla \log \pi] = 0$. |
| Reward-to-go | "Chỉ lợi tức tương lai được tính" | $G_t^{\text{from } t}$ thay vì toàn bộ $G_0$; đúng và phương sai thấp hơn. |
| Entropy bonus (Thưởng entropy) | "Khuyến khích khám phá" | Hạng tử $+\beta \cdot H(\pi(\cdot \mid s))$ giữ chính sách khỏi sụp đổ. |
| On-policy | "Huấn luyện trên những gì bạn vừa thấy" | Kỳ vọng gradient lấy theo chính sách hiện tại — không thể trực tiếp tái sử dụng dữ liệu cũ. |
| Advantage (Lợi thế) | "Tốt hơn trung bình bao nhiêu" | $A(s, a) = G(s, a) - V(s)$; đại lượng có dấu mà REINFORCE với baseline nhân vào. |

## Further Reading

- [Williams (1992). Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning](https://link.springer.com/article/10.1007/BF00992696) — bài báo REINFORCE gốc.
- [Sutton et al. (2000). Policy Gradient Methods for Reinforcement Learning with Function Approximation](https://papers.nips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html) — định lý gradient chính sách hiện đại với xấp xỉ hàm.
- [Sutton & Barto (2018). Ch. 13 — Policy Gradient Methods](http://incompleteideas.net/book/RLbook2020.pdf) — cách trình bày trong giáo trình.
- [OpenAI Spinning Up — VPG / REINFORCE](https://spinningup.openai.com/en/latest/algorithms/vpg.html) — diễn giải sư phạm rõ ràng với mã PyTorch.
- [Peters & Schaal (2008). Reinforcement Learning of Motor Skills with Policy Gradients](https://homes.cs.washington.edu/~todorov/courses/amath579/reading/PolicyGradient.pdf) — giảm phương sai và góc nhìn gradient tự nhiên kết nối REINFORCE với họ miền tin cậy (TRPO, PPO).
