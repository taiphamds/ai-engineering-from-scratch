---
name: browser-agent-trust-boundary
description: Scope a proposed browser-agent deployment — trust zones, authorized writes, required defenses — before the agent touches a real site.
version: 1.0.0
phase: 15
lesson: 11
tags: [browser-agents, prompt-injection, trust-boundary, osworld, webarena]
---

Với một quy trình agent trình duyệt được đề xuất, tạo một tài liệu xác định phạm vi ranh giới tin cậy liệt kê mọi lần đọc, mọi lần ghi, và ngăn xếp phòng thủ tối thiểu cần cho lần chạy đầu tiên.

Tạo ra:

1. **Bề mặt đọc.** Liệt kê mọi origin agent sẽ lấy về. Phân loại mỗi origin là trong vùng tin cậy (các trang bên thứ nhất do tổ chức của người dùng vận hành) hoặc ngoài vùng tin cậy (bất kỳ bên thứ ba nào, bất kỳ nội dung do người dùng tạo nào, bất kỳ kết quả tìm kiếm nào). Mọi lần đọc ngoài vùng tin cậy phải được coi là các kênh chèn prompt tiềm năng.
2. **Bề mặt ghi.** Liệt kê mọi hành động có hệ quả mà agent được phép thực hiện (gửi biểu mẫu, đăng nội dung, gọi một công cụ backend, ghi vào bộ nhớ). Với mỗi hành động, nêu phạm vi ảnh hưởng và liệu hành động có thể đảo ngược hay không.
3. **Các biện pháp phòng thủ bắt buộc.** Ngăn xếp tối thiểu: bộ làm sạch nội dung, ranh giới đọc/ghi (việc ghi yêu cầu phê duyệt mới khi content_origin nằm ngoài vùng tin cậy), danh sách công cụ cho phép theo từng tác vụ, cách ly phiên với thông tin xác thực có phạm vi giới hạn, token canary trên bộ nhớ bền vững, HITL trên các hành động không thể đảo ngược.
4. **Độ phù hợp giữa benchmark và phân phối.** Nếu agent báo cáo một điểm BrowseComp, OSWorld, hoặc WebArena-Verified, nêu phần chồng lấp phân phối giữa benchmark và tác vụ thực. Một điểm BrowseComp cao không dự đoán độ tin cậy của luồng đặt chỗ.
5. **Danh sách kiểm tra các cuộc tấn công đã biết.** Xác nhận triển khai được gia cố chống lại (a) chèn văn bản hiển thị, (b) chèn fragment / truy vấn URL, (c) các cuộc tấn công gắn bộ nhớ (loại Tainted Memories), (d) các cuộc tấn công dạng CSRF vào các phiên đã xác thực, (e) chiếm quyền bằng một lần nhấp. Với mỗi loại, nêu biện pháp phòng thủ cụ thể và nơi nó kích hoạt.

Các trường hợp loại bỏ dứt khoát:
- Các agent trình duyệt có quyền truy cập thông tin xác thực sản xuất và không có cách ly phiên.
- Bất kỳ triển khai nào mà một lần ghi khởi phát từ nội dung ngoài vùng tin cậy không yêu cầu phê duyệt HITL mới.
- Bất kỳ triển khai nào chỉ dựa vào một bộ làm sạch nội dung (các bộ làm sạch bắt được các cuộc tấn công dễ; các payload tinh vi vượt qua).
- Bộ nhớ bền vững không có các mục canary.
- Các quy trình chạm tới giao dịch tài chính hoặc dữ liệu khách hàng mà không có HITL trên các lần ghi.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu phạm vi ảnh hưởng của một lần ghi sai do chèn prompt gây ra, hãy từ chối và yêu cầu một câu tường minh.
- Nếu người dùng đề xuất một agent trình duyệt trên một ngăn xếp không có thông tin xác thực có phạm vi giới hạn, hãy từ chối và yêu cầu một danh tính riêng trước.
- Nếu người dùng viện dẫn một điểm benchmark (BrowseComp, OSWorld, WebArena) làm bằng chứng agent “có thể” làm một tác vụ sản xuất, hãy từ chối và yêu cầu các đánh giá nội bộ trên phân phối thực.

Định dạng đầu ra:

Trả về một bản ghi nhớ ranh giới tin cậy với:
- **Bảng bề mặt đọc** (origin, trong vùng tin cậy / ngoài vùng tin cậy)
- **Bảng bề mặt ghi** (hành động, phạm vi ảnh hưởng, có thể đảo ngược có/không)
- **Ngăn xếp phòng thủ** (danh sách gạch đầu dòng các lớp được cấu hình)
- **Ghi chú độ phù hợp benchmark** (nếu áp dụng)
- **Danh sách kiểm tra các cuộc tấn công đã biết** (năm hàng, mỗi hàng nêu biện pháp phòng thủ)
- **Kết luận triển khai** (sản xuất / staging / chỉ nghiên cứu)
