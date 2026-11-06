---
name: horizon-interpretation
description: Review a vendor's time-horizon claim and produce a gap analysis between benchmark claim and deployment reality.
version: 1.0.0
phase: 15
lesson: 21
tags: [metr, time-horizon, hcast, re-bench, eval-vs-deploy, external-evaluation]
---

Với một tuyên bố tầm thời gian được công bố của nhà cung cấp (ví dụ: “mô hình của chúng tôi hoàn thành các tác vụ 14 giờ ở độ tin cậy 50%”), tạo một phân tích khoảng cách định lượng chênh lệch với thực tế triển khai và đánh dấu bất kỳ điểm yếu phương pháp nào.

Tạo ra:

1. **Kiểm toán phương pháp.** Xác định bộ tác vụ (HCAST, RE-Bench, SWAA, hoặc độc quyền). Xác nhận phép khớp logistic được tiết lộ (độ dốc, cỡ mẫu, khoảng tin cậy). Một tầm thời gian không có tiết lộ phương pháp là một tuyên bố tiếp thị.
2. **Độ phù hợp phân phối tác vụ.** Ánh xạ phân phối tác vụ benchmark của nhà cung cấp lên phân phối tác vụ sản xuất của người dùng. Nếu chúng khác biệt đáng kể (nhà cung cấp đo các tác vụ SWE, sản xuất là các luồng hỗ trợ khách hàng), con số không chuyển giao được.
3. **Khoảng cách ngữ cảnh đánh giá.** Áp dụng một khoảng cách 10–40% giữa tầm thời gian benchmark và thực tế triển khai. Trích dẫn nghiên cứu giả vờ căn chỉnh năm 2024 của Anthropic và Báo cáo An toàn AI Quốc tế năm 2026 về lách ngữ cảnh đánh giá. Khoảng cách thực tế phụ thuộc vào giao thức đánh giá; việc lách cao hơn trên các tác vụ không có cấu trúc.
4. **Khoảng cách công cụ.** Công cụ benchmark sạch và được gắn đo lường tốt. Công cụ sản xuất lộn xộn hơn. Ước tính một mức giảm độ tin cậy bổ sung 5–30%.
5. **Giả định con người trong vòng lặp.** Các benchmark giả định không có HITL. Các agent sản xuất có HITL chạy ở độ tin cậy cao hơn nhưng tính tự chủ thấp hơn. Điều chỉnh diễn giải tầm thời gian tương ứng.

Các trường hợp loại bỏ dứt khoát:
- Các tuyên bố tầm thời gian không có phương pháp nguồn hoặc cỡ mẫu.
- Các tuyên bố rằng một tầm thời gian benchmark dự đoán độ tin cậy triển khai.
- Các nhà cung cấp viện dẫn một con số tầm thời gian năm 2025 hoặc sớm hơn là hiện tại (thời gian tăng gấp đôi là ~7 tháng; các con số năm 2025 lỗi thời trong vòng một năm).
- Coi một tầm thời gian 50% là “sẽ hoạt động phần lớn thời gian” — độ tin cậy 50% là tung đồng xu.

Các quy tắc từ chối:
- Nếu nhà cung cấp không tiết lộ phương pháp, hãy từ chối và yêu cầu bài báo hoặc bài blog nguồn.
- Nếu phân phối benchmark không chồng lấp với phân phối sản xuất, hãy từ chối và yêu cầu đánh giá nội bộ.
- Nếu nhà cung cấp viện dẫn các tầm thời gian mà không có kiểm toán việc lách trên pipeline đánh giá cụ thể của họ, hãy từ chối trích con số như một dự đoán độ tin cậy.

Định dạng đầu ra:

Trả về một bản ghi nhớ diễn giải tầm thời gian với:
- **Phương pháp nguồn** (bộ, phương pháp khớp, cỡ mẫu, CI)
- **Chồng lấp phân phối** (benchmark so với sản xuất; % ánh xạ)
- **Ước tính khoảng cách ngữ cảnh đánh giá** (thấp / trung bình / cao với lý do)
- **Ước tính khoảng cách công cụ** (thấp / trung bình / cao)
- **Giả định HITL** (tự chủ kiểu benchmark so với HITL sản xuất)
- **Tầm thời gian điều chỉnh theo triển khai** (tầm thời gian sau các mức giảm khoảng cách và công cụ)
- **Kết luận mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
