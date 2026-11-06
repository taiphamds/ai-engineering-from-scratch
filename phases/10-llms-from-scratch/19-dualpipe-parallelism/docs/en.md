# DualPipe Parallelism

> DeepSeek-V3 được huấn luyện trên 2,048 GPU H800 với các expert MoE phân tán trên các node. Giao tiếp all-to-all của expert giữa các node tốn 1 GPU-giờ giao tiếp cho mỗi 1 GPU-giờ tính toán. GPU nhàn rỗi một nửa thời gian. DualPipe (DeepSeek, tháng 12 năm 2024) là một pipeline hai chiều chồng lấp tính toán forward và backward với các giao tiếp all-to-all mà chúng kích hoạt. Bubble giảm, thông lượng tăng, và việc giữ hai bản sao tham số mô hình (phần "dual" tạo nên tên gọi) có chi phí thấp khi Expert Parallelism vốn đã phân bố các expert trên các rank. Bài học này là một walkthrough loại Learn về những gì DualPipe thực sự làm và tại sao cải tiến DualPipeV của Sea AI Lab loại bỏ chi phí tham số 2x để đổi lấy một bubble chặt hơn đôi chút.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05 (distributed training, FSDP, DeepSpeed), Phase 10 · 14 (open-model architectures and MoE)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên bốn thành phần của một chunk forward-backward DualPipe và tại sao mỗi thành phần có cửa sổ chồng lấp riêng.
- Giải thích vấn đề pipeline bubble ở quy mô lớn, và ý nghĩa của "không bubble" trong thực tế so với trong tiếp thị.
- Theo dấu một lịch DualPipe bằng tay cho 8 rank PP và 16 micro-batch, đồng thời xác nhận các luồng thuận và ngược lấp các ô nhàn rỗi của nhau.
- Nêu đánh đổi mà DualPipeV (Sea AI Lab, 2025) thực hiện: loại bỏ việc nhân bản tham số 2x để đổi lấy bubble lớn hơn một chút khi Expert Parallelism không hoạt động.

## The Problem

Huấn luyện mô hình MoE 671B trên 2k GPU H800 gặp ba nút thắt cộng dồn:

1. **Áp lực bộ nhớ.** Mỗi GPU giữ một lát của mô hình. Bộ nhớ activation ở chuỗi 8k trên 61 lớp với 128 head là khổng lồ.
2. **Pipeline bubble.** Pipeline parallelism truyền thống (GPipe, 1F1B) để GPU nhàn rỗi trong khi chúng chờ đầu vào hoặc gradient của stage mình. Với 8 stage, khoảng 12% thời gian GPU có thể là bubble ngay cả với lịch 1F1B.
3. **All-to-all giữa các node.** MoE với expert parallelism phân tán expert trên các node. Mỗi forward pass kích hoạt một all-to-all để điều phối token đến các expert của chúng, và một lần nữa để kết hợp. Ở 2k GPU, điều này dễ trở thành tỷ lệ tính toán trên giao tiếp 1:1.

Mỗi vấn đề này có giải pháp riêng: gradient checkpointing cho bộ nhớ, Zero Bubble (Sea AI Lab, 2023) cho pipeline bubble, các kernel giao tiếp expert-parallel cho all-to-all. Điều DualPipe làm là khiến chúng phối hợp với nhau. Lịch chồng lấp tính toán và giao tiếp trong một chunk forward-backward duy nhất, đưa micro-batch vào đồng thời từ cả hai đầu pipeline, và dùng lịch tạo ra để ẩn all-to-all trong các cửa sổ tính toán.

Kết quả được báo cáo: gần như loại bỏ pipeline bubble, mức sử dụng GPU trên 95% trong lượt huấn luyện 14.8T token của DeepSeek-V3.

## The Concept

### Pipeline parallelism refresher

Chia mô hình N lớp trên P thiết bị. Thiết bị `i` giữ các lớp `i * N/P .. (i+1) * N/P - 1`. Một micro-batch đi forward qua các thiết bị từ 0 đến P-1, rồi backward từ P-1 về 0. Mỗi thiết bị chỉ có thể bắt đầu stage forward khi thiết bị trước gửi đầu ra của nó và chỉ có thể bắt đầu backward khi thiết bị phía sau gửi gradient ngược về phía trước.

GPipe (Huang và cộng sự, 2019) lập lịch một micro-batch mỗi lần, điều này lãng phí phần lớn thời gian GPU. 1F1B (Narayanan và cộng sự, 2021) xen kẽ các forward và backward pass cho nhiều micro-batch. Zero Bubble (Qi và cộng sự, 2023) chia backward pass thành hai phần — backward cho đầu vào (B) và backward cho trọng số (W) — và lập lịch chúng để lấp bubble. Sau Zero Bubble, pipeline gần như kín.

DualPipe là bước tiếp theo. Nó bổ sung hai ý tưởng:

### Idea 1: chunk decomposition

Mỗi chunk forward được chia thành bốn thành phần:

- **Attention.** Các phép chiếu Q/K/V, attention, phép chiếu đầu ra.
- **Điều phối all-to-all.** Giao tiếp giữa các node gửi token đến các expert của chúng.
- **MLP.** Tính toán expert MoE.
- **Kết hợp all-to-all.** Giao tiếp giữa các node đưa đầu ra expert trở lại.

Một chunk backward thêm các phiên bản gradient của từng thành phần này. DualPipe lập lịch chúng sao cho điều phối all-to-all diễn ra song song với tính toán attention của chunk tiếp theo, và kết hợp all-to-all diễn ra song song với tính toán MLP của chunk sau đó.

### Idea 2: bidirectional scheduling

Hầu hết lịch pipeline đưa micro-batch vào từ stage 0 và đi về stage P-1. DualPipe đưa micro-batch vào từ CẢ HAI đầu. Stage 0 thấy các micro-batch forward xuất phát tại đó; stage P-1 cũng thấy các micro-batch forward xuất phát tại đó. Hai luồng gặp nhau ở giữa.

Để điều này hoạt động, thiết bị `i` phải giữ CẢ lớp `i` ở đầu pipeline VÀ lớp `P - 1 - i` ở cuối pipeline. Đó là phần "dual" của DualPipe: mỗi thiết bị giữ hai bản sao của các lớp mô hình mà nó cần phục vụ (một cho mỗi chiều). Ở quy mô DeepSeek-V3, đây là chi phí nhân bản tham số 2x. Điều này chấp nhận được vì Expert Parallelism đã phân bố các expert MoE thưa đến mức nhân bản hai lần các lớp không phải expert là chuyện nhỏ.

Điểm cốt yếu là luồng forward theo một chiều và luồng backward theo chiều kia chồng lấp đúng nơi bubble sẽ xuất hiện trong lịch một chiều. Các bubble biến mất.

### A hand-traced schedule

Xét P = 4 rank, 8 micro-batch, chia thành 4 thuận / 4 ngược. Thời gian đi từ trái sang phải; các hàng là rank thiết bị.

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

Đọc ký hiệu "F4/F5R": rank 1 đang chạy forward của micro-batch 4 (đi từ trái sang phải trong pipeline) VÀ forward của micro-batch 5 (đi từ phải sang trái) trong cùng một ô thời gian. Đó là ý nghĩa vận hành của "hai chiều".

Tại rank 2, các luồng giao nhau chồng lấp sớm hơn, tại rank 0 và P-1 chúng chồng lấp muộn nhất. Trong giai đoạn giữa ổn định của lịch, mỗi rank chạy forward theo chiều X chồng lấp với backward theo chiều Y. Tính toán luôn bận. Các lần điều phối all-to-all cho forward pass ẩn trong tính toán backward. Các lần kết hợp all-to-all ẩn trong tính toán forward. Các bubble bị ép ra.

### Bubble accounting

Pipeline bubble 1F1B tiêu chuẩn (thời gian lãng phí mỗi rank):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

Cải tiến Zero Bubble giảm nó xuống nhưng không về không. DualPipe, trong giai đoạn ổn định, có bubble bằng không nếu số micro-batch chia hết cho 2 lần độ sâu pipeline. Ngoài giai đoạn ổn định (khởi động và kết thúc), có một ít bubble nhưng nó không tăng theo số micro-batch — một thuộc tính quan trọng mà bài báo nhấn mạnh.

Theo cách nói tiếp thị: "không bubble". Theo cách nói kỹ thuật: bubble không tăng theo số micro-batch. Phân tích tiếp theo của Sea AI Lab (DualPipeV / Cut-in-half) cho thấy hoàn toàn không bubble chỉ khi Expert Parallelism không phải nút thắt; với all-to-all do EP chi phối, luôn có một sự thỏa hiệp nào đó về lập lịch.

### DualPipeV — the refinement

Sea AI Lab (2025) quan sát rằng việc nhân bản tham số 2x là lãng phí khi chồng lấp giao tiếp EP không phải trọng tâm. Lịch DualPipeV của họ gấp việc đưa dữ liệu hai chiều vào một lịch "hình V" chạy trên một bản sao tham số duy nhất. Bubble lớn hơn một chút so với DualPipe, nhưng bộ nhớ tiết kiệm được là đáng kể. DeepSeek đã áp dụng DualPipeV trong triển khai DualPipe mã nguồn mở của họ dưới dạng chế độ tắt EP.

Sự đánh đổi:

| Đặc điểm | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| Bản sao tham số mỗi thiết bị | 2 | 1 | 1 | 1 |
| Bubble so với micro-batch | hằng số | tăng ít | tăng | tăng |
| Chồng lấp tính toán-giao tiếp | toàn phần | một phần | tối thiểu | một phần |
| Dùng khi | MoE nặng EP | dense hoặc nhẹ EP | baseline | bất kỳ pipeline nào |

### What it means for a 14.8T-token run

Tiền huấn luyện DeepSeek-V3 tiêu thụ 14.8T token trên 2,048 GPU H800 trong khoảng 2.8M GPU-giờ. Với 1F1B đơn giản, họ sẽ mất 12-15% trong số đó cho pipeline bubble — 340-420K GPU-giờ, đủ để huấn luyện một mô hình 70B đầy đủ. DualPipe thu hồi phần lớn thời gian đó. Khó định lượng trực tiếp phần đóng góp nếu không có log nội bộ, nhưng tuyên bố trong bài báo là mức sử dụng GPU trên 95% trung bình trong quá trình huấn luyện.

Với các lượt chạy nhỏ hơn (dưới 1k GPU), DualPipe là quá mức cần thiết — pipeline bubble nhỏ hơn so với tổng chi phí, và huấn luyện mô hình dense hiếm khi gặp nút thắt all-to-all. Với huấn luyện MoE tiên tiến nhất ở quy mô nhiều nghìn GPU, nó thực tế là bắt buộc.

### Where it sits in the stack

- Bổ sung cho **FSDP** (Giai đoạn 10 · 05). FSDP phân mảnh tham số mô hình trên các rank; DualPipe lập lịch tính toán trên các rank. Chúng kết hợp với nhau.
- Tương thích với phân mảnh gradient **ZeRO-3**. Việc quản lý nhân bản hai bản sao cần phối hợp với gradient được phân mảnh của ZeRO.
- Yêu cầu **các kernel all-to-all tùy chỉnh** được tinh chỉnh cho cấu trúc liên kết cụm cụ thể. Các kernel mã nguồn mở của DeepSeek là triển khai tham chiếu.

```figure
expert-capacity
```

## Use It

`code/main.py` là một bộ mô phỏng lịch pipeline. Nó nhận `(P, n_micro_batches, schedule)` và in mức sử dụng trong giai đoạn ổn định cho từng lịch 1F1B, Zero Bubble, DualPipe và DualPipeV. Đây là một công cụ giảng dạy — các con số khớp với các tuyên bố định tính trong các bài báo, chúng không phải tuyên bố về mức tăng tốc đo được trong sản xuất.

Giá trị của bộ mô phỏng: chạy nó với các giá trị P và số micro-batch khác nhau và quan sát cách tỷ lệ bubble tăng với 1F1B nhưng không tăng với DualPipe.

Các cân nhắc tích hợp cho một lượt huấn luyện thực tế:

- Chọn độ sâu pipeline-parallel chia hết số micro-batch của bạn.
- Bảo đảm lưới expert-parallel của bạn hỗ trợ all-to-all hai chiều. Các kernel của DeepSeek là tham chiếu.
- Dự kiến mất một tuần gỡ lỗi chính lịch đó ở lần đầu tiên. Việc quản lý chi tiết rất rắc rối.
- Theo dõi mức sử dụng GPU theo từng rank, không chỉ tổng hợp. Lợi ích của DualPipe đến từ việc siết chặt các rank chậm.

## Ship It

Bài học này tạo ra `outputs/skill-dualpipe-planner.md`. Với một đặc tả cụm huấn luyện (số GPU, cấu trúc liên kết, kết nối, hình dạng mô hình), nó khuyến nghị chiến lược pipeline parallelism, thuật toán lập lịch cần dùng và tỷ lệ bubble dự kiến ở quy mô đích.

## Exercises

1. Chạy `code/main.py` với `(P=8, micro_batches=16, schedule=dualpipe)` và `(P=8, micro_batches=16, schedule=1f1b)`. Tính chênh lệch mức sử dụng GPU và biểu diễn nó thành GPU-giờ thu hồi được trên mỗi triệu token huấn luyện.

2. Phác thảo bảng lịch cho `(P=4, micro_batches=8, schedule=dualpipe)` bằng tay. Đánh dấu mỗi ô thời gian bằng ID micro-batch và chiều. Xác định ô thời gian đầu tiên không có bubble.

3. Đọc Hình 5 của báo cáo kỹ thuật DeepSeek-V3 (arXiv:2412.19437). Xác định cửa sổ chồng lấp cho điều phối all-to-all trong một chunk forward DualPipe. Giải thích cách lịch tính toán ẩn nó.

4. Tính chi phí tham số bổ sung 2x của DualPipe cho mô hình dense 70B với P=8 stage pipeline và mô hình MoE 671B với P=16 stage pipeline. Chỉ ra tại sao chi phí bổ sung của trường hợp MoE nhỏ hơn theo tỷ lệ (phần lớn tham số là expert, được phân mảnh trên một nhóm EP lớn).

5. So sánh DualPipe với Chimera (một bộ lập lịch hai chiều cạnh tranh từ năm 2021). Xác định hai thuộc tính cụ thể mà DualPipe bổ sung nhưng Chimera không có, dùng Mục 3.4 của bài báo làm tham chiếu.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Pipeline bubble (Khoảng nhàn rỗi pipeline) | "Thời gian nhàn rỗi mỗi rank" | Chu kỳ GPU bị lãng phí vì một stage pipeline đang chờ đầu vào hoặc gradient |
| 1F1B | "Lịch pipeline mặc định" | Lập lịch xen kẽ một forward / một backward; baseline mà DualPipe vượt qua |
| Zero Bubble | "Sea AI Lab 2023" | Chia backward thành B (gradient đầu vào) và W (gradient trọng số); gần như siết kín hoàn toàn pipeline |
| DualPipe | "Lịch DeepSeek-V3" | Pipeline hai chiều + chồng lấp tính toán-giao tiếp; bubble không tăng theo số micro-batch |
| DualPipeV | "Cắt làm đôi" | Cải tiến hình V loại bỏ việc nhân bản tham số 2x để đổi lấy bubble lớn hơn một chút |
| Chunk (Đoạn công việc) | "Đơn vị công việc pipeline" | Một forward hoặc backward pass của một micro-batch qua một stage pipeline |
| All-to-all dispatch (Điều phối all-to-all) | "Gửi token đến expert" | Giao tiếp giữa các node định tuyến token đến các expert MoE được gán cho chúng |
| All-to-all combine (Kết hợp all-to-all) | "Đưa đầu ra expert trở lại" | Giao tiếp giữa các node thu thập đầu ra expert sau MLP |
| Expert Parallelism (EP) (Song song expert) | "Expert trên các GPU" | Phân mảnh expert MoE trên các rank để các GPU khác nhau giữ các expert khác nhau |
| Pipeline Parallelism (PP) (Song song pipeline) | "Lớp trên các GPU" | Phân mảnh các lớp mô hình trên các rank; chiều mà DualPipe lập lịch |
| Bubble fraction (Tỷ lệ bubble) | "Thời gian GPU lãng phí" | (bubble_time / total_time); tỷ lệ mà DualPipe đưa về phía không |

## Further Reading

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) — tài liệu tham chiếu chính về DualPipe
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) — triển khai tham chiếu mã nguồn mở, bao gồm chế độ DualPipeV (Cut-in-half)
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) — tiền thân Zero Bubble
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63) — phân tích DualPipeV cung cấp cơ sở cho chế độ tắt EP của DeepSeek
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) — lịch 1F1B mà DualPipe so sánh với
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) — bài báo pipeline parallelism ban đầu và vấn đề bubble
