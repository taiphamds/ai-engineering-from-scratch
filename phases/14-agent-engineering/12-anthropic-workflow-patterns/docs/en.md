# Anthropic's Workflow Patterns: Simple Over Complex

> Schluntz và Zhang (Anthropic, tháng 12 năm 2024) phân biệt các workflow (các đường đi được định nghĩa trước) với các agent (sử dụng công cụ động). Năm mẫu workflow bao phủ hầu hết các trường hợp. Bắt đầu với các lời gọi API trực tiếp. Chỉ thêm agent khi không thể dự đoán các bước.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên năm mẫu workflow của Anthropic: nối chuỗi prompt, định tuyến, song song hóa, bộ điều phối-worker, bộ đánh giá-bộ tối ưu.
- Giải thích sự phân biệt agent với workflow và chi phí kỹ thuật của mỗi loại.
- Nhận diện khi nào chọn một workflow thay cho một agent (và ngược lại).
- Triển khai cả năm mẫu bằng thư viện chuẩn với một LLM được viết kịch bản.

## The Problem

Các nhóm chọn các framework nhiều agent cho các vấn đề muốn một lời gọi hàm duy nhất. Chi phí là thực: các framework thêm các lớp che khuất các prompt, giấu luồng điều khiển và mời gọi sự phức tạp sớm. Bài đăng tháng 12 năm 2024 của Schluntz và Zhang là lời phản biện trong ngành được trích dẫn nhiều nhất: bắt đầu đơn giản, chỉ thêm sự phức tạp khi nó xứng đáng với chi phí.

## The Concept

### Workflows vs agents

- **Workflow.** Các LLM và công cụ được điều phối qua các đường mã được định nghĩa trước. Các kỹ sư sở hữu đồ thị.
- **Agent.** Các LLM điều hướng động các công cụ của chính chúng và thực hiện các bước của chính chúng. Mô hình sở hữu đồ thị.

Cả hai đều có chỗ của mình. Các workflow rẻ hơn, nhanh hơn và dễ gỡ lỗi hơn. Các agent mở ra các vấn đề mở nhưng khiến các chế độ lỗi khó suy luận hơn.

### The augmented LLM

Nền tảng cho cả năm mẫu: một LLM với ba khả năng được nối sẵn — tìm kiếm (truy xuất), công cụ (hành động), bộ nhớ (lưu giữ). Bất kỳ lời gọi API nào cũng có thể sử dụng chúng.

### The five patterns

1. **Nối chuỗi prompt.** Đầu ra của lời gọi 1 là đầu vào cho lời gọi 2. Sử dụng khi một tác vụ có một phép phân rã tuyến tính rõ ràng. Các cổng bằng chương trình tùy chọn giữa các bước.

2. **Định tuyến.** Một LLM phân loại chọn LLM hoặc công cụ hạ nguồn nào để gọi. Sử dụng khi các đầu vào khác nhau về loại cần cách xử lý khác nhau (hỗ trợ cấp 1 so với hoàn tiền so với lỗi so với bán hàng).

3. **Song song hóa.** Chạy N lời gọi LLM đồng thời, tổng hợp các kết quả. Hai hình dạng: chia phần (các phần khác nhau) và bỏ phiếu (cùng prompt, N lần chạy, đa số/tổng hợp).

4. **Bộ điều phối-worker.** Một LLM điều phối quyết định động những worker nào (cũng là các LLM) sẽ chạy và tổng hợp đầu ra của chúng. Tương tự các vòng lặp agent nhưng bộ điều phối không lặp vô hạn.

5. **Bộ đánh giá-bộ tối ưu.** Một LLM đề xuất một câu trả lời, một LLM khác đánh giá nó. Lặp cho đến khi bộ đánh giá đạt. Đây là Self-Refine (Bài 05) được khái quát hóa.

### Where workflows beat agents

- **Các tác vụ có thể dự đoán.** Nếu bạn có thể liệt kê các bước, bạn nên làm.
- **Các tác vụ bị ràng buộc chi phí.** Các workflow có số bước có giới hạn; các agent có thể mất kiểm soát.
- **Các tác vụ bị ràng buộc tuân thủ.** Các kiểm toán viên muốn đọc đồ thị, không phải suy ra nó từ các quỹ đạo.

### Where agents beat workflows

- **Nghiên cứu mở.** Khi bước tiếp theo phụ thuộc vào những gì bước trước trả về.
- **Các tác vụ có độ dài biến đổi.** Công việc từ vài phút đến vài giờ mà không biết số bước.
- **Các miền mới.** Khi bạn chưa biết workflow đúng — khám phá trước, hệ thống hóa sau.

### The context-engineering companion

"Kỹ thuật ngữ cảnh hiệu quả cho các agent AI" (Anthropic 2025) hình thức hóa lĩnh vực liền kề: cửa sổ 200k là một ngân sách, không phải một vật chứa. Đưa gì vào, khi nào cô đọng, khi nào để ngữ cảnh tăng. Được bao phủ chi tiết trong bài học Giai đoạn 14 về nén ngữ cảnh (Giai đoạn 14 trước đây là bài 06 trong chương trình học này trước khi đánh số lại).

```figure
workflow-chain
```

## Build It

`code/main.py` triển khai cả năm mẫu workflow với một `ScriptedLLM`:

- `prompt_chain(input, steps)` — tuần tự.
- `route(input, classifier, handlers)` — phân loại + phân phối.
- `parallel_vote(prompt, n, aggregator)` — N lần chạy, tổng hợp.
- `orchestrator_workers(task, workers)` — bộ điều phối chọn các worker.
- `evaluator_optimizer(task, proposer, evaluator, max_iter)` — lặp cho đến khi đạt.

Chạy nó:

```
python3 code/main.py
```

Mỗi mẫu in trace của nó. Tổng số dòng mã cho mỗi mẫu là ~10-15; chi phí của một framework được đo bằng hàng nghìn.

## Use It

- Các lời gọi API trực tiếp cho hầu hết các tác vụ.
- Chỉ dùng framework khi mẫu thực sự cần trạng thái bền vững (LangGraph), tính đồng thời theo mô hình actor (AutoGen v0.4) hoặc tạo mẫu vai trò (CrewAI).
- Chọn Claude Agent SDK khi bạn muốn hình dạng harness Claude Code mà không xây dựng lại nó.

## Ship It

`outputs/skill-workflow-picker.md` chọn mẫu đúng cho một mô tả tác vụ cho trước, bao gồm lý do quyết định và đường tái cấu trúc thành một agent nếu các workflow không đáp ứng.

## Exercises

1. Triển khai định tuyến với một ngưỡng độ tin cậy. Dưới ngưỡng -> chuyển lên con người. Ngưỡng nằm ở đâu cho một trường hợp sử dụng hỗ trợ cấp 1?
2. Thêm một thời gian chờ vào `parallel_vote`. Điều gì xảy ra khi một lời gọi bị treo? Bạn tổng hợp với các phiếu thiếu như thế nào?
3. Biến `evaluator_optimizer` thành một bandit: giữ top-2 đầu ra xuyên các lần lặp để một kết quả tốt muộn không bị ghi đè bởi một kết quả xấu muộn.
4. Kết hợp nối chuỗi prompt với định tuyến: một bộ định tuyến chọn một trong ba chuỗi. Đo chi phí token so với một lựa chọn prompt lớn duy nhất.
5. Chọn một trong các tính năng sản xuất của bạn. Vẽ đồ thị workflow. Đếm các bước. Một agent có thực sự tốt hơn ở đây không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Workflow (Luồng công việc) | "Luồng được định nghĩa trước" | Đồ thị các lời gọi LLM và công cụ do kỹ sư sở hữu |
| Agent (Tác nhân) | "AI tự chủ" | Đồ thị do mô hình sở hữu; điều hướng công cụ động |
| Augmented LLM (LLM tăng cường) | "LLM với công cụ" | LLM + tìm kiếm + công cụ + bộ nhớ; đơn vị nguyên tử |
| Prompt chaining (Nối chuỗi prompt) | "Các lời gọi tuần tự" | Đầu ra của lời gọi N là đầu vào cho lời gọi N+1 |
| Routing (Định tuyến) | "Phân phối bằng bộ phân loại" | Chọn chuỗi/mô hình nào xử lý đầu vào |
| Parallelization (Song song hóa) | "Tỏa ra" | N lời gọi đồng thời; tổng hợp bằng chia phần hoặc bỏ phiếu |
| Orchestrator-workers (Bộ điều phối-worker) | "Agent phân phối" | LLM điều phối chọn các LLM chuyên gia một cách động |
| Evaluator-optimizer (Bộ đánh giá-bộ tối ưu) | "Bộ đề xuất + giám khảo" | Lặp cho đến khi bộ đánh giá đạt; Self-Refine được khái quát hóa |

## Further Reading

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — năm mẫu workflow
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — lĩnh vực đồng hành
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — khi nào các đồ thị có trạng thái xứng đáng với chi phí của chúng
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — mẫu bộ điều phối-worker, được sản phẩm hóa
