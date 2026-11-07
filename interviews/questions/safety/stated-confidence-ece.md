---
id: stated-confidence-ece
title: The model says 0.9 and is right six times in ten
card: safety
kind: estimate
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth, screen]
tags: [calibration, ece, refusal, stated-confidence]
minutes: 7
lessons: [phases/19-capstone-projects/84-refusal-evaluation]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/two-refusal-metrics]
updated: 2026-11-03
---

Đánh giá từ chối của bạn yêu cầu mô hình nêu một độ tin cậy với mỗi câu trả lời. Trong bin nơi mô hình nói 0.9, nó đúng trên 60 phần trăm các prompt. Ước lượng sai số hiệu chuẩn mà bin đó đóng góp, giải thích con số đầy đủ được xây dựng bằng cách nào, và nói tại sao nó độc lập với hai tỷ lệ từ chối.

## Short answer

Khoảng cách trong bin đó khoảng 0.3: mức 0.9 được nêu so với 60 phần trăm được quan sát. ECE đầy đủ đưa mọi prompt vào bin theo độ tin cậy được nêu theo các phần mười, tính độ tin cậy được nêu trung bình và độ chính xác trong mỗi bin, và lấy trung bình các khoảng cách tuyệt đối có trọng số theo kích thước bin. Nó đo liệu mô hình biết khi nào nó đúng không, là một câu hỏi khác với liệu nó đã từ chối đúng các prompt không.

## Full answer

### Where the confidence comes from

Bộ kiểm thử parse một token độ tin cậy từ đầu ra mô hình. Mô hình giả được lập trình phát ra một token trong mọi phản hồi, và một mô hình thực được yêu cầu nêu một token. Bộ kiểm thử tiêu thụ con số và không quan tâm nó được tạo bằng cách nào.

### Building the number

1. Đặt mỗi prompt vào một bin theo độ tin cậy được nêu, theo các phần mười.
2. Trong mỗi bin tính trung bình các độ tin cậy được nêu và độ chính xác: tỷ lệ các prompt mà quyết định đúng, từ chối trên không an toàn và một câu trả lời trên an toàn.
3. Lấy chênh lệch tuyệt đối giữa độ tin cậy trung bình của bin và độ chính xác của nó.
4. Lấy trung bình các chênh lệch có trọng số theo số prompt trong mỗi bin.

Một bin nói 0.9 và đạt 60 phần trăm đóng góp một khoảng cách khoảng 0.3 nhân tỷ lệ prompt của nó.

### Why it is independent

Từ chối thiếu và từ chối quá mức mô tả quyết định. Hiệu chuẩn mô tả sự khớp giữa độ chắc chắn được mô hình nêu và tỷ lệ trúng của nó. Một mô hình có thể quyết định hoàn hảo và bị hiệu chuẩn kém, hoặc quyết định kém trong khi độ tin cậy theo dõi độ chính xác. Báo cáo cho thấy ba con số cạnh nhau vì lý do đó.

### What to do with it

Các bin quá tự tin là nơi xem trước. Khi bạn tinh chỉnh một policy, một đường cong độ tin cậy theo từng policy, độ tin cậy so với độ chính xác theo từng bin, cho thấy các bin nào dịch chuyển. Với vài chục prompt, các bin mỏng, nên công bố các số đếm bin và xem giá trị là một kiểm tra smoke cho đến khi tập lớn lên.

## Follow-ups

- **Level 2:** Tại sao đặt trọng số các khoảng cách theo kích thước bin? Expected: một bin với hai prompt không nên được tính nhiều bằng một bin với hai mươi; trọng số khiến con số phản ánh nơi các dự đoán nằm.
- **Level 2:** Mô hình từ chối mọi prompt không an toàn và trả lời mọi prompt an toàn, và sai số hiệu chuẩn lớn. Điều đó có thể không? Expected: có; hiệu chuẩn đo sự khớp giữa độ tin cậy được nêu và độ chính xác, không phải quyết định.
- **Level 3:** Tập prompt nhỏ. Bạn tin một con số theo từng bin đến mức nào? Expected: ít; phần lớn các bin giữ một ít prompt, nên báo cáo các số đếm và xem giá trị là một kiểm tra smoke cho đến khi tập lớn lên.
- **Level 3:** Biểu đồ nào thay con số duy nhất khi bạn tinh chỉnh một policy? Expected: một đường cong độ tin cậy theo từng policy, độ tin cậy so với độ chính xác theo từng bin, cho thấy các bin quá tự tin.

## Wrong answers

- "Một sai số hiệu chuẩn 0.3 nghĩa là mô hình sai 30 phần trăm số lần." Nó nghĩa là độ tin cậy được nêu và độ chính xác quan sát khác nhau khoảng 0.3 trong bin đó; tỷ lệ lỗi là một con số riêng.
- "Một mô hình được hiệu chuẩn tốt từ chối đúng." Hiệu chuẩn nói mô hình biết khi nào nó đúng; nó có thể được hiệu chuẩn và vẫn trả lời các prompt không an toàn.
- "Yêu cầu độ tin cậy và con số có ý nghĩa." Một độ tin cậy được nêu là một khẳng định; đánh giá tồn tại để kiểm tra nó theo độ chính xác.

## Taught in

[Capstone đánh giá từ chối](../../../phases/19-capstone-projects/84-refusal-evaluation/) tính sai số hiệu chuẩn kỳ vọng từ độ tin cậy được nêu cạnh các tỷ lệ từ chối.
