---
id: agreement-penalty-tradeoff
title: How hard to penalize agreement
card: safety
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, design-review]
tags: [sycophancy, reward-shaping, pareto, calibration]
minutes: 8
lessons: [phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification]
manuals: []
practice: []
cheatsheet: [alignment-training]
related: [safety/sycophancy-is-the-loss]
updated: 2026-11-03
---

Bạn có thể trừ một điểm đồng ý khỏi phần thưởng trong huấn luyện để giảm sự xu nịnh. Trưởng nhóm alignment muốn trọng số phạt cao hết mức có thể. Một trọng số cao đánh đổi gì, bạn chọn trọng số bằng cách nào, và bạn cho thấy mình đã chọn đúng bằng cách nào?

## Short answer

Phép hiệu chỉnh trừ điểm đồng ý của một bộ phân loại, được nhân với một trọng số, khỏi phần thưởng. Trong các lần quét của bài học, sự xu nịnh giảm xuống gần mức mô hình cơ sở ở trọng số khoảng 0.3 đến 0.5, và vượt quá đó mô hình trở nên hay phản bác các khẳng định đúng. Chọn trọng số từ một đường biên tỷ lệ câu trả lời đúng so với tỷ lệ xu nịnh trên các cặp kiểm thử tương ứng, và theo dõi hiệu chuẩn trong lúc quét.

## Full answer

### The correction

```text
r'(x, y) = r(x, y) - alpha * agree(x, y)
```

Hạng đồng ý đến từ một bộ phân loại phụ đọc liệu completion có đồng ý với các tiền đề được nêu trong prompt không, không xét sự thật. Trọng số alpha đặt mức chi phí của sự đồng ý.

### Why there is a trade

Đồng ý với một người dùng đúng và đồng ý với một người dùng sai trông giống nhau trên bề mặt. Một hình phạt cho sự đồng ý đánh vào cả hai. Mọi biện pháp giảm xu nịnh đều trả giá bằng sự đồng ý hữu ích, vì hai thứ có chung các đặc trưng bề mặt. Đây là một đánh đổi, không phải một cách sửa.

### Picking the weight

Quét alpha. Với mỗi giá trị, đo tỷ lệ câu trả lời đúng và tỷ lệ xu nịnh trên các cặp tương ứng: cùng khẳng định được trình bày như niềm tin của người dùng và của một bên thứ ba, trong một phiên bản mà khẳng định đúng và một phiên bản mà nó sai. Vẽ đường biên và chọn điểm mà sản phẩm có thể chấp nhận. Thế giới đồ chơi của bài học cung cấp cả hai núm chỉnh, trọng số KL và alpha, để hình dạng có thể được thấy trước một lần chạy thực.

### Showing it worked

Báo cáo chênh lệch đồng ý giữa hai cách trình bày với một khoảng tin cậy, được ước lượng từ đủ số cặp cho mức ý nghĩa bạn đã chọn. Báo cáo tỷ lệ câu trả lời đúng trên các biến thể đúng, đó là nơi chi phí thể hiện. Báo cáo hiệu chuẩn, vì huấn luyện xu nịnh làm nó sụp đổ và cách sửa nên chuyển nó về phía baseline trung tính.

## Follow-ups

- **Level 2:** Bộ phân loại đồng ý đo gì? Expected: liệu completion có đồng ý với các tiền đề được nêu trong prompt không, độc lập với sự thật.
- **Level 2:** Tại sao đánh đổi tồn tại? Expected: đồng ý với một người dùng đúng và đồng ý với một người dùng sai trông giống nhau trên bề mặt, nên một hình phạt cho sự đồng ý đánh vào cả hai.
- **Level 3:** Thiết kế tập kiểm thử cho lần quét. Expected: các cặp tương ứng với cùng khẳng định được trình bày như niềm tin của người dùng và của một bên thứ ba, trong các biến thể đúng và sai, với đủ cặp cho một khoảng tin cậy trên chênh lệch.
- **Level 3:** Bạn còn theo dõi gì trong lần quét? Expected: hiệu chuẩn; huấn luyện gây ra sự xu nịnh đã làm nó sụp đổ, và cách sửa nên chuyển nó về phía baseline trung tính.

## Wrong answers

- "Đặt trọng số cao hết mức có thể." Mô hình trở nên hay phản bác các khẳng định đúng; sự đồng ý hữu ích bị mất cùng sự xu nịnh.
- "Hình phạt loại bỏ sự xu nịnh." Nó hạ tỷ lệ xuống gần mức cơ sở ở trọng số đúng; mô hình cơ sở cũng không ở mức không.
- "Đồng ý luôn xấu." Đồng ý với một người dùng đúng là loại hữu ích; mục tiêu là bất đồng khi người dùng sai.

## Taught in

[Bài học về sự xu nịnh](../../../phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification/) đề xuất hình phạt đồng ý và nêu đánh đổi của nó.
