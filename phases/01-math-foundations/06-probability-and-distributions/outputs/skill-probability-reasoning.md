---
name: skill-probability-reasoning
description: Choose the right probability distribution for a given ML problem
version: 1.0.0
phase: 1
lesson: 6
tags: [probability, distributions, modeling]
---

# Probability Distribution Selection

Cách chọn phân phối phù hợp khi mô hình hóa dữ liệu, thiết kế hàm mất mát hoặc đặt các phân phối tiên nghiệm.

## Decision Checklist

1. Kết quả là rời rạc (các loại, số đếm) hay liên tục (số đo, điểm số)?
2. Kết quả bị chặn (ví dụ, [0, 1]) hay không bị chặn?
3. Có bao nhiêu kết quả có thể? Hai? k? Vô hạn?
4. Dữ liệu đối xứng hay lệch?
5. Các biến cố độc lập hay tương quan?
6. Bạn đang mô hình hóa một tần suất, số đếm, tỉ lệ hay số đo?

## Distribution decision tree

```
Is the variable discrete?
  Yes --> Only 2 outcomes? --> Bernoulli (p)
     |    k outcomes, one trial? --> Categorical (p1...pk)
     |    k outcomes, n trials? --> Multinomial (n, p1...pk)
     |    Count of successes in n trials? --> Binomial (n, p)
     |    Count of events per interval? --> Poisson (lambda)
     |    Count of trials until first success? --> Geometric (p)
     |    Count of trials until r successes? --> Negative Binomial (r, p)
  No --> Symmetric, bell-shaped? --> Normal (mu, sigma)
     |   Positive values, right-skewed? --> Log-normal or Exponential
     |   Bounded in [0, 1]? --> Beta (alpha, beta)
     |   Positive values, flexible shape? --> Gamma (alpha, beta)
     |   Time between events? --> Exponential (lambda)
     |   Heavy tails needed? --> Student's t (nu) or Cauchy
     |   Multivariate, bell-shaped? --> Multivariate Normal
     |   On a simplex (sums to 1)? --> Dirichlet (alpha)
```

## Mapping real-world ML scenarios to distributions

| Tình huống | Phân phối | Tham số |
|---|---|---|
| Đầu ra phân loại nhị phân | Bernoulli | p = sigmoid(logit) |
| Đầu ra phân loại đa lớp | Categorical | p = softmax(logits) |
| Dự đoán token trong các mô hình ngôn ngữ | Categorical trên từ vựng | p từ softmax |
| Cường độ pixel (đã chuẩn hóa) | Beta hoặc Đều [0, 1] | Phụ thuộc thống kê hình ảnh |
| Số từ trong một tài liệu | Poisson | lambda = số từ trung bình |
| Thời gian giữa các yêu cầu của người dùng | Mũ | lambda = tần suất yêu cầu |
| Sai số đo lường | Chuẩn | mu = 0, sigma từ dữ liệu |
| Khởi tạo trọng số | Chuẩn hoặc Đều | Các quy tắc Kaiming/Xavier |
| Tiên nghiệm không gian ẩn VAE | Chuẩn tắc | mu = 0, sigma = 1 |
| Tiên nghiệm Bayes trên các tỉ lệ | Beta | alpha, beta từ niềm tin |
| Tiên nghiệm Bayes trên các trọng số loại | Dirichlet | vector alpha |
| Nhiễu trong các mục tiêu hồi quy | Chuẩn | mu = 0, sigma được ước lượng |
| Hồi quy bền vững với ngoại lệ | Student's t | bậc tự do thấp |
| Mô hình hóa thời lượng/tuổi thọ | Weibull hoặc Gamma | hình dạng và thang đo |
| Phân phối chủ đề theo tài liệu (LDA) | Dirichlet | alpha < 1 để có tính thưa |

## When distributions go wrong

- Sử dụng Chuẩn khi dữ liệu có một cận dưới cứng (ví dụ, giá cả, khoảng cách). Phân phối chuẩn gán xác suất khác không cho các giá trị âm. Thay vào đó sử dụng log-chuẩn hoặc gamma.
- Sử dụng Poisson khi phương sai khác trung bình. Poisson giả định trung bình = phương sai. Nếu phương sai > trung bình, sử dụng nhị thức âm.
- Sử dụng Bernoulli cho các bài toán đa lớp. Bernoulli hoàn toàn nhị phân. Sử dụng categorical cho k > 2.
- Giả định tính độc lập khi các quan sát tương quan. Chuỗi thời gian, dữ liệu không gian và dữ liệu theo nhóm vi phạm tính độc lập. Sử dụng các mô hình tự hồi quy hoặc phân cấp.

## Common mistakes

- Nhầm lẫn giá trị PDF với xác suất. Một PDF có thể vượt quá 1. Xác suất đến từ việc lấy tích phân PDF trên một khoảng.
- Quên rằng đầu ra softmax là các xác suất categorical, không phải các xác suất Bernoulli độc lập. Chúng có tổng bằng 1 theo cách xây dựng.
- Sử dụng tiên nghiệm đều khi bạn có kiến thức chuyên môn. Các tiên nghiệm có thông tin giảm phương sai mà không làm chệch kết quả nếu được chọn tốt.
- Xem xác suất log như xác suất. Xác suất log luôn âm (hoặc bằng không). Chúng không có tổng bằng 1.

## Quick reference: distribution properties

| Phân phối | Miền giá trị | Trung bình | Phương sai | Tính chất chính |
|---|---|---|---|---|
| Bernoulli(p) | {0, 1} | p | p(1-p) | Rời rạc đơn giản nhất |
| Binomial(n, p) | {0..n} | np | np(1-p) | Tổng của n Bernoulli |
| Poisson(lam) | {0, 1, 2, ...} | lam | lam | Trung bình = phương sai |
| Normal(mu, s^2) | (-inf, inf) | mu | s^2 | Entropy lớn nhất với trung bình/phương sai cho trước |
| Exponential(lam) | [0, inf) | 1/lam | 1/lam^2 | Không nhớ |
| Beta(a, b) | [0, 1] | a/(a+b) | ab/((a+b)^2(a+b+1)) | Liên hợp với Binomial |
| Gamma(a, b) | (0, inf) | a/b | a/b^2 | Liên hợp với Poisson |
| Dirichlet(alpha) | Simplex | alpha_i/sum | (xem công thức) | Liên hợp với Categorical |
