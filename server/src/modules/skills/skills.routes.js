const { Router } = require('express');
const skillsController = require('./skills.controller');

const router = Router();

// Public catalog endpoint
router.get('/', skillsController.getSkills);

module.exports = router;
