# Swarm Optimization for LLMs (PSO, ACO)

> Tối ưu hóa lấy cảm hứng sinh học đang trở lại với LLM. **LMPSO** (arXiv:2504.09247) sử dụng PSO nơi vận tốc mỗi hạt là một prompt và LLM sinh ứng viên tiếp theo; hoạt động tốt trên các đầu ra chuỗi có cấu trúc (biểu thức toán, chương trình). **Model Swarms** (arXiv:2410.11163) coi mỗi chuyên gia LLM là một hạt PSO trên một đa tạp trọng số mô hình và báo cáo **mức tăng trung bình 13.3%** so với 12 đường cơ sở trên 9 tập dữ liệu chỉ với 200 thể hiện. **SwarmPrompt** (ICAART 2025) lai PSO + Sói xám để tối ưu prompt. **AMRO-S** (arXiv:2603.12933) là các chuyên gia pheromone lấy cảm hứng ACO cho định tuyến LLM đa agent — **tăng tốc 4.7x**, bằng chứng định tuyến có thể diễn giải, cập nhật bất đồng bộ có cổng chất lượng tách suy luận khỏi học. Bài này triển khai PSO trên không gian tham số prompt và ACO trên định tuyến agent, đo vì sao các thuật toán cổ điển này phù hợp thời đại LLM, và khi nào không.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## Problem

Bạn có một prompt đạt 62% trên đánh giá tác vụ. Bạn muốn cải thiện nó. Bước đi ngây thơ là tinh chỉnh tay không gradient, mở rộng kém. Học tăng cường cần các tín hiệu phần thưởng và đủ rollout để huấn luyện. Lan truyền ngược qua các prompt không thực sự khả thi — prompt là một chuỗi rời rạc, không phải một tham số khả vi.

Tối ưu hóa lấy cảm hứng sinh học cổ điển — PSO cho các không gian tìm kiếm liên tục, ACO cho chọn đường đi — được thiết kế chính xác cho chế độ này: không gradient, dựa trên quần thể, rẻ mỗi đánh giá. Ghép chúng với các LLM cho bước tìm kiếm không gradient, và bạn có một bộ tối ưu thực tế đáng ngạc nhiên.

Cùng các mẫu áp dụng cho *định tuyến* agent trong các hệ thống đa agent. Một vệt pheromone kiểu ACO ghi lại agent nào làm tốt nhất trên loại tác vụ nào, cho phép bộ định tuyến khai thác vệt, và làm suy giảm pheromone để các tuyến có thể được khám phá lại.

## Concept

### PSO refresher (Kennedy & Eberhart 1995)

Tối ưu hóa bầy hạt: quần thể các hạt trong một không gian tìm kiếm liên tục. Mỗi hạt có vị trí `x_i` và vận tốc `v_i`. Mỗi lần lặp:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Trong đó `p_best` là tốt nhất riêng của hạt, `g_best` là tốt nhất của bầy, `w, c1, c2` là các trọng số quán tính + nhận thức + xã hội, `r1, r2` là các yếu tố ngẫu nhiên.

### PSO on LLM outputs — LMPSO

arXiv:2504.09247 điều chỉnh PSO cho các đầu ra có cấu trúc do LLM sinh (biểu thức toán, chương trình). Mỗi hạt là một đầu ra ứng viên. Vận tốc là một *prompt* mô tả cách sửa đầu ra hiện tại hướng tới tốt nhất cá nhân/toàn cục. LLM sinh đầu ra mới từ prompt vận tốc. “Quán tính” của vận tốc là một prompt như “thực hiện các thay đổi tăng dần nhỏ.”

Điều này hoạt động tốt khi:
- Đầu ra có cấu trúc (có thể phân tích cú pháp, có thể đánh giá).
- Độ thích nghi là tự động (các lần chạy kiểm thử, đánh giá số học).
- Quần thể nhỏ (~10-30 hạt) để tổng số lệnh gọi LLM vẫn quản lý được.

Nó không hoạt động tốt khi độ thích nghi cần xem xét của con người — chi phí mỗi lần lặp trở nên quá cao.

### Model Swarms

arXiv:2410.11163 đưa PSO khỏi lớp đầu ra vào lớp *mô hình*. Mỗi “hạt” là một LLM chuyên gia (các tham số). Bầy di chuyển các tham số hướng tới tốt nhất tập thể qua một cập nhật không gradient. Được báo cáo: mức tăng trung bình 13.3% so với 12 đường cơ sở trên 9 tập dữ liệu, chỉ với 200 thể hiện mỗi lần lặp.

Nhận thức then chốt là các mô hình chuyên gia LLM đã ở gần nhau trong một đa tạp tham số dùng chung (các trọng số adapter, các chênh lệch LoRA). PSO trên không gian con số chiều thấp này rẻ và hiệu quả.

### ACO refresher (Dorigo 1992)

Tối ưu hóa đàn kiến: các kiến đi qua một đồ thị; mỗi đường đi có một vệt pheromone. Các xác suất di chuyển của kiến được đặt trọng số theo độ mạnh pheromone. Các kiến hoàn thành tác vụ lắng đọng pheromone tỷ lệ với chất lượng lời giải. Pheromone suy giảm theo thời gian.

### AMRO-S — ACO for agent routing

arXiv:2603.12933 sử dụng ACO cho định tuyến đa agent. Mỗi loại tác vụ là một “đích đến”; mỗi agent là một tuyến có thể chọn. Pheromone củng cố các tuyến tạo ra các đầu ra tốt. Các đóng góp then chốt:

- **Bằng chứng định tuyến có thể diễn giải.** Độ mạnh pheromone là một tín hiệu con người có thể đọc.
- **Cập nhật bất đồng bộ có cổng chất lượng.** Pheromone chỉ cập nhật sau khi các kiểm tra chất lượng đạt, tách suy luận khỏi học.
- **Tăng tốc 4.7x** trên benchmark định tuyến đa agent.

Cổng chất lượng quan trọng: không có nó, các agent nhanh nhưng sai tích lũy pheromone, và hệ thống khóa vào các tuyến tệ.

### When to use PSO / ACO for LLMs

**Sử dụng PSO khi:**
- Không gian tìm kiếm liên tục hoặc ánh xạ tới các tham số liên tục (các embedding prompt, các trọng số LoRA, các tham số sinh số).
- Độ thích nghi rẻ và tự động.
- Quần thể có thể nhỏ (10-30).

**Sử dụng ACO khi:**
- Bạn có một vấn đề định tuyến hoặc chọn đường đi.
- Các quyết định củng cố theo thời gian (cùng các loại tác vụ trở lại).
- Bạn cần bằng chứng có thể diễn giải cho các quyết định định tuyến.

**Không sử dụng loại nào khi:**
- Độ thích nghi yêu cầu xem xét của con người (quá đắt mỗi lần lặp).
- Không gian tìm kiếm rời rạc và tổ hợp theo cách PSO không bao phủ (thay vào đó sử dụng các thuật toán di truyền).
- Các quyết định thời gian thực cần độ trễ nghiêm ngặt (PSO/ACO hội tụ chậm so với các heuristic một lượt).

### Why bio-inspired still wins

Các phương pháp dựa trên gradient cần các tín hiệu khả vi. Các đầu ra LLM và các quyết định định tuyến không hiển nhiên khả vi. Các phương pháp giả gradient (các bộ định tuyến học tăng cường, các bộ điều chỉnh prompt kiểu DPO) hoạt động nhưng cần huấn luyện tốn kém.

PSO và ACO chỉ cần một hàm *đánh giá*. Nếu bạn có thể chấm một đầu ra ứng viên hoặc một quyết định định tuyến, bạn có thể tối ưu trên không gian. Điều đó làm mức yêu cầu cho tính áp dụng thấp hơn nhiều.

### Practical limits

- **Ngân sách quần thể.** N hạt × T lần lặp × chi phí mỗi đánh giá. Với các đánh giá LLM ở ~$0.02 / lệnh gọi, một PSO 20 hạt chạy 50 lần lặp tốn ~$20. Lập kế hoạch tương ứng.
- **Khám phá so với khai thác.** Tốc độ suy giảm pheromone và quán tính PSO đánh đổi; suy giảm quá nhanh → quên các lời giải; quá chậm → kẹt ở các tối ưu cục bộ sớm.
- **Trôi thảm họa.** Cả hai thuật toán có thể hội tụ rồi phân kỳ nếu cảnh quan độ thích nghi dịch chuyển (phân phối dữ liệu mới). Giám sát độ ổn định độ thích nghi tốt nhất.

```figure
swarm-stigmergy
```

## Build It

`code/main.py` triển khai:

- `LMPSO` — PSO trên các tham số prompt số (temperature, các trọng số top_k). “Sinh LLM” của mỗi hạt được mô phỏng như một hàm độ thích nghi được viết kịch bản. Chạy thuật toán trong 30 lần lặp và cho thấy hội tụ g_best.
- `AMRO_S` — định tuyến kiểu ACO. 3 agent, 4 loại tác vụ, ma trận pheromone, 100 tác vụ được định tuyến. In phân phối (task_type → các lựa chọn agent) theo thời gian để cho thấy hình thành vệt.
- So sánh: định tuyến ngẫu nhiên với định tuyến ACO trên cùng luồng tác vụ. Đo chất lượng và độ trễ.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng:
- LMPSO: độ thích nghi g_best cải thiện từ ngẫu nhiên tới gần tối ưu qua 30 lần lặp.
- AMRO-S: bảng pheromone ổn định trên đúng agent cho mỗi loại tác vụ; định tuyến ACO vượt ngẫu nhiên ~30-40% về chất lượng và cũng giảm độ trễ (ít thử lại hơn).

## Use It

`outputs/skill-swarm-optimizer.md` giúp chọn giữa PSO, ACO, các thuật toán di truyền, và các bộ tối ưu dựa trên gradient cho các bài toán tối ưu hóa LLM / agent.

## Ship It

- **Bắt đầu nhỏ.** 10-20 hạt, 20-50 lần lặp. Chỉ tăng quy mô nếu đường cong hội tụ cho thấy mức tăng rõ ràng.
- **Ghi nhật ký pheromone hoặc g_best mỗi lần lặp.** Gỡ lỗi các bộ tối ưu bầy đàn không có dấu vết rất đau đớn.
- **Đặt cổng chất lượng cho cập nhật.** Đặc biệt cho định tuyến ACO: các agent nhanh và sai không được tích lũy pheromone.
- **Đặt lại suy giảm khi dịch chuyển phân phối.** Khi phân phối đánh giá thay đổi, các pheromone già đã lỗi thời; đặt lại hoặc tạm thời tăng gấp đôi tốc độ suy giảm.
- **Giới hạn chi phí mỗi lần lặp.** Phát một chỉ số chi phí mỗi lần lặp. PSO tốn $500 / lần lặp và tăng 0.5% không thể đưa ra sử dụng.

## Exercises

1. Chạy `code/main.py`. Quan sát hội tụ LMPSO. Thay đổi kích thước quần thể 5, 10, 20, 50. Ở kích thước nào thời gian tới hội tụ bão hòa?
2. Triển khai một thí nghiệm “trôi thảm họa”: sau lần lặp 30, thay đổi hàm độ thích nghi. PSO thích nghi nhanh đến đâu? Đặt lại `p_best` có giúp không?
3. Thêm một cổng chất lượng vào AMRO-S: chỉ lắng đọng pheromone trên các lần chạy có điểm đánh giá > 0.7. Điều này thay đổi hội tụ thế nào so với phiên bản không có cổng?
4. Đọc LMPSO (arXiv:2504.09247). Ánh xạ “vận tốc như một prompt” của bài báo trở lại vận tốc số của bạn. Điều gì bị mất trong mô phỏng và điều gì được bảo toàn?
5. Đọc AMRO-S (arXiv:2603.12933). Triển khai “đường nhanh suy luận” được tách rời với cập nhật pheromone bất đồng bộ. Điều này thay đổi độ trễ hệ thống thế nào dưới tải duy trì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| PSO | “Tối ưu hóa bầy hạt” | Kennedy-Eberhart 1995. Bộ tối ưu không gradient dựa trên quần thể. |
| ACO | “Tối ưu hóa đàn kiến” | Dorigo 1992. Tối ưu hóa đường đi/tuyến qua các vệt pheromone. |
| LMPSO | “PSO với sinh LLM” | arXiv:2504.09247. Vận tốc là một prompt; LLM tạo các ứng viên. |
| Model Swarms (Các bầy mô hình) | “PSO trên các trọng số chuyên gia” | arXiv:2410.11163. Cập nhật không gradient trên không gian con tham số mô hình. |
| AMRO-S | “ACO cho định tuyến agent” | arXiv:2603.12933. Ma trận pheromone trên loại tác vụ × agent. |
| p_best / g_best | “Tốt nhất cá nhân / toàn cục” | Các lời giải tốt nhất theo từng hạt và toàn bầy được tìm thấy đến nay. |
| Pheromone | “Bộ nhớ định tuyến” | Độ mạnh trên một cạnh; suy giảm theo thời gian; lắng đọng theo chất lượng. |
| Quality-gated update (Cập nhật có cổng chất lượng) | “Chỉ học từ các lần chạy tốt” | Lắng đọng pheromone có điều kiện theo kiểm tra chất lượng. |
| Catastrophic drift (Trôi thảm họa) | “Dịch chuyển phân phối” | Cảnh quan độ thích nghi thay đổi; p_best và pheromone cũ trở nên lỗi thời. |

## Further Reading

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) — bài báo PSO năm 1995
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) — các nền tảng ACO năm 1992
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) — PSO cho các đầu ra LLM có cấu trúc
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) — PSO trên không gian con trọng số mô hình
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) — định tuyến do pheromone điều khiển với cổng chất lượng
