# EAGLE-3 Speculative Decoding in Production

> Giải mã suy đoán ghép một mô hình nháp nhanh với mô hình đích. Bản nháp đề xuất K token; đích xác minh trong một lượt truyền xuôi; các token được chấp nhận là miễn phí. Năm 2026, EAGLE-3 là biến thể mức sản xuất — nó huấn luyện một đầu nháp trên các trạng thái ẩn của mô hình đích thay vì trên token thô, đẩy tỷ lệ chấp nhận alpha vào dải 0.6-0.8 trên trò chuyện tổng quát. Câu hỏi đúng không phải “bản nháp nhanh đến đâu” mà là “alpha trên lưu lượng của tôi là bao nhiêu?” Nếu alpha giảm dưới ~0.55, giải mã suy đoán âm ròng ở mức đồng thời cao vì mỗi bản nháp bị từ chối tốn một lượt truyền xuôi đích thứ hai. Bài này dạy bạn đo alpha trước và bật cờ sau.

**Type:** Learn
**Languages:** Python (stdlib, toy acceptance-rate simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 10 · 18 (Multi-Token Prediction)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba thế hệ giải mã suy đoán và giải thích EAGLE-3 thay đổi gì so với EAGLE-2 và so với một mô hình nháp cổ điển.
- Định nghĩa tỷ lệ chấp nhận alpha, tính mức tăng tốc kỳ vọng từ alpha và K (độ dài nháp), và xác định alpha hòa vốn cho mức đồng thời mục tiêu.
- Giải thích vì sao giải mã suy đoán là chủ động bật (không mặc định) trong vLLM năm 2026 và vì sao bật nó không đo alpha là một phản mẫu sản xuất.
- Viết một kế hoạch đo: benchmark nào, phân phối prompt nào, điểm đồng thời nào, chỉ số nào để đặt cổng kiểm soát.

## The Problem

Decode bị giới hạn bởi bộ nhớ. Trên một H100 chạy Llama 3.3 70B FP8, mỗi bước decode đọc toàn bộ ~70 GB trọng số từ HBM và phát ra một token cho mỗi chuỗi. Phần tính toán GPU gần như nhàn rỗi trong decode — nút thắt là băng thông HBM, không phải throughput matmul.

Giải mã suy đoán khai thác khoảng cách. Sinh K token ứng viên với một mô hình nháp rẻ, rồi yêu cầu mô hình đích xác minh cả K trong một lượt truyền xuôi. Mỗi token được xác minh thực chất miễn phí (được phân bổ vào một lượt truyền xuôi lô K mà đích dù sao cũng phải làm).

Cách tiếp cận mô hình nháp cổ điển sử dụng một mô hình nhỏ hơn cùng họ (Llama 3.2 1B nháp cho Llama 3.3 70B). Nó hoạt động nhưng tỷ lệ chấp nhận tầm thường — phân phối mô hình nhỏ hơn lệch khỏi đích. EAGLE, rồi EAGLE-2, rồi EAGLE-3 huấn luyện một đầu nháp nhẹ trực tiếp trên các trạng thái nội bộ của mô hình đích, nên phân phối nháp bám đích sát hơn nhiều. Đó là lý do alpha đi từ 0.4 với mô hình nháp lên 0.6-0.8 với EAGLE-3.

Điểm vướng: EAGLE-3 phải chủ động bật trong vLLM năm 2026. `speculative_config` phải được đặt tường minh. Không cờ, không tăng tốc. Các nhóm bật nó mà không đo alpha trên lưu lượng thực thường thấy độ trễ đuôi tệ hơn, không tốt hơn.

## The Concept

### What speculative decoding actually buys

Không có decode suy đoán, chi phí mỗi token là một lượt truyền xuôi đích. Với decode suy đoán ở độ dài nháp K và chấp nhận alpha, số token kỳ vọng mỗi lượt truyền xuôi đích là `1 + K * alpha`. Mức tăng tốc là `(1 + K * alpha) / (1 + epsilon)` trong đó epsilon là chi phí phụ nháp cộng xác minh. Với K=5, alpha=0.7: `(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`. Các con số thực tế tập trung quanh 2-3x vì alpha hiếm khi cao như vậy trên lưu lượng sản xuất và epsilon tăng ở kích thước lô cao.

### Why alpha is the only metric that matters

Các token bị từ chối không biến mất — chúng buộc một lượt truyền xuôi đích thứ hai cho token bị từ chối đầu tiên. Trên một khối lượng công việc nơi alpha giảm tới 0.4, bạn trả chi phí phụ nháp cộng xác minh cộng sinh lại. Ở mức đồng thời cao (chẳng hạn 256 đồng thời), lô decode đã đủ lớn để khoảng cách băng thông bộ nhớ giữa “chỉ đích” và “đích có xác minh” thu hẹp. Dưới alpha 0.55 trên hầu hết phần cứng năm 2026, decode suy đoán âm ròng.

Alpha thay đổi theo khối lượng công việc. Với trò chuyện tổng quát kiểu ShareGPT, EAGLE-3 được huấn luyện trên ShareGPT đạt 0.6-0.8. Với lưu lượng đặc thù lĩnh vực (mã, y tế, pháp lý), draft head được huấn luyện trên dữ liệu tổng quát giảm xuống 0.4-0.6. Huấn luyện một draft head đặc thù lĩnh vực khôi phục alpha — đó là một tác vụ huấn luyện nhẹ, nhanh so với finetuning mô hình đích. Giai đoạn 7 · 16 và Giai đoạn 10 · 15 trích dẫn các giá trị cao hơn (0.85 trở lên). Đó là các tỷ lệ theo token trên benchmark trò chuyện khớp với dữ liệu huấn luyện của draft. Lập kế hoạch theo các dải trên trang này và đo alpha trên lưu lượng của riêng bạn.

### EAGLE generations at a glance

- **Mô hình nháp cổ điển**: mô hình nhỏ cùng họ. Alpha 0.3-0.5. Cơ sở hạ tầng đơn giản — hai mô hình được tải, nháp chạy K lượt truyền xuôi mỗi lượt truyền xuôi đích.
- **EAGLE-1 (2024)**: một đầu nháp đơn lẻ huấn luyện trên các trạng thái ẩn đích (lớp cuối). Alpha ~0.5-0.6. Chi phí phụ tham số nhỏ trên đích.
- **EAGLE-2 (2025)**: độ dài nháp thích nghi và các bản nháp dựa trên cây (xác minh nhiều nhánh trong một lượt đích). Alpha ~0.6-0.7. Bộ lập lịch nháp phức tạp hơn.
- **EAGLE-3 (2025-2026)**: đầu nháp huấn luyện trên nhiều lớp đích (không chỉ lớp cuối), căn chỉnh tốt hơn. Alpha ~0.6-0.8 trên trò chuyện tổng quát.

### The 2026 production recipe

1. Đưa mô hình đích thuần ra sử dụng. Đo đường cơ sở TTFT, ITL, thông lượng ở mức đồng thời mục tiêu.
2. Bật nháp EAGLE-3 qua vLLM `speculative_config`. Chạy lại benchmark.
3. Ghi nhật ký tỷ lệ chấp nhận alpha. vLLM V1 báo cáo nó như `spec_decode_metrics.accepted_tokens_per_request`. Chia cho độ dài nháp được yêu cầu để có alpha.
4. Nếu alpha < 0.55 trên phân phối lưu lượng sản xuất, tắt decode suy đoán hoặc huấn luyện một bản nháp EAGLE-3 riêng lĩnh vực.
5. Ở mức đồng thời sản xuất, chạy lại. Xác nhận P99 ITL không tệ hơn.

### The production pitfall: P99 tail

ITL trung bình giảm với decode suy đoán. P99 có thể tệ hơn nếu bạn không điều chỉnh. Các bản nháp bị từ chối kích hoạt một chuỗi hai lượt (nháp + xác minh thất bại + sinh lại). Dưới lô đầy, hai lượt đó tuần tự hóa. Theo dõi P99 ITL, không phải P50.

### Where EAGLE-3 is already deployed

Google triển khai giải mã suy đoán trong AI Overviews năm 2025 (cùng chất lượng, phản hồi nhanh hơn). vLLM V1 cung cấp `speculative_config` như giao diện được ghi tài liệu, và ma trận tính năng đánh dấu giải mã suy đoán tương thích với prefill chia khối. SGLang hỗ trợ EAGLE-3 như đường nháp được khuyến nghị cho các khối lượng công việc nhiều tiền tố.

### Break-even math in one line

Mức tăng tốc kỳ vọng: `S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`. Đặt `S = 1` giải ra alpha: `alpha_breakeven = verify_overhead / K`. Với verify_overhead điển hình ~0.15 và K=5: `alpha_breakeven = 0.03`. Nhưng đó là phép tính decode thô. Ở mức đồng thời cao chi phí phụ xác minh tăng và lô decode đã phân bổ các lần đọc bộ nhớ trên các chuỗi, nên alpha_breakeven hiệu dụng tăng tới ~0.45-0.55 trong thực tế.

### When not to use speculative decoding

- Sinh ngoại tuyến lô 1 nơi độ trễ không quan trọng. Sử dụng đích thuần.
- Các đầu ra rất ngắn (dưới 50 token). Chi phí phụ nháp và chi phí xác minh chi phối.
- Các lĩnh vực chuyên biệt không có đầu nháp được huấn luyện theo lĩnh vực. Alpha quá thấp.
- Giả định mọi cặp tính năng kết hợp được. Kiểm tra ma trận tương thích vLLM cho phiên bản của bạn: v0.18.0 đánh dấu giải mã suy đoán tương thích với prefill chia khối.

```figure
mx-speculative-tree
```

## Use It

`code/main.py` mô phỏng một vòng lặp decode có và không có giải mã suy đoán qua một dải các giá trị alpha và độ dài nháp K. Nó in alpha hòa vốn, mức tăng tốc được đo, và hành vi đuôi. Chạy nó trên vài tổ hợp (alpha, K) để thấy chính xác nơi giải mã suy đoán ngừng có lợi.

## Ship It

Bài này tạo ra `outputs/skill-eagle3-rollout.md`. Với một mô hình đích, mô tả phân phối lưu lượng, và mục tiêu đồng thời, nó tạo một kế hoạch triển khai EAGLE-3 theo giai đoạn — benchmark đường cơ sở, bật cấu hình, đo alpha, đặt cổng theo alpha >= 0.55, theo dõi P99 ITL.

## Exercises

1. Chạy `code/main.py`. Ở K=5, bạn cần alpha nào cho tăng tốc 2x? Cho tăng tốc 3x? Điều đó nhạy thế nào với verify_overhead?
2. Hình dung lưu lượng sản xuất chia 70% trò chuyện tổng quát, 30% mã. Trò chuyện tổng quát đạt alpha 0.7 với EAGLE-3 huấn luyện trên ShareGPT; mã đạt alpha 0.4. Alpha pha trộn là bao nhiêu và decode suy đoán có dương ròng không?
3. Đọc tài liệu vLLM `speculative_config`. Nêu ba chế độ (mô hình nháp, EAGLE, N-gram) và kiểm tra mỗi chế độ kết hợp với các tính năng nào trong phiên bản vLLM của bạn.
4. Bạn thấy ITL trung bình giảm 25% sau khi bật EAGLE-3 nhưng P99 ITL tăng 15%. Chẩn đoán và đề xuất một biện pháp giảm thiểu.
5. Tính chi phí bộ nhớ của đầu nháp EAGLE-3 cho Llama 3.3 70B. Nó so với chạy Llama 3.2 1B làm nháp cổ điển như thế nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Speculative decoding (Giải mã suy đoán) | “nháp cộng xác minh” | Đề xuất K token bằng một mô hình rẻ, xác minh cả K trong một lượt truyền xuôi đích |
| Acceptance rate alpha (Tỷ lệ chấp nhận alpha) | “tỷ lệ chấp nhận suy đoán” | Tỷ lệ token nháp được đích chấp nhận; chỉ số duy nhất quan trọng |
| Draft length K (Độ dài nháp K) | “k suy đoán” | Nháp đề xuất bao nhiêu token mỗi lượt truyền xuôi đích; điển hình 4-8 |
| Verify overhead epsilon (Chi phí phụ xác minh epsilon) | “chi phí phụ suy đoán” | Chi phí thêm để xác minh và sinh lại so với một lượt truyền xuôi đích thuần; tăng theo lô |
| EAGLE-3 | “EAGLE mới nhất” | Biến thể 2025-2026; huấn luyện đầu nháp trên nhiều lớp đích; alpha 0.6-0.8 trên trò chuyện tổng quát |
| `speculative_config` | “cấu hình suy đoán vLLM” | Chủ động bật tường minh trong vLLM V1; không có mặc định nghĩa là không tăng tốc |
| N-gram spec decode (Decode suy đoán N-gram) | “nháp N-gram” | Nháp phía GPU sử dụng tra cứu N-gram trong prompt; tương thích prefill chia khối |
| Break-even alpha (Alpha hòa vốn) | “alpha không tác động” | Alpha mà tại đó decode suy đoán cho mức tăng tốc bằng không; theo dõi ở mức đồng thời sản xuất |
| Rejected-draft two-pass (Hai lượt nháp bị từ chối) | “chi phí sinh lại” | Hai lượt truyền xuôi đích khi các bản nháp bị từ chối; thúc đẩy đuôi P99 |

## Further Reading

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/) — nguồn có thẩm quyền về `speculative_config` và tương thích prefill chia khối trong V1.
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) — tập trường chính xác.
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) — công thức đầu nháp EAGLE gốc.
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) — các bản nháp thích nghi và các cây.
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) — hệ thống LLM hiệu quả với giải mã suy đoán.
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) — danh sách kiểm tra triển khai sản xuất.
