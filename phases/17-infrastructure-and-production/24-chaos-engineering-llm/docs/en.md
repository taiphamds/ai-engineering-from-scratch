# Chaos Engineering for LLM Production

> Kỹ thuật hỗn loạn cho LLM là một chuyên môn riêng năm 2026. Điều kiện tiên quyết trước khi chạy thí nghiệm trong sản xuất: SLI/SLO đã xác định, khả năng quan sát dấu vết+chỉ số+log, hoàn tác tự động, cẩm nang vận hành, trực. Kiến trúc có bốn mặt phẳng: điều khiển (bộ lập lịch thí nghiệm), mục tiêu (dịch vụ, hạ tầng, kho dữ liệu), an toàn (chốt bảo vệ + hủy + bộ lọc lưu lượng), khả năng quan sát (chỉ số + dấu vết + log), phản hồi (vào điều chỉnh SLO). Chốt bảo vệ là bắt buộc: cảnh báo tốc độ tiêu hao tạm dừng thí nghiệm nếu tiêu hao ngân sách lỗi hằng ngày > 2x dự kiến; cửa sổ ức chế + tương quan ID dấu vết khử trùng lặp nhiễu cảnh báo. Nhịp: canary nhỏ hằng tuần + rà soát SLO; ngày diễn tập hằng tháng + hậu kiểm; kiểm toán khả năng chống chịu xuyên nhóm hằng quý + lập bản đồ phụ thuộc. Thí nghiệm riêng cho LLM: quá tải bộ nhớ, lỗi mạng, nhà cung cấp ngừng hoạt động, prompt sai dạng, bão loại bỏ bộ nhớ đệm KV. Công cụ: Harness Chaos Engineering (khuyến nghị suy ra từ LLM, thu nhỏ bán kính ảnh hưởng, tích hợp công cụ MCP); LitmusChaos (CNCF); Chaos Mesh (nguyên bản Kubernetes CNCF).

**Type:** Learn
**Languages:** Python (stdlib, toy chaos experiment runner)
**Prerequisites:** Phase 17 · 23 (SRE for AI), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Nêu năm điều kiện tiên quyết kỹ thuật hỗn loạn (SLI/SLO, khả năng quan sát, hoàn tác, cẩm nang vận hành, trực) và giải thích tại sao bỏ qua bất kỳ điều kiện nào phá vỡ thực hành.
- Vẽ sơ đồ bốn mặt phẳng (điều khiển, mục tiêu, an toàn, khả năng quan sát) và vòng phản hồi vào SLO.
- Liệt kê năm thí nghiệm riêng cho LLM (quá tải bộ nhớ, lỗi mạng, nhà cung cấp ngừng hoạt động, prompt sai dạng, bão loại bỏ KV).
- Chọn công cụ — Harness, LitmusChaos, Chaos Mesh — với ngăn xếp đã cho.

## The Problem

Kiểm thử hỗn loạn trong ngăn xếp truyền thống đã được thiết lập. Ngăn xếp LLM thêm chế độ lỗi mới. Một prompt 4K token có ký tự độc làm tokenizer đình trệ 12 giây. Nhà cung cấp thượng nguồn trả 429; gateway của bạn thử lại; dịch vụ của bạn OOM vì độ đồng thời khuếch đại bởi thử lại. Một cơn bão loại bỏ bộ nhớ đệm KV dưới tải đột biến gây các chuỗi prefill lại làm bão hòa tính toán.

Không điều nào trong số này xuất hiện trong kiểm thử đơn vị. Kỹ thuật hỗn loạn là cách bạn khám phá chúng trước người dùng.

## The Concept

### Prerequisites

Không chạy hỗn loạn trong sản xuất nếu thiếu:

1. **SLI/SLO** — chỉ báo và mục tiêu cấp dịch vụ đã xác định.
2. **Khả năng quan sát** — dấu vết, chỉ số, log, được nối với bảng điều khiển.
3. **Hoàn tác tự động** — hoàn tác bằng cờ chính sách Giai đoạn 17 · 20.
4. **Cẩm nang vận hành** — có cấu trúc, Giai đoạn 17 · 23.
5. **Trực** — có người phản ứng.

Thiếu bất kỳ điều nào nghĩa là hỗn loạn trở thành sự cố thật.

### Four planes + feedback

**Mặt phẳng điều khiển** — bộ lập lịch thí nghiệm (workflow Litmus, lịch Chaos Mesh, UI Harness).

**Mặt phẳng mục tiêu** — dịch vụ, pod, nút, bộ cân bằng tải, kho dữ liệu.

**Mặt phẳng an toàn** — công tắc ngắt, cửa sổ ức chế, giới hạn bán kính ảnh hưởng, cổng ngân sách lỗi.

**Mặt phẳng khả năng quan sát** — chỉ số bình thường + tương quan ID dấu vết để phân biệt lỗi do hỗn loạn với lỗi tự nhiên.

**Vòng phản hồi** — phát hiện được đưa trở lại điều chỉnh SLO, cập nhật cẩm nang vận hành, sửa mã.

### Guardrails are mandatory

- **Cảnh báo tốc độ tiêu hao**: tạm dừng thí nghiệm nếu tiêu hao ngân sách lỗi hằng ngày vượt 2x dự kiến.
- **Cửa sổ ức chế**: tắt các cảnh báo không thuộc thí nghiệm trong bán kính ảnh hưởng trong thời gian thí nghiệm.
- **Tương quan ID dấu vết**: mọi lỗi do thí nghiệm gây ra mang thẻ để người trực có thể khử trùng lặp.

### Five LLM-specific experiments

1. **Quá tải bộ nhớ** — ép một cơn bão tạm chiếm bộ nhớ đệm KV bằng cách gửi yêu cầu ngữ cảnh dài với độ đồng thời cao. Quan sát: dịch vụ có giảm tải êm hay sập?

2. **Lỗi mạng** — cắt kết nối giữa gateway suy luận và nhà cung cấp. Quan sát: dự phòng có kích hoạt trong SLA không? (Giai đoạn 17 · 19)

3. **Mô phỏng nhà cung cấp ngừng hoạt động** — 100% 429 từ OpenAI. Quan sát: định tuyến có chuyển đổi dự phòng sang Anthropic không? (Giai đoạn 17 · 16, 19)

4. **Prompt sai dạng** — chèn payload làm tokenizer đình trệ (ví dụ: unicode lồng sâu, điểm mã UTF-8 khổng lồ). Quan sát: một yêu cầu đơn lẻ có làm worker bị khóa cứng không?

5. **Bão loại bỏ KV** — ép loại bỏ bằng cách bão hòa ngân sách block vLLM. Quan sát: LMCache có khôi phục hay dịch vụ suy giảm?

### Cadence

- **Hằng tuần** — thí nghiệm canary nhỏ trong staging, có thể 5% sản xuất.
- **Hằng tháng** — ngày diễn tập được lên lịch cho một kịch bản cụ thể; các nhóm tham dự; hậu kiểm.
- **Hằng quý** — kiểm toán khả năng chống chịu xuyên nhóm; cập nhật bản đồ phụ thuộc.

### Tooling

- **Harness Chaos Engineering** — thương mại; khuyến nghị thí nghiệm suy ra từ AI; thu nhỏ bán kính ảnh hưởng; tích hợp công cụ MCP.
- **LitmusChaos** — CNCF đã tốt nghiệp; dựa trên workflow Kubernetes.
- **Chaos Mesh** — CNCF sandbox; kiểu CRD nguyên bản Kubernetes.
- **Gremlin** — thương mại; hỗ trợ rộng.
- **AWS FIS** / **Azure Chaos Studio** — dịch vụ đám mây được quản lý.

### Starting small

Thí nghiệm đầu tiên: diệt pod một bản sao decode dưới lưu lượng ổn định. Quan sát định tuyến lại và khôi phục. Nếu việc này hoạt động và trông an toàn, tiến lên hỗn loạn mạng.

Thí nghiệm riêng cho LLM đầu tiên: chèn một lỗi 429 của nhà cung cấp trong 5 phút. Quan sát dự phòng. Hầu hết nhóm phát hiện dự phòng của họ chưa được kiểm thử đầy đủ.

### Numbers you should remember

- Bốn mặt phẳng: điều khiển, mục tiêu, an toàn, khả năng quan sát.
- Tạm dừng theo tốc độ tiêu hao: 2x tiêu hao ngân sách hằng ngày dự kiến.
- Nhịp: canary hằng tuần, ngày diễn tập hằng tháng, kiểm toán hằng quý.
- Năm thí nghiệm LLM: bộ nhớ, mạng, nhà cung cấp, prompt sai dạng, bão KV.

```figure
i4-chaos-guard
```

## Use It

`code/main.py` mô phỏng ba thí nghiệm hỗn loạn với cổng mặt phẳng an toàn. Báo cáo thí nghiệm nào sẽ kích hoạt hủy theo tốc độ tiêu hao.

## Ship It

Bài học này tạo ra `outputs/skill-chaos-plan.md`. Với ngăn xếp và mức trưởng thành, chọn ba thí nghiệm đầu tiên và công cụ.

## Exercises

1. Chạy `code/main.py`. Thí nghiệm nào kích hoạt cổng tốc độ tiêu hao và tại sao?
2. Thiết kế năm thí nghiệm hỗn loạn đầu tiên cho một dịch vụ RAG dựa trên vLLM. Bao gồm tiêu chí thành công.
3. Cảnh báo tốc độ tiêu hao của bạn đã tạm dừng thí nghiệm. Bạn xác định nguyên nhân gốc như thế nào — hỗn loạn hay tự nhiên?
4. Lập luận liệu hỗn loạn nên chạy trong sản xuất hay chỉ staging. Khi nào sản xuất là câu trả lời đúng?
5. Nêu ba chế độ lỗi riêng cho LLM mà hỗn loạn mạng tổng quát không thể tái tạo.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| SLI / SLO | "mục tiêu dịch vụ" | Chỉ báo + mục tiêu; điều kiện tiên quyết bắt buộc |
| Blast radius (Bán kính ảnh hưởng) | "phạm vi" | Tập dịch vụ / người dùng bị thí nghiệm ảnh hưởng |
| Burn-rate alert (Cảnh báo tốc độ tiêu hao) | "cổng ngân sách" | Kích hoạt khi tốc độ tiêu hao ngân sách lỗi > 2x dự kiến |
| Game day (Ngày diễn tập) | "diễn tập hằng tháng" | Bài tập hỗn loạn xuyên nhóm được lên lịch |
| LitmusChaos | "workflow CNCF" | Công cụ hỗn loạn Kubernetes CNCF đã tốt nghiệp |
| Chaos Mesh | "CRD CNCF" | Hỗn loạn nguyên bản Kubernetes CNCF sandbox |
| Harness CE | "thương mại có AI hỗ trợ" | Hỗn loạn Harness với khuyến nghị AI |
| Malformed prompt (Prompt sai dạng) | "bom tokenizer" | Đầu vào làm tokenization đình trệ |
| KV eviction storm (Bão loại bỏ KV) | "chuỗi tạm chiếm" | Loại bỏ hàng loạt kích hoạt prefill lại |

## Further Reading

- [DevSecOps School — Chaos Engineering 2026 Guide](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs (book)](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos (CNCF)](https://litmuschaos.io/)
- [Chaos Mesh (CNCF)](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
