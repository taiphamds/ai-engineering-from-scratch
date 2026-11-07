---
id: prediction-without-action
title: What the system does with a predicted outage
card: production-mlops
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [ai-sre, prediction, incident-response, policy]
minutes: 15
lessons: [phases/17-infrastructure-and-production/23-sre-for-ai]
manuals: []
practice: []
cheatsheet: [sre-for-ai]
related: [production-mlops/narrow-auto-remediation, production-mlops/two-models-disagree]
updated: 2026-11-03
---

Một mô hình được huấn luyện trên log, nhiệt độ GPU và các mẫu lỗi của bạn dự đoán phần lớn gián đoạn sớm mười đến mười lăm phút. Nhóm muốn triển khai nó như một bảng trên dashboard. Thiết kế hệ thống làm gì với một dự đoán, và bảo vệ thiết kế.

## Short answer

Một dự đoán không có hành động là một dashboard, và không ai xem dashboard lúc ba giờ sáng. Viết một policy mỗi lớp dự đoán: gọi người trực, rút node hoặc pool bị nghi khỏi phục vụ trước khi thất bại, hoặc scale trong các giới hạn được phê duyệt, và ghi mọi dự đoán với kết quả. Bắt đầu với gọi trực, đo precision trên các sự cố thật, và chỉ nâng một lớp lên rút tự động khi tỷ lệ báo động giả chấp nhận được và một người đã phê duyệt thao tác rút đó như một hành động được phê duyệt trước trong runbook.

## Full answer

### The result and its limit

Bài học trích dẫn một kết quả nghiên cứu: một mô hình được huấn luyện trên các dòng log trước, các số đọc nhiệt độ GPU và các mẫu lỗi API dự đoán 89 phần trăm gián đoạn sớm 10 đến 15 phút trên tập kiểm thử. Kiểm tra thực tế của bài học theo ngay. Các dự đoán không có tác động là dashboard. Câu hỏi vận hành là bạn làm gì khi dự đoán kích hoạt.

### The design

1. **Phân loại dự đoán.** Lỗi nào đang đến: cạn bộ nhớ, giảm tốc do nhiệt, một đợt lỗi nhà cung cấp. Gắn độ tự tin.
2. **Ánh xạ mỗi lớp đến một hành động.** Tập an toàn của bài học hẹp: khởi động lại một pod, hoàn nguyên một deploy, scale trong giới hạn được phê duyệt trước. Một thao tác rút không nằm trong danh sách đó, nên nó cần phê duyệt trước khi tự chạy. Rút pod khỏi load balancer và khởi động lại trước khi sụp. Scale pool trong các giới hạn được phê duyệt. Gọi một người với dự đoán và bằng chứng.
3. **Đặt hành động vừa thời gian báo trước.** Rút cộng thay thế phải hoàn tất trong mười đến mười lăm phút, nên bản thay thế phải đã được làm nóng. Một cold start mô hình lớn mất vài phút và có thể ăn hết cửa sổ.
4. **Ghi kết quả.** Mọi dự đoán, lớp của nó, hành động thực hiện và liệu gián đoạn xảy ra. Precision và recall mỗi lớp đến từ log này, không phải bài báo.
5. **Bảo vệ phạm vi ảnh hưởng.** Không bao giờ chạy hai thao tác rút tự động trong cùng pool cùng lúc, và không bao giờ rút dưới một đợt tải tăng mà không có một dự phòng đã làm nóng.

### Why page first

Một lần gọi trực tốn giấc ngủ. Một lần rút sai tốn dung lượng trong thời gian rút. Một scale-up sai tốn tiền. Đến khi precision mỗi lớp được đo trong production, hành động sai rẻ nhất là gọi trực. Nâng một lớp lên hành động tự động khi hồ sơ của nó biện minh, cùng thang mà bài học dùng cho khắc phục.

## Follow-ups

- **Level 3:** Một báo động giả tốn gì dưới mỗi policy? Expected: một lần gọi trực tốn giấc ngủ, một thao tác rút tốn dung lượng trong thời gian rút, và một scale-up tốn tiền. Chọn policy mỗi lớp từ chi phí đó đối chiếu chi phí gián đoạn.
- **Level 4:** Thời gian báo trước là mười phút và một replica thay thế mất lâu hơn để làm nóng. Điều gì thay đổi? Expected: giữ một dự phòng đã làm nóng hoặc hành động sớm hơn trên một tín hiệu yếu hơn. Một thao tác rút không có thay thế đã làm nóng di chuyển gián đoạn thay vì ngăn nó.
- **Level 4:** Bạn biết bộ dự đoán vẫn hoạt động sau khi dịch vụ thay đổi như thế nào? Expected: theo dõi precision và recall mỗi lớp trên các sự cố thật, và huấn luyện lại khi phân phối đầu vào dịch chuyển.

## Wrong answers

- "Triển khai bảng và để người trực quyết định." Ban đêm không ai xem một bảng. Ý của bài học là một dự đoán không có hành động là một dashboard.
- "Tự động rút cho mọi dự đoán từ ngày đầu." Một báo động giả khi đó tốn dung lượng, và không gì đã đo tỷ lệ báo động giả trên lưu lượng của bạn.
- "Con số nghiên cứu có nghĩa chúng ta sẽ ngăn phần lớn gián đoạn." Con số nằm trên một tập kiểm thử. Precision trong production của bạn chưa biết đến khi đo.

## Taught in

[Bài học SRE cho AI](../../../phases/17-infrastructure-and-production/23-sre-for-ai/) báo cáo kết quả phát hiện sớm và hỏi hệ thống làm gì khi dự đoán.
