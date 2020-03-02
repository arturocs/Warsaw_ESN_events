async function json_petition(variable, id, doc_id) {
    const rawResponse = await fetch("https://cors-anywhere.herokuapp.com/https://www.facebook.com/api/graphql/", {
        "headers": {
            "Accept-Language": "en-US",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        "body": "variables=%7B%22" + variable + "%22%3A%22" + id + "%22%7D&doc_id=" + doc_id,
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

var pages = [
    138320816228452, //ESN PW
    173656083644, //ESN UW
    128779253861459, //ESN SGH
    106670159472245, //ESN WUM
    146760465383748, //ESN SGGW
    393135780706771, //ESN SWPS
    205620019512622 //ESN Warsaw United
];
var events_doc = "2464276676984576"
var description_doc = "1640160956043533"
var events_variable = "pageID"
var description_variable = "eventID"
var event_list = new Map();
var promise_list = pages.map(page => json_petition(events_variable, page, events_doc))
json_petition(description_variable, "657486291704993", description_doc).then(res => console.log(res.data.event.details.text))
window.onload = () => {
    Promise.all(promise_list).then(responses => {
        responses.forEach(event_json => {
            try {
                var events = event_json.data.page.upcoming_events.edges;
                events.forEach(event => {
                    var timestamp = event.node.startTimestampForDisplay;
                    var event_id = event.node.id;
                    var name = event.node.name;
                    var day = event.node.shortDateLabel;
                    var hour = event.node.shortTimeLabel.split(" ");
                    if (hour.find(word => word == "-") !== undefined) {
                        hour.splice(0, 2);
                    } else {
                        hour.splice(0, 1);
                        hour.pop();
                    }
                    var formated_event = name + " | " + day + " " + hour.join(" ");
                    event_list.set(event_id, [formated_event, timestamp]);
                })
            } catch (e) {
                console.log(e);
            }
        });
        var sorted_events = [...event_list.entries()].map(([id, [str, tsmp]]) => [tsmp, [str, id]]).sort();
        document.getElementById("loading").innerHTML = "";
        var list = document.getElementById("EventList");
        sorted_events.forEach(event => {
            var event_list_entry = document.createElement("li");
            var event_description_ul = document.createElement("ul");
            var event_description_p = document.createElement("p");
            var event_entry_p = document.createElement("p");
            event_description_p.style.display = "none"
            event_entry_p.appendChild(document.createTextNode(event[1][0]));
            event_description_ul.appendChild(event_description_p)
            event_list_entry.appendChild(event_entry_p);
            event_list_entry.appendChild(event_description_ul)
            event_entry_p.onclick = () => {
                if (event_description_p.innerText == "") {
                    var facebook_link = document.createElement("a");
                    var event_description = document.createElement("p");
                    var tmp_p = document.createElement("p")
                    facebook_link.appendChild(document.createTextNode("[Facebook page]"))
                    facebook_link.setAttribute("href", "https://www.facebook.com/events/" + event[1][1]);
                    facebook_link.setAttribute("target", "_blank");
                    event_description_p.appendChild(facebook_link)
                    event_description_p.appendChild(event_description)
                    event_description.innerHTML = "<p><strong>Loading</strong></p>"
                    event_description_p.style.display = "block"
                    try {
                        json_petition(description_variable, event[1][1], description_doc).then(res => {
                            tmp_p.innerText =  res.data.event.details.text;
                            event_description.innerHTML = linkify(tmp_p.innerHTML)
                        })
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    event_description_p.style.display = event_description_p.style.display == "none" ? "block" : "none"
                }
            }
            list.appendChild(event_list_entry);
        });
    }).catch(e => console.error(e));
}