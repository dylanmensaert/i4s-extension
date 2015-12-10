const key = 'i4s-credentials';

function sendCredentials(credentials) {
    var loginBtn = document.getElementById('my-login'),
        errorPanel = document.getElementById('my-error'),
        xmlHttpRequest = new XMLHttpRequest();

    loginBtn.style.opacity = 0.65;
    loginBtn.style.pointerEvents = 'none';
    loginBtn.innerHTML = 'Signing in..';

    errorPanel.style.display = 'none';

    xmlHttpRequest.onreadystatechange = function () {
        loginBtn.style.opacity = 1;
        loginBtn.style.pointerEvents = 'auto';

        loginBtn.innerHTML = 'Sign in';

        if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 200) {
            document.getElementById('my-sign-in').style.display = 'none';
            document.getElementById('my-signed-in').style.display = 'block';
            document.getElementById('my-username-output').value = credentials.username;
        } else {
            errorPanel.style.display = 'block';
        }
    }

    xmlHttpRequest.open('GET', 'http://192.168.182.1:3990/logon?username=' + credentials.username + '&password=' + credentials.password, true);
    xmlHttpRequest.send();
}

(function () {
    if (localStorage.getItem(key)) {
        var credentials = JSON.parse(localStorage.getItem(key));

        document.getElementById('my-username').value = credentials.username;
        document.getElementById('my-password').value = credentials.password;

        sendCredentials(credentials);
    }

    document.getElementById('my-login').addEventListener('click', function () {
        var credentials = {};

        credentials.username = document.getElementById('my-username').value;
        credentials.password = document.getElementById('my-password').value;

        if (credentials.username && credentials.password) {
            localStorage.setItem(key, JSON.stringify(credentials));

            sendCredentials(credentials);
        }
    });

    document.getElementById('my-logout').addEventListener('click', function () {
        localStorage.removeItem(key);

        document.getElementById('my-sign-in').style.display = 'block';
        document.getElementById('my-signed-in').style.display = 'none';

        document.getElementById('my-username').value = null;
        document.getElementById('my-password').value = null;

        // TODO: logout functionality
    });
})();
