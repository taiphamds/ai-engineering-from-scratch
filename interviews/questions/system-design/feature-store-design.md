---
id: feature-store-design
title: Design a feature store that keeps training honest
card: system-design
kind: design
level: 2
roles: [ai-data-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design]
tags: [feature-store, point-in-time-join, training-serving-skew, ttl]
minutes: 15
lessons: [phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew]
manuals: []
practice: []
cheatsheet: [feature-engineering, ml-system-design]
related: [system-design/skew-triage, system-design/feedback-loop-clean-data]
updated: 2026-11-03
---

Thiết kế lớp feature cho một mô hình churn. Huấn luyện cần giá trị của mỗi feature cho hàng triệu cặp người dùng và thời gian. Phục vụ cần giá trị mới nhất cho một người dùng trong vài mili giây. Nêu các phần, giải thích một dòng huấn luyện lấy các feature bằng cách nào, và cho thấy bằng các con số của bài học điều gì sai khi không có phép join đúng.

## Short answer

Một registry giữ mỗi định nghĩa feature với thực thể, cửa sổ, mặc định, TTL và phiên bản, và cả hai đường tính từ nó. Một kho offline giữ toàn bộ lịch sử với timestamp sự kiện cho huấn luyện và backfill; một công việc materialization sao chép giá trị mới nhất theo từng thực thể vào một kho key-value online với TTL. Một dòng huấn luyện lấy dòng feature mới nhất tại hoặc trước thời gian nhãn, trong TTL. Không có phép join point-in-time đó, demo của bài học trông tốt hơn offline, 0.948 so với 0.893, và tệ hơn trên dữ liệu mới, 0.763 so với 0.876, vì snapshot mới nhất làm rò rỉ câu trả lời.

## Full answer

### The parts

| Phần | Công việc |
|---|---|
| Registry | Một định nghĩa mỗi feature: thực thể, nguồn, phép biến đổi, cửa sổ, mặc định, TTL, người sở hữu, phiên bản |
| Kho offline | Toàn bộ lịch sử với timestamp sự kiện, được huấn luyện và backfill đọc |
| Join point-in-time | Ghép mỗi nhãn với dòng mới nhất tại hoặc trước thời gian nhãn, bị bỏ nếu cũ hơn TTL |
| Materialization | Sao chép các giá trị mới nhất từ offline sang online |
| Kho online | Giá trị mới nhất mỗi thực thể, được đọc trong mili giây, từ chối các dòng cũ hơn TTL |
| Kiểm tra skew | So sánh các feature phục vụ được ghi nhật ký với đường huấn luyện cho cùng thực thể và thời gian |

### Two readers, one definition

Huấn luyện hỏi "giá trị là gì cho mỗi cặp trong hàng triệu cặp thực thể và thời gian". Phục vụ hỏi "giá trị cho thực thể này bây giờ là gì". Cả hai đọc cùng định nghĩa từ registry; không dịch vụ nào giữ một bản sao riêng của phép biến đổi. Một thay đổi tạo một phiên bản mới, và các mô hình cũ ghim phiên bản đã huấn luyện trên đó.

### The join

1. Tìm các dòng feature của cùng thực thể.
2. Giữ các dòng có timestamp sự kiện tại hoặc trước thời gian nhãn.
3. Lấy dòng mới nhất trong số đó.
4. Bỏ nó nếu thời gian nhãn trừ thời gian sự kiện vượt TTL.

Một phép join ngây thơ chỉ trên thực thể trả về dòng mới nhất cho mọi nhãn. Với một nhãn churn, snapshot mới nhất đã đếm các ngày yên lặng sau ngày nhãn, nên feature chứa câu trả lời. Demo fit một quy tắc trên cả hai tập huấn luyện và kiểm thử trên các nhãn sau: join ngây thơ đạt 0.948 offline và 0.763 trên dữ liệu mới, join point-in-time đạt 0.893 offline và 0.876 trên dữ liệu mới, và feature rò rỉ di chuyển ngưỡng từ 19 tới 53 ngày không hoạt động.

### TTL and defaults

Với TTL 10 ngày, một lần đọc năm ngày sau snapshot cuối trả về nó, và một lần đọc 20 ngày sau trả về các mặc định vì dòng quá cũ. Mặc định nằm trong registry để cả hai đường điền một giá trị thiếu theo cùng cách.

### Backfills and created time

Một feature mới không có lịch sử, nên một backfill chạy định nghĩa ở mỗi ngày trong quá khứ và chỉ đọc các sự kiện tại hoặc trước ngày đó. Một backfill chạy hôm nay vẫn có thể đọc dữ liệu đến muộn, nên một join nghiêm ngặt cũng kiểm tra timestamp tạo.

### The skew check

Ghi nhật ký một mẫu các feature đã phục vụ và so sánh từng giá trị với đường huấn luyện cho cùng thực thể và thời gian. Báo cáo tỷ lệ không khớp và chênh lệch tuyệt đối trung bình theo từng feature, và đánh dấu một feature trên 1 phần trăm không khớp. Ba so sánh tách các nguyên nhân: đọc kho so với join huấn luyện cho toàn hệ thống, tính mới so với join huấn luyện cho lỗi thời, và một đường mã thứ hai so với tính mới cho các khác biệt mã.

## Follow-ups

- **Level 2:** Tại sao mô hình rò rỉ trông tốt hơn offline? Expected: feature chứa kết quả, nên phần tách offline thưởng nó; trên dữ liệu mới thông tin không có.
- **Level 2:** TTL làm gì trong join, và tương đối với thời gian nào? Expected: nó bỏ một dòng feature quá cũ đối với nhãn; tuổi được đo từ mỗi thời gian nhãn, không từ thời gian truy vấn.
- **Level 3:** Hai nhóm tính cùng feature trong hai dịch vụ. Đó là nguyên nhân skew nào, và registry loại nó bằng cách nào? Expected: hai đường mã; cả hai dịch vụ gọi định nghĩa registry thay vì bản sao riêng.
- **Level 3:** Các feature phục vụ mới hơn hóa ra gây hại. Tại sao? Expected: mô hình được huấn luyện trên các snapshot hàng tuần, nên các giá trị cũ tới sáu ngày là thứ nó đã học; skew do lỗi thời chạy cả hai chiều.

## Wrong answers

- "Join các nhãn với bảng feature trên id người dùng." Điều đó trả về giá trị mới nhất và sao chép kết quả vào đầu vào.
- "Các feature mới hơn luôn tốt hơn ở thời điểm phục vụ." Mô hình đã học độ tươi của dữ liệu huấn luyện; một tuổi khác là skew.
- "Snapshot mỗi ngày loại vấn đề." Các snapshot hàng ngày giảm lỗi thời nhưng join vẫn cần quy tắc as-of và TTL.

## Taught in

[Bài học feature store](../../../phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/) xây dựng registry, join point-in-time, kho online và kiểm tra skew, và đo join ngây thơ so với join đúng.
