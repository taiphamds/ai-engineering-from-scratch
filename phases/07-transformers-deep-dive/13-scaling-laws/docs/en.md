# Scaling Laws

> Bài báo Kaplan năm 2020 nói: mô hình lớn hơn, loss thấp hơn. Bài báo Hoffmann năm 2022 nói: bạn đã huấn luyện thiếu. Tính toán đi vào hai nhóm — tham số và token — và cách chia không hiển nhiên.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## The Problem

Khi bạn có C FLOP tính toán huấn luyện và muốn mô hình tốt nhất, bạn đối mặt hai nút điều chỉnh:

1. **Bao nhiêu tham số (N)?** Mô hình lớn hơn, năng lực cao hơn.
2. **Bao nhiêu token huấn luyện (D)?** Nhiều dữ liệu hơn, sử dụng năng lực tốt hơn.

FLOP tăng xấp xỉ theo `6 × N × D`. Bạn có thể đẩy N lên và D xuống, hoặc D lên và N xuống. Cách nào tốt hơn?

Trước năm 2022, câu trả lời là "đẩy N mạnh." GPT-3 (2020) có 175B tham số được huấn luyện trên ~300B token. Tỷ lệ khoảng 1.7 token mỗi tham số. Các quy luật mở rộng Kaplan ủng hộ điều này.

Hoffmann và cộng sự (2022), huấn luyện một họ mô hình nhỏ gọi là Chinchilla, tìm ra điều khác: tỷ lệ tối ưu gần **20 token mỗi tham số** hơn. GPT-3 bị huấn luyện thiếu 10×. Chinchilla (70B tham số, 1.4T token) thắng GPT-3 (175B, 300B token) trên mọi benchmark với chi phí suy luận ít hơn 2.5×.

Năm 2026 là thế giới của Chinchilla — với một thay đổi quan trọng. Llama 3 8B được huấn luyện trên 15 nghìn tỷ token, tỷ lệ 1,875 token mỗi tham số. Chín mươi tư lần vượt tối ưu Chinchilla. Chi phí suy luận quan trọng hơn chi phí huấn luyện với các mô hình sẽ được dùng ở quy mô lớn, nên huấn luyện quá mức (vượt Chinchilla) để có lượng tài nguyên triển khai nhỏ hơn là mặc định năm 2026.

## The Concept

![Chinchilla curves: loss vs compute at various N/D ratios](../assets/scaling-laws.svg)

### The Hoffmann law

Từ bài báo Chinchilla, loss tuân theo:

```
L(N, D) = A / N^α + B / D^β + E
```

- `N` = tham số (không phải embedding).
- `D` = token huấn luyện.
- `α ≈ 0.34`, `β ≈ 0.28` (gần đối xứng).
- `E ≈ 1.69`, mức trần loss không thể giảm.
- `A ≈ 406`, `B ≈ 411`.

Hai số hạng đánh đổi với nhau khi bạn mở rộng. Lấy đạo hàm theo `N` ở tính toán cố định (C = 6ND) và giải:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Tối ưu tính toán: 20 token mỗi tham số.

### Why over-training anyway

Tối ưu Chinchilla giảm thiểu loss huấn luyện mỗi FLOP huấn luyện. Nhưng bạn trả chi phí huấn luyện một lần; chi phí suy luận mãi mãi.

Với một chatbot phục vụ một nghìn tỷ token mỗi tháng, suy luận chi phối tổng chi phí. Cách tiếp cận của Llama: huấn luyện nhỏ hơn, lâu hơn. 8B tại 15T token được tối ưu sâu cho suy luận:

- Vừa trên GPU tiêu dùng.
- Độ trễ là một phần của 70B tối ưu Chinchilla.
- Chất lượng đủ gần cho hầu hết tác vụ.

Bài báo năm 2024 của DeepMind ("Over-training is the new optimal") hình thức hóa điều này. Với các khối lượng công việc bị suy luận chi phối, tỷ lệ đúng gần 100–500 token mỗi tham số hơn tùy khối lượng phục vụ.

### Emergence vs smoothness

Khẳng định: một số khả năng (số học, suy luận nhiều bước, theo chain-of-thought) "xuất hiện" đột ngột ở một quy mô nào đó.

Schaeffer và cộng sự (2023) lập luận đây là một tạo tác đo lường: các thước đo xuất hiện đột ngột dùng chấm điểm không liên tục (khớp chính xác, accuracy tại ngưỡng) che giấu cải thiện trơn trong các logits bên dưới. Các thước đo liên tục (cross-entropy) cho các đường cong trơn.

Năm 2026 đồng thuận là: dự đoán qua loss liên tục đáng tin cậy. Các bước nhảy benchmark thường là tạo tác bộ chấm. Lập kế hoạch ngân sách theo các thước đo liên tục.

### The 2026 picture

Các quy luật mở rộng vẫn hoạt động, nhưng:

| Yếu tố | Thay đổi thế nào |
|--------|-------------|
| Chất lượng dữ liệu | Tuyển chọn các token "tốt" (kiểu Phi) dịch các đường cong >2× tính toán hiệu dụng |
| MoE | Tổng tham số tách khỏi FLOP hoạt động; các quy luật mở rộng theo FLOP hoạt động |
| Hậu huấn luyện | Một số năng lực (theo chỉ dẫn, mã) thay đổi theo SFT+RLHF nhiều hơn tiền huấn luyện |
| Đa phương thức | Các token ảnh + văn bản cùng mở rộng; các đường cong riêng theo phương thức |
| Dữ liệu tổng hợp | Các mô hình sinh dữ liệu huấn luyện; tính toán hiệu dụng có thể cộng dồn |

Bộ tối ưu Muon (Kimi Moonlight, 2024) cho thấy mức tăng tính toán hiệu dụng ~2× so với AdamW ở dữ liệu tương ứng. Một số lượt huấn luyện năm 2026 dùng Muon mặc định. Thay đổi hằng số tuyệt đối trong quy luật mở rộng, không phải hình dạng.

```figure
scaling-laws
```

## Build It

Xem `code/main.py`. Chúng ta triển khai phương trình loss Chinchilla và giải `(N, D)` tối ưu tính toán ở mỗi một trong vài ngân sách tính toán.

### Step 1: Chinchilla loss

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

Vẽ `L` dưới dạng đường đồng mức trên `(N, D)` ở `C = 6ND` cố định. Tìm giá trị nhỏ nhất.

### Step 2: compute-optimal frontier

Với các ngân sách tính toán từ `1e17` đến `1e25` FLOP, tìm `(N, D)` giảm thiểu loss với ràng buộc `6ND = C`. Xác minh tỷ lệ `D/N ≈ 20`.

### Step 3: over-training cost

Tính loss bổ sung bạn trả để huấn luyện một mô hình nhỏ hơn 10× (1/10 N tối ưu, 10× D tối ưu). Báo cáo phần tiết kiệm FLOP suy luận (tỷ lệ với N) để đổi lại.

### Step 4: compare to real models

Đưa vào các cặp `(N, D)` đã biết cho GPT-3, Chinchilla, Llama 3 8B, DeepSeek-V3 (tham số hoạt động) và so sánh loss dự đoán với báo cáo.

## Use It

Bạn khó có khả năng tự huấn luyện một mô hình tiên phong. Nhưng các quy luật mở rộng cho bạn biết:

1. **Fine-tune của bạn có đủ dữ liệu không.** Nếu dữ liệu riêng tác vụ dưới 20 token mỗi tham số của mô hình cơ sở, kỳ vọng bão hòa tại một mức sàn loss nào đó.
2. **Có nên chọn một mô hình cơ sở lớn hơn không.** Nếu bạn đang chi toàn ngân sách vào suy luận, ưu tiên một mô hình nhỏ hơn, được huấn luyện lâu hơn.
3. **Lợi ích giảm dần ở đâu.** Vượt 1000× tối ưu Chinchilla, các thay đổi log-loss trở thành nhiễu.

**Quỹ đạo nghiên cứu năm 2026:**

- **Chế độ bị giới hạn dữ liệu.** Web có số token chất lượng cao hữu hạn (~5–10 nghìn tỷ tiếng Anh sau lọc). Tiền huấn luyện tiên phong đang đến gần mức trần này. Dữ liệu tổng hợp, đa ngôn ngữ, đa phương thức và fine-tuning được mở rộng bằng RLHF là các đòn bẩy tiếp theo.
- **Các thủ thuật nhân tính toán.** Bộ tối ưu Muon, MoE, tuyển chọn dữ liệu tốt hơn — mỗi thứ dịch các hằng số tuyệt đối, không phải tiệm cận.
- **Các quy luật mở rộng cho RL.** Câu hỏi mở. Bằng chứng sớm gợi ý quy luật lũy thừa theo các mẫu RL nhưng với các số mũ rất khác tiền huấn luyện.

## Ship It

Xem `outputs/skill-training-budget-estimator.md`. Skill chọn `(N, D, hours, GPU)` cho một lượt huấn luyện mới với ngân sách tính toán, các ràng buộc triển khai và loss mục tiêu.

## Exercises

1. **Dễ.** Chạy `code/main.py`. In `(N, D)` tối ưu Chinchilla cho các ngân sách tính toán `1e20`, `1e22`, `1e24`. So sánh với bảng mô hình thực.
2. **Trung bình.** Triển khai đường cong loss-theo-tính-toán Hoffmann. Vẽ loss theo `log10(C)` cho tuyến đầu tối ưu tính toán. Xác định khi nào quy luật dự đoán chúng ta cần `>10^28` FLOP cho mức giảm 0.1 cross-entropy tiếp theo.
3. **Khó.** Khớp quy luật mở rộng của riêng bạn trên 5 mô hình tí hon (100K đến 10M tham số) được huấn luyện trên cùng tập dữ liệu. Ước lượng `α` và `E`. Các số mũ của bạn khớp những số đã công bố tốt đến đâu?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Parameters (N) (Tham số) | "Kích thước mô hình" | Số trọng số không phải embedding; quyết định năng lực. |
| Tokens (D) (Token) | "Dữ liệu huấn luyện" | Số token huấn luyện đã thấy; quyết định các tham số được dùng tốt đến đâu. |
| Compute (C) (Tính toán) | "FLOP đã chi" | Xấp xỉ `6 × N × D` cho một transformer tiêu chuẩn. |
| Chinchilla-optimal (Tối ưu Chinchilla) | "D/N ≈ 20" | Tỷ lệ giảm thiểu loss mỗi FLOP tiền huấn luyện. |
| Over-training (Huấn luyện quá mức) | "Vượt Chinchilla" | Chi thêm FLOP huấn luyện để tiết kiệm FLOP suy luận; D/N >> 20. |
| Irreducible loss (Loss không thể giảm) | "Mức sàn" | Số hạng `E` trong quy luật mở rộng; entropy của chính dữ liệu. |
| Emergent capability (Năng lực xuất hiện đột ngột) | "Các bước nhảy đột ngột ở quy mô lớn" | Thường là tạo tác bộ chấm; loss liên tục trơn. |
| Effective compute (Tính toán hiệu dụng) | "Hệ số nhân hiệu quả huấn luyện" | Dữ liệu / bộ tối ưu / kiến trúc tốt hơn nhân mức một FLOP đi được. |

## Further Reading

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) — bài báo quy luật mở rộng đầu tiên; huấn luyện thiếu.
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) — Chinchilla.
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) — sự xuất hiện đột ngột như tạo tác đo lường.
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) — vì sao huấn luyện quá mức của Llama đúng cho khối lượng công việc của nó.
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) — hệ số nhân tính toán 2×.
