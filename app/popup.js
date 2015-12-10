const key = 'i4s-credentials';

function enableElement(element, text) {
    element.style.opacity = 1;
    element.style.pointerEvents = 'auto';
    element.innerHTML = text;
}

function disableElement(element, text) {
    element.style.opacity = 0.65;
    element.style.pointerEvents = 'none';
    element.innerHTML = text;
}

function showSignedIn() {
    var usernameOutput = document.getElementById('my-username-output'),
        credentials;

    if (localStorage.getItem(key)) {
        credentials = JSON.parse(localStorage.getItem(key));

        usernameOutput.value = credentials.username;
        usernameOutput.style.display = 'block';
    } else {
        usernameOutput.style.display = 'none';
    }

    enableElement(document.getElementById('my-sign-out-btn'), 'Sign out');

    document.getElementById('my-sign-in').style.display = 'none';
    document.getElementById('my-signed-in').style.display = 'block';
}

function showSignIn() {
    if (localStorage.getItem(key)) {
        credentials = JSON.parse(localStorage.getItem(key));

        document.getElementById('my-username-input').value = credentials.username;
        document.getElementById('my-password-input').value = credentials.password;
    }

    enableElement(document.getElementById('my-sign-in-btn'), 'Sign in');

    document.getElementById('my-signed-in').style.display = 'none';
    document.getElementById('my-sign-in').style.display = 'block';
}

function sendRequest(url, callback) {
    var xmlHttpRequest = new XMLHttpRequest();

    document.getElementById('my-error').style.display = 'none';

    xmlHttpRequest.onreadystatechange = function() {
        var messageMatchMatch,
            errorMessage;

        if (xmlHttpRequest.responseText) {
            messageMatchMatch = xmlHttpRequest.responseText.match('<p class="msg">(.*)</p><p');

            if (messageMatchMatch && messageMatchMatch[1] !== 'Welcome') {
                errorMessage = messageMatchMatch[1];

                if (errorMessage === 'Already logged in to i4s.') {
                    showSignedIn();
                } else if (errorMessage === 'You are now logged off.') {
                    showSignIn();
                } else {
                    document.getElementById('my-error').innerHTML = errorMessage;
                    document.getElementById('my-error').style.display = 'block';
                }
            } else if (callback) {
                callback(xmlHttpRequest.responseText);
            }
        }
    };

    xmlHttpRequest.open('GET', url, true);
    xmlHttpRequest.send();
}

function sendCredentials(credentials) {
    disableElement(document.getElementById('my-sign-in-btn'), 'Signing in..');

    sendRequest('http://192.168.182.1:3990/prelogin', function(response) {
        var challengeMatch = response.match('<input type="hidden" name="chal" value="(.*)">');

        if (challengeMatch) {
            sendRequest('http://go.i4s.be/?chal=' + challengeMatch[1] + '&uamip=192.168.182.1&uamport=3990&userurl=&uid=' + credentials.username + '&pwd=' + credentials.password + '&save_login=on&login=Login', showSignedIn);
        }
    });
}

(function() {
    if (localStorage.getItem(key)) {
        var credentials = JSON.parse(localStorage.getItem(key));

        document.getElementById('my-username-input').value = credentials.username;
        document.getElementById('my-password-input').value = credentials.password;

        sendCredentials(credentials);
    } else {
        sendRequest('http://192.168.182.1:3990/prelogin');
    }

    document.getElementById('my-sign-in-btn').addEventListener('click', function() {
        var credentials = {};

        credentials.username = document.getElementById('my-username-input').value;
        credentials.password = document.getElementById('my-password-input').value;

        if (credentials.username && credentials.password) {
            localStorage.setItem(key, JSON.stringify(credentials));

            sendCredentials(credentials);
        }
    });

    document.getElementById('my-sign-out-btn').addEventListener('click', function() {
        disableElement(document.getElementById('my-sign-out-btn'), 'Signing out..');

        sendRequest('http://192.168.182.1:3990/logoff', showSignIn);
    });
})();
