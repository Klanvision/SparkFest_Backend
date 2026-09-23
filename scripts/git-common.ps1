# ==============================================================================
# Klanvision Git Automation - Common Utilities (PowerShell)
# Reusable across Frontend and Backend repositories.
# ==============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Header {
    param (
        [string]$Title,
        [string]$SubTitle = ""
    )
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "        $Title" -ForegroundColor Cyan
    if ($SubTitle) {
        Write-Host "        $SubTitle" -ForegroundColor DarkCyan
    }
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Step {
    param (
        [int]$StepNumber,
        [string]$StepTitle
    )
    Write-Host ""
    Write-Host "[$StepNumber] $StepTitle" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
}

function Assert-GitPrerequisites {
    param (
        [string]$TargetDir = (Get-Location).Path
    )
    
    # 1. Check if git is installed
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if (-not $gitCmd) {
        Write-Host "ERROR: Git is not installed or not available in the system PATH." -ForegroundColor Red
        Write-Host "Please install Git and try again." -ForegroundColor Red
        exit 1
    }

    # 2. Check if inside a Git repository
    $isWorkTree = git -C "$TargetDir" rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0 -or $isWorkTree -ne "true") {
        Write-Host "ERROR: The current directory is not a valid Git repository:" -ForegroundColor Red
        Write-Host "       $TargetDir" -ForegroundColor Red
        Write-Host "Please run this script from inside a valid Git repository." -ForegroundColor Red
        exit 1
    }
}

function Get-GitContext {
    param (
        [string]$TargetDir = (Get-Location).Path
    )

    $repoRoot = (git -C "$TargetDir" rev-parse --show-toplevel).Trim()
    $repoName = Split-Path $repoRoot -Leaf

    # Detect current branch
    $branch = (git -C "$repoRoot" branch --show-current).Trim()
    if (-not $branch) {
        $headRev = (git -C "$repoRoot" rev-parse --short HEAD 2>$null).Trim()
        Write-Host "ERROR: Detached HEAD state detected (at commit: $headRev)." -ForegroundColor Red
        Write-Host "The automation refuses to operate on a detached HEAD to protect repository integrity." -ForegroundColor Red
        Write-Host "Please checkout or create a named branch before proceeding." -ForegroundColor Red
        exit 1
    }

    # Detect configured remotes
    $remotes = (git -C "$repoRoot" remote)
    if (-not $remotes) {
        Write-Host "ERROR:" -ForegroundColor Red
        Write-Host "No Git remote repository is configured." -ForegroundColor Red
        Write-Host ""
        Write-Host "Please configure the remote repository before using Git Push/Pull Automation." -ForegroundColor Red
        Write-Host "Example: git remote add origin <repository-url>" -ForegroundColor DarkGray
        exit 1
    }

    $remoteName = "origin"
    if (-not ($remotes -contains "origin")) {
        $remoteName = ($remotes -split "`r?`n")[0].Trim()
    }

    $remoteUrl = (git -C "$repoRoot" remote get-url $remoteName 2>$null).Trim()
    if (-not $remoteUrl) {
        Write-Host "ERROR: Could not retrieve URL for remote '$remoteName'." -ForegroundColor Red
        exit 1
    }

    return [PSCustomObject]@{
        RepoRoot   = $repoRoot
        RepoName   = $repoName
        Branch     = $branch
        RemoteName = $remoteName
        RemoteUrl  = $remoteUrl
    }
}

function Test-NodeModulesProtection {
    param (
        [string]$RepoRoot
    )
    
    # 1. Verify node_modules is in .gitignore
    $gitignorePath = Join-Path $RepoRoot ".gitignore"
    if (Test-Path $gitignorePath) {
        $content = Get-Content $gitignorePath -Raw
        if ($content -notmatch '(?m)^\s*node_modules/?\s*$') {
            Write-Host "NOTICE: Adding 'node_modules/' rule to .gitignore..." -ForegroundColor DarkYellow
            Add-Content -Path $gitignorePath -Value "`nnode_modules/"
        }
    } else {
        Write-Host "NOTICE: Creating .gitignore with 'node_modules/' rule..." -ForegroundColor DarkYellow
        Set-Content -Path $gitignorePath -Value "node_modules/`n"
    }

    # 2. Check if node_modules is tracked in git
    $trackedNodeModules = git -C "$RepoRoot" ls-files node_modules 2>$null
    if ($trackedNodeModules) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "WARNING:" -ForegroundColor Yellow
        Write-Host "node_modules is currently tracked by Git." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please review the repository before removing tracked node_modules files." -ForegroundColor Yellow
        Write-Host "No automatic destructive operation will be performed." -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
    }
}

function Get-GitStatusSummary {
    param (
        [string]$RepoRoot
    )

    $statusOutput = git -C "$RepoRoot" status --porcelain=v1 -uall
    $changedFiles = @()

    if ($statusOutput) {
        $lines = @($statusOutput -split "`r?`n" | Where-Object { $_.Trim() -ne "" })
        foreach ($line in $lines) {
            if ($line.Length -ge 3) {
                $code = $line.Substring(0, 2)
                $path = $line.Substring(3).Trim()
                $changedFiles += [PSCustomObject]@{
                    Code = $code
                    Path = $path
                    Raw  = $line
                }
            }
        }
    }

    return [PSCustomObject]@{
        HasChanges   = ($changedFiles.Count -gt 0)
        ChangedFiles = $changedFiles
        RawOutput    = $statusOutput
    }
}

function Generate-MeaningfulCommitMessage {
    param (
        [string]$RepoRoot,
        [array]$ChangedFiles
    )

    if (-not $ChangedFiles -or $ChangedFiles.Count -eq 0) {
        return "chore: general updates"
    }

    $filePaths = @($ChangedFiles | ForEach-Object { $_.Path })

    # Pattern Matchers
    $scriptFiles  = @($filePaths | Where-Object { $_ -match 'scripts/' -or $_ -match '\.(ps1|sh|bat)$' })
    $docFiles     = @($filePaths | Where-Object { $_ -match '\.md$' -or $_ -match 'docs/' -or $_ -match 'LICENSE' })
    $configFiles  = @($filePaths | Where-Object { $_ -match '\.(json|config\.|env|gitignore|ya?ml)$' })
    $styleFiles   = @($filePaths | Where-Object { $_ -match '\.(css|scss|sass|less)$' })
    $testFiles    = @($filePaths | Where-Object { $_ -match '(\.test\.|\.spec\.|/test/|/__tests__/)' })
    $uiFiles      = @($filePaths | Where-Object { $_ -match '(components/|pages/|views/|src/.*\.(jsx?|tsx?|vue|svelte|html))' })
    $backendFiles = @($filePaths | Where-Object { $_ -match '(controllers/|routes/|services/|models/|middleware/|api/)' })

    # Decision logic based on file classifications
    if ($scriptFiles.Count -gt 0 -and ($scriptFiles.Count + $configFiles.Count -eq $filePaths.Count)) {
        return "feat: implement reusable git push and pull automation scripts"
    }
    
    if ($docFiles.Count -eq $filePaths.Count) {
        $names = ($docFiles | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
        return "docs: update project documentation ($names)"
    }

    if ($configFiles.Count -eq $filePaths.Count) {
        return "chore: update project configuration and environment definitions"
    }

    if ($testFiles.Count -eq $filePaths.Count) {
        return "test: add automated test coverage and suites"
    }

    if ($styleFiles.Count -eq $filePaths.Count) {
        return "style: enhance application layout and stylesheet definitions"
    }

    if ($backendFiles.Count -gt 0) {
        $modNames = @()
        foreach ($f in $backendFiles) {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($f)
            if ($base) { $modNames += $base }
        }
        if ($modNames.Count -gt 0) {
            $distinct = ($modNames | Select-Object -Unique) -join ", "
            if ($distinct.Length -gt 40) { $distinct = $distinct.Substring(0, 37) + "..." }
            return "feat: implement $distinct backend API service and routing"
        }
        return "feat: implement backend API services and business logic"
    }

    if ($uiFiles.Count -gt 0) {
        $compNames = @()
        foreach ($f in $uiFiles) {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($f)
            if ($base -and $base -notmatch '^(index|App|main)$') {
                $compNames += $base
            }
        }
        if ($compNames.Count -gt 0) {
            $distinct = ($compNames | Select-Object -Unique) -join ", "
            if ($distinct.Length -gt 40) { $distinct = $distinct.Substring(0, 37) + "..." }
            return "feat: implement $distinct UI module and components"
        }
        return "feat: enhance frontend user interface and application views"
    }

    # Combined changes
    $primaryExt = ($filePaths | ForEach-Object { [System.IO.Path]::GetExtension($_) } | Group-Object | Sort-Object Count -Descending | Select-Object -First 1).Name
    $firstFile = Split-Path ($filePaths[0]) -Leaf
    return "feat: update $firstFile and related project modules"
}

function Prompt-UserApproval {
    param (
        [string]$Question = "Do you approve this Git operation?"
    )

    Write-Host ""
    Write-Host $Question -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [Y] Yes - Continue" -ForegroundColor Green
    Write-Host "  [N] No  - Cancel" -ForegroundColor Red
    Write-Host ""

    $choice = Read-Host "Enter choice [Y/N]"
    if ($choice -and ($choice.Trim().ToUpper() -eq "Y" -or $choice.Trim().ToUpper() -eq "YES")) {
        return $true
    }
    return $false
}

function Write-AutomationLog {
    param (
        [string]$RepoRoot,
        [string]$RepoName,
        [string]$Branch,
        [string]$Operation,
        [string]$CommitMessage = "N/A",
        [string]$Status,
        [string]$ErrorDetails = "None"
    )

    try {
        $logDir = Join-Path $RepoRoot "logs"
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }

        $logFile = Join-Path $logDir "git-automation.log"
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

        # Sanitize sensitive patterns (passwords, tokens, keys)
        $cleanError = $ErrorDetails -replace '(?i)(token|password|secret|key|bearer)\s*[:=]\s*[^\s,;]+', '$1: [REDACTED]'
        $cleanError = $cleanError -replace 'ghp_[a-zA-Z0-9]{20,}', '[REDACTED_GH_TOKEN]'

        $logEntry = "[$timestamp] [REPO: $RepoName] [BRANCH: $Branch] [OP: $Operation] [STATUS: $Status] [COMMIT: $CommitMessage] [DETAILS: $cleanError]"
        Add-Content -Path $logFile -Value $logEntry -Encoding UTF8
    } catch {
        Write-Host "WARNING: Failed to write to automation log: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
