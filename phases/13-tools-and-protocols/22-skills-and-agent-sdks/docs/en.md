# Agent Skills: Portable Contract and Runtime Boundary

> Skill không phải prompt dài có tên file tốt hơn. Nó là gói có thể khám phá gồm chỉ dẫn, tài nguyên và hàm hỗ trợ thực thi được đi vào ngữ cảnh agent qua hợp đồng runtime.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## Learning Objectives

- Định nghĩa skill agent không nhầm với prompt, chỉ dẫn repo, công cụ, hook, agent phụ hoặc plugin.
- Đọc hợp đồng `SKILL.md` có thể chuyển và tách khỏi phần mở rộng riêng runtime.
- Giải thích khám phá, lựa chọn, kích hoạt, tải tài nguyên, dùng công cụ và xác minh là giai đoạn vòng đời riêng.
- Xác thực gói skill trước runtime đặt vào danh mục agent.
- Chọn giữa skill, công cụ MCP, hook, agent phụ hoặc mã thường cho tác vụ cụ thể.

## Ten-Minute First Success

Làm điều này trước giải thích dài. Bạn sẽ tạo skill nhỏ, cài
toàn bộ bundle reviewer vào host agent thật, gọi, xác minh
kết quả và bỏ nó. Điều này chứng minh vòng đời với kết quả quan sát được.

### Preflight for the real-host lab

Điểm kiểm tra host thật cần Node.js, `npx`, Python 3, một host
có khả năng skill đã chọn và quyền ghi vào phạm vi dự án hoặc người dùng bạn chọn trong
trình cài. Xác minh lệnh cục bộ trước:

```bash
node --version
npx --version
python3 --version
```

Quyết định host và phạm vi dùng trước cài. Nếu có
yêu cầu không sẵn, đọc bài trên website hoặc tiếp tục
bài tập gói thủ công bên dưới. Dự phòng đó dạy hợp đồng, nhưng
không chứng minh khám phá host, gọi, thực thi script đi kèm hoặc
hành vi gỡ cài. Giữ các quan sát đánh dấu đang chờ.

### 1. Start in an empty working directory

Chạy lệnh này từ mọi thư mục cha bạn giữ công việc học:

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

Lệnh cuối nên không in gì. Nếu in file, chọn thư mục
rỗng khác để đánh giá có ranh giới rõ.

Tạo thư mục cho skill đầu:

```bash
mkdir -p my-first-skill
```

Tạo `my-first-skill/SKILL.md` với nội dung này:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

Xác minh đã tạo file trong thư mục dự định:

```bash
test -f my-first-skill/SKILL.md
```

Không đầu ra và mã thoát 0 nghĩa file tồn tại.

### 2. Install the complete reviewer bundle

Ở lại `agent-skills-first-run` và chạy:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

Chọn host agent và phạm vi đang dùng. Trình cài nên liệt kê
`skill-contract-reviewer` và đích đã ghi. `--full-depth`
bắt buộc vì skill bài này là bundle lồng với tham chiếu,
script và asset.

Đặt `SKILL_ROOT` thành thư mục tuyệt đối trình cài báo. Nó phải
là thư mục chứa `SKILL.md` đã cài, không phải thư mục nguồn bài
và không phải workspace hiện tại:

```bash
# Replace the placeholder with the destination printed by the installer.
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

Nếu phiên agent đã mở, bắt đầu phiên mới hoặc dùng lệnh quét lại
skill của host. Không giả định mọi host tải nóng danh mục.

### 3. Invoke it explicitly

Trong agent đã cài, với `agent-skills-first-run` làm thư mục
làm việc, dùng cú pháp host đó hỗ trợ:

| Host | Gọi tường minh |
|---|---|
| Codex | `skill-contract-reviewer`, hoặc chọn từ `/skills`, rồi cung cấp yêu cầu đánh giá |
| Claude Code | `/skill-contract-reviewer` theo sau yêu cầu đánh giá |
| Dự phòng có thể chuyển | `Use skill-contract-reviewer to review the target package.` |

Dùng giá trị tuyệt đối in cho `SKILL_ROOT` và `TARGET_ROOT` trong
yêu cầu. Yêu cầu host mở rộng trước thực thi và cho thấy đúng
lệnh đã phân giải, không phải lệnh phụ thuộc thư mục làm việc tiến trình:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

Lệnh phân giải nên có hình dạng này, không còn placeholder:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

Kết quả thành công có cả ba thuộc tính:

1. Host tìm `skill-contract-reviewer` theo tên.
2. Reviewer đọc hợp đồng gói và chạy bộ xác thực đi kèm.
3. Phản hồi chứa báo cáo xác thực không lỗi cấu trúc cho
   mẫu, cộng lựa chọn thành phần cơ bản có biện minh.

Bằng chứng thực thi cũng phải nêu đường dẫn script, đường dẫn đích, cwd, đúng
vector đối số và mã thoát. Báo cáo trôi chảy thiếu trường đó không
chứng minh script đồng hành đã cài đã chạy.

Nếu host báo skill không sẵn, xác minh đích
cài, quét lại hoặc khởi động lại một lần và thử lại yêu cầu tường minh. Không
viết lại mô tả skill để giấu thất bại cài.

### 4. Probe implicit selection

Bắt đầu lượt agent mới và nhập cùng tác vụ không nêu tên skill:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

Nếu host đưa skill đã chọn ra, ghi nó có chọn
`skill-contract-reviewer` không. Nếu host không đưa định tuyến ra, đánh dấu lựa chọn ngầm
chưa xác minh. Gọi tường minh là dự phòng có thể chuyển.

### 5. Clean up

Chỉ bỏ bundle reviewer đã cài:

```bash
npx skills remove skill-contract-reviewer
```

Chọn cùng host và phạm vi dùng khi cài. Sau quét lại hoặc phiên
mới, yêu cầu tường minh `skill-contract-reviewer` nên báo
không sẵn. Giữ `my-first-skill` cho bài sau hoặc bỏ
thư mục lab sau khi xong lộ trình.

## The Problem

Giả sử nhóm bạn có quy trình phát hành đáng tin. Nó tìm thay đổi đã gộp, kiểm tra ghi chú chuyển đổi, cập nhật changelog, chạy lệnh đóng gói và tạo danh sách đánh giá.

Đặt quy trình trong một prompt làm dễ dán và khó vận hành. Prompt không danh tính ổn định, không quy tắc khám phá, không ranh giới tài nguyên, không hình dạng gói kiểm thử được và không trả lời câu hỏi cơ bản: Ai được gọi? Khi nào mô hình nên chọn? Nó chạy script nào? File nào đáng tin? Điều gì còn khi ngữ cảnh nén?

Sai lầm ngược là coi mọi chỉ dẫn tái sử dụng là skill. Quy ước repo, tự động hóa tất định, công cụ ngoài, hook sự kiện và agent ủy nhiệm giải vấn đề khác. Nhét tất cả vào `SKILL.md` tạo thư mục có vẻ chuyển được trong khi phụ thuộc hành vi không được ghi lại của một host.

Nhiệm vụ kỹ thuật đầu là phân loại. Quyết định sản phẩm là gì trước quyết định đóng gói thế nào.

## The Concept

### Skills encode procedural knowledge

Skill agent là thư mục có điểm vào `SKILL.md`. File vào chứa YAML frontmatter theo sau chỉ dẫn Markdown. Thư mục cũng có thể chứa tham chiếu, script và asset.

```figure
skill-package-anatomy
```

Thư mục, không chỉ file Markdown, là đơn vị triển khai được. `SKILL.md` sao chép thiếu tham chiếu là gói hỏng dù frontmatter phân tích được.

### The neighboring abstractions

| Sản phẩm | Công việc chính | Được tải hoặc chạy khi | Không nên mạo danh thứ gì |
|---|---|---|---|
| Prompt | Định hình một tương tác mô hình | Ứng dụng hoặc người dùng đưa vào | Gói có phiên bản với tài nguyên |
| Chỉ dẫn repo | Giải thích quy tắc thường trực của một cơ sở mã | Runtime lập trình vào phạm vi đó | Quy trình tác vụ tái sử dụng |
| Skill agent | Cung cấp kiến thức thủ tục tái sử dụng | Kích hoạt tường minh hoặc ngầm | Ranh giới cấp quyền cứng |
| Công cụ MCP | Cung cấp khả năng từ xa có kiểu | Mô hình hoặc ứng dụng gọi | Quy trình vận hành chi tiết |
| Hook | Chạy logic tất định theo sự kiện | Sự kiện khai báo xảy ra | Định tuyến mô hình xác suất |
| Agent phụ | Ủy nhiệm công việc với ngữ cảnh và trạng thái riêng | Bộ điều phối tạo hoặc gọi | Bundle chỉ dẫn tĩnh |
| Plugin | Phân phối phần mở rộng runtime lớn hơn | Host cài hoặc bật | Chính hợp đồng skill có thể chuyển |
| Thư viện kỹ năng học được | Lưu hành vi khám phá qua kinh nghiệm | Chính sách truy xuất chương trình hoặc quỹ đạo trước | Gói `SKILL.md` dựa tiêu chuẩn |

Skill phát hành có thể nói agent cách kiểm tra phát hành. Máy chủ MCP có thể cung cấp registry phát hành. Hook có thể cấm push trực tiếp. Agent phụ có thể kiểm tra độc lập ứng viên. Các phần kết hợp vì giữ trách nhiệm khác.

### The word "skill" names two different ideas

Hệ thống nghiên cứu đôi khi gọi chương trình học được, quỹ đạo thành công hoặc mảnh chính sách riêng môi trường là kỹ năng. Agent có thể tạo sản phẩm đó khi khám phá, truy xuất theo tương đồng tác vụ, thực thi và sửa thư viện từ phản hồi. Giai đoạn 14 · 10 xây kiểu thư viện học suốt đời đó.

Agent Skill trong lộ trình nhỏ này khác. Nó là gói được biên soạn với hợp đồng hệ thống file khai báo, siêu dữ liệu danh mục, tiết lộ tăng dần, gọi qua runtime và công cụ do host kiểm soát. Nó có thể được agent tạo hoặc cải thiện, nhưng định dạng không cần học.

| Chiều | Gói Agent Skill | Thư viện kỹ năng học được |
|---|---|---|
| Đơn vị chính | Thư mục `SKILL.md` | Chương trình, chính sách, quỹ đạo hoặc bản ghi bộ nhớ |
| Tạo | Biên soạn, tạo sinh hoặc tuyển chọn | Thường khám phá từ kinh nghiệm môi trường |
| Lựa chọn | Mô tả danh mục cộng chính sách runtime | Truy xuất hoặc chính sách trên trạng thái tác vụ |
| Thực thi | Mô hình theo chỉ dẫn và gọi công cụ host | Môi trường chạy hành vi hoặc sản phẩm mã đã lưu |
| Khả năng chuyển | Hợp đồng gói có thể qua host tương thích | Thường gắn một môi trường và không gian hành động |
| Đánh giá | Định tuyến, sản phẩm, an toàn và tương thích host | Phần thưởng, tỷ lệ thành công, chuyển giao và tăng trưởng thư viện |

Cả hai ý tưởng đóng gói năng lực tái sử dụng. Không nên chia sẻ tuyên bố triển khai chỉ vì cùng tên.

### The portable core

Đặc tả Agent Skills yêu cầu hai trường frontmatter:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name` là định danh ổn định. Phải thỏa quy tắc đặt tên đặc tả và khớp thư mục cha. `description` vừa là tài liệu vừa siêu dữ liệu định tuyến. Nên nói skill làm gì và khi nào áp dụng.

Trường tùy chọn có thể chuyển là:

| Trường | Mục đích | Ghi chú khả năng chuyển |
|---|---|---|
| `license` | Nêu điều khoản gói | Đặc tả lõi |
| `compatibility` | Nêu yêu cầu môi trường | Đặc tả lõi |
| `metadata` | Mang dữ liệu mở rộng giá trị chuỗi | Đặc tả lõi |
| `allowed-tools` | Gợi ý công cụ phê duyệt trước | Thử nghiệm; hỗ trợ host khác nhau |

Phần thân Markdown giữ chỉ dẫn vận hành. Nên định nghĩa quy trình, điểm quyết định, hành vi thất bại và đường dẫn trực tiếp đến tài nguyên hỗ trợ.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### Runtime extensions are a second layer

Một số host nhận frontmatter thêm hoặc cấu hình đồng hành. Trường đó có thể hữu ích nhưng không tự động chuyển được.

| Hành vi | Ví dụ phần mở rộng host | Lõi có thể chuyển? |
|---|---|:---:|
| Giấu skill khỏi định tuyến mô hình nhưng giữ người dùng gọi trực tiếp | `disable-model-invocation` | Không |
| Giấu skill khỏi menu lệnh người dùng nhưng cho định tuyến mô hình | `user-invocable` | Không |
| Hiện trợ giúp đối số trong menu lệnh | `argument-hint` | Không |
| Chạy skill trong ngữ cảnh ủy nhiệm | `context`, `agent` | Không |
| Ghim mô hình hoặc thiết lập suy luận | `model`, `effort` | Không |
| Đăng ký tự động hóa vòng đời | `hooks` | Không |
| Tắt gọi ngầm trong Codex | chính sách `agents/openai.yaml` | Không |

Coi mỗi phần mở rộng là adapter. Giữ quy trình lõi hợp lệ không cần nó, ghi dự phòng và kiểm thử host tiếp nhận. Runtime có thể bỏ qua trường không biết, từ chối hoặc giữ mà không triển khai hành vi.

### Frontmatter is executable metadata

Siêu dữ liệu đổi hành vi hệ thống trước phần thân skill được đọc.

- `name` sai dạng có thể làm khám phá thất bại.
- `description` mơ hồ có thể định tuyến sai yêu cầu.
- Cờ chỉ con người có thể bỏ skill khỏi danh mục mô hình.
- Cho phép công cụ có thể đổi host có hỏi quyền hay không.
- Thiết lập ngữ cảnh có thể chuyển thực thi vào phiên agent riêng.

Đánh giá frontmatter như mã cấu hình. Xác thực, tạo phiên bản và đưa hành vi vào đánh giá.

### The skill lifecycle

```figure
skill-runtime-lifecycle
```

Mỗi mũi tên là ranh giới có dạng lỗi riêng.

1. **Khám phá** tìm gói có thể có ở vị trí cấu hình.
2. **Xác thực** từ chối gói sai dạng hoặc không an toàn trước công bố danh mục.
3. **Lập danh mục** đưa `name` và `description` gọn ra, không toàn gói.
4. **Lựa chọn** quyết định skill liên quan hay không.
5. **Kích hoạt** tải phần thân vào ngữ cảnh mô hình thấy.
6. **Tiết lộ** chỉ đọc tham chiếu hoặc asset khi nhánh cần.
7. **Thực thi** dùng công cụ host dưới quy tắc quyền và cô lập của host.
8. **Xác minh** kiểm tra sản phẩm tạo độc lập với tuyên bố mô hình.

Gộp giai đoạn gây mô hình tư duy xấu. Skill được khám phá không phải đang kích hoạt. Skill kích hoạt không được cấp quyền làm mọi thứ mô tả. Lời gọi công cụ được phép không phải bằng chứng kết quả đúng.

### Skills and tools are orthogonal

MCP trả lời "Ứng dụng này gọi được khả năng nào và lược đồ là gì?" Skill trả lời "Agent nên tiếp cận lớp tác vụ này thế nào?"

```figure
skill-tool-orthogonality
```

Skill có thể nêu công cụ, nhưng host sở hữu sổ đăng ký khả năng thật. Nếu công cụ vắng, skill nên nêu dự phòng hoặc thất bại rõ. Không bao giờ ngụ ý gọi tên khả năng tạo ra nó.

### Skills and repository instructions are different scopes

Chỉ dẫn repo mô tả môi trường bạn đã ở: lệnh, quy ước, file tạo sinh và ranh giới. Skill cung cấp thủ tục tái sử dụng cho tác vụ có thể xảy ra qua nhiều repo.

Khi cả hai áp dụng, yêu cầu người dùng hiện hành và quy tắc repo ràng buộc skill. Skill tái cấu trúc tổng quát không được ghi đè quy tắc repo cấm sửa file tạo sinh.

### Skills do not import one another

Một skill có thể hướng agent gọi skill khác, nhưng không phải import cấp ngôn ngữ. Skill thứ hai vẫn qua khám phá runtime, đủ điều kiện, kích hoạt, quyền và xử lý ngữ cảnh.

Viết phụ thuộc chéo skill thành cạnh quy trình quan sát được:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

Điều này làm phụ thuộc kiểm thử được và cho host cơ hội thực thi chính sách.

## Build It

`code/main.py` triển khai bộ xác thực nhỏ hướng tiêu chuẩn và bộ chọn sản phẩm. Giữ chỉ stdlib để mọi quy tắc rõ.

Bộ xác thực cung cấp:

- `parse_frontmatter(text)` để tách siêu dữ liệu khỏi phần thân.
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())` để kiểm tra trường bắt buộc, đặt tên, phần mở rộng không biết, có phần thân và giới hạn có thể chuyển.
- `ValidationIssue` và `SkillReport` để trả bằng chứng có cấu trúc thay một boolean mờ.
- `FrontmatterSyntaxError` cho đầu vào không diễn giải an toàn được.

Bộ chọn cung cấp `TaskShape` và `select_primitives(task)`. Ánh xạ nhu cầu tác vụ đến mã thường, chỉ dẫn repo, skill, hook, agent phụ hoặc công cụ MCP.

Chạy lab:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Khối lệnh này cần bản clone cục bộ và phải bắt đầu từ bất kỳ nơi nào bên trong
bản clone đó để `git rev-parse --show-toplevel` phân giải được gốc repo.

Demo in JSON cho một skill có thể chuyển hợp lệ, một skill mở rộng host, một gói không hợp lệ và nhiều quyết định hình dạng tác vụ. Kiểm tra mã vấn đề. Bộ xác thực gói nên giải thích cách sửa sản phẩm không đoán thay tác giả.

### Validation order matters

Xác thực sự thật cấu trúc rẻ trước quy tắc nội dung sâu hơn:

```figure
skill-validation-order
```

Thứ tự ngăn lỗi thứ cấp che bất biến hỏng đầu tiên.

## Use It

Trước viết skill, điền thẻ quyết định này:

| Câu hỏi | Nếu có | Thành phần cơ bản có khả năng |
|---|---|---|
| Có cần phán đoán mô hình tái sử dụng qua nhiều bước không? | Thủ tục ổn định nhưng quyết định đổi | Skill |
| Có phải xảy ra mỗi khi sự kiện kích hoạt không? | Bỏ lỡ một lần thực thi không chấp nhận | Hook hoặc mã ứng dụng |
| Mô hình có cần khả năng ngoài với đầu vào có kiểu không? | Thao tác nằm ngoài ngữ cảnh mô hình | Công cụ hoặc máy chủ MCP |
| Công việc có cần ngữ cảnh, trạng thái hoặc sở hữu cô lập không? | Worker riêng trả kết quả có giới hạn | Agent phụ |
| Hướng dẫn này riêng một repo không? | Mô tả lệnh và ràng buộc cục bộ | Chỉ dẫn repo |
| Một tương tác có đủ không? | Không cần vòng đời gói | Prompt |

Nhiều quy trình sản xuất dùng hơn một hàng. Thẻ ngăn một sản phẩm giả vờ cung cấp mọi thuộc tính.

## Ship It

Bài này tạo bundle `skill-contract-reviewer` dưới `outputs/`. Chứa:

- `SKILL.md` có thể chuyển đánh giá gói skill đề xuất;
- danh sách tham chiếu cho hợp đồng có thể chuyển và chọn thành phần cơ bản;
- script xác thực tất định;
- fixture hình dạng tác vụ bao phủ prompt, skill, công cụ, hook, mã thường và agent phụ.

Cài toàn bundle, không chỉ file vào:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

Trình cài khóa học báo mỗi skill Giai đoạn 13 sao chép và ghi
`/tmp/aiefs-skills/manifest.json`. Đích sạch này kiểm tra hình dạng gói;
vòng thành công đầu phía trên kiểm tra khám phá và gọi trong host thật.

Bài sau đào sâu mỗi giai đoạn vòng đời. Bài 24 xây khám phá và tiết lộ tăng dần. Bài 25 xây chính sách gọi và định tuyến. Bài 26 tách quyền khỏi sandbox. Bài 27 biến toàn gói thành sản phẩm phát hành đã đánh giá.

## Exercises

1. Phân loại năm quy trình từ nhóm bạn bằng `TaskShape`. Bảo vệ mỗi trường hợp chọn hơn một thành phần cơ bản.
2. Thêm kiểm thử ranh giới chứng minh giá trị `compatibility` 500 ký tự đạt và giá trị 501 ký tự trượt như lỗi đặc tả.
3. Thêm một phần mở rộng runtime vào danh sách cho phép. Viết kiểm thử chứng minh cùng file vẫn phân biệt được với skill chỉ có thể chuyển.
4. Tách prompt 400 dòng thành `SKILL.md`, một tham chiếu, một hợp đồng script và một mẫu đầu ra. Giữ mỗi file chịu trách nhiệm một loại thông tin.
5. Thiết kế phản hồi thất bại cho skill tham chiếu công cụ MCP không sẵn. Không âm thầm thay bằng công cụ quyền rộng hơn.
6. Đánh giá skill hiện có và gắn mỗi câu là định tuyến, thủ tục, chính sách, con trỏ tham chiếu hoặc hợp đồng đầu ra. Di chuyển mọi thứ không thuộc.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|---|---|---|
| Agent skill (Kỹ năng agent) | "Prompt đã lưu" | Thư mục có thể khám phá chứa chỉ dẫn thủ tục và tài nguyên tùy chọn |
| Portable core (Lõi có thể chuyển) | "Trường mọi runtime dùng chung" | Hợp đồng đặc tả Agent Skills định nghĩa |
| Runtime extension (Phần mở rộng runtime) | "Frontmatter thêm" | Cấu hình riêng host có hành vi cần adapter tương thích |
| Activation (Kích hoạt) | "Skill đã chạy" | Phần thân skill vào ngữ cảnh mô hình thấy; thực thi có thể sau |
| Skill dependency (Phụ thuộc skill) | "Import skill khác" | Cạnh gọi qua runtime với kiểm tra sẵn có và chính sách |
| Tool contract (Hợp đồng công cụ) | "Lược đồ hàm" | Đầu vào, đầu ra, quyền, tác dụng phụ, lỗi và bằng chứng cho khả năng |

## Further Reading

- [Agent Skills specification](https://agentskills.io/specification) cho hợp đồng thư mục và frontmatter có thể chuyển.
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices) cho phạm vi, chỉ dẫn và tổ chức tài nguyên.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) cho hành vi khám phá và gọi Codex hiện tại.
- [Claude Code skills](https://code.claude.com/docs/en/skills) cho phần mở rộng gọi, đối số, công cụ và ngữ cảnh ủy nhiệm của một runtime.
