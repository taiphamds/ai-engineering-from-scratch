# MDPs, States, Actions & Rewards

> Một Quá trình quyết định Markov gồm năm thứ: trạng thái, hành động, chuyển tiếp, phần thưởng, một hệ số chiết khấu. Mọi thứ trong RL — Q-learning, PPO, DPO, GRPO — tối ưu trên cấu trúc này. Học nó một lần, đọc phần còn lại của học tăng cường miễn phí.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Probability & Distributions), Phase 2 · 01 (ML Taxonomy)
**Time:** ~45 minutes

## The Problem

Bạn đang viết một bot cờ vua. Hoặc một bộ lập kế hoạch tồn kho. Hoặc một agent giao dịch. Hoặc vòng lặp PPO huấn luyện một mô hình suy luận. Bốn miền khác nhau, một sự thật bất ngờ: cả bốn đều quy về cùng một đối tượng toán học.

Học có giám sát cho bạn các cặp `(x, y)` và yêu cầu bạn khớp một hàm. Học tăng cường không cho bạn nhãn nào — chỉ một luồng trạng thái, các hành động bạn đã thực hiện, và một phần thưởng vô hướng. Nước đi đó có thắng ván đấu không? Quyết định bổ sung hàng có tiết kiệm tiền không? Giao dịch có tạo ra lợi nhuận không? Token LLM vừa tạo ra có dẫn đến phần thưởng cao hơn từ giám khảo không?

Bạn không thể học từ luồng này cho đến khi hình thức hóa nó. "Những gì tôi thấy," "những gì tôi làm," "những gì xảy ra tiếp theo," "điều đó tốt đến đâu" — mỗi thứ phải trở thành một đối tượng mà bạn có thể suy luận về. Sự hình thức hóa đó là một Quá trình quyết định Markov. Mọi thuật toán RL trong giai đoạn này, gồm các vòng lặp RLHF và GRPO ở cuối, đều tối ưu trên cấu trúc này.

## The Concept

![Markov decision process: states, actions, transitions, rewards, discount](../assets/mdp.svg)

**Năm đối tượng.**

- **Trạng thái** $S$. Mọi thứ agent cần để quyết định. Trong GridWorld, là ô. Trong cờ vua, là bàn cờ. Trong một LLM, là cửa sổ ngữ cảnh cộng với bất kỳ bộ nhớ nào.
- **Hành động** $A$. Các lựa chọn. Di chuyển lên/xuống/trái/phải. Đi một nước cờ. Phát ra một token.
- **Chuyển tiếp** $P(s' \mid s, a)$. Với trạng thái $s$ và hành động $a$, phân phối trên trạng thái tiếp theo. Tất định trong cờ vua, ngẫu nhiên trong tồn kho, gần như tất định trong giải mã LLM.
- **Phần thưởng** $R(s, a, s')$. Tín hiệu vô hướng. Thắng = +1, thua = -1. Doanh thu trừ chi phí. Hạng tử tỷ số log-likelihood trong GRPO.
- **Chiết khấu** $\gamma \in [0, 1)$. Phần thưởng tương lai được tính bao nhiêu so với hiện tại. $\gamma = 0.99$ cho một chân trời ~100 bước; $\gamma = 0.9$ cho ~10.

**Tính chất Markov** $P(s_{t+1} \mid s_t, a_t) = P(s_{t+1} \mid s_0, a_0, \ldots, s_t, a_t)$. Tương lai chỉ phụ thuộc trạng thái hiện tại. Nếu không, biểu diễn trạng thái chưa đầy đủ — không phải thất bại của phương pháp, mà là thất bại của trạng thái.

**Chính sách và lợi tức.** Một chính sách $\pi(a \mid s)$ ánh xạ trạng thái sang phân phối hành động. Lợi tức $G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \ldots$ là tổng chiết khấu của các phần thưởng tương lai. Giá trị $V^\pi(s) = \mathbb{E}[G_t \mid s_t = s]$ là lợi tức kỳ vọng bắt đầu từ $s$ theo chính sách $\pi$. Giá trị Q $Q^\pi(s, a) = \mathbb{E}[G_t \mid s_t = s, a_t = a]$ là lợi tức kỳ vọng bắt đầu với một hành động cụ thể. Mọi thuật toán RL ước lượng một trong hai thứ này, rồi cải thiện $\pi$ tương ứng.

**Các phương trình Bellman.** Các phương trình điểm bất động mà mọi thứ trong giai đoạn này dùng:

```math
\begin{aligned}
V^\pi(s) &= \sum_a \pi(a \mid s) \sum_{s', r} P(s', r \mid s, a) [r + \gamma V^\pi(s')] \\
Q^\pi(s, a) &= \sum_{s', r} P(s', r \mid s, a) [r + \gamma \sum_{a'} \pi(a' \mid s') Q^\pi(s', a')]
\end{aligned}
```

Chúng tách lợi tức kỳ vọng thành "phần thưởng của bước này" cộng với "giá trị chiết khấu của nơi bạn đến." Đệ quy. Mọi thuật toán trong Giai đoạn 9 hoặc lặp phương trình này đến hội tụ (quy hoạch động), lấy mẫu từ nó (Monte Carlo), hoặc bootstrap nó một bước (sai phân thời gian).

```figure
discount-horizon
```

## Build It

### Step 1: a tiny deterministic MDP

Một GridWorld 4×4. Agent bắt đầu ở trên cùng bên trái, trạng thái kết thúc ở dưới cùng bên phải, phần thưởng -1 mỗi bước, các hành động `{up, down, left, right}`. Xem `code/main.py`.

```python
GRID = 4
TERMINAL = (3, 3)
ACTIONS = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}

def step(state, action):
    if state == TERMINAL:
        return state, 0.0, True
    dr, dc = ACTIONS[action]
    r, c = state
    nr = min(max(r + dr, 0), GRID - 1)
    nc = min(max(c + dc, 0), GRID - 1)
    return (nr, nc), -1.0, (nr, nc) == TERMINAL
```

Năm dòng. Đó là toàn bộ môi trường. Chuyển tiếp tất định, phạt bước không đổi, trạng thái kết thúc hấp thụ.

### Step 2: roll out a policy

Một chính sách là một hàm từ trạng thái sang phân phối hành động. Đơn giản nhất: ngẫu nhiên đều.

```python
def uniform_policy(state):
    return {a: 0.25 for a in ACTIONS}

def rollout(policy, max_steps=200):
    s, total, steps = (0, 0), 0.0, 0
    for _ in range(max_steps):
        a = sample(policy(s))
        s, r, done = step(s, a)
        total += r
        steps += 1
        if done:
            break
    return total, steps
```

Chạy chính sách ngẫu nhiên 1000 lần. Lợi tức trung bình khoảng -60 đến -80 cho bàn 4×4 này. Lợi tức tối ưu là -6 (đường đi thẳng xuống-phải). Thu hẹp khoảng cách đó là mọi thứ trong Giai đoạn 9.

### Step 3: compute `V^π` exactly via the Bellman equation

Với các MDP nhỏ, phương trình Bellman là một hệ tuyến tính. Liệt kê trạng thái, áp dụng kỳ vọng, lặp cho đến khi các giá trị ngừng thay đổi.

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in all_states()}
    while True:
        delta = 0.0
        for s in all_states():
            if s == TERMINAL:
                continue
            v = 0.0
            for a, pi_a in policy(s).items():
                s_next, r, _ = step(s, a)
                v += pi_a * (r + gamma * V[s_next])
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

Đây là đánh giá chính sách lặp. Nó là thuật toán đầu tiên trong Sutton & Barto và là nền tảng lý thuyết của mọi phương pháp RL tiếp theo.

### Step 4: `γ` is a hyperparameter with physical meaning

Chân trời hiệu dụng xấp xỉ $1 / (1 - \gamma)$. $\gamma = 0.9$ → 10 bước. $\gamma = 0.99$ → 100 bước. $\gamma = 0.999$ → 1000 bước.

Quá thấp thì agent hành động thiển cận. Quá cao thì việc gán công trạng trở nên nhiều nhiễu, vì nhiều bước đầu chia sẻ trách nhiệm cho phần thưởng ở tương lai xa. RLHF cho LLM thường dùng $\gamma = 1$ vì các episode ngắn và bị chặn. Các tác vụ điều khiển dùng `0.95–0.99`. Các trò chơi chiến thuật chân trời dài dùng `0.999`.

## Pitfalls

- **Trạng thái phi Markov.** Nếu bạn cần ba quan sát gần nhất để quyết định, "trạng thái" không chỉ là quan sát hiện tại. Cách khắc phục: xếp chồng khung hình (DQN trên Atari xếp 4) hoặc dùng một trạng thái hồi tiếp (LSTM/GRU trên các quan sát).
- **Phần thưởng thưa.** Phần thưởng chỉ khi thắng khiến việc học gần như không thể trong các không gian trạng thái lớn. Định hình phần thưởng (tín hiệu trung gian) hoặc bootstrap bằng bắt chước (Giai đoạn 9 · 09).
- **Reward hacking.** Tối ưu một phần thưởng đại diện thường tạo ra hành vi bệnh lý. Agent đua thuyền của OpenAI xoay vòng thu thập vật phẩm tăng sức mạnh mãi mãi thay vì hoàn thành cuộc đua. Luôn định nghĩa phần thưởng từ kết quả mục tiêu, không phải đại diện.
- **Đặc tả chiết khấu sai.** $\gamma = 1$ trên một tác vụ chân trời vô hạn khiến mọi giá trị vô hạn. Luôn giới hạn bằng một chân trời hữu hạn hoặc $\gamma < 1$.
- **Thang phần thưởng.** Phần thưởng {+100, -100} so với {+1, -1} cho các chính sách tối ưu giống hệt nhưng độ lớn gradient rất khác nhau. Chuẩn hóa về khoảng `[-1, 1]` trước khi đưa vào PPO/DQN.

## Use It

Bộ công cụ năm 2026 quy mọi pipeline RL về một MDP trước khi chạm vào mã:

| Tình huống | Trạng thái | Hành động | Phần thưởng | γ |
|-----------|-------|--------|--------|---|
| Điều khiển (di chuyển, thao tác) | Góc khớp + vận tốc | Mô-men xoắn liên tục | Được định hình riêng cho tác vụ | 0.99 |
| Trò chơi (cờ vua, cờ vây, poker) | Bàn chơi + lịch sử | Nước đi hợp lệ | Thắng=+1 / thua=-1 | 1.0 (hữu hạn) |
| Tồn kho / định giá | Hàng tồn + nhu cầu | Số lượng đặt | Doanh thu - chi phí | 0.95 |
| RLHF cho LLM | Token ngữ cảnh | Token tiếp theo | Điểm mô hình phần thưởng ở cuối | 1.0 (episode ~200 token) |
| GRPO cho suy luận | Prompt + phản hồi một phần | Token tiếp theo | Bộ xác minh 0/1 ở cuối | 1.0 |

Viết các bộ năm trước khi viết bất kỳ vòng lặp huấn luyện nào. Hầu hết báo cáo lỗi "RL không hoạt động" truy về một cách phát biểu MDP đã sai trên giấy.

## Ship It

Lưu thành `outputs/skill-mdp-modeler.md`:

```markdown
---
name: mdp-modeler
description: Given a task description, produce a Markov Decision Process spec and flag formulation risks before training.
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

Given a task (control / game / recommendation / LLM fine-tuning), output:

1. State. Exact feature vector or tensor spec. Justify Markov property.
2. Action. Discrete set or continuous range. Dimensionality.
3. Transition. Deterministic, stochastic-with-known-model, or sample-only.
4. Reward. Function and source. Sparse vs shaped. Terminal vs per-step.
5. Discount. Value and horizon justification.

Refuse to ship any MDP where the state is non-Markovian without explicit mention of frame-stacking or recurrent state. Refuse any reward that was not defined in terms of the target outcome. Flag any `γ ≥ 1.0` on an infinite-horizon task. Flag any reward range >100x the typical step reward as a likely gradient-explosion source.
```

## Exercises

1. **Dễ.** Triển khai GridWorld 4×4 và rollout chính sách ngẫu nhiên trong `code/main.py`. Chạy 10,000 episode. Báo cáo trung bình và độ lệch chuẩn của lợi tức. So sánh với lợi tức tối ưu (-6).
2. **Trung bình.** Chạy `policy_evaluation` với $\gamma \in \lbrace 0.5, 0.9, 0.99 \rbrace$ cho chính sách ngẫu nhiên đều. In `V` thành một lưới 4×4 cho mỗi trường hợp. Giải thích vì sao các giá trị trạng thái gần trạng thái kết thúc tăng nhanh hơn với $\gamma$ lớn hơn.
3. **Khó.** Biến GridWorld thành ngẫu nhiên: mỗi hành động trượt sang một hướng liền kề với xác suất $p = 0.1$. Đánh giá lại chính sách đều. `V[start]` tốt hơn hay tệ hơn? Vì sao?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| MDP | "Thiết lập học tăng cường" | Bộ $(S, A, P, R, \gamma)$ thỏa mãn tính chất Markov. |
| State (Trạng thái) | "Những gì agent thấy" | Thống kê đủ cho động lực học tương lai theo lớp chính sách đã chọn. |
| Policy (Chính sách) | "Hành vi của agent" | Phân phối có điều kiện $\pi(a \mid s)$ hoặc ánh xạ tất định $s \to a$. |
| Return (Lợi tức) | "Tổng phần thưởng" | Tổng chiết khấu $\sum \gamma^t r_t$ từ bước hiện tại. |
| Value (Giá trị) | "Một trạng thái tốt đến đâu" | Lợi tức kỳ vọng theo $\pi$ bắt đầu từ $s$. |
| Q-value (Giá trị Q) | "Một hành động tốt đến đâu" | Lợi tức kỳ vọng theo $\pi$ bắt đầu từ $s$ với hành động đầu tiên $a$. |
| Bellman equation (Phương trình Bellman) | "Đệ quy quy hoạch động" | Phân rã điểm bất động của giá trị / Q thành phần thưởng một bước cộng giá trị trạng thái kế tiếp được chiết khấu. |
| Discount $\gamma$ (Chiết khấu) | "Tương lai so với hiện tại" | Trọng số theo cấp số nhân trên phần thưởng tương lai xa; chân trời hiệu dụng $\approx 1/(1-\gamma)$. |

## Further Reading

- [Sutton & Barto (2018). Reinforcement Learning: An Introduction, 2nd ed.](http://incompleteideas.net/book/RLbook2020.pdf) — giáo trình. Chương 3 trình bày MDP và các phương trình Bellman; Chương 1 giải thích động cơ của giả thuyết phần thưởng làm nền tảng cho mọi bài học tiếp theo.
- [Bellman (1957). Dynamic Programming](https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming) — nguồn gốc của phương trình Bellman.
- [OpenAI Spinning Up — Part 1: Key Concepts](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) — phần nhập môn MDP ngắn gọn từ góc nhìn deep-RL.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — tài liệu tham chiếu nghiên cứu vận trù về MDP và các phương pháp giải chính xác.
- [Littman (1996). Algorithms for Sequential Decision Making (PhD thesis)](https://cs.brown.edu/media/filer_public/d1/a6/d1a6f66a-289a-4b81-9596-417114843489/littman.pdf) — suy dẫn rõ ràng nhất về MDP như một chuyên biệt hóa quy hoạch động.
