---
id: anchored-rubric
title: Two engineers, one judge, different means
card: evaluation
kind: design
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer]
rounds: [design-review, ml-depth]
tags: [rubric, llm-as-judge, reproducibility, criteria]
minutes: 8
lessons: [phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust, evaluation/pairwise-position-bias]
updated: 2026-11-03
---

Hai kỹ sư chạy cùng bộ chấm trên cùng 100 câu trả lời với chỉ dẫn "chấm từ 1 đến 5 câu trả lời tốt đến mức nào" và nhận các trung bình cách nhau gần một điểm đầy đủ. Bạn viết lại rubric như thế nào để các điểm có thể tái lập, và còn gì khác đi vào prompt của bộ chấm?

## Short answer

Neo mọi mức vào hành vi mà một người đọc có thể kiểm tra. Một rubric nêu mức 5, mức 4 và mức 3 trông như thế nào giảm phương sai bộ chấm 30 đến 40 phần trăm so với một thang không có neo. Chấm nhiều tiêu chí riêng biệt, cho bộ chấm đầu vào, đầu ra và tham chiếu, và yêu cầu lý luận cạnh con số.

## Full answer

### From vague to anchored

Rubric xấu hỏi câu trả lời tốt đến mức nào. Rubric tốt mô tả mỗi mức:

- **5**: đúng về thực tế, trực tiếp trả lời câu hỏi, bao gồm các chi tiết cụ thể, đưa ra thông tin có thể hành động.
- **4**: đúng và đúng chủ đề, nhưng thiếu chi tiết hoặc hơi dài dòng.
- **3**: phần lớn đúng với một điểm không chính xác nhỏ, hoặc bỏ sót một phần ý định.
- **2**: các lỗi thực tế đáng kể, hoặc chỉ liên quan gián tiếp.
- **1**: sai, lạc chủ đề hoặc có hại.

### One criterion per score

Chấm tính liên quan, tính đúng đắn, tính hữu ích và an toàn trên các thang riêng. Một điểm tổng thể duy nhất gộp các chiều, và tối ưu hóa nó tạo ra các câu trả lời ngắn gọn đúng về kỹ thuật và vô ích.

### What the judge sees

Đầu vào, đầu ra, câu trả lời tham chiếu khi có, và rubric có neo cho tiêu chí. Yêu cầu một câu trả lời có cấu trúc với điểm và một lý do ngắn, để một người rà soát có thể kiểm toán bộ chấm.

### Prove it

Chạy bộ chấm ba lần trên mỗi trường hợp và tính một thống kê đồng thuận giữa các lần chạy. Dưới 0.7 rubric vẫn mơ hồ. Nếu bộ chấm tiếp tục dao động giữa hai mức liền kề, chuyển tiêu chí đó sang một phép so sánh theo cặp, loại bỏ thang đo.

## Follow-ups

- **Level 2:** Tại sao chấm bốn tiêu chí thay vì một điểm tổng thể? Expected: một điểm gộp các chiều; một mô hình có thể đúng và vô ích, và con số đơn lẻ che giấu sự đánh đổi.
- **Level 2:** Bạn cho thấy rubric mới có thể tái lập như thế nào? Expected: chạy bộ chấm nhiều lần mỗi trường hợp và tính một thống kê đồng thuận; dưới 0.7 viết lại lần nữa.
- **Level 3:** Bộ chấm vẫn dao động giữa 3 và 4 trên nhiều trường hợp. Thay đổi thiết kế nào loại bỏ điều đó? Expected: so sánh theo cặp, chỉ hỏi đầu ra nào tốt hơn.
- **Level 3:** Một tiêu chí có một câu trả lời tham chiếu và tiêu chí khác không có. Rubric có thay đổi không? Expected: có; tính đúng đắn neo vào tham chiếu, trong khi tính hữu ích và an toàn neo vào các thuộc tính chỉ của đầu ra.

## Wrong answers

- "Hạ temperature của bộ chấm." Một bộ chấm có tính xác định vẫn áp dụng một thang mơ hồ khác nhau giữa các trường hợp; rubric là cách sửa.
- "Lấy trung bình nhiều lần chạy hơn." Lấy trung bình nhiễu tốn tiền và để lại một thang mà hai người đọc diễn giải khác nhau.
- "Một điểm tổng thể đơn giản hơn." Đơn giản hơn để đọc và sai để tối ưu; bài học cảnh báo rằng tối ưu hóa một metric duy nhất tạo ra các câu trả lời ngắn gọn vô ích.

## Taught in

[Bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) đưa ra rubric có neo, bốn tiêu chí và phép kiểm tra đồng thuận.
