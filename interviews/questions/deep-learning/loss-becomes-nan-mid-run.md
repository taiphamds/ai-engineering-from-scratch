---
id: loss-becomes-nan-mid-run
title: A smooth loss that turns inf and then NaN hours in
card: deep-learning
kind: debug
level: 4
roles: [applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [nan-loss, exploding-gradients, gradient-clipping, learning-rate, debugging]
minutes: 15
lessons: [phases/03-deep-learning-core/13-debugging-neural-networks, phases/03-deep-learning-core/06-optimizers, phases/03-deep-learning-core/09-learning-rate-schedules, phases/19-capstone-projects/44-cosine-lr-warmup]
manuals: []
practice: []
cheatsheet: [nn-debugging]
related: [deep-learning/pick-the-peak-rate-and-schedule, deep-learning/half-the-relus-are-dead]
updated: 2026-11-03
---

Một lần chạy huấn luyện trong nhiều giờ với một loss trơn. Rồi, trong ba khoảng ghi log, loss nhảy, trở thành inf, và mọi giá trị sau đó là NaN. Cùng công thức đã hoạt động trên một mô hình nhỏ hơn. Đưa ra danh sách nguyên nhân được xếp hạng của bạn, bằng chứng phân biệt chúng, và các thay đổi ngăn nó xảy ra lần nữa.

## Short answer

Một lần chạy sạch chết muộn gần như luôn là một cập nhật quá cỡ: learning rate đỉnh quá cao cho mô hình lớn hơn, một batch hiếm tạo ra một gradient khổng lồ, hoặc lịch đạt đỉnh tại một điểm nơi mô hình đã nhạy cảm. Các log phân biệt các trường hợp: với một lần bùng nổ chuẩn gradient tăng vọt trước loss, trong khi một lần tràn ở lượt truyền tiến, chẳng hạn một softmax không có phép dịch theo giá trị lớn nhất hoặc một phép chuẩn hóa trên phương sai bằng không, cho thấy một chuẩn bình thường và một loss thành inf trong một bước. Sửa bằng gradient clipping theo chuẩn tại 1.0, một đỉnh thấp hơn với warmup, và một loss được tính từ logits, rồi tiếp tục từ checkpoint tốt cuối cùng.

## Full answer

### Rank the causes

1. **Cập nhật quá lớn cho mô hình này.** Bảng của bài học gỡ lỗi: một loss thành NaN sau một số bước có nghĩa là learning rate quá cao, và bước đầu tiên là giảm nó 10 lần. Đỉnh an toàn trên mô hình nhỏ hơn gần sát biên trên mô hình lớn hơn. Bài học capstone khuyên quét đỉnh trên một mô hình nhỏ như một tiên nghiệm, và nói giá trị tối ưu dịch chuyển theo kích thước, vì vậy xác nhận thay vì sao chép.
2. **Một batch xấu.** Một batch ngoại lệ duy nhất tạo ra một gradient đủ lớn để làm hỏng mọi trọng số trong một bước. Không có clipping, không có gì ngăn nó.
3. **Vị trí lịch.** Kiểm tra lịch ở đâu khi loss nhảy. Một warmup ngắn hoặc một đỉnh đạt tại thời điểm sai đặt các bước lớn nhất lên một mô hình không thể chịu chúng.
4. **Tràn ở lượt truyền tiến.** Một exp trong một softmax viết tay không có phép dịch theo giá trị lớn nhất, một log của không, hoặc một phép chia cho phương sai bằng không trong một phép chuẩn hóa. Những điều này tạo ra inf ngay lập tức, thường ở bước đầu tiên, vì vậy chúng xếp thấp cho một lần chạy đã sạch trong nhiều giờ, nhưng một batch hiếm có thể kích hoạt chúng muộn.

### What the logs show

- Chuẩn L2 gradient được ghi log cạnh learning rate ở mọi bước. Quy tắc của bài học capstone: một lần chạy phân kỳ cho thấy chuẩn tăng vọt trước loss. Một lần tràn cho thấy một chuẩn bình thường và một loss là inf trong một bước duy nhất.
- Thống kê gradient theo lớp. Bài học gỡ lỗi đánh dấu một lớp có gradient tuyệt đối trung bình vượt 100 là đang bùng nổ và cho thấy lớp nào đi trước.
- Phát lại. Nạp checkpoint tốt cuối cùng, đưa vào batch từ bước thất bại, và theo dõi chuẩn. Nếu chỉ batch đó tái hiện đợt tăng vọt, nó là tác nhân; nếu không, lịch hoặc rate là tác nhân.
- Phát hiện bất thường trong autograd engine, để nêu thao tác tạo ra NaN đầu tiên.

### Changes that prevent a repeat

- Clip gradient theo chuẩn toàn cục của nó tại 1.0 trước bước. Clipping theo chuẩn giữ hướng; clipping từng phần tử thì không.
- Hạ đỉnh và giữ một warmup 1 đến 5 phần trăm số bước, để các bước lớn nhất đến sau khi các thống kê của bộ tối ưu hóa ổn định.
- Tính loss từ logits bằng một hàm hợp nhất, ổn định, và giữ epsilon trong log và phép chia.
- Lưu checkpoint đủ thường xuyên để một lần tiếp tục tốn vài phút, và cảnh báo trên một loss NaN để lần chạy dừng ở bước xấu đầu tiên thay vì nhiều giờ sau.

## Follow-ups

- **Level 3:** Điều gì trong các log phân biệt một cập nhật quá cỡ với một lần tràn ở lượt truyền tiến? Expected: chuẩn gradient tăng qua vài bước trước loss đối với một lần bùng nổ; một lần tràn cho thấy một chuẩn bình thường và một loss thành inf trong một bước duy nhất.
- **Level 4:** Tại sao clip theo chuẩn thay vì theo giá trị? Expected: clipping theo chuẩn điều chỉnh tỷ lệ toàn bộ gradient và giữ hướng của nó; clipping từng phần tử thay đổi hướng.
- **Level 4:** Tại sao công thức hoạt động trên mô hình nhỏ hơn? Expected: đỉnh an toàn ở đó nằm gần biên cho mô hình lớn hơn; một phép quét trên mô hình nhỏ là một tiên nghiệm, và giá trị tối ưu dịch chuyển theo kích thước, vì vậy xác minh thay vì sao chép.
- **Level 4:** Bạn thêm gì để lần chạy không bao giờ chết âm thầm nữa? Expected: ghi log chuẩn gradient cạnh learning rate mỗi bước, cảnh báo trên một loss NaN, lưu checkpoint đủ thường xuyên để tiếp tục, và khởi động lại với clipping và một warmup.

## Wrong answers

- "Thêm một epsilon vào loss và khởi động lại." Một epsilon sửa một log của không ở bước một; một lần bùng nổ muộn đến từ kích thước cập nhật, và lần chạy sẽ chết lần nữa.
- "Giảm một nửa learning rate và hy vọng." Giảm một nửa là một phỏng đoán; bước của bài học là giảm 10 lần, cùng clipping và một phép kiểm tra vị trí lịch.
- "NaN nghĩa là dữ liệu có một hàng xấu." Một hàng xấu hiện trong epoch đầu tiên, không phải sau nhiều giờ huấn luyện sạch; phát lại batch thất bại trên checkpoint trước khi bạn đổ lỗi cho nó.

## Taught in

[Bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) đưa ra các hàng NaN của bảng tổng, [bài học các bộ tối ưu hóa](../../../phases/03-deep-learning-core/06-optimizers/) đặt clipping vào vòng lặp, [bài học lịch learning rate](../../../phases/03-deep-learning-core/09-learning-rate-schedules/) bao phủ warmup và đỉnh, và [capstone cosine warmup](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) ghi log chuẩn của gradient cạnh rate.
