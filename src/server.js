require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

const assignRouter = require('./routes/assign')

app.use('/assign-secret-santa', assignRouter)

// ✅ Connect to MongoDB & Start Server Only on Success
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('✅ MongoDB Connected')
		app.listen(process.env.PORT, () => {
			console.log(`🚀 Server running on port ${process.env.PORT}`)
		})
	})
	.catch((err) => {
		console.error('❌ MongoDB Connection Error:', err)
		process.exit(1) // Stop server if DB connection fails
	})
