async function jsonPetition(variable, id, docId) {
    const rawResponse = await fetch("https://cors-anywhere.herokuapp.com/https://www.facebook.com/api/graphql/", {
        "headers": {
            "Accept-Language": "en-GB",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        "body": "variables=%7B%22" + variable + "%22%3A%22" + id + "%22%7D&doc_id=" + docId,
        "method": "POST",
    })
    const content = await rawResponse.json();
    return new Promise(resolve => {
        resolve(content);
    });
}

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">Link</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">Link</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function showDesctiption(fullEventDescription, eventId) {
    const descriptionVariable = "eventID"
    const descriptionDoc = "1640160956043533"

    if (fullEventDescription.innerText === "") {
        var eventText = document.createElement("p");
        var pAux = document.createElement("p")
        jsonPetition(descriptionVariable, eventId, descriptionDoc).then(res => {
            pAux.innerText = res.data.event.details.text;
            eventText.innerHTML = linkify(pAux.innerHTML)
            pAux.remove()
        }).catch(e => console.error(e));
        var facebookLink = document.createElement("a");
        facebookLink.appendChild(document.createTextNode("Facebook page"))
        facebookLink.setAttribute("href", "https://www.facebook.com/events/" + eventId);
        facebookLink.setAttribute("target", "_blank");
        fullEventDescription.appendChild(facebookLink)
        fullEventDescription.appendChild(eventText)
        eventText.innerHTML = "<img src=\"./loading.gif\" alt=\"Loading\">"
        fullEventDescription.style.display = "block"

    } else {
        fullEventDescription.style.display = fullEventDescription.style.display === "none" ? "block" : "none"
    }
}

function jsonsToEventList(responses, dateFormat) {
    var processedEventList = new Map();
    responses.forEach(json => {
        if ("upcoming_events" in json.data.page) {
            json.data.page.upcoming_events.edges.forEach(event => {
                var timestamp = event.node.startTimestampForDisplay;
                var date = dateFormat.format(new Date(timestamp * 1000))
                var formatedEvent = event.node.name + " | " + date;
                processedEventList.set(event.node.id, [formatedEvent, timestamp]);
            })
        }
        else if ("upcomingRecurringEvents" in json.data.page) {
            json.data.page.upcomingRecurringEvents.edges.forEach(event => {
                event.node.childEvents.edges.forEach(subEvent => {
                    var timestamp = subEvent.node.currentStartTimestamp;
                    var date = dateFormat.format(new Date(timestamp * 1000))
                    var formatedEvent = event.node.name + " | " + date;
                    processedEventList.set(subEvent.node.id, [formatedEvent, timestamp]);

                })
            })
        }
        else {
            console.log("Wrong json format")
        }
    });
    return processedEventList
}

function getEvents(pages,doc) {
    const eventsVariable = "pageID"
    return pages.map(page => jsonPetition(eventsVariable, page, doc))
}

const pages = [
    138320816228452, //ESN PW
    173656083644, //ESN UW
    128779253861459, //ESN SGH
    106670159472245, //ESN WUM
    146760465383748, //ESN SGGW
    393135780706771, //ESN SWPS
    205620019512622 //ESN Warsaw United
];

const recurringEventsDoc = "3270179606343275"
const eventsDoc = "2464276676984576"
const dateFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
})

var promiseList = getEvents(pages, eventsDoc).concat(getEvents(pages, recurringEventsDoc))

window.onload = () => {
    Promise.all(promiseList).then(responses => {
        var eventList = jsonsToEventList(responses, dateFormat)
        var sortedEvents = [...eventList.entries()].map(([id, [str, tsmp]]) => [tsmp, [str, id]]).sort();
        document.getElementById("loading").style.display = "none"
        document.getElementById("loadinggif").style.display = "none"
        var list = document.getElementById("EventList");
        sortedEvents.forEach(event => {
            var eventListEntry = document.createElement("li");
            var eventDescriptionIndentation = document.createElement("ul");
            var eventDescriptionText = document.createElement("p");
            var eventTitle = document.createElement("h4");
            var bottomBorder = document.createElement("div")
            eventTitle.appendChild(document.createTextNode(event[1][0]));
            bottomBorder.appendChild(eventTitle)
            eventDescriptionText.style.display = "none"
            eventDescriptionIndentation.appendChild(eventDescriptionText)
            eventListEntry.appendChild(bottomBorder);
            eventListEntry.appendChild(eventDescriptionIndentation)
            eventTitle.onclick = () => { showDesctiption(eventDescriptionText, event[1][1]) }
            list.appendChild(eventListEntry);
        });
    }).catch(e => console.error(e));
}
