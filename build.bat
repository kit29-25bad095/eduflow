@echo off
echo ========================================================
echo  Building EduFlow Unified Java Full-Stack Application
echo ========================================================

echo [1/2] Building React Frontend SPA...
cd client
call npm run build
cd ..

echo [2/2] Compiling Java Backend (Java 21)...
if not exist "bin" mkdir bin
javac -cp "lib/*" -d bin src/com/eduflow/Main.java src/com/eduflow/database/*.java src/com/eduflow/model/*.java src/com/eduflow/dao/*.java src/com/eduflow/server/*.java src/com/eduflow/util/*.java

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  BUILD SUCCESSFUL!
    echo  Run "run.bat" to start the Java server on port 5000.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Java compilation failed! Check compiler output.
)
