#!/usr/bin/env bash
# ==============================================================================
# Klanvision Git Automation - Pull Workflow (Bash)
# Safe, non-destructive pull with local modification protection and user approval.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=git-common.sh
source "${SCRIPT_DIR}/git-common.sh"

show_header "KLANVISION GIT AUTOMATION" "GIT PULL WORKFLOW"

# [1] Repository Check
show_step 1 "Repository & Environment Check"
assert_git_prerequisites "$SCRIPT_DIR"
get_git_context "$SCRIPT_DIR"

echo -e "Repository : ${CLR_WHITE}${REPO_NAME}${CLR_RESET}"
echo -e "Branch     : ${CLR_WHITE}${BRANCH}${CLR_RESET}"
echo -e "Remote     : ${CLR_WHITE}${REMOTE_NAME}/${BRANCH} (${REMOTE_URL})${CLR_RESET}"

# [2] Local Changes Protection
show_step 2 "Local Modification & Safety Protection"
RAW_STATUS=$(git -C "$REPO_ROOT" status --porcelain=v1 -uall)

if [ -n "$RAW_STATUS" ]; then
    echo ""
    echo -e "${CLR_YELLOW}========================================${CLR_RESET}"
    echo -e "${CLR_YELLOW}WARNING:${CLR_RESET}"
    echo -e "${CLR_YELLOW}Local changes were detected.${CLR_RESET}"
    echo ""
    echo -e "${CLR_YELLOW}The following files have local modifications:${CLR_RESET}"
    echo "$RAW_STATUS" | while IFS= read -r line; do
        [ -n "$line" ] && echo -e "  ${CLR_WHITE}${line}${CLR_RESET}"
    done
    echo ""
    echo -e "${CLR_YELLOW}Pulling now may cause conflicts.${CLR_RESET}"
    echo -e "${CLR_YELLOW}Please review the changes before continuing.${CLR_RESET}"
    echo -e "${CLR_YELLOW}========================================${CLR_RESET}"
    echo ""
    echo -e "${CLR_GRAY}Safety notice: Automation will NEVER automatically discard your changes,${CLR_RESET}"
    echo -e "${CLR_GRAY}run 'git reset --hard', or overwrite uncommitted work.${CLR_RESET}"
    echo ""

    if ! confirm_action "Do you want to attempt pulling despite having local uncommitted changes?"; then
        echo ""
        echo -e "${CLR_YELLOW}Git pull operation cancelled to protect local uncommitted changes.${CLR_RESET}"
        echo -e "${CLR_YELLOW}Commit or stash your changes before pulling.${CLR_RESET}"
        echo ""
        write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PULL" "N/A" "CANCELLED_UNCOMMITTED_CHANGES" "Aborted to protect changes"
        exit 0
    fi
fi

# [3] Pull Preview
show_step 3 "Pull Operation Preview"
echo ""
echo -e "${CLR_CYAN}========================================${CLR_RESET}"
echo -e "${CLR_CYAN}       GIT PULL PREVIEW${CLR_RESET}"
echo -e "${CLR_CYAN}========================================${CLR_RESET}"
echo ""
echo -e "Repository : ${CLR_WHITE}${REPO_NAME}${CLR_RESET}"
echo -e "Branch     : ${CLR_WHITE}${BRANCH}${CLR_RESET}"
echo -e "Remote     : ${CLR_WHITE}${REMOTE_NAME}/${BRANCH}${CLR_RESET}"
echo ""
echo -e "${CLR_YELLOW}Operation:${CLR_RESET}"
echo -e "  Fetch latest changes"
echo -e "  ${CLR_GRAY}↓${CLR_RESET}"
echo -e "  Check incoming commits"
echo -e "  ${CLR_GRAY}↓${CLR_RESET}"
echo -e "  Pull changes"
echo ""

# [4] Mandatory User Approval
show_step 4 "Mandatory User Approval"
if ! confirm_action "Do you approve pulling the latest code from the centralized repository?"; then
    echo ""
    echo -e "${CLR_YELLOW}Git pull operation cancelled by user.${CLR_RESET}"
    echo -e "${CLR_YELLOW}No changes were pulled.${CLR_RESET}"
    echo ""
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PULL" "N/A" "CANCELLED_BY_USER" "User selected No"
    exit 0
fi

# [5] Execute Pull
show_step 5 "Executing Git Pull"
echo "Fetching and pulling from ${REMOTE_NAME} ${BRANCH}..."

set +e
PULL_OUTPUT=$(git -C "$REPO_ROOT" pull "$REMOTE_NAME" "$BRANCH" 2>&1)
PULL_STATUS=$?
set -e

echo "$PULL_OUTPUT"

if [ $PULL_STATUS -ne 0 ] || echo "$PULL_OUTPUT" | grep -qiE "conflict|automatic merge failed"; then
    echo ""
    echo -e "${CLR_RED}========================================${CLR_RESET}"
    echo -e "${CLR_RED}       GIT PULL MERGE CONFLICT${CLR_RESET}"
    echo -e "${CLR_RED}========================================${CLR_RESET}"
    echo ""
    echo -e "${CLR_RED}Git pull completed with conflicts.${CLR_RESET}"
    echo ""
    echo -e "${CLR_YELLOW}The automation will NOT automatically resolve conflicts.${CLR_RESET}"
    echo -e "${CLR_YELLOW}Please resolve the conflicts manually and run the Git automation again.${CLR_RESET}"
    echo ""
    write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PULL" "N/A" "CONFLICT" "Merge conflict detected"
    exit 1
fi

# [6] Final Status
show_step 6 "Final Status"
echo ""
echo -e "${CLR_GREEN}========================================${CLR_RESET}"
echo -e "${CLR_GREEN}       GIT PULL COMPLETED${CLR_RESET}"
echo -e "${CLR_GREEN}========================================${CLR_RESET}"
echo ""
echo -e "${CLR_GREEN}✓ Latest code pulled successfully${CLR_RESET}"
echo -e "${CLR_GREEN}✓ Working tree synchronized${CLR_RESET}"
echo ""

write_automation_log "$REPO_ROOT" "$REPO_NAME" "$BRANCH" "PULL" "N/A" "SUCCESS" "Pull completed successfully"
