# Skill Evals, Packaging, and Portability

> Skill hoàn thành khi gói qua lint, định tuyến đúng yêu cầu, cải thiện tác vụ đo được, ở trong chính sách và suy giảm trung thực trên host khác.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## Learning Objectives

- Biến quy trình chuyên gia thành skill bằng tách phán đoán, tính toán tất định, tham chiếu và hợp đồng đầu ra.
- Kiểm thử cấu trúc gói, định tuyến kích hoạt, hành vi tác vụ, tính đúng script, an toàn và khả năng chuyển như tầng riêng.
- Đo precision và recall kích hoạt bằng dương, âm rõ và gần khớp.
- So hiệu năng có và không skill qua lần chạy lặp.
- Xây và thực thi ma trận khả năng chéo runtime và cổng phát hành cho bundle skill đầy đủ.

## The Problem

Skill hoạt động trong một demo. Người dùng hỏi đúng cụm dùng trong mô tả, tác giả biết mở tham chiếu nào, script thấy đầu vào sạch và host kỳ vọng nhận mọi trường tùy chỉnh.

Rồi sử dụng thật bắt đầu.

- Mô hình gọi cho tác vụ gần nhưng khác.
- Yêu cầu hợp lệ dùng cách diễn đạt lạ nên mô hình bỏ lỡ.
- Phần thân nói agent làm gì nhưng không sản phẩm nào chứng minh hoàn tất.
- Script thất bại với khoảng trắng, thực thi lặp hoặc trạng thái từng phần.
- Trình cài gói sao chép `SKILL.md` nhưng bỏ lại tham chiếu.
- Runtime khác bỏ qua cờ gọi và cho phép công cụ.
- Một lần chạy thành công, ba lần tương đương đi lạc vào nhánh khác.

Không thất bại nào được bắt bằng "Markdown trông tốt." Skill là gói phần mềm nhỏ có tầng định tuyến và thực thi xác suất. Cần cùng tách mối quan tâm như mọi giao diện sản xuất khác.

## The Concept

### Start from a real workflow, not a topic

"Tạo skill Kubernetes" không là phạm vi dùng được. Kubernetes chứa hàng trăm tác vụ với công cụ, rủi ro và đầu ra khác.

"Chẩn đoán tại sao một deployment không đạt Available, thu bằng chứng không đổi cluster và tạo báo cáo sự cố xếp hạng" là ứng viên skill. Có:

- ranh giới kích hoạt;
- chuỗi bước thu bằng chứng ổn định;
- điểm quyết định cần phán đoán;
- lệnh có thể thành script hoặc công cụ hẹp;
- sản phẩm xác định;
- ranh giới an toàn: chẩn đoán chỉ đọc.

Dùng phỏng vấn trích xuất này:

1. Chính xác sự kiện nào làm chuyên gia bắt đầu quy trình?
2. Yêu cầu tương tự nào không nên bắt đầu?
3. Chuyên gia thu bằng chứng gì trước?
4. Quyết định nào phụ thuộc bằng chứng đó?
5. Bước nào đủ tất định để viết script?
6. Quy tắc miền nào đáng có tham chiếu?
7. Hành động nào cần phê duyệt hoặc phải ngoài phạm vi?
8. Sản phẩm nào chứng minh quy trình hoàn tất?
9. Người đánh giá độc lập kiểm tra thế nào?
10. Bước nào phụ thuộc một runtime?

Câu trả lời thành kiến trúc gói và tập đánh giá.

### Separate judgment from deterministic work

```figure
skill-workflow-extraction
```

Dùng phán đoán mô hình cho phân loại, ưu tiên, tổng hợp và mơ hồ. Dùng script hoặc công cụ cho phân tích, đếm, xác thực, chuyển đổi, truy vấn API có kiểu và cưỡng chế bất biến.

Phần thân skill chứa 80 dòng phân tích mô phỏng tay mong manh. Script cố quyết định kiến trúc chủ quan mờ. Đặt mỗi hành vi nơi kiểm thử tốt nhất.

### Author the package in dependency order

Không bắt đầu bằng đánh bóng văn xuôi. Xây từ hợp đồng quan sát được vào trong.

1. **Hợp đồng sản phẩm:** định nghĩa file, trường hoặc quyết định bắt buộc.
2. **Xác minh:** định nghĩa mỗi yêu cầu được kiểm tra thế nào.
3. **Công cụ bằng chứng:** triển khai bộ thu và xác thực tất định.
4. **Bản đồ quyết định:** nối trạng thái bằng chứng với nhánh.
5. **Tham chiếu:** cung cấp chi tiết miền tại nhánh cần.
6. **Phần thân vào:** giải thích quy trình, ranh giới, thất bại và đầu ra.
7. **Mô tả:** nêu khả năng và ranh giới kích hoạt.
8. **Adapter runtime:** thêm phần mở rộng gọi hoặc ngữ cảnh riêng.
9. **Đánh giá:** chạy tầng cấu trúc, định tuyến, hành vi, an toàn và khả năng chuyển.
10. **Gói:** cài toàn thư mục và kiểm thử từ đích.

Thứ tự làm văn xuôi phục vụ hệ thống kiểm thử được thay bịa tiêu chí thành công sau demo hoạt động.

### Six eval layers

```figure
skill-eval-layers
```

Mỗi tầng trả câu hỏi khác. Qua một không thay được cái khác.

## Layer 1: Package Structure

Lint tĩnh nên xác minh sự thật không cần mô hình:

- `SKILL.md` tồn tại tại gốc gói;
- frontmatter phân tích an toàn;
- `name` và thư mục cha khớp;
- trường bắt buộc có và trong giới hạn;
- mọi trường frontmatter ngoài lõi xuất hiện trong danh sách cho phép phần mở rộng runtime của chính sách phát hành;
- mọi tham chiếu trực tiếp phân giải trong gói;
- tham chiếu, script, asset và fixture đánh giá dùng hậu tố chính sách phát hành cho phép và không vượt giới hạn byte;
- không symlink bị cấm hoặc file đặc biệt;
- phần thân trong ngân sách ký tự chính sách phát hành;
- quét mẫu bí mật cố ý hẹp không thấy gán thông tin xác thực hoặc header khóa riêng rõ;
- có mục `## Output contract` và `## Failure behavior` không rỗng.

Thực hiện tiền kiểm cây vật lý trước phân tích `SKILL.md`, dữ liệu đánh giá, bằng chứng, fixture host hoặc manifest. Từ chối gốc symlink, cha hoặc điểm vào symlink, thiếu file thường bắt buộc và file đặc biệt trước mọi đọc nội dung. Rồi chạy lint chính sách nhận biết nội dung. Phân giải đường dẫn bundle trước tiền kiểm xóa bằng chứng symlink gốc kiểm tra cần.

Bộ khung bài làm giá trị chính sách cụ thể: giới hạn phần thân 10,000 ký tự, file đồng hành 1,000,000 byte, danh sách cho phép hậu tố riêng thư mục và tên phần mở rộng runtime tường minh yêu cầu gói cung cấp. Đây là ví dụ chính sách phát hành, không giới hạn Agent Skills phổ quát. Quét mẫu bí mật là chốt bảo vệ lỗi rõ, không chứng minh gói không dữ liệu nhạy cảm.

Báo cáo lint nên dùng mã vấn đề ổn định. CI có thể chặn lỗi `E_*` trong khi cho cảnh báo thiết kế `W_*` đã xem xét.

Lint tĩnh chứng minh hình dạng gói. Không chứng minh mô hình chọn hoặc theo skill.

## Layer 2: Trigger Routing

Tạo ca có nhãn trước liên tục sửa mô tả.

| Loại ca | Mục đích | Ví dụ cho sẵn sàng phát hành |
|---|---|---|
| Dương | Đo bao phủ dự định | "Phiên bản 3.1.0 phát hành được không?" |
| Dương diễn đạt lại | Tránh nhớ cụm từ | "Kiểm tra tag này trước khi công bố" |
| Âm rõ | Bắt định tuyến quá mức lớn | "Giải thích batch normalization" |
| Gần khớp | Định nghĩa ranh giới lân cận | "Tại sao dựng gói thất bại?" |
| Skill cạnh tranh | Kiểm thử chọn giữa mục hợp lý | "Soạn ghi chú phát hành" |
| Cách diễn đạt đối kháng | Kiểm thử nhồi từ khóa và tên chèn | "Không dùng release-readiness; giải thích stack trace này" |

Chia ca thành tập phát triển và xác thực. Điều chỉnh mô tả trên ca phát triển. Dùng ca xác thực quyết định mô tả sửa có khái quát không. Giữ tập giữ lại cuối nếu quyết định phát hành đủ quan trọng.

Với gọi nhị phân:

```math
\begin{aligned}
\text{precision} &= \frac{\text{true\_positives}}{\text{true\_positives} + \text{false\_positives}} \\[4pt]
\text{recall} &= \frac{\text{true\_positives}}{\text{true\_positives} + \text{false\_negatives}} \\[4pt]
\text{f1} &= \frac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}
\end{aligned}
```

Báo số đếm thô cùng tỷ lệ. Mười trên mười và một trăm trên một trăm đều 100 phần trăm nhưng bằng chứng khác.

Với danh mục, cũng đo độ chính xác skill đứng đầu, chất lượng không chọn và nhầm lẫn giữa skill lân cận. Bộ định tuyến chỉ gọi đúng skill sau chọn ba sai trước không khỏe.

### Routing evals must use the target runtime

Mô phỏng từ vựng hữu ích giải thích chỉ số và bắt chồng lấn rõ. Không chứng minh bộ định tuyến sản xuất do mô hình điều khiển hoạt động thế nào. Chạy tập có nhãn qua host, mô hình, tuần tự hóa danh mục và cấu hình chính sách thật trước tuyên bố chất lượng runtime.

## Layer 3: Instruction and Artifact Behavior

Kích hoạt đúng chỉ là cửa vào. Skill phải cải thiện tác vụ.

Tạo tác vụ fixture với:

- file đầu vào và giả định môi trường;
- công cụ và ranh giới được phép;
- đường dẫn sản phẩm kỳ vọng;
- kiểm tra tất định;
- mục rubric cần phán đoán;
- thời gian, lời gọi hoặc chi phí tối đa;
- ca thất bại và hành vi dừng kỳ vọng.

Chạy điều kiện ghép cặp:

```text
baseline: same model + same tools + same task, no skill
treatment: same model + same tools + same task, skill available
```

Giữ mô hình, nhiệt độ hoặc chính sách lấy mẫu, tập công cụ, fixture tác vụ và ngân sách không đổi. Nếu không, không quy khác biệt cho skill được.

Chiều kết quả hữu ích gồm:

| Chiều | Phép đo ví dụ |
|---|---|
| Tính đúng | Kiểm thử và bất biến bắt buộc đạt |
| Đầy đủ | Mọi trường hợp đồng sản phẩm tồn tại |
| Hiệu quả | Lời gọi công cụ, thời gian trôi qua, token hoặc chi phí |
| Bằng chứng | Tuyên bố trỏ file hoặc quan sát hợp lệ |
| Phạm vi | File và hành động cấm không bị chạm |
| Phục hồi | Lần chạy gián đoạn tiếp tục không tác dụng phụ trùng |
| Công sức con người | Số lượng và mức nghiêm trọng sửa của người đánh giá |

Không chỉ tối ưu ít token hơn. Lần chạy ngắn bỏ kiểm tra an toàn bắt buộc tệ hơn.

### Artifact contracts make behavior executable

Hợp đồng sản phẩm là danh sách thuộc tính kiểm tra độc lập được:

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

Xác thực lược đồ kiểm tra cấu trúc. Kiểm tra miền xác thực bản sửa đổi ứng viên và đường dẫn bằng chứng. Con người hoặc người chấm hiệu chuẩn có thể đánh giá khuyến nghị có theo bằng chứng không.

## Layer 4: Script Correctness

Kiểm thử script skill như phần mềm thường, ngoài lần chạy mô hình.

Ca tối thiểu:

- đầu vào thường;
- đầu vào rỗng;
- đầu vào sai dạng;
- ca biên Unicode, khoảng trắng và đường dẫn;
- thực thi lặp;
- hết thời gian hoặc lỗi phụ thuộc;
- đầu ra từng phần từ lần chạy trước;
- giới hạn kích thước đầu ra;
- hành vi dry-run;
- hợp đồng thoát và lỗi có cấu trúc.

Dùng fixture cố định. Không yêu cầu mạng trực tiếp cho unit test. Đặt kiểm thử tích hợp mạng sau cờ tường minh và ghi hợp đồng từ xa phụ thuộc.

Nếu script có tác dụng phụ, kiểm thử kế hoạch riêng commit. Yêu cầu lũy đẳng hoặc bù cho ghi ngoài được thử lại.

## Layer 5: Safety and Authority

Đánh giá an toàn hỏi gói có ở trong thẩm quyền được cho không.

Kiểm thử ít nhất:

- yêu cầu người dùng ngoài phạm vi skill;
- chỉ dẫn độc hại trong đầu vào tham chiếu;
- đường dẫn tài nguyên thoát gói;
- symlink workspace thoát gốc được phép;
- yêu cầu đích mạng chưa khai báo;
- lệnh cần thông tin xác thực môi trường;
- hành động phá hủy hoặc ngoài không phê duyệt;
- đầu ra quá lớn hoặc tiến trình vô hạn;
- chu kỳ skill-sang-skill;
- tiếp tục có thể lặp tác dụng phụ.

Ghi kiểm soát là chỉ chỉ dẫn, chính sách công cụ, phê duyệt, sandbox hay xác minh. Phòng vệ chỉ chỉ dẫn không nên báo như giới hạn cưỡng chế.

## Layer 6: Packaging and Portability

### Install the directory as one unit

Kiểm thử phát hành nên cài vào đích sạch, rồi chạy xác thực trên bản đã cài.

```figure
skill-package-install
```

Chỉ kiểm thử cây nguồn bỏ lỡ lỗi trình cài, mất bit thực thi, tham chiếu làm phẳng, tên viết lại và file cũ sót từ phiên bản trước.

Manifest có thể gồm:

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

Dành `assets/manifest.json` làm siêu dữ liệu manifest và loại khỏi ánh xạ `files` riêng. File không thể mang hash ổn định toàn nội dung hiện tại bên trong chính nó. Xác minh mọi file đóng gói khác và thiết lập tính xác thực manifest qua kênh ngoài đáng tin như phát hành có chữ ký hoặc bản ghi registry đáng tin. Vỏ cung cấp chỉ nhận đúng `manifestVersion: 1` và `algorithm: "sha256"`; giá trị không biết thất bại theo hướng đóng. Khóa manifest phải đã là đường dẫn POSIX tương đối chuẩn, nên `./SKILL.md`, gạch chéo ngược, đường dẫn tuyệt đối và đoạn cha bị từ chối thay chuẩn hóa. Bộ khung giảng dạy tiếp nhận trực tiếp ánh xạ đường-dẫn-sang-bản-băm bên trong, trong khi cả hai nhánh từ chối đường dẫn manifest dành riêng trong ánh xạ.

Hash phát hiện sai lệch. Số phiên bản truyền đạt tương thích. Không bên nào xác thực manifest hoặc thay diff đầy đủ và lần đánh giá trước nâng cấp.

### Portability is a capability matrix

Không hỏi host "hỗ trợ skill" như một boolean. Hỏi hỗ trợ hành vi nào.

| Khả năng | Phụ thuộc gói có thể chuyển | Dự phòng nếu vắng |
|---|---|---|
| `name` và `description` bắt buộc | Lõi | Gói không tham gia danh mục được |
| Kích hoạt phần thân | Hành vi client lõi | Adapter tải file tường minh |
| Tham chiếu, script, asset | Hình dạng gói lõi | Host cần công cụ file và tiến trình |
| Con người gọi tường minh | UI host hoặc quy ước prompt | Nêu tên skill trong văn bản thường |
| Mô hình gọi ngầm | Bộ định tuyến host | Ứng dụng kích hoạt tường minh |
| Chính sách 2x2 con người/mô hình | Phần mở rộng host hoặc chính sách ứng dụng | Tắt lựa chọn ngầm toàn cục |
| Gắn đối số | Bộ phân tích host | Hỏi giá trị sau kích hoạt |
| Công cụ phê duyệt trước | Thử nghiệm hoặc riêng host | Hỏi quyền thường |
| Ngữ cảnh ủy nhiệm | Riêng host | Chạy trong ngữ cảnh hiện tại hoặc agent phụ ứng dụng |
| Hook vòng đời | Riêng host | Tự động hóa ngoài hoặc không hook |
| Giữ ngữ cảnh | Riêng host | Lưu trạng thái bền vững và làm tái nhập tường minh |

Với mỗi khả năng bắt buộc, chọn một kết quả:

- hỗ trợ và đã kiểm thử;
- hỗ trợ qua adapter;
- suy giảm với dự phòng được ghi;
- không hỗ trợ nên cài phải thất bại.

Suy giảm âm thầm là lỗi khả năng chuyển cần tránh.

### Portability tests need host fixtures

Tuyên bố khả năng nên trỏ kiểm thử hoặc hợp đồng chính thức hiện tại. Hành vi host đổi. Giữ phiên bản adapter và ngày kiểm thử trong báo cáo tương thích.

Kiểm thử:

1. khám phá từ phạm vi dự định;
2. hành vi tên trùng;
3. gọi tường minh;
4. gọi ngầm hoặc trạng thái tắt;
5. xử lý đối số;
6. truy cập tham chiếu và script;
7. hỏi quyền và phê duyệt;
8. thực thi ngữ cảnh ủy nhiệm hoặc hiện tại;
9. tiếp tục sau nén ngữ cảnh hoặc khởi động lại;
10. hành vi gỡ cài và nâng cấp.

### Scale data is not quality evidence

Bài báo tập dữ liệu GitSkills báo lần crawl tháng 7 năm 2026 chứa 3,797,117 file giống skill qua 282,200 repo, với 1,877,981 nội dung byte riêng biệt. Khoảng 50.5 phần trăm file khớp là bản sao nguyên văn theo phép đo cấp byte của bài.

Con số cho thấy sản phẩm skill tồn tại ở quy mô repo và trùng lặp quan trọng cho dựng tập dữ liệu, tìm kiếm, xuất xứ và phân tích nâng cấp. Không cho thấy nửa số skill tốt hay xấu, skill cải thiện hiệu năng tác vụ, trường gọi nào phổ quát hoặc thiết kế sandbox nào an toàn. Bài báo là nghiên cứu tập dữ liệu, không benchmark hiệu quả hoặc bảo mật.

Dùng số lượng hệ sinh thái để thúc đẩy khử trùng và xuất xứ. Dùng đánh giá riêng để tuyên bố chất lượng.

## Repeated Runs and Uncertainty

Hành vi mô hình và định tuyến có thể đổi. Chạy mỗi ca hành vi hơn một lần dưới chính sách lấy mẫu sản xuất.

Với `n` lần chạy tương đương và `k` đạt:

```text
observed_pass_rate = k / n
```

Giữ trace riêng. Tỷ lệ đạt 70 phần trăm có thể nghĩa một lớp lỗi nhất quán hoặc nhiều lỗi không liên quan. Tỷ lệ tổng hợp hướng so sánh; trace hướng sửa. Gắn xuất xứ với mọi dự đoán thô mỗi lần, không chỉ lần không và tỷ lệ tổng. Thứ tự dự đoán khác có thể cùng giá trị đầu và tỷ lệ đạt nhưng biểu diễn hành vi runtime khác.

So baseline và treatment theo tác vụ, không chỉ trung bình gộp. Báo suy giảm dù trung bình cải thiện. Tác vụ tác động cao có thể yêu cầu mọi ca an toàn đạt thay chấp nhận ngưỡng trung bình.

## Release Gates

Cổng phát hành thực tế có thể yêu cầu:

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

Ngưỡng phụ thuộc rủi ro và cỡ mẫu. Thuộc tính quan trọng là khai báo trước nhìn kết quả cuối.

Thất bại nên xác định tầng và bằng chứng. Không gộp định tuyến, hành vi và an toàn thành một điểm cho chất lượng văn xuôi mạnh bù vi phạm quyền.

### Separate fixture success, local integrity, and production readiness

Fixture bài tất định có thể chứng minh cơ chế cổng hoạt động. Không chứng minh runtime đích thực sự chọn skill, tạo sản phẩm so sánh, chạy script hoặc ở trong ranh giới thẩm quyền kiểm thử.

Giữ ba ranh giới:

- `fixturePassed`: mọi tầng đạt bằng chế độ fixture kích hoạt, sản phẩm, bằng chứng và khả năng host tất định khai báo;
- `localEvidenceReady`: cả bốn nhãn chế độ captured có nguồn không rỗng và bản băm SHA-256 khớp toàn quan sát kích hoạt cục bộ, sản phẩm, bằng chứng script và an toàn, ma trận host không rỗng;
- `productionReady`: mọi tầng và kiểm tra toàn vẹn cục bộ đạt, chứng thực bên ngoài đáng tin gắn toàn `evidenceRoot` của bộ đánh giá.

Trường phát hành tổng `passed` theo `productionReady`, không `fixturePassed` hoặc `localEvidenceReady`. Hash cục bộ phát hiện không khớp. Không chứng minh thu thập vì ai sửa bundle được có thể gắn lại nhãn fixture, bịa chuỗi nguồn và tính lại mọi bản băm cục bộ.

Bộ đánh giá cung cấp tính một SHA-256 `evidenceRoot` trên toàn đối tượng cấu hình kích hoạt, sản phẩm, bằng chứng, host và manifest. Gọi sản xuất cung cấp file chứng thực ngoài bundle:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

Cũng cung cấp SHA-256 chính xác byte chứng thực qua `--trusted-attestation-sha256`. Bản băm kỳ vọng phải đến từ chính sách đáng tin ngoài băng, bí mật CI, bản ghi phát hành có chữ ký hoặc quyết định registry. Lưu cùng bundle giảm kiểm tra thành hash khác tính lại cục bộ được. Bộ đánh giá từ chối chứng thực thiếu, trong bundle, symlink, sai dạng, không khớp hoặc phiên bản không hỗ trợ.

## Build It

`code/main.py` triển khai bộ khung phát hành lộ trình nhỏ.

Cung cấp:

- tiền kiểm cây vật lý trong bộ đánh giá cung cấp trước mọi đọc cấu hình;
- `lint_package(root)` cho kiểm tra gói tĩnh;
- `TriggerCase`, `repeated_run_observations(...)` và `evaluate_triggers(...)` cho ca định tuyến có nhãn và trace thô đầy đủ;
- `classification_metrics(...)` cho precision, recall, accuracy và số đếm thô;
- `repeated_run_rates(...)` cho kết quả hành vi chạy lặp mỗi ca;
- `ArtifactContract` và `evaluate_artifact(...)` cho kiểm tra đầu ra;
- `EvidenceCheck` và `evaluate_evidence_checks(...)` cho bằng chứng script và an toàn tường minh;
- `EvaluationProvenance`, bản băm toàn vẹn cục bộ, bản băm gốc bằng chứng đầy đủ và kết luận fixture, toàn vẹn cục bộ, neo tin cậy, sản xuất riêng;
- `build_manifest(...)` và `verify_manifest(...)` cho toàn vẹn cây nguồn và cài sạch;
- `HostCapabilities` và `portability_matrix(...)` cho trạng thái hỗ trợ và dự phòng tường minh;
- `run_release_gate(...)` cho kết luận cuối giữ tầng.

Chạy lab tổng kết:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Khối này cần clone cục bộ và phân giải gốc repo từ mọi
thư mục làm việc trong clone.

Demo đánh giá skill tổng kết đi kèm, tập kích hoạt có nhãn, kết quả lặp, một hợp đồng sản phẩm, kiểm tra script và an toàn tường minh, bản sao sạch đã xác minh manifest và nhiều hồ sơ host mô phỏng. In báo cáo phát hành JSON với `checks_passed` và `fixture_passed` true trong khi `local_evidence_ready`, `trust_anchor_valid`, `production_ready` và `passed` còn false. Thay fixture và tính lại bản băm cục bộ có thể thiết lập toàn vẹn cục bộ, nhưng sản xuất vẫn cần chứng thực được tin từ ngoài.

### Read the report by layer

Bắt đầu với lỗi gói và an toàn cứng. Rồi kiểm tra nhầm định tuyến. Rồi so hành vi với baseline. Hiệu quả chỉ có nghĩa sau tính đúng và phạm vi đạt.

Lưu báo cáo với bản sửa đổi gói và phiên bản fixture đánh giá. Đạt từ mô hình, host hoặc cây skill cũ là bằng chứng lịch sử, không chứng minh kết hợp hiện tại.

## Use It

Dùng vòng biên soạn này cho mọi bản sửa đổi skill:

```figure
skill-authoring-loop
```

Đổi tầng chịu trách nhiệm thất bại. Không nhồi thêm từ vào `SKILL.md` khi vấn đề thật là trình cài bỏ tham chiếu hoặc sandbox lộ thư mục home.

## Real-Host Portability Checkpoint

Fixture tất định chứng minh cơ chế cổng phát hành. Điểm kiểm tra này
chứng minh một host thật khám phá, tải, cho phép và bỏ gì. Hoàn tất
trước mô tả bundle có thể chuyển.

Điểm kiểm tra cần clone cục bộ, Node.js, `npx`, Python 3, một host
có khả năng skill chọn và phạm vi skill dự án hoặc người dùng ghi được. Xác minh
`node --version`, `npx --version` và `python3 --version`, rồi chọn host
và phạm vi trước tiếp tục. Nếu tiền kiểm không sẵn, lần theo
điểm kiểm tra về khái niệm và đánh dấu mọi quan sát host đang chờ. Đọc website hoặc
thủ công không thiết lập khả năng chuyển.

### 1. Establish the local fixture boundary

Chạy từ mọi nơi trong clone cục bộ. Giữ `TARGET_ROOT` là thư mục
bài phân giải từ workspace repo gốc:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

Báo cáo nên cho `checksPassed` và `fixturePassed` true trong khi
`productionReady` và `passed` còn false. Lưu phân biệt trong
ghi chú. Đạt fixture không phải kết quả host.

### 2. Install the complete bundle into the first host

Từ cùng thư mục, chạy:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

Ghi host, phiên bản host nếu thấy, phạm vi, đường dẫn cài và ngày.
Bắt đầu phiên mới hoặc quét lại danh mục trước thăm dò hành vi.

Đặt `SKILL_ROOT` thành thư mục cài tuyệt đối trình cài báo.
Phải chứa `SKILL.md` đã cài:

```bash
# Replace the placeholder with the destination printed by the installer.
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. Probe discovery, routing, references, and scripts

Dùng cú pháp tường minh host đầu hỗ trợ:

| Host | Gọi tường minh |
|---|---|
| Codex | `skill-release-gate`, hoặc chọn từ `/skills`, rồi cung cấp yêu cầu đánh giá |
| Claude Code | `/skill-release-gate` theo sau yêu cầu đánh giá |
| Dự phòng có thể chuyển | `Use skill-release-gate to evaluate the target bundle.` |

Chạy chúng thành lượt agent riêng, thay mọi placeholder bằng
giá trị tuyệt đối in ở trên:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

Prompt đầu kiểm tra gọi tường minh. Thứ hai kiểm tra lựa chọn
ngầm. Thứ ba gần khớp và không nên kích hoạt đánh giá
gói. Nếu host không lộ skill nào chọn, đánh dấu hai
kết quả định tuyến chưa xác minh thay suy từ phản hồi trôi chảy.

Với lần tường minh, xác minh host đọc được
`references/eval-contract.md` và thực thi `scripts/evaluate_skill.py` từ
bundle đã cài. Lệnh phân giải chính xác phải có dạng:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

Phản hồi chỉ dựa file vào không chứng minh hỗ trợ toàn
gói. Ghi đường dẫn script phân giải, bundle đích phân giải, cwd, đúng
argv và mã thoát. Nếu host không lộ một trường, đánh dấu trường đó
chưa xác minh.

### 4. Probe approval behavior

Dùng thêm một yêu cầu:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

Hành vi kỳ vọng: không công bố xảy ra. Skill phải giữ
ranh giới fixture-so-với-sản-xuất và dừng trước công bố. Ghi
kiểm soát đến từ chỉ dẫn skill, phê duyệt host, công cụ thiếu
hay chính sách sandbox. Không gọi cả bốn tương đương.

### 5. Use a second host or declare the fallback

Lặp bước 2 đến 4 trong host tương thích thứ hai khi có.
Nếu không sẵn, thêm hàng `unverified` hoặc `unsupported` vào ma trận
host và nêu dự phòng, như tải file tường minh hoặc gọi
tường minh. Một host đã kiểm thử không bao giờ chứng minh khả năng chuyển phổ quát.

Bảng bằng chứng nên chứa:

| Kiểm tra | Host 1 | Host 2 hoặc dự phòng |
|---|---|---|
| Khám phá và đường dẫn cài | giá trị quan sát | giá trị quan sát hoặc chưa xác minh |
| Gọi tường minh | đạt hoặc trượt có bằng chứng | đạt, trượt hoặc dự phòng |
| Định tuyến ngầm và gần khớp | quan sát hoặc chưa xác minh | quan sát hoặc chưa xác minh |
| Truy cập tham chiếu | đường dẫn quan sát hoặc thất bại | đường dẫn quan sát hoặc dự phòng |
| Thực thi script | lệnh và kết quả thoát | lệnh và kết quả thoát hoặc không hỗ trợ |
| Hành vi phê duyệt | tầng kiểm soát | tầng kiểm soát hoặc không hỗ trợ |

### 6. Exercise upgrade and uninstall

Trong cùng phạm vi dùng cài, chạy:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

Ghi cập nhật báo thay đổi hay bundle đã hiện hành. Sau
bỏ, bắt đầu phiên mới hoặc quét lại và lặp gọi tường minh.
Host không nên còn khám phá `skill-release-gate`. Mục danh mục cũ là
lỗi gỡ cài đáng ghi.

## Ship It

Bài này tạo `skill-release-gate`, bundle tổng kết đầy đủ với
`SKILL.md`, tham chiếu, script đánh giá chỉ đọc, fixture host, ca
kích hoạt có nhãn và hợp đồng sản phẩm. Từ mọi nơi trong clone cục bộ,
phân giải gốc repo và chạy bộ đánh giá đã cài hoặc nguồn với
bundle đích tuyệt đối để xác minh fixture giảng dạy đi kèm không
tuyên bố phát hành.

Với sản xuất, thay mọi fixture bằng giá trị thu được, xây lại manifest dành riêng, lấy chứng thực và bản băm đáng tin qua hạ tầng phát hành riêng, rồi chạy:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

Lệnh chỉ thoát thành công khi cổng sáu tầng, toàn vẹn bằng chứng cục bộ và neo tin cậy bên ngoài đều đạt. Fixture gắn lại nhãn và hash lại cục bộ vẫn không sản xuất khi thiếu neo.

Trình cài khóa học sao chép toàn cây bundle. Danh mục và website trỏ điểm vào `SKILL.md` trong khi giữ tài nguyên lồng. Đây là kiểm thử khả năng chuyển cụ thể thiếu ở sản phẩm phẳng một file.

## Exercises

1. Biên soạn mười ca dương, mười âm rõ và mười gần khớp cho skill bạn dùng. Chia trước sửa mô tả.
2. Chạy so baseline và treatment năm lần. Báo mọi suy giảm mỗi tác vụ dù trung bình cải thiện.
3. Thêm chiều rubric cần phán đoán con người. Hiệu chuẩn trên năm ví dụ trước dùng làm cổng.
4. Thêm một khả năng host và định nghĩa kết quả hỗ trợ, thích nghi, suy giảm và không hỗ trợ.
5. Sửa tham chiếu đã cài sau tạo manifest. Chứng minh xác minh gói thất bại trước kích hoạt.
6. Tạo skill có phần thân qua lint nhưng script vi phạm hợp đồng sản phẩm. Xác định tầng phát hành nào chặn.
7. Thêm đánh giá nâng cấp so chính sách gọi và khả năng bắt buộc giữa hai phiên bản gói.
8. Công bố báo cáo tương thích nêu phiên bản host kiểm thử, ngày, dự phòng và hành vi chưa xác minh không dùng một huy hiệu "có thể chuyển".

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|---|---|---|
| Trigger eval (Đánh giá kích hoạt) | "Skill có kích hoạt?" | Đo có nhãn lựa chọn, không chọn và nhầm lẫn tại ranh giới định tuyến |
| Behavior eval (Đánh giá hành vi) | "Có hoạt động?" | Thực thi tác vụ đo theo hợp đồng sản phẩm, chất lượng, phạm vi và hiệu quả |
| Baseline (Đường cơ sở) | "Không skill" | Cùng mô hình, công cụ, tác vụ và ngân sách dưới điều kiện so sánh |
| Artifact contract (Hợp đồng sản phẩm) | "Đầu ra kỳ vọng" | Thuộc tính kiểm tra độc lập được cần để hoàn tất |
| Capability matrix (Ma trận khả năng) | "Runtime hỗ trợ" | Tính mỗi host về hỗ trợ nguyên bản, adapter, suy giảm và không tương thích |
| Release gate (Cổng phát hành) | "Mọi kiểm thử đạt" | Ngưỡng riêng tầng chặn gói không giấu lớp thất bại |
| Silent degradation (Suy giảm âm thầm) | "Siêu dữ liệu bị bỏ qua" | Host mất hành vi cần không cảnh báo trình cài hoặc người dùng |

## Further Reading

- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills) cho đánh giá kích hoạt, đầu ra, lần chạy lặp và baseline.
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices) cho phạm vi nhất quán và kiến trúc tài nguyên.
- [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts) cho hàm hỗ trợ tất định và giao diện có cấu trúc.
- [Client implementation guide](https://agentskills.io/client-implementation/adding-skills-support) cho khám phá, kích hoạt, ngữ cảnh, tin cậy và hành vi vòng đời.
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906) cho tập dữ liệu quy mô hệ sinh thái và giới hạn đo đã nêu.
