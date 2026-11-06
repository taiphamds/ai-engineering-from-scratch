# Group Chat and Speaker Selection

> Điều phối hội thoại dùng chung đặt N agent trong một cuộc hội thoại; một hàm chọn (LLM, luân phiên, hoặc tùy chỉnh) chọn ai nói tiếp theo. Đây là nguyên mẫu hội thoại đa agent nổi lên — các agent không biết vai trò của chúng trong một đồ thị tĩnh, chúng chỉ phản ứng với bể dùng chung. AutoGen GroupChat và AG2 GroupChat là các triển khai tham chiếu: ngữ nghĩa GroupChat của AutoGen v0.2 được bảo toàn trong bản fork AG2; AutoGen v0.4 viết lại nó thành một mô hình actor hướng sự kiện. Microsoft đưa AutoGen vào chế độ bảo trì tháng 2 năm 2026 và hợp nhất nó với Semantic Kernel thành Microsoft Agent Framework (RC tháng 2 năm 2026). Nguyên thủy GroupChat tồn tại trong cả AG2 và Microsoft Agent Framework — học nó một lần, dùng nó mọi nơi.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## Problem

Các đồ thị tĩnh (LangGraph) rất tốt khi quy trình đã biết. Các cuộc hội thoại thực không tĩnh: đôi khi người viết mã hỏi người xem xét, đôi khi nhà nghiên cứu, đôi khi người viết. Mã hóa cứng mọi bàn giao có thể xảy ra tạo ra bùng nổ cạnh. Bạn muốn *các agent phản ứng với một bể dùng chung*, với một hàm nào đó quyết định ai nói tiếp theo.

Đó chính xác là những gì AutoGen GroupChat làm.

## Concept

### The shape

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

Mọi agent thấy mọi thông điệp. Một hàm chọn được gọi ở mỗi lượt để chọn ai nói tiếp theo.

### The three selector flavors

**Luân phiên.** Chu kỳ cố định. Xác định. Mở rộng tuyến tính theo N nhưng bỏ qua ngữ cảnh — một người viết mã nhận lượt ngay cả khi chủ đề là xem xét pháp lý.

**LLM lựa chọn.** Một lệnh gọi tới một LLM đọc bể gần đây và trả về người nói tiếp theo tốt nhất. Nhận biết ngữ cảnh nhưng chậm: mỗi lượt thêm một lệnh gọi LLM. Mặc định của AutoGen.

**Tùy chỉnh.** Một hàm Python với bất kỳ logic nào bạn muốn. Điển hình: do LLM lựa chọn với các quy tắc dự phòng (ví dụ: “luôn cho bộ xác minh lượt sau người viết mã”).

### The ConversableAgent API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager` giữ bộ chọn. Khi một agent hoàn thành một lượt, bộ quản lý gọi bộ chọn, trả về agent tiếp theo. Vòng lặp tiếp tục cho đến một điều kiện kết thúc.

### Termination

Ba mẫu phổ biến:

- **Số vòng tối đa.** Mức trần cứng trên tổng số lượt.
- **Token “TERMINATE”.** Các agent có thể phát một thông điệp sentinel; bộ quản lý dừng khi một thông điệp xuất hiện.
- **Kiểm tra đã đạt mục tiêu.** Một bộ xác minh nhẹ chạy mỗi lượt và dừng trò chuyện khi xong.

### Lineage: forks and mergers

Đầu năm 2025, Microsoft bắt đầu một bản viết lại lớn của AutoGen (v0.4) quanh một mô hình actor hướng sự kiện. Cộng đồng fork ngữ nghĩa GroupChat của AutoGen v0.2 thành AG2, bảo toàn API mà những bên áp dụng sớm đã tích hợp.

Tháng 2 năm 2026, Microsoft công bố AutoGen sẽ chuyển sang chế độ bảo trì, với mô hình actor hướng sự kiện hợp nhất vào **Microsoft Agent Framework** (RC tháng 2 năm 2026, giờ được hợp nhất với Semantic Kernel). Khái niệm GroupChat tồn tại trong cả hai nhánh; các chi tiết triển khai khác nhau. AG2 là nguồn thượng nguồn được ưu tiên cho mã tương thích v0.2.

### When GroupChat fits

- **Các cuộc hội thoại nổi lên.** Bạn không muốn kết nối trước mọi người nói tiếp theo có thể có.
- **Các tác vụ trộn vai trò.** Người viết mã hỏi nhà nghiên cứu, nhà nghiên cứu hỏi người lưu trữ, người lưu trữ hỏi lại người viết mã. Luồng không phải một DAG.
- **Giải quyết vấn đề mang tính khám phá.** Nghĩ “cuộc họp động não”, không phải “dây chuyền lắp ráp.”

### When it fails

- **Tính xác định nghiêm ngặt.** Bộ chọn LLM có thể không nhất quán. Cùng prompt, các lần chạy khác nhau, các người nói tiếp theo khác nhau.
- **Các chuỗi lan truyền xu nịnh.** Các agent nhường theo bên nói tự tin nhất. Prompt đối trọng tường minh.
- **Phình ngữ cảnh.** Mọi agent đọc mọi thông điệp; sau 10 lượt ngữ cảnh khổng lồ. Sử dụng các phép chiếu (Bài 15) để giới hạn phạm vi các góc nhìn.
- **Các người nói nóng.** Một agent thống trị hội thoại vì bộ chọn thiên về các chuyên môn của nó. Đưa cân bằng người nói vào như một tính năng bộ chọn.

### Group chat vs supervisor

Cùng các nguyên thủy, khác các mặc định:

- Bộ giám sát: một agent lập kế hoạch và các agent khác thực thi. Bộ chọn là “hỏi bộ lập kế hoạch làm gì.”
- Trò chuyện nhóm: mọi agent là ngang hàng; bộ chọn là một hàm trên bể dùng chung.

Cả hai sử dụng bốn nguyên thủy từ Bài 04. Trò chuyện nhóm mặc định dùng điều phối do LLM lựa chọn và trạng thái dùng chung toàn bể.

```figure
swarm-speaker
```

## Build It

`code/main.py` triển khai một GroupChat từ đầu bằng thư viện chuẩn. Ba agent (người viết mã, người xem xét, người quản lý), các biến thể luân phiên và do LLM lựa chọn, và kết thúc trên một token `TERMINATE`.

Demo in bản ghi hội thoại cộng với dấu vết quyết định của bộ chọn cho cả hai biến thể.

Chạy:

```
python3 code/main.py
```

## Use It

`outputs/skill-groupchat-selector.md` cấu hình một bộ chọn GroupChat cho một tác vụ nhất định — luân phiên so với do LLM lựa chọn so với tùy chỉnh, và những đầu vào bộ chọn nào (các thông điệp gần đây, các chuyên môn agent, số lượt) cần dùng.

## Ship It

Danh sách kiểm tra:

- **Mức trần số vòng tối đa.** Luôn luôn. 10-20 cho các tác vụ điển hình.
- **Chỉ số cân bằng người nói.** Theo dõi số lượt theo từng agent; cảnh báo khi mất cân bằng vượt một ngưỡng.
- **Token kết thúc.** `TERMINATE` hoặc một agent xác minh chuyên dụng.
- **Phép chiếu hoặc bộ nhớ có phạm vi giới hạn.** Sau ~10 thông điệp, cân nhắc chỉ cho mỗi agent một góc nhìn có phạm vi giới hạn để ngăn phình ngữ cảnh.
- **Ghi nhật ký bộ chọn.** Với các biến thể do LLM lựa chọn, ghi cả đầu vào của bộ chọn và lựa chọn của nó. Nếu không gỡ lỗi là không thể.

## Exercises

1. Chạy `code/main.py`. So sánh hội thoại dưới luân phiên với do LLM lựa chọn. Agent nào thống trị dưới mỗi cách?
2. Thêm một quy tắc “số lần nói tối đa theo từng agent” trong bộ chọn. Nó ảnh hưởng bản ghi như thế nào?
3. Triển khai một kết thúc đã đạt mục tiêu: dừng khi người xem xét trả về “đã phê duyệt.” Nó kích hoạt trước mức trần số vòng thường xuyên đến đâu?
4. Đọc tài liệu ổn định AutoGen về GroupChat (https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html). Xác định bộ chọn mặc định được `GroupChatManager` sử dụng.
5. Đọc repo AG2 (https://github.com/ag2ai/ag2) và so sánh GroupChat v0.2 của nó với phiên bản hướng sự kiện v0.4. v0.4 bổ sung thuộc tính cụ thể nào (thông lượng, khả năng chịu lỗi, khả năng kết hợp)?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| GroupChat (Trò chuyện nhóm) | “Các agent trong một phòng trò chuyện” | Bể thông điệp dùng chung + hàm chọn. Nguyên thủy AutoGen / AG2. |
| Speaker selection (Lựa chọn người nói) | “Ai nói tiếp theo” | Hàm chọn agent tiếp theo. Luân phiên, do LLM lựa chọn, hoặc tùy chỉnh. |
| GroupChatManager | “Chủ cuộc họp” | Thành phần AutoGen sở hữu bộ chọn và lặp qua các lượt. |
| ConversableAgent | “Agent cơ sở” | Lớp cơ sở AutoGen; một agent có thể gửi và nhận các thông điệp. |
| Termination token (Token kết thúc) | “Từ 'dừng'” | Chuỗi sentinel (thường là `TERMINATE`) kết thúc trò chuyện. |
| Hot speaker (Người nói nóng) | “Một agent thống trị” | Chế độ lỗi nơi bộ chọn liên tục chọn cùng agent. |
| Context bloat (Phình ngữ cảnh) | “Bể tăng không giới hạn” | Mỗi agent đọc mọi thông điệp trước đó; ngữ cảnh tăng theo lượt. |
| Projection (Phép chiếu) | “Góc nhìn có phạm vi giới hạn” | Góc nhìn riêng theo vai trò vào bể dùng chung để ngăn phình ngữ cảnh. |

## Further Reading

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) — triển khai tham chiếu
- [AG2 repo](https://github.com/ag2ai/ag2) — sự tiếp nối AutoGen v0.2 của cộng đồng
- [Microsoft Agent Framework docs](https://learn.microsoft.com/en-us/agent-framework/) — phiên bản kế nhiệm hợp nhất, RC tháng 2 năm 2026
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) — chi tiết bản viết lại mô hình actor hướng sự kiện
