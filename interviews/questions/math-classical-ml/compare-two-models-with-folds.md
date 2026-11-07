---
id: compare-two-models-with-folds
title: Decide whether a small win on one split is real
card: math-classical-ml
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [cross-validation, model-comparison, paired-test, evaluation]
minutes: 15
lessons: [phases/02-ml-fundamentals/09-model-evaluation]
manuals: []
practice: []
cheatsheet: [classical-ml]
related: [math-classical-ml/scaler-fit-before-split, math-classical-ml/threshold-precision-or-recall]
updated: 2026-11-03
---

Hai biến thể của một bộ phân loại khác nhau một siêu tham số. Trên một phần chia được giữ lại, biến thể B thắng biến thể A với một khoảng cách nhỏ, và nhóm muốn triển khai B. Thiết kế đánh giá quyết định liệu B tốt hơn không, và nói bạn sẽ báo cáo gì.

## Short answer

Một phần chia cho một con số nhiễu, nên khoảng cách có thể là ngẫu nhiên. Chạy k-fold cross-validation với cùng các fold cho cả hai biến thể, giữ các chênh lệch theo fold, và kiểm tra liệu trung bình của chúng có xa không bằng một thống kê t ghép cặp. Báo cáo trung bình và độ trải điểm fold của mỗi biến thể, chênh lệch trung bình và thống kê, và giữ tập kiểm thử ngoài so sánh.

## Full answer

### Why one split is not enough

Một lần chia phụ thuộc vào những hàng nào rơi vào mỗi phần. Một seed khác cho một khoảng cách khác, và không có gì trong một con số nói dao động đó lớn bao nhiêu. Các fold cho thấy độ trải.

### The design

1. Giữ tập kiểm thử riêng trước mọi thứ khác. Nó dành cho báo cáo cuối cùng, một lần.
2. Xây dựng K fold trên dữ liệu huấn luyện. Bài học dùng K bằng 5 và nêu 5 hoặc 10 là các lựa chọn tiêu chuẩn. Phân tầng khi các lớp mất cân bằng, để mọi fold giữ tỷ lệ lớp.
3. Huấn luyện và chấm điểm cả hai biến thể trên cùng các fold, để hai điểm trong mỗi fold là một cặp. Ghép cặp loại bỏ biến thiên giữa các fold khỏi chênh lệch.
4. Tính các chênh lệch theo fold, trung bình và độ lệch chuẩn của chúng, và thống kê t ghép cặp: chênh lệch trung bình chia cho độ lệch chuẩn chia căn bậc hai của K. Ngưỡng của bài học cho 5 fold là một thống kê t có độ lớn vượt 2.78, cho tính có ý nghĩa ở p dưới 0.05 với 4 bậc tự do.
5. Nếu siêu tham số được chọn trên các fold này, bọc toàn bộ trong cross-validation lồng nhau: một vòng trong chọn giá trị, một vòng ngoài đo nó.
6. Lặp lại với vài seed fold và kiểm tra kết luận vẫn đúng.

### What to report

- Điểm fold trung bình của mỗi biến thể với độ trải của nó.
- Chênh lệch trung bình, thống kê và số fold.
- Kích thước hiệu ứng theo ý nghĩa sản phẩm, để nhóm có thể cân nhắc nó với chi phí thay đổi.
- Một con số tập kiểm thử cho biến thể bạn triển khai, được đo một lần ở cuối.

### Caveats to say out loud

Các fold chia sẻ các hàng huấn luyện, nên t-test là một xấp xỉ, không phải một mẫu độc lập sạch. Một khác biệt có ý nghĩa vẫn có thể quá nhỏ để quan trọng. Và một so sánh thực hiện trên tập kiểm thử biến nó thành tập validation, chính là sai lầm mà thiết kế được xây dựng để ngăn.

## Follow-ups

- **Level 3:** Tại sao cả hai biến thể phải dùng cùng các fold? Expected: ghép cặp loại bỏ biến thiên giữa các fold khỏi chênh lệch, nên kiểm thử chỉ hỏi về các biến thể.
- **Level 4:** Một t tuyệt đối trên 2.78 có nghĩa gì với năm fold? Expected: với 4 bậc tự do, chênh lệch trung bình ít khả năng bằng không ở mức 5 phần trăm, nên khoảng cách có lẽ là có thật.
- **Level 4:** Bạn tránh tinh chỉnh trên các fold bạn báo cáo như thế nào? Expected: cross-validation lồng nhau; vòng trong chọn siêu tham số và vòng ngoài đo nó, nên các fold được báo cáo chưa bao giờ thấy lựa chọn.
- **Level 4:** Khác biệt có ý nghĩa và rất nhỏ. Bạn có triển khai B không? Expected: cân nhắc kích thước hiệu ứng với chi phí thay đổi; tính có ý nghĩa nói dấu là đáng tin cậy, không phải nó quan trọng.

## Wrong answers

- "Một phần chia được giữ lại là đủ nếu nó lớn." Một phần chia đơn vẫn phụ thuộc vào những hàng nào rơi vào đâu; các fold cho thấy độ trải.
- "So sánh hai điểm trung bình và chọn điểm cao hơn." Không có ghép cặp theo fold và độ trải, một khoảng cách nhỏ hơn nhiễu fold trông như một chiến thắng.
- "Dùng tập kiểm thử để phân thắng bại." Tập kiểm thử chỉ dùng một lần; một lựa chọn thực hiện trên nó biến nó thành tập validation.

## Taught in

[Bài học đánh giá mô hình](../../../phases/02-ml-fundamentals/09-model-evaluation/) xây dựng k-fold và stratified k-fold từ đầu và kết thúc bằng một so sánh ghép cặp hai mô hình.
