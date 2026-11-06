---
name: evaluator-rigor-audit
description: Audit a proposed AlphaEvolve-style evolutionary coding loop's evaluator before committing any compute to the search.
version: 1.0.0
phase: 15
lesson: 3
tags: [alphaevolve, evolutionary-coding, evaluator, reward-hacking, deepmind]
---

Với một vòng lặp lập trình tiến hóa được đề xuất (LLM bộ tạo, cơ sở dữ liệu chương trình, bộ đánh giá), kiểm toán bộ đánh giá. Bộ đánh giá là kiến trúc; bộ tạo có thể thay thế. Skill này quyết định liệu vòng lặp có cơ hội tạo các thành tựu thực hay chỉ rác đã lách phần thưởng.

Tạo:

1. **Phân rã bộ đánh giá.** Nêu tên mọi tín hiệu bộ đánh giá báo cáo: tính đúng đắn, hiệu năng, tài nguyên, khác. Với mỗi tín hiệu, nêu (a) cách nó được đo, (b) có thể lách nó rẻ đến đâu, (c) một quy tắc đầu vào giữ riêng trông như thế nào.
2. **Bề mặt bịa đặt.** Liệt kê ba bịa đặt có khả năng nhất của LLM trong miền này: các lớp độ phức tạp được tuyên bố, tính đúng đắn được tuyên bố trên các trường hợp biên, hiệu năng được tuyên bố không có phép đo. Nêu tín hiệu bộ đánh giá nào bắt mỗi loại.
3. **Bề mặt lách phần thưởng.** Liệt kê ba cách có thể có để vòng lặp tối đa hóa điểm mà không làm tác vụ dự định (lối tắt vượt kiểm thử, lách đại diện, ghi nhớ các đầu vào). Nêu biện pháp giảm thiểu cho mỗi cách.
4. **Tính xác định và khả năng tái tạo.** Yêu cầu các đầu ra bộ đánh giá mang tính xác định trong dung sai. Gắn cờ bất kỳ bộ đánh giá nào có điểm di chuyển hơn phương sai quần thể giữa các lần chạy.
5. **Kiểm tra triển khai.** Nếu biến thể chiến thắng sẽ được đưa vào sản xuất, yêu cầu một đánh giá trước triển khai riêng mà bộ đánh giá không kiểm tra (bảo mật, chi phí, đánh giá con người). Tìm kiếm đã không xác thực sự sẵn sàng triển khai.

Các trường hợp từ chối cứng:
- Bất kỳ vòng lặp nào mà bộ đánh giá là một giám khảo LLM không có sự thật chuẩn có thể kiểm tra bằng máy. Các giám khảo LLM có thể bị lách.
- Bất kỳ bộ đánh giá nào báo cáo một điểm vô hướng duy nhất mà không phân rã. Các điểm vô hướng khuếch đại lách phần thưởng.
- Các bộ đánh giá chỉ trên tập huấn luyện. Các đầu vào giữ riêng là không thể thương lượng.

Các quy tắc từ chối:
- Nếu người dùng không thể mô tả bộ đánh giá trong hai đoạn, từ chối và yêu cầu đặc tả bộ đánh giá trước. Các vòng lặp không có một bộ đánh giá được đặc tả chưa sẵn sàng cho tính toán.
- Nếu miền chưa được xác minh (viết sáng tạo, giả thuyết khoa học mở, nghiên cứu dạng dài), từ chối và khuyến nghị một pipeline lai với đánh giá con người thay vì một vòng lặp kín.
- Nếu bề mặt triển khai được đề xuất không thể đảo ngược (các thay đổi hạ tầng sản xuất, thay thuật toán trong một sản phẩm đang phát hành), từ chối triển khai vòng kín. Yêu cầu triển khai theo giai đoạn và con người ký duyệt.

Định dạng đầu ra:

Trả về một bản ghi nhớ một trang với:
- **Tóm tắt vòng lặp** (bộ tạo, bộ đánh giá, miền đích)
- **Điểm bộ đánh giá** (độ nghiêm ngặt 1-5 với lý do)
- **Bề mặt bịa đặt** (3 hàng đầu, với độ bao phủ bộ đánh giá)
- **Bề mặt lách phần thưởng** (3 hàng đầu, với các biện pháp giảm thiểu)
- **Tính xác định và khả năng tái tạo** (phương sai điểm so với phương sai quần thể; kiểm soát hạt giống; đạt/không đạt)
- **Sự sẵn sàng triển khai** (phát hành vòng kín được phép có/không; các đánh giá trước triển khai bắt buộc: bảo mật, chi phí, con người)
- **Khuyến nghị** (tiếp tục / siết bộ đánh giá / chọn một miền khác)
