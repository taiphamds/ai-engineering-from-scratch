# Skill Invocation and Routing

> Gọi là quyết định thẩm quyền theo sau quyết định liên quan. Mô tả tốt giúp mô hình chọn; chính sách tốt quyết định lựa chọn có được phép không.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## Learning Objectives

- Phân biệt người dùng gọi tường minh, mô hình gọi ngầm, ứng dụng gọi và skill gọi skill.
- Mô hình hóa hiển thị với con người và đủ điều kiện với mô hình thành chiều chính sách độc lập.
- Viết mô tả định tuyến có kích hoạt dương và ranh giới gần khớp.
- Tách đủ điều kiện, lựa chọn, kích hoạt, gắn đối số và thực thi trong trace và kiểm thử.
- Thích nghi trường gọi riêng runtime không trình bày như frontmatter có thể chuyển.

## The Problem

Bạn cài skill `database-migration`. Người dùng chạy theo tên được, nhưng mô hình cũng thấy mô tả và chọn khi ai hỏi câu cơ sở dữ liệu tổng quát. Skill rồi đề xuất đổi lược đồ cho tác vụ chỉ cần giải thích.

Bạn thêm `user-invocable: false`, kỳ vọng chặn người chạy thủ công. Trong runtime khác, trường bị bỏ qua. Bạn thêm `disable-model-invocation: true`, kỳ vọng skill biến mất hoàn toàn. Trong runtime hiểu, người dùng vẫn gọi tường minh được.

Không gì sai với tên trường. Mô hình tư duy sai. "Người dùng thấy được", "mô hình chọn được", "ứng dụng nạp trước được" và "công cụ bên trong thực thi được" là sự thật riêng. Một boolean tên `invocable` không diễn đạt được.

Định tuyến có dạng lỗi thứ hai. Nếu mô tả mơ hồ, nhiều skill trở nên hợp lý. Nếu mô tả nhồi từ khóa, tác vụ không liên quan kích hoạt. Danh mục là giao diện xác suất: đủ gọn để vừa, đủ cụ thể để định tuyến.

## The Concept

### Five channels can start the lifecycle

| Tác nhân | Hình dạng gọi | Dùng điển hình | Rủi ro chính |
|---|---|---|---|
| Người dùng con người | Nêu tên skill trong UI hoặc prompt | Chọn quy trình chủ ý | Người dùng kỳ vọng sẵn có hoặc thẩm quyền host không cấp |
| Mô hình hoặc agent tự chủ | Chọn mục danh mục từ ngữ cảnh tác vụ | Thủ tục chuyên gia tự động | Định tuyến dương tính giả |
| Ứng dụng | Kích hoạt hoặc nạp trước skill qua mã runtime | Quy trình sản phẩm cố định | Gắn kết ẩn với một host |
| Skill hoặc agent phụ khác | Yêu cầu đúng skill làm phụ thuộc quy trình | Kết hợp | Chu kỳ, thiếu phụ thuộc hoặc rò ngữ cảnh |
| Bộ khung đánh giá | Kích hoạt đúng skill dưới kịch bản cố định | Đo lặp lại được | Kiểm thử skill nhưng vô tình bỏ qua chính sách sản xuất đang nghiên cứu |

Đặc tả Agent Skills có thể chuyển định nghĩa gói. Không chuẩn hóa một UI slash command, cờ định tuyến ngầm, API ứng dụng hoặc vòng đời agent phụ phổ quát.

### The five invocation stages

```figure
skill-invocation-stages
```

Dùng chính xác từ này:

- **Đủ điều kiện** nghĩa chính sách cho tác nhân này yêu cầu skill.
- **Đã chọn** nghĩa người dùng nêu tên hoặc bộ định tuyến đánh giá liên quan.
- **Đã kích hoạt** nghĩa chỉ dẫn vào ngữ cảnh làm việc.
- **Đang thực thi** nghĩa agent bắt đầu công việc mô hình hoặc công cụ dưới chỉ dẫn đó.
- **Đã hoàn tất** nghĩa đầu ra đạt kiểm tra thành công độc lập.

Trace chỉ ghi `skill_used=true` giấu ranh giới nơi thất bại xảy ra.

### Human and model invocation form a 2x2 matrix

| Con người gọi được | Mô hình gọi được | Chế độ | Ví dụ phù hợp |
|:---:|:---:|---|---|
| Có | Có | Dùng chung | Giải thích mã, lập kế hoạch kiểm thử, đánh giá tài liệu |
| Có | Không | Chỉ con người | Chuẩn bị công bố, xuất tính phí, kế hoạch dọn phá hủy |
| Không | Có | Chỉ mô hình | Hướng dẫn phong cách nội bộ, tham chiếu miền, thủ tục hỗ trợ tự động |
| Không | Không | Tắt hoặc chỉ ứng dụng | Triển khai theo giai đoạn, gói ngừng dùng, nạp trước lập trình |

Ma trận là mô hình chính sách, không YAML tiêu chuẩn.

Một host hiện tại dùng `disable-model-invocation: true` cho hàng chỉ con người và `user-invocable: false` cho hàng chỉ mô hình. Mặc định cả hai. Host khác dùng `agents/openai.yaml` với `allow_implicit_invocation: false` để giữ gọi tường minh trong khi tắt chọn ngầm. Đây là adapter runtime. Host không biết có thể bỏ qua.

Chi tiết gây nhầm quan trọng: `user-invocable: false` không nghĩa "mô hình không dùng được." Nó bỏ gọi người dùng trực tiếp trong host định nghĩa. `disable-model-invocation: true` không nghĩa "skill bị tắt." Nó bỏ lựa chọn do mô hình khởi tạo trong khi giữ truy cập người dùng tường minh.

### Explicit invocation is identity-first

Gọi tường minh cung cấp danh tính trực tiếp:

```text
/release-readiness v2.4.0
```

hoặc:

```text
release-readiness check v2.4.0 without publishing
```

Giao diện Codex hiện tại ghi `/skills` để chọn và tên skill thuần trong yêu cầu để gọi tường minh. Claude Code ghi `/skill-name` và mở rộng đối số riêng host. Cú pháp chính xác, hiển thị menu, quy tắc dấu nháy và mở rộng biến thuộc host.

Yêu cầu tường minh vẫn qua chính sách. Nêu tên skill không nên bỏ qua quyền thiếu, ràng buộc workspace, cổng phê duyệt hoặc cô lập runtime.

### Implicit invocation is description-first

Với định tuyến ngầm, mô hình ban đầu thấy siêu dữ liệu danh mục thay toàn phần thân. Vì vậy mô tả là giao diện định tuyến skill.

Yếu:

```yaml
description: Helps with releases.
```

Quá rộng:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

Có giới hạn:

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

Bản có giới hạn chứa:

1. **Khả năng:** kiểm tra ứng viên chuẩn bị sẵn.
2. **Đầu ra:** báo cáo sẵn sàng.
3. **Ranh giới dương:** hỏi sản phẩm phát hành sẵn sàng chưa.
4. **Ranh giới âm:** bản dựng và phát triển thường ngoài phạm vi.

Ranh giới âm hữu ích khi hai skill gần dùng chung từ vựng. Không thay đánh giá gần khớp.

### Routing is classification with an abstain option

Với skill `s` và yêu cầu `x`, hình dung điểm bộ định tuyến:

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

Chấm chính xác có thể là quyết định LLM thay số học. Nguyên tắc kỹ thuật vẫn đúng: lựa chọn nên vượt ngưỡng và skill cạnh tranh. Khi bằng chứng yếu, không chọn.

```figure
skill-routing-abstention
```

Với skill tác động cao, định tuyến ngầm có thể không phù hợp dù mô tả mạnh. Dùng chính sách chỉ con người khi chi phí dương tính giả vượt tiện lợi chọn tự động.

### Eligibility must precede ranking

Không chấm mọi skill khám phá, chọn khớp mạnh nhất rồi mới kiểm tra chính sách skill đó. Khớp đầu bị chặn sẽ ngăn sai ứng viên đủ điều kiện điểm thấp hơn được xét.

Dùng thứ tự này cho định tuyến ngầm:

1. Lọc skill khám phá theo tác nhân yêu cầu và adapter host hoạt động.
2. Chỉ chấm ứng viên đủ điều kiện.
3. Chọn khớp đủ điều kiện mạnh nhất nếu vượt ngưỡng và quy tắc mơ hồ.
4. Không chọn khi không ứng viên đủ điều kiện hoặc không điểm đủ điều kiện nào đủ mạnh.

Giả sử `incident-triage` điểm `0.80` nhưng phần mở rộng host tắt mô hình gọi. `incident-review` điểm `0.55` và cho mô hình gọi. Bộ định tuyến nên đánh giá `incident-review` là ứng viên đủ điều kiện tốt nhất. Không nên chọn `incident-triage`, từ chối rồi dừng.

Thứ tự cũng giữ đổi chính sách không làm đổi nghĩa điểm liên quan. Đủ điều kiện định nghĩa tập lựa chọn. Liên quan xếp hạng tập đó.

### Routing evals need near misses

Ca dương chứng minh độ thu hồi:

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

Ca âm rõ chứng minh độ chính xác cơ bản:

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

Gần khớp bộc lộ chất lượng ranh giới:

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

Gần khớp dùng chung `package` và `build` với skill phát hành nhưng thuộc nơi khác. Tập định tuyến chỉ có dương rõ và âm không liên quan sẽ phóng đại chất lượng.

### Arguments have three representations

Đối số gọi vượt nhiều ranh giới:

```figure
skill-argument-boundaries
```

Tại mỗi ranh giới, giữ ý định không coi văn bản là mã.

- Bộ phân tích host quyết định cú pháp lệnh và dấu nháy.
- Skill nhận văn bản hoặc biến đã gắn theo quy tắc host.
- Chỉ dẫn xác thực giá trị bắt buộc và mặc định.
- Lời gọi công cụ chuyển giá trị sang lược đồ có kiểu và xác thực lại.

Không nội suy đối số thô vào lệnh shell. Ưu tiên script gọi với vector đối số hoặc công cụ MCP có kiểu.

### Application invocation is explicit orchestration

Sản phẩm có thể kích hoạt skill vì quy trình đã biết loại tác vụ. Ví dụ dịch vụ đánh giá pull request có thể nạp trước `pull-request-risk-review` sau người dùng nhấn Review.

Bỏ bất định định tuyến nhưng tạo phụ thuộc API runtime. Giữ adapter ngoài phần thân có thể chuyển:

```figure
skill-host-adapter
```

Skill nên còn hiểu được khi mở bởi client tuân thủ khác.

### Skill-to-skill invocation is a tool-like edge

Giả sử `release-readiness` yêu cầu `security-change-review` khi file phụ thuộc đổi.

Bên gọi nên cung cấp:

- danh tính skill đích;
- tác vụ có giới hạn và đường dẫn sản phẩm;
- hợp đồng phản hồi kỳ vọng;
- lý do gọi;
- dự phòng nếu không sẵn;
- độ sâu tối đa hoặc quy tắc chu kỳ.

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

Skill thứ hai không được dán mù vào thứ nhất. Host quyết định cách kích hoạt và có chia ngữ cảnh, chạy trong fork hay trả qua kết quả công cụ.

### Context lifecycle is host-specific

Sau kích hoạt, phần thân skill có thể còn trong hội thoại, được tóm tắt khi nén hoặc chạy trong ngữ cảnh ủy nhiệm. Cho phép công cụ có thể kéo dài một lượt trong khi chỉ dẫn tồn tại lâu hơn. Agent phụ có thể nhận skill không toàn lịch sử cha.

Không viết skill phụ thuộc giả định vòng đời vô hình. Đặt đầu ra bền vững vào file hoặc trạng thái có kiểu, làm tái nhập an toàn và nêu phải tải lại gì sau gián đoạn.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## Build It

`code/main.py` triển khai chính sách và định tuyến như adapter riêng.

Mô hình gồm:

- `Actor` cho bên gọi con người, mô hình, agent tự chủ, ứng dụng, skill và bộ khung;
- `SkillMetadata` cho danh tính định tuyến;
- `InvocationPolicy` cho ma trận con người/mô hình;
- `InvocationRequest` và `InvocationDecision` cho đầu vào và kết quả lần vết được;
- `CorePolicyAdapter` cho hành vi có thể chuyển không phần mở rộng host;
- `ExtensionPolicyAdapter` cho trường runtime nhận biết;
- `build_invocation_matrix(policy)` cho góc nhìn 2x2;
- `route_request(skills, request, adapter)` để lọc đủ điều kiện trước xếp liên quan, chọn và từ chối.

Chạy:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Demo in một ma trận và quyết định cho kênh con người tường minh, mô hình ngầm, agent tự chủ, ứng dụng, kết hợp skill và bộ khung. Kết quả adapter phần mở rộng cho thấy khớp từ vựng đầu bị chặn được bỏ trước xếp lựa chọn đủ điều kiện khác. Cũng gồm danh sách cho phép tên chính xác. Không cần API mô hình. Bộ định tuyến tất định tồn tại để ranh giới chính sách kiểm tra được, không để khẳng định khớp từ vựng tái hiện định tuyến mô hình sản xuất.

### Why core and extension adapters are separate

Nếu một bộ phân tích gán nghĩa mọi trường frontmatter quan sát, nó âm thầm nâng quy ước runtime thành tiêu chuẩn giả. Adapter riêng buộc bên gọi nêu ngữ nghĩa host nào hoạt động.

`CorePolicyAdapter` chỉ dùng chính sách ứng dụng cung cấp. `ExtensionPolicyAdapter` nhận tập trường host tường minh và ghi trường nào đổi quyết định.

## Use It

Viết hợp đồng gọi trước công bố skill:

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

Hợp đồng này là tài liệu thiết kế cho adapter và kiểm thử. Không phải frontmatter `SKILL.md` có thể chuyển trừ khi tiêu chuẩn nhận rõ.

## Ship It

Bài này tạo bundle `skill-invocation-router`. Gồm tham chiếu mô hình gọi, chính sách host ví dụ và CLI không thực thi đánh giá một yêu cầu con người, mô hình, agent tự chủ, ứng dụng, kết hợp skill hoặc bộ khung, trả quyết định JSON với kênh, adapter, điểm và lý do.

CLI một yêu cầu là thăm dò chính sách, không đánh giá kích hoạt đầy đủ. Dùng thiết kế dương và gần khớp có nhãn Bài 27 để tính số nhầm lẫn, precision, recall và ổn định chạy lặp.

## Exercises

1. Tạo cả bốn hàng ma trận con người/mô hình và viết một trường hợp dùng hợp lệ cho mỗi hàng.
2. Thêm kích hoạt chỉ ứng dụng vào `CorePolicyAdapter`. Chứng minh bên gọi con người và mô hình vẫn bị từ chối.
3. Viết mười gần khớp cho skill triển khai. Mỗi prompt phải dùng chung từ vựng skill trong khi thuộc quy trình khác.
4. Thêm biên mơ hồ giữa hai điểm định tuyến đầu. Trả `ask` khi biên quá nhỏ.
5. Thêm độ sâu kết hợp tối đa vào yêu cầu skill-sang-skill và phát hiện chu kỳ hai skill.
6. Chạy cùng tập có nhãn qua adapter lõi và phần mở rộng. Giải thích mọi quyết định đổi.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|---|---|---|
| Explicit invocation (Gọi tường minh) | "Slash command" | Tác nhân cung cấp danh tính skill trực tiếp, chịu chính sách |
| Implicit invocation (Gọi ngầm) | "Mô hình chọn" | Bộ định tuyến chọn từ siêu dữ liệu danh mục đủ điều kiện theo ngữ cảnh tác vụ |
| User-invocable (Người dùng gọi được) | "Con người dùng được" | Thuộc tính menu hoặc gọi trực tiếp riêng host, không trường lõi |
| Model-invocable (Mô hình gọi được) | "Agent dùng được" | Đủ điều kiện để mô hình chọn ngầm dưới chính sách host |
| Invocation adapter (Adapter gọi) | "Bộ phân tích frontmatter" | Mã ánh xạ trường và API host vào mô hình chính sách khai báo |
| Near miss (Gần khớp) | "Âm khó" | Yêu cầu không kích hoạt giống đầu vào dự định của skill |
| Abstention (Không chọn) | "Không skill được chọn" | Kết quả định tuyến chủ ý khi bằng chứng vắng hoặc mơ hồ |

## Further Reading

- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) cho kích hoạt dương, tính cụ thể và đánh giá.
- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills) cho thiết kế đánh giá kích hoạt và đầu ra.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) cho kiểm soát gọi tường minh và ngầm Codex hiện tại.
- [Claude Code skills](https://code.claude.com/docs/en/skills) cho `user-invocable`, `disable-model-invocation`, đối số và ngữ cảnh ủy nhiệm của một host.
