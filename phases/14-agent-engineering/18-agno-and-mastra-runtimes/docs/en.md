# Production Agent Runtimes — Fast Instantiation and Typed Workflows

> Một runtime agent sản xuất tối ưu hóa những gì các framework tạo nguyên mẫu bỏ qua: chi phí khởi tạo, các bề mặt workflow có kiểu và một backend sẵn sàng phục vụ. Cặp đôi năm 2026: Agno (Python) hướng đến khởi tạo agent ở mức micro giây và các backend FastAPI không trạng thái. Mastra cung cấp các agent, công cụ, workflow, định tuyến mô hình thống nhất và lưu trữ tổng hợp trên nền Vercel AI SDK.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Learning Objectives

- Nhận diện các mục tiêu hiệu năng của Agno và khi nào chúng quan trọng.
- Nêu tên ba thành phần nguyên thủy của Mastra — Agents, Tools, Workflows — và các bộ điều hợp máy chủ được hỗ trợ.
- Giải thích vì sao một backend FastAPI không trạng thái có phạm vi phiên là đường sản xuất Agno được khuyến nghị.
- Chọn Agno so với Mastra cho một stack cho trước (ưu tiên Python so với ưu tiên TypeScript).

## The Problem

LangGraph, AutoGen, CrewAI nặng về framework. Các nhóm muốn "chỉ vòng lặp agent, nhanh, trong runtime của tôi" chọn Agno (Python) hoặc Mastra (TypeScript). Cả hai đánh đổi một số thành phần nguyên thủy do framework sở hữu lấy tốc độ thuần và sự phù hợp chặt hơn với stack xung quanh.

## The Concept

### Agno

- Runtime Python, trước đây là Phi-data.
- "Không đồ thị, chuỗi hoặc các mẫu phức tạp — chỉ python thuần."
- Các mục tiêu hiệu năng từ tài liệu của họ: khởi tạo agent ~2μs, bộ nhớ ~3.75 KiB cho mỗi agent, ~23 nhà cung cấp mô hình.
- Đường sản xuất: backend FastAPI không trạng thái có phạm vi phiên. Mỗi yêu cầu bắt đầu một agent mới; trạng thái phiên tồn tại trong một cơ sở dữ liệu.
- Đa phương thức gốc (văn bản, hình ảnh, âm thanh, video, file) và RAG agentic.

Các mục tiêu tốc độ quan trọng khi bạn có hàng nghìn agent sống ngắn mỗi giây (gom luồng chat, các pipeline đánh giá). Chúng ít quan trọng hơn khi một agent chạy trong 10 phút.

### Mastra

- TypeScript, được xây dựng trên Vercel AI SDK.
- Ba thành phần nguyên thủy: **Agents**, **Tools** (định kiểu bằng Zod), **Workflows**.
- Unified Model Router — 3,300+ mô hình xuyên 94 nhà cung cấp (tháng 3 năm 2026).
- Lưu trữ tổng hợp: bộ nhớ, workflow, khả năng quan sát đến các backend khác nhau; ClickHouse được khuyến nghị cho khả năng quan sát ở quy mô lớn.
- Apache 2.0 với các thư mục `ee/` theo giấy phép doanh nghiệp có sẵn mã nguồn.
- Các bộ điều hợp máy chủ cho Express, Hono, Fastify, Koa; tích hợp Next.js và Astro hạng nhất.
- Cung cấp Mastra Studio (localhost:4111) để gỡ lỗi.
- 22k+ sao GitHub, 300k+ lượt tải npm hàng tuần tại 1.0 (tháng 1 năm 2026).

### Positioning

Không bên nào đang cố trở thành LangGraph. Họ cạnh tranh về:

- **Sự phù hợp ngôn ngữ.** Agno cho các nhóm ưu tiên Python; Mastra cho ưu tiên TypeScript.
- **Tính thuận tiện runtime.** Agno = chi phí phụ gần bằng không; Mastra = tích hợp với hệ sinh thái Vercel.
- **Khả năng quan sát.** Cả hai tích hợp với Langfuse/Phoenix/Opik (Bài 24) nhưng Mastra Studio là chính chủ.

### When to pick each

- **Agno** — backend Python, nhiều agent sống ngắn, các yêu cầu hiệu năng mạnh, đơn vị dùng FastAPI.
- **Mastra** — backend TypeScript, triển khai Next.js / Vercel, định tuyến mô hình nhiều nhà cung cấp thống nhất, các công cụ định kiểu bằng Zod.
- **LangGraph** (Bài 13) — khi trạng thái bền vững và suy luận đồ thị tường minh quan trọng hơn tốc độ thuần.
- **OpenAI / Claude Agent SDK** — khi bạn muốn hình dạng được sản phẩm hóa của nhà cung cấp (Các bài 16–17).

### Where this pattern goes wrong

- **Hiệu năng chỉ vì hiệu năng.** Chọn Agno vì "2μs" nghe hay khi khối lượng công việc là một lời gọi agent chậm cho mỗi yêu cầu. Chi phí phụ không phải nút thắt.
- **Khóa chặt hệ sinh thái.** Tích hợp mang màu sắc Vercel của Mastra là một điểm cộng trên Vercel, một điểm trừ ở nơi khác.
- **Nhầm lẫn giấy phép doanh nghiệp.** Các thư mục `ee/` của Mastra có sẵn mã nguồn, không phải Apache 2.0. Đọc các giấy phép nếu bạn đang lên kế hoạch fork.

```figure
wb-runtime-spawn
```

## Build It

Bài học này chủ yếu là so sánh — không một sản phẩm mã đơn lẻ nào có thể thể hiện công bằng cả hai framework. Xem `code/main.py` cho một bản mô phỏng đặt cạnh nhau: một luồng "chạy một agent, truyền đầu ra, lưu giữ phiên" tối thiểu được triển khai hai lần (một lần có dạng Agno, một lần có dạng Mastra).

Chạy nó:

```
python3 code/main.py
```

Hai trace khác nhau về cấu trúc nhưng tương đương về chức năng.

## Use It

- **Agno** — backend Python cần tốc độ và hình dạng FastAPI.
- **Mastra** — backend TypeScript với nhiều nhà cung cấp và các thành phần nguyên thủy workflow.
- Cả hai cung cấp các hook khả năng quan sát chính chủ. Cả hai tích hợp với Langfuse.

## Ship It

`outputs/skill-runtime-picker.md` chọn Agno, Mastra, LangGraph hoặc một SDK nhà cung cấp dựa trên stack, ngân sách độ trễ và hình thái vận hành.

## Exercises

1. Đọc tài liệu Agno. Chuyển vòng lặp ReAct dùng thư viện chuẩn (Bài 01) sang Agno. Điều gì biến mất? Điều gì còn lại?
2. Đọc tài liệu Mastra. Chuyển cùng vòng lặp sang Mastra. Điều gì thay đổi trong định kiểu công cụ (Zod so với không có gì)?
3. Benchmark: đo độ trễ khởi tạo agent trên stack của bạn. 2μs của Agno có quan trọng đối với khối lượng công việc của bạn không?
4. Thiết kế một cuộc di chuyển: nếu bạn đang chạy CrewAI trong Python, điều gì hỏng nếu bạn chuyển sang Agno?
5. Đọc các điều khoản giấy phép `ee/` của Mastra. Những hạn chế nào sẽ ảnh hưởng một fork mã nguồn mở?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Agno | "Các agent Python nhanh" | Runtime agent không trạng thái có phạm vi phiên |
| Mastra | "Các agent TypeScript trên Vercel AI SDK" | Agents + Tools + Workflows + Model Router |
| Unified Model Router (Bộ định tuyến mô hình thống nhất) | "Truy cập nhiều nhà cung cấp" | Một client duy nhất cho 3,300+ mô hình xuyên 94 nhà cung cấp |
| Composite storage (Lưu trữ tổng hợp) | "Nhiều backend" | Bộ nhớ/workflow/khả năng quan sát mỗi loại đến một kho khác nhau |
| Mastra Studio | "Bộ gỡ lỗi cục bộ" | UI localhost:4111 để kiểm tra bên trong các agent |
| Source-available (Có sẵn mã nguồn) | "Không phải OSS" | Giấy phép cho phép đọc mã nguồn nhưng hạn chế sử dụng thương mại |

## Further Reading

- [Agno Agent Framework docs](https://www.agno.com/agent-framework) — các mục tiêu hiệu năng, tích hợp FastAPI
- [Mastra docs](https://mastra.ai/docs) — các thành phần nguyên thủy, bộ điều hợp máy chủ, Model Router
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — lựa chọn đồ thị có trạng thái
- [Comet Opik](https://www.comet.com/site/products/opik/) — các so sánh khả năng quan sát được trích dẫn bởi các tích hợp Mastra
