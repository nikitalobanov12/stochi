export type CoachPageContext = {
  route: string;
  section: string;
  entityId: string | null;
  summary: string;
  suggestedQuestions: string[];
};

export function buildCoachPageContext(pathname: string): CoachPageContext {
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");
  const routeSegments =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex + 1) : segments;

  const route = routeSegments[0] ?? "home";

  if (route === "log") {
    return {
      route,
      section: "Log",
      entityId: null,
      summary:
        "User is reviewing recent supplement logs and timing behavior on the log page.",
      suggestedQuestions: [
        "What does my logging pattern this week suggest?",
        "Which timing conflicts should I fix first?",
      ],
    };
  }

  if (route === "stacks" && routeSegments[1]) {
    return {
      route: "stack-detail",
      section: "Stack Detail",
      entityId: routeSegments[1] ?? null,
      summary:
        "User is looking at a specific stack and likely deciding dosage/timing adjustments.",
      suggestedQuestions: [
        "What is the highest-impact fix for this stack?",
        "How should I reduce interaction risk in this stack?",
      ],
    };
  }

  if (route === "stacks") {
    return {
      route,
      section: "Stacks",
      entityId: null,
      summary:
        "User is viewing their stack library and may need prioritization across multiple stacks.",
      suggestedQuestions: [
        "Which stack should I focus on this week?",
        "Where is my consistency weakest right now?",
      ],
    };
  }

  if (route === "learn") {
    return {
      route,
      section: "Learn",
      entityId: routeSegments[1] ?? null,
      summary:
        "User is reading supplement research and may want practical translation into actions.",
      suggestedQuestions: [
        "How should I apply this to my current routine?",
        "Does this change anything in my stack right now?",
      ],
    };
  }

  if (route === "protocol") {
    return {
      route,
      section: "Protocol",
      entityId: null,
      summary:
        "User is evaluating protocol structure and sequencing decisions.",
      suggestedQuestions: [
        "What protocol change gives me the best payoff this week?",
        "How should I sequence my protocol to reduce conflicts?",
      ],
    };
  }

  if (route === "settings") {
    return {
      route,
      section: "Settings",
      entityId: null,
      summary:
        "User is in settings and may want data hygiene, tracking quality, or export guidance.",
      suggestedQuestions: [
        "Is my tracking quality good enough for strong insights?",
        "What should I improve in my setup for better coaching?",
      ],
    };
  }

  return {
    route: "home",
    section: "Dashboard",
    entityId: null,
    summary:
      "User is on dashboard home and wants a high-level interpretation of recent biomarker and supplement patterns.",
    suggestedQuestions: [
      "What should I change first based on my last 7 days?",
      "What does my current warning profile mean?",
    ],
  };
}
