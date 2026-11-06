# Agent Rules

## startup/state-file-fresh
- category: startup
- check: state_file_fresh
Agent phải đọc agent_state.json trước bất kỳ lời gọi công cụ nào.

## forbidden/no-out-of-scope-writes
- category: forbidden
- check: no_out_of_scope_writes
Không bao giờ chỉnh sửa một file ngoài hợp đồng phạm vi của tác vụ hoạt động.

## done/tests-pass
- category: definition_of_done
- check: tests_pass
Một tác vụ chỉ hoàn thành khi mọi lệnh nghiệm thu thoát với mã không.

## uncertainty/open-question-note
- category: uncertainty
- check: opened_question_when_unsure
Khi độ tin cậy dưới ngưỡng, mở một ghi chú câu hỏi thay vì đoán.

## approval/new-dependency
- category: approval
- check: new_dependency_approved
Thêm một phụ thuộc runtime yêu cầu phê duyệt rõ ràng của con người.
