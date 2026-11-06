# Introduction to JAX

> PyTorch thay đổi các tensor. TensorFlow xây dựng các đồ thị. JAX biên dịch các hàm thuần. Điều cuối cùng đó thay đổi cách bạn nghĩ về học sâu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10, basic NumPy
**Time:** ~90 minutes

## Learning Objectives

- Viết mã mạng nơ-ron bằng hàm thuần sử dụng API lập trình hàm của JAX (jax.numpy, jax.grad, jax.jit, jax.vmap)
- Giải thích khác biệt thiết kế chính giữa thay đổi tức thời của PyTorch và mô hình biên dịch hàm của JAX
- Áp dụng biên dịch jit và vector hóa vmap để tăng tốc các vòng lặp huấn luyện so với Python đơn giản
- Huấn luyện một mạng đơn giản trong JAX và đối chiếu quản lý trạng thái tường minh với cách tiếp cận hướng đối tượng của PyTorch

## The Problem

Bạn biết cách xây dựng các mạng nơ-ron trong PyTorch. Bạn định nghĩa một `nn.Module`, gọi `.backward()`, thực hiện bước tối ưu hóa. Nó hoạt động. Hàng triệu người sử dụng nó.

Nhưng PyTorch có một ràng buộc ăn sâu vào DNA: nó truy vết các phép toán tức thời, từng phép một, trong Python. Mỗi `tensor + tensor` là một lần khởi chạy kernel riêng. Mỗi bước huấn luyện thông dịch lại cùng mã Python. Điều này hoạt động ổn cho tới khi bạn cần huấn luyện một mô hình 540 tỷ tham số trên 2,048 TPU. Khi đó chi phí phụ giết bạn.

Google DeepMind huấn luyện Gemini trên JAX. Anthropic đã huấn luyện Claude trên JAX. Đây không phải các hoạt động nhỏ -- chúng là những lần huấn luyện mạng nơ-ron lớn nhất trên Trái Đất. Họ chọn JAX vì nó coi vòng lặp huấn luyện của bạn như một chương trình có thể biên dịch, không phải một chuỗi lời gọi Python.

JAX là NumPy với ba siêu năng lực: vi phân tự động, biên dịch JIT sang XLA và vector hóa tự động. Bạn viết một hàm xử lý một ví dụ. JAX cho bạn một hàm xử lý một batch, tính các gradient, biên dịch thành mã máy và chạy trên nhiều thiết bị. Tất cả mà không thay đổi hàm gốc.

## The Concept

### The JAX Philosophy

JAX là một framework lập trình hàm. Không lớp, không trạng thái có thể thay đổi, không phương thức `.backward()`. Thay vào đó:

| PyTorch | JAX |
|---------|-----|
| Lớp `nn.Module` có trạng thái | Hàm thuần: `f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Thực thi tức thời | Biên dịch JIT qua XLA |
| Vòng lặp thủ công `for x in batch:` | Vector hóa tự động `jax.vmap(f)` |
| `DataParallel` / `FSDP` | Song song hóa tự động `jax.pmap(f)` |
| `model.parameters()` có thể thay đổi | Pytree bất biến của các mảng |

Đây không phải sở thích phong cách. Đó là một ràng buộc trình biên dịch. Biên dịch JIT yêu cầu các hàm thuần -- cùng đầu vào luôn tạo cùng đầu ra, không tác dụng phụ. Hạn chế đó là điều khiến tăng tốc 100 lần trở nên khả thi.

### jax.numpy: The Familiar Surface

JAX triển khai lại API NumPy trên các bộ tăng tốc:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

Cùng tên hàm. Cùng quy tắc broadcasting. Cùng ngữ nghĩa cắt lát. Nhưng các mảng nằm trên GPU/TPU và mọi phép toán đều có thể được trình biên dịch truy vết.

Một khác biệt then chốt: các mảng JAX bất biến. Không `a[0] = 5`. Thay vào đó: `a = a.at[0].set(5)`. Điều này có vẻ vụng về trong một tuần, rồi bạn hiểu ra -- tính bất biến là điều khiến các phép biến đổi như `grad`, `jit` và `vmap` có thể kết hợp.

### jax.grad: Functional Autodiff

PyTorch gắn các gradient vào tensor (`.grad`). JAX gắn các gradient vào hàm.

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad` nhận một hàm và trả về một hàm mới tính gradient. Không lời gọi `.backward()`. Không đồ thị tính toán lưu trên tensor. Gradient chỉ là một hàm khác bạn có thể gọi, kết hợp hoặc biên dịch JIT.

Điều này kết hợp tùy ý:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

Đạo hàm bậc hai. Đạo hàm bậc ba. Jacobian. Hessian. Tất cả bằng cách kết hợp `grad`. PyTorch cũng có thể làm điều này (`torch.autograd.functional.hessian`), nhưng nó được gắn thêm vào. Trong JAX, đó là nền tảng.

Ràng buộc: `grad` chỉ hoạt động trên các hàm thuần. Không câu lệnh print bên trong (chúng chạy trong truy vết, không phải thực thi). Không thay đổi trạng thái bên ngoài. Không sinh số ngẫu nhiên mà không quản lý khóa tường minh.

### jit: Compile to XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

Ở lời gọi đầu tiên, JAX truy vết hàm -- nó ghi lại những phép toán nào xảy ra mà không thực thi chúng. Rồi nó đưa bản truy vết đó cho XLA (Accelerated Linear Algebra), trình biên dịch của Google cho TPU và GPU. XLA hợp nhất các phép toán, loại bỏ các bản sao bộ nhớ dư thừa và sinh mã máy được tối ưu hóa.

Các lời gọi sau bỏ qua Python hoàn toàn. Mã đã biên dịch chạy trên bộ tăng tốc ở tốc độ C++.

Khi JIT giúp ích:
- Các bước huấn luyện (cùng phép tính được lặp hàng nghìn lần)
- Suy luận (cùng mô hình, các đầu vào khác nhau)
- Bất kỳ hàm nào được gọi hơn một lần với các đầu vào có hình dạng tương tự

Khi JIT gây hại:
- Các hàm có luồng điều khiển Python phụ thuộc các giá trị (`if x > 0` trong đó x là một mảng được truy vết)
- Các phép tính một lần (chi phí biên dịch vượt thời gian chạy)
- Gỡ lỗi (truy vết che giấu thực thi thực tế)

Hạn chế luồng điều khiển là có thật. `jax.lax.cond` thay thế `if/else`. `jax.lax.scan` thay thế các vòng lặp `for`. Chúng không phải tùy chọn -- chúng là cái giá của biên dịch.

### vmap: Automatic Vectorization

Bạn viết một hàm xử lý một ví dụ:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap` nâng nó lên để xử lý một batch:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)` nghĩa là: không chia batch trên `params` (dùng chung), chia batch trên trục 0 của `x`. Không vòng lặp `for` thủ công. Không đổi hình dạng. Không luồn chiều batch xuyên suốt. JAX tìm ra chiều batch và vector hóa toàn bộ phép tính.

Đây không phải cú pháp làm đẹp. `vmap` sinh mã vector hóa được hợp nhất chạy nhanh hơn một vòng lặp Python 10-100 lần. Và nó kết hợp với `jit` và `grad`:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

Các gradient theo từng ví dụ. Một dòng. Điều này gần như không thể trong PyTorch nếu không có các thủ thuật.

### pmap: Data Parallelism Across Devices

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap` sao chép hàm trên tất cả các thiết bị sẵn có (GPU/TPU) và chia batch. Bên trong hàm, `jax.lax.pmean` và `jax.lax.psum` đồng bộ các gradient giữa các thiết bị.

Google huấn luyện Gemini trên hàng nghìn chip TPU v5e bằng `pmap` (và kế nhiệm `shard_map` của nó). Mô hình lập trình: viết phiên bản một thiết bị, bao bọc bằng `pmap`, xong.

### Pytrees: The Universal Data Structure

JAX hoạt động trên các "pytree" -- các tổ hợp lồng nhau của danh sách, tuple, dict và mảng. Các tham số mô hình của bạn là một pytree:

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Mọi phép biến đổi JAX -- `grad`, `jit`, `vmap` -- đều biết cách duyệt các pytree. `jax.tree.map(f, tree)` áp dụng `f` cho mọi lá. Đây là cách các bộ tối ưu hóa cập nhật tất cả tham số cùng lúc:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Không phương thức `.parameters()`. Không đăng ký tham số. Cấu trúc cây chính là mô hình.

### Functional vs Object-Oriented

PyTorch lưu trạng thái bên trong các đối tượng:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX sử dụng các hàm thuần với trạng thái tường minh:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Các params được truyền vào. Không gì được lưu. Không gì bị thay đổi. Điều này khiến mọi hàm có thể kiểm thử, kết hợp và biên dịch. Nó cũng nghĩa là bạn tự quản lý các params -- hoặc sử dụng một thư viện như Flax hay Equinox.

### The JAX Ecosystem

JAX cho bạn các thành phần nguyên thủy. Các thư viện cho bạn sự tiện dụng:

| Thư viện | Vai trò | Phong cách |
|---------|------|-------|
| **Flax** (Google) | Các lớp mạng nơ-ron | `nn.Module` với trạng thái tường minh |
| **Equinox** (Patrick Kidger) | Các lớp mạng nơ-ron | Dựa trên pytree, theo phong cách Python |
| **Optax** (DeepMind) | Các bộ tối ưu hóa + lịch LR | Các phép biến đổi gradient có thể kết hợp |
| **Orbax** (Google) | Lưu checkpoint | Lưu/khôi phục các pytree |
| **CLU** (Google) | Các thước đo + ghi nhật ký | Các tiện ích vòng lặp huấn luyện |

Optax là thư viện bộ tối ưu hóa tiêu chuẩn. Nó tách phép biến đổi gradient (Adam, SGD, cắt) khỏi cập nhật tham số, khiến việc kết hợp trở nên đơn giản:

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### When to Use JAX vs PyTorch

| Yếu tố | JAX | PyTorch |
|--------|-----|---------|
| Hỗ trợ TPU | Hạng nhất (Google xây cả hai) | Được cộng đồng duy trì (torch_xla) |
| Hỗ trợ GPU | Tốt (CUDA qua XLA) | Tốt nhất trong loại (CUDA gốc) |
| Gỡ lỗi | Khó (truy vết + biên dịch) | Dễ (tức thời, từng dòng) |
| Hệ sinh thái | Tập trung nghiên cứu (Flax, Equinox) | Khổng lồ (HuggingFace, torchvision, v.v.) |
| Tuyển dụng | Ngách (Google/DeepMind/Anthropic) | Phổ biến (mọi nơi) |
| Huấn luyện quy mô lớn | Vượt trội (XLA, pmap, mesh) | Tốt (FSDP, DeepSpeed) |
| Tốc độ tạo mẫu thử | Chậm hơn (chi phí phụ của lập trình hàm) | Nhanh hơn (thay đổi rồi chạy) |
| Suy luận production | TensorFlow Serving, Vertex AI | TorchServe, Triton, ONNX |
| Ai sử dụng | DeepMind (Gemini), Anthropic (Claude) | Meta (Llama), OpenAI (GPT), Stability AI |

Câu trả lời thành thật: sử dụng PyTorch trừ khi bạn có lý do cụ thể để sử dụng JAX. Các lý do đó là -- có quyền truy cập TPU, cần các gradient theo từng ví dụ, huấn luyện đa thiết bị ở quy mô khổng lồ hoặc làm việc tại Google/DeepMind/Anthropic.

### Random Numbers in JAX

JAX không có trạng thái ngẫu nhiên toàn cục. Mọi phép toán ngẫu nhiên đều yêu cầu một khóa PRNG tường minh:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

Điều này ban đầu gây khó chịu. Nhưng nó bảo đảm khả năng tái lập giữa các thiết bị và các lần biên dịch -- một thuộc tính mà `torch.manual_seed` của PyTorch không thể bảo đảm trong các thiết lập nhiều GPU.

```figure
batchnorm-effect
```

## Build It

### Step 1: Setup and Data

Chúng ta sẽ huấn luyện một MLP 3 lớp trên MNIST bằng JAX và Optax. 784 đầu vào, hai lớp ẩn có 256 và 128 nơ-ron, 10 lớp phân loại đầu ra.

```python
import jax
import jax.numpy as jnp
from jax import random
import optax

def get_mnist_data():
    from sklearn.datasets import fetch_openml
    mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='auto')
    X = mnist.data.astype('float32') / 255.0
    y = mnist.target.astype('int')
    X_train, X_test = X[:60000], X[60000:]
    y_train, y_test = y[:60000], y[60000:]
    return X_train, y_train, X_test, y_test
```

### Step 2: Initialize Parameters

Không lớp. Chỉ một hàm trả về một pytree:

```python
def init_params(key):
    k1, k2, k3 = random.split(key, 3)
    scale1 = jnp.sqrt(2.0 / 784)
    scale2 = jnp.sqrt(2.0 / 256)
    scale3 = jnp.sqrt(2.0 / 128)
    params = {
        'layer1': {
            'w': scale1 * random.normal(k1, (784, 256)),
            'b': jnp.zeros(256),
        },
        'layer2': {
            'w': scale2 * random.normal(k2, (256, 128)),
            'b': jnp.zeros(128),
        },
        'layer3': {
            'w': scale3 * random.normal(k3, (128, 10)),
            'b': jnp.zeros(10),
        },
    }
    return params
```

Khởi tạo He, thực hiện thủ công. Ba khóa PRNG được tách từ một seed. Mỗi trọng số là một mảng bất biến trong một dict lồng nhau.

### Step 3: Forward Pass

```python
def forward(params, x):
    x = jnp.dot(x, params['layer1']['w']) + params['layer1']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer2']['w']) + params['layer2']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer3']['w']) + params['layer3']['b']
    return x

def loss_fn(params, x, y):
    logits = forward(params, x)
    one_hot = jax.nn.one_hot(y, 10)
    return -jnp.mean(jnp.sum(jax.nn.log_softmax(logits) * one_hot, axis=-1))
```

Các hàm thuần. Params vào, dự đoán ra. Không `self`, không trạng thái được lưu. `loss_fn` tính cross-entropy từ đầu -- softmax, log, trung bình âm.

### Step 4: JIT-Compiled Training Step

```python
@jax.jit
def train_step(params, opt_state, x, y):
    loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
    updates, opt_state = optimizer.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)
    return params, opt_state, loss

@jax.jit
def accuracy(params, x, y):
    logits = forward(params, x)
    preds = jnp.argmax(logits, axis=-1)
    return jnp.mean(preds == y)
```

`jax.value_and_grad` trả về cả giá trị mất mát và các gradient trong một lượt. Decorator `@jax.jit` biên dịch cả hai hàm sang XLA. Sau lời gọi đầu tiên, mỗi bước huấn luyện chạy mà không chạm tới Python.

### Step 5: Training Loop

```python
optimizer = optax.adam(learning_rate=1e-3)

X_train, y_train, X_test, y_test = get_mnist_data()
X_train, X_test = jnp.array(X_train), jnp.array(X_test)
y_train, y_test = jnp.array(y_train), jnp.array(y_test)

key = random.PRNGKey(0)
params = init_params(key)
opt_state = optimizer.init(params)

batch_size = 128
n_epochs = 10

for epoch in range(n_epochs):
    key, subkey = random.split(key)
    perm = random.permutation(subkey, len(X_train))
    X_shuffled = X_train[perm]
    y_shuffled = y_train[perm]

    epoch_loss = 0.0
    n_batches = len(X_train) // batch_size
    for i in range(n_batches):
        start = i * batch_size
        xb = X_shuffled[start:start + batch_size]
        yb = y_shuffled[start:start + batch_size]
        params, opt_state, loss = train_step(params, opt_state, xb, yb)
        epoch_loss += loss

    train_acc = accuracy(params, X_train[:5000], y_train[:5000])
    test_acc = accuracy(params, X_test, y_test)
    print(f"Epoch {epoch + 1:2d} | Loss: {epoch_loss / n_batches:.4f} | "
          f"Train Acc: {train_acc:.4f} | Test Acc: {test_acc:.4f}")
```

10 epoch. Accuracy test ~97%. Epoch đầu tiên chậm (biên dịch JIT). Các epoch 2-10 nhanh.

Chú ý những gì còn thiếu: không `.zero_grad()`, không `.backward()`, không `.step()`. Toàn bộ cập nhật là một lời gọi hàm được kết hợp. Các gradient được tính, được Adam biến đổi và được áp dụng cho các tham số -- tất cả bên trong `train_step`.

## Use It

### Flax: The Google Standard

Flax là thư viện mạng nơ-ron JAX phổ biến nhất. Nó thêm `nn.Module` trở lại, nhưng với quản lý trạng thái tường minh:

```python
import flax.linen as nn

class MLP(nn.Module):
    @nn.compact
    def __call__(self, x):
        x = nn.Dense(256)(x)
        x = nn.relu(x)
        x = nn.Dense(128)(x)
        x = nn.relu(x)
        x = nn.Dense(10)(x)
        return x

model = MLP()
params = model.init(jax.random.PRNGKey(0), jnp.ones((1, 784)))
logits = model.apply(params, x_batch)
```

Cùng cấu trúc như PyTorch, nhưng `params` tách biệt với mô hình. `model.init()` tạo các params. `model.apply(params, x)` chạy lượt truyền xuôi. Đối tượng mô hình không có trạng thái.

### Equinox: The Pythonic Alternative

Equinox (của Patrick Kidger) biểu diễn các mô hình dưới dạng pytree:

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

Bản thân mô hình là một pytree. Không cần `.apply()`. Các tham số chỉ là các lá của mô hình. Điều này gần hơn với cách JAX suy nghĩ.

### Optax: Composable Optimizers

Optax tách rời phép biến đổi gradient khỏi cập nhật:

```python
schedule = optax.warmup_cosine_decay_schedule(
    init_value=0.0, peak_value=1e-3,
    warmup_steps=1000, decay_steps=50000
)

optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adamw(learning_rate=schedule, weight_decay=0.01),
)
```

Cắt gradient, warmup tốc độ học, weight decay -- tất cả được kết hợp thành một chuỗi phép biến đổi. Mỗi phép biến đổi nhìn thấy các gradient, sửa đổi chúng và truyền tới phép tiếp theo. Không có lớp bộ tối ưu hóa nguyên khối.

## Ship It

**Cài đặt:**

```bash
pip install jax jaxlib optax flax
```

Để hỗ trợ GPU:

```bash
pip install jax[cuda12]
```

Với TPU (Google Cloud):

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**Các điểm dễ vấp về hiệu năng:**

- Lời gọi JIT đầu tiên chậm (biên dịch). Khởi động trước khi đo hiệu năng.
- Tránh các vòng lặp Python trên các mảng JAX bên trong JIT. Sử dụng `jax.lax.scan` hoặc `jax.lax.fori_loop`.
- `jax.debug.print()` hoạt động bên trong JIT. `print()` thông thường thì không.
- Đo hiệu năng với `jax.profiler` hoặc TensorBoard. Biên dịch XLA có thể che giấu các nút thắt.
- JAX cấp phát trước 75% bộ nhớ GPU theo mặc định. Đặt `XLA_PYTHON_CLIENT_PREALLOCATE=false` để tắt.

**Lưu checkpoint:**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**Bài học này tạo ra:**
- `outputs/prompt-jax-optimizer.md` -- một prompt để chọn cấu hình bộ tối ưu hóa JAX phù hợp
- `outputs/skill-jax-patterns.md` -- một skill đề cập các mẫu lập trình hàm trong JAX

## Exercises

1. Thêm dropout vào MLP. Trong JAX, dropout yêu cầu một khóa PRNG -- truyền một khóa xuyên qua lượt truyền xuôi và tách nó cho mỗi lớp dropout. So sánh accuracy test khi có và không có.

2. Sử dụng `jax.vmap` để tính các gradient theo từng ví dụ cho một batch 32 hình ảnh MNIST. Tính chuẩn gradient cho mỗi ví dụ. Những ví dụ nào có các gradient lớn nhất, và tại sao?

3. Thay hàm forward thủ công bằng một `mlp_forward(params, x)` tổng quát hoạt động cho bất kỳ số lớp nào. Sử dụng `jax.tree.leaves` để tự động xác định độ sâu.

4. Đo hiệu năng bước huấn luyện khi có và không có `@jax.jit`. Đo thời gian 100 bước của mỗi cách. Mức tăng tốc lớn đến mức nào trên phần cứng của bạn? Chi phí biên dịch ở lời gọi đầu tiên là bao nhiêu?

5. Triển khai cắt gradient bằng cách kết hợp `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`. Huấn luyện có và không cắt. Vẽ chuẩn gradient trong huấn luyện để thấy tác động.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| XLA | "Thứ khiến JAX nhanh" | Accelerated Linear Algebra -- một trình biên dịch hợp nhất các phép toán và sinh các kernel GPU/TPU được tối ưu hóa từ một đồ thị tính toán |
| JIT | "Biên dịch đúng lúc" | JAX truy vết hàm ở lời gọi đầu tiên, biên dịch sang XLA, rồi chạy phiên bản đã biên dịch ở các lời gọi sau |
| Pure function (Hàm thuần) | "Không tác dụng phụ" | Một hàm mà đầu ra chỉ phụ thuộc vào đầu vào -- không trạng thái toàn cục, không thay đổi, không tính ngẫu nhiên nếu không có khóa tường minh |
| vmap | "Chia batch tự động" | Biến đổi một hàm xử lý một ví dụ thành một hàm xử lý một batch, không cần viết lại |
| pmap | "Song song hóa tự động" | Sao chép một hàm trên nhiều thiết bị và chia batch đầu vào |
| Pytree | "Dict mảng lồng nhau" | Bất kỳ cấu trúc lồng nhau của danh sách, tuple, dict và mảng mà JAX có thể duyệt và biến đổi |
| Tracing (Truy vết) | "Ghi lại phép tính" | JAX thực thi hàm với các giá trị trừu tượng để xây một đồ thị tính toán, không tính các kết quả thật |
| Functional autodiff (Vi phân tự động theo hàm) | "grad của một hàm" | Tính các đạo hàm bằng cách biến đổi các hàm, không phải gắn bộ lưu trữ gradient vào các tensor |
| Optax | "Thư viện bộ tối ưu hóa của JAX" | Một thư viện có thể kết hợp của các phép biến đổi gradient -- Adam, SGD, cắt, lập lịch -- nối chuỗi với nhau |
| Flax | "nn.Module của JAX" | Thư viện mạng nơ-ron của Google cho JAX, thêm các trừu tượng lớp trong khi giữ trạng thái tường minh |

## Further Reading

- Tài liệu JAX: https://jax.readthedocs.io/ -- tài liệu chính thức, với các hướng dẫn xuất sắc về grad, jit và vmap
- "JAX: composable transformations of Python+NumPy programs" (Bradbury et al., 2018) -- bài báo gốc giải thích triết lý thiết kế
- Tài liệu Flax: https://flax.readthedocs.io/ -- thư viện mạng nơ-ron của Google cho JAX
- Patrick Kidger, "Equinox: neural networks in JAX via callable PyTrees and filtered transformations" (2021) -- phương án theo phong cách Python thay cho Flax
- DeepMind, "Optax: composable gradient transformation and optimisation" -- thư viện bộ tối ưu hóa tiêu chuẩn
- "You Don't Know JAX" (Colin Raffel, 2020) -- một hướng dẫn thực tế về các điểm dễ vấp và các mẫu JAX, từ một trong các tác giả T5
