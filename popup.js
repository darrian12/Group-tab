import { Tab } from "./tab.js";
import { requests, responses } from "./config.js";

function AddTab(tab)
{
    chrome.runtime.sendMessage({message: [requests.ADD_TAB, tab]}, function(item) {
        if (item.response == responses.SUCCESS)
        {
            CreateTabRecord(tab.title, tab.id);
        }
        else if (item.response == responses.FAILURE)
        {
            console.log("duplicate tab");
        }
    });
}

function ClearTabs()
{
    chrome.runtime.sendMessage({message: [requests.CLEAR_ALL, ""]});
    window.location.reload();
}

function CreateGroup(tabs)
{
    if (tabs.length > 0)
    {
        chrome.tabs.group({
            "tabIds": tabs
        });
    }
}

function CreateTabRecord(tabTitle, tabId)
{
    const table = document.getElementById("group-table");
    const row = document.createElement("tr");

    table.appendChild(row);

    const title = document.createElement("td");
    const id = document.createElement("td");

    title.innerText = tabTitle;
    id.innerText = tabId;

    row.appendChild(title);
    row.appendChild(id);
}

function LoadAllTabs()
{
    chrome.runtime.sendMessage({message: [requests.GET_ALL, ""]}, function(item) {
        for (const tab of item.response)
        {
            CreateTabRecord(tab.title, tab.id);
        }
    });
}

function ClickAddTabHandler()
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0];
        AddTab(new Tab(tab.title, tab.id));
    });
}

function ClickClearAllHandler()
{
    ClearTabs();
}

function ClickCreateGroupHandler()
{
    chrome.runtime.sendMessage({message: [requests.GET_ALL, ""]}, function(item) {
        let tabs = [];
        for (const tab of item.response)
        {
            tabs.push(tab.id);
        }
        CreateGroup(tabs);
        ClearTabs();
    });
}

document.getElementById("add-tab").onclick = ClickAddTabHandler;
document.getElementById("clear-all").onclick = ClickClearAllHandler;
document.getElementById("create-group").onclick = ClickCreateGroupHandler;

LoadAllTabs();