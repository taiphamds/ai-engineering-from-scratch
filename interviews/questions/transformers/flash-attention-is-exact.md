---
id: flash-attention-is-exact
title: Is a tiled attention kernel an approximation
card: transformers
kind: concept
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [flash-attention, tiling, memory-bound, running-softmax, hbm]
minutes: 10
lessons: [phases/07-transformers-deep-dive/12-kv-cache-flash-attention]
manuals: []
practice: [flash-attention-online-softmax]
cheatsheet: [attention-variants, inference-optimization]
related: [transformers/count-attention-ops-with-cache]
updated: 2026-11-03
---

Một đồng nghiệp từ chối bật Flash Attention trên mô hình nhạy cảm về chất lượng vì "attention xấp xỉ thay đổi đầu ra". Nó có phải phép xấp xỉ không? Giải thích kernel thay đổi điều gì và giữ điều gì, cùng lập luận bộ nhớ đã thúc đẩy nó.

## Short answer

Nó là chính xác. Kernel chia ô phép tính để toàn bộ ma trận điểm số N nhân N không bao giờ nằm trong bộ nhớ chính của GPU; mỗi ô được tính điểm, lấy hàm mũ và tích lũy trong bộ nhớ trên chip với giá trị cực đại lũy tiến và tổng lũy tiến, và chuẩn hóa cuối cùng khớp softmax một lượt trong giới hạn thay đổi thứ tự phép toán dấu phẩy động. Thứ thay đổi là lưu lượng bộ nhớ: ba lượt đọc ghi bộ nhớ chính trở thành một lần ghi cho mỗi ô đầu ra, và dung lượng chiếm dụng giảm từ N bình phương xuống N. Các số rời kernel giống như attention tiêu chuẩn.

## Full answer

### Why standard attention is slow

```text
S = Q @ K^T       read Q and K, write an N x N matrix
P = softmax(S)    read N x N, write N x N
O = P @ V         read N x N and V, write N x d
```

Ba lượt đọc ghi qua bộ nhớ băng thông cao. Trên bộ tăng tốc tham chiếu, bộ nhớ đó di chuyển khoảng 3 TB/s trong khi bộ nhớ trên chip di chuyển khoảng 30 TB/s, nên mỗi lượt đọc ghi làm chậm gấp mười so với giữ dữ liệu trên chip. Từ khoảng 2K token, attention bị giới hạn bởi bộ nhớ trước khi bị giới hạn bởi tính toán, và các kernel cổ điển không tận dụng hết phần cứng ở mức 4 đến 10 lần.

### The tiling

```text
for each block of Q (about 128 x 128):
    load the Q tile on chip
    for each block of K, V:
        load the K and V tiles on chip
        scores for the tile
        running softmax aggregation
        accumulate into the output tile
    write the output tile once
```

Ma trận điểm số chỉ tồn tại từng ô một. Lượt truyền ngược tính lại một số giá trị thay vì lưu chúng, là một lợi ích bộ nhớ thứ hai.

### Why the result is exact

Softmax cần cực đại toàn cục và tổng toàn cục trên một hàng, còn kernel chỉ thấy một ô mỗi lần. Nó giữ một cặp lũy tiến, cực đại và tổng, và mỗi khi ô mới nâng cực đại, nó điều chỉnh tổng trước đó và đầu ra từng phần trước đó theo hàm mũ của cực đại cũ trừ cực đại mới. Cuối cùng mọi số hạng được biểu diễn theo cùng cực đại toàn cục và chia cho cùng tổng toàn cục. Mô tả của bài học là "đầu ra giống từng bit với attention tiêu chuẩn", kèm lưu ý rằng số học 16-bit không có tính kết hợp, nên đổi thứ tự có thể làm thay đổi các bit cuối.

### Versions

| Phiên bản | Năm | Thay đổi | Mức tăng tốc trên phần cứng tham chiếu |
|---|---|---|---|
| Flash 1 | 2022 | kernel chia ô trên chip | 2 lần trên bộ tăng tốc trước đó |
| Flash 2 | 2023 | song song tốt hơn, thứ tự ưu tiên nhân quả | 3 lần trên cùng bộ tăng tốc |
| Flash 3 | 2024 | bất đồng bộ và FP8 trên bộ tăng tốc mới hơn | 1.5 đến 2 lần |
| Flash 4 | 2026 | pipeline năm giai đoạn cho thế hệ mới nhất | ưu tiên suy luận, chỉ có lượt truyền xuôi khi ra mắt |

### What to tell the colleague

Chạy hai kernel trên cùng đầu vào và so sánh đầu ra. Khác biệt ở mức làm tròn 16-bit, cùng loại nhiễu bạn có từ kích thước batch khác, không phải thay đổi mô hình.

## Follow-ups

- **Level 3:** Tại sao kernel giữ cực đại lũy tiến chứ không chỉ tổng lũy tiến? Expected: ổn định số; hàm mũ của điểm số thô tràn số, nên mọi hàm mũ được lấy tương đối với cực đại đã thấy cho đến lúc đó và được điều chỉnh khi nó thay đổi.
- **Level 3:** Tại sao tính lại giá trị trong huấn luyện thay vì lưu đầu ra softmax? Expected: lưu nó có nghĩa phải hiện thực hóa ma trận N nhân N, chính là thứ kernel tránh.
- **Level 4:** Phiên bản mới nhất chỉ có truyền xuôi khi ra mắt. Điều đó có nghĩa gì với stack của bạn? Expected: phục vụ có thể dùng nó, huấn luyện giữ phiên bản trước cho đến khi kernel truyền ngược được phát hành.
- **Level 4:** Đầu ra có giống nhau giữa các kích thước batch không? Expected: không giống từng bit, vì thứ tự rút gọn thay đổi trong số học 16-bit; đó là câu hỏi về tính xác định, không phải phép xấp xỉ.

## Wrong answers

- "Nó bỏ các trọng số attention nhỏ để tiết kiệm công việc." Không gì bị bỏ; mọi key đóng góp qua tổng lũy tiến.
- "Nó chỉ hữu ích ở ngữ cảnh rất dài." Nó hữu ích mỗi khi attention bị giới hạn bởi bộ nhớ, và bài học báo cáo 2 đến 4 lần trên bộ tăng tốc trước đó với độ dài thông thường.
- "Nó giảm FLOP của attention." Số học giữ nguyên; khoản tiết kiệm nằm ở lưu lượng bộ nhớ.

## Taught in

[Bài học về KV cache và Flash Attention](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) giải thích chia ô, softmax lũy tiến và bảng phiên bản.
