---
id: lr-peak-sweep
title: Sweep the peak learning rate and mark divergence
card: coding
kind: take-home
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, take-home]
tags: [learning-rate, sweep, divergence, schedule]
minutes: 25
lessons: [phases/19-capstone-projects/44-cosine-lr-warmup]
manuals: []
practice: [lab-learning-rate-sweep]
cheatsheet: [optimizers-schedules]
related: [coding/adamw-decoupled-decay]
updated: 2026-11-03
---

Trước một lần huấn luyện dài bạn được yêu cầu chọn learning rate đỉnh cho một lịch warmup và cosine. Viết phép quét huấn luyện một mô hình nhỏ được đặt seed ở mỗi rate ứng viên, quyết định những lần chạy nào đã phân kỳ, chọn rate ổn định tốt nhất và báo cáo rate nhỏ nhất đã phân kỳ. Nêu "phân kỳ" có nghĩa là gì trong mã.

## Short answer

Chạy cùng một vòng lặp huấn luyện được đặt seed một lần cho mỗi rate ứng viên và ghi lại loss cuối cùng cùng lịch sử loss. Một lần chạy đã phân kỳ khi loss cuối cùng của nó không hữu hạn hoặc khi loss tăng trong lần chạy, không chỉ khi nó trở thành NaN. Rate tốt nhất là loss cuối cùng thấp nhất trong số các lần chạy ổn định, với rate nhỏ hơn khi bằng nhau, và rate phân kỳ nhỏ nhất được báo cáo làm trần, vì nó giới hạn đỉnh có thể cao đến mức nào.

## Full answer

### Why the peak first

Lời khuyên của bài học lịch là quét đỉnh trước bất cứ thứ gì khác, vì đỉnh là núm nhạy nhất và giá trị tối ưu của nó thay đổi yếu theo kích thước mô hình. Một phép quét trên một mô hình nhỏ là một tiên nghiệm mạnh cho lần chạy lớn. Tỷ lệ warmup và mức sàn ít quan trọng hơn và đến sau.

### The sweep

```python
def is_diverged(losses):
    final = losses[-1]
    return not np.isfinite(final) or final > losses[0]


def run_sweep(rates, train_fn, seed):
    results = {}
    for lr in rates:
        losses = train_fn(lr, seed)
        results[lr] = (losses[-1], is_diverged(losses))
    return results


def best_lr(results):
    stable = [(loss, lr) for lr, (loss, div) in results.items() if not div]
    return min(stable)[1] if stable else None


def smallest_diverging_lr(results):
    div = [lr for lr, (_, d) in results.items() if d]
    return min(div) if div else None
```

Mọi lần chạy dùng cùng seed để khác biệt duy nhất giữa các lần chạy là rate. Các kết quả được khóa theo rate, và bộ lọc phân kỳ chạy trước bất kỳ argmin nào, vì một loss cuối cùng NaN được so sánh là không lớn hơn cũng không nhỏ hơn và nếu không sẽ được chọn. Khi mọi lần chạy đều phân kỳ, `best_lr` trả về `None` và lưới phải dịch xuống thấp hơn.

### What diverged means

Một loss kết thúc hữu hạn nhưng cao hơn nơi nó bắt đầu cũng là một sự phân kỳ. Một lần chạy có thể tăng trong toàn bộ phép quét và vẫn trả về một con số. Chỉ kiểm tra các giá trị không hữu hạn đánh dấu lần chạy đó là ổn định và phép quét khi đó khuyến nghị một rate sẽ làm lần chạy dài bùng nổ sau khi warmup kết thúc.

### Reading the result

Lịch đạt đỉnh ở cuối warmup và giảm dần về mức sàn. Một đỉnh ngay dưới rate phân kỳ nhỏ nhất là táo bạo; một đỉnh có khoảng cách an toàn dưới nó sống sót qua các chuẩn gradient nhiễu của những bước đầu tiên. Ghi log chuẩn gradient cạnh rate trên lần chạy được chọn: một warmup được điều chỉnh tốt cho thấy chuẩn tăng theo rate rồi ổn định, và một đỉnh quá cao cho thấy một chuẩn vẫn cao sau warmup.

## Follow-ups

- **Level 3:** Hai rate cho cùng loss cuối cùng. Bạn chọn rate nào? Expected: rate nhỏ hơn; nó có khoảng cách an toàn lớn hơn với trần phân kỳ.
- **Level 3:** Tại sao bài thực hành so sánh rate phân kỳ đầu tiên với hai chia cho độ cong lớn nhất của loss? Expected: đối với một loss bậc hai, gradient descent chỉ ổn định dưới giới hạn đó, vì vậy trần đo được phải nằm gần nó và sự không khớp chỉ ra một lỗi trong phép quét.
- **Level 4:** Warmup được đặt là một số bước tuyệt đối. Tại sao phép quét trên một lần chạy ngắn khi đó làm lần chạy dài hiểu sai? Expected: cùng số bước đó là một tỷ lệ nhỏ hơn nhiều của một lần chạy dài, vì vậy lần chạy dài nằm ở đỉnh gần như ngay lập tức; đặt warmup là một tỷ lệ của tổng số bước.

## Wrong answers

- "Chọn rate có loss thấp nhất trên tất cả các lần chạy." Một NaN hoặc một lần chạy đang tăng phải được lọc trước, nếu không argmin có thể trả về một rate đã phân kỳ.
- "Một lần chạy chỉ phân kỳ nếu loss là NaN hoặc vô cực." Một loss hữu hạn tăng trong lần chạy là một sự phân kỳ mà lần chạy dài cũng sẽ thể hiện.
- "Quét độ dài warmup trước vì nó bảo vệ phần đầu." Đỉnh là núm nhạy nhất; tỷ lệ warmup được điều chỉnh sau nó.

## Taught in

[Bài học lịch cosine](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) nói quét đỉnh trước và ghi lại chuẩn gradient bên cạnh rate, và [bài lab quét learning rate](../../../practice/lab-learning-rate-sweep/) triển khai phép quét với quy tắc phân kỳ của nó.
