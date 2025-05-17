// scripts/populateGoogleSheet.js
require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');

// Check if Google Sheets environment variables are set
const requiredVars = ['GOOGLE_SHEETS_PRIVATE_KEY', 'GOOGLE_SHEETS_CLIENT_EMAIL', 'GOOGLE_SHEETS_SHEET_ID'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define Participant model
const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['leader', 'supporter'],
    default: 'supporter'
  },
  checkInStatus: {
    type: Boolean,
    default: false
  }
});

const Participant = mongoose.model('Participant', participantSchema);

// Configure Google Sheets API
function getGoogleSheetsClient() {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  const jwtClient = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth: jwtClient });
}

// Main function to populate Google Sheet
async function populateGoogleSheet() {
  try {
    // Get all participants from database
    const participants = await Participant.find().sort({ type: 1, name: 1 });
    console.log(`Found ${participants.length} participants in the database`);

    // Prepare data for Google Sheets
    const sheetsData = participants.map(p => [
      p.name,                                // Column A: Name
      p.checkInStatus ? '✓' : '',           // Column B: Check-in Status
      p.type === 'leader' ? 'Leader' : 'Supporter' // Column C: Type
    ]);

    // Add header row
    sheetsData.unshift(['Participant Name', 'Check-in Status', 'Type']);

    // Get Google Sheets client
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;

    // Get the sheet name or ID from environment variables, or use default
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Check-in';

    // First, check if the specified sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    });

    let sheetId = 0; // Default to first sheet
    let sheetExists = false;

    // Look for the sheet by name
    for (const sheet of spreadsheet.data.sheets) {
      if (sheet.properties.title === sheetName) {
        sheetId = sheet.properties.sheetId;
        sheetExists = true;
        console.log(`Found sheet "${sheetName}" with ID ${sheetId}`);
        break;
      }
    }

    // If sheet doesn't exist, create it
    if (!sheetExists) {
      console.log(`Sheet "${sheetName}" not found, creating it...`);
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }
          ]
        }
      });

      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
      console.log(`Created new sheet "${sheetName}" with ID ${sheetId}`);
    }

    // Use the sheet name in range references
    const sheetRange = `'${sheetName}'!A:C`;
    const startCell = `'${sheetName}'!A1`;

    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: sheetRange,
    });
    console.log(`Cleared existing data in sheet "${sheetName}"`);

    // Update Google Sheet with participant data
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: startCell,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: sheetsData
      }
    });

    console.log(`Google Sheet updated successfully with ${sheetsData.length} rows`);
    console.log(`Sheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`);

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 3
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.4,
                    blue: 0.8
                  },
                  textFormat: {
                    bold: true,
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
                    }
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    console.log('Sheet formatting applied');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    console.log('Done!');
  } catch (error) {
    console.error('Error populating Google Sheet:', error);
    process.exit(1);
  }
}

// Run the script
populateGoogleSheet();
