[CmdletBinding()]
param(
  [string]$Server = "16.176.125.180",
  [string]$RemoteUser = "ubuntu",
  [string]$KeyPath = (Join-Path $env:USERPROFILE "Desktop\aws\ielts-staging-key.pem"),
  [string]$ApiUrl = "https://api.theieltsspells.io.vn/api/v1",
  [string]$Release = (Get-Date -Format "yyyyMMdd-HHmmss"),
  [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

if (-not ("System.IO.Compression.ZipFile" -as [type])) {
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$mainEnvPath = Join-Path $repoRoot "apps\main-web\.env.local"
$managementEnvPath = Join-Path $repoRoot ".env.local"
$dockerfilePath = Join-Path $repoRoot "deploy\Dockerfile.main-web"
$composePath = Join-Path $repoRoot "deploy\frontend-compose.yml"
$remoteTarget = "$RemoteUser@$Server"
$remoteBase = "/home/ubuntu/ielts-frontend"

function Assert-LastExitCode([string]$Action) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Action failed with exit code $LASTEXITCODE."
  }
}

function Get-DotEnvValue([string]$Path, [string]$Name) {
  $pattern = "^$([Regex]::Escape($Name))=(.*)$"
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match $pattern } | Select-Object -Last 1
  if (-not $line) {
    throw "Missing $Name in $Path."
  }

  return ([Regex]::Match($line, $pattern).Groups[1].Value).Trim().Trim('"').Trim("'")
}

function Write-Utf8File([string]$Path, [string]$Content) {
  [IO.File]::WriteAllText($Path, $Content, [Text.UTF8Encoding]::new($false))
}

function New-ZipArchive([string]$SourceDirectory, [string]$DestinationPath) {
  $sourceRoot = [IO.Path]::GetFullPath($SourceDirectory).TrimEnd('\', '/')
  $stream = [IO.File]::Open($DestinationPath, [IO.FileMode]::Create)
  $archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
  try {
    Get-ChildItem -LiteralPath $sourceRoot -File -Recurse -Force | ForEach-Object {
      $entryName = $_.FullName.Substring($sourceRoot.Length).TrimStart('\', '/').Replace('\', '/')
      [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $archive,
        $_.FullName,
        $entryName,
        [IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
  } finally {
    $archive.Dispose()
    $stream.Dispose()
  }
}

function Invoke-Ssh([string]$Command) {
  & ssh -i $KeyPath -o BatchMode=yes -o ConnectTimeout=15 $remoteTarget $Command
  Assert-LastExitCode "Remote command"
}

function Invoke-SshScript([string]$Script) {
  $encodedScript = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Script))
  Invoke-Ssh "printf %s $encodedScript | base64 --decode | bash"
}

if ($Release -notmatch '^[0-9A-Za-z._-]+$') {
  throw "Release may contain only letters, numbers, dots, underscores, and hyphens."
}

foreach ($command in @("pnpm", "ssh", "scp", "robocopy")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "Required command '$command' was not found."
  }
}

foreach ($path in @($KeyPath, $mainEnvPath, $managementEnvPath, $dockerfilePath, $composePath)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required file was not found: $path"
  }
}

$apiUri = $null
if (-not [Uri]::TryCreate($ApiUrl, [UriKind]::Absolute, [ref]$apiUri) -or $apiUri.Scheme -ne "https") {
  throw "ApiUrl must be an absolute HTTPS URL."
}

$supabaseUrl = Get-DotEnvValue $mainEnvPath "NEXT_PUBLIC_SUPABASE_URL"
$supabaseAnonKey = Get-DotEnvValue $mainEnvPath "NEXT_PUBLIC_SUPABASE_ANON_KEY"
if ($supabaseUrl -match 'localhost|127\.0\.0\.1' -or -not $supabaseAnonKey) {
  throw "Main Web Supabase production configuration is missing."
}

$temporaryBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$temporaryRoot = [IO.Path]::GetFullPath((Join-Path $temporaryBase "ielts-frontend-$Release"))
if (-not $temporaryRoot.StartsWith($temporaryBase, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Temporary deployment path escaped the system temporary directory."
}
$stagingRoot = Join-Path $temporaryRoot "source"
$sourceArchive = Join-Path $temporaryRoot "frontend-source-$Release.zip"
$managementArchive = Join-Path $temporaryRoot "management-$Release.zip"
$composeEnvPath = Join-Path $temporaryRoot "compose.env"

try {
  New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

  if (-not $SkipChecks) {
    Push-Location $repoRoot
    try {
      & pnpm typecheck
      Assert-LastExitCode "Frontend typecheck"
    } finally {
      Pop-Location
    }
  }

  $environmentNames = @("VITE_API_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY")
  $previousEnvironment = @{}
  foreach ($name in $environmentNames) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
  }

  try {
    $env:VITE_API_URL = $ApiUrl
    $env:VITE_SUPABASE_URL = Get-DotEnvValue $managementEnvPath "VITE_SUPABASE_URL"
    $env:VITE_SUPABASE_ANON_KEY = Get-DotEnvValue $managementEnvPath "VITE_SUPABASE_ANON_KEY"

    Push-Location $repoRoot
    try {
      & pnpm --filter "@ielts/management-web" build
      Assert-LastExitCode "Management Web build"
    } finally {
      Pop-Location
    }
  } finally {
    foreach ($name in $environmentNames) {
      [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], "Process")
    }
  }

  & robocopy $repoRoot $stagingRoot /E /XD .git node_modules .next .next-dev dist .turbo artifacts /XF "*.tsbuildinfo" "*.log" /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "Failed to prepare the deployment source (robocopy exit code $LASTEXITCODE)."
  }

  $rootEnvironment = @(
    "VITE_API_URL=$ApiUrl",
    "VITE_SUPABASE_URL=$(Get-DotEnvValue $managementEnvPath 'VITE_SUPABASE_URL')",
    "VITE_SUPABASE_ANON_KEY=$(Get-DotEnvValue $managementEnvPath 'VITE_SUPABASE_ANON_KEY')"
  ) -join [Environment]::NewLine
  $mainEnvironment = @(
    "NEXT_PUBLIC_API_URL=$ApiUrl",
    "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey"
  ) -join [Environment]::NewLine

  Write-Utf8File (Join-Path $stagingRoot ".env.local") ($rootEnvironment + [Environment]::NewLine)
  Write-Utf8File (Join-Path $stagingRoot "apps\main-web\.env.local") ($mainEnvironment + [Environment]::NewLine)
  Write-Utf8File $composeEnvPath "MAIN_WEB_IMAGE=ielts-main-web:$Release`n"

  New-ZipArchive $stagingRoot $sourceArchive
  New-ZipArchive (Join-Path $repoRoot "apps\management-web\dist") $managementArchive

  Invoke-Ssh "mkdir -p '$remoteBase/incoming/$Release'"
  & scp -i $KeyPath -o BatchMode=yes $sourceArchive "${remoteTarget}:$remoteBase/incoming/$Release/source.zip"
  Assert-LastExitCode "Source upload"
  & scp -i $KeyPath -o BatchMode=yes $managementArchive "${remoteTarget}:$remoteBase/incoming/$Release/management.zip"
  Assert-LastExitCode "Management upload"
  & scp -i $KeyPath -o BatchMode=yes $composePath "${remoteTarget}:$remoteBase/incoming/$Release/compose.yml"
  Assert-LastExitCode "Compose upload"
  & scp -i $KeyPath -o BatchMode=yes $composeEnvPath "${remoteTarget}:$remoteBase/incoming/$Release/compose.env"
  Assert-LastExitCode "Compose environment upload"

  $remoteCommand = @"
set -Eeuo pipefail
release='$Release'
base='$remoteBase'
incoming="`$base/incoming/`$release"
source_dir="`$base/build-context-`$release"
management_dir="/var/www/ielts-management/releases/management-`$release"
old_management="`$(readlink -f /var/www/ielts-management/current 2>/dev/null || true)"
had_env=0
switched=0

cp "`$base/compose.yml" "`$incoming/compose.previous.yml"
if [ -f "`$base/.env" ]; then
  cp "`$base/.env" "`$incoming/compose.previous.env"
  had_env=1
fi

rollback() {
  status=`$?
  if [ "`$switched" -eq 1 ]; then
    cp "`$incoming/compose.previous.yml" "`$base/compose.yml"
    if [ "`$had_env" -eq 1 ]; then
      cp "`$incoming/compose.previous.env" "`$base/.env"
    else
      rm -f "`$base/.env"
    fi
    (cd "`$base" && docker compose up -d --force-recreate main-web) || true
    if [ -n "`$old_management" ] && [ -d "`$old_management" ]; then
      sudo ln -sfn "`$old_management" /var/www/ielts-management/current
    fi
    sudo systemctl reload nginx || true
  fi
  exit "`$status"
}
trap rollback ERR

mkdir -p "`$source_dir"
python3 -m zipfile -e "`$incoming/source.zip" "`$source_dir"
docker build -f "`$source_dir/deploy/Dockerfile.main-web" -t "ielts-main-web:`$release" "`$source_dir"

sudo mkdir -p "`$management_dir"
sudo python3 -m zipfile -e "`$incoming/management.zip" "`$management_dir"
sudo chown -R www-data:www-data "`$management_dir"

cp "`$incoming/compose.yml" "`$base/compose.yml"
cp "`$incoming/compose.env" "`$base/.env"
switched=1
(cd "`$base" && docker compose up -d --force-recreate --wait --wait-timeout 180 main-web)

sudo ln -sfn "`$management_dir" /var/www/ielts-management/current
sudo nginx -t
sudo systemctl reload nginx

check_url() {
  label="`$1"
  url="`$2"
  printf 'Checking %s... ' "`$label"
  if curl -fsS --connect-timeout 10 --max-time 30 --retry 10 --retry-delay 2 --retry-all-errors "`$url" >/dev/null; then
    echo OK
  else
    echo FAILED >&2
    return 1
  fi
}

check_url 'Main Web' 'https://theieltsspells.io.vn/'
check_url 'Management Web' 'https://management.theieltsspells.io.vn/'
printf 'Checking Backend API... '
api_health="`$(curl -fsS --connect-timeout 10 --max-time 30 --retry 10 --retry-delay 2 --retry-all-errors https://api.theieltsspells.io.vn/actuator/health)"
if printf '%s' "`$api_health" | grep -q '"status":"UP"'; then
  echo OK
else
  printf 'FAILED: %s\n' "`$api_health" >&2
  exit 1
fi

trap - ERR
printf 'DEPLOYED_RELEASE=%s\n' "`$release"
docker compose -f "`$base/compose.yml" --env-file "`$base/.env" ps
"@

  Invoke-SshScript $remoteCommand
  Write-Host "Deployment $Release completed successfully." -ForegroundColor Green
  Write-Host "Main Web: https://theieltsspells.io.vn"
  Write-Host "Management Web: https://management.theieltsspells.io.vn"
} finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
