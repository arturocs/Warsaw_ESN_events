async function json_petition(page_id) {
    const rawResponse = await fetch("https://cors-anywhere.herokuapp.com/https://www.facebook.com/api/graphql/", {
        "headers": {
            "Accept-Language": "en-US",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        "body": "variables=%7B%22pageID%22%3A%22" + page_id + "%22%7D&doc_id=2464276676984576",
        "method": "POST",
    })
    const content = await rawResponse.json();
    return new Promise(resolve => {
        resolve(content);
    });
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
var event_list = new Map();
var promise_list = pages.map(page => json_petition(page))

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
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(event[1][0]));
            a.setAttribute("href", "https://www.facebook.com/events/" + event[1][1]);
            a.setAttribute("target", "_blank");
            li.appendChild(a);
            list.appendChild(li);
        });
    }).catch(e => console.error(e));
}