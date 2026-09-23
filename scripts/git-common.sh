#!/usr/bin/env bash
# ==============================================================================
# Klanvision Git Automation - Common Utilities (Bash)
# Reusable across Frontend and Backend repositories.
# ==============================================================================

# ANSI Colors
CLR_RESET="\033[0m"
CLR_RED="\033[0;31m"
CLR_GREEN="\033[0;32m"
CLR_YELLOW="\033[1;33m"
CLR_CYAN="\033[0;36m"
CLR_GRAY="\033[0;90m"
CLR_WHITE="\033[1;37m"

show_header() {
    local title="$1"
    local subtitle="${2:-}"
    echo ""
    echo -e "${CLR_CYAN}========================================${CLR_RESET}"
    echo -e "${CLR_CYAN}        ${title}${CLR_RESET}"
    if [ -n "$subtitle" ]; then
        echo -e "${CLR_CYAN}        ${subtitle}${CLR_RESET}"
    fi
    echo -e "${CLR_CYAN}========================================${CLR_RESET}"
    echo ""
}

show_step() {
    local step_num="$1"
    local step_title="$2"
    echo ""
    echo -e "${CLR_YELLOW}[${step_num}] ${step_title}${CLR_RESET}"
    echo -e "${CLR_GRAY}----------------------------------------${CLR_RESET}"
}

assert_git_prerequisites() {
    local target_dir="${1:-$(pwd)}"

    if ! command -v git &>/dev/null; then
        echo -e "${CLR_RED}ERROR: Git is not installed or not available in the system PATH.${CLR_RESET}"
        exit 1
    fi

    if ! git -C "$target_dir" rev-parse --is-inside-work-tree &>/dev/null; then
        echo -e "${CLR_RED}ERROR: The current directory is not a valid Git repository:${CLR_RESET}"
        echo -e "${CLR_RED}       ${target_dir}${CLR_RESET}"
        exit 1
    fi
}

get_git_context() {
    local target_dir="${1:-$(pwd)}"
    
    REPO_ROOT=$(git -C "$target_dir" rev-parse --show-toplevel)
    REPO_NAME=$(basename "$REPO_ROOT")

    BRANCH=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || true)
    if [ -z "$BRANCH" ]; then
        HEAD_REV=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
        echo -e "${CLR_RED}ERROR: Detached HEAD state detected (at commit: ${HEAD_REV}).${CLR_RESET}"
        echo -e "${CLR_RED}Automation refuses to operate on a detached HEAD.${CLR_RESET}"
        exit 1
    fi

    REMOTES=$(git -C "$REPO_ROOT" remote)
    if [ -z "$REMOTES" ]; then
        echo -e "${CLR_RED}ERROR: No Git remote repository is configured.${CLR_RESET}"
        echo -e "${CLR_RED}Please configure the remote repository before using Git Push/Pull Automation.${CLR_RESET}"
        exit 1
    fi

    REMOTE_NAME="origin"
    if ! echo "$REMOTES" | grep -q "^origin$"; then
        REMOTE_NAME=$(echo "$REMOTES" | head -n 1)
    fi

    REMOTE_URL=$(git -C "$REPO_ROOT" remote get-url "$REMOTE_NAME" 2>/dev/null || echo "")
}

check_node_modules_protection() {
    local repo_root="$1"
    local gitignore="${repo_root}/.gitignore"

    if [ -f "$gitignore" ]; then
        if ! grep -q -E "^[[:space:]]*node_modules/?" "$gitignore"; then
            echo -e "${CLR_YELLOW}NOTICE: Adding 'node_modules/' rule to .gitignore...${CLR_RESET}"
            echo -e "\nnode_modules/" >> "$gitignore"
        fi
    else
        echo -e "${CLR_YELLOW}NOTICE: Creating .gitignore with 'node_modules/' rule...${CLR_RESET}"
        echo "node_modules/" > "$gitignore"
    fi

    local tracked
    tracked=$(git -C "$repo_root" ls-files node_modules 2>/dev/null || true)
    if [ -n "$tracked" ]; then
        echo ""
        echo -e "${CLR_YELLOW}========================================${CLR_RESET}"
        echo -e "${CLR_YELLOW}WARNING:${CLR_RESET}"
        echo -e "${CLR_YELLOW}node_modules is currently tracked by Git.${CLR_RESET}"
        echo ""
        echo -e "${CLR_YELLOW}Please review the repository before removing tracked node_modules files.${CLR_RESET}"
        echo -e "${CLR_YELLOW}No automatic destructive operation will be performed.${CLR_RESET}"
        echo -e "${CLR_YELLOW}========================================${CLR_RESET}"
        echo ""
    fi
}

generate_commit_message() {
    local changed_files="$1"

    if [ -z "$changed_files" ]; then
        echo "chore: general updates"
        return
    fi

    # Check file patterns
    local script_count=0
    local doc_count=0
    local config_count=0
    local test_count=0
    local total_count=0
    local has_ui=0
    local has_backend=0

    while IFS= read -r file; do
        [ -z "$file" ] && continue
        total_count=$((total_count + 1))
        [[ "$file" =~ (scripts/|\.ps1$|\.sh$) ]] && script_count=$((script_count + 1))
        [[ "$file" =~ (\.md$|docs/|LICENSE) ]] && doc_count=$((doc_count + 1))
        [[ "$file" =~ (\.json$|\.env|\.gitignore|\.ya?ml$) ]] && config_count=$((config_count + 1))
        [[ "$file" =~ (\.test\.|\.spec\.|test/) ]] && test_count=$((test_count + 1))
        [[ "$file" =~ (components/|pages/|views/|src/.*\.(jsx?|tsx?|vue|svelte|html)) ]] && has_ui=1
        [[ "$file" =~ (controllers/|routes/|services/|models/|middleware/|api/) ]] && has_backend=1
    done <<< "$changed_files"

    if [ "$script_count" -gt 0 ] && [ $((script_count + config_count)) -eq "$total_count" ]; then
        echo "feat: implement reusable git push and pull automation scripts"
    elif [ "$doc_count" -eq "$total_count" ]; then
        echo "docs: update project documentation and readme"
    elif [ "$config_count" -eq "$total_count" ]; then
        echo "chore: update project configuration and ignore rules"
    elif [ "$test_count" -eq "$total_count" ]; then
        echo "test: add automated test coverage and suites"
    elif [ "$has_backend" -eq 1 ]; then
        echo "feat: implement backend API services and business logic"
    elif [ "$has_ui" -eq 1 ]; then
        echo "feat: enhance frontend user interface and components"
    else
        local first_file
        first_file=$(echo "$changed_files" | head -n 1 | awk '{print $NF}')
        local base_name
        base_name=$(basename "$first_file")
        echo "feat: update ${base_name} and related project modules"
    fi
}

confirm_action() {
    local question="$1"
    echo ""
    echo -e "${CLR_YELLOW}${question}${CLR_RESET}"
    echo ""
    echo -e "  ${CLR_GREEN}[Y] Yes - Continue${CLR_RESET}"
    echo -e "  ${CLR_RED}[N] No  - Cancel${CLR_RESET}"
    echo ""

    read -r -p "Enter choice [Y/N]: " choice
    case "$choice" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

write_automation_log() {
    local repo_root="$1"
    local repo_name="$2"
    local branch="$3"
    local op="$4"
    local commit_msg="${5:-N/A}"
    local status="$6"
    local details="${7:-None}"

    local log_dir="${repo_root}/logs"
    mkdir -p "$log_dir"
    local log_file="${log_dir}/git-automation.log"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    # Sanitize tokens and keys
    local sanitized_details
    sanitized_details=$(echo "$details" | sed -E 's/(ghp_[a-zA-Z0-9]{20,}|password=[^ ]+|token=[^ ]+)/[REDACTED]/g')

    echo "[$timestamp] [REPO: $repo_name] [BRANCH: $branch] [OP: $op] [STATUS: $status] [COMMIT: $commit_msg] [DETAILS: $sanitized_details]" >> "$log_file"
}
