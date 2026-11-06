# Capstone 06 — DevOps Troubleshooting Agent for Kubernetes

> DevOps Agent AWS lên GA, Resolve AI công bố cẩm nang K8s, NeuBird demo giám sát ngữ nghĩa, Metoro gắn SRE AI với SLO theo dịch vụ. Hình dạng sản xuất ổn định: webhook cảnh báo kích hoạt, agent đọc dữ liệu đo từ xa, duyệt đồ thị đối tượng K8s, xếp giả thuyết nguyên nhân gốc và đăng bản tóm tắt Slack có nút phê duyệt. Chỉ đọc mặc định. Mọi khắc phục qua cổng con người. Bài tổng kết là agent đó, đánh giá trên 20 sự cố tổng hợp và so Agent AWS trên ba trường hợp chung.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (Slack integration)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and MCP), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P14 · P15 · P17 · P18
**Time:** 30 hours

## Problem

Câu chuyện SRE 2025-2026 thành: "agent AI phân loại sự cố, con người phê duyệt khắc phục." AWS DevOps Agent, Resolve AI, NeuBird, Metoro, PagerDuty AIOps đều cung cấp hình dạng này trong sản xuất. Agent đọc chỉ số Prometheus, log Loki, dấu vết Tempo, kube-state-metrics và đồ thị tri thức đối tượng K8s. Tạo giả thuyết nguyên nhân gốc xếp hạng có trích dẫn đo từ xa dưới năm phút. Không bao giờ thực thi lệnh phá hủy không có phê duyệt con người tường minh qua Slack.

Phần lớn việc khó là phạm vi và an toàn, không phải suy luận. Agent cần bề mặt RBAC chỉ-đọc-mặc-định, máy chủ công cụ MCP gia cố và log kiểm toán mọi lệnh cân nhắc so với thực thi. Cần biết lúc vượt khả năng và chuyển cấp. Và phải chạy đủ rẻ để chuỗi OOM-kill không sinh hóa đơn agent $5k.

## Concept

Agent hoạt động trên đồ thị tri thức. Nút là đối tượng K8s (Pods, Deployments, Services, Nodes, HPAs, PVCs) cộng nguồn đo từ xa (chuỗi Prometheus, luồng Loki, dấu vết Tempo). Cạnh mã hóa sở hữu (Pod -> ReplicaSet -> Deployment), lập lịch (Pod -> Node), quan sát (Pod -> chuỗi Prometheus). Đồ thị được giữ mới bằng đồng bộ kube-state-metrics và lấy mẫu lại mỗi cảnh báo.

Khi cảnh báo kích hoạt, agent tìm nguyên nhân gốc từ đối tượng ảnh hưởng. Duyệt cạnh, lấy lát dữ liệu đo từ xa liên quan (15 phút cuối), soạn giả thuyết. Giả thuyết xếp theo bằng chứng: bao nhiêu trích dẫn đo từ xa hỗ trợ, mới đến đâu, cụ thể đến đâu. Top-3 giả thuyết đến Slack với trực quan đường đồ thị và nút phê duyệt hành động khắc phục.

Khắc phục có cổng kiểm soát. Hành động mặc định được phép chỉ đọc. Hành động phá hủy (giảm quy mô, hoàn tác, xóa Pod) cần phê duyệt Slack; hook hoàn tác ArgoCD cần token xác thực agent không bao giờ giữ. Log kiểm toán ghi mọi lệnh agent *cân nhắc* — không chỉ thực thi — để rà soát bắt tình huống suýt xảy ra.

## Architecture

```
PagerDuty / Alertmanager webhook
           |
           v
     FastAPI receiver
           |
           v
   LangGraph root-cause agent
           |
           +---- read-only MCP tools ----+
           |                             |
           v                             v
   K8s knowledge graph              telemetry slices
     (Neo4j / kuzu)              Prometheus, Loki, Tempo
   ownership + scheduling          last 15m, scoped
           |
           v
   hypothesis ranking (evidence weight)
           |
           v
   Slack brief + approval buttons
           |
           v (approved)
   ArgoCD rollback hook / PagerDuty escalate
           |
           v
   audit log: considered vs executed, every command
```

## Stack

- Nguồn khả năng quan sát: Prometheus, Loki, Tempo, kube-state-metrics
- Đồ thị tri thức: Neo4j (được quản lý) hoặc kuzu (nhúng) cho đối tượng K8s + cạnh đo từ xa
- Agent: LangGraph với danh sách cho phép theo công cụ, chỉ đọc mặc định
- Truyền tải công cụ: FastMCP qua StreamableHTTP; máy chủ riêng cho công cụ phá hủy sau cổng phê duyệt
- Mô hình: Claude Sonnet 4.7 cho suy luận nguyên nhân gốc, Gemini 2.5 Flash tóm tắt log
- Khắc phục: webhook hoàn tác ArgoCD, chuyển cấp PagerDuty, thẻ phê duyệt Slack
- Kiểm toán: log có cấu trúc chỉ nối thêm (cân nhắc, thực thi, phê duyệt, kết quả)
- Triển khai: deployment K8s có vai RBAC hẹp riêng; namespace riêng

```figure
ce-rootcause-walk
```

## Build It

1. **Thu nạp đồ thị.** Đồng bộ kube-state-metrics vào Neo4j/kuzu mỗi 30s. Nút: Pod, Deployment, Node, Service, PVC, HPA. Cạnh: OWNED_BY, SCHEDULED_ON, EXPOSES, MOUNTS, SCALES. Cạnh phủ đo từ xa: OBSERVED_BY (Pod được chuỗi Prometheus quan sát).

2. **Bộ nhận cảnh báo.** Endpoint FastAPI nhận webhook PagerDuty hoặc Alertmanager. Trích đối tượng ảnh hưởng và vi phạm SLO.

3. **Bề mặt công cụ chỉ đọc.** Bọc kubectl, truy vấn Prometheus, logql Loki, traceql Tempo qua FastMCP. Mọi công cụ có động từ RBAC hẹp ("get", "list", "describe"). Không "delete", "exec", "scale" trong máy chủ mặc định.

4. **Agent nguyên nhân gốc.** LangGraph ba nút: `sample` lấy lát đo từ xa 15 phút cuối, `walk` truy vấn đồ thị cho đối tượng lân cận, `hypothesize` soạn ứng viên nguyên nhân gốc xếp hạng có trích dẫn đo từ xa.

5. **Chấm bằng chứng.** Mỗi giả thuyết có score = recency * specificity * graph-path length inverse * citation count. Trả top-3.

6. **Bản tóm tắt Slack.** Đăng đính kèm có giả thuyết, trực quan đường đồ thị (ảnh đồ thị con render phía máy chủ) và nút phê duyệt tối đa một hành động khắc phục.

7. **Cổng khắc phục.** Công cụ phá hủy (giảm quy mô, hoàn tác, xóa) nằm trên máy chủ MCP thứ hai sau token phê duyệt. Agent chỉ gọi sau khi thẻ Slack được con người phê duyệt.

8. **Log kiểm toán.** JSONL chỉ nối thêm: với mọi lệnh ứng viên, ghi có cân nhắc không, có thực thi không, ai phê duyệt. Gửi S3 hằng ngày.

9. **Bộ sự cố tổng hợp.** Xây 20 kịch bản: chuỗi OOMKill, DNS chập chờn, HPA dao động mạnh, PVC đầy, hàng xóm gây nhiễu, sidecar lỗi, rollout ConfigMap xấu, luân chuyển chứng chỉ, backoff kéo image, v.v. Chấm agent theo độ chính xác nguyên nhân gốc và thời gian-đến-giả-thuyết.

## Use It

```
webhook: alert.pagerduty.com -> checkout-api SLO breach, error rate 14%
[graph]   affected: Deployment checkout-api (3 Pods, Node ip-10-2-3-4)
[walk]    neighbors: ReplicaSet checkout-api-abc, Service checkout-api,
           recent rollout 14m ago
[sample]  prometheus error_rate 14%, up-trend; loki 500s on /api/v2/pay
[hypo]    #1 bad rollout: latest image checkout-api:v2.41 fails /healthz
          citations: deploy.yaml (rev 42), prometheus errorRate, loki 500 stack
[slack]   [ROLL BACK to v2.40]  [ESCALATE]  [IGNORE]
          (approval required; agent does not roll back unilaterally)
```

## Ship It

`outputs/skill-devops-agent.md` là sản phẩm bàn giao. Với cụm K8s và nguồn cảnh báo, agent tạo giả thuyết nguyên nhân gốc xếp hạng và luồng khắc phục qua cổng Slack.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Độ chính xác RCA trên bộ kịch bản | ≥80% nguyên nhân gốc đúng trên 20 sự cố tổng hợp |
| 20 | An toàn | Chốt hành động phá hủy không bao giờ kích hoạt thiếu phê duyệt Slack trong log kiểm toán |
| 20 | Thời gian đến giả thuyết | p50 dưới 5 phút từ cảnh báo đến bản tóm tắt Slack |
| 20 | Khả năng giải thích | Mọi giả thuyết có đường đồ thị và trích dẫn đo từ xa |
| 15 | Đầy đủ tích hợp | PagerDuty, Slack, ArgoCD, Prometheus hoạt động đầu cuối |
| **100** | | |

## Exercises

1. Chạy agent trên cùng ba sự cố DevOps Agent AWS được demo. Công bố cạnh nhau. Báo cáo nơi agent khác.

2. Thêm kiểm toán "suýt xảy ra" đánh dấu mọi lệnh agent *cân nhắc* sẽ phá hủy nếu thiếu phê duyệt. Đo tỷ lệ suýt xảy ra trong một tuần.

3. Đổi mô hình giả thuyết từ Claude Sonnet 4.7 sang Llama 3.3 70B tự lưu trữ. Đo chênh lệch độ chính xác RCA và đô la mỗi sự cố.

4. Xây bộ lọc nhân quả: phân biệt đột biến đo từ xa tương quan với nguyên nhân gốc thực. Huấn luyện bộ phân loại nhỏ trên nhãn 20 kịch bản.

5. Thêm chạy thử hoàn tác: hoàn tác ArgoCD đối với cụm staging có cùng manifest. Xác minh kế hoạch hoàn tác trong cụm trực tiếp trước nút phê duyệt Slack.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| K8s knowledge graph (Đồ thị tri thức K8s) | "Đồ thị cụm" | Nút = đối tượng K8s + chuỗi đo từ xa; cạnh = sở hữu, lập lịch, quan sát |
| Read-only-by-default (Chỉ đọc mặc định) | "RBAC có phạm vi" | Tài khoản dịch vụ agent chỉ có động từ get/list/describe; động từ phá hủy ở máy chủ riêng sau phê duyệt |
| Audit log (Log kiểm toán) | "Cân nhắc so với thực thi" | Bản ghi chỉ nối thêm mọi lệnh ứng viên, có chạy không, ai phê duyệt |
| Hypothesis ranking (Xếp hạng giả thuyết) | "Điểm bằng chứng" | Độ mới × độ cụ thể × nghịch đảo độ dài đường đồ thị × số trích dẫn |
| Slack approval card (Thẻ phê duyệt Slack) | "Cổng HITL" | Tin nhắn Slack tương tác có nút khắc phục; agent không thể tiếp tục tới khi con người bấm |
| Telemetry citation (Trích dẫn đo từ xa) | "Con trỏ bằng chứng" | Truy vấn Prometheus, bộ chọn Loki hoặc URL dấu vết Tempo hỗ trợ khẳng định |
| MTTR | "Thời gian giải quyết" | Thời gian thực từ cảnh báo kích hoạt đến SLO khôi phục |

## Further Reading

- [AWS DevOps Agent GA](https://aws.amazon.com/blogs/mt/announcing-general-availability-of-aws-devops-agent/): tài liệu tham chiếu chuẩn năm 2026
- [Resolve AI K8s troubleshooting](https://resolve.ai/blog/kubernetes-troubleshooting-in-resolve-ai) — tham chiếu đối thủ
- [NeuBird semantic monitoring](https://www.neubird.ai) — cách tiếp cận đồ thị ngữ nghĩa
- [Metoro AI SRE](https://metoro.io) — cách nhìn sản xuất ưu tiên SLO
- [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics) — nguồn trạng thái cụm
- [LangGraph](https://langchain-ai.github.io/langgraph/) — bộ điều phối agent tham chiếu
- [FastMCP](https://github.com/jlowin/fastmcp) — framework máy chủ MCP Python
- [ArgoCD rollback](https://argo-cd.readthedocs.io/en/stable/user-guide/commands/argocd_app_rollback/) — mục tiêu khắc phục có cổng
