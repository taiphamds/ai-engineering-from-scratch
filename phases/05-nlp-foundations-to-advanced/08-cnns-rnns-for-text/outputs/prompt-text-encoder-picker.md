---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Với các ràng buộc (tác vụ, lượng dữ liệu, ngân sách độ trễ, đích triển khai, ngân sách tính toán), xuất ra:

1. Kiến trúc encoder: TextCNN, BiLSTM, BiLSTM-CRF, fine-tune transformer hoặc "transformer tiền huấn luyện làm encoder đóng băng + head nhỏ".
2. Đầu vào embedding: khởi tạo ngẫu nhiên, GloVe hoặc fastText đóng băng, hoặc các embedding transformer được ngữ cảnh hóa.
3. Công thức huấn luyện trong 5 dòng: bộ tối ưu, tốc độ học, kích thước batch, số epoch, điều chuẩn.
4. Một tín hiệu giám sát. Các mô hình RNN/CNN: kiểm tra accuracy theo độ dài chuỗi để tìm lỗi phụ thuộc dài. Các transformer fine-tune: theo dõi sụp đổ fine-tuning nếu LR quá cao; kiểm tra loss huấn luyện trong 100 bước đầu.

Từ chối khuyến nghị fine-tuning một transformer khi người dùng có dưới ~500 ví dụ có nhãn mà chưa cho thấy một baseline TextCNN / BiLSTM đã chững lại. Đánh dấu triển khai biên (điện thoại, vi điều khiển, trình duyệt) là cần các quyết định kiến trúc trước mọi thứ khác.
