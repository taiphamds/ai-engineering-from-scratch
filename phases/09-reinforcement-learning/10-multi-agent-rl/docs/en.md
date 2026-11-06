# Multi-Agent RL

> RL đơn agent giả định môi trường là dừng. Đặt hai agent đang học vào cùng một thế giới và giả định đó vỡ: mỗi agent là một phần môi trường của agent kia, và cả hai đều đang thay đổi. RL đa agent là tập hợp các thủ thuật làm việc học hội tụ khi giả định Markov không còn đúng.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (Q-learning), Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~45 minutes

## The Problem

Một robot học điều hướng trong một căn phòng là một bài toán RL đơn agent. Một đội bóng đá thì không. AlphaStar đối đầu các đối thủ StarCraft thì không. Một thị trường các agent đấu giá thì không. Hai xe thương lượng tại một giao lộ bốn hướng có biển dừng thì không. Các bài toán thực tế nhiều bên đối nhiều bên thì không.

Trong mọi bối cảnh đa agent, từ góc nhìn của bất kỳ một agent nào, các agent khác *là* một phần môi trường. Khi chúng học và thay đổi hành vi, môi trường trở nên phi dừng. Tính chất Markov — "trạng thái tiếp theo chỉ phụ thuộc trạng thái hiện tại và hành động của tôi" — bị vi phạm vì trạng thái tiếp theo cũng phụ thuộc những gì các agent *khác* đã chọn, và chính sách của chúng là các mục tiêu di động.

Điều này phá vỡ các chứng minh hội tụ dạng bảng (bảo đảm của Q-learning giả định một môi trường dừng). Nó cũng phá vỡ RL sâu đơn giản: các agent đuổi nhau trong vòng lặp, không bao giờ hội tụ về một chính sách ổn định. Bạn cần các kỹ thuật riêng cho đa agent: huấn luyện tập trung / thực thi phi tập trung, baseline phản thực tế, chơi liên đoàn, tự chơi.

Ứng dụng năm 2026: bầy robot, định tuyến giao thông, đội xe tự hành, bộ mô phỏng thị trường, các hệ thống LLM đa agent (Giai đoạn 16), và bất kỳ trò chơi nào có hơn một người chơi thông minh.

## The Concept

![Four MARL regimes: indep, centralized critic, self-play, league](../assets/marl.svg)

**Hình thức: Trò chơi Markov.** Một khái quát hóa của MDP: các trạng thái $S$, một hành động chung $a = (a_1, \ldots, a_n)$, chuyển tiếp $P(s' \mid s, a)$, và các phần thưởng theo agent $R_i(s, a, s')$. Mỗi agent $i$ tối đa hóa lợi tức riêng theo chính sách riêng $\pi_i$. Nếu phần thưởng giống hệt, nó là **hoàn toàn hợp tác**. Nếu tổng bằng không, nó là **đối kháng**. Nếu hỗn hợp, nó là **general-sum**.

**Các thách thức cốt lõi:**

- **Tính phi dừng.** $P(s' \mid s, a_i)$ từ góc nhìn agent $i$ phụ thuộc $\pi_{-i}$, vốn đang thay đổi.
- **Gán công trạng.** Với một phần thưởng chung, agent nào gây ra nó?
- **Phối hợp khám phá.** Các agent phải khám phá các chiến lược bổ trợ, không khám phá trùng lặp cùng trạng thái.
- **Khả năng mở rộng quy mô.** Không gian hành động chung tăng theo hàm mũ theo $n$.
- **Khả năng quan sát một phần.** Mỗi agent chỉ thấy quan sát riêng; trạng thái toàn cục bị ẩn.

**Bốn chế độ chi phối:**

**1. Q-learning độc lập / PPO độc lập (IQL, IPPO).** Mỗi agent học Q hoặc chính sách riêng, coi các agent khác là một phần môi trường. Đơn giản, đôi khi hoạt động (đặc biệt với phát lại trải nghiệm đóng vai một thủ thuật làm trơn mô hình hóa agent). Hội tụ lý thuyết: không có. Trong thực tế: phù hợp cho các tác vụ ghép lỏng, kém cho các tác vụ ghép chặt.

**2. Huấn luyện tập trung, thực thi phi tập trung (CTDE).** Mô thức hiện đại phổ biến nhất. Mỗi agent có *chính sách* riêng $\pi_i$ có điều kiện theo quan sát cục bộ $o_i$ — thực thi phi tập trung tiêu chuẩn khi triển khai. Trong *huấn luyện*, một critic tập trung $Q(s, a_1, \ldots, a_n)$ có điều kiện theo toàn bộ trạng thái toàn cục và hành động chung. Ví dụ:
- **MADDPG** (Lowe và cộng sự 2017): DDPG với một critic tập trung cho mỗi agent.
- **COMA** (Foerster và cộng sự 2017): baseline phản thực tế — hỏi "phần thưởng của tôi sẽ là gì nếu thay vào đó tôi thực hiện hành động $a'$?" — cô lập đóng góp của tôi.
- **MAPPO** / **IPPO** với critic chung (Yu và cộng sự 2022): PPO với một hàm giá trị tập trung. Chi phối vào năm 2026 cho MARL hợp tác.
- **QMIX** (Rashid và cộng sự 2018): phân rã giá trị — $Q_{\text{tot}}(s, a) = f(Q_1(s, a_1), \ldots, Q_n(s, a_n))$ với trộn đơn điệu.

**3. Tự chơi.** Hai bản sao của cùng một agent chơi với nhau. Chính sách đối thủ *là* chính sách của tôi từ một ảnh chụp quá khứ. AlphaGo / AlphaZero / MuZero. OpenAI Five. Hoạt động tốt nhất cho các trò chơi tổng bằng không; tín hiệu huấn luyện đối xứng.

**4. Chơi liên đoàn.** Một mở rộng của tự chơi sang các môi trường general-sum / đối kháng: giữ một quần thể các chính sách quá khứ và hiện tại, lấy mẫu một đối thủ từ liên đoàn, huấn luyện đấu với họ. Thêm các exploiter (chuyên đánh bại bên tốt nhất hiện tại) và các main exploiter (chuyên đánh bại exploiter). AlphaStar (StarCraft II). Cần khi trò chơi cho phép các chu kỳ chiến lược "kéo-búa-bao".

**Giao tiếp.** Cho phép các agent gửi các thông điệp được học $m_i$ cho nhau. Hoạt động trong các bối cảnh hợp tác. Foerster và cộng sự (2016) cho thấy giao tiếp khả vi giữa các agent có thể được huấn luyện đầu cuối. Các hệ thống đa agent dựa trên LLM ngày nay (Giai đoạn 16) về cơ bản giao tiếp bằng ngôn ngữ tự nhiên.

```figure
f3-marl-orbit
```

## Build It

Bài học này dùng một GridWorld 6×6 với hai agent hợp tác. Chúng bắt đầu ở hai góc đối diện và phải đến một mục tiêu chung. Phần thưởng chung: `-1` mỗi bước khi một trong hai agent vẫn đang di chuyển, `+10` khi cả hai đến. Xem `code/main.py`.

### Step 1: the multi-agent env

```python
class CoopGridWorld:
    def __init__(self):
        self.size = 6
        self.goal = (5, 5)

    def reset(self):
        return ((0, 0), (5, 0))  # two agents

    def step(self, state, actions):
        a1, a2 = state
        new1 = move(a1, actions[0])
        new2 = move(a2, actions[1])
        done = (new1 == self.goal) and (new2 == self.goal)
        reward = 10.0 if done else -1.0
        return (new1, new2), reward, done
```

Không gian hành động *chung* là `|A|² = 16`. Trạng thái toàn cục là hai vị trí.

### Step 2: independent Q-learning

Mỗi agent chạy bảng Q riêng với khóa là trạng thái chung. Ở mỗi bước: cả hai chọn các hành động ε-greedy, thu thập chuyển tiếp chung, mỗi bên cập nhật Q riêng bằng phần thưởng chung.

```python
def independent_q(env, episodes, alpha, gamma, epsilon):
    Q1, Q2 = defaultdict(default_q), defaultdict(default_q)
    for _ in range(episodes):
        s = env.reset()
        done = False
        while not done:
            a1 = epsilon_greedy(Q1, s, epsilon)
            a2 = epsilon_greedy(Q2, s, epsilon)
            s_next, r, done = env.step(s, (a1, a2))
            if done:
                Q1[s][a1] += alpha * (r - Q1[s][a1])
                Q2[s][a2] += alpha * (r - Q2[s][a2])
                break
            target1 = r + gamma * max(Q1[s_next].values())
            target2 = r + gamma * max(Q2[s_next].values())
            Q1[s][a1] += alpha * (target1 - Q1[s][a1])
            Q2[s][a2] += alpha * (target2 - Q2[s][a2])
            s = s_next
```

Hoạt động trên tác vụ này vì phần thưởng dày đặc và cùng hướng. Thất bại trên các tác vụ ghép chặt (ví dụ nơi một agent phải *đợi* agent kia).

### Step 3: centralized Q with decomposed-value update

Sử dụng một Q trên các hành động kết hợp $Q(s, a_1, a_2)$. Cập nhật từ phần thưởng chia sẻ. Phi tập trung hóa lúc thực thi bằng cách lấy biên: $\pi_i(s) = \arg\max_{a_i} \max_{a_{-i}} Q(s, a_1, a_2)$. Đánh đổi không gian hành động kết hợp tăng theo hàm mũ lấy một góc nhìn toàn cục *đúng*.

### Step 4: simple self-play (adversarial 2-agent)

Cùng agent, hai vai trò. Huấn luyện agent A đấu agent B; sau $K$ episode, sao chép trọng số của A vào B. Huấn luyện đối xứng, tiến bộ nhất quán. Công thức AlphaZero thu nhỏ.

## Pitfalls

- **Replay phi dừng.** Phát lại trải nghiệm với các agent độc lập tệ hơn đơn agent vì các chuyển tiếp cũ được sinh bởi các đối thủ giờ đã lỗi thời. Cách khắc phục: gán nhãn lại hoặc đặt trọng số theo độ mới.
- **Mơ hồ gán công trạng.** Phần thưởng chung sau một episode dài; không có cách rõ ràng để nói agent nào đã đóng góp. Cách khắc phục: baseline phản thực tế (COMA), hoặc định hình phần thưởng theo agent.
- **Trôi chính sách / đuổi nhau.** Phản ứng tốt nhất của mỗi agent thay đổi theo cập nhật của các agent khác. Cách khắc phục: critic tập trung, tốc độ học chậm, hoặc đóng băng từng bên một.
- **Reward hacking qua phối hợp.** Các agent tìm các cách khai thác phối hợp mà người thiết kế không dự liệu. Các agent đấu giá hội tụ về đặt giá không. Cách khắc phục: thiết kế phần thưởng cẩn thận, các ràng buộc hành vi.
- **Khám phá trùng lặp.** Cả hai agent khám phá cùng các cặp trạng thái-hành động. Cách khắc phục: thưởng entropy theo agent, hoặc điều kiện hóa theo vai trò.
- **Chu kỳ liên đoàn.** Tự chơi thuần túy có thể bị kẹt trong một chu kỳ thống trị. Cách khắc phục: chơi liên đoàn với đối thủ đa dạng.
- **Bùng nổ mẫu.** `n` agent × không gian trạng thái × hành động chung. Xấp xỉ bằng xấp xỉ hàm; các không gian hành động được phân tách (một head đầu ra chính sách mỗi agent).

## Use It

Bản đồ ứng dụng MARL năm 2026:

| Miền | Phương pháp | Ghi chú |
|--------|--------|-------|
| Điều hướng / thao tác hợp tác | MAPPO / QMIX | CTDE; critic chung + actor phi tập trung. |
| Trò chơi hai người (cờ vua, cờ vây, poker) | Tự chơi với MCTS (AlphaZero) | Tổng bằng không; huấn luyện đối xứng. |
| Nhiều người chơi phức tạp (Dota, StarCraft) | Chơi liên đoàn + huấn luyện trước bằng bắt chước | OpenAI Five, AlphaStar. |
| Đội xe tự hành | CTDE MAPPO / PPO với attention | Quan sát một phần; kích thước đội thay đổi. |
| Thị trường đấu giá | Cân bằng lý thuyết trò chơi + RL | RL trường trung bình khi `n` → ∞. |
| Các hệ thống LLM đa agent (Giai đoạn 16) | Giao tiếp ngôn ngữ tự nhiên + điều kiện hóa theo vai trò | Vòng lặp RL ở lớp lập kế hoạch agent. |

Vào năm 2026, lĩnh vực tăng trưởng lớn nhất của MARL là dựa trên LLM: các bầy agent mô hình ngôn ngữ thương lượng, tranh luận, xây dựng phần mềm. RL xuất hiện dưới dạng tối ưu sở thích trên các đầu ra *cấp quỹ đạo*, không phải cấp token (Giai đoạn 16 · 03).

## Ship It

Lưu thành `outputs/skill-marl-architect.md`:

```markdown
---
name: marl-architect
description: Pick the right multi-agent RL regime (IPPO, CTDE, self-play, league) for a given task.
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

Given a task with `n` agents, output:

1. Regime classification. Cooperative / adversarial / general-sum. Justify.
2. Algorithm. IPPO / MAPPO / QMIX / self-play / league. Reason tied to coupling tightness and reward structure.
3. Information access. Centralized training (what global info goes to the critic)? Decentralized execution?
4. Credit assignment. Counterfactual baseline, value decomposition, or reward shaping.
5. Exploration plan. Per-agent entropy, population-based training, or league.

Refuse independent Q-learning on tightly-coupled cooperative tasks. Refuse to recommend self-play for general-sum with cycle risks. Flag any MARL pipeline without a fixed-opponent eval (cherry-picked self-play numbers are common).
```

## Exercises

1. **Dễ.** Huấn luyện Q-learning độc lập trên GridWorld hợp tác 2 agent. Bao nhiêu episode cho đến khi lợi tức trung bình > 0? Vẽ đường cong học chung.
2. **Trung bình.** Thêm một tác vụ "phối hợp": mục tiêu chỉ đạt được khi cả hai agent bước lên nó trong cùng lượt. Q độc lập có còn hội tụ không? Điều gì hỏng?
3. **Khó.** Triển khai một critic tập trung cho huấn luyện kiểu MAPPO và so sánh tốc độ hội tụ với PPO độc lập trên tác vụ phối hợp.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Markov game (Trò chơi Markov) | "MDP đa agent" | $(S, A_1, \ldots, A_n, P, R_1, \ldots, R_n)$; mỗi agent có phần thưởng riêng. |
| CTDE | "Huấn luyện tập trung, thực thi phi tập trung" | Critic chung lúc huấn luyện; chính sách của mỗi agent chỉ dùng quan sát cục bộ. |
| IPPO | "PPO độc lập" | Mỗi agent chạy PPO riêng. Baseline đơn giản; thường bị đánh giá thấp. |
| MAPPO | "PPO đa agent" | PPO với một hàm giá trị tập trung có điều kiện theo trạng thái toàn cục. |
| QMIX | "Phân rã giá trị đơn điệu" | $Q_{\text{tot}} = f_{\text{monotone}}(Q_1, \ldots, Q_n)$ cho phép argmax phi tập trung. |
| COMA | "Đa agent phản thực tế" | Lợi thế = Q của tôi trừ Q kỳ vọng lấy biên trên hành động của tôi. |
| Self-play (Tự chơi) | "Agent đấu với bản thân quá khứ" | Một agent, hai vai trò; tiêu chuẩn cho các trò chơi tổng bằng không. |
| League play (Chơi liên đoàn) | "Huấn luyện quần thể" | Cache các chính sách quá khứ, lấy mẫu đối thủ từ tập; xử lý chu kỳ chiến lược. |

## Further Reading

- [Lowe et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments (MADDPG)](https://arxiv.org/abs/1706.02275) — CTDE với một critic tập trung.
- [Foerster et al. (2017). Counterfactual Multi-Agent Policy Gradients (COMA)](https://arxiv.org/abs/1705.08926) — baseline phản thực tế cho gán công trạng.
- [Rashid et al. (2018). QMIX: Monotonic Value Function Factorisation](https://arxiv.org/abs/1803.11485) — phân rã giá trị với tính đơn điệu.
- [Yu et al. (2022). The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games (MAPPO)](https://arxiv.org/abs/2103.01955) — PPO mạnh đáng ngạc nhiên cho MARL.
- [Vinyals et al. (2019). Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z) — chơi liên đoàn ở quy mô lớn.
- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270) — tự chơi thuần túy trong các trò chơi tổng bằng không.
- [Sutton & Barto (2018). Ch. 15 — Neuroscience & Ch. 17 — Frontiers](http://incompleteideas.net/book/RLbook2020.pdf) — bao gồm phần trình bày ngắn của giáo trình về các bối cảnh đa agent và vấn đề phi dừng mà CTDE được thiết kế để giải quyết.
- [Zhang, Yang & Başar (2021). Multi-Agent Reinforcement Learning: A Selective Overview](https://arxiv.org/abs/1911.10635) — khảo sát trình bày MARL hợp tác, cạnh tranh và hỗn hợp với các kết quả hội tụ.
