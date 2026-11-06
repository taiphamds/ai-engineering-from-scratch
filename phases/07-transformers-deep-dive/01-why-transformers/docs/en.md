# Why Transformers — The Problems with RNNs

> RNN xử lý từng token một. Transformer xử lý mọi token cùng lúc. Đặt cược kiến trúc duy nhất đó đã thay đổi mọi đường cong mở rộng quy mô trong deep learning sau năm 2017.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 3 (Deep Learning Core), Phase 5 · 09 (Sequence-to-Sequence), Phase 5 · 10 (Attention Mechanism)
**Time:** ~45 minutes

## The Problem

Trước năm 2017, mọi mô hình chuỗi tiên tiến nhất trên hành tinh — ngôn ngữ, dịch, tiếng nói — đều là một mạng nơ-ron truy hồi. LSTM và GRU thắng các benchmark dịch tương đương ImageNet suốt nửa thập kỷ. Chúng là công cụ duy nhất mọi người có.

Chúng có ba điểm yếu chí mạng. Tính toán tuần tự nghĩa là bạn không thể song song hóa dọc trục thời gian: token `t+1` cần trạng thái ẩn từ token `t`. Một chuỗi 1,024 token nghĩa là 1,024 bước nối tiếp trên một GPU có thể làm 1,000,000 phép toán dấu phẩy động mỗi chu kỳ. Thời gian huấn luyện thực tăng tuyến tính theo độ dài chuỗi trên phần cứng được thiết kế cho tính song song.

Tiêu biến gradient nghĩa là thông tin cách 50 token về trước đã bị nén qua 50 phép phi tuyến. Các đơn vị truy hồi có cổng (LSTM, GRU) làm dịu sự nghiền ép nhưng không bao giờ loại bỏ nó. Các phụ thuộc xa — "cuốn sách tôi đọc mùa hè năm ngoái trên máy bay đến Kyoto là…" — thường xuyên thất bại.

Các trạng thái ẩn độ rộng cố định nghĩa là encoder ép toàn bộ chuỗi nguồn vào một vector duy nhất trước khi decoder thấy bất kỳ thứ gì. Không quan trọng nguồn là 5 token hay 500; nút thắt có cùng hình dạng.

Bài báo năm 2017 "Attention Is All You Need" đề xuất một điều triệt để: bỏ hoàn toàn truy hồi. Để mọi vị trí chú ý đến mọi vị trí khác song song. Huấn luyện trong một phép nhân ma trận lớn thay vì 1,024 phép tuần tự.

Kết quả thống trị mọi phương thức đến năm 2026. Ngôn ngữ (GPT-5, Claude 4, Llama 4), thị giác (ViT, DINOv2, SAM 3), âm thanh (Whisper), sinh học (AlphaFold 3), robot học (RT-2). Cùng khối, các đầu vào khác nhau.

## The Concept

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Truy hồi như một nút thắt.** Một RNN tính $h_t = f(h_{t-1}, x_t)$. Mỗi bước phụ thuộc bước trước. Bạn không thể tính $h_5$ trước $h_4$. Trên các GPU hiện đại có 10,000+ lõi song song, điều này lãng phí 99% silicon trên một chuỗi dài.

**Attention như một phép broadcast.** Self-attention tính `output_i = sum_j(a_ij * v_j)` cho mọi cặp $(i, j)$ đồng thời. Toàn bộ ma trận attention N×N được điền trong một phép nhân ma trận theo batch. Không bước nào phụ thuộc bước khác. GPU yêu thích điều đó.

**Mức tăng tốc không phải một hằng số.** Nó là sự khác biệt giữa độ sâu nối tiếp $O(N)$ và độ sâu nối tiếp $O(1)$. Trong thực tế, transformer huấn luyện nhanh hơn 5–10× mỗi epoch trên phần cứng tương ứng tại N=512, và khoảng cách nới rộng theo độ dài chuỗi cho đến khi bạn chạm bức tường bộ nhớ $O(N^2)$ của attention (mà Flash Attention sau đó sửa — xem Bài 12).

**Transformer tốn gì.** Bộ nhớ attention tăng theo $O(N^2)$. Với ngữ cảnh 2K, ổn. Với ngữ cảnh 128K, bạn cần các cửa sổ trượt, ngoại suy RoPE, chia ô Flash Attention hoặc các biến thể attention tuyến tính. Truy hồi là $O(N)$ ở cả thời gian và bộ nhớ; transformer đánh đổi thời gian lấy bộ nhớ rồi giành lại thời gian qua tính song song.

**Sự chuyển dịch thiên kiến quy nạp.** RNN giả định tính cục bộ và tính gần đây. Transformer không giả định gì — mọi cặp đều là ứng viên cho attention. Đó là lý do transformer cần nhiều dữ liệu hơn để huấn luyện tốt nhưng mở rộng xa hơn một khi có nó. Chinchilla (2022) hình thức hóa điều này: cho đủ token, một transformer luôn thắng một RNN có cùng số tham số.

```figure
rnn-vs-parallel
```

## Build It

Không có mạng nơ-ron ở đây — chúng ta mô phỏng nút thắt cốt lõi bằng số để bạn cảm nhận khoảng cách trên máy tính xách tay.

### Step 1: measure serial depth

Xem `code/main.py`. Chúng ta xây dựng hai hàm. Một hàm mã hóa một chuỗi thành một chuỗi phép cộng (nối tiếp, như RNN). Một hàm mã hóa nó thành một phép rút gọn song song (broadcast, như attention). Cùng phần toán, đồ thị phụ thuộc khác nhau.

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

Chúng ta đo thời gian cả hai trên các chuỗi đến 100,000 phần tử. Phiên bản RNN là $O(N)$ và một pipeline CPU duy nhất. Ngay cả trong Python thuần, phép rút gọn kiểu attention thắng nó ở độ dài ≥ 1,000 vì `sum()` của Python được triển khai bằng C và lặp không có chi phí phụ trình thông dịch mỗi bước.

### Step 2: count theoretical operations

Cả hai thuật toán thực hiện N phép cộng. Khác biệt là *độ sâu phụ thuộc*: bao nhiêu phép toán phải xảy ra tuần tự trước khi phép tiếp theo có thể bắt đầu. Độ sâu RNN = N. Độ sâu attention = log(N) với rút gọn dạng cây, hoặc 1 với một phép quét song song. Độ sâu, không phải số phép toán, quyết định thời gian GPU.

### Step 3: empirical scaling on long sequences

Chúng ta in một bảng thời gian làm khoảng cách $O(N)$ hiện rõ. Trên một máy tính xách tay Mac năm 2026, các chuỗi dưới 1,000 phần tử quá nhanh để đo. Các chuỗi 100,000 cho thấy một phép quét tuyến tính rõ ràng. Mở rộng điều đó đến một transformer 16,384 token với một LSTM tương đương 12 tầng và bạn thấy vì sao thời gian huấn luyện thực là một trở ngại năm 2016.

## Use It

Khi nào vẫn chọn RNN năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Suy luận luồng, từng token một, bộ nhớ hằng số | RNN hoặc mô hình không gian trạng thái (Mamba, RWKV) |
| Các chuỗi rất dài (>1M token) nơi bộ nhớ attention bùng nổ | Attention tuyến tính, Mamba 2, Hyena |
| Thiết bị biên không có bộ tăng tốc nhân ma trận | RNN tách theo chiều sâu vẫn thắng về FLOP/watt |
| Bất kỳ thứ gì khác (huấn luyện, suy luận theo batch, ngữ cảnh đến 128K) | Transformer |

Các mô hình không gian trạng thái (SSM) như Mamba về cơ bản là RNN với tham số hóa có cấu trúc cho chúng điểm tốt nhất của cả hai: bộ nhớ quét $O(N)$, huấn luyện song song qua quét chọn lọc. Chúng khôi phục 90% chất lượng transformer với khả năng mở rộng ngữ cảnh dài tốt hơn. Năm 2026 hầu hết các phòng thí nghiệm tiên phong huấn luyện các mô hình lai SSM+transformer (ví dụ Jamba, Samba) — truy hồi không chết, nó là một thành phần.

## Ship It

Xem `outputs/skill-architecture-picker.md`. Skill chọn một kiến trúc cho một bài toán chuỗi mới với các ràng buộc độ dài, thông lượng và ngân sách huấn luyện. Nó nên luôn từ chối khuyến nghị một RNN thuần cho các lượt huấn luyện trên 1B token mà không nêu đánh đổi.

## Exercises

1. **Dễ.** Lấy `rnn_style` từ `code/main.py` và thay trạng thái ẩn vô hướng bằng một vector dài 64 các trạng thái ẩn. Đo lại. Chi phí phụ nối tiếp tăng bao nhiêu theo số chiều trạng thái ẩn?
2. **Trung bình.** Triển khai một tổng tiền tố song song (quét Hillis-Steele) bằng Python thuần. Xác minh nó tạo cùng đầu ra số như một phép quét nối tiếp ở độ dài 1024. Đếm độ sâu.
3. **Khó.** Chuyển phép rút gọn kiểu attention sang PyTorch trên GPU. Đo thời gian cả hai khi bạn quét độ dài chuỗi từ 64 đến 65,536. Vẽ và giải thích hình dạng đường cong.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Recurrence (Truy hồi) | "RNN là tuần tự" | Tính toán mà bước `t` phụ thuộc bước `t-1`, buộc thực thi nối tiếp dọc trục thời gian. |
| Serial depth (Độ sâu nối tiếp) | "Đồ thị sâu bao nhiêu" | Chuỗi phép toán phụ thuộc dài nhất; chặn thời gian thực ngay cả trên phần cứng vô hạn. |
| Attention | "Để các token nhìn nhau" | Tổng có trọng số $\sum_j a_{ij} v_j$ trong đó $a_{ij}$ đến từ một điểm tương đồng giữa các vị trí $i$ và $j$. |
| Context window (Cửa sổ ngữ cảnh) | "Mô hình thấy bao nhiêu" | Số vị trí một tầng attention có thể nhận làm đầu vào; chi phí bộ nhớ bậc hai tăng ở đây. |
| Inductive bias (Thiên kiến quy nạp) | "Các giả định được gắn vào kiến trúc" | Tiên nghiệm về hình dạng dữ liệu; CNN giả định bất biến tịnh tiến, RNN giả định tính gần đây. |
| State-space model (Mô hình không gian trạng thái) | "RNN có đại số phía sau" | Truy hồi được tham số hóa để huấn luyện song song qua các ma trận không gian trạng thái có cấu trúc. |
| Quadratic bottleneck (Nút thắt bậc hai) | "Vì sao ngữ cảnh tốn nhiều đến vậy" | Bộ nhớ attention = $O(N^2)$ theo độ dài chuỗi; Flash Attention che các hằng số, không phải quy luật tăng. |

## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) — bài báo giết truy hồi trong NLP dòng chính.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — nơi attention ra đời, được gắn vào một RNN.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) — bài báo LSTM gốc, để ghi nhận.
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) — câu trả lời truy hồi hiện đại cho transformer.
