async function json_petition(page_id, success) {
    const rawResponse = await fetch("https://cors-anywhere.herokuapp.com/https://www.facebook.com/api/graphql/", {
        "headers": {
            "Accept-Language": navigator.language,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        "body": "variables=%7B%22pageID%22%3A%22" + page_id + "%22%7D&doc_id=2455863461165494",
        "method": "POST",
    })
    const content = await rawResponse.json();
    success(content);
}

var pages = [
    138320816228452, //ESN PW
    173656083644, //ESN UW
    128779253861459, //ESN SGH
    2620926351263365, //ESN WUM
    146760465383748, //ESN SGGW
    393135780706771, //ESN SWPS
];
var events_list = new Map();
pages.forEach(param => {
    try {
        json_petition(param, response => {
            var events = response.data.page.upcoming_events.edges
            events.forEach(event => {
                var timestamp = event.node.startTimestampForDisplay
                var event_id = event.node.id
                var name = event.node.name
                var day = event.node.shortDateLabel
                var hour = event.node.shortTimeLabel.split(" ")
                if (!isNaN(hour[0])) {
                    hour.splice(0, 2)
                } else {
                    hour.splice(0, 1)
                    hour.pop()
                }
                hour = hour.join(" ")

                var formated_event = name + " | " + day + " " + hour
                events_list.set(event_id, [formated_event, timestamp]);

            });
            var sorted_events = [...events_list.entries()].map(([id, [str, tsmp]]) => [tsmp, [str, id]]).sort()
            console.log(sorted_events)
            var list = document.getElementById("EventList")
            list.innerHTML = "";
            sorted_events.forEach(element => {
                var li = document.createElement("li");
                var a = document.createElement("a")
                a.appendChild(document.createTextNode(element[1][0]));
                a.setAttribute("href", "https://www.facebook.com/events/" + element[1][1])
                a.setAttribute("target", "_blank")
                li.appendChild(a)
                list.appendChild(li);
            });


        })
    } catch (e) {
        console.log(e)
    }

})