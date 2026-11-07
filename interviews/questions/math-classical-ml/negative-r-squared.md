---
id: negative-r-squared
title: An R-squared below zero on the test set
card: math-classical-ml
kind: concept
level: 1
roles: [ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [regression, r-squared, metrics, baseline]
minutes: 5
lessons: [phases/02-ml-fundamentals/02-linear-regression, phases/02-ml-fundamentals/09-model-evaluation]
manuals: []
practice: [gradient-descent-linear-regression]
cheatsheet: [classical-ml]
related: [math-classical-ml/scaler-fit-before-split]
updated: 2026-11-03
---

Một báo cáo hồi quy cho thấy R-squared âm trên tập kiểm thử. Một đồng đội nói mã chỉ số chắc hẳn hỏng, vì R-squared nằm giữa 0 và 1. Bạn trả lời như thế nào?

## Short answer

R-squared là một trừ tỷ số của tổng bình phương phần dư trên tổng bình phương quanh trung bình. Nó bằng 1 cho một phép khớp hoàn hảo, 0 cho một mô hình chỉ dự đoán trung bình, và dưới không khi mô hình làm tệ hơn hằng số đó. Một giá trị âm là một kết quả thật, và nó nói mô hình đã khớp gây hại trên dữ liệu này.

## Full answer

### The formula

```text
R-squared = 1 - SS_res / SS_tot
SS_res = sum of (y_true - y_pred)^2
SS_tot = sum of (y_true - y_mean)^2
```

Tổng bình phương toàn phần là sai số của mô hình đơn giản nhất: dự đoán trung bình mỗi lần. Khi các phần dư của mô hình lớn hơn như vậy, tỷ số trên 1 và chỉ số thành âm. Không có cận dưới.

### How it happens on a test set

Mô hình được khớp trên tập huấn luyện. Trên tập kiểm thử, một mô hình overfit dữ liệu huấn luyện, hoặc dữ liệu có phân phối đã dịch chuyển, có thể cho các dự đoán xa mục tiêu hơn trung bình kiểm thử. Bài học đánh giá in một baseline trung bình cạnh mô hình vì lý do này, và một mô hình phải thắng nó. Baseline đó dùng trung bình của các mục tiêu huấn luyện. Nó đạt điểm gần 0 chỉ khi trung bình kiểm thử gần trung bình huấn luyện, và dưới 0 khi hai trung bình khác nhau.

### What to do with the number

1. So sánh với R-squared huấn luyện. Một giá trị huấn luyện cao và một giá trị kiểm thử âm chỉ đến overfitting hoặc một dịch chuyển giữa hai tập.
2. Kiểm tra phép chia. Một chuỗi thời gian được xáo trộn trước phép chia, hoặc một scaler được khớp trên toàn bộ dữ liệu, cho một cặp số rất khác.
3. Báo cáo RMSE và MAE cạnh nó. RMSE có đơn vị của mục tiêu. R-squared là một tỷ phần phương sai không phụ thuộc thang đo. Mỗi chỉ số trả lời một câu hỏi khác.

## Follow-ups

- **Level 1:** Một mô hình dự đoán trung bình huấn luyện nhận giá trị nào trên tập kiểm thử? Expected: gần 0 khi trung bình kiểm thử gần trung bình huấn luyện, vì tổng phần dư và tổng toàn phần gần giống nhau; dưới 0 khi hai trung bình khác nhau.
- **Level 2:** R-squared huấn luyện cao và giá trị kiểm thử âm. Khoảng cách nói gì? Expected: mô hình khớp dữ liệu huấn luyện và không áp dụng được; nghi ngờ overfitting hoặc một dịch chuyển giữa các tập.
- **Level 2:** Tại sao báo cáo R-squared cạnh RMSE? Expected: RMSE có đơn vị của mục tiêu và cho thấy độ lớn của một sai số điển hình; R-squared là một tỷ phần phương sai và không có đơn vị.
- **Level 3:** Mục tiêu có một đuôi nặng. Bạn kiểm tra thêm gì? Expected: MAE cạnh MSE, vì các sai số bình phương để một vài ngoại lai chi phối cả MSE và R-squared.

## Wrong answers

- "R-squared không thể âm, nên mã có một bug." Công thức không có cận dưới. Một mô hình dự đoán tệ hơn trung bình cho một giá trị âm.
- "Âm có nghĩa độ dốc âm." R-squared so sánh các phần dư với phương sai quanh trung bình. Nó không mang dấu của một độ dốc.
- "Chặn nó ở không trong báo cáo." Điều đó che giấu thực tế rằng trung bình sẽ thắng mô hình.

## Taught in

[Bài học hồi quy tuyến tính](../../../phases/02-ml-fundamentals/02-linear-regression/) định nghĩa R-squared, và [bài học đánh giá mô hình](../../../phases/02-ml-fundamentals/09-model-evaluation/) so sánh một mô hình với baseline trung bình.
