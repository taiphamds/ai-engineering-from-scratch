# Society of Mind and Multi-Agent Debate

> Tiền đề năm 1986 của Minsky — trí thông minh là một xã hội các chuyên gia — được khám phá lại mỗi thập kỷ. Năm 2023 Du và cộng sự biến nó thành một thuật toán cụ thể: nhiều thể hiện LLM đề xuất các câu trả lời, đọc câu trả lời của nhau, phê bình, và cập nhật. Qua N vòng chúng hội tụ tới một đồng thuận vượt CoT zero-shot và phản tư trên sáu tác vụ suy luận và tính xác thực. Hai phát hiện quan trọng: cả **nhiều agent** và **nhiều vòng** đóng góp độc lập. Xã hội vượt một độc thoại của agent đơn lẻ; trao đổi nhiều vòng vượt bỏ phiếu một lần.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## Problem

Tự nhất quán — lấy mẫu một mô hình nhiều lần và lấy câu trả lời đa số — là cải thiện suy luận rẻ nhất bạn có thể gắn thêm. Nó hoạt động, nhưng bão hòa nhanh. Bạn có thể tăng gấp đôi các mẫu mà không thấy một bước nhảy đáng kể khác.

Tranh luận phá sự bão hòa. Thay vì N mẫu độc lập từ một mô hình, N agent đọc suy luận của nhau và sửa đổi. Tương quan giữa các mẫu giảm (chúng không còn i.i.d.), và điểm hội tụ thường đúng ở nơi bỏ phiếu i.i.d. sai một cách tự tin.

## Concept

### The Du et al. 2023 algorithm

Từ arXiv:2305.14325 (ICML 2024):

1. Mỗi agent trong N agent tạo ra một câu trả lời ban đầu cho câu hỏi.
2. Với vòng r = 2..R: mỗi agent được cho thấy các câu trả lời vòng r-1 của các agent khác và được yêu cầu “cân nhắc những điều này, đưa ra câu trả lời cập nhật của bạn.”
3. Sau R vòng, bỏ phiếu đa số các câu trả lời cuối cùng.

Bài báo kiểm thử trên MMLU, GSM8K, tiểu sử, MATH, và các benchmark tính xác thực. Tranh luận nhất quán vượt CoT và Tự phản tư.

### Two independent knobs

Các thí nghiệm loại bỏ từ cùng bài báo:

- **Chỉ số agent** (1 vòng, bỏ phiếu đa số của N) vượt một agent đơn lẻ trên hầu hết tác vụ, nhưng chững lại.
- **Chỉ số vòng** (1 agent thấy suy luận trước của chính nó) hầu như không giúp — điểm yếu đã biết của phản tư.
- **Cả hai cùng nhau** tạo ra các bước nhảy lớn. Trao đổi nhiều vòng giữa nhiều agent thúc đẩy mức tăng.

### Why it works

Hai cơ chế:

1. **Tiếp xúc với bất đồng.** Khi một agent thấy chuỗi suy luận của agent khác với một kết luận khác, nó phải hoặc biện minh hoặc cập nhật. Dù cách nào, ngữ cảnh cho vòng r+1 phong phú hơn vòng r.
2. **Giảm lỗi tương quan.** Trong tự nhất quán, mọi mẫu đến từ cùng mô hình, nên các lỗi tương quan — bạn lấy trung bình thành một câu trả lời sai một cách tự tin. Các mô hình khác nhau hoặc các seed khác nhau khử tương quan. Các *quan điểm được tranh luận* khác nhau khử tương quan thêm.

### Heterogeneous debate

A-HMAD và các công trình tiếp nối liên quan sử dụng *các mô hình cơ sở khác nhau* cho các agent khác nhau. Llama + Claude + GPT tranh luận giảm sụp đổ đơn văn hóa (Bài 26) vì các lỗi tương quan của một họ mô hình không được chia sẻ bởi những họ khác.

Mặt trái: một mô hình yếu tham gia một cuộc tranh luận có thể kéo đồng thuận về câu trả lời sai của nó (xem “Should we be going MAD?”, arXiv:2311.17371).

### NLSOM — the 129-agent extension

Zhuge và cộng sự (“Mindstorms in Natural Language-Based Societies of Mind”, arXiv:2305.17066) mở rộng ý tưởng này tới các xã hội 129 thành viên. Kết quả: chuyên biệt hóa và tự tổ chức nảy sinh theo quy mô, và hệ thống vượt một agent đơn lẻ trên các tác vụ như trả lời câu hỏi thị giác.

### Failure modes

- **Lan truyền xu nịnh.** Mọi agent nhường theo bất kỳ agent nào nghe tự tin nhất. Tranh luận sụp thành tiếng nói to nhất. Prompt cho các vai trò đối kháng (“một agent phải lập luận cho quan điểm đối lập”) giúp ích.
- **Trôi chủ đề.** Các cuộc tranh luận qua nhiều vòng trôi khỏi câu hỏi gốc. Giảm thiểu: đưa lại câu hỏi vào mỗi vòng.
- **Bùng nổ tính toán.** N agent × R vòng = N·R lệnh gọi LLM, mỗi lệnh có một ngữ cảnh tăng dần. Một cuộc tranh luận 5 agent, 5 vòng là 25 lệnh gọi ở ngữ cảnh tăng dần. Chi phí mỗi câu hỏi có thể vượt 10× một lệnh gọi CoT đơn lẻ.

```figure
multi-agent-debate
```

## Build It

`code/main.py` chạy một cuộc tranh luận 3 agent × 3 vòng trên một câu hỏi toán mà mỗi agent bắt đầu với một câu trả lời khác nhau (có thể sai). Các agent được viết kịch bản — mỗi agent “cập nhật” bằng cách lấy trung bình các câu trả lời láng giềng với trọng số là một độ tự tin được viết kịch bản. Sự hội tụ nhìn thấy được trong nhật ký theo từng vòng.

Demo cho thấy hai hiệu ứng then chốt:

- Một vòng trao đổi đơn lẻ đưa các agent gần câu trả lời đúng hơn.
- Các vòng bổ sung sau vòng 2 cho thấy lợi ích giảm dần (khớp cao nguyên của Du và cộng sự).

Chạy:

```
python3 code/main.py
```

## Use It

`outputs/skill-debate-configurator.md` cấu hình một cuộc tranh luận cho một tác vụ mới: số agent, số vòng, tính không đồng nhất (cùng mô hình so với hỗn hợp), phân vai (đối xứng so với một đối kháng). Nó cũng ước tính chi phí token trước khi bạn chạy.

## Ship It

Nếu bạn đưa tranh luận ra sử dụng:

- **Giới hạn số vòng ở 3.** Du và cộng sự cho thấy 3 vòng thu được phần lớn mức tăng. Nhiều hơn là chi phí, không phải chất lượng.
- **Giới hạn số agent ở 5.** Vượt 5, phình ngữ cảnh và chi phí chi phối.
- **Không đồng nhất theo mặc định.** Ít nhất hai mô hình cơ sở khác nhau trong bể.
- **Vị trí đối kháng.** Một agent được prompt để bất đồng bất kể điều gì. Phá xu nịnh.
- **Ghi nhật ký mọi vòng.** Các hệ thống tranh luận ẩn các vòng trung gian không thể được gỡ lỗi hoặc kiểm toán.

## Exercises

1. Chạy `code/main.py`, rồi đặt số vòng thành 5 và quan sát lợi ích giảm dần. Ở vòng nào hội tụ bổ sung dừng lại?
2. Thêm một agent thứ tư với vai trò đối kháng: luôn bất đồng với đa số hiện tại. Điều này phá hay cải thiện hội tụ?
3. Vẽ (in) điểm đồng ý theo từng vòng (tỷ lệ các agent ở câu trả lời đa số). Khi nào nó chạm 1.0 và điều đó có tương đương “đúng” không?
4. Đọc các thí nghiệm loại bỏ Phần 4 của Du và cộng sự. Tái lập kết quả “chỉ các agent” so với “chỉ các vòng” so với “cả hai” bằng mã này.
5. Đọc “Should we be going MAD?” (arXiv:2311.17371) và liệt kê hai biến thể tranh luận ngoài luân phiên — ví dụ: giám khảo dẫn dắt, chuỗi tranh luận, đối kháng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Society of Mind (Xã hội của trí óc) | “Ý tưởng của Minsky” | Trí thông minh như các chuyên gia tương tác; cách định hình năm 1986 giờ được vận hành hóa qua tranh luận LLM. |
| Multi-agent debate (Tranh luận đa agent) | “Các agent tranh cãi” | N agent đề xuất, phê bình nhau, sửa đổi qua R vòng, bỏ phiếu đa số. |
| Consensus (Đồng thuận) | “Chúng đồng ý” | Không phải chân lý nhận thức — chỉ là tỷ lệ ở câu trả lời đa số. Có thể sai một cách tự tin. |
| Rounds (Các vòng) | “Các bước trao đổi” | Một vòng = mỗi agent đọc những agent khác và cập nhật một lần. |
| Heterogeneous debate (Tranh luận không đồng nhất) | “Trộn các họ mô hình” | Sử dụng các mô hình cơ sở khác nhau để khử tương quan lỗi. |
| Sycophancy cascade (Lan truyền xu nịnh) | “Mọi bên đồng ý với bên to tiếng” | Lỗi tranh luận nơi các agent nhường theo agent tự tin nhất bất kể tính đúng đắn. |
| NLSOM | “Xã hội 129 agent” | Xã hội trí óc ngôn ngữ tự nhiên; phiên bản mở rộng của Zhuge và cộng sự. |
| Correlated error (Lỗi tương quan) | “Cùng mô hình, cùng lỗi” | Vì sao tự nhất quán bão hòa; tranh luận qua các quan điểm khác nhau khử tương quan. |

## Further Reading

- [Du et al. — Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325) — bài báo tham chiếu, ICML 2024
- [Zhuge et al. — Mindstorms in Natural Language-Based Societies of Mind](https://arxiv.org/abs/2305.17066) — NLSOM 129 agent
- [Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs](https://arxiv.org/abs/2311.17371) — đánh giá benchmark các biến thể tranh luận
- [Debate project page](https://composable-models.github.io/llm_debate/) — mã, demo, và chi tiết thí nghiệm loại bỏ của Du và cộng sự
