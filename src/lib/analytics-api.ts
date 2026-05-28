import type {
  TrendPoint, QuizQuestionStat, AchievementStat, AdminSummary,
  HeatmapData, ModulePerformance, ProgressDynamicsDay, AtRiskStudent,
  GroupComparisonDimension, QuizCategoryStat, ComprehensiveSummary,
  StudentPerformanceData, StudentComparisonData, GradebookData,
  EngagementData, LearningPathEntry, QuizTrajectoryPoint,
  CohortAnalysisData, QuizAttemptData,
  ModuleDeepDiveData, CertificationReadinessData, LearningVelocityData,
  QuizSessionData, GroupDynamicsData, LoginPatternsData, QuizDifficultyData,
  QuizRetryData, ErrorPatternsData, PredictiveRiskData, ScheduledReport,
  DataQualityData,
} from './auth-types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { useAuthStore } = await import('./auth-store');
    const { token } = useAuthStore.getState();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[analytics-api] getAuthHeaders failed:', e);
    return { 'Content-Type': 'application/json' };
  }
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const csrfToken = typeof document !== 'undefined'
    ? document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1]
    : undefined;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
      ...(csrfToken && { 'x-csrf-token': csrfToken }),
    },
  });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API error: ${res.status}`);
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res;
}

export async function getProgressTrends(userId?: string, dateRange: string = '30d', groupId?: string): Promise<TrendPoint[]> {
  try {
    const params = new URLSearchParams({ dateRange });
    if (userId) params.set('userId', userId);
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/progress-trends?${params}`);
    const data = await res.json();
    return data.trends || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getProgressTrends failed:", e);
    return [];
  }
}

export async function getQuizQuestionAnalytics(category?: string, difficulty?: string): Promise<QuizQuestionStat[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    const res = await apiFetch(`/api/analytics/quiz-questions?${params}`);
    const data = await res.json();
    return data.questions || [];
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[analytics-api] getProgressTrends failed:', e);
    return [];
  }
}

export async function getAchievementAnalytics(groupId?: string): Promise<AchievementStat[]> {
  try {
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/achievements?${params}`);
    const data = await res.json();
    return data.achievements || [];
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[analytics-api] getAchievementAnalytics failed:', e);
    return [];
  }
}

export async function getAdminSummary(groupBy?: string): Promise<AdminSummary> {
  try {
    const params = new URLSearchParams();
    if (groupBy) params.set('groupBy', groupBy);
    const res = await apiFetch(`/api/analytics/admin-summary?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getAdminSummary failed:", e);
    return {
      current: { totalStudents: 0, activeStudents: 0, activePercentage: 0, avgCompletionRate: 0, avgQuizScore: 0, totalQuizAttempts: 0, totalLoginAttempts: 0 },
      previous: { totalStudents: 0, activeStudents: 0, activePercentage: 0, avgCompletionRate: 0, avgQuizScore: 0, totalQuizAttempts: 0, totalLoginAttempts: 0 },
      trends: { students: 'stable', activity: 'stable', completion: 'stable', quizScore: 'stable' },
    };
  }
}

export async function getActivityHeatmap(userId?: string, dateRange: string = '90d'): Promise<HeatmapData> {
  try {
    const params = new URLSearchParams({ dateRange });
    if (userId) params.set('userId', userId);
    const res = await apiFetch(`/api/analytics/activity-heatmap?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getActivityHeatmap failed:", e);
    return { dailyActivity: [], hourlyActivity: [], weeklyActivity: [], totalActivities: 0, mostActiveDay: '', mostActiveHour: 0, streakDays: 0 };
  }
}

export async function saveProgressSnapshot(moduleId: string, score: number, completed: boolean, userId?: string): Promise<{ success: boolean }> {
  try {
    const body: Record<string, unknown> = { moduleId, score, completed };
    if (userId) body.userId = userId;
    const res = await apiFetch('/api/analytics/progress-snapshot', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] saveProgressSnapshot failed:", e);
    return { success: false };
  }
}

export async function saveQuizAttempts(quizId: string, attempts: QuizAttemptData[]): Promise<{ success: boolean }> {
  try {
    const res = await apiFetch('/api/quiz', {
      method: 'POST',
      body: JSON.stringify({ quizId, attempts }),
    });
    return await res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] saveQuizAttempts failed:", e);
    return { success: false };
  }
}

export async function getModulePerformance(days = 30, groupId?: string): Promise<ModulePerformance[]> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/module-performance?${params}`);
    const data = await res.json();
    return data.modules || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getModulePerformance failed:", e);
    return [];
  }
}

export async function getProgressDynamics(days = 30, groupId?: string): Promise<{ daily: ProgressDynamicsDay[]; summary: { totalModulesCompleted: number; totalQuizAttempts: number; avgDailyActive: number; trend: 'up' | 'down' | 'stable' } }> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/progress-dynamics?${params}`);
    const data = await res.json();
    return { daily: data.daily || [], summary: data.summary || { totalModulesCompleted: 0, totalQuizAttempts: 0, avgDailyActive: 0, trend: 'stable' as const } };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getProgressDynamics failed:", e);
    return { daily: [], summary: { totalModulesCompleted: 0, totalQuizAttempts: 0, avgDailyActive: 0, trend: 'stable' as const } };
  }
}

export async function getAtRiskStudents(days = 30, groupId?: string): Promise<{ atRiskStudents: AtRiskStudent[]; summary: { totalStudents: number; atRiskCount: number; atRiskPercentage: number; criticalCount: number } }> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/at-risk?${params}`);
    const data = await res.json();
    return { atRiskStudents: data.atRiskStudents || [], summary: data.summary || { totalStudents: 0, atRiskCount: 0, atRiskPercentage: 0, criticalCount: 0 } };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getAtRiskStudents failed:", e);
    return { atRiskStudents: [], summary: { totalStudents: 0, atRiskCount: 0, atRiskPercentage: 0, criticalCount: 0 } };
  }
}

export async function getGroupComparison(days = 30, dimension = 'group', groupId?: string): Promise<{ dimensions: GroupComparisonDimension[]; rankings: { byCompletion: Array<{ name: string; value: number }>; byQuizScore: Array<{ name: string; value: number }>; byActivity: Array<{ name: string; value: number }> } }> {
  try {
    const params = new URLSearchParams({ days: String(days), dimension });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/group-comparison?${params}`);
    const data = await res.json();
    return { dimensions: data.dimensions || [], rankings: data.rankings || { byCompletion: [], byQuizScore: [], byActivity: [] } };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getGroupComparison failed:", e);
    return { dimensions: [], rankings: { byCompletion: [], byQuizScore: [], byActivity: [] } };
  }
}

export async function getQuizCategoryAnalytics(days = 30, groupId?: string): Promise<{ categories: QuizCategoryStat[]; hardestQuestions: Array<{ questionId: string; questionText: string; category: string; correctRate: number; attempts: number }> }> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/quiz-categories?${params}`);
    const data = await res.json();
    return { categories: data.categories || [], hardestQuestions: data.hardestQuestions || [] };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getQuizCategoryAnalytics failed:", e);
    return { categories: [], hardestQuestions: [] };
  }
}

export async function getComprehensiveSummary(days = 30, groupId?: string): Promise<ComprehensiveSummary> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/comprehensive-summary?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getComprehensiveSummary failed:", e);
    return {
      kpis: { totalStudents: 0, activeStudents: 0, activePercentage: 0, avgCompletionRate: 0, avgQuizScore: 0, totalModulesCompleted: 0, totalQuizAttempts: 0, engagementScore: 0 },
      trends: { students: 'stable', activity: 'stable', completion: 'stable', quizScore: 'stable' },
      previousKpis: { totalStudents: 0, activeStudents: 0, activePercentage: 0, avgCompletionRate: 0, avgQuizScore: 0, totalModulesCompleted: 0, totalQuizAttempts: 0, engagementScore: 0 },
      moduleDistribution: [],
      scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0, notAttempted: 0 },
      topPerformers: [],
      recentActivity: [],
    };
  }
}

export async function getStudentPerformance(userId: string, days = 30): Promise<StudentPerformanceData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    const res = await apiFetch(`/api/analytics/student/${userId}?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getStudentPerformance failed:", e);
    return {
      profile: { id: '', fullName: '', email: '', group: '', course: '', university: '', avatar: '', role: '', createdAt: '', lastLoginAt: null, loginCount: 0 },
      kpis: { modulesCompleted: 0, totalModules: 0, avgQuizScore: 0, totalQuizAttempts: 0, lastActiveDays: 0, engagementScore: 0, riskScore: 0 },
      moduleProgress: [],
      quizResults: [],
      categoryBreakdown: [],
      activityTimeline: [],
      achievements: [],
      moduleCompletionTimeline: [],
      quizCategoryTrajectory: [],
      loginActivityTimeline: [],
      skillsGap: [],
      recommendations: [],
    };
  }
}

export async function getStudentComparison(userIds: string[], days = 30): Promise<StudentComparisonData> {
  try {
    const params = new URLSearchParams({ userIds: userIds.join(','), days: String(days) });
    const res = await apiFetch(`/api/analytics/student-comparison?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getStudentComparison failed:", e);
    return { students: [] };
  }
}

export async function getGradebook(filters?: { groupId?: string; course?: string; university?: string; days?: number }): Promise<GradebookData> {
  try {
    const params = new URLSearchParams();
    if (filters?.groupId) params.set('groupId', filters.groupId);
    if (filters?.course) params.set('course', filters.course);
    if (filters?.university) params.set('university', filters.university);
    if (filters?.days) params.set('days', String(filters.days));
    const res = await apiFetch(`/api/analytics/gradebook?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getGradebook failed:", e);
    return { students: [], modules: [] };
  }
}

export async function getEngagementAnalytics(days = 30, groupId?: string): Promise<EngagementData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/engagement?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getEngagementAnalytics failed:", e);
    return {
      scoreDistribution: [],
      hourlyActivity: [],
      weeklyPattern: [],
      streakLeaderboard: [],
      engagementTrend: [],
    };
  }
}

export async function getLearningPathAnalytics(days = 30, groupId?: string): Promise<{ path: LearningPathEntry[]; totalStudents: number }> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/learning-path?${params}`);
    const data = await res.json();
    return { path: data.path || [], totalStudents: data.totalStudents || 0 };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getLearningPathAnalytics failed:", e);
    return { path: [], totalStudents: 0 };
  }
}

export async function getQuizTrajectory(days = 30, groupId?: string): Promise<{ trajectories: QuizTrajectoryPoint[]; categories: string[] }> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/quiz-trajectory?${params}`);
    const data = await res.json();
    return { trajectories: data.trajectories || [], categories: data.categories || [] };
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getQuizTrajectory failed:", e);
    return { trajectories: [], categories: [] };
  }
}

export async function getCohortAnalysis(groupId?: string): Promise<CohortAnalysisData> {
  try {
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/cohort?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getCohortAnalysis failed:", e);
    return {
      cohorts: [],
      overallRetention: { week1: 0, week2: 0, week4: 0, week8: 0, week12: 0 },
    };
  }
}

export async function getModuleDeepDive(days = 30, groupId?: string): Promise<ModuleDeepDiveData[]> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/module-deep-dive?${params}`);
    const data = await res.json();
    return data.modules || [];
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getModuleDeepDive failed:", e);
    return [];
  }
}

export async function getCertificationReadiness(days = 30, groupId?: string): Promise<CertificationReadinessData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/certification-readiness?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getCertificationReadiness failed:", e);
    return { students: [], summary: { ready: 0, almost: 0, needsWork: 0, notReady: 0, avgReadinessScore: 0 } };
  }
}

export async function getLearningVelocity(days = 90, groupId?: string): Promise<LearningVelocityData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/learning-velocity?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getLearningVelocity failed:", e);
    return { studentVelocities: [], velocityDistribution: [], avgVelocityByGroup: [], velocityOverTime: [] };
  }
}

export async function getQuizSessionAnalytics(days = 30, groupId?: string): Promise<QuizSessionData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/quiz-session?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getQuizSessionAnalytics failed:", e);
    return { categoryTiming: [], rushedQuizzes: [], timeVsPerformance: [], hourlyPerformance: [], weekdayVsWeekend: [] };
  }
}

export async function getGroupDynamics(days = 90, groupId?: string): Promise<GroupDynamicsData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/group-dynamics?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getGroupDynamics failed:", e);
    return { groups: [], overallTrends: [] };
  }
}

export async function getLoginPatterns(days = 30, groupId?: string): Promise<LoginPatternsData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/login-patterns?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getLoginPatterns failed:", e);
    return { loginFrequency: [], failedLogins: [], dormantAccounts: [], hourlyDistribution: [], dailyDistribution: [] };
  }
}

export async function getQuizDifficultyAnalytics(days = 30, groupId?: string): Promise<QuizDifficultyData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/quiz-difficulty?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getQuizDifficultyAnalytics failed:", e);
    return { difficultyBreakdown: [], categoryByDifficulty: [], studentPerformanceByDifficulty: [], trendByDifficulty: [] };
  }
}

export async function getQuizRetryAnalytics(days = 30, groupId?: string): Promise<QuizRetryData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/quiz-retry?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getQuizRetryAnalytics failed:", e);
    return { categoryRetryStats: [], retryDistribution: [], topRetryers: [], improvementByRetries: [], totalRetries: 0, totalUniqueQuizzes: 0 };
  }
}

export async function getErrorPatternsAnalytics(days = 30, groupId?: string): Promise<ErrorPatternsData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/error-patterns?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getErrorPatternsAnalytics failed:", e);
    return { mostMissedQuestions: [], categoryErrorRates: [], difficultyErrorRates: [], errorTrends: [] };
  }
}

export async function getPredictiveRisk(days = 30, groupId?: string): Promise<PredictiveRiskData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/predictive-risk?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getPredictiveRisk failed:", e);
    return { students: [], summary: { totalStudents: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, avgRisk: 0 } };
  }
}

export async function getScheduledReports(): Promise<{ success: boolean; reports: ScheduledReport[]; error?: string }> {
  try {
    const res = await apiFetch('/api/scheduled-reports');
    return res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getScheduledReports failed:", e);
    return { success: false, reports: [], error: 'Failed to fetch scheduled reports' };
  }
}

export async function createScheduledReport(data: {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  email?: string;
  groupId?: string;
  days?: number;
}): Promise<{ success: boolean; report?: ScheduledReport; error?: string }> {
  try {
    const res = await apiFetch('/api/scheduled-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] createScheduledReport failed:", e);
    return { success: false, error: 'Failed to create scheduled report' };
  }
}

export async function updateScheduledReport(id: string, data: Partial<ScheduledReport>): Promise<{ success: boolean; report?: ScheduledReport; error?: string }> {
  try {
    const res = await apiFetch(`/api/scheduled-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] updateScheduledReport failed:", e);
    return { success: false, error: 'Failed to update scheduled report' };
  }
}

export async function deleteScheduledReport(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch(`/api/scheduled-reports/${id}`, { method: 'DELETE' });
    return res.json();
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] deleteScheduledReport failed:", e);
    return { success: false, error: 'Failed to delete scheduled report' };
  }
}

export async function getDataQuality(days = 30, groupId?: string): Promise<DataQualityData> {
  try {
    const params = new URLSearchParams({ days: String(days) });
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/data-quality?${params}`);
    const data = await res.json();
    return data;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[analytics-api] getDataQuality failed:", e);
    return { healthScore: 100, issues: [], summary: { totalStudents: 0, activeStudents: 0, totalModules: 0, completedModules: 0, totalQuizzes: 0 } };
  }
}
