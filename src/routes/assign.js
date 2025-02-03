const express = require('express')
const SecretSantaAssignment = require('../models/SecretSantaAssignment')

const router = express.Router()

// API to Assign Secret Santa
router.post('/generate/:year', async (req, res) => {
	try {
		const year = parseInt(req.params.year)
		const employees = req.body.employees

		if (employees.length < 2) {
			return res.status(400).json({ message: 'At least 2 employees required!' })
		}

		// Fetch previous year's assignments
		const previousAssignments = await SecretSantaAssignment.find({
			year: year - 1
		})
		const previousPairs = new Map(
			previousAssignments.map((pa) => [pa.giverEmail, pa.receiverEmail])
		)

		// Shuffle employees randomly
		let shuffledEmployees = [...employees].sort(() => Math.random() - 0.5)

		// Rotate the shuffled array for assignments
		let receivers = [...shuffledEmployees]
		receivers.push(receivers.shift()) // Shift by one place

		// Create initial assignments
		let assignments = shuffledEmployees.map((giver, i) => ({
			year,
			giverName: giver.name,
			giverEmail: giver.email,
			receiverName: receivers[i].name,
			receiverEmail: receivers[i].email
		}))

		// Ensure no one is assigned to themselves
		assignments = assignments.map((assignment, i) => {
			// If giver is assigned to themselves, find a valid receiver
			while (assignment.giverEmail === assignment.receiverEmail) {
				let newReceiverIndex = (i + 1) % assignments.length
				assignment.receiverEmail = assignments[newReceiverIndex].receiverEmail
				assignment.receiverName = assignments[newReceiverIndex].receiverName
			}
			return assignment
		})

		// Swap if previous assignments are detected
		for (let i = 0; i < assignments.length; i++) {
			if (
				previousPairs.get(assignments[i].giverEmail) ===
				assignments[i].receiverEmail
			) {
				// Find a valid swap candidate
				let swapIndex = -1
				for (let j = 0; j < assignments.length; j++) {
					if (
						j !== i && // Don't swap with itself
						assignments[j].receiverEmail !== assignments[i].giverEmail && // Avoid creating a self-assignment
						previousPairs.get(assignments[j].giverEmail) !==
							assignments[i].receiverEmail && // Avoid creating a previous year pair
						previousPairs.get(assignments[i].giverEmail) !==
							assignments[j].receiverEmail // Avoid creating a previous year pair
					) {
						swapIndex = j
						break
					}
				}

				if (swapIndex !== -1) {
					// Swap receivers
					;[assignments[i].receiverName, assignments[swapIndex].receiverName] =
						[assignments[swapIndex].receiverName, assignments[i].receiverName]
					;[
						assignments[i].receiverEmail,
						assignments[swapIndex].receiverEmail
					] = [
						assignments[swapIndex].receiverEmail,
						assignments[i].receiverEmail
					]
				} else {
					// If no valid swap is found, reshuffle and retry
					return router.post('/generate/:year', req, res)
				}
			}
		}

		// Store Assignments in Database
		await SecretSantaAssignment.deleteMany({ year }) // Remove old assignments for this year
			.then(async () => {
				await SecretSantaAssignment.insertMany(assignments)
			})
			.catch((err) => {
				console.log('Error clearing previous records', err)
			})

		res.json(assignments)
	} catch (error) {
		res.status(500).json({ message: error.message })
	}
})

module.exports = router
