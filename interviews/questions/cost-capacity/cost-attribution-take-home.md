---
id: cost-attribution-take-home
title: Build a cost attribution and enforcement simulator
card: cost-capacity
kind: take-home
level: 4
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [take-home, system-design]
tags: [finops, attribution, kill-switch, multi-tenant]
minutes: 60
lessons: [phases/17-infrastructure-and-production/27-finops-llms, phases/11-llm-engineering/11-caching-cost]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/cost-per-outcome, cost-capacity/budget-circuit-breaker]
updated: 2026-11-03
---

Bài làm ở nhà. Bạn nhận một ngày log request từ một trợ lý đa tenant. Mỗi bản ghi theo trace quy gán của bài học: một trace id, một dấu thời gian, tenant, người dùng, task id và tuyến của nó, mô hình, số đếm token cho mỗi lớp trong bốn lớp của trace trong bài học, đầu vào có được cache không, và nhiệm vụ có được giải quyết không. Bạn cũng nhận chi tiêu hằng ngày của mỗi tenant trong các tuần trước, làm baseline cho kill switch. Xây dựng một bộ mô phỏng quy gán chi tiêu theo tenant, nhiệm vụ và người dùng, chia token thành các lớp, tính chi phí trên mỗi nhiệm vụ được giải quyết theo tenant, và thực thi một giới hạn tốc độ, một giới hạn chi tiêu hằng ngày và một kill switch. Đưa vào một tenant lạm dụng và cho thấy khi nào mỗi biện pháp kiểm soát kích hoạt.

## Short answer

Định giá mọi lời gọi từ một bảng giá, tổng hợp chi phí theo tenant, theo nhiệm vụ với tuyến của nó và theo người dùng, và chia token thành prompt, công cụ, bộ nhớ và phản hồi để báo cáo nêu lớp thúc đẩy chi tiêu của mỗi tenant. Tính chi phí trên mỗi nhiệm vụ được giải quyết từ trường kết quả, không từ tổng token. Triển khai thang từ bài học: một giới hạn tốc độ ở 2 đến 3 lần đỉnh dự kiến, một giới hạn hằng ngày ở 1.5 đến 3 lần trần hợp đồng, và một kill switch trên z-score chi tiêu trên 4 so với baseline riêng của tenant. Cho thấy tenant lạm dụng chạm giới hạn tốc độ trước, rồi giới hạn chi tiêu, rồi kill switch khi chi tiêu của nó nhảy vọt cao hơn nhiều so với lịch sử.

## Full answer

### What a complete submission contains

1. **Một chi phí trên mọi lời gọi.** Một bảng giá với giá đầu vào đã cache, như bài học caching trước xây dựng, và một hàm chuyển token thành đô la mỗi lời gọi.
2. **Quy gán theo ba chiều.** Chi tiêu theo tenant, theo nhiệm vụ và tuyến, và theo người dùng, được nối bằng trace id như mẫu telemetry joiner thực hiện. Không có gì được suy ra sau sự việc.
3. **Bốn lớp token.** Prompt, công cụ, bộ nhớ và phản hồi theo mỗi nhiệm vụ, dưới dạng tỷ lệ. Các dải điển hình của bài học là phép kiểm tra hợp lý: prompt 40 đến 60 phần trăm, công cụ 20 đến 40 phần trăm trên công việc agent, bộ nhớ và phản hồi mỗi lớp 10 đến 30 phần trăm.
4. **Metric đơn vị.** Đối với mọi tenant và mọi tính năng, chi tiêu chia cho các nhiệm vụ được giải quyết, từ trường giải quyết. Một nhiệm vụ chưa được giải quyết vẫn tốn tiền, và đó là ý nghĩa của metric.
5. **Thang thực thi.** Giới hạn tốc độ trả lời bằng một 429 và một retry header. Giới hạn chi tiêu siết giới hạn tốc độ và phát một cảnh báo. Kill switch tạm dừng tenant và gọi trực.
6. **Tenant được đưa vào.** Một dòng thời gian về chi tiêu của nó và biện pháp kiểm soát đã kích hoạt tại mỗi điểm, với z-score được vẽ so với ngưỡng.
7. **Năm chế độ xem dashboard đầu tiên.** Bài tập của bài học yêu cầu chúng. Một câu trả lời mạnh: chi tiêu theo tenant theo thời gian, chi tiêu từng tenant chia cho các nhiệm vụ được giải quyết, phân chia lớp theo nhiệm vụ, những người dùng đứng đầu về chi tiêu, và các sự kiện thực thi.

### What the reviewer looks for

- Việc quy gán được đóng dấu lúc tạo request và được nối bằng trace id, không bao giờ đoán từ hóa đơn.
- Các lớp tách biệt, và báo cáo nói lớp nào cần sửa cho mỗi tenant sử dụng nặng.
- Metric đơn vị gắn với một kết quả.
- Kill switch tương đối so với baseline riêng của tenant, và ngưỡng được biện minh, là bài tập đầu tiên của bài học.
- Thứ tự các biện pháp kiểm soát được giải thích: trở ngại trước, tạm dừng cuối.

### What to argue in the write-up

Bài tập thứ ba của bài học: tenant lớn nhất có biên lợi nhuận âm. Đề xuất ba can thiệp theo thứ tự tác động đến khách hàng, chẳng hạn caching và định tuyến trên nhiệm vụ nặng nhất của họ trước, một thay đổi quota thứ hai, và một thay đổi giá lúc gia hạn cuối cùng. Rồi lập luận liệu gắn thẻ hồi tố có bao giờ hoạt động được không, điều mà bài học hỏi trong bài tập cuối. Câu trả lời trung thực là nó lấp một khoảng trống cho dữ liệu cũ và luôn bỏ sót các trường hợp.

## Follow-ups

- **Level 3:** Tại sao kill switch tương đối so với lịch sử của mỗi tenant thay vì một số tiền cố định? Expected: các tenant khác nhau theo các bậc độ lớn. Một số tiền cố định tạm dừng một tenant lớn trong một ngày bình thường và không bao giờ kích hoạt cho một tenant nhỏ.
- **Level 4:** Tenant lớn nhất của bạn không có lợi nhuận trong báo cáo. Bạn đề xuất gì? Expected: ba can thiệp theo thứ tự tác động đến khách hàng, chẳng hạn caching và định tuyến trên nhiệm vụ nặng nhất của họ, rồi một thay đổi quota, rồi một thay đổi giá lúc gia hạn.
- **Level 4:** Bạn sẽ đưa năm chế độ xem nào lên dashboard trước? Expected: chi tiêu theo tenant theo thời gian, chi tiêu từng tenant chia cho các nhiệm vụ được giải quyết, phân chia lớp theo nhiệm vụ, những người dùng đứng đầu về chi tiêu, và dòng thời gian các sự kiện thực thi.

## Wrong answers

- "Quy gán hóa đơn bằng cách chia nó cho số chỗ ngồi." Điều đó che giấu các tenant sử dụng nặng và các tính năng nặng, chính là điều bài tập nhằm đến.
- "Một token bucket cho mọi thứ." Một bucket duy nhất không thể nói lớp hoặc tenant nào cần sửa, và nó không thể mang một giới hạn cho từng tenant.
- "Kích hoạt kill switch ở một số đô la cố định." Các tenant khác nhau theo các bậc độ lớn. Một số tiền cố định sai cho tất cả trừ một trong số họ.

## Taught in

[Bài học FinOps cho LLM](../../../phases/17-infrastructure-and-production/27-finops-llms/) định nghĩa các chiều quy gán, các lớp token và thang thực thi, và [bài học caching và chi phí](../../../phases/11-llm-engineering/11-caching-cost/) cung cấp bảng giá và bộ theo dõi chi phí.
