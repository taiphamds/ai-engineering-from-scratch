# Generative Agents and Emergent Simulation

> Park và cộng sự năm 2023 (UIST '23, arXiv:2304.03442) đưa vào **Smallville**, một sandbox gồm 25 agent, một kiến trúc ba phần: **luồng bộ nhớ** (nhật ký ngôn ngữ tự nhiên), **phản tư** (các tổng hợp cấp cao hơn mà agent sinh về luồng riêng), và **kế hoạch** (hành vi cấp ngày, rồi các kế hoạch con). Kết quả mang tính cột mốc là sự nổi lên của bữa tiệc Ngày Valentine: một agent được gieo “muốn tổ chức một bữa tiệc Ngày Valentine”, không có kịch bản thêm, tạo ra các lời mời lan qua quần thể, phối hợp các cuộc hẹn, và bữa tiệc diễn ra — từ 24 agent bắt đầu không biết gì về nó. Các thí nghiệm loại bỏ cho thấy cả ba thành phần cần cho tính đáng tin. Các thất bại được ghi nhận là các lỗi chuẩn mực không gian (vào các cửa hàng đóng cửa, dùng chung các phòng tắm một người). Đây là kiến trúc tham chiếu cho các mô phỏng agent và đánh giá xã hội đa agent năm 2026.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Problem

Hầu hết các hệ thống đa agent là các nhóm được viết kịch bản chặt: bộ lập kế hoạch lập kế hoạch, người viết mã viết mã, người xem xét xem xét. Điều đó hoạt động cho các tác vụ được định nghĩa rõ. Nó không nắm bắt hành vi nổi lên, không có kịch bản nảy sinh khi các agent có bộ nhớ, các ưu tiên, và một thế giới mở. Nghiên cứu, mô phỏng xã hội, và ngày càng nhiều AI trò chơi cần loại thứ hai này.

Kiến trúc Smallville là benchmark cho nó. Trước Park 2023, các mô phỏng agent tốt nhất là các bên theo kịch bản nông; sau đó, mẫu là mặc định cho các agent sinh trong các thế giới mở. Nếu bạn xây một mô phỏng agent năm 2026, bạn hoặc đang dùng ba thành phần của Smallville hoặc đang lý giải tường minh vì sao không dùng.

## Concept

### The three components

**Luồng bộ nhớ.** Một nhật ký chỉ thêm của các quan sát, hành động, phản tư, và kế hoạch. Mỗi mục có một dấu thời gian, một loại, một mô tả (ngôn ngữ tự nhiên), và siêu dữ liệu được suy ra: **độ gần đây**, **mức quan trọng** (agent tự chấm 1-10), và **độ liên quan** (tương đồng cosine với truy vấn hiện tại).

```
[2026-02-14 09:12:03] observation: Isabella Rodriguez asked me if I like jazz
[2026-02-14 09:14:22] reflection:   I enjoy long conversations about music
[2026-02-14 10:05:00] plan:         Attend Isabella's Valentine's Day party tonight
```

Truy xuất bộ nhớ kết hợp ba điểm: `score = w_recency * e^(-decay * age) + w_importance * importance + w_relevance * cos_sim`. Các mục top-k đi vào prompt hiện tại.

**Phản tư.** Định kỳ (mỗi N ký ức hoặc trên các sự kiện quan trọng), agent sinh các tổng hợp bậc cao từ các ký ức gần đây. Các mục phản tư trở lại luồng và có thể truy xuất như bất kỳ ký ức nào khác. Đây là cách các agent xây dựng các “hiểu biết” — dạng tương đương của kiến trúc với các niềm tin dài hạn.

**Kế hoạch.** Phân rã từ trên xuống. Trước tiên, một kế hoạch cấp ngày với những nét lớn (“đi làm, ăn tối với Klaus”). Rồi các kế hoạch cấp giờ. Rồi các kế hoạch cấp hành động. Các kế hoạch có thể sửa đổi: khi một quan sát mâu thuẫn một kế hoạch, agent lập lại phần bị ảnh hưởng.

### Why all three matter (ablation)

Park và cộng sự chạy các thí nghiệm loại bỏ từng thành phần quan sát, phản tư, và kế hoạch. Mỗi lần loại bỏ làm hại tính đáng tin:

- Không có **quan sát** agent bỏ sót ngữ cảnh và hành động theo các niềm tin lỗi thời.
- Không có **phản tư** agent không thể hình thành các niềm tin bậc cao; các tương tác vẫn nông.
- Không có **kế hoạch** hành vi trở thành nhiễu phản ứng; các mục tiêu tiêu tan.

Điểm tính đáng tin từ những người chấm cao nhất với cả ba; bỏ bất kỳ một thành phần nào tạo ra một bước thụt lùi đo được.

### The Valentine's Day emergence

Một agent, Isabella Rodriguez, được gieo mục tiêu “muốn tổ chức một bữa tiệc Ngày Valentine tại Hobbs Cafe vào ngày 14 tháng 2 lúc 5 giờ chiều.” 24 agent khác không nhận sự gieo như vậy. Qua các ngày mô phỏng:

1. Kế hoạch của Isabella bao gồm mời mọi người.
2. Mỗi lời mời trở thành một quan sát trong luồng bộ nhớ của một láng giềng.
3. Phản tư của láng giềng đó sinh các niềm tin: “Isabella đang tổ chức một bữa tiệc.”
4. Kế hoạch của láng giềng kết hợp “tham dự bữa tiệc vào ngày 14 tháng 2.”
5. Các láng giềng nói cho các láng giềng khác. Lời mời lan mà không có phối hợp trung tâm.
6. Lúc 5 giờ chiều ngày 14 tháng 2, một số agent hội tụ tại Hobbs Cafe.

Đây là sự nổi lên theo nghĩa kỹ thuật: hành vi cấp hệ thống (một bữa tiệc) nảy sinh từ các tương tác cục bộ (các lời mời song phương + lập kế hoạch cá nhân) mà không có một bộ điều phối trung tâm.

### The documented failure modes

Park và cộng sự ghi nhận tường minh:

- **Các lỗi chuẩn mực không gian.** Các agent đi vào các cửa hàng đóng cửa. Các agent cố sử dụng cùng phòng tắm một người. Các agent ăn trong những phòng không dành để ăn. Mô hình không suy ra các chuẩn mực xã hội-vật lý chỉ từ môi trường.
- **Tràn bộ nhớ.** Các lần chạy mô phỏng sâu khiến chi phí truy xuất bộ nhớ tăng. Biện pháp thực tế: nén bộ nhớ định kỳ (tóm tắt và cắt tỉa) và suy giảm trên các mục mức quan trọng thấp.
- **Ảo giác phản tư.** Các phản tư có thể bịa các mối quan hệ không tồn tại trong luồng bộ nhớ. Giảm thiểu: bao gồm các id bộ nhớ nguồn trong các prompt phản tư và xác minh tại thời điểm truy xuất.

Đây là các chế độ lỗi liên quan tới sản xuất: bất kỳ mô phỏng agent năm 2026 nào đều kế thừa chúng.

### Three-component implementation rules

1. **Bộ nhớ là chỉ thêm.** Không bao giờ biến đổi một mục bộ nhớ. Các sửa chữa là các mục mới.
2. **Các điểm mức quan trọng rẻ.** Gọi LLM để chấm mức quan trọng 1-10 tại thời điểm ghi. Lưu đệm điểm.
3. **Truy xuất được xếp hạng, không được lọc.** Top-k theo điểm kết hợp; không dùng các bộ lọc cứng (làm mất ngữ cảnh).
4. **Phản tư chạy định kỳ.** Kích hoạt khi tổng mức quan trọng của các ký ức chưa xử lý vượt một ngưỡng (ví dụ: 150).
5. **Các kế hoạch có thể sửa đổi.** Khi một quan sát mới mâu thuẫn một kế hoạch, chỉ sinh lại phần bị ảnh hưởng, không phải toàn bộ kế hoạch.

### Generative agents beyond Smallville

Tài liệu tiếp nối giai đoạn 2024-2026 mở rộng kiến trúc:

- **Mô phỏng xã hội đa agent cho chính sách / nghiên cứu thị trường.** Các quần thể giống Smallville mô phỏng hành vi người dùng phản ứng với các tính năng. Nhanh hơn kiểm thử A/B; độ chính xác bị tranh cãi.
- **AI NPC cho trò chơi.** Các RPG với các agent Smallville tạo ra các cốt truyện nổi lên thay vì các nhiệm vụ được viết kịch bản.
- **Các benchmark đánh giá agent sinh.** Thay vì độ chính xác tác vụ, chỉ số trở thành tính đáng tin + tính mạch lạc hành vi qua các lần chạy dài.

Kiến trúc là tham chiếu. Các mở rộng đổi thành phần (kho vector cho bộ nhớ, phản tư tăng cường truy xuất, kế hoạch thần kinh-ký hiệu) nhưng giữ cấu trúc ba phần.

### Why this matters for multi-agent engineering

Smallville là minh chứng khái niệm rằng sự nổi lên đa agent rẻ khi các thành phần đúng. Kiến trúc giờ đã được tái lập trên các mô hình mã nguồn mở (các LLM nhỏ hơn mất tính đáng tin dần dần, không đột ngột). Bất kỳ hệ thống sản xuất nào cần **hành vi xã hội nổi lên** đều dùng hình dạng này. Bất kỳ hệ thống nào cần **thực thi tác vụ chặt chẽ** đều dùng các mẫu bộ giám sát / vai trò / nguyên thủy từ trước trong giai đoạn này.

```figure
a5-memory-reflection
```

## Build It

`code/main.py` triển khai ba thành phần bằng thư viện chuẩn Python với các chính sách agent được viết kịch bản (không có LLM thực). Demo tái tạo sự nổi lên bữa tiệc Valentine ở dạng thu nhỏ:

- `MemoryStream` — nhật ký chỉ thêm với truy xuất độ gần đây/mức quan trọng/độ liên quan.
- `reflect(stream)` — phản tư được viết kịch bản trên các ký ức mức quan trọng cao gần đây.
- `plan(agent_state)` — các kế hoạch cấp ngày và cấp giờ dựa trên các niềm tin hiện tại.
- Kịch bản: 5 agent. Agent 1 bắt đầu với “tổ chức tiệc lúc 5 giờ chiều.” Qua các nhịp mô phỏng, lời mời lan và các agent hội tụ.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: dấu vết theo từng nhịp. Đến nhịp cuối, ít nhất 3 trong 5 agent cho thấy bữa tiệc trong kế hoạch, và chúng hội tụ tại địa điểm tiệc. Sự gieo đơn lẻ tạo ra đến nơi có phối hợp mà không có bộ điều phối nào.

## Use It

`outputs/skill-simulation-designer.md` thiết kế một mô phỏng agent sinh: số agent, lược đồ bộ nhớ, nhịp phản tư, tầm thời gian kế hoạch, và chỉ số đánh giá.

## Ship It

Các quy tắc cho mô phỏng sản xuất:

- **Bộ nhớ là cơ sở dữ liệu.** Chọn một kho thực (DB vector, Postgres) ở quy mô lớn. Thư viện chuẩn trong bộ nhớ dành cho nguyên mẫu.
- **Ghi nhật ký dấu vết truy xuất.** Với mọi hành động, ghi nhật ký các ký ức top-k thúc đẩy nó. Đây là khả năng gỡ lỗi của bạn.
- **Dự trù token theo từng agent.** Truy xuất + phản tư + lập kế hoạch của mỗi agent mỗi nhịp là $O(k)$ lệnh gọi LLM. N agent × T nhịp × số lệnh gọi mỗi nhịp có thể lớn hơn ngân sách của bạn rất nhiều.
- **Nén bộ nhớ định kỳ.** Tóm tắt và cắt tỉa các mục mức quan trọng thấp. Chính sách lưu giữ là một quyết định thiết kế, không phải một chi tiết.
- **Phát hiện các vi phạm chuẩn mực không gian / xã hội** tường minh. Kiến trúc không học chúng.

## Exercises

1. Chạy `code/main.py`. Xác nhận 3+ agent hội tụ tại bữa tiệc. Tăng các agent lên 10 — sự nổi lên còn xảy ra không?
2. Bỏ bước phản tư. Hành vi trông như thế nào? Ánh xạ tới phát hiện thí nghiệm loại bỏ trong Park 2023.
3. Đưa vào một mục tiêu được gieo cạnh tranh (“Klaus muốn có một buổi nói chuyện nghiên cứu lúc 5 giờ chiều”). Các agent chia ra, hay một mục tiêu thống trị? Điều gì quyết định nó?
4. Thêm các ràng buộc không gian: Hobbs Cafe chứa tối đa 4 agent. Mô phỏng xử lý vượt sức chứa một cách êm ái, hay chạm mẫu thất bại “phòng tắm một người”?
5. Đọc Park và cộng sự (arXiv:2304.03442) Phần 6 (các thí nghiệm hành vi nổi lên). Xác định một hành vi không thể tái tạo trong bản thu nhỏ của bạn. Bạn cần tăng cường thành phần nào của kiến trúc?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Memory stream (Luồng bộ nhớ) | “Nhật ký của agent” | Nhật ký chỉ thêm của các quan sát, hành động, phản tư, kế hoạch. |
| Recency (Độ gần đây) | “Ký ức mới đến đâu” | Điểm suy giảm hàm mũ theo tuổi. |
| Importance (Mức quan trọng) | “Agent quan tâm bao nhiêu” | Tự chấm 1-10 tại thời điểm ghi. Được lưu đệm. |
| Relevance (Độ liên quan) | “Liên quan thế nào với truy vấn hiện tại” | Tương đồng cosine (dựa trên embedding). |
| Reflection (Phản tư) | “Niềm tin bậc cao” | Tổng hợp được sinh từ các ký ức gần đây, được nạp lại như một ký ức mới. |
| Plan (Kế hoạch) | “Phân rã ngày/giờ/hành động” | Cây kế hoạch từ trên xuống. Có thể sửa đổi khi các quan sát mâu thuẫn. |
| Smallville | “Sandbox của Park 2023” | Mô phỏng 25 agent tạo ra sự nổi lên Ngày Valentine. |
| Believability (Tính đáng tin) | “Chỉ số chất lượng” | Điểm người chấm cho việc hành vi có giống một agent hợp lý không. |

## Further Reading

- [Park et al. — Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) — kiến trúc tham chiếu
- [UIST '23 paper page](https://dl.acm.org/doi/10.1145/3586183.3606763) — nơi công bố
- [Smallville code release](https://github.com/joonspk-research/generative_agents) — triển khai Python tham chiếu
- [Hayes-Roth 1985 — A Blackboard Architecture for Control](https://www.sciencedirect.com/science/article/abs/pii/0004370285900639) — công trình có trước cho các agent bộ nhớ có cấu trúc
