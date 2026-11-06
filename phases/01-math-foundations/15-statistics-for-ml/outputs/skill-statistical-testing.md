---
name: skill-statistical-testing
description: Choose the right statistical test for comparing ML models and evaluating experiments
version: 1.0.0
phase: 1
lesson: 15
tags: [statistics, hypothesis-testing, model-comparison]
---

# Statistical Testing for ML

Cách chọn kiểm định phù hợp khi so sánh mô hình, chạy các thí nghiệm A/B hoặc xác minh kết quả.

## Decision Checklist

1. Bạn đang so sánh gì? Trung bình, tỉ lệ, phân phối hay tương quan?
2. Bao nhiêu nhóm? Một mẫu so với tham chiếu, hai nhóm hay nhiều nhóm?
3. Các quan sát ghép cặp (cùng tập kiểm tra, cùng fold) hay độc lập?
4. Dữ liệu có phân phối chuẩn không? Nếu n < 30 và không rõ là chuẩn, sử dụng phi tham số.
5. Dữ liệu liên tục, thứ bậc hay phân loại?
6. Bạn đang chạy bao nhiêu kiểm định? Áp dụng hiệu chỉnh nếu nhiều hơn một.

## Decision tree

```text
Comparing means?
  Two groups?
    Paired (same data splits)? --> Paired t-test (or Wilcoxon signed-rank if non-normal)
    Independent? --> Welch's t-test (or Mann-Whitney U if non-normal)
  Multiple groups?
    Paired? --> Repeated measures ANOVA (or Friedman test)
    Independent? --> One-way ANOVA (or Kruskal-Wallis)

Comparing proportions?
  Two groups? --> Chi-squared test or Fisher's exact test (small n)
  Multiple groups? --> Chi-squared test

Comparing distributions?
  Is one distribution a reference? --> Kolmogorov-Smirnov test
  Are both empirical? --> Two-sample KS test

Measuring association?
  Both continuous, roughly normal? --> Pearson correlation
  Ordinal or non-normal? --> Spearman rank correlation
  Categorical x Categorical? --> Chi-squared test of independence

Running many tests?
  Apply Bonferroni correction: alpha_adjusted = alpha / number_of_tests
  Or use Holm-Bonferroni (less conservative, still controls family-wise error)
```

## When to use each test

| Kiểm định | Loại dữ liệu | Giả định | Trường hợp sử dụng ML |
|---|---|---|---|
| t-test ghép cặp | Liên tục, ghép cặp | Hiệu có phân phối chuẩn | So sánh 2 mô hình trên cùng các phần chia k-fold |
| Wilcoxon signed-rank | Liên tục/thứ bậc, ghép cặp | Không có (phi tham số) | So sánh 2 mô hình, k nhỏ (5-10 fold) |
| t-test Welch | Liên tục, độc lập | Xấp xỉ chuẩn | So sánh mô hình trên hai tập dữ liệu riêng biệt |
| Mann-Whitney U | Liên tục/thứ bậc, độc lập | Không có | So sánh các phân phối độ trễ |
| ANOVA | Liên tục, 3+ nhóm | Chuẩn, phương sai bằng nhau | So sánh nhiều kiến trúc mô hình |
| Kruskal-Wallis | Liên tục/thứ bậc, 3+ nhóm | Không có | So sánh nhiều mô hình, chỉ số không chuẩn |
| Chi bình phương | Số đếm phân loại | Số đếm kỳ vọng >= 5 | So sánh phân phối lớp, ma trận nhầm lẫn |
| Kiểm định chính xác Fisher | Số đếm phân loại | Mẫu nhỏ | So sánh biến cố hiếm |
| Kiểm định KS | Liên tục | Không có | Kiểm tra xem các dự đoán có theo phân phối kỳ vọng không |
| Khoảng tin cậy bootstrap | Bất kỳ thống kê nào | Không có | Khoảng tin cậy cho AUC, F1, bất kỳ chỉ số nào |
| Kiểm định McNemar | Nhị phân ghép cặp | Không có | So sánh hai bộ phân loại trên cùng tập kiểm tra |

## Model comparison recipe

1. Xác định chỉ số và mức ý nghĩa (alpha = 0.05) trước khi chạy thí nghiệm.
2. Chạy cả hai mô hình trên cùng các phần chia xác thực chéo k-fold (k = 5 hoặc 10).
3. Thu thập các điểm số ghép cặp: (a_1, b_1), (a_2, b_2), ..., (a_k, b_k).
4. Tính các hiệu: d_i = b_i - a_i.
5. Chạy kiểm định ghép cặp (Wilcoxon cho k <= 10, t-test ghép cặp cho k > 10 hoặc các hiệu chuẩn).
6. Báo cáo: p-value, chênh lệch trung bình, khoảng tin cậy 95%, kích thước hiệu ứng (Cohen's d).
7. Nếu p < alpha VÀ kích thước hiệu ứng có ý nghĩa, khác biệt là thật và đáng hành động.

## Common mistakes

- Sử dụng kiểm định độc lập khi dữ liệu ghép cặp. Nếu cả hai mô hình được đánh giá trên cùng các fold kiểm tra, bạn phải sử dụng kiểm định ghép cặp. Kiểm định độc lập bỏ đi việc ghép cặp và mất lực kiểm định.
- Báo cáo p < 0.05 mà không có kích thước hiệu ứng. Cải thiện độ chính xác 0.1% có ý nghĩa thống kê không đáng triển khai. Luôn tính Cohen's d hoặc chênh lệch trung bình thô.
- So sánh mô hình trên các tập kiểm tra khác nhau. Tập kiểm tra PHẢI giống hệt cho cả hai mô hình. Các tập kiểm tra khác nhau khiến so sánh vô nghĩa.
- Chạy 20 phép so sánh và báo cáo phép tốt nhất mà không có hiệu chỉnh Bonferroni. Với 20 kiểm định tại alpha = 0.05, bạn kỳ vọng 1 dương tính giả do ngẫu nhiên.
- Sử dụng accuracy trên dữ liệu mất cân bằng. Với một lớp đa số 99%, một bộ phân loại tầm thường đạt 99%. Sử dụng F1, precision-recall AUC hoặc hệ số tương quan Matthews.
- Xem các fold xác thực chéo là các mẫu độc lập. Chúng chia sẻ dữ liệu huấn luyện, vi phạm giả định độc lập. t-test lấy mẫu lại có hiệu chỉnh xét đến điều này.

## Quick reference: effect size interpretation

| Cohen's d | Diễn giải |
|---|---|
| 0.2 | Hiệu ứng nhỏ |
| 0.5 | Hiệu ứng trung bình |
| 0.8 | Hiệu ứng lớn |
| > 1.0 | Hiệu ứng rất lớn |

| Cần báo cáo gì | Lý do |
|---|---|
| p-value | Khác biệt có thật không? |
| Khoảng tin cậy | Khác biệt có thể lớn đến mức nào? |
| Kích thước hiệu ứng (Cohen's d) | Khác biệt có ý nghĩa không? |
| Kích thước mẫu (n hoặc k fold) | Chúng ta có thể tin kết quả không? |
