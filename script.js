window.onload = function () {
    updateLocation()
    const keys = Object.keys(sessionStorage)
    for (let key of keys) {
        let item = sessionStorage.getItem(key)
        alert(`${key}: ${item}`)
    }
    sessionStorage.clear()
}

function updateLocation() {
    if(!navigator.geolocation)
        positionError()
    else
        navigator.geolocation.getCurrentPosition(showPosition, positionError)
}

function showPosition(position) {
    alert(`${position.coords.latitude} : ${position.coords.longitude}`)
}

function positionError() {
    alert("Невозможно получить позицию.")
}

function addCity() {
    const favorites = document.getElementById("favorites")
    const name = document.getElementById("favorites-add").getElementsByTagName("input")[0].value
    sessionStorage.setItem(name, '')
    const templ = document.getElementById("city-template").content
    templ.querySelector(".city-name").innerHTML = name
    templ.querySelector(".remove-city-button").setAttribute("onclick", "removeCity(this)")
    templ.querySelector(".temperature").innerHTML = '58˚C'
    const vals = templ.querySelectorAll(".info-value")
    vals[0].innerHTML = 'Умеренный'
    vals[1].innerHTML = 'Облака'
    vals[2].innerHTML = '1013 hpa'
    vals[3].innerHTML = '52%'
    vals[4].innerHTML = '[59.68, 30.42]'
    const clone = document.importNode(templ, true)
    favorites.appendChild(clone)
}

function removeCity(button) {
    document.getElementById("favorites").removeChild(button.parentNode.parentNode)
}