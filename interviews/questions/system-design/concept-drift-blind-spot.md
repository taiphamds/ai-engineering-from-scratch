---
id: concept-drift-blind-spot
title: Accuracy fell and every input monitor stayed green
card: system-design
kind: debug
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [system-design, debugging]
tags: [concept-drift, monitoring, label-delay, retraining]
minutes: 12
lessons: [phases/02-ml-fundamentals/20-model-monitoring-and-drift]
manuals: []
practice: []
cheatsheet: [ml-system-design, ml-evaluation-metrics]
related: [system-design/drift-monitoring-design, system-design/fraud-check-100ms]
updated: 2026-11-03
---

Độ chính xác của một mô hình thanh toán, được đo khi các nhãn đến, giảm từ 0.946 xuống giữa 0.76 và 0.79. Các bộ giám sát feature và phân phối điểm giữ im lặng suốt thời gian. Nhóm đề xuất huấn luyện lại trên quý cuối của dữ liệu được gán nhãn tối nay. Điều gì đã xảy ra, tại sao các bộ giám sát bỏ lỡ, và đề xuất có đúng không?

## Short answer

Quan hệ giữa các đầu vào và nhãn thay đổi trong khi chính các đầu vào không thay đổi, đó là concept drift. Các bộ giám sát đầu vào và dự đoán so sánh các phân phối feature và điểm, nên một thay đổi trong phân phối nhãn có điều kiện vô hình với chúng, và chỉ bộ giám sát kết quả có thể thấy nó, sau độ trễ nhãn. Huấn luyện lại tối nay trên quý cuối là nước đi sai: phần lớn các nhãn đó vẫn mô tả quan hệ cũ, nên mô hình học lại nó; thu thập các nhãn từ sau thay đổi trước, rồi huấn luyện lại trên chúng.

## Full answer

### Three kinds of drift

| Drift | Điều gì thay đổi | Bộ giám sát nào thấy nó |
|---|---|---|
| Covariate | Phân phối đầu vào | Các bộ giám sát đầu vào |
| Prior | Tỷ lệ nhãn | Các bộ giám sát dự đoán và kết quả |
| Concept | Nhãn khi biết đầu vào | Chỉ các bộ giám sát kết quả |

Covariate drift dịch chuyển các feature và thường để độ chính xác nguyên. Prior drift dịch chuyển tỷ lệ dương. Concept drift thay đổi câu trả lời nào đúng cho cùng đầu vào, nên không gì phía trước nhãn dịch chuyển.

### What the demo shows

Luồng của bài học đưa vào cả hai loại. Trong đoạn covariate, PSI và thống kê KS cảnh báo trên feature số tiền trong khi độ chính xác giữ giữa 0.89 và 0.95. Trong đoạn concept, các đầu vào giống hệt tham chiếu, cả hai bộ giám sát đầu vào giữ ở các giá trị sạch, và độ chính xác giảm từ 0.946 xuống khoảng 0.76 đến 0.79. Cảnh báo độ chính xác kích hoạt 1000 sự kiện sau thay đổi, và độ trễ nhãn 500 sự kiện chiếm một nửa độ trễ đó.

### Why the lag

Bộ giám sát kết quả luôn nhìn về quá khứ một độ trễ nhãn, vì nó chỉ có thể chấm các sự kiện có kết quả đã đến. Quy tắc tính dai dẳng, yêu cầu các cửa sổ drift liên tiếp trước một cảnh báo, thêm phần còn lại. Cả hai có chủ đích: không có chúng, tỷ lệ cảnh báo không dùng được.

### Why the retraining proposal is wrong

Huấn luyện lại giải quyết covariate drift vào các vùng có ít dữ liệu. Concept drift cần các nhãn từ sau thay đổi. Một quý nhãn mà thay đổi xảy ra muộn trong cửa sổ dạy phần lớn khái niệm cũ. Trình tự đúng là: xác nhận điểm thay đổi từ bộ giám sát kết quả, thu đủ nhãn sau nó, huấn luyện lại trên chúng, kiểm thử trên lát được gán nhãn gần nhất, rollout qua shadow và canary, và đặt lại cửa sổ tham chiếu về dữ liệu huấn luyện mới.

### What to do tonight

Chuyển thêm các trường hợp tới review nếu tác động kinh doanh lớn, như một biện pháp tạm thời trong khi các nhãn từ sau thay đổi đến. Một dịch chuyển ngưỡng là hành động của bài học cho prior drift. Với concept drift, nó chỉ giúp khi ranh giới di chuyển trên cùng điểm, và nó không thể khôi phục một thứ tự rủi ro đã thay đổi. Giữ mô hình; chỉ thay nó bằng các nhãn mô tả quan hệ mới.

## Follow-ups

- **Level 3:** Bạn có thể thêm tín hiệu nào phản ứng trước các nhãn? Expected: không có cho concept drift thuần; một proxy như kết quả hàng đợi review hoặc một nhãn một phần nhanh hơn là tín hiệu sớm hơn duy nhất.
- **Level 3:** Một bộ ước lượng hiệu năng dùng các xác suất dự đoán hành xử thế nào ở đây? Expected: nó giả định hiệu chuẩn vẫn giữ vững, nên nó bỏ lỡ concept drift; bài học lưu ý các bộ ước lượng như vậy xử lý covariate shift chứ không phải concept drift.
- **Level 4:** Bạn chọn bao nhiêu nhãn sau thay đổi là đủ bằng cách nào? Expected: đủ để kiểm thử mô hình được huấn luyện lại trên một lát giữ lại gần đây với một dung sai bạn đặt trước; kiểm thử trên các nhãn gần đây là cổng, không phải một số đếm.
- **Level 4:** Sau huấn luyện lại, các bộ giám sát đầu vào bắt đầu cảnh báo trên tham chiếu sạch. Tại sao? Expected: cửa sổ tham chiếu chưa được đặt lại về dữ liệu huấn luyện mới, nên nó so sánh lưu lượng trực tiếp với một phân phối cũ.

## Wrong answers

- "Các bộ giám sát feature hỏng; không gì thay đổi trong các đầu vào." Chúng hoạt động như thiết kế; các đầu vào không thay đổi, các nhãn có thay đổi.
- "Huấn luyện lại trên mọi thứ để mô hình thấy mẫu mới." Các nhãn cũ nhiều hơn các nhãn mới và mô hình học lại quan hệ cũ.
- "Rút ngắn các cửa sổ để bắt nó nhanh hơn." Các cửa sổ nhỏ hơn thêm nhiễu và báo động giả; độ trễ ở đây đến từ độ trễ nhãn, điều các cửa sổ không thể loại bỏ.

## Taught in

[Bài học giám sát mô hình](../../../phases/02-ml-fundamentals/20-model-monitoring-and-drift/) chạy luồng với covariate drift và concept drift được đưa vào và cho thấy bộ giám sát nào phản ứng với mỗi loại.
