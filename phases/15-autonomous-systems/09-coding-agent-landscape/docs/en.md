# The Autonomous Coding Agent Landscape (2026)

> SWE-bench Verified đã tăng từ 4% lên 80.9% trong chưa đầy ba năm. Cùng Claude Sonnet 4.5 đạt 43.2% trên SWE-agent v1 và 59.8% trên Cline tự chủ — khung bao quanh mô hình giờ đây quan trọng ngang với chính mô hình. OpenHands (trước đây là OpenDevin) là nền tảng có giấy phép MIT hoạt động tích cực nhất và vòng lặp CodeAct của nó thực thi trực tiếp các hành động Python trong sandbox thay vì các lệnh gọi công cụ JSON. Các con số nổi bật che giấu một vấn đề về phương pháp: 161 trong 500 tác vụ SWE-bench Verified chỉ yêu cầu thay đổi 1–2 dòng, và SWE-bench Pro (các tác vụ 10+ dòng) nằm ở mức 23–59% đối với cùng các mô hình tiên tiến nhất.

**Type:** Learn
**Languages:** Python (stdlib, CodeAct vs JSON tool-call comparison)
**Prerequisites:** Phase 14 · 07 (Tool use), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## The Problem

“Agent lập trình nào tốt nhất” là câu hỏi sai. Câu hỏi đúng là: trên một phân phối tác vụ phù hợp với công việc của tôi, với khung tôi sẽ chạy trong môi trường sản xuất, tôi đạt được độ tin cậy đầu cuối nào?

Từ năm 2022 đến 2026, lĩnh vực này đã học được rằng khung — lớp truy xuất, bộ lập kế hoạch, sandbox, vòng lặp chỉnh sửa-xác minh, định dạng phản hồi — đóng vai trò chịu lực. Claude Sonnet 4.5 trên SWE-agent v1 đạt 43.2% trên SWE-bench Verified; cùng mô hình đó bên trong khung tự chủ của Cline đạt 59.8%. Chênh lệch 16.6 điểm tuyệt đối, cùng trọng số. Mô hình cơ sở là một thành phần; vòng lặp là sản phẩm.

Vấn đề đi kèm là sự bão hòa benchmark che giấu các bước thụt lùi. SWE-bench Verified gần bão hòa, và phần đuôi tác vụ dễ (161 trong 500 tác vụ yêu cầu ≤2 dòng) kéo các điểm cao nhất lên. Chất lượng thực tế được đo tốt hơn trên các phân phối như SWE-bench Pro (thay đổi 10+ dòng), nơi cùng những bên dẫn đầu vẫn nằm ở mức 23–59%.

## The Concept

### SWE-bench, one paragraph

SWE-bench (Jimenez và cộng sự) lấy các issue GitHub thực với các bản vá chuẩn tham chiếu và yêu cầu một agent tạo ra bản vá khiến bộ kiểm thử vượt qua. SWE-bench Verified (OpenAI, 2024) là một tập con 500 tác vụ được con người tuyển chọn, đã loại bỏ các tác vụ mơ hồ và bị lỗi. SWE-bench Pro là phiên bản kế tiếp khó hơn — các tác vụ yêu cầu thay đổi 10+ dòng, nơi các agent tiên tiến nhất hiện tại nằm ở mức 23–59%.

### What the 2022 → 2026 curve actually shows

- **2022**: các mô hình nghiên cứu ở mức ~4% trên SWE-bench thô.
- **2024**: GPT-4 + khung kiểu Devin ở mức ~14%; SWE-agent ở mức ~12%.
- **2025**: Claude 3.5/3.7 Sonnet bên trong Aider và SWE-agent đẩy lên khoảng 40–55%.
- **2026**: Claude Sonnet 4.5 và các đối thủ tiên tiến nhất ở mức 70–80%+ trên SWE-bench Verified. Bảng xếp hạng của Epoch AI theo dõi điều này trực tiếp.

Độ dốc đến từ ba nguồn cộng dồn: các mô hình cơ sở tốt hơn, khung tốt hơn (CodeAct, phản tư, các vòng lặp bộ xác minh), và benchmark tốt hơn (Verified loại bỏ nhiễu).

### CodeAct vs JSON tool calls

OpenHands (All-Hands-AI, arXiv:2407.16741, trước đây là OpenDevin) đã đặt cược vào một kiến trúc cụ thể: thay vì mô hình phát ra các lệnh gọi công cụ JSON để một máy chủ giải mã và thực thi, mô hình phát ra mã Python và một kernel kiểu Jupyter chạy mã đó trong sandbox. Agent có thể lặp qua các file, nối chuỗi công cụ, và bắt các ngoại lệ của chính nó bên trong một hành động.

Sự đánh đổi:

- **Các lệnh gọi công cụ JSON**: mỗi hành động là một lượt; dễ kiểm toán; khả năng kết hợp hạn chế; an toàn theo mặc định vì mỗi lệnh gọi đều đi qua một bộ xác thực tường minh.
- **CodeAct**: một hành động có thể là cả một chương trình; có khả năng kết hợp; yêu cầu sandbox được gia cố (OpenHands sử dụng cách ly Docker); các chế độ lỗi bao gồm bất cứ điều gì môi trường chạy sandbox cho phép.

Cả hai kiến trúc đều đang được dùng trong môi trường sản xuất. CodeAct chiếm ưu thế trong các nền tảng mở (OpenHands, smolagents). Các lệnh gọi công cụ JSON vẫn chiếm ưu thế trong các dịch vụ được quản lý (Anthropic Managed Agents, OpenAI Assistants), nơi nhà cung cấp kiểm soát bộ thực thi.

### Scaffolds in the 2026 landscape

| Khung | Giấy phép | Mô hình thực thi | Thuộc tính đáng chú ý |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | CodeAct trong Docker | Nền tảng mở hoạt động tích cực nhất; có thể phát lại luồng sự kiện |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | Khung SWE-bench đầu cuối đầu tiên |
| Aider | Apache-2 | chỉnh sửa qua diff trong repo cục bộ | Khung tối giản, độ ổn định hồi quy cao |
| Cline | Apache-2 | Agent VS Code với chính sách công cụ | Khung mở đạt điểm cao nhất trên Sonnet 4.5 |
| Devin (Cognition) | Độc quyền | VM được quản lý + bộ lập kế hoạch | Danh mục sản phẩm “kỹ sư phần mềm AI” đầu tiên |
| Claude Code | Độc quyền | Các chế độ quyền + quy trình | Bài 10 trình bày chi tiết vòng lặp agent |

### Why scaffolding dominates

Một lần chạy lập trình là một quỹ đạo có tầm thời gian dài (Bài 1). Độ tin cậy cộng dồn qua các bước. Ba nơi khung mang lại thêm điểm:

1. **Truy xuất**: tìm đúng các file để đọc là nút thắt âm thầm. ACI của SWE-agent, chỉ mục file của OpenHands, và bản đồ repo của Aider đều giải quyết điều này.
2. **Vòng lặp bộ xác minh**: chạy kiểm thử, đọc dấu vết ngăn xếp, và thử lại tạo ra chênh lệch 10+ điểm trên SWE-bench.
3. **Khoanh vùng lỗi**: một sandbox hoàn tác khi có lỗi ngăn thiệt hại cộng dồn. Cùng mô hình đó khi có và không có vòng lặp bộ xác minh trông như hai sản phẩm khác nhau.

### Benchmark saturation and the real distribution

Các tác giả OpenHands và Epoch AI đều chỉ ra rằng SWE-bench Verified có phần đuôi dễ: 161 trong 500 tác vụ chỉ cần thay đổi 1–2 dòng. Điểm cao được thúc đẩy một phần bởi phần đuôi này. SWE-bench Pro giới hạn ở các thay đổi 10+ dòng và trả về điểm trong khoảng 23–59% ngay cả đối với các hệ thống tiên tiến nhất. Phân phối sản xuất của bạn gần như chắc chắn gần Pro hơn Verified.

Hệ quả đối với việc chọn agent: chạy một tập con giống Pro từ danh sách lỗi tồn đọng của chính bạn. Điểm quan trọng là điểm trên các tác vụ đại diện cho những gì bạn đưa ra.

```figure
a5-scaffold-delta
```

## Use It

`code/main.py` so sánh hai khung agent đồ chơi trên một phân phối tác vụ nhỏ cố định:

1. Một khung **gọi công cụ JSON** thực hiện một hành động mỗi lượt.
2. Một khung **CodeAct** có thể phát ra một đoạn Python nhỏ mỗi hành động.

Cả hai sử dụng một “mô hình” giả lập (các quy tắc xác định) nên phép so sánh tách khung khỏi chất lượng mô hình. Đầu ra cho thấy khung CodeAct giải quyết nhiều tác vụ hơn trong ít lượt hơn, với cái giá là phạm vi ảnh hưởng lớn hơn cho mỗi hành động.

## Ship It

`outputs/skill-scaffold-audit.md` giúp bạn kiểm toán một khung agent lập trình được đề xuất trước khi áp dụng: chất lượng truy xuất, sự hiện diện của bộ xác minh, cách ly sandbox, và độ phù hợp giữa benchmark với phân phối.

## Exercises

1. Chạy `code/main.py`. Mỗi khung cần bao nhiêu lượt trên cùng tập tác vụ? Phạm vi ảnh hưởng trên mỗi hành động của mỗi khung là gì?

2. Đọc bài báo OpenHands (arXiv:2407.16741). Bài báo lập luận CodeAct vượt các lệnh gọi công cụ JSON trên các tác vụ phức tạp. Xác định một chế độ lỗi mà bài báo thừa nhận và viết một câu về khi nào chế độ đó sẽ chi phối trong môi trường sản xuất.

3. Chọn một tác vụ từ danh sách lỗi tồn đọng của bạn yêu cầu thay đổi 10+ dòng trên hai file. Ước tính xác suất thành công đầu cuối cho một mô hình tiên tiến nhất dưới (a) các lệnh gọi công cụ JSON và (b) CodeAct. Giải thích sự chênh lệch.

4. SWE-bench Verified có 161 tác vụ một file, 1–2 dòng. Xây dựng một điểm số loại trừ chúng. Bảng xếp hạng thay đổi thứ tự như thế nào?

5. Đọc “Introducing SWE-bench Verified” (OpenAI). Giải thích phương pháp cụ thể được sử dụng để loại bỏ các tác vụ mơ hồ, và nêu tên một loại mà việc tuyển chọn sẽ bỏ sót.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| SWE-bench | “Benchmark lập trình” | Các issue GitHub thực với các bản vá chuẩn tham chiếu và bộ kiểm thử |
| SWE-bench Verified | “Tập con đã làm sạch” | 500 tác vụ được con người tuyển chọn, có phần đuôi dễ |
| SWE-bench Pro | “Tập con khó hơn” | Thay đổi 10+ dòng; mức tiên tiến nhất nằm ở 23–59% |
| CodeAct | “Mã dưới dạng hành động” | Agent phát ra Python; kernel kiểu Jupyter thực thi trong sandbox |
| JSON tool call (Lệnh gọi công cụ JSON) | “Gọi hàm” | Mỗi hành động là một payload JSON có cấu trúc được xác thực trước khi thực thi |
| Scaffold (Khung) | “Framework agent” | Truy xuất + bộ lập kế hoạch + bộ thực thi + vòng lặp bộ xác minh bao quanh mô hình cơ sở |
| ACI (Agent-Computer Interface) | “Định dạng của SWE-agent” | Tập lệnh được thiết kế để thuận tiện cho LLM, thay vì shell của con người |
| Verifier loop (Vòng lặp bộ xác minh) | “Kiểm thử và thử lại” | Chạy kiểm thử, đọc đầu ra, sửa bản vá; mức tăng độ tin cậy lớn nhất không đến từ mô hình |

## Further Reading

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) — benchmark và phương pháp gốc.
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — cách tập con được tuyển chọn được xây dựng.
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) — kiến trúc CodeAct và thiết kế luồng sự kiện.
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) — điểm số được theo dõi trực tiếp.
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — cách định hình độ tin cậy của agent lập trình có tầm thời gian dài.
