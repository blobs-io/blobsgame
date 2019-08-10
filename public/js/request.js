function request(url, method, headers) {
    return new Promise((a,b) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (typeof headers === "object" && headers !== null) { // because typeof null === 'object'
            for (const header of Object.entries(headers)) {
                xhr.setRequestHeader(header[0], header[1]);
            }
        }
        xhr.onload = () => {
            if (xhr.readyState === 4) {
                let statusHeader = xhr.getResponseHeader("status");
                if (statusHeader) {
                    if (statusHeader.includes(",")) statusHeader = statusHeader.split(",")[1].substr(1);
                }
                if (xhr.status === 200) a(xhr);
                else b(xhr);
            }
        };
        xhr.send(null);
    });
}
