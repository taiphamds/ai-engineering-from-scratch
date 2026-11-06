---
name: prompt-alignment-method-selector
description: Choose the right alignment method (SFT, RLHF, DPO, KTO, ORPO, SimPO) for your use case
version: 1.0.0
phase: 10
lesson: 8
tags: [alignment, dpo, rlhf, kto, orpo, simpo, preference-optimization, fine-tuning]
---

# Alignment Method Selector

Khi chọn phương pháp căn chỉnh cho mô hình ngôn ngữ, dùng khung này để đánh giá yêu cầu dữ liệu, tính toán và chất lượng, rồi chọn phương pháp phù hợp nhất với ràng buộc.

## Input Requirements

Cung cấp:
- **Mô hình cơ sở** (ví dụ Llama 3 8B, Mistral 7B, Qwen 2.5 72B)
- **Điểm khởi đầu** (mô hình cơ sở, hay đã SFT?)
- **Dữ liệu sẵn có** (cặp chỉ dẫn, cặp sở thích, đánh giá không ghép cặp, hoặc không có)
- **Ngân sách tính toán** (giờ GPU, số GPU)
- **Mục tiêu chất lượng** (đủ tốt cho nguyên mẫu, cạnh tranh với mã nguồn mở, tiên tiến nhất)
- **Tiến độ** (ngày, tuần, tháng)

## Decision Matrix

### Quick Selection

| Tình huống của bạn | Phương pháp đề xuất | Vì sao |
|---------------|-------------------|-----|
| Không dữ liệu sở thích, chỉ cặp chỉ dẫn | Chỉ SFT | Bạn không thể căn chỉnh mà không có tín hiệu sở thích |
| < 5,000 cặp sở thích, tính toán hạn chế | DPO | Pipeline đơn giản hơn, hoạt động tốt với dữ liệu nhỏ |
| Phản hồi không ghép cặp (chỉ thích/không thích) | KTO | Phương pháp duy nhất hoạt động không cần so sánh theo cặp |
| Muốn căn chỉnh trong một lần huấn luyện | ORPO | Kết hợp SFT + căn chỉnh, không mô hình tham chiếu |
| Bị giới hạn bộ nhớ (không chứa được mô hình tham chiếu) | SimPO | Không cần mô hình tham chiếu |
| Căn chỉnh quy mô lớn, đa mục tiêu | RLHF (PPO) | Mô hình phần thưởng riêng nắm sở thích phức tạp |
| Căn chỉnh lặp với dữ liệu trực tuyến | RLHF (PPO) | Có thể sinh, đánh giá và huấn luyện lại trong vòng lặp |
| Tinh chỉnh sau RLHF | DPO | Tinh chỉnh mô hình RLHF trên sở thích có mục tiêu |

### Detailed Comparison

| Phương pháp | Yêu cầu dữ liệu | Mô hình trong bộ nhớ | Vòng lặp huấn luyện | Ổn định | Quy mô tốt nhất |
|--------|-----------------|-----------------|----------------|-----------|------------|
| SFT | Cặp chỉ dẫn (10K+) | 1 | 1 | Cao | Bất kỳ |
| RLHF | Cặp sở thích (20K+) | 3-4 | 3 | Thấp | Lớn (70B+) |
| DPO | Cặp sở thích (5K+) | 2 | 2 (SFT + DPO) | Cao | Nhỏ-Trung bình (7B-70B) |
| KTO | Đánh giá không ghép cặp (5K+) | 2 | 2 (SFT + KTO) | Cao | Bất kỳ |
| ORPO | Cặp sở thích (10K+) | 1 | 1 | Cao | Nhỏ-Trung bình |
| SimPO | Cặp sở thích (5K+) | 1 | 2 (SFT + SimPO) | Cao | Nhỏ-Trung bình |

## Method-Specific Configuration

### SFT

- **Khi nào dừng**: Sau 1-3 epoch hoặc khi mất mát xác thực ngừng giảm
- **Siêu tham số chính**: Tốc độ học (1e-5 đến 5e-5, thấp hơn cho mô hình lớn hơn)
- **Chi tiết quan trọng**: Che token chỉ dẫn trong mất mát
- **Điểm dễ mắc**: Hơn 3 epoch gây ghi nhớ; trộn 2-5% dữ liệu huấn luyện trước

### RLHF (PPO)

- **Khi nào dùng**: Bạn có 20K+ cặp so sánh, cần căn chỉnh đa mục tiêu, hoặc muốn học trực tuyến lặp
- **Siêu tham số chính**: Hệ số KL (0.01-0.05), tỷ số cắt PPO (0.1-0.3), tốc độ học (5e-6 đến 3e-5)
- **Chi tiết quan trọng**: Mô hình phần thưởng nên >= kích thước mô hình chính sách
- **Điểm dễ mắc**: PPO bất ổn; theo dõi phân kỳ KL và đường cong phần thưởng liên tục

### DPO

- **Khi nào dùng**: Bạn có cặp sở thích và muốn pipeline đơn giản hơn RLHF
- **Siêu tham số chính**: Beta (0.1-0.5; thấp hơn = cho phép lệch nhiều hơn khỏi tham chiếu)
- **Chi tiết quan trọng**: Mô hình tham chiếu phải là bản sao đóng băng của checkpoint SFT
- **Điểm dễ mắc**: Rất nhạy với beta; chạy phép quét trên [0.05, 0.1, 0.2, 0.5]

### KTO

- **Khi nào dùng**: Bạn chỉ có nhãn "tốt" hoặc "xấu" không có so sánh theo cặp
- **Siêu tham số chính**: Beta (như DPO), hệ số ác cảm mất mát (1.5x trên phản hồi xấu)
- **Chi tiết quan trọng**: Cần ví dụ tốt/xấu gần cân bằng (chia 40-60%)
- **Điểm dễ mắc**: Không có cặp, tín hiệu gradient yếu hơn; có thể cần nhiều dữ liệu hơn DPO

### ORPO

- **Khi nào dùng**: Bạn muốn bỏ hẳn SFT và đi thẳng từ cơ sở đến căn chỉnh
- **Siêu tham số chính**: Lambda (trọng số hạng tử sở thích so với hạng tử SFT)
- **Chi tiết quan trọng**: Cần cả nhãn chỉ dẫn VÀ cặp sở thích trong một tập dữ liệu
- **Điểm dễ mắc**: Mục tiêu kết hợp có thể khó cân bằng; nếu mất mát SFT chi phối, căn chỉnh yếu

### SimPO

- **Khi nào dùng**: Thiết lập giới hạn bộ nhớ không thể giữ mô hình tham chiếu
- **Siêu tham số chính**: Beta, gamma (số mũ chuẩn hóa độ dài)
- **Chi tiết quan trọng**: Chuẩn hóa độ dài ngăn mô hình ưu ái phản hồi ngắn
- **Điểm dễ mắc**: Không có điểm neo mô hình tham chiếu, mô hình có thể trôi xa hơn; theo dõi cẩn thận

## Pipeline Templates

### Template 1: Fast Prototype (1-2 days)

```
Base Model -> SFT (1 epoch, 10K examples) -> DPO (3 epochs, 5K pairs)
```

Tính toán: ~4 giờ GPU cho mô hình 7B trên A100
Chất lượng: Tuân theo chỉ dẫn vững, căn chỉnh sở thích cơ bản

### Template 2: Production Quality (1-2 weeks)

```
Base Model -> SFT (2 epochs, 50K examples) -> DPO (5 epochs, 20K pairs) -> Eval -> Iterate
```

Tính toán: ~40 giờ GPU cho 7B, ~200 giờ GPU cho 70B
Chất lượng: Cạnh tranh với mô hình RLHF mã nguồn mở

### Template 3: State-of-the-Art (1-3 months)

```
Base Model -> SFT (2 epochs, 100K+ examples) -> RLHF (PPO, 50K+ pairs) -> DPO (targeted refinement) -> Eval -> Iterate
```

Tính toán: ~500+ giờ GPU cho 70B
Chất lượng: Tiệm cận căn chỉnh mô hình hàng đầu

### Template 4: Minimal Data (1-2 days)

```
Base Model -> SFT (1 epoch, 5K examples) -> KTO (unpaired thumbs up/down from users)
```

Tính toán: ~2 giờ GPU cho 7B
Chất lượng: Tốt hơn chỉ SFT với chi phí thu thập dữ liệu tối thiểu

## Evaluation Protocol

Sau căn chỉnh, đánh giá trên các chiều này:

1. **Tỷ lệ thắng sở thích**: So mô hình căn chỉnh với SFT trên 200+ prompt kiểm thử có giám khảo con người. Mục tiêu: > 60% tỷ lệ thắng.
2. **Giữ benchmark**: MMLU, HumanEval, hoặc benchmark riêng miền. Không nên giảm > 5% so với baseline SFT.
3. **MT-Bench hoặc AlpacaEval**: Benchmark chất lượng căn chỉnh tiêu chuẩn. So với baseline đã công bố.
4. **Đánh giá an toàn**: Kiểm thử với prompt đối kháng, jailbreak và các loại yêu cầu có hại.
5. **Đa dạng phản hồi**: Đo entropy phản hồi trên 100 prompt. Entropy thấp = sụp đổ mode.

## Common Failure Modes

| Triệu chứng | Nguyên nhân | Cách khắc phục riêng phương pháp |
|---------|-------|-------------------|
| Phản hồi dài dòng, kéo dài | Mô hình phần thưởng / phần thưởng ngầm ưu ái độ dài | DPO: tăng beta. RLHF: thêm phạt độ dài. SimPO: điều chỉnh gamma. |
| Mô hình đồng ý mọi thứ | Xu nịnh từ thiên lệch dữ liệu sở thích | Thêm cặp sở thích mà phản hồi đúng không đồng ý người dùng |
| Từ chối yêu cầu lành tính | Căn chỉnh quá mức trên dữ liệu an toàn | Giảm tỷ lệ ví dụ an toàn, thêm cặp từ chối lành tính |
| Đầu ra gần giống hệt SFT | Beta quá cao (DPO/KTO) hoặc hệ số KL quá cao (PPO) | Hạ beta / hệ số KL; mô hình không học |
| Mất mát huấn luyện dao động | Tốc độ học quá cao hoặc thiếu dữ liệu | Giảm lr 2-3x; tăng dữ liệu sở thích |
