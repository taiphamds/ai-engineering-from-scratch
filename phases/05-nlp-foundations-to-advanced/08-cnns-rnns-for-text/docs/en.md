# CNNs and RNNs for Text

> Tích chập học n-gram. Truy hồi ghi nhớ. Cả hai bị attention thay thế. Cả hai vẫn quan trọng trên phần cứng hạn chế.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 11 (PyTorch Intro), Phase 5 · 03 (Word Embeddings), Phase 4 · 02 (Convolutions from Scratch)
**Time:** ~75 minutes

## The Problem

TF-IDF và Word2Vec tạo ra các vector phẳng bỏ qua thứ tự từ. Một bộ phân loại được xây dựng trên chúng không thể phân biệt `dog bites man` với `man bites dog`. Thứ tự từ đôi khi mang tín hiệu.

Hai họ kiến trúc lấp khoảng trống đó trước khi transformer xuất hiện.

**Các mạng tích chập cho văn bản (TextCNN).** Áp dụng tích chập 1D trên các chuỗi embedding từ. Một bộ lọc có độ rộng 3 là một bộ phát hiện trigram có thể học: nó trải trên ba từ và xuất một điểm số. Xếp chồng các độ rộng khác nhau (2, 3, 4, 5) để phát hiện các mẫu đa tỷ lệ. Max-pool thành một biểu diễn kích thước cố định. Phẳng, song song, nhanh.

**Các mạng truy hồi (RNN, LSTM, GRU).** Xử lý từng token một, duy trì một trạng thái ẩn mang thông tin về phía trước. Tuần tự, mang bộ nhớ, độ dài đầu vào linh hoạt. Thống trị mô hình hóa chuỗi từ 2014 đến 2017, rồi attention xuất hiện.

Bài học này xây dựng cả hai, rồi nêu tên lỗi thúc đẩy attention.

## The Concept

**TextCNN** (Kim, 2014). Các token được embedding. Một tích chập 1D độ rộng `k` trượt một bộ lọc trên các `k`-gram embedding liên tiếp, tạo một bản đồ đặc trưng. Global max-pooling trên bản đồ đó chọn kích hoạt mạnh nhất. Nối các đầu ra max-pooling từ vài độ rộng bộ lọc. Đưa vào một head phân loại.

Vì sao nó hoạt động. Một bộ lọc là một n-gram có thể học. Max-pooling bất biến vị trí, nên "không tốt" kích hoạt cùng một đặc trưng ở đầu hoặc giữa một đánh giá. Ba độ rộng bộ lọc với mỗi độ rộng 100 bộ lọc cho bạn 300 bộ phát hiện n-gram được học. Huấn luyện song song; không có phụ thuộc tuần tự.

**RNN.** Ở mỗi bước thời gian `t`, trạng thái ẩn `h_t = f(W * x_t + U * h_{t-1} + b)`. Dùng chung `W`, `U`, `b` qua thời gian. Trạng thái ẩn tại thời gian `T` là một bản tóm tắt toàn bộ tiền tố. Đối với phân loại, pooling trên `h_1 ... h_T` (cực đại, trung bình hoặc cuối).

Các RNN thuần chịu tiêu biến gradient. **LSTM** thêm các cổng quyết định quên gì, lưu gì và xuất gì, ổn định gradient qua các chuỗi dài. **GRU** đơn giản hóa LSTM thành hai cổng; hoạt động tương tự với ít tham số hơn.

**Các RNN hai chiều** chạy một RNN xuôi và một RNN khác ngược, nối các trạng thái ẩn. Biểu diễn của mỗi token thấy cả ngữ cảnh trái và phải. Thiết yếu cho các tác vụ gán nhãn.

```figure
rnn-unroll
```

## Build It

### Step 1: TextCNN in PyTorch

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, n_classes, filter_widths=(2, 3, 4), n_filters=64, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, n_filters, kernel_size=k)
            for k in filter_widths
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids).transpose(1, 2)
        pooled = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled.append(p)
        h = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(h))
```

`transpose(1, 2)` đổi hình dạng `[batch, seq_len, embed_dim]` thành `[batch, embed_dim, seq_len]` vì `nn.Conv1d` coi trục giữa là các kênh. Đầu ra được pooling có kích thước cố định bất kể độ dài đầu vào.

### Step 2: LSTM classifier

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_classes, bidirectional=True, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=bidirectional)
        factor = 2 if bidirectional else 1
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * factor, n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids)
        out, _ = self.lstm(x)
        pooled = out.max(dim=1).values
        return self.fc(self.dropout(pooled))
```

Max-pool trên chuỗi, không phải pooling trạng thái cuối. Với phân loại, max-pooling thường thắng việc lấy trạng thái ẩn cuối vì thông tin ở cuối một chuỗi dài có xu hướng chi phối trạng thái cuối.

### Step 3: the vanishing gradient demo (intuition)

Một RNN thuần không có cổng không thể học các phụ thuộc xa. Xét một tác vụ đồ chơi: dự đoán token `A` có xuất hiện ở bất kỳ đâu trong một chuỗi không. Nếu `A` ở vị trí 1 và chuỗi dài 100 token, gradient từ loss phải truyền ngược qua 99 phép nhân của trọng số truy hồi. Nếu trọng số nhỏ hơn 1, gradient tiêu biến. Nếu lớn hơn 1, nó bùng nổ.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTM sửa điều này bằng một **trạng thái ô** chạy qua mạng với chỉ các tương tác cộng (cổng quên co giãn nó bằng phép nhân, nhưng gradient vẫn truyền dọc "đường cao tốc"). GRU làm điều tương tự với ít tham số hơn. Cả hai cho bạn huấn luyện ổn định qua các chuỗi 100+ bước.

### Step 4: why this still was not enough

Ba vấn đề vẫn tồn tại ngay cả với LSTM.

1. **Nút thắt tuần tự.** Huấn luyện một RNN trên một chuỗi dài 1000 đòi hỏi 1000 bước xuôi/ngược nối tiếp. Không thể song song hóa qua thời gian.
2. **Vector ngữ cảnh kích thước cố định trong các thiết lập encoder-decoder.** Decoder chỉ thấy trạng thái ẩn cuối của encoder, được nén trên toàn bộ đầu vào. Các đầu vào dài mất chi tiết. Bài 09 đề cập trực tiếp điều này.
3. **Trần accuracy phụ thuộc xa.** LSTM vượt RNN thuần nhưng vẫn chật vật truyền thông tin cụ thể qua 200+ bước.

Attention giải quyết cả ba. Transformer bỏ hoàn toàn truy hồi. Bài 10 là bước ngoặt.

## Use It

`nn.LSTM`, `nn.GRU` và `nn.Conv1d` của PyTorch sẵn sàng cho production. Mã huấn luyện là tiêu chuẩn.

Hugging Face cung cấp các embedding được tiền huấn luyện mà bạn cắm vào làm tầng đầu vào:

```python
from transformers import AutoModel

encoder = AutoModel.from_pretrained("bert-base-uncased")
for param in encoder.parameters():
    param.requires_grad = False


class BertCNN(nn.Module):
    def __init__(self, n_classes, filter_widths=(2, 3, 4), n_filters=64):
        super().__init__()
        self.encoder = encoder
        self.convs = nn.ModuleList([nn.Conv1d(768, n_filters, kernel_size=k) for k in filter_widths])
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, input_ids, attention_mask):
        with torch.no_grad():
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        x = out.transpose(1, 2)
        pooled = [F.max_pool1d(F.relu(conv(x)), kernel_size=conv(x).size(2)).squeeze(2) for conv in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
```

Danh sách kiểm tra dùng khi phù hợp với ràng buộc.

- **Suy luận biên / trên thiết bị.** TextCNN với embedding GloVe nhỏ hơn một transformer 10-100 lần. Nếu đích triển khai là điện thoại, đây là ngăn xếp.
- **Phân loại luồng / trực tuyến.** RNN xử lý từng token một; transformer cần toàn bộ chuỗi. Với văn bản đến theo thời gian thực, LSTM vẫn thắng.
- **Các mô hình tí hon làm baseline.** Lặp nhanh trên một tác vụ mới. Huấn luyện một TextCNN trong 5 phút trên CPU.
- **Gán nhãn chuỗi với dữ liệu hạn chế.** BiLSTM-CRF (bài 06) vẫn là một kiến trúc NER cấp production cho 1k-10k câu có nhãn.

Mọi thứ khác dùng transformer.

## Ship It

Lưu thành `outputs/prompt-text-encoder-picker.md`:

```markdown
---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Given constraints (task, data volume, latency budget, deploy target, compute budget), output:

1. Encoder architecture: TextCNN, BiLSTM, BiLSTM-CRF, transformer fine-tune, or "use a pretrained transformer as a frozen encoder + small head".
2. Embedding input: random init, GloVe / fastText frozen, or contextualized transformer embeddings.
3. Training recipe in 5 lines: optimizer, learning rate, batch size, epochs, regularization.
4. One monitoring signal. For RNN/CNN models: attention mechanism absence means they miss long-range deps; check per-length accuracy. For transformers: fine-tuning collapse if LR too high; check train loss.

Refuse to recommend fine-tuning a transformer when data is under ~500 labeled examples without showing that a TextCNN / BiLSTM baseline has plateaued. Flag edge deployment as needing architecture-before-everything.
```

## Exercises

1. **Dễ.** Huấn luyện một TextCNN trên một tập dữ liệu đồ chơi 3 lớp (bạn tự tạo dữ liệu). Xác minh rằng các độ rộng bộ lọc (2, 3, 4) vượt một độ rộng duy nhất (3) về F1 trung bình.
2. **Trung bình.** Triển khai pooling cực đại, trung bình và trạng thái cuối cho bộ phân loại LSTM. So sánh trên một tập dữ liệu nhỏ; ghi lại cách pooling nào thắng và đưa giả thuyết tại sao.
3. **Khó.** Xây dựng một bộ gán nhãn NER BiLSTM-CRF (kết hợp bài 06 và bài này). Huấn luyện trên CoNLL-2003. So sánh với baseline chỉ CRF từ bài 06 và với một BERT fine-tune. Báo cáo thời gian huấn luyện, bộ nhớ và F1.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| TextCNN | CNN cho văn bản | Chồng tích chập 1D trên các embedding từ với global max-pool. Kim (2014). |
| RNN | Mạng truy hồi | Trạng thái ẩn được cập nhật ở mỗi bước thời gian: `h_t = f(W x_t + U h_{t-1})`. |
| LSTM | RNN có cổng | Thêm các cổng đầu vào / quên / đầu ra + một trạng thái ô. Huấn luyện ổn định qua các chuỗi dài. |
| GRU | LSTM đơn giản hơn | Hai cổng thay vì ba. Accuracy tương tự, ít tham số hơn. |
| Bidirectional (Hai chiều) | Cả hai hướng | RNN xuôi + ngược được nối lại. Mỗi token thấy cả hai phía ngữ cảnh của nó. |
| Vanishing gradient (Tiêu biến gradient) | Tín hiệu huấn luyện chết | Nhân lặp lại với các trọng số <1 trong RNN thuần khiến gradient của các bước đầu gần như bằng không. |

## Further Reading

- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) — bài báo TextCNN. Tám trang. Dễ đọc.
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) — bài báo LSTM. Rõ ràng bất ngờ.
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — các sơ đồ khiến LSTM trở nên dễ tiếp cận với mọi người.
