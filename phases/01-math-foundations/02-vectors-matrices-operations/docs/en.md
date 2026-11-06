# Vectors, Matrices & Operations

> Mọi mạng nơ-ron chỉ là phép nhân ma trận với các bước bổ sung.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 1, Lesson 01 (Linear Algebra Intuition)
**Time:** ~60 minutes

## Learning Objectives

- Xây dựng một lớp Matrix với các phép toán theo từng phần tử, nhân ma trận, chuyển vị, định thức và nghịch đảo
- Phân biệt phép nhân theo từng phần tử với phép nhân ma trận và giải thích khi nào áp dụng mỗi phép
- Triển khai một lớp mạng nơ-ron kết nối đầy đủ (`relu(W @ x + b)`) chỉ sử dụng lớp Matrix xây dựng từ đầu
- Giải thích các quy tắc broadcasting và cách phép cộng bias hoạt động trong các framework mạng nơ-ron

## The Problem

Bạn muốn xây dựng một mạng nơ-ron. Bạn đọc mã và thấy điều này:

```
output = activation(weights @ input + bias)
```

Dấu `@` đó là phép nhân ma trận. `weights` là một ma trận. `input` là một vector. Nếu bạn không biết những phép toán đó làm gì, dòng này là phép thuật. Nếu biết, đó là toàn bộ lượt truyền xuôi của một lớp trong ba phép toán.

Mọi hình ảnh mà mô hình của bạn xử lý là một ma trận các giá trị pixel. Mọi embedding từ là một vector. Mỗi lớp của mọi mạng nơ-ron là một phép biến đổi ma trận. Bạn không thể xây dựng các hệ thống AI mà không thông thạo các phép toán ma trận, cũng như bạn không thể viết mã mà không hiểu biến.

Bài học này xây dựng sự thông thạo đó từ đầu.

## The Concept

### Vectors: ordered lists of numbers

Một vector là một danh sách các số có hướng và độ lớn. Trong AI, vector biểu diễn các điểm dữ liệu, đặc trưng hoặc tham số.

```
v = [3, 4]        -- a 2D vector
w = [1, 0, -2]    -- a 3D vector
```

Một vector 2D `[3, 4]` hướng đến tọa độ (3, 4) trên một mặt phẳng. Độ dài (độ lớn) của nó là 5 (tam giác 3-4-5).

### Matrices: grids of numbers

Một ma trận là một lưới 2D. Hàng và cột. Một ma trận $m \times n$ có $m$ hàng và $n$ cột.

```math
A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{bmatrix} \quad \text{2x3 matrix (2 rows, 3 columns)}
```

Trong mạng nơ-ron, các ma trận trọng số biến đổi các vector đầu vào thành các vector đầu ra. Một lớp có 784 đầu vào và 128 đầu ra sử dụng một ma trận trọng số 128x784.

### Why shapes matter

Phép nhân ma trận có một quy tắc nghiêm ngặt: `(m x n) @ (n x p) = (m x p)`. Các chiều bên trong phải khớp.

```
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output

Inner dimensions: 784 = 784  -- valid
```

Nếu bạn gặp lỗi hình dạng không khớp trong PyTorch, đây là lý do.

### The operations map

| Phép toán | Tác dụng | Cách dùng trong mạng nơ-ron |
|-----------|-------------|-------------------|
| Cộng | Kết hợp theo từng phần tử | Cộng bias vào đầu ra |
| Nhân vô hướng | Co giãn mọi phần tử | Tốc độ học * gradient |
| Nhân ma trận | Biến đổi các vector | Lượt truyền xuôi của lớp |
| Chuyển vị | Đổi hàng và cột | Lan truyền ngược |
| Định thức | Tóm tắt bằng một số | Kiểm tra tính khả nghịch |
| Nghịch đảo | Hoàn tác một phép biến đổi | Giải các hệ tuyến tính |
| Đơn vị | Ma trận không làm gì | Khởi tạo, kết nối phần dư |

### Element-wise vs matrix multiplication

Sự phân biệt này liên tục gây khó cho người mới.

Theo từng phần tử: nhân các vị trí tương ứng. Cả hai ma trận phải có cùng hình dạng.

```math
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} * \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 5 & 12 \\ 21 & 32 \end{bmatrix}
```

Nhân ma trận: các tích vô hướng của hàng và cột. Các chiều bên trong phải khớp.

```math
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} @ \begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 1 \cdot 5 + 2 \cdot 7 & 1 \cdot 6 + 2 \cdot 8 \\ 3 \cdot 5 + 4 \cdot 7 & 3 \cdot 6 + 4 \cdot 8 \end{bmatrix} = \begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}
```

Các phép toán khác nhau, kết quả khác nhau, quy tắc khác nhau.

### Broadcasting

Khi bạn cộng một vector bias vào một ma trận đầu ra, các hình dạng không khớp. Broadcasting kéo giãn mảng nhỏ hơn cho vừa.

```
| 1  2  3 |   +   [10, 20, 30]
| 4  5  6 |

Broadcasting stretches the vector across rows:

| 1  2  3 |   | 10  20  30 |   | 11  22  33 |
| 4  5  6 | + | 10  20  30 | = | 14  25  36 |
```

Mọi framework hiện đại đều tự động làm điều này. Hiểu nó giúp tránh bối rối khi hình dạng có vẻ sai nhưng mã vẫn chạy.

```figure
vector-projection
```

## Build It

### Step 1: Vector class

```python
class Vector:
    def __init__(self, data):
        self.data = list(data)
        self.size = len(self.data)

    def __repr__(self):
        return f"Vector({self.data})"

    def __add__(self, other):
        return Vector([a + b for a, b in zip(self.data, other.data)])

    def __sub__(self, other):
        return Vector([a - b for a, b in zip(self.data, other.data)])

    def __mul__(self, scalar):
        return Vector([x * scalar for x in self.data])

    def dot(self, other):
        return sum(a * b for a, b in zip(self.data, other.data))

    def magnitude(self):
        return sum(x ** 2 for x in self.data) ** 0.5
```

### Step 2: Matrix class with core operations

```python
class Matrix:
    def __init__(self, data):
        self.data = [list(row) for row in data]
        self.rows = len(self.data)
        self.cols = len(self.data[0])
        self.shape = (self.rows, self.cols)

    def __repr__(self):
        rows_str = "\n  ".join(str(row) for row in self.data)
        return f"Matrix({self.shape}):\n  {rows_str}"

    def __add__(self, other):
        return Matrix([
            [self.data[i][j] + other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def __sub__(self, other):
        return Matrix([
            [self.data[i][j] - other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def scalar_multiply(self, scalar):
        return Matrix([
            [self.data[i][j] * scalar for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def element_wise_multiply(self, other):
        return Matrix([
            [self.data[i][j] * other.data[i][j] for j in range(self.cols)]
            for i in range(self.rows)
        ])

    def matmul(self, other):
        return Matrix([
            [
                sum(self.data[i][k] * other.data[k][j] for k in range(self.cols))
                for j in range(other.cols)
            ]
            for i in range(self.rows)
        ])

    def transpose(self):
        return Matrix([
            [self.data[j][i] for j in range(self.rows)]
            for i in range(self.cols)
        ])

    def determinant(self):
        if self.shape == (1, 1):
            return self.data[0][0]
        if self.shape == (2, 2):
            return self.data[0][0] * self.data[1][1] - self.data[0][1] * self.data[1][0]
        det = 0
        for j in range(self.cols):
            minor = Matrix([
                [self.data[i][k] for k in range(self.cols) if k != j]
                for i in range(1, self.rows)
            ])
            det += ((-1) ** j) * self.data[0][j] * minor.determinant()
        return det

    def inverse_2x2(self):
        det = self.determinant()
        if det == 0:
            raise ValueError("Matrix is singular, no inverse exists")
        return Matrix([
            [self.data[1][1] / det, -self.data[0][1] / det],
            [-self.data[1][0] / det, self.data[0][0] / det]
        ])

    @staticmethod
    def identity(n):
        return Matrix([
            [1 if i == j else 0 for j in range(n)]
            for i in range(n)
        ])
```

### Step 3: See it work

```python
A = Matrix([[1, 2], [3, 4]])
B = Matrix([[5, 6], [7, 8]])

print("A + B =", (A + B).data)
print("A @ B =", A.matmul(B).data)
print("A^T =", A.transpose().data)
print("det(A) =", A.determinant())
print("A^-1 =", A.inverse_2x2().data)

I = Matrix.identity(2)
print("A @ A^-1 =", A.matmul(A.inverse_2x2()).data)
```

### Step 4: Connect to neural networks

```python
import random

inputs = Matrix([[0.5], [0.8], [0.2]])
weights = Matrix([
    [random.uniform(-1, 1) for _ in range(3)]
    for _ in range(2)
])
bias = Matrix([[0.1], [0.1]])

def relu_matrix(m):
    return Matrix([[max(0, val) for val in row] for row in m.data])

pre_activation = weights.matmul(inputs) + bias
output = relu_matrix(pre_activation)

print(f"Input shape: {inputs.shape}")
print(f"Weight shape: {weights.shape}")
print(f"Output shape: {output.shape}")
print(f"Output: {output.data}")
```

Đây là một lớp kết nối đầy đủ: `output = relu(W @ x + b)`. Mọi lớp kết nối đầy đủ trong mọi mạng nơ-ron đều thực hiện chính xác điều này.

## Use It

NumPy thực hiện mọi thứ ở trên bằng ít dòng hơn và nhanh hơn nhiều bậc độ lớn.

```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print("A + B =\n", A + B)
print("A * B (element-wise) =\n", A * B)
print("A @ B (matrix multiply) =\n", A @ B)
print("A^T =\n", A.T)
print("det(A) =", np.linalg.det(A))
print("A^-1 =\n", np.linalg.inv(A))
print("I =\n", np.eye(2))

inputs = np.random.randn(3, 1)
weights = np.random.randn(2, 3)
bias = np.array([[0.1], [0.1]])
output = np.maximum(0, weights @ inputs + bias)

print(f"\nNeural network layer: {weights.shape} @ {inputs.shape} = {output.shape}")
print(f"Output:\n{output}")
```

Toán tử `@` trong Python gọi `__matmul__`. NumPy triển khai nó bằng các thủ tục BLAS được tối ưu hóa viết bằng C và Fortran. Cùng phép toán, nhanh hơn 100 lần.

Broadcasting trong NumPy:

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
bias = np.array([10, 20, 30])
print(matrix + bias)
```

NumPy tự động broadcast bias 1D qua cả hai hàng. Đây là cách phép cộng bias hoạt động trong mọi framework mạng nơ-ron.

## Ship It

Bài học này tạo ra một prompt để dạy các phép toán ma trận thông qua trực giác hình học. Xem `outputs/prompt-matrix-operations.md`.

Lớp Matrix được xây dựng ở đây là nền tảng cho framework mạng nơ-ron nhỏ mà chúng ta xây dựng trong Giai đoạn 3, Bài học 10.

## Exercises

1. **Xác minh nghịch đảo.** Nhân `A @ A.inverse_2x2()` và xác nhận bạn nhận được ma trận đơn vị. Thử với ba ma trận 2x2 khác nhau. Điều gì xảy ra khi định thức bằng không?

2. **Triển khai nghịch đảo 3x3.** Mở rộng lớp Matrix để tính nghịch đảo cho các ma trận 3x3 bằng phương pháp ma trận phụ hợp. Kiểm tra nó với `np.linalg.inv` của NumPy.

3. **Xây dựng một mạng hai lớp.** Chỉ sử dụng lớp Matrix của bạn (không NumPy), tạo một mạng nơ-ron hai lớp: đầu vào (3) -> ẩn (4) -> đầu ra (2). Khởi tạo các trọng số ngẫu nhiên, chạy một lượt truyền xuôi và xác minh tất cả hình dạng đều đúng.

### Hints

**Bài tập 1.** Nhân `A @ A.inverse_2x2()` cho ba ma trận và so sánh mỗi ô với ma trận đơn vị trong phạm vi `1e-9`. Đối với một ma trận có định thức bằng 0, chẳng hạn [[1, 2], [2, 4]], `inverse_2x2` phát sinh một `ValueError`, và đây là kết quả mong đợi.

**Bài tập 2.** Tính ma trận phần bù đại số 3x3, chuyển vị nó để có ma trận phụ hợp, rồi chia mỗi ô cho `determinant()`. Kiểm tra rằng `A @ A_inv` cho ma trận đơn vị và mỗi ô khớp với `np.linalg.inv(A)` trong phạm vi `1e-9`.

**Bài tập 3.** Viết kích thước của mỗi ma trận trước khi nhân: `W1` là 4x3 và `W2` là 2x4, như trong `demo_neural_network_layer`. Một đầu vào 3x1 phải cho một vector ẩn 4x1 và một đầu ra 2x1.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Vector | "Một mũi tên" | Một danh sách các số có thứ tự. Trong AI: một điểm trong không gian nhiều chiều. |
| Matrix (Ma trận) | "Một bảng các số" | Một phép biến đổi tuyến tính. Nó ánh xạ các vector từ không gian này sang không gian khác. |
| Matrix multiply (Nhân ma trận) | "Chỉ nhân các số" | Các tích vô hướng giữa mọi hàng của ma trận thứ nhất và mọi cột của ma trận thứ hai. Thứ tự có ý nghĩa. |
| Transpose (Chuyển vị) | "Lật nó" | Hoán đổi hàng và cột. Biến một ma trận $m \times n$ thành $n \times m$. Thiết yếu trong lan truyền ngược. |
| Determinant (Định thức) | "Một số nào đó từ ma trận" | Đo mức độ ma trận co giãn diện tích (2D) hoặc thể tích (3D). Bằng không có nghĩa là phép biến đổi ép dẹp một chiều. |
| Inverse (Nghịch đảo) | "Hoàn tác ma trận" | Ma trận đảo ngược phép biến đổi. Chỉ tồn tại khi định thức khác không. |
| Identity matrix (Ma trận đơn vị) | "Ma trận nhàm chán" | Ma trận tương đương với việc nhân với 1. Được sử dụng trong các kết nối phần dư (ResNets). |
| Broadcasting | "Sửa hình dạng bằng phép thuật" | Kéo giãn một mảng nhỏ hơn để khớp với một mảng lớn hơn bằng cách lặp lại theo các chiều còn thiếu. |
| Element-wise (Theo từng phần tử) | "Phép nhân thông thường" | Nhân các vị trí tương ứng. Cả hai mảng phải có cùng hình dạng (hoặc có thể broadcast). |

## Further Reading

- [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) - trực giác trực quan cho mọi phép toán được đề cập ở đây
- [Tài liệu NumPy về broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html) - các quy tắc chính xác mà NumPy tuân theo
- [Stanford CS229 Linear Algebra Review](http://cs229.stanford.edu/section/cs229-linalg.pdf) - tài liệu tham khảo ngắn gọn về đại số tuyến tính dành riêng cho ML
