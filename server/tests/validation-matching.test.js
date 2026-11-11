const test = require('node:test');
const assert = require('node:assert/strict');
const { validateJobListQuery, validateJobPost } = require('../src/modules/jobs/jobs.validation');
const { validateSkillInput, validateProfileUpdate } = require('../src/modules/users/users.validation');
const {
  calculateSkillScore,
  calculateAlumniSkillScore,
  calculateBranchScore,
  calculateIndustryScore,
  detectSkillsInText,
} = require('../src/modules/network/matching.service');

test('job filters are sanitized and preserved for the service query', () => {
  const result = validateJobListQuery({ page: '2', limit: '20', location: '  Toronto ', skill: ' React ' });
  assert.equal(result.page, 2);
  assert.equal(result.filters.location, 'Toronto');
  assert.equal(result.filters.skill, 'React');
});

test('job creation rejects missing required fields and accepts a valid complete payload', () => {
  assert.equal(validateJobPost({ title: 'Engineer' }).isValid, false);
  const valid = validateJobPost({
    title: 'Software Engineer', description: 'Build useful products with our engineering team.',
    company: 'Example Inc', location: 'Toronto', employmentType: 'FULL_TIME', experienceLevel: 'ENTRY',
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.sanitized.title, 'Software Engineer');
});

test('LinkedIn URLs are constrained to LinkedIn profile/company/school hosts', () => {
  assert.equal(validateProfileUpdate({ linkedinUrl: 'https://www.linkedin.com/in/example-user' }).isValid, true);
  assert.equal(validateProfileUpdate({ linkedinUrl: 'https://linkedin.example.com/in/example-user' }).isValid, false);
  assert.equal(validateProfileUpdate({ linkedinUrl: 'https://linkedin.com.evil.test/in/example-user' }).isValid, false);
});

test('skill input accepts a name and rejects an empty payload', () => {
  assert.equal(validateSkillInput({ name: 'React' }).isValid, true);
  assert.equal(validateSkillInput({}).isValid, false);
});

test('job matching uses required-skill denominator and exact skill names', () => {
  const result = calculateSkillScore(['React', 'Node.js'], ['React', 'Node.js', 'PostgreSQL', 'Docker']);
  assert.equal(result.score, 25);
  assert.deepEqual(result.matchedSkills, ['React', 'Node.js']);
});

test('alumni matching uses student skills as denominator', () => {
  const result = calculateAlumniSkillScore(['React', 'Node.js', 'SQL', 'Python'], ['react', 'python']);
  assert.equal(result.score, 25);
  assert.deepEqual(result.matchedSkills, ['React', 'Python']);
});

test('branch aliases and industry overlap contribute relevant scores', () => {
  assert.equal(calculateBranchScore('CSE', 'Computer Science'), 30);
  assert.ok(calculateIndustryScore({ industry: 'Fintech', careerGoals: 'financial technology' }, { industry: 'Fintech', company: 'Example' }) > 0);
});

test('text skill detection respects token boundaries', () => {
  assert.deepEqual(detectSkillsInText('We use C++ and React daily.', ['C++', 'React', 'Java']), ['c++', 'react']);
});
