# Planning with HTN and Evolutionary Search

> Lập kế hoạch biểu tượng xử lý các trường hợp mà kế hoạch có thể chứng minh là đúng. Tìm kiếm mã tiến hóa xử lý các trường hợp mà hàm độ thích nghi có thể kiểm tra bằng máy. ChatHTN (2025) và AlphaEvolve (2025) cho thấy mỗi cách mở ra điều gì khi kết hợp với một LLM.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 02 (ReWOO and Plan-and-Execute)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích các Mạng tác vụ phân cấp: tác vụ, phương thức, toán tử, tiền điều kiện, hiệu ứng.
- Mô tả vòng lặp lai của ChatHTN — tìm kiếm biểu tượng với phân rã dự phòng bằng LLM.
- Giải thích vòng lặp tiến hóa của AlphaEvolve và vì sao nó chỉ hoạt động với một bộ đánh giá bằng chương trình.
- Triển khai một bộ lập kế hoạch HTN mô phỏng cộng một tìm kiếm tiến hóa mô phỏng bằng thư viện chuẩn.

## The Problem

ReWOO (Bài 02), Plan-and-Execute và ReAct bao phủ hầu hết việc lập kế hoạch agent. Hai trường hợp chúng không bao phủ tốt:

1. **Các kế hoạch với tính đúng đắn có thể chứng minh.** Lập lịch, định đường bay, các workflow tuân thủ — kế hoạch phải đúng đắn ngay từ cách xây dựng. Một kế hoạch LLM trôi chảy đôi khi ảo giác một bước là không thể chấp nhận.
2. **Các tối ưu hóa với một hàm độ thích nghi có thể kiểm tra bằng máy.** Nhân ma trận, các heuristic lập lịch, các lượt xử lý trình biên dịch — mục tiêu không phải "một kế hoạch đúng" mà là "kế hoạch tốt nhất."

Lập kế hoạch HTN và AlphaEvolve giải quyết hai vấn đề khác nhau. Cả hai sử dụng LLM như bộ khuếch đại, không phải sự thay thế.

## The Concept

### Hierarchical Task Networks

Một HTN là:

- **Các tác vụ** — phức hợp (cần được phân rã) và nguyên thủy (có thể thực thi trực tiếp).
- **Các phương thức** — các cách phân rã một tác vụ phức hợp thành các tác vụ con, với các tiền điều kiện.
- **Các toán tử** — các hành động nguyên thủy với các tiền điều kiện và hiệu ứng.
- **Trạng thái** — một tập các sự thật.

Lập kế hoạch: với một tác vụ mục tiêu và một trạng thái ban đầu, tìm một phép phân rã thành các toán tử nguyên thủy có các tiền điều kiện được thỏa mãn theo trình tự.

HTN lâu đời hơn các LLM và vẫn là tham chiếu cho các kế hoạch có thể chứng minh là đúng.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) đan xen HTN biểu tượng với các truy vấn LLM:

1. Thử phân rã tác vụ phức hợp hiện tại bằng các phương thức hiện có.
2. Nếu không phương thức nào áp dụng, hỏi LLM: "bạn sẽ phân rã `task` trong trạng thái `s` như thế nào?"
3. Chuyển phản hồi LLM thành các tác vụ con ứng viên.
4. Xác thực đối với schema toán tử; từ chối các phép phân rã không hợp lệ.
5. Đệ quy.

Tuyên bố trung tâm của bài báo: mọi kế hoạch được tạo ra đều có thể chứng minh là đúng đắn vì các đề xuất LLM chỉ đi vào dưới dạng các phép phân rã ứng viên, không bao giờ là chỉnh sửa kế hoạch trực tiếp. Lớp biểu tượng sở hữu tính đúng đắn; LLM mở rộng thư viện phương thức.

Học phương thức trực tuyến (OpenReview `gwYEDY9j2x`, nghiên cứu tiếp nối năm 2025) thêm một bộ học khái quát hóa các phép phân rã do LLM tạo bằng hồi quy — giảm tần suất truy vấn LLM tới 75%.

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, tháng 6 năm 2025) là một thứ khác: tìm kiếm mã tiến hóa được điều phối bởi một tổ hợp Gemini 2.0 Flash/Pro.

Vòng lặp:

1. Bắt đầu với một chương trình hạt giống + một bộ đánh giá bằng chương trình (trả về một điểm độ thích nghi).
2. Tổ hợp các LLM đề xuất các đột biến.
3. Chạy các đột biến qua bộ đánh giá.
4. Giữ cái tốt nhất; đột biến tiếp.

Các thành tựu đã công bố:

- Cải tiến đầu tiên vượt Strassen cho phép nhân ma trận phức 4x4 trong 56 năm (48 phép nhân vô hướng).
- Thu hồi 0.7% năng lực tính toán Google qua một heuristic lập lịch Borg.
- Tăng tốc FlashAttention 32% trên một khối lượng công việc tiên tiến.

Ràng buộc cứng: hàm độ thích nghi phải có thể kiểm tra bằng máy. Tìm kiếm tiến hóa trên các câu trả lời văn xuôi không hội tụ.

### When to use which

| Lớp vấn đề | Sử dụng | Vì sao |
|---------------|-----|-----|
| Lập lịch với các ràng buộc cứng | HTN + ChatHTN | Tính đúng đắn có thể chứng minh |
| Tối ưu hóa trình biên dịch | AlphaEvolve | Độ thích nghi có thể kiểm tra bằng máy |
| Thực thi tác vụ nhiều bước | ReAct / ReWOO | LLM trong vòng lặp, không có bảo đảm hình thức |
| Cải thiện mã với các kiểm thử | AlphaEvolve | Các kiểm thử là bộ đánh giá |
| Tự động hóa ràng buộc bởi chính sách | HTN | Các tiền điều kiện mã hóa chính sách |

### Where this pattern goes wrong

- **HTN không có các toán tử.** Không có các schema tiền điều kiện/hiệu ứng, tuyên bố tính đúng đắn sụp đổ. "LLM đề xuất phân rã" của ChatHTN yêu cầu schema để từ chối các bước đi không hợp lệ.
- **AlphaEvolve không có một bộ đánh giá thực.** "Hỏi LLM xem mã có tốt hơn không" không phải là một hàm độ thích nghi. Bộ đánh giá phải mang tính xác định và nhanh.
- **Thiết kế quá mức.** Hầu hết các tác vụ agent không cần cách nào trong hai cách. Chọn ReAct hoặc ReWOO trước.

```figure
htn-tree-expand
```

## Build It

`code/main.py` triển khai hai bản mô phỏng:

- Một bộ lập kế hoạch HTN dùng thư viện chuẩn với các toán tử, phương thức, tiền điều kiện, hiệu ứng và một `LLMFallback` kích hoạt khi không phương thức nào khớp một tác vụ phức hợp. "LLM" là một bộ phân rã được viết kịch bản để bộ lập kế hoạch chạy ngoại tuyến.
- Một tìm kiếm tiến hóa dùng thư viện chuẩn trên các chương trình số học: phát triển các biểu thức có đầu ra giảm thiểu `|f(x) - target|` trên một tập kiểm thử. Bộ đánh giá mang tính xác định.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy bộ lập kế hoạch HTN phân rã một tác vụ phức hợp (với một phương án dự phòng LLM giữa kế hoạch) và vòng lặp tiến hóa hội tụ vào một biểu thức mục tiêu.

## Use It

- **Các bộ lập kế hoạch HTN** — `pyhop`, `SHOP3` hoặc tự xây dựng cho thực thi chính sách dành riêng cho miền.
- **ChatHTN** — mã nghiên cứu; mẫu (biểu tượng + dự phòng LLM) chuyển gọn gàng sang bất kỳ bộ lập kế hoạch HTN nào.
- **AlphaEvolve** — bài báo DeepMind; mẫu (tổ hợp + bộ đánh giá) có thể tái tạo. OpenEvolve và các fork mã nguồn mở tương tự đang xuất hiện.
- **Các framework agent** — chưa framework nào cung cấp HTN hoặc AlphaEvolve hạng nhất. Xây dựng nó như một agent phụ hoặc một worker nền.

## Ship It

`outputs/skill-hybrid-planner.md` tạo một khung bộ lập kế hoạch lai (HTN hoặc tiến hóa) với vai trò LLM được giới hạn phạm vi rõ ràng.

## Exercises

1. Mở rộng bộ lập kế hoạch HTN với quay lui: khi hậu điều kiện của một toán tử thất bại khi chạy, khôi phục và thử phương thức tiếp theo.
2. Thêm một bộ nhớ đệm phương thức LLM vào ChatHTN: khi LLM phân rã tác vụ `T` trong mẫu trạng thái `P`, lưu kết quả. Kiểm tra lại thư viện phương thức trước trong lời gọi tiếp theo.
3. Thay bộ đánh giá tìm kiếm tiến hóa bằng một bộ kiểm thử thực. Tiến hóa một hàm sắp xếp vượt qua 20 trường hợp kiểm thử; báo cáo số thế hệ đến hội tụ.
4. Đọc các ghi chú thiết kế bộ đánh giá của AlphaEvolve. Thiết kế một bộ đánh giá cho một miền bạn quan tâm (tối ưu hóa truy vấn SQL, giảm thiểu bộ kiểm thử, YAML triển khai).
5. Kết hợp: sử dụng HTN để phân rã một tác vụ phức hợp thành các tác vụ con, rồi sử dụng tìm kiếm tiến hóa trên toán tử nguyên thủy của mỗi tác vụ con. Nó tỏa sáng ở đâu, thiết kế quá mức ở đâu?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| HTN | "Bộ lập kế hoạch phân cấp" | Phân rã tác vụ với các toán tử, tiền điều kiện, hiệu ứng |
| Method (Phương thức) | "Quy tắc phân rã" | Cách chia một tác vụ phức hợp thành các tác vụ con |
| Operator (Toán tử) | "Hành động nguyên thủy" | Bước cụ thể với tiền điều kiện và hiệu ứng |
| ChatHTN | "LLM + HTN" | Bộ lập kế hoạch biểu tượng hỏi LLM khi không phương thức nào khớp |
| AlphaEvolve | "Tìm kiếm mã tiến hóa" | Các LLM tổ hợp đột biến mã; bộ đánh giá mang tính xác định lựa chọn |
| Fitness function (Hàm độ thích nghi) | "Bộ đánh giá" | Điểm mang tính xác định, có thể kiểm tra bằng máy trên các đầu ra |
| Online method learning (Học phương thức trực tuyến) | "Phân rã LLM được lưu đệm" | Lưu + khái quát hóa các kế hoạch LLM để giảm chi phí truy vấn |

## Further Reading

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) — bộ lập kế hoạch lai biểu tượng + LLM
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) — tìm kiếm mã tiến hóa với các đột biến LLM
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — khi nào chọn một bộ lập kế hoạch so với một vòng lặp đơn giản
