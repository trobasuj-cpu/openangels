@echo off
color 0A
echo =======================================================
echo          OPENANGELS DAILY DATA ENGINE (OSINT)
echo =======================================================
echo.
echo Running on local machine to bypass Search Engine blocks...
echo.

echo [1/6] Checking and installing requirements...
python -m pip install -q -r data_pipeline/requirements.txt
echo OK.
echo.

echo [2/6] Running Module 1: News Scraper (Gemini API)...
python data_pipeline/source_news.py
echo.

echo [3/6] Running Module 2: Twitter Scraper...
python data_pipeline/source_twitter.py
echo.

echo [4/6] Running Module 3: Open Lists Scraper...
python data_pipeline/source_lists.py
echo.

echo [5/6] Running Module 4: Industry Enrichment (AI)...
python data_pipeline/enrich_industries.py
echo.

echo [6/6] Running Enrichment Engine (Finding Emails via OSINT)...
python data_pipeline/find_emails.py
echo.

echo =======================================================
echo   ALL TASKS COMPLETED SUCCESSFULLY! DATABASE UPDATED.
echo =======================================================
pause
