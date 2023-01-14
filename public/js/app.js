const $ = (id) => document.getElementById(id)
var xhr = new XMLHttpRequest();
xhr.open("POST", "http://localhost:3000/category/process_request", true);
xhr.setRequestHeader('Content-Type', 'application/json');

$('submit').onclick = () => {
    const username = $('username').value
    const email = $('email').value
    xhr.send(JSON.stringify({
        username: username,
        email: email
    }));
}