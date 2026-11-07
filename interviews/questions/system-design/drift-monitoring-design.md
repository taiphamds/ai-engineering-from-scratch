---
id: drift-monitoring-design
title: Design monitoring for a payment risk model
card: system-design
kind: design
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design]
tags: [monitoring, drift, psi, alerting]
minutes: 15
lessons: [phases/02-ml-fundamentals/20-model-monitoring-and-drift]
manuals: []
practice: []
cheatsheet: [ml-system-design, ml-evaluation-metrics]
related: [system-design/concept-drift-blind-spot, system-design/fraud-check-100ms]
updated: 2026-11-03
---

Một mô hình rủi ro thanh toán chấm điểm mọi giao dịch. Các nhãn đến vài tuần sau dưới dạng chargeback. Thiết kế việc giám sát: bạn theo dõi gì, so sánh các cửa sổ bằng cách nào, tính những thống kê nào, và giữ tỷ lệ cảnh báo đủ thấp để mọi người đọc các cảnh báo bằng cách nào.

## Short answer

Giám sát bốn lớp: sức khỏe hệ thống, các phân phối đầu vào, các phân phối dự đoán, và các kết quả một khi các nhãn đến. So sánh một cửa sổ tham chiếu cố định với các cửa sổ hiện tại trượt, bằng Population Stability Index và thống kê KS hai mẫu cho các feature số và một kiểm định chi-square với Cram�r's V cho các feature phân loại. Chỉ cảnh báo khi cả một p-value đã hiệu chỉnh và một kích thước hiệu ứng đều vượt ngưỡng và điều kiện kéo dài qua các cửa sổ liên tiếp, và gửi các cảnh báo nhẹ tới một dashboard thay vì tới một người.

## Full answer

### Four layers

| Lớp | Các tín hiệu | Khả dụng | Câu hỏi |
|---|---|---|---|
| Sức khỏe hệ thống | độ trễ p50 và p99, tỷ lệ lỗi, thông lượng | Ngay lập tức | Dịch vụ có trả lời không? |
| Đầu vào | Các phân phối feature, tỷ lệ thiếu, schema, các danh mục mới | Ngay lập tức | Dữ liệu trực tiếp có trông như dữ liệu huấn luyện không? |
| Dự đoán | Phân phối điểm, tỷ lệ dương, tỷ lệ câu trả lời mặc định | Ngay lập tức | Mô hình có hành xử như trước không? |
| Kết quả | Độ chính xác, precision, hiệu chuẩn, chỉ số kinh doanh | Sau độ trễ nhãn | Mô hình còn đúng không? |

Chỉ lớp cuối đo tính đúng đắn và nó đến muộn, nên ba lớp đầu là cảnh báo sớm.

### Windows

Tham chiếu là dữ liệu huấn luyện hoặc một giai đoạn production được kiểm tra tay, cố định cho đến huấn luyện lại. Cửa sổ hiện tại là N sự kiện cuối hoặc T giờ cuối, trượt theo một bước nhỏ hơn kích thước. Một cửa sổ nhỏ phản ứng nhanh và chấm nhiễu là drift; một cửa sổ lớn ổn định nhưng muộn. Tính mùa vụ phá các cửa sổ ngây thơ, nên tham chiếu bao phủ một chu kỳ đầy đủ hoặc mỗi cửa sổ được so với cùng giai đoạn của một chu kỳ trước. Demo của bài học dùng các cửa sổ 500 sự kiện di chuyển theo 250, với các nhãn muộn 500 sự kiện.

### Statistics

- PSI trên mười bin thập phân vị tham chiếu, với các tỷ lệ được chặn về một giá trị nhỏ để không bin nào trống; các dải quy ước đọc dưới 0.1 là ổn định và trên 0.25 là một dịch chuyển đáng kể, với lưu ý PSI tăng theo số bin và giảm theo kích thước mẫu.
- Thống kê KS D làm kích thước hiệu ứng cho các feature số, với p-value từ kích thước mẫu hiệu dụng; với các mẫu lớn, chỉ p-value đánh dấu các khoảng cách không ai quan tâm.
- Chi-square với Cram�r's V cho các feature phân loại, cũng phản ứng với một danh mục chỉ xuất hiện trong cửa sổ hiện tại. Với ít sự kiện trong một ô, p-value không đáng tin cậy, nên gộp các danh mục hiếm vào một bin trước kiểm định.

### Alert policy

Với 50 feature được kiểm tra mỗi giờ ở alpha 0.05, khoảng 60 báo động giả một ngày đến khi không gì thay đổi. Bốn quy tắc giữ tỷ lệ hữu ích: hiệu chỉnh cho nhiều kiểm định, để một alpha họ 0.01 trên hai kiểm định cho mỗi kiểm định 0.005; yêu cầu một kích thước hiệu ứng; yêu cầu tính dai dẳng qua các cửa sổ drift liên tiếp, hai trong demo; và tách các cảnh báo nhẹ dashboard khỏi các cảnh báo tới một người.

### What retraining does

Covariate drift với độ chính xác ổn định thường không cần hành động. Covariate drift vào các vùng có ít dữ liệu đòi huấn luyện lại trên dữ liệu gần đây. Prior drift đòi hiệu chuẩn lại hoặc một ngưỡng mới. Concept drift cần nhãn mới trước, vì huấn luyện lại trên các nhãn cũ dạy lại khái niệm cũ.

## Follow-ups

- **Level 2:** Tại sao cố định cửa sổ tham chiếu thay vì cũng trượt nó? Expected: một tham chiếu trượt đi theo drift và giấu nó; tham chiếu chỉ thay đổi khi huấn luyện lại.
- **Level 2:** Một cửa sổ sạch cho thấy một p-value chi-square rất nhỏ. Tại sao nó là một cảnh báo nhẹ chứ không phải một cảnh báo? Expected: kích thước hiệu ứng dưới ngưỡng, nên chính sách ghi nhật ký một cảnh báo nhẹ; chỉ p-value là không đủ.
- **Level 3:** Các nhãn đến muộn 500 sự kiện. Bộ giám sát kết quả xử lý điều đó bằng cách nào? Expected: nó nối các nhãn khi chúng đến và tính các chỉ số trên phần được gán nhãn, luôn nhìn về quá khứ xa như vậy.
- **Level 3:** Drift nào giữ vô hình với toàn bộ thiết kế này ngoại trừ lớp cuối? Expected: concept drift, nơi các đầu vào không thay đổi và chỉ các kết quả bộc lộ quan hệ mới.

## Wrong answers

- "Cảnh báo trên bất kỳ p-value nào dưới 0.05." Với nhiều feature và các kiểm tra hàng giờ, đó là hàng chục báo động giả một ngày và mọi người ngừng đọc.
- "Theo dõi độ chính xác; đó là chỉ số duy nhất quan trọng." Độ chính xác đến sau độ trễ nhãn; các bộ giám sát đầu vào và dự đoán cho cảnh báo sớm.
- "Huấn luyện lại theo lịch và bỏ giám sát." Một lịch huấn luyện lại khi không gì thay đổi và chờ khi có điều thay đổi.

## Taught in

[Bài học giám sát mô hình](../../../phases/02-ml-fundamentals/20-model-monitoring-and-drift/) cung cấp bốn lớp, các cửa sổ, ba thống kê và chính sách cảnh báo.
