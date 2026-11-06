# Fixtures for lesson 36

Mỗi tệp ở đây là của chúng tôi. `ledger.c` là một bản sao của `manuals/reverse-engineering-101/capture/fixtures/ledger.c`.

Lệnh build cho mọi object x86-64 trong thư mục này và trong `candidates/`:

```
clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c <source>.c
```

| Tệp | Nội dung |
|---|---|
| `ledger.c` | nguồn gốc: `percent_change`, `grade`, `total`, `grade_label` |
| `ledger-x86_64-O1.o` | object gốc, SHA-256 `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f` |
| `candidates/*.c` | tám bản dựng lại của `percent_change` và `grade`, một hàm mỗi tệp |
| `candidates/*.o` | mỗi bản dựng lại được biên dịch bằng lệnh ở trên |
| `runs/agent-run.json` | một lần chạy vòng lặp agent trên rea 6.5.0 và Ghidra 12.1.4, được `main.py --live` ghi lại |
| `runs/leg-one-*.json` | các hàng của một lần chạy thực thi-và-so sánh, được `main.py --save-runs` ghi lại |

Các bài kiểm tra đọc các object và lần chạy đã commit, nên chúng qua trên một host không có clang, rea hoặc Ghidra.
