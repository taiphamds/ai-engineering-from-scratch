# Action Budgets, Iteration Caps, and Cost Governors

> Chi phí LLM hằng tháng của một agent thương mại điện tử cỡ vừa đã tăng từ $1,200 lên $4,800 sau khi nhóm của nó bật skill “theo dõi đơn hàng”. Đó không phải là lỗi định giá. Đó là một agent đã tìm ra một vòng lặp mới và tiếp tục chi tiêu bên trong nó. Agent Governance Toolkit của Microsoft (ngày 2 tháng 4 năm 2026) hệ thống hóa biện pháp phòng thủ chống lại loại này: `max_tokens` theo từng yêu cầu, ngân sách token và đô la theo từng tác vụ, mức trần theo ngày/tháng, mức trần số lần lặp, định tuyến mô hình phân tầng, bộ nhớ đệm prompt, phân cửa sổ ngữ cảnh, checkpoint HITL trên các hành động tốn kém, công tắc ngắt khi vượt ngân sách. Claude Code Agent SDK của Anthropic cung cấp cùng các nguyên thủy dưới những tên khác. Giới hạn tốc độ tài chính — ví dụ: cắt quyền truy cập khi >$50 trong 10 phút — bắt các vòng lặp nhanh hơn mức trần hằng tháng.

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 12 (Durable execution)
**Time:** ~60 minutes

## The Problem

Các agent tự chủ tiêu tiền thật ở mỗi lượt. Đầu ra tệ của chatbot là một câu trả lời tệ; vòng lặp tệ của agent là một hóa đơn. Thuật ngữ được ngành ghi nhận cho chế độ lỗi này là “Denial of Wallet” — agent tiếp tục suy luận, tiếp tục gọi công cụ, tiếp tục tính phí, và không có gì ngăn nó vì không có gì được thiết kế để làm vậy.

Cách khắc phục không phải là một con số. Đó là một ngăn xếp giới hạn ở các thang thời gian và độ hạt khác nhau: theo từng yêu cầu, theo từng tác vụ, theo giờ, theo ngày, theo tháng. Một ngăn xếp được thiết kế tốt bắt một vòng lặp mất kiểm soát trong vài phút, một rò rỉ chậm trong vài giờ, và một bản phát hành tệ trong một ngày. Cũng ngăn xếp đó giúp duy trì được một ngân sách khi agent có tầm thời gian dài và tự chủ.

Đây là một bài học kỹ thuật: toán học đơn giản, kỷ luật là nơi các nhóm thất bại. Danh sách giới hạn bên dưới đều được nêu tên trong Microsoft Agent Governance Toolkit hoặc tài liệu Anthropic Claude Code Agent SDK.

## The Concept

### The cost-governor stack

1. **`max_tokens` theo từng yêu cầu.** Đơn giản. Ngăn bất kỳ lệnh gọi đơn lẻ nào phát ra một phần hoàn thành không giới hạn.
2. **Ngân sách token theo từng tác vụ.** Trong toàn bộ lần chạy, không vượt quá N token. Dừng cứng ở mức trần.
3. **Ngân sách đô la theo từng tác vụ.** Giống token nhưng bằng tiền tệ. `max_budget_usd` trong Claude Code.
4. **Mức trần lệnh gọi theo từng công cụ.** Không quá N lệnh gọi `WebFetch`, N lệnh gọi `shell_exec`, v.v.
5. **Mức trần số lần lặp (`max_turns`).** Tổng số lần lặp vòng lặp agent; ngăn các vòng lặp suy luận vô hạn.
6. **Mức trần theo phút / theo giờ / theo ngày / theo tháng.** Các cửa sổ trượt. Bắt các rò rỉ ở những thang thời gian khác nhau.
7. **Giới hạn tốc độ tài chính.** Ví dụ: “nếu chi tiêu vượt $50 trong 10 phút, cắt quyền truy cập.” Bắt việc đốt tiền do vòng lặp trước khi mức trần hằng tháng kích hoạt.
8. **Định tuyến mô hình phân tầng.** Mặc định dùng mô hình nhỏ hơn; chỉ nâng lên mô hình lớn hơn khi một bộ phân loại đánh giá tác vụ cần điều đó.
9. **Bộ nhớ đệm prompt.** Prompt hệ thống và ngữ cảnh ổn định được lưu trong bộ nhớ đệm của nhà cung cấp; chi phí token của việc gửi lại gần bằng không.
10. **Phân cửa sổ ngữ cảnh.** Nén / tóm tắt để giữ ngữ cảnh hoạt động dưới một ngưỡng; giảm trực tiếp chi phí token.
11. **Checkpoint HITL trên các hành động tốn kém.** Trước một hành động được biết là tốn kém (lệnh gọi công cụ dài, tải xuống lớn, nâng cấp mô hình tốn kém), yêu cầu một lần chạm của con người.
12. **Công tắc ngắt khi vượt ngân sách.** Phiên bị hủy khi bất kỳ mức trần nào kích hoạt. Mức trần được ghi lại; yêu cầu một đường bật lại riêng.

### Why the stack, not one cap

Một mức trần hằng tháng đơn lẻ chỉ bắt được một agent mất kiểm soát sau khi ví đã cạn. Một mức trần theo từng yêu cầu đơn lẻ không bắt được gì ở cấp phiên. Các chế độ lỗi khác nhau yêu cầu các thang thời gian khác nhau:

- **Vòng lặp mất kiểm soát** (agent mắc kẹt trong một lần thử lại 5 giây): bị bắt bởi giới hạn tốc độ.
- **Rò rỉ chậm** (agent làm ~2x công việc dự kiến cho mỗi tác vụ): bị bắt bởi mức trần hằng ngày.
- **Bản phát hành tệ** (phiên bản mới dùng 5x token): bị bắt bởi mức trần theo tuần / tháng.
- **Tăng vọt hợp lệ** (nhu cầu thực, không phải lỗi): bị bắt bởi mức trần theo giờ / ngày với nhật ký rõ ràng.

### A harness budget surface

Claude Code Agent SDK cung cấp (tài liệu công khai):

- `max_turns` — mức trần số lần lặp.
- `max_budget_usd` — mức trần đô la; phiên bị hủy khi vượt.
- `allowed_tools` / `disallowed_tools` — danh sách công cụ cho phép và danh sách từ chối.
- Các điểm hook trước khi sử dụng công cụ cho việc hạch toán chi phí tùy chỉnh.

Kết hợp với thang chế độ quyền (Bài 10). Một phiên `autoMode` không có `max_budget_usd` là tính tự chủ không được quản lý. Anthropic định vị rõ ràng Auto Mode là cần các kiểm soát ngân sách; bộ phân loại trực giao với chi phí.

### EU AI Act, OWASP Agentic Top 10

Agent Governance Toolkit của Microsoft bao phủ OWASP Agentic Top 10 và các yêu cầu của Điều 14 EU AI Act (giám sát của con người). Đối với sản xuất tại EU, ghi nhật ký và thực thi mức trần không phải là tùy chọn.

### The observed $1,200 → $4,800 case

Trường hợp thực trong tài liệu Microsoft: một agent thương mại điện tử có chi phí hàng tháng tăng gấp bốn sau khi thêm một công cụ mới. Công cụ cho phép agent thăm dò trạng thái đơn hàng trong mỗi phiên. Không phát hiện vòng lặp. Không có giới hạn theo công cụ. Không có cảnh báo tăng trưởng tuần so với tuần. Cách sửa là giới hạn theo công cụ cộng cảnh báo tăng trưởng hàng ngày. Đây là một mẫu: mỗi bề mặt công cụ mới là một vòng lặp tiềm năng mới; mỗi công cụ mới cần giới hạn riêng và cảnh báo riêng.

```figure
cost-governor-stack
```

## Use It

`code/main.py` mô phỏng một lần chạy agent có và không có ngăn xếp bộ điều tiết chi phí nhiều lớp. Agent mô phỏng trôi vào một vòng lặp thăm dò sau một số lượt; ngăn xếp nhiều lớp bắt nó trong cửa sổ tốc độ trong khi một mức trần hằng tháng đơn lẻ sẽ không kích hoạt cho đến nhiều ngày sau.

## Ship It

`outputs/skill-agent-budget-audit.md` kiểm toán ngăn xếp bộ điều tiết chi phí của một triển khai agent được đề xuất và đánh dấu các lớp còn thiếu.

## Exercises

1. Chạy `code/main.py`. Xác nhận giới hạn tốc độ kích hoạt trước mức trần số lần lặp trên một quỹ đạo vòng lặp thăm dò. Bây giờ tắt giới hạn tốc độ và đo agent “chi” bao nhiêu trước khi mức trần số lần lặp bắt nó.

2. Thiết kế một tập mức trần theo từng công cụ cho một agent trình duyệt (Bài 11). Công cụ nào cần mức trần chặt nhất? Công cụ nào có thể chạy không giới hạn mà không có rủi ro?

3. Đọc tài liệu Microsoft Agent Governance Toolkit. Liệt kê mọi loại mức trần mà bộ công cụ nêu tên. Ánh xạ mỗi loại tới một trong các chế độ lỗi (vòng lặp mất kiểm soát, rò rỉ chậm, bản phát hành tệ, tăng vọt).

4. Định giá một lần chạy qua đêm không có người giám sát cho một tác vụ thực tế (ví dụ: “phân loại 50 issue trong một repo”). Đặt `max_budget_usd` ở mức 2x ước tính điểm của bạn. Giải thích mức 2x.

5. `max_budget_usd` của Claude Code kích hoạt trên tổng chi phí phiên. Thiết kế một giới hạn tốc độ bổ sung mà bạn sẽ thực thi từ bên ngoài. Điều gì kích hoạt việc cắt, và bật lại trông như thế nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Denial of Wallet (Từ chối ví tiền) | “Hóa đơn mất kiểm soát” | Vòng lặp agent tạo ra chi tiêu mà không có mức trần để ngăn nó |
| max_tokens | “Mức trần theo từng yêu cầu” | Giới hạn trên đối với kích thước của một phần hoàn thành đơn lẻ |
| max_turns | “Mức trần số lần lặp” | Giới hạn trên đối với số lần lặp vòng lặp agent trong một phiên |
| max_budget_usd | “Công tắc ngắt đô la” | Mức trần chi phí phiên; hủy khi vượt |
| Velocity limit (Giới hạn tốc độ) | “Mức trần tốc độ” | Giới hạn chi tiêu trong một cửa sổ ngắn (ví dụ: $50 / 10 phút) |
| Tiered routing (Định tuyến phân tầng) | “Mô hình nhỏ trước” | Mô hình rẻ mặc định; chỉ nâng cấp khi bộ phân loại xác định là cần |
| Prompt caching (Bộ nhớ đệm prompt) | “Prompt hệ thống được lưu đệm” | Bộ nhớ đệm phía nhà cung cấp giảm chi phí token gửi lại xuống gần không |
| HITL checkpoint (Checkpoint HITL) | “Cổng phê duyệt của con người” | Yêu cầu một lần chạm của con người trước hành động tốn kém |

## Further Reading

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) — `max_turns`, `max_budget_usd`, các danh sách công cụ cho phép.
- [Microsoft Agent Framework — human-in-the-loop and governance](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — các checkpoint bộ điều tiết chi phí.
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — các kiểm soát chi phí phía nhà cung cấp.
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — cơ chế bộ nhớ đệm.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — hồ sơ chi phí cho các agent có tầm thời gian dài.
