---
id: effective-context-spec-sheet
title: A long context battery for every model upgrade
card: evaluation
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [long-context, niah, multi-hop, regression, spec-sheet]
minutes: 12
lessons: [phases/05-nlp-foundations-to-advanced/28-long-context-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/niah-is-not-enough]
updated: 2026-11-03
---

Nhóm của bạn sẽ áp dụng một mô hình mới vào quý tới và cần một đánh giá ngữ cảnh dài chạy lại trên mọi lần nâng cấp trong tương lai. Thiết kế bộ kiểm thử cho một sản phẩm trả lời câu hỏi trên các tài liệu dài và đôi khi phải kết hợp các sự kiện từ nhiều nơi: các kiểm thử, lưới lấy mẫu, các metric, các ngưỡng cắt và quy trình hồi quy.

## Short answer

Xây dựng một harness nội bộ cố định với ba phần: một lưới needle trên độ sâu và độ dài trên tài liệu riêng của bạn, một nhiệm vụ truy vết biến nhiều bước ở cùng các độ dài, và một phần các câu hỏi tài liệu dài thật. Lấy mẫu năm độ sâu tại mỗi độ dài và ghi lại tỷ lệ đạt, thời gian đến token đầu tiên và chi phí mỗi truy vấn. Công bố hai ngưỡng cắt, độ dài truy xuất hiệu dụng tại mức đạt 90 phần trăm và độ dài suy luận hiệu dụng tại 70 phần trăm, và chạy lại cùng harness trên mọi lần nâng cấp.

## Full answer

### The tests

1. **Needle theo miền.** Cài một sự kiện từ miền của bạn vào phần lấp được xây dựng từ các tài liệu của bạn tại một tỷ lệ độ sâu và tổng độ dài được chọn. Dùng các needle không chung từ với phần lấp, để truy xuất cần một bước suy luận thay vì khớp từ khóa.
2. **Nhiều needle.** Cài ba sự kiện ở các độ sâu khác nhau và yêu cầu cả ba. Thành công với một needle không dự đoán điều này.
3. **Truy vết biến.** Cài một chuỗi chẳng hạn một giá trị đầu, một giá trị thứ hai được định nghĩa từ giá trị đầu và một giá trị thứ ba được định nghĩa từ giá trị thứ hai, và yêu cầu giá trị cuối. Đây là nhiệm vụ thất bại đầu tiên, và là nhiệm vụ sản phẩm của bạn làm khi kết hợp các sự kiện.
4. **Câu hỏi thật.** Một tập con cố định của các tài liệu dài của bạn có câu trả lời, được chấm theo hạng mục.

### The grid

Các độ sâu 0, 0.25, 0.5, 0.75 và 1.0 tại mỗi độ dài, vì các mô hình thiếu chú ý đến phần giữa. Các độ dài 1k, 4k, 16k, 64k và mục tiêu của bạn. Vẽ tỷ lệ đạt thành một heatmap theo loại nhiệm vụ.

### The metrics

Tỷ lệ đạt truy xuất, tỷ lệ đạt suy luận, thời gian đến token đầu tiên và chi phí mỗi truy vấn tại mọi độ dài. Một prompt triệu token có thể mất 30 đến 120 giây để prefill, vì vậy ngân sách độ dài của sản phẩm đến từ độ trễ cũng nhiều như từ độ chính xác.

### The cutoffs

Độ dài truy xuất hiệu dụng là độ dài dài nhất nơi lưới needle đạt ở 90 phần trăm. Độ dài suy luận hiệu dụng là độ dài dài nhất nơi truy vết đạt ở 70 phần trăm. Mong đợi độ dài thứ hai bằng 25 đến 50 phần trăm cửa sổ được quảng cáo, và đặt cả hai trên bảng đặc tả.

### The regression rule

Giữ harness cố định và quản lý phiên bản nó. Chạy nó trên mọi mô hình ứng viên và công bố các chênh lệch theo loại nhiệm vụ. Từ chối model card làm bằng chứng, từ chối điểm tự báo cáo của nhà cung cấp, và từ chối một kết quả chỉ needle cho một workload nhiều bước.

## Follow-ups

- **Level 3:** Tại sao một harness cố định thay vì benchmark công khai mới nhất mỗi lần? Expected: một phép kiểm tra hồi quy cần cùng bài kiểm thử trên cả hai mô hình; một benchmark thay đổi trộn lẫn thay đổi mô hình với thay đổi bài kiểm thử.
- **Level 3:** Mô hình mới vượt lưới needle ở độ dài mục tiêu nhưng thất bại truy vết ở một phần tư độ dài đó. Bạn phát hành gì? Expected: độ dài hiệu dụng suy luận làm giới hạn sản phẩm; chia đoạn hoặc truy xuất vượt nó và nói vậy trên bảng đặc tả.
- **Level 4:** Prefill ở độ dài mục tiêu mất hai phút. Điều đó có thay đổi thiết kế không? Expected: có; ngân sách độ dài là thứ sản phẩm chịu được về độ trễ và chi phí, không phải thứ mô hình có thể đọc.

## Wrong answers

- "Chạy kiểm thử needle ở độ dài được quảng cáo rồi dừng." Chỉ needle không nói gì về nhiều bước; bài học từ chối nó cho bất kỳ workload nhiều bước nào.
- "Dùng điểm ngữ cảnh dài được công bố của nhà cung cấp." Chúng được tự báo cáo; chạy lại độc lập trên trường hợp sử dụng của bạn.
- "Kiểm thử độ sâu giữa ở một độ dài." Các mô hình thiếu chú ý đến phần giữa và suy giảm theo độ dài; một điểm che giấu cả hai hiệu ứng.

## Taught in

[Bài học đánh giá ngữ cảnh dài](../../../phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/) đưa ra bộ kiểm thử, lưới lấy mẫu, hai ngưỡng cắt và quy tắc hồi quy.
