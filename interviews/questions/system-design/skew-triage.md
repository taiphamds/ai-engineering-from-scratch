---
id: skew-triage
title: Offline accuracy was fine and live accuracy is not
card: system-design
kind: debug
level: 3
roles: [ai-data-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, debugging]
tags: [training-serving-skew, feature-store, defaults, staleness]
minutes: 15
lessons: [phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew]
manuals: []
practice: []
cheatsheet: [feature-engineering, ml-system-design]
related: [system-design/feature-store-design, system-design/concept-drift-blind-spot]
updated: 2026-11-03
---

Một mô hình churn có điểm tốt offline và tệ hơn mô hình cũ, đơn giản hơn trên lưu lượng trực tiếp. Các feature phục vụ được dịch vụ của một nhóm khác tính. Bạn có một mẫu các yêu cầu phục vụ được ghi nhật ký. Thiết kế việc phân loại chẩn đoán: bạn chạy các so sánh nào, theo thứ tự nào, mỗi so sánh cô lập gì, và cách sửa trông như thế nào cho mỗi nguyên nhân bạn tìm được.

## Short answer

So sánh cùng thực thể và thời gian qua ba cặp. Lần đọc kho online so với join huấn luyện kiểm thử toàn hệ thống và nên cho thấy skew bằng không khi cả hai đọc một định nghĩa. Một phép tính mới so với join huấn luyện cô lập lỗi thời, và đường mã của nhóm thứ hai so với một phép tính mới cô lập các khác biệt mã như ranh giới cửa sổ và mặc định. Mỗi cặp cho một tỷ lệ không khớp và một chênh lệch tuyệt đối trung bình theo từng feature, và cách sửa cho mọi nguyên nhân là cùng hình dạng: một định nghĩa registry mà cả hai đường gọi, với các feature phục vụ được ghi nhật ký được kiểm tra theo nó.

## Full answer

### The four causes

| Nguyên nhân | Điều xảy ra | Ví dụ từ bài học |
|---|---|---|
| Hai đường mã | Huấn luyện và phục vụ tính feature khác nhau | Cửa sổ phục vụ bao gồm thêm một ngày |
| Các feature cũ | Giá trị được phục vụ có tuổi khác với những gì huấn luyện thấy | Huấn luyện đọc các snapshot hàng tuần, phục vụ tính mới |
| Các mặc định khác nhau | Hai đường điền một giá trị thiếu khác nhau | Huấn luyện dùng 365 cho chưa mua hàng, phục vụ dùng -1 |
| Du hành thời gian | Huấn luyện đọc một giá trị từ sau thời gian nhãn | Một join ngây thơ lấy snapshot mới nhất |

### The three comparisons

1. Lần đọc kho online so với join huấn luyện. Cả hai đọc cùng các dòng được materialize từ một định nghĩa, nên mọi feature nên cho thấy không khớp bằng không. Một kết quả khác không ở đây nghĩa là kho hoặc chính join sai.
2. Phép tính mới so với join huấn luyện. Điều này cô lập lỗi thời. Trong demo của bài học, giá trị mới khác trên phần lớn các yêu cầu: 83.0% không khớp cho số ngày từ lần mua cuối, 30.5% cho số lần mua, 37.1% cho chi tiêu. Mới hơn không tốt hơn ở đây, vì mô hình đã học từ các giá trị cũ tới sáu ngày.
3. Đường mã thứ hai so với phép tính mới. Điều này cô lập mã. Demo cho thấy 12.5% không khớp trên cả hai số đếm cửa sổ, vì cửa sổ của nhóm kia bao gồm thêm một ngày, và 5.5% không khớp trên số ngày từ lần mua cuối với một chênh lệch trung bình 20.07, chỉ đến từ các người dùng mới nơi các mặc định không thống nhất, -1 so với 365.

Kiểm tra cần cùng các khóa yêu cầu ở cả hai phía, và nó thất bại rõ ràng khi các khóa khác hoặc khi không có yêu cầu, vì một yêu cầu bị thiếu giấu skew và một kiểm tra trống không chứng minh gì.

### The fixes

- Hai đường mã: xóa bản sao riêng; cả hai dịch vụ gọi định nghĩa registry, và một thay đổi tạo một phiên bản mới mà các mô hình cũ không nhận.
- Các feature cũ: khớp tuổi phục vụ với tuổi huấn luyện, hoặc huấn luyện lại trên các snapshot mới hơn; độ tươi của một feature là một phần định nghĩa.
- Các mặc định khác nhau: một mặc định trong registry, được một hàm áp dụng trong cả hai đường.
- Du hành thời gian: join point-in-time với TTL, được demo cho thấy chuyển độ chính xác offline từ 0.948 bị thổi phồng xuống 0.893 trung thực và độ chính xác trực tiếp từ 0.763 tới 0.876.

### Why the simpler model won live

Mô hình cũ dùng các feature mà cả hai đường tính theo cùng cách. Mô hình mới tin một feature có các giá trị trực tiếp đến từ một cửa sổ khác và một mặc định khác, nên nó thấy các đầu vào chưa bao giờ được huấn luyện trên đó.

## Follow-ups

- **Level 3:** Bạn sẽ chạy so sánh nào trước khi có một giờ? Expected: so sánh đầu; nếu lần đọc kho khớp join huấn luyện, hệ thống nhất quán và vấn đề ở nơi khác, và nếu không, mọi kiểm tra phía sau đều không còn ý nghĩa.
- **Level 3:** Các mặc định chỉ khác cho người dùng mới. Tại sao tỷ lệ không khớp nói giảm thiệt hại? Expected: tỷ lệ thấp vì người dùng mới ít, nhưng chênh lệch mỗi lần không khớp rất lớn, nên đầu ra mô hình cho mọi người dùng mới sai.
- **Level 4:** Nhóm kia không thể thay dịch vụ trong quý này. Bạn làm gì? Expected: ghi nhật ký các feature họ phục vụ, huấn luyện mô hình tiếp theo trên các giá trị được ghi đó để huấn luyện khớp phục vụ, và giữ kiểm tra skew chạy để khoảng cách hiển thị.
- **Level 4:** Một timestamp tạo đi vào chẩn đoán như thế nào? Expected: một backfill được ghi hôm nay có thể đọc dữ liệu đến muộn, nên một join nghiêm ngặt cũng bỏ các dòng được tạo sau thời gian nhãn; nếu không chính đường huấn luyện bị skew.

## Wrong answers

- "Các feature phục vụ mới luôn tốt hơn các snapshot huấn luyện." Mô hình đã học độ tươi huấn luyện; một tuổi khác là skew theo một trong hai hướng.
- "Một tỷ lệ không khớp dưới vài phần trăm là ổn." Một tỷ lệ nhỏ với một chênh lệch trung bình lớn, như với các mặc định, vẫn phá mọi dự đoán bị ảnh hưởng.
- "So sánh độ chính xác offline với độ chính xác trực tiếp và gọi nó là drift." Drift là một thay đổi theo thời gian; skew là một khác biệt giữa hai bên đọc cùng feature tại cùng thời điểm, và ba so sánh phân biệt chúng.

## Taught in

[Bài học feature store](../../../phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/) nêu bốn nguyên nhân skew và chạy ba so sánh trên các yêu cầu được ghi nhật ký.
