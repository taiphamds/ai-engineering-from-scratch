---
id: two-pass-at-k-formulas
title: Two harnesses, two pass at k formulas
card: evaluation
kind: code-reading
level: 3
roles: [ai-evaluation-reliability-engineer, agentic-ai-engineer, applied-ai-engineer]
rounds: [coding, ml-depth]
tags: [pass-at-k, estimator, code-exec, bias]
minutes: 10
lessons: [phases/19-capstone-projects/27-eval-harness-fixture-tasks, phases/19-capstone-projects/72-code-exec-metric]
manuals: []
practice: []
cheatsheet: [eval-driven-agents]
related: [evaluation/pass-at-k-reading]
updated: 2026-11-03
---

Hai harness trong repo tính pass at k. Cái đầu lấy tỷ lệ đạt thực nghiệm p và trả về `1 - (1 - p) ** k`. Cái thứ hai lấy số mẫu n, số lần đạt c và k, và trả về `1 - C(n - c, k) / C(n, k)`. Đọc cả hai. Khi nào chúng đồng ý, khi nào khác nhau, và cái nào đi vào báo cáo?

## Short answer

Công thức đầu coi mọi lần lấy là độc lập với xác suất thành công p và là một ước lượng thế vào. Công thức thứ hai đếm xác suất chính xác rằng k mẫu lấy từ n mẫu bạn chạy chứa ít nhất một lần đạt, và nó là ước lượng không chệch mà các benchmark sinh mã dùng. Chúng chỉ đồng ý khi n tăng lớn; với các mẫu bạn chạy, ước lượng thế vào thấp hơn và nhiễu hơn, và nó ngoại suy khi k vượt n. Báo cáo ước lượng không chệch với các số đếm thô cạnh nó.

## Full answer

### Reading the first function

```python
def pass_at_k(empirical_pass_rate, k):
    if k <= 0:
        return 0
    p = max(0, min(1, empirical_pass_rate))
    return 1 - (1 - p) ** k
```

Nó chặn p và giả định các lần lấy độc lập. Nó chấp nhận bất kỳ k nào, gồm k lớn hơn số mẫu harness chạy, vì vậy nó có thể in pass at ten từ năm mẫu.

### Reading the second function

```python
def pass_at_k(n, c, k):
    if k > n:
        return float(c > 0)
    if n - c < k:
        return 1
    log_prob = 0
    for i in range(k):
        log_prob += math.log(n - c - i) - math.log(n - i)
    return 1 - math.exp(log_prob)
```

Nó từ chối ngoại suy: với k trên n nó trả về liệu bất kỳ mẫu nào đạt, là một đại lượng khác và nên được gắn nhãn như vậy. Khi ít hơn k mẫu thất bại, mọi tập con k chứa một lần đạt, vì vậy nó trả về một. Nếu không nó nhân xác suất mỗi lần trong k lần lấy không hoàn lại là một thất bại, trong không gian log để tránh các hệ số nhị thức lớn. Lớp ước lượng lấy trung bình giá trị này trên các nhiệm vụ.

### Where they differ

Lấy k bằng n. Cái thứ hai nói một bất cứ khi nào một mẫu duy nhất đạt. Cái đầu nói nhỏ hơn một, vì nó tưởng tượng lấy có hoàn lại. Nhìn chung, lấy không hoàn lại làm tất cả k thất bại ít có khả năng hơn, vì vậy giá trị chính xác bằng hoặc trên ước lượng thế vào cho cùng n và c. Ước lượng thế vào cũng là một ước lượng chệch có phương sai cao ở n nhỏ.

### What to report

Chạy n mẫu mỗi nhiệm vụ với n ít nhất bằng k, như trong ví dụ của capstone về mười mẫu và pass at five. Báo cáo pass at one là c chia n, pass at k từ hàm không chệch, và các số đếm thô. Không bao giờ in một pass at k cho k mà bạn chưa lấy mẫu.

## Follow-ups

- **Level 3:** Trong hàm thứ hai, tại sao trả về một khi n trừ c nhỏ hơn k? Expected: bạn không thể chọn k mẫu thất bại từ ít hơn k thất bại, vì vậy mọi tập con k chứa một lần đạt.
- **Level 3:** Tại sao tính tích trong không gian log? Expected: các hệ số nhị thức tràn với n vừa phải; log của tỷ số là một tổng log ngắn.
- **Level 4:** Một nhóm chạy năm mẫu mỗi nhiệm vụ và báo cáo pass at ten. Điều gì sai? Expected: k vượt n, vì vậy không gì được đo; hàm thứ hai quay về liệu bất kỳ mẫu nào đạt và hàm đầu ngoại suy.
- **Level 4:** Hai hàm có đồng ý trên pass at one không? Expected: có; cả hai rút gọn thành c chia n khi k là một.

## Wrong answers

- "Chúng là cùng công thức." Chúng chỉ đồng ý khi n tăng; với các mẫu bạn chạy, ước lượng thế vào thấp hơn và nhiễu hơn.
- "Pass at k là xác suất agent đúng." Nó là xác suất một tập k mẫu chứa ít nhất một lần đạt; không có bộ chọn người dùng vẫn nhận một mẫu.
- "Thêm mẫu mỗi nhiệm vụ nâng pass at one." Chúng làm ước lượng chính xác hơn; giá trị là tỷ lệ đạt mỗi mẫu.

## Taught in

[Capstone harness đánh giá](../../../phases/19-capstone-projects/27-eval-harness-fixture-tasks/) dùng công thức độc lập, và [capstone metric thực thi mã](../../../phases/19-capstone-projects/72-code-exec-metric/) đưa ra ước lượng không chệch và các trường hợp biên của nó.
