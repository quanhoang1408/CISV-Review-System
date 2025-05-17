// services/googleSheetsService.js
const { google } = require('googleapis');

/**
 * Configures and returns an authorized Google Sheets API client
 * @returns {sheets_v4.Sheets} Google Sheets API client
 */
function getGoogleSheetsClient() {
  // Load credentials from environment variables
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  // Create a JWT auth client
  const jwtClient = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  // Return Google Sheets API client
  return google.sheets({ version: 'v4', auth: jwtClient });
}

/**
 * Updates a participant's check-in status in Google Sheets
 * @param {string} participantName - The name of the participant
 * @param {boolean} checkInStatus - The check-in status (true = checked in)
 * @returns {Promise<Object>} - The response from Google Sheets API
 */
async function updateParticipantCheckInStatus(participantName, checkInStatus) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Check-in';

    // First, find the row with the participant's name
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!B:B`, // Search in column B for names (as per your sheet structure)
    });

    const rows = searchResponse.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      // Check if the row has a value and if it matches the participant name
      if (rows[i] && rows[i][0] && rows[i][0].trim() === participantName.trim()) {
        rowIndex = i + 1; // Sheets API uses 1-based indexing
        break;
      }
    }

    if (rowIndex === -1) {
      console.log(`Participant "${participantName}" not found in Google Sheet "${sheetName}"`);
      return { success: false, message: `Participant not found in Google Sheet "${sheetName}"` };
    }

    // Check if the row is within the expected range for the participant type
    // Leaders are in rows 35-103, Supporters are in rows 108-147
    const isInLeaderRange = rowIndex >= 35 && rowIndex <= 103;
    const isInSupporterRange = rowIndex >= 108 && rowIndex <= 147;

    if (!isInLeaderRange && !isInSupporterRange) {
      console.log(`Found participant "${participantName}" at row ${rowIndex}, but it's outside the expected ranges`);
    }

    // Update the check-in status in column I (checkbox)
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[checkInStatus ? 'TRUE' : 'FALSE']] // Use TRUE/FALSE for checkboxes
      }
    });

    console.log(`Google Sheet "${sheetName}" updated for ${participantName} at row ${rowIndex}: Check-in status = ${checkInStatus}`);
    return {
      success: true,
      message: 'Google Sheet updated successfully',
      response: updateResponse.data
    };
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    return {
      success: false,
      message: 'Error updating Google Sheet',
      error: error.message
    };
  }
}

/**
 * Resets a participant's check-in status in Google Sheets
 * @param {string} participantName - The name of the participant
 * @returns {Promise<Object>} - The response from Google Sheets API
 */
async function resetParticipantCheckInStatus(participantName) {
  return updateParticipantCheckInStatus(participantName, false);
}

module.exports = {
  updateParticipantCheckInStatus,
  resetParticipantCheckInStatus
};
