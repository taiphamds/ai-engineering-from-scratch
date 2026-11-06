# Skill Discovery and Progressive Disclosure

> Skill trở nên hữu ích trước khi phần thân được tải. Tên và mô tả giành chỗ trong danh mục; file sâu hơn chỉ giành ngữ cảnh khi tác vụ đến chúng.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## Learning Objectives

- Xây pipeline khám phá hệ thống file tách phạm vi, xác thực, chính sách xung đột và công bố danh mục.
- Giải thích ba mức tiết lộ: siêu dữ liệu danh mục, chỉ dẫn đang kích hoạt và tài nguyên riêng tác vụ.
- Thiết kế tham chiếu để agent đến chi tiết cần trực tiếp không tải toàn gói.
- Lập ngân sách không gian danh mục độc lập ngữ cảnh skill đang kích hoạt.
- Từ chối duyệt đường dẫn và thoát symlink khi skill đọc tài nguyên riêng.

## The Problem

Agent có 200 skill đã cài. Tải mọi `SKILL.md`, file tham chiếu, script và mẫu lúc bắt đầu phiên sẽ chôn tác vụ hiện tại trong thủ tục không liên quan. Không tải gì buộc người dùng nhớ đúng đường dẫn hệ thống file.

Thỏa hiệp thường là danh mục: cho mô hình danh tính gọn và mô tả định tuyến mỗi skill đủ điều kiện, rồi chỉ tải toàn phần thân sau chọn. Tạo hai vấn đề kỹ thuật mới.

Thứ nhất, khám phá không chỉ tìm file đệ quy. Skill có thể ở phạm vi dự án, người dùng, quản trị viên, plugin hoặc dựng sẵn. Hai gói có thể cùng tên. Symlink có thể trỏ ngoài gốc đáng tin. Gói sai dạng có thể tiêu không gian danh mục hoặc thành không gọi được.

Thứ hai, tiết lộ tăng dần có thể thành nhầm lẫn tăng dần. Nếu `SKILL.md` nói "đọc hướng dẫn liên quan" và gói có mười hai hướng dẫn, mô hình phải đoán. Nếu mỗi hướng dẫn trỏ thêm ba file, tải thành đi đồ thị không giới hạn.

Runtime tốt làm khám phá tất định và tiết lộ có chủ ý.

## The Concept

### Discovery is a compiler pipeline

Coi hệ thống file là đầu vào nguồn. Không công bố đường dẫn thô trực tiếp cho mô hình.

```figure
skill-discovery-pipeline
```

Mỗi giai đoạn nên tạo dữ liệu và thất bại có cấu trúc. Nhật ký khám phá nên trả lời:

- Gốc nào được tìm?
- Ứng viên nào được tìm thấy?
- Ứng viên nào bị từ chối và tại sao?
- Gói nào thắng xung đột?
- Mục danh mục nào bị rút hoặc bỏ vì ngân sách?

Không bằng chứng đó, "mô hình không dùng skill của tôi" gần như không thể chẩn đoán.

### Scope is runtime policy

Đặc tả có thể chuyển định nghĩa gói skill, không một đường dẫn cài hoặc thứ tự ưu tiên phổ quát. Host quyết định tìm đâu.

Runtime tổng quát có thể dùng phạm vi này:

| Phạm vi | Gốc ví dụ | Sở hữu dự định |
|---|---|---|
| Workspace | `<repo>/.agents/skills/` | Người bảo trì dự án |
| Người dùng | `<user-data>/skills/` | Một nhà phát triển |
| Quản trị viên | `<system>/skills/` | Chính sách máy hoặc tổ chức |
| Plugin | Bundle plugin có chữ ký | Nhà phát hành và trình cài plugin |
| Dựng sẵn | Gói runtime | Nhà cung cấp runtime |

Tính đến tháng 8 năm 2026, Codex ghi khám phá dự án từ `$CWD/.agents/skills` qua thư mục tổ tiên đến gốc repo, cộng vị trí người dùng, quản trị viên và dựng sẵn. Hỗ trợ thư mục skill symlink. Tên trùng có thể đều xuất hiện thay vì gộp. Đó là hành vi Codex, không yêu cầu `SKILL.md`; xác minh [tài liệu skill Codex](https://learn.chatgpt.com/docs/build-skills) hiện tại khi viết adapter.

Không bao giờ bịa ưu tiên từ tên thư mục. Khai báo thành chính sách và kiểm thử. Lab dùng hạng số nguyên tường minh cho mỗi `Scope` để cùng tập ứng viên luôn phân giải cùng cách.

### Collisions need identity beyond `name`

Hai gói tên `release-readiness` có thể hợp lệ. Một có thể là ghi đè workspace và một mặc định người dùng. Vì vậy mục danh mục cần ít nhất:

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

Chính sách xung đột phổ biến gồm:

| Chính sách | Lợi ích | Rủi ro |
|---|---|---|
| Giữ mọi ứng viên | Không gì bị giấu | Mô hình thấy tên mơ hồ |
| Phạm vi ưu tiên cao nhất thắng | Gọi đơn giản | Gói cục bộ có thể che khuất gói đáng tin |
| Từ chối trùng | Không che khuất âm thầm | Ghi đè hợp lệ ngừng hoạt động |
| Định danh tên đầy đủ theo nguồn | Danh tính tường minh | Tên hướng người dùng dài hơn |

Chọn một chính sách cho host. Giữ ứng viên bị từ chối hoặc che khuất trong chẩn đoán dù vắng trong danh mục mô hình.

### Three disclosure levels

Đặc tả Agent Skills mô tả tải theo giai đoạn. Then chốt là mỗi mức có mục đích khác.

```figure
skill-disclosure-levels
```

#### Level 1: catalog metadata

Mô hình cần đủ thông tin phân biệt skill với hàng xóm. Đặc tả ước tính khoảng 100 token mỗi mục danh mục, nhưng tuần tự hóa và token hóa thật thuộc host.

Mô tả hữu ích có hai mệnh đề:

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

Mệnh đề đầu nêu khả năng. Mệnh đề thứ hai nêu ranh giới kích hoạt. Bài 25 đánh giá ranh giới bằng prompt dương và gần khớp.

#### Level 2: active instructions

Sau kích hoạt, phần thân nên làm bản đồ và thủ tục. Đặc tả khuyến nghị giữ `SKILL.md` dưới 500 dòng. Đó là tín hiệu thiết kế, không mục tiêu lấp đầy.

Phần thân nên chứa:

- ranh giới tác vụ;
- quy trình mặc định;
- điều kiện nhánh;
- tham chiếu trực tiếp đến file sâu hơn;
- hợp đồng công cụ và script;
- hành vi thất bại và dừng;
- đầu ra kỳ vọng và xác minh.

Không chuyển quy trình trung tâm vào tham chiếu chỉ để file vào ngắn. Kích hoạt phải cho mô hình đủ ngữ cảnh bắt đầu đúng.

#### Level 3: supporting resources

Tham chiếu cung cấp văn xuôi hoặc dữ liệu. Script cung cấp tính toán tất định. Asset được sao chép, điền hoặc biến đổi thành sản phẩm bàn giao thay vì coi là chỉ dẫn.

| Thư mục | Mô hình đọc? | Mô hình thực thi? | Nội dung điển hình |
|---|:---:|:---:|---|
| `references/` | Có, khi cần | Không | lược đồ, chính sách, hướng dẫn miền |
| `scripts/` | Có thể kiểm tra | Qua công cụ được phép | bộ xác thực, chuyển đổi, thu thập |
| `assets/` | Chỉ nếu hữu ích | Không | mẫu, fixture, ảnh, file khởi đầu |

Tên này là quy ước, không khả năng ma thuật. Host vẫn cần truy cập file và công cụ thực thi.

### Branch-specific references beat topic dumps

Viết file vào như bản đồ quyết định:

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

Cho mỗi tham chiếu điều kiện tải quan sát được. "Đọc `references/` để thêm" thì không.

Giữ đồ thị tham chiếu nông. Hướng dẫn chính thức khuyến nghị liên kết trực tiếp từ `SKILL.md` và tránh chuỗi sâu. Một bước làm khả năng tiếp cận kiểm thử được và giảm khả năng ràng buộc cần không bao giờ vào ngữ cảnh.

```figure
skill-reference-map
```

### Catalog budget and active context are different budgets

Gọi `c_i` là chi phí danh mục tuần tự hóa của skill `i`, `B_c` ngân sách danh mục, `b_j` chi phí phần thân kích hoạt và `r_k` tài nguyên thực sự tải.

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

Giảm ngân sách này không tự động giảm ngân sách kia. Mô tả ngắn có thể tiết kiệm không gian danh mục trong khi phần thân kích hoạt 900 dòng vẫn lấn át tác vụ. Tách phần thân thành tham chiếu chỉ giảm chi phí kích hoạt khi runtime và chỉ dẫn thực sự tránh tải nhánh không liên quan.

Codex hiện dành ngân sách danh sách skill đầu ở 2 phần trăm cửa sổ
ngữ cảnh khi biết kích thước cửa sổ ngữ cảnh. Giá trị 8,000 ký tự
chỉ dự phòng khi không biết kích thước đó; không phải trần thứ hai kết hợp với
quy tắc 2 phần trăm. Khi danh mục vượt ngân sách áp dụng,
mô tả có thể rút hoặc bỏ. Coi con số đó là chính sách Codex
hiện tại, không thuộc tính tiêu chuẩn Agent Skills.

### Resource paths are a trust boundary

Skill nên chỉ đọc file trong gói. Kiểm tra tiền tố chuỗi nguyên văn không đủ:

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

Phân giải gốc gói và ứng viên bằng ngữ nghĩa hệ thống file, từ chối đầu vào tuyệt đối và xác minh ứng viên phân giải vẫn dưới gốc phân giải. Quyết định symlink có được phép trước khám phá. Nếu cho, kiểm tra đích phân giải mỗi lần.

```figure
skill-resource-containment
```

Giới hạn đường dẫn không thiết lập tin cậy nội dung. Tham chiếu trong gói hợp lệ vẫn có thể chứa chỉ dẫn độc hại. Bài 26 xử lý đe dọa đó.

### Loading must be observable

Ghi sự kiện tiết lộ không ghi bí mật:

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

Lý do biến lựa chọn ngữ cảnh thành bằng chứng xem xét được. Cũng giúp xác định chỉ dẫn khiến agent tải mọi file "phòng khi cần."

## Build It

`code/main.py` xây máy khám phá và tiết lộ tất định.

Bề mặt khám phá gồm:

- `Scope` cho siêu dữ liệu nguồn và ưu tiên;
- `SkillCandidate` cho ứng viên hệ thống file chưa xác thực;
- `discover_scope(scope)` để liệt kê thư mục skill ngay bên trong;
- `resolve_collisions(candidates, precedence)` để áp một chính sách khai báo;
- `CatalogEntry` và `build_catalog(...)` để công bố siêu dữ liệu có giới hạn;
- `CatalogBudget` để tính mục tuần tự hóa không giả vờ ký tự là token phổ quát.

Bề mặt tiết lộ gồm:

- `load_skill_body(entry, ...)` cho kích hoạt Mức 2;
- `validate_reference(skill_dir, reference)` cho giới hạn đường dẫn;
- `load_reference(...)` cho đọc Mức 3 có giới hạn.

Chạy lab:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Khối này cần bản clone cục bộ và phân giải gốc repo từ mọi
thư mục làm việc trong bản clone.

Demo tạo phạm vi dự án và người dùng tạm, chèn xung đột, xây danh mục dưới ngân sách cố ý nhỏ, kích hoạt một skill và thử cả đọc tham chiếu hợp lệ lẫn thoát qua duyệt đường dẫn. Không file vĩnh viễn được cài.

### Why discovery is shallow

`discover_scope` kiểm tra thư mục con trực tiếp tìm `SKILL.md`. Không đệ quy coi mọi `SKILL.md` lồng là gói riêng. Giữ ranh giới gói và tránh vô tình công bố ví dụ hoặc fixture trong skill đã cài.

### Why the lab does not parse arbitrary YAML

Lab hỗ trợ frontmatter scalar cần cho danh mục. Runtime sản xuất nên dùng bộ phân tích YAML an toàn với lược đồ tường minh, giới hạn kích thước và tắt dựng đối tượng tùy chỉnh. "Chỉ stdlib" là ràng buộc giảng dạy, không quyền âm thầm bịa phương ngữ YAML từng phần.

## Use It

Áp danh sách này cho mọi adapter khám phá:

1. Liệt kê mọi gốc cấu hình và ai ghi được.
2. Nêu gói symlink được phép hay không.
3. Xác thực tên gói, tên thư mục, siêu dữ liệu bắt buộc và kích thước phần thân vào.
4. Giữ nguồn và phạm vi trong danh tính nội bộ.
5. Khai báo và kiểm thử hành vi tên trùng.
6. Đo đúng danh mục tuần tự hóa gửi mô hình.
7. Ghi vì sao phần thân hoặc tài nguyên được tải.
8. Giữ đọc tài nguyên trong gốc gói phân giải.
9. Thất bại rõ khi file tham chiếu thiếu.
10. Xây lại danh mục khi cài đặt hoặc chính sách đổi.

## Ship It

Bài này tạo bundle `skill-catalog-builder`. Nó quét gốc sắp thứ tự tường minh, từ chối file vào symlink và tên-thư mục không khớp, phân giải xung đột chéo phạm vi, từ chối trùng cùng ưu tiên và làm siêu dữ liệu chọn vừa ngân sách mục, mô tả và ký tự tuần tự hóa khai báo.

Báo cáo JSON chứa mục chọn, ứng viên che khuất, mục bỏ, lỗi xác thực, ưu tiên và sử dụng ngân sách. Tải phần thân và tham chiếu vẫn là thao tác runtime riêng, nên bộ xây danh mục không thực thi script hoặc đưa toàn gói vào ngữ cảnh.

## Exercises

1. Thêm phạm vi plugin và đặt giữa ưu tiên người dùng và dựng sẵn. Chứng minh kết quả xung đột bằng kiểm thử.
2. Đổi chính sách xung đột từ ưu tiên cao nhất sang tên định danh đầy đủ. Giữ cả hai mục trong danh mục.
3. Thêm giới hạn byte vào `load_reference`. Kiểm thử file đúng giới hạn và hơn một byte.
4. Tạo hai mô tả nghe gần giống hệt. Viết lại để ranh giới kích hoạt không chồng lấn.
5. Thêm manifest chứa hash cho mọi tham chiếu và script. Phát hiện tài nguyên bị sửa trước tải.
6. Gắn đo demo để báo số byte Mức 1, Mức 2 và Mức 3 riêng.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|---|---|---|
| Skill discovery (Khám phá skill) | "Tìm mọi SKILL.md" | Tìm phạm vi cấu hình, xác thực gói, gắn xuất xứ và áp chính sách |
| Skill catalog (Danh mục skill) | "Danh sách skill đã cài" | Siêu dữ liệu định tuyến gọn mô hình thấy cho gói đủ điều kiện |
| Collision policy (Chính sách xung đột) | "Bản trùng nào thắng" | Quy tắc khai báo cho ứng viên cùng tên từ nguồn khác |
| Progressive disclosure (Tiết lộ tăng dần) | "Tải lười" | Đưa ngữ cảnh theo giai đoạn từ danh mục đến phần thân đến tài nguyên riêng nhánh |
| Reference graph (Đồ thị tham chiếu) | "File skill liên kết" | Cấu trúc tài nguyên tiếp cận được và điều kiện tải |
| Path containment (Giới hạn đường dẫn) | "Ở trong thư mục" | Xác minh đích tài nguyên phân giải vẫn trong gốc gói phân giải |

## Further Reading

- [Agent Skills specification](https://agentskills.io/specification) cho hình dạng gói và mức tiết lộ tăng dần.
- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) cho siêu dữ liệu định tuyến danh mục.
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices) cho tham chiếu trực tiếp và kích thước file vào.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) cho phạm vi khám phá Codex và giới hạn danh mục hiện tại.
