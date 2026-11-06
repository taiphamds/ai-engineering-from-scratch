# Open-Weight VLM Recipes: What Actually Matters

> Tài liệu VLM trọng số mở 2024-2026 là rừng bảng thí nghiệm loại bỏ thành phần. MM1 Apple kiểm thử 13 tổ hợp encoder ảnh, connector và hỗn hợp dữ liệu. Molmo Allen AI chứng minh chú thích con người chi tiết thắng chưng cất GPT-4V. Cambrian-1 chạy 20+ so sánh encoder. Idefics2 hình thức hóa không gian thiết kế năm trục. Prismatic VLMs so 27 công thức huấn luyện trên benchmark được kiểm soát. Từ mọi nhiễu đó, tập nhỏ kết quả giữ đúng qua các bài báo: encoder ảnh quan trọng hơn kiến trúc connector, hỗn hợp dữ liệu quan trọng hơn cả hai và chú thích con người chi tiết thắng dữ liệu tổng hợp chưng cất. Bài học này đọc các bảng để bạn không phải đọc.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 minutes

## Learning Objectives

- Nêu tên không gian thiết kế VLM năm trục: encoder ảnh, connector, LLM, hỗn hợp dữ liệu, lịch độ phân giải.
- Đọc bảng thí nghiệm loại bỏ thành phần MM1 / Idefics2 / Cambrian-1 và dự đoán núm nào thay đổi benchmark cho trước.
- Chọn công thức (encoder, connector, dữ liệu, độ phân giải) cho VLM mới với ngân sách tính toán và hỗn hợp tác vụ cho trước.
- Giải thích tại sao chú thích con người chi tiết thắng chưng cất GPT-4V ở cùng số token.

## The Problem

Hàng trăm VLM trọng số mở tồn tại. Phần lớn khoảng cách giữa "tốt" và "tiên tiến nhất" không phải kiến trúc. Đó là dữ liệu, lịch độ phân giải và lựa chọn encoder. Biết núm nào xoay trước khi mô hình kém hiệu năng giúp tránh sai lầm 5 triệu GPU-giờ.

Làn sóng 2023 (LLaVA-1.5, InstructBLIP, MiniGPT-4) chạy trên tiền huấn luyện cặp chú thích + LLaVA-Instruct-150k. Baseline tốt. Đạt trần khoảng MMMU 35%.

Làn sóng 2024 (MM1, Idefics2, Molmo, Cambrian-1, Prismatic VLMs) chạy thí nghiệm loại bỏ thành phần toàn diện. Kết quả đáng ngạc nhiên và thực tế.

## The Concept

### The five-axis design space

Idefics2 (Laurençon và cộng sự, 2024) đặt tên các trục:

1. Encoder ảnh. CLIP ViT-L/14, SigLIP SO400m/14, DINOv2 ViT-g/14, InternViT-6B. Encoder khác kích thước patch, độ phân giải và mục tiêu tiền huấn luyện.
2. Connector. MLP (2-4 lớp), Q-Former (32 query + cross-attn), Perceiver Resampler (64 query), C-Abstractor (tích chập + pooling song tuyến tính).
3. Mô hình ngôn ngữ. Llama-3 8B / 70B, Mistral 7B, Phi-3, Gemma-2, Qwen2.5. Kích thước LLM là chi phí tham số chi phối.
4. Dữ liệu huấn luyện. Cặp chú thích (CC3M, LAION), xen kẽ (OBELICS, MMC4), chỉ dẫn (LLaVA-Instruct, ShareGPT4V, PixMo, Cauldron).
5. Lịch độ phân giải. Cố định 224/336/448, AnyRes, động nguyên bản. Tăng dần trong huấn luyện hoặc hằng số.

Mọi VLM sản xuất lựa chọn trên từng trục. Phần lớn phương sai điểm MMMU được giải thích bởi trục 1, 4 và 5 — không phải connector bạn chọn.

### Axis 1: encoder > connector

Mục 3.2 MM1 cho thấy: đổi từ CLIP ViT-L/14 sang SigLIP SO400m/14 thêm 3+ điểm MMMU. Đổi connector từ MLP sang Perceiver Resampler thêm dưới 1 điểm. Idefics2 tái hiện: SigLIP > CLIP, Q-Former ≈ MLP ≈ Perceiver ở cùng số token.

"Cambrian Vision Encoders Match-Up" của Cambrian-1 (Tong và cộng sự, 2024) chạy 20+ encoder trên benchmark tập trung thị giác (CV-Bench). Đầu bảng là hỗn hợp DINOv2 và SigLIP; CLIP ở giữa; ImageBind và ViT-MAE thấp hơn. Khoảng cách CLIP ViT-L đến DINOv2 ViT-g/14 là ~5-7 điểm trên CV-Bench.

Encoder mặc định năm 2026 cho VLM mở là SigLIP 2 SO400m/14 cho đặc trưng ngữ nghĩa + dày đặc, đôi khi nối với đặc trưng DINOv2 ViT-g/14 ("Spatial Vision Aggregator" Cambrian làm vậy).

### Axis 2: connector design is a wash

MM1, Idefics2, Prismatic và MM-Interleaved đều cùng kết luận: ở số token thị giác cố định, kiến trúc connector hầu như không quan trọng. MLP 2 lớp trên patch pooling trung bình có hiệu năng trong khoảng 1 điểm so với Q-Former 32 query ở cùng ngân sách token.

Điều quan trọng là số token. Nhiều token thị giác hơn = nhiều tính toán LLM hơn = hiệu năng tốt hơn đến một điểm, rồi lợi ích giảm dần. 64 token mỗi ảnh quá ít cho OCR. 576-1024 token là điểm tối ưu cho hầu hết VLM mở. 2048+ chỉ giúp tài liệu và biểu đồ.

Q-Former so với MLP là câu hỏi chi phí, không phải chất lượng: Q-Former giới hạn token ở 32-64 bất kể độ phân giải ảnh; MLP phát mọi token patch. Với đầu vào độ phân giải cao, Q-Former tiết kiệm ngữ cảnh LLM; với độ phân giải thấp, khác biệt là nhiễu.

### Axis 3: LLM size sets the ceiling

Tăng gấp đôi LLM từ 7B lên 13B thêm đáng tin cậy 2-4 điểm MMMU qua mọi bài báo VLM. Ở 70B bạn bão hòa hầu hết benchmark. Trần suy luận đa phương thức VLM là trần suy luận văn bản LLM — encoder thị giác chỉ cung cấp đầu vào, không suy luận thay.

Đây là lý do Qwen2.5-VL-72B và Claude Opus 4.7 áp đảo MMMU-Pro và ScreenSpot-Pro: bộ não ngôn ngữ khổng lồ. VLM 7B không thể thay VLM 70B qua thiết kế connector khéo.

### Axis 4: data — detailed human captions beat distillation

Molmo + PixMo (Deitke và cộng sự, 2024) là kết quả 2024 mọi người nên đọc. Allen AI cho người chú giải mô tả ảnh trong lượt chuyển giọng nói thành văn bản dày đặc 1-3 phút, cho 712K ảnh chú thích dày đặc. Không chưng cất GPT-4V ở bất kỳ đâu trong dữ liệu huấn luyện.

Molmo-72B vượt Llama-3.2-90B-Vision trên 11 trong 11 benchmark. Chênh lệch không phải kiến trúc — đó là chất lượng chú thích. Chú thích con người chi tiết chứa thông tin mỗi ảnh nhiều hơn 5-10x chú thích web ngắn và giữ căn cứ sự kiện nơi chưng cất GPT-4V ảo giác.

ShareGPT4V (Chen và cộng sự, 2023) và Cauldron (Idefics2) theo cùng cách làm với chú thích trộn con người + GPT-4V. Xu hướng rõ: cho tuyến đầu năm 2026, mật độ chú thích > số lượng chú thích > tiện lợi chưng cất.

### Axis 5: resolution and its schedule

Thí nghiệm loại bỏ thành phần Idefics2: 384 -> 448 thêm 1-2 điểm. 448 -> 980 với chia ảnh (AnyRes) thêm 3-5 nữa trên benchmark OCR. Huấn luyện độ phân giải phẳng đạt bình nguyên ở độ chính xác trung bình; tăng dần độ phân giải (bắt đầu 224, kết thúc 448 hoặc nguyên bản) huấn luyện nhanh hơn và kết thúc cao hơn.

Cambrian-1 chạy đánh đổi độ phân giải với token: ở tính toán cố định, có thể nhiều token ở độ phân giải thấp hơn hoặc ít token ở độ phân giải cao hơn. Độ phân giải cao hơn thắng OCR; thấp hơn-nhiều token hơn thắng hiểu cảnh tổng quát.

Công thức sản xuất năm 2026: huấn luyện Giai đoạn 1 ở 384 cố định, Giai đoạn 2 với độ phân giải động đến 1280 cho tác vụ nặng OCR.

### The Prismatic controlled comparison

Prismatic VLMs (Karamcheti và cộng sự, 2024) là bài báo kiểm soát mọi trục. Cùng LLM 13B, cùng dữ liệu chỉ dẫn, cùng đánh giá — mỗi lần chỉ một trục đổi. Kết quả:

- Số token thị giác mỗi ảnh giải thích ~60% phương sai.
- Lựa chọn encoder giải thích ~20%.
- Kiến trúc connector giải thích ~5%.
- Mọi thứ khác (hỗn hợp dữ liệu, scheduler, LR) ~15% còn lại.

Đây là phân rã sơ bộ, nhưng là câu trả lời rõ nhất cho "nên thử loại bỏ thành phần nào trước" trong tài liệu.

### A picker for 2026

Với bằng chứng, công thức VLM mở mặc định cho dự án mới năm 2026:

- Encoder: SigLIP 2 SO400m/14 ở độ phân giải nguyên bản với NaFlex, nối với DINOv2 ViT-g/14 cho đặc trưng dày đặc nếu cần phân đoạn/grounding.
- Connector: MLP 2 lớp trên token patch. Bỏ Q-Former trừ khi bị ràng buộc token.
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2, 7B cho chi phí, 70B cho chất lượng, chọn theo độ trễ đích.
- Dữ liệu: PixMo + ShareGPT4V + Cauldron, bổ sung dữ liệu chỉ dẫn riêng tác vụ.
- Độ phân giải: động (tối thiểu 256, tối đa 1280 pixel mỗi cạnh dài).
- Lịch: Giai đoạn 1 căn chỉnh (chỉ projector), Giai đoạn 2 fine-tune toàn phần, Giai đoạn 3 fine-tune riêng tác vụ.

Mọi mặc định đó truy về thí nghiệm loại bỏ thành phần đo được trong bài báo trích cuối bài học.

```figure
l5-vlm-recipe-knobs
```

## Use It

`code/main.py` là bộ phân tích bảng thí nghiệm loại bỏ thành phần và chọn công thức. Nó mã hóa bảng MM1 và Idefics2 (cô đọng) và cho truy vấn:

- "Với ngân sách X và tác vụ Y, công thức nào thắng?"
- "Nếu đổi SigLIP lấy CLIP trên Llama 7B, chênh lệch MMMU kỳ vọng là gì?"
- "Nên thử loại bỏ trục nào trước để có câu trả lời độ tin cậy 80%?"

Đầu ra là danh sách công thức xếp hạng với chênh lệch benchmark kỳ vọng và khuyến nghị "thử loại bỏ thành phần trước."

## Ship It

Bài học này tạo `outputs/skill-vlm-recipe-picker.md`. Với hỗn hợp tác vụ đích, ngân sách tính toán và mục tiêu độ trễ, nó phát công thức đầy đủ (encoder, connector, LLM, hỗn hợp dữ liệu, lịch độ phân giải) kèm trích dẫn thí nghiệm loại bỏ thành phần lý giải từng lựa chọn. Ngăn kỹ sư tái phát minh bảng Idefics2 mỗi lần bắt đầu dự án VLM mới.

## Exercises

1. Đọc Mục 3.2 MM1. Với LLM 2B cố định ở ngân sách 50M ảnh, encoder nào thắng? Câu trả lời có đảo ở LLM 13B không? Tại sao?

2. Cambrian-1 thấy nối DINOv2 + SigLIP vượt từng loại riêng trên benchmark tập trung thị giác nhưng không thêm tín hiệu MMMU. Dự đoán benchmark nào tăng và loại nào giữ phẳng.

3. Đích là tác tử UI di động trên LLM 2B. Chọn encoder, connector, độ phân giải và hỗn hợp dữ liệu. Lý giải từng lựa chọn bằng bảng thí nghiệm loại bỏ thành phần cụ thể.

4. Molmo cung cấp mô hình 4B và 72B. Bản 4B cạnh tranh VLM 7B đóng; bản 72B vượt Llama-3.2-90B-Vision trên 11/11 benchmark. Điều đó cho biết gì về giả thuyết bình nguyên kích thước LLM?

5. Thiết kế bảng thí nghiệm loại bỏ thành phần tách chất lượng hỗn hợp dữ liệu khỏi chất lượng encoder trên VLM 7B. Tối thiểu bao nhiêu lượt huấn luyện? Đề xuất bốn thiết lập trục.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Ablation (Thí nghiệm loại bỏ thành phần) | "Xoay một núm" | Huấn luyện nhiều lượt khác đúng một trục không gian thiết kế, giữ mọi thứ khác cố định |
| Connector (Bộ kết nối) | "Cầu nối" / "projector" | Mô-đun có thể huấn luyện ánh xạ đầu ra encoder thị giác vào không gian token LLM (MLP, Q-Former, Perceiver) |
| Detailed human caption (Chú thích con người chi tiết) | "Chú thích dày đặc" | Mô tả nhiều câu do con người viết (thường 80-300 token) phong phú hơn văn bản thay thế web |
| Distillation (Chưng cất) | "Chú thích GPT-4V" | Dữ liệu huấn luyện do VLM độc quyền mạnh hơn sinh; tiện nhưng dễ kế thừa ảo giác |
| AnyRes / dynamic res (AnyRes / độ phân giải động) | "Đường độ phân giải cao" | Chiến lược đưa ảnh lớn hơn độ phân giải nguyên bản encoder qua chia ô hoặc M-RoPE |
| Resolution ramp (Tăng dần độ phân giải) | "Giáo trình" | Lịch huấn luyện bắt đầu độ phân giải thấp rồi tăng, tăng tốc học căn chỉnh |
| Vision-centric bench (Benchmark tập trung thị giác) | "CV-Bench / BLINK" | Đánh giá nhấn mạnh tri giác thị giác chi tiết thay vì suy luận nặng ngôn ngữ |
| PixMo | "Dữ liệu Molmo" | Bộ dữ liệu 712K ảnh chú thích dày đặc của Allen AI; lời nói con người chép thành chú thích dày đặc |

## Further Reading

- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
