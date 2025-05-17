# Google Sheets Integration for CISV Review System

This document provides comprehensive instructions for setting up and using the Google Sheets integration with the CISV Review System. This integration allows the system to automatically update a Google Sheet when participants are checked in or out.

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Environment Variables](#environment-variables)
3. [Populating the Google Sheet](#populating-the-google-sheet)
4. [How It Works](#how-it-works)
5. [Troubleshooting](#troubleshooting)

## Setup Instructions

Follow these steps to set up the Google Sheets integration:

### 1. Create a Google Cloud Project and Enable the Google Sheets API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API for your project

### 2. Create Service Account Credentials

1. In your Google Cloud project, go to "APIs & Services" > "Credentials"
2. Create a new service account
3. Download the JSON key file for the service account

### 3. Create a Google Sheet

1. Create a new Google Sheet
2. Set up columns for participant names and check-in status
3. Share the sheet with the service account email (with Editor permissions)
4. Copy the Sheet ID from the URL

### 4. Configure Environment Variables

Add the following to your `.env` file:

```
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_PRIVATE_KEY="your-private-key-from-json-file"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account-email"
GOOGLE_SHEETS_SHEET_ID="your-sheet-id"
```

### 5. Install Required Package

Run the following command to install the Google API client library:

```bash
npm install googleapis
```

### 6. Restart the Server

Restart your server to apply the changes:

```bash
npm run dev
```

## Environment Variables

- `GOOGLE_SHEETS_ENABLED`: Set to "true" to enable the Google Sheets integration
- `GOOGLE_SHEETS_PRIVATE_KEY`: The private key from your service account JSON file
- `GOOGLE_SHEETS_CLIENT_EMAIL`: The email address of your service account
- `GOOGLE_SHEETS_SHEET_ID`: The ID of your Google Sheet (from the URL)

**Note about the private key**: When copying the private key from the JSON file to your `.env` file, make sure to:
1. Include the entire key, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
2. Wrap the key in double quotes
3. Replace newlines with `\n` if they aren't preserved

## Populating the Google Sheet

To populate your Google Sheet with participant names from your database, run:

```bash
node scripts/populateGoogleSheet.js
```

This script will:
1. Connect to your MongoDB database
2. Retrieve all participants
3. Clear the existing data in your Google Sheet
4. Add a header row
5. Add all participants with their current check-in status
6. Format the header row

## How It Works

When a participant is checked in or out:

1. The system updates the participant's status in the MongoDB database
2. If Google Sheets integration is enabled, the system:
   - Searches for the participant's name in the Google Sheet
   - Updates the check-in status cell next to their name
   - Adds a checkmark (✓) when checked in, or clears the cell when checked out

The integration is designed to be fault-tolerant:
- If the Google Sheets update fails, the check-in/out operation still completes in the database
- Errors are logged but don't affect the main application flow

## Troubleshooting

### Common Issues

1. **"Error: Missing required environment variables"**
   - Make sure all required environment variables are set in your `.env` file

2. **"Error: invalid_grant"**
   - This usually means the service account credentials are invalid or expired
   - Generate a new key file and update your environment variables

3. **"Error: Requested entity was not found"**
   - Check that the Sheet ID is correct
   - Verify that the sheet exists and is shared with the service account

4. **"Error: Participant not found in Google Sheet"**
   - Run the `populateGoogleSheet.js` script to ensure all participants are in the sheet
   - Check for name mismatches between the database and the sheet

### Checking Logs

If you encounter issues, check the server logs for detailed error messages. The integration logs:
- When it attempts to update the Google Sheet
- The result of the update operation
- Any errors that occur during the update

### Testing the Integration

To test if the integration is working:
1. Set `GOOGLE_SHEETS_ENABLED=true` in your `.env` file
2. Restart the server
3. Check in a participant through the application
4. Verify that the Google Sheet is updated with a checkmark
