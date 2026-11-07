---
id: ece-or-brier
title: An ECE of 0.02 on too few predictions
card: evaluation
kind: concept
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [calibration, ece, brier, reliability-diagram]
minutes: 9
lessons: [phases/19-capstone-projects/73-perplexity-calibration]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/perplexity-health-check]
updated: 2026-11-03
---

Đánh giá trắc nghiệm của bạn báo cáo một expected calibration error 0.02 trên một trăm dự đoán với mười bin, và nhóm gọi mô hình được hiệu chuẩn tốt. Con số đó đo gì, nó bỏ sót gì, và bạn thêm con số thứ hai nào?

## Short answer

ECE chia các dự đoán vào bin theo độ tin cậy và lấy trung bình khoảng cách giữa độ tin cậy và độ chính xác, được gán trọng số theo kích thước bin. Với mười bin và một trăm dự đoán bạn không thể phân biệt 0.02 với nhiễu, và bên trong một bin các dự đoán quá tự tin và thiếu tự tin có thể bù nhau trong trung bình bin. Thêm điểm Brier, sai số bình phương trung bình giữa độ tin cậy và kết quả theo dự đoán, và báo cáo bao nhiêu bin có dữ liệu.

## Full answer

### What ECE computes

Phân các dự đoán vào các bin độ tin cậy có chiều rộng bằng nhau, mười theo quy ước công bố hoặc 15 theo quy ước so sánh. Trong mỗi bin lấy độ tin cậy trung bình và độ chính xác trung bình. ECE là tổng trên các bin của khoảng cách tuyệt đối, được gán trọng số theo tỷ lệ dự đoán của bin. Capstone trả về số bin có dữ liệu cùng giá trị, để runner có thể từ chối báo cáo một con số đơn lẻ trên quá ít mẫu.

### What it misses

ECE bị lệch bởi số bin và kích thước mẫu. Khoảng cách tuyệt đối theo bin ngăn các khoảng cách trong các bin khác nhau triệt tiêu, nhưng các trung bình bin có thể che giấu độ phân tán: các dự đoán quá tự tin và thiếu tự tin trong cùng bin bù nhau, vì vậy một ECE thấp có thể che giấu hiệu chuẩn kém ở cấp các dự đoán đơn lẻ.

### What Brier adds

Brier là trung bình của chênh lệch bình phương giữa độ tin cậy và kết quả, theo dự đoán. Nó phạt mọi lần sai trực tiếp, vì vậy triệt tiêu là không thể. Nó phân rã thành độ tin cậy, độ phân giải và sự không chắc chắn. Một bộ dự đoán nói một nửa trên mọi thứ có một điểm Brier chính xác 0.25, và một ECE bằng khoảng cách giữa một nửa và độ chính xác.

### The diagram

Giữ độ tin cậy trung bình, độ chính xác trung bình và số đếm theo bin. Khi vẽ, đường chéo là hiệu chuẩn hoàn hảo. Dữ liệu đó cũng cho phép một người đọc tính các biến thể thích nghi của ECE sau này.

### Where confidence comes from

Với trắc nghiệm, một softmax trên log likelihood của các lựa chọn. Với văn bản tự do, xác suất do mô hình nêu hoặc hàm mũ của log likelihood trung bình của nó. Harness chấp nhận bất kỳ số nào trong khoảng đơn vị theo dự đoán; nó đến từ đâu là công việc của adapter. Một mô hình nêu độ tin cậy cao và đúng ít hơn nhiều cho thấy khoảng cách trong bin đó.

## Follow-ups

- **Level 3:** Một bộ dự đoán nói một nửa trên mọi mục. Điểm Brier của nó là gì, và tại sao? Expected: chính xác 0.25, vì sai số bình phương là 0.25 dù kết quả là không hay một.
- **Level 3:** Tại sao ECE có thể thấp trong khi hiệu chuẩn kém? Expected: bên trong một bin, các dự đoán quá tự tin và thiếu tự tin bù nhau trong các trung bình bin; khoảng cách tuyệt đối chỉ ngăn triệt tiêu giữa các bin, và Brier phạt sai số của mỗi dự đoán.
- **Level 4:** Tại sao hiệu chuẩn là một báo cáo theo mô hình chứ không phải một metric theo nhiệm vụ? Expected: runner tích lũy các cặp độ tin cậy và tính đúng đắn trên toàn bộ đánh giá và tính nó một lần; các bin theo nhiệm vụ sẽ gần như rỗng.
- **Level 4:** Một mô hình có độ chính xác cao hơn và điểm Brier tệ hơn một đối thủ. Bạn triển khai mô hình nào? Expected: capstone lập luận cho mô hình được hiệu chuẩn tốt hơn, vì nó báo cáo sự không chắc chắn một cách đáng tin cậy; xác nhận bằng biểu đồ độ tin cậy.

## Wrong answers

- "Một ECE 0.02 nghĩa là đã hiệu chuẩn." Trên một trăm dự đoán với mười bin giá trị nằm trong nhiễu; báo cáo các bin có dữ liệu và thu thập một mẫu lớn hơn.
- "Độ chính xác là đủ." Hai mô hình có cùng độ chính xác có thể khác nhau về việc độ tin cậy của chúng có ý nghĩa gì không; capstone gọi hiệu chuẩn là trục bị bỏ qua nhiều nhất.
- "Brier thay thế ECE." Chúng trả lời các câu hỏi khác nhau; ECE cho thấy hình dạng theo bin và Brier sai số theo dự đoán. Báo cáo cả hai với dữ liệu biểu đồ.

## Taught in

[Capstone perplexity và hiệu chuẩn](../../../phases/19-capstone-projects/73-perplexity-calibration/) định nghĩa ECE, Brier và biểu đồ độ tin cậy và giải thích lưu ý kích thước mẫu.
