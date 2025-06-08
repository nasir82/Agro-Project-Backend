import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin with service account if available
const initializeFirebaseAdmin = () => {
	try {
		if (admin.apps.length === 0) {
			if (process.env.FIREBASE_SERVICE_ACCOUNT) {
				const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount),
				});
			} else {
				admin.initializeApp();
			}
		}
		return admin;
	} catch (error) {
		console.error("Firebase admin initialization error:", error);
		throw error;
	}
};

export default initializeFirebaseAdmin;
