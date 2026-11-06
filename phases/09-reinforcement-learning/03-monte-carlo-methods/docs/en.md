# Monte Carlo Methods — Learning from Complete Episodes

> Quy hoạch động cần một mô hình. Monte Carlo không cần gì ngoài các episode. Chạy chính sách, quan sát các lợi tức, lấy trung bình chúng. Ý tưởng đơn giản nhất trong RL — và là ý tưởng mở khóa mọi thứ phía sau.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming)
**Time:** ~75 minutes

## The Problem

Quy hoạch động thanh lịch, nhưng nó giả định bạn có thể truy vấn $P(s' \mid s, a)$ cho mọi trạng thái và hành động. Hầu như không có gì trong thế giới thực hoạt động như vậy. Một robot không thể tính giải tích phân phối trên các pixel camera sau một mô-men xoắn khớp. Một thuật toán định giá không thể tích phân trên mọi phản ứng có thể của khách hàng. Một LLM không thể liệt kê mọi phần tiếp nối có thể sau một token.

Bạn cần một phương pháp chỉ cần khả năng *lấy mẫu* từ môi trường. Chạy chính sách. Nhận một quỹ đạo `s_0, a_0, r_1, s_1, a_1, r_2, …, s_T`. Dùng nó để ước lượng giá trị. Đó là Monte Carlo.

Sự chuyển dịch từ DP sang MC quan trọng về mặt triết lý: chúng ta đi từ *mô hình đã biết + cập nhật chính xác* sang *rollout được lấy mẫu + lợi tức lấy trung bình*. Phương sai tăng vọt, nhưng khả năng áp dụng bùng nổ. Mọi thuật toán RL sau bài học này — TD, Q-learning, REINFORCE, PPO, GRPO — cốt lõi đều là một bộ ước lượng Monte Carlo, đôi khi có bootstrapping được xếp lên trên.

## The Concept

![Monte Carlo: rollout, compute returns, average; first-visit vs every-visit](../assets/monte-carlo.svg)

**Ý tưởng cốt lõi, trong một dòng:** $V^\pi(s) = \mathbb E_\pi[G_t \mid s_t = s] \approx (1/N) \sum_i G^{(i)}(s)$ trong đó $G^{(i)}(s)$ là các lợi tức quan sát được sau những lần ghé $s$ theo chính sách $\pi$.

**MC lần ghé đầu so với mọi lần ghé.** Với một episode ghé trạng thái $s$ nhiều lần, MC lần ghé đầu chỉ tính return từ lần ghé đầu tiên; MC mọi lần ghé tính mọi lần ghé. MC lần ghé đầu không chệch. MC mọi lần ghé có thể hơi chệch sau một số episode hữu hạn, vì nó lấy trung bình một số lượng return ngẫu nhiên cho mỗi episode và số lượng đó có thể tương quan với các return, nhưng cả hai hội tụ đến $V^\pi(s)$ khi số lần ghé tiến đến vô cùng. Lần ghé đầu đơn giản hơn để phân tích (các mẫu iid). Mọi lần ghé sử dụng nhiều dữ liệu hơn cho mỗi episode và thường hội tụ nhanh hơn trong thực tế.

**Trung bình tăng dần.** Thay vì lưu tất cả lợi tức, cập nhật trung bình tích lũy:

```math
V_n(s) = V_{n-1}(s) + (1/n) [G_n - V_{n-1}(s)]
```

Sắp xếp lại: $V_{\text{new}} = V_{\text{old}} + \alpha \cdot (\text{target} - V_{\text{old}})$ với $\alpha = 1/n$. Đổi $1/n$ thành một kích thước bước không đổi $\alpha \in (0, 1)$ và bạn có một bộ ước lượng MC phi dừng theo dõi các thay đổi trong $\pi$. Thay đổi đó là toàn bộ bước nhảy từ MC sang TD đến mọi thuật toán RL hiện đại.

**Khám phá giờ là một vấn đề.** DP chạm đến mọi trạng thái bằng liệt kê. MC chỉ thấy các trạng thái mà chính sách ghé. Nếu $\pi$ tất định, cả những vùng của không gian trạng thái không bao giờ được lấy mẫu, và ước lượng giá trị của chúng mãi bằng không. Ba cách khắc phục, theo thứ tự lịch sử:

1. **Khởi đầu khám phá.** Bắt đầu mỗi episode từ một cặp (s, a) ngẫu nhiên. Bảo đảm độ bao phủ; không thực tế trong thực hành (bạn không thể "đặt lại" một robot vào một trạng thái tùy ý).
2. **ε-greedy.** Hành động tham lam theo Q hiện tại, nhưng với xác suất $\epsilon$ chọn một hành động ngẫu nhiên. Tất cả các cặp trạng thái-hành động được lấy mẫu theo tiệm cận.
3. **MC off-policy.** Thu thập dữ liệu theo một chính sách hành vi $\mu$, học về chính sách mục tiêu $\pi$ qua lấy mẫu quan trọng. Phương sai cao, nhưng đó là cầu nối đến các phương pháp bộ đệm phát lại như DQN.

**Điều khiển Monte Carlo.** Đánh giá → cải thiện → đánh giá, giống lặp chính sách, nhưng đánh giá dựa trên lấy mẫu:

1. Chạy $\pi$, nhận một episode.
2. Cập nhật $Q(s, a)$ từ các lợi tức quan sát được.
3. Làm $\pi$ ε-greedy theo $Q$.
4. Lặp lại.

Hội tụ đến $Q^{\ast}$ và $\pi^{\ast}$ với xác suất 1 dưới các điều kiện nhẹ (mỗi cặp được ghé vô hạn lần, $\alpha$ thỏa mãn Robbins-Monro).

```figure
epsilon-greedy
```

## Build It

### Step 1: rollout → list of (s, a, r)

```python
def rollout(env, policy, max_steps=200):
    trajectory = []
    s = env.reset()
    for _ in range(max_steps):
        a = policy(s)
        s_next, r, done = env.step(s, a)
        trajectory.append((s, a, r))
        s = s_next
        if done:
            break
    return trajectory
```

Không mô hình, chỉ `env.reset()` và `env.step(s, a)`. Cùng giao diện như một môi trường gym nhưng được giản lược.

### Step 2: compute returns (reverse sweep)

```python
def returns_from(trajectory, gamma):
    returns = []
    G = 0.0
    for _, _, r in reversed(trajectory):
        G = r + gamma * G
        returns.append(G)
    return list(reversed(returns))
```

Một lượt, $O(T)$. Truy hồi ngược $G_t = r_{t+1} + \gamma G_{t+1}$ tránh cộng lại.

### Step 3: first-visit MC evaluation

```python
def mc_policy_evaluation(env, policy, episodes, gamma=0.99):
    V = defaultdict(float)
    counts = defaultdict(int)
    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for t, ((s, _, _), G) in enumerate(zip(trajectory, returns)):
            if s in seen:
                continue
            seen.add(s)
            counts[s] += 1
            V[s] += (G - V[s]) / counts[s]
    return V
```

Ba dòng làm công việc: đánh dấu trạng thái đã thấy ở lần ghé đầu, tăng số đếm, cập nhật trung bình tích lũy.

### Step 4: ε-greedy MC control (on-policy)

```python
def mc_control(env, episodes, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    counts = defaultdict(lambda: {a: 0 for a in ACTIONS})

    def policy(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        trajectory = rollout(env, policy)
        returns = returns_from(trajectory, gamma)
        seen = set()
        for (s, a, _), G in zip(trajectory, returns):
            if (s, a) in seen:
                continue
            seen.add((s, a))
            counts[s][a] += 1
            Q[s][a] += (G - Q[s][a]) / counts[s][a]
    return Q, policy
```

### Step 5: compare to DP gold standard

Ước lượng MC của bạn về $V^\pi$ nên khớp kết quả DP từ Bài 02 khi số episode → ∞. Trong thực tế: 50,000 episode trên GridWorld 4×4 đưa bạn đến trong khoảng `~0.1` so với câu trả lời DP.

## Pitfalls

- **Episode vô hạn.** MC yêu cầu các episode phải *kết thúc*. Nếu chính sách của bạn có thể lặp mãi mãi, giới hạn `max_steps` và coi mức giới hạn là thất bại ngầm. GridWorld với một chính sách ngẫu nhiên thường xuyên hết thời gian — điều đó bình thường, chỉ cần bảo đảm bạn tính nó đúng.
- **Phương sai.** MC dùng các lợi tức đầy đủ. Trên các episode dài, phương sai rất lớn — một phần thưởng không may ở cuối dịch chuyển $V(s_0)$ cùng một lượng. Các phương pháp TD (Bài 04) giảm điều này bằng bootstrapping.
- **Độ bao phủ trạng thái.** MC tham lam trên một Q mới có các giá trị hòa sẽ chỉ thử một hành động. Bạn *phải* khám phá (ε-greedy, khởi đầu khám phá, UCB).
- **Chính sách phi dừng.** Nếu $\pi$ thay đổi (như trong điều khiển MC), các lợi tức cũ đến từ một chính sách khác. MC α không đổi xử lý điều này; MC trung bình mẫu thì không.
- **Lấy mẫu quan trọng off-policy.** Các trọng số $\pi(a \mid s)/\mu(a \mid s)$ nhân với nhau trên một quỹ đạo. Phương sai bùng nổ theo chân trời. Giới hạn bằng IS có trọng số theo quyết định hoặc chuyển sang TD.

## Use It

Vai trò năm 2026 của các phương pháp Monte Carlo:

| Trường hợp sử dụng | Vì sao MC |
|----------|--------|
| Trò chơi chân trời ngắn (blackjack, poker) | Các episode kết thúc tự nhiên; lợi tức rõ ràng. |
| Đánh giá ngoại tuyến một chính sách đã ghi log | Lấy trung bình các lợi tức chiết khấu trên các quỹ đạo được lưu. |
| Tìm kiếm cây Monte Carlo (AlphaZero) | Các rollout MC từ lá cây hướng dẫn lựa chọn. |
| Đánh giá RL cho LLM | Tính phần thưởng trung bình trên các phần hoàn thành được lấy mẫu cho một chính sách cho trước. |
| Ước lượng baseline trong PPO | Mục tiêu lợi thế $A_t = G_t - V(s_t)$ dùng một $G_t$ MC. |
| Dạy RL | Thuật toán đơn giản nhất thực sự hoạt động — bỏ bootstrapping để thấy cốt lõi. |

Các thuật toán deep-RL hiện đại (PPO, SAC) nội suy giữa MC thuần túy (lợi tức đầy đủ) và TD thuần túy (bootstrap một bước) qua lợi tức $n$ bước hoặc GAE. Cả hai đầu mút là các trường hợp của cùng một bộ ước lượng.

## Ship It

Lưu thành `outputs/skill-mc-evaluator.md`:

```markdown
---
name: mc-evaluator
description: Evaluate a policy via Monte Carlo rollouts and produce a convergence report with DP-comparison if available.
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

Given an environment (episodic, with reset+step API) and a policy, output:

1. Method. First-visit vs every-visit MC. Reason.
2. Episode budget. Target number, variance diagnostic, expected standard error.
3. Exploration plan. ε schedule (if needed) or exploring starts.
4. Gold-standard comparison. DP-optimal V* if tabular; otherwise a bound from a Q-learning / PPO baseline.
5. Termination check. Max-step cap, timeouts, handling of non-terminating trajectories.

Refuse to run MC on non-episodic tasks without a finite horizon cap. Refuse to report V^π estimates from fewer than 100 episodes per state for tabular tasks. Flag any policy with zero-variance actions as an exploration risk.
```

## Exercises

1. **Dễ.** Triển khai đánh giá MC lần ghé đầu cho chính sách ngẫu nhiên đều trên GridWorld 4×4. Chạy 10,000 episode. Vẽ $V(0,0)$ như một hàm của số episode so với câu trả lời DP.
2. **Trung bình.** Triển khai điều khiển MC ε-greedy với $\epsilon \in \lbrace 0.01, 0.1, 0.3 \rbrace$. So sánh lợi tức trung bình sau 20,000 episode. Đường cong trông như thế nào? Đánh đổi độ chệch-phương sai nằm ở đâu?
3. **Khó.** Triển khai MC *off-policy* với lấy mẫu quan trọng: thu thập dữ liệu theo chính sách ngẫu nhiên đều $\mu$, ước lượng $V^\pi$ cho chính sách tối ưu tất định $\pi$. So sánh IS thông thường với IS theo quyết định với IS có trọng số. Cái nào có phương sai thấp nhất?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Monte Carlo | "Lấy mẫu ngẫu nhiên" | Ước lượng kỳ vọng bằng cách lấy trung bình trên các mẫu iid từ phân phối. |
| Return $G_t$ (Lợi tức) | "Phần thưởng tương lai" | Tổng các phần thưởng chiết khấu từ bước $t$ đến cuối episode: $\sum_{k\ge 0} \gamma^k r_{t+k+1}$. |
| First-visit MC (MC lần ghé đầu) | "Đếm mỗi trạng thái một lần" | Chỉ lần ghé đầu tiên trong một episode đóng góp vào ước lượng giá trị. |
| Every-visit MC (MC mọi lần ghé) | "Sử dụng mọi lần ghé" | Mọi lần ghé đều đóng góp; hơi chệch với mẫu hữu hạn, nhất quán trong giới hạn và hiệu quả mẫu hơn. |
| ε-greedy | "Nhiễu khám phá" | Chọn hành động tham lam với xác suất $1-\epsilon$; hành động ngẫu nhiên với xác suất $\epsilon$. |
| Importance sampling (Lấy mẫu quan trọng) | "Hiệu chỉnh việc lấy mẫu từ sai phân phối" | Đặt lại trọng số lợi tức bằng các tích $\pi(a \mid s)/\mu(a \mid s)$ để ước lượng $V^\pi$ từ dữ liệu $\mu$. |
| On-policy | "Học từ dữ liệu của chính tôi" | Chính sách mục tiêu = chính sách hành vi. MC nguyên bản, PPO, SARSA. |
| Off-policy | "Học từ dữ liệu của người khác" | Chính sách mục tiêu ≠ chính sách hành vi. MC lấy mẫu quan trọng, Q-learning, DQN. |

## Further Reading

- [Sutton & Barto (2018). Ch. 5 — Monte Carlo Methods](http://incompleteideas.net/book/RLbook2020.pdf) — cách trình bày chuẩn.
- [Singh & Sutton (1996). Reinforcement Learning with Replacing Eligibility Traces](https://link.springer.com/article/10.1007/BF00114726) — phân tích lần ghé đầu so với mọi lần ghé.
- [Precup, Sutton, Singh (2000). Eligibility Traces for Off-Policy Policy Evaluation](http://incompleteideas.net/papers/PSS-00.pdf) — MC off-policy và kiểm soát phương sai.
- [Mahmood et al. (2014). Weighted Importance Sampling for Off-Policy Learning](https://arxiv.org/abs/1404.6362) — các bộ ước lượng IS phương sai thấp hiện đại.
- [Tesauro (1995). TD-Gammon, A Self-Teaching Backgammon Program](https://dl.acm.org/doi/10.1145/203330.203343) — minh chứng thực nghiệm quy mô lớn đầu tiên về tự chơi MC/TD hội tụ đến trình độ chơi siêu nhân; tiền thân về khái niệm của mọi bài học trong nửa sau của giai đoạn này.
