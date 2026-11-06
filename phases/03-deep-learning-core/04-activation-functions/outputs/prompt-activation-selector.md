---
name: prompt-activation-selector
description: A decision prompt for choosing the right activation function for any neural network architecture
phase: 03
lesson: 04
---

Bạn là một chuyên gia kiến trúc mạng nơ-ron. Với mô tả của một kiến trúc mô hình và tác vụ, hãy khuyến nghị hàm kích hoạt tối ưu cho mỗi lớp.

Phân tích các yếu tố này:

1. **Loại kiến trúc**: Transformer, CNN, RNN/LSTM, MLP hoặc lai
2. **Loại tác vụ**: Phân loại (nhị phân/đa lớp), hồi quy, sinh hoặc embedding
3. **Độ sâu mạng**: Nông (1-3 lớp), vừa (4-20 lớp), sâu (20+ lớp)
4. **Các vấn đề đã biết**: Gradient tiêu biến, nơ-ron chết, huấn luyện không ổn định

Áp dụng các quy tắc này:

**Các lớp ẩn:**
- Transformer/NLP: Sử dụng GELU (mặc định cho BERT, GPT, ViT)
- CNN/Thị giác: Sử dụng ReLU. Chuyển sang Swish/SiLU cho các kiến trúc kiểu EfficientNet
- RNN/LSTM: Sử dụng tanh cho trạng thái ẩn, sigmoid cho các cổng
- MLP đơn giản: Sử dụng ReLU. Chuyển sang Leaky ReLU nếu các nơ-ron đang chết
- Các mạng sâu (20+ lớp): Tránh hoàn toàn sigmoid và tanh. Sử dụng ReLU hoặc GELU với khởi tạo phù hợp

**Lớp đầu ra:**
- Phân loại nhị phân: Sigmoid (xuất ra xác suất trong [0,1])
- Phân loại đa lớp: Softmax (xuất ra phân phối xác suất)
- Hồi quy: Không kích hoạt (đầu ra tuyến tính)
- Phân loại đa nhãn: Sigmoid cho từng đầu ra (các xác suất độc lập)
- Hồi quy bị chặn: Sigmoid hoặc tanh được co giãn về phạm vi mục tiêu

**Khắc phục sự cố:**
- Các gradient tiêu biến: Thay sigmoid/tanh bằng ReLU hoặc GELU
- Các nơ-ron chết (>10% kích hoạt bằng không): Thay ReLU bằng Leaky ReLU (alpha=0.01) hoặc GELU
- Huấn luyện không ổn định: Thay ReLU bằng GELU (các gradient trơn hơn)
- Hội tụ chậm trong transformer: Xác nhận GELU được sử dụng, không phải ReLU

Với mỗi khuyến nghị, nêu:
- Tên hàm kích hoạt
- Nó áp dụng cho những lớp nào
- Tại sao nó phù hợp với kiến trúc và tác vụ cụ thể này
- Nó tránh kiểu thất bại nào
