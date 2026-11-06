# Dynamic Programming — Policy Iteration & Value Iteration

> Quy hoạch động là RL có gian lận. Bạn đã biết các hàm chuyển tiếp và phần thưởng; bạn chỉ lặp phương trình Bellman cho đến khi $V$ hoặc $\pi$ ngừng thay đổi. Nó là benchmark mà mọi phương pháp dựa trên lấy mẫu cố tiếp cận.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## The Problem

Bạn có một MDP với một mô hình đã biết: bạn có thể truy vấn $P(s' \mid s, a)$ và $R(s, a, s')$ cho bất kỳ cặp trạng thái-hành động nào. Một nhà quản lý tồn kho biết phân phối nhu cầu. Một trò chơi bàn cờ có các chuyển tiếp tất định. Một gridworld là bốn dòng Python. Bạn có một *mô hình*.

RL không mô hình (Q-learning, PPO, REINFORCE) được phát minh cho trường hợp bạn không có mô hình — bạn chỉ có thể lấy mẫu từ môi trường. Nhưng khi có một mô hình, có các phương pháp nhanh hơn, tốt hơn: quy hoạch động. Bellman thiết kế chúng năm 1957. Chúng vẫn định nghĩa tính đúng đắn: khi mọi người nói "chính sách tối ưu cho MDP này," họ muốn nói chính sách mà DP sẽ trả về.

Bạn cần chúng vào năm 2026 vì ba lý do. Thứ nhất, mọi môi trường dạng bảng trong nghiên cứu RL (GridWorld, FrozenLake, CliffWalking) đều được giải bằng DP để tạo ra chính sách tiêu chuẩn vàng. Thứ hai, các giá trị chính xác cho phép bạn *gỡ lỗi* các phương pháp lấy mẫu: nếu ước lượng $V^{\ast}(s_0)$ của Q-learning khác câu trả lời DP 30%, Q-learning của bạn có lỗi. Thứ ba, các phương pháp RL ngoại tuyến và lập kế hoạch hiện đại (MCTS, tìm kiếm của AlphaZero, RL dựa trên mô hình ở Giai đoạn 9 · 10) đều lặp một phép cập nhật Bellman trên một mô hình được học hoặc cho trước.

## The Concept

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**Hai thuật toán, cả hai đều lặp điểm bất động trên Bellman.**

**Lặp chính sách.** Luân phiên hai bước cho đến khi chính sách ngừng thay đổi.

1. *Đánh giá:* với chính sách $\pi$, tính $V^\pi$ bằng cách áp dụng lặp lại $V(s) \leftarrow \sum_a \pi(a \mid s) \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$ cho đến khi hội tụ.
2. *Cải thiện:* với $V^\pi$, làm cho $\pi$ tham lam theo $V^\pi$: $\pi(s) \leftarrow \arg\max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$.

Hội tụ được bảo đảm vì (a) mỗi bước cải thiện hoặc giữ $\pi$ như cũ hoặc tăng nghiêm ngặt $V^\pi$ cho một trạng thái nào đó, (b) không gian các chính sách tất định là hữu hạn. Thường hội tụ trong ~5–20 lần lặp ngoài ngay cả với các không gian trạng thái lớn.

**Lặp giá trị.** Gộp đánh giá và cải thiện thành một lượt quét. Áp dụng phương trình *tối ưu* Bellman:

```math
V(s) \leftarrow \max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]
```

Lặp lại cho đến khi $\max_s \lvert V_{\text{new}}(s) - V(s) \rvert < \epsilon$. Trích xuất chính sách ở cuối bằng cách lấy hành động tham lam. Nhanh hơn hẳn mỗi lần lặp — không có vòng lặp đánh giá bên trong — nhưng thường cần nhiều lần lặp hơn để hội tụ.

**Lặp chính sách tổng quát (GPI).** Cách nhìn thống nhất. Hàm giá trị và chính sách bị khóa trong một vòng lặp cải thiện hai chiều; bất kỳ phương pháp nào đẩy cả hai về tính nhất quán lẫn nhau (lặp giá trị bất đồng bộ, lặp chính sách sửa đổi, Q-learning, actor-critic, PPO) đều là một trường hợp của GPI.

**Vì sao $\gamma < 1$ quan trọng.** Toán tử Bellman là một phép co $\gamma$ trong chuẩn sup: $\lVert T V - T V' \rVert_\infty \le \gamma \lVert V - V' \rVert_\infty$. Phép co ngụ ý điểm bất động duy nhất và hội tụ theo cấp số nhân. Bỏ $\gamma < 1$ và bạn mất bảo đảm — bạn cần một chân trời hữu hạn hoặc một trạng thái kết thúc hấp thụ.

```figure
value-iteration-gamma
```

## Build It

### Step 1: build the GridWorld MDP model

Dùng cùng GridWorld 4×4 từ Bài 01. Chúng ta thêm một biến thể ngẫu nhiên: với xác suất `0.1` agent trượt sang một hướng vuông góc ngẫu nhiên.

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)` trả về một danh sách `(s', r, p)`. Đây là toàn bộ mô hình.

### Step 2: policy evaluation

Với một chính sách `π(s) = {action: prob}`, lặp phương trình Bellman cho đến khi $V$ ngừng thay đổi:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### Step 3: policy improvement

Thay $\pi$ bằng chính sách tham lam theo $V$. Nếu $\pi$ không thay đổi, trả về — chúng ta ở điểm tối ưu.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### Step 4: stitch them together

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

Hội tụ điển hình trên 4×4: 4–6 lần lặp ngoài. Xuất ra $V^{\ast}(0,0) \approx -6$ và một chính sách giảm nghiêm ngặt số bước.

### Step 5: value iteration (the one-loop version)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

Cùng điểm bất động, ít dòng mã hơn.

## Pitfalls

- **Quên xử lý trạng thái kết thúc.** Nếu bạn áp dụng Bellman cho một trạng thái hấp thụ, nó vẫn chọn ra một "hành động tốt nhất" không thay đổi gì. Chặn bằng `if s == terminal: V[s] = 0`.
- **Hội tụ chuẩn sup so với L2.** Dùng `max |V_new - V|`, không phải trung bình. Bảo đảm lý thuyết nằm trên chuẩn sup.
- **Cập nhật tại chỗ so với đồng bộ.** Cập nhật `V[s]` tại chỗ (Gauss-Seidel) hội tụ nhanh hơn một dict `V_new` riêng (Jacobi). Mã production dùng tại chỗ.
- **Hòa chính sách.** Nếu hai hành động có giá trị Q bằng nhau, `argmax` có thể phá hòa khác nhau mỗi lần lặp, khiến kiểm tra "chính sách ổn định" dao động. Dùng một cách phá hòa ổn định (hành động đầu tiên theo thứ tự cố định).
- **Bùng nổ không gian trạng thái.** DP là $O(\lvert S \rvert \cdot \lvert A \rvert)$ mỗi lượt quét. Hoạt động đến ~10⁷ trạng thái. Vượt quá đó, bạn cần xấp xỉ hàm (Giai đoạn 9 · 05 trở đi).

## Use It

Vào năm 2026, DP là baseline tính đúng đắn và vòng lặp bên trong của các bộ lập kế hoạch:

| Trường hợp sử dụng | Phương pháp |
|----------|--------|
| Giải chính xác một MDP dạng bảng nhỏ | Lặp giá trị (đơn giản hơn) hoặc lặp chính sách (ít bước ngoài hơn) |
| Xác minh một triển khai Q-learning / PPO | So sánh với $V^{\ast}$ tối ưu theo DP trên một môi trường đồ chơi |
| RL dựa trên mô hình (Giai đoạn 9 · 10) | Phép cập nhật Bellman trên một mô hình chuyển tiếp được học |
| Lập kế hoạch trong AlphaZero / MuZero | Tìm kiếm cây Monte Carlo = phép cập nhật Bellman bất đồng bộ |
| RL ngoại tuyến (CQL, IQL) | Lặp Q bảo thủ — DP với một khoản phạt trên các hành động OOD |

Mỗi khi ai đó nói "hàm giá trị tối ưu," họ muốn nói "điểm bất động DP." Khi bạn thấy $V^{\ast}$ hoặc $Q^{\ast}$ trong một bài báo, hãy hình dung vòng lặp này.

## Ship It

Lưu thành `outputs/skill-dp-solver.md`:

```markdown
---
name: dp-solver
description: Solve a small tabular MDP exactly via policy iteration or value iteration. Report convergence behavior.
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

Given an MDP with a known model, output:

1. Choice. Policy iteration vs value iteration. Reason tied to |S|, |A|, γ.
2. Initialization. V_0, starting policy. Convergence sensitivity.
3. Stopping. Sup-norm tolerance ε. Expected number of sweeps.
4. Verification. V*(s_0) computed exactly. Greedy policy extracted.
5. Use. How this baseline will be used to debug/evaluate sampling-based methods.

Refuse to run DP on state spaces > 10⁷. Refuse to claim convergence without a sup-norm check. Flag any γ ≥ 1 on an infinite-horizon task as a guarantee violation.
```

## Exercises

1. **Dễ.** Chạy lặp giá trị trên GridWorld 4×4 với $\gamma \in \lbrace 0.9, 0.99 \rbrace$. Bao nhiêu lượt quét cho đến khi $\max \lvert \Delta V \rvert < 10^{-6}$? In $V^{\ast}$ thành một lưới 4×4.
2. **Trung bình.** So sánh lặp chính sách với lặp giá trị trên GridWorld *ngẫu nhiên* (xác suất trượt `0.1`). Đếm: lượt quét, thời gian thực, $V^{\ast}(0,0)$ cuối cùng. Cái nào hội tụ nhanh hơn theo số lần lặp? Theo thời gian thực?
3. **Khó.** Xây dựng lặp chính sách sửa đổi: ở bước đánh giá, chỉ chạy $k$ lượt quét thay vì đến hội tụ. Vẽ sai số $V^{\ast}(0,0)$ theo $k$ cho $k \in \lbrace 1, 2, 5, 10, 50 \rbrace$. Đường cong cho bạn biết gì về đánh đổi đánh giá/cải thiện?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Policy iteration (Lặp chính sách) | "Thuật toán DP" | Luân phiên đánh giá ($V^\pi$) và cải thiện ($\pi$ tham lam theo $V^\pi$) cho đến khi chính sách ngừng thay đổi. |
| Value iteration (Lặp giá trị) | "DP nhanh hơn" | Phép cập nhật tối ưu Bellman được áp dụng trong một lượt quét; hội tụ đến $V^{\ast}$ theo cấp số nhân. |
| Bellman operator (Toán tử Bellman) | "Đệ quy" | $(T V)(s) = \max_a \sum P (r + \gamma V(s'))$; một phép co $\gamma$ trong chuẩn sup. |
| Contraction (Phép co) | "Vì sao DP hội tụ" | Bất kỳ toán tử $T$ nào với $\lVert T x - T y \rVert \le \gamma \lVert x - y \rVert$ đều có một điểm bất động duy nhất. |
| GPI | "Mọi thứ đều là DP" | Lặp chính sách tổng quát: bất kỳ phương pháp nào đẩy $V$ và $\pi$ đến tính nhất quán lẫn nhau. |
| Synchronous update (Cập nhật đồng bộ) | "Kiểu Jacobi" | Dùng $V$ cũ xuyên suốt một lượt quét; dễ phân tích nhưng chậm hơn. |
| In-place update (Cập nhật tại chỗ) | "Kiểu Gauss-Seidel" | Dùng $V$ trong khi nó đang được cập nhật; hội tụ nhanh hơn trong thực tế. |

## Further Reading

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) — cách trình bày chuẩn về lặp chính sách và lặp giá trị.
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook_athena.html) — xử lý chặt chẽ các lập luận ánh xạ co.
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) — lặp chính sách sửa đổi và phân tích hội tụ của nó.
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) — bài báo lặp chính sách gốc.
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) — cầu nối từ DP sang DP xấp xỉ / RL sâu được mọi bài học tiếp theo dùng.
