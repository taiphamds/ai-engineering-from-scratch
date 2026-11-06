---
name: consensus-designer
description: Design a BFT-aware consensus protocol for a multi-agent ensemble. Picks clustering, weighting, threshold, and escalation policy; attack-tests the design against byzantine, sycophancy, and monoculture patterns.
version: 1.0.0
phase: 16
lesson: 14
tags: [multi-agent, consensus, BFT, voting, confidence]
---

Với một tập hợp N agent trả lời một câu hỏi chung, thiết kế một giao thức đồng thuận vững chắc trước ba cuộc tấn công agent LLM chuẩn: lời nói dối Byzantine, thuận theo xu nịnh, đơn văn hóa lỗi tương quan.

Tạo ra:

1. **Chiến lược phân cụm.** Các câu trả lời được nhóm như thế nào? Chuẩn hóa chuỗi (chữ thường + bỏ dấu câu), tương đồng embedding có ngưỡng, hoặc chuẩn hóa cấu trúc tường minh (lược đồ JSON). Nêu tỷ lệ lỗi độ hạt cụm dự kiến.
2. **Chiến lược trọng số.** Bỏ phiếu theo số phiếu cao nhất (số đếm), có trọng số phép dò độ tự tin (CP-WBFT), chất lượng cộng tin cậy (WBFT), hoặc dựa trên điểm với tính vững chắc trung vị hình học (DecentLLMs). Giải thích lựa chọn từ hồ sơ tấn công.
3. **Ngưỡng.** Tỷ lệ tổng trọng số nào kích hoạt chấp nhận? Điều gì xảy ra dưới ngưỡng: thử lại, chuyển cấp, hay bỏ phiếu trắng?
4. **Yêu cầu đa dạng.** Tập hợp yêu cầu bao nhiêu mô hình cơ sở, họ prompt, hoặc thiết lập temperature? Đơn văn hóa là cuộc tấn công bỏ phiếu theo số phiếu cao nhất không thể phục hồi; đa dạng là biện pháp giảm thiểu mang tính cấu trúc.
5. **Bộ xác minh độc lập.** Có một agent chỉ đọc lấy chuẩn tham chiếu (khi có) hoặc áp dụng một thang đánh giá không? Đầu ra bộ xác minh đi đâu? Nó không được đi lại vào bể bỏ phiếu.
6. **Giới hạn số vòng.** Số vòng tối đa trước khi chuyển cấp. Mặc định 2-3 cho hầu hết tác vụ. Các vòng dài hơn khuếch đại xu nịnh.
7. **Bảng kiểm thử tấn công.** Với mỗi loại (Byzantine, xu nịnh, đơn văn hóa), cho thấy hành vi giao thức kỳ vọng và rủi ro còn lại. Nếu giao thức thừa nhận một chế độ lỗi đã biết, nêu nó trong một câu.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ thiết kế nào chỉ dùng bỏ phiếu theo số phiếu cao nhất trên một mô hình cơ sở đơn lẻ. Đơn văn hóa khiến điều này thất bại âm thầm.
- Bất kỳ thiết kế nào có các vòng không giới hạn hoặc “tiếp tục tranh luận cho đến khi đồng ý.” Điều này thưởng thuận theo.
- Bất kỳ thiết kế nào mà đầu ra bộ xác minh đưa trở lại bể bỏ phiếu. Điều đó đầu độc bộ xác minh.
- Các tuyên bố rằng BFT “giải quyết” bất đồng. BFT căn chỉnh các đầu ra; tính đúng đắn là một vấn đề riêng.

Các quy tắc từ chối:

- Nếu tác vụ không có chuẩn tham chiếu (ý kiến, tổng hợp, sáng tạo), nói vậy và đề xuất “đồng thuận như tư vấn, con người như bên quyết định.”
- Nếu có ít hơn 3 agent, đồng thuận không áp dụng; thay vào đó đề xuất một agent đơn lẻ cộng bộ xác minh.
- Nếu mọi agent chia sẻ một mô hình cơ sở và người dùng không thể thay đổi điều này, gắn cờ mức trần đơn văn hóa tường minh.

Đầu ra: một bản tóm lược thiết kế một trang. Bắt đầu với một tóm tắt một câu (“Bỏ phiếu có trọng số độ tự tin trên 5 agent (3 mô hình cơ sở), ngưỡng cụm ngữ nghĩa 0.55, bộ xác minh độc lập lấy lại các nguồn, tối đa 2 vòng.”), rồi bảy phần ở trên. Kết thúc bằng bảng kiểm thử tấn công.
