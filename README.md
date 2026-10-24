# WhakaOra
WhakaOra is a medication-management mobile application designed to help users organise medications, track doses, manage medication interactions, and create personalised medication schedules. The application focuses on New Zealand medications through integration with data extracted from the NZ Formulary.

## Quick Start
```bash
npm install
python src/data/local/pdfscrapper.py
npm run android
```

## Features
- Manage user medications
- Search imported medication reference data
- Create medication schedules and suggested dose times
- Configure meal timings and food instructions
- Record medication combinations and interactions
- Record doses, reminders, prescriptions, and side effects
- Run on Android

## Requirements
- Node.js 20 or newer
- npm
- Android Studio or Android SDK for Android development
- Java 17 or newer for Gradle builds
- An Android emulator or physical Android device

PDF Scraper
- Python3
- PyMuPDF
- Pytest

## Medication Data Setup
The application requires a generated medication dataset before it can run.
1. Download the latest NZ Formulary PDF from: [NZ Formulary](https://nzformulary.org/)
2. Place the PDF inside src/data/local/
3. Run the scraper
```bash
python pdfscrapper.py
```
4. The scraper generates medication.json. This file is required for medication search and information retrieval.

## Installation
```bash
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install PyMuPDF pytest
```
Ignite has made it simple to run the application so use one of the following (switch ios with android for android development builds)

```bash
npm run start
npm run build:ios:sim # build for ios simulator 
npm run build:ios:device # build for ios device
npm run build:ios:prod # build for ios device
npm run android
```
## Technology Stack
- React Native
- Expo
- Ignite Boilerplate
- TypeScript
- SQLite
- Python
- PyMuPDF
- Jest
- React Navigation

## Architecture
For all architecture and class diagrams please have a look under diagrams/ which has mermaid diagrams that you can have a look at to see what the design for the project was.

## Known limitations
Certain features haven't been completed included:
- Camera medication entry
- Reminder notifications
- Medication history tracking

## Testing
You can run all the unit tests created for the domain, service, repository, and database layers and for the PDFScrapper through 
````bash
npm test
pytest
```
