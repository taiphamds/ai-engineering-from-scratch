---
name: bargainer-designer
description: Design a negotiation protocol: which agent narrates, which component generates offers, how private scratchpads separate from public messages, what the round bound is, and how deal rate is monitored.
version: 1.0.0
phase: 16
lesson: 16
tags: [multi-agent, negotiation, bargaining, contract-net, OG-Narrator]
---

Với một kịch bản đàm phán hoặc thị trường tác vụ (mặc cả hai bên, đấu giá N bên, phân bổ tác vụ contract-net), thiết kế giao thức.

Tạo ra:

1. **Cơ chế.** Mặc cả hai bên, đấu giá N bên dự thầu, quảng bá contract-net, hoặc liên minh nhiều bên. Nêu trò chơi.
2. **Bộ tạo đề nghị.** Xác định (nhượng bộ kiểu Zeuthen, cân bằng Rubinstein, lịch trình tuyến tính đơn giản) hoặc được LLM prompt. Mặc định: xác định trừ khi đề nghị phải là một cấu trúc định tính (đề xuất, phân vai).
3. **Lớp diễn đạt.** Những gì LLM đóng góp: cách định hình thân thiện với con người, các chiến thuật thuyết phục, nhân cách. Nêu tường minh những gì LLM KHÔNG quyết định.
4. **Các kênh riêng tư so với công khai.** Cách các dấu vết suy luận được giữ ngoài ngữ cảnh đối tác. “Vùng nháp riêng tư” + “thông điệp công khai” như hai trường. Điều này không thể thương lượng theo arXiv:2503.06416.
5. **Giới hạn số vòng.** Tối đa 3-5 vòng cho hai bên. Không giới hạn không phải lựa chọn; nó thưởng thuận theo và khuyến khích các đề nghị cảm xúc.
6. **Kỷ luật bảo lưu và BATNA.** Cả hai bên phải biết giá bảo lưu của mình. Nếu phía kia thăm dò, bên diễn đạt LLM không được tiết lộ nó. Xác thực mọi thông điệp đi ra theo quy tắc này.
7. **Giám sát tỷ lệ thỏa thuận.** Tỷ lệ thỏa thuận đường cơ sở dự kiến cho giao thức này (trích một con số từ các benchmark đàm phán: khoảng 27%-89% tùy vai trò LLM). Ngưỡng cảnh báo cho các bước thụt lùi.
8. **Chuyển cấp.** Các vòng dưới ngưỡng, các vi phạm ZOPA, hoặc phá quy tắc phía đối tác định tuyến tới một agent hòa giải hoặc con người.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ thiết kế nào mà LLM tính đề nghị số mà không có một dự phòng xác định. arXiv:2402.15813 cho thấy điều này tạo ra tỷ lệ thỏa thuận ~27%.
- Bất kỳ thiết kế nào không có các kênh riêng tư và công khai riêng biệt. Các đối tác sẽ đọc suy luận của bạn.
- Bất kỳ thiết kế nào có các vòng không giới hạn. Bảo đảm các kết quả do thuận theo thúc đẩy.
- Các thiết kế để một agent đơn lẻ giữ cả trạng thái bên mua và bên bán (mặc cả đóng vai). Thuộc tính thông tin riêng tư là cơ chế; hợp nhất các vai trò loại bỏ nó.

Các quy tắc từ chối:

- Nếu tác vụ không có lợi ích số (đàm phán định tính, các điều khoản hợp đồng), phân rã OG-Narrator có thể không áp dụng. Thay vào đó đề xuất đề xuất có cấu trúc + xác thực lược đồ.
- Nếu người dùng không thể triển khai một vùng nháp riêng (kiến trúc một lệnh gọi LLM), gắn cờ rủi ro rò rỉ tường minh và đề xuất một kiến trúc hai lệnh gọi.
- Nếu đàm phán đối kháng với một bên có thể nói dối, đề xuất một agent hòa giải cộng với các đề nghị được ghi nhật ký để kiểm toán.

Đầu ra: một bản tóm lược một trang. Bắt đầu với một tóm tắt một câu (“Mặc cả hai bên: bộ tạo đề nghị Zeuthen + bên diễn đạt LLM, giới hạn 5 vòng, vùng nháp riêng, cảnh báo tỷ lệ thỏa thuận dưới 85%.”), rồi tám phần ở trên. Kết thúc bằng một thông điệp mẫu: những gì đối tác thấy so với những gì vùng nháp riêng giữ.
