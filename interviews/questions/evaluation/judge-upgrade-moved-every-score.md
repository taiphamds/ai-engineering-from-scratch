---
id: judge-upgrade-moved-every-score
title: Every metric moved and the product did not
card: evaluation
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [debugging, design-review]
tags: [llm-as-judge, drift, versioning, baseline]
minutes: 7
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust]
updated: 2026-11-03
---

Qua đêm mọi metric trên dashboard đánh giá dịch chuyển vài điểm, tăng cho một số tiêu chí và giảm cho số khác, không có thay đổi prompt và không có thay đổi mô hình trong sản phẩm. Thay đổi được gộp cuối cùng chuyển bộ chấm sang phiên bản mới nhất của mô hình của nó. Điều gì đã xảy ra, và một thay đổi như vậy nên được thực hiện như thế nào?

## Short answer

Bộ chấm là một phần của phép đo, vì vậy một phiên bản bộ chấm mới thay đổi mọi metric cùng lúc trong khi sản phẩm đứng yên. Đóng băng mô hình chấm và phiên bản trong pipeline. Khi bạn nâng cấp, chạy bộ chấm cũ và mới trên cùng baseline song song, hiệu chuẩn bộ chấm mới với tập do con người gán nhãn, và đặt lại baseline trước khi so sánh bất cứ thứ gì mới.

## Full answer

### Why everything moved

Một điểm bộ chấm là một hàm của đầu ra và của bộ chấm. Thay bộ chấm và mọi điểm đã lưu ở một đơn vị khác. Bài học liệt kê sự thay đổi theo phiên bản bộ chấm là một trong ba thất bại âm thầm và yêu cầu bạn đánh dấu bất kỳ pipeline nào nơi một nâng cấp bộ chấm được đưa vào mà không có một đánh giá baseline song song.

### The upgrade protocol

1. Ghim mô hình chấm và phiên bản, và ghi lại cả hai với mọi lần chạy.
2. Trước một lần chuyển, chấm một tập baseline đóng băng bằng bộ chấm cũ và mới.
3. Hiệu chuẩn bộ chấm mới: tương quan Spearman với tập gán nhãn tay từ 0.7 trở lên.
4. Nếu bộ chấm mới hiệu chuẩn tốt hơn, áp dụng nó và chấm lại các baseline đã lưu để lịch sử và các lần chạy mới dùng chung một bộ chấm.
5. Đánh dấu lần chuyển trên mọi biểu đồ.

### Other things that move every score

Một chỉnh sửa tập đánh giá không có thẻ phiên bản. Một thay đổi cách đếm các điểm thiếu. Một lần chạy bỏ một số nhiệm vụ. Gắn thẻ dataset với mọi thay đổi và ghi lại số nhiệm vụ.

## Follow-ups

- **Level 2:** Điều gì khác có thể dịch chuyển mọi điểm mà không có thay đổi sản phẩm? Expected: một chỉnh sửa tập đánh giá không có thẻ phiên bản, hoặc một thay đổi cách đếm các điểm thiếu.
- **Level 2:** Bạn phân biệt một thay đổi bộ chấm với một thoái lui sản phẩm lần tới như thế nào? Expected: metadata lần chạy ghi lại mô hình chấm và phiên bản, vì vậy một phép so sánh metadata trả lời điều đó.
- **Level 3:** Bộ chấm mới tương quan tốt hơn với các nhãn con người. Bạn có áp dụng nó không? Expected: có, nhưng chấm lại baseline đã lưu bằng nó trước để các con số cũ và mới dùng chung một bộ chấm.
- **Level 3:** Bạn phải giữ một đường xu hướng qua lần chuyển. Bằng cách nào? Expected: chấm một tập đóng băng cố định bằng cả hai bộ chấm, công bố độ lệch theo tiêu chí, và đánh dấu lần chuyển trên biểu đồ.

## Wrong answers

- "Bộ chấm mới hơn, điểm cao hơn, phát hành." Sản phẩm không thay đổi; con số thay đổi. Một thay đổi bộ chấm cần một baseline song song.
- "Tự động theo phiên bản bộ chấm mới nhất." Các nâng cấp tự động làm mọi đường xu hướng vô nghĩa; ghim phiên bản.
- "Một phiên bản nhỏ không cần hiệu chuẩn lại." Bất kỳ thay đổi phiên bản nào cũng có thể thay đổi điểm; chạy lại tương quan.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) nêu sự thay đổi qua các phiên bản bộ chấm và yêu cầu một lần chạy cạnh nhau trên một baseline đóng băng trước khi bất kỳ nâng cấp nào được đưa vào.
