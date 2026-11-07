---
id: wilson-or-bootstrap
title: Error bars for a pass rate and for a mean
card: evaluation
kind: concept
level: 3
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [confidence-interval, wilson, bootstrap, statistics]
minutes: 8
lessons: [phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/fifty-cases-is-not-enough]
updated: 2026-11-03
---

Báo cáo đánh giá của bạn hiển thị hai loại con số: một tỷ lệ đạt, là tỷ lệ trường hợp đạt 4 trở lên, và một điểm bộ chấm trung bình trên một thang 1 đến 5. Một người rà soát yêu cầu thanh sai số trên cả hai. Bạn dùng khoảng nào cho mỗi loại, và tại sao không cùng một khoảng?

## Short answer

Dùng một khoảng Wilson cho tỷ lệ đạt và một khoảng bootstrap cho điểm trung bình. Một tỷ lệ đạt là một tỷ lệ, và khoảng Wilson giữ đúng ở các mẫu nhỏ và gần không hoặc một, nơi xấp xỉ chuẩn hỏng. Một trung bình các điểm bộ chấm thứ bậc không có dạng đóng gọn, và bootstrap lấy mẫu lại các điểm có hoàn lại và hoạt động với bất kỳ phân phối nào.

## Full answer

### The Wilson interval

```text
center = (p + z^2 / (2n)) / (1 + z^2 / n)
spread = z * sqrt( (p (1 - p) + z^2 / (4n)) / n ) / (1 + z^2 / n)
```

Với z ở 1.96 cho 95 phần trăm. Tâm dịch về một nửa khi n nhỏ, và các cận được chặn về không và một. Ở 50 trường hợp và độ chính xác 90 phần trăm nó cho 78 đến 97 phần trăm. Khoảng chuẩn sẽ cho các cận có thể rời khoảng đơn vị và một độ rộng sai ở các cực.

### The bootstrap interval

Lấy mẫu lại n điểm có hoàn lại, tính trung bình, lặp một nghìn lần, sắp xếp các trung bình và đọc các phân vị tại alpha chia hai từ mỗi đầu. Nó chỉ giả định rằng mẫu đại diện tổng thể. Nó không thể sửa một mẫu chệch hoặc rất nhỏ, và nó tốn tính toán thay vì đại số.

### Comparing two runs

Không khoảng nào tự nó so sánh hai hệ thống. Với hai phiên bản prompt chạy trên cùng các trường hợp, xây khoảng trên chênh lệch ghép cặp theo trường hợp, bằng bootstrap trên các trường hợp hoặc một kiểm định ghép cặp. Hai khoảng riêng chồng nhau không chứng minh bằng nhau, và hai khoảng không chồng nhau không cần thiết để chứng minh một khác biệt.

## Follow-ups

- **Level 3:** Điều gì sai với một khoảng cộng hoặc trừ một sai số chuẩn trên một tỷ lệ? Expected: ở n nhỏ hoặc gần không hoặc một nó cho các cận ngoài khoảng đơn vị và độ rộng sai; Wilson sửa cả hai.
- **Level 3:** Một bootstrap giả định gì? Expected: rằng mẫu đại diện tổng thể; nó không cần hình dạng phân phối, nhưng không thể sửa một mẫu chệch hoặc rất nhỏ.
- **Level 4:** Hai phiên bản prompt chạy trên cùng 200 trường hợp. Khoảng nào quyết định? Expected: một khoảng trên chênh lệch ghép cặp theo trường hợp; hai khoảng chồng nhau không chứng minh bằng nhau.

## Wrong answers

- "Cộng hoặc trừ sai số chuẩn là ổn." Khoảng chuẩn thất bại ở các mẫu nhỏ và các tỷ lệ cực đoan, chính là nơi các bản phát hành được quyết định.
- "Bootstrap cũng hoạt động cho tỷ lệ đạt, vì vậy dùng nó ở mọi nơi." Nó hoạt động, nhưng Wilson có dạng đóng, rẻ và được xây cho các tỷ lệ; giữ mã kiểm toán được.
- "Các khoảng chồng nhau nghĩa là không có khác biệt." Hai khoảng riêng có thể chồng nhau trong khi chênh lệch ghép cặp loại trừ không; so sánh chênh lệch.

## Taught in

[Bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) xây dựng khoảng Wilson và bootstrap và giải thích khi nào mỗi loại áp dụng.
