const matchingService = require('./matching.service');

async function getJobRecommendations(req, res, next) {
  try {
    const studentId = req.user.id;
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const parsedMinScore = Number.parseInt(req.query.minScore, 10);
    const minScore = Number.isFinite(parsedMinScore) ? Math.max(0, Math.min(100, parsedMinScore)) : 1;

    const recommendations = await matchingService.getJobRecommendations(studentId, {
      limit,
      minScore,
    });

    return res.status(200).json({
      success: true,
      message: 'Job recommendations generated successfully.',
      data: recommendations,
    });
  } catch (err) {
    next(err);
  }
}

async function getAlumniMatches(req, res, next) {
  try {
    const studentId = req.user.id;
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const parsedMinScore = Number.parseInt(req.query.minScore, 10);
    const minScore = Number.isFinite(parsedMinScore) ? Math.max(0, Math.min(100, parsedMinScore)) : 1;

    const matches = await matchingService.getAlumniMatches(studentId, {
      limit,
      minScore,
    });

    return res.status(200).json({
      success: true,
      message: 'Alumni network matches generated successfully.',
      data: matches,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getJobRecommendations,
  getAlumniMatches,
};

