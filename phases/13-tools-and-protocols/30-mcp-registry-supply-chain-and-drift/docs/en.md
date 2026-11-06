# MCP Registry Supply Chain: Admission, Drift, and Rollback

> Mục registry cho biết nhà phát hành khai báo gì. Tiếp nhận sản xuất chứng minh bạn lấy gì, quan sát gì, phê duyệt gì và khôi phục an toàn được gì.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## Learning Objectives

- Tách công bố Registry, xuất xứ gói, khám phá runtime và phê duyệt cục bộ.
- Xác minh không gian tên máy chủ MCP không tin tên trong bản ghi riêng.
- Ghim bằng chứng công bố, nguồn thực thi, xuất xứ và bộ mô tả trực tiếp bất biến.
- Phát hiện đổi trạng thái registry và sai lệch runtime sau tiếp nhận.
- Hoàn tác định tuyến về phiên bản đã tiếp nhận trước không viết lại lịch sử.
- Duy trì sổ tiếp nhận phát hiện sửa đổi giải thích mọi quyết định.

## The Problem

Bạn tìm `com.example/inventory` trong registry. Mô tả trông đúng. Gói tồn tại. Máy chủ trả lời `server/discover`.

Không phải một sự thật. Là chuỗi sự thật từ thẩm quyền khác nhau:

1. Nhà phát hành xác thực cho không gian tên đã nộp bản ghi.
2. Registry gói phục vụ sản phẩm có danh tính và bản băm cụ thể.
3. Endpoint đang chạy báo phiên bản giao thức, khả năng, công cụ và thông tin máy chủ chẩn đoán.
4. Tổ chức bạn quyết định đúng kết hợp này được phép.

Gộp thành “ở trong registry nên tin” tạo điểm mù chuỗi cung ứng. Công bố hợp lệ vẫn có thể ngừng được khuyến nghị. Tag gói có thể trỏ sản phẩm ngoài dự kiến nếu không ghim bản băm. Máy chủ có thể thêm công cụ phá hủy sau xem xét. Hoàn tác có thể âm thầm chọn phiên bản chưa từng tiếp nhận.

Cách sửa là bộ kiểm soát tiếp nhận có bằng chứng tại mọi ranh giới.

## The Registry Is an Index, Not Your Approval System

MCP Registry chính thức lưu siêu dữ liệu máy chủ. Bản ghi `server.json` nêu phiên bản máy chủ và khai báo một hoặc nhiều gói hoặc endpoint từ xa. Quy tắc công bố thêm xác thực không gian tên, kiểm tra sở hữu gói, quy tắc registry hạn chế và vị trí siêu dữ liệu nhà phát hành hẹp.

Kiểm soát đó trả câu hỏi công bố. Chính sách sản xuất vẫn trả câu hỏi triển khai:

| Ranh giới | Câu hỏi | Bên sở hữu bằng chứng |
|---|---|---|
| Không gian tên | Nhà phát hành được dùng tên này không? | Xác thực Registry cộng đầu vào không gian tên đã xác minh của bạn |
| Bản ghi | Nhà phát hành khai báo gì cho phiên bản này? | Bản băm `server.json` bất biến |
| Nguồn thực thi | Gói hoặc endpoint từ xa nào sẽ thực thi? | Trường nguồn khai báo, kết quả sở hữu xác minh, vận chuyển và bản băm đáng tin |
| Runtime | Endpoint hiện đưa gì ra? | `server/discover` và bộ mô tả công cụ |
| Tiếp nhận | Chính sách phê duyệt đúng tập này chưa? | Ghim cục bộ và mục sổ |
| Vận hành | Còn an toàn không và thứ gì thay được? | Kiểm tra sai lệch, đồng bộ trạng thái, sức khỏe và tuyến hoàn tác |

Phiên bản lược đồ Registry và phiên bản giao thức MCP độc lập. Bản ghi có thể dùng lược đồ máy chủ `2025-12-11` công bố trong khi máy chủ trực tiếp hỗ trợ MCP `2026-07-28`. Không bao giờ suy bên này từ bên kia.

```figure
mcp-registry-admission
```

## Seven Controls in One Admission Decision

### 1. Namespace verification

Tên Registry chính thức dùng không gian tên xác thực. Miền xác minh có thể ánh xạ tiền tố miền đảo. Ví dụ kiểm soát `example.com` có thể thiết lập `com.example/*`.

Không nhận kiểm tra tiền tố chuỗi:

```python
server_name.startswith("com.example")
```

Cũng nhận `com.exampleevil/tool`. Tách tên ở `/`, yêu cầu slug không rỗng và so đoạn không gian tên chính xác. Quan trọng hơn, truyền không gian tên xác minh vào tiếp nhận từ kết quả xác thực. Không suy tin cậy từ bản ghi không đáng tin.

Không gian tên dựa GitHub và dựa miền dùng nhánh xác thực khác. Chuẩn hóa mỗi nhánh thành một đầu vào tiếp nhận: đúng chuỗi không gian tên xác minh.

### 2. Provenance join

Với bản ghi gói, khai báo và sản phẩm lấy phải nối trên trường tường minh:

- loại registry gói
- định danh gói
- phiên bản gói
- kết quả sở hữu xác minh
- bản băm sản phẩm tải

Cũng xác thực vận chuyển gói khai báo. Bản ghi chỉ endpoint từ xa hợp lệ và không được từ chối vì thiếu gói. Với nguồn từ xa, nối URL khai báo và loại vận chuyển với sở hữu endpoint xác minh độc lập và bản băm bằng chứng kết nối hoặc triển khai đáng tin.

Mã bài hỗ trợ cả hai loại nguồn và hash nguồn chọn cùng nguồn Registry, tên máy chủ, phiên bản Registry, bản băm bản ghi và bản băm bằng chứng. Bản băm xuất xứ kết quả là con trỏ gọn đến toàn tập bằng chứng. Không thay giữ bằng chứng.

Không bao giờ nhận bản băm chỉ do sản phẩm đang cố xác minh cung cấp. Tính tại ranh giới lấy đáng tin hoặc nhận từ dịch vụ gói có kết quả xác minh bạn xác thực.

### 3. Pin the decision, not only the version

Phiên bản Registry là định danh công bố duy nhất. Siêu dữ liệu đã công bố bất biến. Bản ghi đổi cần phiên bản mới. Semantic versioning được khuyến nghị, nhưng Registry không bắt buộc và không nhận dải phiên bản.

Nghĩa là `^1.4` không ghim tiếp nhận. “latest” cũng không. Ghim hữu ích chứa:

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

Ghim nhiều tầng cho xác định ranh giới nào đổi. Bản băm bản ghi đổi dưới cùng phiên bản Registry là thất bại toàn vẹn Registry. Bản băm nguồn đổi dưới cùng tọa độ gói hoặc triển khai từ xa là thất bại toàn vẹn nguồn thực thi. Bản băm tập công cụ đổi là sai lệch runtime.

### 4. Live drift detection

Tiếp nhận nên quan sát máy chủ thực sự nhận lưu lượng. Gọi `server/discover`, liệt kê hoặc lấy bộ mô tả công cụ đưa ra qua nhánh đáng tin và xác minh:

- `2026-07-28` trong `supportedVersions`
- mọi khả năng yêu cầu cục bộ có
- mọi bộ mô tả công cụ có bề mặt danh tính và lược đồ bắt buộc
- bản băm bộ mô tả chuẩn hóa khớp ghim tiếp nhận trên kiểm tra sau

Giá trị kết quả tùy chọn `_meta["io.modelcontextprotocol/serverInfo"]` là ngữ cảnh hiển thị, nhật ký và gỡ lỗi tự khai. Ghi làm bằng chứng chẩn đoán, nhưng không bao giờ dùng thiết lập không gian tên, sở hữu gói, sở hữu endpoint, tiếp nhận hoặc mọi quyết định bảo mật khác. Bí danh `serverInfo` trực tiếp ngoài `_meta` không phải trường hợp đồng và không nên nâng thành bằng chứng chẩn đoán.

Chỉ chuẩn hóa trường có thứ tự không mang nghĩa. Mẫu sắp danh sách công cụ theo tên ổn định trước hash, nên đổi thứ tự danh sách vô hại không gây sai lệch. Không bỏ trường bộ mô tả. Công cụ mới, lược đồ đổi, mô tả đổi hoặc chú giải mới đổi ghim.

Mẫu coi bộ mô tả sai dạng và mọi đổi bản băm bộ mô tả là sai lệch, cách ly ghim, bỏ tuyến hoạt động và chặn phiên bản đó làm đích hoàn tác. Chính sách sản xuất chỉ có thể cho đổi biên tập qua đánh giá mới vì mô tả ảnh hưởng mô hình chọn công cụ. Siêu dữ liệu “thẩm mỹ” có thể đổi hành vi agent.

### 5. Registry status is live state

API Registry gắn đối tượng `_meta` cấp phản hồi cạnh mỗi bản ghi máy chủ. Trường do Registry quản lý nằm dưới `_meta["io.modelcontextprotocol.registry/official"]`. Truyền đối tượng `_meta` phản hồi vào tiếp nhận và đọc `_meta["io.modelcontextprotocol.registry/official"].status`. Giá trị `_meta.status` trực tiếp không phải hình dạng đường truyền chính thức. Không nhầm siêu dữ liệu phản hồi với `_meta` riêng bản ghi công bố. Trạng thái có thể:

- `active`: trả mặc định và đủ điều kiện tiếp nhận cục bộ
- `deprecated`: vẫn khám phá được với cảnh báo nhưng không còn lựa chọn tự động an toàn
- `deleted`: ẩn mặc định trong khi bản ghi lịch sử còn sẵn qua view xóa hoặc tăng dần

Đồng bộ trạng thái sau tiếp nhận. Nếu phiên bản hoạt động thành ngừng khuyến nghị hoặc xóa, cách ly ghim và dừng định tuyến công việc mới. Giữ bằng chứng. Xóa khỏi danh sách mặc định không là quyền xóa dấu kiểm toán.

Siêu dữ liệu tùy chỉnh nhà phát hành cung cấp chỉ thuộc `_meta.io.modelcontextprotocol.registry/publisher-provided` trong bản ghi công bố. Siêu dữ liệu phản hồi do Registry quản lý riêng. Không cho nhà phát hành tự đặt trạng thái chính thức.

### 6. Rollback means route restoration

Công bố bất biến không sửa trong hoàn tác. Hoàn tác chọn ghim đã tiếp nhận trước, hiện đủ điều kiện và đổi tuyến hoạt động.

Đích an toàn phải:

1. Có bản ghi tiếp nhận hoàn tất.
2. Vẫn có trạng thái Registry hoạt động dưới chính sách.
3. Không bị cách ly bởi bằng chứng runtime hoặc bảo mật.
4. Vẫn phân giải đến gói ghim và tập bộ mô tả trực tiếp.
5. Qua kiểm tra sức khỏe hiện tại.

Mẫu tập trung ba điều kiện đầu. Bộ đối soát thật nên lấy lại gói và kiểm tra lại endpoint trực tiếp trước kích hoạt.

### 7. Append an admission ledger

Cơ sở dữ liệu tiếp nhận nói gì đang hoạt động. Sổ giải thích tại sao.

Mỗi mục mẫu chứa thứ tự, thời gian, sự kiện, máy chủ, phiên bản, kết quả, lý do, bằng chứng, hash mục trước và hash riêng. Đổi kết quả cũ phá xác minh mục đó và mọi liên kết sau.

Đây là phát hiện sửa đổi, không chống sửa đổi thần kỳ. Neo đầu sổ định kỳ trong miền tin cậy riêng như siêu dữ liệu phát hành có chữ ký hoặc lưu trữ ghi một lần. Hạn chế ai thêm được. Giữ token cấp quyền, thông tin xác thực gói, đối số công cụ và dữ liệu endpoint riêng ngoài bằng chứng.

## Build It

Bộ kiểm soát chạy được trong `code/main.py`. Chỉ dùng thư viện chuẩn Python.

Bắt đầu bằng minh họa hữu hạn:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

Minh họa thực hiện năm thao tác:

1. Tiếp nhận `1.0.0` với không gian tên, xuất xứ gói, giao thức, khả năng và công cụ khớp.
2. Tiếp nhận `1.1.0` và làm hoạt động.
3. Quan sát công cụ xóa ngoài dự kiến lúc runtime.
4. Quan sát trạng thái Registry của `1.1.0` thành `deprecated`.
5. Khôi phục định tuyến về ghim `1.0.0` vẫn tiếp nhận.

Hình dạng kỳ vọng:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

Đọc triển khai theo thứ tự:

1. `namespace_for_domain()` và `namespace_matches()` thiết lập thẩm quyền đặt tên chính xác.
2. `digest()` và `normalized_tools()` tạo bằng chứng tất định.
3. `RegistryAdmissionController.admit()` nối công bố, xuất xứ, runtime và chính sách.
4. `check_live()` so quan sát mới với ghim.
5. `observe_registry_status()` cách ly phiên bản có trạng thái Registry đổi.
6. `rollback()` chỉ kích hoạt đích đủ điều kiện đã tiếp nhận trước.
7. `AdmissionLedger.verify()` phát hiện đổi lịch sử ghi.

## Use It

Đặt bộ kiểm soát giữa khám phá và định tuyến:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                               |                 |
                                               v                 v
                                          evidence store    admission ledger
```

Dùng danh tính riêng cho công việc này. Worker đồng bộ Registry cần quyền đọc siêu dữ liệu. Bộ xác minh sản phẩm cần quyền lấy gói. Bộ đối soát tuyến cần quyền kích hoạt ghim phê duyệt. Không bên nào cần mọi thông tin xác thực.

Làm trạng thái triển khai tường minh. “Phê duyệt” nghĩa bằng chứng qua chính sách. “Hoạt động” nghĩa tuyến hiện chọn nó. “Cách ly” nghĩa không nhận công việc mới. “Bị thay thế” nghĩa phiên bản tiếp nhận khác đang hoạt động. Không mã hóa cả bốn trong một Boolean.

Chạy tiếp nhận trước đưa máy chủ trong `tools/list`. Nếu không client có thể khám phá công cụ trong khoảng giữa công bố và đánh giá chính sách.

## Interactive Lab

Bạn sẽ quan sát một ranh giới thất bại mỗi lần.

### Lab A: namespace collision

Mở shell Python từ thư mục mã:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

Rồi chạy:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

Kết quả đầu `True`; thứ hai `False`. Thay so chính xác bằng `startswith` cục bộ và quan sát tại sao tên thứ hai vượt ranh giới. Khôi phục so chính xác trước tiếp tục.

### Lab B: descriptor drift

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

Kiểm tra lý do và trạng thái tuyến. Gói và bản ghi Registry không đổi. Bề mặt công cụ runtime đổi, nên bộ kiểm soát cách ly và ngừng kích hoạt ghim. Vì vậy kiểm soát chuỗi cung ứng phải tiếp tục sau cài.

### Lab C: status and rollback

Tiếp nhận `1.1.0`, đánh dấu ngừng khuyến nghị và thử cả hai đích hoàn tác:

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

Đích cách ly bị từ chối. Ghim hoạt động trước được chấp nhận. Sổ còn hợp lệ.

## Practice Lab

Mở rộng bộ kiểm soát với cổng phê duyệt hai người.

Yêu cầu:

- Lưu phê duyệt dưới tham chiếu bằng chứng có chữ ký, không tên thay đổi được trong ghim.
- Yêu cầu hai danh tính người đánh giá khác nhau cho tập công cụ có công cụ `destructiveHint: true`.
- Từ chối danh tính người đánh giá trùng.
- Giữ lần tiếp nhận gốc trong sổ khi phê duyệt chưa đủ.
- Thêm kiểm thử không, một, trùng và hai phê duyệt riêng.
- Không ghi chữ ký, thông tin xác thực hoặc toàn đối số công cụ riêng.

Thành công nghĩa công cụ phá hủy không hoạt động được đến khi cả hai danh tính phê duyệt đúng bản băm bản ghi, gói và tập công cụ.

## Shipped Artifact

Bài này cung cấp `outputs/skill-mcp-registry-admission.md`. Dùng như sổ tay phẳng tái sử dụng khi xem phiên bản Registry mới hoặc điều tra sai lệch. Định nghĩa đầu vào, quy tắc từ chối, bundle bằng chứng, đối soát trạng thái và bằng chứng hoàn tác không phụ thuộc tên lớp mẫu.

## Verify It

Chạy minh họa và bộ tất định:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- ranh giới không gian tên chính xác từ chối tiền tố giống
- chỉ trạng thái Registry không gian tên chính thức làm phiên bản đủ điều kiện
- bằng chứng gói và từ xa chưa xác minh hoặc không khớp bị từ chối
- siêu dữ liệu nhà phát hành không mạo danh được siêu dữ liệu Registry quản lý
- thứ tự công cụ chuẩn hóa không giấu đổi bộ mô tả
- cấu trúc gói và công cụ sai dạng từ chối an toàn
- `serverInfo` giữ chẩn đoán và không bao giờ cung cấp thẩm quyền tiếp nhận
- sai lệch bộ mô tả cách ly, ngừng kích hoạt và chặn hoàn tác về ghim
- đổi trạng thái cách ly ghim hoạt động
- hoàn tác không chọn phiên bản cách ly hoặc không biết được
- sửa sổ bị phát hiện

## Production Failure Modes

| Thất bại | Tại sao xảy ra | Phản ứng bắt buộc |
|---|---|---|
| Tên có vẻ hợp lệ nhưng không gian tên chưa xác thực | Chính sách tin văn bản bản ghi | Từ chối đến khi bộ xác minh không gian tên đáng tin cung cấp đúng tiền tố |
| Cùng tọa độ gói trả byte mới | Phía trước thay đổi được hoặc phân phối bị xâm phạm | Dừng kích hoạt, giữ cả hai bản băm, điều tra ranh giới lấy |
| “Latest” đổi không xem xét | Chọn thả nổi thoát ghim | Chỉ phân giải đúng phiên bản tiếp nhận và bản băm |
| Công cụ mới xuất hiện sau phê duyệt | Sai lệch runtime hoặc triển khai khác | Cách ly tuyến và thu quan sát bộ mô tả mới |
| Phiên bản ngừng khuyến nghị còn hoạt động | Đồng bộ trạng thái thiếu hoặc trễ | Đối soát trạng thái theo lịch và trước kích hoạt |
| Bản ghi xóa biến khỏi đồng bộ mặc định | Client chỉ yêu cầu bản ghi hoạt động | Dùng đối soát tăng dần hoặc nhận biết xóa và giữ lịch sử cục bộ |
| Đích hoàn tác chưa từng tiếp nhận | Kiểm soát tuyến và trạng thái phê duyệt ngắt rời | Từ chối hoàn tác và chạy tiếp nhận mới cho đích |
| Sổ xác minh cục bộ sau kẻ tấn công viết lại mọi mục | Chuỗi hash không neo ngoài | Công bố đầu sổ có chữ ký vào miền tin cậy riêng |
| Bằng chứng chứa bearer token hoặc đối số công cụ | Ghi nhật ký sao chép toàn yêu cầu | Che lúc thu và chỉ lưu bằng chứng tối thiểu |

## Operational Rule

Công bố trả “danh tính này công bố tên này được không?” Tiếp nhận trả “ta sẽ thực thi đúng sản phẩm này và đưa đúng hành vi này ra không?” Giữ quyết định riêng, ghim mọi mối nối và làm hoàn tác chọn bằng chứng thay bộ nhớ.

## Further Reading

- [Official Registry server.json requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [Official Registry OpenAPI contract](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
