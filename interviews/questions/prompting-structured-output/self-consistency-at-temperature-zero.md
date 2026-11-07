---
id: self-consistency-at-temperature-zero
title: Five votes, one path, five times the bill
card: prompting-structured-output
kind: debug
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [debugging, ml-depth]
tags: [self-consistency, temperature, chain-of-thought, cost]
minutes: 8
lessons: [phases/11-llm-engineering/02-few-shot-cot]
manuals: []
practice: []
cheatsheet: [prompt-engineering]
related: [prompting-structured-output/cot-when-it-hurts, prompting-structured-output/escalation-pipeline-cost]
updated: 2026-11-03
---

Một trợ lý toán học lấy mẫu năm đường suy luận cho mỗi câu hỏi và lấy phiếu đa số. Độ chính xác không thay đổi so với một đường duy nhất, và hóa đơn cao gấp năm lần. Nhóm đặt temperature bằng không để có khả năng tái lập. Điều gì đã xảy ra, và bạn còn kiểm tra gì trước khi giữ lại việc bỏ phiếu?

## Short answer

Ở temperature bằng không, các mẫu phải giống hệt nhau, và chỉ một ngăn xếp phục vụ không xác định mới khiến chúng khác nhau đôi chút, nên năm đường gần như một đường được đếm năm lần và việc bỏ phiếu gần như không thay đổi gì. Bài học lấy mẫu ở 0.7 để các đường khác nhau đủ cho các lỗi của chúng triệt tiêu nhau. Sau đó kiểm tra rằng câu trả lời cuối cùng xuất ra ở một định dạng cố định, vì nếu không có một dòng như "Câu trả lời là" theo sau bởi con số thì không thể so sánh các phiếu, và kiểm tra rằng độ chính xác của một đường nằm trong khoảng mà bỏ phiếu giúp ích, khoảng 60 đến 85 phần trăm.

## Full answer

### What the vote needs

Self-consistency hoạt động vì một chuỗi đơn lẻ có thể chứa một lỗi suy luận trong khi các chuỗi độc lập hiếm khi mắc cùng một lỗi. Tính độc lập đến từ việc lấy mẫu. Bộ giải của bài học chạy cùng prompt N lần ở temperature 0.7, trích xuất con số cuối cùng từ mỗi lần, và lấy con số phổ biến nhất. Tỷ lệ phiếu là độ tin cậy.

### Where the lift is

Trong các thí nghiệm gốc trên một mô hình 540B, việc bỏ phiếu đưa điểm toán tiểu học từ 56.5 phần trăm cho một chuỗi lên 74.4 phần trăm với 40 mẫu. Trên một mô hình đã đạt 97 phần trăm, việc bỏ phiếu thêm khoảng một điểm. Kỹ thuật mang lại lợi ích nhiều nhất khi độ chính xác của một chuỗi nằm giữa 60 và 85 phần trăm: lỗi thường xuyên xảy ra nhưng không có tính hệ thống.

### How many samples

Năm mẫu thu được phần lớn lợi ích. Ba là mức tối thiểu cho một cuộc bỏ phiếu có ý nghĩa. Vượt quá mười thì lợi ích giảm dần, và mỗi mẫu là một lệnh gọi đầy đủ. Các mô hình suy luận tự lấy mẫu nội bộ, nên việc bỏ phiếu thêm rất ít ở đó.

### The format constraint

System prompt yêu cầu câu trả lời cuối cùng ở dòng cuối theo một dạng cố định. Nếu không có nó, bộ trích xuất không có gì để so sánh, và việc bỏ phiếu trên văn bản tự do là nhiễu.

## Follow-ups

- **Level 2:** Tại sao là 0.7 mà không phải một giá trị cao hơn nhiều? Expected: đủ ngẫu nhiên cho các đường đa dạng và không nhiều đến mức mô hình tạo ra nội dung vô nghĩa.
- **Level 2:** Năm câu trả lời được so sánh bằng cách nào? Expected: prompt ép buộc một dòng cuối theo một dạng cố định và mã trích xuất con số từ đó; nếu không có điều đó, việc bỏ phiếu không có gì để đếm.
- **Level 3:** Khi nào việc bỏ phiếu đáng giá gấp năm lần chi phí? Expected: khi độ chính xác của một chuỗi nằm trong khoảng 60 đến 85 phần trăm; trên một mô hình ở mức 97 phần trăm, mức tăng khoảng một điểm.
- **Level 3:** Bài học biến việc bỏ phiếu thành một quyết định bằng cách nào? Expected: tỷ lệ phiếu là một độ tin cậy; với 4 trong số 5 đồng thuận, độ tin cậy là 0.8, và khớp với câu trả lời xác định, chấp nhận, nếu không thì nâng cấp sang tìm kiếm cây.

## Wrong answers

- "Temperature bằng không khiến việc bỏ phiếu đáng tin cậy hơn." Nó khiến các mẫu giống nhau hoặc gần như giống nhau, nên không có cuộc bỏ phiếu thực sự.
- "Dùng bốn mươi mẫu như bài báo." Năm mẫu thu được phần lớn lợi ích và hơn mười cho thấy lợi ích giảm dần; bốn mươi nhân chi phí lên để đổi lấy ít lợi ích.
- "Bỏ phiếu sửa được một lỗi có tính hệ thống." Nếu phần lớn các đường mắc cùng một lỗi, đa số sẽ sai với độ tin cậy cao; việc bỏ phiếu chỉ triệt tiêu các lỗi độc lập.

## Taught in

Bài học [few-shot và chain-of-thought](../../../phases/11-llm-engineering/02-few-shot-cot/) xây dựng bộ giải self-consistency, đặt temperature và ràng buộc định dạng, và cung cấp số lượng mẫu.
