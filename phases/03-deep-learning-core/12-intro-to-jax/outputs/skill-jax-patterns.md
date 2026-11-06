---
name: skill-jax-patterns
description: Functional programming patterns in JAX -- when and how to use grad, jit, vmap, and pmap
version: 1.0.0
phase: 3
lesson: 12
tags: [jax, functional-programming, autodiff, compilation, vectorization]
---

# JAX Functional Patterns

JAX biến đổi các hàm thuần. Mỗi mẫu bên dưới theo một quy tắc: viết một hàm nhận các đầu vào và trả về các đầu ra, không có tác dụng phụ. Rồi biến đổi nó.

## The Four Transforms

### grad -- Differentiate a function

```python
grads = jax.grad(loss_fn)(params, x, y)
loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
```

Sử dụng khi: bạn cần các gradient để tối ưu hóa.
Ràng buộc: hàm phải trả về một số vô hướng. Với các đầu ra không vô hướng, sử dụng `jax.jacobian`.

### jit -- Compile a function

```python
fast_fn = jax.jit(f)
```

Sử dụng khi: hàm sẽ được gọi hơn một lần với các đầu vào cùng hình dạng.
Ràng buộc: không có luồng điều khiển Python phụ thuộc các giá trị được truy vết. Sử dụng `jax.lax.cond` cho điều kiện, `jax.lax.scan` cho các vòng lặp.

### vmap -- Vectorize a function

```python
batch_fn = jax.vmap(f, in_axes=(None, 0))
```

Sử dụng khi: bạn đã viết một hàm cho một ví dụ và cần nó hoạt động trên các batch.
`in_axes` chỉ định trục đối số nào để chia batch. `None` nghĩa là không chia batch (broadcast).

### pmap -- Parallelize across devices

```python
parallel_fn = jax.pmap(f, axis_name='devices')
```

Sử dụng khi: bạn có nhiều GPU/TPU và muốn song song dữ liệu.
Bên trong hàm, `jax.lax.pmean(x, 'devices')` lấy trung bình giữa các thiết bị.

## Composition Rules

Các phép biến đổi kết hợp được. Thứ tự quan trọng:

```python
per_example_grads = jax.jit(jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0)))
```

Đọc từ phải sang trái: lấy gradient của loss_fn, vector hóa trên các ví dụ, biên dịch kết quả.

Các tổ hợp hợp lệ:
- `jit(grad(f))` -- tính gradient được biên dịch
- `jit(vmap(f))` -- tính toán theo batch được biên dịch
- `vmap(grad(f))` -- các gradient theo từng ví dụ
- `pmap(jit(f))` -- tính toán được biên dịch song song
- `grad(jit(f))` -- gradient của hàm đã biên dịch (giống jit(grad(f)))

## Parameter Management Pattern

Các tham số JAX là các pytree (các dict mảng lồng nhau):

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 10)),  'b': jnp.zeros(10)},
}
```

Cập nhật tất cả các tham số cùng lúc:
```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Đếm các tham số:
```python
n_params = sum(p.size for p in jax.tree.leaves(params))
```

## PRNG Key Management

JAX yêu cầu các khóa ngẫu nhiên tường minh:

```python
key = jax.random.PRNGKey(0)
key, subkey = jax.random.split(key)
noise = jax.random.normal(subkey, shape)
```

Với nhiều phép toán ngẫu nhiên, tách một lần:
```python
keys = jax.random.split(key, n)
```

Không bao giờ dùng lại một khóa. Luôn tách trước khi sử dụng.

## Common Mistakes

1. **Thay đổi các mảng bên trong jit**: Các mảng JAX bất biến. Sử dụng `x.at[i].set(v)` thay cho `x[i] = v`.

2. **Sử dụng print Python bên trong jit**: `print` chạy trong truy vết, không phải thực thi. Sử dụng `jax.debug.print("{}", x)`.

3. **if/for Python bên trong jit trên các giá trị được truy vết**: Sử dụng `jax.lax.cond`, `jax.lax.switch`, `jax.lax.scan`, `jax.lax.fori_loop`.

4. **Quên `.block_until_ready()`**: JAX sử dụng điều phối bất đồng bộ. Khi đo hiệu năng, gọi `.block_until_ready()` để chờ hoàn tất thực sự.

5. **Dùng lại các khóa PRNG**: Hai phép toán với cùng khóa tạo ra cùng các giá trị "ngẫu nhiên". Luôn tách.

6. **Trạng thái toàn cục trong các hàm được jit**: Các biến toàn cục được thu giữ khi truy vết. Các thay đổi sau truy vết không được nhìn thấy. Truyền mọi thứ dưới dạng đối số.

## Decision Checklist

1. Hàm có được gọi hơn một lần không? Thêm `@jax.jit`.
2. Nó có cần các gradient không? Bao bọc bằng `jax.grad` hoặc `jax.value_and_grad`.
3. Nó xử lý một ví dụ nhưng bạn có một batch? Bao bọc bằng `jax.vmap`.
4. Bạn có nhiều thiết bị không? Bao bọc bằng `jax.pmap`.
5. Nó có sử dụng tính ngẫu nhiên không? Truyền các khóa PRNG xuyên suốt một cách tường minh.
6. Nó có luồng điều khiển Python trên các giá trị mảng không? Thay bằng các thành phần nguyên thủy `jax.lax`.

## When to Use JAX

Sử dụng JAX khi:
- Bạn cần các gradient theo từng ví dụ (quyền riêng tư vi phân, thông tin Fisher)
- Bạn đang huấn luyện trên TPU (JAX là framework gốc)
- Bạn cần các đạo hàm bậc cao (Hessian, Jacobian)
- Bạn muốn biên dịch toàn bộ bước huấn luyện thành một kernel duy nhất
- Nhóm của bạn ở Google DeepMind hoặc Anthropic

Sử dụng PyTorch khi:
- Bạn muốn hệ sinh thái lớn nhất (HuggingFace, torchvision, Lightning)
- Bạn ưu tiên dễ gỡ lỗi hơn tốc độ thuần túy
- Bạn đang triển khai lên các GPU NVIDIA với TorchServe/Triton
- Bạn đang tuyển dụng (có nhiều nhà phát triển PyTorch hơn)
- Bạn muốn lặp nhanh trên các kiến trúc mới
