<#
 Purpose: execute the build scripts in this folder in order using .NET System.Data.SqlClient,
 since this machine has no sqlcmd / node / dotnet CLI available.
 Credentials are never hardcoded here - they come from server/.env (gitignored) or -Server/-User/-Password.
 Usage: powershell -File db\run_all.ps1
#>
param(
    [string]$Server   = "",
    [string]$User     = "",
    [string]$Password = ""
)

Add-Type -AssemblyName "System.Data"

$envFile = Join-Path (Split-Path -Parent $PSScriptRoot) "server\.env"
$envValues = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') {
            $envValues[$matches[1]] = $matches[2].Trim()
        }
    }
}
if (-not $Server -and $envValues.OAV_DB_SERVER)   { $Server = "$($envValues.OAV_DB_SERVER),$($envValues.OAV_DB_PORT)" }
if (-not $User -and $envValues.OAV_DB_USER)       { $User = $envValues.OAV_DB_USER }
if (-not $Password -and $envValues.OAV_DB_PASSWORD) { $Password = $envValues.OAV_DB_PASSWORD }

if (-not $Server -or -not $User -or -not $Password) {
    throw "Missing DB connection info. Create server/.env (see server/.env.example) or pass -Server/-User/-Password."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = Get-ChildItem -Path $scriptDir -Filter "*.sql" | Sort-Object Name

function Invoke-SqlFile {
    param([string]$ConnStr, [string]$FilePath)

    $sqlText = Get-Content -Path $FilePath -Raw -Encoding UTF8
    # split on a line that contains only GO
    $batches = [System.Text.RegularExpressions.Regex]::Split($sqlText, '(?im)^\s*GO\s*$')

    $conn = New-Object System.Data.SqlClient.SqlConnection($ConnStr)
    $conn.Open()
    try {
        foreach ($batch in $batches) {
            $trimmed = $batch.Trim()
            if ($trimmed.Length -eq 0) { continue }
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = $trimmed
            $cmd.CommandTimeout = 60
            $cmd.ExecuteNonQuery() | Out-Null
        }
    } finally {
        $conn.Close()
    }
}

# Step 1: create the database from master (if missing)
$masterConnStr = "Server=$Server;Database=master;User Id=$User;Password=$Password;TrustServerCertificate=True;Connection Timeout=15;"
$createDbFile = Join-Path $scriptDir "00_create_database.sql"
Write-Output "Running: $($createDbFile | Split-Path -Leaf)"
Invoke-SqlFile -ConnStr $masterConnStr -FilePath $createDbFile

# Step 2: run the rest of the scripts against oav67 (each file has its own USE [oav67])
$dbConnStr = "Server=$Server;Database=oav67;User Id=$User;Password=$Password;TrustServerCertificate=True;Connection Timeout=15;"
foreach ($f in $files) {
    if ($f.Name -eq "00_create_database.sql") { continue }
    Write-Output "Running: $($f.Name)"
    Invoke-SqlFile -ConnStr $dbConnStr -FilePath $f.FullName
}

Write-Output "All build scripts completed."
