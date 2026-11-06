# Case Studies and the 2026 State of the Art

> Ba tham chiếu mức sản xuất để nghiên cứu đầu cuối, mỗi tham chiếu minh họa một lát cắt khác nhau của kỹ thuật đa agent. **Hệ thống Research của Anthropic** (bộ điều phối-worker, 15x token, +90.2% so với Opus 4 đơn agent, các triển khai cầu vồng) là trường hợp bộ giám sát chuẩn. **MetaGPT / ChatDev** (chuyên biệt hóa vai trò mã hóa SOP cho kỹ thuật phần mềm; “khử ảo giác bằng giao tiếp” của ChatDev; mở rộng MacNet tới >1000 agent qua các DAG, arXiv:2406.07155) là trường hợp phân rã vai trò chuẩn. **OpenClaw / Moltbook** (ban đầu là Clawdbot của Peter Steinberger, tháng 11 năm 2025; được đổi tên hai lần; 247k sao GitHub đến tháng 3 năm 2026; các agent vòng lặp ReAct cục bộ; Moltbook như một mạng xã hội chỉ agent với ~2.3M tài khoản agent trong vài ngày ra mắt, được Meta mua lại 2026-03-10) minh họa điều gì xảy ra ở quy mô quần thể: hoạt động kinh tế nổi lên, các rủi ro chèn prompt, quy định cấp nhà nước (Trung Quốc hạn chế OpenClaw trên các máy tính chính phủ, tháng 3 năm 2026). **Bối cảnh framework tháng 4 năm 2026:** LangGraph và CrewAI dẫn đầu sản xuất; AG2 là sự tiếp nối AutoGen của cộng đồng; Microsoft AutoGen ở chế độ bảo trì (được hợp nhất vào Microsoft Agent Framework, RC tháng 2 năm 2026); OpenAI Agents SDK là phiên bản kế nhiệm Swarm cho sản xuất; Google ADK (tháng 4 năm 2025) là bên gia nhập thuần A2A. Mọi framework lớn giờ cung cấp hỗ trợ MCP; hầu hết cung cấp A2A. Bài này đọc từng trường hợp đầu cuối và chắt lọc các mẫu chung để bạn có thể chọn tham chiếu phù hợp cho hệ thống sản xuất tiếp theo.

**Type:** Learn (capstone)
**Languages:** —
**Prerequisites:** all of Phase 16 (Lessons 01-24)
**Time:** ~90 minutes

## Problem

Kỹ thuật đa agent là một ngành trẻ. Các tham chiếu sản xuất ít, và mỗi tham chiếu bao phủ một phần khác nhau của không gian. Đọc từng cái một hữu ích; so sánh chúng như một tập hữu ích hơn. Bài này coi ba nghiên cứu tình huống chuẩn năm 2026 như một danh sách đọc đầu cuối, ghim các mẫu chung, và lập bản đồ bối cảnh framework để bạn có thể lựa chọn framework từ tri thức, không phải tiếp thị.

## Concept

### Anthropic Research system

Trường hợp bộ giám sát-worker sản xuất. Claude Opus 4 lập kế hoạch và tổng hợp; các agent con Claude Sonnet 4 nghiên cứu song song. Bài viết kỹ thuật được công bố: https://www.anthropic.com/engineering/multi-agent-research-system.

Các kết quả đo then chốt:

- Cải thiện **+90.2%** so với Opus 4 đơn agent trên các đánh giá nghiên cứu nội bộ.
- **80% phương sai BrowseComp** được giải thích bằng **chỉ mức sử dụng token** — đa agent thắng phần lớn vì mỗi agent con nhận một cửa sổ ngữ cảnh mới.
- **15x token mỗi truy vấn** so với một agent đơn lẻ.
- **Triển khai cầu vồng** vì các agent chạy dài và có trạng thái.

Các bài học thiết kế được hệ thống hóa:

1. **Điều chỉnh nỗ lực theo độ phức tạp truy vấn.** Đơn giản → 1 agent với 3-10 lệnh gọi công cụ. Trung bình → 3 agent. Nghiên cứu phức tạp → 10+ agent con.
2. **Rộng trước, rồi hẹp.** Các agent con tìm kiếm rộng; agent trưởng tổng hợp; các agent con tiếp nối đào sâu có mục tiêu.
3. **Các triển khai cầu vồng.** Giữ các phiên bản môi trường chạy cũ sống cho đến khi các agent đang diễn ra của chúng kết thúc.
4. **Xác minh không tùy chọn.** Hệ thống được quan sát thấy ảo giác khi không có các vai trò xác minh tường minh.

Đây là trường hợp tham chiếu cho cấu trúc liên kết bộ giám sát-worker (Giai đoạn 16 · 05) ở quy mô sản xuất.

### MetaGPT / ChatDev

Trường hợp phân rã vai trò SOP sản xuất. Bao phủ arXiv:2308.00352 (MetaGPT) và arXiv:2307.07924 (ChatDev).

MetaGPT mã hóa các SOP kỹ thuật phần mềm thành các prompt vai trò: Quản lý sản phẩm, Kiến trúc sư, Quản lý dự án, Kỹ sư, Kỹ sư QA. Cách định hình của bài báo: `Code = SOP(Team)`. Mỗi vai trò có một prompt hẹp, chuyên biệt; các bàn giao giữa vai trò mang các hiện vật có cấu trúc (tài liệu PRD, tài liệu kiến trúc, mã).

Đóng góp của ChatDev: **khử ảo giác bằng giao tiếp**. Các agent yêu cầu chi tiết cụ thể trước khi trả lời — một agent thiết kế hỏi lập trình viên ngôn ngữ nào được dự định trước khi phác thảo UI, thay vì đoán. Bài báo báo cáo điều này giảm ảo giác trong các pipeline đa agent một cách đo được.

MacNet (arXiv:2406.07155) mở rộng ChatDev tới **>1000 agent qua các DAG**. Mỗi node DAG là một chuyên biệt hóa vai trò; các cạnh mã hóa các hợp đồng bàn giao. Quy mô khả thi vì định tuyến tường minh và có thể tính ngoại tuyến.

Các bài học thiết kế:

1. **Cấu trúc quan trọng hơn kích thước.** Một nhóm SOP 5 vai trò chặt chẽ vượt một nhóm 50 agent không cấu trúc.
2. **Các hợp đồng bàn giao bằng văn bản.** Các hiện vật được truyền giữa các vai trò theo một lược đồ.
3. **Khử ảo giác bằng giao tiếp** là một mẫu rẻ, chịu lực.
4. **Các DAG mở rộng xa hơn trò chuyện.** Khi luồng có thể biết, mã hóa nó.

Đây là trường hợp tham chiếu cho chuyên biệt hóa vai trò (Giai đoạn 16 · 08) và cấu trúc liên kết có cấu trúc (Giai đoạn 16 · 15).

### OpenClaw / Moltbook ecosystem

Trường hợp quy mô quần thể sản xuất. Dòng thời gian:

- **Tháng 11 năm 2025:** Clawdbot (agent lập trình vòng lặp ReAct cục bộ của Peter Steinberger) được phát hành.
- **Tháng 12 năm 2025 – tháng 3 năm 2026:** được đổi tên hai lần (Clawdbot → OpenClaw → tiếp tục dưới OpenClaw).
- **Tháng 2 năm 2026:** Moltbook ra mắt như một mạng xã hội chỉ agent trên cùng các nguyên thủy; ~2.3M tài khoản agent trong vài ngày.
- **Tháng 3 năm 2026 (2026-03-10):** Meta mua lại Moltbook.
- **Tháng 3 năm 2026:** Trung Quốc hạn chế OpenClaw trên các máy tính chính phủ.
- **Tháng 3 năm 2026:** OpenClaw vượt 247k sao GitHub.

Đây là hình dạng đa agent khi bạn đặt hàng triệu agent trên một nền tảng dùng chung:

- **Hoạt động kinh tế nổi lên.** Các agent mua, bán, và phục vụ nhau bằng các thanh toán token.
- **Các rủi ro chèn prompt ở quy mô quần thể.** Một prompt độc hại trong một hồ sơ agent lan truyền lan tới hàng nghìn tương tác giữa các agent trong vài giờ.
- **Phản ứng quy định cấp nhà nước.** Trong vài tuần ra mắt, quy định tới hệ sinh thái.

Các bài học thiết kế từ trường hợp này một phần kỹ thuật, một phần quản trị:

1. **Đa agent ở quy mô quần thể là một chế độ mới.** Các thực hành tốt nhất của hệ thống riêng lẻ (xác minh, rõ vai trò) vẫn áp dụng nhưng không đủ.
2. **Chèn prompt là XSS mới.** Coi các hồ sơ agent và các thông điệp xuyên agent là đầu vào không đáng tin cậy theo mặc định.
3. **Quy định nhanh hơn các chu kỳ thiết kế.** Lập kế hoạch cho nó.
4. **Mã nguồn mở + quy mô lan truyền cộng dồn.** 247k sao trong ~4 tháng là bất thường; thiết kế cho tải bùng phát triển khai.

Xem [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) và đưa tin CNBC / Palo Alto Networks để biết chi tiết hệ sinh thái. Với các nền tảng kỹ thuật, các repo Clawdbot / OpenClaw bộc lộ vòng lặp ReAct cục bộ; các bài đăng công khai của Moltbook tiết lộ kiến trúc đồ thị xã hội bên trên.

### Framework landscape April 2026

| Framework | Trạng thái | Tốt nhất cho | Ghi chú |
|---|---|---|---|
| **LangGraph** (LangChain) | Dẫn đầu sản xuất | đồ thị có cấu trúc + tạo checkpoint + con người trong vòng lặp | mặc định được khuyến nghị cho sản xuất |
| **CrewAI** | Dẫn đầu sản xuất | các nhóm dựa trên vai trò với các quy trình Sequential/Hierarchical | mạnh cho phân rã vai trò |
| **AG2** | Cộng đồng bảo trì | GroupChat + lựa chọn người nói | sự tiếp nối AutoGen v0.2 |
| **Microsoft AutoGen** | Chế độ bảo trì (tháng 2 năm 2026) | — | được hợp nhất vào Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (tháng 2 năm 2026) | các mẫu điều phối + tích hợp doanh nghiệp | bên gia nhập mới; theo dõi |
| **OpenAI Agents SDK** | Sản xuất | phiên bản kế nhiệm Swarm | mẫu bàn giao trả về công cụ |
| **Google ADK** | Sản xuất (tháng 4 năm 2025) | thuần A2A | tích hợp Google Cloud |
| **Anthropic Claude Agent SDK** | Sản xuất | một agent đơn lẻ + mở rộng Research | xem bài viết hệ thống Research |

Mọi framework lớn giờ cung cấp hỗ trợ **MCP**; hầu hết cung cấp **A2A**. Tương thích giao thức không còn là một điểm khác biệt.

### The common patterns across all three cases

1. **Bộ điều phối + các worker** (bộ giám sát tường minh Anthropic, PM như bộ giám sát của MetaGPT, các agent riêng lẻ OpenClaw + các hiệu ứng mạng).
2. **Các hợp đồng bàn giao có cấu trúc** (các mô tả tác vụ agent con Anthropic, các tài liệu PRD/kiến trúc MetaGPT, các hiện vật A2A OpenClaw).
3. **Xác minh như vai trò hạng nhất** (bộ xác minh Anthropic, Kỹ sư QA MetaGPT, các bộ xác thực trong mạng OpenClaw).
4. **Mở rộng quy mô là cấu trúc liên kết + nền tảng, không chỉ nhiều agent hơn** (các triển khai cầu vồng, các DAG MacNet, các nền tảng quy mô quần thể).
5. **Chi phí đáng kể và được tiết lộ** (15x token, ngân sách theo từng vai trò trong MetaGPT, định giá theo từng tương tác trong Moltbook).
6. **Lập trường bảo mật tường minh** (sandbox của Anthropic, các hạn chế vai trò của MetaGPT, chèn prompt của OpenClaw như một bề mặt tấn công đã biết).

### Choosing a reference for your next project

- **Tác vụ nghiên cứu / tri thức sản xuất → Anthropic Research.** Các agent con ngữ cảnh mới thắng.
- **Quy trình kỹ thuật / chuỗi công cụ → MetaGPT / ChatDev.** Các vai trò + SOP + hợp đồng bàn giao.
- **Sản phẩm xã hội hiệu ứng mạng → OpenClaw / Moltbook.** Nền tảng + nền kinh tế nổi lên.
- **Tự động hóa doanh nghiệp cổ điển → CrewAI hoặc LangGraph** (dẫn đầu sản xuất, môi trường chạy ổn định).

### The 2026 state-of-the-art summary

Lĩnh vực ở đâu vào tháng 4 năm 2026:

- **Các framework đang hội tụ.** Hỗ trợ MCP + A2A là yêu cầu tối thiểu. Ngữ nghĩa bàn giao là lựa chọn thiết kế còn lại.
- **Đánh giá đang chặt chẽ hơn.** SWE-bench Pro, MARBLE, các benchmark giảm thiểu STRATUS. Pro là kiểm tra thực tế chống nhiễm bẩn hiện tại.
- **Các tỷ lệ thất bại sản xuất đo được** (Cemri 2025 MAST; 41-86.7% trên MAS thực). Lĩnh vực đã ra khỏi thời kỳ “trông tuyệt trong demo”.
- **Chi phí là ràng buộc kỹ thuật trung tâm.** Chi phí token mỗi tác vụ, thời gian thực mỗi tương tác, chi phí phụ triển khai cầu vồng. Đa agent thắng về độ chính xác nhưng thua về chi phí — và đánh đổi đó là quyết định kinh doanh.
- **Quy định là một đầu vào gần hạn, không phải một mối quan ngại nền.** Các khu vực tài phán đang di chuyển nhanh hơn các chu kỳ triển khai riêng lẻ.

```figure
a5-orchestrator-scale
```

## Use It

`outputs/skill-case-study-mapper.md` là một skill đọc một thiết kế hệ thống đa agent được đề xuất và ánh xạ nó tới nghiên cứu tình huống gần nhất, trình bày các quyết định thiết kế mà nghiên cứu tình huống đó đã kiểm thử.

## Ship It

Các quy tắc khởi đầu cho đa agent sản xuất năm 2026:

- **Bắt đầu từ một nghiên cứu tình huống, không phải từ đầu.** Chọn gần nhất trong Anthropic Research / MetaGPT / OpenClaw và điều chỉnh.
- **Áp dụng MCP + A2A.** Tính di động xuyên framework có giá trị; hỗ trợ giao thức miễn phí.
- **Đo theo SWE-bench Pro hoặc dạng tương đương Pro nội bộ của bạn.** Verified bị nhiễm bẩn.
- **Trả thuế xác minh.** Một bộ xác minh độc lập tốn ~20-30% ngân sách token của bạn và mua tính đúng đắn đo được.
- **Triển khai cầu vồng các agent chạy dài.** Kỳ vọng các lần chạy agent nhiều giờ trở thành thường lệ.
- **Đọc WMAC 2026 và các công trình tiếp nối MAST.** Ngành đang di chuyển nhanh.

## Exercises

1. Đọc bài viết hệ thống Anthropic Research đầu cuối. Xác định ba quyết định thiết kế sẽ thay đổi nếu bạn thay Opus 4 bằng một mô hình nhỏ hơn (ví dụ: Haiku 4).
2. Đọc MetaGPT các Phần 3-4 (arXiv:2308.00352). Mã hóa một SOP từ lĩnh vực riêng (không phải phần mềm) thành các prompt vai trò. SOP hàm ý bao nhiêu vai trò?
3. Đọc ChatDev (arXiv:2307.07924). Xác định cơ chế “khử ảo giác bằng giao tiếp.” Triển khai nó trong một hệ thống đa agent hiện có của bạn.
4. Đọc về OpenClaw và Moltbook. Chọn một chế độ lỗi cụ thể nổi lên ở quy mô quần thể sẽ không xuất hiện trong một hệ thống 5 agent. Bạn sẽ thiết kế chống nó như thế nào?
5. Chọn dự án đa agent hiện tại của bạn. Nghiên cứu tình huống nào trong ba nghiên cứu là tham chiếu gần nhất? Các quyết định thiết kế nào từ nghiên cứu đó bạn CHƯA áp dụng? Viết xuống một quyết định bạn sẽ áp dụng quý này.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Anthropic Research | “Tham chiếu bộ giám sát” | Claude Opus 4 + các agent con Sonnet 4; 15x token; +90.2% so với một agent đơn lẻ. |
| MetaGPT | “SOP dưới dạng prompt” | Phân rã vai trò cho kỹ thuật phần mềm; `Code = SOP(Team)`. |
| ChatDev | “Các agent như các vai trò” | Nhà thiết kế / lập trình viên / người xem xét / người kiểm thử; khử ảo giác bằng giao tiếp. |
| MacNet | “Mở rộng ChatDev qua DAG” | arXiv:2406.07155; 1000+ agent qua định tuyến DAG tường minh. |
| OpenClaw | “Các agent vòng lặp ReAct cục bộ” | Dự án của Steinberger; 247k sao đến tháng 3 năm 2026. |
| Moltbook | “Mạng xã hội chỉ agent” | 2.3M tài khoản agent; được Meta mua lại tháng 3 năm 2026. |
| Rainbow deploy (Triển khai cầu vồng) | “Nhiều phiên bản đồng thời” | Giữ các phiên bản môi trường chạy cũ sống cho các agent chạy dài đang diễn ra. |
| Communicative dehallucination (Khử ảo giác bằng giao tiếp) | “Hỏi trước khi trả lời” | Các agent yêu cầu chi tiết cụ thể từ các bên ngang hàng thay vì đoán. |
| WMAC 2026 | “Workshop AAAI” | Đầu mối cộng đồng tháng 4 năm 2026 cho phối hợp đa agent. |

## Further Reading

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — tham chiếu sản xuất bộ giám sát-worker
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) — phân rã vai trò SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) — khử ảo giác bằng giao tiếp
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155) — mở rộng quy mô dựa trên DAG
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) — tổng quan hệ sinh thái
- [WMAC 2026](https://multiagents.org/2026/) — AAAI 2026 Bridge Program Workshop on Multi-Agent Coordination
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — dẫn đầu sản xuất
- [CrewAI docs](https://docs.crewai.com/en/introduction) — framework dựa trên vai trò
