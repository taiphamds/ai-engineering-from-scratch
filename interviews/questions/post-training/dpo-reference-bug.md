---
id: dpo-reference-bug
title: A DPO trainer whose loss never moves
card: post-training
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, debugging]
tags: [dpo, reference-model, code-reading, gradient-sign]
minutes: 12
lessons: [phases/19-capstone-projects/40-dpo-from-scratch, phases/10-llms-from-scratch/08-dpo]
manuals: []
practice: [dpo-loss]
cheatsheet: [rlhf-dpo]
related: [post-training/dpo-implicit-reward]
updated: 2026-11-03
---

Một đồng đội viết lõi của một bộ huấn luyện DPO. Loss giữ ở giá trị bắt đầu trong toàn bộ lần chạy, và margin được ghi log không bao giờ thay đổi. Đọc mã và tìm điều sai.

```python
policy = TinyGPT(config)
reference = policy


def sequence_log_prob(model, prompt_ids, completion_ids):
    ids = torch.cat([prompt_ids, completion_ids])
    logits = model(ids[:-1].unsqueeze(0))[0]
    log_probs = logits.log_softmax(-1)
    targets = ids[1:]
    return log_probs[torch.arange(len(targets)), targets].sum()


def dpo_loss(prompt, chosen, rejected, beta=0.1):
    pi_w = sequence_log_prob(policy, prompt, chosen)
    pi_l = sequence_log_prob(policy, prompt, rejected)
    ref_w = sequence_log_prob(reference, prompt, chosen)
    ref_l = sequence_log_prob(reference, prompt, rejected)
    z = beta * ((pi_l - ref_l) - (pi_w - ref_w))
    return -torch.nn.functional.logsigmoid(z)
```

## Short answer

Ba điều. Reference là cùng đối tượng với policy, nên cả hai tỷ số log bằng không theo cấu tạo và loss là một hằng số không có gradient; xây reference như một bản sao riêng, đóng băng nó, và chạy nó không có gradient. Margin có sai dấu, nên một khi sửa aliasing, bộ huấn luyện thúc đẩy câu trả lời rejected. Log xác suất cũng lấy tổng trên các vị trí prompt, điều capstone mask đi.

## Full answer

### Bug 1: the reference is the policy

`reference = policy` ràng buộc một tên thứ hai vào một module. Mọi lượt forward qua `reference` dùng các trọng số policy hiện tại, nên `pi_w - ref_w` và `pi_l - ref_l` chính xác bằng không, và loss là một hằng số. Bộ tối ưu thấy một gradient không. Chỉ một deep copy cũng không đủ: reference cần `requires_grad=False` trên mọi tham số, các lượt forward của nó thuộc về dưới `torch.no_grad()`, và policy phải bắt đầu từ cùng trọng số, ví dụ với `policy.load_state_dict(reference.state_dict())`.

### Bug 2: the margin has the wrong sign

Loss là âm log sigmoid của beta nhân tỷ số log chosen trừ tỷ số log rejected. Mã trừ theo thứ tự kia. Gradient theo log xác suất chosen phải âm, để tăng nó giảm loss. Với dấu đảo ngược, bộ huấn luyện giảm câu trả lời chosen và tăng câu trả lời rejected. Một unit test kiểm tra dấu gradient trên một cặp bắt điều này.

### Observation 3: the prompt is in the sum

`sequence_log_prob` lấy tổng trên mọi vị trí, gồm prompt. Với một prompt dùng chung, các số hạng prompt triệt tiêu trong margin, nên giá trị đúng. Nhưng bộ huấn luyện tính và backpropagate qua các vị trí không mang tín hiệu preference, và sự triệt tiêu hỏng khi một chuỗi dài bị cắt ở độ dài tối đa. Bắt đầu tổng ở vị trí câu trả lời đầu tiên, như capstone làm.

### How to test the fix

- Loss trên một cặp giảm khi bạn tăng log xác suất chosen bằng tay.
- Các log xác suất reference giống hệt giữa các epoch.
- Margin chosen trừ rejected trung bình dưới policy tăng trong huấn luyện.

## Follow-ups

- **Level 2:** Sau khi sửa, bạn xác nhận reference không bao giờ thay đổi như thế nào? Expected: assert không tham số reference nào cần gradient, và so sánh các log xác suất của nó trên một cặp cố định trước và sau một epoch.
- **Level 3:** Tại sao mọi cặp bắt đầu ở cùng loss trước huấn luyện? Expected: policy bằng reference, nên cả hai tỷ số log bằng không và sigmoid nằm ở một nửa; margin tăng từ đó.
- **Level 3:** Margin tăng, nhưng các câu trả lời được sinh tệ hơn. Bạn ghi log gì tiếp? Expected: log xác suất chosen tuyệt đối; DPO có thể đẩy nó xuống miễn là rejected giảm nhanh hơn.
- **Level 4:** Bạn có giữ các vị trí prompt nếu hai câu trả lời có prompt khác nhau không? Expected: không, và loss dù sao cũng sẽ sai; phép suy ra cần một prompt mỗi cặp, vì số hạng phân hoạch chỉ triệt tiêu khi đó.

## Wrong answers

- "Giảm learning rate; loss phẳng vì các bước quá nhỏ." Gradient chính xác bằng không trong khi reference là alias của policy; không kích thước bước nào sửa điều đó.
- "Dấu không quan trọng, bộ tối ưu tìm hướng." Dấu quyết định câu trả lời nào bộ huấn luyện thúc đẩy; đảo ngược, nó huấn luyện mô hình thích các câu trả lời rejected.
- "Thay tổng bằng trung bình để ổn định loss." Điều đó biến mục tiêu thành một biến thể chuẩn hóa độ dài; đó là một lựa chọn thiết kế, không phải cách sửa một loss hằng.

## Taught in

[Capstone DPO](../../../phases/19-capstone-projects/40-dpo-from-scratch/) ghim tính bất biến reference và dấu gradient bằng các kiểm thử, và [bài học DPO](../../../phases/10-llms-from-scratch/08-dpo/) tính bốn log xác suất cho mỗi cặp.
