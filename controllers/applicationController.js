import Application from "../models/applicationModel.js";
import User from "../models/User.js"; // Assuming User model path

// Submit a new application
export const submitApplication = async (req, res) => {
	try {
		const { applicationType, applicantId } = req.body;

		const previousApplication = await Application.findOne({
			applicantId: applicantId,
			applicationType: applicationType,
		});

		if (previousApplication) {
			if (previousApplication?.status === "approved") {
				return res
					.status(400)
					.json({ success: false, message: "Application already approved" });
			} else if (previousApplication?.status === "rejected") {
				return res
					.status(400)
					.json({ success: false, message: "Application already rejected" });
			} else if (previousApplication?.status === "in-review") {
				return res
					.status(400)
					.json({ success: false, message: "Application already in review" });
			}
			return res.status(400).json({
				success: false,
				message:
					"Your Application is pending. Don't make duplicate applications.",
			});
		}

		const newApplication = new Application({
			...req.body,
		});

		await newApplication.save();
		res.status(201).json({
			success: true,
			message: "Application submitted successfully!",
			application: newApplication,
		});
	} catch (error) {
		console.error("Error submitting application:", error);
		res.status(500).json({
			success: false,
			message: "Server error while submitting application.",
			error: error.message,
		});
	}
};