---
id: pick-the-peak-rate-and-schedule
title: Choose a peak learning rate and a schedule in a few hours
card: deep-learning
kind: design
level: 4
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [learning-rate, lr-range-test, schedules, 1cycle, cosine]
minutes: 15
lessons: [phases/03-deep-learning-core/13-debugging-neural-networks, phases/03-deep-learning-core/09-learning-rate-schedules, phases/03-deep-learning-core/06-optimizers, phases/19-capstone-projects/44-cosine-lr-warmup]
manuals: []
practice: [lab-learning-rate-sweep]
cheatsheet: [optimizers-schedules]
related: [deep-learning/cosine-warmup-schedule-boundaries, deep-learning/loss-becomes-nan-mid-run]
updated: 2026-11-03
---

Bạn tiếp nhận một mô hình chưa có learning rate tốt đã biết và một ngân sách tính toán vài giờ. Thiết kế quy trình chọn learning rate đỉnh và lịch cho lần chạy, và nói bạn ghi log gì để bảo vệ lựa chọn.

## Short answer

Chạy một kiểm thử dải learning rate trước: huấn luyện trong khoảng một trăm bước trong khi rate tăng theo hàm mũ từ 1e-7 về phía 10 và ghi lại loss tại mỗi rate. Lấy rate nơi loss giảm nhanh nhất và đặt đỉnh thấp hơn khoảng 10 lần. Rồi chạy một warmup tuyến tính trên 1 đến 5 phần trăm số bước vào một cosine decay với một sàn gần một phần mười đỉnh, hoặc chính sách 1cycle khi ngân sách ngắn và tổng số bước cố định. Ghi log đường cong kiểm thử dải, đường cong lịch và chuẩn gradient cạnh learning rate tại mọi bước.

## Full answer

### Step one: measure, do not guess

Kiểm thử dải của bài học gỡ lỗi: lưu các trọng số, bắt đầu ở 1e-7, nhân rate với một hệ số hằng mỗi bước để nó đạt khoảng 10 sau một trăm bước, ghi lại loss, và dừng khi loss thành NaN hoặc vượt mười lần giá trị tốt nhất đã thấy. Khôi phục các trọng số. Loss phẳng ở đầu thấp, giảm nhanh nhất quanh một rate nào đó, đạt cực tiểu của nó, và phân kỳ. Đỉnh được gợi ý thấp hơn khoảng 10 lần mức giảm dốc nhất, mà trong ví dụ của bài học đặt rate tốt nhất gần 1e-3 khi điểm dốc nhất nằm gần 1e-2. Quy tắc thứ hai của bài học bao phủ trường hợp đường cong không rõ: thử ba rate cách nhau 10 lần, chẳng hạn 1e-2, 1e-3 và 1e-4, và đọc loss sau vài epoch.

### Step two: pick the shape from the budget

| Tình huống | Lịch | Tại sao |
|---|---|---|
| Chưa biết tổng số bước | hằng, với các lần giảm thủ công | không thể tính thứ gì khác |
| Vài giờ, số bước cố định | 1cycle | hội tụ nhanh nhất cho một ngân sách cố định |
| Ngân sách vừa phải | cosine, sàn ở một phần mười đỉnh | mặc định an toàn không có núm thêm |
| Vài ngày hoặc tuần | warmup cộng cosine | mặc định cho các lần chạy transformer lớn |

Với vài giờ cùng một số bước đã biết bài học lịch chỉ đến 1cycle, tăng từ đỉnh chia 25 lên đỉnh trong nửa đầu và giảm xuống đỉnh chia 10000 trong nửa sau. Với bất cứ thứ gì dài hơn, warmup cộng cosine với một warmup 1 đến 5 phần trăm. Với một bộ tối ưu hóa thích nghi warmup không phải tùy chọn: các ước lượng moment của nó kém trong những bước đầu.

### Step three: sanity check the peak

Lần chạy độ nhạy của bài học lịch huấn luyện vài epoch ở một rate hằng và gán nhãn mỗi lần chạy là phân kỳ, gần như không di chuyển, đang học hoặc đã hội tụ. Chạy nó tại đỉnh đã chọn và tại các rate một bước trên và dưới. Đỉnh nên rơi vào đang học hoặc đã hội tụ, và rate trên nó nên cho thấy những dấu hiệu rắc rối đầu tiên.

### What to log

- Đường cong kiểm thử dải, loss theo rate trên một trục log, với đỉnh đã chọn được đánh dấu.
- Lịch được kết xuất trên trục bước, được lưu trong thư mục lần chạy để một người rà soát có thể đọc mà không chạy gì.
- Theo từng bước: bước, learning rate, chuẩn L2 gradient và loss, theo thứ tự đó. Quy tắc của bài học capstone là một warmup khỏe cho thấy chuẩn tăng cùng rate và ổn định sau đỉnh, và một đỉnh đặt quá cao cho thấy một chuẩn giữ cao.
- Bốn con số lịch trong một cấu hình có phiên bản, với warmup là một tỷ lệ của tổng để lựa chọn sống sót qua một lần chạy dài hơn.

### Defaults for when there is no time

Dự phòng của bài học các bộ tối ưu hóa: AdamW ở 3e-4 với weight decay 0.01 cho một mô hình chưa biết, 2e-5 cho fine-tuning một mô hình đã tiền huấn luyện. Coi chúng là điểm bắt đầu của kiểm thử dải, không phải kết quả của nó.

## Follow-ups

- **Level 3:** Tại sao đặt đỉnh dưới điểm dốc nhất thay vì tại nó? Expected: điểm dốc nhất gần nơi loss bắt đầu phân kỳ, và một lần chạy dài cần dư địa; thấp hơn một bậc độ lớn giữ dư địa đó.
- **Level 4:** Khi nào bạn chọn 1cycle thay vì warmup cộng cosine? Expected: một ngân sách ngắn, cố định mà tổng số bước đã biết; nó hội tụ nhanh hơn cho một lượng tính toán cố định và cần biết số bước trước.
- **Level 4:** Đỉnh đúng và loss vẫn dao động gần cuối. Bạn điều chỉnh gì? Expected: decay, không phải đỉnh; một lịch kết thúc quá cao để các bước quá lớn cho cực tiểu cuối, vì vậy hạ sàn hoặc kéo dài decay.
- **Level 4:** Kích thước mô hình thay đổi kế hoạch như thế nào? Expected: quét đỉnh trên một phiên bản nhỏ hơn trước như một tiên nghiệm, rồi xác nhận bằng kiểm thử dải trên mô hình đầy đủ, vì giá trị tối ưu dịch chuyển theo kích thước.

## Wrong answers

- "Dùng 3e-4 cho Adam, nó luôn hoạt động." Đó là mặc định khởi đầu của bài học khi chưa biết gì, không phải một kết quả; kiểm thử dải mất vài phút và thay một phỏng đoán bằng một phép đo.
- "Chọn rate có loss thấp nhất trong kiểm thử dải." Điểm thấp nhất nằm cạnh phân kỳ; bài học chọn thấp hơn khoảng 10 lần mức giảm dốc nhất.
- "Một rate hằng là ổn nếu đó là rate đúng." Rate đúng thay đổi trong huấn luyện; một hằng số phù hợp lúc đầu quá lớn lúc cuối, và bài học giữ các rate hằng cho các mô hình nhỏ và gỡ lỗi.

## Taught in

[Bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) xây dựng kiểm thử dải, [bài học lịch learning rate](../../../phases/03-deep-learning-core/09-learning-rate-schedules/) so sánh các lịch và đưa ra luồng quyết định, [bài học các bộ tối ưu hóa](../../../phases/03-deep-learning-core/06-optimizers/) đưa ra các mặc định dự phòng, và [capstone cosine warmup](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) đặt schema ghi log.
