# Failure Modes: Why Agents Break

> MASFT (Berkeley, 2025) lập danh mục 14 chế độ lỗi nhiều agent trong 3 hạng mục. Taxonomy của Microsoft tài liệu hóa cách các lỗi AI hiện có khuếch đại trong các bối cảnh agentic. Dữ liệu thực địa trong ngành hội tụ vào năm chế độ tái diễn: các hành động ảo giác, mở rộng phạm vi, lỗi dây chuyền, mất ngữ cảnh, dùng sai công cụ.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 05 (Self-Refine and CRITIC), Phase 14 · 24 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên ba hạng mục lỗi của MASFT và ít nhất bốn chế độ cụ thể trong mỗi hạng mục.
- Giải thích vì sao lỗi agentic khuếch đại các chế độ lỗi AI hiện có (thiên lệch, ảo giác).
- Mô tả năm chế độ tái diễn trong ngành và các biện pháp giảm thiểu của chúng.
- Triển khai một bộ phát hiện dùng thư viện chuẩn gắn các nhãn chế độ lỗi vào các trace agent.

## The Problem

Các nhóm phát hành các agent hoạt động trên 90% trace. 10% thất bại không phải nhiễu ngẫu nhiên — chúng rơi vào một số ít hạng mục tái diễn. Khi bạn có thể gọi tên chúng, bạn có thể giám sát chúng và khắc phục chúng.

## The Concept

### MASFT (Berkeley, arXiv:2503.13657)

Hệ phân loại lỗi hệ thống nhiều agent. 14 chế độ lỗi được phân cụm thành 3 hạng mục. Cohen's Kappa giữa các bên chú thích là 0.88 — các hạng mục có thể phân biệt đáng tin cậy.

Tuyên bố trung tâm: các lỗi là những thiếu sót thiết kế cơ bản trong các hệ thống nhiều agent, không phải các hạn chế LLM cần được khắc phục bằng các mô hình cơ sở tốt hơn.

### Microsoft Taxonomy of Failure Mode in Agentic AI Systems

- Các lỗi AI hiện có (thiên lệch, ảo giác, rò rỉ dữ liệu) khuếch đại trong các bối cảnh agentic.
- Các lỗi mới xuất hiện từ tính tự chủ: hành động ngoài ý muốn ở quy mô lớn, dùng sai công cụ, trôi dạt nhiệm vụ.
- Sách trắng là sổ đăng ký rủi ro cho các sản phẩm agentic.

### Characterizing Faults in Agentic AI (arXiv:2603.06847)

- Các lỗi phát sinh từ điều phối, tiến hóa trạng thái nội bộ và tương tác môi trường.
- Không chỉ "mã tệ" hoặc "đầu ra mô hình tệ."

### LLM Agent Hallucinations Survey (arXiv:2509.18970)

Hai biểu hiện chính:

1. **Lệch khỏi việc làm theo chỉ dẫn** — agent không làm theo system prompt.
2. **Dùng sai ngữ cảnh tầm xa** — agent quên hoặc áp dụng sai ngữ cảnh từ các lượt trước.

Các lỗi ý định con: Bỏ sót (thiếu bước), Dư thừa (lặp bước), Sai thứ tự (các bước không đúng thứ tự).

### The five industry-recurring modes

Các phân tích thực địa 2024-2026 của Arize, Galileo, NimbleBrain hội tụ vào:

1. **Các hành động ảo giác.** Agent gọi một công cụ không tồn tại hoặc bịa các đối số.
2. **Mở rộng phạm vi.** Agent mở rộng tác vụ vượt yêu cầu của người dùng (tạo thêm PR, gửi thêm email).
3. **Các lỗi dây chuyền.** Một lời gọi sai kích hoạt các hiệu ứng hạ nguồn. Một ảo giác SKU không có thật kích hoạt bốn lời gọi API — một sự cố nhiều hệ thống.
4. **Mất ngữ cảnh.** Các tác vụ tầm dài quên các ràng buộc ở lượt đầu.
5. **Dùng sai công cụ.** Gọi đúng công cụ với các đối số sai, hoặc gọi hoàn toàn sai công cụ.

Dây chuyền là thứ gây chết người. Các agent không thể phân biệt "tôi đã thất bại" với "tác vụ là bất khả thi" và thường ảo giác một thông điệp thành công trên các lỗi 400 để khép vòng lặp.

### Mitigation: gates at every step

Các cổng xác minh tự động ở mỗi bước của một chuỗi suy luận, kiểm tra cơ sở thực tế đối với trạng thái môi trường. Cụ thể:

- Bộ phân loại an toàn cho từng bước (Bài 21).
- Xác thực đối số lời gọi công cụ (Bài 06).
- Kiểm tra chéo nội dung được truy xuất với các sự thật đã biết (Bài 05, CRITIC).
- Phát hiện ảo giác thành công bằng cách thăm dò lại trạng thái (file có thực sự được tạo không?).

### Where failure monitoring goes wrong

- **Chỉ gắn thẻ các lần sập.** Hầu hết các lỗi agent tạo đầu ra trông hợp lệ. Cần các kiểm tra cấp nội dung.
- **Không có đường cơ sở.** Phát hiện trôi dạt cần một trạng thái tốt cuối cùng đã biết; không có nó bạn không thể nói "điều này đang tệ hơn."
- **Cảnh báo quá mức.** Mỗi lỗi tạo một thông báo gọi trực. Phân cụm và giới hạn tốc độ.

```figure
failure-cascade
```

## Build It

`code/main.py` triển khai một bộ gắn thẻ chế độ lỗi dùng thư viện chuẩn:

- Một tập dữ liệu trace tổng hợp bao phủ năm chế độ.
- Các hàm phát hiện cho từng chế độ (các mẫu dấu hiệu trên lời gọi công cụ, đầu ra, hành động lặp).
- Một bộ gắn thẻ ghi nhãn mỗi trace và báo cáo phân phối chế độ.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: các nhãn cho từng trace + phân phối tổng hợp, một bản tái tạo rẻ của những gì phân cụm trace của Phoenix phơi bày.

## Use It

- **Phoenix** cho phân cụm trôi dạt sản xuất (Bài 24).
- **Langfuse** cho phát lại phiên + chú thích.
- **Tùy chỉnh** cho các dấu hiệu dành riêng cho miền mà nền tảng khả năng quan sát của bạn không thể phát hiện.

## Ship It

`outputs/skill-failure-detector.md` tạo các bộ phát hiện chế độ lỗi được điều chỉnh cho miền của bạn, được nối với một kho trace.

## Exercises

1. Thêm một bộ phát hiện "ảo giác thành công": agent trả về thành công nhưng trạng thái đích không thay đổi.
2. Gắn thẻ 100 trace thực từ một sản phẩm bạn đã xây dựng. Chế độ nào chiếm ưu thế? Chi phí khắc phục nó là gì?
3. Triển khai một thước đo "bán kính dây chuyền": với một lỗi tại bước N, nó ảnh hưởng bao nhiêu bước hạ nguồn?
4. Đọc 14 chế độ lỗi của MASFT. Chọn ba chế độ áp dụng cho sản phẩm của bạn. Viết các bộ phát hiện.
5. Nối một bộ phát hiện vào một job CI: làm bản dựng thất bại nếu >=5% trace gắn thẻ một chế độ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| MASFT | "Hệ phân loại lỗi nhiều agent" | Phân loại 14 chế độ của Berkeley |
| Cascading error (Lỗi dây chuyền) | "Lỗi lan tỏa" | Một sai lầm sớm lan truyền qua N bước |
| Context loss (Mất ngữ cảnh) | "Quên ràng buộc" | Lượt tầm dài làm rơi các sự thật ở lượt đầu |
| Tool misuse (Dùng sai công cụ) | "Sai công cụ / sai đối số" | Lời gọi hợp lệ, gọi sai |
| Success hallucination (Ảo giác thành công) | "Hoàn thành giả" | Agent tuyên bố thành công trên một lỗi 400; trạng thái không thay đổi |
| Scope creep (Mở rộng phạm vi) | "Vượt quá" | Agent làm nhiều hơn được yêu cầu |
| Instruction-following deviation (Lệch khỏi việc làm theo chỉ dẫn) | "Không tuân lệnh" | Bỏ qua system prompt hoặc ràng buộc người dùng |
| Sub-intention errors (Các lỗi ý định con) | "Các lỗi kế hoạch" | Bỏ sót, dư thừa, sai thứ tự trong thực thi kế hoạch |

## Further Reading

- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) — 14 chế độ lỗi, 3 hạng mục
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) — sổ đăng ký rủi ro
- [Arize Phoenix](https://docs.arize.com/phoenix) — phân cụm trôi dạt trong thực tế
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — khi nào các mẫu đơn giản hơn tránh hoàn toàn các chế độ
