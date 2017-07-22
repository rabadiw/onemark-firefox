// Copyright (c) Wael Rabadi. All rights reserved.
// See LICENSE for details.

const options = function () {

  let model = {
    apiUrl: "TBD"
  }
  model.accept = function (data) {
    model.apiUrl = data.apiUrl
    return model
  }

  const meta = {
    saveActionId: "saveAction",
    apiTextId: "apiText",
    statusTextId: "statusText"
  }
  let view = {}
  view.render = (state, actions) => {
    document.getElementById(meta.apiTextId).value = state.apiUrl;
    document.getElementById(meta.saveActionId).addEventListener('click', actions.save);
  }

  let state = { View: view }
  state.present = (model) => {
    view.render(model, this.actions)
  }

  let actions = {}
  // persist options to chrome.storage.sync.
  actions.save = function (state) {
    model.state = model.accept({ apiUrl: document.getElementById(meta.apiTextId).value });
    chrome.storage.sync.set(model.state, function () {
      // Update status to let user know options were saved.
      var status = document.getElementById(meta.statusTextId);
      status.textContent = 'Options saved.';
      setTimeout(function () {
        status.textContent = '';
      }, 750);
    });
  }
  // stored in chrome.storage.
  actions.restore = function () {
    // Use defaults
    return new Promise((resolve, reject) => {
      let state = model.accept(
        { apiUrl: settings.SETTINGS_STATE.apiUrl }
      );
      resolve(state)
    })
  }


  return {
    init: () => {
      debugger;
      actions.restore().then(
        (m) => {
          state.present(m)
        }
      )
    }
  }
}()

document.addEventListener('DOMContentLoaded', options.init());
