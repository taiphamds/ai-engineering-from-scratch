# The Direct Preference Optimization Family

> Rafailov và cộng sự (2023) cho thấy nghiệm tối ưu của RLHF có dạng đóng theo dữ liệu ưu tiên, nên bạn có thể bỏ mô hình phần thưởng tường minh và tối ưu chính sách trực tiếp. Hiểu biết đó sinh ra một họ — IPO, KTO, SimPO, ORPO, BPO — mỗi phương pháp sửa một chế độ lỗi của DPO. Năm 2026, thuật toán căn chỉnh trực tiếp được dùng trong nhiều lần chạy hậu huấn luyện tiên tiến hàng đầu hơn PPO. Nhưng đường cong quá tối ưu hóa từ Bài 2 vẫn áp dụng: DAA không thoát Goodhart, chúng chỉ chuyển nơi nó gây hại.

**Type:** Learn
**Languages:** Python (stdlib, six-variant preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 minutes

## Learning Objectives

- Suy ra dạng đóng DPO từ nghiệm tối ưu RLHF có KL.
- Nêu chế độ lỗi mà từng phương pháp IPO, KTO, SimPO, ORPO, BPO sửa trong DPO.
- Phân biệt "khoảng cách phần thưởng ngầm" với "cường độ ưu tiên" và giải thích tại sao ánh xạ đồng nhất của IPO quan trọng.
- Giải thích tại sao Rafailov và cộng sự (NeurIPS 2024) chứng minh DAA quá tối ưu hóa dù không có RM tường minh.

## The Problem

Mục tiêu RLHF (Bài 1):

```math
\max_{\pi} \; \mathbb{E}_{x, y \sim \pi} \big[ r(x, y) \big] - \beta \, \mathrm{KL}(\pi \,\|\, \pi_{\text{ref}})
```

có một nghiệm tối ưu đã biết:

```math
\pi^*(y \mid x) = \frac{1}{Z(x)} \, \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{r(x, y)}{\beta}\right)
```

Vì vậy phần thưởng được xác định ngầm bởi tỷ số giữa chính sách tối ưu và tham chiếu:

```math
r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)
```

Thay biểu thức này vào likelihood ưu tiên Bradley-Terry và hàm phân hoạch `Z(x)` triệt tiêu vì nó chỉ phụ thuộc `x`. Phần còn lại là hàm mất mát chỉ theo tham số chính sách — không cần mô hình phần thưởng. Đó là DPO.

Điểm vướng: phép suy dẫn giả định nghiệm tối ưu đạt được, dữ liệu ưu tiên nằm trong phân phối và chính sách tham chiếu là điểm neo mode thực. Không giả định nào đúng hoàn toàn. Mỗi thành viên trong họ sửa một giả định bị vi phạm khác nhau.

## The Concept

### DPO (Rafailov et al., 2023)

```math
L_{\text{DPO}} = -\log \sigma\!\left(
  \beta \log \frac{\pi(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)}
  - \beta \log \frac{\pi(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}
\right)
```

Điều gì có thể sai:

- Khoảng cách phần thưởng ngầm `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)` không bị chặn. Một ưu tiên rất nhỏ có thể tạo khoảng cách lớn tùy ý.
- Hàm mất mát đẩy log-prob được chọn và bị loại theo hai hướng đối lập. Nó có thể đẩy log-prob tuyệt đối của phần được chọn xuống miễn phần bị loại giảm nhanh hơn. Đây là hiện tượng Phản hồi Được chọn Suy giảm.
- Các ưu tiên ngoài phân phối (các cặp mà cả hai phản hồi đều hiếm dưới chính sách tham chiếu) tạo ra các phần thưởng ngầm tùy ý.

### IPO (Azar et al., 2024)

Tối ưu hóa Ưu tiên Đồng nhất thay log-sigmoid bằng ánh xạ đồng nhất trên xác suất ưu tiên. Hàm mất mát trở thành sai số bình phương trên một mục tiêu bị chặn:

```math
L_{\text{IPO}} = \left( \log \frac{\pi(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \log \frac{\pi(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} - \frac{1}{2\beta} \right)^2
```

Biên bị chặn bởi `1/(2 beta)`. Cường độ ưu tiên và khoảng cách phần thưởng ngầm tỷ lệ thuận. Không bùng nổ.

### KTO (Ethayarajh et al., 2024)

Tối ưu hóa Kahneman-Tversky bỏ hoàn toàn cấu trúc theo cặp. Với một đầu ra có nhãn duy nhất và tín hiệu nhị phân "mong muốn" hoặc "không mong muốn", nó ánh xạ sang mức thỏa dụng theo lý thuyết triển vọng:

```math
v(x, y) = \sigma\!\left(\beta \log \frac{\pi(y \mid x)}{\pi_{\text{ref}}(y \mid x)} - z_{\text{ref}}\right)
```

với trọng số khác nhau cho được và mất (né tránh mất mát). Lợi ích: bạn có thể dùng dữ liệu không ghép cặp, vốn dồi dào hơn nhiều.

### SimPO (Meng et al., 2024)

Tối ưu hóa Ưu tiên Đơn giản căn chỉnh tín hiệu huấn luyện với quá trình sinh. Loại hoàn toàn chính sách tham chiếu và chuẩn hóa log-likelihood theo độ dài:

```math
L_{\text{SimPO}} = -\log \sigma\!\left(
  \frac{\beta}{|y_w|} \log \pi(y_w \mid x)
  - \frac{\beta}{|y_l|} \log \pi(y_l \mid x)
  - \gamma
\right)
```

với biên `gamma` để ổn định. Chuẩn hóa độ dài loại bỏ động cơ khai thác chế độ lỗi thiên lệch độ dài của DPO (`y_w` dài hơn cho khoảng cách log-prob lớn hơn theo cách xây dựng).

### ORPO (Hong et al., 2024)

Tối ưu hóa Ưu tiên Tỷ số Odds thêm một số hạng ưu tiên vào log-likelihood âm SFT tiêu chuẩn:

```math
\begin{aligned}
L_{\text{ORPO}} &= L_{\text{NLL}}(y_w) + \lambda L_{\text{OR}} \\
L_{\text{OR}} &= -\log \sigma\!\left(\log \frac{\text{odds}(y_w)}{\text{odds}(y_l)}\right)
\end{aligned}
```

Không có chính sách tham chiếu — số hạng SFT là bộ điều chuẩn. Huấn luyện trong một giai đoạn từ mô hình nền đến mô hình được căn chỉnh. Không có checkpoint SFT riêng.

### BPO (ICLR 2026 submission, OpenReview id=b97EwMUWu7)

Xác định vấn đề Phản hồi Được chọn Suy giảm: DPO giữ xếp hạng `y_w > y_l` nhưng log-prob tuyệt đối của `y_w` có thể giảm. BPO thêm hiệu chỉnh một dòng phạt việc giảm trên phản hồi được chọn. Báo cáo độ chính xác +10.1% trên Llama-3.1-8B-Instruct ở suy luận toán so với DPO.

### The universal result: DAAs still over-optimize

Rafailov và cộng sự trong "Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms" (NeurIPS 2024) huấn luyện chính sách bằng DPO, IPO, SLiC trên nhiều tập dữ liệu qua các ngân sách KL. Các đường cong phần thưởng chuẩn theo KL có cùng hình dạng đạt đỉnh rồi sụp đổ của Gao và cộng sự. Phần thưởng ngầm truy vấn mẫu ngoài phân phối trong huấn luyện; điều chuẩn KL không ổn định điều này.

DAA không thoát Goodhart. Chúng thay bề mặt nó gây hại từ "mô hình phần thưởng bị quá tối ưu hóa" sang "tỷ số chính sách tham chiếu bị quá tối ưu hóa." Giải pháp phổ quát — dữ liệu tốt hơn, tổ hợp, dừng sớm — áp dụng cho cả hai.

### Choosing among them (2026)

- Nếu bạn có dữ liệu ưu tiên ghép cặp lớn: DPO với beta thận trọng, SimPO nếu thiên lệch độ dài rõ ràng.
- Nếu bạn có phản hồi nhị phân không ghép cặp: KTO.
- Nếu bạn muốn pipeline một giai đoạn từ mô hình nền: ORPO.
- Nếu bạn thấy log-prob được chọn suy giảm trong log DPO: BPO.
- Nếu cường độ ưu tiên biến thiên rộng và DPO đang bão hòa: IPO.

Mọi phòng thí nghiệm chạy cả năm trên một bộ kiểm thử và chọn phương án thắng theo từng tác vụ. Không có lý do nghiệm tối ưu giống nhau cho suy luận toán và an toàn.

```figure
dpo-margin
```

## Use It

`code/main.py` so sánh sáu hàm mất mát (DPO, IPO, KTO, SimPO, ORPO, BPO) trên tập dữ liệu ưu tiên đơn giản nơi cường độ ưu tiên thực thay đổi theo cặp. Mỗi hàm mất mát được tối ưu trên cùng mẫu 500 cặp với chính sách softmax nhỏ. Vẽ tỷ lệ thắng cuối, độ trôi log-prob được chọn và độ phân tán phần thưởng ngầm theo phương pháp.

## Ship It

Bài học này tạo ra `outputs/skill-preference-loss-selector.md`. Với thống kê tập dữ liệu (ghép cặp so với không ghép cặp, cường độ ưu tiên biến thiên so với đồng nhất, phân phối độ dài) và mục tiêu (một giai đoạn hoặc SFT rồi ưu tiên), khuyến nghị hàm mất mát ưu tiên và báo cáo chế độ lỗi nó bảo vệ chống lại.

## Exercises

1. Chạy `code/main.py`. Báo cáo mức giảm log-prob được chọn cuối cho DPO và BPO. BPO nên giữ xác suất tuyệt đối được chọn cao hơn — xác minh điều này.

2. Sửa dữ liệu ưu tiên để mọi cặp có cường độ bằng nhau. Phương pháp nào trong sáu phương pháp vững nhất? Phương pháp nào suy giảm? Giải thích lợi thế IPO ở đây.

3. Làm phản hồi bị loại dài trung bình 2x phản hồi được chọn. Không thay đổi gì khác, cho thấy việc DPO khai thác độ dài bằng số và cách SimPO sửa.

4. Rafailov và cộng sự (NeurIPS 2024) khẳng định DAA quá tối ưu hóa. Tái tạo phiên bản một điểm: vẽ phân kỳ KL được chọn-trừ-bị loại và quan sát quá tối ưu hóa trong DPO ở beta lớn.

5. Đọc tóm tắt bài báo BPO (OpenReview b97EwMUWu7). Viết hiệu chỉnh một dòng BPO thêm vào DPO. Xác nhận với cách triển khai trong `code/main.py`.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| DPO | "RLHF không có mô hình phần thưởng" | Hàm mất mát suy ra từ nghiệm tối ưu RLHF dạng đóng; chỉ tham số chính sách |
| Implicit reward (Phần thưởng ngầm) | "log-ratio" | `beta * log(pi(y\|x) / pi_ref(y\|x))` — phần thưởng được DPO hàm ý |
| IPO | "DPO bị chặn" | Thay log-sigmoid bằng đồng nhất; khoảng cách phần thưởng ngầm bị chặn bởi `1/(2 beta)` |
| KTO | "DPO không ghép cặp" | Mức thỏa dụng lý thuyết triển vọng trên nhãn đơn với né tránh mất mát |
| SimPO | "DPO không tham chiếu" | Log-likelihood chuẩn hóa độ dài + biên; không có chính sách tham chiếu |
| ORPO | "DPO một giai đoạn" | NLL + số hạng ưu tiên tỷ số odds; huấn luyện từ mô hình nền trong một lượt |
| BPO | "DPO giữ phần được chọn" | DPO cộng hình phạt cho việc giảm log-prob tuyệt đối của phản hồi được chọn |
| Degraded Chosen (Phần được chọn suy giảm) | "phần được chọn đi xuống" | DPO giảm log-prob được chọn miễn phần bị loại giảm nhanh hơn |
| DAA | "thuật toán căn chỉnh trực tiếp" | Mọi phương pháp hàm mất mát ưu tiên bỏ RM tường minh |

## Further Reading

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) — IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
