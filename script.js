var lang

window.onload = function () {
    updateLocation()
    const keys = Object.keys(sessionStorage)
    for (let key of keys) {
        let item = sessionStorage.getItem(key)
        alert(`${key}: ${item}`)
    }
    sessionStorage.clear()
    lang = navigator.language.slice(0,2)
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
    alert("Невозможно получить геолокацию.")
}

function addCity(form) {
    const favorites = document.getElementById("favorites")
    const name = form.elements.name.value
    // sessionStorage.setItem(name, '')
    const templ = document.getElementById("city-template").content
    const clone = document.importNode(templ, true)
    const container = clone.querySelector(".city-container")
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${name}&units=metric&lang=${lang}&appid=3a8e27db2f53d5233b5e559948a133b6`)
        .then((response) => response.json())
        .then((data) => {
            populateCity(data, container)
            favorites.appendChild(clone)
        })
        .catch((error) => console.log(error))
}

function populateCity(data, container) {
    container.querySelector(".weather-icon-mini").src = `icons/${data.weather[0].icon}.png`
    container.querySelector(".city-name").innerHTML = data.name
    container.querySelector(".temperature").innerHTML = `${data.main.temp.toString().split('.', 1)[0]}˚C`
    container.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`
    container.querySelector(".clouds").innerHTML = capitalizeFirst(data.weather[0].description)
    container.querySelector(".pressure").innerHTML = `${data.main.pressure} hpa`
    container.querySelector(".humidity").innerHTML = `${data.main.humidity}%`
    container.querySelector(".coordinates").innerHTML = `[${data.coord.lat}, ${data.coord.lon}]`
}

function capitalizeFirst(string) {
    return string[0].toUpperCase() + string.slice(1)
}

function removeCity(button) {
    document.getElementById("favorites").removeChild(button.parentNode.parentNode)
}