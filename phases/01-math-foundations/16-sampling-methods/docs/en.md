# Sampling Methods

> Lấy mẫu là cách AI khám phá không gian các khả năng.

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## Learning Objectives

- Triển khai lấy mẫu CDF ngược, loại bỏ và quan trọng từ đầu chỉ bằng các số ngẫu nhiên đều
- Xây dựng lấy mẫu temperature, top-k và top-p (nucleus) để sinh token mô hình ngôn ngữ
- Giải thích thủ thuật tái tham số hóa và tại sao nó cho phép lan truyền ngược qua việc lấy mẫu trong VAE
- Chạy MCMC Metropolis-Hastings để lấy mẫu từ một phân phối mục tiêu chưa chuẩn hóa

## The Problem

Một mô hình ngôn ngữ xử lý xong prompt của bạn và tạo ra một vector gồm 50,000 logits. Một cho mỗi token trong từ vựng của nó. Giờ nó phải chọn một. Bằng cách nào?

Nếu nó luôn chọn token có xác suất cao nhất, mọi phản hồi giống hệt nhau. Tất định. Nhàm chán. Nếu nó chọn ngẫu nhiên đều, đầu ra vô nghĩa. Câu trả lời nằm ở đâu đó giữa các cực này, và vị trí đó được điều khiển bằng lấy mẫu.

Lấy mẫu không giới hạn ở sinh văn bản. Học tăng cường ước lượng gradient chính sách bằng cách lấy mẫu các quỹ đạo. VAE học các biểu diễn ẩn bằng cách lấy mẫu từ các phân phối đã học và lan truyền ngược qua tính ngẫu nhiên. Các mô hình khuếch tán tạo hình ảnh bằng cách lấy mẫu nhiễu và lặp lại khử nhiễu. Các phương pháp Monte Carlo ước lượng các tích phân không có nghiệm dạng đóng. Các thuật toán MCMC khám phá các phân phối hậu nghiệm nhiều chiều không thể liệt kê.

Mọi hệ thống AI tạo sinh là một hệ thống lấy mẫu. Chiến lược lấy mẫu quyết định chất lượng, độ đa dạng và khả năng điều khiển đầu ra. Bài học này xây dựng mọi phương pháp lấy mẫu chính từ đầu, bắt đầu từ các số ngẫu nhiên đều và kết thúc với các kỹ thuật vận hành LLM và mô hình tạo sinh hiện đại.

## The Concept

### Why Sampling Matters

Lấy mẫu xuất hiện trong bốn vai trò cơ bản trên AI và học máy:

**Sinh.** Các mô hình ngôn ngữ, mô hình khuếch tán và GAN đều tạo đầu ra bằng cách lấy mẫu. Thuật toán lấy mẫu trực tiếp điều khiển tính sáng tạo, mạch lạc và đa dạng. Temperature, top-k và lấy mẫu nucleus là những núm mà các kỹ sư điều chỉnh hằng ngày.

**Huấn luyện.** Gradient descent ngẫu nhiên lấy mẫu các mini-batch. Dropout lấy mẫu các nơ-ron để vô hiệu hóa. Tăng cường dữ liệu lấy mẫu các phép biến đổi ngẫu nhiên. Lấy mẫu quan trọng điều chỉnh lại trọng số các mẫu để giảm phương sai gradient trong học tăng cường (PPO, TRPO).

**Ước lượng.** Nhiều đại lượng trong ML không có nghiệm dạng đóng. Mất mát kỳ vọng trên một phân phối dữ liệu, hàm phân hoạch của một mô hình dựa trên năng lượng, bằng chứng trong suy luận Bayes. Ước lượng Monte Carlo xấp xỉ tất cả bằng cách lấy trung bình trên các mẫu.

**Khám phá.** Các thuật toán MCMC khám phá các phân phối hậu nghiệm trong suy luận Bayes. Các chiến lược tiến hóa lấy mẫu các nhiễu loạn tham số. Lấy mẫu Thompson cân bằng khám phá và khai thác trong bandit.

Thách thức cốt lõi: bạn chỉ có thể lấy mẫu trực tiếp từ các phân phối đơn giản (đều, chuẩn). Với mọi thứ khác, bạn cần một phương pháp chuyển các mẫu đơn giản thành các mẫu từ phân phối mục tiêu.

### Uniform Random Sampling

Mọi phương pháp lấy mẫu bắt đầu ở đây. Một bộ sinh số ngẫu nhiên đều tạo ra các giá trị trong [0, 1) nơi mọi khoảng con có độ dài bằng nhau có xác suất bằng nhau.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

Để lấy mẫu đều từ một tập rời rạc gồm n mục, tạo U và trả về floor(n * U). Để lấy mẫu từ một khoảng liên tục [a, b], tính a + (b - a) * U.

Điểm cốt yếu: một số ngẫu nhiên đều duy nhất chứa chính xác lượng ngẫu nhiên phù hợp để tạo một mẫu từ bất kỳ phân phối nào. Thủ thuật là tìm phép biến đổi phù hợp.

### Inverse CDF Method (Inverse Transform Sampling)

Hàm phân phối tích lũy (CDF) ánh xạ các giá trị thành xác suất:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF ngược ánh xạ xác suất trở lại thành các giá trị. Nếu U ~ Uniform(0, 1), thì X = F_inverse(U) tuân theo phân phối mục tiêu.

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Ví dụ phân phối mũ:**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

Điều này hoạt động hoàn hảo khi bạn có thể viết F_inverse ở dạng đóng. Với phân phối chuẩn, không có CDF ngược dạng đóng, nên chúng ta sử dụng các phương pháp khác (Box-Muller hoặc xấp xỉ số).

**Phiên bản rời rạc:** Với các phân phối rời rạc, xây dựng CDF dưới dạng tổng tích lũy, tạo U và tìm chỉ số đầu tiên mà tổng tích lũy vượt U. Đây là cách `sample_categorical` hoạt động trong Bài học 06.

### Rejection Sampling

Khi bạn không thể nghịch đảo CDF nhưng có thể tính PDF mục tiêu tới một hằng số, lấy mẫu loại bỏ hoạt động.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

Cận M càng chặt, tỉ lệ chấp nhận càng cao. Trong không gian ít chiều (1-3), lấy mẫu loại bỏ hoạt động tốt. Trong không gian nhiều chiều, tỉ lệ chấp nhận giảm theo hàm mũ vì hầu hết thể tích đề xuất bị loại bỏ. Đây là lời nguyền số chiều đối với lấy mẫu loại bỏ.

**Ví dụ: lấy mẫu từ một phân phối chuẩn bị cắt cụt.** Sử dụng một phân phối đề xuất đều trên khoảng cắt cụt. Đường bao M là giá trị lớn nhất của PDF chuẩn trong khoảng đó.

**Ví dụ: lấy mẫu từ một nửa hình tròn.** Đề xuất đều trong hình chữ nhật bao. Chấp nhận nếu điểm rơi trong nửa hình tròn. Đây là cách Monte Carlo tính pi: tỉ lệ chấp nhận bằng tỉ lệ diện tích pi/4.

### Importance Sampling

Đôi khi bạn không cần các mẫu từ phân phối mục tiêu p(x). Bạn cần ước lượng một kỳ vọng theo p(x), và bạn có các mẫu từ một phân phối khác q(x).

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Điều này rất quan trọng trong học tăng cường. Trong PPO (Tối ưu hóa Chính sách Lân cận), bạn thu thập các quỹ đạo theo một chính sách cũ pi_old nhưng muốn tối ưu hóa một chính sách mới pi_new. Trọng số quan trọng là pi_new(a|s) / pi_old(a|s). PPO cắt các trọng số này để ngăn chính sách mới lệch quá xa chính sách cũ.

Phương sai của bộ ước lượng lấy mẫu quan trọng phụ thuộc vào mức độ q tương tự p. Nếu q rất khác p, một vài mẫu nhận trọng số khổng lồ và chi phối ước lượng. Lấy mẫu quan trọng tự chuẩn hóa chia cho tổng các trọng số để giảm vấn đề này:

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Monte Carlo Estimation

Ước lượng Monte Carlo xấp xỉ tích phân bằng cách lấy trung bình các mẫu ngẫu nhiên. Định luật số lớn bảo đảm hội tụ.

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

Tốc độ sai số độc lập với số chiều. Đây là lý do các phương pháp Monte Carlo chiếm ưu thế trong không gian nhiều chiều nơi tích phân dựa trên lưới là bất khả thi.

**Ước lượng pi:**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**Ước lượng các kỳ vọng:**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### Markov Chain Monte Carlo (MCMC): Metropolis-Hastings

MCMC xây dựng một chuỗi Markov có phân phối dừng là phân phối mục tiêu p(x). Sau đủ bước, các mẫu từ chuỗi là (xấp xỉ) các mẫu từ p(x).

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

Với các đề xuất đối xứng (q(x'|x) = q(x|x')), tỉ số đơn giản thành p(x')/p(x). Đây là thuật toán Metropolis gốc.

**Tại sao nó hoạt động.** Quy tắc chấp nhận bảo đảm cân bằng chi tiết: xác suất ở x và chuyển đến x' bằng xác suất ở x' và chuyển đến x. Cân bằng chi tiết hàm ý p(x) là phân phối dừng của chuỗi.

**Các cân nhắc thực tế:**
- Burn-in: bỏ các mẫu đầu trước khi chuỗi đạt cân bằng
- Làm thưa: giữ mỗi mẫu thứ k để giảm tự tương quan
- Thang đo đề xuất: quá nhỏ và chuỗi di chuyển chậm (chấp nhận cao, khám phá chậm); quá lớn và hầu hết đề xuất bị loại bỏ (chấp nhận thấp, kẹt tại chỗ)
- Tỉ lệ chấp nhận tối ưu cho một đề xuất Gaussian trong không gian nhiều chiều xấp xỉ 0.234

### Gibbs Sampling

Lấy mẫu Gibbs là một trường hợp đặc biệt của MCMC cho các phân phối đa biến. Thay vì đề xuất một bước di chuyển trong mọi chiều cùng lúc, nó cập nhật từng biến từ phân phối có điều kiện của nó.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

Lấy mẫu Gibbs đòi hỏi bạn có thể lấy mẫu từ mỗi phân phối có điều kiện p(x_i | x_{-i}). Điều này đơn giản cho nhiều mô hình:
- Mạng Bayes: các phân phối có điều kiện suy ra từ cấu trúc đồ thị
- Hỗn hợp Gaussian: các phân phối có điều kiện là Gaussian
- Mô hình Ising: phân phối có điều kiện của mỗi spin chỉ phụ thuộc vào các láng giềng của nó

Tỉ lệ chấp nhận luôn là 1 (mọi đề xuất được chấp nhận) vì lấy mẫu từ phân phối có điều kiện chính xác tự động thỏa mãn cân bằng chi tiết.

**Hạn chế.** Khi các biến tương quan cao, lấy mẫu Gibbs trộn chậm vì cập nhật từng biến không thể thực hiện các bước chéo lớn qua phân phối.

### Temperature Sampling (Used in LLMs)

Các mô hình ngôn ngữ xuất ra logits z_1, ..., z_V cho mỗi token trong từ vựng. Softmax chuyển chúng thành xác suất. Temperature điều chỉnh lại tỉ lệ logits trước softmax:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**Tại sao nó hoạt động.** Chia logits cho T < 1 khuếch đại khác biệt giữa các logits. Nếu z_1 = 2 và z_2 = 1, chia cho T = 0.5 cho z_1/T = 4 và z_2/T = 2, làm khoảng cách lớn hơn. Sau softmax, token có logit cao nhất nhận phần lớn hơn nhiều.

**Trong thực tế:**
- T = 0.0: giải mã tham lam, tốt nhất cho hỏi đáp dựa trên sự kiện
- T = 0.3-0.7: hơi sáng tạo, tốt cho sinh mã
- T = 0.7-1.0: cân bằng, tốt cho hội thoại chung
- T = 1.0-1.5: viết sáng tạo, động não
- T > 1.5: ngày càng ngẫu nhiên, hiếm khi hữu ích

Temperature không thay đổi những token nào có thể. Nó thay đổi khối xác suất được phân bổ cho mỗi token.

### Top-k Sampling

Lấy mẫu top-k giới hạn tập ứng viên về k token có xác suất cao nhất, rồi chuẩn hóa lại và lấy mẫu từ tập bị giới hạn đó.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

Top-k ngăn mô hình chọn các token cực kỳ ít có khả năng (lỗi gõ, vô nghĩa) tồn tại ở đuôi dài của phân phối từ vựng. Vấn đề: k cố định bất kể ngữ cảnh. Khi mô hình tự tin (một token có xác suất 95%), k = 40 vẫn cho phép 39 lựa chọn khác. Khi mô hình không chắc chắn (xác suất trải trên 1000 token), k = 40 cắt bỏ các lựa chọn hợp lý.

### Top-p (Nucleus) Sampling

Lấy mẫu top-p điều chỉnh động kích thước tập ứng viên. Thay vì giữ một số token cố định, nó giữ tập token nhỏ nhất có xác suất tích lũy vượt p.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

Khi mô hình tự tin, lấy mẫu nucleus giữ ít token (có thể 2-3). Khi mô hình không chắc chắn, nó giữ nhiều (có thể 200). Hành vi thích nghi này là lý do lấy mẫu nucleus thường tạo văn bản tốt hơn top-k.

**Các kết hợp phổ biến:**
- Temperature 0.7 + top-p 0.9: thiết lập tốt cho mục đích chung
- Temperature 0.0 (tham lam): tốt nhất cho các tác vụ tất định
- Temperature 1.0 + top-k 50: thiết lập bài báo gốc của Fan et al. (2018)

Top-k và top-p có thể kết hợp. Áp dụng top-k trước, rồi top-p trên tập còn lại.

### Reparameterization Trick (Used in VAEs)

Các bộ tự mã hóa biến phân (VAE) học bằng cách mã hóa đầu vào thành một phân phối trong không gian ẩn, lấy mẫu từ phân phối đó và giải mã mẫu trở lại. Vấn đề: bạn không thể lan truyền ngược qua một phép lấy mẫu.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

Thủ thuật tái tham số hóa tách tính ngẫu nhiên khỏi các tham số:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

Điều này hoạt động vì N(mu, sigma^2) có cùng phân phối với mu + sigma * N(0, 1). Điểm cốt yếu: chuyển tính ngẫu nhiên sang một nguồn không có tham số (epsilon), rồi biểu diễn mẫu dưới dạng một phép biến đổi khả vi của các tham số.

**Trong vòng lặp huấn luyện VAE:**
1. Bộ mã hóa xuất ra mu và log(sigma^2) cho mỗi đầu vào
2. Lấy mẫu epsilon ~ N(0, 1)
3. Tính z = mu + sigma * epsilon
4. Giải mã z để tái tạo đầu vào
5. Lan truyền ngược qua các bước 4, 3, 2, 1 (có thể vì bước 3 khả vi)

Không có thủ thuật tái tham số hóa, VAE không thể được huấn luyện bằng lan truyền ngược tiêu chuẩn. Hiểu biết duy nhất này đã làm VAE khả thi trong thực tế.

### Gumbel-Softmax (Differentiable Categorical Sampling)

Thủ thuật tái tham số hóa hoạt động cho các phân phối liên tục (Gaussian). Với các phân phối categorical rời rạc, chúng ta cần một cách tiếp cận khác. Gumbel-Softmax cung cấp một xấp xỉ khả vi cho lấy mẫu categorical.

**Thủ thuật Gumbel-Max (không khả vi):**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax (xấp xỉ khả vi):**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

Gumbel-Softmax tạo ra một phép nới lỏng liên tục của một mẫu rời rạc. Đầu ra là một vector xác suất (one-hot mềm) thay vì one-hot cứng. Gradient truyền qua softmax. Trong lượt truyền xuôi khi huấn luyện, bạn có thể sử dụng bộ ước lượng "straight-through": dùng argmax cứng cho lượt truyền xuôi nhưng gradient Gumbel-Softmax mềm cho lượt truyền ngược.

**Ứng dụng:**
- Các biến ẩn rời rạc trong VAE
- Tìm kiếm kiến trúc nơ-ron (chọn các phép toán rời rạc)
- Các cơ chế attention cứng
- Học tăng cường với các hành động rời rạc

### Stratified Sampling

Lấy mẫu Monte Carlo tiêu chuẩn có thể ngẫu nhiên để lại các khoảng trống trong không gian mẫu. Lấy mẫu phân tầng buộc phủ đều bằng cách chia không gian thành các tầng và lấy mẫu từ từng tầng.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

Lấy mẫu phân tầng luôn có phương sai thấp hơn hoặc bằng Monte Carlo tiêu chuẩn:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**Ứng dụng:**
- Tích phân số (quasi-Monte Carlo)
- Các phần chia dữ liệu huấn luyện (bảo đảm cân bằng lớp trong mỗi fold)
- Lấy mẫu quan trọng có phân tầng (kết hợp cả hai kỹ thuật)
- NeRF (Trường Bức xạ Nơ-ron) sử dụng lấy mẫu phân tầng dọc theo các tia camera

### Connection to Diffusion Models

Các mô hình khuếch tán tạo hình ảnh thông qua một quá trình lấy mẫu. Quá trình xuôi thêm nhiễu Gaussian vào một hình ảnh qua T bước cho đến khi nó trở thành nhiễu thuần. Quá trình ngược học khử nhiễu, khôi phục hình ảnh gốc từng bước.

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

Mối liên hệ với các phương pháp trong bài học này:
- Mỗi bước khử nhiễu sử dụng thủ thuật tái tham số hóa (lấy mẫu nhiễu, áp dụng phép biến đổi tất định)
- Lịch nhiễu {alpha_t} điều khiển một dạng ủ nhiệt độ
- Huấn luyện sử dụng ước lượng Monte Carlo để xấp xỉ ELBO (cận dưới bằng chứng)
- Lấy mẫu tổ tiên trong các mô hình khuếch tán là một chuỗi Markov (mỗi bước chỉ phụ thuộc vào trạng thái hiện tại)

Toàn bộ quá trình sinh hình ảnh là lấy mẫu lặp: bắt đầu từ nhiễu, và tại mỗi bước, lấy mẫu một phiên bản ít nhiễu hơn một chút có điều kiện theo mô hình khử nhiễu đã học.

```figure
monte-carlo-pi
```

## Build It

### Step 1: Uniform and inverse CDF sampling

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

Tạo 10,000 mẫu phân phối mũ và xác minh trung bình là 1/lambda.

### Step 2: Rejection sampling

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Sử dụng lấy mẫu loại bỏ để rút mẫu từ một phân phối chuẩn bị cắt cụt. Xác minh hình dạng bằng cách vẽ biểu đồ tần suất các mẫu.

### Step 3: Importance sampling

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Ước lượng E[X^2] theo một phân phối chuẩn bằng một đề xuất đều. So sánh với câu trả lời đã biết (mu^2 + sigma^2).

### Step 4: Monte Carlo estimation of pi

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### Step 5: Metropolis-Hastings MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

Lấy mẫu từ một phân phối hai mode (hỗn hợp hai Gaussian). Trực quan hóa quỹ đạo của chuỗi.

### Step 6: Gibbs sampling

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### Step 7: Temperature sampling

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

Cho thấy temperature thay đổi phân phối đầu ra cho một tập logits token như thế nào.

### Step 8: Top-k and top-p sampling

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### Step 9: Reparameterization trick

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

Minh họa gradient truyền qua mẫu được tái tham số hóa nhưng không qua lấy mẫu trực tiếp.

### Step 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

Cho thấy giảm temperature làm đầu ra tiến đến một vector one-hot như thế nào.

Các triển khai đầy đủ cùng mọi hình trực quan hóa nằm trong `code/sampling.py`.

## Use It

Với NumPy và SciPy, các phiên bản sản xuất:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

Với MCMC ở quy mô lớn, sử dụng các thư viện chuyên dụng:
- PyMC: mô hình hóa Bayes đầy đủ với NUTS (HMC thích nghi)
- emcee: bộ lấy mẫu MCMC tập hợp
- NumPyro/JAX: MCMC được tăng tốc GPU

Bạn đã xây dựng chúng từ đầu. Giờ bạn biết các lời gọi thư viện đang làm gì.

## Exercises

1. Triển khai lấy mẫu CDF ngược cho phân phối Cauchy. CDF là F(x) = 0.5 + arctan(x)/pi. Tạo 10,000 mẫu và vẽ biểu đồ tần suất so với PDF thực. Chú ý các đuôi nặng (các giá trị cực đoan xa tâm).

2. Sử dụng lấy mẫu loại bỏ để tạo các mẫu từ phân phối Beta(2, 5) bằng một đề xuất Uniform(0, 1). Vẽ các mẫu được chấp nhận so với PDF Beta thực. Tỉ lệ chấp nhận lý thuyết là bao nhiêu?

3. Ước lượng tích phân của sin(x) từ 0 đến pi bằng Monte Carlo với 1,000, 10,000 và 100,000 mẫu. So sánh sai số ở mỗi mức. Xác minh sai số tỉ lệ theo O(1/sqrt(N)).

4. Triển khai Metropolis-Hastings để lấy mẫu từ một phân phối 2D p(x, y) tỉ lệ với exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2). Vẽ các mẫu và quỹ đạo chuỗi. Thử nghiệm với các độ lệch chuẩn đề xuất khác nhau.

5. Xây dựng một demo sinh văn bản hoàn chỉnh: cho một từ vựng 10 từ có logits, sinh các chuỗi 20 token bằng (a) tham lam, (b) temperature=0.7, (c) top-k=3, (d) top-p=0.9. So sánh độ đa dạng đầu ra qua 5 lần chạy.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Sampling (Lấy mẫu) | "Rút các giá trị ngẫu nhiên" | Tạo các giá trị theo một phân phối xác suất. Cơ chế đằng sau mọi AI tạo sinh |
| Uniform distribution (Phân phối đều) | "Tất cả có khả năng như nhau" | Mọi giá trị trong [a, b] có mật độ xác suất bằng nhau 1/(b-a). Điểm bắt đầu cho mọi phương pháp lấy mẫu |
| Inverse CDF (CDF ngược) | "Biến đổi xác suất" | F_inverse(U) chuyển một mẫu đều thành một mẫu từ bất kỳ phân phối nào có CDF đã biết. Chính xác và hiệu quả |
| Rejection sampling (Lấy mẫu loại bỏ) | "Đề xuất và chấp nhận/loại bỏ" | Sinh từ một đề xuất đơn giản, chấp nhận với xác suất tỉ lệ với tỉ số mục tiêu/đề xuất. Chính xác nhưng lãng phí mẫu |
| Importance sampling (Lấy mẫu quan trọng) | "Điều chỉnh lại trọng số mẫu" | Ước lượng các kỳ vọng theo p(x) bằng các mẫu từ q(x) với mỗi mẫu có trọng số p(x)/q(x). Cốt lõi của PPO trong RL |
| Monte Carlo | "Lấy trung bình các mẫu ngẫu nhiên" | Xấp xỉ tích phân bằng các trung bình mẫu. Sai số O(1/sqrt(N)) bất kể số chiều |
| MCMC | "Bước đi ngẫu nhiên hội tụ" | Xây dựng một chuỗi Markov có phân phối dừng là mục tiêu. Metropolis-Hastings là thuật toán nền tảng |
| Metropolis-Hastings | "Chấp nhận lên dốc, đôi khi xuống dốc" | Đề xuất các bước di chuyển, chấp nhận dựa trên tỉ số mật độ. Cân bằng chi tiết bảo đảm hội tụ về phân phối mục tiêu |
| Gibbs sampling (Lấy mẫu Gibbs) | "Từng biến một" | Cập nhật mỗi biến từ phân phối có điều kiện của nó, giữ các biến khác cố định. Tỉ lệ chấp nhận 100% |
| Temperature (Nhiệt độ) | "Núm độ tự tin" | Chia logits cho T trước softmax. T<1 làm nhọn (tự tin hơn), T>1 làm phẳng (đa dạng hơn) |
| Top-k sampling (Lấy mẫu top-k) | "Giữ k tốt nhất" | Đặt tất cả về không trừ k token có xác suất cao nhất, chuẩn hóa lại, lấy mẫu. Kích thước tập ứng viên cố định |
| Nucleus sampling (top-p) (Lấy mẫu nucleus) | "Giữ những token có khả năng" | Giữ tập token nhỏ nhất có xác suất tích lũy vượt p. Kích thước tập ứng viên thích nghi |
| Reparameterization trick (Thủ thuật tái tham số hóa) | "Chuyển tính ngẫu nhiên ra ngoài" | Viết z = mu + sigma * epsilon trong đó epsilon ~ N(0,1). Làm việc lấy mẫu khả vi. Thiết yếu cho huấn luyện VAE |
| Gumbel-Softmax | "Lấy mẫu categorical mềm" | Xấp xỉ khả vi của lấy mẫu categorical bằng nhiễu Gumbel + softmax có temperature |
| Stratified sampling (Lấy mẫu phân tầng) | "Buộc phủ" | Chia không gian mẫu thành các tầng, lấy mẫu từ từng tầng. Luôn có phương sai thấp hơn Monte Carlo ngây thơ |
| Burn-in | "Giai đoạn làm nóng" | Các mẫu MCMC ban đầu bị loại bỏ trước khi chuỗi đạt phân phối dừng |
| Detailed balance (Cân bằng chi tiết) | "Điều kiện khả nghịch" | p(x) * T(x->y) = p(y) * T(y->x). Điều kiện đủ để p là phân phối dừng của một chuỗi Markov |
| Diffusion sampling (Lấy mẫu khuếch tán) | "Khử nhiễu lặp" | Sinh dữ liệu bằng cách bắt đầu từ nhiễu và áp dụng các bước khử nhiễu đã học. Mỗi bước là một phép lấy mẫu có điều kiện |

## Further Reading

- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010) - hướng dẫn chi tiết về nền tảng MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144) - bài báo Gumbel-Softmax gốc
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) - bài báo lấy mẫu nucleus (top-p)
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) - bài báo VAE giới thiệu thủ thuật tái tham số hóa
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) - DDPM kết nối lấy mẫu với sinh hình ảnh
