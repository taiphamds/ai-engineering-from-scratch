$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $nodePath = $nodeCommand.Source
} else {
    $runtime = Get-AppxPackage -Name 'OpenAI.CodexPrimaryRuntime*' | Sort-Object Version -Descending | Select-Object -First 1
    if ($runtime) { $nodePath = Join-Path $runtime.InstallLocation 'dependencies\node\bin\node.exe' }
}
if (-not $nodePath -or -not (Test-Path -LiteralPath $nodePath)) {
    throw 'Node.js was not found. Open this launcher from Codex, or install Node.js before running it.'
}
Set-Location -LiteralPath $repoRoot
& $nodePath (Join-Path $PSScriptRoot 'serve-local.cjs') --open
exit $LASTEXITCODE
