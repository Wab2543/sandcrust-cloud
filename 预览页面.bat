@echo off
chcp 65001 >nul
echo ========================================
echo   沙结智汇云 - 页面预览模式
echo ========================================
echo.
echo 正在启动本地服务器...
echo 浏览器将自动打开项目首页
echo 按 Ctrl+C 可停止服务器
echo.
echo 注意: 此模式仅预览页面布局，表单提交等功能需要 wrangler dev 启动完整后端
echo ========================================
echo.

cd /d "%~dp0public"

REM 尝试用 Python 启动
python -m http.server 8080 2>nul
if %errorlevel%==0 goto :end

REM 尝试用 npx serve 启动
npx serve . -p 8080 2>nul
if %errorlevel%==0 goto :end

REM 都不可用
echo 错误: 未找到 Python 或 Node.js，请安装后再试
echo 快速安装 Node.js: https://nodejs.org (点击LTS下载)
pause
goto :eof

:end
pause
