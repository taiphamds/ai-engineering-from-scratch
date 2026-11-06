# Handoffs and Routines — Stateless Orchestration

> Swarm của OpenAI (tháng 10 năm 2024) chắt lọc điều phối đa agent thành hai nguyên thủy: **các quy trình** (chỉ dẫn + công cụ dưới dạng một prompt hệ thống) và **các bàn giao** (một công cụ trả về một Agent khác). Không máy trạng thái, không DSL phân nhánh — LLM định tuyến bằng cách gọi đúng công cụ bàn giao. OpenAI Agents SDK (tháng 3 năm 2025) là phiên bản kế nhiệm cho sản xuất. Bản thân Swarm vẫn là tham chiếu khái niệm sạch nhất — toàn bộ mã nguồn của nó vừa trong vài trăm dòng. Mẫu lan truyền vì bề mặt API xấp xỉ “agent = prompt + công cụ; bàn giao = hàm trả về agent.” Hạn chế: không trạng thái, nên bộ nhớ là vấn đề của bên gọi.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## Problem

Mọi framework đa agent muốn bạn học DSL của nó: các node và cạnh LangGraph, các nhóm và tác vụ CrewAI, GroupChat và các bộ quản lý AutoGen. Các DSL là các trừu tượng hóa thực, nhưng chúng khiến thứ đó có cảm giác nặng hơn mức cần thiết.

Swarm đẩy theo hướng ngược lại: sử dụng năng lực gọi công cụ mà mô hình đã có. Các bàn giao trở thành các lệnh gọi công cụ. Bộ điều phối là bất kỳ agent nào hiện giữ hội thoại. Máy trạng thái là ngầm định trong các prompt hệ thống của các agent.

## Concept

### Two primitives

**Quy trình.** Một prompt hệ thống định nghĩa vai trò và các công cụ có sẵn của một agent. Hãy nghĩ về nó như một tập chỉ dẫn có phạm vi giới hạn: “bạn là một agent phân loại; nếu người dùng hỏi về hoàn tiền, bàn giao tới agent hoàn tiền.”

**Bàn giao.** Một công cụ agent có thể gọi trả về một đối tượng Agent mới. Môi trường chạy Swarm phát hiện giá trị trả về Agent và chuyển agent hoạt động cho lượt tiếp theo.

Đó là toàn bộ trừu tượng hóa.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

Prompt hệ thống của agent phân loại khiến nó chọn bàn giao phù hợp dựa trên thông điệp người dùng. Gọi công cụ của LLM thực hiện định tuyến.

### Why it is viral

- **API nhỏ.** Hai khái niệm để học.
- **Sử dụng những gì mô hình đã làm.** Gọi công cụ đã ở mức sản xuất trên các nhà cung cấp.
- **Không gánh nặng máy trạng thái.** Bạn không mô tả đồ thị; các prompt của agent mô tả chúng bàn giao cho ai.

### The stateless trade

Swarm rõ ràng không trạng thái giữa các lần chạy. Framework giữ một lịch sử thông điệp trong một lần chạy, nhưng không lưu bền vững bất cứ thứ gì. Bộ nhớ, tính liên tục, các tác vụ chạy dài — tất cả là vấn đề của bên gọi.

Trong sản xuất (OpenAI Agents SDK, tháng 3 năm 2025) đây là một trong những điều chính thay đổi: SDK thêm quản lý phiên, các rào chắn, và truy vết tích hợp trong khi giữ nguyên thủy bàn giao.

### When Swarm/handoffs fit

- **Các mẫu phân loại.** Agent tuyến đầu định tuyến người dùng tới một chuyên gia.
- **Các bàn giao dựa trên kỹ năng.** “Nếu tác vụ cần mã, gọi người viết mã; nếu nó cần nghiên cứu, gọi nhà nghiên cứu.”
- **Các cuộc hội thoại ngắn, bị giới hạn.** Hỗ trợ khách hàng, FAQ thành phiếu hỗ trợ, các quy trình đơn giản.

### When Swarm struggles

- **Các phiên dài có bộ nhớ dùng chung.** Các bàn giao đặt lại trạng thái hội thoại thành prompt của agent mới cộng với lịch sử. Không có trạng thái bền vững giữa các agent nếu không có bộ nhớ do bên gọi quản lý.
- **Thực thi song song.** Bàn giao từng cái một — agent hoạt động chuyển đổi. Tính song song yêu cầu bên gọi điều phối nhiều lần chạy Swarm.
- **Kiểm toán và phát lại.** Các lần chạy không trạng thái khó phát lại chính xác; lựa chọn bàn giao của LLM không xác định.

### OpenAI Agents SDK (March 2025)

Phiên bản kế nhiệm cho sản xuất bổ sung:

- **Trạng thái phiên.** Luồng bền vững qua các lần chạy.
- **Các rào chắn.** Các hook xác thực đầu vào/đầu ra.
- **Truy vết.** Mọi lệnh gọi công cụ và bàn giao được ghi nhật ký.
- **Các bộ lọc bàn giao.** Kiểm soát ngữ cảnh nào chuyển qua bàn giao.

Nguyên thủy bàn giao tồn tại; sự thuận tiện cho sản xuất được thêm quanh nó.

### Swarm vs GroupChat

Cả hai sử dụng định tuyến do LLM điều khiển, nhưng khác nhau về **ai chọn tiếp theo**:

- GroupChat: một bộ chọn (hàm hoặc LLM) chọn người nói tiếp theo từ bên ngoài.
- Swarm: agent hiện tại chọn bên kế nhiệm bằng cách gọi một công cụ bàn giao.

Swarm là “agent quyết định điều gì tiếp theo”; GroupChat là “bộ quản lý quyết định điều gì tiếp theo.” Quyết định của Swarm nằm trong lệnh gọi công cụ của agent hoạt động; quyết định của GroupChat nằm trong `GroupChatManager`.

```figure
sw-handoff-routing
```

## Build It

`code/main.py` triển khai Swarm từ đầu: một dataclass Agent, một cơ chế bàn giao (công cụ trả về Agent), và một vòng lặp chạy phát hiện các lần chuyển agent.

Demo: một agent phân loại định tuyến tới các chuyên gia hoàn tiền, bán hàng, hoặc hỗ trợ. Mỗi chuyên gia có các công cụ riêng. Vòng lặp chạy in mỗi bàn giao.

Chạy:

```
python3 code/main.py
```

## Use It

`outputs/skill-handoff-designer.md` thiết kế một cấu trúc liên kết bàn giao cho một tác vụ nhất định: các agent nào tồn tại, các bàn giao nào chúng có thể gọi, ngữ cảnh nào chuyển.

## Ship It

Danh sách kiểm tra:

- **Ghi nhật ký bàn giao.** Mọi bàn giao ghi một sự kiện truy vết với agent nguồn, agent đích, snapshot ngữ cảnh.
- **Các quy tắc chuyển ngữ cảnh.** Quyết định những gì di chuyển khi bàn giao: toàn bộ lịch sử (tốn kém), N thông điệp cuối, hoặc một tóm tắt.
- **Rào chắn trên bàn giao.** Một bàn giao tới một chuyên gia có các quyền công cụ khác phải được xác thực — nếu không chèn prompt có thể ép các bàn giao ngoài ý muốn.
- **Phát hiện vòng lặp.** Hai agent bàn giao qua lại là một lỗi phổ biến; phát hiện bằng một kiểm tra vòng K gần nhất đơn giản.
- **Agent dự phòng.** Nếu một đích bàn giao không tồn tại, quay về một mặc định an toàn.

## Exercises

1. Chạy `code/main.py`, phân loại tới agent hoàn tiền. Xác nhận agent hoạt động của lượt thứ hai là hoàn tiền.
2. Thêm một quy tắc phát hiện vòng lặp: nếu cùng hai agent đã bàn giao 3 lần liên tiếp, buộc thoát. Thiết kế dự phòng.
3. Đọc tài liệu OpenAI Agents SDK về các bộ lọc bàn giao. Triển khai một phiên bản “tóm tắt khi bàn giao”: agent đi ra nén ngữ cảnh thành một tóm tắt gạch đầu dòng trước khi agent đi vào tiếp quản.
4. So sánh bàn giao Swarm với một bộ chọn GroupChatManager. Mẫu nào làm chèn prompt tệ hơn, và vì sao?
5. Đọc cookbook Swarm (https://developers.openai.com/cookbook/examples/orchestrating_agents). Xác định một quyết định thiết kế tường minh Swarm đưa ra mà OpenAI Agents SDK đã thay đổi hoặc giữ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Routine (Quy trình) | “Prompt agent” | Prompt hệ thống + danh sách công cụ. Định nghĩa vai trò và các bàn giao có sẵn. |
| Handoff (Bàn giao) | “Chuyển sang agent khác” | Một công cụ agent hoạt động có thể gọi trả về một Agent mới. Môi trường chạy chuyển agent hoạt động. |
| Stateless (Không trạng thái) | “Không có bộ nhớ giữa các lần chạy” | Swarm không lưu bền vững bất cứ thứ gì; bộ nhớ là trách nhiệm của bên gọi. |
| Active agent (Agent hoạt động) | “Ai đang nói bây giờ” | Agent hiện giữ hội thoại. Bàn giao thay đổi điều này. |
| Context transfer (Chuyển ngữ cảnh) | “Những gì di chuyển khi bàn giao” | Chính sách cho lịch sử nào agent đi vào thấy: đầy đủ, N cuối, hoặc được tóm tắt. |
| Handoff loop (Vòng lặp bàn giao) | “Các agent bóng bàn” | Chế độ lỗi nơi hai agent liên tục bàn giao lại cho nhau. |
| OpenAI Agents SDK | “Swarm sản xuất” | Phiên bản kế nhiệm tháng 3 năm 2025; thêm các phiên, rào chắn, truy vết trên nguyên thủy bàn giao. |
| Handoff filter (Bộ lọc bàn giao) | “Cổng kiểm soát chuyển giao” | Tính năng SDK để kiểm tra và sửa đổi ngữ cảnh tại ranh giới bàn giao. |

## Further Reading

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — diễn đạt tham chiếu
- [OpenAI Swarm repo](https://github.com/openai/swarm) — triển khai gốc, được giữ làm tham chiếu khái niệm
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — phiên bản kế nhiệm cho sản xuất với các phiên và truy vết
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) — cách các agent con Claude Code sử dụng một mẫu giống bàn giao qua `Task`
