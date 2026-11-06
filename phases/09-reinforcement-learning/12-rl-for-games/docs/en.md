# RL for Games — AlphaZero, MuZero, and the LLM-Reasoning Era

> 1992: TD-Gammon đánh bại các nhà vô địch con người ở backgammon bằng TD thuần túy. 2016: AlphaGo đánh bại Lee Sedol. 2017: AlphaZero thống trị cờ vua, shogi và cờ vây từ đầu. 2025: DeepSeek-R1 chứng minh cùng công thức đó, với GRPO thay PPO, hoạt động cho suy luận. Trò chơi là benchmark thúc đẩy mọi đột phá trong giai đoạn này.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 05 (DQN), Phase 9 · 08 (PPO), Phase 9 · 09 (RLHF), Phase 9 · 10 (MARL)
**Time:** ~120 minutes

## The Problem

Trò chơi có mọi thứ RL muốn. Phần thưởng rõ ràng (thắng/thua). Vô hạn episode (tự chơi đặt lại). Mô phỏng hoàn hảo (trò chơi *là* bộ mô phỏng). Không gian hành động rời rạc hoặc liên tục nhỏ. Cấu trúc đa agent buộc phải vững trước đối kháng.

Và trò chơi là cách mọi đột phá RL lớn được kiểm nghiệm. TD-Gammon (backgammon, 1992). Atari-DQN (2013). AlphaGo (2016). AlphaZero (2017). OpenAI Five (Dota 2, 2019). AlphaStar (StarCraft II, 2019). MuZero (mô hình được học, 2019). AlphaTensor (nhân ma trận, 2022). AlphaDev (thuật toán sắp xếp, 2023). DeepSeek-R1 (suy luận toán học, 2025) — minh chứng mới nhất rằng các kỹ thuật RL trò chơi hoạt động trên văn bản.

Bài tổng kết này khảo sát ba kiến trúc cột mốc — AlphaZero, MuZero và GRPO — qua một lăng kính thống nhất duy nhất: **tự chơi + tìm kiếm + cải thiện chính sách**. Mỗi kiến trúc khái quát kiến trúc trước; riêng GRPO là công thức AlphaZero được áp dụng cho suy luận LLM, với token làm hành động và xác minh toán học làm tín hiệu thắng.

## The Concept

![AlphaZero ↔ MuZero ↔ GRPO: same loop, different environments](../assets/rl-games.svg)

**Vòng lặp thống nhất.**

```
while True:
    trajectory = self_play(current_policy, search)     # play game against self
    policy_target = search.improved_policy(trajectory) # search improves raw policy
    policy_net.update(policy_target, value_target)     # supervised on search output
```

**AlphaZero (2017).** Silver và cộng sự. Với một trò chơi (cờ vua, shogi, cờ vây) có luật đã biết:

- Mạng chính sách-giá trị: một tháp $f_\theta(s) \to (p, v)$. $p$ là một tiên nghiệm trên các nước đi hợp lệ. $v$ là kết quả ván đấu kỳ vọng.
- Monte Carlo Tree Search (MCTS): ở mỗi nước đi, mở rộng một cây gồm các diễn biến tiếp theo có thể có. Sử dụng $(p, v)$ làm tiên nghiệm + bootstrap. Chọn nút bằng UCB (PUCT): $a^{\ast} = \arg\max_a Q(s, a) + c \cdot p(a \mid s) \cdot \sqrt{N(s)} / (1 + N(s, a))$.
- Tự chơi: chơi các ván agent đấu agent. Ở nước đi $t$, phân phối lượt ghé MCTS $\pi_t$ trở thành mục tiêu huấn luyện chính sách.
- Hàm mất mát: $L = (v - z)^2 - \pi \cdot \log p + c \cdot \lVert \theta \rVert^2$. $z$ là kết quả ván đấu (+1 / 0 / -1).

Không kiến thức con người. Không heuristic thủ công. Một công thức duy nhất làm chủ cờ vua, shogi và cờ vây sau vài chục triệu ván tự chơi cho mỗi trò.

**MuZero (2019).** Schrittwieser và cộng sự. Bỏ yêu cầu rằng luật phải được biết.

- Thay vì một môi trường cố định, học một *mô hình động lực học tiềm ẩn* $(h, g, f)$:
  - $h(s)$: mã hóa quan sát thành trạng thái tiềm ẩn.
  - $g(s_{\text{latent}}, a)$: dự đoán trạng thái tiềm ẩn tiếp theo + phần thưởng.
  - $f(s_{\text{latent}})$: dự đoán tiên nghiệm chính sách + giá trị.
- MCTS chạy trong *không gian tiềm ẩn được học*. Cùng tìm kiếm, cùng vòng lặp huấn luyện.
- Hoạt động trên cờ vây, cờ vua, shogi *và* Atari — một thuật toán, không kiến thức luật.

**Stochastic MuZero (2022).** Thêm động lực học ngẫu nhiên và các nút may rủi; mở rộng đến các trò chơi hạng backgammon.

**Muesli, Gumbel MuZero (2022-2024).** Cải thiện hiệu quả mẫu và tìm kiếm tất định.

**GRPO (2024-2025).** Công thức DeepSeek-R1. Cùng vòng lặp dạng AlphaZero, được áp dụng cho suy luận mô hình ngôn ngữ:

- "Trò chơi": trả lời một bài toán toán học / lập trình / suy luận. "Thắng" = bộ xác minh (ca kiểm thử vượt qua, đáp án số khớp) trả về 1.
- Chính sách: LLM. Hành động: token. Trạng thái: prompt + phản hồi đến hiện tại.
- Không critic ($V_\phi$ kiểu PPO). Thay vào đó, với mỗi prompt, lấy mẫu $G$ phần hoàn thành từ chính sách. Tính phần thưởng cho mỗi phần. Dùng **lợi thế tương đối theo nhóm** $A_i = (r_i - \text{mean}_r) / \text{std}_r$ làm tín hiệu cho cập nhật kiểu REINFORCE.
- Phạt KL đến chính sách tham chiếu để ngăn trôi (như RLHF).
- Hàm mất mát đầy đủ:

  $L_{\text{GRPO}}(\theta) = -\mathbb E_{q, \lbrace o_i \rbrace} \left[ \frac{1}{G} \sum_i A_i \cdot \log \pi_\theta(o_i \mid q) \right] + \beta \cdot \mathrm{KL}(\pi_\theta \Vert \pi_{\text{ref}})$

Không có mô hình phần thưởng được học, không có critic, không có MCTS. Một bộ xác minh dựa trên quy tắc cung cấp phần thưởng, đường cơ sở tương đối theo nhóm thay critic và bước tìm kiếm bị bỏ đi. Ngang hoặc vượt chất lượng PPO-RLHF trên các benchmark suy luận với một phần nhỏ chi phí tính toán.

**Công thức R1 đầy đủ.** DeepSeek-R1 (DeepSeek 2025) là hai mô hình trong một bài báo:

- **R1-Zero.** Bắt đầu từ mô hình cơ sở DeepSeek-V3. Không SFT. Áp dụng GRPO trực tiếp với hai thành phần phần thưởng: *phần thưởng độ chính xác* (dựa trên quy tắc — đáp án cuối có được phân tích thành số đúng / mã có vượt kiểm thử đơn vị không) và *phần thưởng định dạng* (phần hoàn thành có bọc chuỗi suy nghĩ trong các thẻ `<think>…</think>` không). Qua hàng nghìn bước, độ dài phản hồi trung bình tăng từ ~100 lên ~10,000 token và điểm benchmark toán tăng lên gần mức o1-preview. Mô hình học suy luận từ đầu. Nhược điểm: các chuỗi suy nghĩ của nó thường khó đọc, trộn ngôn ngữ và thiếu trau chuốt phong cách.
- **R1.** Khắc phục các vấn đề dễ đọc của R1-Zero bằng một pipeline bốn giai đoạn:
  1. **SFT khởi động lạnh.** Thu thập vài nghìn minh họa CoT dài với định dạng rõ ràng. Tinh chỉnh có giám sát mô hình cơ sở trên chúng. Điều này cho một điểm khởi đầu dễ đọc.
  2. **GRPO hướng suy luận.** Áp dụng GRPO với các phần thưởng độ chính xác+định dạng cộng một phần thưởng *nhất quán ngôn ngữ* để ngăn chuyển đổi ngôn ngữ.
  3. **Lấy mẫu loại bỏ + SFT vòng 2.** Lấy mẫu ~600K quỹ đạo suy luận từ checkpoint RL, chỉ giữ những quỹ đạo có đáp án cuối đúng và CoT dễ đọc, và kết hợp với ~200K ví dụ SFT không suy luận (viết, QA, tự nhận thức). Tinh chỉnh lại mô hình cơ sở.
  4. **GRPO toàn phổ.** Một vòng RL nữa bao phủ cả suy luận (phần thưởng dựa trên quy tắc) và căn chỉnh tổng quát (phần thưởng dựa trên sở thích hữu ích/vô hại).

Kết quả ngang bằng o1 trên AIME và MATH-500 với trọng số mở, và đủ nhỏ để chưng cất. Cùng bài báo cũng phát hành sáu mô hình dense được chưng cất (từ Qwen-1.5B đến Llama-70B) bằng SFT trên các vết suy luận của R1 — không RL ở mô hình trò. Chưng cất một mô hình thầy RL mạnh luôn đánh bại RL từ đầu ở quy mô mô hình trò.

**Vì sao GRPO thay PPO cho suy luận.** Ba lý do trong bài báo DeepSeekMath (tháng 2 năm 2024): (1) không có mạng giá trị để huấn luyện, giảm một nửa bộ nhớ; (2) baseline nhóm tự nhiên xử lý phần thưởng thưa cuối quỹ đạo mà các tác vụ suy luận tạo ra; (3) chuẩn hóa theo prompt làm các lợi thế có thể so sánh xuyên các bài toán có độ khó khác nhau rất lớn, điều mà critic duy nhất của PPO không thể làm.

**Không tìm kiếm so với dựa trên tìm kiếm.** Trò chơi đã phân nhánh:

- *Trò chơi thông tin hoàn hảo với chân trời dài* (cờ vây, cờ vua): vẫn dựa trên tìm kiếm. AlphaZero / MuZero chi phối.
- *Suy luận LLM*: chưa có MCTS trong production; GRPO trên các rollout đầy đủ, best-of-N cho tính toán suy luận. Mô hình phần thưởng quá trình (PRM) gợi ý việc tìm kiếm cấp bước đang được thêm trở lại.

```figure
f3-selfplay-ladder
```

## Build It

Mã trong `code/main.py` triển khai **GRPO thu nhỏ**: một bandit với nhiều nhóm mẫu. Thuật toán giống như trên một LLM; chỉ chính sách và môi trường đơn giản hơn. Nó dạy về *loss* và *advantage tương đối theo nhóm*, là đổi mới năm 2024 từ DeepSeekMath.

### Step 1: a tiny verifier environment

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

Trong GRPO thực, bộ xác minh chạy kiểm thử đơn vị hoặc kiểm tra đẳng thức toán học.

### Step 2: policy: softmax over K answer tokens per prompt

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

Tương đương đầu ra lớp cuối của một LLM có điều kiện theo một prompt.

### Step 3: group sampling and group-relative advantage

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty: pull theta toward reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

Lợi thế tương đối theo nhóm là thủ thuật DeepSeek năm 2024. Không cần critic. "Baseline" là trung bình nhóm, và chuẩn hóa dùng độ lệch chuẩn nhóm.

### Step 4: compare to REINFORCE baseline (value-free)

Cùng thiết lập, cùng tính toán, REINFORCE thông thường. GRPO hội tụ nhanh hơn và ổn định hơn.

### Step 5: observe entropy and KL

Cùng chẩn đoán như RLHF: KL trung bình đến tham chiếu, entropy chính sách, phần thưởng theo thời gian. Khi chúng ổn định, huấn luyện hoàn tất.

## Pitfalls

- **Reward hacking qua thao túng bộ xác minh.** GRPO kế thừa rủi ro của RLHF: nếu bộ xác minh sai hoặc có thể bị khai thác, LLM sẽ tìm ra cách khai thác. Các bộ xác minh vững (nhiều ca kiểm thử, chứng minh hình thức) quan trọng.
- **Kích thước nhóm quá nhỏ.** Phương sai của đường cơ sở trung bình nhóm biến thiên theo $1/G$ (sai số chuẩn của nó theo $1/\sqrt{G}$). Dưới $G = 4$, tín hiệu advantage bị nhiễu; lựa chọn tiêu chuẩn là $G = 8$ đến 64.
- **Thiên lệch độ dài.** Các phần hoàn thành LLM có độ dài khác nhau có log xác suất khác nhau. Chuẩn hóa theo số token, hoặc dùng log xác suất cấp chuỗi, hoặc cắt ngắn về độ dài tối đa.
- **Chu kỳ tự chơi thuần túy.** Huấn luyện kiểu AlphaZero có thể bị kẹt trong các vòng thống trị trên trò chơi general-sum. Giảm nhẹ bằng các tập đối thủ đa dạng (chơi liên đoàn, Bài 10).
- **Không khớp tìm kiếm-chính sách.** AlphaZero huấn luyện chính sách để bắt chước đầu ra tìm kiếm. Nếu mạng chính sách quá nhỏ để biểu diễn phân phối của tìm kiếm, huấn luyện đình trệ.
- **Mức tính toán tối thiểu.** MuZero / AlphaZero cần tính toán rất lớn. Một thử nghiệm loại bỏ thành phần thường là hàng trăm giờ GPU. Các bản demo thu nhỏ tồn tại (ví dụ AlphaZero trên Connect Four) để học.
- **Độ bao phủ bộ xác minh.** Các kiểm thử đơn vị vượt qua cho một lời giải có lỗi củng cố lỗi đó. Thiết kế các bộ xác minh bắt được trường hợp biên.

## Use It

Bối cảnh RL trò chơi năm 2026, theo miền:

| Miền | Phương pháp chi phối |
|--------|-----------------|
| Trò chơi bàn cờ hai người tổng bằng không (cờ vây, cờ vua, shogi) | AlphaZero / MuZero / KataGo |
| Trò chơi bài thông tin không hoàn hảo (poker) | CFR + học sâu (DeepStack, Libratus, Pluribus) |
| Atari / trò chơi pixel | Muesli / MuZero / IMPALA-PPO |
| Chiến thuật nhiều người chơi lớn (Dota, StarCraft) | PPO + tự chơi + liên đoàn (OpenAI Five, AlphaStar) |
| Suy luận toán/mã LLM | GRPO (DeepSeek-R1, Qwen-RL, các bản tái lập mở) |
| Căn chỉnh LLM | DPO / RLHF-PPO (không phải GRPO; bộ xác minh là sở thích chứ không phải có thể xác minh) |
| Robot học | PPO + DR (không phải RL trò chơi, nhưng dùng cùng công cụ gradient chính sách) |
| Bài toán tổ hợp | Các biến thể AlphaZero (AlphaTensor, AlphaDev) |

*Công thức* — tự chơi, cải thiện tăng cường bằng tìm kiếm, chưng cất chính sách — trải từ văn bản, pixel đến điều khiển vật lý. GRPO là trường hợp trẻ nhất; nhiều trường hợp nữa đang đến.

## Ship It

Lưu thành `outputs/skill-game-rl-designer.md`:

```markdown
---
name: game-rl-designer
description: Design a game-RL or reasoning-RL training pipeline (AlphaZero / MuZero / GRPO) for a given domain.
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

Given a target (perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial), output:

1. Environment fit. Known rules? Markov? Stochastic? Multi-agent? Informs AlphaZero vs MuZero vs GRPO.
2. Search strategy. MCTS (PUCT with learned prior), Gumbel-sampled, best-of-N, or none.
3. Self-play plan. Symmetric self-play / league / offline data / verifier-generated.
4. Target signal. Game outcome / verifier reward / preference / learned model. Include robustness plan.
5. Diagnostics. Win rate vs baseline, ELO curve, verifier pass rate, KL to reference.

Refuse AlphaZero on imperfect-info games (route to CFR). Refuse GRPO without a trusted verifier. Refuse any game-RL pipeline without a fixed baseline opponent set (self-play ELO is uncalibrated otherwise).
```

## Exercises

1. **Dễ.** Triển khai bandit GRPO trong `code/main.py`. Huấn luyện trên 2 prompt × 4 token đáp án mỗi prompt. Hội tụ trong < 1,000 cập nhật với $G=8$.
2. **Trung bình.** Cắm PPO (được cắt) và REINFORCE nguyên bản vào. So sánh hiệu quả mẫu và phương sai phần thưởng với GRPO trên cùng bandit.
3. **Khó.** Mở rộng thành một "chuỗi suy luận" dài 2: agent phát ra hai token và bộ xác minh thưởng cho cặp. Đo cách GRPO xử lý gán công trạng trên các chuỗi hai bước. (Gợi ý: tính lợi thế nhóm theo *toàn bộ chuỗi*, lan truyền đến cả hai vị trí token.)

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| MCTS | "Tìm kiếm cây với mạng được học" | Tìm kiếm cây Monte Carlo; lựa chọn UCB1/PUCT với các tiên nghiệm $(p, v)$ được học. |
| AlphaZero | "Tự chơi + MCTS" | Mạng chính sách-giá trị được huấn luyện để khớp lượt ghé MCTS và kết quả ván đấu. |
| MuZero | "AlphaZero với mô hình được học" | Cùng vòng lặp nhưng trong không gian tiềm ẩn qua động lực học được học. |
| GRPO | "PPO không critic" | Tối ưu hóa chính sách tương đối theo nhóm; REINFORCE với baseline trung bình nhóm + KL. |
| PUCT | "UCB của AlphaZero" | $Q + c \cdot p \cdot \sqrt{N} / (1 + N_a)$ — cân bằng ước lượng giá trị với tiên nghiệm. |
| Self-play (Tự chơi) | "Agent đấu với bản thân quá khứ" | Tiêu chuẩn cho tổng bằng không; tín hiệu huấn luyện đối xứng. |
| League play (Chơi liên đoàn) | "Tự chơi dựa trên quần thể" | Quá khứ + hiện tại + các exploiter được lấy mẫu làm đối thủ. |
| Verifier reward (Phần thưởng bộ xác minh) | "RL có thể xác minh" | Phần thưởng đến từ một bộ kiểm tra tất định (kiểm thử vượt qua, đáp án khớp). |
| Process reward (Phần thưởng quá trình) | "PRM" | Chấm điểm mỗi bước suy luận, không chỉ đáp án cuối. |

## Further Reading

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270).
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404).
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4).
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z).
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300) — bài báo giới thiệu GRPO và baseline tương đối theo nhóm.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) — công thức R1 bốn giai đoạn đầy đủ cộng thử nghiệm loại bỏ R1-Zero.
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) — CFR + học sâu ở quy mô lớn.
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343) — bài báo khởi đầu tất cả.
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) — tham chiếu production để áp dụng GRPO với các hàm phần thưởng tùy chỉnh.
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) — tái lập mở công thức R1 ở nhiều quy mô.
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) — cách nhìn trong giáo trình về tự chơi, tìm kiếm và "phần thưởng được thiết kế" mà R1 hiện thực hóa ở quy mô LLM.
