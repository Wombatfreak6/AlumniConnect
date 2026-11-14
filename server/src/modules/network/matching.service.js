const { prisma } = require('../../config/database');
const { MATCHING_WEIGHTS, STOP_WORDS } = require('./matching.constants');

// Scoring helpers. Each one is pure, so they are easy to test in isolation.
function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

// Drops stop-words and very short tokens so only meaningful keywords remain.
function extractKeywords(text) {
  if (!text || typeof text !== 'string') return new Set();
  
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

  return new Set(tokens);
}

// Case-insensitive whole-word check so "Java" does not match inside "JavaScript".
function detectSkillsInText(text, skillCatalog = []) {
  if (!text || typeof text !== 'string' || !Array.isArray(skillCatalog)) return [];

  const lowerText = ` ${text.toLowerCase()} `;
  const detected = [];

  for (const skill of skillCatalog) {
    const skillName = typeof skill === 'string' ? skill : skill.name;
    if (!skillName) continue;

    const lowerSkill = skillName.trim().toLowerCase();
    if (!lowerSkill) continue;

    // Escape regex special chars except + and # (for C++, C#)
    const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');

    if (regex.test(lowerText)) {
      detected.push(lowerSkill);
    }
  }

  return Array.from(new Set(detected));
}

// Skill score (max 50): matching skills / required skills, scaled to 50.
function calculateSkillScore(studentSkills = [], requiredSkills = []) {
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      totalRequired: 0,
    };
  }

  const studentSet = new Set(studentSkills.map((s) => normalizeText(s)));
  const matched = [];

  for (const skill of requiredSkills) {
    const normalized = normalizeText(skill);
    if (studentSet.has(normalized)) {
      matched.push(skill);
    }
  }

  const ratio = matched.length / requiredSkills.length;
  const score = Math.min(MATCHING_WEIGHTS.SKILLS, Math.round(ratio * MATCHING_WEIGHTS.SKILLS));

  return {
    score,
    matchedSkills: matched,
    totalRequired: requiredSkills.length,
  };
}

// Branch score (max 30): exact normalized match only, otherwise 0.
function calculateBranchScore(studentBranch, targetBranch) {
  const normStudent = normalizeText(studentBranch);
  const normTarget = normalizeText(targetBranch);

  if (!normStudent || !normTarget) {
    return 0;
  }

  if (normStudent === normTarget) {
    return MATCHING_WEIGHTS.BRANCH;
  }

  const aliases = {
    'cse': 'computer science',
    'cs': 'computer science',
    'computer science and engineering': 'computer science',
    'it': 'information technology',
    'ece': 'electronics and communication',
    'eee': 'electrical engineering',
    'me': 'mechanical engineering',
  };

  const resolvedStudent = aliases[normStudent] || normStudent;
  const resolvedTarget = aliases[normTarget] || normTarget;

  if (resolvedStudent === resolvedTarget) {
    return MATCHING_WEIGHTS.BRANCH;
  }

  return 0;
}

// Industry score (max 20): overlap between career goals and the opportunity context.
function calculateIndustryScore(studentProfile = {}, targetContext = {}) {
  const studentGoals = studentProfile.careerGoals || '';
  const studentIndustry = studentProfile.industry || '';

  const studentKeywords = new Set([
    ...extractKeywords(studentGoals),
    ...extractKeywords(studentIndustry),
  ]);

  if (studentKeywords.size === 0) {
    return 0;
  }

  const targetText = [
    targetContext.company,
    targetContext.industry,
    targetContext.description,
    targetContext.title,
    targetContext.designation,
  ]
    .filter(Boolean)
    .join(' ');

  const targetKeywords = extractKeywords(targetText);

  if (
    studentIndustry &&
    targetContext.industry &&
    normalizeText(studentIndustry) === normalizeText(targetContext.industry)
  ) {
    return MATCHING_WEIGHTS.INDUSTRY;
  }

  let matchCount = 0;
  for (const keyword of studentKeywords) {
    if (targetKeywords.has(keyword)) {
      matchCount += 1;
    }
  }

  if (matchCount === 0) {
    return 0;
  }

  const ratio = matchCount / studentKeywords.size;
  return Math.min(MATCHING_WEIGHTS.INDUSTRY, Math.round(ratio * MATCHING_WEIGHTS.INDUSTRY));
}

function generateMatchReason({ skillScore, branchScore, industryScore, matchedSkills, branchName }) {
  const parts = [];

  if (skillScore >= 25 && matchedSkills.length > 0) {
    parts.push(`Strong skill overlap (${matchedSkills.join(', ')})`);
  } else if (skillScore > 0 && matchedSkills.length > 0) {
    parts.push(`Skill match in ${matchedSkills.join(', ')}`);
  }

  if (branchScore > 0 && branchName) {
    parts.push(`identical academic branch in ${branchName}`);
  }

  if (industryScore >= 15) {
    parts.push('strong career and industry alignment');
  } else if (industryScore > 0) {
    parts.push('aligned career interest');
  }

  if (parts.length === 0) {
    return 'General opportunity with baseline collegiate relevance';
  }

  return parts.join(' and ');
}

async function getStudentMatchingContext(studentId) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
      userSkills: {
        include: { skill: true },
      },
    },
  });

  if (!student) {
    const error = new Error('Student account not found.');
    error.statusCode = 404;
    throw error;
  }

  const studentSkills = (student.userSkills || []).map((us) => us.skill.name);

  return {
    student,
    profile: student.profile || {},
    skills: studentSkills,
  };
}

async function getJobRecommendations(studentId, { minScore = 0, limit = 20 } = {}) {
  const { profile: studentProfile, skills: studentSkills } =
    await getStudentMatchingContext(studentId);

  const canonicalSkills = await prisma.skill.findMany({
    select: { name: true },
  });

  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              company: true,
              designation: true,
              industry: true,
              branch: true,
              college: true,
            },
          },
        },
      },
    },
  });

  const recommendations = [];

  for (const job of jobs) {
    const posterProfile = job.postedBy?.profile || {};

    const textToScan = `${job.title} ${job.description}`;
    let requiredSkills = detectSkillsInText(textToScan, canonicalSkills);

    // Agar job text se koi skill detect nahi hui, student ki skills se dobara try karte hain.
    if (requiredSkills.length === 0 && studentSkills.length > 0) {
      requiredSkills = detectSkillsInText(textToScan, studentSkills);
    }

    const { score: skillScore, matchedSkills } = calculateSkillScore(
      studentSkills,
      requiredSkills
    );

    const branchScore = calculateBranchScore(studentProfile.branch, posterProfile.branch);

    const industryScore = calculateIndustryScore(studentProfile, {
      company: job.company,
      title: job.title,
      description: job.description,
      industry: posterProfile.industry,
    });

    // Teenon scores ko jodkar final match percentage nikalte hain.
    const totalScore = Math.min(100, skillScore + branchScore + industryScore);

    if (totalScore >= minScore) {
      recommendations.push({
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        deadline: job.deadline,
        matchScore: totalScore,
        matchedSkills,
        requiredSkillsDetected: requiredSkills,
        reason: generateMatchReason({
          skillScore,
          branchScore,
          industryScore,
          matchedSkills,
          branchName: posterProfile.branch || studentProfile.branch,
        }),
        breakdown: {
          skillScore,
          branchScore,
          industryScore,
        },
        postedBy: {
          id: job.postedBy.id,
          name: job.postedBy.name,
          designation: posterProfile.designation || null,
          company: posterProfile.company || null,
        },
      });
    }
  }

  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations.slice(0, limit);
}

async function getAlumniMatches(studentId, { minScore = 0, limit = 20 } = {}) {
  const { profile: studentProfile, skills: studentSkills } =
    await getStudentMatchingContext(studentId);

  const alumniList = await prisma.user.findMany({
    where: {
      role: 'ALUMNI',
      isActive: true,
      id: { not: studentId },
    },
    include: {
      profile: true,
      userSkills: {
        include: { skill: true },
      },
    },
  });

  const matches = [];

  for (const alumni of alumniList) {
    const alumniProfile = alumni.profile || {};
    const alumniSkills = (alumni.userSkills || []).map((us) => us.skill.name);

    const { score: skillScore, matchedSkills } = calculateSkillScore(
      studentSkills,
      alumniSkills
    );

    const branchScore = calculateBranchScore(studentProfile.branch, alumniProfile.branch);
    const industryScore = calculateIndustryScore(studentProfile, {
      company: alumniProfile.company,
      designation: alumniProfile.designation,
      industry: alumniProfile.industry,
    });

    const totalScore = Math.min(100, skillScore + branchScore + industryScore);

    if (totalScore >= minScore) {
      matches.push({
        alumniId: alumni.id,
        name: alumni.name,
        email: alumni.email,
        company: alumniProfile.company || null,
        designation: alumniProfile.designation || null,
        industry: alumniProfile.industry || null,
        branch: alumniProfile.branch || null,
        college: alumniProfile.college || null,
        graduationYear: alumniProfile.graduationYear || null,
        bio: alumniProfile.bio || null,
        linkedinUrl: alumniProfile.linkedinUrl || null,
        skills: alumniSkills,
        matchScore: totalScore,
        matchedSkills,
        reason: generateMatchReason({
          skillScore,
          branchScore,
          industryScore,
          matchedSkills,
          branchName: alumniProfile.branch || studentProfile.branch,
        }),
        breakdown: {
          skillScore,
          branchScore,
          industryScore,
        },
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches.slice(0, limit);
}

module.exports = {
  normalizeText,
  extractKeywords,
  detectSkillsInText,
  calculateSkillScore,
  calculateBranchScore,
  calculateIndustryScore,
  generateMatchReason,
  getJobRecommendations,
  getAlumniMatches,
};

