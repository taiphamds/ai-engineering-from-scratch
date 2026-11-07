---
id: logistic-loss-on-separable-data
title: A logistic regression whose weights never stop growing
card: math-classical-ml
kind: concept
level: 3
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, debugging]
tags: [logistic-regression, cross-entropy, convexity, regularization]
minutes: 12
lessons: [phases/02-ml-fundamentals/03-logistic-regression, phases/02-ml-fundamentals/02-linear-regression]
manuals: []
practice: [logistic-regression]
cheatsheet: [classical-ml]
related: [math-classical-ml/threshold-precision-or-recall, math-classical-ml/cross-entropy-is-kl-plus-entropy]
updated: 2026-11-03
---

Bạn khớp một hồi quy logistic bằng gradient descent trên một tập dữ liệu nhỏ mà một đường thẳng tách hai lớp không có lỗi. Loss giảm ở mọi epoch, trọng số tăng ở mọi epoch, và lần chạy không bao giờ ổn định. Một đồng nghiệp đề xuất một loss sai số bình phương thay vào đó, vì nó có một đáy rõ ràng. Điều gì đang xảy ra, và bạn làm gì?

## Short answer

Trên dữ liệu tách được, log loss không có cực tiểu hữu hạn: tăng tỷ lệ trọng số đẩy mọi xác suất gần nhãn của nó hơn và loss gần không hơn, nên descent đi mãi. Sai số bình phương qua một sigmoid là một đánh đổi tệ hơn, vì bề mặt chi phí đó không lồi và có các vùng phẳng nơi gradient chết. Giữ log loss và thêm một hình phạt L2, cho một cực tiểu hữu hạn, duy nhất.

## Full answer

### Why the log loss is the right loss

Mô hình là một điểm tuyến tính z = w x + b đi qua một sigmoid, và binary cross-entropy là âm trung bình của y log p cộng (1 - y) log (1 - p). Với mô hình này, loss lồi, nên mọi cực tiểu cục bộ là cực tiểu toàn cục và gradient descent không thể dừng trong một thung lũng xấu. Gradient có cùng dạng gọn như trong hồi quy tuyến tính, trung bình của (p - y) nhân x, với p là đầu ra sigmoid thay vì điểm thô.

### What separable data does to it

Khi một đường thẳng phân loại đúng mọi điểm, nhân w và b với một hằng số trên 1 giữ nguyên đường thẳng và đưa mọi xác suất về phía 0 hoặc 1. Mỗi bước như vậy giảm loss, nên không có w hữu hạn là điểm cực tiểu. Trong lần chạy bạn thấy loss giảm, trọng số tăng, xác suất bão hòa, và việc chặn sigmoid trong mã bắt đầu quan trọng. Bản thân ranh giới quyết định đã ngừng thay đổi.

### Why squared error does not help

Sai số bình phương trên một đầu ra sigmoid không lồi. Nó có các cực tiểu cục bộ, và nơi sigmoid bão hòa, gradient của nó gần không, nên một dự đoán sai tự tin gần như không nhận sửa đổi. Lý do của bài học để tránh nó cho phân loại chính là hình dạng này.

### The fix

Thêm một hình phạt L2, lambda nhân tổng trọng số bình phương, vào loss. Gradient của nó, hai lambda nhân w, kéo mọi trọng số về phía không ở mỗi bước. Lực kéo tăng theo trọng số và lực kéo của data loss giảm khi các xác suất bão hòa, nên chúng cân bằng ở một điểm hữu hạn, và cực tiểu là duy nhất. Triển khai thư viện trong bài học mặc định áp dụng regularization vì lý do này.

## Follow-ups

- **Level 3:** Tại sao cross-entropy lồi cho mô hình này trong khi sai số bình phương không lồi? Expected: log của sigmoid kết hợp với điểm tuyến tính thành một hàm lồi; bình phương khoảng cách giữa một sigmoid và một nhãn tạo các vùng phẳng và nhiều cực tiểu cục bộ.
- **Level 3:** Ranh giới quyết định làm gì khi trọng số tăng? Expected: đường thẳng w x + b = 0 hầu như không di chuyển; chỉ độ dốc của sigmoid qua nó tăng, nên các dự đoán trở nên quá tự tin.
- **Level 4:** Hình phạt L2 thay đổi mỗi bước gradient như thế nào? Expected: nó thêm một số hạng tỷ lệ với w vào gradient, nên mỗi bước cũng co trọng số, và sự co cân bằng lực kéo về trọng số lớn hơn ở một điểm hữu hạn.
- **Level 4:** Thay vào đó dữ liệu gần tách được. Vấn đề có biến mất không? Expected: một cực tiểu hữu hạn tồn tại, nhưng trọng số lớn và xác suất quá tự tin; hình phạt vẫn giúp hiệu chuẩn, và một validation loss cho thấy điều đó.

## Wrong answers

- "Loss giảm có nghĩa mô hình vẫn cải thiện, cứ để nó chạy." Ranh giới đã ngừng cải thiện; chỉ độ tự tin tăng, đến khi trọng số overflow hoặc mọi xác suất bão hòa.
- "Chuyển sang sai số bình phương để có một cực tiểu xác định rõ." Bề mặt đó không lồi với một đầu ra sigmoid, nên descent có thể dừng ở một cực tiểu cục bộ kém, và gradient biến mất nơi sigmoid bão hòa.
- "Thêm early stopping và coi như đã giải quyết." Dừng sửa thời gian chạy nhưng để trọng số ở bất cứ đâu khi đồng hồ hết giờ; một hình phạt cho một đáp án xác định không phụ thuộc vào số epoch.

## Taught in

[Bài học hồi quy logistic](../../../phases/02-ml-fundamentals/03-logistic-regression/) giải thích tại sao log loss lồi và tại sao dữ liệu tách được không có điểm cực tiểu hữu hạn, và [bài học hồi quy tuyến tính](../../../phases/02-ml-fundamentals/02-linear-regression/) giới thiệu hình phạt L2.
