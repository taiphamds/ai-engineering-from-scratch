# Evaluation and Coordination Benchmarks

> Năm benchmark giai đoạn 2025-2026 bao phủ không gian đánh giá đa agent. **MultiAgentBench / MARBLE** (ACL 2025, arXiv:2503.01935) đánh giá các cấu trúc liên kết hình sao/chuỗi/cây/đồ thị với các KPI cột mốc; **đồ thị tốt nhất cho nghiên cứu**, lập kế hoạch nhận thức thêm ~3% mức đạt cột mốc. **COMMA** đánh giá phối hợp thông tin bất đối xứng đa phương thức; các mô hình tiên tiến nhất bao gồm GPT-4o chật vật vượt một đường cơ sở ngẫu nhiên. **MedAgentBoard** (arXiv:2505.12371) bao phủ bốn danh mục tác vụ y khoa và thường thấy đa agent không chiếm ưu thế so với một LLM đơn lẻ. **AgentArch** (arXiv:2509.10769) đánh giá benchmark các kiến trúc agent doanh nghiệp kết hợp sử dụng công cụ + bộ nhớ + điều phối. **SWE-bench Pro** ([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)) có 1865 bài toán trên 41 repo trải các ứng dụng kinh doanh, dịch vụ B2B, và công cụ nhà phát triển; các mô hình tiên tiến nhất đạt ~23% trên Pro so với 70%+ trên Verified — một kiểm tra thực tế về nhiễm bẩn. Claude Opus 4.7 (tháng 4 năm 2026) được báo cáo ở **64.3%** trên Pro với phối hợp nhóm agent tường minh (chưa có nguồn sơ cấp Anthropic được công bố — coi là sơ bộ); Verdent (khung agent) đạt **76.1% pass@1** trên Verified ([báo cáo kỹ thuật Verdent](https://www.verdent.ai/blog/swe-bench-verified-technical-report)). **AAAI 2026 Bridge Program WMAC** (https://multiagents.org/2026/) là đầu mối cộng đồng năm 2026. Bài này xây dựng trên các chỉ số MARBLE, chạy một lượt quét cấu trúc liên kết theo chỉ số, và ghim quy tắc “chỉ vượt SWE-bench Verified không phải bằng chứng khái quát hóa”.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 15 (Voting and Debate Topology), Phase 16 · 23 (Failure Modes)
**Time:** ~75 minutes

## Problem

Khi một bài báo tuyên bố “hệ thống đa agent của chúng tôi tốt hơn”, câu hỏi là: tốt hơn gì, trên gì, được đo thế nào? Thời kỳ 2023-2024 của đánh giá đa agent hỗn loạn — mọi bên chọn các chỉ số riêng, các đường cơ sở riêng, và các tập tác vụ riêng. Các benchmark giai đoạn 2025-2026 áp đặt cấu trúc.

Không có các benchmark dùng chung, bạn không thể so sánh hai hệ thống đa agent một cách có ý nghĩa. Tệ hơn, không có các benchmark giữ riêng, các mô hình tiên tiến nhất có thể nhiễm bẩn. SWE-bench Verified trở nên nhiễm bẩn một phần trong các kho ngữ liệu huấn luyện vào giữa năm 2025; các điểm tiên tiến nhất bị thổi phồng; Pro được thiết kế như một kiểm tra thực tế không nhiễm bẩn.

Bài này liệt kê năm benchmark chuẩn năm 2026, nêu những gì mỗi benchmark đo, và dạy bạn đọc các tuyên bố benchmark một cách hoài nghi.

## Concept

### MultiAgentBench (MARBLE) — ACL 2025

arXiv:2503.01935. Đánh giá bốn cấu trúc liên kết phối hợp (hình sao, chuỗi, cây, đồ thị) trên các tác vụ nghiên cứu, lập trình, và lập kế hoạch. Các KPI dựa trên cột mốc theo dõi tiến bộ một phần thay vì chỉ thành công cuối cùng.

Các kết quả được đo:

- Cấu trúc liên kết **đồ thị** tốt nhất cho các kịch bản nghiên cứu; hỗ trợ phê bình bất kỳ bên nào với bất kỳ bên nào.
- **Chuỗi** tốt nhất cho lập trình tinh chỉnh từng bước.
- **Hình sao** tốt nhất cho hợp nhất sự kiện nhanh.
- **Thuế phối hợp** xuất hiện sau ~4 agent trên đồ thị.
- **Lập kế hoạch nhận thức** thêm ~3% mức đạt cột mốc trên các cấu trúc liên kết.

Sử dụng khi: bạn muốn so sánh các cấu trúc liên kết phối hợp trên cùng cơ sở. Repo MARBLE (https://github.com/ulab-uiuc/MARBLE) cung cấp bộ đánh giá.

### COMMA — multimodal asymmetric information

Bao phủ các tác vụ nơi các agent có các phương thức quan sát khác nhau và phải phối hợp mà không chia sẻ thông tin đầy đủ. Kết quả được báo cáo không dễ chịu: các mô hình tiên tiến nhất bao gồm GPT-4o chật vật vượt một **đường cơ sở ngẫu nhiên** trên cộng tác agent-agent trong COMMA. Tín hiệu là các phương thức đa agent chưa được huấn luyện đủ và chưa được đánh giá đủ — các LLM xử lý hợp tác một phương thức tương đối tốt; phối hợp đa phương thức sụp đổ.

Sử dụng khi: hệ thống của bạn có phối hợp đa phương thức hoặc thông tin bất đối xứng. Kết quả không hiệu ứng từ COMMA là một cảnh báo đo trước khi tuyên bố.

### MedAgentBoard — domain stress test

arXiv:2505.12371. Bốn danh mục tác vụ y khoa: chẩn đoán, lập kế hoạch điều trị, sinh báo cáo, giao tiếp bệnh nhân. So sánh đa agent với một LLM đơn lẻ với các hệ thống dựa trên quy tắc thông thường.

Phát hiện: đa agent KHÔNG chiếm ưu thế so với một LLM đơn lẻ trên hầu hết danh mục. Lợi thế đa agent hẹp — phân rã tác vụ giúp khi các tác vụ con có thể tách rõ (chẩn đoán + điều trị); nó gây hại khi chi phí phụ phối hợp vượt mức tăng chuyên biệt hóa (sinh báo cáo).

Sử dụng khi: lĩnh vực của bạn có các đường cơ sở một LLM đơn lẻ rõ ràng. Nếu bài học MedAgentBoard khái quát hóa, nhiều hệ thống đa agent được đề xuất bị thiết kế quá mức.

### AgentArch — enterprise architectures

arXiv:2509.10769. Các bối cảnh doanh nghiệp với sử dụng công cụ, bộ nhớ, và điều phối được xếp lớp cùng nhau. Benchmark tách đóng góp của mỗi lớp: thêm công cụ giúp bao nhiêu? Thêm bộ nhớ? Thêm điều phối đa agent?

Sử dụng khi: bạn đang thiết kế một ngăn xếp agent doanh nghiệp và cần lý giải mỗi lớp. AgentArch giúp tránh mua các tính năng bạn không thể đo giá trị.

### SWE-bench Pro — the reality check

arXiv:2509.16941. 1865 bài toán trên 41 kho mã trải các ứng dụng kinh doanh, dịch vụ B2B, và công cụ nhà phát triển. Được thiết kế để **không nhiễm bẩn** với các mốc cắt huấn luyện muộn hơn. Các mô hình tiên tiến nhất đạt ~23% trên Pro so với 70%+ trên Verified. Khoảng cách là tín hiệu nhiễm bẩn.

Các điểm tháng 4 năm 2026:
- Claude Opus 4.7 trên Pro: **64.3%** (được báo cáo với phối hợp nhóm agent tường minh; chưa có nguồn sơ cấp Anthropic được công bố — coi là sơ bộ).
- Verdent (khung agent) trên Verified: **76.1% pass@1** ([báo cáo kỹ thuật](https://www.verdent.ai/blog/swe-bench-verified-technical-report)).
- Các điểm thô tiên tiến nhất trên Pro không có khung agent: ~23-35% ([bài báo SWE-bench Pro](https://arxiv.org/abs/2509.16941)).

Điều rút ra: “chúng tôi vượt SWE-bench Verified” không còn là bằng chứng năng lực. Pro là kiểm tra cổng hiện tại. Khung nhóm agent tạo ra các mức tăng đo được trên Pro (chênh lệch ~30-40 điểm), là một trong các lập luận thực nghiệm mạnh nhất cho phối hợp đa agent năm 2026.

### AAAI 2026 WMAC

AAAI 2026 Bridge Program — Workshop on Multi-Agent Coordination (https://multiagents.org/2026/). Đầu mối cộng đồng năm 2026 cho nghiên cứu AI đa agent. Các bài báo được chấp nhận và kỷ yếu workshop là nơi chuẩn để đánh giá các phương pháp mới; ưu tiên các tuyên bố được WMAC chấp nhận hơn các bản tiền ấn phẩm arXiv cho các quyết định sản xuất.

### Read benchmark claims skeptically — the 2026 checklist

Khi ai đó tuyên bố một kết quả đa agent:

1. **Benchmark nào, phần chia nào?** SWE-bench Verified so với Pro rất quan trọng. Một con số được báo cáo trên sai phần chia là vô giá trị.
2. **Kiểm tra nhiễm bẩn.** Benchmark có được phát hành sau mốc cắt huấn luyện của mô hình không? Nếu không, xử lý thận trọng.
3. **So sánh đường cơ sở.** So với đường cơ sở một LLM đơn lẻ, so với ngẫu nhiên, so với công trình đa agent trước. Không phải “so với phiên bản chưa điều chỉnh của cùng hệ thống.”
4. **Ý nghĩa thống kê.** N lần thử, giá trị p, khoảng tin cậy. Các mô hình tiên tiến nhất có phương sai cao; các lần chạy đơn lẻ gây hiểu lầm.
5. **Đa dạng tác vụ.** Một tác vụ hay nhiều? Khái quát hóa quan trọng cho sản xuất.
6. **Tiết lộ chi phí.** Token theo từng tác vụ, thời gian thực. Một lời giải 90% ở chi phí 20x là một quyết định kinh doanh, không phải một tuyên bố năng lực.

### What none of the benchmarks measure well

- **Phối hợp tầm thời gian dài.** Nhiều ngày tương tác theo thời gian thực. Mọi benchmark hiện tại chạy ngắn.
- **Khả năng chống chịu đối kháng.** Điều gì xảy ra khi một agent độc hại hoặc bị xâm phạm?
- **Sự trôi khi triển khai.** Các benchmark tĩnh; các phân phối sản xuất dịch chuyển.
- **Hiệu năng chuẩn hóa theo chi phí.** Hầu hết các benchmark báo cáo độ chính xác thô, không phải độ chính xác mỗi đô la.

Xây benchmark nội bộ riêng cho trục bạn thực sự quan tâm thường là bước đi đúng.

```figure
a5-bench-gap
```

## Build It

`code/main.py` là một hướng dẫn từng bước không tương tác:

- Mô phỏng 3 hệ thống đa agent trên một tác vụ đồ chơi.
- Tính các chỉ số cột mốc kiểu MARBLE cho mỗi hệ thống.
- Chạy một kiểm tra nhiễm bẩn bằng cách giữ lại các tác vụ khỏi một tập “huấn luyện”.
- So sánh với một đường cơ sở ngẫu nhiên tường minh.
- In một bảng điểm các tuyên bố benchmark.

Chạy:

```bash
python3 code/main.py
```

Đầu ra kỳ vọng: bảng điểm hệ thống với độ chính xác thô, mức đạt cột mốc, chi phí mỗi tác vụ, chênh lệch so với đường cơ sở ngẫu nhiên, và một ghi chú kiểm tra nhiễm bẩn.

## Use It

`outputs/skill-benchmark-reader.md` đọc bất kỳ tuyên bố benchmark đa agent nào và áp dụng danh sách kiểm tra xem xét kỹ lưỡng. Đầu ra: một điểm và các lưu ý.

## Ship It

Kỷ luật đánh giá sản xuất:

- **Xây dựng một benchmark nội bộ** phản ánh phân phối sản xuất thực tế của bạn. Các benchmark công khai cung cấp thông tin nhưng không thay thế.
- **Bao gồm một đường cơ sở ngẫu nhiên** trong mọi so sánh. Nếu bạn không thể vượt ngẫu nhiên với một khoảng lớn trên một tác vụ phối hợp, tác vụ có thể được đặt không đúng.
- **Báo cáo chi phí cùng độ chính xác.** Chi phí token và thời gian thực. Các nhóm vận hành cần cả hai.
- **Xây dựng lại benchmark hằng quý.** Phân phối sản xuất dịch chuyển; các benchmark lỗi thời gây hiểu lầm.
- **Tránh quá khớp benchmark được công bố.** Nếu nhóm của bạn đang tối ưu cụ thể cho các con số SWE-bench Pro, bạn sẽ thụt lùi trên sản xuất.

## Exercises

1. Chạy `code/main.py`. Xác định hệ thống nào trong ba hệ thống mô phỏng có chi phí mỗi cột mốc tốt nhất. Nó có khớp hệ thống độ chính xác thô cao nhất không?
2. Đọc MultiAgentBench (arXiv:2503.01935). Với lĩnh vực tác vụ riêng, quyết định cấu trúc liên kết nào trong bốn cấu trúc MARBLE sẽ đề xuất. Giải thích từ các kết quả bài báo.
3. Đọc bài báo SWE-bench Pro. Điều gì cụ thể khiến nó chống nhiễm bẩn? Cùng kỹ thuật có thể áp dụng cho các benchmark khác bạn quan tâm không?
4. Đọc phát hiện COMMA về phối hợp đa phương thức. Thiết kế một tác vụ phối hợp đa phương thức đơn giản bạn có thể thêm vào benchmark nội bộ. Điều gì sẽ được tính là một tín hiệu hữu ích?
5. Áp dụng danh sách kiểm tra các tuyên bố benchmark cho kết quả nổi bật của một bài báo đa agent gần đây. Bạn sẽ cho tuyên bố điểm nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| MARBLE | “MultiAgentBench” | ACL 2025; các cấu trúc liên kết hình sao/chuỗi/cây/đồ thị với các KPI cột mốc. |
| COMMA | “Benchmark đa phương thức” | Phối hợp thông tin bất đối xứng đa phương thức; các mô hình tiên tiến nhất chật vật so với ngẫu nhiên. |
| MedAgentBoard | “Kiểm thử sức chịu đựng theo lĩnh vực” | Bốn danh mục y khoa; thường thấy đa agent không chiếm ưu thế so với một LLM đơn lẻ. |
| AgentArch | “Benchmark doanh nghiệp” | Công cụ + bộ nhớ + điều phối được xếp lớp. |
| SWE-bench Pro | “Chống nhiễm bẩn” | 1865 bài toán, 41 repo; ~23% so với 70%+ trên Verified (tín hiệu nhiễm bẩn). |
| Milestone achievement (Mức đạt cột mốc) | “Điểm một phần” | Các benchmark thưởng tiến bộ, không chỉ thành công cuối cùng. |
| Contamination (Nhiễm bẩn) | “Benchmark rò rỉ vào huấn luyện” | Sau phát hành, các benchmark trôi vào các kho ngữ liệu huấn luyện; các điểm bị thổi phồng. |
| WMAC | “AAAI 2026 Bridge Program” | Workshop on Multi-Agent Coordination; đầu mối cộng đồng. |

## Further Reading

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) — benchmark cấu trúc liên kết với các KPI cột mốc
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) — triển khai tham chiếu
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) — kiểm thử sức chịu đựng theo lĩnh vực; đa agent thường không chiếm ưu thế
- [AgentArch](https://arxiv.org/abs/2509.10769) — các kiến trúc agent doanh nghiệp
- [SWE-bench leaderboards](https://www.swebench.com/) — các điểm Verified và Pro cho các mô hình tiên tiến nhất
- [AAAI 2026 WMAC](https://multiagents.org/2026/) — đầu mối cộng đồng năm 2026
