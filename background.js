//import { Tab } from "./tab.js";
import { requests, responses } from "./config.js";

let Tabs = [];

chrome.runtime.onMessage.addListener((request, sender, reply) => {
    var prefix = request.message[0];
    var message = request.message[1];

    switch (prefix)
    {
        case requests.ADD_TAB:
            if (Tabs.find(tab => tab.id == message.id) == undefined)
            {
                Tabs.push(message);
                reply({response: responses.SUCCESS});
            }

            reply({response: responses.FAILURE});
            break;
        case requests.GET_TAB:
            if (message >= 0 && message < Tabs.length)
            {
                reply({response: Tabs[message]});
            }
            break;
        case requests.GET_ALL:
            reply({response: Tabs});
            break;
        case requests.CLEAR_ALL:
            Tabs = [];
            break;
    }
});


// some dirty hack to keep service worker alive via runtime ports
// source: https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
let lifeline;

keepAlive();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); // 5 minutes minus 5 seconds
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: 'keepAlive' }),
        // `function` will become `func` in Chrome 93+
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}