# Theory of Mind and Emergent Coordination

> Li và cộng sự (arXiv:2310.10701) cho thấy các agent LLM trong một trò chơi văn bản hợp tác thể hiện **Theory of Mind bậc cao nổi lên** (ToM) — suy luận về những gì một agent khác tin về các niềm tin của agent thứ ba — nhưng thất bại ở lập kế hoạch tầm thời gian dài do quản lý ngữ cảnh và ảo giác. Riedl (arXiv:2510.05174) đo hiệp lực bậc cao trên một quần thể và thấy rằng **chỉ** điều kiện prompt ToM tạo ra khác biệt hóa gắn với danh tính và tính bổ trợ hướng mục tiêu; các LLM dung lượng thấp hơn chỉ cho thấy sự nổi lên giả. Nghĩa là, sự nổi lên phối hợp phụ thuộc prompt và mô hình, không miễn phí. Bài này triển khai một agent nhận biết ToM tối thiểu, chạy một tác vụ hợp tác có và không có prompt ToM, và đo chênh lệch phối hợp theo giao thức Riedl 2025.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 17 (Generative Agents)
**Time:** ~75 minutes

## Problem

Phối hợp đa agent thường trông kỳ diệu: các agent chia lao động, dự đoán nhau, tránh dư thừa. Thường “sự nổi lên” này là một sản phẩm của kỹ thuật prompt — ai đó bảo các agent “phối hợp.” Bỏ prompt, bỏ phối hợp.

Phát hiện năm 2025 của Riedl nghiêm ngặt hơn: dưới các điều kiện được kiểm soát, phối hợp chỉ nổi lên khi các agent được prompt để suy luận về **tâm trí của các agent khác** (ToM). Không có prompt ToM, ngay cả các mô hình mạnh cũng cho thấy các mẫu phối hợp không tồn tại qua các kiểm soát thống kê. Điều này quan trọng cho sản xuất: các nhóm phát hành các tính năng “phối hợp đa agent” phụ thuộc prompt và mong manh.

Bài này coi ToM như một năng lực cụ thể (suy luận về niềm tin về niềm tin), xây dựng một agent nhận biết ToM tối thiểu, và đo phối hợp thực trông như thế nào so với trang trí bằng prompt.

## Concept

### What ToM means

Tâm lý học phát triển: một trẻ 3 tuổi nghĩ thế giới nội tâm của bất kỳ ai cũng khớp với của mình. Một trẻ 5 tuổi hiểu người khác có các niềm tin khác nhau. Một trẻ 7 tuổi suy luận về niềm tin về niềm tin (“cô ấy nghĩ rằng tôi nghĩ quả bóng ở dưới cái cốc”). Đây là ToM bậc không, bậc một, và bậc hai.

Với các agent LLM, các bậc ToM ánh xạ tới:

- **Bậc không:** không có mô hình về những bên khác. Agent chỉ hành động theo các quan sát riêng.
- **Bậc một:** agent có một mô hình niềm tin của mỗi agent khác. “Alice tin X.”
- **Bậc hai:** agent mô hình hóa các niềm tin đệ quy. “Alice tin rằng Bob tin X.”

Li và cộng sự năm 2023 thấy ToM bậc một và bậc hai nổi lên trong các agent LLM ở các trò chơi hợp tác nhưng suy giảm với tầm thời gian dài và giao tiếp không đáng tin cậy.

### The Sally-Anne test, in brief

Một kiểm tra niềm tin sai năm 1985: Sally đặt một viên bi vào giỏ A, rời đi. Anne chuyển nó sang giỏ B. Sally sẽ tìm ở đâu khi quay lại? Một trẻ có ToM bậc một nói giỏ A (niềm tin của Sally khác thực tế). Một trẻ không có nói giỏ B.

Các LLM thời GPT-4 vượt các kiểm tra kiểu Sally-Anne khi được đặt thẳng. Chúng thất bại khi câu chuyện dài, cảnh thay đổi vài lần, hoặc câu hỏi được diễn đạt gián tiếp. Đó là trạng thái thực tế năm 2026 của ToM trong các LLM sản xuất.

### Riedl's coordination measurement

Riedl (arXiv:2510.05174) xây dựng một kiểm tra quy mô quần thể: N agent, một mục tiêu hợp tác, các điều kiện prompt biến thiên. Đo:

1. **Khác biệt hóa gắn với danh tính.** Các agent có phát triển các phân biệt vai trò ổn định theo thời gian không?
2. **Tính bổ trợ hướng mục tiêu.** Các hành động của agent có bổ trợ nhau (các tác vụ con khác nhau) thay vì trùng lặp không?
3. **Hiệp lực bậc cao.** Một phép đo thống kê về liệu nhóm đạt những gì không tập con nào có thể đạt không.

Kết quả: chỉ dưới điều kiện prompt ToM cả ba chỉ số tạo ra tín hiệu trên đường cơ sở. Không có prompt ToM, các chỉ số dao động gần ngẫu nhiên cho các mô hình dung lượng vừa phải. Các mô hình lớn cho thấy một số phối hợp không có prompt ToM tường minh nhưng hiệu ứng nhỏ hơn so với prompt tường minh.

### The coordination illusion

Không có các kiểm soát thống kê, “phối hợp nổi lên” trong các demo thường phản ánh:

- Kỹ thuật prompt tích hợp phối hợp (các prompt hệ thống nói “làm việc cùng nhau”).
- Thiên lệch người quan sát (chúng ta thấy các mẫu chúng ta kỳ vọng).
- Chọn các lần chạy thành công sau sự việc.

Các hệ thống sản xuất tiếp thị “phối hợp nổi lên” không có tín hiệu đo được nên được coi là tiếp thị. Đo trước khi tuyên bố.

### A minimal ToM-aware agent

Cấu trúc:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

Thuộc tính `other_models` là trạng thái ToM. ToM bậc một chỉ giữ một cấp. Bậc hai thêm `other_models[i][other_models_of_j]` — những gì tôi nghĩ agent i nghĩ agent j tin.

### Why long-horizon hurts

Li và cộng sự ghi nhận: các giới hạn ngữ cảnh khiến các agent quên niềm tin nào thuộc về ai. Ảo giác thêm các niềm tin sai vào các mô hình agent khác. Cả hai tạo ra các lỗi “tôi nghĩ anh ấy nghĩ X” cộng dồn theo thời gian.

Các biện pháp giảm thiểu được ghi nhận trong bài báo và các công trình tiếp nối giai đoạn 2024-2026:

- **Trạng thái ToM tường minh trong prompt.** Định dạng có cấu trúc: `{agent_id: belief_list}`. Buộc truy xuất bảo toàn liên kết danh tính-niềm tin.
- **Các chuỗi suy luận ngắn hơn.** Ít cập nhật ToM hơn mỗi lượt giảm ảo giác cộng dồn.
- **Kho ToM bên ngoài.** Duy trì mô hình ngoài ngữ cảnh LLM; chỉ chèn các phần liên quan theo từng lượt.

### Where ToM fails in production

- **Các bối cảnh đối kháng.** Các agent có ToM tốt dễ bị thao túng hơn (bạn có thể mô hình hóa những gì chúng mô hình hóa về bạn, rồi khai thác).
- **Các nhóm không đồng nhất.** Khi các mô hình khác nhau, mô hình ToM hoạt động cho một đối thủ không khái quát hóa.
- **Các tác vụ phụ thuộc chuẩn tham chiếu.** ToM là về niềm tin; nếu tính đúng đắn phụ thuộc các sự kiện, ToM có thể là một sự phân tâm.

### The coordination you can actually measure

Ba tín hiệu thực tế rằng phối hợp của một nhóm là thực thay vì được trang trí bằng prompt:

1. **Tính bổ trợ theo thời gian.** Qua một tác vụ nhiều lượt, các hành động của agent có bao phủ các tác vụ con rời nhau không?
2. **Dự đoán.** Hành động của agent A ở lượt T+1 có phụ thuộc vào một dự đoán về hành động của B ở T+2 mà hóa ra đúng không?
3. **Sửa chữa.** Khi A đọc sai niềm tin của B ở lượt T, A có sửa trước lượt T+2 không?

Những điều này đo được trong một hệ thống đa agent được ghi nhật ký. Chúng là phiên bản thực chất của câu chuyện “phối hợp”.

```figure
sw-theory-of-mind
```

## Build It

`code/main.py` triển khai:

- `ToMAgent` — theo dõi các niềm tin riêng và các mô hình niềm tin theo từng agent khác.
- Một tác vụ hợp tác: ba agent phải thu thập ba token từ ba hộp; mỗi hộp có thể giữ một token. Các agent không thể giao tiếp; chúng suy ra ý định từ các hành động của nhau.
- Hai cấu hình: `zeroth_order` (không ToM) và `first_order` (ToM với mô hình niềm tin một cấp).
- Đo trên 200 lần thử ngẫu nhiên hóa: tỷ lệ hoàn thành, tỷ lệ trùng lặp (hai agent nhắm cùng hộp), số lượt trung bình tới hoàn thành.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: các agent bậc không trùng nỗ lực ở tỷ lệ ~35% và hoàn thành ~60% lần thử trong 10 lượt. Các agent ToM bậc một trùng ở ~5% và hoàn thành ~95%. Chênh lệch là hiệu ứng phối hợp đo được.

## Use It

`outputs/skill-tom-auditor.md` là một skill kiểm toán tuyên bố “phối hợp nổi lên” của một hệ thống đa agent. Kiểm tra trang trí bằng prompt, ý nghĩa thống kê so với một đối chứng, và tính bổ trợ đo được.

## Ship It

Danh sách kiểm tra các tuyên bố phối hợp:

- **Điều kiện đối chứng.** Một phiên bản hệ thống của bạn không có prompt phối hợp. Đo cả hai.
- **Kiểm định thống kê.** Khác biệt giữa hệ thống và đối chứng có ý nghĩa ở `p < 0.05` trên chỉ số của bạn không?
- **Phép đo tính bổ trợ.** Tính rời nhau hành động theo thời gian, không chỉ thành công cuối cùng.
- **Nhật ký trường hợp thất bại.** Khi các agent phối hợp sai, trạng thái ToM trông thế nào?
- **Tiết lộ dung lượng mô hình.** Nếu hiệu ứng biến mất trên các mô hình nhỏ hơn, hãy nói vậy.

## Exercises

1. Chạy `code/main.py`. Xác nhận ToM bậc một giảm tỷ lệ trùng lặp ~7x. Khoảng cách có tồn tại khi bạn mở rộng tới 5 agent và 5 hộp không?
2. Triển khai ToM bậc hai (agent A mô hình hóa những gì B nghĩ về C). Nó có cải thiện so với bậc một không? Trên những tác vụ nào?
3. Chèn một **ảo giác** vào trạng thái ToM: lật ngẫu nhiên một niềm tin mỗi lượt. Điều này làm suy giảm hiệu năng bậc một bao nhiêu?
4. Đọc Li và cộng sự (arXiv:2310.10701). Tái tạo phát hiện “suy giảm tầm thời gian dài”: khi các lượt tăng từ 10 lên 30, hiệu năng ToM bậc một của bạn thay đổi như thế nào?
5. Đọc Riedl 2025 (arXiv:2510.05174). Triển khai thống kê hiệp lực bậc cao trên các nhật ký mô phỏng. Hiệu ứng có hiện diện không có điều kiện prompt ToM không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Theory of Mind (Lý thuyết tâm trí) | “Hiểu tâm trí các bên khác” | Năng lực mô hình hóa niềm tin của một agent khác. Phân cấp theo bậc (0, 1, 2+). |
| Sally-Anne test (Kiểm tra Sally-Anne) | “Kiểm tra niềm tin sai” | Tâm lý học phát triển năm 1985; các LLM vượt các phiên bản đơn giản, thất bại ở các phiên bản phức tạp. |
| First-order ToM (ToM bậc một) | “A tin X” | Mô hình hóa niềm tin của một bên khác về các sự kiện. |
| Second-order ToM (ToM bậc hai) | “A tin B tin X” | Mô hình hóa đệ quy sâu hơn một cấp. |
| Identity-linked differentiation (Khác biệt hóa gắn với danh tính) | “Các vai trò ổn định theo thời gian” | Chỉ số của Riedl: các vai trò bền vững, không ngẫu nhiên. |
| Goal-directed complementarity (Tính bổ trợ hướng mục tiêu) | “Các hành động rời nhau” | Các agent nhắm các tác vụ con khác nhau, không cùng một tác vụ. |
| Higher-order synergy (Hiệp lực bậc cao) | “Nhóm vượt bất kỳ tập con nào” | Phép đo thống kê của Riedl cho phối hợp thực. |
| Coordination illusion (Ảo tưởng phối hợp) | “Nó trông có phối hợp” | Vẻ ngoài phối hợp được trang trí bằng prompt không có tín hiệu đo được. |

## Further Reading

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) — ToM nổi lên trong các trò chơi hợp tác; các chế độ lỗi tầm thời gian dài
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) — phép đo quy mô quần thể; prompt ToM là điều kiện chịu lực
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) — nguồn gốc năm 1978 của khái niệm ToM
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://doi.org/10.1016/0010-0277(85)90022-8) — bài báo Sally-Anne (1985)
