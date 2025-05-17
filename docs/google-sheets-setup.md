# Google Sheets Integration Setup Guide

This guide will walk you through setting up the Google Sheets API integration for the CISV Review System.

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a name for your project (e.g., "CISV Review System")
5. Click "Create"

## 2. Enable the Google Sheets API

1. In your new project, go to the "APIs & Services" > "Library" section
2. Search for "Google Sheets API"
3. Click on "Google Sheets API" in the results
4. Click "Enable"

## 3. Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter a name for your service account (e.g., "CISV Sheets Integration")
4. Click "Create and Continue"
5. For the role, select "Project" > "Editor" (or a more specific role if you prefer)
6. Click "Continue"
7. Click "Done"

## 4. Generate a Service Account Key

1. In the Credentials page, find your new service account and click on it
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" as the key type
5. Click "Create"
6. The key file will be downloaded to your computer - keep this file secure!

## 5. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Set up your sheet with the following columns:
   - Column A: Participant Name
   - Column B: Check-in Status (this will be where we place checkmarks)
4. Add your participant names in Column A

## 6. Share the Sheet with the Service Account

1. In your Google Sheet, click the "Share" button
2. In the "Add people and groups" field, enter the email address of your service account
   (it will look like: `service-account-name@project-id.iam.gserviceaccount.com`)
3. Make sure the service account has "Editor" access
4. Uncheck "Notify people"
5. Click "Share"

## 7. Get the Sheet ID

1. From your Google Sheet's URL, copy the ID portion
2. The URL looks like: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
3. The SHEET_ID is the long string between `/d/` and `/edit`

## 8. Configure Environment Variables

Add the following environment variables to your `.env` file:

```
GOOGLE_SHEETS_PRIVATE_KEY="your-private-key-from-json-file"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account-email"
GOOGLE_SHEETS_SHEET_ID="your-sheet-id"
```

Note: For the private key, you'll need to copy the entire private key from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts. Make sure to wrap it in quotes.
