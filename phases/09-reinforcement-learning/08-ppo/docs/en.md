# Proximal Policy Optimization (PPO)

> A2C vứt bỏ mỗi rollout sau một lần cập nhật. PPO bọc gradient chính sách trong một tỷ số quan trọng được cắt để bạn có thể thực hiện 10+ epoch trên cùng dữ liệu mà chính sách không bùng nổ. Schulman và cộng sự (2017). Vẫn là thuật toán gradient chính sách mặc định vào năm 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 06 (REINFORCE), Phase 9 · 07 (Actor-Critic)
**Time:** ~75 minutes

## The Problem

A2C (Bài 07) là on-policy: gradient `E_{π_θ}[A · ∇ log π_θ]` yêu cầu dữ liệu được lấy mẫu từ `π_θ` *hiện tại*. Thực hiện một cập nhật, và `π_θ` thay đổi; dữ liệu bạn đã dùng giờ là off-policy. Tái sử dụng nó và gradient của bạn bị chệch.

Rollout tốn kém. Trên Atari, một rollout trên 8 môi trường × 128 bước = 1024 chuyển tiếp và khoảng mười hai giây thời gian môi trường. Vứt bỏ điều đó sau một bước gradient là lãng phí.

Tối ưu hóa chính sách miền tin cậy (TRPO, Schulman 2015) là cách khắc phục đầu tiên: ràng buộc mỗi cập nhật để phân kỳ KL giữa chính sách cũ và mới giữ dưới `δ`. Rõ ràng về lý thuyết, nhưng đòi hỏi giải gradient liên hợp mỗi cập nhật. Không ai chạy TRPO vào năm 2026.

PPO (Schulman và cộng sự 2017) thay ràng buộc miền tin cậy cứng bằng một mục tiêu được cắt đơn giản. Một dòng mã bổ sung. Mười epoch mỗi rollout. Không gradient liên hợp. Bảo đảm lý thuyết đủ tốt. Chín năm sau nó vẫn là thuật toán gradient chính sách mặc định cho mọi thứ từ MuJoCo đến RLHF.

## The Concept

![PPO clipped surrogate objective: ratio clipping at 1 ± ε](../assets/ppo.svg)

**Tỷ số quan trọng.**

`r_t(θ) = π_θ(a_t | s_t) / π_{θ_old}(a_t | s_t)`

Đây là tỷ số likelihood của chính sách mới so với chính sách đã thu thập dữ liệu. `r_t = 1` nghĩa là không thay đổi. `r_t = 2` nghĩa là chính sách mới có khả năng thực hiện `a_t` gấp đôi chính sách cũ.

**Mục tiêu thay thế được cắt.**

`L^{CLIP}(θ) = E_t [ min( r_t(θ) A_t, clip(r_t(θ), 1-ε, 1+ε) A_t ) ]`

Hai hạng tử:

- Nếu lợi thế `A_t > 0` và tỷ số cố tăng vượt `1 + ε`, phép cắt làm phẳng gradient — đừng đẩy một hành động tốt xa hơn `+ε` trên xác suất cũ.
- Nếu lợi thế `A_t < 0` và tỷ số cố tăng vượt `1 - ε` (nghĩa là chúng ta sẽ làm một hành động xấu có khả năng hơn so với mức giảm đã cắt của nó), phép cắt giới hạn gradient — đừng đẩy một hành động xấu xuống dưới `-ε`.

`min` xử lý hướng còn lại: nếu tỷ số đã dịch chuyển theo hướng *có lợi*, bạn vẫn nhận được gradient (không cắt ở phía sẽ gây hại cho bạn).

`ε = 0.2` điển hình. Vẽ mục tiêu như một hàm của `r_t`: một hàm tuyến tính từng đoạn với mái phẳng ở "phía tốt" và sàn phẳng ở "phía xấu."

**Hàm mất mát PPO đầy đủ.**

`L(θ, φ) = L^{CLIP}(θ) - c_v · (V_φ(s_t) - V_t^{target})² + c_e · H(π_θ(·|s_t))`

Cùng cấu trúc actor-critic như A2C. Ba hệ số, thường là `c_v = 0.5`, `c_e = 0.01`, `ε = 0.2`.

**Vòng lặp huấn luyện.**

1. Thu thập `N × T` chuyển tiếp trên `N` môi trường song song, mỗi môi trường `T` bước.
2. Tính lợi thế (GAE), đóng băng chúng thành hằng số.
3. Đóng băng `π_{θ_old}` thành một ảnh chụp của `π_θ` hiện tại.
4. Trong `K` epoch, với mỗi minibatch `(s, a, A, V_target, log π_old(a|s))`:
   - Tính `r_t(θ) = exp(log π_θ(a|s) - log π_old(a|s))`.
   - Áp dụng `L^{CLIP}` + hàm mất mát giá trị + entropy.
   - Bước gradient.
5. Bỏ rollout. Quay lại bước 1.

`K = 10` và minibatch 64 là một bộ siêu tham số tiêu chuẩn. PPO vững: các con số chính xác hiếm khi quan trọng trong khoảng ±50%.

**Biến thể phạt KL.** Bài báo gốc đề xuất một lựa chọn thay thế dùng khoản phạt KL thích nghi: `L = L^{PG} - β · KL(π_θ || π_old)` với `β` được điều chỉnh theo KL quan sát được. Phiên bản cắt trở nên chi phối; biến thể KL tồn tại trong RLHF (nơi KL đến chính sách tham chiếu là một ràng buộc riêng mà dù sao bạn cũng luôn muốn).

```figure
ppo-clip
```

## Build It

### Step 1: capture `log π_old(a | s)` at rollout time

```python
for step in range(T):
    probs = softmax(logits(theta, state_features(s)))
    a = sample(probs, rng)
    s_next, r, done = env.step(s, a)
    buffer.append({
        "s": s, "a": a, "r": r, "done": done,
        "v_old": value(w, state_features(s)),
        "log_pi_old": log(probs[a] + 1e-12),
    })
    s = s_next
```

Ảnh chụp được lấy một lần, lúc rollout. Nó không thay đổi trong các epoch cập nhật.

### Step 2: compute GAE advantages (Lesson 07)

Giống A2C. Chuẩn hóa trên batch.

### Step 3: clipped surrogate update

```python
for _ in range(K_EPOCHS):
    for mb in minibatches(buffer, size=64):
        for rec in mb:
            x = state_features(rec["s"])
            probs = softmax(logits(theta, x))
            logp = log(probs[rec["a"]] + 1e-12)
            ratio = exp(logp - rec["log_pi_old"])
            adv = rec["advantage"]
            surrogate = min(
                ratio * adv,
                clamp(ratio, 1 - EPS, 1 + EPS) * adv,
            )
            # backprop -surrogate, add value loss, subtract entropy
            grad_logpi = onehot(rec["a"]) - probs
            if (adv > 0 and ratio >= 1 + EPS) or (adv < 0 and ratio <= 1 - EPS):
                pg_grad = 0.0  # clipped
            else:
                pg_grad = ratio * adv
            for i in range(N_ACTIONS):
                for j in range(N_FEAT):
                    theta[i][j] += LR * pg_grad * grad_logpi[i] * x[j]
```

Mô thức "được cắt → gradient bằng không" là trái tim của PPO. Nếu chính sách mới đã trôi quá xa theo hướng có lợi, cập nhật dừng lại.

### Step 4: value and entropy

Thêm MSE tiêu chuẩn đến mục tiêu critic và một thưởng entropy trên actor, giống A2C.

### Step 5: diagnostics

Ba điều cần theo dõi mỗi cập nhật:

- **KL trung bình** `E[log π_old - log π_θ]`. Nên giữ trong `[0, 0.02]`. Nếu nó vượt mạnh `0.1`, giảm `K_EPOCHS` hoặc `LR`.
- **Tỷ lệ cắt** — tỷ lệ các mẫu có tỷ số nằm ngoài `[1-ε, 1+ε]`. Nên là `~0.1-0.3`. Nếu `~0`, phép cắt không bao giờ kích hoạt → tăng `LR` hoặc `K_EPOCHS`. Nếu `~0.5+`, bạn đang overfit rollout → giảm chúng.
- **Phương sai được giải thích** `1 - Var(V_target - V_pred) / Var(V_target)`. Thước đo chất lượng critic. Nên tăng về 1 khi critic học.

## Pitfalls

- **Hệ số cắt điều chỉnh sai.** `ε = 0.2` là tiêu chuẩn trên thực tế. Về `0.1` khiến cập nhật quá rụt rè; `0.3+` mời gọi bất ổn.
- **Quá nhiều epoch.** `K > 20` thường gây mất ổn định vì chính sách trôi xa `π_old`. Giới hạn số epoch, đặc biệt với mạng lớn.
- **Không chuẩn hóa phần thưởng.** Thang phần thưởng lớn ăn vào phạm vi cắt. Chuẩn hóa phần thưởng (độ lệch chuẩn tích lũy) trước khi tính lợi thế.
- **Quên chuẩn hóa lợi thế.** Chuẩn hóa trung bình bằng không/độ lệch chuẩn đơn vị theo batch là tiêu chuẩn. Bỏ nó phá hỏng PPO trên hầu hết benchmark.
- **Tốc độ học không giảm dần.** PPO hưởng lợi từ giảm LR tuyến tính về không. LR không đổi thường tệ hơn.
- **Lỗi toán tỷ số quan trọng.** Luôn dùng `exp(log_new - log_old)` cho ổn định số, không phải `new / old`.
- **Sai dấu gradient.** Tối đa hóa mục tiêu thay thế = *tối thiểu hóa* `-L^{CLIP}`. Đảo dấu là lỗi PPO phổ biến nhất.

## Use It

PPO là thuật toán RL mặc định năm 2026 trên một số lượng miền đáng ngạc nhiên:

| Trường hợp sử dụng | Biến thể PPO |
|----------|-------------|
| MuJoCo / điều khiển robot | PPO với chính sách Gaussian, GAE(0.95) |
| Atari / trò chơi rời rạc | PPO với chính sách phân loại, các rollout cuốn chiếu 128 bước |
| RLHF cho LLM | PPO với phạt KL đến mô hình tham chiếu, phần thưởng từ RM ở cuối phản hồi |
| Agent trò chơi quy mô lớn | IMPALA + PPO (AlphaStar, OpenAI Five) |
| LLM suy luận | GRPO (Bài 12) — biến thể PPO không có critic |
| Dữ liệu chỉ có sở thích | DPO — gộp PPO+KL thành dạng đóng, không lấy mẫu trực tuyến |

*Hình dạng hàm mất mát* PPO — mục tiêu thay thế được cắt + giá trị + entropy — là khung cho DPO, GRPO và gần như mọi pipeline RLHF.

## Ship It

Lưu thành `outputs/skill-ppo-trainer.md`:

```markdown
---
name: ppo-trainer
description: Produce a PPO training config and a diagnostic plan for a given environment.
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

Given an environment and training budget, output:

1. Rollout size. `N` envs × `T` steps.
2. Update schedule. `K` epochs, minibatch size, LR schedule.
3. Surrogate params. `ε` (clip), `c_v`, `c_e`, advantage normalization on.
4. Advantage. GAE(`λ`) with explicit `γ` and `λ`.
5. Diagnostics plan. KL, clip fraction, explained variance thresholds with alerts.

Refuse `K > 30` or `ε > 0.3` (unsafe trust region). Refuse any PPO run without advantage normalization or KL/clip monitoring. Flag clip fraction sustained above 0.4 as drift.
```

## Exercises

1. **Dễ.** Chạy PPO trên GridWorld 4×4 với `ε=0.2, K=4`. So sánh hiệu quả mẫu với A2C (một epoch mỗi rollout) ở số bước môi trường khớp nhau.
2. **Trung bình.** Quét `K ∈ {1, 4, 10, 30}`. Vẽ lợi tức theo số bước môi trường và theo dõi KL trung bình mỗi cập nhật. Ở `K` nào KL bùng nổ trên tác vụ này?
3. **Khó.** Thay mục tiêu thay thế được cắt bằng một khoản phạt KL thích nghi (`β` tăng gấp đôi nếu `KL > 2·target`, giảm một nửa nếu `KL < target/2`). So sánh lợi tức cuối cùng, tính ổn định và mức độ không cần cắt.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Importance ratio (Tỷ số quan trọng) | "r_t(θ)" | `π_θ(a\|s) / π_old(a\|s)`; độ lệch khỏi chính sách đã thu thập dữ liệu. |
| Clipped surrogate (Mục tiêu thay thế được cắt) | "Thủ thuật chính của PPO" | `min(r·A, clip(r, 1-ε, 1+ε)·A)`; gradient phẳng vượt mức cắt ở phía có lợi. |
| Trust region (Miền tin cậy) | "Ý định của TRPO / PPO" | Giới hạn KL của mỗi cập nhật để bảo đảm cải thiện đơn điệu. |
| KL penalty (Phạt KL) | "Miền tin cậy mềm" | PPO thay thế: `L - β · KL(π_θ \|\| π_old)`. `β` thích nghi. |
| Clip fraction (Tỷ lệ cắt) | "Tần suất cắt kích hoạt" | Chẩn đoán — nên là 0.1-0.3; bên ngoài nghĩa là điều chỉnh sai. |
| Multi-epoch training (Huấn luyện nhiều epoch) | "Tái sử dụng dữ liệu" | K epoch trên mỗi rollout; chi phí phương sai đổi lấy hiệu quả mẫu. |
| On-policy-ish (Gần on-policy) | "Phần lớn on-policy" | PPO về danh nghĩa là on-policy nhưng K>1 epoch dùng dữ liệu hơi off-policy một cách an toàn. |
| PPO-KL | "PPO còn lại" | Biến thể phạt KL; dùng trong RLHF nơi KL đến tham chiếu đã là một ràng buộc. |

## Further Reading

- [Schulman et al. (2017). Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) — bài báo.
- [Schulman et al. (2015). Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477) — TRPO, tiền thân của PPO.
- [Andrychowicz et al. (2021). What Matters In On-Policy RL? A Large-Scale Empirical Study](https://arxiv.org/abs/2006.05990) — mọi siêu tham số PPO được thử nghiệm loại bỏ.
- [Ouyang et al. (2022). Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) — InstructGPT; công thức PPO trong RLHF.
- [OpenAI Spinning Up — PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) — diễn giải hiện đại rõ ràng với PyTorch.
- [CleanRL PPO implementation](https://github.com/vwxyzjn/cleanrl) — PPO tham chiếu một file được nhiều bài báo dùng.
- [Hugging Face TRL — PPOTrainer](https://huggingface.co/docs/trl/main/en/ppo_trainer) — công thức production cho PPO trên mô hình ngôn ngữ; đọc cùng Bài 09 (RLHF).
- [Engstrom et al. (2020). Implementation Matters in Deep Policy Gradients](https://arxiv.org/abs/2005.12729) — bài báo "37 tối ưu hóa cấp mã"; những thủ thuật PPO nào là thiết yếu và những gì là kinh nghiệm truyền miệng.
