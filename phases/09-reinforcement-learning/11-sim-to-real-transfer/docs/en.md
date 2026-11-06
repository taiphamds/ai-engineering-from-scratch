# Sim-to-Real Transfer

> Một chính sách được huấn luyện trong bộ mô phỏng mà thất bại trên phần cứng là một chính sách đã ghi nhớ bộ mô phỏng. Ngẫu nhiên hóa miền, thích nghi miền và nhận dạng hệ thống là ba công cụ để khiến các bộ điều khiển được học vượt qua khoảng cách thực tế.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 9 · 08 (PPO), Phase 2 · 10 (Bias/Variance)
**Time:** ~45 minutes

## The Problem

Huấn luyện một robot thật chậm, nguy hiểm và tốn kém. Một robot hai chân cần hàng triệu episode huấn luyện để học đi; một robot hai chân thật ngã dù chỉ một lần cũng làm hỏng phần cứng. Mô phỏng cho bạn số lần đặt lại không giới hạn, khả năng tái lập tất định, các môi trường song song, và không hư hại vật lý.

Nhưng các bộ mô phỏng sai. Ổ trục có ma sát lớn hơn các mô hình MuJoCo. Camera có méo ống kính mà bộ mô phỏng không bao gồm. Động cơ có độ trễ, độ rơ và bão hòa mà 99% mô hình mô phỏng bỏ qua. Gió, bụi và ánh sáng thay đổi phá hoại một chính sách được huấn luyện trên kết xuất vô trùng. **Khoảng cách thực tế** — khác biệt có hệ thống giữa phân phối mô phỏng và phân phối thật — là vấn đề trung tâm của RL được triển khai cho robot học.

Bạn cần một chính sách *vững trước dịch chuyển phân phối từ mô phỏng sang thực tế*. Ba cách tiếp cận lịch sử: ngẫu nhiên hóa bộ mô phỏng (ngẫu nhiên hóa miền), thích nghi chính sách bằng một ít dữ liệu thật (thích nghi miền / tinh chỉnh), hoặc nhận dạng các tham số hệ thống thật và khớp chúng (nhận dạng hệ thống). Vào năm 2026 công thức chi phối kết hợp cả ba với mô phỏng song song quy mô lớn (Isaac Sim, Isaac Lab, Mujoco MJX trên GPU).

## The Concept

![Three sim-to-real regimes: domain randomization, adaptation, system identification](../assets/sim-to-real.svg)

**Ngẫu nhiên hóa miền (DR).** Tobin và cộng sự 2017, Peng và cộng sự 2018. Trong huấn luyện, ngẫu nhiên hóa mọi tham số mô phỏng có thể khác trên robot thật: khối lượng, hệ số ma sát, hệ số khuếch đại PD động cơ, nhiễu cảm biến, vị trí camera, ánh sáng, kết cấu, mô hình tiếp xúc. Chính sách học một phân phối có điều kiện trên "hôm nay nó đang ở trong mô phỏng nào" và khái quát hóa trên toàn bộ phạm vi. Nếu robot thật nằm trong miền huấn luyện, chính sách hoạt động.

- **Ưu điểm:** không cần dữ liệu thật. Một công thức, nhiều robot.
- **Nhược điểm:** huấn luyện ngẫu nhiên hóa quá mức tạo ra một chính sách "phổ quát" nhưng quá thận trọng. Quá nhiều nhiễu ≈ quá nhiều regularization.

**Nhận dạng hệ thống (SI).** Khớp các tham số bộ mô phỏng với dữ liệu thực tế trước huấn luyện. Nếu bạn có thể đo ma sát khớp cánh tay trên robot thật, đưa nó vào mô phỏng. Rồi huấn luyện một chính sách kỳ vọng các giá trị đó. Cần truy cập hệ thống thật nhưng trực tiếp giảm khoảng cách thực tế.

- **Ưu điểm:** mục tiêu huấn luyện chính xác, ít nhiễu.
- **Nhược điểm:** sai số mô hình còn lại vô hình với chính sách; các hiệu ứng nhỏ chưa được nhận dạng (ví dụ vùng chết động cơ) vẫn phá hỏng triển khai.

**Thích nghi miền.** Huấn luyện trong mô phỏng, tinh chỉnh với một lượng nhỏ dữ liệu thật. Hai dạng:

- **Real2Sim2Real:** học một bộ mô phỏng phần dư `f(s, a, z) - f_sim(s, a)` bằng các rollout thật, huấn luyện trong mô phỏng được hiệu chỉnh. Thu hẹp khoảng cách mà không cần nhiều dữ liệu thật.
- **Thích nghi quan sát:** huấn luyện một chính sách ánh xạ quan sát thật → quan sát giống mô phỏng qua một bộ trích xuất đặc trưng được học (ví dụ GAN pixel sang pixel). Bộ điều khiển ở lại trong mô phỏng.

**Học đặc quyền / thầy-trò.** Miki và cộng sự 2022 (robot bốn chân ANYmal). Huấn luyện một *mô hình thầy* trong mô phỏng có quyền truy cập thông tin đặc quyền (ma sát ground truth, độ cao địa hình, độ trôi IMU). Chưng cất một *mô hình trò* chỉ thấy các quan sát cảm biến thật. Mô hình trò học suy ra các đặc trưng đặc quyền từ lịch sử, vững trên các tham số vật lý.

**Mô phỏng song song quy mô lớn.** 2024–2026. Isaac Lab, Mujoco MJX, Brax đều chạy hàng nghìn robot song song trên một GPU duy nhất. PPO với 4,096 robot hình người song song thu thập nhiều năm trải nghiệm trong vài giờ. "Khoảng cách thực tế" thu hẹp khi phân phối huấn luyện mở rộng; DR trở nên gần như miễn phí khi mỗi môi trường trong 4,096 môi trường đó có các tham số ngẫu nhiên hóa khác nhau.

**Công thức thực tế năm 2026 (ví dụ robot bốn chân đi bộ):**

1. Mô phỏng song song quy mô lớn với trọng lực, ma sát, hệ số khuếch đại động cơ, tải trọng được ngẫu nhiên hóa miền.
2. Chính sách thầy được huấn luyện với thông tin đặc quyền (bản đồ địa hình, ground truth vận tốc thân).
3. Chính sách trò được chưng cất từ thầy chỉ dùng cảm giác bản thể (bộ mã hóa khớp chân).
4. Thích nghi quan sát tùy chọn qua autoencoder trên IMU thật.
5. Triển khai. Zero-shot trên 10+ môi trường. Nếu thất bại, thực hiện vài phút tinh chỉnh thực tế bằng PPO có ràng buộc an toàn.

```figure
f3-reality-gap
```

## Build It

Mã của bài học này là một minh họa nhỏ về ngẫu nhiên hóa miền trên một GridWorld với các chuyển tiếp *có nhiễu*. Chúng ta huấn luyện một chính sách trải nghiệm các xác suất trượt ngẫu nhiên hóa trong "mô phỏng" và đánh giá trên "thực tế" với một mức trượt nó chưa từng thấy trong huấn luyện. Cấu trúc tương ứng trực tiếp với chuyển từ MuJoCo sang phần cứng.

### Step 1: parameterized sim

```python
def step(state, action, slip):
    if rng.random() < slip:
        action = random_perpendicular(action)
    ...
```

`slip` là một tham số mà bộ mô phỏng cung cấp. Trong robot học thực, nó có thể là ma sát, khối lượng, hệ số khuếch đại động cơ — bất cứ thứ gì thay đổi giữa mô phỏng và thực tế.

### Step 2: train with DR

Ở đầu mỗi episode, lấy mẫu `slip ~ Uniform[0.0, 0.4]`. Huấn luyện PPO / Q-learning / bất cứ thứ gì. Làm điều này cho nhiều episode.

### Step 3: evaluate zero-shot on "real" slips

Đánh giá trên `slip ∈ {0.0, 0.1, 0.2, 0.3, 0.5, 0.7}`. Bốn mức đầu nằm trong miền hỗ trợ huấn luyện; `0.5` và `0.7` ở ngoài. Một chính sách được huấn luyện DR nên giữ gần tối ưu trong miền hỗ trợ và suy giảm từ từ bên ngoài. Một chính sách được huấn luyện với độ trượt cố định sẽ mong manh ngoài độ trượt huấn luyện của nó.

### Step 4: compare to narrow training

Huấn luyện một chính sách thứ hai chỉ với `slip = 0.0`. Đánh giá trên cùng phép quét `slip`. Bạn nên thấy một sự sụt giảm thảm khốc ngay khi độ trượt thật > 0.

## Pitfalls

- **Quá nhiều ngẫu nhiên hóa.** Huấn luyện trên `slip ∈ [0, 0.9]` và chính sách của bạn né rủi ro đến mức không bao giờ thử đường tối ưu. Khớp phân phối thực tế *kỳ vọng*, không phải "bất cứ điều gì cũng có thể xảy ra."
- **Quá ít ngẫu nhiên hóa.** Huấn luyện trên một lát mỏng và chính sách không thể khái quát hóa chút nào. Dùng chương trình học thích nghi (Ngẫu nhiên hóa miền tự động) mở rộng phân phối khi chính sách cải thiện.
- **Nhận dạng sai không gian tham số.** Ngẫu nhiên hóa sai thứ (sắc độ camera khi khoảng cách thật là độ trễ động cơ) và DR không giúp ích. Profile robot thật trước.
- **Rò rỉ thông tin đặc quyền.** Một mô hình thầy dùng trạng thái toàn cục cho hành động, không chỉ quan sát, có thể tạo ra một mô hình trò không thể theo kịp. Bảo đảm chính sách của thầy có thể được trò thực hiện với lịch sử quan sát.
- **Thất bại chuyển mô phỏng sang mô phỏng.** Nếu chính sách của bạn không vững trước một biến thể mô phỏng khó hơn, nó cũng sẽ không vững trước thế giới thật. Luôn kiểm tra trên một biến thể mô phỏng giữ lại trước khi triển khai.
- **Không có miền an toàn thực tế.** Một chính sách hoạt động trong mô phỏng và "hoạt động ngoài thực tế" mà không có một lớp bảo vệ an toàn cấp thấp vẫn có thể làm hỏng phần cứng. Thêm giới hạn tốc độ thay đổi, giới hạn mô-men xoắn, giới hạn khớp trong một bộ điều khiển không được học.

## Use It

Bộ công cụ mô phỏng sang thực tế năm 2026:

| Miền | Bộ công cụ |
|--------|-------|
| Di chuyển bằng chân (ANYmal, Spot, robot hình người) | Isaac Lab + DR + thầy / trò đặc quyền |
| Thao tác (bàn tay khéo léo, gắp-và-đặt) | Isaac Lab + DR + DR-GAN cho thị giác |
| Lái xe tự hành | CARLA / NVIDIA DRIVE Sim + DR + tinh chỉnh thực |
| Đua drone | RotorS / Flightmare + DR + thích nghi trực tuyến |
| Thao tác ngón tay/trong bàn tay | OpenAI Dactyl (DR ở quy mô chưa từng có) |
| Cánh tay công nghiệp | MuJoCo-Warp + SI + tinh chỉnh thực nhỏ |

Với điều khiển ở mọi quy mô, quy trình nhất quán: khớp mô phỏng tốt nhất có thể, ngẫu nhiên hóa những gì bạn không thể khớp, huấn luyện các chính sách khổng lồ, chưng cất, triển khai với một lớp bảo vệ an toàn.

## Ship It

Lưu thành `outputs/skill-sim2real-planner.md`:

```markdown
---
name: sim2real-planner
description: Plan a sim-to-real transfer pipeline for a given robot + task, covering DR, SI, and safety.
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

Given a robot platform, a task, and access to real hardware time, output:

1. Reality gap inventory. Suspected sources ranked by expected impact (contact, sensing, actuation delay, vision).
2. DR parameters. Exact list, ranges, distribution. Justify each range against real measurements.
3. SI steps. Which parameters to measure; measurement method.
4. Teacher/student split. What privileged info the teacher uses; what obs the student uses.
5. Safety envelope. Low-level limits, emergency stops, backup controller.

Refuse to deploy without (a) a zero-shot sim-variant test, (b) a safety shield, (c) a rollback plan. Flag any DR range wider than 3× measured real variability as likely over-randomized.
```

## Exercises

1. **Dễ.** Huấn luyện một agent Q-learning trên GridWorld độ trượt cố định (slip=0.0). Đánh giá trên slip ∈ {0.0, 0.1, 0.3, 0.5}. Vẽ lợi tức theo độ trượt.
2. **Trung bình.** Huấn luyện một agent Q-learning DR lấy mẫu `slip ~ Uniform[0, 0.3]`. Đánh giá cùng phép quét. DR mang lại bao nhiêu ở slip=0.5 (ngoài phân phối)?
3. **Khó.** Triển khai một chương trình học: bắt đầu với slip=0.0, mở rộng phạm vi DR mỗi khi chính sách đạt 90% tối ưu. Đo tổng số bước môi trường để đạt slip=0.3 zero-shot so với một baseline DR cố định.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Reality gap (Khoảng cách thực tế) | "Khác biệt mô phỏng sang thực tế" | Dịch chuyển phân phối giữa vật lý/cảm nhận trong huấn luyện và triển khai. |
| Domain randomization (DR) (Ngẫu nhiên hóa miền) | "Huấn luyện trên các mô phỏng ngẫu nhiên" | Ngẫu nhiên hóa tham số mô phỏng trong huấn luyện để chính sách khái quát hóa. |
| System identification (SI) (Nhận dạng hệ thống) | "Đo thực tế và khớp mô phỏng" | Ước lượng các tham số vật lý thật; đặt mô phỏng cho khớp. |
| Domain adaptation (Thích nghi miền) | "Tinh chỉnh trên dữ liệu thật" | Tinh chỉnh thực tế nhỏ sau huấn luyện mô phỏng; có thể thích nghi quan sát hoặc động lực học. |
| Privileged info (Thông tin đặc quyền) | "Ground truth cho thầy" | Thông tin chỉ mô phỏng có; trò phải suy ra từ lịch sử quan sát. |
| Teacher/student (Thầy/trò) | "Chưng cất đặc quyền -> quan sát được" | Thầy được huấn luyện với các đường tắt; trò học bắt chước mà không có chúng. |
| ADR | "Ngẫu nhiên hóa miền tự động" | Chương trình học mở rộng các phạm vi DR khi chính sách cải thiện. |
| Real2Sim | "Thu hẹp khoảng cách bằng dữ liệu thật" | Học một phần dư để khiến mô phỏng bắt chước các rollout thật. |

## Further Reading

- [Tobin et al. (2017). Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World](https://arxiv.org/abs/1703.06907) — bài báo DR gốc (thị giác cho robot học).
- [Peng et al. (2018). Sim-to-Real Transfer of Robotic Control with Dynamics Randomization](https://arxiv.org/abs/1710.06537) — DR cho động lực học, di chuyển bốn chân.
- [OpenAI et al. (2019). Solving Rubik's Cube with a Robot Hand](https://arxiv.org/abs/1910.07113) — Dactyl, ADR ở quy mô lớn.
- [Miki et al. (2022). Learning robust perceptive locomotion for quadrupedal robots in the wild](https://www.science.org/doi/10.1126/scirobotics.abk2822) — thầy-trò cho ANYmal.
- [Makoviychuk et al. (2021). Isaac Gym: High Performance GPU Based Physics Simulation for Robot Learning](https://arxiv.org/abs/2108.10470) — mô phỏng song song quy mô lớn thúc đẩy các triển khai 2025–2026.
- [Akkaya et al. (2019). Automatic Domain Randomization](https://arxiv.org/abs/1910.07113) — phương pháp chương trình học ADR.
- [Sutton & Barto (2018). Ch. 8 — Planning and Learning with Tabular Methods](http://incompleteideas.net/book/RLbook2020.pdf) — cách nhìn Dyna (dùng một mô hình cho lập kế hoạch + rollout) làm nền tảng cho các pipeline mô phỏng sang thực tế hiện đại.
- [Zhao, Queralta & Westerlund (2020). Sim-to-Real Transfer in Deep Reinforcement Learning for Robotics: a Survey](https://arxiv.org/abs/2009.13303) — phân loại các phương pháp mô phỏng sang thực tế với kết quả benchmark.
