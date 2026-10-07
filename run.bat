@echo off
echo ========================================================
echo  Starting EduFlow Java 21 Application Server
echo ========================================================
echo  Host: http://localhost:5000
echo  API Health: http://localhost:5000/api/health
echo  Database: SQLite (data/lms_jdbc.db)
echo ========================================================

java -cp "bin;lib/*" com.eduflow.Main
