# Làm việc với bản tiếng Việt trên hai máy

Repo cá nhân: https://github.com/taiphamds/ai-engineering-from-scratch

Repo chính chủ: https://github.com/rohitg00/ai-engineering-from-scratch

Hai máy cùng làm việc trên nhánh `vi/local-translations-2026-11-06`. `origin` trỏ đến repo cá nhân; `upstream` trỏ đến repo chính chủ. Nhánh `main` của repo cá nhân giữ tiếng Anh. Bản tiếng Việt nằm trực tiếp trong các file `docs/en.md` của các bài đã dịch.

## Thiết lập máy B lần đầu

Chạy các lệnh sau trong thư mục bạn muốn đặt repo:

```powershell
git clone --branch vi/local-translations-2026-11-06 https://github.com/taiphamds/ai-engineering-from-scratch.git
cd ai-engineering-from-scratch
git remote add upstream https://github.com/rohitg00/ai-engineering-from-scratch.git
git config --local pull.ff only
git config --local push.default simple
```

Cấu hình remote là riêng trên mỗi máy, không tự đồng bộ khi clone. Máy B cần Git và Node.js để mở trang bằng `Mo-trang-hoc.cmd`. Trình mở cũng có thể dùng Node.js đã có trong runtime Codex. Không sao chép `.venv` từ máy A; nếu cần chạy Python, tạo môi trường riêng trên máy B.

## Mỗi lần bắt đầu làm việc

```powershell
git status
git switch vi/local-translations-2026-11-06
git pull --ff-only origin vi/local-translations-2026-11-06
```

Nếu còn thay đổi chưa commit hoặc pull báo hai lịch sử đã rẽ nhánh, dừng lại và xử lý phần công việc đó trước. Không dùng force push để bỏ qua vấn đề.

## Trước khi chuyển sang máy còn lại

Kiểm tra thay đổi, thêm các file bạn muốn lưu, commit rồi push:

```powershell
git status
git diff
git add duong-dan-file-da-sua
git commit -m "docs(vi): update Vietnamese translation"
git push
```

Thay `duong-dan-file-da-sua` bằng đường dẫn thực tế; có thể thêm nhiều file. Sau khi push thành công trên A, máy B pull trước khi làm tiếp; chiều ngược lại cũng vậy. Tiến độ quiz lưu trong trình duyệt không tự đồng bộ qua Git.

## Khi repo chính chủ có cập nhật

```powershell
git fetch upstream
git diff --stat d7b5633f91591ee3bf55c8d80831b515498cc0e6 upstream/main
```

Mốc trong lệnh trên là bản tiếng Anh đã được tích hợp đầy đủ của đợt ngày 2026-11-06. Lần sau đọc giá trị `lastIntegratedEnglish` hiện tại trong [pending-upstream.json](pending-upstream.json), rồi dùng giá trị đó thay cho mốc trong ví dụ. Sau mỗi đợt gộp hoàn tất, cập nhật hồ sơ và commit cùng nội dung.

Không pull hoặc merge trực tiếp `upstream/main` vào nhánh tiếng Việt. So sánh với mốc tiếng Anh đã tích hợp, liệt kê các bài đã dịch có thay đổi và chờ người dùng duyệt trước khi dịch/gộp. Merge-base của nhánh dịch không thay thế được mốc tiếng Anh này. Chỉ dịch đoạn thêm hoặc sửa; giữ nguyên phần tiếng Việt không thay đổi.

## Quy tắc dịch

- Dùng phiên chính; không dùng NLLB hoặc agent phụ nếu chưa được người dùng yêu cầu lại.
- Chỉ dùng nội dung nguồn trong repo, không thêm kiến thức bên ngoài.
- Dịch nguyên văn; không diễn đạt lại, rút gọn hoặc tự sửa câu.
- Giữ số dòng và vị trí xuống dòng của bản tiếng Anh mới, cấu trúc Markdown, tiêu đề, bảng, code block, Mermaid, figure, danh sách và thứ tự.
- Dịch nội dung trong `## Key Terms`; cột thuật ngữ có thể song ngữ, các thuật ngữ chuyên ngành có thể giữ nguyên tiếng Anh.
- Với JSON, dịch các giá trị hiển thị; giữ khóa, ID, đường dẫn, URL, lệnh, số liệu và thứ tự.
- Không chạy toàn bộ `site/build.js` trong checkout để mở trang; dùng `Mo-trang-hoc.cmd`. Không commit các file sinh tự động như `site/data.js`, `catalog.json`, `package-lock.json`.

[CAN-DUYET.md](CAN-DUYET.md) lưu báo cáo đợt đã hoàn tất. Các script và dữ liệu trung gian của đợt đó đã được dọn; chúng không cần để mở trang.
