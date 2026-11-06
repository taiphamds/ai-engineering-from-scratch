# Async and Hogwild! Inference

> Speculative decoding (Giai đoạn 10 · 15) song song hóa các token trong một chuỗi. Các framework đa tác tử song song hóa trên toàn bộ các chuỗi nhưng buộc phải phối hợp rõ ràng (bỏ phiếu, chia tác vụ con). Hogwild! Inference (Rodionov và cộng sự, arXiv:2504.06261) làm một điều khác: chạy N phiên bản của cùng một LLM song song trên một key-value cache DÙNG CHUNG. Mỗi worker thấy ngay các token được sinh bởi mọi worker khác. Các mô hình suy luận hiện đại — QwQ, DeepSeek-R1 — có thể tự phối hợp thông qua cache dùng chung đó mà không cần fine-tuning. Cách tiếp cận này mang tính thử nghiệm nhưng mở ra một trục song song hóa suy luận hoàn toàn mới trực giao với spec decode. Bài học này triển khai một bộ mô phỏng Hogwild! hai worker bằng stdlib Python và giải thích tại sao sự cộng tác qua cache dùng chung xuất hiện từ khả năng suy luận sẵn có của mô hình.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 12 (inference optimization), Phase 10 · 15 (speculative decoding)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả ba cấu trúc liên kết LLM song song phổ biến (bỏ phiếu, tác vụ con, Hogwild!) và nêu tên các vấn đề mà mỗi cấu trúc nhắm tới.
- Nêu thiết lập cốt lõi của Hogwild!: nhiều worker, một KV cache dùng chung, sự phối hợp tự phát thông qua tự prompting.
- Tính mức tăng tốc thời gian thực của Hogwild! theo số worker `N`, mức song song ở cấp tác vụ `p` và chi phí phối hợp `c`.
- Triển khai một bộ mô phỏng Hogwild! hai worker trên một bài toán minh họa và quan sát sự phân chia tác vụ tự phát.

## The Problem

Các LLM hiện đại giải các bài toán khó bằng cách tạo ra các chuỗi suy luận dài — 5000 token logic từng bước là phổ biến, hàng chục nghìn token xảy ra ở các bài toán sâu. Ở tốc độ giải mã 35 token/giây trên mô hình 70B, 50k token là 24 phút. Mô hình chẳng có tính tương tác.

Speculative decoding (Giai đoạn 10 · 15) mang lại mức tăng tốc 3-5x bằng cách song song hóa trong một chuỗi. Vượt qua mức đó, sự phụ thuộc tuần tự của giải mã tự hồi quy là trần cứng. Mỗi token mới phụ thuộc vào mọi token trước đó.

Câu hỏi hiển nhiên: chúng ta có thể song song hóa trên các chuỗi không? Chạy nhiều bản sao của cùng mô hình trên cùng bài toán, cho chúng hợp tác, để chúng chia công việc?

Công trình trước: tổ hợp bỏ phiếu (chạy N mô hình, chọn câu trả lời đa số), tree-of-thought (phân nhánh các đường suy luận và kết hợp lại) và các framework đa tác tử (gán mỗi tác tử một tác vụ con, dùng bộ điều phối). Tất cả đều giúp ích trong các miền tác vụ cụ thể. Tất cả cũng đưa vào cơ chế phối hợp rõ ràng — quy tắc bỏ phiếu, logic phân nhánh và cắt tỉa, giao thức nhắn tin giữa các tác tử.

Hogwild! Inference dùng một cách tiếp cận khác. N worker chia sẻ một KV cache duy nhất. Mỗi worker thấy ngay các token được sinh bởi mọi worker khác, như thể chúng là ngữ cảnh của chính nó. Các worker — không qua bất kỳ huấn luyện hay fine-tuning nào — tìm ra cách chia công việc. Các mô hình suy luận hiện đại (QwQ, DeepSeek-R1, chế độ suy luận của họ Claude) có thể đọc cache dùng chung và nói những điều như "Tôi thấy worker 2 đã xử lý trường hợp cơ sở, nên tôi sẽ làm bước quy nạp."

Mức tăng tốc phụ thuộc vào khối lượng công việc và còn mang tính thử nghiệm tính đến tháng 4 năm 2026. Nhưng ý tưởng này đáng biết vì nó mở ra một trục song song hóa suy luận mới.

## The Concept

### The setup

Khởi tạo N tiến trình worker, tất cả chạy cùng một LLM. Thay vì KV cache riêng cho mỗi worker, duy trì MỘT cache dùng chung. Khi worker `i` sinh token `t_j`, token được ghi vào cache dùng chung tại vị trí tiếp theo. Khi worker `k` thực hiện bước tiếp theo, nó đọc trạng thái hiện tại của cache (bao gồm mọi thứ mà cả N worker đã sinh cho đến lúc đó).

Vào thời điểm thực hiện bước, các worker tranh nhau ghi token. Không có chỉ số vị trí riêng cho mỗi worker — cache là một chuỗi tăng dần duy nhất. Thứ tự được xác định bởi thời gian lệnh ghi đến.

### Why coordination emerges

Các worker chia sẻ một prompt. Thường có dạng "Bạn là một trong N phiên bản cùng làm việc trên bài toán này. Mỗi phiên bản đọc bộ nhớ dùng chung và có thể thấy những gì các phiên bản khác đã viết. Tránh làm việc trùng lặp." Prompt cộng cache dùng chung là đủ. Các mô hình suy luận đọc cache, nhận thấy những phần nào của bài toán đã được thử, và (thường nhưng không phải luôn luôn) chuyển sang các phần chưa được khám phá.

Bài báo Hogwild! (Rodionov và cộng sự, 2025) báo cáo các quan sát như:

- Các worker lập kế hoạch và truyền đạt chúng cho các worker khác qua cache.
- Các worker nhận thấy lỗi trong suy luận của các worker khác và chỉ ra chúng.
- Các worker thích ứng khi một kế hoạch thất bại và đề xuất phương án khác.
- Khi được nhắc kiểm tra sự trùng lặp, các worker phát hiện nó và chuyển hướng.

Không điều nào trong số này cần fine-tuning. Hành vi tự phát đến từ các khả năng suy luận mà mô hình đã có.

### The naming

Tên bài báo lấy ý từ Hogwild! SGD (Recht và cộng sự, 2011), một bộ tối ưu cập nhật bất đồng bộ. Sự tương tự: các worker bất đồng bộ của SGD đều ghi vào một vector tham số dùng chung; các worker của Hogwild! Inference đều ghi vào một KV cache dùng chung. Cả hai dựa vào hội tụ thực nghiệm thay vì các bảo đảm đồng bộ hóa.

### RoPE makes this tractable

Rotary Position Embeddings (RoPE, Su và cộng sự 2021) mã hóa thông tin vị trí thông qua phép quay trong các vector Q và K. Vì điểm attention giữa một query đã quay và một key đã quay chỉ phụ thuộc vào khoảng cách tương đối của chúng, toàn bộ một khối phần tử đã cache có thể chuyển đến một độ lệch mới mà không cần tính lại: quay query thay vì quay lại mọi key đã cache. Hogwild! Inference thực hiện điều này một lần cho mỗi khối cache: đối với một query tại vị trí `i_q` và một khối bắt đầu tại `i_k` trong góc nhìn của worker đó, query được quay theo khoảng cách tương đối `i_q - i_k`. Đó là cách mỗi worker nhìn thấy các khối cache chia sẻ theo thứ tự riêng của nó. Thủ thuật hoạt động với một phép dịch đồng đều của một khối liên tục. Di chuyển từng token riêng lẻ đến các vị trí khác nhau sẽ thay đổi các phép quay của chúng và vẫn cần tính lại.

Trong mô hình vị trí được học hoặc vị trí tuyệt đối, Hogwild! sẽ cần vô hiệu hóa cache ở mỗi lần ghi đồng thời. RoPE cho phép cache giữ ổn định.

### Wall-time math

Gọi `T_serial` là thời gian để một worker giải bài toán một mình. Gọi `p` là tỷ phần có thể song song hóa ở cấp tác vụ. Gọi `c` là chi phí phối hợp mỗi bước (đọc cache được mở rộng, quyết định viết gì).

Thời gian một worker: `T_serial`.
Thời gian Hogwild! N worker, nếu phối hợp miễn phí: `T_serial * ((1 - p) + p / N)`. Amdahl cổ điển.
Với chi phí phối hợp: `T_serial * ((1 - p) + p / N) + c * steps_per_worker`.

Để một worker có hiệu quả, `c` phải nhỏ so với thời gian giải mã mỗi bước. Trên các mô hình suy luận tạo 5k+ token, các worker có thể chịu hàng trăm token chi phí phối hợp mà vẫn có lợi. Trên các tác vụ chat ngắn, phối hợp chiếm ưu thế và Hogwild! tệ hơn tuần tự.

### Concrete example

Bài toán suy luận: 10k token chain-of-thought. Giả sử bài toán có `p = 0.7` nội dung có thể song song hóa (các chiến lược chứng minh khác nhau, các phân tích trường hợp khác nhau) và `c = 200` token chi phí phối hợp mỗi worker. Với `N = 4` worker:

- Thời gian tuần tự: 10000 bước giải mã.
- Thời gian Hogwild!: 10000 * (0.3 + 0.7 / 4) + 200 * 4 = 10000 * 0.475 + 800 = 5550 bước giải mã.
- Tăng tốc: 10000 / 5550 = 1.8x.

Mức đó khiêm tốn. Nhưng trên các bài toán suy luận dài hơn (50k token), chi phí phối hợp được phân bổ và mức tăng tốc tiến tới 2.5-3x. Hogwild! là tương đương suy luận của song song hóa cấp luồng trong một ngôn ngữ cho phép bạn viết mã đa luồng một cách tự nhiên.

### When to reach for Hogwild!

- Các bài toán suy luận dài (hàng nghìn token) mà tác vụ có thể được song song hóa trên các mục tiêu con độc lập.
- Các mô hình suy luận đã được huấn luyện để suy nghĩ từng bước. Các mô hình không suy luận tự phối hợp không tốt.
- Các triển khai một node với đủ VRAM để chứa cache dùng chung cộng N tiến trình worker. Cache được chia sẻ, nhưng mỗi worker có bộ nhớ activation riêng.

### When not to

- Chat tương tác ngắn. Chi phí phối hợp chiếm ưu thế.
- Các tác vụ không song song hóa được (một chứng minh tuyến tính duy nhất, một lần biên dịch duy nhất). N=1 là tối đa.
- Các mô hình không suy luận. Không xuất hiện sự phối hợp.
- Các triển khai nhiều node. Cache dùng chung cần đồng bộ hóa giữa các worker rất nhanh. Trong node thì ổn; giữa các node là thảm họa độ trễ.

### The experimental status

Tính đến tháng 4 năm 2026, Hogwild! là một phương pháp nghiên cứu với triển khai PyTorch mã nguồn mở. Chưa có sự áp dụng trong sản xuất. Ba trở ngại:

1. Quản lý KV cache dùng chung giữa các tiến trình đồng thời là công việc kỹ thuật không đơn giản.
2. Sự phối hợp tự phát phụ thuộc tác vụ; các benchmark vẫn đang được xây dựng.
3. Mức tăng tốc khiêm tốn so với những gì speculative decoding đã mang lại, và cả hai có thể kết hợp nhưng phần kỹ thuật kết hợp là một lớp nữa.

Đáng biết. Đáng thử nghiệm. Chưa đáng đặt cược một sản phẩm vào.

```figure
continuous-batching
```

## Build It

`code/main.py` triển khai một bộ mô phỏng Hogwild! minh họa:

- Hai tiến trình worker, mỗi tiến trình là một "LLM" tất định tạo ra một trong vài loại token (token công việc, token quan sát, token phối hợp) với xác suất đã biết.
- Một cache dùng chung (chỉ là danh sách token) mà cả hai worker đọc và ghi.
- Một logic phối hợp đơn giản: khi một worker thấy worker kia đã tạo đủ token công việc trong một loại, nó chọn một loại khác.

Bộ mô phỏng chạy với ngân sách bước cố định và báo cáo:

- Tổng số token công việc được tạo.
- Tổng thời gian thực (số bước worker).
- Mức tăng tốc hiệu dụng so với một worker duy nhất.
- Bản theo dấu worker nào đã viết token nào.

### Step 1: the shared cache

Một danh sách mà cả hai worker thêm vào. Khóa đơn giản (Python `threading.Lock`) trong triển khai thực; chúng ta mô phỏng bằng một bộ đếm.

### Step 2: the worker loop

Mỗi worker, ở mỗi bước:

- Đọc cache dùng chung hiện tại.
- Quyết định loại token cần viết dựa trên những gì đã có.
- Viết một token.

### Step 3: the coordination heuristic

Nếu loại X đã có K token trong cache và loại dự định của worker là X, worker chuyển sang loại Y. Đây là sự thay thế minh họa cho hành vi của mô hình suy luận "nhận thấy phần này đã được xử lý, làm việc khác thay thế."

### Step 4: measured speedup

Chạy bộ mô phỏng với N=1 worker và với N=2 worker, cùng tổng ngân sách bước. Đếm số token công việc được tạo. N=2 phải tạo nhiều hơn khoảng 1.5-1.8x token công việc nhờ sự phân chia tác vụ do phối hợp thúc đẩy.

### Step 5: stress the coordination

Giảm độ nhạy của heuristic phối hợp. Chạy lại. Quan sát rằng nếu không có phối hợp tốt, N=2 tạo trùng lặp cùng các token và mức tăng tốc giảm xuống dưới 1. Điều này khớp với quan sát của bài báo: thủ thuật chỉ hoạt động nếu các worker có năng lực suy luận để tự phối hợp.

## Use It

Việc tích hợp Hogwild! trong sản xuất tính đến tháng 4 năm 2026 ở cấp nghiên cứu. Triển khai tham chiếu từ Yandex/HSE/IST dựa trên PyTorch và nhắm đến các thiết lập nhiều tiến trình trên một node với các mô hình DeepSeek-R1 và QwQ.

Lộ trình áp dụng thực dụng:

1. Phân tích khối lượng công việc tác vụ suy luận của bạn. Đo tỷ phần token mang tính khám phá (nhiều chiến lược, phân tích trường hợp, tìm kiếm) so với tuyến tính.
2. Nếu khám phá chiếm ưu thế, chạy một thử nghiệm Hogwild! hai worker. Đo sự cải thiện thời gian thực.
3. Nếu sự cải thiện dưới 1.3x, bạn đang ở chế độ bị phối hợp chi phối. Quay về một worker.
4. Nếu sự cải thiện trên 1.5x, tăng lên N=4 và đo lại. Lợi ích giảm dần thường xuất hiện quanh N=4-8.

Kết hợp với speculative decoding: mỗi worker Hogwild! có thể dùng spec decode độc lập. Hai mức tăng tốc nhân với nhau (xấp xỉ), đưa spec decode 3x và Hogwild! 1.8x thành mức hiệu dụng 5.4x so với giải mã một worker đơn giản.

## Ship It

Bài học này tạo ra `outputs/skill-parallel-inference-router.md`. Với một hồ sơ khối lượng công việc suy luận (ngân sách token, hồ sơ song song hóa tác vụ, họ mô hình, đích triển khai), nó định tuyến giữa các chiến lược bỏ phiếu, tree-of-thought, đa tác tử, Hogwild! và speculative decoding.

## Exercises

1. Chạy `code/main.py` với thiết lập mặc định. Xác nhận cấu hình Hogwild! N=2 tạo nhiều token công việc hơn baseline N=1 trong cùng thời gian thực.

2. Giảm độ mạnh của heuristic phối hợp (đặt `coordination_weight=0.1`). Chạy lại. Cho thấy mức tăng tốc sụp đổ. Giải thích tại sao: các worker trùng lặp nỗ lực khi không thể phối hợp.

3. Tính mức tăng tốc Hogwild! dự kiến cho một tác vụ suy luận 50k token với `p=0.8, c=500` và N=4 worker. Làm tương tự cho một tác vụ chat 1k token với `p=0.3, c=200` và N=4. Tại sao một trường hợp có lợi và trường hợp kia bất lợi?

4. Đọc Mục 4 (đánh giá sơ bộ) của bài báo Hogwild!. Xác định hai dạng thất bại mà các tác giả báo cáo. Mô tả cách một prompt phối hợp tốt hơn có thể giảm nhẹ mỗi dạng.

5. Kết hợp Hogwild! với speculative decoding trong bản minh họa: mỗi worker dùng spec-decode 2 token bên trong. Báo cáo mức tăng tốc nhân. Vấn đề quản lý chi tiết nào nảy sinh khi hai worker đều muốn mở rộng cùng tiền tố cache dùng chung?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Hogwild! | "Worker song song, cache dùng chung" | N phiên bản của cùng một LLM chạy đồng thời với một KV cache dùng chung; sự phối hợp tự phát thông qua tự prompting |
| Shared KV cache (KV cache dùng chung) | "Phương tiện phối hợp" | Một bộ đệm KV tăng dần duy nhất mà tất cả worker đọc và ghi; cho phép token hiển thị ngay giữa các worker |
| Emergent coordination (Phối hợp tự phát) | "Không cần huấn luyện" | Các LLM có khả năng suy luận có thể đọc cache dùng chung và chia công việc mà không cần fine-tuning hay giao thức rõ ràng |
| Coordination overhead (c) (Chi phí phối hợp) | "Token dành cho định hướng" | Chi phí mỗi worker để đọc cache được mở rộng và quyết định làm gì; phải giữ nhỏ so với tổng thời gian giải mã |
| Parallelizable fraction (p) (Tỷ phần có thể song song hóa) | "Những gì có thể chạy song song" | Song song hóa cấp tác vụ: tỷ phần tổng công việc không vốn có tính tuần tự |
| RoPE enables Hogwild! (RoPE cho phép Hogwild!) | "Vị trí quay bất biến với dịch chuyển" | Vì vị trí là phép quay, ghi vào cache dùng chung không yêu cầu tính lại các token trước |
| Voting ensemble (Tổ hợp bỏ phiếu) | "Chạy N, chọn đa số" | Cấu trúc liên kết suy luận song song đơn giản nhất; hữu ích cho phân loại, ít hơn cho suy luận dài |
| Tree of thought (Cây suy nghĩ) | "Phân nhánh và cắt tỉa" | Chiến lược suy luận khám phá nhiều nhánh và cắt tỉa; logic phối hợp rõ ràng |
| Multi-agent framework (Framework đa tác tử) | "Gán tác vụ con" | Mỗi tác tử nhận một vai trò; một bộ điều phối điều hành; chi phí giao thức cao |

## Further Reading

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) — bài báo Hogwild!, đánh giá sơ bộ trên QwQ và DeepSeek-R1
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) — Hogwild! gốc, nguồn gốc tên gọi
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) — RoPE, thuộc tính khiến suy luận qua cache dùng chung khả thi
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) — chiến lược suy luận tree-of-thought mà Hogwild! trực giao với
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) — speculative decoding, kiểu song song hóa trong chuỗi mà Hogwild! kết hợp với
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) — nguồn chuẩn duy nhất cho các thử nghiệm của bài báo
