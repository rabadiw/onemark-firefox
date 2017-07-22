// Copyright (c) Wael Rabadi. All rights reserved.
// See LICENSE for details.

// dependency on settings.js

// hooks
document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".menu .mark-tab").addEventListener("click", (evt) => {
        renderCurrentTab(evt.currentTarget);
    })
    document.querySelector(".menu .mark-all-tabs").addEventListener("click", (evt) => {
        renderAllTabs(evt.currentTarget);
    })
});

const metadata = {
    apiUrl: () => settings.MARKS_API_URL(),
    browserMatchPattern: /^chrome:|^about:/i,
    notificationId: settings.NOTIFICATION_ID,
    nativeHostName: settings.NATIVE_HOST_NAME
}

// functions
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function isMozilla() {
    return /firefox/i.test(navigator.userAgent);
}
function isChrome() {
    return /chrome/i.test(navigator.userAgent);
}

function ensureApiConnect() {

}

function renderNotification(statusText) {
    let notificationObject = null;
    if (isMozilla()) {
        notificationObject = browser.notifications;

    } else if (isChrome()) {
        notificationObject = chrome.notifications;
    }

    if (notificationObject) {
        let msg = typeof statusText === "String" ? statusText : JSON.stringify(statusText)
        notificationObject.create(metadata.notificationId, {
            type: "basic",
            title: "Onemark",
            message: msg,
            iconUrl: "icon.png"
        });
    }
}

function renderInfo(msg) {
    console.log(msg);
}
function renderSuccess(sender, msg = "Ready") {
    console.log(msg, sender);
    renderActionBar(sender, msg);
}
function renderProcessing(sender) {
    let msg = 'processing...';
    console.log(msg, sender);
    renderActionBar(sender, msg, "warn");
}
function renderError(error, sender) {
    console.log(error, sender);
    renderActionBar(sender, error, "error");
    renderNotification(error);
}

function renderActionBar(sender, message, className = "success") {
    let elem = sender.querySelector(".action>span");
    elem.className = className;
    elem.title = message;
}

function renderCurrentTab(sender) {
    new TabsQuery().getCurrent()
        .then((entry) => postUrls([entry]))
        .then(() => renderSuccess(sender))
        .catch((err) => renderError(err, sender));
}

function renderAllTabs(sender) {
    renderProcessing(sender);
    new TabsQuery().getAll()
        .then((entries) => postUrls(entries))
        .then(() => renderSuccess(sender))
        .catch((err) => renderError(err, sender));
}

function postUrls(entries) {
    renderInfo("posting urls...")
    const postUrlsAsync =
        (new Http(metadata.apiUrl()))
            .Post({
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(entries)
            });
    return postUrlsAsync;
}


class TabsQuery {

    getCurrent() {
        const getCurrentAsync = (resolve, reject) => {

            let queryInfo = {
                active: true,
                currentWindow: true
            };

            chrome.tabs.query(queryInfo, function (tabs) {
                let { url, title, favIconUrl } = tabs[0];
                console.assert(typeof url === "string", "tab.url should be a string");
                console.assert(url.match(metadata.browserMatchPattern) === null, "Skipping browser settings page!");
                if (url.match(metadata.browserMatchPattern)) {
                    reject("Skipping browser settings page!");
                }
                else {
                    resolve({ url, title, favIconUrl });
                }
            });

        };
        return new Promise(getCurrentAsync);
    }

    getAll() {
        const getAllAsync = (resolve, reject) => {

            let queryInfo = {};

            chrome.tabs.query(queryInfo, (tabs) => {

                try {

                    let urls =
                        tabs
                            .filter((v) => v.url.match(metadata.browserMatchPattern) === null)
                            .map((v) => {
                                let { url, title, favIconUrl } = v;
                                console.assert(typeof url === "string", "tab.url should be a string");
                                return { url, title, favIconUrl };
                            }, this);

                    resolve(urls);
                } catch (error) {
                    reject(error);
                }

            })
        };
        return new Promise(getAllAsync);
    }
}


class Http {
    constructor(url) {
        this.url = url;
    }

    ajax(method, url, args) {

        // Creating a promise
        const ajaxAsync = (resolve, reject) => {
            try {
                // Instantiates the XMLHttpRequest
                let client = new XMLHttpRequest();
                let uri = url;

                // if (args && (method === "POST" || method === "PUT")) {
                //   uri += "?";
                //   var argcount = 0;
                //   for (var key in args) {
                //     if (args.hasOwnProperty(key)) {
                //       if (argcount++) {
                //         uri += "&";
                //       }
                //       uri += encodeURIComponent(key) + "=" + encodeURIComponent(args[key]);
                //     }
                //   }
                // }

                client.open(method, uri);
                if (args.contentType) {
                    client.setRequestHeader("Content-Type", args.contentType);
                }

                client.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                        // Performs the function "resolve" when this.status is equal to 2xx
                        resolve(this.response);
                    } else {
                        // Performs the function "reject" when this.status is different than 2xx
                        reject(this.statusText);
                    }
                };

                client.onerror = function (evt) {
                    if (this.status === 0) {
                        reject("Network error");
                    } else {
                        reject(this.status);
                    }
                };

                client.send(args.data);

            } catch (error) {
                reject(error);
            }
        };

        // Return the promise
        return new Promise(ajaxAsync);
    }

    Get(args) {
        return this.ajax("GET", this.url, args);
    }
    Post(args) {
        return this.ajax("POST", this.url, args);
    }
    Put(args) {
        return this.ajax("PUT", this.url, args);
    }
    Delete(args) {
        return this.ajax("DELETE", this.url, args);
    }
}
