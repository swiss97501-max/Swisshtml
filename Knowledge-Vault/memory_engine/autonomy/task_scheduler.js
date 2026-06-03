// Task Scheduler Module
// Schedules and prioritizes learning tasks

const taskQueue = [];

export function scheduleTask(task, priority = 0) {
    taskQueue.push({ ...task, priority, scheduledAt: new Date() });
    return taskQueue.sort((a, b) => b.priority - a.priority);
}

export function getNextTask() {
    return taskQueue.shift();
}

export function getTasks() {
    return taskQueue;
}
