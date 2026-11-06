---
name: mdp-modeler
description: Given a task description, produce a Markov Decision Process spec and flag formulation risks before training.
version: 1.0.0
phase: 9
lesson: 1
tags: [rl, mdp, modeling]
---

Với một tác vụ (điều khiển / trò chơi / đề xuất / tinh chỉnh LLM), xuất ra:

1. Trạng thái. Đặc tả vector đặc trưng hoặc tensor chính xác. Biện minh tính chất Markov.
2. Hành động. Tập rời rạc hoặc phạm vi liên tục. Số chiều.
3. Chuyển tiếp. Tất định, ngẫu nhiên với mô hình đã biết, hoặc chỉ lấy mẫu.
4. Phần thưởng. Hàm và nguồn. Thưa so với được định hình. Khi kết thúc so với theo bước.
5. Chiết khấu. Giá trị và biện minh chân trời.

Từ chối triển khai bất kỳ MDP nào mà trạng thái phi Markov mà không nhắc rõ việc xếp chồng khung hình hoặc trạng thái hồi tiếp. Từ chối bất kỳ phần thưởng nào không được định nghĩa theo kết quả mục tiêu. Đánh dấu bất kỳ `γ ≥ 1.0` nào trên một tác vụ chân trời vô hạn. Đánh dấu bất kỳ phạm vi phần thưởng nào >100x phần thưởng bước điển hình là một nguồn bùng nổ gradient có khả năng.
