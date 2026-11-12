// Stand-in for lib/activity-log in the route tests: remembers what was logged.
export const activity: Record<string, unknown>[] = []
export async function logActivity(entry: Record<string, unknown>) { activity.push(entry) }
