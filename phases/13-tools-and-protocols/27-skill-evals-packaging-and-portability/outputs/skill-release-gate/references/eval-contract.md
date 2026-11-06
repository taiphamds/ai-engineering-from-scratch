# Evaluation contract

Ứng viên phát hành chỉ đạt khi mọi bề mặt bắt buộc đạt:

- Cấu trúc: trước đọc cấu hình, tiền kiểm cây vật lý từ chối gốc, cha hoặc điểm vào symlink, thiếu file thường bắt buộc và file đặc biệt. Rồi tên thư mục khớp tên frontmatter, siêu dữ liệu bắt buộc có, phần mở rộng runtime khai báo rõ, tham chiếu trực tiếp phân giải, giới hạn kích thước và kiểu gói đạt, không mẫu bí mật rõ, hợp đồng đầu ra và thất bại có, không file đồng hành không được tham chiếu đi kèm.
- Kích hoạt: prompt dương kích hoạt và âm gần khớp giữ bất hoạt. Báo số nhầm lẫn, precision, recall và mọi dự đoán thô mỗi lần. Toàn vẹn cục bộ gắn toàn chuỗi quan sát và fixture định tuyến với nguồn và bản băm SHA-256, không chỉ lần không hoặc tỷ lệ tổng.
- Ổn định: chạy mỗi ca lặp và báo tỷ lệ đạt mỗi ca.
- Sản phẩm: áp cùng khẳng định cho đầu ra baseline và có-skill. Đầu ra skill phải đạt và chứng minh cải thiện. Tuyên bố sản xuất gắn cả hai chuỗi thu được với nguồn và bản băm SHA-256.
- Script: yêu cầu bằng chứng đạt/trượt tường minh từ kiểm thử script tất định, gồm thực thi lặp. Bằng chứng sản xuất gắn toàn tập kiểm tra script và an toàn với nguồn thu được và bản băm SHA-256.
- An toàn: yêu cầu mọi ca ranh giới thẩm quyền khai báo đạt. Trung bình không thể giấu một lần thoát.
- Cây đã cài: xác minh bản cài sạch theo manifest file đã ghi trước kích hoạt. Yêu cầu `manifestVersion: 1` và `algorithm: "sha256"`. Coi `assets/manifest.json` là siêu dữ liệu dành riêng và bỏ khỏi ánh xạ `files` riêng; xác thực manifest qua kênh phát hành ngoài hoặc registry đáng tin.
- Khả năng chuyển: nêu mỗi host đích nguyên bản, cần adapter hay không hỗ trợ. Liệt kê khả năng thiếu. Yêu cầu ít nhất một host và ngưỡng host nguyên bản dương. Toàn vẹn cục bộ gắn yêu cầu thu được và ma trận host với nguồn thăm dò và bản băm SHA-256.

Giữ đánh giá định tuyến riêng kích hoạt bộ khung tất định. Cái đầu đo khả năng khám phá; cái sau cô lập quy trình và hành vi sản phẩm.

Giá trị JSON đi kèm là fixture tất định để học cổng. Có thể đặt `fixturePassed` nhưng không bao giờ `productionReady` hoặc `passed`. Với phát hành thật, đặt `evaluationMode` thành `captured-observations`, `artifactMode` thành `captured-artifacts`, `evidenceMode` thành `captured-results` và `hostMode` thành `captured-capabilities`; ghi một dự đoán boolean mỗi lần và gắn toàn tập quan sát với nguồn và bản băm SHA-256; thay chuỗi baseline và có-skill bằng sản phẩm thu từ cùng tác vụ và môi trường; ghi nguồn thu không rỗng và bản băm sản phẩm SHA-256 khớp; thay mọi kết luận bằng chứng bằng kết quả kiểm thử thu được; gắn toàn tập bằng chứng với nguồn và bản băm SHA-256; thay ma trận khả năng mô phỏng bằng kết quả thăm dò host thu được và gắn với nguồn và bản băm; xây lại manifest; cài vào đích sạch.

Kiểm tra cục bộ đó có thể đặt `localEvidenceReady`. Không chứng minh thu thập vì tác giả bundle gắn lại nhãn fixture và tính lại mọi bản băm được. Vì vậy bộ đánh giá hash toàn gốc bằng chứng năm cấu hình và yêu cầu đối tượng JSON `attestationVersion: 1` ngoài gắn nó. Cung cấp chứng thực từ ngoài bundle và SHA-256 byte chính xác qua `--trusted-attestation-sha256`, có nguồn từ chính sách đáng tin ngoài băng. Chỉ cổng sáu tầng cộng toàn vẹn cục bộ cộng neo tin cậy này đặt được `productionReady` và `passed`.
