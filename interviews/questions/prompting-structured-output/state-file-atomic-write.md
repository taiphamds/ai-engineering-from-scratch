---
id: state-file-atomic-write
title: Review a state write that can corrupt the next session
card: prompting-structured-output
kind: code-reading
level: 4
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [coding, design-review]
tags: [repo-memory, atomic-write, schema, idempotency, code-reading]
minutes: 12
lessons: [phases/14-agent-engineering/34-repo-memory-and-state]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/take-home-two-tier-memory]
updated: 2026-11-03
---

Một bàn làm việc agent lưu trạng thái giữa các phiên bằng mã này. Hãy xem xét nó. Điều gì có thể sai, bộ ghi của bài học làm gì thay vào đó, và còn những gì cần có quanh thao tác ghi?

```python
def save_state(path, state):
    try:
        path.write_text(json.dumps(state))
    except Exception:
        return
```

## Short answer

Hai lỗi. Một sự cố giữa chừng trong thao tác ghi để lại một file bị cắt cụt mà phiên tiếp theo nạp như trạng thái hỏng, và except im lặng che giấu điều đó, nên agent tiếp tục với dữ liệu rác mà không có tín hiệu nào. Bộ ghi của bài học tạo một file tạm trong cùng thư mục, ghi, đồng bộ xuống đĩa và đổi tên đè lên đích, nên file trên đĩa hoặc là phiên bản cũ hoặc là phiên bản mới. Xung quanh nó cần có một kiểm tra schema từ chối trạng thái xấu trước khi ghi, một trường phiên bản với đường di trú, và các idempotency key cho những lệnh gọi công cụ không an toàn khi lặp lại.

## Full answer

### The two bugs

Bài học chỉ ra một báo cáo lỗi từ một dự án nguồn mở vào tháng Ba năm 2026 với đúng dạng này: file trạng thái được ghi bằng một thao tác ghi văn bản thuần và các ngoại lệ bị bắt rồi bị làm im lặng. Các lần ghi một phần khiến các phiên tiếp tục với trạng thái hỏng mà không có tín hiệu nào. Lỗi thứ nhất là thao tác ghi không nguyên tử. Lỗi thứ hai là mệnh đề except biến một lỗi ồn ào thành một lỗi im lặng.

### The atomic writer

1. Tạo một file tạm bằng `tempfile.mkstemp` bên cạnh đích, bên trong thư mục của nó.
2. Ghi nội dung.
3. `fsync` để các byte đến đĩa.
4. Dùng `os.replace` thay đích bằng file tạm, đây là một thao tác đổi tên nguyên tử trên POSIX và trên Windows.

Một bộ đọc thấy file cũ hoặc file mới, không bao giờ thấy một hỗn hợp.

### Schema first

File trạng thái mang một hợp đồng: các khóa bắt buộc, một enum gồm các giá trị trạng thái được cho phép, các giá trị bị cấm như null cho một mảng, một mẫu cho các id tác vụ, và một số nguyên `schema_version`. Bộ quản lý xác thực trước khi ghi, nên một thao tác ghi xấu là một thao tác ghi bị từ chối, và nó từ chối nạp một file ở phiên bản mà nó không thể di trú. Một script di trú đi kèm mỗi lần tăng phiên bản schema và chạy một cách idempotent khi khởi động.

### Around the write

- **Idempotency key.** Nếu sự cố xảy ra giữa một lệnh gọi công cụ và checkpoint của nó, quá trình phục hồi thử lại lệnh gọi. Ổn đối với thao tác đọc; nguy hiểm đối với email hoặc thao tác chèn cơ sở dữ liệu. Ghi nhật ký một bản ghi đã bắt đầu với id lệnh gọi trước khi thực thi và một bản ghi đã hoàn tất với kết quả sau đó. Khi thử lại, một lệnh gọi có bản ghi đã hoàn tất được bỏ qua và kết quả đã lưu của nó được sử dụng. Một lệnh gọi chỉ có bản ghi đã bắt đầu có thể đã chạy hoặc chưa chạy, nên trước tiên hãy đối chiếu nó, chẳng hạn bằng cách hỏi hệ thống đích xem idempotency key đó đã được áp dụng chưa, trước khi bạn lặp lại hoặc bỏ qua nó.
- **Trạng thái nhỏ, artifact tách riêng.** Các bản ghi hội thoại, file được sinh và tập dữ liệu nằm trong các file riêng hoặc trong kho đối tượng; trạng thái chỉ giữ các đường dẫn.
- **Nhật ký sự kiện cùng snapshot.** Thêm mọi biến đổi vào một nhật ký sự kiện và chụp snapshot trạng thái theo lịch; việc tiếp tục đọc snapshot và phát lại các sự kiện sau đó, điều này cũng cho phép bạn phát lại các quyết định của agent khi gỡ lỗi.

### What belongs in the file

Id tác vụ đang hoạt động, các file được chạm tới trong phiên này, các giả định đã đưa ra, các trở ngại chưa được giải quyết và hành động tiếp theo. Không phải các bản ghi hội thoại thô, trace suy luận, các completion được lấy mẫu hoặc id mô hình của nhà cung cấp. Phép kiểm tra là liệu mục đó có hữu ích sau ba tháng nữa trong một lần chạy lại CI hay không.

## Follow-ups

- **Level 3:** Tại sao file tạm nằm trong cùng thư mục với đích? Expected: để bước cuối là một thao tác đổi tên trên cùng hệ thống file và vẫn nguyên tử; công thức của bài học là một file tạm bên cạnh đích, ghi, đồng bộ, thay thế.
- **Level 4:** Một agent gặp sự cố sau một lệnh gọi công cụ và trước checkpoint. Điều gì sai khi phục hồi, và điều gì sửa được nó? Expected: lệnh gọi được thử lại, điều này nguy hiểm đối với email hoặc thao tác chèn; ghi nhật ký một bản ghi đã bắt đầu với id lệnh gọi trước khi thực thi và một bản ghi đã hoàn tất với kết quả sau đó; dùng lại kết quả của một lệnh gọi đã hoàn tất, và đối chiếu một lệnh gọi chỉ có bản ghi đã bắt đầu trước khi bạn lặp lại nó.
- **Level 4:** Hai agent ghi cùng file trạng thái trong vòng 50 ms. Việc đổi tên nguyên tử cứu được gì, và không cứu được gì? Expected: nó ngăn một file bị ghi dở, nên mỗi bộ đọc thấy một phiên bản hoàn chỉnh; nó không ngăn lần ghi thứ hai thay thế lần thứ nhất, điều này cần sự phối hợp giữa các bộ ghi.
- **Level 4:** Những gì thuộc về file trạng thái và những gì không? Expected: tác vụ đang hoạt động, các file được chạm tới, các giả định, các trở ngại và hành động tiếp theo; không phải các bản ghi hội thoại, trace suy luận, completion hoặc id mô hình của nhà cung cấp, và các artifact lớn chỉ được giữ bằng đường dẫn.

## Wrong answers

- "Bắt ngoại lệ rồi tiếp tục, lần ghi tiếp theo sẽ sửa nó." Except im lặng là lỗi thứ hai; nó che giấu một file bị cắt cụt mà phiên tiếp theo nạp.
- "Ghi vào một file tạm, rồi sao chép nó đè lên đích." Một lần sao chép cũng có thể bị gián đoạn; bước nguyên tử là đổi tên.
- "Lưu toàn bộ bản ghi hội thoại trong trạng thái để không có gì bị mất." Các bản ghi hội thoại là telemetry, không phải trạng thái bền vững; giữ file nhỏ và giữ các artifact trong các file riêng với chỉ đường dẫn của chúng trong trạng thái.

## Taught in

Bài học [repo memory](../../../phases/14-agent-engineering/34-repo-memory-and-state/) cung cấp công thức ghi nguyên tử, hợp đồng ưu tiên schema, idempotency key và mẫu nhật ký sự kiện.
