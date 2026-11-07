---
id: var-next-scale
title: Predict the next scale instead of the next token
card: multimodal
kind: concept
level: 2
roles: [applied-ai-engineer]
rounds: [ml-depth]
tags: [var, next-scale, image-generation, residual-vq]
minutes: 10
lessons: [phases/08-generative-ai/19-visual-autoregressive-var]
manuals: []
practice: []
cheatsheet: [image-generation-compared, unified-multimodal]
related: [multimodal/early-or-late-fusion]
updated: 2026-11-03
---

Sinh ảnh từng token từng có nghĩa dự đoán mã này sau mã kia theo thứ tự raster. Một phương pháp mới hơn thay vào đó dự đoán toàn bộ các lưới ở độ phân giải tăng dần. Giải thích nó dự đoán gì ở mỗi bước, tại sao điều đó sửa điểm yếu chính của phương pháp cũ, và nó so với diffusion về số lượt mạng như thế nào.

## Short answer

Dự đoán next-scale tokenize một ảnh thành một kim tự tháp các lưới, từ một mã đến toàn bộ độ phân giải latent, với một bộ lượng tử hóa residual để tổng các scale tái dựng ảnh. Transformer có tính nhân quả giữa các scale và song song trong một scale: với tất cả lưới thô hơn, nó dự đoán mọi mã của lưới tiếp theo trong một lượt. Điều đó loại bỏ vấn đề thứ tự raster, nơi một mã góc sớm phải chốt trước khi bất kỳ ngữ cảnh nào tồn tại. Với một ảnh 256 nhân 256, tham chiếu dùng khoảng 10 scale, nên sinh là khoảng 10 lượt so với 28 đến 50 cho một diffusion transformer, và tất cả mã của một scale đi ra cùng nhau.

## Full answer

### The tokenizer

Một bộ lượng tử hóa residual đa scale: encode ảnh thành một latent, lượng tử hóa nó ở 1 nhân 1, rồi ở 2 nhân 2, rồi 4 nhân 4, đến toàn bộ lưới latent, với một codebook dùng chung. Mỗi scale encode những gì các scale thô hơn bỏ lỡ, và decoder lấy tổng tất cả embedding scale đã upsample. Codebook thường có 4096 đến 16384 mục. Huấn luyện nó một lần và đóng băng.

### The model

Đầu vào cho scale 1 là một token bắt đầu. Đầu vào cho mỗi scale k sau là một lưới chỉ được xây từ các scale thô hơn, upsample đến kích thước scale k. Các mã của scale k là các mục tiêu ở những vị trí đó, và chúng chỉ đi vào đầu vào cho các scale sau k. Các embedding vị trí mang chỉ số scale và vị trí bên trong scale. Mask attention có tính nhân quả theo khối: một mã ở scale k attend đến mọi mã của các scale 1 đến k, gồm tất cả vị trí của scale riêng, và không gì mịn hơn. Huấn luyện là cross-entropy trên các mã ở mỗi scale với các scale thô hơn.

### Why it beats raster order

1. Thô đến mịn khớp thống kê ảnh: cấu trúc tần số thấp ổn định và dự đoán được, và chi tiết được điều kiện hóa trên nó.
2. Song song trong một scale: độ dài sinh là logarit theo số pixel thay vì tuyến tính.
3. Không có bias thứ tự: không gì ở trái hay trên bất kỳ thứ gì bên trong một scale, nên không mã sớm nào chốt trước khi ngữ cảnh muộn tồn tại.

### The scaling result

Bài báo báo cáo một quy luật lũy thừa của chất lượng ảnh theo tính toán, theo cách các mô hình ngôn ngữ scale theo perplexity, và chất lượng tốt hơn một diffusion transformer ở tính toán khớp nhau trên một benchmark điều kiện lớp.

### Relation to diffusion

Cả hai chia sinh thành các bước có điều kiện dễ hơn. Diffusion thêm nhiễu và học loại bỏ một bước của nó; dự đoán next-scale thêm độ phân giải và học dự đoán thêm một scale. Phương pháp scale cần ít lượt hơn và song song hóa trong mỗi lượt; các biến thể điều kiện văn bản là một hướng nghiên cứu mở ở thời điểm bài học.

## Follow-ups

- **Level 2:** Tại sao cấu trúc residual quan trọng cho tokenizer? Expected: mỗi scale chỉ encode những gì các scale thô hơn bỏ lỡ, nên tổng tái dựng latent và các scale không dư thừa.
- **Level 2:** Một mã ở scale k thấy gì, và không được thấy gì? Expected: tất cả mã ở các scale 1 đến k, gồm các vị trí của scale riêng; không gì ở các scale mịn hơn.
- **Level 3:** Điều gì xảy ra với chất lượng và chi phí khi bạn thêm scale? Expected: các residual mịn hơn và tái dựng tốt hơn, với cái giá thêm một lượt mỗi scale; bài tập của bài học quét 4 đến 10 scale để tìm điểm gối.
- **Level 3:** Bạn sẽ thêm điều kiện văn bản như thế nào? Expected: đưa một embedding văn bản pooled qua chuẩn hóa thích nghi, như biến thể lai trong bài học làm, và đo mức tăng trên các mẫu căn chỉnh văn bản.

## Wrong answers

- "Đó là diffusion với một tên khác." Diffusion lặp trên các mức nhiễu trên latent liên tục; cách này lặp trên độ phân giải trên mã rời rạc và dự đoán cả một lưới mỗi lượt.
- "Trong một scale các mã vẫn đi từng cái một." Mask hai chiều bên trong một scale, nên một lượt forward tạo toàn bộ lưới.
- "Thứ tự raster chỉ tốn tốc độ." Nó cũng tạo bias sinh: một mã sớm chốt trước khi ngữ cảnh nên điều kiện hóa nó tồn tại, chặn chất lượng dưới diffusion ở tính toán khớp nhau.

## Taught in

[Bài học tự hồi quy thị giác](../../../phases/08-generative-ai/19-visual-autoregressive-var/) xây tokenizer đa scale và mask theo thứ tự scale.
