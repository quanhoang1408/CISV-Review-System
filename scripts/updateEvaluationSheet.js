// scripts/updateEvaluationSheet.js
require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');

// Check if Google Sheets environment variables are set
const requiredVars = [
  'GOOGLE_SHEETS_PRIVATE_KEY',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_SHEET_ID',
  'GOOGLE_SHEETS_EVALUATION_SHEET_NAME'
];
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

// Define schemas
const participantSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ['leader', 'supporter'],
    default: 'supporter'
  }
});

const criterionSchema = new mongoose.Schema({
  name: String,
  score: Number,
  evidence: String
});

const evaluationSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  criteria: [criterionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Định nghĩa schema cho Admin - chỉ định nghĩa các trường cần thiết
const adminSchema = new mongoose.Schema({
  name: String,
  // Không cần định nghĩa các trường khác
});

const Participant = mongoose.model('Participant', participantSchema);
const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// Sử dụng tên collection chính xác
const Admin = mongoose.model('Admin', adminSchema, 'users');

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

// Tiêu chí đánh giá cho Leader
const leaderCriteria = [
  "Năng lượng",
  "Kỷ luật",
  "Mức độ quan tâm/sẵn sàng",
  "Giải quyết vấn đề",
  "Làm việc nhóm",
  "Giao tiếp",
  "Tâm lý độ tuổi kid",
  "CISV Skills"
];

// Tiêu chí đánh giá cho Supporter
const supporterCriteria = [
  "Năng lượng",
  "Thái độ & sự tập trung",
  "Nhận thức bản thân",
  "Tư duy phản biện",
  "Teamwork",
  "Giao tiếp & kết nối",
  "Truyền đạt kinh nghiệm"
];

// Main function to update evaluation sheet
async function updateEvaluationSheet() {
  try {
    // Get all participants
    const participants = await Participant.find().sort({ type: 1, name: 1 });
    console.log(`Found ${participants.length} participants in the database`);

    // Kiểm tra xem có admin nào trong cơ sở dữ liệu không
    let admins = [];
    try {
      // Thử truy vấn bằng model
      admins = await Admin.find();
      console.log(`Found ${admins.length} admins using Admin model`);

      // Nếu không tìm thấy admin nào, thử truy vấn trực tiếp từ collection
      if (admins.length === 0) {
        const rawAdmins = await mongoose.connection.collection('users').find().toArray();
        console.log(`Found ${rawAdmins.length} admins directly from collection 'users'`);

        if (rawAdmins.length > 0) {
          // Sử dụng dữ liệu admin từ collection
          admins = rawAdmins;
          console.log('Using raw admin data from collection');

          // Hiển thị một số admin đầu tiên
          for (let i = 0; i < Math.min(5, rawAdmins.length); i++) {
            console.log(`Raw Admin ${i+1}:`, {
              id: rawAdmins[i]._id.toString(),
              name: rawAdmins[i].name || 'No name',
              email: rawAdmins[i].email || 'No email'
            });
          }
        }
      }

      // Hiển thị thông tin admin
      if (admins.length > 0) {
        console.log('Sample admins:');
        for (let i = 0; i < Math.min(5, admins.length); i++) {
          console.log(`Admin ${i+1}: ${admins[i].name || 'No name'} (ID: ${admins[i]._id.toString()})`);
        }
      } else {
        console.log('WARNING: No admins found in the database!');

        // Tạo một admin mẫu để test
        admins = [
          { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 1' },
          { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 2' },
          { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 3' }
        ];
        console.log('Created sample admins for testing');
      }
    } catch (error) {
      console.error('Error querying admins:', error);

      // Tạo một admin mẫu để test
      admins = [
        { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 1' },
        { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 2' },
        { _id: new mongoose.Types.ObjectId(), name: 'Admin Mẫu 3' }
      ];
      console.log('Created sample admins for testing due to error');
    }

    // Get all evaluations with populated references
    let evaluations = [];
    try {
      // Thử truy vấn bằng model với populate
      const populatedEvaluations = await Evaluation.find()
        .populate('participantId')
        .populate('evaluatorId');
      console.log(`Found ${populatedEvaluations.length} evaluations with populate`);

      if (populatedEvaluations.length > 0) {
        evaluations = populatedEvaluations;

        // Kiểm tra một vài đánh giá đầu tiên để debug
        console.log('Sample populated evaluations:');
        for (let i = 0; i < Math.min(3, evaluations.length); i++) {
          const eval = evaluations[i];
          console.log(`Evaluation ${i+1}:`, {
            id: eval._id.toString(),
            participantId: eval.participantId?._id?.toString() || 'Unknown',
            participantName: eval.participantId?.name || 'Unknown',
            participantType: eval.participantId?.type || 'Unknown',
            evaluatorId: eval.evaluatorId?._id?.toString() || 'Unknown',
            evaluatorName: eval.evaluatorId?.name || 'Unknown',
            criteriaCount: eval.criteria?.length || 0
          });
        }
      } else {
        console.log('WARNING: No populated evaluations found in the database!');

        // Kiểm tra xem có bản ghi đánh giá nào không (không populate)
        const rawEvaluations = await mongoose.connection.collection('evaluations').find().toArray();
        console.log(`Found ${rawEvaluations.length} raw evaluations in the database`);

        if (rawEvaluations.length > 0) {
          console.log('Sample raw evaluations:');
          for (let i = 0; i < Math.min(3, rawEvaluations.length); i++) {
            console.log(`Raw Evaluation ${i+1}:`, {
              id: rawEvaluations[i]._id.toString(),
              participantId: rawEvaluations[i].participantId?.toString(),
              evaluatorId: rawEvaluations[i].evaluatorId?.toString(),
              criteriaCount: rawEvaluations[i].criteria?.length || 0
            });
          }

          // Thử tự populate dữ liệu
          console.log('Attempting manual population...');
          const manuallyPopulatedEvaluations = [];

          for (const rawEval of rawEvaluations) {
            const evalCopy = { ...rawEval };

            // Tìm participant tương ứng
            if (rawEval.participantId) {
              const participant = participants.find(p =>
                p._id.toString() === rawEval.participantId.toString()
              );
              if (participant) {
                evalCopy.participantId = participant;
              }
            }

            // Tìm admin tương ứng
            if (rawEval.evaluatorId) {
              const admin = admins.find(a =>
                a._id.toString() === rawEval.evaluatorId.toString()
              );
              if (admin) {
                evalCopy.evaluatorId = admin;
              }
            }

            manuallyPopulatedEvaluations.push(evalCopy);
          }

          console.log(`Manually populated ${manuallyPopulatedEvaluations.length} evaluations`);
          evaluations = manuallyPopulatedEvaluations;
        } else {
          console.log('No evaluations found in the database at all.');

          // Tạo một số đánh giá mẫu để test
          evaluations = [];
          console.log('No sample evaluations created for testing');
        }
      }
    } catch (error) {
      console.error('Error querying evaluations:', error);
      evaluations = [];
    }

    // Group evaluations by participant
    const evaluationsByParticipant = {};
    evaluations.forEach(evaluation => {
      const participantId = evaluation.participantId?._id.toString();
      if (!participantId) return;

      if (!evaluationsByParticipant[participantId]) {
        evaluationsByParticipant[participantId] = [];
      }
      evaluationsByParticipant[participantId].push(evaluation);
    });

    // Count evaluations by admin
    const evaluationCountByAdmin = {};
    evaluations.forEach(evaluation => {
      // Kiểm tra và ghi log để debug
      console.log('Processing evaluation:', {
        evaluationId: evaluation._id?.toString(),
        evaluatorId: evaluation.evaluatorId?._id?.toString(),
        evaluatorName: evaluation.evaluatorId?.name,
        participantId: evaluation.participantId?._id?.toString(),
        participantName: evaluation.participantId?.name,
        participantType: evaluation.participantId?.type
      });

      const adminId = evaluation.evaluatorId?._id?.toString();
      const adminName = evaluation.evaluatorId?.name || 'Unknown';

      if (!adminId) {
        console.log('Skipping evaluation with no admin ID');
        return;
      }

      if (!evaluationCountByAdmin[adminId]) {
        evaluationCountByAdmin[adminId] = {
          name: adminName,
          count: 0,
          leaderCount: 0,
          supporterCount: 0
        };
      }

      evaluationCountByAdmin[adminId].count++;

      // Count by participant type
      if (evaluation.participantId?.type === 'leader') {
        evaluationCountByAdmin[adminId].leaderCount++;
      } else if (evaluation.participantId?.type === 'supporter') {
        evaluationCountByAdmin[adminId].supporterCount++;
      }
    });

    // Ghi log thông tin thống kê admin để debug
    console.log('Admin evaluation statistics:', evaluationCountByAdmin);
    console.log('Number of admins with evaluations:', Object.keys(evaluationCountByAdmin).length);

    // Prepare data for Google Sheets
    const sheetsData = [];

    // Add header rows
    sheetsData.push(['Đánh giá CISV Training']);
    sheetsData.push(['']);

    // Add Leader section
    sheetsData.push(['LEADERS']);

    // Add header row for leaders
    const leaderHeaderRow = ['Tên'];
    leaderCriteria.forEach(criterion => {
      leaderHeaderRow.push(criterion);
    });
    leaderHeaderRow.push('Số lượng admin đánh giá');
    sheetsData.push(leaderHeaderRow);

    // Add data rows for leaders
    const leaders = participants.filter(p => p.type === 'leader');
    leaders.forEach(leader => {
      const row = [leader.name];

      // Get evaluations for this leader
      const leaderEvaluations = evaluationsByParticipant[leader._id.toString()] || [];

      // Get unique admin IDs who evaluated this leader
      const uniqueAdminIds = new Set();
      leaderEvaluations.forEach(evaluation => {
        if (evaluation.evaluatorId && evaluation.evaluatorId._id) {
          uniqueAdminIds.add(evaluation.evaluatorId._id.toString());
        }
      });

      // Calculate average score for each criterion
      leaderCriteria.forEach(criterionName => {
        let totalScore = 0;
        let count = 0;

        leaderEvaluations.forEach(evaluation => {
          const criterion = evaluation.criteria.find(c => c.name === criterionName);
          if (criterion && criterion.score > 0) {
            totalScore += criterion.score;
            count++;
          }
        });

        // Add average score to row
        if (count > 0) {
          row.push((totalScore / count).toFixed(1));
        } else {
          row.push('');
        }
      });

      // Add number of unique admins who evaluated this leader
      row.push(uniqueAdminIds.size);

      sheetsData.push(row);
    });

    // Add empty row
    sheetsData.push(['']);

    // Add Supporter section
    sheetsData.push(['SUPPORTERS']);

    // Add header row for supporters
    const supporterHeaderRow = ['Tên'];
    supporterCriteria.forEach(criterion => {
      supporterHeaderRow.push(criterion);
    });
    supporterHeaderRow.push('Số lượng admin đánh giá');
    sheetsData.push(supporterHeaderRow);

    // Add data rows for supporters
    const supporters = participants.filter(p => p.type === 'supporter');
    supporters.forEach(supporter => {
      const row = [supporter.name];

      // Get evaluations for this supporter
      const supporterEvaluations = evaluationsByParticipant[supporter._id.toString()] || [];

      // Get unique admin IDs who evaluated this supporter
      const uniqueAdminIds = new Set();
      supporterEvaluations.forEach(evaluation => {
        if (evaluation.evaluatorId && evaluation.evaluatorId._id) {
          uniqueAdminIds.add(evaluation.evaluatorId._id.toString());
        }
      });

      // Calculate average score for each criterion
      supporterCriteria.forEach(criterionName => {
        let totalScore = 0;
        let count = 0;

        supporterEvaluations.forEach(evaluation => {
          const criterion = evaluation.criteria.find(c => c.name === criterionName);
          if (criterion && criterion.score > 0) {
            totalScore += criterion.score;
            count++;
          }
        });

        // Add average score to row
        if (count > 0) {
          row.push((totalScore / count).toFixed(1));
        } else {
          row.push('');
        }
      });

      // Add number of unique admins who evaluated this supporter
      row.push(uniqueAdminIds.size);

      sheetsData.push(row);
    });

    // Add empty rows
    sheetsData.push(['']);
    sheetsData.push(['']);

    // Add Admin Evaluation Statistics section
    sheetsData.push(['THỐNG KÊ ĐÁNH GIÁ THEO ADMIN']);

    // Add header row for admin statistics
    sheetsData.push(['Admin', 'Tổng số đánh giá', 'Đánh giá Leader', 'Đánh giá Supporter']);

    // Thử một cách khác để đếm đánh giá theo admin
    // Tạo một map mới để đếm đánh giá
    const adminEvalCounts = {};

    // Duyệt qua tất cả các đánh giá để đếm
    for (const evaluation of evaluations) {
      // Lấy thông tin admin
      const adminId = evaluation.evaluatorId?._id?.toString();
      const adminName = evaluation.evaluatorId?.name || 'Unknown';

      if (!adminId) continue;

      // Khởi tạo nếu chưa có
      if (!adminEvalCounts[adminId]) {
        adminEvalCounts[adminId] = {
          name: adminName,
          total: 0,
          leaders: 0,
          supporters: 0
        };
      }

      // Tăng số lượng đánh giá
      adminEvalCounts[adminId].total++;

      // Phân loại theo loại người tham gia
      if (evaluation.participantId?.type === 'leader') {
        adminEvalCounts[adminId].leaders++;
      } else if (evaluation.participantId?.type === 'supporter') {
        adminEvalCounts[adminId].supporters++;
      }
    }

    // Ghi log để debug
    console.log('Admin evaluation counts (alternative method):', adminEvalCounts);

    // Chuyển đổi thành mảng và sắp xếp
    const adminStatsArray = Object.values(adminEvalCounts)
      .sort((a, b) => b.total - a.total);

    console.log(`Adding ${adminStatsArray.length} admin statistics rows to sheet`);

    // Thêm dữ liệu vào sheet
    if (adminStatsArray.length === 0) {
      // Nếu không có dữ liệu admin, thêm một hàng thông báo
      sheetsData.push(['Không có dữ liệu đánh giá từ admin nào']);

      // Thêm dữ liệu từ danh sách admin thực tế, nhưng với số lượng đánh giá là 0
      if (admins.length > 0) {
        admins.forEach(admin => {
          const adminName = admin.name || 'Unknown Admin';
          console.log(`Adding admin with no evaluations: ${adminName}`);
          sheetsData.push([
            adminName,
            0, // Tổng số đánh giá
            0, // Đánh giá Leader
            0  // Đánh giá Supporter
          ]);
        });
      } else {
        // Nếu không có admin nào, thêm thông báo
        sheetsData.push(['Không tìm thấy admin nào trong hệ thống']);

        // Thêm một số admin mẫu
        console.log('Adding sample admins for display');
        ['Quân Hoàng', 'Admin 2', 'Admin 3'].forEach(name => {
          sheetsData.push([
            name,
            0, // Tổng số đánh giá
            0, // Đánh giá Leader
            0  // Đánh giá Supporter
          ]);
        });
      }
    } else {
      // Thêm dữ liệu thực tế
      adminStatsArray.forEach(admin => {
        console.log(`Adding stats for admin: ${admin.name}, count: ${admin.total}`);
        sheetsData.push([
          admin.name,
          admin.total,
          admin.leaders,
          admin.supporters
        ]);
      });

      // Thêm các admin chưa có đánh giá nào
      const adminIdsWithStats = new Set(adminStatsArray.map(a => a.name));
      const adminsWithoutStats = admins.filter(admin => !adminIdsWithStats.has(admin.name));

      if (adminsWithoutStats.length > 0) {
        console.log(`Adding ${adminsWithoutStats.length} admins without evaluations`);
        adminsWithoutStats.forEach(admin => {
          const adminName = admin.name || 'Unknown Admin';
          console.log(`Adding admin with no evaluations: ${adminName}`);
          sheetsData.push([
            adminName,
            0, // Tổng số đánh giá
            0, // Đánh giá Leader
            0  // Đánh giá Supporter
          ]);
        });
      }
    }

    // Get Google Sheets client
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_EVALUATION_SHEET_NAME;

    // First, check if the specified sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId
    });

    let sheetId = null;
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

    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
    });
    console.log(`Cleared existing data in sheet "${sheetName}"`);

    // Update Google Sheet with evaluation data
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: sheetsData
      }
    });

    console.log(`Google Sheet updated successfully with ${sheetsData.length} rows`);
    console.log(`Sheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`);

    // Format the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          // Format title
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 10
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    fontSize: 14,
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat.textFormat'
            }
          },
          // Format Leader header
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 2,
                endRowIndex: 3,
                startColumnIndex: 0,
                endColumnIndex: 10
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.8,
                    green: 0.2,
                    blue: 0.2
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
          },
          // Format Leader criteria header
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 3,
                endRowIndex: 4,
                startColumnIndex: 0,
                endColumnIndex: leaderCriteria.length + 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.95,
                    green: 0.8,
                    blue: 0.8
                  },
                  textFormat: {
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          // Format Supporter header
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 4 + leaders.length + 1,
                endRowIndex: 4 + leaders.length + 2,
                startColumnIndex: 0,
                endColumnIndex: 10
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
          },
          // Format Supporter criteria header
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 4 + leaders.length + 2,
                endRowIndex: 4 + leaders.length + 3,
                startColumnIndex: 0,
                endColumnIndex: supporterCriteria.length + 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.8,
                    green: 0.85,
                    blue: 0.95
                  },
                  textFormat: {
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          // Format Admin Statistics header
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 4 + leaders.length + supporters.length + 5,
                endRowIndex: 4 + leaders.length + supporters.length + 6,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.3,
                    green: 0.3,
                    blue: 0.3
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
          },
          // Format Admin Statistics data
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 4 + leaders.length + supporters.length + 6,
                endRowIndex: 4 + leaders.length + supporters.length + 6 + Object.keys(evaluationCountByAdmin).length,
                startColumnIndex: 0,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.95,
                    green: 0.95,
                    blue: 0.95
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor)'
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
    console.error('Error updating evaluation sheet:', error);
    process.exit(1);
  }
}

// Run the script
updateEvaluationSheet();
