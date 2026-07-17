@echo off
echo Starting OSINT Enrichment Cascade...
echo ====================================
echo Step 1: Finding missing LinkedIn profiles...
python data_pipeline\find_linkedin.py
echo.
echo Step 2: Finding missing Twitter profiles...
python data_pipeline\find_twitter.py
echo.
echo Step 3: Finding missing Emails...
python data_pipeline\find_emails.py
echo.
echo ====================================
echo Enrichment Complete! Contacts updated in database.
pause
