# Vision Encoder Patches

> Một mô hình thị giác đọc pixel cần một tokenizer cho pixel. Embedding patch là tokenizer đó. Cắt ảnh thành một lưới ô vuông, làm phẳng mỗi ô, chiếu nó qua một lớp tuyến tính, rồi thêm một tín hiệu vị trí 2D để transformer biết mỗi ô đã nằm ở đâu trong ảnh gốc.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30-37 (Track B foundations)
**Time:** ~90 minutes

## Learning Objectives

- Phân tách một ảnh thành một chuỗi embedding patch có độ dài cố định.
- Triển khai một phép chiếu patch dựa trên `Conv2d` khớp với toán unfold-rồi-tuyến-tính.
- Xây dựng một embedding vị trí hình sin 2D tất định để thứ tự token mã hóa vị trí không gian.
- Xác minh số patch, hình dạng embedding, và tương đương `Conv2d`/unfold trên một fixture tổng hợp.

## The Problem

Một transformer ăn một chuỗi vector. Một ảnh là một lưới 3 kênh. Đọc mỗi pixel như một token làm nổ độ dài chuỗi: một ảnh RGB 224x224 là 150,528 token, điều một transformer 12 lớp không đủ khả năng đáp ứng trong attention. Đọc ảnh như một vector phẳng khổng lồ vứt bỏ tính cục bộ, điều lớp attention không thể phục hồi. Công việc của phần đầu bộ mã hóa là nén lưới pixel thành vài trăm token mà mỗi token tóm tắt một vùng vuông.

Embedding patch giải quyết điều này bằng một phép chiếu tuyến tính. Một ảnh 224x224 được cắt thành các patch 16x16 tạo một lưới 14x14 gồm 196 patch. Mỗi patch được làm phẳng từ `(3, 16, 16) = 768` giá trị pixel thành một vector, rồi một lớp tuyến tính ánh xạ nó tới chiều ẩn của mô hình. Transformer thấy 196 token có chiều `hidden` (thường 768) cùng một token CLS. Đó là một chuỗi mà phần còn lại của mạng có thể nhai.

## The Concept

```mermaid
flowchart LR
  Image[224x224x3 image] --> Cut[cut into 16x16 patches]
  Cut --> Grid[14x14 grid of patches]
  Grid --> Flatten[flatten each patch]
  Flatten --> Proj[linear projection]
  Proj --> Tokens[196 tokens of dim hidden]
  Tokens --> Pos[add 2D sinusoidal position]
  Pos --> Out[final token sequence]
```

### Why patches, not pixels

Attention bậc hai theo độ dài chuỗi. Một chuỗi 196 token tốn `196 * 196 = 38,416` điểm attention mỗi đầu mỗi lớp; một chuỗi 150,528 token tốn `150,528 * 150,528 = 22.6 billion`. Các patch mang lại mức giảm 590,000x tính toán attention, và một vùng 16x16 duy nhất mang đủ tín hiệu cho các tác vụ thị giác cấp cao. Chi phí là mất chi tiết không gian tinh bên trong một patch, đó là lý do các ngăn xếp đa phương thức hạ nguồn thường chạy một nhánh độ phân giải cao thứ hai khi định vị tinh quan trọng.

### Why a linear projection is enough

Mỗi patch được coi là một vector độc lập. Phép chiếu học một cơ sở: các bộ phát hiện cạnh, bộ lọc màu, kết cấu đơn giản. Một lớp tuyến tính duy nhất nhỏ (`768 * 768 = 589,824` tham số cho ViT-Base) và huấn luyện nhanh. Các phần đầu tích chập sâu hơn tồn tại (ViT "lai"), nhưng một phép chiếu tuyến tính phẳng là tiêu chuẩn, và hầu hết bộ mã hóa trọng số mở hiện đại cung cấp chính xác hình thức này.

### The `Conv2d` trick

Một `Conv2d(in_channels=3, out_channels=hidden, kernel_size=patch_size, stride=patch_size)` không đệm cho cùng kết quả số như unfold-rồi-tuyến-tính, vì mỗi vị trí đầu ra tính tích vô hướng các pixel patch với một bộ lọc. Tích chập là phép chiếu patch, và hầu hết cơ sở mã sản xuất cung cấp nó như vậy vì nó nhanh hơn trên GPU và dùng ít hơn một phép đổi hình dạng.

### Position embeddings

Các token không mang thứ tự khi ra khỏi phép chiếu. Embedding hình sin 2D cho mỗi token một tín hiệu cố định mã hóa vị trí `(row, col)` của nó. Nửa chiều embedding mã hóa vị trí hàng bằng sin/cos ở nhiều tần số; nửa còn lại mã hóa vị trí cột. Mã hóa tất định để bạn có thể đổi độ phân giải mà không huấn luyện lại, và nó nội suy gọn gàng tới các lưới mô hình chưa từng thấy lúc huấn luyện.

| Thành phần | Hình dạng | Tham số |
|-----------|-------|------------|
| Phép chiếu patch (`Conv2d`) | `(hidden, 3, patch, patch)` | `3 * P * P * hidden + hidden` |
| Embedding vị trí (cố định) | `(num_patches, hidden)` | 0 (được tính, không được học) |
| Token CLS (được học) | `(1, hidden)` | `hidden` |

Với ViT-Base/16 ở độ phân giải 224: 590,592 tham số trong phép chiếu, 768 trong token CLS, và không cho vị trí hình sin. Bài tiếp theo (59) xếp một transformer 12 lớp lên phần đầu này.

### Equivalence as a sanity check

Bước patch có hai cách viết: một phép chiếu `Conv2d` và một unfold-rồi-tuyến-tính tường minh. Chúng phải tạo cùng đầu ra cho cùng trọng số. Nếu không, toán unfold sai, và phần còn lại của bộ mã hóa được xây trên cát. Các kiểm thử trong bài này thực thi sự tương đương đó.

```figure
ch-patch-tokenizer
```

## Build It

`code/main.py` triển khai:

- `PatchEmbed`, một `nn.Module` bọc `Conv2d` cho phép chiếu patch.
- `sinusoidal_2d(grid_h, grid_w, dim)`, một hàm phi trạng thái xây dựng bảng vị trí 2D.
- `VisionFrontEnd`, kết hợp embedding patch, thêm CLS vào đầu, và cộng vị trí thành một lượt tiến.
- Một hàm hỗ trợ `synthesize_image(seed)` xây dựng một fixture 224x224x3 tất định từ `numpy.random`.
- Một demo chạy một ảnh fixture qua phần đầu và in hình dạng đầu ra, chuẩn token CLS, và một hàng của embedding vị trí.

Chạy nó:

```bash
python3 code/main.py
```

Đầu ra: fixture 224x224 được phân tách token thành một chuỗi có hình dạng `(1, 197, 768)`. Token đầu là CLS; 196 token tiếp theo là các token patch. Các chuẩn embedding vị trí đồng đều trong một hàng, là dấu hiệu hình sin.

## Use It

Cùng phần đầu patch xuất hiện trong mọi mô hình thị giác-ngôn ngữ hiện đại: CLIP ViT-L/14, SigLIP, DINOv2, họ Qwen-VL, và ngăn xếp InternVL đều bắt đầu từ một phép chiếu patch `Conv2d` cùng một tín hiệu vị trí. Khác biệt giữa các họ nằm ở hạ nguồn (gộp CLS so với không CLS, token thanh ghi, các kích thước patch khác nhau 14 so với 16, độ phân giải động qua các vị trí nội suy). Phần đầu trong bài này là nền tảng mà mọi mô hình đó đứng trên.

## Tests

`code/test_main.py` bao phủ:

- số patch khớp `(image_size / patch_size) ** 2`
- hình dạng đầu ra khớp `(batch, num_patches + 1, hidden)`
- phép chiếu `Conv2d` bằng unfold-rồi-tuyến-tính thủ công trên một fixture nhỏ
- bảng vị trí hình sin tất định giữa các lệnh gọi
- token CLS broadcast dọc chiều lô mà không rò rỉ

Chạy chúng:

```bash
python3 -m unittest code/test_main.py
```

## Exercises

1. Thay vị trí hình sin bằng một `nn.Parameter` được học và so sánh mất mát epoch đầu trên một tác vụ phân loại tổng hợp tí hon. Các vị trí được học thắng ở độ phân giải cố định; hình sin thắng khi bạn thay đổi độ phân giải sau huấn luyện.

2. Đổi `Conv2d` thành một `nn.Unfold` tường minh cùng `nn.Linear` và khẳng định các đầu ra khớp trong dung sai float. Cùng toán, hai cách viết.

3. Thêm hỗ trợ các kích thước patch không vuông (ví dụ 32x16 cho các đầu vào tỷ lệ rộng) và xác minh bảng vị trí xử lý các lưới không vuông.

4. Đo hiệu năng bước patch ở các kích thước lô 1, 8, 64. Phép chiếu patch hiếm khi là nút thắt; các lớp attention hạ nguồn chiếm ưu thế.

5. Huấn luyện phần đầu như một bộ trích xuất đặc trưng đóng băng trên một tập dữ liệu hình dạng tổng hợp 4 lớp (tròn, vuông, tam giác, ngôi sao). Đầu ra token CLS nên phân tách tuyến tính.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------------|
| Patch (Mảnh ảnh) | Một vùng con vuông của ảnh, thường 14x14 hoặc 16x16 |
| Patch embedding (Embedding patch) | Phép chiếu tuyến tính của một patch được làm phẳng sang chiều ẩn |
| Sequence length (Độ dài chuỗi) | Số token sau phân tách patch, thường cộng CLS |
| Sinusoidal position (Vị trí hình sin) | Tín hiệu sin/cos cố định mã hóa các tọa độ lưới 2D |
| CLS token (Token CLS) | Vector được học thêm vào đầu chuỗi làm đầu gộp |

## Further Reading

- An Image is Worth 16x16 Words (ViT, 2021) cho cách nhìn embedding patch gốc.
- Attention Is All You Need (2017) cho công thức vị trí hình sin được điều chỉnh ở đây sang 2D.
- Bài báo DINOv2 cho các token thanh ghi, một phần mở rộng bạn có thể thêm như bài tập 6.
