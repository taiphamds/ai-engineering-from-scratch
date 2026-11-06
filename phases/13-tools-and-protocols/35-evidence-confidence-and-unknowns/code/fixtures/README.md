# Fixtures for lesson 35

Mỗi tệp ở đây là một chương trình chúng tôi tự viết và biên dịch, hoặc một bản ghi được tạo bằng cách chạy một công cụ trên chương trình đó.

| Tệp | Nó là gì |
|---|---|
| `ledger.c` | Nguồn fixture chung: `percent_change`, `grade`, `total`, `grade_label`. SHA-256 `4564c3e7e39fe4d10530bb6489722924ad3f34ffd78d8fa203a5e1fe832fdacb`. |
| `ledger-x86_64-O1.o` | Object có thể tái định vị ELF x86-64. SHA-256 `9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f`. |
| `harness.c` | Một chương trình kiểm tra host bao gồm `ledger.c` và in một kết quả hàm mỗi lần chạy. `main.py` biên dịch nó bằng compiler host. |
| `rea-evidence-percent-change.json` | Evidence rea 6.5.0 cho `analyze_function` trên `percent_change` với provider Ghidra 12.1.4. `evidence_id` `ev_e88b10dc0c6400e51bb6f7fdc3eaea8d2c97cc02463f0db3e6afeefc273197cd`. |
| `rea-evidence-grade.json` | Evidence rea 6.5.0 cho `analyze_function` trên `grade`. `evidence_id` `ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1`. |
| `rea-snapshot.json` | Snapshot phân tích rea được ghi bởi hai lần chạy ở trên. Hai mục `query_` và một gói bằng chứng với cùng hai bản ghi. |
| `run-evidence.json` | Các bản ghi chạy quan sát được từ bản build host của `harness.c`, được xuất bằng `python3 code/main.py --record code/fixtures/run-evidence.json` ngày 2026-10-13 (macOS 26.2, arm64, Apple clang 17.0.0). |

Lệnh build cho object (Apple clang 17.0.0, clang-1700.6.3.2, macOS 26.2, 2026-10-13):

```bash
clang -target x86_64-unknown-linux-gnu -O1 -fno-asynchronous-unwind-tables -c ledger.c -o ledger-x86_64-O1.o
```

Các lệnh rea (rea-agents 6.5.0, Ghidra 12.1.4, OpenJDK 21.0.12.1, `GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec`, `JAVA_HOME=/opt/homebrew/opt/openjdk@21`), chạy từ thư mục này ngày 2026-10-14:

```bash
npx -y rea-agents@6.5.0 function "$PWD/ledger-x86_64-O1.o" grade --provider ghidra --format json --snapshot "$PWD/rea-snapshot.json" > rea-evidence-grade.json
npx -y rea-agents@6.5.0 function "$PWD/ledger-x86_64-O1.o" percent_change --provider ghidra --format json --snapshot "$PWD/rea-snapshot.json" > rea-evidence-percent-change.json
```

Lệnh đầu mất 8.6 s và lệnh thứ hai 8.5 s, mỗi lệnh với một lần import Ghidra mới. Một lần chạy thứ ba của lệnh `grade` với cùng snapshot mất 2.1 s và trả về cùng bản ghi với cùng `evidence_id`.
