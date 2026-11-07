---
id: eval-pipeline-take-home
title: Build an offline eval pipeline for a small model
card: evaluation
kind: take-home
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [take-home]
tags: [eval-pipeline, perplexity, exact-match, token-f1, mock-judge]
minutes: 60
lessons: [phases/19-capstone-projects/41-eval-pipeline, phases/11-llm-engineering/10-evaluation, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/regression-gate-ci, evaluation/perplexity-padding-and-shift, evaluation/exact-match-vs-token-f1]
updated: 2026-11-03
---

Bài làm ở nhà. Chúng tôi cho bạn một mô hình nhỏ đã instruction-tune, một corpus giữ lại, một tập prompt thực tế ngắn với các câu trả lời chuẩn, một tập prompt dạng mở với các câu trả lời tham chiếu, và không có truy cập mạng. Xây dựng một pipeline đánh giá báo cáo nhiều hơn một con số và giải thích điểm tổng hợp của nó, và mô tả nó sẽ chạy trong CI như thế nào khi có mạng và một mô hình chấm. Bạn bàn giao gì, và bạn chủ ý bỏ gì?

## Short answer

Bàn giao một file chạy được với bốn đánh giá: perplexity trên tập giữ lại với việc tính token trung thực, exact match đã chuẩn hóa trên tập thực tế, token F1 trên tập dạng mở, và một bộ chấm giả lập có tính xác định trên một thang 1 đến 5 với cùng giao diện một bộ chấm thật sẽ có. Báo cáo mọi con số theo đánh giá, một điểm tổng hợp có trọng số với các trọng số trong một cấu hình, và các bản ghi theo ví dụ để chẩn đoán. Bỏ bộ chấm thật, các khoảng trên điểm tổng hợp và bất cứ thứ gì cần mạng, và nói vậy trong readme.

## Full answer

### The four evals

Mỗi đánh giá bao phủ một chiều mà các đánh giá khác bỏ sót. Perplexity nói liệu mô hình có khớp ngôn ngữ hay không. Exact match nói liệu nó có tạo chuỗi chuẩn trên các câu trả lời ngắn không. Token F1 bỏ qua khác biệt diễn đạt trên các câu trả lời mở. Bộ chấm chấm chất lượng mà các metric chuỗi không thấy được. Mỗi đánh giá là một hàm từ mô hình và một dataset đến một kết quả với metric, các chi tiết theo ví dụ và một tên.

### The details a reviewer checks

- **Perplexity.** Cộng loss trên các vị trí mục tiêu thật, loại các mục tiêu pad khỏi mẫu số, dịch các mục tiêu một vị trí, chia một lần lúc cuối.
- **Chuẩn hóa.** Chuyển chữ thường, bỏ khoảng trắng hai đầu, gộp khoảng trắng, bỏ dấu câu kết thúc ở cuối khi hai phía chỉ khác bởi nó. Token F1 bằng một khi cả hai phía rỗng và không khi chỉ một phía rỗng.
- **Bộ chấm giả lập.** Mức 5 khi các chuỗi đã chuẩn hóa khớp, mức 4 tại token F1 ít nhất 0.8, mức 3 giữa 0.5 và 0.8, mức 2 giữa 0.2 và 0.5, mức 1 trong trường hợp khác, với một lý do một dòng. Nó không phải một bộ chấm. Nó cố định giao diện để một mô hình thật là việc thay một hàm.

### The aggregate

Chuẩn hóa mỗi đánh giá vào khoảng đơn vị: perplexity thành một chia một cộng log của perplexity, exact match và F1 giữ nguyên, bộ chấm chia cho 5. Các trọng số mặc định là 0.2, 0.3, 0.3 và 0.2. Đặt chúng trong một cấu hình và in chúng trong báo cáo, vì lựa chọn là một quyết định sản phẩm, không phải một sự thật. Viết báo cáo với các khóa JSON ổn định và một bảng cho terminal.

### The CI story

Khi có mạng, thay bộ chấm giả lập bằng một bộ chấm thật và hiệu chuẩn nó với ít nhất 50 trường hợp gán nhãn tay, với tương quan Spearman 0.7 hoặc hơn, trước khi các điểm của nó kiểm soát bất cứ thứ gì. Phát triển bộ đánh giá đến khoảng 200 trường hợp, so sánh hai lần chạy với các khoảng Wilson và bootstrap, chặn khi có thoái lui quá 0.3 trên bất kỳ tiêu chí nào, kích hoạt trên các đường dẫn prompt và mô hình, và tải báo cáo lên dưới dạng một artifact.

### What to leave out and why

Bộ chấm thật, vì không có mạng và không có nhãn con người để hiệu chuẩn nó. Các khoảng trên điểm tổng hợp, vì các trọng số làm nó thành một con số sản phẩm; đặt các khoảng trên các thành phần. Các phép kiểm tra nhiễm bẩn, vì corpus huấn luyện không được cung cấp. Nêu mỗi sự bỏ sót trong readme.

## Follow-ups

- **Level 3:** Tại sao giữ một bộ chấm giả lập trong sản phẩm bàn giao? Expected: nó cố định giao diện và đường tổng hợp để bộ chấm thật là việc thay một hàm, và nó giữ vòng lặp chạy được offline.
- **Level 3:** Tại sao trung bình có trọng số là một quyết định sản phẩm? Expected: các trọng số mã hóa điều sản phẩm coi trọng; pipeline cung cấp chúng trong cấu hình và báo cáo mọi thành phần để một người rà soát có thể thấy điều điểm tổng hợp che giấu.
- **Level 4:** Điều đầu tiên bạn thêm khi có mạng là gì? Expected: một bộ chấm thật đằng sau cùng hàm, rồi một lần chạy hiệu chuẩn với nhãn tay trước khi bất kỳ điểm nào của nó kiểm soát bất cứ thứ gì.

## Wrong answers

- "Một con số độ chính xác là sản phẩm bàn giao." Một metric duy nhất không bao giờ mô tả một mô hình; đề bài yêu cầu nhiều metric và một giải thích điểm tổng hợp.
- "Bỏ perplexity, nó không phải một metric nhiệm vụ." Nó là phép kiểm tra rẻ nhất rằng mô hình khớp ngôn ngữ, và tính sai ở đó là điều một người rà soát tìm.
- "Ghi cứng các trọng số." Các trọng số là quyết định sản phẩm; đưa chúng ra và in chúng cạnh các con số.

## Taught in

[Capstone pipeline đánh giá](../../../phases/19-capstone-projects/41-eval-pipeline/) xây dựng bốn đánh giá và bộ tổng hợp, [bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) thêm cổng CI, và [bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) đưa ra các quy tắc hiệu chuẩn bộ chấm.
