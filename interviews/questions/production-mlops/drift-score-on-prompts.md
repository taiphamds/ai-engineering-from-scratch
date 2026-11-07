---
id: drift-score-on-prompts
title: Detect that the questions changed when the evals did not
card: production-mlops
kind: concept
level: 2
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [ml-breadth, system-design]
tags: [drift, psi, embeddings, monitoring]
minutes: 8
lessons: [phases/19-capstone-projects/11-llm-observability-dashboard]
manuals: []
practice: []
cheatsheet: [genai-observability]
related: [production-mlops/five-minute-detection, production-mlops/evals-or-ab-test]
updated: 2026-11-03
---

Các điểm đánh giá của bạn phẳng cả năm. Một chủ sản phẩm nói những gì người dùng hỏi đã thay đổi nhiều từ mùa xuân. Bạn phát hiện thay đổi đó từ telemetry như thế nào, và bạn làm gì với kết quả?

## Short answer

Embed các prompt, gom chúng theo tuần, và so sánh tuần với một baseline quá khứ bằng population stability index hoặc một KL divergence. Một điểm tăng có nghĩa phân phối đầu vào đã dịch chuyển, ngay cả khi điểm trên tập đánh giá cố định không thay đổi. Cảnh báo trên một ngưỡng, rồi lấy mẫu và gắn nhãn các prompt từ phân phối mới, làm mới tập đánh giá, và kiểm tra lại định tuyến cùng prompt theo nó.

## Full answer

### Why the evals cannot see it

Một đánh giá chạy mô hình trên một tập cố định có nhãn. Nó đo mô hình trên các câu hỏi mùa xuân trước. Khi các câu hỏi thay đổi, tập đánh giá không đổi, nên điểm giữ phẳng trong khi sản phẩm âm thầm phục vụ một quần thể khác.

### The detector

Capstone chạy một công việc hằng tuần. Nó gom các embedding prompt của tuần và tính PSI đối chiếu baseline 4 tuần trước. Bảng thuật ngữ chính đưa ra cách đọc thông thường: PSI trên 0.2 báo hiệu một dịch chuyển có ý nghĩa. Đầu ra mẫu cho thấy một tuần yên ở 0.08, dưới ngưỡng đó. Cùng công việc có thể dùng một KL divergence trên cùng embedding. Theo dõi xu hướng điểm đánh giá cạnh nó, để cả hai góc nhìn nằm trên một trang.

### Per application, not only global

Một điểm toàn cục lấy trung bình làm trôi biến mất. Bài tập của capstone tính PSI theo application id, cho thấy bề mặt nào dịch chuyển. Một bot hỗ trợ và một trợ lý lập trình hiếm khi trôi cùng nhau.

### What to do with a real shift

1. Lấy mẫu các prompt từ phân phối mới, gắn nhãn chúng, và làm mới tập đánh giá.
2. Chạy lại các đánh giá trên tập làm mới. Một điểm phẳng trên tập cũ không nói gì về tập mới.
3. Kiểm tra lại bất cứ thứ gì được huấn luyện hoặc tinh chỉnh trên phân phối cũ: một bộ phân loại định tuyến, các mẫu prompt, các ngưỡng cache.

### Where it lives

Trong mặt phẳng quan sát: các span đến kho span, công việc hằng tuần đọc chúng, ghi một chỉ số, và chuỗi cảnh báo lấy nó.

## Follow-ups

- **Level 2:** Khác biệt giữa một PSI trên prompt và một điểm đánh giá giảm là gì? Expected: PSI đo đầu vào, đánh giá đo mô hình trên đầu vào cố định, và cái đầu có thể thay đổi trong khi cái sau giữ phẳng.
- **Level 2:** Tại sao chạy bộ phát hiện theo application id? Expected: một điểm toàn cục lấy trung bình làm trôi biến mất, và góc nhìn theo ứng dụng cho thấy bề mặt nào dịch chuyển.
- **Level 3:** Điều gì sai với một baseline một tuần? Expected: tính mùa vụ hằng tuần trông như drift, và baseline di chuyển cùng các đầu vào nó nên đo.
- **Level 3:** PSI vượt ngưỡng sau một chiến dịch marketing. Đó có phải vấn đề? Expected: đó là một dịch chuyển thật trong đầu vào. Câu hỏi là liệu chất lượng giữ trên chúng, nên lấy mẫu, gắn nhãn và đánh giá.

## Wrong answers

- "Các điểm đánh giá phẳng có nghĩa không drift." Tập đánh giá cố định, nên nó không thể thấy đầu vào thay đổi.
- "So sánh các chuỗi prompt thô." Cách diễn đạt thay đổi trên mọi yêu cầu. Embedding nắm phân phối chủ đề.
- "Cảnh báo trên bất kỳ điểm nào trên không." Các giá trị nhỏ là nhiễu. Ngưỡng của capstone là 0.2.

## Taught in

[Capstone dashboard quan sát](../../../phases/19-capstone-projects/11-llm-observability-dashboard/) chạy công việc PSI hằng tuần trên các embedding prompt và đặt chuỗi cảnh báo.
