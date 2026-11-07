---
id: pairwise-position-bias
title: The winner changed when you swapped the order
card: evaluation
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [llm-as-judge, pairwise, position-bias, win-rate]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks, phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust]
updated: 2026-11-03
---

Bạn so sánh hai phiên bản prompt bằng cách cho một mô hình chấm thấy cả hai đầu ra và hỏi cái nào tốt hơn. Phiên bản B thắng 70 phần trăm các cặp. Rồi bạn hoán đổi hai đầu ra và phiên bản A thắng phần lớn. Điều gì sai, và bạn chạy phép so sánh như thế nào?

## Short answer

Bộ chấm có thiên lệch vị trí: nó thích lựa chọn nó đọc trước. Lần chạy đầu của bạn đo thứ tự, không phải prompt. Chấm mọi cặp theo cả hai thứ tự, chỉ tính một chiến thắng khi cùng phiên bản thắng hai lần, và coi các quyết định chia rẽ là hòa. Rồi báo cáo tỷ lệ thắng với một khoảng tin cậy.

## Full answer

### Why pairwise at all

Một bộ chấm theo cặp không bao giờ phải quyết định liệu một đầu ra là mức 3 hay mức 4 trên một thang. Nó chỉ chọn một người thắng, vì vậy tránh vấn đề hiệu chuẩn thang của một bộ chấm đơn lẻ. Điều đó làm nó thành công cụ đúng cho một kiểm thử đối đầu của hai phiên bản prompt.

### The bias

Các bộ chấm thích lựa chọn được trình bày đầu tiên. Quy tắc của bài học ngắn: luôn ngẫu nhiên hóa thứ tự và chạy cả hai. Một thứ tự cho bạn một con số về bố trí của prompt.

### The protocol

1. Với mỗi đầu vào, chấm cặp theo cả hai thứ tự.
2. Một phiên bản chỉ thắng cặp khi thắng ở cả hai thứ tự.
3. Một cặp đảo theo thứ tự là một lần hòa.
4. Báo cáo tỷ lệ thắng và khoảng tin cậy của nó. Một tỷ lệ thắng gần một nửa nghĩa là bộ chấm không thể phân biệt các phiên bản.

Cũng kiểm tra độ dài. Nếu phiên bản B dài hơn, bộ chấm có thể thưởng cho sự dài dòng. Chuẩn hóa theo độ dài hoặc nêu trong rubric rằng độ dài không được tính, và xem liệu sở thích còn tồn tại không.

## Follow-ups

- **Level 2:** Tại sao một phép so sánh theo cặp tránh các vấn đề hiệu chuẩn rubric? Expected: bộ chấm chỉ chọn một người thắng và không bao giờ đặt một đầu ra lên một thang số.
- **Level 2:** Phiên bản B cũng dài hơn. Bạn kiểm soát điều gì khác? Expected: thiên lệch dài dòng; chuẩn hóa theo độ dài hoặc loại trừ nó trong rubric, rồi kiểm tra liệu sở thích còn không.
- **Level 3:** Sau cả hai thứ tự, 40 phần trăm các cặp đảo theo thứ tự. Điều đó cho bạn biết gì? Expected: bộ chấm không thể phân biệt các phiên bản trên các cặp đó; tính chúng là hòa và mong đợi một tỷ lệ thắng gần một nửa.
- **Level 3:** Bao nhiêu cặp làm một tỷ lệ thắng 55 phần trăm thành thật? Expected: đủ để khoảng loại trừ một nửa; dùng một khoảng Wilson hoặc bootstrap, và mong đợi cần hàng trăm cặp.

## Wrong answers

- "Bộ chấm ngẫu nhiên, vì vậy dùng một bộ chấm khác." Thiên lệch vị trí có hệ thống, không ngẫu nhiên; một bộ chấm khác cũng có nó, và quy trình là cách sửa.
- "Luôn đặt baseline trước." Điều đó cố định thiên lệch theo một hướng và che giấu nó; chạy cả hai thứ tự.
- "So sánh theo cặp chỉ dành cho người chấm." Các bộ chấm chạy theo cặp tốt khi thứ tự được ngẫu nhiên hóa và cả hai thứ tự được chấm.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) nêu thiên lệch vị trí và quy tắc cả hai thứ tự, và [bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) giải thích tại sao so sánh theo cặp tránh hiệu chuẩn thang.
