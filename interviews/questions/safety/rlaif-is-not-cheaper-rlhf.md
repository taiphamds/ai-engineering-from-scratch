---
id: rlaif-is-not-cheaper-rlhf
title: Replace the labelers with a model that reads principles
card: safety
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer]
rounds: [ml-depth, design-review]
tags: [constitutional-ai, rlaif, preference-signal, principles]
minutes: 8
lessons: [phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif]
manuals: []
practice: []
cheatsheet: [alignment-training, constitutional-classifiers]
related: [safety/sycophancy-is-the-loss]
updated: 2026-11-03
---

Nhóm của bạn muốn thay người gán nhãn sở thích bằng một mô hình đọc một danh sách các nguyên tắc được viết ra và xếp hạng các completion, chủ yếu để tiết kiệm tiền. Đây có phải chỉ là huấn luyện sở thích rẻ hơn không? Điều gì thay đổi trong các chế độ lỗi, và điều gì giữ nguyên?

## Short answer

Không. Chuyển tín hiệu sở thích từ con người sang một mô hình thay đổi những lỗi nào pipeline có, không thay đổi liệu nó có lỗi không. Tâm lý người gán nhãn nhường chỗ cho cách diễn giải nguyên tắc đồng nhất trên toàn bộ tập dữ liệu và có thể đọc được, sự xu nịnh hướng tới người dùng có thể giảm vì mô hình gán nhãn không có người dùng để làm hài lòng nhưng vẫn phải được đo, và định luật Goodhart vẫn còn vì proxy giờ là cách mô hình đọc tập nguyên tắc. Phần còn lại của pipeline, một mô hình phần thưởng và tối ưu hóa policy, không đổi.

## Full answer

### The two phases

Pha một là có giám sát: mô hình soạn một phản hồi cho một prompt red team, một mô hình đọc một nguyên tắc được lấy mẫu và phê bình bản nháp, một bản sửa trả lời phê bình, và bản sửa trở thành mục tiêu huấn luyện. Pha hai là học tăng cường từ phản hồi AI: một mô hình phản hồi xếp hạng các cặp completion theo các nguyên tắc được lấy mẫu, một mô hình phần thưởng được huấn luyện trên các thứ hạng đó, và policy được tối ưu theo nó. Tập nguyên tắc gốc có 16 mục và được giữ nhỏ để các phê bình tập trung.

### What changes

- Thiên lệch chuyển từ tâm lý người gán nhãn sang cách diễn giải nguyên tắc. Mô hình gán nhãn có thể đọc "hãy trung thực" nghiêm ngặt hơn hoặc ít hơn bất kỳ người nào, và mức nghiêm ngặt của nó giống nhau trên toàn bộ tập dữ liệu.
- Tín hiệu trở nên có thể đọc được. Bạn có thể đọc nguyên tắc, phê bình và bản sửa. Một nhãn con người là một sở thích trần.
- Sự xu nịnh hướng tới người dùng có thể giảm, vì bên gán nhãn không có người dùng để làm hài lòng. Bài học cũng cảnh báo rằng lập luận xu nịnh vẫn áp dụng một khi bên gán nhãn chuyển vào bên trong vòng lặp, nên đo nó thay vì giả định nó đã biến mất.
- Định luật Goodhart giữ nguyên. Proxy giờ là cách mô hình diễn giải các nguyên tắc, vẫn là một phép đo không hoàn hảo của điều bạn muốn.

### What stays

Một mô hình phần thưởng, tối ưu hóa policy và khẳng định, đã giữ vững qua các phòng thí nghiệm, rằng kết quả vô hại hơn và hữu ích tương đương huấn luyện trên các sở thích con người với dữ liệu tương đương.

### Two related ideas

Một hiến pháp cần một thứ tự ưu tiên, vì các nguyên tắc xung đột. Bản viết lại năm 2026 mà bài học mô tả xếp bốn tầng: tránh các kết quả thảm họa, làm theo hướng dẫn nền tảng, có đạo đức rộng rãi, hữu ích và thẳng thắn, được giải quyết từ trên xuống. Riêng biệt, các bộ phân loại nhẹ đọc hiến pháp có thể chặn đầu ra ở thời điểm phục vụ; phiên bản đầu tốn thêm 23.7 phần trăm tính toán và phiên bản thứ hai khoảng 1 phần trăm. Huấn luyện định hình hành vi; các bộ phân loại thực thi các bất biến.

## Follow-ups

- **Level 2:** Tại sao sự xu nịnh có thể giảm dưới một mô hình gán nhãn, và tại sao bạn vẫn đo nó? Expected: bên gán nhãn không có người dùng để làm hài lòng, nên sự đồng ý với tiền đề của người dùng được thưởng ít hơn; nhưng bên gán nhãn giờ nằm trong vòng lặp và có thể thưởng các câu trả lời khớp gu riêng, nên mức giảm phải được đo.
- **Level 2:** Điều gì có thể đọc được ở đây mà mờ đục trong gán nhãn con người? Expected: nguyên tắc, phê bình và bản sửa đều có thể đọc; một nhãn con người là một sở thích trần.
- **Level 3:** Nêu một lỗi giống xu nịnh vẫn có thể xảy ra. Expected: mô hình phản hồi có thể thưởng quá mức các completion khớp cách đọc riêng về một nguyên tắc, như các câu trả lời lên lớp hoặc dè dặt, đó là Goodhart trên tập nguyên tắc.
- **Level 3:** Tại sao một hiến pháp cần một thứ tự ưu tiên? Expected: các nguyên tắc xung đột; một thứ tự theo tầng giải quyết các xung đột từ trên xuống thay vì để chúng cho gu của mô hình gán nhãn.

## Wrong answers

- "Đó là cùng pipeline với một bên gán nhãn rẻ hơn." Các chế độ lỗi thay đổi: thiên lệch diễn giải đồng nhất, sự xu nịnh có thể giảm nhưng phải được đo, cùng Goodhart.
- "Các nguyên tắc viết ra loại bỏ vấn đề proxy." Proxy giờ là cách mô hình diễn giải các nguyên tắc, vẫn là một phép đo không hoàn hảo.
- "Một danh sách nguyên tắc dài hơn an toàn hơn." Tập gốc được giữ nhỏ để các phê bình tập trung; thứ tự quan trọng hơn số lượng.

## Taught in

[Bài học về constitutional AI và RLAIF](../../../phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/) cung cấp hai pha, các chế độ lỗi đã thay đổi và thứ tự ưu tiên bốn tầng.
