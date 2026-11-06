# Benchmarks: SWE-bench, GAIA, AgentBench

> Ba benchmark làm điểm tựa cho đánh giá agent năm 2026. SWE-bench kiểm thử vá mã. GAIA kiểm thử sử dụng công cụ tổng quát. AgentBench kiểm thử suy luận nhiều môi trường. Biết thành phần của chúng, câu chuyện nhiễm bẩn của chúng và những gì chúng không đo lường.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên bộ kiểm thử của SWE-bench (FAIL_TO_PASS) và giải thích vì sao nó kiểm soát bằng các kiểm thử đơn vị.
- Giải thích vì sao SWE-bench Verified (OpenAI, 500 tác vụ) tồn tại và nó loại bỏ điều gì.
- Mô tả thiết kế của GAIA: đơn giản cho con người, khó cho AI; ba mức độ khó.
- Nêu tên tám môi trường của AgentBench và trở ngại chính của nó đối với các LLM mã nguồn mở.
- Tóm tắt phát hiện nhiễm bẩn SWE-bench+ và các hệ quả của nó.

## The Problem

Các bảng xếp hạng cho bạn biết mô hình nào thắng trên một benchmark. Chúng không cho bạn biết:

- Liệu benchmark có bị nhiễm bẩn không (các lời giải trong dữ liệu huấn luyện, rò rỉ kiểm thử).
- Liệu benchmark có đo điều bạn quan tâm không (mã so với duyệt web so với tổng quát).
- Liệu bộ đánh giá có vững chắc không (khớp AST, kiểm tra trạng thái, đánh giá bởi con người).

Biết ba benchmark làm điểm tựa và các chế độ lỗi của chúng trước khi bạn trích một con số.

## The Concept

### SWE-bench (Jimenez et al., ICLR 2024 oral)

- 2,294 issue GitHub thực từ 12 repo Python phổ biến.
- Agent nhận: cơ sở mã tại commit trước sửa chữa + mô tả issue bằng ngôn ngữ tự nhiên.
- Agent tạo: một bản vá.
- Bộ đánh giá: áp dụng bản vá, chạy bộ kiểm thử của repo. Bản vá phải đảo các kiểm thử FAIL_TO_PASS (trước đây thất bại, giờ đạt) mà không phá các kiểm thử PASS_TO_PASS.

SWE-agent (Yang và cộng sự, 2024) đạt 12.5% khi phát hành bằng cách nhấn mạnh các giao diện agent-máy tính (các lệnh biên tập file, cú pháp tìm kiếm mà mô hình hiểu).

### SWE-bench Verified

OpenAI, tháng 8 năm 2024. Tập con 500 tác vụ do con người tuyển chọn. Loại bỏ các issue mơ hồ, các kiểm thử không đáng tin cậy và các tác vụ mà cách sửa không rõ ràng. Benchmark chính cho "agent của bạn có phát hành các bản vá thực không?"

### Contamination

- Hơn 94% các issue SWE-bench có trước hầu hết các mốc cắt dữ liệu mô hình.
- **SWE-bench+** phát hiện 32.67% các bản vá thành công bị rò rỉ lời giải trong văn bản issue (mô hình nhìn thấy cách sửa trong mô tả), và 31.08% đáng ngờ do độ bao phủ kiểm thử yếu.
- Verified sạch hơn nhưng không miễn nhiễm bẩn.

Hệ quả thực tiễn: một mô hình đạt 50% trên SWE-bench có thể đạt 35% trên SWE-bench+. Luôn báo cáo cả hai nếu bạn tuyên bố hiệu năng SWE-bench.

### GAIA (Mialon et al., Nov 2023)

- 466 câu hỏi; 300 được giữ lại cho bảng xếp hạng riêng tại huggingface.co/gaia-benchmark.
- Triết lý thiết kế: "đơn giản về mặt khái niệm cho con người (92%) nhưng khó cho AI (GPT-4 với plugin: 15%)."
- Kiểm thử suy luận, đa phương thức, web, sử dụng công cụ.
- Ba mức độ khó; Mức 3 yêu cầu các chuỗi công cụ dài xuyên các phương thức.

GAIA là thứ bạn chạy để đo "khả năng tổng quát." Đừng nhầm với các benchmark dành riêng cho mã.

### AgentBench (Liu et al., ICLR 2024)

- 8 môi trường xuyên mã (Bash, DB, KG), trò chơi (Alfworld, LTP), web (WebShop, Mind2Web) và sinh mở.
- Nhiều lượt, ~4k-13k lượt cho mỗi phần chia.
- Phát hiện chính: suy luận dài hạn, ra quyết định và làm theo chỉ dẫn là các trở ngại để các LLM OSS bắt kịp các LLM thương mại.

### What these do not measure

- Chi phí vận hành thực tế (token, thời gian đồng hồ).
- Hành vi an toàn trong các điều kiện đối kháng.
- Hiệu năng trên miền của bạn (sử dụng các đánh giá riêng của bạn, Bài 30).
- Các lỗi đuôi (các benchmark lấy trung bình; người vận hành sản xuất quan tâm 1% tệ nhất).

### Where benchmarking goes wrong

- **Ám ảnh một con số duy nhất.** SWE-bench 50% cho bạn biết ít hơn chi phí P50/P75/P95 + phân phối số bước.
- **Các tuyên bố bị nhiễm bẩn.** Báo cáo SWE-bench mà không đề cập Verified hoặc SWE-bench+ là gây hiểu lầm.
- **Benchmark làm mục tiêu phát triển.** Tối ưu cho benchmark đi chệch khỏi tính hữu ích trong sản xuất.

```figure
ae-swebench-gate
```

## Build It

`code/main.py` triển khai một bộ kiểm thử mô phỏng giống SWE-bench:

- Các tác vụ sửa lỗi tổng hợp (3 tác vụ).
- Một "agent" được viết kịch bản đề xuất các bản vá.
- Một trình chạy kiểm thử kiểm tra FAIL_TO_PASS (lỗi giờ đã sửa) và PASS_TO_PASS (không có gì hỏng).
- Một bộ phân loại độ khó kiểu GAIA dựa trên độ sâu phân rã câu hỏi.

Chạy nó:

```
python3 code/main.py
```

Đầu ra cho thấy tỷ lệ giải quyết cho từng tác vụ + từng độ khó và làm cho các quy tắc bộ đánh giá trở nên cụ thể.

## Use It

- **SWE-bench Verified** cho các agent mã. Luôn báo cáo các điểm Verified.
- **GAIA** cho các agent tổng quát. Sử dụng phần chia bảng xếp hạng riêng.
- **AgentBench** cho so sánh nhiều môi trường.
- **Các đánh giá tùy chỉnh** (Bài 30) cho hình dạng thực tế của sản phẩm của bạn.

## Ship It

`outputs/skill-benchmark-harness.md` xây dựng một bộ kiểm thử kiểu SWE-bench cho bất kỳ cặp cơ sở mã-tác vụ nào với kiểm soát FAIL_TO_PASS / PASS_TO_PASS.

## Exercises

1. Chuyển bộ kiểm thử mô phỏng để chạy trên một repo thực (chọn một repo của bạn). Viết 3 kiểm thử FAIL_TO_PASS cho các lỗi đã biết.
2. Thêm một thước đo số bước. Trên 3 tác vụ của bạn, có bao nhiêu bước agent cho mỗi lần giải quyết?
3. Đọc bài báo SWE-bench+. Triển khai một kiểm tra rò rỉ lời giải (khớp mẫu văn bản issue với diff).
4. Tải một câu hỏi GAIA từ phần chia công khai. Truy vết điều một agent cỡ GPT-4 sẽ làm. Nó cần những công cụ nào?
5. Đọc phân tích theo từng môi trường của AgentBench. Môi trường nào phản chiếu bề mặt sản phẩm của bạn? "SOTA" trông như thế nào ở đó?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| SWE-bench | "Benchmark agent mã" | 2,294 issue GitHub; bản vá phải đảo các kiểm thử FAIL_TO_PASS |
| SWE-bench Verified | "SWE-bench sạch" | 500 tác vụ do con người tuyển chọn, OpenAI |
| FAIL_TO_PASS | "Cổng sửa lỗi" | Các kiểm thử trước đây thất bại phải đạt sau bản vá |
| PASS_TO_PASS | "Cổng không hồi quy" | Các kiểm thử đã đạt và phải vẫn đạt |
| GAIA | "Benchmark tổng quát" | 466 câu hỏi nhiều công cụ dễ cho người / khó cho AI |
| AgentBench | "Benchmark nhiều môi trường" | 8 môi trường; nhiều lượt tầm dài |
| Contamination (Nhiễm bẩn) | "Rò rỉ tập huấn luyện" | Các tác vụ benchmark hiện diện trong huấn luyện mô hình |
| SWE-bench+ | "Kiểm toán nhiễm bẩn" | Phát hiện 32.67% rò rỉ lời giải trong các bản vá SWE-bench thành công |

## Further Reading

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) — benchmark gốc
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — tập con được tuyển chọn
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) — benchmark tổng quát
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) — bộ kiểm thử nhiều môi trường
