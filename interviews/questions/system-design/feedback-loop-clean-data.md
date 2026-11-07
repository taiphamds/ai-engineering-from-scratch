---
id: feedback-loop-clean-data
title: Keep clean data when the model changes its own future
card: system-design
kind: design
level: 4
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [feedback-loop, holdout, logging, point-in-time]
minutes: 15
lessons: [phases/02-ml-fundamentals/19-ml-system-design, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew]
manuals: []
practice: []
cheatsheet: [ml-system-design, feature-engineering]
related: [system-design/churn-model-system, system-design/fraud-check-100ms, system-design/feature-store-design]
updated: 2026-11-03
---

Ba hệ thống huấn luyện lại hàng tháng trên dữ liệu production riêng: một mô hình churn gửi ưu đãi giữ chân, một mô hình gian lận chặn các thanh toán, và một mô hình xếp hạng sắp một feed. Mỗi mô hình tệ hơn một chút sau mỗi lần huấn luyện lại. Giải thích nguyên nhân chung, thiết kế lớp dữ liệu ngăn nó, và nói mỗi dòng huấn luyện phải mang gì để cách sửa hoạt động.

## Short answer

Các quyết định của mỗi mô hình thay đổi dữ liệu huấn luyện phiên bản tiếp theo của nó, đó là một vòng phản hồi. Các ưu đãi giữ những người dùng lẽ ra đã rời bỏ, nên người dùng rủi ro cao trông trung thành; các thanh toán bị chặn không bao giờ nhận chargeback, nên gian lận biến mất khỏi vùng bị chặn; feed chỉ hiển thị các mục hàng đầu, nên chỉ chúng thu thập click. Cách sửa là giữ dữ liệu mà mô hình không ảnh hưởng: một nhóm giữ lại ngẫu nhiên không bao giờ nhận can thiệp, một tỷ lệ nhỏ các quyết định ngẫu nhiên, và một nhật ký lưu điểm cùng quyết định với mọi dòng, được join với các feature tại thời điểm quyết định để huấn luyện có thể tách dữ liệu bị ảnh hưởng khỏi dữ liệu sạch.

## Full answer

### Three shapes of the same loop

| Hệ thống | Cách quyết định giấu nhãn | Điều lần huấn luyện lại học |
|---|---|---|
| Các ưu đãi churn | Các ưu đãi giữ một số người dùng có rủi ro | Các feature của họ không dự đoán churn |
| Các lần chặn gian lận | Một thanh toán bị chặn không có kết quả | Vùng bị chặn trông an toàn |
| Xếp hạng feed | Chỉ các mục được hiển thị có thể được click | Các mục hàng đầu hiện tại là các mục tốt duy nhất |

Vòng lặp được liệt kê trong các nguồn nợ kỹ thuật chính trong các hệ thống ML production vì nó im lặng: mỗi lần huấn luyện lại trông ổn trên dữ liệu giữ lại riêng, vốn cũng bị ảnh hưởng.

### The data layer

1. Một nhóm giữ lại ngẫu nhiên không bao giờ nhận can thiệp. Các kết quả của nó là ước lượng sạch của tỷ lệ cơ sở và các nhãn sạch cho huấn luyện.
2. Một tỷ lệ nhỏ các quyết định ngẫu nhiên trên lưu lượng trực tiếp, chẳng hạn các thanh toán không bị chặn hoặc các mục được hiển thị ngoài thứ tự, để các vùng bị chặn và không được hiển thị tiếp tục tạo nhãn. Tỷ lệ được định cỡ là mức nhỏ nhất giữ đủ nhãn từ các vùng đó.
3. Ghi nhật ký điểm, quyết định và phân nhóm với mọi dòng ở thời điểm quyết định.
4. Các feature được join tại thời điểm quyết định, với quy tắc point-in-time từ feature store, để các đầu vào của một dòng là những gì mô hình thấy chứ không phải một snapshot sau đã phản ánh kết quả.

### What a training row carries

Thực thể và thời gian quyết định, các feature tại thời gian đó, điểm mô hình, quyết định được đưa ra, nhóm mà nó thuộc, nhãn và thời gian nhãn. Với các trường đó, huấn luyện có thể chọn các dòng sạch, đặt trọng số các dòng bị ảnh hưởng, hoặc mô hình hóa quyết định như một feature. Không có quyết định và nhóm, các dòng bị ảnh hưởng và sạch không thể phân biệt và vòng lặp vô hình.

### Why the feature store is part of it

Một join ngây thơ trên thực thể trả về snapshot feature mới nhất cho mọi nhãn, sao chép kết quả vào đầu vào. Cùng sai lầm bên trong một vòng phản hồi tệ hơn: snapshot mới nhất cũng phản ánh can thiệp. Join as-of với một TTL khiến mỗi dòng mô tả thời điểm quyết định, và kiểm tra timestamp tạo giữ một backfill khỏi đọc dữ liệu đến sau.

### Measuring the fix

Nhóm giữ lại cho chỉ số kinh doanh: kết quả trong nhóm được can thiệp so với nhóm giữ lại. Nó cũng cho kiểm thử huấn luyện lại: chỉ đánh giá mô hình mới trên các dòng giữ lại, để điểm không bị thổi phồng bởi các quyết định riêng của mô hình. Một mô hình cải thiện trên dữ liệu bị ảnh hưởng mà không trên nhóm giữ lại đã học vòng lặp.

## Follow-ups

- **Level 3:** Tại sao chỉ một phần tách thời gian không đủ ở đây? Expected: giai đoạn gần đây cũng bị mô hình đã triển khai ảnh hưởng; thứ tự thời gian ngăn rò rỉ tương lai nhưng không ngăn thiên lệch can thiệp.
- **Level 4:** Tỷ lệ không chặn ngẫu nhiên tốn gian lận thực. Bạn lập luận cho nó bằng cách nào? Expected: như cái giá của các nhãn sạch so với chi phí một mô hình trôi dạt mù; định cỡ nó tới mức tối thiểu giữ đủ gian lận được gán nhãn từ vùng bị chặn.
- **Level 4:** Vòng phơi bày trong xếp hạng khác hai vòng kia như thế nào? Expected: nhãn không bao giờ được thu thập thay vì bị giấu; phơi bày ngẫu nhiên các mục xếp thấp hơn là cách duy nhất học tỷ lệ click của chúng.
- **Level 4:** Một lần huấn luyện lại được đánh giá trên nhóm giữ lại tệ hơn trên tập đầy đủ. Bạn tin con số nào? Expected: nhóm giữ lại; tập đầy đủ thưởng mô hình vì đồng ý với các quyết định quá khứ riêng.

## Wrong answers

- "Nhiều dữ liệu huấn luyện hơn sửa một mô hình trôi dạt." Dữ liệu mới bị ảnh hưởng; nhiều hơn làm vòng lặp ăn sâu.
- "Một phần tách huấn luyện và kiểm thử ngẫu nhiên cho thấy hiệu năng thực." Cả hai nửa bị ảnh hưởng; chỉ một nhóm giữ lại chưa bao giờ thấy can thiệp là sạch.
- "Ghi nhật ký quyết định sau từ bảng kết quả." Quyết định và phân nhóm phải được ghi ở thời điểm quyết định, với các feature tại thời gian đó, nếu không join làm rò rỉ kết quả.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) nêu ba vòng phản hồi và cách sửa chung, và [bài học feature store](../../../phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/) cung cấp join as-of giữ mỗi dòng huấn luyện ở thời điểm quyết định.
