# Supervisor / Orchestrator-Worker Pattern

> Một agent trưởng lập kế hoạch và giao việc; các worker chuyên biệt thực thi trong các ngữ cảnh song song và báo cáo lại. Đây là mẫu đằng sau hệ thống Research của Anthropic (Claude Opus 4 làm trưởng, Sonnet 4 làm các agent con), được đo ở mức +90.2% so với Opus 4 đơn agent trên các đánh giá nghiên cứu nội bộ. Bài viết kỹ thuật của Anthropic báo cáo rằng 80% phương sai trên BrowseComp được giải thích chỉ bằng mức sử dụng token — đa agent thắng phần lớn vì mỗi agent con nhận một cửa sổ ngữ cảnh mới. Bài này xây dựng mẫu bộ giám sát từ các nguyên thủy và trình bày các bài học kỹ thuật năm 2026 từ các triển khai sản xuất.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## Problem

Nghiên cứu là tác vụ điển hình mà các hệ thống một agent đơn lẻ thất bại. Bạn hỏi “điều gì thay đổi trong các hệ thống đa agent giữa năm 2023 và 2026?” Một agent đơn lẻ đọc năm bài báo tuần tự, lấp đầy nửa ngữ cảnh bằng văn bản của chúng, rồi phải suy luận về tất cả chúng cùng nhau. Nó quên bài đầu tiên khi tới bài thứ năm. Nó không thể song song hóa.

Mẫu bộ giám sát sửa điều này: một agent trưởng lập kế hoạch tìm kiếm, giao mỗi câu hỏi con cho một worker, và tổng hợp. Mỗi worker nhận cửa sổ 200k token riêng cho một câu hỏi hẹp. Agent trưởng không bao giờ thấy các bài báo thô — chỉ các tóm tắt của worker.

Hệ thống Research sản xuất của Anthropic báo cáo +90.2% trên các đánh giá nghiên cứu nội bộ so với một Opus 4 đơn lẻ. Cùng bài viết lưu ý rằng 80% phương sai BrowseComp được giải thích bằng *chỉ mức sử dụng token*. Ngữ cảnh mới cho mỗi agent con là cơ chế chính.

## Concept

### The pattern

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Agent trưởng không bao giờ đọc các tài liệu thô. Các worker không bao giờ thấy công việc của nhau cho đến khi agent trưởng tổng hợp. Mỗi mũi tên là một bàn giao với một hiện vật hẹp.

### Why it wins

Ba cơ chế:

1. **Ngữ cảnh mới cho mỗi agent con.** Một worker khám phá “di sản FIPA-ACL” không mang 40k token mà agent trưởng đã dùng để lập kế hoạch. Nó nhận một cửa sổ 200k cho một câu hỏi.
2. **Chuyên biệt hóa qua prompt.** Prompt của agent trưởng là “phân rã và tổng hợp”, không phải “nghiên cứu.” Prompt của mỗi worker hẹp: “tìm những gì thay đổi trong X.” Các prompt tập trung tạo ra các đầu ra tập trung.
3. **Tính song song.** Các worker chạy đồng thời. Thời gian thực trôi qua xấp xỉ `max(worker_times) + plan + synthesis`, không phải `sum(worker_times)`.

### Engineering lessons (Anthropic 2025)

Bài viết Anthropic liệt kê một số bài học sản xuất vẫn liên quan trong năm 2026:

- **Điều chỉnh nỗ lực theo độ phức tạp truy vấn.** Các truy vấn đơn giản: một agent, 3-10 lệnh gọi công cụ. Các truy vấn phức tạp: 10+ agent. Agent trưởng phải ước tính điều này, không phải bên gọi.
- **Rộng rồi hẹp.** Phân rã thành các câu hỏi con rộng trước, rồi tạo thêm các worker cho mỗi câu hỏi con nếu câu trả lời cần chiều sâu.
- **Các triển khai cầu vồng.** Các agent chạy dài và có trạng thái. Xanh lam-xanh lục truyền thống không hoạt động. Anthropic sử dụng cầu vồng: triển khai dần các phiên bản mới trong khi các phiên bản cũ hoàn tất công việc.
- **Mức sử dụng token chi phối.** Đa agent dùng ~15× token của một agent đơn lẻ. Chỉ chạy nó khi giá trị tác vụ xứng đáng với chi phí.

### The graph-native turn

LangGraph ban đầu cung cấp một thư viện `langgraph-supervisor` với một hàm hỗ trợ cấp cao `create_supervisor`. Năm 2025 LangChain chuyển khuyến nghị sang triển khai mẫu bộ giám sát trực tiếp qua gọi công cụ, vì các lệnh gọi công cụ cho nhiều quyền kiểm soát hơn đối với *những gì bộ giám sát thấy* (kỹ thuật ngữ cảnh). Thư viện vẫn hoạt động; tài liệu giờ khuyến nghị dạng gọi công cụ.

### The failure modes

- **Agent trưởng ảo giác kế hoạch.** Nếu agent trưởng sinh các câu hỏi con không phân rã câu hỏi thực, các worker thực hiện nghiên cứu chính xác trên mục tiêu sai.
- **Các worker khám phá quá mức.** Không có các ranh giới phạm vi tường minh, các worker trôi vượt câu hỏi con được giao và làm ô nhiễm bước tổng hợp.
- **Các xung đột tổng hợp.** Hai worker trả về các sự kiện mâu thuẫn. Agent trưởng phải hoặc hỏi lại (thêm một vòng) hoặc ghi nhận sự bất đồng tường minh. Âm thầm chọn một phía là thất bại tệ nhất: người dùng không bao giờ biết bất đồng đã xảy ra.

### When supervisor is wrong

- **Các tác vụ tuần tự.** Nếu bước 2 thực sự cần đầu ra bước 1, tính song song không mang lại gì. Sử dụng một pipeline (CrewAI Sequential, đồ thị tuyến tính LangGraph).
- **Các truy vấn đơn giản.** Một agent đơn lẻ xử lý chúng nhanh hơn và rẻ hơn. Sử dụng kiểm tra “điều chỉnh nỗ lực” của agent trưởng trước khi tạo worker.
- **Tính xác định nghiêm ngặt.** Bộ giám sát sử dụng giao việc do LLM lựa chọn. Các đồ thị tĩnh tốt hơn khi kiểm toán/phát lại quan trọng hơn khả năng thích nghi.

```figure
supervisor-hierarchy
```

## Build It

`code/main.py` triển khai một bộ giám sát gồm ba worker song song sử dụng `threading`. Agent trưởng phân rã một truy vấn thành các câu hỏi con, các worker chạy đồng thời trên mỗi câu hỏi con, và agent trưởng tổng hợp. Không có LLM thực — các worker được viết kịch bản để mô phỏng lấy và tóm tắt.

Cấu trúc then chốt:

- `Lead.plan(query)` chia một truy vấn thành 3 câu hỏi con.
- `Worker.run(sub_q)` trả về một tóm tắt giả (có thể là bất kỳ agent sử dụng công cụ nào trong sản xuất).
- `Lead.run(query)` khởi chạy các worker trong các luồng, chờ kết thúc, và tổng hợp.

Chạy:

```
python3 code/main.py
```

Đầu ra cho thấy kế hoạch, các dấu vết worker song song với dấu thời gian bắt đầu/kết thúc, và tổng hợp cuối cùng. Bạn có thể thấy lợi ích về thời gian thực: ba worker 0.3 giây chạy trong ~0.35 giây, không phải 0.9.

## Use It

`outputs/skill-supervisor-designer.md` nhận một truy vấn người dùng và tạo một thiết kế mẫu bộ giám sát: prompt hệ thống agent trưởng, các vai trò worker, các quy tắc phân rã câu hỏi con, và mẫu tổng hợp. Sử dụng nó trước khi xây dựng một hệ thống agent kiểu nghiên cứu mới.

## Ship It

Danh sách kiểm tra trước khi triển khai một mẫu bộ giám sát:

- **Ghép mô hình.** Agent trưởng trên một mô hình tầng suy luận (loại Opus, loại `o3`). Các worker trên một mô hình nhanh hơn, rẻ hơn (Sonnet, `o4-mini`).
- **Thời gian chờ worker.** Bất kỳ worker nào vượt 2× thời gian chạy trung vị bị ngắt; agent trưởng hoặc tạo lại với phạm vi hẹp hơn hoặc tiếp tục không có nó.
- **Mức trần token theo từng worker.** Giới hạn cứng (chẳng hạn 10× đầu vào tổng hợp dự kiến) ngăn một worker mất kiểm soát phá ngân sách.
- **Khả năng quan sát.** Truy vết kế hoạch của agent trưởng, các lệnh gọi công cụ của từng worker, và tổng hợp. Đây là cơ sở cho bất kỳ gỡ lỗi sau sự việc nào.
- **Triển khai cầu vồng.** Các agent có trạng thái chạy dài cần chuyển phiên bản dần, không phải hoán đổi nóng.

## Exercises

1. Chạy `code/main.py`, rồi sửa agent trưởng để tạo 5 worker thay vì 3. Quan sát ảnh hưởng thời gian thực. Ở số worker nào chi phí phụ tạo vượt phần tiết kiệm song song trong demo này?
2. Triển khai một thời gian chờ worker: ngắt bất kỳ worker nào chạy lâu hơn 0.5 giây và để agent trưởng tổng hợp các kết quả còn lại. Bạn cần khả năng quan sát nào để biết một worker đã bị cắt?
3. Thêm một bước phát hiện xung đột vào tổng hợp của agent trưởng: nếu hai worker trả về các câu trả lời mâu thuẫn, agent trưởng ghi nhận bất đồng thay vì chọn một. Bạn phát hiện mâu thuẫn như thế nào mà không gọi một LLM?
4. Đọc bài viết kỹ thuật hệ thống Research của Anthropic. Liệt kê ba thực hành demo đồ chơi này cần áp dụng để chạy trong sản xuất.
5. So sánh `create_supervisor` của LangGraph (cũ) với khuyến nghị gọi công cụ mới. Cách nào cho bạn quyền kiểm soát tốt hơn đối với những gì bộ giám sát thấy? Vì sao Anthropic chỉ chuyển tường minh các câu trả lời con chứ không phải ngữ cảnh worker thô vào tổng hợp?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Supervisor (Bộ giám sát) | “Agent trưởng” | Một agent điều phối lập kế hoạch, giao việc, và tổng hợp. Không tự làm công việc. |
| Worker | “Agent con” | Một agent tập trung được bộ giám sát gọi với phạm vi hẹp và cửa sổ ngữ cảnh riêng. |
| Orchestrator-worker (Bộ điều phối-worker) | “Mẫu bộ giám sát” | Cùng một thứ, khác tên. Tài liệu năm 2026 dùng cả hai. |
| Fresh context (Ngữ cảnh mới) | “Cửa sổ sạch” | Ngữ cảnh của một worker bắt đầu từ prompt hệ thống và câu hỏi được giao, không phải lịch sử của agent trưởng. |
| Rainbow deployment (Triển khai cầu vồng) | “Triển khai dần” | Các agent có trạng thái chạy dài cần hoàn tất và thay thế theo phiên bản, không phải xanh lam-xanh lục. |
| Token dominance (Sự chi phối của token) | “Ngữ cảnh là biến số” | 80% phương sai đánh giá nghiên cứu đến từ tổng token được dùng, không phải lựa chọn mô hình, theo Anthropic. |
| Scale effort (Điều chỉnh nỗ lực) | “Khớp số agent với độ phức tạp” | Agent trưởng ước tính độ khó truy vấn, tạo 1 so với 10+ worker tương ứng. |
| Synthesis conflict (Xung đột tổng hợp) | “Các worker bất đồng” | Hai worker trả về các sự kiện mâu thuẫn; agent trưởng phải trình bày bất đồng, không âm thầm chọn một. |

## Further Reading

- [Anthropic engineering — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — tham chiếu sản xuất cho mẫu bộ giám sát
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — bộ giám sát gọi công cụ giờ là dạng được khuyến nghị
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — hàm hỗ trợ cũ, vẫn được sử dụng trong sản xuất năm 2026
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — biến thể bộ giám sát dựa trên bàn giao
