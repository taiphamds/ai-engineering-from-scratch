---
id: nan-scores-raise-the-mean
title: The judge failed to parse and the mean went up
card: evaluation
kind: debug
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [debugging, design-review]
tags: [llm-as-judge, parse-failure, nan, aggregation]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/mean-hides-the-tail]
updated: 2026-11-03
---

Bộ chấm của bạn trả về một đối tượng JSON có điểm cho mỗi trường hợp. Pipeline phân tích nó, và tính trung thành trung bình tăng từ tuần này sang tuần tiếp theo mà không thay đổi sản phẩm. Các log cho thấy đầu ra của bộ chấm không phân tích cú pháp được trên một tỷ lệ trường hợp tăng dần. Giải thích mức tăng và sửa pipeline.

## Short answer

Một lỗi phân tích cú pháp trở thành một điểm thiếu, và phần tổng hợp âm thầm bỏ các điểm thiếu. Các trường hợp không phân tích cú pháp được thường là các đầu ra tệ nhất, vì vậy bỏ chúng nâng trung bình. Bắt thất bại tường minh, ghi lại nó như một kết quả riêng, tính nó vào điểm hoặc báo cáo nó cạnh trung bình, và cảnh báo khi tỷ lệ thất bại tăng.

## Full answer

### The mechanism

JSON xấu từ bộ chấm trở thành một giá trị không phải số. Một trung bình trên một cột có các giá trị như vậy loại trừ chúng. Bài học nêu đây là thất bại âm thầm thứ hai của một bộ chấm và yêu cầu việc phân tích thất bại rõ ràng với trạng thái riêng.

### Why the exclusion is biased

Bộ chấm phá định dạng thường xuyên nhất trên các đầu ra dài, lạ hoặc bị từ chối. Những đầu ra đó cũng là các đầu ra điểm thấp. Vì vậy việc loại trừ bỏ đáy phân phối, và trung bình tăng vì một lý do không liên quan đến chất lượng.

### The fix

1. Bọc việc phân tích trong một phép kiểm tra tường minh và cho mọi trường hợp một trạng thái: đã chấm, phân tích thất bại, lỗi bộ chấm.
2. Báo cáo tỷ lệ phân tích được với mọi lần chạy. Một tỷ lệ thất bại tăng làm lần chạy thất bại.
3. Công bố trung bình theo hai cách: với các thất bại tính là không và với các thất bại bị loại trừ. Nếu hai giá trị khác nhau nhiều, các thất bại không ngẫu nhiên.
4. Cho phép một lần retry với một prompt sửa chữa, ghi lại rằng một lần retry đã xảy ra, và giới hạn retry.
5. Lưu văn bản bộ chấm thô để một người rà soát có thể đọc điều bị hỏng.

### Verify the diagnosis

Tính lại trung bình tuần trước với các thất bại tính là không. Nếu mức tăng biến mất, bạn có nguyên nhân.

## Follow-ups

- **Level 3:** Tại sao các trường hợp thất bại không phải một mẫu ngẫu nhiên? Expected: bộ chấm phá định dạng nhiều nhất trên các đầu ra dài, lạ hoặc bị từ chối, cũng là những đầu ra điểm thấp.
- **Level 3:** Bạn chấm một lần phân tích thất bại là không hay bỏ nó? Expected: cả hai, với tỷ lệ phân tích được; một cổng nên coi một tỷ lệ thất bại tăng là một lần chạy thất bại.
- **Level 4:** Bạn thiết kế đầu ra bộ chấm như thế nào để điều này không thể xảy ra âm thầm lần nữa? Expected: một schema nghiêm ngặt, một bộ xác thực từ chối bất cứ thứ gì khác, một trường trạng thái mỗi trường hợp, và một metric lỗi phân tích cú pháp cấp lần chạy có cảnh báo.

## Wrong answers

- "Trung bình tăng, vì vậy chất lượng tăng." Không có gì trong sản phẩm thay đổi; mẫu số thay đổi.
- "Retry cho đến khi phân tích được." Retry không có bản ghi che giấu thất bại và có thể thay đổi điểm; ghi lại mọi lần retry và giới hạn chúng.
- "Loại trừ các thất bại, chúng là lỗi bộ chấm." Việc loại trừ thiên về các đầu ra xấu; con số sản phẩm sai bất kể nguyên nhân.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) liệt kê các lỗi phân tích JSON là một thất bại bộ chấm âm thầm và yêu cầu một chế độ thất bại tường minh.
