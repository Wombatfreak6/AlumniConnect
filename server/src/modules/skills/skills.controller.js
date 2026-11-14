const skillsService = require('./skills.service');

async function getSkills(req, res, next) {
  try {
    const search = req.query.search || '';
    const skills = await skillsService.getAllSkills(search);

    res.status(200).json({
      success: true,
      message: 'Skills retrieved successfully',
      data: {
        skills,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSkills,
};
