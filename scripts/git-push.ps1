# ==============================================================================
# Klanvision Git Automation - Push Workflow (PowerShell)
# Safe, interactive commit & push with mandatory user confirmation.
# ==============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir "git-common.ps1")

Show-Header "KLANVISION GIT AUTOMATION" "GIT PUSH WORKFLOW"

# ------------------------------------------------------------------------------
# [1] Repository Check
# ------------------------------------------------------------------------------
Show-Step 1 "Repository & Environment Check"
Assert-GitPrerequisites -TargetDir $scriptDir

$context = Get-GitContext -TargetDir $scriptDir

Write-Host "Repository : $($context.RepoName)" -ForegroundColor White
Write-Host "Branch     : $($context.Branch)" -ForegroundColor White
Write-Host "Remote     : $($context.RemoteName) ($($context.RemoteUrl))" -ForegroundColor White

# ------------------------------------------------------------------------------
# [2] Change Detection
# ------------------------------------------------------------------------------
Show-Step 2 "Change Detection & Analysis"
$status = Get-GitStatusSummary -RepoRoot $context.RepoRoot

if (-not $status.HasChanges) {
    Write-Host ""
    Write-Host "No changes detected in working tree. Working tree is clean." -ForegroundColor Green
    Write-Host "Nothing to commit or push." -ForegroundColor Green
    Write-Host ""
    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PUSH" -Status "SKIPPED" -Details "Clean working tree"
    exit 0
}

Write-Host ""
Write-Host "Changed Files:" -ForegroundColor Yellow
foreach ($file in $status.ChangedFiles) {
    $color = "White"
    if ($file.Code -match 'M') { $color = "Cyan" }
    elseif ($file.Code -match '\?\?') { $color = "Magenta" }
    elseif ($file.Code -match 'D') { $color = "Red" }
    elseif ($file.Code -match 'A') { $color = "Green" }
    Write-Host "  $($file.Code) $($file.Path)" -ForegroundColor $color
}
Write-Host ""

# ------------------------------------------------------------------------------
# [3] Node Modules Protection
# ------------------------------------------------------------------------------
Show-Step 3 "Node Modules & Dependency Protection"
Test-NodeModulesProtection -RepoRoot $context.RepoRoot

# ------------------------------------------------------------------------------
# [4] Commit Message Generation
# ------------------------------------------------------------------------------
Show-Step 4 "Commit Message Generation"
$generatedMessage = Generate-MeaningfulCommitMessage -RepoRoot $context.RepoRoot -ChangedFiles $status.ChangedFiles

Write-Host "Generated Commit Message:" -ForegroundColor Cyan
Write-Host "  $generatedMessage" -ForegroundColor Green
Write-Host ""

# Allow user to accept or customize the generated commit message
$userCustomMsg = Read-Host "Press [Enter] to use this message, or type a custom commit message"
$finalCommitMessage = $generatedMessage
if ($userCustomMsg -and $userCustomMsg.Trim() -ne "") {
    $finalCommitMessage = $userCustomMsg.Trim()
}

# ------------------------------------------------------------------------------
# [5] Preview & Verification
# ------------------------------------------------------------------------------
Show-Step 5 "Commit & Push Preview"
Write-Host "Target Repository : $($context.RepoName)" -ForegroundColor White
Write-Host "Target Branch     : $($context.Branch)" -ForegroundColor White
Write-Host "Target Remote     : $($context.RemoteName)" -ForegroundColor White
Write-Host "Final Commit Msg  : $finalCommitMessage" -ForegroundColor Green
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor White
foreach ($file in $status.ChangedFiles) {
    Write-Host "  $($file.Path)" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# [6] Mandatory User Approval
# ------------------------------------------------------------------------------
Show-Step 6 "Mandatory User Approval"
$approved = Prompt-UserApproval "Do you approve this Git commit and push operation?"

if (-not $approved) {
    Write-Host ""
    Write-Host "Git push operation cancelled by user." -ForegroundColor Yellow
    Write-Host "No changes were pushed." -ForegroundColor Yellow
    Write-Host ""
    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PUSH" -CommitMessage $finalCommitMessage -Status "CANCELLED_BY_USER" -Details "User selected No or aborted"
    exit 0
}

# ------------------------------------------------------------------------------
# [7] Git Operation Execution
# ------------------------------------------------------------------------------
Show-Step 7 "Executing Git Staging, Commit & Push"

try {
    # 1. Stage changes
    Write-Host "Staging files..." -ForegroundColor DarkGray
    git -C "$($context.RepoRoot)" add .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to stage changes with 'git add .'"
    }

    # Verify node_modules is not accidentally staged
    $stagedNodeModules = git -C "$($context.RepoRoot)" diff --cached --name-only | Where-Object { $_ -match '^node_modules/' }
    if ($stagedNodeModules) {
        Write-Host "CRITICAL ERROR: node_modules files detected in staging area! Unstaging..." -ForegroundColor Red
        git -C "$($context.RepoRoot)" reset HEAD node_modules/ 2>$null
        throw "Aborting commit because node_modules was detected in staging area."
    }

    # 2. Create commit
    Write-Host "Creating commit..." -ForegroundColor DarkGray
    git -C "$($context.RepoRoot)" commit -m "$finalCommitMessage"
    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed. Check working tree state."
    }

    $commitHash = (git -C "$($context.RepoRoot)" rev-parse --short HEAD).Trim()
    Write-Host "Created commit: $commitHash" -ForegroundColor Green

    # 3. Push to configured remote
    Write-Host "Pushing to $($context.RemoteName) $($context.Branch)..." -ForegroundColor DarkGray
    git -C "$($context.RepoRoot)" push "$($context.RemoteName)" "$($context.Branch)"
    if ($LASTEXITCODE -ne 0) {
        throw "Git push failed. Please check network connection, authentication, or remote permissions."
    }

    # --------------------------------------------------------------------------
    # [8] Final Status
    # --------------------------------------------------------------------------
    Show-Step 8 "Final Status"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       GIT PUSH COMPLETED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Commit:" -ForegroundColor White
    Write-Host "$finalCommitMessage ($commitHash)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Branch:" -ForegroundColor White
    Write-Host "$($context.Branch)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Remote:" -ForegroundColor White
    Write-Host "$($context.RemoteName) ($($context.RemoteUrl))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Status:" -ForegroundColor White
    Write-Host "  [OK] Changes staged" -ForegroundColor Green
    Write-Host "  [OK] Commit created" -ForegroundColor Green
    Write-Host "  [OK] Push completed successfully" -ForegroundColor Green
    Write-Host ""

    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PUSH" -CommitMessage "$finalCommitMessage ($commitHash)" -Status "SUCCESS" -Details "Push completed successfully"

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "          GIT PUSH FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Suggested Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Check remote authentication and credentials." -ForegroundColor White
    Write-Host "  2. Run 'git status' to inspect current repository state." -ForegroundColor White
    Write-Host "  3. No automatic destructive rollback was performed." -ForegroundColor White
    Write-Host ""

    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PUSH" -CommitMessage $finalCommitMessage -Status "FAILED" -ErrorDetails "$($_.Exception.Message)"
    exit 1
}
