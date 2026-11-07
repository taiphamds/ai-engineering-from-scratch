---
id: same-model-judges-itself
title: The model that writes the answer grades it too
card: evaluation
kind: tradeoff
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, agentic-ai-engineer]
rounds: [ml-depth, design-review]
tags: [llm-as-judge, self-preference, bias, calibration]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks, phases/10-llms-from-scratch/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust]
updated: 2026-11-03
---

Sản phẩm của bạn sinh các câu trả lời bằng một mô hình, và pipeline đánh giá chấm chúng bằng chính mô hình đó cộng một rubric. Điểm tăng sau bản phát hành cuối và nhóm hài lòng. Một người rà soát hỏi tại sao lợi ích có thể không thật. Rủi ro là gì, và bạn thay đổi gì?

## Short answer

Một mô hình chấm họ riêng của nó thích phong cách riêng, vì vậy tự đánh giá thổi phồng các điểm khoảng 10 đến 20 phần trăm. Mức tăng có thể nghĩa là bộ chấm thích các đầu ra mới hơn, không phải người dùng thích. Chuyển bộ chấm sang một họ mô hình khác, hiệu chuẩn nó với nhãn con người, và chấm lại baseline cùng phiên bản mới dưới bộ chấm đó.

## Full answer

### Where the bias comes from

Một bộ chấm là một mô hình có sở thích. Nó ưu tiên các câu trả lời dài hơn, các câu trả lời từ họ mô hình riêng và các câu trả lời khớp phong cách prompt. Khi bộ chấm đến từ họ riêng của bộ sinh, mọi bản phát hành chuyển đầu ra về thị hiếu của bộ chấm trông như một cải thiện. Bài học gọi đây là tự ưu tiên và đo mức thổi phồng khoảng 10 đến 20 phần trăm.

### Why the release looked better

Một bản phát hành thay đổi giọng điệu, độ dài và cấu trúc cũng như nội dung. Bộ chấm thưởng ba thứ đầu. Không có một tín hiệu riêng bạn không thể biết phần nào của lợi ích là nội dung.

### What to change

1. Chọn một bộ chấm từ một họ mô hình khác. Dùng mô hình rẻ nhất vẫn đáp ứng ngưỡng hiệu chuẩn.
2. Hiệu chuẩn nó: gán nhãn tay ít nhất 50 trường hợp, bài học dùng 100, và yêu cầu một tương quan Spearman 0.7 hoặc hơn với thứ hạng con người.
3. Chấm bản phát hành cũ và mới dưới cùng bộ chấm và báo cáo chênh lệch, không phải điểm tuyệt đối.
4. Chuẩn hóa theo độ dài, hoặc nêu trong rubric rằng độ dài không được tính.

## Follow-ups

- **Level 2:** Bài học nêu hai thiên lệch bộ chấm nào khác cạnh tự ưu tiên? Expected: thiên lệch vị trí trong so sánh theo cặp và thiên lệch dài dòng hướng đến các câu trả lời dài hơn.
- **Level 2:** Bộ chấm từ họ khác rẻ hơn nhưng tương quan ít hơn với con người. Bạn chọn bộ nào? Expected: bộ chấm rẻ nhất vẫn đáp ứng ngưỡng hiệu chuẩn; dưới ngưỡng con số là nhiễu bất kể họ.
- **Level 3:** Bạn không thể thay họ bộ chấm trong quý này. Điều gì hạn chế thiệt hại? Expected: hiệu chuẩn với nhãn con người và công bố tương quan, chuẩn hóa theo độ dài, và chỉ đọc các thay đổi tương đối dưới bộ chấm đóng băng.
- **Level 3:** Sau khi chuyển, bạn phân biệt một lợi ích thật với một sở thích bộ chấm như thế nào? Expected: cả hai phiên bản được chấm bởi bộ chấm mới, chênh lệch với một khoảng tin cậy, và một phần do con người gán nhãn của các trường hợp dịch chuyển nhiều nhất.

## Wrong answers

- "Bộ chấm có một rubric, vì vậy họ của nó không quan trọng." Rubric không loại bỏ sở thích với phong cách riêng; bài học đo mức thổi phồng 10 đến 20 phần trăm.
- "Dùng mô hình mạnh nhất chúng ta có làm bộ chấm, chính là mô hình chúng ta phát hành." Sức mạnh không loại bỏ tự ưu tiên; một họ khác ở sức mạnh tương tự là cách sửa.
- "Điểm tăng, vì vậy chất lượng tăng." Điểm là một đại diện; đầu ra có thể đã chuyển về những gì bộ chấm thưởng, chẳng hạn độ dài và giọng điệu.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) liệt kê tự đánh giá là một bẫy, và [bài học đánh giá](../../../phases/10-llms-from-scratch/10-evaluation/) nêu tự ưu tiên trong số các chế độ thất bại bộ chấm.
