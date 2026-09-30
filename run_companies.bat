@echo off
title OpenAngels Startup Discovery Pipeline
echo ======================================================================
echo           OpenAngels Automated Company Discovery Pipeline
echo ======================================================================
echo.
python data_pipeline\company_pipeline.py
echo.
pause
