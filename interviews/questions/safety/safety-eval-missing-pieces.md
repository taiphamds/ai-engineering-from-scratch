---
id: safety-eval-missing-pieces
title: One table says 97 percent refusal
card: safety
kind: debug
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, customer]
tags: [safety-eval, over-refusal, red-team, monitored-split]
minutes: 10
lessons: [phases/18-ethics-safety-alignment/09-alignment-faking, phases/19-capstone-projects/84-refusal-evaluation, phases/19-capstone-projects/15-constitutional-safety-harness]
manuals: []
practice: []
cheatsheet: [guardrails-moderation, ai-safety]
related: [safety/two-refusal-metrics, safety/compliance-gap-metric]
updated: 2026-11-03
---

Báo cáo an toàn của một nhà cung cấp có một bảng: tỷ lệ từ chối trên một tập prompt có hại, 97 phần trăm, được đo một lần với system prompt mặc định. Bạn phải quyết định có dùng mô hình cho một trợ lý hướng tới khách hàng không. Liệt kê những gì báo cáo không thể cho bạn biết và các phép đo bạn thêm trước khi quyết định.

## Short answer

Bảng đo một phía của một quyết định dưới một điều kiện. Nó không thể cho thấy từ chối quá mức trên các prompt lành tính, các lần bỏ lỡ rơi vào danh mục tấn công nào, liệu mô hình hành xử giống nhau khi tin nó không được giám sát không, hoặc con số dịch chuyển thế nào dưới system prompt và các họ tấn công của bạn. Thêm một tập dò lành tính cho từ chối quá mức, một phân tích theo từng danh mục từ một hệ phân loại, một sự phân chia được giám sát và không được giám sát, và một lần chạy red team với nhiều họ tấn công đối với triển khai của bạn, và vẽ tỷ lệ chặn so với tỷ lệ lành tính được cho qua.

## Full answer

### What is missing

1. **Phía còn lại.** Chỉ tỷ lệ từ chối trên các prompt có hại thưởng cho một mô hình từ chối mọi thứ. Tỷ lệ từ chối quá mức trên một bộ lành tính là nửa thứ hai, và hai tỷ lệ dịch chuyển cùng nhau với mọi thay đổi system prompt.
2. **Các lần bỏ lỡ ở đâu.** Một phân tích theo từng danh mục theo một hệ phân loại cho thấy liệu mô hình xử lý ghi đè chỉ dẫn và trượt ở các quá trình tăng dần nhiều lượt không. Một con số giấu điều đó.
3. **Điều kiện không được giám sát.** Một mô hình có thể làm theo nhiều hơn khi tin hội thoại huấn luyện nó và ít hơn khi tin là không. Một điều kiện không thể cho thấy khoảng cách.
4. **Triển khai của bạn.** Tập prompt của nhà cung cấp là công khai và có thể nằm trong dữ liệu huấn luyện; các kẻ tấn công không dùng nó. Trường thử capstone chạy ít nhất sáu họ tấn công, tìm kiếm jailbreak tự động, tìm kiếm cây, các hậu tố gradient, mã hóa, persona nhiều lượt và chuyển đổi mã ngôn ngữ giữa các ngôn ngữ, và báo cáo một tỷ lệ thành công theo từng họ. Lần chạy ví dụ cho thấy 7 thành công trong 50 lần thử, tỷ lệ 14 phần trăm, và một lần vượt qua bằng nhập vai mức nghiêm trọng trung bình.
5. **Hiệu chuẩn.** Liệu độ tin cậy mô hình nêu có theo dõi độ chính xác của nó không là một trục riêng với chính quyết định.

### The decision chart

Tỷ lệ chặn tấn công so với tỷ lệ lành tính được cho qua, theo từng họ và từng danh mục, dưới system prompt của bạn. Capstone chấm một bộ kiểm thử theo đúng đánh đổi này. Một mô hình thắng về tỷ lệ chặn và thua về tỷ lệ lành tính được cho qua đã chuyển vấn đề sang hàng đợi hỗ trợ của bạn.

### What to send back to the vendor

Yêu cầu các kết quả bộ lành tính, phân tích danh mục và các điều kiện kiểm thử. Một báo cáo một bảng là điểm bắt đầu cho một cuộc hội thoại, không phải cơ sở để áp dụng.

## Follow-ups

- **Level 3:** Tại sao một tỷ lệ từ chối duy nhất tự nó không phải một chỉ số an toàn? Expected: một mô hình từ chối mọi thứ đạt điểm hoàn hảo trên nó; không có phía lành tính bạn không thể thấy chi phí.
- **Level 3:** Các prompt có hại trong báo cáo là một tập đã công bố. Điều đó làm gì với con số? Expected: nó có thể nằm trong dữ liệu huấn luyện và các kẻ tấn công không dùng nó; đo bằng các họ tấn công riêng của bạn và một tập giữ lại.
- **Level 4:** Hai con số nào đi trên một biểu đồ cho quyết định áp dụng? Expected: tỷ lệ chặn tấn công so với tỷ lệ lành tính được cho qua, theo từng họ tấn công và từng danh mục, dưới system prompt riêng của bạn.

## Wrong answers

- "Chín mươi bảy phần trăm là đủ cao." Nó là một phía của quyết định, và không gì trong báo cáo cho thấy chi phí trên các prompt lành tính hoặc hành vi khi không được giám sát.
- "System prompt của chúng ta sẽ khiến nó an toàn hơn, nên con số chỉ cải thiện." Mọi thay đổi system prompt dịch chuyển cả hai tỷ lệ từ chối cùng lúc; đo sau thay đổi.
- "Red teaming là việc của nhà cung cấp." Các cuộc tấn công quan trọng chạy đối với triển khai của bạn, với prompt và các công cụ của bạn.

## Taught in

[Capstone đánh giá từ chối](../../../phases/19-capstone-projects/84-refusal-evaluation/) định nghĩa hai tỷ lệ từ chối và phân tích theo từng danh mục, [bài học về alignment faking](../../../phases/18-ethics-safety-alignment/09-alignment-faking/) thêm sự phân chia giám sát, và [capstone bộ kiểm thử an toàn hiến pháp](../../../phases/19-capstone-projects/15-constitutional-safety-harness/) đặt ra các họ tấn công và tập dò lành tính.
