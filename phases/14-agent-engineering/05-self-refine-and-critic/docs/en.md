# Self-Refine and CRITIC: Iterative Output Improvement

> Self-Refine (Madaan và cộng sự, 2023) sử dụng một LLM trong ba vai trò — tạo, phản hồi, tinh chỉnh — trong một vòng lặp. Mức tăng trung bình: +20 tuyệt đối trên 7 tác vụ. CRITIC (Gou và cộng sự, 2023) củng cố bước phản hồi bằng cách định tuyến việc xác minh qua các công cụ bên ngoài. Năm 2026 mẫu này được cung cấp trong mọi framework dưới dạng "bộ đánh giá-bộ tối ưu" (Anthropic) hoặc một vòng lặp chốt bảo vệ (OpenAI Agents SDK).

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba prompt của Self-Refine (tạo, phản hồi, tinh chỉnh) và giải thích vì sao lịch sử quan trọng đối với prompt tinh chỉnh.
- Giải thích nhận thức then chốt của CRITIC: các LLM không đáng tin cậy trong tự xác minh khi không có cơ sở bên ngoài.
- Triển khai một vòng lặp Self-Refine dùng thư viện chuẩn với lịch sử và một bộ xác minh bên ngoài tùy chọn.
- Ánh xạ mẫu này sang workflow "bộ đánh giá-bộ tối ưu" của Anthropic và các chốt bảo vệ đầu ra của OpenAI Agents SDK.

## The Problem

Một agent tạo ra một câu trả lời gần đúng. Có thể một dòng mã có một lỗi cú pháp. Có thể một bản tóm tắt quá dài. Có thể một kế hoạch bỏ sót một trường hợp biên. Điều bạn muốn là: agent phê bình đầu ra của chính nó, rồi sửa nó.

Self-Refine cho thấy điều này hoạt động với một mô hình duy nhất, không dữ liệu huấn luyện, không RL. Nhưng có một trở ngại: các LLM kém tự xác minh các sự thật chắc chắn. CRITIC nêu cách khắc phục — định tuyến bước xác minh qua các công cụ bên ngoài (tìm kiếm, trình thông dịch mã, máy tính, trình chạy kiểm thử).

Cùng nhau, hai bài báo này xác định mặc định năm 2026 cho cải thiện lặp: tạo, xác minh (bên ngoài khi có thể), tinh chỉnh, dừng khi bộ xác minh đạt.

## The Concept

### Self-Refine (Madaan et al., NeurIPS 2023)

Một LLM, ba vai trò:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

Chi tiết then chốt: `refine` nhìn thấy toàn bộ lịch sử — mọi đầu ra và phê bình trước đó — để nó không lặp lại sai lầm. Bài báo thực hiện thí nghiệm loại bỏ điều này: bỏ lịch sử và chất lượng giảm mạnh.

Kết quả nổi bật: cải thiện tuyệt đối +20 trung bình trên 7 tác vụ (toán, mã, từ viết tắt, hội thoại) bao gồm GPT-4. Không huấn luyện, không công cụ bên ngoài, một mô hình duy nhất.

### CRITIC (Gou et al., arXiv:2305.11738, v4 Feb 2024)

Điểm yếu của Self-Refine: bước phản hồi là một LLM tự chấm điểm. Với các khẳng định thực tế, điều này không đáng tin cậy (một ảo giác thường trông thuyết phục với mô hình đã tạo ra nó). CRITIC thay `feedback(task, output)` bằng `verify(task, output, tools)` trong đó `tools` bao gồm:

- Một công cụ tìm kiếm cho các khẳng định thực tế.
- Một trình thông dịch mã cho tính đúng đắn của mã.
- Một máy tính cho số học.
- Các bộ xác minh dành riêng cho miền (kiểm thử đơn vị, bộ kiểm tra kiểu, linter).

Bộ xác minh tạo ra một phê bình có cấu trúc dựa trên các kết quả công cụ. Bộ tinh chỉnh sau đó được đặt điều kiện dựa trên phê bình này.

Kết quả nổi bật: CRITIC vượt Self-Refine trên các tác vụ thực tế vì phê bình có cơ sở. Trên các tác vụ không có bộ xác minh bên ngoài (viết sáng tạo, định dạng), CRITIC rút về Self-Refine.

### The stop condition

Hai hình dạng phổ biến:

1. **Bộ xác minh đạt.** Kiểm thử bên ngoài trả về thành công. Được ưu tiên khi khả dụng (kiểm thử đơn vị, bộ kiểm tra kiểu, khẳng định chốt bảo vệ).
2. **Không đưa ra phản hồi.** Mô hình nói "đầu ra ổn." Rẻ hơn nhưng không đáng tin cậy; kết hợp với một giới hạn số lần lặp tối đa.

Mặc định năm 2026: kết hợp chúng. "Dừng nếu bộ xác minh đạt HOẶC mô hình nói ổn VÀ số lần lặp >= 2 HOẶC số lần lặp >= max_iterations."

### Evaluator-Optimizer (Anthropic, 2024)

Bài đăng tháng 12 năm 2024 của Anthropic gọi đây là một trong năm mẫu workflow. Hai vai trò:

- Bộ đánh giá: chấm điểm đầu ra và tạo một phê bình.
- Bộ tối ưu: chỉnh sửa đầu ra với phê bình cho trước.

Lặp cho đến khi bộ đánh giá đạt. Đây là Self-Refine/CRITIC trong cách định khung của Anthropic. Chi tiết kỹ thuật then chốt mà Anthropic bổ sung: các prompt của bộ đánh giá và bộ tối ưu nên khác nhau đáng kể để mô hình không chỉ phê duyệt máy móc.

### OpenAI Agents SDK output guardrails

OpenAI Agents SDK cung cấp mẫu này dưới dạng "các chốt bảo vệ đầu ra." Một chốt bảo vệ là một bộ xác thực chạy trên đầu ra cuối cùng của một agent. Nếu chốt bảo vệ kích hoạt (phát sinh `OutputGuardrailTripwireTriggered`), đầu ra bị từ chối và agent có thể thử lại. Các chốt bảo vệ có thể gọi công cụ (kiểu CRITIC) hoặc là các hàm thuần (kiểu Self-Refine).

### 2026 pitfalls

- **Các vòng lặp phê duyệt máy móc.** Cùng một mô hình thực hiện tạo và phê bình với cùng kiểu prompt hội tụ về "tôi thấy ổn." Sử dụng các prompt khác nhau về cấu trúc, hoặc một mô hình nhỏ hơn, rẻ cho việc phê bình.
- **Tinh chỉnh quá mức.** Mỗi lượt tinh chỉnh thêm độ trễ và token. Lập ngân sách 1-3 lượt; sau đó, chuyển lên đánh giá bởi con người.
- **CRITIC trên các tác vụ tầm thường.** Nếu không có bộ xác minh bên ngoài, CRITIC suy biến thành Self-Refine; đừng trả chi phí độ trễ cho một bộ xác minh giả.

```figure
self-refine
```

## Build It

`code/main.py` triển khai Self-Refine và CRITIC trên một tác vụ mô phỏng: tạo một danh sách dấu đầu dòng ngắn với một chủ đề cho trước. Bộ xác minh kiểm tra định dạng (3 dấu đầu dòng, mỗi mục dưới 60 ký tự). CRITIC thêm một "bộ xác minh sự thật" bên ngoài phạt các ảo giác đã biết.

Các thành phần:

- `generate` — bộ tạo được viết kịch bản.
- `feedback` — tự phê bình kiểu LLM.
- `verify_external` — bộ xác minh có cơ sở kiểu CRITIC.
- `refine` — viết lại đầu ra với lịch sử cho trước.
- Điều kiện dừng — bộ xác minh đạt hoặc tối đa 4 lần lặp.

Chạy nó:

```
python3 code/main.py
```

So sánh các lần chạy Self-Refine với CRITIC. CRITIC bắt một lỗi thực tế mà Self-Refine bỏ sót vì bộ xác minh bên ngoài có cơ sở mà bộ tự phê bình không có.

## Use It

Bộ đánh giá-bộ tối ưu của Anthropic là mẫu này bằng ngôn ngữ thân thiện với Claude. Các chốt bảo vệ đầu ra của OpenAI Agents SDK có dạng CRITIC (các chốt bảo vệ có thể gọi công cụ). LangGraph cung cấp một nút phản tư đọc giống Self-Refine. Gemini 2.5 Computer Use của Google thêm một bộ đánh giá an toàn cho từng bước là một biến thể CRITIC: mọi hành động đều được xác minh trước khi thực hiện.

## Ship It

`outputs/skill-refine-loop.md` cấu hình một vòng lặp bộ đánh giá-bộ tối ưu với hình dạng tác vụ, sự khả dụng của bộ xác minh và ngân sách lặp cho trước. Phát ra các prompt cho bộ tạo, bộ đánh giá/bộ xác minh và bộ tối ưu, cộng một chính sách dừng.

## Exercises

1. Chạy bản mô phỏng với max_iterations=1. CRITIC còn giúp ích không?
2. Thay bộ xác minh bên ngoài bằng một bộ nhiễu (30% dương tính giả ngẫu nhiên). Vòng lặp làm gì? Đây là thực tế năm 2026 của hầu hết các stack chốt bảo vệ.
3. Triển khai một biến thể "bộ tạo-bộ phê bình trên các mô hình khác nhau": mô hình lớn tạo, mô hình nhỏ phê bình. Nó có thắng cùng một mô hình không?
4. Đọc Phần 3 của CRITIC (arXiv:2305.11738 v4). Nêu tên ba loại công cụ xác minh và đưa ra một ví dụ cho mỗi loại.
5. Ánh xạ `output_guardrails` của OpenAI Agents SDK sang vai trò bộ xác minh của CRITIC. SDK làm sai điều gì, và nó làm đúng điều gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Self-Refine | "LLM tự sửa nó" | Vòng lặp tạo -> phản hồi -> tinh chỉnh trong một mô hình, với lịch sử |
| CRITIC | "Xác minh dựa trên công cụ" | Thay phản hồi bằng một bộ xác minh bên ngoài (tìm kiếm, mã, tính toán, kiểm thử) |
| Evaluator-Optimizer (Bộ đánh giá-Bộ tối ưu) | "Mẫu workflow Anthropic" | Hai vai trò — bộ đánh giá chấm điểm, bộ tối ưu chỉnh sửa — được lặp đến hội tụ |
| Output guardrail (Chốt bảo vệ đầu ra) | "Kiểm tra hậu nghiệm" | Bộ xác thực OpenAI Agents SDK chạy sau khi một agent tạo đầu ra |
| Verify step (Bước xác minh) | "Pha phê bình" | Quyết định trụ cột: có cơ sở hay tự chấm điểm |
| Refine history (Lịch sử tinh chỉnh) | "Những gì mô hình đã thử" | Các đầu ra + phê bình trước được thêm vào đầu prompt tinh chỉnh; bỏ đi và chất lượng sụp đổ |
| Rubber-stamp loop (Vòng lặp phê duyệt máy móc) | "Lỗi tự đồng thuận" | Phê bình cùng prompt trả về "trông ổn"; khắc phục bằng các prompt khác nhau về cấu trúc |
| Stop condition (Điều kiện dừng) | "Kiểm thử hội tụ" | Bộ xác minh đạt HOẶC không phản hồi VÀ giới hạn lặp; không bao giờ chỉ một điều kiện |

## Further Reading

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — bài báo kinh điển
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) — xác minh dựa trên công cụ
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — mẫu workflow bộ đánh giá-bộ tối ưu
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — các chốt bảo vệ đầu ra như các bộ xác minh có dạng CRITIC
