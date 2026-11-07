# Sandboxes

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Cô lập cho các agent chạy mã hoặc điều khiển một máy tính, và chính sách quanh nó.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [The agent has sudo and a Docker Engine, so where is the wall](hypervisor-is-the-boundary.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The page says send it, and the agent has a send tool](screen-text-is-not-permission.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The key reads proxy-managed and the agent still works](sentinel-is-not-the-key.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The host that timed out in 90 bytes](blocked-host-reads-as-timeout.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [A clean diff and a new pre-commit hook](clone-mode-and-the-hidden-hook.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Why the deny for example.com was refused](deny-wins-and-the-two-scopes.md) | Khái niệm | 2 Làm việc | 8 |
| [Four checks before spawn, and the call that gets through](denylist-runner-is-a-guardrail.md) | Đọc mã | 2 Làm việc | 8 |
| [pwd was rejected in one run and ran in the next](permissions-are-not-a-boundary.md) | Khái niệm | 2 Làm việc | 8 |
| [The port that answers on one loopback and refuses the other](published-port-answers-ipv4-only.md) | Gỡ lỗi | 2 Làm việc | 6 |
| [Share an hour of installs as a template or as a kit](template-or-kit-for-the-toolchain.md) | Đánh đổi | 2 Làm việc | 8 |
| [A travel agent that reads any page and is logged in](browser-agent-trust-boundary.md) | Thiết kế | 3 Cao cấp | 10 |
| [A build that takes a day, on a sandbox that lives an hour](cloud-sandbox-clock-and-bill.md) | Ước lượng | 3 Cao cấp | 8 |
| [One allowlist for every laptop, and who can widen it](governance-narrows-never-widens.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Two mixins, one host, and the update that must stop](kit-grants-union-and-widen.md) | Thiết kế | 3 Cao cấp | 10 |
| [Three failures in one sandboxed agent run](readonly-database-in-the-sandbox.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [The allowlist that still lets the repository leave](exfil-through-an-allowed-host.md) | Thiết kế | 4 Staff | 12 |
| [Five identical calls, five rejections, exit 1](headless-coordinator-loops-to-death.md) | Gỡ lỗi | 4 Staff | 12 |
| [Six engineers, one repository, one reviewable sandbox setup](team-sandbox-policy-take-home.md) | Làm ở nhà | 4 Staff | 60 |

[Tất cả các thẻ](../../README.md)
