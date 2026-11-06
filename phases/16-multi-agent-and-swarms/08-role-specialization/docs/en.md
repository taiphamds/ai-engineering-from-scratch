# Role Specialization — Planner, Critic, Executor, Verifier

> Phân rã đa agent phổ biến nhất năm 2026: một agent lập kế hoạch, một agent thực thi, một agent phê bình hoặc xác minh. MetaGPT (arXiv:2308.00352) hình thức hóa điều này thành các SOP được mã hóa vào các prompt vai trò — Quản lý sản phẩm, Kiến trúc sư, Quản lý dự án, Kỹ sư, Kỹ sư QA — theo `Code = SOP(Team)`. ChatDev (arXiv:2307.07924) nối chuỗi nhà thiết kế, lập trình viên, người xem xét, người kiểm thử qua một “chuỗi trò chuyện” với “khử ảo giác bằng giao tiếp” (các agent yêu cầu tường minh các chi tiết còn thiếu). Bộ xác minh đóng vai trò chịu lực: Cemri và cộng sự (MAST, arXiv:2503.13657) cho thấy mọi thất bại đa agent có thể được truy về xác minh thiếu hoặc hỏng. PwC báo cáo mức tăng độ chính xác 7× (10% → 70%) từ các vòng lặp xác thực có cấu trúc trong CrewAI.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 05 (Supervisor)
**Time:** ~60 minutes

## Problem

Các hệ thống đa agent chung chung tạo ra đầu ra chung chung. Ba người viết mã trong một cuộc trò chuyện nhóm viết ba kiểu của cùng mã tầm thường. Bạn có thể thêm các agent, thêm các vòng, và vẫn không vượt ngưỡng chất lượng.

Cách sửa không phải là nhiều agent hơn — mà là các agent *khác nhau*. Giao các vai trò riêng biệt. Cho bên phê bình những công cụ mà bộ lập kế hoạch không có. Cho bộ xác minh một bộ kiểm thử khách quan. Giờ hệ thống có bất đồng nội bộ với sửa chữa có căn cứ, không chỉ đoán song song.

## Concept

### The four canonical roles

**Bộ lập kế hoạch.** Đọc mục tiêu, tạo một danh sách bước hoặc một đặc tả. Công cụ: truy xuất tri thức, tài liệu. Đầu ra: kế hoạch có cấu trúc.

**Bộ thực thi.** Đọc từng bước kế hoạch một, tạo hiện vật. Công cụ: các công cụ công việc thực (trình biên dịch mã, shell, máy khách API). Đầu ra: hiện vật.

**Bên phê bình.** Đọc đầu ra bộ thực thi theo ý định của bộ lập kế hoạch. Công cụ: truy cập chỉ đọc tới hiện vật, phân tích tĩnh. Đầu ra: chấp nhận/từ chối kèm lý do.

**Bộ xác minh.** Đọc hiện vật và chạy một kiểm tra xác định. Công cụ: trình chạy kiểm thử, bộ kiểm tra kiểu, bộ xác thực lược đồ. Đầu ra: đạt/không đạt kèm bằng chứng.

Bên phê bình chủ quan, có quan điểm, thường dựa trên LLM. Bộ xác minh khách quan, xác định, thường dựa trên mã. Chúng không phải cùng vai trò.

### MetaGPT's SOP pattern

MetaGPT (arXiv:2308.00352) mã hóa các SOP kỹ thuật phần mềm thành các prompt vai trò:

- **Quản lý sản phẩm** viết PRD.
- **Kiến trúc sư** tạo thiết kế hệ thống.
- **Quản lý dự án** chia tác vụ.
- **Kỹ sư** triển khai.
- **Kỹ sư QA** chạy kiểm thử.

Mỗi vai trò có một lược đồ đầu vào/đầu ra nghiêm ngặt. Prompt vai trò nói vai trò *là gì* và nó *phải tạo ra gì*. Công thức `Code = SOP(Team)` — các SOP xác định biến một nhóm LLM thành một pipeline có thể dự đoán.

### ChatDev's communicative dehallucination

ChatDev thêm một bước then chốt: khi một bộ thực thi cần một chi tiết cụ thể không có trong kế hoạch, nó hỏi tường minh nhà thiết kế trước khi tiếp tục. Điều này ngăn lỗi LLM kinh điển là bịa ra chi tiết một cách có vẻ hợp lý.

Triển khai: prompt vai trò bao gồm “khi bạn cần thông tin cụ thể bạn chưa được cung cấp, hỏi vai trò liên quan bằng tên trước khi tạo đầu ra.”

### Why verifier matters most

Cemri và cộng sự (MAST) truy vết 1642 thất bại thực thi đa agent. 21.3% là các khoảng trống xác minh — hệ thống đưa ra một câu trả lời không ai kiểm tra. 79% còn lại thường truy về “có một kiểm tra thất bại âm thầm hoặc chưa bao giờ được chạy.” Xác minh là vai trò chịu lực.

PwC báo cáo (các triển khai CrewAI, 2025) rằng thêm một vòng lặp xác thực có cấu trúc chuyển độ chính xác từ 10% lên 70%. Mức tăng 7× từ một vai trò.

### Critic vs verifier

- Một bên phê bình là một LLM xem xét một hiện vật về chất lượng. Chủ quan. Có thể bị đánh lừa bởi văn xuôi có vẻ hợp lý.
- Một bộ xác minh là một chương trình xác định chạy trên hiện vật. Khách quan. Đưa ra đạt/không đạt kèm bằng chứng.

Sử dụng cả hai. Bên phê bình bắt các vấn đề thị hiếu mà bộ xác minh không thể diễn đạt. Bộ xác minh bắt các lỗi mà bên phê bình không thể thấy vì chúng chỉ xuất hiện lúc chạy.

### The anti-pattern

Mọi vai trò trong hệ thống của bạn là một LLM và đầu ra của mọi vai trò là “tôi thấy ổn.” Chế độ lỗi MAST kinh điển. Thêm ít nhất một bộ xác minh có đạt/không đạt được quyết định bằng mã, không phải bằng một LLM.

### Framework mappings

- **CrewAI** — `Agent(role, goal, backstory)` là bề mặt chuyên biệt hóa sách giáo khoa.
- **LangGraph** — các node có thể có các prompt chuyên biệt; các cạnh thực thi pipeline.
- **AutoGen** — các ConversableAgent riêng theo vai trò với các tên một từ trong một GroupChat.
- **OpenAI Agents SDK** — các công cụ bàn giao giữa các Agent chuyên biệt theo vai trò.

```figure
swarm-roles
```

## Build It

`code/main.py` triển khai một pipeline 4 vai trò xây dựng một hàm Python đơn giản:

- **Bộ lập kế hoạch** tạo một đặc tả.
- **Bộ thực thi** sinh một chuỗi mã.
- **Bên phê bình** (mô phỏng LLM) gắn cờ các vấn đề rõ ràng.
- **Bộ xác minh** chạy mã được sinh trong một sandbox (`exec`) với một ca kiểm thử.

Demo chạy hai lần: một lần bộ thực thi tạo mã đúng (bên phê bình + bộ xác minh đều đạt), một lần bộ thực thi tạo mã lệch đặc tả (bên phê bình bỏ sót lỗi vì nó trông hợp lý, bộ xác minh bắt nó vì kiểm thử thất bại).

Chạy:

```
python3 code/main.py
```

## Use It

`outputs/skill-role-designer.md` nhận một tác vụ và tạo danh sách vai trò (3-5 vai trò), lược đồ đầu vào/đầu ra theo từng vai trò, và kiểm tra bộ xác minh. Sử dụng nó trước khi kết nối các agent vào một framework.

## Ship It

Danh sách kiểm tra:

- **Ít nhất một bộ xác minh xác định.** Không bao giờ toàn LLM.
- **Lược đồ I/O tường minh theo từng vai trò.** Bộ lập kế hoạch trả về một đặc tả, không phải văn xuôi; bộ thực thi đọc lược đồ đó.
- **Khử ảo giác bằng giao tiếp.** Bộ thực thi phải hỏi bộ lập kế hoạch khi thiếu thông tin; không bao giờ bịa ra nó.
- **Thứ tự bên phê bình/bộ xác minh.** Chạy bên phê bình trước (rẻ, bắt các vấn đề thiết kế), bộ xác minh sau (chậm, bắt lỗi).
- **Ngân sách vòng lặp.** Tối đa 2 vòng sửa đổi bên phê bình-bộ thực thi trước khi chuyển cấp tới con người.

## Exercises

1. Chạy `code/main.py` và quan sát cách bộ xác minh bắt lỗi bên phê bình bỏ sót. Thêm một kiểm tra phân tích tĩnh (đếm số lần xuất hiện của `return`) như một bộ xác minh bổ sung. Nó bắt gì mà kiểm thử lúc chạy bỏ sót?
2. Thêm một vai trò thứ 5: “nhà phân tích yêu cầu” chuyển mong muốn người dùng thành đặc tả sẵn sàng cho bộ lập kế hoạch. Những yêu cầu khử ảo giác bằng giao tiếp nào nên chảy lên nó?
3. Đọc Phần 3 MetaGPT (“Agents”). Liệt kê lược đồ đầu vào/đầu ra của mỗi vai trò trong 5 vai trò MetaGPT.
4. Đọc sơ đồ chuỗi trò chuyện của ChatDev (arXiv:2307.07924 Hình 3). Xác định nơi khử ảo giác bằng giao tiếp phá một vòng lặp vốn sẽ vô hạn.
5. Mức tăng độ chính xác 7× của PwC đến từ các vòng lặp xác minh. Giả thuyết ba tác vụ mà thêm một bộ xác minh sẽ không giúp — nơi kiểm tra tính đúng đắn xác định là không thể hoặc quá đắt.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Role specialization (Chuyên biệt hóa vai trò) | “Các agent khác nhau, công việc khác nhau” | Các prompt hệ thống riêng biệt được điều chỉnh cho các vai trò lập kế hoạch/thực thi/phê bình/xác minh. |
| SOP pattern (Mẫu SOP) | “Quy trình vận hành tiêu chuẩn được mã hóa” | Cách định hình của MetaGPT: các lược đồ I/O nghiêm ngặt theo từng vai trò biến một nhóm thành một pipeline. |
| Communicative dehallucination (Khử ảo giác bằng giao tiếp) | “Hỏi trước khi bịa” | Mẫu ChatDev: bộ thực thi hỏi bộ lập kế hoạch khi thiếu một chi tiết thay vì bịa ra. |
| Critic (Bên phê bình) | “Người xem xét LLM” | Người xem xét chủ quan, có quan điểm. Bắt các vấn đề thị hiếu. Có thể bị đánh lừa bởi văn xuôi có vẻ hợp lý. |
| Verifier (Bộ xác minh) | “Kiểm tra xác định” | Đạt/không đạt dựa trên mã. Trình chạy kiểm thử, bộ kiểm tra kiểu, bộ xác thực lược đồ. Không thể bị đánh lừa. |
| Verification gap (Khoảng trống xác minh) | “Không ai kiểm tra” | 21.3% các thất bại MAST. Câu trả lời được đưa ra không có một kiểm tra lẽ ra đã bắt lỗi. |
| Revision loop (Vòng lặp sửa đổi) | “Bên phê bình gửi nó lại” | Từ chối của bên phê bình kích hoạt bộ thực thi chạy lại với phản hồi. Cần một ngân sách. |
| All-LLM anti-pattern (Phản mẫu toàn LLM) | “Tôi thấy ổn” | Mọi vai trò là một LLM, không có kiểm tra xác định. Thất bại MAST kinh điển. |

## Further Reading

- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) — bài báo tham chiếu SOP dưới dạng prompt vai trò
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) — chuỗi trò chuyện + khử ảo giác bằng giao tiếp
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — hệ phân loại MAST; các khoảng trống xác minh là 21.3% thất bại
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) — bề mặt đặc tả vai trò sản xuất
