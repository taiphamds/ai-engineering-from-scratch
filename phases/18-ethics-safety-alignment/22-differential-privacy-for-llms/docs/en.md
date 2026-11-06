# Differential Privacy for LLMs

> DP-SGD vẫn là tiêu chuẩn — cập nhật gradient thêm nhiễu cung cấp bảo đảm hình thức (epsilon, delta). Chi phí phụ tính toán, bộ nhớ và mức thỏa dụng đáng kể; tinh chỉnh DP hiệu quả tham số (LoRA + DP-SGD) là cấu hình phổ biến 2025 (ACM 2025). Hai nhóm bằng chứng căng thẳng: suy luận thành viên dựa trên canary (Duan và cộng sự, 2024) báo cáo thành công hạn chế với mô hình ngôn ngữ; trích xuất dữ liệu huấn luyện (Carlini và cộng sự, 2021; Nasr và cộng sự, 2025) khôi phục lượng ghi nhớ nguyên văn đáng kể. Giải quyết (arXiv:2503.06808, tháng 3 năm 2025): khoảng cách nằm ở điều được đo — canary được chèn so với dữ liệu "dễ trích xuất nhất." Thiết kế canary mới cho phép MIA dựa trên mất mát không cần mô hình bóng và tạo kiểm tra DP không tầm thường đầu tiên cho LLM huấn luyện trên dữ liệu thực với bảo đảm DP thực tế. Phương án khác: PMixED (arXiv:2403.15638) — dự đoán riêng tư lúc suy luận qua hỗn hợp chuyên gia trên phân phối token tiếp theo; tạo dữ liệu tổng hợp DP (Google Research 2024). Tấn công đang nổi: Đảo ngược Quyền riêng tư Vi sai qua Phản hồi LLM — rò rỉ điểm tin cậy.

**Type:** Build
**Languages:** Python (stdlib, DP-SGD noise-injection and ε-δ accountant demonstration)
**Prerequisites:** Phase 01 · 09 (information theory), Phase 10 · 01 (large-model training)
**Time:** ~60 minutes

## Learning Objectives

- Định nghĩa quyền riêng tư vi sai (epsilon, delta) và nêu công thức DP-SGD.
- Giải thích căng thẳng 2024-2025: MIA canary so với trích xuất dữ liệu huấn luyện cho bức tranh khác nhau.
- Mô tả PMixED và tại sao dự đoán riêng tư lúc suy luận là thay thế cho huấn luyện DP.
- Mô tả tấn công Đảo ngược Quyền riêng tư Vi sai qua Phản hồi LLM.

## The Problem

LLM ghi nhớ. Carlini và cộng sự 2021 cho thấy mô hình ngôn ngữ sản xuất tái tạo nguyên văn văn bản huấn luyện theo yêu cầu. DP là phòng vệ hình thức: huấn luyện sao cho đầu ra được chứng minh không nhạy với bất kỳ ví dụ huấn luyện đơn lẻ nào. Bằng chứng 2024-2025 cho thấy DP-SGD cần thiết nhưng giá trị ε triển khai có thể không khớp mô hình đe dọa.

## The Concept

### (ε, δ)-differential privacy

Thuật toán ngẫu nhiên M là (ε, δ)-DP nếu với bất kỳ hai tập dữ liệu khác một ví dụ và bất kỳ biến cố S:
P(M(D) in S) <= e^ε * P(M(D') in S) + δ.

Diễn giải: phân phối đầu ra đủ gần (tham số hóa bằng ε) để đóng góp của cá nhân đơn lẻ không thể suy ra đáng tin cậy, ngoại trừ với xác suất δ.

### DP-SGD

Abadi và cộng sự 2016. Công thức tiêu chuẩn:
1. Lấy mẫu mini-batch.
2. Tính gradient theo ví dụ.
3. Cắt mỗi gradient theo ví dụ đến ngưỡng C.
4. Cộng gradient đã cắt và thêm nhiễu Gaussian với độ lệch chuẩn σ * C.
5. Dùng tổng có nhiễu cập nhật tham số.

Chi phí riêng tư được theo dõi bằng bộ tính (Moments Accountant, bộ tính Rényi DP). Giá trị ε báo cáo trong tài liệu LLM thay đổi rộng theo mô hình đe dọa, độ nhạy dữ liệu và mục tiêu mức thỏa dụng; không có ε mặc định "an toàn" phổ quát. Ví dụ công bố trải khoảng ε ≈ 1–10 trong một số thiết lập huấn luyện LLM, nhưng chỉ minh họa — không là mặc định khuyến nghị. ε thấp hơn thường cần nhiều nhiễu hơn và có thể tăng mất mức thỏa dụng.

### LoRA + DP-SGD

DP-SGD đầy đủ cho mô hình tiên tiến hàng đầu tốn kém không khả thi. LoRA (Hu và cộng sự 2022) giới hạn cập nhật gradient vào adapter nhỏ, giảm lưu trữ gradient theo ví dụ. LoRA + DP-SGD là cấu hình phổ biến 2025. Bảo đảm DP áp dụng cho adapter; mô hình nền được giữ cố định.

### The 2024-2025 tension

Hai hướng bằng chứng:

- **MIA canary (Duan và cộng sự 2024).** Chèn canary độc nhất vào dữ liệu huấn luyện, đo kẻ tấn công suy luận thành viên có nhận diện được không. Báo cáo thành công hạn chế trên mô hình ngôn ngữ. Gợi ý MIA khó.
- **Trích xuất dữ liệu huấn luyện (Carlini 2021, Nasr và cộng sự 2025).** Prompt mô hình bằng tiền tố; đo có khôi phục văn bản nguyên văn từ huấn luyện không. Báo cáo ghi nhớ đáng kể. Gợi ý MIA dễ theo nghĩa liên quan.

Giải quyết tháng 3 năm 2025 (arXiv:2503.06808): hai cách đo điều khác nhau. MIA hỏi "ví dụ e có trong D không?" trên canary chèn. Trích xuất hỏi "tôi khôi phục được gì từ D?" Ví dụ "dễ trích xuất nhất" mới quan trọng cho riêng tư; canary báo cáo thấp điều này vì không tối ưu để trích xuất được.

Thiết kế canary mới. MIA dựa trên mất mát không có mô hình bóng. Kiểm tra DP không tầm thường đầu tiên của LLM trên dữ liệu thực với bảo đảm DP thực tế.

### Alternatives to DP training

- **PMixED (arXiv:2403.15638).** Dự đoán riêng tư lúc suy luận. Hỗn hợp chuyên gia trên phân phối token tiếp theo; mỗi chuyên gia thấy một mảnh dữ liệu huấn luyện; tổng hợp thêm nhiễu cho DP. Tránh hoàn toàn huấn luyện DP.
- **Tạo dữ liệu tổng hợp DP (Google Research 2024).** Tinh chỉnh LoRA với DP-SGD, lấy mẫu dữ liệu tổng hợp, huấn luyện bộ phân loại hạ nguồn trên dữ liệu tổng hợp.

Cả hai tránh chi phí mức thỏa dụng của huấn luyện DP đầy đủ với đánh đổi là mô hình đe dọa khác.

### Differential Privacy Reversal via LLM Feedback

Tấn công đang nổi 2025. Dùng điểm tin cậy mô hình huấn luyện DP như oracle để tái định danh cá nhân. Ngay cả khi đầu ra không rò rỉ, phân phối độ tin cậy có thể.

Phòng vệ: không cung cấp độ tin cậy, hoặc cắt bớt/lượng tử hóa trước cung cấp. Đây là yêu cầu bổ sung ngoài huấn luyện (ε, δ)-DP.

### Where this fits in Phase 18

Bài 20-21 là thiên lệch/công bằng. Bài 22 là riêng tư. Bài 23 là nguồn gốc qua watermark. Bài 27 đề cập lớp nguồn gốc dữ liệu theo quy định.

```figure
an-dp-clip-noise
```

## Use It

`code/main.py` mô phỏng DP-SGD trên tập dữ liệu phân loại nhị phân đơn giản. Bạn có thể quét hệ số nhân nhiễu σ và chuẩn cắt C và theo dõi ngân sách (ε, δ) cùng chi phí độ chính xác. "Tấn công canary" chèn ví dụ huấn luyện độc nhất và đo kiểm thử log-loss có phát hiện được trước và sau DP không.

## Ship It

Bài học này tạo ra `outputs/skill-dp-audit.md`. Với khẳng định DP trên triển khai mô hình ngôn ngữ, kiểm tra: giá trị (ε, δ), bộ tính dùng, giao thức đánh giá MIA, và hướng lộ độ tin cậy đã được đánh giá chưa.

## Exercises

1. Chạy `code/main.py`. Quét σ trong {0.5, 1.0, 2.0} và báo cáo đánh đổi (ε, δ)-độ chính xác. Xác định điểm mức thỏa dụng sụp đổ.

2. Triển khai chèn canary và kiểm thử log-loss. Đo tỷ lệ phát hiện trước và sau DP-SGD ở σ = 1.0.

3. Đọc Nasr và cộng sự 2025 về trích xuất dữ liệu huấn luyện. Tại sao thành công trích xuất không sụp đổ dưới ε vừa phải? Hàm ý gì cho MIA-là-đánh-giá?

4. Thiết kế triển khai dùng PMixED (arXiv:2403.15638) hoạt động hoàn toàn lúc suy luận. Mô hình đe dọa nào PMixED giải quyết mà DP-SGD không giải quyết?

5. Phác thảo tấn công Đảo ngược DP qua Phản hồi LLM. Thiết kế biện pháp hạn chế rò rỉ điểm tin cậy và ước tính chi phí triển khai.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| DP | "quyền riêng tư vi sai (ε, δ)" | Riêng tư hình thức: phân phối đầu ra gần dưới thay đổi tập dữ liệu lân cận |
| DP-SGD | "SGD thêm nhiễu" | Cắt gradient + thêm nhiễu Gaussian; huấn luyện DP tiêu chuẩn |
| LoRA + DP-SGD | "tinh chỉnh riêng tư hiệu quả" | DP-SGD trên adapter hạng thấp; cấu hình tiêu chuẩn 2025 |
| MIA | "suy luận thành viên" | Tấn công xác định ví dụ có trong dữ liệu huấn luyện không |
| Canary | "ví dụ watermark được chèn" | Ví dụ huấn luyện độc nhất dùng đo rò rỉ DP |
| PMixED | "hỗn hợp suy luận riêng tư" | DP lúc suy luận qua hỗn hợp chuyên gia trên phân phối token tiếp theo |
| DP Reversal (Đảo ngược DP) | "tấn công rò rỉ độ tin cậy" | Tấn công dùng độ tin cậy mô hình làm oracle để tái định danh |

## Further Reading

- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) — thuật toán huấn luyện DP tiêu chuẩn
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) — bài báo trích xuất kinh điển
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) — MIA thành công hạn chế
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) — giải quyết căng thẳng
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) — dự đoán riêng tư lúc suy luận
