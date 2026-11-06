# A/B Testing LLM Features — GrowthBook, Statsig, and the Vibes Problem

> Thử nghiệm A/B truyền thống không được xây cho LLM không xác định. Phân biệt then chốt: đánh giá trả lời "mô hình có thể làm việc này không?" Thử nghiệm A/B trả lời "người dùng có quan tâm không?" Cần cả hai; thời triển khai theo kiểm tra cảm tính đã qua. Cần thử gì năm 2026: kỹ thuật prompt (cách dùng từ), lựa chọn mô hình (GPT-4 so với GPT-3.5 so với OSS; độ chính xác so với chi phí so với độ trễ), tham số sinh (temperature, top-p). Các trường hợp thực tế: một biến thể mô hình phần thưởng chatbot mang lại +70% độ dài hội thoại và +30% tỷ lệ giữ chân; thí nghiệm dòng tiêu đề AI của Nextdoor mang lại +1% CTR sau tinh chỉnh hàm phần thưởng; Khanmigo của Khan Academy lặp cải tiến trên trục độ trễ so với độ chính xác toán. Phân chia nền tảng: **Statsig** (được OpenAI mua lại với $1.1B vào tháng 9 năm 2025) — kiểm định tuần tự, CUPED, tất cả trong một. **GrowthBook** — mã nguồn mở, nguyên bản kho dữ liệu, các engine Bayes + tần suất + tuần tự, CUPED, kiểm tra SRM, hiệu chỉnh Benjamini-Hochberg + Bonferroni. Bạn chọn theo ưu tiên SQL kho dữ liệu và việc "được OpenAI mua lại" có quan trọng với tổ chức của bạn hay không.

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## Learning Objectives

- Phân biệt đánh giá ("mô hình có thể làm việc này không") với thử nghiệm A/B ("người dùng có quan tâm không").
- Liệt kê ba trục có thể thử nghiệm (prompt, mô hình, tham số) và chọn chỉ số cho từng trục.
- Giải thích CUPED, kiểm định tuần tự và hiệu chỉnh so sánh nhiều lần Benjamini-Hochberg.
- Chọn Statsig hoặc GrowthBook theo định hướng SQL kho dữ liệu và lập trường về việc công ty bị mua lại.

## The Problem

Bạn tinh chỉnh thủ công một system prompt. Nó có vẻ tốt hơn. Bạn triển khai nó. Chuyển đổi thay đổi do nhiễu. Bạn đổ lỗi cho chỉ số. Hoặc bạn triển khai mô hình mới và chuyển đổi không thay đổi — mô hình suy giảm hay thay đổi quá nhỏ để phát hiện? Bạn không biết, vì bạn triển khai không có A/B.

Đánh giá trả lời liệu mô hình có thể làm một tác vụ trên một tập có nhãn hay không. Chúng không trả lời liệu người dùng thích đầu ra hơn hay không. Chỉ một thí nghiệm trực tuyến có kiểm soát trả lời điều đó, và chỉ khi thí nghiệm đủ lực kiểm định, kiểm soát tính không xác định và hiệu chỉnh so sánh nhiều lần.

## The Concept

### Evals vs A/B tests

**Đánh giá** — ngoại tuyến, tập có nhãn, giám khảo (bảng tiêu chí hoặc LLM làm giám khảo hoặc con người). Trả lời: "Đầu ra có đúng / hữu ích / an toàn trên phân phối cố định này không?"

**Thử nghiệm A/B** — trực tuyến, người dùng thực, ngẫu nhiên hóa. Trả lời: "Biến thể mới có làm thay đổi chỉ số cấp người dùng quan trọng không?"

Cần cả hai. Đánh giá bắt suy giảm trước khi tiếp xúc; A/B xác nhận tác động sản phẩm sau đó.

### What to test

1. **Kỹ thuật prompt** — cách dùng từ, cấu trúc system prompt, ví dụ. Chỉ số: thành công tác vụ, giữ chân người dùng, chi phí/yêu cầu.
2. **Lựa chọn mô hình** — GPT-4 so với GPT-3.5-Turbo so với Llama-OSS. Chỉ số: độ chính xác (tác vụ) + chi phí/yêu cầu + P99 độ trễ. Đa mục tiêu.
3. **Tham số sinh** — temperature, top-p, max_tokens. Chỉ số: riêng theo tác vụ (độ đa dạng đầu ra so với tính xác định).

### CUPED — variance reduction

Thí nghiệm có kiểm soát sử dụng dữ liệu trước thí nghiệm. Loại bỏ phương sai trước kỳ bằng hồi quy trước khi so sánh sau kỳ. Mức giảm phương sai điển hình: 30-70%. Cỡ mẫu hiệu dụng tăng miễn phí.

Triển khai: cả Statsig lẫn GrowthBook đều triển khai.

### Sequential testing

A/B cổ điển giả định cỡ mẫu cố định. Kiểm định tuần tự ("xem rồi quyết định") kiểm soát tỷ lệ dương tính giả khi xem lặp lại. Các thủ tục tuần tự luôn hợp lệ (mSPRT, chuỗi tin cậy của Howard) cho phép bạn dừng sớm với những phương án thắng rõ ràng.

### Multiple-comparison corrections

Chạy 20 thử nghiệm A/B ở độ tin cậy 95% tạo ra một dương tính giả do ngẫu nhiên. Hiệu chỉnh Bonferroni siết α theo từng kiểm định; Benjamini-Hochberg kiểm soát tỷ lệ phát hiện sai. GrowthBook triển khai cả hai.

### SRM — sample ratio mismatch

Hash phân bổ ngẫu nhiên hóa người dùng vào các biến thể. Nếu chia 50/50 cho ra 47/53, có gì đó hỏng — kiểm tra SRM đánh dấu nó. Cả hai nền tảng đều triển khai.

### Statsig vs GrowthBook

**Statsig**:
- Được OpenAI mua lại với $1.1B (tháng 9 năm 2025). Được lưu trữ, SaaS.
- Kiểm định tuần tự, CUPED, các nhóm người dùng giữ riêng.
- Tất cả trong một: cờ tính năng + thí nghiệm + khả năng quan sát.
- Phù hợp nhất: nhóm đã muốn một sản phẩm gộp, không quan tâm quyền sở hữu của OpenAI.

**GrowthBook**:
- Mã nguồn mở (MIT); nguyên bản kho dữ liệu (đọc trực tiếp từ Snowflake/BigQuery/Redshift).
- Nhiều engine: Bayes, tần suất, tuần tự.
- CUPED, SRM, hiệu chỉnh Bonferroni, BH.
- Tự lưu trữ hoặc đám mây được quản lý.
- Phù hợp nhất: tổ chức dùng SQL kho dữ liệu, nhóm dữ liệu kiểm soát lớp chỉ số, muốn OSS.

### Non-determinism complicates power

Cùng prompt tạo đầu ra khác nhau. Tính lực kiểm định truyền thống giả định quan sát IID. Với tính không xác định của LLM, cỡ mẫu hiệu dụng thấp hơn danh định. Nhân cỡ mẫu yêu cầu với ~1.3-1.5x làm biên an toàn.

### Real case outcomes

- Biến thể mô hình phần thưởng chatbot: +70% độ dài hội thoại, +30% giữ chân.
- Dòng tiêu đề Nextdoor: +1% CTR sau tinh chỉnh hàm phần thưởng.
- Khanmigo của Khan Academy: đánh đổi lặp cải tiến giữa độ trễ và độ chính xác toán.

### The anti-pattern: shipping on vibes

Mọi kỹ sư cấp cao đều có thể nêu một tính năng được triển khai vì "cảm thấy tốt hơn" mà không có A/B. Phần lớn chúng làm suy giảm chỉ số sản phẩm mà nhóm không nhận ra trong nhiều tháng. A/B là yếu tố buộc phải hành động.

### Numbers you should remember

- Statsig được OpenAI mua lại: $1.1B, tháng 9 năm 2025.
- GrowthBook: mã nguồn mở MIT; Bayes + tần suất + tuần tự.
- Giảm phương sai CUPED: 30-70%.
- Tính không xác định của LLM → dự phòng cỡ mẫu +30-50%.

```figure
mx-sequential-test
```

## Use It

`code/main.py` mô phỏng một thử nghiệm A/B tuần tự với ranh giới cố định và tuần tự. Cho thấy cách tuần tự cho phép bạn dừng sớm.

## Ship It

Bài học này tạo ra `outputs/skill-ab-plan.md`. Với thay đổi tính năng, khối lượng công việc, đường cơ sở, chọn nền tảng, cổng, cỡ mẫu.

## Exercises

1. Chạy `code/main.py`. Với mức tăng kỳ vọng 5% trên chuyển đổi cơ sở 3%, cỡ mẫu nào đạt lực kiểm định 80%?
2. Chọn Statsig hoặc GrowthBook cho một khách hàng tại chỗ chịu quy định y tế.
3. Thiết kế A/B thử GPT-4 so với GPT-3.5 trên chi phí mỗi phiếu hỗ trợ được giải quyết. Chỉ số chính, chỉ số bảo vệ, chỉ số phụ là gì?
4. Canary của bạn vượt qua nhưng A/B cho thấy chuyển đổi -1.2%. Bạn có triển khai không? Viết tiêu chí chuyển cấp.
5. Áp dụng CUPED cho một kỳ trước có 60% phương sai của kỳ sau. Tính mức tăng cỡ mẫu hiệu dụng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Eval (Đánh giá) | "kiểm thử ngoại tuyến" | Đánh giá năng lực mô hình trên tập có nhãn |
| A/B test (Thử nghiệm A/B) | "thí nghiệm" | So sánh ngẫu nhiên hóa trực tiếp trên người dùng |
| CUPED | "giảm phương sai" | Hồi quy trước kỳ để giảm phương sai |
| Sequential test (Kiểm định tuần tự) | "kiểm định được phép xem trước" | Thủ tục luôn hợp lệ cho phép dừng sớm |
| Multiple comparison (So sánh nhiều lần) | "sai số theo họ" | Chạy nhiều kiểm định làm tăng dương tính giả |
| Bonferroni | "hiệu chỉnh chặt" | Chia α cho số kiểm định |
| Benjamini-Hochberg | "BH FDR" | Kiểm soát tỷ lệ phát hiện sai, ít bảo thủ hơn |
| SRM | "chia sai" | Không khớp tỷ lệ mẫu; lỗi phân bổ |
| Statsig | "OpenAI sở hữu" | Thương mại tất cả trong một, được mua lại năm 2025 |
| GrowthBook | "công cụ OSS" | Nền tảng nguyên bản kho dữ liệu MIT |
| mSPRT | "kiểm định tỷ số xác suất tuần tự" | Thủ tục tuần tự cổ điển |

## Further Reading

- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
