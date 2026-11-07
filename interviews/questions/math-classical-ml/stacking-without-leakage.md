---
id: stacking-without-leakage
title: Build a stacking ensemble whose meta-learner never cheats
card: math-classical-ml
kind: take-home
level: 4
roles: [ai-data-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [take-home, system-design]
tags: [ensembles, stacking, cross-validation, leakage, meta-learner]
minutes: 25
lessons: [phases/02-ml-fundamentals/11-ensemble-methods, phases/02-ml-fundamentals/09-model-evaluation]
manuals: []
practice: []
cheatsheet: [ml-model-comparison]
related: [math-classical-ml/bag-or-boost-the-base-model, math-classical-ml/scaler-fit-before-split]
updated: 2026-11-03
---

Bài làm ở nhà. Xây dựng một stacking ensemble trên một tập dữ liệu phân loại dạng bảng với ba mô hình cơ sở từ các họ khác nhau và một meta-learner hồi quy logistic. Bàn giao mã huấn luyện, một so sánh với mỗi mô hình cơ sở riêng lẻ, và một lập luận bằng văn bản rằng meta-learner chưa bao giờ được huấn luyện trên một dự đoán tạo cho một hàng mà mô hình cơ sở đã thấy. Mô tả cách bạn cấu trúc công việc và những gì bạn kiểm tra trước khi nộp.

## Short answer

Sinh các meta-feature bằng k-fold cross-validation: với mỗi fold, khớp các mô hình cơ sở trên các fold khác và dự đoán fold giữ lại, để mọi hàng huấn luyện nhận các dự đoán cơ sở từ những mô hình không huấn luyện trên nó. Khớp meta-learner trên những dự đoán out-of-fold đó, rồi khớp lại các mô hình cơ sở trên tất cả hàng huấn luyện cho lúc kiểm thử. So sánh trên một tập kiểm thử mà không cấp nào chạm đến, và báo cáo các mô hình cơ sở và stack cạnh nhau với các độ trải fold.

## Full answer

### Structure

1. **Chia trước.** Giữ riêng một tập kiểm thử trước mọi thứ khác. Làm tất cả tiền xử lý bên trong các fold, chỉ khớp trên phần huấn luyện của mỗi fold.
2. **Các dự đoán out-of-fold.** Với K fold, huấn luyện mỗi mô hình cơ sở K lần. Mỗi hàng trong tập huấn luyện nhận một dự đoán từ một lần chạy không thấy nó. Lưu các xác suất dự đoán, không phải các nhãn cứng, vì các đầu ra mềm mang độ tự tin và soft voting của bài học thắng hard voting vì cùng lý do.
3. **Meta-learner.** Khớp hồi quy logistic trên các xác suất out-of-fold, ba cột mỗi lớp, với các nhãn đúng làm mục tiêu. Nó học mô hình cơ sở nào để tin và ở đâu.
4. **Khớp lại cho lúc kiểm thử.** Khớp mỗi mô hình cơ sở trên tất cả hàng huấn luyện, dự đoán tập kiểm thử, và đưa những dự đoán đó qua meta-learner.
5. **So sánh.** Chấm điểm mỗi mô hình cơ sở riêng lẻ, một trung bình thông thường của ba mô hình, và stack. Báo cáo các trung bình và độ trải cross-validation trên các fold huấn luyện, và một con số kiểm thử cho mỗi mô hình ở cuối.

### The leakage argument

Viết nó thành một bảng: với mỗi hàng huấn luyện, nó thuộc fold nào, và lần chạy mô hình cơ sở nào tạo meta-feature của nó. Mọi meta-feature phải đến từ một lần chạy có các fold huấn luyện loại trừ hàng đó. Nếu bất kỳ mô hình cơ sở nào được khớp trên tất cả hàng huấn luyện rồi dự đoán những hàng đó, các dự đoán là in-sample và quá tốt, và meta-learner học tin mô hình cơ sở overfit nhiều nhất. Bài học nêu quy tắc trong một dòng: không bao giờ huấn luyện các mô hình cơ sở và sinh meta-feature trên cùng dữ liệu.

### Checks before you submit

- Đa dạng: so sánh các lỗi của mô hình cơ sở trên các fold validation. Ba biến thể của một họ thất bại trên cùng các hàng và không cho stack gì. Ví dụ của bài học dùng một forest, một support vector machine và một bộ phân loại tuyến tính.
- Mức tăng trung thực: stack phải thắng mô hình cơ sở tốt nhất nhiều hơn độ trải fold. Bài học đặt stacking ở 1 đến 2 phần trăm độ chính xác cuối cùng, nên một mức tăng nhỏ hoặc nhiễu là kết quả được kỳ vọng, và bài viết nên nói liệu các mô hình bổ sung có đáng giá không.
- Tiền xử lý bên trong các fold, không có phép biến đổi nào được khớp trên toàn bộ bảng.
- Tập kiểm thử xuất hiện một lần, trong bảng cuối cùng.

## Follow-ups

- **Level 3:** Tại sao dùng các dự đoán mềm thay vì nhãn cứng làm meta-feature? Expected: các xác suất mang độ tự tin, nên meta-learner có thể đặt trọng số một mô hình cơ sở chắc chắn cao hơn một mô hình không chắc.
- **Level 4:** Stack thắng mọi mô hình cơ sở trên các fold huấn luyện nhưng không trên tập kiểm thử. Kiểm tra đầu tiên là gì? Expected: liệu bất kỳ meta-feature nào đến từ một mô hình cơ sở đã thấy hàng đó; một dự đoán in-sample dạy meta-learner tin một mô hình overfit.
- **Level 4:** Bạn cho thấy các mô hình cơ sở đủ đa dạng để giúp ích như thế nào? Expected: so sánh các lỗi của chúng trên các fold validation; các mô hình thất bại trên cùng các hàng không thêm gì.
- **Level 4:** Khi nào bạn sẽ không triển khai stack? Expected: khi mức tăng so với mô hình cơ sở tốt nhất nằm trong độ trải fold, hoặc dưới chi phí chạy ba mô hình.

## Wrong answers

- "Khớp các mô hình cơ sở trên tất cả hàng huấn luyện, dự đoán những hàng đó, và huấn luyện meta-learner trên đó." Những dự đoán đó là in-sample và quá tốt; meta-learner học tin mô hình cơ sở overfit nhiều nhất.
- "Dùng ba random forest với các seed khác nhau." Cùng họ, các lỗi tương tự; stack cần các mô hình thất bại trên các hàng khác nhau.
- "Đặt các trọng số của meta-learner bằng tay." Mục đích của stacking là học mô hình cơ sở nào để tin ở đâu; các trọng số cố định là một voting ensemble.

## Taught in

[Bài học các phương pháp ensemble](../../../phases/02-ml-fundamentals/11-ensemble-methods/) mô tả stacking và quy tắc leakage của nó, và [bài học đánh giá mô hình](../../../phases/02-ml-fundamentals/09-model-evaluation/) xây dựng các fold đằng sau các meta-feature.
