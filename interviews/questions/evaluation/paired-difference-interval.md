---
id: paired-difference-interval
title: Three models, fifty tasks, one leaderboard
card: evaluation
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [leaderboard, bootstrap, win-rate, paired-comparison]
minutes: 10
lessons: [phases/19-capstone-projects/74-leaderboard-aggregation, phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/wilson-or-bootstrap]
updated: 2026-11-03
---

Bạn chạy ba mô hình ứng viên trên cùng năm mươi nhiệm vụ và phải công bố một bảng xếp hạng có một người thắng. Các trung bình là 0.78, 0.75 và 0.10. Nhóm thứ hai nói mô hình của họ hòa với mô hình đầu. Thiết kế phép tổng hợp và thống kê phân định điều đó.

## Short answer

Báo cáo một trung bình với một khoảng bootstrap, một tỷ lệ thắng, và một khoảng ghép cặp trên chênh lệch cho mỗi cặp mô hình. Lấy mẫu lại các nhiệm vụ có hoàn lại để lấy khoảng trên mỗi trung bình. Với tuyên bố hòa, bootstrap chênh lệch theo nhiệm vụ giữa hai mô hình đầu; nếu khoảng đó chứa không, bảng xếp hạng hiển thị chúng hòa.

## Full answer

### The input

Một bản ghi cho mỗi mô hình và nhiệm vụ: model id, task id, tên metric, một điểm trong khoảng đơn vị, và một hạng mục. Bộ tổng hợp từ chối bất kỳ điểm nào ngoài khoảng đơn vị, vì một nhiệm vụ báo cáo 0 đến 100 sẽ âm thầm chi phối trung bình. Chuẩn hóa thuộc về metric, ở phía trước.

### Two rankings

- **Điểm trung bình** là con số nổi bật. Nó nhạy cảm với ngoại lệ và mất cân bằng nhiệm vụ.
- **Tỷ lệ thắng** đếm các nhiệm vụ nơi mô hình có điểm tốt nhất; một lần hòa cho mọi mô hình hòa một chiến thắng đầy đủ. Nó ít nhạy cảm hơn với ngoại lệ và thang đo, và mất thông tin độ lớn.

Báo cáo cả hai. Mặc định xếp hạng theo trung bình và giữ cột tỷ lệ thắng.

### The intervals

Bootstrap trên các task id: lấy mẫu lại năm mươi nhiệm vụ có hoàn lại, tính trung bình, lặp lại, và lấy khoảng phân vị tại mức 0.05. Các hàm trợ giúp cấp thấp mặc định 1000 lần lấy mẫu lại và các bộ tổng hợp công khai 500. Với một cặp mô hình, bootstrap chênh lệch theo nhiệm vụ và đọc liệu khoảng có loại trừ giá trị không hay không. Đó là kiểm định cho tuyên bố hòa, và nó ghép cặp vì cả hai mô hình chạy cùng các nhiệm vụ.

### Categories and rendering

Nếu mỗi nhiệm vụ mang một hạng mục, báo cáo một trung bình theo hạng mục. Một mô hình tốt tổng thể và yếu về mã nguồn hiện ra ở đó và không nơi nào khác. Kết xuất một bảng sắp xếp theo trung bình với hạng, mô hình, trung bình, khoảng đến hai chữ số thập phân, tỷ lệ thắng và số nhiệm vụ.

### What this leaves out

Gán trọng số nhiệm vụ; mọi nhiệm vụ tính như nhau. Và tính độc lập: mười mục số học dùng chung một mẫu lỗi không phải năm mươi mẫu độc lập. Một bootstrap phân cấp lấy mẫu lại các họ nhiệm vụ, rồi các nhiệm vụ, là phần tiếp theo.

## Follow-ups

- **Level 3:** Tại sao bootstrap trên các nhiệm vụ chứ không trên các dự đoán bên trong một nhiệm vụ? Expected: đơn vị lặp là nhiệm vụ; lấy mẫu lại trong một nhiệm vụ đánh giá thấp phương sai giữa các nhiệm vụ.
- **Level 3:** Khi nào tỷ lệ thắng xếp hạng khác trung bình? Expected: khi một mô hình thắng nhiều nhiệm vụ một chút và thua vài nhiệm vụ rất nhiều; trung bình phạt các tổn thất lớn, tỷ lệ thắng đếm các chiến thắng.
- **Level 4:** Các nhiệm vụ thuộc các họ dùng chung mẫu lỗi. Điều gì hỏng? Expected: các nhiệm vụ không độc lập, vì vậy khoảng quá hẹp; lấy mẫu lại các họ trước, rồi các nhiệm vụ.
- **Level 4:** Metric của một nhiệm vụ trả về 0 đến 100 thay vì 0 đến 1. Bộ tổng hợp nên làm gì? Expected: từ chối lần chạy; một lần điều chỉnh lại thang âm thầm sẽ che giấu lỗi, và metric phải trả về một tỷ lệ.

## Wrong answers

- "Hai trung bình có các khoảng chồng nhau thì hòa." Chênh lệch ghép cặp là kiểm định; các khoảng riêng có thể chồng nhau trong khi chênh lệch loại trừ không.
- "Xếp hạng theo tỷ lệ thắng, nó vững chắc." Nó mất độ lớn; một mô hình thắng mọi nhiệm vụ một chút và thua một nhiệm vụ nặng trông hoàn hảo. Báo cáo cả hai.
- "Gán trọng số các nhiệm vụ theo mức quan trọng ngay." Capstone tính mọi nhiệm vụ như nhau; chỉ thêm trọng số với một lý do được tài liệu hóa và giữ bảng không trọng số.

## Taught in

[Capstone tổng hợp bảng xếp hạng](../../../phases/19-capstone-projects/74-leaderboard-aggregation/) xây dựng trung bình, tỷ lệ thắng và các khoảng bootstrap, và [bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) giải thích tại sao một phép so sánh ghép cặp quyết định.
