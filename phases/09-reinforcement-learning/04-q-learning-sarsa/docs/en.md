# Temporal Difference — Q-Learning & SARSA

> Monte Carlo đợi đến khi episode kết thúc. TD cập nhật sau mỗi bước bằng cách bootstrap ước lượng giá trị tiếp theo. Q-learning là off-policy và lạc quan; SARSA là on-policy và thận trọng. Cả hai đều là một dòng mã. Cả hai làm nền tảng cho mọi phương pháp deep-RL trong giai đoạn này.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs), Phase 9 · 02 (Dynamic Programming), Phase 9 · 03 (Monte Carlo)
**Time:** ~75 minutes

## The Problem

Monte Carlo hoạt động nhưng có hai đòi hỏi tốn kém. Nó cần các episode kết thúc, và nó chỉ cập nhật sau khi có lợi tức cuối cùng. Nếu episode của bạn dài 1,000 bước, MC đợi 1,000 bước để cập nhật bất cứ thứ gì. Nó có phương sai cao, độ chệch thấp, và chậm trong thực tế.

Quy hoạch động có đặc điểm ngược lại — các phép cập nhật bootstrap phương sai bằng không — nhưng đòi hỏi một mô hình đã biết.

Học sai phân thời gian (TD) dung hòa hai cách. Từ một chuyển tiếp $(s, a, r, s')$, lập một mục tiêu một bước $r + \gamma V(s')$ và đẩy nhẹ $V(s)$ về phía nó. Không mô hình. Không episode đầy đủ. Độ chệch từ việc dùng một $V$ xấp xỉ ở vế phải, nhưng phương sai thấp hơn MC đáng kể và cập nhật trực tuyến từ bước một.

Đây là điểm xoay của toàn bộ RL hiện đại — DQN, A2C, PPO, SAC. Phần còn lại của Giai đoạn 9 là các lớp xấp xỉ hàm và thủ thuật được xây trên cập nhật TD một bước mà bạn sẽ viết trong bài học này.

## The Concept

![Q-learning vs SARSA: off-policy max vs on-policy Q(s', a')](../assets/td.svg)

**Cập nhật TD(0) cho V:**

```math
V(s) \leftarrow V(s) + \alpha [r + \gamma V(s') - V(s)]
```

Đại lượng trong ngoặc là sai số TD $\delta = r + \gamma V(s') - V(s)$. Nó là dạng tương ứng trực tuyến của $G_t - V(s_t)$ trong MC. Hội tụ đòi hỏi $\alpha$ thỏa mãn Robbins-Monro ($\sum \alpha = \infty$, $\sum \alpha^2 < \infty$) và tất cả trạng thái được ghé vô hạn lần.

**Q-learning.** Một phương pháp TD off-policy cho điều khiển:

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \max_{a'} Q(s', a') - Q(s, a)]
```

`max` giả định chính sách *tham lam* sẽ được tuân theo từ $s'$ trở đi, bất kể hành động mà agent thực sự thực hiện. Sự tách rời đó khiến Q-learning học $Q^{\ast}$ trong khi agent khám phá qua ε-greedy. Mnih và cộng sự (2015) chuyển điều này thành deep Q-learning trên Atari (Bài 05).

**SARSA.** Một phương pháp TD on-policy:

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma Q(s', a') - Q(s, a)]
```

Tên gọi là bộ $(s, a, r, s', a')$. SARSA dùng hành động $a'$ mà agent *thực sự* thực hiện tiếp theo, không phải `argmax` tham lam. Hội tụ đến $Q^\pi$ cho bất kỳ $\pi$ ε-greedy nào đang chạy, mà trong giới hạn $\epsilon \to 0$ trở thành $Q^{\ast}$.

**Khác biệt đi dọc vách đá.** Trên tác vụ đi dọc vách đá kinh điển (rơi khỏi vách = phần thưởng -100), Q-learning học đường đi tối ưu dọc mép vách nhưng thỉnh thoảng chịu phạt khi khám phá. SARSA học một đường an toàn hơn cách vách một bước vì nó tính nhiễu khám phá vào giá trị Q. Khi huấn luyện, cả hai đạt tối ưu ở $\epsilon \to 0$. Trong thực tế điều này quan trọng: khi khám phá thực sự diễn ra lúc triển khai, hành vi của SARSA bảo thủ hơn.

**Expected SARSA.** Thay $Q(s', a')$ bằng giá trị kỳ vọng của nó theo $\pi$:

```math
Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \sum_{a'} \pi(a' \mid s') Q(s', a') - Q(s, a)]
```

Phương sai thấp hơn SARSA (không lấy mẫu $a'$), cùng mục tiêu on-policy. Thường là mặc định trong các giáo trình hiện đại.

**TD n bước và TD(λ).** Nội suy giữa TD(0) và MC bằng cách đợi $n$ bước trước khi bootstrap. $n=1$ là TD, $n=\infty$ là MC. TD(λ) lấy trung bình trên tất cả $n$ với các trọng số theo cấp số nhân $(1-\lambda)\lambda^{n-1}$. Hầu hết deep-RL dùng $n$ từ 3 đến 20.

```figure
qlearning-gridworld
```

## Build It

### Step 1: SARSA on ε-greedy policy

```python
def sarsa(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})

    def choose(s):
        if random() < epsilon:
            return choice(ACTIONS)
        return max(Q[s], key=Q[s].get)

    for _ in range(episodes):
        s = env.reset()
        a = choose(s)
        while True:
            s_next, r, done = env.step(s, a)
            a_next = choose(s_next) if not done else None
            target = r + (gamma * Q[s_next][a_next] if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s, a = s_next, a_next
    return Q
```

Tám dòng. Khác biệt *duy nhất* với Q-learning là dòng mục tiêu.

### Step 2: Q-learning

```python
def q_learning(env, episodes, alpha=0.1, gamma=0.99, epsilon=0.1):
    Q = defaultdict(lambda: {a: 0.0 for a in ACTIONS})
    for _ in range(episodes):
        s = env.reset()
        while True:
            a = choose(s, Q, epsilon)
            s_next, r, done = env.step(s, a)
            target = r + (gamma * max(Q[s_next].values()) if not done else 0.0)
            Q[s][a] += alpha * (target - Q[s][a])
            if done:
                break
            s = s_next
    return Q
```

`max` tách mục tiêu khỏi hành vi. Một ký hiệu đó là khác biệt giữa on-policy và off-policy.

### Step 3: learning curves

Theo dõi lợi tức trung bình mỗi 100 episode. Q-learning hội tụ nhanh hơn trên GridWorld tất định đơn giản; SARSA bảo thủ hơn trên đi dọc vách đá. Trên GridWorld 4×4 trong `code/main.py`, cả hai gần tối ưu sau ~2,000 episode với $\alpha=0.1, \epsilon=0.1$.

### Step 4: compare to DP truth

Chạy lặp giá trị (Bài 02) để có $Q^{\ast}$. Kiểm tra $\max_{s,a} \lvert Q_{\text{learned}}(s,a) - Q^{\ast}(s,a) \rvert$. Một agent TD dạng bảng lành mạnh đạt trong khoảng `~0.5` trên GridWorld 4×4 sau 10,000 episode.

## Pitfalls

- **Các giá trị Q ban đầu quan trọng.** Khởi tạo lạc quan ($Q = 0$ cho một tác vụ phần thưởng âm) khuyến khích khám phá. Khởi tạo bi quan có thể bẫy một chính sách tham lam mãi mãi.
- **Lịch α.** $\alpha$ không đổi phù hợp cho các bài toán phi dừng. $\alpha_n = 1/n$ giảm dần cho hội tụ về lý thuyết nhưng quá chậm trong thực tế — ghim $\alpha$ trong `[0.05, 0.3]` và theo dõi đường cong học.
- **Lịch ε.** Bắt đầu cao ($\epsilon=1.0$), giảm dần đến $\epsilon=0.05$. "GLIE" (tham lam trong giới hạn với khám phá vô hạn) là điều kiện hội tụ.
- **Độ chệch max trong Q-learning.** Toán tử `max` bị chệch lên khi $Q$ nhiều nhiễu. Dẫn đến ước lượng quá cao — Double Q-learning của Hasselt (được DDQN dùng trong Bài 05) khắc phục điều này bằng hai bảng Q.
- **Episode không kết thúc.** TD có thể học mà không có trạng thái kết thúc, nhưng bạn cần giới hạn số bước hoặc xử lý bootstrap đúng ở mức giới hạn. Tiêu chuẩn: coi mức giới hạn là không kết thúc, tiếp tục bootstrapping.
- **Băm trạng thái.** Nếu trạng thái là tuple/tensor, dùng một khóa có thể băm (tuple, không phải list; tuple các float được làm tròn, không phải thô).

## Use It

Bối cảnh TD năm 2026:

| Tác vụ | Phương pháp | Lý do |
|------|--------|--------|
| Môi trường dạng bảng nhỏ | Q-learning | Học trực tiếp chính sách tối ưu. |
| On-policy quan trọng về an toàn | SARSA / Expected SARSA | Bảo thủ trong khám phá. |
| Trạng thái nhiều chiều | DQN (Giai đoạn 9 · 05) | Hàm Q mạng nơ-ron với replay và mạng mục tiêu. |
| Hành động liên tục | SAC / TD3 (Giai đoạn 9 · 07) | Cập nhật TD trên một mạng Q; mạng chính sách phát ra hành động. |
| RL cho LLM (dựa trên mô hình phần thưởng) | PPO / GRPO (Giai đoạn 9 · 08, 12) | Actor-critic với lợi thế kiểu TD qua GAE. |
| RL ngoại tuyến | CQL / IQL (Giai đoạn 9 · 08) | Q-learning với regularization bảo thủ. |

Chín mươi phần trăm "RL" bạn đọc trong các bài báo năm 2026 là một sự mở rộng nào đó của Q-learning hoặc SARSA. Hiểu cập nhật dạng bảng đến mức thuần tay trước khi đọc sâu hơn.

## Ship It

Lưu thành `outputs/skill-td-agent.md`:

```markdown
---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Given a tabular or small-feature environment, output:

1. Algorithm. Q-learning / SARSA / Expected SARSA / n-step variant. One-sentence reason tied to on-policy vs off-policy and variance.
2. Hyperparameters. α, γ, ε, decay schedule.
3. Initialization. Q_0 value (optimistic vs zero) and justification.
4. Convergence diagnostic. Target learning curve, `|Q - Q*|` check if DP is possible.
5. Deployment caveat. How will exploration behave at inference? Is SARSA's conservatism needed?

Refuse to apply tabular TD to state spaces > 10⁶. Refuse to ship a Q-learning agent without a max-bias caveat. Flag any agent trained with ε held at 1.0 throughout (no exploitation phase).
```

## Exercises

1. **Dễ.** Triển khai Q-learning và SARSA trên GridWorld 4×4. Vẽ các đường cong học (lợi tức trung bình mỗi 100 episode) cho 2,000 episode. Ai hội tụ nhanh hơn?
2. **Trung bình.** Xây dựng một môi trường đi dọc vách đá (4×12, hàng cuối là vách với phần thưởng -100 và đặt lại về điểm bắt đầu). So sánh các chính sách cuối của Q-learning và SARSA. Chụp màn hình các đường đi mỗi bên chọn. Cái nào gần vách hơn?
3. **Khó.** Triển khai Double Q-learning. Trên một GridWorld phần thưởng có nhiễu (nhiễu Gaussian $\sigma=5$ được thêm vào phần thưởng mỗi bước), cho thấy Q-learning ước lượng quá cao $V^{\ast}(0,0)$ một lượng đáng kể trong khi Double Q-learning thì không.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| TD error (Sai số TD) | "Tín hiệu cập nhật" | $\delta = r + \gamma V(s') - V(s)$, phần dư được bootstrap. |
| TD(0) | "TD một bước" | Cập nhật sau mỗi chuyển tiếp chỉ dùng ước lượng của trạng thái tiếp theo. |
| Q-learning | "RL off-policy 101" | Cập nhật TD với `max` trên các hành động trạng thái tiếp theo; học $Q^{\ast}$ bất kể chính sách hành vi. |
| SARSA | "Q-learning on-policy" | Cập nhật TD dùng hành động tiếp theo thực tế; học $Q^\pi$ cho π ε-greedy hiện tại. |
| Expected SARSA (SARSA kỳ vọng) | "SARSA phương sai thấp" | Thay $a'$ được lấy mẫu bằng kỳ vọng của nó theo π. |
| GLIE | "Lịch khám phá đúng" | Tham lam trong giới hạn với khám phá vô hạn; cần cho hội tụ Q-learning. |
| Bootstrapping | "Dùng ước lượng hiện tại trong mục tiêu" | Điều phân biệt TD với MC. Nguồn độ chệch nhưng giảm phương sai rất lớn. |
| Maximization bias (Độ chệch cực đại hóa) | "Q-learning ước lượng quá cao" | `max` trên các ước lượng có nhiễu bị chệch lên; được khắc phục bằng Double Q-learning. |

## Further Reading

- [Watkins & Dayan (1992). Q-learning](https://link.springer.com/article/10.1007/BF00992698) — bài báo gốc và chứng minh hội tụ.
- [Sutton & Barto (2018). Ch. 6 — Temporal-Difference Learning](http://incompleteideas.net/book/RLbook2020.pdf) — TD(0), SARSA, Q-learning, Expected SARSA.
- [Hasselt (2010). Double Q-learning](https://papers.nips.cc/paper_files/paper/2010/hash/091d584fced301b442654dd8c23b3fc9-Abstract.html) — cách khắc phục độ chệch cực đại hóa.
- [Seijen, Hasselt, Whiteson, Wiering (2009). A Theoretical and Empirical Analysis of Expected SARSA](https://ieeexplore.ieee.org/document/4927542) — động cơ của expected SARSA.
- [Rummery & Niranjan (1994). On-line Q-learning using connectionist systems](https://www.researchgate.net/publication/2500611_On-Line_Q-Learning_Using_Connectionist_Systems) — bài báo đặt tên SARSA (khi đó gọi là "Q-learning connectionist sửa đổi").
- [Sutton & Barto (2018). Ch. 7 — n-step Bootstrapping](http://incompleteideas.net/book/RLbook2020.pdf) — khái quát TD(0) thành TD(n), con đường từ Q-learning đến eligibility trace và, về sau, GAE trong PPO.
