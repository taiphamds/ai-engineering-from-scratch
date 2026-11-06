# MARL — MADDPG, QMIX, MAPPO

> Di sản học tăng cường của phối hợp đa agent, vẫn cung cấp cơ sở cho các hệ thống agent LLM năm 2026. **MADDPG** (Lowe và cộng sự, NeurIPS 2017, arXiv:1706.02275) giới thiệu Huấn luyện tập trung, Thực thi phi tập trung (CTDE): mỗi critic thấy các trạng thái và hành động của mọi agent trong huấn luyện; tại thời điểm kiểm thử chỉ các actor cục bộ chạy. Hoạt động cho các bối cảnh hợp tác, cạnh tranh, và hỗn hợp. **QMIX** (Rashid và cộng sự, ICML 2018, arXiv:1803.11485) là phân rã giá trị với một mạng trộn đơn điệu; các Q theo từng agent kết hợp thành Q chung để `argmax` phân phối gọn gàng — chiếm ưu thế trên StarCraft Multi-Agent Challenge (SMAC). **MAPPO** (Yu và cộng sự, NeurIPS 2022, arXiv:2103.01955) là PPO với một hàm giá trị tập trung; “hiệu quả đáng ngạc nhiên” trên particle-world, SMAC, Google Research Football, Hanabi với điều chỉnh tối thiểu. Chúng làm nền tảng cho huấn luyện các chính sách cho các nhóm agent phải hành động phi tập trung. MAPPO là **đường cơ sở MARL hợp tác mặc định năm 2026**. Bài này xây dựng từng loại từ một thế giới lưới đồ chơi nhỏ và đưa ba ý tưởng vào trí nhớ cơ bắp trước khi chạm tới huấn luyện agent LLM.

**Type:** Learn
**Languages:** Python (stdlib, small NumPy-free implementations)
**Prerequisites:** Phase 09 (Reinforcement Learning), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~90 minutes

## Problem

Các hệ thống agent LLM ngày càng huấn luyện các chính sách cho phối hợp giữa các agent: khi nào nhường, khi nào hành động, gọi bên ngang hàng nào. Tài liệu cho bạn biết cách huấn luyện các chính sách như vậy là Học tăng cường đa agent (MARL), có trước làn sóng LLM và có một tập nhỏ các thuật toán chiếm ưu thế.

Đọc các bài báo MARL không có bộ từ vựng mẫu rất đau đớn. Huấn luyện tập trung với thực thi phi tập trung (CTDE), phân rã giá trị, và các critic tập trung không phải các từ thời thượng — chúng là các câu trả lời cụ thể cho các vấn đề cụ thể:

- RL độc lập (mỗi agent học một mình) không dừng từ góc nhìn mỗi agent. Tệ.
- RL tập trung (một agent kiểm soát tất cả) không mở rộng và vi phạm các ràng buộc thực thi.
- CTDE lấy phần tốt nhất của cả hai: huấn luyện với thông tin toàn cục, triển khai với các chính sách cục bộ.

## Concept

### Three environments the papers use

- **Particle World (môi trường hạt đa agent).** Vật lý 2D đơn giản với các tác vụ hợp tác/cạnh tranh. Môi trường thử nghiệm gốc của MADDPG.
- **StarCraft Multi-Agent Challenge (SMAC).** Vi quản lý hợp tác, quan sát một phần. Môi trường thử nghiệm của QMIX. Các hành động rời rạc, các trạng thái liên tục.
- **Google Research Football, Hanabi, MPE.** Các đường cơ sở MAPPO.

Các môi trường khác nhau có các loại hành động/quan sát khác nhau. Các thuật toán chọn tương ứng.

### MADDPG (2017) — the CTDE pattern

Mỗi agent `i` có một actor `mu_i(o_i)` ánh xạ quan sát riêng thành hành động. Mỗi agent cũng có một critic `Q_i(x, a_1, ..., a_n)` thấy mọi quan sát và mọi hành động trong huấn luyện. Actor được cập nhật bằng gradient chính sách theo đánh giá của critic.

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Vì sao CTDE: tại thời điểm huấn luyện, chúng ta biết các hành động của mọi bên; chúng ta dùng điều đó để giảm phương sai trong mỗi critic. Tại thời điểm triển khai, mỗi agent chỉ thấy `o_i` và gọi `mu_i(o_i)`.

Chế độ lỗi: các critic tăng với N agent (đầu vào bao gồm mọi hành động). Không mở rộng vượt ~10 agent nếu không có các xấp xỉ.

### QMIX (2018) — value decomposition

Chỉ hợp tác. Phần thưởng toàn cục là tổng của một hàm đơn điệu của các giá trị Q theo từng agent:

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

Tính đơn điệu bảo đảm `argmax_a Q_tot` có thể được tính bằng việc mỗi agent chọn `argmax_{a_i} Q_i` độc lập. Đó **chính xác là thuộc tính thực thi phi tập trung** bạn cần. Tại thời điểm huấn luyện, một mạng trộn tạo `Q_tot` từ các Q theo từng agent.

Vì sao QMIX thắng trên SMAC: vi quản lý StarCraft hợp tác có các agent đồng nhất, các quan sát cục bộ, phần thưởng toàn cục — phù hợp hoàn hảo cho phân rã giá trị.

Chế độ lỗi: ràng buộc đơn điệu hạn chế; một số tác vụ có các cấu trúc phần thưởng không thể phân rã đơn điệu (một agent hy sinh cho nhóm). Các mở rộng (QTRAN, QPLEX) nới lỏng điều này.

### MAPPO (2022) — the overlooked default

PPO đa agent: PPO với một hàm giá trị tập trung. Mỗi agent có chính sách riêng; mọi agent chia sẻ (hoặc có theo từng agent) các hàm giá trị thấy toàn bộ trạng thái. Yu và cộng sự năm 2022 đánh giá benchmark MAPPO với MADDPG, QMIX, và các mở rộng của chúng trên năm benchmark và thấy:

- MAPPO khớp hoặc vượt các phương pháp MARL off-policy trên particle-world, SMAC, Google Research Football, Hanabi, MPE.
- Yêu cầu điều chỉnh siêu tham số tối thiểu.
- Huấn luyện ổn định; có thể tái lập qua các seed.

Cộng đồng đánh giá thấp MARL on-policy cho đến bài báo này. Năm 2026, MAPPO là đường cơ sở mặc định cho MARL hợp tác; bất kỳ phương pháp mới nào phải vượt nó.

### Why LLM-agent engineers should care

Ba sử dụng trực tiếp:

1. **Huấn luyện bộ định tuyến.** Một siêu agent chọn agent con nào xử lý một tác vụ. Đây là một bài toán MARL với N agent con phi tập trung và một bộ định tuyến tập trung. MAPPO phù hợp.
2. **Sự nổi lên vai trò.** Trong các mô phỏng agent sinh, huấn luyện các agent nhận các vai trò bổ trợ theo thời gian là một bài toán MARL trá hình. Phân rã giá trị kiểu QMIX buộc tính bổ trợ do cách xây dựng.
3. **Sử dụng công cụ đa agent.** Khi các agent chia sẻ công cụ và cạnh tranh ngân sách, huấn luyện chúng qua CTDE tạo ra các chính sách cục bộ có thể triển khai tôn trọng các ràng buộc tài nguyên.

Lưu ý thực tế: năm 2026, hầu hết các hệ thống agent LLM sản xuất prompt các chính sách thay vì huấn luyện chúng. MARL xuất hiện khi bạn có (a) nhiều dữ liệu tương tác, (b) một tín hiệu phần thưởng rõ ràng, và (c) sẵn lòng đầu tư vào cơ sở hạ tầng huấn luyện.

### CTDE as a design pattern beyond RL

Ngay cả không có huấn luyện, CTDE là một mẫu kiến trúc hữu ích:

- Trong *thiết kế*, giả định khả năng nhìn thấy toàn nhóm.
- Tại *thời gian chạy*, áp dụng thực thi phi tập trung: mỗi agent chỉ thấy `o_i`.

Mẫu buộc bạn giữ trạng thái theo từng agent tường minh và nghĩ về khả năng quan sát một phần từ đầu. Nhiều hệ thống đa agent sản xuất âm thầm giả định trạng thái dùng chung ở mọi nơi — kỷ luật CTDE ngăn điều đó.

### The non-stationarity problem

Khi nhiều agent học đồng thời, môi trường của mỗi agent (bao gồm các chính sách của các bên khác) không dừng. Các chứng minh RL đơn agent cổ điển hỏng. Các thuật toán MARL trong bài này đều giải quyết điều này:

- MADDPG: critic toàn cục thấy mọi hành động, nên ước tính giá trị của nó dừng.
- QMIX: phân rã giá trị chuyển học tới một không gian Q chung nơi tính tối ưu được định nghĩa rõ.
- MAPPO: hàm giá trị tập trung làm giảm phương sai từ các thay đổi chính sách của các bên khác.

Trong các hệ thống agent LLM, tính không dừng thể hiện như “agent của tôi hoạt động tháng trước, giờ agent khác ở thượng nguồn thay đổi, agent của tôi hành xử sai.” Huấn luyện MARL với CTDE là cách sửa có nguyên tắc; các cách sửa cấp prompt nhanh hơn nhưng kém bền vững hơn.

### What this lesson does NOT cover

Huấn luyện các mạng thực là một chủ đề Giai đoạn 09. Bài này xây các phiên bản chính sách được viết kịch bản minh họa các mẫu CTDE, phân rã giá trị, và giá trị tập trung mà không có cập nhật gradient. Mục tiêu là nội hóa các mẫu trước khi bạn cầm một thư viện MARL đầy đủ (PyMARL, MARLlib, RLlib multi-agent).

```figure
sw-ctde
```

## Build It

`code/main.py` triển khai ba minh họa mẫu, tất cả trên một thế giới lưới hợp tác 2 agent nhỏ:

- Môi trường: 2 agent trên một lưới 4x4, một viên phần thưởng. Phần thưởng = 1 nếu bất kỳ agent nào tới viên; tác vụ kết thúc.
- `IndependentAgents` — mỗi agent coi các bên khác như môi trường. Đường cơ sở.
- `MADDPGStyle` — critic tập trung tính một giá trị chung; các chính sách actor cập nhật từ nó. Cải thiện chính sách được viết kịch bản.
- `QMIXStyle` — phân rã giá trị với một bộ trộn đơn điệu.
- `MAPPOStyle` — hàm giá trị tập trung; các chính sách cập nhật theo đường cơ sở dùng chung.

Cả bốn chạy cùng các episode và báo cáo số bước trung bình tới mục tiêu. Các biến thể CTDE hội tụ tới các đường đi ngắn hơn đường cơ sở độc lập.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: các agent độc lập mất trung bình ~6 bước; các biến thể CTDE hội tụ về ~3.5 bước (tối ưu cho lưới 4x4 là 3). Khác biệt mẫu thể hiện dù các chính sách được viết kịch bản.

## Use It

`outputs/skill-marl-picker.md` là một skill chọn một thuật toán MARL cho một tác vụ đa agent nhất định: hợp tác so với cạnh tranh, đồng nhất so với không đồng nhất, loại không gian hành động, quy mô, tín hiệu phần thưởng.

## Ship It

MARL trong sản xuất hiếm. Khi bạn sử dụng nó:

- **Bắt đầu với MAPPO.** Bài báo năm 2022 thiết lập nó làm đường cơ sở; tái lập nó trước tiết kiệm nhiều tuần đuổi theo các phương pháp cầu kỳ hơn.
- **Ghi nhật ký luồng quan sát và hành động của mọi agent.** Gỡ lỗi MARL không có các dấu vết theo từng agent là vô vọng.
- **Tách mã huấn luyện khỏi mã thực thi.** CTDE là một kỷ luật; để đường thực thi thực sự chỉ thấy `o_i`.
- **Cảnh báo định hình phần thưởng.** MARL cực kỳ nhạy với thiết kế phần thưởng. Một lỗi phối hợp trong định hình và các agent học khai thác nó. Chạy các kiểm thử đối kháng.
- **Với các agent LLM**, cân nhắc các chính sách cấp prompt trước. Chỉ đầu tư vào huấn luyện MARL khi dữ liệu tương tác + tín hiệu phần thưởng + cơ sở hạ tầng đều hiện diện.

## Exercises

1. Chạy `code/main.py`. Đo khoảng cách số bước tới mục tiêu giữa các agent độc lập và kiểu MAPPO. Khoảng cách tăng hay giảm trên một lưới 6x6?
2. Triển khai một biến thể cạnh tranh: hai agent, một viên, chỉ agent đầu tiên tới nhận phần thưởng. Mẫu nào xử lý cạnh tranh gọn gàng? MADDPG theo lịch sử.
3. Đọc MADDPG (arXiv:1706.02275) Phần 3. Triển khai quy tắc cập nhật critic chính xác một cách ký hiệu trong mã giả bằng lời của chính bạn.
4. Đọc MAPPO (arXiv:2103.01955). Vì sao các tác giả lập luận giá trị tập trung + PPO vượt MARL off-policy trên các benchmark của họ? Liệt kê ba tuyên bố mạnh nhất.
5. Áp dụng CTDE như một mẫu thiết kế cho một hệ thống agent LLM giả định (ví dụ: agent nghiên cứu + bộ tóm tắt + người viết mã). Thông tin chung nào có sẵn tại thời điểm thiết kế mà không có tại thời gian chạy?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| MARL | “RL đa agent” | Học tăng cường cho các hệ thống đa agent. |
| CTDE | “Huấn luyện tập trung, Thực thi phi tập trung” | Huấn luyện với thông tin toàn cục; triển khai với các chính sách cục bộ. |
| MADDPG | “DDPG đa agent” | CTDE với critic theo từng agent thấy mọi quan sát + hành động. |
| QMIX | “Phân rã giá trị” | Trộn đơn điệu các Q theo từng agent. Hợp tác. |
| MAPPO | “PPO đa agent” | PPO với hàm giá trị tập trung. Đường cơ sở mặc định năm 2026. |
| Value decomposition (Phân rã giá trị) | “Tổng các Q cá nhân” | Q chung được biểu diễn như một hàm đơn điệu của các Q theo từng agent. |
| Non-stationarity (Tính không dừng) | “Các mục tiêu di động” | Môi trường mỗi agent thay đổi khi các bên khác học. Vấn đề MARL cốt lõi. |
| On-policy / off-policy | “Học từ hiện tại / phát lại” | PPO là on-policy (MAPPO); DDPG và Q-learning là off-policy. |
| SMAC | “StarCraft Multi-Agent Challenge” | Benchmark vi quản lý hợp tác; sân nhà của QMIX. |

## Further Reading

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) — MADDPG; NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) — QMIX; ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) — MAPPO; NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) — cách định hình dễ đọc về kết quả MAPPO
- [SMAC repository](https://github.com/oxwhirl/smac) — StarCraft Multi-Agent Challenge
