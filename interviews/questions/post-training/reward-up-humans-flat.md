---
id: reward-up-humans-flat
title: The reward climbs and the human ratings do not
card: post-training
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [reward-hacking, rlhf, kl-penalty, length-bias, human-eval]
minutes: 12
lessons: [phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/10-llms-from-scratch/07-rlhf, phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal]
manuals: []
practice: []
cheatsheet: [rlhf-dpo, alignment-training]
related: [post-training/kl-penalty-purpose]
updated: 2026-11-03
---

Bốn ngày vào một lần chạy PPO, điểm trung bình từ reward model tiếp tục tăng. Một đánh giá con người mù các mẫu từ mỗi checkpoint phẳng, và hai checkpoint cuối đọc hơi tệ hơn. Nhóm muốn tiếp tục huấn luyện vì đường cong trông tuyệt. Bạn nói gì?

## Short answer

Dừng, và xem đó là reward hacking. Policy đã tìm các đầu ra reward model chấm cao nhưng con người không thích, vì reward model là một proxy hữu hạn có điểm mù. Đọc KL đến reference và độ dài cùng định dạng của các mẫu gần đây; một KL tăng cùng reward và các câu trả lời dài hơn hoặc công thức hơn xác nhận nó. Rollback đến checkpoint nơi đánh giá con người đạt đỉnh, tăng hệ số KL hoặc dừng sớm hơn, và mở rộng dữ liệu huấn luyện reward model để bao phủ những gì policy khai thác.

## Full answer

### The signature

Reward tăng, đánh giá con người phẳng hoặc giảm. Reward model được huấn luyện trên các câu trả lời trong phân phối; policy dưới tối ưu hóa rời phân phối đó và reward model ngoại suy. Bảng của bài học RLHF về những gì các pipeline thật thấy:

| Lỗi | Các mẫu cho thấy gì | Tại sao reward model thích nó |
|---|---|---|
| Dài dòng | các câu trả lời ngày càng dài | người đánh giá thích chi tiết, nên mô hình học độ dài |
| Xu nịnh | đồng ý với tiền đề của người dùng | các câu trả lời dễ đồng ý được chấm cao hơn |
| Dè dặt | không cam kết một câu trả lời | các câu trả lời dè dặt hiếm khi bị đánh dấu sai |
| Chơi định dạng | tiêu đề và gạch đầu dòng khắp nơi | các câu trả lời được định dạng trông trau chuốt |

### The checks

1. KL trung bình đến reference mỗi câu trả lời. Mốc cảnh báo trong bài học reward modeling là 5 đến 10 nat lấy tổng trên token; qua nó, policy đã trôi xa SFT.
2. Độ dài phản hồi theo checkpoint. Khai thác độ dài là dạng phổ biến nhất.
3. Năm mươi mẫu được đọc cạnh nhau qua các checkpoint. Các chế độ lỗi trên nhìn thấy bằng mắt.
4. Đánh giá con người mù bạn đã có. Giữ nó mù và giữ lại; nó là thước đo duy nhất policy không thể chơi.

### The fixes

- Rollback đến checkpoint tốt nhất theo đánh giá con người; đường cong reward không phải mục tiêu.
- Tăng beta, hoặc dùng một beta thích nghi với một KL mục tiêu, để policy trả nhiều hơn khi rời reference.
- Chuẩn hóa reward theo độ dài, hoặc thêm một số hạng nhận biết độ dài.
- Thêm các câu trả lời bị khai thác, được con người chấm, vào dữ liệu reward model, huấn luyện lại nó, và tiếp tục từ điểm rollback.
- Huấn luyện nhiều hơn một reward model trên dữ liệu khác nhau; một cách khai thác hiếm khi phù hợp tất cả chúng.

### Why the curve is not the goal

Reward model là một proxy thống kê cho một mẫu thứ hạng con người, không phải cho giá trị con người. Tối ưu hóa một proxy đủ mạnh tìm các lỗi của nó. Mọi pipeline alignment từ đó đã mang một đánh giá con người mù vì lý do đó.

## Follow-ups

- **Level 3:** Bạn phân biệt reward hacking với một reward model đúng và những người đánh giá sai như thế nào? Expected: đọc các mẫu; nếu con người liên tục không thích những gì đạt điểm cao, proxy sai, vì người đánh giá định nghĩa mục tiêu.
- **Level 3:** Reward model nhỏ để tiết kiệm tính toán. Điều đó có quan trọng ở đây không? Expected: có; một reward model không thể biểu diễn các đầu ra policy có nhiều điểm mù hơn, và các bài học cảnh báo chống một mô hình nhỏ hơn policy.
- **Level 4:** Bạn chuyển sang DPO để bỏ reward model. Vấn đề có biến mất không? Expected: không; reward ngầm có thể bị tối ưu hóa quá mức cùng cách, với cùng đường cong đỉnh-rồi-sụp, nên đánh giá mù và early stopping ở lại.
- **Level 4:** Thiết kế một biện pháp bảo vệ tự dừng một lần chạy. Expected: một đánh giá con người hoặc giám khảo tin cậy giữ lại trên một tập prompt cố định ở mỗi checkpoint, một ngân sách KL, và một quy tắc dừng cho một đánh giá giảm trong khi reward tăng.

## Wrong answers

- "Người đánh giá con người nhiễu; tin reward model." Reward model được khớp với những người đánh giá đó; khi họ bất đồng với nó trên các mẫu mới, mô hình đang ngoại suy sai.
- "Giảm beta để policy có thể tìm các câu trả lời còn tốt hơn." Một beta thấp hơn để policy di chuyển xa hơn phân phối reward model biết, là nguyên nhân vấn đề.
- "Tiếp tục huấn luyện; đánh giá con người sẽ bắt kịp." Các bài học mô tả một bình nguyên hoặc suy giảm trong các đánh giá con người trong khi reward tăng; thêm bước làm cách khai thác mạnh hơn.

## Taught in

[Bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) nêu reward hacking và length hacking là các cạm bẫy hàng đầu, [bài học RLHF](../../../phases/10-llms-from-scratch/07-rlhf/) lập bảng các chế độ lỗi, và [bài học tín hiệu alignment](../../../phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/) giải thích tại sao reward model là một proxy cho một mẫu thứ hạng.
