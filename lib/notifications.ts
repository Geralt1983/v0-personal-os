export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("[v0] Notifications not supported")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

export async function scheduleReminder(task: string, time: Date): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.warn("[v0] Notification permission denied")
    return
  }

  const delay = time.getTime() - Date.now()
  if (delay > 0) {
    setTimeout(() => {
      new Notification("LifeOS Reminder", {
        body: task,
        icon: "/icons/icon-192.jpg",
        tag: "reminder",
        vibrate: [200, 100, 200],
      })
    }, delay)
  } else {
    console.warn("[v0] Cannot schedule reminder in the past")
  }
}

export async function showTaskCompleteNotification(task: string): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return

  new Notification("Task Complete!", {
    body: `Great job completing: ${task}`,
    icon: "/icons/icon-192.jpg",
    tag: "task-complete",
  })
}

export async function scheduleNotification(task: string, time: Date): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.warn("[v0] Notification permission denied")
    return
  }

  const delay = time.getTime() - Date.now()
  if (delay > 0) {
    setTimeout(() => {
      new Notification("LifeOS Reminder", {
        body: task,
        icon: "/icons/icon-192.jpg",
        tag: "reminder",
        vibrate: [200, 100, 200],
      })
    }, delay)
  } else {
    console.warn("[v0] Cannot schedule notification in the past")
  }
}
