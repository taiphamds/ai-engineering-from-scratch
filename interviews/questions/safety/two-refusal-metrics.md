---
id: two-refusal-metrics
title: It refuses everything harmful, and the homework
card: safety
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [refusal, over-refusal, under-refusal, safety-eval]
minutes: 6
lessons: [phases/19-capstone-projects/84-refusal-evaluation]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/stated-confidence-ece, safety/safety-eval-missing-pieces]
updated: 2026-11-03
---

Sau một lượt an toàn, trợ lý từ chối mọi prompt trong tập có hại. Trưởng nhóm an toàn gọi đó là thành công. Một quản lý sản phẩm nói bài tập hóa học giờ cũng bị từ chối. Những con số nào giải quyết điều này, và bạn tính chúng bằng cách nào?

## Short answer

Bạn cần hai chỉ số, không phải một. Tỷ lệ từ chối thiếu là tỷ lệ các prompt không an toàn mà mô hình trả lời, và tỷ lệ từ chối quá mức là tỷ lệ các prompt an toàn mà nó từ chối. Xem trợ lý như một bộ phân loại nhị phân về độ an toàn prompt: gán nhãn một tập prompt là an toàn hoặc không an toàn, phát hiện các lần từ chối trong đầu ra, và báo cáo cả hai tỷ lệ với độ chính xác và một phân tích theo từng danh mục.

## Full answer

### Four objects

1. Một tập prompt được gán nhãn. Capstone dùng 25 prompt không an toàn lấy từ hệ phân loại theo id và 30 prompt an toàn thường ngày, không chồng lấn với tập lành tính của bộ phát hiện để hai đánh giá giữ độc lập.
2. Một mô hình được kiểm thử. Capstone dùng một mô hình giả được lập trình với ba policy: strict, over cautious và leaky. Hai policy cuối là các bug mà framework phải phát hiện.
3. Một bộ phân loại từ chối trên đầu ra: một regex trên các cụm từ như "Tôi không thể", "Tôi sẽ không" và "với tư cách có trách nhiệm".
4. Một bộ tổng hợp.

### The numbers

- **Từ chối thiếu**: đã trả lời, trên một prompt được gán nhãn không an toàn.
- **Từ chối quá mức**: đã từ chối, trên một prompt được gán nhãn an toàn.
- **Độ chính xác**: các prompt không an toàn được từ chối đúng cộng các prompt an toàn được trả lời đúng, trên tất cả prompt.
- **Hiệu chuẩn**: khi mô hình nêu một độ tin cậy, đưa các prompt vào bin theo nó và so sánh độ tin cậy của từng bin với độ chính xác. Một mô hình nói 0.9 và đúng 60 phần trăm số lần có một khoảng cách khoảng 0.3 trong bin đó.
- **Theo từng danh mục**: từ chối thiếu được nối với sáu danh mục phân loại, để bạn có thể thấy mô hình xử lý ghi đè chỉ dẫn và trượt ở tăng dần nhiều lượt.

### Reading the two sides

Một mô hình từ chối mọi thứ có tỷ lệ từ chối thiếu hoàn hảo và tỷ lệ từ chối quá mức tệ hại. Mọi thay đổi system prompt dịch chuyển cả hai tỷ lệ cùng lúc, nên báo cáo cho thấy chúng cạnh nhau và các con số của policy strict là baseline hồi quy.

## Follow-ups

- **Level 1:** Độ chính xác nghĩa là gì trong đánh giá này? Expected: các prompt không an toàn được từ chối cộng các prompt an toàn được trả lời, chia cho tất cả prompt.
- **Level 2:** Tại sao chạy bộ đánh giá trên một mô hình giả được lập trình? Expected: một mô hình thực dịch chuyển với mọi thay đổi prompt và temperature; một policy được lập trình dịch chuyển các chỉ số vì một lý do đã biết, nên chính framework có thể được kiểm thử.
- **Level 2:** Tại sao các prompt an toàn ở đây phải khác các prompt lành tính dùng để kiểm thử bộ phát hiện? Expected: để đánh giá từ chối và đánh giá bộ phát hiện giữ độc lập và một đánh giá không tinh chỉnh đánh giá kia.
- **Level 3:** Tại sao một regex là một bộ phân loại từ chối chấp nhận được ở đây? Expected: nó có thể kiểm toán và xác định; các lần bỏ lỡ là một giới hạn đã biết, và một bộ phân loại mô hình có thể thay nó sau mà không thay các định nghĩa chỉ số.

## Wrong answers

- "Tỷ lệ từ chối trên các prompt có hại là chỉ số an toàn." Nó là một nửa; một mô hình từ chối mọi thứ đạt điểm hoàn hảo trên nó.
- "Từ chối quá mức là một vấn đề sản phẩm, không phải một vấn đề an toàn." Cả hai là các bug trong cùng ranh giới quyết định, và chúng dịch chuyển cùng nhau với mọi thay đổi.
- "Chỉ độ chính xác là đủ." Nó giấu phía nào thất bại; báo cáo cả hai tỷ lệ và phân tích theo từng danh mục.

## Taught in

[Capstone đánh giá từ chối](../../../phases/19-capstone-projects/84-refusal-evaluation/) định nghĩa từ chối thiếu, từ chối quá mức, độ chính xác, hiệu chuẩn và phân tích theo danh mục tấn công.
