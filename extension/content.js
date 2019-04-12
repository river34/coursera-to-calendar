// content.js
console.log("content.js is enabled");

chrome.runtime.onMessage.addListener (
    function (request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            console.log("on click");
            run();
        }
    }
);

const baseLink = "https://www.coursera.org/";

function run(limit) {
    var deadlineElements = getAllDeadlineElementes();
    limit = limit || deadlineElements.length;
    for (var i = 0; i < deadlineElements.length && i < limit; i++) {
        element = deadlineElements[i];

        var title = getTitle(element);
        if (!title) { return; }
        console.log("title: " + title);

        var dates = getDates(element);
        if (!dates) { return; }
        console.log("dates: " + dates);

        var description = getDescription(element);
        if (!description) { return; }
        console.log("description: " + description);

        sendRequest(title, dates, description);
    }
}

function trim(str) {
    if (str === undefined)
        return str;
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// Strip out any HTML or HTML entities from this element
// e.g. "<div>Some <b>string</b> &amp; example</div>" => "Some string & example"
function unescapeElement(node) {

    var result = "";
    for (var i = 0; i < node.childNodes.length; ++i) {
        var child = node.childNodes[i];
        if (child.nodeType === 8) { // it is a comment! skip it
            continue;
        }
        if (child.childNodes.length == 0) {
            result += child.nodeValue;
        } else {
            result += unescapeElement(child);
        }
    }
    return trim(result);
}

function getCourseTitle() {
    var elements = document.getElementsByTagName("title");
    if (elements.length <= 0) {
        return;
    }
    const title = unescapeElement(elements[0]);
    // in the format of:
    //   "Course Name - Home | Coursera"
    const post = " - Home | Coursera";
    return title.substr(0, title.length - post.length);
}

function getAllDeadlineElementes() {
    var elements = document.getElementsByClassName("rc-AssignmentsTableRow");
    return elements;
}

function getTitle(element) {
    var elements = element.getElementsByClassName("item-title-text");
    if (elements.length <= 0) {
        return;
    }
    return unescapeElement(elements[0]);
}

function getLink(element) {
    var elements = element.getElementsByClassName("item-title-text");
    if (elements.length <= 0) {
        return;
    }
    elements = elements[0].getElementsByTagName("a");
    if (elements.length <= 0) {
        return;
    }
    return baseLink + elements[0].getAttribute("href");
}

function getSubTitle(element) {
    var elements = element.getElementsByClassName("item-subtitle-text");
    if (elements.length <= 0) {
        return;
    }
    return unescapeElement(elements[0]);
}

function getDates(element) {
    var elements = element.getElementsByClassName("due-column-text");
    if (elements.length <= 0) {
        return;
    }
    return scheduleToDates(unescapeElement(elements[0]));
}

function getDescription(element) {
    var elements = element.getElementsByClassName("weight-column");
    if (elements.length <= 0) {
        return;
    }
    var weight = unescapeElement(elements[0]);

    var description = "Course: " + getCourseTitle() + "\n";
    description += "Course link: <a href=" + window.location.href + ">" + window.location.href + "</a>\n\n";
    description += "Title: " + getTitle(element) + "\n";
    description += "Type: " + getSubTitle(element) + "\n";
    description += "Link: <a href=" + getLink(element) + ">" + getLink(element) + "</a>\n";
    description += "Weight: " + weight + "\n";
    return description;
}

function scheduleToDates(str) {
    // Of the form:
    //   "Apr 14"

    // Use the current year
    const year = new Date().getFullYear();

    // Get mon and date from the page
    var monDateStrs = str.split(" ");  // month, date
    if (monDateStrs.length != 2) {
        console.error("Found " + monDateStrs.length + " mondatestrs, not 2");
        return;
    }
    const mon = strToMon(monDateStrs[0]);
    const date = parseInt(monDateStrs[1], 10);
    function strToMon(str) {
        var monthNameToNumber = {
            "Jan": 01,
            "Feb": 02,
            "Mar": 03,
            "Apr": 04,
            "May": 05,
            "Jun": 06,
            "Jul": 07,
            "Aug": 08,
            "Sep": 09,
            "Oct": 10,
            "Nov": 11,
            "Dec": 12
        };
        return monthNameToNumber[str];
    }
    console.log("year: " + year + " mon: " + mon + " date: " + date);

    // Month is zero-based
    const startDate = new Date(year, mon - 1, date);
    const endDate = new Date(year, mon - 1, date + 1);
    console.log("startDate: " + startDate);
    console.log("endDate: " + endDate);

    function dateToStr(date) {
        function padWithZero(str) {
            str = "" + str;
            if (str.length == 1)
                return "0" + str;
            return str;
        }

        // YYYY MM DD
        var str = "" + date.getFullYear();
        str += padWithZero(date.getMonth() + 1);
        str += padWithZero(date.getDate());
        return str;
    }

    return dateToStr(startDate) + "/" + dateToStr(endDate);
}


function sendRequest(title, dates, description) {
    window.open(createCalendarUrl(title, dates, description), '_blank');
}

function createCalendarUrl(title, dates, description) {
    var params = {
        'text': title,
        'details': description,
        'dates': dates,
        'action': 'TEMPLATE',
    };

    var url = 'http://www.google.com/calendar/event';
    var first = true;
    for (var key in params) {
        if (first) {
            url += "?";
            first = false;
        } else {
            url += "&";
        }
        url += key + "=" + encodeURIComponent(params[key]);
    }

    return url;
}