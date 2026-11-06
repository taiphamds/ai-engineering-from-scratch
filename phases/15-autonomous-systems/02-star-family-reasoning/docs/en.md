# STaR, V-STaR, Quiet-STaR — Self-Taught Reasoning

> Vòng lặp tự cải thiện nhỏ nhất có thể nằm bên trong phần lý giải. Một mô hình tạo một chuỗi suy nghĩ, giữ những chuỗi đi đến câu trả lời đúng và tinh chỉnh trên chúng. Đó là STaR. V-STaR thêm một bộ xác minh để lựa chọn lúc suy luận tốt hơn. Quiet-STaR đẩy phần lý giải xuống mỗi token. Cả ba đều hoạt động. Không cách nào là phép màu — vòng lặp giữ lại bất kỳ lối tắt nào tình cờ đạt câu trả lời đúng.

**Type:** Learn
**Languages:** Python (stdlib, bootstrap-loop simulator)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon framing)
**Time:** ~60 minutes

## The Problem

Cách trực tiếp để dạy một mô hình suy luận là thu thập các trace suy luận do con người viết. Điều đó tốn kém, chậm và bị giới hạn bởi lượng chain-of-thought chất lượng cao mà con người sẵn lòng viết.

STaR (Self-Taught Reasoner, Zelikman và cộng sự, 2022) hỏi: nếu mô hình viết các phần lý giải riêng và chấm chúng theo các câu trả lời đã biết thì sao? Vòng lặp là:

1. Lấy mẫu một trace suy luận cộng câu trả lời.
2. Nếu câu trả lời cuối cùng đúng, giữ trace.
3. Tinh chỉnh trên các trace được giữ.
4. Lặp lại.

Nó hoạt động. GSM8K và CommonsenseQA đều cải thiện mà không có chú thích con người mới. Nhưng vòng lặp có một thiên lệch tích hợp sẵn: bất kỳ phần lý giải nào tạo câu trả lời đúng đều được giữ lại, bất kể bản thân suy luận có đúng đắn hay không. V-STaR (Hosseini và cộng sự, 2024) vá điều này bằng một bộ xác minh được học; Quiet-STaR (Zelikman và cộng sự, 2024) khái quát hóa ý tưởng thành các phần lý giải nội bộ cho từng token.

## The Concept

### STaR: bootstrap on what worked

Bắt đầu từ một mô hình cơ sở với một chút khả năng suy luận yếu. Trên mỗi bài toán huấn luyện, lấy mẫu một phần lý giải cộng câu trả lời. Nếu câu trả lời khớp nhãn, giữ bộ ba (bài toán, lý giải, câu trả lời). Tinh chỉnh mô hình trên tập được giữ. Lặp lại.

Một biến tấu quan trọng. Nếu mô hình không bao giờ có thể giải đúng một bài toán, vòng lặp không thể học trên nó. STaR thêm **hợp lý hóa**: với các bài toán mô hình thất bại, đưa câu trả lời đúng vào như một gợi ý và prompt lại mô hình để tạo một phần lý giải dẫn đến nó. Các phần lý giải được hợp lý hóa được thêm vào tập huấn luyện.

Kết quả trong bài báo gốc (Zelikman và cộng sự, 2022): một mô hình cơ sở GPT-J cải thiện trên GSM8K từ 5.8% lên 10.7% qua các vòng STaR lặp với hợp lý hóa — khoảng 5 điểm phần trăm tuyệt đối. Trên CommonsenseQA, GPT-J 6B được huấn luyện STaR đạt 72.5%, tương đương một GPT-3 175B được tinh chỉnh (~73%) — một mô hình lớn hơn khoảng 30 lần được huấn luyện trên các phần lý giải chú thích bằng tay.

### V-STaR: train a verifier with DPO

STaR vứt bỏ các phần lý giải sai. Hosseini và cộng sự (2024) quan sát rằng chúng cũng là dữ liệu: mỗi cặp (lý giải, "điều này đúng không") có thể huấn luyện một bộ xác minh. Họ sử dụng Direct Preference Optimization trên cả các lời giải đúng và sai để xây một bộ xếp hạng. Lúc suy luận, lấy mẫu N phần lý giải và chọn lựa chọn hàng đầu của bộ xác minh.

Chênh lệch được báo cáo: +4 đến +17 điểm phần trăm so với các đường cơ sở tự cải thiện trước đó trên GSM8K và MATH, với phần lớn mức tăng đến từ sử dụng bộ xác minh để lựa chọn lúc suy luận thay vì để tinh chỉnh thêm bộ tạo.

### Quiet-STaR: per-token internal rationales

Zelikman và cộng sự (2024) hỏi: nếu mô hình học tạo một phần lý giải nội bộ ngắn ở mỗi vị trí token, không chỉ giữa bài toán và câu trả lời thì sao? Quiet-STaR huấn luyện một mô hình phát ra một "suy nghĩ" ẩn trước mỗi token được dự đoán, rồi trộn dự đoán có nhận biết suy nghĩ với dự đoán đường cơ sở qua một trọng số được học.

Kết quả: Mistral 7B đạt các cải thiện zero-shot tuyệt đối trên GSM8K từ 5.9% lên 10.9% và CommonsenseQA từ 36.3% lên 47.2% mà không tinh chỉnh dành riêng cho tác vụ. Mô hình học "khi nào suy nghĩ" — các token khó nhận các phần lý giải nội bộ dài hơn; các token dễ gần như không nhận gì.

### Why all three share a safety concern

Cả ba phương pháp sử dụng câu trả lời cuối cùng làm tín hiệu gradient. Một phần lý giải đạt câu trả lời đúng qua suy luận sai — khai thác một lối tắt, đoán hoặc sử dụng một mẫu không khái quát hóa — được củng cố tích cực. Trên các bài toán trong phân phối lối tắt hoạt động. Trên các bài toán ngoài phân phối nó hỏng âm thầm.

Bộ xác minh của V-STaR giảm thiểu bằng cách học xếp hạng các phần lý giải, nhưng bộ xác minh được huấn luyện trên cùng tập nhãn. Nó có thể học thích suy luận sai được định dạng tốt hơn sự bất định trung thực. Thiết kế an toàn hơn là kết hợp dữ liệu kiểu STaR với (a) các mô hình phần thưởng giám sát theo quá trình (thưởng các bước trung gian, không chỉ câu trả lời) và (b) đánh giá OOD được giữ riêng phá các lối tắt đơn giản.

### Comparison

| Phương pháp | Tín hiệu huấn luyện | Chi phí suy luận | Lãng phí dữ liệu | Chế độ lỗi đã biết |
|---|---|---|---|---|
| STaR | giữ (lý giải, câu trả lời) nếu đúng | 1 lần | loại bỏ mọi phần lý giải sai | các phần lý giải lối tắt |
| STaR + hợp lý hóa | ở trên + các lần thử lại được gợi ý câu trả lời đúng | 1 lần | ít hơn | các phần lý giải được hợp lý hóa có thể không hợp lý |
| V-STaR | STaR + bộ xác minh DPO từ cả hai lớp | N lần (best-of-N) | tối thiểu | bộ xác minh có thể củng cố sự sai tự tin |
| Quiet-STaR | lý giải cho từng token + trọng số trộn | 1.5-3 lần | tối thiểu | vẫn là gradient được điều kiện hóa theo câu trả lời |

### Where this sits in the 2026 stack

STaR đã cũ. Nhưng mẫu tái xuất hiện khắp nơi trong 2025-2026. RL trên các bài toán có thể xác minh (DeepSeek-R1, Kimi-k1.5, o1) là tín hiệu gradient được điều kiện hóa theo câu trả lời của STaR, được mở rộng. Các mô hình phần thưởng quá trình (Lightman và cộng sự, 2023; "Let's verify step by step" của OpenAI) là lựa chọn giám sát theo quá trình. AlphaEvolve (Bài 3) là STaR cho mã, với một bộ đánh giá chương trình thay cho một nhãn. Darwin Godel Machine (Bài 4) là STaR cho chính khung agent.

Hiểu STaR làm tất cả những thứ này sáng tỏ. Đó là vòng lặp tự cải thiện khả dụng tối thiểu.

```figure
reflection-loop
```

## Use It

`code/main.py` chạy một vòng lặp STaR mô phỏng trên một tác vụ số học đơn giản. Bạn có thể quan sát:

- Cách độ chính xác tăng qua các vòng bootstrap.
- Cách các lối tắt lẻn vào: bộ mô phỏng bao gồm một lớp lý giải "lười" đạt câu trả lời đúng 40% số lần nhưng khái quát hóa kém. Quan sát liệu STaR có giữ chúng không.
- Cách một bộ xác minh (kiểu V-STaR) giúp lúc suy luận nhưng không thể cắt tỉa hoàn toàn các lối tắt được đưa vào trong huấn luyện.

## Ship It

`outputs/skill-star-loop-reviewer.md` giúp bạn kiểm toán một pipeline suy luận tự học được đề xuất trước khi bạn huấn luyện trên nó.

## Exercises

1. Chạy bộ mô phỏng. Đặt tần suất lối tắt thành không, rồi thành 0.4. Độ chính xác cuối cùng khác nhau bao nhiêu giữa hai lần chạy, dù cả hai đạt >90% trên phân phối huấn luyện?

2. Thêm một kiểm thử OOD được giữ riêng vào bộ mô phỏng. Lấy các bài toán từ một phân phối khác và đánh giá mô hình đã bootstrap trên cả các tập trong phân phối và OOD. Định lượng khoảng cách.

3. Đọc Phần 3 bài báo Quiet-STaR (arXiv:2403.09629). Giải thích token "kết thúc suy nghĩ" và đầu trọng số trộn, mỗi thứ trong ba câu.

4. So sánh bộ lọc giữ nếu đúng của STaR với một lựa chọn giám sát theo quá trình thưởng mỗi bước lý giải độc lập. Nhận diện khác biệt chi phí gán nhãn và khác biệt chất lượng có thể có.

5. Thiết kế một đánh giá sẽ bắt các phần lý giải lối tắt trong một mô hình được triển khai. Nó không cần hoàn hảo — nó phải phá các lối tắt đơn giản nhất mà một vòng lặp STaR sẽ củng cố.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| STaR | "Bộ suy luận tự học" | Tinh chỉnh trên các phần lý giải do mô hình tạo đạt các câu trả lời đúng; lặp lại |
| Rationalization (Hợp lý hóa) | "Thử lại có gợi ý" | Đưa câu trả lời đúng vào và prompt lại để có một phần lý giải trên các bài toán mà mô hình cơ sở thất bại |
| V-STaR | "STaR bộ xác minh" | Huấn luyện DPO một bộ xác minh trên cả các phần lý giải đúng và sai, sử dụng nó để lựa chọn lúc suy luận |
| Quiet-STaR | "Các phần lý giải cho từng token" | Tạo các suy nghĩ ẩn ở mỗi vị trí token; trộn với dự đoán đường cơ sở |
| Answer-conditioned gradient (Gradient được điều kiện hóa theo câu trả lời) | "Tín hiệu dựa trên kết quả" | Vòng lặp huấn luyện thưởng các câu trả lời cuối cùng, không phải các bước suy luận |
| Process reward model (Mô hình phần thưởng quá trình) | "Bộ xác minh cấp bước" | Mô hình phần thưởng được huấn luyện trên tính đúng đắn cho từng bước, không phải kết quả — đối lập với STaR |
| Shortcut rationale (Lý giải lối tắt) | "Câu trả lời đúng, suy luận sai" | Một phần lý giải đạt nhãn qua một mẫu không khái quát hóa; STaR giữ những phần này |

## Further Reading

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) — bài báo gốc.
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) — thêm một bộ xác minh DPO cho lựa chọn lúc suy luận.
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) — các phần lý giải nội bộ cho từng token.
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) — các mô hình phần thưởng quá trình, tín hiệu gradient thay thế.
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — RL trên các tác vụ có thể xác minh, STaR được mở rộng đến huấn luyện tiên tiến nhất.
