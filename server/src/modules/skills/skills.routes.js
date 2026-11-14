const { Router } = require('express');
const skillsController = require('./skills.controller');

const router = Router();

router.get('/', skillsController.getSkills);

module.exports = router;
