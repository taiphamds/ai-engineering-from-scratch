# Agent Rules

## startup/state-file-fresh
- category: startup
- check: state_file_fresh
Agent phải đọc agent_state.json trước bất kỳ lời gọi công cụ nào.

## forbidden/no-release-script-edits
- category: forbidden
- check: no_release_script_edits
Không bao giờ chỉnh sửa scripts/release.sh ngoài một tác vụ phát hành đã được phê duyệt.

## done/tests-pass
- category: definition_of_done
- check: tests_pass
Một tác vụ chỉ hoàn thành khi lệnh nghiệm thu của nó thoát với mã không.

## uncertainty/open-question-note
- category: uncertainty
- check: opened_question_when_unsure
Khi độ tin cậy dưới ngưỡng, ghi một ghi chú câu hỏi thay vì đoán.

## approval/new-dependency
- category: approval
- check: new_dependency_approved
Thêm một phụ thuộc runtime yêu cầu phê duyệt rõ ràng của con người.
