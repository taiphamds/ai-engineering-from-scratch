---
id: churn-model-system
title: Design the churn system, not the churn model
card: system-design
kind: design
level: 2
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design]
tags: [churn, batch-inference, baselines, feedback-loop]
minutes: 20
lessons: [phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [ml-system-design]
related: [system-design/metric-layers-churn-auc, system-design/batch-vs-online-serving-choice, system-design/feedback-loop-clean-data]
updated: 2026-11-03
---

Một công ty đăng ký thuê bao với 2,000,000 người dùng muốn giảm churn. Nhóm giữ chân có thể gửi một ưu đãi giữ chân tới một tỷ lệ nhỏ người dùng mỗi đêm. Thiết kế hệ thống đầu cuối: dự đoán, quyết định, chế độ phục vụ, các baseline, rollout và các mặc định khi lỗi. Nêu tải và các ngân sách bạn giả định.

## Short answer

Tác vụ là phân loại nhị phân: xác suất một người dùng hủy trong 30 ngày tới, để công việc hàng đêm có thể chọn top 5 phần trăm cho một ưu đãi. Các điểm hàng đêm cho mọi người dùng phù hợp với suy luận batch; mô hình chi phí của bài học tính giá một lần chạy mỗi ngày trên cơ sở người dùng ở dưới một đô la, trong khi một dịch vụ online được định cỡ cho 40 QPS đỉnh tốn $24.00 một ngày cho độ tươi không ai cần. Mô hình phải đánh bại quy tắc số-ngày-không-hoạt-động bằng một mức tăng được đặt, phát hành qua các giai đoạn shadow và canary, và quay về quy tắc đó khi bất cứ thứ gì thất bại.

## Full answer

### From the goal to a task

| Câu hỏi | Câu trả lời |
|---|---|
| Dự đoán gì, cho thực thể nào | Hủy trong 30 ngày tới, theo từng người dùng |
| Quyết định nào dùng nó | Công việc hàng đêm gửi một ưu đãi tới top 5 phần trăm |
| Khi nào cần, với dữ liệu nào | Mỗi đêm, từ dữ liệu đến đêm đó |
| Làm sao biết quyết định đã tốt hơn | Churn 30 ngày trong nhóm được can thiệp so với một nhóm giữ lại ngẫu nhiên |

### Load and budgets

Thực thể: 2,000,000 người dùng. Yêu cầu: một lần đọc điểm mỗi lượt ghé của người dùng. Độ tươi: một ngày là ổn, vì công việc chạy một lần mỗi đêm. Ngân sách độ trễ: một lần đọc key-value ở thời điểm yêu cầu, vài mili giây. Chi phí: kế hoạch batch được tính giá ở $0.91 mỗi ngày cho một lần chạy trên cơ sở người dùng, so với $24.00 mỗi ngày cho tối thiểu hai replica của một dịch vụ online. Một cách lai có thể chấm điểm người dùng mới online ở lần ghé đầu, vì batch không có điểm cho họ đến lần chạy tiếp theo.

### Metrics and baselines

Offline: precision trong top 5 phần trăm. Online: tỷ lệ chấp nhận ưu đãi và tỷ lệ người dùng được chấm điểm. Kinh doanh: churn trong nhóm được can thiệp so với nhóm giữ lại. Guardrail: chi phí ưu đãi mỗi người dùng được giữ, tỷ lệ hủy nhận tin. Ba baseline: lớp đa số, có điểm không trên F1 vì nó không bao giờ dự đoán churn; một quy tắc số-ngày-không-hoạt-động một feature được fit trên dữ liệu huấn luyện; và quy trình hiện tại. Trong demo của bài học, mô hình đạt F1 0.564 so với quy tắc đã fit ở 0.500, mức tăng 0.064 trên mức tối thiểu 0.02, nên mô hình xứng đáng có chỗ. Với các feature yếu hơn, quy tắc sẽ được phát hành thay vào đó.

### Data

Các nhãn đến từ bảng hủy, với một độ trễ 30 ngày. Mọi feature phải tồn tại ở thời điểm chấm điểm; một lý do hủy được ghi sau đó làm rò rỉ nhãn. Giữ lại giai đoạn gần nhất cho phần tách kiểm thử.

### Rollout

Shadow trước: chấm điểm người dùng trực tiếp, ghi nhật ký, không bao giờ hành động. Rồi canary: hành động cho một tỷ lệ nhỏ, thường 1 đến 5 phần trăm, và mở rộng theo các bước với một công tắc rollback. Rồi một kiểm thử A/B so với nhóm giữ lại cho chỉ số kinh doanh. Giữ mô hình cũ được triển khai và chuyển lưu lượng bằng cấu hình.

### Feedback loop and failures

Các ưu đãi giữ lại một số người dùng, nên tháng sau người dùng rủi ro cao trông trung thành và mô hình được huấn luyện lại học rằng các feature của họ không dự đoán churn. Giữ một nhóm giữ lại ngẫu nhiên không bao giờ nhận ưu đãi và ghi nhật ký điểm cùng quyết định với mỗi dòng. Các mặc định khi lỗi: một công việc hàng đêm thất bại phục vụ các điểm tốt cuối trong một thời gian cố định, rồi quy tắc; một feature thiếu nhận mặc định đã ghi tài liệu và ghi nhật ký; một dịch chuyển đột ngột trong phân phối điểm tạm dừng các ưu đãi tự động và cảnh báo một người.

## Follow-ups

- **Level 2:** Tại sao baseline đa số có điểm không? Expected: F1 đếm các dự đoán dương, và lớp đa số là "ở lại", nên không có dự đoán nào.
- **Level 2:** Nhóm giữ chân muốn độ tươi theo giờ. Điều gì thay đổi? Expected: nhiều lần chạy hơn mỗi ngày nâng chi phí batch theo tỷ lệ, và đường online trở nên rẻ hơn tại một điểm; tính giá cả hai bằng mô hình chi phí.
- **Level 3:** Bạn giữ mô hình khỏi học các can thiệp của chính nó bằng cách nào? Expected: một nhóm giữ lại ngẫu nhiên không bao giờ nhận ưu đãi, cùng ghi nhật ký điểm và quyết định để huấn luyện có thể tách các dòng bị ảnh hưởng khỏi các dòng sạch.
- **Level 3:** Mặc định an toàn khi dịch vụ mô hình ngừng hoạt động trong lần chạy hàng đêm là gì? Expected: phục vụ các điểm tốt cuối trong một cửa sổ cố định, rồi quay về quy tắc số-ngày-không-hoạt-động.

## Wrong answers

- "Phục vụ nó online để các điểm luôn mới." Quyết định chạy một lần mỗi đêm; các replica online tốn nhiều hơn cho độ tươi mà quy trình không thể dùng.
- "Dùng AUC làm chỉ số offline." Quyết định dùng một ngưỡng; precision trong tỷ lệ được liên hệ là chỉ số phù hợp với nó.
- "Huấn luyện lại hàng tháng trên mọi người dùng." Người dùng được can thiệp mang can thiệp trong các nhãn của họ; không có nhóm giữ lại, mô hình suy giảm sau mỗi lần huấn luyện lại.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) tính giá công việc churn hàng đêm so với một dịch vụ online, so sánh mô hình với các baseline, và liệt kê các mặc định khi lỗi.
