---
id: threshold-precision-or-recall
title: Pick a threshold when 95 percent of the data is negative
card: math-classical-ml
kind: tradeoff
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-breadth, screen]
tags: [classification, precision, recall, threshold, imbalance]
minutes: 8
lessons: [phases/02-ml-fundamentals/03-logistic-regression, phases/02-ml-fundamentals/09-model-evaluation]
manuals: []
practice: [logistic-regression]
cheatsheet: [classical-ml]
related: [math-classical-ml/logistic-loss-on-separable-data, math-classical-ml/negative-r-squared]
updated: 2026-11-03
---

Một bộ phân loại nhị phân báo cáo độ chính xác 95 phần trăm trên một tập dữ liệu mà 95 phần trăm các hàng âm tính. Chủ sản phẩm hài lòng. Bạn thì không. Bạn yêu cầu những con số nào, và bạn chọn ngưỡng quyết định cho sản phẩm này như thế nào?

## Short answer

Một mô hình luôn nói âm tính cũng đạt độ chính xác đó, nên con số không chứng minh gì. Yêu cầu confusion matrix, rồi precision, recall và F1 ở ngưỡng hiện tại, và AUC-ROC cho thứ hạng. Di chuyển ngưỡng từ mặc định 0.5 về phía lỗi khiến sản phẩm tốn kém hơn: tăng nó khi một false positive đắt, giảm nó khi một positive bị bỏ lỡ đắt.

## Full answer

### The four counts

| | Dự đoán dương tính | Dự đoán âm tính |
|---|---|---|
| Thực sự dương tính | true positive | false negative |
| Thực sự âm tính | false positive | true negative |

Precision là số true positive trên tất cả dự đoán dương tính. Recall là số true positive trên tất cả dương tính thực. F1 là trung bình điều hòa của chúng. Độ chính xác trộn hai loại lỗi với các kích thước lớp, nên trên dữ liệu mất cân bằng nó theo lớp đa số.

### What the threshold does

Mô hình xuất một xác suất. Quyết định so sánh nó với một ngưỡng. Một ngưỡng cao hơn dự đoán dương tính ít thường xuyên hơn: precision tăng và recall giảm. Một ngưỡng thấp hơn làm ngược lại. Bài học về hồi quy logistic quét các ngưỡng 0.3, 0.4, 0.5, 0.6 và 0.7 trên một mô hình và in bốn chỉ số ở mỗi ngưỡng, là bảng để cho chủ sản phẩm xem.

### Which way to move

- Khi một false positive tốn kém hơn, chẳng hạn một bộ lọc chặn một tin nhắn thật, ưu tiên precision và tăng ngưỡng.
- Khi một false negative tốn kém hơn, chẳng hạn một lần sàng lọc bỏ lỡ một bệnh, ưu tiên recall và giảm ngưỡng.
- Khi không loại nào chi phối rõ ràng, báo cáo F1, và cho thấy precision và recall phía sau nó.

### The threshold-free view

AUC-ROC vẽ tỷ lệ true positive theo tỷ lệ false positive ở mọi ngưỡng. Nó đo mô hình xếp các positive trên các negative tốt thế nào: 0.5 là một thứ hạng ngẫu nhiên, 1.0 là một thứ hạng hoàn hảo. Dùng nó để so sánh các mô hình, rồi chọn ngưỡng từ các chi phí của sản phẩm.

## Follow-ups

- **Level 2:** Mô hình luôn âm tính nhận precision và recall nào? Expected: recall là 0, vì nó không tìm thấy positive, và precision không xác định hoặc được đặt thành 0 vì nó không dự đoán gì.
- **Level 2:** Tại sao F1 là một trung bình điều hòa thay vì một trung bình số học? Expected: trung bình điều hòa bị kéo về giá trị nhỏ hơn, nên một mô hình không thể giấu recall gần không sau precision cao.
- **Level 3:** Bạn giữ lựa chọn ngưỡng trung thực như thế nào? Expected: chọn nó trên tập validation, không phải tập kiểm thử, và báo cáo các chỉ số kiểm thử ở ngưỡng cố định đó một lần.
- **Level 3:** Khi nào AUC-ROC là bản tóm tắt sai? Expected: khi lớp dương tính hiếm và sản phẩm quan tâm đến precision của các dự đoán hàng đầu; một đường cong precision-recall cho thấy phần đó của bức tranh.

## Wrong answers

- "Độ chính xác là 95 phần trăm, nên mô hình tốt." Mô hình luôn âm tính nhận cùng con số. Độ chính xác che giấu lớp thiểu số.
- "Giữ ngưỡng ở 0.5 vì đó là nơi sigmoid đi qua." Mặc định chỉ là điểm mô hình không chắc. Các chi phí của sản phẩm quyết định điểm cắt.
- "Chọn ngưỡng cho F1 kiểm thử tốt nhất." Điều đó khớp tập kiểm thử. Chọn nó trên dữ liệu validation và báo cáo điểm kiểm thử một lần.

## Taught in

[Bài học hồi quy logistic](../../../phases/02-ml-fundamentals/03-logistic-regression/) xây dựng các chỉ số và quét ngưỡng, và [bài học đánh giá mô hình](../../../phases/02-ml-fundamentals/09-model-evaluation/) thêm AUC-ROC và ví dụ mất cân bằng.
