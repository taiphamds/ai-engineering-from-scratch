# Skill Libraries and Lifelong Learning (Voyager)

> Voyager (Wang và cộng sự, TMLR 2024) coi mã thực thi là một skill. Các skill có tên, có thể truy xuất, có thể kết hợp và được tinh chỉnh bằng phản hồi môi trường. Đây là kiến trúc tham chiếu cho các skill Claude Agent SDK, skillkit và mẫu thư viện skill năm 2026.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Learning Objectives

- Nêu tên ba thành phần của Voyager — chương trình học tự động, thư viện skill, prompting lặp — và vai trò của từng thành phần.
- Giải thích vì sao Voyager biến không gian hành động thành mã, không phải các lệnh nguyên thủy.
- Triển khai một thư viện skill dùng thư viện chuẩn với đăng ký, truy xuất, kết hợp và tinh chỉnh do thất bại thúc đẩy.
- Ánh xạ mẫu Voyager lên các skill Claude Agent SDK năm 2026 và hệ sinh thái skillkit.

## The Problem

Các agent xây dựng lại mọi khả năng từ đầu trong mỗi phiên làm sai ba việc:

1. **Lãng phí token.** Mọi tác vụ gợi lại cùng một suy luận.
2. **Mất tiến độ.** Một sửa chữa học được trong phiên A không chuyển sang phiên B.
3. **Thất bại khi kết hợp tầm dài.** Các tác vụ phức tạp cần hệ phân cấp khả năng; các prompt một lần không thể biểu đạt chúng.

Câu trả lời của Voyager: coi mỗi khả năng tái sử dụng là một đoạn mã có tên được lưu trong một thư viện, có thể truy xuất theo độ tương tự, có thể kết hợp với các skill khác và được tinh chỉnh bằng phản hồi thực thi.

## The Concept

### Three components

Voyager (arXiv:2305.16291) cấu trúc một agent quanh:

1. **Chương trình học tự động.** Một bộ đề xuất do sự tò mò thúc đẩy chọn tác vụ tiếp theo dựa trên tập skill hiện tại của agent và trạng thái môi trường. Khám phá là từ dưới lên.
2. **Thư viện skill.** Mỗi skill là mã thực thi. Các skill mới được thêm khi một tác vụ thành công. Các skill được truy xuất theo độ tương tự từ truy vấn đến mô tả.
3. **Cơ chế prompting lặp.** Khi thất bại, agent nhận các lỗi thực thi, phản hồi môi trường và đầu ra tự xác minh, rồi tinh chỉnh skill.

Đánh giá Minecraft (Wang và cộng sự, 2024): nhiều vật phẩm độc nhất hơn 3.3 lần, công cụ đá nhanh hơn 8.5 lần, công cụ sắt nhanh hơn 6.4 lần, duyệt bản đồ dài hơn 2.3 lần so với các đường cơ sở. Các con số dành riêng cho Minecraft, nhưng mẫu có thể chuyển giao.

### Action space = code

Hầu hết các agent phát ra các lệnh nguyên thủy. Voyager phát ra các hàm JavaScript. Một skill là:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

Được kết hợp từ các skill con. Được lưu và đánh khóa theo mô tả và embedding. Được truy xuất như một chương trình, không phải một prompt.

Đây là skill Claude Agent SDK năm 2026: một đoạn mã có tên, có thể truy xuất cộng các chỉ dẫn mà agent tải theo yêu cầu.

### Skill retrieval

Tác vụ mới "làm một cuốc chim kim cương." Agent:

1. Tạo embedding cho mô tả tác vụ.
2. Truy vấn thư viện skill để lấy top-k skill tương tự.
3. Truy xuất `craftIronPickaxe`, `mineDiamond`, `placeCraftingTable` v.v.
4. Kết hợp skill mới từ các thành phần nguyên thủy được truy xuất + logic mới.

Đây là mẫu mà các tài nguyên MCP (Giai đoạn 13) và các skill Agent SDK triển khai: truy xuất trên một bề mặt tri thức/mã, được giới hạn phạm vi vào tác vụ hiện tại.

### Iterative refinement

Vòng lặp phản hồi của Voyager:

1. Agent viết một skill.
2. Skill chạy trên môi trường.
3. Một trong ba tín hiệu trả về: `success`, `error` (với stack trace), `self-verification failure`.
4. Agent viết lại skill bằng tín hiệu làm ngữ cảnh.
5. Lặp cho đến khi thành công hoặc số vòng tối đa.

Đây là Self-Refine (Bài 05) được áp dụng cho sinh mã với xác minh dựa trên môi trường. CRITIC (Bài 05) là cùng mẫu với các công cụ bên ngoài làm bộ xác minh.

### Curriculum and exploration

Mô-đun chương trình học của Voyager đề xuất các tác vụ như "xây một nơi trú ẩn gần hồ" dựa trên những gì agent có và những gì nó chưa làm. Bộ đề xuất sử dụng trạng thái môi trường + danh mục skill để chọn một tác vụ ngay trên khả năng hiện tại — điểm tối ưu cho khám phá.

Với các agent sản xuất, điều này chuyển thành một toán tử "còn thiếu gì": với thư viện skill hiện tại và một miền cho trước, những skill nào chúng ta chưa bao phủ? Các nhóm thường triển khai điều này thủ công dưới dạng đánh giá chương trình học.

### Where this pattern goes wrong

- **Thư viện skill mục nát.** Cùng skill được thêm 10 lần với các mô tả hơi khác nhau. Thêm loại trùng khi ghi; truy xuất chỉ trả về một.
- **Trôi dạt skill kết hợp.** Skill cha phụ thuộc vào một skill con đã được tinh chỉnh. Đánh phiên bản các skill; một skill cha được ghim vào v1 không tự nhiên nhận v3.
- **Chất lượng truy xuất.** Truy xuất vector trên các mô tả skill suy giảm khi thư viện tăng quá vài trăm. Bổ sung bằng các bộ lọc thẻ và các ràng buộc cứng ("chỉ các skill có `category=tooling`").

```figure
voyager-skills
```

## Build It

`code/main.py` triển khai một thư viện skill dùng thư viện chuẩn:

- `Skill` — tên, mô tả, mã (dưới dạng chuỗi), phiên bản, các thẻ, các phụ thuộc.
- `SkillLibrary` — đăng ký, tìm kiếm (chồng lấp token), kết hợp (sắp xếp tô pô các phụ thuộc) và tinh chỉnh (tăng phiên bản khi cập nhật).
- Một agent được viết kịch bản đăng ký ba skill nguyên thủy, kết hợp một skill thứ tư, gặp một thất bại và tinh chỉnh.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy các lần ghi thư viện, truy xuất, kết hợp, một lần thực thi thất bại và một lần tinh chỉnh v2 — vòng lặp Voyager từ đầu đến cuối.

## Use It

- **Các skill Claude Agent SDK** (Anthropic) — tham chiếu năm 2026: mỗi skill có một mô tả, mã và các chỉ dẫn; được tải theo yêu cầu trong một phiên agent.
- **skillkit** (npm: skillkit) — quản lý skill xuyên agent cho 32+ agent lập trình AI.
- **Các thư viện skill tùy chỉnh** — dành riêng cho miền (các skill SQL cho agent dữ liệu, các skill Terraform cho agent hạ tầng). Mẫu Voyager thu nhỏ được.
- **`tools` OpenAI Agents SDK** — ở mức thấp; mỗi công cụ là một skill nhẹ.

## Ship It

`outputs/skill-skill-library.md` tạo một thư viện skill có dạng Voyager với đăng ký, truy xuất, đánh phiên bản và tinh chỉnh được nối sẵn cho bất kỳ runtime đích nào.

## Exercises

1. Thêm một bộ phát hiện chu trình phụ thuộc vào `compose()`. Điều gì xảy ra khi skill A phụ thuộc B mà B phụ thuộc A? Lỗi hay cảnh báo?
2. Triển khai ghim phiên bản cho từng skill. Khi một skill cha kết hợp skill con `crafting@1`, một lần tinh chỉnh lên `crafting@2` không được âm thầm nâng cấp skill cha.
3. Thay truy xuất chồng lấp token bằng các embedding sentence-transformers (hoặc một triển khai BM25 dùng thư viện chuẩn). Đo retrieval@5 trên một thư viện mô phỏng 50 skill.
4. Thêm một agent "chương trình học": với thư viện hiện tại và một mô tả miền cho trước, đề xuất 5 skill còn thiếu. Gọi nó hàng tuần.
5. Đọc tài liệu skill Claude Agent SDK của Anthropic. Chuyển thư viện mô phỏng sang schema skill của SDK. Điều gì thay đổi về khả năng khám phá?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Skill (Kỹ năng) | "Khả năng tái sử dụng" | Đoạn mã có tên + mô tả, có thể truy xuất theo độ tương tự |
| Skill library (Thư viện skill) | "Bộ nhớ cách làm của agent" | Kho lưu giữ các skill, có thể tìm kiếm và kết hợp |
| Curriculum (Chương trình học) | "Bộ đề xuất tác vụ" | Bộ tạo mục tiêu từ dưới lên do khoảng cách khả năng hiện tại thúc đẩy |
| Composition (Kết hợp) | "DAG skill" | Các skill gọi các skill; được sắp xếp tô pô khi thực thi |
| Iterative refinement (Tinh chỉnh lặp) | "Vòng lặp tự sửa chữa" | Phản hồi môi trường + lỗi + tự xác minh được đưa trở lại phiên bản tiếp theo |
| Action-space-as-code (Không gian hành động dưới dạng mã) | "Các hành động bằng chương trình" | Phát ra các hàm, không phải lệnh nguyên thủy, cho hành vi kéo dài theo thời gian |
| Dedup on write (Loại trùng khi ghi) | "Gộp skill" | Các mô tả gần trùng gộp thành một skill chuẩn duy nhất |

## Further Reading

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) — bài báo thư viện skill gốc
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — các skill như sự sản phẩm hóa năm 2026
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — các skill và agent phụ trong thực tế
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — vòng lặp tinh chỉnh bên dưới Voyager
