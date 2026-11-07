---
id: peeking-at-an-ab-test
title: Stopping an experiment on the first good morning
card: production-mlops
kind: tradeoff
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, system-design]
tags: [ab-testing, sequential-testing, multiple-comparisons, cuped]
minutes: 12
lessons: [phases/17-infrastructure-and-production/21-ab-testing-llm-features]
manuals: []
practice: []
cheatsheet: [progressive-delivery]
related: [production-mlops/evals-or-ab-test, production-mlops/split-ratio-mismatch]
updated: 2026-11-03
---

Một quản lý sản phẩm đọc dashboard thí nghiệm mỗi sáng và muốn kết thúc kiểm thử vào ngày đầu biến thể có vẻ có ý nghĩa. Hai mươi thí nghiệm khác chạy quý này theo cùng kế hoạch. Điều gì sai với nó, và thay vào đó bạn đưa ra gì?

## Short answer

Một kiểm thử mẫu cố định giả định một lần xem ở một kích thước mẫu chọn trước. Xem mỗi ngày và dừng ở kết quả có ý nghĩa đầu cho nhiễu nhiều cơ hội vượt mốc, nên tỷ lệ dương tính giả tăng. Đưa ra một kiểm thử tuần tự, giữ hợp lệ dưới các lần xem lặp và vẫn cho phép dừng sớm khi có bên thắng rõ. Qua nhiều thí nghiệm, hiệu chỉnh cho nhiều so sánh, và giảm variance bằng dữ liệu trước thí nghiệm để mỗi kiểm thử cần ít mẫu hơn.

## Full answer

### The peeking problem

Phân tích A/B cổ điển giả định kích thước mẫu cố định trước kiểm thử. Mỗi lần xem thêm là một kiểm thử nữa, và dừng ở lần xem có ý nghĩa đầu chọn nhiễu. Kế hoạch của quản lý không sai vì xem thường xuyên. Nó sai vì quyết định dựa trên một thủ tục không được xây cho các quyết định lặp.

### Sequential testing

Các thủ tục tuần tự luôn hợp lệ, như mixture sequential probability ratio test và confidence sequence, kiểm soát tỷ lệ dương tính giả dưới các lần xem lặp. Bạn có thể kiểm tra hằng ngày và dừng sớm ở một bên thắng rõ, và tỷ lệ lỗi giữ như bạn đặt. Bộ mô phỏng của bài học cho thấy các ranh giới cố định và tuần tự cạnh nhau.

### Twenty experiments

Ở độ tin cậy 95 phần trăm, 20 thí nghiệm tạo khoảng một dương tính giả do ngẫu nhiên. Có hai hiệu chỉnh. Bonferroni chia tỷ lệ lỗi cho số kiểm thử, nghiêm ngặt. Benjamini-Hochberg kiểm soát tỷ lệ phát hiện sai và ít bảo thủ hơn. Chọn theo chi phí một lần ra mắt sai đối chiếu chi phí bỏ lỡ một chiến thắng thật.

### Variance reduction

CUPED hồi quy loại variance mà dữ liệu trước thí nghiệm giải thích. Bài học đưa ra một mức giảm điển hình 30 đến 70 phần trăm, tăng kích thước mẫu hiệu dụng mà không tốn lưu lượng. Đó là cách trung thực để rút ngắn một kiểm thử.

### Two more checks

Một kiểm tra không khớp tỷ lệ mẫu bắt một phân nhóm hỏng trước khi bạn đọc bất kỳ kết quả nào. Tính không xác định trong đầu ra mô hình giảm kích thước mẫu hiệu dụng, nên bài học nhân mẫu cần thiết với khoảng 1.3 đến 1.5.

## Follow-ups

- **Level 3:** Bonferroni hay Benjamini-Hochberg cho quý? Expected: Bonferroni khi bất kỳ lần ra mắt sai nào đắt, Benjamini-Hochberg khi bạn chấp nhận một tỷ phần phát hiện sai có kiểm soát để đổi lấy lực kiểm định.
- **Level 3:** CUPED cần gì, và cho gì? Expected: nó cần một chỉ số trước giai đoạn cho mỗi đơn vị, và cho một ước lượng chặt hơn từ cùng lưu lượng.
- **Level 4:** Một mô hình mới cần một mẫu lớn hơn quý cho phép. Bạn thay đổi gì? Expected: chọn một chỉ số chính có variance thấp hơn, áp dụng CUPED, hoặc kéo dài kiểm thử. Không rút ngắn bằng cách dừng sớm dưới một thủ tục mẫu cố định.

## Wrong answers

- "Dừng sớm ổn khi p-value nhỏ." Dưới một kiểm thử mẫu cố định, một p-value nhỏ vào ngày đầu một phần là nhiễu được chọn. Chỉ một thủ tục tuần tự giữ lần dừng đó hợp lệ.
- "Chạy tất cả kiểm thử ở 95 phần trăm và triển khai các bên thắng." Khoảng một bên thắng là một dương tính giả do ngẫu nhiên. Hiệu chỉnh cho nhiều so sánh.
- "Một kiểm thử dài hơn luôn đáng tin cậy hơn." Dài hơn chỉ giúp nếu phân nhóm vững. Kiểm tra tỷ lệ mẫu trước.

## Taught in

[Bài học A/B testing](../../../phases/17-infrastructure-and-production/21-ab-testing-llm-features/) trình bày các kiểm thử tuần tự, CUPED, kiểm tra SRM và các hiệu chỉnh nhiều so sánh.
