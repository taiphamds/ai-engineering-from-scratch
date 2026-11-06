# Multi-Token Prediction (MTP)

> Mọi LLM tự hồi quy từ GPT-2 đến Llama 3 đều huấn luyện với một loss cho mỗi vị trí: dự đoán token tiếp theo. DeepSeek-V3 thêm một loss thứ hai cho mỗi vị trí: dự đoán token sau token đó. 14B tham số bổ sung (trên mô hình 671B) được chưng cất trở lại mô hình chính thông qua luồng gradient, và các head MTP đã huấn luyện được tái sử dụng khi suy luận làm bộ dự thảo speculative decoding với tỷ lệ chấp nhận 80%+. Thông lượng sinh 1.8× có được mà không tốn thêm chi phí. Bài học này xây dựng mô-đun MTP tuần tự từ báo cáo kỹ thuật DeepSeek, tính loss và bố trí tham số của head dùng chung, đồng thời giải thích tại sao MTP giữ chuỗi nhân quả trong khi MTP song song ban đầu của Gloeckle và cộng sự phá vỡ nó.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04 (pre-training a mini GPT), Phase 10 · 15 (speculative decoding)
**Time:** ~60 minutes

## Learning Objectives

- Phát biểu mục tiêu huấn luyện MTP và suy ra loss kết hợp trên các độ sâu dự đoán.
- Giải thích sự khác biệt giữa các head MTP song song của Gloeckle và cộng sự (2024) và các mô-đun MTP tuần tự của DeepSeek-V3, và tại sao thiết kế tuần tự bảo toàn chuỗi nhân quả.
- Tính chi phí tham số và bộ nhớ bổ sung khi thêm các mô-đun MTP vào một lượt tiền huấn luyện.
- Triển khai một mô-đun MTP từ đầu: embedding dùng chung, khối transformer cho từng độ sâu, phép chiếu và head đầu ra dùng chung.

## The Problem

Dự đoán token tiếp theo là mục tiêu huấn luyện LLM tiêu chuẩn. Mỗi trạng thái ẩn được giám sát để dự đoán đúng một thứ: token ngay sau nó. Đó là một tín hiệu yếu đến ngạc nhiên. Phần lớn thông tin trong một chuỗi trải rộng ngoài một token — cấu trúc, tính mạch lạc, tính đúng đắn về sự kiện, luồng số học. Mô hình phải học những điều đó bằng cách tích lũy nhiều tín hiệu một token trên hàng nghìn tỷ token.

MTP đặt câu hỏi: điều gì xảy ra nếu mỗi trạng thái ẩn được giám sát để dự đoán nhiều token tương lai cùng lúc? Gloeckle và cộng sự (Meta, 2024) cho thấy điều này hữu ích. Triển khai của họ đặt một số head đầu ra độc lập trên backbone, mỗi head dự đoán một độ lệch khác nhau. Song song, đơn giản, nhưng các head thấy cùng một trạng thái ẩn mà không có bất kỳ sự tinh chỉnh phân cấp nào — và các dự đoán không nối chuỗi theo quan hệ nhân quả, nên không thể dùng chúng cho speculative decoding.

DeepSeek-V3 (tháng 12 năm 2024) thiết kế lại MTP thành các mô-đun tuần tự giữ chuỗi nhân quả ở mỗi độ sâu dự đoán. Mô hình dự đoán `t+1` từ `h_i^(0)`, rồi dự đoán `t+2` từ trạng thái ẩn mới `h_i^(1)` kết hợp `h_i^(0)` với embedding `E(t+1)`, và cứ thế. Mỗi độ sâu là một khối transformer nhỏ riêng. Embedding dùng chung và head đầu ra dùng chung giữ chi phí tham số bổ sung ở mức khiêm tốn. Ở quy mô DeepSeek-V3, 14B tham số bổ sung trên các mô-đun MTP ngoài 671B trọng số mô hình chính. Chi phí bổ sung 2% đó mang lại tín hiệu huấn luyện dày đặc hơn VÀ một bản dự thảo speculative decoding có sẵn khi suy luận.

Bài học này xây dựng một mô-đun MTP và loss D độ sâu từ đầu. Phần toán gọn gàng. Phần triển khai dài 150 dòng.

## The Concept

### The sequential MTP recipe

DeepSeek-V3 thêm `D` mô-đun MTP trên mô hình chính. Mỗi mô-đun `k` (với `k = 1..D`) dự đoán token ở độ sâu `k` — tức là `t_{i+k}` với tiền tố đến hết vị trí `i`.

Mô-đun `k` gồm:

- Một khối transformer `T_k` với attention và MLP riêng.
- Một ma trận chiếu `M_k` kết hợp trạng thái ẩn ở độ sâu trước với embedding của token nhãn thực ở độ sâu tiếp theo.
- Embedding dùng chung `E` (giống mô hình chính).
- Head đầu ra dùng chung `Out` (giống mô hình chính).

Khi huấn luyện, với một tiền tố đến hết vị trí `i`, trạng thái ẩn ở từng độ sâu là:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

Dự đoán ở từng độ sâu là:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

Loss ở từng độ sâu là cross-entropy so với nhãn thực `t_{i+k}`:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

Loss kết hợp trên các độ sâu:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda` là một hệ số trọng số nhỏ — DeepSeek-V3 dùng 0.3 trong 10% đầu quá trình huấn luyện và 0.1 sau đó. Tổng loss huấn luyện là `L_main + L_MTP`.

### Why sequential, not parallel

MTP song song ban đầu của Gloeckle có D head đầu ra, mỗi head được áp dụng trực tiếp lên `h_i^(0)`. Mỗi head dự đoán `t_{i+k}` từ cùng trạng thái ẩn của backbone. Điều đó huấn luyện tốt, nhưng các dự đoán không được điều kiện hóa theo nhau. Bạn không thể dùng đầu ra của `head_1` để hỗ trợ `head_2` — các head hoạt động song song.

Thiết kế tuần tự của DeepSeek-V3 xây dựng `h_i^(k)` từ `h_i^(k-1)` cộng embedding token tiếp theo thực tế `E(t_{i+k})`. Điều đó bảo toàn chuỗi nhân quả: để dự đoán `t_{i+k+1}`, mô-đun ở độ sâu `k+1` thấy những gì có tại `t_{i+k}`. Về cấu trúc, điều này giống hệt cách một bộ giải mã tự hồi quy tiêu thụ đầu ra của chính nó — khiến các mô-đun MTP có thể được dùng trực tiếp làm bộ dự thảo speculative decoding.

Khi suy luận: đưa `h_i^(k-1)` và `t_{i+k}` đã dự thảo vào mô-đun `k+1`, nhận dự đoán cho `t_{i+k+1}`. Lặp lại. Đó chính xác là một bản dự thảo kiểu EAGLE, dùng mô-đun MTP đã huấn luyện làm mạng dự thảo. DeepSeek-V3 báo cáo tỷ lệ chấp nhận 80%+ trên mô-đun MTP đầu tiên và tăng tốc ~1.8×.

### Parameter accounting

Với một mô hình có kích thước ẩn `h` và từ vựng `V`:

- Mô hình chính: hàng tỷ tham số, cộng một head đầu ra kích thước `V * h`.
- Head đầu ra dùng chung: tái sử dụng head của mô hình chính. Không có tham số bổ sung.
- Embedding dùng chung: tái sử dụng embedding của mô hình chính. Không có tham số bổ sung.
- Mỗi mô-đun MTP:
  - Phép chiếu `M_k`: `(2h) * h = 2h^2`.
  - Khối transformer `T_k`: attention (`4h^2` với MHA) cộng MLP (thường là `8h^2` với SwiGLU có tỷ lệ 8/3). Khoảng `12h^2` mỗi khối.

Tổng bổ sung cho mỗi mô-đun: `~14h^2`. Với `h = 7168` của DeepSeek-V3, D = 1 mô-đun: `~14 * 7168^2 = ~720M` tham số trên lý thuyết. DeepSeek-V3 báo cáo 14B — sự khác biệt chủ yếu do các lớp expert cũng là MoE trong mô-đun MTP.

### The speculative-decoding payoff

Trong tiền huấn luyện, các mô-đun MTP làm chậm huấn luyện khoảng 10% (thêm tính toán forward, thêm loss). Lợi ích có hai phần:

1. Tín hiệu huấn luyện dày đặc hơn. Mỗi trạng thái ẩn thấy D+1 mục tiêu giám sát. Hiệu quả đo được trên MMLU, GSM8K, MATH, HumanEval: cải thiện nhất quán vài điểm phần trăm trong các thí nghiệm loại bỏ thành phần của DeepSeek-V3.

2. Bản dự thảo speculative decoding miễn phí khi suy luận. Mô-đun MTP đã được huấn luyện để dự đoán vài token tiếp theo. Được tái sử dụng làm mạng dự thảo, nó đem lại tỷ lệ chấp nhận 80%+. Ở mức đó, spec decoding với N=3 hoặc N=5 cho thông lượng 1.8×. Chi phí 10% thời gian huấn luyện được hoàn lại ngay lần đầu bạn chạy suy luận.

### Relation to EAGLE

EAGLE huấn luyện một mô hình dự thảo nhỏ RIÊNG BIỆT sau tiền huấn luyện. MTP tích hợp bản dự thảo vào tiền huấn luyện. Hai cách tiếp cận hội tụ về tỷ lệ chấp nhận tương tự nhưng qua các quy trình khác nhau:

| Khía cạnh | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| Thời điểm huấn luyện | Sau tiền huấn luyện | Trong tiền huấn luyện |
| Tương thích ngược với trọng số hiện có | Có | Không (cần huấn luyện lại) |
| Tham số dự thảo | 1-2 lớp transformer | 1 khối transformer + phép chiếu |
| Tỷ lệ chấp nhận | 0.88-0.92 | 0.80+ ở độ sâu 1 |
| Lợi ích ngoài tăng tốc | Chỉ speculative decoding | Tín hiệu huấn luyện dày đặc hơn + tăng tốc |

```figure
multi-token-predict
```

## Build It

`code/main.py` xây dựng một mô-đun MTP từ đầu đến cuối: embedding dùng chung, phép chiếu, khối transformer, head đầu ra dùng chung. Sau đó nó tính loss cross-entropy ở từng độ sâu trên một chuỗi tổng hợp ngắn và in số tham số theo thành phần. Một từ vựng minh họa gồm 32 token giữ cho các con số dễ đọc.

### Step 1: shared embedding table

Một bảng `vocab_size x hidden` duy nhất được dùng bởi mô hình chính VÀ bởi mọi mô-đun MTP ở mọi độ sâu. Không phải bản sao thứ hai — đúng cùng một tensor.

### Step 2: the per-depth combination

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

DeepSeek-V3 thực tế nối hai vector đã qua RMSNorm thành `[2h]` và chiếu bằng ma trận `h x 2h`. Bản minh họa dùng phép cộng vector để ngắn gọn với stdlib.

### Step 3: the transformer block at depth k

Self-attention cộng MLP. Trong bản minh họa, một khối linear attention một lớp và một MLP SwiGLU giữ cho cấu trúc dễ thấy mà không cần numpy.

### Step 4: the shared output head

Tái sử dụng phép chiếu đầu ra của mô hình chính. Logit trên từ vựng.

### Step 5: per-depth loss

Cross-entropy của softmax(logits) so với token nhãn thực ở độ lệch `k`. Tổng hợp trên các độ sâu với hệ số tỷ lệ `lambda / D`.

### Step 6: parameter accounting

In tổng số tham số, số tham số dùng chung (embedding, head) và số tham số bổ sung của từng mô-đun. Hiển thị tỷ lệ phần bổ sung MTP so với kích thước mô hình chính.

## Use It

MTP được tích hợp vào DeepSeek-V3 (tháng 12 năm 2024) và dòng DeepSeek-R1. Khi suy luận:

- Ngăn xếp phục vụ của chính DeepSeek sử dụng các mô-đun MTP làm bộ giải mã suy đoán ngay từ đầu.
- vLLM và SGLang có các cách tích hợp cho MTP của DeepSeek-V3 tính đến tháng 4 năm 2026.
- Hướng dẫn ROCm SGLang của AMD trình bày một cấu hình speculative decoding MTP cụ thể với mức tăng tốc đo được 1.8× trên checkpoint V3.

Khi nào dùng MTP trong một lượt tiền huấn luyện mới:

- Bạn kiểm soát toàn bộ quy trình tiền huấn luyện và muốn tích lũy tín hiệu huấn luyện dày đặc hơn.
- Bạn biết mình sẽ phục vụ mô hình ở quy mô lớn và muốn có speculative decoding miễn phí.
- Kích thước ẩn của bạn ít nhất là 4096. Ở quy mô 1B, chi phí bổ sung gây hại nhiều hơn mức lợi ích giúp ích.

Khi nào không nên:

- Fine-tuning một mô hình dense đã tiền huấn luyện hiện có. Mô-đun MTP chưa được huấn luyện.
- Các mô hình nghiên cứu mà bạn muốn một baseline rõ ràng để so sánh. MTP thay đổi kiến trúc.

## Ship It

Bài học này tạo ra `outputs/skill-mtp-planner.md`. Với một đặc tả lượt tiền huấn luyện (kích thước mô hình, dữ liệu, tính toán), nó trả về kế hoạch tích hợp MTP: số độ sâu D, lịch `lambda`, chi phí bộ nhớ bổ sung và cách kết nối speculative decoding khi suy luận.

## Exercises

1. Chạy `code/main.py`. Cho thấy loss ở từng độ sâu giảm đơn điệu khi tín hiệu tổng hợp mạnh lên. Sửa dữ liệu tổng hợp để dùng một mẫu cố định và xác minh loss ở cả độ sâu 1 và độ sâu 2 hội tụ.

2. Tính chi phí tham số bổ sung cho mô hình dense 70B (kích thước ẩn 8192, 80 lớp) với D=1 mô-đun MTP. So sánh với chi phí bổ sung 14B được DeepSeek-V3 báo cáo. Giải thích tại sao con số của DeepSeek cao hơn: khối transformer MTP kế thừa cùng cấu trúc MoE, làm tăng số tham số của mỗi mô-đun.

3. Triển khai D=2 trong bản minh họa: thêm mô-đun MTP thứ hai nhận h^(1) và dự đoán `t_{i+2}`. Xác minh loss kết hợp và việc tính tham số khớp với các phương trình 19-21 trong bài báo DeepSeek.

4. Chuyển bản minh họa sang MTP song song (kiểu Gloeckle): thêm D head đầu ra trên trạng thái ẩn chính, mỗi head dự đoán một độ lệch khác nhau. Đo cách các loss ở từng độ sâu so sánh với phiên bản tuần tự trên cùng tín hiệu tổng hợp. Phiên bản tuần tự phải tạo loss độ sâu k thấp hơn với k > 1 vì nó điều kiện hóa theo các dự đoán trung gian.

5. Dùng mô-đun MTP đã huấn luyện làm bản dự thảo kiểu EAGLE: gọi mô-đun k để đề xuất `t_{i+k}` khi suy luận. Đo tỷ lệ chấp nhận các token dự thảo này so với dự đoán của mô hình chính trên một chuỗi giữ riêng. Nếu bạn đạt 50%+ trên bản minh họa, bạn đã tái hiện thuộc tính thực nghiệm MTP làm bản dự thảo.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| MTP module (Mô-đun MTP) | "Khối loss bổ sung" | Một khối transformer nhỏ cộng phép chiếu dự đoán một token đi trước mô hình chính `k` vị trí |
| Prediction depth (Độ sâu dự đoán) | "Độ lệch nào" | Số nguyên `k` sao cho mô-đun `k` dự đoán `t_{i+k}` từ tiền tố đến hết vị trí `i` |
| Parallel MTP (MTP song song) | "Kiểu Gloeckle" | D head độc lập trên cùng trạng thái ẩn của backbone, không có chuỗi điều kiện |
| Sequential MTP (MTP tuần tự) | "Kiểu DeepSeek-V3" | Mỗi mô-đun điều kiện hóa theo trạng thái ẩn của độ sâu trước cộng embedding của token tiếp theo; bảo toàn chuỗi nhân quả |
| Shared output head (Head đầu ra dùng chung) | "Tái sử dụng head chính" | Các mô-đun MTP gọi LM head của mô hình chính, không phải một phép chiếu đầu ra riêng |
| Shared embedding (Embedding dùng chung) | "Tái sử dụng bảng chính" | Cùng một bảng embedding từ vựng được dùng ở mọi nơi; không có tham số trùng lặp |
| Projection matrix M_k (Ma trận chiếu M_k) | "Kết hợp trạng thái ẩn + token tiếp theo" | Một lớp tuyến tính `h x 2h` gộp trạng thái ẩn trước và embedding token mục tiêu vào đầu vào của độ sâu tiếp theo |
| Joint loss L_MTP (Loss kết hợp L_MTP) | "Các loss bổ sung được lấy trung bình" | Trung bình cộng của các loss cross-entropy ở từng độ sâu, được nhân tỷ lệ `lambda` |
| Acceptance rate at depth 1 (Tỷ lệ chấp nhận ở độ sâu 1) | "Tần suất bản dự thảo MTP đúng" | Tỷ lệ dự đoán top-1 của mô-đun MTP D=1 bằng dự đoán top-1 của mô hình chính; 80%+ trên DeepSeek-V3 |
| Lambda weighting (Trọng số lambda) | "Mức quan trọng của loss bổ sung" | Hệ số tỷ lệ ở từng độ sâu; 0.3 khi bắt đầu huấn luyện, 0.1 về sau trên DeepSeek-V3 |

## Further Reading

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — mô tả đầy đủ về MTP tuần tự (Mục 2.2), gồm các phương trình loss kết hợp và mức tăng tốc 1.8× khi suy luận
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) — baseline MTP song song mà thiết kế của DeepSeek cải thiện
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) — tổng cộng 685B (671B chính + 14B MTP), ghi chú triển khai
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) — khuôn khổ speculative decoding mà MTP phù hợp vào
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) — kiến trúc dự thảo năm 2025 của EAGLE, đối tác mà MTP cạnh tranh với
