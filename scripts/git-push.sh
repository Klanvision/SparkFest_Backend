#!/usr/bin/env bash
# ==============================================================================
# Klanvision Git Automation - Push Workflow (Bash)
# Safe, interactive commit & push with mandatory user confirmation.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=git-common.sh
source "${SCRIPT_DIR}/git-common.sh"

show_header "KLANVISION GIT AUTOMATION" "GIT PUSH WORKFLOW"

# [1] Repository Check
show_step 1 "Repository & Environment Check"
assert_git_prerequisites "$SCRIPT_DIR"
get_git_context "$SCRIPT_DIR"

echo -e "Repository : ${CLR_WHITE}${REPO_NAME}${CLR_RESET}"
echo -e "Branch     : ${CLR_WHITE}${BRANCH}${CLR_RESET}"
echo -e "Remote     : ${CLR_WHITE}${REMOTE_NAME} (${REMOTE_URL})${CLR_RESET}"

# [2] Change Detection
show_step 2 "Change Detection & Analysis"
RAW_STATUS=$(git -C "$REPO_ROOT" status --porcelain=v1 -uall)

if [ -z "$RAW_STATUS" ]; then
    echo ""
    echo -e "${CLR_GREEN}No changes detected in working tree. Working tree is clean.${CLR_RESET}"
    echo -e "${CLR_GREEN}Nothing to commit or push.${CLR_RESET}"
    echo ""
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PUSH" "N/A" "SKIPPED" "Clean working tree"
    exit 0
fi

echo ""
echo -e "${CLR_YELLOW}Changed Files:${CLR_RESET}"
echo "$RAW_STATUS" | while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo -e "  ${CLR_WHITE}${line}${CLR_RESET}"
done
echo ""

# [3] Node Modules Protection
show_step 3 "Node Modules & Dependency Protection"
check_node_modules_protection "$REPO_ROOT"

# [4] Commit Message Generation
show_step 4 "Commit Message Generation"
CHANGED_PATHS=$(echo "$RAW_STATUS" | awk '{print $NF}')
GENERATED_MSG=$(generate_commit_message "$CHANGED_PATHS")

echo -e "Generated Commit Message:"
echo -e "  ${CLR_GREEN}${GENERATED_MSG}${CLR_RESET}"
echo ""

read -r -p "Press [Enter] to use this message, or type a custom commit message: " USER_MSG
FINAL_COMMIT_MSG="$GENERATED_MSG"
if [ -n "${USER_MSG:-}" ]; then
    FINAL_COMMIT_MSG="$USER_MSG"
fi

# [5] Preview & Verification
show_step 5 "Commit & Push Preview"
echo -e "Target Repository : ${CLR_WHITE}${REPO_NAME}${CLR_RESET}"
echo -e "Target Branch     : ${CLR_WHITE}${BRANCH}${CLR_RESET}"
echo -e "Target Remote     : ${CLR_WHITE}${REMOTE_NAME}${CLR_RESET}"
echo -e "Final Commit Msg  : ${CLR_GREEN}${FINAL_COMMIT_MSG}${CLR_RESET}"
echo ""
echo "Files to be committed:"
echo "$CHANGED_PATHS" | while IFS= read -r f; do
    [ -n "$f" ] && echo -e "  ${CLR_GRAY}${f}${CLR_RESET}"
done

# [6] Mandatory User Approval
show_step 6 "Mandatory User Approval"
if ! confirm_action "Do you approve this Git commit and push operation?"; then
    echo ""
    echo -e "${CLR_YELLOW}Git push operation cancelled by user.${CLR_RESET}"
    echo -e "${CLR_YELLOW}No changes were pushed.${CLR_RESET}"
    echo ""
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PUSH" "$FINAL_COMMIT_MSG" "CANCELLED_BY_USER" "User selected No"
    exit 0
fi

# [7] Git Operation Execution
show_step 7 "Executing Git Staging, Commit & Push"

echo "Staging files..."
git -C "$REPO_ROOT" add .

# Verify node_modules is not staged
if git -C "$REPO_ROOT" diff --cached --name-only | grep -q "^node_modules/"; then
    echo -e "${CLR_RED}CRITICAL ERROR: node_modules detected in staging area! Unstaging...${CLR_RESET}"
    git -C "$REPO_ROOT" reset HEAD node_modules/ 2>/dev/null || true
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PUSH" "$FINAL_COMMIT_MSG" "ABORTED" "node_modules detected in staging"
    exit 1
fi

echo "Creating commit..."
git -C "$REPO_ROOT" commit -m "$FINAL_COMMIT_MSG"
COMMIT_HASH=$(git -C "$REPO_ROOT" rev-parse --short HEAD)
echo -e "${CLR_GREEN}Created commit: ${COMMIT_HASH}${CLR_RESET}"

echo "Pushing to ${REMOTE_NAME} ${BRANCH}..."
if git -C "$REPO_ROOT" push "$REMOTE_NAME" "$BRANCH"; then
    # [8] Final Status
    show_step 8 "Final Status"
    echo ""
    echo -e "${CLR_GREEN}========================================${CLR_RESET}"
    echo -e "${CLR_GREEN}       GIT PUSH COMPLETED${CLR_RESET}"
    echo -e "${CLR_GREEN}========================================${CLR_RESET}"
    echo ""
    echo -e "Commit: ${CLR_CYAN}${FINAL_COMMIT_MSG} (${COMMIT_HASH})${CLR_RESET}"
    echo -e "Branch: ${CLR_CYAN}${BRANCH}${CLR_RESET}"
    echo -e "Remote: ${CLR_CYAN}${REMOTE_NAME} (${REMOTE_URL})${CLR_RESET}"
    echo ""
    echo -e "Status:"
    echo -e "${CLR_GREEN}✓ Changes staged${CLR_RESET}"
    echo -e "${CLR_GREEN}✓ Commit created${CLR_RESET}"
    echo -e "${CLR_GREEN}✓ Push completed successfully${CLR_RESET}"
    echo ""
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PUSH" "$FINAL_COMMIT_MSG ($COMMIT_HASH)" "SUCCESS" "Push completed successfully"
else
    echo ""
    echo -e "${CLR_RED}========================================${CLR_RESET}"
    echo -e "${CLR_RED}          GIT PUSH FAILED${CLR_RESET}"
    echo -e "${CLR_RED}========================================${CLR_RESET}"
    echo ""
    echo -e "${CLR_RED}Push rejected or failed.${CLR_RESET}"
    echo -e "${CLR_YELLOW}Suggested Next Steps:${CLR_RESET}"
    echo "  1. Check remote authentication and credentials."
    echo "  2. Run 'git status' to inspect current repository state."
    echo "  3. No automatic destructive rollback was performed."
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PUSH" "$FINAL_COMMIT_MSG" "FAILED" "Push command returned non-zero"
    exit 1
fi
