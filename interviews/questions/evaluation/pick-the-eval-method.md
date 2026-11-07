---
id: pick-the-eval-method
title: Overlap metric, judge model or human review
card: evaluation
kind: tradeoff
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [llm-as-judge, rouge, human-eval, cost]
minutes: 6
lessons: [phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust]
updated: 2026-11-03
---

Bạn có thể chấm một tính năng tóm tắt theo ba cách: trùng lặp n-gram với một tham chiếu, một mô hình mạnh chấm bằng một rubric, hoặc các chuyên gia con người. Nhóm có một buổi chiều và một ngân sách nhỏ. Bạn quyết định dùng cái nào như thế nào, và cho việc gì?

## Short answer

Dùng cả ba, mỗi cái cho một công việc khác. Các metric trùng lặp miễn phí và tức thời nhưng chỉ đồng ý với con người 40 đến 60 phần trăm thời gian, vì vậy chúng làm baseline và smoke test. Một mô hình chấm tốn vài đô la mỗi nghìn trường hợp và đồng ý 82 đến 88 phần trăm với con người trên một rubric có neo tốt, vì vậy nó là bộ chấm mặc định. Con người là chuẩn sự thật, vì vậy dành họ cho hiệu chuẩn bộ chấm và các trường hợp biên, không cho mọi commit.

## Full answer

### The trade

| Phương pháp | Tốc độ | Chi phí mỗi nghìn | Đồng thuận với con người | Sử dụng |
|---|---|---|---|---|
| BLEU hoặc ROUGE | dưới một giây | không gì | 40 đến 60 phần trăm | baseline, smoke test |
| Độ tương đồng embedding | khoảng 30 giây | không gì | 55 đến 70 phần trăm | sàng lọc |
| Mô hình chấm, tầng nhỏ | khoảng 3 phút | khoảng 8 đô la | 82 đến 86 phần trăm | bộ chấm CI mặc định |
| Mô hình chấm, tầng lớn | khoảng 5 phút | khoảng 25 đô la | 85 đến 88 phần trăm | hệ trọng, an toàn |
| Chuyên gia con người | khoảng 2 giờ | khoảng 500 đô la | chuẩn sự thật | hiệu chuẩn, chính sách |

### Why each one stays

Các metric trùng lặp bỏ sót ý nghĩa. Hai câu trả lời không chung từ đều có thể đúng, và một câu trả lời ROUGE cao có thể sai trong ngữ cảnh. Chúng ở lại vì không tốn gì, chạy trong vài giây và không thay đổi khi một mô hình chấm thay đổi.

Bộ chấm nắm tính liên quan, tính đúng đắn, tính hữu ích và an toàn. Nó vẫn là công cụ chủ lực vì mở rộng quy mô được. Nó cần một rubric có các mức có neo và một lần hiệu chuẩn với các nhãn con người trước khi con số của nó có nghĩa gì.

Rà soát của con người chậm và đắt. Nó ở lại vì là chuẩn sự thật duy nhất. Dành nó cho hiệu chuẩn các điểm tự động và cho các trường hợp bộ chấm không thể phân định.

### For the afternoon

Chạy metric trùng lặp trên mọi thứ để bắt hỏng hóc lớn. Chạy bộ chấm trên tập chuẩn với bốn tiêu chí. Cho hai người gán nhãn một phần nhỏ và so sánh với bộ chấm trước khi bất kỳ ai đọc trung bình.

## Follow-ups

- **Level 1:** ROUGE đo gì? Expected: recall của các n-gram tham chiếu, được xây cho tóm tắt.
- **Level 2:** Tại sao giữ metric trùng lặp khi bạn đã có một bộ chấm? Expected: nó miễn phí và nhanh, bắt các thoái lui lớn trong vài giây, và không dịch chuyển khi mô hình chấm thay đổi.
- **Level 2:** Khi nào một bộ chấm không đủ? Expected: các quyết định hệ trọng hoặc chính sách, và bất kỳ lúc nào bộ chấm chưa được hiệu chuẩn với các nhãn con người trên nhiệm vụ này.
- **Level 3:** Bài học nói bộ chấm phải có năng lực ít nhất ngang mô hình nó chấm. Tại sao? Expected: một bộ chấm yếu cho điểm nhiễu, không nhất quán và không thể thấy các lỗi một mô hình mạnh hơn mắc.

## Wrong answers

- "Con người là tiêu chuẩn vàng, vì vậy chấm mọi thứ bằng tay." Rà soát của con người mất nhiều giờ và tốn khoảng 500 đô la mỗi nghìn trường hợp, vì vậy không thể chạy trên mọi thay đổi.
- "Các metric trùng lặp vô ích cho việc sinh." Chúng bắt các thoái lui lớn và không tốn gì; chúng chỉ bỏ sót ý nghĩa.
- "Chọn một metric và tối ưu nó." Chỉ tối ưu tính đúng đắn cho các câu trả lời ngắn gọn mà không ai dùng được; chấm nhiều tiêu chí.

## Taught in

[Bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) so sánh ba phương pháp theo tốc độ, chi phí và đồng thuận với con người.
