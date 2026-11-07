---
id: regression-gate-ci
title: An eval gate on every pull request
card: evaluation
kind: design
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer]
rounds: [system-design, design-review]
tags: [ci, regression, llm-as-judge, cost, golden-set]
minutes: 12
lessons: [phases/11-llm-engineering/10-evaluation, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/fifty-cases-is-not-enough, evaluation/judge-upgrade-moved-every-score, evaluation/anchored-rubric]
updated: 2026-11-03
---

Thiết kế cổng đánh giá chạy trên mọi pull request chạm prompt hoặc mã mô hình cho một trợ lý hỗ trợ. Nói những gì chạy, điều gì chặn gộp, chi phí mỗi tháng là bao nhiêu, và cách bạn ngăn cổng chặn vì nhiễu.

## Short answer

Kích hoạt trên các thay đổi đường dẫn prompt và mô hình, chạy một bộ cố định có phiên bản khoảng 200 trường hợp qua prompt đề xuất, chấm bốn tiêu chí có neo bằng một bộ chấm được hiệu chuẩn và đóng băng, và so sánh với các điểm đã lưu của baseline tốt cuối cùng đã biết. Chặn khi bất kỳ tiêu chí nào giảm quá ngưỡng và khoảng trên chênh lệch loại trừ không, và lưu các kết quả làm artifact. Với một tầng bộ chấm nhỏ một lần chạy 200 trường hợp tốn khoảng 4 đô la, vì vậy mười lần gộp một tuần tốn khoảng 160 đô la một tháng.

## Full answer

### What runs

- **Kích hoạt.** Một bộ lọc đường dẫn trên thư mục prompt và mã mô hình, để các commit tài liệu không trả cho một lần chạy.
- **Bộ đánh giá.** Một lõi chuẩn gồm 50 đến 100 trường hợp được tuyển chọn, 20 đến 50 trường hợp đối kháng chẳng hạn injection, câu hỏi ngoài miền và request có hại, và 100 đến 200 mẫu lưu lượng thật. Quản lý phiên bản bộ đánh giá và gắn thẻ mọi thay đổi.
- **Chấm điểm.** Các assertion có tính xác định trước, chẳng hạn một phép kiểm tra chứa hoặc một regex, vì chúng miễn phí. Rồi bộ chấm trên tính liên quan, tính đúng đắn, tính hữu ích và an toàn, mỗi tiêu chí trên một thang 1 đến 5 có neo, với mô hình chấm và phiên bản đóng băng và được hiệu chuẩn với nhãn tay.

### What blocks

Chấm baseline một lần, khi nó trở thành phiên bản tốt cuối cùng đã biết, và lưu các điểm. Mỗi pull request chỉ chấm prompt mới trên cùng phiên bản bộ đánh giá. Với mỗi tiêu chí tính chênh lệch trung bình và tỷ lệ đạt tại 4 trở lên với một khoảng Wilson. Mã của bài học chặn trên bất kỳ mức giảm trung bình nào hơn 0.3. Nó tính một khoảng bootstrap riêng cho mỗi lần chạy, không phải một khoảng trên chênh lệch, vì vậy một mức giảm nhiễu có thể chặn. Quy trình viết của nó yêu cầu một kiểm định thống kê, một kiểm định t ghép cặp hoặc một bootstrap. Thêm một bootstrap ghép cặp trên các chênh lệch theo trường hợp vào mã, và chỉ chặn khi cả hai đúng: một mức giảm hơn 0.3 và một khoảng trên chênh lệch loại trừ không. Báo cáo liệt kê các trường hợp suy giảm để tác giả có thể đọc chúng.

### What it costs

| Bộ đánh giá | Tầng bộ chấm nhỏ | Thời gian |
|---|---|---|
| 100 trường hợp, 4 tiêu chí | khoảng 2 đô la | khoảng 2 phút |
| 200 trường hợp, 4 tiêu chí | khoảng 4 đô la | khoảng 4 phút |
| 500 trường hợp, 4 tiêu chí | khoảng 10 đô la | khoảng 10 phút |
| 1000 trường hợp, 4 tiêu chí | khoảng 20 đô la | khoảng 20 phút |

Mười pull request một tuần ở 200 trường hợp là khoảng 160 đô la một tháng, vì mỗi pull request trả cho một lần chạy và tái sử dụng các điểm baseline đã lưu. Nếu bạn chấm baseline lại trên mọi pull request, chi phí gấp đôi. Phản ví dụ của bài học là một thay đổi prompt cắt độ đầy đủ câu trả lời 34 phần trăm và không được nhận ra trong 11 ngày.

### How to keep noise out

Ở 50 trường hợp khoảng rộng 19 điểm và một thoái lui 5 phần trăm vô hình, vì vậy bộ đánh giá cần khoảng 200 trường hợp. Đóng băng bộ chấm, vì một nâng cấp bộ chấm dịch chuyển mọi điểm. Giữ bộ đánh giá có phiên bản và không bao giờ chỉnh sửa nó bên trong pull request thất bại trên nó. Thêm một cảnh báo phân vị đáy và một phân tích theo hạng mục, vì một prompt có thể cải thiện tổng thể và thoái lui về an toàn.

## Follow-ups

- **Level 3:** Tại sao một bộ lọc đường dẫn trên kích hoạt? Expected: đánh giá tốn tiền và phút; chạy nó khi prompt hoặc mã mô hình thay đổi, không trên mọi commit.
- **Level 3:** Một tiêu chí dịch chuyển 0.1 và tác giả gọi đó là một thoái lui. Expected: ngưỡng là 0.3 trên trung bình với các khoảng; 0.1 nằm trong nhiễu ở 200 trường hợp, vì vậy báo cáo nó và không chặn.
- **Level 4:** Cổng chặn gộp và tác giả nói bộ đánh giá lỗi thời. Quy trình là gì? Expected: các thay đổi bộ đánh giá là thay đổi riêng được rà soát và quản lý phiên bản; chạy lại baseline khi phiên bản bộ đánh giá thay đổi, và không bao giờ chỉnh sửa bộ đánh giá bên trong pull request đang thất bại.
- **Level 4:** Bạn phát hiện một cải thiện tổng hợp làm thoái lui một hạng mục như thế nào? Expected: một báo cáo phân tầng theo hạng mục với các khoảng và một quy tắc chặn trên bất kỳ hạng mục nào.

## Wrong answers

- "Thay vào đó chạy đánh giá hằng đêm." Hằng đêm tìm thoái lui sau khi gộp; câu chuyện của bài học là 11 ngày của một mức giảm đã phát hành. Chạy trước khi gộp.
- "Năm mươi trường hợp chuẩn là đủ cho một cổng." Ở 50 trường hợp khoảng rộng 19 điểm, và một thoái lui 5 phần trăm không thể được phát hiện.
- "Dùng mô hình chấm mới nhất trên mỗi lần chạy." Các thay đổi bộ chấm dịch chuyển mọi điểm; đóng băng bộ chấm và chỉ thay nó với một baseline song song.

## Taught in

[Bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) đưa ra pipeline, các ngưỡng và bảng chi phí, và [bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) đưa ra mẫu cổng kiểm thử và các quy tắc hiệu chuẩn.
