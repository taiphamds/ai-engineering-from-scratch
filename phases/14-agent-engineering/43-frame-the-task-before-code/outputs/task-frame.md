# Task Frame: Prevent duplicate email addresses during signup

Trạng thái: READY

## Repository facts
- Các lần ghi tài khoản sử dụng AccountStore (`app/accounts.py:18`)
- Các lỗi trùng sử dụng trạng thái 409 (`tests/test_accounts.py:44`)

## Allowed paths
- `app/accounts.py`
- `tests/test_accounts.py`

## Forbidden paths
- `migrations/**`
- `deploy/**`

## Acceptance evidence
- `python3 -m unittest tests.test_accounts`

## Unknowns
- Liệu so sánh email có không phân biệt chữ hoa chữ thường hay không
