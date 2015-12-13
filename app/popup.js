const key = 'i4s-credentials';

var lastRequestStamp;

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

function enableSignIn() {
    enableElement(document.getElementById('my-sign-in-btn'), 'Sign in');
}

function showSignedIn() {
    var infoLink = document.getElementById('my-info-link'),
        info = document.getElementById('my-info'),
        credentials;

    if (localStorage.getItem(key)) {
        credentials = JSON.parse(localStorage.getItem(key));

        infoLink.innerHTML = credentials.username;
        infoLink.href = 'http://helpdesk.i4s.be/welcome.php?account=' + credentials.username + '&mac=' + credentials.mac;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
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

    enableSignIn();

    document.getElementById('my-signed-in').style.display = 'none';
    document.getElementById('my-sign-in').style.display = 'block';
}

function showMessage(message) {
    document.getElementById('my-error').innerHTML = message;
    document.getElementById('my-error').style.display = 'block';
}

function extractMessage(responseText) {
    var messageMatch = responseText.match('<p class="msg">(.*)</p><p'),
        message;

    if (messageMatch) {
        message = messageMatch[1];
    }

    return message;
}

function sendRequest(url, callback, requestStamp) {
    var xmlHttpRequest = new XMLHttpRequest();

    if (!requestStamp) {
        requestStamp = new Date().getTime();

        lastRequestStamp = requestStamp;
    }

    document.getElementById('my-error').style.display = 'none';

    xmlHttpRequest.onreadystatechange = function() {
        if (requestStamp === lastRequestStamp) {
            callback(xmlHttpRequest.responseText);
        }
    };

    xmlHttpRequest.open('GET', url, true);
    xmlHttpRequest.send();
}

function showSignInFail() {
    showMessage('Oops, failed to sign in. Please try again.');

    enableElement(document.getElementById('my-sign-in-btn'), 'Sign in');
}

function signIn(credentials) {
    var requestStamp = new Date().getTime(),
        cancelSignIn;

    lastRequestStamp = requestStamp;

    cancelSignIn = setTimeout(function() {
        lastRequestStamp = null;

        showSignInFail();
    }, 3000);

    disableElement(document.getElementById('my-sign-in-btn'), 'Signing in..');

    sendRequest('http://192.168.182.1:3990/prelogin', function(response) {
        var message = extractMessage(response),
            challengeMatch;

        if (message === 'Already logged in to i4s.') {
            showSignedIn();
        } else {
            challengeMatch = response.match('<input type="hidden" name="chal" value="(.*)">');

            if (challengeMatch) {
                sendRequest('http://go.i4s.be/?chal=' + challengeMatch[1] + '&uamip=192.168.182.1&uamport=3990&userurl=&uid=' + credentials.username +
                    '&pwd=' + credentials.password + '&save_login=on&login=Login',
                    function(response) {
                        var message = extractMessage(response),
                            match;

                        if (message) {
                            if (message === 'Welcome') {
                                clearTimeout(cancelSignIn);

                                match = response.match('&mac=(.*)');

                                if (match) {
                                    credentials.mac = match[1].substring(0, 17);
                                }

                                localStorage.setItem(key, JSON.stringify(credentials));

                                showSignedIn();
                            }
                        } else {
                            match = response.match('<font color="red">(.*)</font></p>');

                            if (match && match[1] === 'Sorry, login failed. Please try again.') {
                                clearTimeout(cancelSignIn);

                                showSignInFail();
                            }
                        }
                    }, requestStamp
                );
            }
        }
    }, requestStamp);
}

(function() {
    if (localStorage.getItem(key)) {
        var credentials = JSON.parse(localStorage.getItem(key));

        document.getElementById('my-username-input').value = credentials.username;
        document.getElementById('my-password-input').value = credentials.password;

        signIn(credentials);
    } else {
        sendRequest('http://192.168.182.1:3990/prelogin');
    }

    chrome.extension.isAllowedIncognitoAccess(function(isAllowedAccess) {
        if (!isAllowedAccess) {
            document.getElementById('my-incognito').style.display = 'inline';
        }
    });

    document.getElementById('my-sign-in-btn').addEventListener('click', function() {
        var credentials = {};

        credentials.username = document.getElementById('my-username-input').value;
        credentials.password = document.getElementById('my-password-input').value;

        if (credentials.username && credentials.password) {
            signIn(credentials);
        }
    });

    document.getElementById('my-sign-out-btn').addEventListener('click', function() {
        disableElement(document.getElementById('my-sign-out-btn'), 'Signing out..');

        sendRequest('http://192.168.182.1:3990/logoff', function(response) {
            var message = extractMessage(response);

            if (message === 'You are now logged off.') {
                showSignIn();
            }
        });
    });

    document.getElementById('my-incognito').addEventListener('click', function() {
        chrome.tabs.create({
            url: 'chrome://extensions/?id=' + chrome.runtime.id
        });
    });

    document.getElementById('my-username-input').addEventListener('input', function() {
        lastRequestStamp = null;

        enableSignIn();
    });

    document.getElementById('my-password-input').addEventListener('input', function() {
        lastRequestStamp = null;

        enableSignIn();
    });
})();
