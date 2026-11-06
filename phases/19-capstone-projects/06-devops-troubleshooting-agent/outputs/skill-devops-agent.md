---
name: devops-agent
description: Build a Kubernetes troubleshooting agent that walks a cluster knowledge graph, ranks root causes, and gates every remediation through Slack.
version: 1.0.0
phase: 19
lesson: 06
tags: [capstone, devops, sre, kubernetes, langgraph, fastmcp, aiops]
---

Với cụm K8s và nguồn cảnh báo (PagerDuty hoặc Alertmanager), xây agent tạo giả thuyết nguyên nhân gốc xếp hạng dưới năm phút và kiểm soát mọi khắc phục qua thẻ phê duyệt Slack.

Kế hoạch xây dựng:

1. Thu nạp kube-state-metrics vào Neo4j hoặc kuzu mỗi 30s. Xây đồ thị Pods, Deployments, Services, Nodes, PVCs, HPAs cộng cạnh phủ đo từ xa đến nguồn Prometheus, Loki, Tempo.
2. Dựng bộ nhận webhook FastAPI cho PagerDuty và Alertmanager.
3. Cung cấp công cụ chỉ đọc qua FastMCP với truyền tải StreamableHTTP: kubectl get/describe, promql, logql, traceql.
4. Xây agent nguyên nhân gốc LangGraph ba nút: `sample` (lấy đo từ xa 15m), `walk` (duyệt lân cận đồ thị), `hypothesize` (xếp ứng viên theo độ mới × độ cụ thể × số trích dẫn).
5. Đăng top-3 giả thuyết xếp hạng có trực quan đường đồ thị lên Slack với nút phê duyệt.
6. Đặt công cụ phá hủy (scale, rollback, delete) trên máy chủ FastMCP riêng sau token phê duyệt agent chỉ nhận sau chấp thuận Slack.
7. Duy trì log kiểm toán chỉ nối thêm: mọi lệnh *cân nhắc*, có phê duyệt không, có thực thi không, ai phê duyệt.
8. Xây 20 kịch bản sự cố tổng hợp (OOMKill, DNS chập chờn, HPA dao động mạnh, PVC đầy, hàng xóm gây nhiễu, sidecar lỗi, rollout ConfigMap xấu, luân chuyển chứng chỉ, backoff kéo image, lỗi probe và 10 nữa). Chấm agent theo độ chính xác RCA và thời gian đến giả thuyết.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Độ chính xác RCA trên bộ kịch bản | Ít nhất 80% nguyên nhân gốc đúng trên 20 sự cố tổng hợp |
| 20 | An toàn | Chốt hành động phá hủy không bao giờ kích hoạt thiếu phê duyệt Slack trong log kiểm toán |
| 20 | Thời gian đến giả thuyết | p50 dưới 5 phút từ cảnh báo đến bản tóm tắt Slack |
| 20 | Khả năng giải thích | Mọi giả thuyết có đường đồ thị và trích dẫn đo từ xa |
| 15 | Đầy đủ tích hợp | PagerDuty, Slack, ArgoCD, Prometheus hoạt động đầu cuối |

Các trường hợp loại bỏ dứt khoát:

- Agent có một máy chủ MCP trộn công cụ chỉ đọc và phá hủy.
- Mọi RCA tạo không trích dẫn đo từ xa. Giả thuyết không trích dẫn phải bị từ chối.
- Log kiểm toán chỉ ghi thực thi. Phải ghi mọi lệnh cân nhắc.
- Khẳng định độ chính xác không chạy agent đối với bộ 20 kịch bản có seed.

Quy tắc từ chối:

- Từ chối khắc phục thiếu phê duyệt Slack từ người trực. Ngay cả khi giả thuyết rõ ràng.
- Từ chối cung cấp `kubectl exec`, `kubectl port-forward` hoặc công cụ tương tác qua MCP chỉ đọc. Chúng có tác dụng phá hủy.
- Từ chối áp dụng hàng loạt khắc phục trên nhiều deployment thiếu thẻ phê duyệt theo deployment.

Đầu ra: repo chứa bộ nhận FastAPI, agent LangGraph, máy chủ MCP chỉ đọc và phá hủy, tích hợp Slack, bộ kiểm thử 20 kịch bản, so sánh cạnh nhau với AWS DevOps Agent trên ba sự cố chung và bài viết về lệnh suýt xảy ra (agent *cân nhắc* nhưng không thực thi) trong cửa sổ quan sát một tuần.
