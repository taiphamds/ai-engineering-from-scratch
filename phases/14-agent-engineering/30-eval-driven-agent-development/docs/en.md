# Eval-Driven Agent Development

> Hướng dẫn của Anthropic: "bắt đầu với các prompt đơn giản, tối ưu hóa chúng bằng đánh giá toàn diện và chỉ thêm các hệ thống agentic nhiều bước khi cần." Đánh giá không phải bước cuối. Đó là vòng lặp bên ngoài thúc đẩy mọi lựa chọn khác trong Giai đoạn 14.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** All of Phase 14.
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên ba lớp đánh giá — các benchmark tĩnh, ngoại tuyến tùy chỉnh, sản xuất trực tuyến — và mỗi lớp dùng để làm gì.
- Giải thích vòng lặp chặt chẽ bộ đánh giá-bộ tối ưu.
- Mô tả thực hành tốt nhất năm 2026: các đánh giá nằm cạnh mã, chạy trong CI, kiểm soát các PR.
- Kết nối mọi bài học Giai đoạn 14 với trường hợp đánh giá mà nó tạo ra.

## The Problem

Các agent vượt qua các bản demo. Chúng thất bại trong sản xuất theo những cách mà các bản demo không thể dự đoán. Các benchmark trả lời "mô hình này có năng lực rộng không?" không phải "agent này có đang phát hành các bản vá đúng cho sản phẩm của tôi không?" Câu trả lời: đánh giá ở ba lớp, chạy liên tục, với mỗi chốt bảo vệ và quy tắc đã học được ánh xạ đến một trường hợp đánh giá.

## The Concept

### Three evaluation layers

1. **Các benchmark tĩnh** — SWE-bench Verified cho mã (Bài 19), WebArena/OSWorld cho duyệt web / máy tính để bàn (Bài 20), GAIA cho tổng quát (Bài 19), BFCL V4 cho sử dụng công cụ (Bài 06). Sử dụng để so sánh xuyên mô hình và kiểm soát hồi quy. Nhiễm bẩn là thực: SWE-bench+ phát hiện rò rỉ lời giải 32.67%. Luôn báo cáo các điểm Verified / được kiểm toán bằng +.

2. **Các đánh giá ngoại tuyến tùy chỉnh** — hình dạng sản phẩm của bạn:
   - LLM làm giám khảo (Langfuse, Phoenix, Opik — Bài 24).
   - Dựa trên thực thi (chạy bản vá, kiểm tra các kiểm thử).
   - Dựa trên quỹ đạo (so sánh các chuỗi hành động với chuẩn; OSWorld-Human cho thấy các agent hàng đầu gấp 1.4-2.7 lần chuẩn).

3. **Các đánh giá trực tuyến** — sản xuất:
   - Các lần phát lại phiên (Langfuse).
   - Các cảnh báo được kích hoạt bởi chốt bảo vệ (Bài 16, 21).
   - Theo dõi chi phí / độ trễ cho từng bước (các span OTel Bài 23).

### Evaluator-optimizer (Anthropic)

Vòng lặp chặt chẽ:

1. Bộ đề xuất tạo đầu ra.
2. Bộ đánh giá phán xét.
3. Tinh chỉnh cho đến khi bộ đánh giá đạt.

Đây là Self-Refine (Bài 05) được khái quát hóa. Bất kỳ luồng agent nào bạn quan tâm cũng có thể được bọc trong bộ đánh giá-bộ tối ưu để có độ tin cậy.

### 2026 best practice

- Các đánh giá nằm cạnh mã.
- Chạy trong CI trên mỗi PR.
- Kiểm soát hợp nhất bằng các điểm đánh giá (ví dụ "không hồi quy > 5% so với main").
- Mỗi chốt bảo vệ ánh xạ đến một trường hợp đánh giá.
- Mỗi quy tắc đã học (Reflexion, learn-rule của pro-workflow) ánh xạ đến một trường hợp thất bại.

### Tying Phase 14 together

Mọi bài học trong Giai đoạn 14 tạo các trường hợp đánh giá:

| Bài học | Trường hợp đánh giá nó tạo ra |
|--------|------------------------|
| 01 Vòng lặp agent | Cạn ngân sách, bộ bảo vệ vòng lặp vô hạn |
| 02 ReWOO | Bộ lập kế hoạch lập kế hoạch lại đúng khi một công cụ thất bại |
| 03 Reflexion | Các phản tư đã học được áp dụng khi thử lại |
| 05 Self-Refine/CRITIC | Giám khảo cho đầu ra đã tinh chỉnh đạt |
| 06 Sử dụng công cụ | Ép kiểu đối số hoạt động; các công cụ không xác định bị từ chối |
| 07-10 Bộ nhớ | Các trích dẫn truy xuất khớp nguồn; các sự thật cũ được vô hiệu hóa |
| 12 Các mẫu workflow | Mỗi mẫu tạo đầu ra đúng |
| 13 LangGraph | Tiếp tục tái tạo trạng thái chính xác |
| 14 Các actor AutoGen | DLQ bắt các bộ xử lý bị sập |
| 16 OpenAI Agents SDK | Chốt bảo vệ kích hoạt trên các đầu vào đúng |
| 17 Claude Agent SDK | Các kết quả agent phụ trả về bộ điều phối |
| 19-20 Các benchmark | Điểm SWE-bench Verified, tỷ lệ thành công WebArena, hiệu quả OSWorld |
| 21 Sử dụng máy tính | An toàn cho từng bước bắt DOM bị chèn |
| 23 OTel | Các span phát ra các thuộc tính bắt buộc |
| 26 Các chế độ lỗi | Các bộ phát hiện gắn thẻ các lỗi đã biết |
| 27 Prompt injection | PVE từ chối các kết quả truy xuất bị đầu độc |
| 28 Điều phối | Bộ giám sát định tuyến đến đúng chuyên gia |
| 29 Các hình dạng runtime | DLQ xử lý N% thất bại |

Nếu bộ đánh giá của bạn có các trường hợp cho mỗi bài, bạn đã bao phủ Giai đoạn 14.

### Where eval-driven development fails

- **Không có đường cơ sở.** Các đánh giá không có một trạng thái tốt cuối cùng đã biết thì không thể đọc hiểu. Lưu các đường cơ sở.
- **Giám khảo LLM không có cơ sở.** Các giám khảo cũng ảo giác. Mẫu CRITIC (Bài 05) — giám khảo dựa trên các công cụ bên ngoài.
- **Quá khớp với các đánh giá.** Tối ưu cho đánh giá đi chệch khỏi tính hữu ích trong sản xuất. Xoay vòng các trường hợp.
- **Các đánh giá chập chờn.** Các trường hợp không mang tính xác định gây báo động giả. Ghim các hạt giống, chụp trạng thái.

```figure
ae-eval-three-layers
```

## Build It

`code/main.py` là một bộ đánh giá dùng thư viện chuẩn:

- Sổ đăng ký trường hợp với các hạng mục (benchmark, tùy chỉnh, trực tuyến).
- Một agent được viết kịch bản đang được kiểm thử.
- Vòng lặp bộ đánh giá-bộ tối ưu: đề xuất, phán xét, tinh chỉnh cho đến khi đạt hoặc số vòng tối đa.
- Cổng CI: tỷ lệ đạt tổng hợp + hồi quy đối với đường cơ sở.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: đạt/không đạt cho từng trường hợp, cờ hồi quy, phán quyết cổng CI.

## Use It

- Viết các trường hợp đánh giá trong cùng repo với mã agent của bạn.
- Chạy chúng trên mỗi PR qua CI.
- Làm bản dựng thất bại khi hồi quy.
- Theo dõi tỷ lệ đạt theo thời gian.
- Gắn mọi thất bại sản xuất với một trường hợp mới.

## Ship It

`outputs/skill-eval-suite.md` xây dựng một bộ đánh giá ba lớp cho một sản phẩm agent với các cổng CI và theo dõi hồi quy.

## Exercises

1. Lấy một trong các thất bại sản xuất của bạn. Viết một trường hợp đánh giá tái tạo nó. Agent của bạn có vượt qua nó bây giờ không?
2. Xây một bảng tiêu chí giám khảo LLM cho miền của bạn với ba chiều (thực tế, giọng điệu, phạm vi). Chấm điểm 50 phiên.
3. Nối bộ đánh giá vào CI. Làm bản dựng thất bại khi hồi quy >=5%.
4. Thêm một thước đo hiệu quả quỹ đạo: agent đã thực hiện bao nhiêu bước so với một quỹ đạo chuẩn?
5. Ánh xạ mọi bài học Giai đoạn 14 đến một trường hợp đánh giá trong bộ của bạn. Có thiếu bài nào không? Đó là một khoảng trống cần lấp.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Static benchmark (Benchmark tĩnh) | "Đánh giá có sẵn" | SWE-bench, GAIA, AgentBench, WebArena, OSWorld |
| Custom offline eval (Đánh giá ngoại tuyến tùy chỉnh) | "Đánh giá miền" | LLM làm giám khảo / thực thi / quỹ đạo trên hình dạng sản phẩm của bạn |
| Online eval (Đánh giá trực tuyến) | "Đánh giá sản xuất" | Phát lại phiên, các cảnh báo chốt bảo vệ, theo dõi chi phí/độ trễ |
| Evaluator-optimizer (Bộ đánh giá-bộ tối ưu) | "Đề xuất-phán xét-tinh chỉnh" | Lặp cho đến khi giám khảo cho đạt |
| CI gate (Cổng CI) | "Bộ chặn hợp nhất" | Làm bản dựng thất bại khi đánh giá hồi quy |
| Baseline (Đường cơ sở) | "Tốt cuối cùng đã biết" | Điểm tham chiếu để phát hiện hồi quy |
| Trajectory efficiency (Hiệu quả quỹ đạo) | "Số bước trên chuẩn" | Số bước agent chia cho số tối thiểu của chuyên gia con người |

## Further Reading

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — "bắt đầu đơn giản, tối ưu với các đánh giá"
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — benchmark được tuyển chọn
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) — benchmark sử dụng công cụ
- [Langfuse docs](https://langfuse.com/) — các đánh giá + phát lại phiên trong thực tế
