# source/ 의 청첩장을 build해서 저장소 맨 위(GitHub Pages가 서비스하는 곳)에 펼칩니다.
#
#   .\publish.ps1
#
# 하는 일
#   1) source\build.ps1 을 돌려 source\dist 를 만듭니다.
#   2) 맨 위의 이전 build 결과(아래 $generated 목록)만 지웁니다.
#   3) source\dist 의 내용을 맨 위로 복사합니다.
# 그다음 git commit, git push 를 하면 1~2분 뒤 https://rev6unsers.github.io 에 반영됩니다.
#
# 실행 정책 때문에 막히면 해당 session에서만 허용해 주시기 바랍니다.
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'source'
$dist = Join-Path $source 'dist'

& (Join-Path $source 'build.ps1')
if (-not $?) { exit 1 }

# build가 만드는 것만 지웁니다. source/, README.md, .git 등 다른 것은 건드리지 않습니다.
$generated = @('index.html', 'main.html', 'developer.html', 'release.html', 'wedding.ics', 'css', 'js', 'assets', 'photos')
foreach ($name in $generated) {
  $p = Join-Path $root $name
  if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force }
}

Get-ChildItem -LiteralPath $dist -Force |
  Where-Object { $_.Name -ne '.invitation-build' } |
  ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $root -Recurse -Force }

Write-Host ''
Write-Host '맨 위에 펼쳤습니다. 확인 후 commit, push 하면 GitHub Pages에 반영됩니다.'
