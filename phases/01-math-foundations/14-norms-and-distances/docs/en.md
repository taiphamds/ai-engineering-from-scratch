# Norms and Distances

> Hàm khoảng cách của bạn xác định "tương tự" có nghĩa gì. Chọn sai và mọi thứ phía sau đều hỏng.

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 1, Lessons 01 (Linear Algebra Intuition), 02 (Vectors, Matrices & Operations)
**Time:** ~90 minutes

## Learning Objectives

- Triển khai các hàm khoảng cách L1, L2, cosine, Mahalanobis, Jaccard và chỉnh sửa từ đầu
- Chọn metric khoảng cách thích hợp cho một tác vụ ML nhất định và giải thích tại sao các lựa chọn khác thất bại
- Kết nối các chuẩn L1 và L2 với regularization LASSO và Ridge cùng các miền ràng buộc hình học của chúng
- Minh họa cách cùng một tập dữ liệu tạo ra các láng giềng gần nhất khác nhau dưới các metric khác nhau

## The Problem

Bạn có hai vector. Có thể chúng là các embedding từ. Có thể chúng là hồ sơ người dùng. Có thể chúng là các mảng pixel. Bạn cần biết: chúng gần nhau đến mức nào?

Câu trả lời phụ thuộc hoàn toàn vào hàm khoảng cách bạn chọn. Hai điểm dữ liệu có thể là láng giềng gần nhất dưới một metric và cách xa nhau dưới một metric khác. Bộ phân loại KNN, bộ máy đề xuất, cơ sở dữ liệu vector, thuật toán phân cụm, hàm mất mát của bạn -- tất cả đều phụ thuộc vào lựa chọn này. Chọn sai và mô hình của bạn tối ưu hóa cho điều sai.

Không có khoảng cách tốt nhất chung cho mọi trường hợp. L2 hoạt động cho dữ liệu không gian. Độ tương đồng cosine chiếm ưu thế trong NLP. Jaccard xử lý các tập hợp. Khoảng cách chỉnh sửa xử lý chuỗi. Mahalanobis xét đến tương quan. Wasserstein di chuyển khối xác suất. Mỗi loại mã hóa một giả định khác nhau về ý nghĩa của "tương tự".

Bài học này xây dựng mọi hàm khoảng cách chính từ đầu, cho bạn thấy khi nào mỗi hàm là công cụ phù hợp và minh họa cách cùng dữ liệu tạo ra các láng giềng gần nhất hoàn toàn khác nhau tùy thuộc vào metric bạn sử dụng.

## The Concept

### Norms: measuring vector magnitude

Một chuẩn đo "kích thước" của một vector. Mọi hàm khoảng cách giữa hai vector đều có thể được viết dưới dạng chuẩn của hiệu chúng: $d(a, b) = \lVert a - b \rVert$. Vì vậy hiểu chuẩn là hiểu khoảng cách.

### L1 Norm (Manhattan distance)

Chuẩn L1 lấy tổng các giá trị tuyệt đối của tất cả thành phần.

```math
\lVert x \rVert_1 = |x_1| + |x_2| + \cdots + |x_n|
```

Nó được gọi là khoảng cách Manhattan vì nó đo bạn đi bộ bao xa trên một lưới thành phố nơi bạn chỉ có thể di chuyển dọc theo các trục. Không có đường chéo.

```
Point A = (1, 1)
Point B = (4, 5)

L1 distance = |4-1| + |5-1| = 3 + 4 = 7

On a grid, you walk 3 blocks east and 4 blocks north.
```

Khi nào sử dụng L1:
- Dữ liệu thưa nhiều chiều (đặc trưng văn bản, mã hóa one-hot)
- Khi bạn muốn tính bền vững với ngoại lệ (một khác biệt rất lớn duy nhất không chi phối)
- Các bài toán lựa chọn đặc trưng (L1 regularization thúc đẩy tính thưa)

Mối liên hệ với L1 regularization (Lasso): thêm $\lVert w \rVert_1$ vào hàm mất mát phạt tổng các giá trị tuyệt đối của trọng số. Điều này đẩy các trọng số nhỏ về đúng không, thực hiện lựa chọn đặc trưng tự động. Hình phạt L1 tạo các miền ràng buộc hình thoi trong không gian trọng số, và các góc của hình thoi nằm trên các trục nơi một số trọng số bằng không.

Mối liên hệ với hàm mất mát: Sai số Tuyệt đối Trung bình (MAE) là khoảng cách L1 trung bình giữa dự đoán và mục tiêu. Nó phạt mọi sai số tuyến tính, khiến nó bền vững với ngoại lệ so với MSE.

### L2 Norm (Euclidean distance)

Chuẩn L2 là khoảng cách đường thẳng. Căn bậc hai của tổng bình phương các thành phần.

```math
\lVert x \rVert_2 = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2}
```

Đây là khoảng cách bạn đã học trong lớp hình học. Pythagoras trong $n$ chiều.

```
Point A = (1, 1)
Point B = (4, 5)

L2 distance = sqrt((4-1)^2 + (5-1)^2) = sqrt(9 + 16) = sqrt(25) = 5.0

The straight line, cutting diagonally through the grid.
```

Khi nào sử dụng L2:
- Dữ liệu liên tục có số chiều thấp đến trung bình
- Khi thang đo các đặc trưng có thể so sánh được
- Khoảng cách vật lý (dữ liệu không gian, số đọc cảm biến)
- Độ tương đồng hình ảnh ở cấp pixel

Mối liên hệ với L2 regularization (Ridge): thêm $\lVert w \rVert_2^2$ vào hàm mất mát phạt các trọng số lớn. Khác L1, nó không đẩy trọng số về không. Nó thu nhỏ mọi trọng số về phía không theo tỉ lệ. Hình phạt L2 tạo các miền ràng buộc hình tròn, nên không có góc trên các trục. Trọng số trở nên nhỏ nhưng hiếm khi đúng bằng không.

Mối liên hệ với hàm mất mát: Sai số Bình phương Trung bình (MSE) là trung bình của bình phương các khoảng cách L2. Bình phương phạt sai số lớn nặng hơn sai số nhỏ.

```math
\begin{aligned}
\text{MAE (L1 loss):} \quad & |y - \hat{y}| && \text{Linear penalty. Robust to outliers.} \\
\text{MSE (L2 loss):} \quad & (y - \hat{y})^2 && \text{Quadratic penalty. Sensitive to outliers.}
\end{aligned}
```

### Lp Norms: the general family

L1 và L2 là các trường hợp đặc biệt của chuẩn Lp:

```math
\lVert x \rVert_p = (|x_1|^p + |x_2|^p + \cdots + |x_n|^p)^{1/p}
```

Các giá trị $p$ khác nhau tạo ra các "quả cầu đơn vị" có hình dạng khác nhau (tập mọi điểm có khoảng cách tối đa 1 từ gốc tọa độ; các hình bên dưới là biên của chúng):

```
p=1:    Diamond shape      (corners on axes)
p=2:    Circle/sphere      (the usual round ball)
p=3:    Superellipse       (rounded square)
p=inf:  Square/hypercube   (flat sides along axes)
```

### L-infinity Norm (Chebyshev distance)

Khi $p$ tiến đến vô cực, chuẩn Lp hội tụ về thành phần tuyệt đối lớn nhất.

```math
\lVert x \rVert_\infty = \max(|x_1|, |x_2|, \ldots, |x_n|)
```

Khoảng cách giữa hai điểm được quyết định bởi chiều duy nhất mà chúng khác nhau nhiều nhất. Tất cả các chiều khác bị bỏ qua.

```math
\begin{aligned}
\text{Point } A &= (1, 1) \\
\text{Point } B &= (4, 5) \\[6pt]
L_\infty \text{ distance} &= \max(|4-1|, |5-1|) = \max(3, 4) = 4
\end{aligned}
```

Khi nào sử dụng L-vô cực:
- Khi độ lệch trong trường hợp xấu nhất ở bất kỳ chiều đơn lẻ nào quan trọng
- Bàn cờ (quân vua trong cờ vua di chuyển theo L-vô cực: một bước theo bất kỳ hướng nào có chi phí 1)
- Dung sai sản xuất (mọi chiều phải nằm trong thông số kỹ thuật)

### Cosine Similarity and Cosine Distance

Độ tương đồng cosine đo góc giữa hai vector, bỏ qua độ lớn của chúng.

```math
\text{cos\_sim}(a, b) = \frac{a \cdot b}{\lVert a \rVert_2 \, \lVert b \rVert_2}
```

Nó nằm trong khoảng từ -1 (ngược hướng) đến +1 (cùng hướng). Các vector vuông góc có độ tương đồng cosine 0.

Khoảng cách cosine chuyển nó thành một khoảng cách: cosine_distance = 1 - cosine_similarity. Giá trị này nằm trong khoảng từ 0 (hướng giống hệt) đến 2 (hướng đối nhau).

```math
\begin{aligned}
& a = (1, 0) \qquad b = (1, 1) \\[6pt]
& \text{cos\_sim} = \frac{1 \cdot 1 + 0 \cdot 1}{1 \cdot \sqrt{2}} = \frac{1}{\sqrt{2}} = 0.707 \\
& \text{cos\_dist} = 1 - 0.707 = 0.293
\end{aligned}
```

Tại sao cosine chiếm ưu thế trong NLP và embedding: trong văn bản, độ dài tài liệu không nên ảnh hưởng đến độ tương đồng. Một tài liệu về mèo dài gấp đôi một tài liệu khác về mèo vẫn nên "tương tự." Độ tương đồng cosine bỏ qua độ lớn (độ dài) và chỉ quan tâm hướng. Hai tài liệu có cùng phân phối từ nhưng độ dài khác nhau chỉ cùng hướng và có độ tương đồng cosine 1.0.

Khi nào sử dụng độ tương đồng cosine:
- Độ tương đồng văn bản (vector TF-IDF, embedding từ, embedding câu)
- Bất kỳ miền nào mà độ lớn là nhiễu và hướng là tín hiệu
- Các hệ thống đề xuất (vector sở thích người dùng)
- Tìm kiếm embedding (cơ sở dữ liệu vector hầu như luôn dùng cosine hoặc tích vô hướng)

### Dot Product Similarity vs Cosine Similarity

Tích vô hướng của hai vector là:

```math
\begin{aligned}
a \cdot b &= a_1 b_1 + a_2 b_2 + \cdots + a_n b_n \\
&= \lVert a \rVert \, \lVert b \rVert \cos(\text{angle})
\end{aligned}
```

Độ tương đồng cosine là tích vô hướng được chuẩn hóa bởi cả hai độ lớn. Khi cả hai vector đã được chuẩn hóa đơn vị (độ lớn = 1), tích vô hướng và độ tương đồng cosine giống hệt nhau.

```math
\text{If } \lVert a \rVert = 1 \text{ and } \lVert b \rVert = 1: \quad a \cdot b = \cos(\text{angle between } a \text{ and } b)
```

Khi chúng khác nhau: tích vô hướng bao gồm thông tin độ lớn. Một vector có độ lớn lớn hơn nhận điểm tích vô hướng cao hơn. Điều này quan trọng trong một số hệ thống truy xuất nơi bạn muốn các mục "phổ biến" được xếp hạng cao hơn. Độ lớn đóng vai trò một tín hiệu chất lượng hoặc độ quan trọng ngầm.

```
a = (3, 0)    b = (1, 0)    c = (0, 1)

dot(a, b) = 3     dot(a, c) = 0
cos(a, b) = 1.0   cos(a, c) = 0.0

Both agree on direction, but dot product also reflects magnitude.
```

Trong thực tế:
- Sử dụng độ tương đồng cosine khi bạn muốn độ tương đồng thuần về hướng
- Sử dụng tích vô hướng khi độ lớn mang thông tin có ý nghĩa
- Nhiều cơ sở dữ liệu vector (Pinecone, Weaviate, Qdrant) cho phép bạn chọn giữa chúng
- Nếu các embedding đã được chuẩn hóa L2, lựa chọn không có ý nghĩa

### Mahalanobis Distance

Khoảng cách Euclid xem mọi chiều như nhau. Nhưng nếu các đặc trưng tương quan hoặc có các thang đo khác nhau, L2 cho kết quả gây hiểu lầm.

Khoảng cách Mahalanobis xét đến cấu trúc hiệp phương sai của dữ liệu.

```math
d_M(x, y) = \sqrt{(x - y)^T S^{-1} (x - y)}
```

trong đó $S$ là ma trận hiệp phương sai của dữ liệu.

Theo trực giác: khoảng cách Mahalanobis trước tiên khử tương quan và chuẩn hóa dữ liệu (làm trắng), rồi tính khoảng cách L2 trong không gian đã biến đổi đó. Nếu $S$ là ma trận đơn vị (các đặc trưng không tương quan, phương sai đơn vị), khoảng cách Mahalanobis quy về khoảng cách Euclid.

```
Example: height and weight are correlated.
Someone 6'2" and 180 lbs is not unusual.
Someone 5'0" and 180 lbs is unusual.

Euclidean distance might say they are equally far from the mean.
Mahalanobis distance correctly identifies the second as an outlier
because it accounts for the height-weight correlation.
```

Khi nào sử dụng khoảng cách Mahalanobis:
- Phát hiện ngoại lệ (các điểm có khoảng cách Mahalanobis lớn so với trung bình là ngoại lệ)
- Phân loại khi các đặc trưng có thang đo và tương quan khác nhau
- Khi bạn có đủ dữ liệu để ước lượng một ma trận hiệp phương sai đáng tin cậy
- Kiểm soát chất lượng trong sản xuất (giám sát quy trình đa biến)

### Jaccard Similarity (for sets)

Độ tương đồng Jaccard đo sự chồng lấp giữa hai tập hợp.

```math
J(A, B) = \frac{|A \cap B|}{|A \cup B|}
```

Nó nằm trong khoảng từ 0 (không chồng lấp) đến 1 (các tập giống hệt). Khoảng cách Jaccard = 1 - độ tương đồng Jaccard.

```
A = {cat, dog, fish}
B = {cat, bird, fish, snake}

Intersection = {cat, fish}         size = 2
Union = {cat, dog, fish, bird, snake}  size = 5

Jaccard similarity = 2/5 = 0.4
Jaccard distance = 0.6
```

Khi nào sử dụng Jaccard:
- So sánh các tập thẻ, danh mục hoặc đặc trưng
- Độ tương đồng tài liệu dựa trên sự hiện diện của từ (không phải tần suất)
- Phát hiện gần trùng lặp (xấp xỉ MinHash của Jaccard)
- So sánh các vector đặc trưng nhị phân (dữ liệu hiện diện/vắng mặt)
- Đánh giá các mô hình phân đoạn (Giao trên Hợp = Jaccard)

### Edit Distance (Levenshtein Distance)

Khoảng cách chỉnh sửa đếm số tối thiểu các phép toán trên một ký tự cần để biến đổi một chuỗi thành một chuỗi khác. Các phép toán là: chèn, xóa hoặc thay thế.

```
"kitten" -> "sitting"

kitten -> sitten  (substitute k -> s)
sitten -> sittin  (substitute e -> i)
sittin -> sitting (insert g)

Edit distance = 3
```

Được tính bằng quy hoạch động. Điền một ma trận trong đó phần tử $(i, j)$ là khoảng cách chỉnh sửa giữa $i$ ký tự đầu của chuỗi A và $j$ ký tự đầu của chuỗi B.

```
        ""  s  i  t  t  i  n  g
    ""   0  1  2  3  4  5  6  7
    k    1  1  2  3  4  5  6  7
    i    2  2  1  2  3  4  5  6
    t    3  3  2  1  2  3  4  5
    t    4  4  3  2  1  2  3  4
    e    5  5  4  3  2  2  3  4
    n    6  6  5  4  3  3  2  3
```

Khi nào sử dụng khoảng cách chỉnh sửa:
- Kiểm tra và sửa chính tả
- Căn chỉnh chuỗi DNA (với các phép toán có trọng số)
- So khớp chuỗi mờ
- Loại bỏ trùng lặp trong dữ liệu văn bản lộn xộn

### KL Divergence (not a distance, but used like one)

Phân kỳ KL đo cách một phân phối xác suất khác một phân phối khác. Đã được đề cập ở Bài học 09, nhưng nó thuộc về phần thảo luận này vì mọi người sử dụng nó như một "khoảng cách" dù nó không phải.

```math
D_{KL}(P \,\|\, Q) = \sum_x p(x) \log\frac{p(x)}{q(x)}
```

Tính chất thiết yếu: phân kỳ KL KHÔNG đối xứng.

```math
D_{KL}(P \,\|\, Q) \ne D_{KL}(Q \,\|\, P)
```

Điều này có nghĩa là nó không đáp ứng yêu cầu cơ bản của một metric khoảng cách. Nó cũng không thỏa mãn bất đẳng thức tam giác. Nó là một phân kỳ, không phải một khoảng cách.

KL xuôi $(D_{KL}(P \Vert Q))$ "tìm trung bình": $Q$ cố bao phủ tất cả các mode của $P$.
KL ngược $(D_{KL}(Q \Vert P))$ "tìm mode": $Q$ tập trung vào một mode duy nhất của $P$.

Khi bạn thấy phân kỳ KL:
- VAE (thành phần KL trong ELBO đẩy phân phối ẩn về phía một tiên nghiệm)
- Chưng cất tri thức (trò cố khớp phân phối của thầy)
- RLHF (hình phạt KL giữ mô hình fine-tune gần mô hình cơ sở)
- Các phương pháp gradient chính sách (ràng buộc cập nhật chính sách)

### Wasserstein Distance (Earth Mover's Distance)

Khoảng cách Wasserstein đo "công" tối thiểu cần để biến đổi một phân phối xác suất thành một phân phối khác. Hãy nghĩ thế này: nếu một phân phối là một đống đất và phân phối kia là một cái hố, bạn phải di chuyển bao nhiêu đất và bao xa?

```math
W(P, Q) = \inf_{\gamma} \mathbb{E}[d(x, y)] \quad \text{(over all transport plans } \gamma\text{)}
```

Với các phân phối 1D, nó đơn giản thành tích phân của hiệu tuyệt đối giữa các hàm phân phối tích lũy:

```math
W_1(P, Q) = \int |\text{CDF}_P(x) - \text{CDF}_Q(x)| \, dx
```

Tại sao Wasserstein quan trọng:
- Nó là một metric thực sự (đối xứng, thỏa mãn bất đẳng thức tam giác)
- Nó cung cấp gradient ngay cả khi các phân phối không chồng lấp (phân kỳ KL tiến đến vô cực)
- Tính chất này khiến nó trở thành trung tâm của Wasserstein GAN (WGAN), đã giải quyết sự bất ổn huấn luyện của các GAN ban đầu

```
Distributions with no overlap:

P: [1, 0, 0, 0, 0]    Q: [0, 0, 0, 0, 1]

KL divergence: infinity (log of zero)
Wasserstein: 4 (move all mass 4 bins)

Wasserstein gives a meaningful gradient. KL does not.
```

Khi nào sử dụng Wasserstein:
- Huấn luyện GAN (WGAN, WGAN-GP)
- So sánh các phân phối có thể không chồng lấp
- Các bài toán vận chuyển tối ưu
- Truy xuất hình ảnh (so sánh biểu đồ tần suất màu)

### Why Different Tasks Need Different Distances

| Tác vụ | Khoảng cách tốt nhất | Lý do |
|------|--------------|-----|
| Độ tương đồng văn bản | Cosine | Độ lớn là nhiễu, hướng là ý nghĩa |
| So sánh pixel hình ảnh | L2 | Các quan hệ không gian quan trọng, các đặc trưng có thang đo tương đương |
| Các đặc trưng thưa nhiều chiều | L1 | Bền vững, không khuếch đại các khác biệt lớn hiếm gặp |
| Chồng lấp tập hợp (thẻ, danh mục) | Jaccard | Dữ liệu tự nhiên có dạng tập hợp, không phải vector |
| So khớp chuỗi | Khoảng cách chỉnh sửa | Các phép toán tương ứng với trực giác chỉnh sửa của con người |
| Phát hiện ngoại lệ | Mahalanobis | Xét đến tương quan và thang đo đặc trưng |
| So sánh các phân phối | Phân kỳ KL | Đo thông tin mất khi sử dụng $Q$ thay vì $P$ |
| Huấn luyện GAN | Wasserstein | Cung cấp gradient ngay cả khi các phân phối không chồng lấp |
| Embedding (cơ sở dữ liệu vector) | Cosine hoặc tích vô hướng | Embedding được huấn luyện để mã hóa ý nghĩa trong hướng |
| Đề xuất | Tích vô hướng | Độ lớn có thể mã hóa độ phổ biến hoặc sự tự tin |
| Chuỗi DNA | Khoảng cách chỉnh sửa có trọng số | Chi phí thay thế thay đổi theo cặp nucleotide |
| Kiểm soát chất lượng sản xuất | L-vô cực | Độ lệch trong trường hợp xấu nhất ở bất kỳ chiều nào quan trọng |

### Connection to Loss Functions

Các hàm mất mát là các hàm khoảng cách được áp dụng cho dự đoán so với mục tiêu.

```
Loss function       Distance it uses       Behavior
MSE                 L2 squared             Penalizes large errors heavily
MAE                 L1                     Penalizes all errors equally
Huber loss          L1 for large errors,   Best of both: robust to outliers,
                    L2 for small errors    smooth gradient near zero
Cross-entropy       KL divergence          Measures distribution mismatch
Hinge loss          max(0, margin - d)     Only penalizes below margin
Triplet loss        L2 (typically)         Pulls positives close, pushes
                                           negatives away
Contrastive loss    L2                     Similar pairs close, dissimilar
                                           pairs beyond margin
```

### Connection to Regularization

Regularization thêm một hình phạt chuẩn trên các trọng số vào hàm mất mát.

```
L1 regularization (Lasso):   loss + lambda * ||w||_1
  -> Sparse weights. Some weights become exactly zero.
  -> Automatic feature selection.
  -> Solution has corners (non-differentiable at zero).

L2 regularization (Ridge):   loss + lambda * ||w||_2^2
  -> Small weights. All weights shrink toward zero.
  -> No feature selection (nothing goes to exactly zero).
  -> Smooth solution everywhere.

Elastic Net:                  loss + lambda_1 * ||w||_1 + lambda_2 * ||w||_2^2
  -> Combines sparsity of L1 with stability of L2.
  -> Groups of correlated features are kept or dropped together.
```

Tại sao L1 tạo tính thưa nhưng L2 thì không: hình dung miền ràng buộc trong không gian trọng số 2D. L1 là một hình thoi, L2 là một đường tròn. Các đường đồng mức của hàm mất mát (ellipse) có khả năng cao nhất chạm hình thoi tại một góc, nơi một trọng số bằng không. Chúng chạm đường tròn tại một điểm trơn, nơi cả hai trọng số khác không.

### Nearest Neighbor Search

Mỗi hàm khoảng cách hàm ý một bài toán tìm kiếm láng giềng gần nhất: cho một điểm truy vấn, tìm các điểm gần nhất trong một tập dữ liệu.

Tìm kiếm láng giềng gần nhất chính xác có chi phí $O(n \cdot d)$ cho mỗi truy vấn trong một tập dữ liệu gồm $n$ điểm với $d$ chiều. Với các tập dữ liệu lớn, điều này quá chậm.

Các thuật toán Láng giềng Gần nhất Xấp xỉ (ANN) đánh đổi một lượng nhỏ độ chính xác để tăng tốc rất lớn:

```
Algorithm         Approach                      Used by
KD-trees          Axis-aligned space partition   scikit-learn (low-dim)
Ball trees        Nested hyperspheres            scikit-learn (medium-dim)
LSH               Random hash projections        Near-duplicate detection
HNSW              Hierarchical navigable         FAISS, Qdrant, Weaviate
                  small-world graph
IVF               Inverted file index with       FAISS (billion-scale)
                  cluster-based search
Product quant.    Compress vectors, search       FAISS (memory-constrained)
                  in compressed space
```

HNSW (Hierarchical Navigable Small World) là thuật toán chiếm ưu thế trong các cơ sở dữ liệu vector hiện đại. Nó xây dựng một đồ thị nhiều lớp trong đó mỗi nút kết nối với các láng giềng gần nhất xấp xỉ của nó. Tìm kiếm bắt đầu ở lớp trên cùng (thưa, các bước nhảy dài) và đi xuống lớp dưới cùng (dày đặc, các bước nhảy ngắn).

```figure
norm-unit-balls
```

## Build It

### Step 1: All norm and distance functions

Xem `code/distances.py` để có triển khai đầy đủ. Mỗi hàm được xây dựng từ đầu chỉ bằng toán Python cơ bản.

### Step 2: Same data, different distances, different neighbors

Bản demo trong `distances.py` tạo một tập dữ liệu, chọn một điểm truy vấn và cho thấy láng giềng gần nhất thay đổi thế nào tùy theo metric khoảng cách. Điểm "gần nhất" theo L1 có thể không gần nhất theo L2 hoặc cosine.

### Step 3: Embedding similarity search

Mã bao gồm một tìm kiếm tương đồng embedding giả lập tìm các "tài liệu" tương đồng nhất với một truy vấn bằng độ tương đồng cosine so với khoảng cách L2, cho thấy các thứ hạng có thể khác nhau.

## Use It

Cách dùng thực tế phổ biến nhất: tìm các mục tương tự trong một cơ sở dữ liệu vector.

```python
import numpy as np

def cosine_similarity_matrix(X):
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    X_normalized = X / norms
    return X_normalized @ X_normalized.T

embeddings = np.random.randn(1000, 768)

sim_matrix = cosine_similarity_matrix(embeddings)

query_idx = 0
similarities = sim_matrix[query_idx]
top_k = np.argsort(similarities)[::-1][1:6]
print(f"Top 5 most similar to item 0: {top_k}")
print(f"Similarities: {similarities[top_k]}")
```

Khi bạn gọi `model.encode(text)` rồi tìm kiếm một cơ sở dữ liệu vector, đây là những gì xảy ra bên trong. Mô hình embedding ánh xạ văn bản thành các vector. Cơ sở dữ liệu vector tính độ tương đồng cosine (hoặc tích vô hướng) giữa vector truy vấn và mọi vector được lưu, sử dụng các thuật toán ANN để tránh kiểm tra tất cả chúng.

## Exercises

1. Tính các khoảng cách L1, L2 và L-vô cùng giữa (1, 2, 3) và (4, 0, 6). Xác minh rằng $L_\infty \le L_2 \le L_1$ luôn đúng với bất kỳ cặp điểm nào. Chứng minh vì sao thứ tự này được bảo đảm.

2. Tạo hai vector có độ tương đồng cosine cao (> 0.9) nhưng khoảng cách L2 lớn (> 10). Giải thích về mặt hình học điều gì đang xảy ra. Sau đó tạo hai vector có độ tương đồng cosine thấp (< 0.3) nhưng khoảng cách L2 nhỏ (< 0.5).

3. Triển khai một hàm nhận một tập dữ liệu và một điểm truy vấn rồi trả về láng giềng gần nhất theo khoảng cách L1, L2, cosine và Mahalanobis. Tìm một tập dữ liệu mà cả bốn không đồng ý về điểm nào gần nhất.

4. Tính khoảng cách Wasserstein giữa [0.5, 0.5, 0, 0] và [0, 0, 0.5, 0.5] bằng tay bằng phương pháp CDF. Sau đó tính giữa [0.25, 0.25, 0.25, 0.25] và [0, 0, 0.5, 0.5]. Khoảng cách nào lớn hơn và tại sao?

5. Triển khai MinHash cho độ tương đồng Jaccard xấp xỉ. Tạo 100 tập ngẫu nhiên, tính Jaccard chính xác cho mọi cặp và so sánh với xấp xỉ MinHash bằng 50, 100 và 200 hàm băm. Vẽ sai số xấp xỉ.

### Hints

**Bài tập 1.** Vector hiệu là (-3, 2, -3), vì vậy hãy tính ba chuẩn của vector đó bằng `l1_norm`, `l2_norm` và `linf_norm`. Đối với chứng minh, so sánh $\lvert d_i \rvert$ lớn nhất với tổng bình phương, và so sánh tổng bình phương với bình phương của tổng các giá trị tuyệt đối.

**Bài tập 2.** Độ tương đồng cosine bỏ qua độ dài, vì vậy hãy bắt đầu với hai vector hướng gần như cùng chiều và làm cho một vector dài hơn nhiều. Đối với trường hợp thứ hai, sử dụng hai vector ngắn gần gốc tọa độ hướng theo các chiều khác nhau, rồi kiểm tra cả hai điều kiện bằng `cosine_similarity` và `l2_distance`.

**Bài tập 3.** Gọi `find_nearest_neighbor(query, dataset, distance_fn)` một lần cho mỗi hàm `l1_distance`, `l2_distance`, `cosine_distance` và `mahalanobis_distance`. `demo_different_neighbors` cho thấy một tập dữ liệu mà các thước đo không đồng thuận, vì vậy hãy đọc nó trước rồi thay đổi các điểm cho đến khi cả bốn đáp án khác nhau.

**Bài tập 4.** Viết tổng tích lũy của mỗi phân phối, rồi cộng các hiệu tuyệt đối của hai tổng tích lũy. Kiểm tra cả hai kết quả tính tay bằng `wasserstein_1d(p, q)`, rồi giải thích giá trị lớn hơn dựa trên khoảng cách mà khối lượng xác suất phải di chuyển.

**Bài tập 5.** Đối với mỗi hàm hash, chữ ký MinHash của một tập là giá trị hash nhỏ nhất trên các phần tử của nó, và tỷ lệ các hàm hash mà hai tập nhận cùng giá trị nhỏ nhất ước lượng độ tương đồng Jaccard của chúng. So sánh mỗi ước lượng với `jaccard_similarity`; sai số phải giảm xấp xỉ theo $1/\sqrt{k}$ đối với $k$ hàm hash.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Norm (Chuẩn) | "Kích thước của một vector" | Một hàm ánh xạ một vector thành một số vô hướng không âm, thỏa mãn bất đẳng thức tam giác, tính thuần nhất tuyệt đối và chỉ bằng không với vector không |
| L1 norm (Chuẩn L1) | "Khoảng cách Manhattan" | Tổng các giá trị tuyệt đối của các thành phần. Tạo tính thưa trong tối ưu hóa. Bền vững với ngoại lệ |
| L2 norm (Chuẩn L2) | "Khoảng cách Euclid" | Căn bậc hai của tổng bình phương các thành phần. Khoảng cách đường thẳng trong không gian Euclid |
| Lp norm (Chuẩn Lp) | "Chuẩn tổng quát" | Căn bậc $p$ của tổng lũy thừa bậc $p$ của các thành phần tuyệt đối. L1 và L2 là các trường hợp đặc biệt |
| L-infinity norm (Chuẩn L-vô cực) | "Chuẩn cực đại" hoặc "khoảng cách Chebyshev" | Giá trị tuyệt đối lớn nhất của các thành phần. Giới hạn của Lp khi $p$ tiến đến vô cực |
| Cosine similarity (Độ tương đồng cosine) | "Góc giữa các vector" | Tích vô hướng được chuẩn hóa bởi cả hai độ lớn. Nằm trong khoảng từ -1 đến +1. Bỏ qua độ dài vector |
| Cosine distance (Khoảng cách cosine) | "1 trừ độ tương đồng cosine" | Chuyển độ tương đồng cosine thành một khoảng cách. Nằm trong khoảng từ 0 đến 2 |
| Dot product (Tích vô hướng) | "Cosine chưa chuẩn hóa" | Tổng các tích theo từng thành phần. Bằng độ tương đồng cosine nhân cả hai độ lớn |
| Mahalanobis distance (Khoảng cách Mahalanobis) | "Khoảng cách có xét tương quan" | Khoảng cách L2 trong một không gian đã được làm trắng (khử tương quan và chuẩn hóa) bằng ma trận hiệp phương sai dữ liệu |
| Jaccard similarity (Độ tương đồng Jaccard) | "Chồng lấp tập hợp" | Kích thước giao chia kích thước hợp. Cho tập hợp, không phải vector |
| Edit distance (Khoảng cách chỉnh sửa) | "Khoảng cách Levenshtein" | Số lần chèn, xóa và thay thế tối thiểu để biến đổi một chuỗi thành một chuỗi khác |
| KL divergence (Phân kỳ KL) | "Khoảng cách giữa các phân phối" | Không phải khoảng cách thực sự (không đối xứng). Đo số bit thêm khi sử dụng $Q$ để mã hóa $P$ |
| Wasserstein distance (Khoảng cách Wasserstein) | "Khoảng cách chuyển đất" | Công tối thiểu để vận chuyển khối từ một phân phối sang một phân phối khác. Một metric thực sự |
| Approximate nearest neighbor (Láng giềng gần nhất xấp xỉ) | "Tìm kiếm ANN" | Các thuật toán (HNSW, LSH, IVF) tìm các điểm gần nhất xấp xỉ nhanh hơn nhiều so với tìm kiếm chính xác |
| HNSW | "Thuật toán cơ sở dữ liệu vector" | Đồ thị Hierarchical Navigable Small World. Đồ thị nhiều lớp cho tìm kiếm láng giềng gần nhất xấp xỉ nhanh |
| L1 regularization | "Lasso" | Thêm chuẩn L1 của các trọng số vào mất mát. Đẩy các trọng số về không (tính thưa) |
| L2 regularization | "Ridge" hoặc "suy giảm trọng số" | Thêm chuẩn L2 bình phương của các trọng số vào mất mát. Thu nhỏ trọng số về phía không mà không có tính thưa |
| Elastic Net | "L1 + L2" | Kết hợp L1 và L2 regularization. Xử lý các nhóm đặc trưng tương quan tốt hơn từng loại riêng lẻ |

## Further Reading

- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss) - thư viện của Meta cho tìm kiếm ANN ở quy mô hàng tỷ
- [Wasserstein GAN (Arjovsky et al., 2017)](https://arxiv.org/abs/1701.07875) - bài báo giới thiệu khoảng cách Chuyển Đất cho GAN
- [Locality-Sensitive Hashing (Indyk & Motwani, 1998)](https://dl.acm.org/doi/10.1145/276698.276876) - thuật toán ANN nền tảng
- [Efficient Estimation of Word Representations (Mikolov et al., 2013)](https://arxiv.org/abs/1301.3781) - Word2Vec, nơi độ tương đồng cosine trở thành mặc định cho embedding
- [Tài liệu sklearn.neighbors](https://scikit-learn.org/stable/modules/neighbors.html) - hướng dẫn thực hành về các metric khoảng cách và thuật toán láng giềng trong scikit-learn
