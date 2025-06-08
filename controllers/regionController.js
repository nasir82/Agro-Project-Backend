// Static data for Bangladesh regions and districts
import regionsData from '../data/regions.js';

// Get all regions with districts
export const getRegions = async (req, res) => {
	try {
		res.status(200).json({
			success: true,
			regions: regionsData,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
