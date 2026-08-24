param(
    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$requiredVariables = @('POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_PORT')
$missingVariables = $requiredVariables | Where-Object { -not [Environment]::GetEnvironmentVariable($_) }
if ($missingVariables.Count -gt 0) {
    throw "Defina as variáveis antes do backup: $($missingVariables -join ', ')."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    throw 'pg_dump não foi encontrado. Instale as ferramentas cliente do PostgreSQL.'
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $resolvedOutput "sigep-$timestamp.dump"

$previousPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    & $pgDump.Source `
        --host=$env:POSTGRES_HOST `
        --port=$env:POSTGRES_PORT `
        --username=$env:POSTGRES_USER `
        --dbname=$env:POSTGRES_DB `
        --format=custom `
        --no-owner `
        --file=$backupFile
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump terminou com o código $LASTEXITCODE."
    }
} finally {
    $env:PGPASSWORD = $previousPassword
}

$file = Get-Item -LiteralPath $backupFile
if ($file.Length -eq 0) {
    throw 'O ficheiro de backup foi criado vazio.'
}

Write-Output "Backup criado: $($file.FullName)"
