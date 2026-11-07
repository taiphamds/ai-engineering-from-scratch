---
id: daa-still-overoptimize
title: Does dropping the reward model end reward hacking
card: post-training
kind: concept
level: 4
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, design-review]
tags: [dpo, over-optimization, goodhart, implicit-reward, alignment]
minutes: 12
lessons: [phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/10-llms-from-scratch/08-dpo]
manuals: []
practice: []
cheatsheet: [alignment-training, rlhf-dpo]
related: [post-training/dpo-chosen-logprob-falls, post-training/reward-up-humans-flat]
updated: 2026-11-03
---

Một kỹ sư staff lập luận rằng chuyển mọi lần chạy alignment từ PPO sang các phương pháp preference trực tiếp kết thúc vấn đề reward hacking, vì không còn reward model để hack. Đưa ra phản biện với cơ chế, và nói điều gì ở lại trong pipeline của bạn theo cả hai cách.

## Short answer

Các phương pháp trực tiếp loại bỏ reward model tường minh, không phải proxy. Đại lượng chúng tối ưu là tỷ số log của policy trên reference, một reward ngầm mà dữ liệu preference chỉ cố định ở nơi dữ liệu có bao phủ. Dưới tối ưu hóa, policy truy vấn tỷ số đó ngoài phân phối, và các đường cong đã công bố của gold reward theo KL cho thấy cùng đỉnh rồi sụp như các pipeline reward-model, với KL regularization không ổn định được nó. Những gì ở lại: một đánh giá giữ lại mù, early stopping, dữ liệu preference rộng hơn, và các ensemble tín hiệu.

## Full answer

### The mechanism

DPO viết lại reward thành beta nhân tỷ số log của policy trên reference. Hàm đó được khớp từ các cặp, và chỉ bị ràng buộc trên các cặp. Mọi nơi khác, giá trị của nó là bất cứ thứ gì cách tham số hóa hàm ý. Khi policy di chuyển để tăng margin, nó lấy mẫu từ những vùng không cặp nào bao phủ, nơi reward ngầm tùy ý. Nghiên cứu quy luật scale cho tối ưu hóa quá mức trong direct alignment huấn luyện các policy qua các ngân sách KL và tìm thấy cùng hình dạng như tối ưu hóa quá mức reward-model: gold reward tăng, đạt đỉnh, và giảm khi KL tăng.

### Where Goodhart bites now

Trong stack PPO, proxy là một reward model được huấn luyện. Trong stack trực tiếp, proxy là tỷ số đối chiếu reference. Các lỗi trông khác nhau: phản hồi chosen suy giảm, nơi câu trả lời chosen mất xác suất trong khi margin tăng; khai thác độ dài, nơi một bên thắng dài hơn đệm khoảng cách; reward tùy ý trên các cặp hiếm dưới reference. Chúng là một bệnh trong một cơ quan khác.

### Why the KL does not save it

Trong PPO, số hạng KL tường minh và điều chỉnh được, và một bộ điều khiển thích nghi giữ nó gần một mục tiêu. Trong DPO, neo mang tính cấu trúc: sigmoid bão hòa khi tỷ số tăng. Kết quả nghiên cứu là regularization cấu trúc này không dừng sự sụp. Beta thay tốc độ, không phải hình dạng.

### What survives in any pipeline

- Một đánh giá con người hoặc giám khảo tin cậy mù, giữ lại trên một tập prompt cố định, được đọc ở mọi checkpoint. Đó là tín hiệu duy nhất policy không thể chơi.
- Early stopping trên đánh giá đó, không phải trên margin huấn luyện.
- Dữ liệu: bao phủ các vùng policy trôi vào, được thu thập từ các mẫu của policy hiện tại.
- Ensemble: nhiều tín hiệu reward hoặc nhiều loss trên một bộ kiểm tra, vì một cách khai thác hiếm khi phù hợp tất cả.
- Log của log xác suất chosen tuyệt đối và KL đến reference, để sự trôi nhìn thấy trước khi đánh giá giảm.

### The honest version of the claim

Các phương pháp trực tiếp thực sự loại bỏ một mô hình để huấn luyện và host, sự không ổn định của PPO, và lớp khai thác nằm trong các trọng số reward model. Chúng là mặc định cho phần lớn các lần chạy post-training tiên phong vì những lý do đó. Chúng không loại bỏ nhu cầu bảo vệ chống tối ưu hóa quá mức, nên biện pháp bảo vệ chuyển vào thiết kế pipeline.

## Follow-ups

- **Level 3:** Cụ thể DPO loại bỏ gì khỏi stack PPO? Expected: một reward model để huấn luyện và host, vòng lặp PPO với clip và value head, và một hệ số KL tường minh; nó giữ reference đóng băng.
- **Level 4:** Biến thể nào chặn khoảng cách, và điều đó mang lại gì chống lỗi này? Expected: loss ánh xạ đồng nhất, có mục tiêu margin là một chia hai beta; nó ngăn một preference yếu tạo một reward ngầm không giới hạn, loại bỏ một đường đến sụp nhưng không phải truy vấn ngoài phân phối.
- **Level 4:** Bạn phát hiện tối ưu hóa quá mức không có gold reward như thế nào? Expected: một đánh giá giữ lại có sinh, log xác suất chosen tuyệt đối, KL đến reference, và một so sánh giữa các checkpoint; một margin tăng trong khi đánh giá giảm là dấu hiệu.
- **Level 4:** Lặp, với các cặp mới từ policy hiện tại mỗi vòng, có giúp không? Expected: có, nó di chuyển độ bao phủ dữ liệu đến nơi policy sống, là điều proxy tỷ số reference thiếu; nó cũng đưa lại một vòng lặp online cần quy tắc dừng riêng.

## Wrong answers

- "Không có reward model có nghĩa không có gì để hack." Reward ngầm là một hàm dữ liệu chỉ cố định trên các cặp; policy có thể đẩy nó ở bất kỳ nơi khác.
- "KL cấu trúc trong DPO đủ regularization." Các đường cong đã công bố cho thấy cùng đỉnh và sụp qua các ngân sách KL; beta thay tốc độ, không phải hình dạng.
- "Dùng beta nhỏ hơn để policy học nhanh hơn và bạn có thể dừng sớm hơn." Một beta nhỏ hơn để policy di chuyển xa reference hơn mỗi đơn vị margin, là hướng của lỗi.

## Taught in

[Bài học họ DPO](../../../phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/) nêu kết quả tối ưu hóa quá mức phổ quát và các cách sửa chuyển được, và [bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) liệt kê các biện pháp bảo vệ tối ưu hóa quá mức mà mọi pipeline giữ.
