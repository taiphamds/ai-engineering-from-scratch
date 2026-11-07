---
id: judge-calibration-before-trust
title: Before a judge score can gate a release
card: evaluation
kind: concept
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, agentic-ai-engineer]
rounds: [ml-depth, design-review]
tags: [llm-as-judge, calibration, spearman, rubric]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks]
manuals: []
practice: []
cheatsheet: [llm-evaluation, generative-evaluation]
related: [evaluation/pick-the-eval-method]
updated: 2026-11-03
---

Bạn viết một rubric, và một mô hình chấm giờ chấm tính trung thành cho hệ thống truy xuất của bạn. Dashboard hiển thị một trung bình cao, và nhóm muốn dùng nó làm cổng phát hành từ thứ Hai. Điều gì phải xảy ra trước khi con số này có thể chặn hoặc phê duyệt một bản phát hành?

## Short answer

Hiệu chuẩn bộ chấm với con người trước. Gán nhãn tay khoảng 100 trường hợp, chấm chúng bằng bộ chấm, và tính tương quan Spearman giữa hai thứ hạng. Dưới 0.7 rubric cần chỉnh sửa và con số là nhiễu. Rồi đóng băng mô hình chấm và phiên bản, và đọc các điểm thấp nhất cũng như trung bình.

## Full answer

### Why a raw judge score lies

Một bộ chấm thất bại theo ba cách âm thầm. Nó mang thiên lệch: nó thích các câu trả lời dài hơn, các câu trả lời từ họ mô hình riêng và các câu trả lời khớp phong cách prompt. Nó có thể trả về JSON xấu, trở thành một điểm thiếu bị bỏ khỏi tổng hợp và nâng trung bình. Nó thay đổi dần: một phiên bản bộ chấm mới thay đổi mọi metric cùng lúc.

### The calibration run

1. Gán nhãn tay ít nhất 50 trường hợp; bài học dùng 100. Bao phủ phần đáy phân phối, không chỉ các trường hợp dễ.
2. Chấm cùng các trường hợp bằng bộ chấm.
3. Vẽ bộ chấm so với con người và tính tương quan hạng Spearman.
4. Một tương quan dưới 0.7 nghĩa là rubric cần chỉnh sửa. Một bộ chấm ở 0.3 là nhiễu.

Dùng một bộ chấm từ một họ mô hình khác với bộ sinh. Một mô hình chấm họ riêng của nó thổi phồng điểm khoảng 10 đến 20 phần trăm.

### After the run

- Đóng băng mô hình chấm và phiên bản. Khi bạn nâng cấp, chạy bộ chấm cũ và mới trên cùng baseline trước khi so sánh bất cứ thứ gì.
- Kiểm tra phân vị đáy. Một trung bình 0.85 có thể che giấu một phần 5 phần trăm các thất bại thảm họa.
- Quản lý phiên bản tập đánh giá và gắn thẻ nó với mọi thay đổi, để một điểm tháng này có cùng nghĩa với một điểm tháng trước.

## Follow-ups

- **Level 2:** Tại sao Spearman chứ không phải chênh lệch trung bình giữa điểm bộ chấm và con người? Expected: Spearman so sánh thứ hạng, vì vậy một bộ chấm khắt khe nhưng sắp xếp các trường hợp cùng cách vẫn đạt.
- **Level 2:** Tập gán nhãn tay nhỏ nhất bài học chấp nhận là gì? Expected: nó từ chối một bộ chấm được kiểm thử trên ít hơn 50 ví dụ do con người gán nhãn.
- **Level 3:** Bộ chấm là cùng mô hình viết các câu trả lời. Lần hiệu chuẩn có lẽ sẽ cho thấy gì? Expected: các điểm bị thổi phồng khoảng 10 đến 20 phần trăm; chuyển bộ chấm sang một họ mô hình khác.
- **Level 3:** Tương quan đạt, nhưng nhóm mười phần trăm thấp nhất chứa các điểm tự tin nhưng sai. Bạn có phát hành không? Expected: không; tương quan trung bình có thể che giấu các thất bại thảm họa, vì vậy kiểm tra 10 phần trăm thấp nhất trước khi con số kiểm soát bất cứ thứ gì.

## Wrong answers

- "Rubric rõ, vì vậy bộ chấm đúng." Thiên lệch độ dài và họ vẫn tồn tại với một rubric rõ; chỉ một tương quan với nhãn con người cho thấy độ lớn của chúng.
- "Nó đồng ý với metric cũ của chúng tôi, vì vậy nó đã được hiệu chuẩn." Metric cũ có thể cùng thiên lệch; hiệu chuẩn với con người.
- "Hiệu chuẩn một lần và tiếp tục nâng cấp bộ chấm." Mỗi phiên bản bộ chấm thay đổi mọi điểm; đóng băng phiên bản hoặc chạy lại baseline song song.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) đưa ra công thức hiệu chuẩn và ba thất bại âm thầm của một bộ chấm.
