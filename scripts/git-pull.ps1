# ==============================================================================
# Klanvision Git Automation - Pull Workflow (PowerShell)
# Safe, non-destructive pull with local modification protection and user approval.
# ==============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir "git-common.ps1")

Show-Header "KLANVISION GIT AUTOMATION" "GIT PULL WORKFLOW"

# ------------------------------------------------------------------------------
# [1] Repository Check
# ------------------------------------------------------------------------------
Show-Step 1 "Repository & Environment Check"
Assert-GitPrerequisites -TargetDir $scriptDir

$context = Get-GitContext -TargetDir $scriptDir

Write-Host "Repository : $($context.RepoName)" -ForegroundColor White
Write-Host "Branch     : $($context.Branch)" -ForegroundColor White
Write-Host "Remote     : $($context.RemoteName)/$($context.Branch) ($($context.RemoteUrl))" -ForegroundColor White

# ------------------------------------------------------------------------------
# [2] Local Changes & Conflict Protection
# ------------------------------------------------------------------------------
Show-Step 2 "Local Modification & Safety Protection"
$status = Get-GitStatusSummary -RepoRoot $context.RepoRoot

if ($status.HasChanges) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "WARNING:" -ForegroundColor Yellow
    Write-Host "Local changes were detected." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The following files have local modifications:" -ForegroundColor Yellow
    foreach ($file in $status.ChangedFiles) {
        Write-Host "  $($file.Code) $($file.Path)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Pulling now may cause conflicts." -ForegroundColor Yellow
    Write-Host "Please review the changes before continuing." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "Safety notice: Automation will NEVER automatically discard your changes," -ForegroundColor DarkGray
    Write-Host "run 'git reset --hard', or overwrite uncommitted work." -ForegroundColor DarkGray
    Write-Host ""

    $proceedWithChanges = Prompt-UserApproval "Do you want to attempt pulling despite having local uncommitted changes?"
    if (-not $proceedWithChanges) {
        Write-Host ""
        Write-Host "Git pull operation cancelled to protect local uncommitted changes." -ForegroundColor Yellow
        Write-Host "Commit or stash your changes before pulling." -ForegroundColor Yellow
        Write-Host ""
        Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PULL" -Status "CANCELLED_UNCOMMITTED_CHANGES" -Details "Aborted to protect uncommitted changes"
        exit 0
    }
}

# ------------------------------------------------------------------------------
# [3] Pull Preview
# ------------------------------------------------------------------------------
Show-Step 3 "Pull Operation Preview"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       GIT PULL PREVIEW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository : $($context.RepoName)" -ForegroundColor White
Write-Host "Branch     : $($context.Branch)" -ForegroundColor White
Write-Host "Remote     : $($context.RemoteName)/$($context.Branch)" -ForegroundColor White
Write-Host ""
Write-Host "Operation:" -ForegroundColor Yellow
Write-Host "  Fetch latest changes" -ForegroundColor White
Write-Host "  ↓" -ForegroundColor DarkGray
Write-Host "  Check incoming commits" -ForegroundColor White
Write-Host "  ↓" -ForegroundColor DarkGray
Write-Host "  Pull changes" -ForegroundColor White
Write-Host ""

# ------------------------------------------------------------------------------
# [4] Mandatory User Approval
# ------------------------------------------------------------------------------
Show-Step 4 "Mandatory User Approval"
$approved = Prompt-UserApproval "Do you approve pulling the latest code from the centralized repository?"

if (-not $approved) {
    Write-Host ""
    Write-Host "Git pull operation cancelled by user." -ForegroundColor Yellow
    Write-Host "No changes were pulled." -ForegroundColor Yellow
    Write-Host ""
    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PULL" -Status "CANCELLED_BY_USER" -Details "User selected No or aborted"
    exit 0
}

# ------------------------------------------------------------------------------
# [5] Execute Pull
# ------------------------------------------------------------------------------
Show-Step 5 "Executing Git Pull"

try {
    Write-Host "Fetching and pulling from $($context.RemoteName) $($context.Branch)..." -ForegroundColor DarkGray
    
    # Execute git pull without discarding any state
    $pullOutput = git -C "$($context.RepoRoot)" pull "$($context.RemoteName)" "$($context.Branch)" 2>&1
    $pullExitCode = $LASTEXITCODE

    # Check for conflict or failure
    $outputString = $pullOutput -join "`n"
    Write-Host $outputString -ForegroundColor DarkGray

    if ($pullExitCode -ne 0 -or $outputString -match "(?i)CONFLICT|Automatic merge failed") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "       GIT PULL MERGE CONFLICT" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Git pull completed with conflicts." -ForegroundColor Red
        Write-Host ""
        Write-Host "The automation will NOT automatically resolve conflicts." -ForegroundColor Yellow
        Write-Host "Please resolve the conflicts manually and run the Git automation again." -ForegroundColor Yellow
        Write-Host ""
        Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PULL" -Status "CONFLICT" -ErrorDetails "Merge conflict detected during pull"
        exit 1
    }

    # --------------------------------------------------------------------------
    # [6] Final Status
    # --------------------------------------------------------------------------
    Show-Step 6 "Final Status"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       GIT PULL COMPLETED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  [OK] Latest code pulled successfully" -ForegroundColor Green
    Write-Host "  [OK] Working tree synchronized" -ForegroundColor Green
    Write-Host ""

    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PULL" -Status "SUCCESS" -Details "Pull completed successfully"

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "          GIT PULL FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Suggested Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Check your network connectivity and remote URL." -ForegroundColor White
    Write-Host "  2. Check repository authentication." -ForegroundColor White
    Write-Host "  3. No automatic destructive rollback was performed." -ForegroundColor White
    Write-Host ""

    Write-AutomationLog -RepoRoot $context.RepoRoot -RepoName $context.RepoName -Branch $context.Branch -Operation "PULL" -Status "FAILED" -ErrorDetails "$($_.Exception.Message)"
    exit 1
}
