---
id: constitutional-ai-not-cheaper
title: Replacing the human labeler with a principled model
card: post-training
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, ml-breadth]
tags: [constitutional-ai, rlaif, preference-signal, red-teaming]
minutes: 10
lessons: [phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif, phases/09-reinforcement-learning/09-reward-modeling-rlhf]
manuals: []
practice: []
cheatsheet: [alignment-training]
related: [post-training/reward-model-pairwise]
updated: 2026-11-03
---

Ngân sách người đánh giá của bạn đã hết. Một đồng nghiệp đề xuất thay những người gán nhãn bằng một mô hình đọc một danh sách nguyên tắc ngắn và xếp hạng các cặp, và chạy cùng pipeline RLHF trên các nhãn đó. Đây có phải chỉ là RLHF rẻ hơn? Điều gì thay đổi?

## Short answer

Đó là công thức constitutional, và nó thay đổi các chế độ lỗi thay vì loại bỏ chúng. Pha một để mô hình phê bình và sửa các câu trả lời riêng theo các nguyên tắc lấy mẫu và huấn luyện trên các bản sửa; pha hai huấn luyện một reward model trên các cặp được một mô hình phản hồi xếp hạng và chạy giai đoạn RL thông thường. Tâm lý người đánh giá ngừng là bias, và cách đọc tập nguyên tắc trở thành bias, được áp dụng đồng nhất trên toàn bộ tập dữ liệu. Sự xu nịnh với một người đánh giá giảm, và vấn đề proxy ở lại.

## Full answer

### The two phases

1. Tự phê bình và sửa đổi. Bắt đầu từ một mô hình SFT hữu ích nhưng chưa vô hại. Với một prompt red-team, mô hình viết một câu trả lời, lượt thứ hai đọc một nguyên tắc lấy mẫu và phê bình câu trả lời, và lượt thứ ba sửa nó. Bản sửa là mục tiêu SFT. Công trình gốc dùng 16 nguyên tắc và giữ tập nhỏ để các phê bình tập trung.
2. RL từ phản hồi AI. Sinh các cặp, để một mô hình phản hồi xếp hạng chúng theo các nguyên tắc lấy mẫu, huấn luyện một reward model trên các thứ hạng đó, và chạy PPO theo nó. Mọi thứ sau nhãn là pipeline tiêu chuẩn.

### Why it is not only cheaper

- Bias di chuyển. Một người đánh giá không nhất quán và hài lòng bởi đồng ý; một mô hình phản hồi áp dụng một cách đọc nguyên tắc cho mọi cặp, nghiêm hoặc lỏng, nhưng đồng nhất.
- Tín hiệu đọc được. Bạn có thể đọc nguyên tắc, phê bình và bản sửa cho bất kỳ ví dụ nào; các nhãn con người không rõ.
- Goodhart ở lại. Proxy giờ là cách đọc tập nguyên tắc của một mô hình, vẫn là một thước đo không hoàn hảo, nên tối ưu hóa quá mức theo nó vẫn có thể.
- Bên gán nhãn là cùng lớp mô hình bạn huấn luyện, nên một bias trong nó có thể được khuếch đại thay vì được lấy trung bình triệt tiêu.

### What the original work claimed

Mô hình được huấn luyện vô hại hơn và hữu ích gần bằng một mô hình RLHF với dữ liệu tương đương. Kết quả đó đã giữ qua các phòng thí nghiệm.

### A gate next to the training

Một phòng vệ song song huấn luyện các bộ phân loại nhẹ đọc cùng các nguyên tắc và kiểm soát các đầu ra. Phiên bản đầu tốn thêm 23.7 phần trăm tính toán; phiên bản sau khoảng 1 phần trăm. Huấn luyện định hình hành vi và các bộ phân loại thực thi các bất biến; không bên nào đủ khi riêng lẻ.

## Follow-ups

- **Level 2:** Tại sao công thức lấy mẫu một nguyên tắc mỗi phê bình thay vì cho mô hình toàn bộ danh sách? Expected: một phê bình tập trung cụ thể hơn và hữu ích hơn làm mục tiêu huấn luyện; toàn bộ danh sách được bao phủ qua nhiều mẫu.
- **Level 2:** Các phần nào của pipeline thay đổi và các phần nào giữ nguyên? Expected: nguồn nhãn và các mục tiêu SFT thay đổi; reward model, giai đoạn RL và KL penalty giữ nguyên.
- **Level 3:** Nêu một lỗi giống xu nịnh vẫn xảy ra với một bên gán nhãn AI, và một kiểm tra cho nó. Expected: mô hình phản hồi có thể thích các câu trả lời trích nguyên tắc mà không theo chúng; để người đánh giá một tập giữ lại và so sánh hai thứ hạng.
- **Level 4:** Bạn lập luận cho một thứ tự ưu tiên giữa các nguyên tắc như thế nào? Expected: các xung đột giữa nguyên tắc cần một quy tắc giải quyết; một thứ tự theo tầng giải quyết từ trên xuống, từ tác hại thảm họa đến các quy tắc nền tảng đến đạo đức chung đến tính hữu ích.

## Wrong answers

- "Các nhãn giờ miễn phí, nên thu thập nhiều cặp hơn gấp mười." Nhiều cặp hơn với cùng bias đồng nhất làm bias mạnh hơn, không yếu hơn; mức tăng khối lượng không sửa proxy.
- "Một bên gán nhãn AI loại bỏ bias con người khỏi alignment." Nó thay bias người đánh giá bằng bias diễn giải nguyên tắc; các nguyên tắc và cách đọc của bên gán nhãn giờ là proxy.
- "Đây chỉ là một thủ thuật an toàn; nó không chạm tính hữu ích." Công trình gốc báo cáo tính hữu ích gần bằng RLHF với dữ liệu tương đương, và cùng vòng lặp phê bình có thể nhắm bất kỳ nguyên tắc nào bạn viết.

## Taught in

[Bài học Constitutional AI](../../../phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/) trình bày cả hai pha và dịch chuyển các chế độ lỗi, và [bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) đặt RLAIF giữa các nguồn của một tín hiệu preference.
