# Actor-Critic — A2C and A3C

> REINFORCE nhiều nhiễu. Thêm một critic học `V̂(s)`, trừ nó khỏi lợi tức, và bạn có một lợi thế có cùng kỳ vọng nhưng phương sai thấp hơn nhiều. Đó là actor-critic. A2C chạy nó đồng bộ; A3C chạy nó trên nhiều luồng. Cả hai là mô hình tư duy cho mọi phương pháp deep-RL hiện đại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 minutes

## The Problem

REINFORCE nguyên bản hoạt động, nhưng phương sai của nó khủng khiếp. Các lợi tức Monte Carlo `G_t` có thể dao động với hệ số 10 giữa các episode. Nhân nhiễu đó với `∇ log π` và lấy trung bình tạo ra một bộ ước lượng gradient cần hàng nghìn episode để dịch chuyển chính sách cùng khoảng cách mà bạn có thể dịch chuyển nó với ít cập nhật DQN hơn nhiều.

Phương sai đến từ việc dùng lợi tức thô. Nếu bạn trừ một baseline `b(s_t)` — bất kỳ hàm nào của trạng thái, gồm một giá trị được học — kỳ vọng không đổi và phương sai giảm. Baseline tốt nhất tính toán được là `V̂(s_t)`. Giờ đại lượng nhân với `∇ log π` là *lợi thế*:

`A(s, a) = G - V̂(s)`

Một hành động tốt nếu nó tạo ra lợi tức trên trung bình; xấu nếu dưới. REINFORCE với một critic được học là *actor-critic*. Critic cho actor một người thầy phương sai thấp. Đây là mọi phương pháp chính sách sâu sau năm 2015 (A2C, A3C, PPO, SAC, IMPALA).

## The Concept

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**Hai mạng, một hàm mất mát chung:**

- **Actor** `π_θ(a | s)`: chính sách. Được lấy mẫu để hành động. Được huấn luyện bằng gradient chính sách.
- **Critic** `V_φ(s)`: ước lượng lợi tức kỳ vọng từ trạng thái. Được huấn luyện để tối thiểu hóa `(V_φ(s) - target)²`.

**Lợi thế.** Hai dạng tiêu chuẩn:

- *Lợi thế MC:* `A_t = G_t - V_φ(s_t)`. Không chệch, phương sai cao hơn.
- *Lợi thế TD:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`. Chệch (dùng `V_φ`), phương sai thấp hơn nhiều. Cũng được gọi là *phần dư TD* `δ_t`.

**Lợi thế n bước.** Nội suy giữa hai dạng:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1` là TD thuần túy. `n = ∞` là MC. Hầu hết triển khai dùng `n = 5` cho Atari, `n = 2048` cho PPO trên MuJoCo.

**Ước lượng lợi thế tổng quát (GAE).** Schulman và cộng sự (2016) đề xuất một trung bình có trọng số theo hàm mũ trên tất cả lợi thế n bước:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

với `λ ∈ [0, 1]`. `λ = 0` là TD (phương sai thấp, độ chệch cao). `λ = 1` là MC (phương sai cao, không chệch). `λ = 0.95` là mặc định năm 2026 — điều chỉnh cho đến khi nút độ chệch/phương sai ở nơi bạn muốn.

**A2C: actor-critic lợi thế đồng bộ.** Thu thập `T` bước trên `N` môi trường song song. Tính lợi thế cho mỗi bước. Cập nhật actor và critic trên batch kết hợp. Lặp lại. Người anh em đơn giản hơn, dễ mở rộng quy mô hơn của A3C.

**A3C: actor-critic lợi thế bất đồng bộ.** Mnih và cộng sự (2016). Tạo `N` luồng worker, mỗi luồng chạy một môi trường. Mỗi worker tính gradient cục bộ trên rollout của chính nó, rồi áp dụng chúng bất đồng bộ vào một máy chủ tham số chung. Không cần bộ đệm phát lại — các worker khử tương quan bằng cách chạy các quỹ đạo khác nhau. A3C chứng minh bạn có thể huấn luyện trên CPU ở quy mô lớn. Vào năm 2026, A2C dựa trên GPU (các môi trường song song được gom batch) chi phối vì GPU muốn các batch lớn.

**Hàm mất mát kết hợp.**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

Ba hạng tử: hàm mất mát gradient chính sách, hồi quy giá trị, thưởng entropy. `c_v ~ 0.5`, `c_e ~ 0.01` là các điểm khởi đầu chuẩn.

```figure
actor-critic
```

## Build It

### Step 1: a critic

Critic tuyến tính `V_φ(s) = w · features(s)` được cập nhật bằng MSE:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

Trên một môi trường dạng bảng, critic hội tụ trong vài trăm episode. Trên Atari, thay critic tuyến tính bằng một thân CNN chung + head giá trị.

### Step 2: n-step advantage

Với một rollout dài `T` và một `V(s_T)` cuối được bootstrap:

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns` là mục tiêu critic. `advantages` là thứ nhân với `∇ log π`.

### Step 3: combined update

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

On-policy, một rollout mỗi cập nhật, tốc độ học riêng cho actor và critic.

### Step 4: parallelization (A3C vs A2C)

- **A3C:** khởi chạy `N` luồng. Mỗi luồng chạy môi trường riêng và lượt truyền xuôi riêng. Định kỳ đẩy các cập nhật gradient đến một bản chính chung. Không khóa trên bản chính — tranh chấp là được, chúng chỉ thêm nhiễu.
- **A2C:** chạy `N` bản môi trường trong một tiến trình duy nhất, xếp các quan sát thành một batch `[N, obs_dim]`, lượt truyền xuôi theo batch, lượt truyền ngược theo batch. Mức sử dụng GPU cao hơn, tất định, dễ suy luận hơn. Mặc định năm 2026.

Mã đồ chơi của chúng ta đơn luồng để rõ ràng; viết lại thành A2C theo batch là ba dòng numpy.

## Pitfalls

- **Độ chệch critic trước gradient actor.** Nếu critic ngẫu nhiên, baseline của nó không cung cấp thông tin và bạn đang huấn luyện trên nhiễu thuần túy. Khởi động critic trong vài trăm bước trước khi bật gradient chính sách, hoặc dùng tốc độ học actor chậm.
- **Chuẩn hóa lợi thế.** Chuẩn hóa lợi thế về trung bình bằng không/độ lệch chuẩn đơn vị mỗi batch. Ổn định huấn luyện rất nhiều với chi phí gần bằng không.
- **Thân chung.** Dùng một bộ trích xuất đặc trưng chung cho actor và critic trên đầu vào ảnh. Các head riêng. Các đặc trưng chung hưởng lợi từ cả hai hàm mất mát.
- **Quy ước on-policy.** A2C tái sử dụng dữ liệu cho đúng một lần cập nhật. Nhiều hơn thì gradient của bạn bị chệch (hiệu chỉnh lấy mẫu quan trọng là thứ PPO thêm vào).
- **Sụp đổ entropy.** Không có `c_e > 0`, chính sách trở nên gần tất định trong vài trăm lần cập nhật và ngừng khám phá.
- **Thang phần thưởng.** Độ lớn lợi thế phụ thuộc thang phần thưởng. Chuẩn hóa phần thưởng (ví dụ chia cho độ lệch chuẩn tích lũy) để có độ lớn gradient nhất quán xuyên tác vụ.

## Use It

A2C/A3C hiếm khi là lựa chọn cuối vào năm 2026 nhưng chúng là kiến trúc mà mọi thứ về sau cải tiến:

| Phương pháp | Quan hệ với A2C |
|--------|----------------|
| PPO | A2C + tỷ số quan trọng được cắt cho các cập nhật nhiều epoch |
| IMPALA | A3C + hiệu chỉnh off-policy V-trace |
| SAC (Giai đoạn 9 · 07) | A2C off-policy với một critic giá trị mềm (bài tiếp theo) |
| GRPO (Giai đoạn 9 · 12) | A2C không có critic — lợi thế tương đối theo nhóm |
| DPO | A2C được gộp thành một hàm mất mát xếp hạng sở thích, không lấy mẫu |
| AlphaStar / OpenAI Five | A2C với huấn luyện liên đoàn + huấn luyện trước bằng bắt chước |

Nếu bạn thấy "lợi thế" trong một bài báo năm 2026, hãy nghĩ actor-critic.

## Ship It

Lưu thành `outputs/skill-actor-critic-trainer.md`:

```markdown
---
name: actor-critic-trainer
description: Produce an A2C / A3C / GAE configuration for a given environment, with advantage estimation and loss weights specified.
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

Given an environment and compute budget, output:

1. Parallelism. A2C (GPU batched) vs A3C (CPU async) and the number of workers.
2. Rollout length T. Steps per env per update.
3. Advantage estimator. n-step or GAE(λ); specify λ.
4. Loss weights. `c_v` (value), `c_e` (entropy), gradient clip.
5. Learning rates. Actor and critic (separate if using).

Refuse single-worker A2C on environments with horizon > 1000 (too on-policy, too slow). Refuse to ship without advantage normalization. Flag any run with `c_e = 0` and observed entropy < 0.1 as entropy-collapsed.
```

## Exercises

1. **Dễ.** Huấn luyện actor-critic với lợi thế MC (`G_t - V(s_t)`) trên GridWorld 4×4. So sánh hiệu quả mẫu với REINFORCE có baseline trung bình tích lũy từ Bài 06.
2. **Trung bình.** Chuyển sang lợi thế phần dư TD (`r + γ V(s') - V(s)`). Đo phương sai của các batch lợi thế. Nó giảm bao nhiêu?
3. **Khó.** Triển khai GAE(λ). Quét `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`. Vẽ lợi tức cuối cùng so với hiệu quả mẫu. Điểm độ chệch/phương sai tốt nhất cho tác vụ này ở đâu?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Actor | "Mạng chính sách" | `π_θ(a\|s)`, được cập nhật bằng gradient chính sách. |
| Critic | "Mạng giá trị" | `V_φ(s)`, được cập nhật bằng hồi quy MSE đến lợi tức / mục tiêu TD. |
| Advantage (Lợi thế) | "Tốt hơn trung bình bao nhiêu" | `A(s, a) = Q(s, a) - V(s)` hoặc các bộ ước lượng của nó. Hệ số nhân cho `∇ log π`. |
| TD residual (Phần dư TD) | "δ" | `δ_t = r + γ V(s') - V(s)`; ước lượng lợi thế một bước. |
| GAE | "Nút nội suy" | Tổng có trọng số theo hàm mũ của các lợi thế n bước, được tham số hóa bởi `λ`. |
| A2C | "Actor-critic đồng bộ" | Gom batch xuyên các môi trường; một bước gradient mỗi rollout. |
| A3C | "Actor-critic bất đồng bộ" | Các luồng worker đẩy gradient đến một máy chủ tham số chung. Bài báo gốc; ít phổ biến hơn vào năm 2026. |
| Bootstrap | "Dùng V ở chân trời" | Cắt ngắn rollout, thêm `γ^n V(s_{t+n})` để khép tổng. |

## Further Reading

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) — A3C, bài báo actor-critic bất đồng bộ gốc.
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) — GAE.
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) — nền tảng; ghép phần này với Chương 9 về xấp xỉ hàm khi critic là một mạng nơ-ron.
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) — actor-critic phân tán có thể mở rộng quy mô với hiệu chỉnh off-policy V-trace.
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) — các triển khai A2C/PPO production đáng đọc.
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) — kết quả hội tụ nền tảng cho phân rã actor-critic hai thang thời gian.
