# Deep Q-Networks (DQN)

> 2013: Mnih huấn luyện một mạng Q-learning trên pixel thô, đánh bại mọi agent RL cổ điển trên bảy trò chơi Atari. 2015: mở rộng lên 49 trò chơi, công bố trên Nature, khơi mào kỷ nguyên deep-RL. DQN là Q-learning cộng ba thủ thuật làm xấp xỉ hàm ổn định.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 03 (Backpropagation), Phase 9 · 04 (Q-learning, SARSA)
**Time:** ~75 minutes

## The Problem

Q-learning dạng bảng cần một giá trị Q riêng cho mỗi cặp (trạng thái, hành động). Một bàn cờ vua có ~10⁴³ trạng thái. Một khung hình Atari là 210×160×3 = 100,800 đặc trưng. RL dạng bảng chết ở hàng nghìn trạng thái, chứ chưa nói hàng tỷ.

Cách khắc phục hiển nhiên khi nhìn lại: thay bảng Q bằng một mạng nơ-ron, $Q(s, a; \theta)$. Nhưng điều hiển nhiên khi nhìn lại đã mất hàng thập kỷ. Xấp xỉ hàm đơn giản với Q-learning phân kỳ dưới "bộ ba chết chóc" — xấp xỉ hàm + bootstrapping + học off-policy. Mnih và cộng sự (2013, 2015) xác định ba thủ thuật kỹ thuật ổn định việc học:

1. **Phát lại trải nghiệm** khử tương quan các chuyển tiếp.
2. **Mạng mục tiêu** đóng băng mục tiêu bootstrap.
3. **Cắt phần thưởng** chuẩn hóa độ lớn gradient.

DQN trên Atari là lần đầu tiên một kiến trúc duy nhất với một bộ siêu tham số duy nhất giải hàng chục bài toán điều khiển từ pixel thô. Mọi thứ "deep-RL" được xây dựng từ đó — DDQN, Rainbow, Dueling, Distributional, R2D2, Agent57 — đều được xếp lên nền tảng ba thủ thuật này.

## The Concept

![DQN training loop: env, replay buffer, online net, target net, Bellman TD loss](../assets/dqn.svg)

**Mục tiêu.** DQN tối thiểu hóa hàm mất mát TD một bước trên một hàm Q nơ-ron:

```math
L(\theta) = \mathbb{E}_{(s,a,r,s') \sim D}[ (r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta))^2 ]
```

$\theta$ = mạng trực tuyến, được cập nhật mỗi bước bằng gradient descent. $\theta^-$ = mạng mục tiêu, được sao chép định kỳ từ $\theta$ (mỗi ~10,000 bước). $D$ = bộ đệm phát lại các chuyển tiếp quá khứ.

**Ba thủ thuật, theo thứ tự quan trọng:**

**Phát lại trải nghiệm.** Một bộ đệm vòng chứa `~10⁶` chuyển tiếp. Mỗi bước huấn luyện lấy mẫu một minibatch ngẫu nhiên đều. Điều này phá vỡ tương quan thời gian (các khung hình liên tiếp gần như giống hệt), cho phép mạng học nhiều lần từ các chuyển tiếp hiếm có phần thưởng, và khử tương quan các cập nhật gradient liên tiếp. Không có nó, TD on-policy với một mạng nơ-ron phân kỳ trên Atari.

**Mạng mục tiêu.** Dùng cùng mạng $Q(\cdot; \theta)$ ở cả hai vế phương trình Bellman khiến mục tiêu di chuyển mỗi lần cập nhật — "đuổi theo đuôi của chính mình." Cách khắc phục: giữ một mạng thứ hai $Q(\cdot; \theta^-)$ với trọng số đóng băng. Mỗi $C$ bước, sao chép $\theta \to \theta^-$. Điều này ổn định mục tiêu hồi quy cho hàng nghìn bước gradient mỗi lần. Cập nhật mềm $\theta^- \leftarrow \tau \theta + (1-\tau) \theta^-$ (được dùng trong DDPG, SAC) là một biến thể trơn hơn.

**Cắt phần thưởng.** Độ lớn phần thưởng Atari thay đổi từ 1 đến 1000+. Cắt về $\lbrace-1, 0, +1 \rbrace$ ngăn bất kỳ trò chơi đơn lẻ nào chi phối gradient. Sai khi độ lớn phần thưởng quan trọng; phù hợp cho Atari nơi chỉ dấu là quan trọng.

**Double DQN.** Hasselt (2016) khắc phục độ chệch cực đại hóa: dùng mạng trực tuyến để *chọn* hành động, mạng mục tiêu để *đánh giá* nó.

```math
\text{target} = r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-)
```

Thay thế trực tiếp, luôn tốt hơn. Dùng nó theo mặc định.

**Các cải thiện khác (Rainbow, 2017):** phát lại ưu tiên (lấy mẫu nhiều hơn các chuyển tiếp có sai số TD cao), kiến trúc dueling (các head $V(s)$ và lợi thế riêng), mạng có nhiễu (khám phá được học), lợi tức n bước, Q phân phối (C51/QR-DQN), bootstrapping nhiều bước. Mỗi thứ thêm vài phần trăm; các mức tăng gần như cộng được.

```figure
f3-dqn-stability
```

## Build It

Mã ở đây chỉ dùng stdlib, không numpy — chúng ta dùng một MLP một lớp ẩn tự viết trên một GridWorld liên tục nhỏ, nên mỗi bước huấn luyện chạy trong micro giây. Thuật toán giống hệt DQN Atari ở quy mô lớn.

### Step 1: replay buffer

```python
class ReplayBuffer:
    def __init__(self, capacity):
        self.buf = []
        self.capacity = capacity
    def push(self, s, a, r, s_next, done):
        if len(self.buf) == self.capacity:
            self.buf.pop(0)
        self.buf.append((s, a, r, s_next, done))
    def sample(self, batch, rng):
        return rng.sample(self.buf, batch)
```

Dung lượng ~10⁶ cho Atari, như trong DQN gốc (nó thu thập 50,000 chuyển tiếp trước khi bắt đầu học); 5,000 là đủ cho môi trường đồ chơi của chúng ta.

### Step 2: a tiny Q-network (manual MLP)

```python
class QNet:
    def __init__(self, n_in, n_hidden, n_actions, rng):
        self.W1 = [[rng.gauss(0, 0.3) for _ in range(n_in)] for _ in range(n_hidden)]
        self.b1 = [0.0] * n_hidden
        self.W2 = [[rng.gauss(0, 0.3) for _ in range(n_hidden)] for _ in range(n_actions)]
        self.b2 = [0.0] * n_actions
    def forward(self, x):
        h = [max(0.0, sum(w * xi for w, xi in zip(row, x)) + b) for row, b in zip(self.W1, self.b1)]
        q = [sum(w * hi for w, hi in zip(row, h)) + b for row, b in zip(self.W2, self.b2)]
        return q, h
```

Lượt truyền xuôi: tuyến tính → ReLU → tuyến tính. Đó là toàn bộ mạng.

### Step 3: the DQN update

```python
def train_step(online, target, batch, gamma, lr):
    grads = zeros_like(online)
    for s, a, r, s_next, done in batch:
        q, h = online.forward(s)
        if done:
            y = r
        else:
            q_next, _ = target.forward(s_next)
            y = r + gamma * max(q_next)
        td_error = q[a] - y
        accumulate_grads(grads, online, s, h, a, td_error)
    apply_sgd(online, grads, lr / len(batch))
```

Cấu trúc là Q-learning từ Bài 04 với hai khác biệt: (a) chúng ta lan truyền ngược qua một $Q(\cdot; \theta)$ khả vi thay vì truy cập bảng theo chỉ số, (b) mục tiêu dùng $Q(\cdot; \theta^-)$.

### Step 4: the outer loop

Với mỗi episode, hành động ε-greedy trên $Q(\cdot; \theta)$, đẩy các chuyển tiếp vào bộ đệm, lấy mẫu một minibatch, thực hiện một bước gradient, đồng bộ định kỳ $\theta^- \leftarrow \theta$. Mô thức:

```python
for episode in range(N):
    s = env.reset()
    while not done:
        a = epsilon_greedy(online, s, epsilon)
        s_next, r, done = env.step(s, a)
        buffer.push(s, a, r, s_next, done)
        if len(buffer) >= batch:
            train_step(online, target, buffer.sample(batch), gamma, lr)
        if steps % sync_every == 0:
            target = copy(online)
        s = s_next
```

Trên GridWorld nhỏ của chúng ta với một trạng thái one-hot 16 chiều, agent học một chính sách gần tối ưu trong ~500 episode. Trên Atari, mở rộng điều này lên 200M khung hình và thêm một bộ trích xuất đặc trưng CNN.

## Pitfalls

- **Bộ ba chết chóc.** Xấp xỉ hàm + off-policy + bootstrapping có thể phân kỳ. DQN giảm nhẹ bằng mạng mục tiêu + replay; đừng bỏ bên nào.
- **Khám phá.** ε phải giảm dần, thường từ 1.0 xuống 0.01 trong ~10% đầu của huấn luyện. Không có đủ khám phá sớm, mạng Q hội tụ vào một miền hút cục bộ.
- **Ước lượng quá cao.** `max` trên Q có nhiễu bị chệch lên. Luôn dùng Double DQN trong production.
- **Thang phần thưởng.** Cắt hoặc chuẩn hóa phần thưởng; độ lớn gradient tỷ lệ với độ lớn phần thưởng.
- **Khởi động lạnh bộ đệm phát lại.** Đừng huấn luyện cho đến khi bộ đệm có vài nghìn chuyển tiếp. Các gradient sớm trên ~20 mẫu bị overfit.
- **Tần suất đồng bộ mục tiêu.** Quá thường xuyên ≈ không có mạng mục tiêu; quá thưa ≈ mục tiêu cũ. DQN Atari dùng 10,000 bước môi trường. Quy tắc kinh nghiệm: đồng bộ mỗi ~1/100 chân trời huấn luyện.
- **Tiền xử lý quan sát.** DQN Atari xếp chồng 4 khung hình để làm trạng thái Markov. Bất kỳ môi trường nào có thông tin vận tốc đều cần xếp chồng khung hình hoặc trạng thái hồi tiếp.

## Use It

Vào năm 2026, DQN hiếm khi tiên tiến nhất nhưng vẫn là thuật toán off-policy tham chiếu:

| Tác vụ | Phương pháp được chọn | Vì sao không DQN? |
|------|------------------|--------------|
| Hành động rời rạc kiểu Atari | Rainbow DQN hoặc Muesli | Cùng khung, nhiều thủ thuật hơn. |
| Điều khiển liên tục | SAC / TD3 (Giai đoạn 9 · 07) | DQN không có mạng chính sách. |
| On-policy / thông lượng cao | PPO (Giai đoạn 9 · 08) | Không bộ đệm phát lại; dễ mở rộng quy mô hơn. |
| RL ngoại tuyến | CQL / IQL / Decision Transformer | Mục tiêu Q bảo thủ, không bùng nổ bootstrapping. |
| Không gian hành động rời rạc lớn (bộ đề xuất) | DQN với embedding hành động, hoặc IMPALA | Phù hợp; phần bổ sung quan trọng. |
| RL cho LLM | PPO / GRPO | Cấp chuỗi, không phải cấp bước; hàm mất mát khác. |

Các bài học vẫn lan tỏa. Replay và mạng mục tiêu xuất hiện trong SAC, TD3, DDPG, SAC-X, bộ đệm tự chơi của AlphaZero, và mọi phương pháp RL ngoại tuyến. Cắt phần thưởng tiếp tục tồn tại như chuẩn hóa lợi thế trong PPO. Kiến trúc là bản thiết kế.

## Ship It

Lưu thành `outputs/skill-dqn-trainer.md`:

```markdown
---
name: dqn-trainer
description: Produce a DQN training config (buffer, target sync, ε schedule, reward clipping) for a discrete-action RL task.
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

Given a discrete-action environment (observation shape, action count, horizon, reward scale), output:

1. Network. Architecture (MLP / CNN / Transformer), feature dim, depth.
2. Replay buffer. Capacity, minibatch size, warmup size.
3. Target network. Sync strategy (hard every C steps or soft τ).
4. Exploration. ε start / end / schedule length.
5. Loss. Huber vs MSE, gradient clip value, reward clipping rule.
6. Double DQN. On by default unless explicit reason to disable.

Refuse to ship a DQN with no target network, no replay buffer, or ε held at 1. Refuse continuous-action tasks (route to SAC / TD3). Flag any reward range > 10× per-step mean as needing clipping or scale normalization.
```

## Exercises

1. **Dễ.** Chạy `code/main.py`. Vẽ đường cong lợi tức theo episode. Bao nhiêu episode cho đến khi trung bình tích lũy vượt -10?
2. **Trung bình.** Tắt mạng mục tiêu (dùng mạng trực tuyến cho cả hai vế của mục tiêu Bellman). Đo tính không ổn định huấn luyện — lợi tức dao động hay phân kỳ?
3. **Khó.** Thêm Double DQN: dùng mạng trực tuyến để chọn `argmax a'`, mạng mục tiêu để đánh giá. So sánh độ chệch của `Q(s_0, best_a)` với $V^{\ast}(s_0)$ thật sau 1,000 episode khi có so với không có Double DQN trên một GridWorld phần thưởng có nhiễu.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| DQN | "Q-learning sâu" | Q-learning với một hàm Q nơ-ron, bộ đệm phát lại và mạng mục tiêu. |
| Experience replay (Phát lại trải nghiệm) | "Các chuyển tiếp được xáo trộn" | Bộ đệm vòng được lấy mẫu đều mỗi bước gradient; khử tương quan dữ liệu. |
| Target network (Mạng mục tiêu) | "Bootstrap đóng băng" | Bản sao định kỳ của Q dùng trong mục tiêu Bellman; ổn định huấn luyện. |
| Deadly triad (Bộ ba chết chóc) | "Vì sao RL phân kỳ" | Xấp xỉ hàm + bootstrapping + off-policy = không bảo đảm hội tụ. |
| Double DQN | "Cách khắc phục độ chệch cực đại hóa" | Mạng trực tuyến chọn hành động, mạng mục tiêu đánh giá nó. |
| Dueling DQN | "Các head V và A" | Phân rã Q = V + A - mean(A); cùng đầu ra, luồng gradient tốt hơn. |
| Rainbow | "Tất cả thủ thuật" | DDQN + PER + dueling + n-step + noisy + distributional trong một. |
| PER | "Phát lại ưu tiên" | Lấy mẫu các chuyển tiếp tỷ lệ với độ lớn sai số TD. |

## Further Reading

- [Mnih et al. (2013). Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) — bài báo workshop NeurIPS năm 2013 khởi đầu RL sâu.
- [Mnih et al. (2015). Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) — bài báo Nature, DQN 49 trò chơi.
- [Hasselt, Guez, Silver (2016). Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461) — DDQN.
- [Wang et al. (2016). Dueling Network Architectures](https://arxiv.org/abs/1511.06581) — DQN dueling.
- [Hessel et al. (2018). Rainbow: Combining Improvements in Deep RL](https://arxiv.org/abs/1710.02298) — bài báo xếp chồng thủ thuật.
- [Sutton & Barto (2018). Ch. 9 — On-policy Prediction with Approximation](http://incompleteideas.net/book/RLbook2020.pdf) — cách trình bày trong giáo trình về "bộ ba chết chóc" (xấp xỉ hàm + bootstrapping + off-policy) mà mạng mục tiêu và bộ đệm phát lại của DQN được thiết kế để chế ngự.
- [CleanRL DQN implementation](https://docs.cleanrl.dev/rl-algorithms/dqn/) — DQN tham chiếu một file được dùng trong các nghiên cứu loại bỏ thành phần; tốt để đọc cùng phiên bản từ đầu của bài học này.
