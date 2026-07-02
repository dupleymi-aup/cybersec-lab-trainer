// Centralized data exports — split from security-data.ts for better maintainability
export { owaspItems } from "./owasp-data";
export { sqlChallenges } from "./sql-data";
export { xssTypes } from "./xss-data";
export {
  attackSteps,
  defenseMechanisms,
  csrfChallenges,
  realWorldExamples,
} from "./csrf-data";
export { quizQuestions, quizCategories } from "./quiz-data";
export type { QuizQuestion } from "./quiz-data";
export { modules } from "./modules-data";
export { secureCodingChallenges } from "./secure-coding-data";
export { securityHeaders } from "./security-headers-data";
export type { SecurityHeader } from "./security-headers-data";
export { achievements, isAchievementUnlocked } from "./achievements-data";
export { glossaryTerms } from "./glossary-data";
export { idorScenarios, idorDefenseMechanisms } from "./idor-data";
export type { IDORScenario } from "./idor-data";
export { ssrfScenarios, ssrfDefenseMechanisms } from "./ssrf-data";
export type { SSRFScenario } from "./ssrf-data";
export { apiSecurityTopics } from "./api-security-data";
export { phishingEmails, phishingEducationContent } from "./phishing-data";
export type { PhishingEmail, PhishingIndicator } from "./phishing-data";
export { careerPaths, skillLevels, industryDemand } from "./career-paths-data";
export type { CareerPath } from "./career-paths-data";
