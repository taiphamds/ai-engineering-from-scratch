---
name: skill-release-gate
description: Evaluate an Agent Skill bundle for structural integrity, trigger quality, artifact improvement, script correctness, safety, installed-tree integrity, and target-host portability before release.
license: MIT
metadata:
  lesson: "27"
---

# Skill release gate

Dùng skill này trước công bố hoặc phân phối bundle thư mục Agent Skill.

## Workflow

1. Phân giải `SKILL_ROOT` thành thư mục tuyệt đối chứa
   `SKILL.md` đã cài này. Không giả định cwd tiến trình là bundle đã cài.
2. Phân giải `TARGET_ROOT` từ thư mục làm việc workspace gốc và
   phân giải ứng viên người dùng cung cấp thành `TARGET_BUNDLE` tuyệt đối.
3. Đọc `references/eval-contract.md` từ `SKILL_ROOT`.
4. Kiểm tra ca kích hoạt dương và gần khớp trong
   `evals/cases.json` dưới `TARGET_BUNDLE`.
5. Kiểm tra khẳng định baseline và có-skill dùng chung trong
   `evals/artifacts.json` dưới `TARGET_BUNDLE`.
6. Kiểm tra kết quả script và an toàn tường minh trong
   `evals/evidence.json` dưới `TARGET_BUNDLE`.
7. Kiểm tra khả năng runtime khai báo trong
   `assets/hosts.json` dưới `TARGET_BUNDLE` và xác minh hash file đích
   theo `assets/manifest.json`.
8. Với sản xuất, thay dự đoán, sản phẩm, bằng chứng
   và khả năng host tất định bằng kết quả thu được; đặt cả bốn chế độ captured;
   gắn mọi quan sát kích hoạt thô, cả hai sản phẩm, toàn bộ
   tập bằng chứng và ma trận host không rỗng với nguồn không rỗng và
   bản băm xuất xứ SHA-256 khớp. Kiểm tra cục bộ này có thể đặt
   `localEvidenceReady`, nhưng hash tính lại cục bộ không chứng minh thu thập.
9. Lấy chứng thực JSON ngoài có `evidenceRoot` khớp báo cáo,
   cộng SHA-256 byte chính xác từ chính sách đáng tin hoặc kênh
   phát hành riêng. Chứng thực phải là file thường ngoài bundle
   đích.
10. Trước thực thi, hiện đúng argv đã phân giải. Bộ đánh giá đã cài là
    `scripts/evaluate_skill.py` dưới `SKILL_ROOT`. Với fixture bài
    đi kèm, xây argv từ `python3`, đường dẫn bộ đánh giá tuyệt đối đó,
    `--fixture-demo` và `TARGET_BUNDLE` tuyệt đối. Với sản xuất, dùng
    cùng script đã cài với `--attestation`,
    `--trusted-attestation-sha256` và `TARGET_BUNDLE` tuyệt đối, không
    `--fixture-demo`.
11. Trả `checksPassed`, `fixturePassed`, `localEvidenceReady`,
    `trustAnchorValid`, `productionReady` và `passed` với gốc bằng chứng,
    chế độ đánh giá, kiểm tra thất bại, precision, recall, mọi quan sát kích hoạt
    thô, tỷ lệ chạy lặp mỗi ca, so sản phẩm, bằng chứng script và
    an toàn, xác minh cây đã cài và ma trận khả năng chuyển.
    Gồm đường dẫn script phân giải, đường dẫn đích phân giải, cwd, đúng argv
    và mã thoát. Đánh dấu quan sát không sẵn chưa xác minh.

## Output contract

Trả toàn báo cáo đánh giá JSON. Giữ mọi kiểm tra riêng tầng và bằng chứng để tổng hợp đạt không giấu thất bại định tuyến, sản phẩm, script, an toàn, cây đã cài hoặc khả năng chuyển. `fixturePassed` báo fixture giảng dạy thành công. `localEvidenceReady` chỉ báo toàn vẹn bản băm cục bộ. `passed` chỉ true khi `productionReady` cũng có neo tin cậy ngoài bundle hợp lệ.

## Failure behavior

Nếu cấu hình không hợp lệ, xuất xứ vắng hoặc không khớp, chứng thực đáng tin thiếu hoặc không hợp lệ, hash file khác, khả năng bắt buộc vắng hoặc mọi cổng sản xuất thất bại, dừng với kết quả khác không và báo tầng thất bại. Nhánh `--fixture-demo` tường minh chỉ có thể thoát thành công khi `fixturePassed` true và không bao giờ tuyên bố phát hành. Không bao giờ tự động công bố, cài nơi khác, sửa bằng chứng, tạo quyết định tin cậy hoặc hạ ngưỡng.

Không công bố bundle chỉ vì SKILL.md phân tích được hoặc một prompt dương kích hoạt. Không gắn nhãn gói có thể chuyển khi đích bỏ file đồng hành bắt buộc hoặc bỏ qua phần mở rộng runtime bắt buộc.
