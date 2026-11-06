# Bounded Self-Improvement Designs

> Nghiên cứu đã hội tụ vào bốn thành phần nguyên thủy để giới hạn một vòng lặp tự cải thiện. Các bất biến hình thức phải được giữ qua mọi chỉnh sửa. Các mỏ neo căn chỉnh không thể sửa đổi. Các ràng buộc đa mục tiêu nơi mọi chiều (an toàn, công bằng, tính vững chắc) phải được giữ, không chỉ hiệu năng. Phát hiện hồi quy tạm dừng vòng lặp khi các thước đo lịch sử gợi ý mất năng lực. Không thành phần nào là một chứng minh an toàn — các kết quả lý thuyết thông tin (độ phức tạp Kolmogorov, định lý Lob) giới hạn điều bất kỳ hệ thống nào có thể chứng minh về các hệ thống kế nhiệm riêng. Chúng là các biện pháp giảm thiểu tăng chi phí thất bại âm thầm.

**Type:** Learn
**Languages:** Python (stdlib, bounded-loop with invariant check)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## The Problem

Bộ mô phỏng cuộc đua của Bài 7 cho thấy các khác biệt tốc độ nhỏ tích lũy thành các khoảng cách lớn. Nghiên cứu trường hợp DGM của Bài 4 cho thấy các vòng lặp có thể chủ động lách các bộ đánh giá riêng. Cả hai kết quả chỉ đến cùng câu hỏi kỹ thuật: bạn có thể đặt những ràng buộc nào lên một vòng lặp tự cải thiện sao cho các ràng buộc không thể bị chính vòng lặp âm thầm làm yếu?

Bản tóm tắt Workshop RSI ICLR 2026 (openreview.net/pdf?id=OsPQ6zTQXV) nhận diện bốn thành phần nguyên thủy như vậy. RSP v3.0 của Anthropic (Bài 19) và FSF v3 của DeepMind (Bài 20) đều tham chiếu chúng trong các ngưỡng năng lực. Công trình Meta HyperAgents và các framework cộng đồng như SAHOO (tháng 3 năm 2026) triển khai các tập con trong sản xuất.

Cách định khung trung thực: đây là các biện pháp giảm thiểu. Các kết quả lý thuyết thông tin giới hạn điều bất kỳ hệ thống nào có thể chứng minh về hệ thống kế nhiệm riêng, và không thiết kế hiện tại nào khép vấn đề về mặt hình thức. Một vòng lặp được giới hạn tốt an toàn hơn một vòng lặp không giới hạn, không phải an toàn theo nghĩa tuyệt đối.

## The Concept

### Primitive 1: formal invariants

Một bất biến là một thuộc tính phải đúng trước và sau mọi tự sửa đổi. Các ví dụ:

- Phân phối đầu ra được điều kiện hóa theo một header hiến pháp cố định (Bài 17).
- Không lời gọi công cụ nào đi đến một endpoint không được cấp quyền.
- Các lần ghi bộ nhớ đi qua một đường được ghi log, có chữ ký.
- Hash mô-đun bộ đánh giá khớp phiên bản được phê duyệt.

Các bất biến được mã bên ngoài mà vòng lặp không thể chỉnh sửa kiểm tra. Nếu một sửa đổi được đề xuất vi phạm một bất biến, nó bị từ chối. Điều này bắt chế độ can thiệp bộ đánh giá kiểu DGM (Bài 4).

Phần khó là chọn các bất biến cần thiết cho an toàn và có thể tính trong thời gian hợp lý. Đặc tả quá mức làm đình trệ tiến bộ; đặc tả thiếu để vòng lặp đi qua các thuộc tính quan trọng.

### Primitive 2: alignment anchors

Một mỏ neo căn chỉnh là một biểu diễn bất biến của mục tiêu cốt lõi vòng lặp, được ghim ngoài bề mặt chỉnh sửa vòng lặp. Các ví dụ:

- Một văn bản hiến pháp (Bài 17) được tải từ một vị trí chỉ đọc trên mỗi lần gọi.
- Một bộ đánh giá trong một kho mã riêng với kiểm soát truy cập độc lập.
- Một bảng kê quyền công cụ được một con người ký và xác minh lại mỗi chu kỳ.

Vai trò của mỏ neo là ngăn trôi dạt mục tiêu. Vòng lặp có thể cải thiện cách nó theo đuổi mục tiêu, nhưng không thể chỉnh sửa mục tiêu là gì.

Chế độ lỗi tinh tế: một mỏ neo mà vòng lặp không thể chỉnh sửa vẫn có thể được một vòng lặp diễn giải lại khi cách nó đọc mỏ neo trôi dạt. Constitutional AI (Bài 17) rõ ràng dựa trên lý do để xử lý các tình huống mới; lớp suy luận đó là nơi trôi dạt diễn giải tồn tại. Các mỏ neo là cần thiết, chưa đủ.

### Primitive 3: multi-objective constraints

Một vòng lặp tối ưu một điểm vô hướng duy nhất sẽ tìm các lối tắt. Một vòng lặp phải đồng thời thỏa nhiều ràng buộc cứng có ít lối tắt khả dụng hơn. Các trục điển hình:

- Hiệu năng (benchmark cấp tác vụ)
- An toàn (các đánh giá red-team, tỷ lệ từ chối trên các trường hợp xấu đã biết)
- Công bằng (các cận tác động khác biệt trên các nhóm con nhạy cảm)
- Tính vững chắc (các tập kiểm thử OOD, xử lý đầu vào đối kháng)

Một sửa đổi chỉ được chấp nhận nếu mọi ràng buộc được giữ. Bộ điều tiết chi phí của Bài 13 xếp chồng điều này với các ràng buộc tài chính. Llama Guard của Bài 18 cắm vào như một trục an toàn.

### Primitive 4: regression detection

Các điểm mỗi chu kỳ được so sánh với các phân phối lịch sử. Một đợt giảm vượt dung sai được cấu hình tạm dừng vòng lặp. Điều này bắt mất năng lực âm thầm nếu không sẽ được hấp thụ vào trung bình chạy khi vòng lặp "cải thiện vượt qua" nó.

Một triển khai thực tiễn: lưu các điểm cho từng tác vụ của N chu kỳ cuối. Mỗi chu kỳ mới tính một chênh lệch cho từng tác vụ. Nếu bất kỳ chênh lệch nào giảm dưới một ngưỡng, chu kỳ bị từ chối và một con người đánh giá.

### Information-theoretic limits

Độ phức tạp Kolmogorov và định lý Lob đặt các cận trên cho điều một hệ thống có thể chứng minh về chính nó. Godel Machine hình thức của Schmidhuber (Bài 4) nhắm tới cận cao nhất như vậy; chưa ai hoàn thành một chứng minh không tầm thường. Kết quả Lob nói: nếu một hệ thống có thể chứng minh rằng nó tin "tôi sẽ làm X nếu tôi chứng minh tôi nên làm X," nó sẽ làm X mà không chứng minh nó nên làm, một thất bại tự tham chiếu nổi tiếng.

Hệ quả cho các thành phần nguyên thủy của chúng ta: chúng không thể khép vấn đề an toàn. Chúng làm thất bại âm thầm đắt hơn. Một vòng lặp độc hại hoặc trôi dạt lẽ ra âm thầm vượt một kiểm tra bị thiếu giờ phải chủ động phá hoại một kiểm tra tường minh, là một dấu hiệu dễ phát hiện hơn.

### A worked example

Giả sử một agent đề xuất một chỉnh sửa. Stack cổng kiểm soát:

1. Các kiểm tra bất biến: hash mô-đun, bảng kê quyền công cụ, header hiến pháp.
2. Kiểm tra mỏ neo: phát biểu mục tiêu khớp phiên bản được phê duyệt (theo byte hoặc theo ngữ nghĩa).
3. Đánh giá đa mục tiêu: các trục hiệu năng, an toàn, công bằng, tính vững chắc.
4. Phát hiện hồi quy: không trục nào giảm hơn dung sai.

Cả bốn phải đạt để chỉnh sửa được đưa vào. Bất kỳ thất bại đơn lẻ nào tạm dừng vòng lặp.

```figure
bounded-gates
```

## Use It

`code/main.py` chạy một vòng lặp tự cải thiện có giới hạn trên bản mô phỏng kiểu DGM từ Bài 4, nhưng với bốn thành phần nguyên thủy được xếp lớp lên trên. Mỗi thành phần có thể bật hoặc tắt riêng. Minh họa là mỗi thành phần bắt một lớp thất bại cụ thể, và loại bỏ bất kỳ thành phần nào để lớp thất bại đó lọt qua.

## Ship It

`outputs/skill-bounded-loop-review.md` kiểm toán một vòng lặp có giới hạn được đề xuất và chấm điểm thành phần nào trong bốn thành phần nguyên thủy nó thực sự triển khai so với tuyên bố.

## Exercises

1. Chạy `code/main.py` với mọi thành phần nguyên thủy được bật. Xác nhận vòng lặp vẫn cải thiện trên thước đo chính mà không để cách lách thắng.

2. Tắt phát hiện hồi quy. Xây một đầu vào nơi điều này dẫn đến việc mất năng lực âm thầm được chấp nhận.

3. Tắt ràng buộc đa mục tiêu. Cho thấy vòng lặp hội tụ trên trục hiệu năng trong khi một trục an toàn giảm.

4. Thiết kế một mỏ neo căn chỉnh cho một agent lập trình. Văn bản gì, được lưu ở đâu, được kiểm tra thế nào?

5. Đọc bản tóm tắt Workshop RSI ICLR 2026. Chọn một trong bốn thành phần nguyên thủy và đề xuất một cải thiện cụ thể cho mức tốt nhất hiện tại.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| Invariant (Bất biến) | "Thuộc tính luôn đúng" | Một thuộc tính được mã bên ngoài kiểm tra trước và sau mọi chỉnh sửa |
| Alignment anchor (Mỏ neo căn chỉnh) | "Mục tiêu được ghim" | Biểu diễn mục tiêu cốt lõi bất biến ngoài bề mặt chỉnh sửa vòng lặp |
| Multi-objective constraint (Ràng buộc đa mục tiêu) | "Mọi trục phải được giữ" | Hiệu năng, an toàn, công bằng, tính vững chắc — tất cả đều bắt buộc |
| Regression detection (Phát hiện hồi quy) | "Tạm dừng khi giảm" | Tạm dừng vòng lặp khi các chênh lệch thước đo lịch sử gợi ý mất năng lực |
| Kolmogorov bound (Cận Kolmogorov) | "Giới hạn lý thuyết thông tin" | Giới hạn điều một hệ thống có thể chứng minh về hệ thống kế nhiệm riêng |
| Lob's theorem (Định lý Lob) | "Bẫy tự tham chiếu" | Hệ thống có thể hành động theo "tôi nên" mà không chứng minh nó nên |
| Gate stack (Stack cổng kiểm soát) | "Kiểm tra nhiều lớp" | Nhiều thành phần nguyên thủy kết hợp; bất kỳ thất bại nào từ chối chỉnh sửa |
| Bounded improvement (Cải thiện có giới hạn) | "Giảm thiểu, không phải chứng minh" | Tăng chi phí thất bại âm thầm; không khép vấn đề an toàn |

## Further Reading

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV) — sự hội tụ bốn thành phần nguyên thủy.
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — các ngưỡng năng lực đa mục tiêu.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — giám sát căn chỉnh lừa dối như một thành phần nguyên thủy bất biến.
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) — tổ tiên chứng minh hình thức của các thành phần nguyên thủy này.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — mỏ neo căn chỉnh dựa trên lý do.
