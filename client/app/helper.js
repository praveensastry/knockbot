"use strict";

// build Request for fetching data from server
const getRequestHeader = (url, method, data = null) => {
    let initRequest = {
        headers: new Headers({
            'Content-Type': 'application/x-www-form-urlencoded'
        }),
        mode: 'no-cors',
        method: method
    };

    //append parameters
    if (data != null) {
        if (method == "GET") {
            url = `${url}?${data}`;
        }
        else {
            initRequest.body = data;
        }
    }

    return new Request(url, initRequest);
}

// display error message
const displayMessage = (tooltip, mesasge) => {
	tooltip.innerText = message;
	tooltip.className = "";
}

// hide error message
const hideMessage = (tooltip) => {
	tooltip.className = "hidden";
}








