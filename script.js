async function jsonPetition(variable, id, docId) {
    const rawResponse = await fetch("https://cors-anywhere.herokuapp.com/https://www.facebook.com/api/graphql/", {
        "headers": {
            "Accept-Language": "en-US",
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
    if (fullEventDescription.innerText == "") {
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
        eventText.innerHTML = "<p><strong>Loading</strong></p>"
        fullEventDescription.style.display = "block"

    } else {
        fullEventDescription.style.display = fullEventDescription.style.display == "none" ? "block" : "none"
    }
}

function jsonsToEventList(responses) {
    var eventList = new Map();
    responses.forEach(eventJson => {
        try {
            var events = eventJson.data.page.upcoming_events.edges;
            events.forEach(event => {
                var timestamp = event.node.startTimestampForDisplay;
                var eventId = event.node.id;
                var name = event.node.name;
                var day = event.node.shortDateLabel;
                var hour = event.node.shortTimeLabel.split(" ");
                if (hour.find(word => word == "-") !== undefined) {
                    hour.splice(0, 2);
                } else {
                    hour.splice(0, 1);
                    hour.pop();
                }
                var formatedEvent = name + " | " + day + " " + hour.join(" ");
                eventList.set(eventId, [formatedEvent, timestamp]);
            })
        } catch (e) {
            console.log(e);
        }
    });
    return eventList
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
const eventsDoc = "2464276676984576"
const descriptionDoc = "1640160956043533"
const eventsVariable = "pageID"
const descriptionVariable = "eventID"

var promiseList = pages.map(page => jsonPetition(eventsVariable, page, eventsDoc))

window.onload = () => {
    Promise.all(promiseList).then(responses => {
        var eventList = jsonsToEventList(responses)
        var sortedEvents = [...eventList.entries()].map(([id, [str, tsmp]]) => [tsmp, [str, id]]).sort();
        document.getElementById("loading").innerHTML = "";
        var list = document.getElementById("EventList");
        sortedEvents.forEach(event => {
            var eventListEntry = document.createElement("li");
            var eventDescriptionIndentation = document.createElement("ul");
            var eventDescriptionText = document.createElement("p");
            var eventTitle = document.createElement("h4");
            eventDescriptionText.style.display = "none"
            eventTitle.appendChild(document.createTextNode(event[1][0]));
            eventDescriptionIndentation.appendChild(eventDescriptionText)
            eventListEntry.appendChild(eventTitle);
            eventListEntry.appendChild(eventDescriptionIndentation)
            eventTitle.onclick = () => { showDesctiption(eventDescriptionText, event[1][1]) }
            list.appendChild(eventListEntry);
        });
    }).catch(e => console.error(e));
}