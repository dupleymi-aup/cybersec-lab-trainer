import type {
  TrendPoint, QuizQuestionStat, AchievementStat, AdminSummary,
  HeatmapData, ModulePerformance, ProgressDynamicsDay, AtRiskStudent,
  GroupComparisonDimension, QuizCategoryStat, ComprehensiveSummary,
  StudentPerformanceData, StudentComparisonData, GradebookData,
  EngagementData, LearningPathEntry, QuizTrajectoryPoint,
  CohortAnalysisData, QuizAttemptData,
  ModuleDeepDiveData, CertificationReadinessData, LearningVelocityData,
  QuizSessionData, GroupDynamicsData, LoginPatternsData,
} from './auth-types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { useAuthStore } = await import('./auth-store');
    const { token } = useAuthStore.getState();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });
}

export async function getProgressTrends(userId?: string, dateRange: string = '30d', groupId?: string): Promise<TrendPoint[]> {
  try {
    const params = new URLSearchParams({ dateRange });
    if (userId) params.set('userId', userId);
    if (groupId) params.set('groupId', groupId);
    const res = await apiFetch(`/api/analytics/progress-trends?${params}`);
    const data = await res.json();
    return data.trends || [];
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    return {
      profile: { id: '', fullName: '', email: '', group: '', course: '', university: '', avatar: '', role: '', createdAt: '', lastLoginAt: null, loginCount: 0 },
      kpis: { modulesCompleted: 0, totalModules: 0, avgQuizScore: 0, totalQuizAttempts: 0, lastActiveDays: 0, engagementScore: 0, riskScore: 0 },
      moduleProgress: [],
      quizResults: [],
      categoryBreakdown: [],
      activityTimeline: [],
      achievements: [],
    };
  }
}

export async function getStudentComparison(userIds: string[], days = 30): Promise<StudentComparisonData> {
  try {
    const params = new URLSearchParams({ userIds: userIds.join(','), days: String(days) });
    const res = await apiFetch(`/api/analytics/student-comparison?${params}`);
    const data = await res.json();
    return data;
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    return { loginFrequency: [], failedLogins: [], dormantAccounts: [], hourlyDistribution: [], dailyDistribution: [] };
  }
}
