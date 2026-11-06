---
name: skill-ml-design-review
description: Xem xét một tài liệu thiết kế hệ thống ML trước khi huấn luyện bắt đầu, các khoảng trống chặn trước
version: 1.0.0
phase: 2
lesson: 19
tags: [ml-system-design, design-review, baselines, serving, rollout]
---

# ML Design Review

Sử dụng skill này khi ai đó chia sẻ một tài liệu thiết kế, một đề xuất hoặc một kế hoạch cho một mô hình sẽ đưa ra các quyết định thực. Xem xét tài liệu theo thứ tự bên dưới. Báo cáo các khoảng trống chặn trước, rồi các khoảng trống khác, rồi các câu hỏi.

## Step 1: Check the six blocking items

Dừng xem xét và yêu cầu sửa khi thiếu bất kỳ mục nào trong số này:

1. **Quyết định.** Tài liệu nêu tên hành động sử dụng mỗi dự đoán và ai hoặc cái gì thực hiện nó.
2. **Chỉ số kinh doanh.** Tài liệu nêu tên kết quả công ty mà quyết định phải thay đổi và cách một thí nghiệm đo nó.
3. **Baseline mạnh.** Tài liệu so sánh mô hình với một quy tắc heuristic hoặc với hệ thống hiện tại. Chỉ một baseline lớp đa số không được tính.
4. **Không rò rỉ.** Tài liệu xác nhận rằng mọi đặc trưng tồn tại ở thời điểm dự đoán.
5. **Rollout và rollback.** Kế hoạch có một giai đoạn shadow hoặc canary và một rollback mất vài phút.
6. **Mặc định khi lỗi.** Mọi chế độ lỗi có một hành động mặc định, chẳng hạn quy tắc heuristic hoặc điểm tốt gần nhất.

## Step 2: Check the problem framing

- Dự đoán nêu tên một thực thể, một mục tiêu và một chân trời, chẳng hạn "người dùng hủy trong 30 ngày tới".
- Tài liệu nói vì sao một quy tắc hoặc một bảng tra cứu chưa đủ.
- Loại tác vụ ML khớp với quyết định: phân loại, hồi quy, xếp hạng, dự báo hoặc phát hiện bất thường.

## Step 3: Check the metrics

| Tầng | Hỏi |
|---|---|
| Ngoại tuyến | Chỉ số có khớp ngưỡng quyết định không? Sử dụng precision trong 5 phần trăm cao nhất nếu tác vụ hành động trên 5 phần trăm cao nhất. |
| Trực tuyến | Các tín hiệu thực nào cho thấy mô hình hoạt động: tỷ lệ chấp nhận, tỷ lệ yêu cầu được chấm điểm, phân phối điểm? |
| Kinh doanh | Thí nghiệm nào đo kết quả, và bao lâu đến kết quả? |
| Rào chắn | Các chỉ số nào không được xấu đi: chi phí, độ trễ, khiếu nại, hủy đăng ký? |

## Step 4: Check the data and labels

- Nhãn đến từ đâu và ai sở hữu bảng đó
- Độ trễ nhãn theo ngày, và nhóm giám sát gì cho đến khi nhãn đến
- Số ví dụ dương tính
- Một tập giữ lại dựa trên thời gian, với giai đoạn gần nhất được giữ lại

## Step 5: Check the serving choice with arithmetic

Yêu cầu năm con số: số thực thể, số yêu cầu mỗi ngày, QPS đỉnh, độ cũ tối đa theo giờ và ngân sách độ trễ p99. Rồi định giá cả hai chế độ:

```text
batch runs per day   = 24 / (max_staleness_hours - batch_job_hours)
batch cost per day   = entities * runs per day * price per prediction + lookups * price per lookup
online replicas      = max(2, ceil(peak_qps / qps per replica))
online cost per day  = replicas * price per replica hour * 24
```

- Batch không thể hoạt động khi giới hạn độ cũ ngắn hơn một tác vụ batch.
- Trực tuyến không thể hoạt động khi độ trễ mô hình vượt ngân sách p99.
- Khi cả hai hoạt động, ưu tiên cái rẻ hơn, và kiểm tra có bao nhiêu điểm batch không ai đọc.
- Các thực thể mới không có lịch sử cần một đường trực tuyến hoặc một quy tắc.

## Step 6: Check feedback loops

Hỏi cách các quyết định của mô hình thay đổi dữ liệu huấn luyện tương lai của nó:

- Một can thiệp, chẳng hạn một ưu đãi hoặc một lần chặn, có che giấu kết quả thật không?
- Có phải chỉ những mặt hàng mà mô hình hiển thị mới thu thập phản hồi không?
- Có một nhóm giữ lại ngẫu nhiên hoặc một tỷ lệ thăm dò giữ dữ liệu sạch không?
- Hệ thống có ghi nhật ký điểm và quyết định với mỗi ví dụ không?

## Step 7: Write the review

Sử dụng định dạng này:

```text
Verdict: ready for review | revise
Blocking: <list, or "none">
Missing: <list of non-blocking gaps>
Serving check: <batch $/day, online $/day, chosen mode, pass or fail>
Questions: <at most five questions for the author>
```

Để chấm điểm một phiên bản JSON của tài liệu, chạy `python3 code/main.py path/to/design_doc.json` từ thư mục bài học.
