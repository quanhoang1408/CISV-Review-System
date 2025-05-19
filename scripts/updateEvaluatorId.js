// scripts/updateEvaluatorId.js
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  updateEvaluatorIds();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Định nghĩa schema cho Evaluation
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

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// Hàm chính để cập nhật evaluatorId
async function updateEvaluatorIds() {
  try {
    // ID cần thay đổi - đã được cố định theo yêu cầu
    const oldEvaluatorId = '67e52b2ace988ef5b97d200b';
    const newEvaluatorId = '68278db7c742661857c5badf';

    console.log('='.repeat(50));
    console.log('SCRIPT CẬP NHẬT EVALUATOR ID');
    console.log('='.repeat(50));
    console.log(`Đang tìm kiếm các đánh giá có evaluatorId: ${oldEvaluatorId}`);
    console.log(`Sẽ cập nhật thành evaluatorId mới: ${newEvaluatorId}`);
    console.log('-'.repeat(50));

    // Tìm tất cả đánh giá có evaluatorId cần thay đổi
    const evaluations = await Evaluation.find({
      evaluatorId: new ObjectId(oldEvaluatorId)
    });

    console.log(`Tìm thấy ${evaluations.length} đánh giá cần cập nhật`);

    if (evaluations.length === 0) {
      console.log('Không tìm thấy đánh giá nào cần cập nhật.');
      await mongoose.disconnect();
      return;
    }

    // Hiển thị một số đánh giá đầu tiên để kiểm tra
    console.log('\nMẫu các đánh giá sẽ được cập nhật:');
    for (let i = 0; i < Math.min(3, evaluations.length); i++) {
      const eval = evaluations[i];
      console.log(`Đánh giá ${i+1}:`, {
        id: eval._id.toString(),
        participantId: eval.participantId.toString(),
        evaluatorId: eval.evaluatorId.toString(),
        criteriaCount: eval.criteria.length,
        createdAt: eval.createdAt
      });
    }

    // Xác nhận trước khi cập nhật
    console.log(`\nBạn có chắc chắn muốn cập nhật ${evaluations.length} đánh giá không?`);
    console.log(`EvaluatorId cũ: ${oldEvaluatorId}`);
    console.log(`EvaluatorId mới: ${newEvaluatorId}`);
    console.log('\nNhấn Ctrl+C để hủy hoặc đợi 5 giây để tiếp tục...');

    // Đợi 5 giây trước khi tiếp tục
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Cập nhật tất cả đánh giá
    const updateResult = await Evaluation.updateMany(
      { evaluatorId: new ObjectId(oldEvaluatorId) },
      { $set: { evaluatorId: new ObjectId(newEvaluatorId) } }
    );

    console.log('\nCập nhật hoàn tất!');
    console.log(`Tìm thấy ${updateResult.matchedCount} đánh giá`);
    console.log(`Đã cập nhật ${updateResult.modifiedCount} đánh giá`);

    // Kiểm tra lại sau khi cập nhật
    const remainingEvaluations = await Evaluation.find({
      evaluatorId: new ObjectId(oldEvaluatorId)
    });

    console.log(`\nĐánh giá còn lại với evaluatorId cũ: ${remainingEvaluations.length}`);

    const updatedEvaluations = await Evaluation.find({
      evaluatorId: new ObjectId(newEvaluatorId)
    });

    console.log(`Đánh giá với evaluatorId mới: ${updatedEvaluations.length}`);

    // Ngắt kết nối MongoDB
    await mongoose.disconnect();
    console.log('\nĐã ngắt kết nối từ MongoDB');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Lỗi khi cập nhật evaluatorIds:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
