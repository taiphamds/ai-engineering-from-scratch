---
id: metric-layers-churn-auc
title: A churn model with a good AUC that nobody uses
card: system-design
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, screen]
tags: [metrics, offline-online, guardrails, baselines]
minutes: 8
lessons: [phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [ml-system-design, ml-evaluation-metrics]
related: [system-design/churn-model-system, system-design/when-not-ml]
updated: 2026-11-03
---

Một nhà khoa học dữ liệu báo cáo một bộ phân loại churn có AUC 0.91. Ba tháng sau ra mắt, không ai trong nhóm giữ chân dùng các điểm. Thuật toán vẫn ổn. Nêu các quyết định thiết kế đã thiếu, và nói chỉ số nào lẽ ra nên được báo cáo thay vào đó.

## Short answer

Các lỗi xảy ra trước huấn luyện: không ai nêu hành động mà một điểm khởi động, các điểm đến hàng tuần trong khi nhóm gọi khách hàng hàng ngày, một feature làm rò rỉ nhãn qua lý do hủy, và không ai so sánh mô hình với quy tắc nhóm đã dùng. AUC lấy trung bình trên mọi ngưỡng bao gồm những ngưỡng không bao giờ dùng; quyết định là liên hệ top 5 phần trăm mỗi đêm, nên con số offline đúng là precision trong top 5 phần trăm đó, đi cùng các chỉ số online, kinh doanh và guardrail.

## Full answer

### Four layers of metrics

| Lớp | Khi đo | Ví dụ churn |
|---|---|---|
| Offline | Trước ra mắt, trên dữ liệu quá khứ giữ lại | Precision trong top 5 phần trăm tại ngưỡng ưu đãi |
| Online | Trong ra mắt, trên lưu lượng trực tiếp | Tỷ lệ chấp nhận ưu đãi, tỷ lệ người dùng được chấm điểm |
| Kinh doanh | Vài tuần sau, với một thí nghiệm | Churn 30 ngày trong nhóm được can thiệp so với một nhóm giữ lại |
| Guardrail | Mọi lúc | Chi phí ưu đãi mỗi người dùng được giữ, tỷ lệ hủy nhận tin, độ trễ p99 |

Các lớp thường bất đồng. Điểm offline đến từ một quá khứ không chứa mô hình. Chỉ số online phụ thuộc vào cách mọi người phản ứng với quyết định. Chỉ số kinh doanh dịch chuyển chậm và mang nhiễu từ mọi thứ khác trong công ty. Các guardrail không được tệ hơn.

### Pick the offline metric from the decision

Công việc liên hệ một tỷ lệ người dùng cố định, nên chỉ số là precision của tỷ lệ đó. AUC xếp hạng mọi cặp người dùng, phần lớn không bao giờ đến quyết định. Hướng dẫn quy tắc được trích trong bài học đặt điều đó trước: thiết kế các chỉ số trước khi quyết định hệ thống làm gì.

### Baselines

Một F1 0.56 là tốt so với một lựa chọn thay thế tốt nhất 0.30 và kém so với một quy tắc đạt 0.60. Cần ba baseline: baseline tầm thường, một heuristic như quy tắc số-ngày-không-hoạt-động mà nhóm hỗ trợ dùng, và hệ thống hiện tại. Mức tăng được đo so với baseline mạnh nhất, và một mức tăng tối thiểu được đặt trước khi các kết quả được thấy.

### The other three failures

- Độ tươi: các điểm hàng tuần cho một quy trình hàng ngày nghĩa là nhóm hành động trên các con số cũ.
- Rò rỉ: một feature được ghi sau kết quả chứa câu trả lời, nên điểm offline bị thổi phồng.
- Quyết định: một điểm không có hành động gắn vào không thể thay đổi một chỉ số kinh doanh.

## Follow-ups

- **Level 1:** Tại sao một nhãn churn 30 ngày chậm để đánh giá? Expected: nhãn đến ở cuối chân trời, nên chỉ số kinh doanh trễ hơn ra mắt ít nhất lâu như vậy.
- **Level 2:** Guardrail nào sẽ bắt một mô hình giữ người dùng bằng mọi giá? Expected: chi phí ưu đãi mỗi người dùng được giữ.
- **Level 2:** Baseline heuristic đánh bại mô hình một biên nhỏ. Điều gì được phát hành? Expected: quy tắc, vì nó rẻ hơn để chạy và giải thích, trừ khi mô hình vượt mức tăng tối thiểu.

## Wrong answers

- "Một AUC cao hơn lẽ ra đã sửa việc áp dụng." Việc áp dụng thất bại ở độ tươi, hành động và sự tin cậy, không phải chất lượng xếp hạng.
- "Các chỉ số kinh doanh là đủ; bỏ chỉ số offline." Chỉ số kinh doanh đến vài tuần sau và nhiễu; chỉ số offline chặn qua cổng ra mắt.
- "Các guardrail là mối quan tâm sản phẩm, không phải mối quan tâm mô hình." Một mô hình dịch chuyển một guardrail theo hướng sai bị rollback bất kể điểm offline.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) mở đầu bằng mô hình churn không ai dùng và định nghĩa bốn lớp chỉ số cùng các baseline.
