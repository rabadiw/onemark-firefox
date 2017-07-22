const resolveUrl = (vpath) => {
  let url = settings.SETTINGS_STATE.apiUrl
  if (!url.endsWith("/")) {
    url += "/"
  }
  if (vpath.startsWith("/")) {
    url += vpath.substring(1)
  } else {
    url += vpath
  }
  return url
}

const loadSettingState = () => {
  chrome.runtime.sendNativeMessage(
    settings.NATIVE_HOST_NAME,
    { "text": "--apiUrl" },
    (response) => {
      if (response !== undefined) {
        // Use API Settings
        settings.SETTINGS_STATE =
          Object.assign(settings.SETTINGS_STATE, { apiUrl: response.Text });
      } else {
        // Use storage
        chrome.storage.sync.get(settings.SETTINGS_STATE, function (items) {
          settings.SETTINGS_STATE = Object.assign(settings.SETTINGS_STATE, { apiUrl: items.apiUrl });
        });
      }
    }
  )
}

// let SETTINGS_STATE = { apiUrl: "http://localhost:32801/" }
// const MARKS_API_URL = () => resolveUrl("api/marks")
// const NOTIFICATION_ID = "Onemark-notification"

const settings = {
  SETTINGS_STATE: { apiUrl: "http://localhost:32801/" },
  MARKS_API_URL: () => resolveUrl("api/marks"),
  NOTIFICATION_ID: "Onemark-notification",
  NATIVE_HOST_NAME: "com.waelrabadi.onemark"
}

loadSettingState()