const mongoose = require('mongoose')

const SecretSantaAssignmentSchema = new mongoose.Schema(
	{
		year: Number,
		giverName: { type: String, required: true },
		giverEmail: { type: String, required: true },
		receiverName: { type: String, required: true },
		receiverEmail: { type: String, required: true }
	},
	{ collection: 'SecretSantaAssignment' } // Ensure correct collection name
)

module.exports = mongoose.model(
	'SecretSantaAssignment',
	SecretSantaAssignmentSchema
)
