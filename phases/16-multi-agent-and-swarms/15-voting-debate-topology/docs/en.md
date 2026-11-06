# Voting, Self-Consistency, and Debate Topology

> Cách tổng hợp rẻ nhất: lấy mẫu N agent độc lập, bỏ phiếu đa số. Tự nhất quán của Wang và cộng sự năm 2022 làm điều này với một mô hình được lấy mẫu N lần. Đa agent mở rộng nó với các agent **không đồng nhất** để thoát đơn văn hóa — các mô hình khác nhau, các prompt khác nhau, các temperature khác nhau, các ngữ cảnh khác nhau. Ngoài bỏ phiếu đa số, cấu trúc liên kết tranh luận quan trọng: MultiAgentBench (arXiv:2503.01935, ACL 2025) đánh giá phối hợp hình sao / chuỗi / cây / đồ thị và thấy **đồ thị tốt nhất cho nghiên cứu**, với một “thuế phối hợp” sau ~4 agent. AgentVerse (ICLR 2024) ghi nhận hai mẫu nổi lên — các hành vi tình nguyện và các hành vi thuận theo — và thuận theo vừa là một tính năng (tìm đồng thuận) vừa là một rủi ro (tư duy nhóm, Bài 24). Bài này lập bản đồ không gian cấu trúc liên kết, xây dựng từng biến thể, và đo thuế phối hợp.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 14 (Consensus and BFT)
**Time:** ~75 minutes

## Problem

Tranh luận có thể cải thiện độ chính xác (Du và cộng sự, arXiv:2305.14325). Nó cũng có thể làm suy giảm độ chính xác. Tranh luận có giúp hay không phụ thuộc vào bốn lựa chọn cấu trúc:

1. Ai nói với ai (cấu trúc liên kết).
2. Bao nhiêu vòng (Du 2023: cả số vòng và số agent quan trọng độc lập).
3. Liệu các agent có không đồng nhất không (các mô hình cơ sở khác nhau phá đơn văn hóa).
4. Liệu một tiếng nói đối kháng có hiện diện không (xây dựng lập luận mạnh nhất so với dựng người rơm).

Các nhóm gắn “chạy 5 agent và bỏ phiếu” vào một tác vụ thường thụt lùi so với một agent đơn lẻ. Các thất bại không ngẫu nhiên. Chúng đi theo cấu trúc liên kết và tính không đồng nhất. Bài này là bản đồ cấu trúc liên kết.

## Concept

### Self-consistency, the single-model baseline

Wang và cộng sự năm 2022 (“Self-Consistency Improves Chain of Thought Reasoning”) lấy mẫu cùng mô hình N lần ở temperature > 0 và bỏ phiếu đa số trên các câu trả lời đường suy luận. Kết quả trên GSM8K: các mức tăng đáng kể với N=40 mẫu so với một giải mã tham lam đơn lẻ. Tự nhất quán là tiền thân đơn agent của bỏ phiếu đa agent.

Giới hạn: tự nhất quán sử dụng một mô hình cơ sở. Các lỗi tương quan do cách xây dựng. Nếu mô hình có một thiên lệch hệ thống, mọi N mẫu chia sẻ nó.

### Multi-agent vote, the heterogeneous extension

Thay N mẫu bằng N agent *khác nhau*. Các mô hình cơ sở khác nhau (Claude, GPT, Llama), các prompt khác nhau, quyền truy cập công cụ khác nhau. Lợi ích: các lỗi không tương quan. Chi phí: các agent khác nhau tốn các lượng khác nhau; phối hợp chúng thêm chi phí phụ.

Tên chuẩn năm 2026 cho tranh luận không đồng nhất là **A-HMAD** — Tranh luận đa agent không đồng nhất đối kháng. Không được áp dụng phổ quát, nhưng các bài báo sử dụng thuật ngữ cho “các mô hình khác nhau tranh luận, giúp giảm các lỗi tương quan từ sụp đổ đơn văn hóa.”

### The four topologies

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Hình sao: một trung tâm, mọi bên khác chỉ nói với trung tâm. Tương đương bộ giám sát-worker không có kênh bên.
Chuỗi: tuyến tính, mỗi agent thấy đầu ra của agent trước. Giống pipeline.
Cây: phân cấp, được các hệ thống agent phân cấp sử dụng (Bài 06).
Đồ thị: bất kỳ bên nào với bất kỳ bên nào. Bao gồm clique kết nối đầy đủ và các DAG tùy ý.

### The coordination tax (MultiAgentBench)

MultiAgentBench (MARBLE, ACL 2025, arXiv:2503.01935) đánh giá benchmark hình sao, chuỗi, cây, đồ thị trên một bộ tác vụ gồm nghiên cứu, lập trình, và lập kế hoạch. Các kết quả đo then chốt:

- Cấu trúc liên kết **đồ thị** thắng trên các tác vụ nghiên cứu. Thông tin chảy từ bất kỳ bên nào tới bất kỳ bên nào; các agent có thể phê bình nhau.
- **Hình sao** thắng trên các tác vụ sự kiện trả lời nhanh. Trung tâm lọc và hợp nhất.
- **Chuỗi** thắng trên các pipeline từng bước (tinh chỉnh theo giai đoạn).
- **Thuế phối hợp** xuất hiện sau ~4 agent trong cấu trúc liên kết đồ thị. Thời gian thực và chi phí token tăng nhanh hơn chất lượng.

Mức trần 4 agent là thực nghiệm, không phải cơ bản. Nó phản ánh dung lượng ngữ cảnh LLM năm 2026: ngữ cảnh của mỗi agent đầy các đầu ra của các bên ngang hàng, và giá trị biên của việc thêm agent N+1 giảm một khi mọi bên có thể thấy mọi bên.

### Multi-Agent Debate Strategies ("Should we be going MAD?")

arXiv:2311.17371 là khảo sát năm 2023 về các chiến lược MAD. Phát hiện then chốt được các bên khác tái lập: các biến thể MAD *tương tự về cấu trúc* với tự nhất quán (lấy mẫu độc lập + tổng hợp) thường kém hơn tự nhất quán khi sử dụng cùng ngân sách. MAD giúp nhất khi các agent thực sự không đồng nhất và tranh luận có cấu trúc đối kháng (một agent lập luận chống lại).

### AgentVerse emergent patterns

AgentVerse (ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) ghi nhận hai hành vi nổi lên từ tranh luận đa agent ngay cả khi không có thiết kế tường minh:

- **Tình nguyện.** Một agent đề nghị giúp (“Tôi có thể nhận bước tiếp theo”) mà không được prompt. Hữu ích: nó phân bổ công việc cho agent có năng lực nhất cho một tác vụ con.
- **Thuận theo.** Một agent điều chỉnh lập trường để khớp một bên phê bình, ngay cả khi bên phê bình sai. Đây là dạng tương đương tranh luận của xu nịnh (Bài 14).

Thuận theo là lý do tranh luận cho đến khi đồng ý thưởng các bên bắt nạt. Các vòng bị giới hạn với một giám khảo riêng giảm thiểu.

### Heterogeneity: the actual knob that moves accuracy

Một mẫu giai đoạn 2024-2026 trong tài liệu thực hành: đổi một trong N agent của bạn sang một mô hình cơ sở khác mang lại mức tăng độ chính xác lớn hơn tăng N thêm 1. Trực giác là đơn văn hóa — mỗi nguồn lỗi độc lập mới đáng giá hơn một mẫu tương quan bổ sung.

Ở giới hạn, tính không đồng nhất vượt số lượng. Ba mô hình khác nhau vượt năm bản sao của một mô hình trên hầu hết các tác vụ có chuẩn tham chiếu sạch.

### Jury methods

Framework Sibyl (được trích trong tài liệu Minsky-LLM) hình thức hóa một “bồi thẩm đoàn” — một tập nhỏ các agent chuyên biệt tinh chỉnh các câu trả lời bằng cách bỏ phiếu ở mỗi giai đoạn. Khác bỏ phiếu đa số thuần túy, một bồi thẩm đoàn có các vai trò: một agent chất vấn chéo, một agent cung cấp ngữ cảnh, một agent chấm tính hợp lý. Các phương pháp bồi thẩm đoàn là trung điểm giữa bỏ phiếu thuần túy (rẻ, dễ đơn văn hóa) và MAD đầy đủ (đắt, dễ thuận theo).

### When vote-with-debate dominates

- Câu hỏi có chuẩn tham chiếu (sự kiện, toán, hành vi mã). Hội tụ phiếu có ý nghĩa.
- Các agent có thể truy cập các nguồn hoặc công cụ khác nhau (có tính không đồng nhất).
- Các vòng bị giới hạn (thường 2-3) và có một giám khảo hoặc bộ xác minh riêng.
- Ngân sách cho phép 3-5 agent. Vượt 5-7 trên cấu trúc liên kết đồ thị, thuế phối hợp chi phối.

### When vote-with-debate hurts

- Câu hỏi mang dạng ý kiến. Các agent hội tụ tới câu trả lời trông tự tin nhất, không phải đúng nhất.
- Mọi agent chia sẻ một mô hình cơ sở. Đơn văn hóa làm đồng thuận vô nghĩa.
- Các vòng không giới hạn. Thuận theo thắng mọi lần.
- Tác vụ đơn giản. Một agent đơn lẻ với tự nhất quán ở N=5 rẻ hơn và chính xác như nhau.

```figure
sw-debate-topology
```

## Build It

`code/main.py` triển khai:

- `run_star(agents, hub, question)` — trung tâm hỏi từng worker, tổng hợp.
- `run_chain(agents, question)` — tinh chỉnh tuần tự.
- `run_tree(root, children, question)` — phân cấp với tổng hợp độ sâu 2.
- `run_graph(agents, question, rounds)` — tranh luận mọi bên với mọi bên, số vòng bị giới hạn.
- Một núm điều chỉnh tính không đồng nhất được viết kịch bản: mỗi agent có một `error_bias` chỉ sự sai mang tính hệ thống của nó.
- Một harness đo chạy mỗi cấu trúc liên kết ở N=3, 5, 7 và báo cáo (accuracy, total_tokens, wallclock_simulated).

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: một bảng cấu trúc liên kết × N → (độ chính xác, token, độ trễ). Đồ thị thắng ở N=3-5 trên các tác vụ kiểu nghiên cứu; hình sao thắng trên các tác vụ sự kiện nhanh; đồ thị ở N=7 cho thấy thuế phối hợp (độ trễ phình nhanh hơn độ chính xác).

## Use It

`outputs/skill-topology-picker.md` là một skill đọc một mô tả tác vụ và đề xuất một cấu trúc liên kết (hình sao / chuỗi / cây / đồ thị), một N (số agent), một hồ sơ tính không đồng nhất (các mô hình cơ sở cần dùng), và một giới hạn số vòng.

## Ship It

Với bất kỳ tập hợp nào:

- Bắt đầu bằng **tự nhất quán ở N=5** sử dụng một mô hình cơ sở mạnh. Nó là đường cơ sở rẻ.
- Nâng lên **bỏ phiếu không đồng nhất ở N=3** nếu độ chính xác quan trọng. Đo chênh lệch.
- Chỉ nâng lên **cấu trúc liên kết tranh luận** nếu tác vụ có cấu trúc (nghiên cứu, nhiều bước) và các vòng bị giới hạn khả thi.
- Luôn ghi nhật ký cụm thiểu số. Khi một thiểu số liên tục đúng, bạn có một tín hiệu đa dạng.
- Đánh giá benchmark thời gian thực và token cùng với độ chính xác. “Độ chính xác tốt hơn ở chi phí 10x” là một quyết định kinh doanh.

## Exercises

1. Chạy `code/main.py`. Vẽ đường cong thuế phối hợp cho cấu trúc liên kết đồ thị: độ chính xác theo N, token theo N. Ở N nào đường cong có điểm uốn?
2. Triển khai A-HMAD: ba agent với các thiên lệch cố ý khác nhau. Đường cơ sở tất cả cùng thiên lệch so với A-HMAD như thế nào trên cuộc tấn công đơn văn hóa từ Bài 14?
3. Thêm một vai trò “giám khảo” vào cấu trúc liên kết đồ thị không bỏ phiếu, chỉ chấm đồng thuận cuối cùng. Điều này có thay đổi hành vi thuận theo nổi lên không?
4. Đọc bài báo AgentVerse (ICLR 2024). Xác định hành vi nổi lên nào triển khai của bạn thể hiện mạnh nhất. Bạn có thể khơi gợi hành vi ngược lại bằng một thay đổi prompt không?
5. Đọc MultiAgentBench (arXiv:2503.01935) Phần 4 (các thí nghiệm cấu trúc liên kết). Tái tạo kết quả “đồ thị thắng nghiên cứu” trên một tác vụ từ bài báo bằng harness của bạn.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Self-consistency (Tự nhất quán) | “Lấy mẫu N lần, bỏ phiếu” | Wang 2022. Một mô hình, N mẫu temperature>0, bỏ phiếu đa số trên các đường suy luận. |
| Heterogeneity (Tính không đồng nhất) | “Các mô hình khác nhau” | Tập hợp các mô hình cơ sở hoặc họ prompt khác nhau. Phá đơn văn hóa. |
| MAD | “Tranh luận đa agent” | Thuật ngữ chung cho các agent trao đổi phê bình qua các vòng. Xem Du 2023. |
| A-HMAD | “MAD không đồng nhất đối kháng” | Biến thể MAD nhấn mạnh các mô hình khác nhau + cấu trúc đối kháng. |
| Topology (Cấu trúc liên kết) | “Ai nói với ai” | Hình sao, chuỗi, cây, đồ thị. Quyết định luồng thông tin. |
| Coordination tax (Thuế phối hợp) | “Lợi ích giảm dần” | Trên ~4 agent trên đồ thị, chi phí tăng nhanh hơn chất lượng. |
| Volunteer behavior (Hành vi tình nguyện) | “Giúp không được prompt” | Mẫu nổi lên AgentVerse: một agent đề nghị nhận một bước. |
| Conformity behavior (Hành vi thuận theo) | “Đồng ý dưới áp lực” | Mẫu nổi lên AgentVerse: một agent thuận theo một bên phê bình. |
| Jury (Bồi thẩm đoàn) | “Hội đồng chuyên biệt nhỏ” | Tập hợp kiểu Sibyl có các vai trò (bên chất vấn, ngữ cảnh, bên chấm điểm). |

## Further Reading

- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) — đường cơ sở một mô hình
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325) — cả các agent VÀ các vòng quan trọng độc lập
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) — benchmark cấu trúc liên kết cho thấy đồ thị tốt nhất cho nghiên cứu, chuỗi cho pipeline
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) — khảo sát chiến lược MAD; thấy MAD thường thua tự nhất quán ở ngân sách bằng nhau
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) — các mẫu nổi lên tình nguyện và thuận theo
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) — triển khai benchmark tham chiếu
