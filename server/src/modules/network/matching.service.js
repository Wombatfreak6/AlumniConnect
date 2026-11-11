const { prisma } = require('../../config/database');
const { MATCHING_WEIGHTS, STOP_WORDS } = require('./matching.constants');

// ============================================================================
// PURE UTILITY & SCORING FUNCTIONS (Independently testable)
// ============================================================================

/**
 * Normalizes text to lowercase and trims surrounding whitespace.
 */
function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

/**
 * Tokenizes text into a set of meaningful, lowercased keywords.
 * Removes common stop-words and tokens under 3 characters.
 */
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

/**
 * Detects canonical skills mentioned in text (job title, description, or bio).
 * Uses case-insensitive whole-word boundary matching.
 */
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

/**
 * 1. SKILL OVERLAP (Max: 50 points)
 * Formula: (matching skills / total required skills) * 50
 */
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

/** Alumni relevance uses the share of a student's skills represented by the alumnus. */
function calculateAlumniSkillScore(studentSkills = [], alumniSkills = []) {
  if (!Array.isArray(studentSkills) || studentSkills.length === 0 || !Array.isArray(alumniSkills)) {
    return { score: 0, matchedSkills: [], totalStudentSkills: 0 };
  }
  const alumniSet = new Set(alumniSkills.map((skill) => normalizeText(skill)));
  const matchedSkills = studentSkills.filter((skill) => alumniSet.has(normalizeText(skill)));
  return {
    score: Math.round((matchedSkills.length / studentSkills.length) * MATCHING_WEIGHTS.SKILLS),
    matchedSkills,
    totalStudentSkills: studentSkills.length,
  };
}

/**
 * 2. ACADEMIC BRANCH ALIGNMENT (Max: 30 points)
 * Exact normalized match = 30 points, no match = 0 points.
 */
function calculateBranchScore(studentBranch, targetBranch) {
  const normStudent = normalizeText(studentBranch);
  const normTarget = normalizeText(targetBranch);

  if (!normStudent || !normTarget) {
    return 0;
  }

  if (normStudent === normTarget) {
    return MATCHING_WEIGHTS.BRANCH;
  }

  // Common academic department alias normalizations
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

/**
 * 3. INDUSTRY / CAREER INTEREST (Max: 20 points)
 * Meaningful normalized keyword overlap between student's career aspirations
 * and the opportunity/alumni context.
 */
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

  // Exact direct match on industry name if provided
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

/**
 * Generates human-readable, transparent reasoning for the match.
 */
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

// ============================================================================
// DATABASE-DRIVEN MATCHING METHODS
// ============================================================================

/**
 * Retrieves the student profile and associated skills for matching.
 */
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

/**
 * GET /api/jobs/recommendations
 * Matches and ranks available jobs for the currently authenticated student.
 */
async function getJobRecommendations(studentId, { minScore = 1, limit = 20 } = {}) {
  const { profile: studentProfile, skills: studentSkills } =
    await getStudentMatchingContext(studentId);

  // 1. Fetch canonical skill catalog for text extraction
  const canonicalSkills = await prisma.skill.findMany({
    select: { name: true },
  });

  // 2. Fetch all active job postings with poster details
  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
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

  // 3. Compute score for each job
  const recommendations = [];

  for (const job of jobs) {
    const posterProfile = job.postedBy?.profile || {};

    // A. Detect required skills from job title and description
    const textToScan = `${job.title} ${job.description}`;
    let requiredSkills = detectSkillsInText(textToScan, canonicalSkills);

    // If job has no detected skills, consider student's own skills that might appear
    if (requiredSkills.length === 0 && studentSkills.length > 0) {
      requiredSkills = detectSkillsInText(textToScan, studentSkills);
    }

    const { score: skillScore, matchedSkills } = calculateSkillScore(
      studentSkills,
      requiredSkills
    );

    // B. Academic branch alignment
    const branchScore = calculateBranchScore(studentProfile.branch, posterProfile.branch);

    // C. Industry and career interest
    const industryScore = calculateIndustryScore(studentProfile, {
      company: job.company,
      title: job.title,
      description: job.description,
      industry: posterProfile.industry,
    });

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

  // 4. Sort descending by matchScore
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations.slice(0, limit);
}

/**
 * GET /api/network/matches
 * Matches and ranks alumni peers for networking based on skill, branch, and industry.
 */
async function getAlumniMatches(studentId, { minScore = 1, limit = 20 } = {}) {
  const { profile: studentProfile, skills: studentSkills } =
    await getStudentMatchingContext(studentId);

  // Fetch all active alumni (excluding the calling student)
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

    // A. Skill overlap against alumni's skills
    const { score: skillScore, matchedSkills } = calculateAlumniSkillScore(
      studentSkills,
      alumniSkills
    );

    // B. Academic branch alignment
    const branchScore = calculateBranchScore(studentProfile.branch, alumniProfile.branch);

    // C. Industry and career interest
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

  // Sort descending by matchScore
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches.slice(0, limit);
}

module.exports = {
  // Pure utilities for unit testing
  normalizeText,
  extractKeywords,
  detectSkillsInText,
  calculateSkillScore,
  calculateAlumniSkillScore,
  calculateBranchScore,
  calculateIndustryScore,
  generateMatchReason,
  // Database service operations
  getJobRecommendations,
  getAlumniMatches,
};

