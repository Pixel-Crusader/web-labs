var lang
const defaultCity = "Saint Petersburg"
const baseUrl = "http://localhost:3000"

window.onload = function () {
    document.getElementById("refresh-button").addEventListener("click", updateLocation)
    document.getElementById("favorites-add").addEventListener("submit", addNewCity)
    lang = navigator.language.slice(0,2)
    updateLocation()
    fetch(`${baseUrl}/favorites`)
        .then(res => res.json())
        .then(res => {
            for (let fav of res) {
                loadCity(fav.city)
            }
        })
        .catch(err => {
            alert('Не удалось загрузить избранное')
            console.log(err)
        })
}

function updateLocation() {
    document.getElementById("local-weather").style.display = 'none'
    document.getElementById("local-weather-placeholder").style.display = 'flex'
    if(!navigator.geolocation) {
        positionError()
    }
    else {
        navigator.geolocation.getCurrentPosition(showPosition, positionError)
    }
}

function showPosition(position) {
    fetch(`${baseUrl}/weather/coordinates?lat=${position.coords.latitude}&long=${position.coords.longitude}&lang=${lang}`)
        .then((response) => response.json())
        .then((data) => populateLocalWeather(data))
        .catch((error) => {
            if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
                alert('Ошибка сети при загрузке текущей локации')
            }
            else {
                console.log(error)
            }
        })
}

function positionError() {
    // alert("Невозможно получить геолокацию.")
    fetch(`${baseUrl}/weather/city?q=${defaultCity}&lang=${lang}`)
        .then((response) => response.json())
        .then((data) => populateLocalWeather(data))
        .catch((error) => {
            if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
                alert('Ошибка сети при загрузке города ' + defaultCity)
            }
            else {
                console.log(error)
            }
        })
}

function loadCity(name) {
    const favorites = document.getElementById("favorites")
    const templ = document.getElementById("city-template").content
    const clone = document.importNode(templ, true)
    const container = clone.querySelector(".city-container")
    container.querySelector(".weather-info-placeholder").style.display = 'flex'
    container.querySelector(".extended-info").style.display = 'none'
    container.querySelector(".weather-icon-mini").style.display = 'none'
    container.querySelector(".city-name").innerHTML = name
    favorites.appendChild(clone)
    fetch(`${baseUrl}/weather/city?q=${name}&lang=${lang}`)
        .then((response) => {
            if (response.status === 500) {
                alert('Ошибка на сервере')
            }
            else {
                return response.json()
            }
        })
        .then((data) => {
            if (data) {
                populateCity(data, container)
            }
        })
        .catch((error) => {
            if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
                alert(`Не удалось загрузить город: ${name}. Ошибка сети`)
            }
            else {
                console.log(error)
            }
        })
}

function addNewCity(event) {
    event.preventDefault()
    const form = event.target
    const name = form.elements.cityName.value
    if (!name) {
        alert("Задан пустой запрос")
        return
    }
    const templ = document.getElementById("city-template").content
    const clone = document.importNode(templ, true)
    const container = clone.querySelector(".city-container")
    showLoading(form, true)
    fetch(`${baseUrl}/favorites`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name, lang: lang }) })
        .then((response) => {
            if (response.status === 404) {
                alert(`Город не найден: "${name}"`)
            }
            else if (response.status === 409) {
                alert(`${name} уже находится в избранном.`)
            }
            else {
                return response.json()
            }
        })
        .then((data) => {
            if (data) {
                populateCity(data, container)
                document.getElementById("favorites").appendChild(clone)
            }
        })
        .then(() => showLoading(form, false))
        .catch((error) => {
            showLoading(form, false)
            if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
                alert('Ошибка сети')
            }
            else {
                console.log(error)
            }
        })
    form.reset()
}

function showLoading(form, show) {
    form.querySelector(".loader").style.display = show ? 'inline' : ''
    form.elements.submitButton.style.display = show ? 'none' : ''
}

function populateCity(data, container) {
    container.querySelector(".remove-city-button").addEventListener("click", removeCity)
    const icon = container.querySelector(".weather-icon-mini")
    icon.src = `icons/${data.weather[0].icon}.png`
    icon.style.display = 'inline'
    container.querySelector(".city-name").innerHTML = data.name
    container.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp)}˚C`
    container.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`
    container.querySelector(".clouds").innerHTML = capitalizeFirst(data.weather[0].description)
    container.querySelector(".pressure").innerHTML = `${data.main.pressure} hpa`
    container.querySelector(".humidity").innerHTML = `${data.main.humidity}%`
    container.querySelector(".coordinates").innerHTML = `[${data.coord.lat}, ${data.coord.lon}]`
    container.querySelector(".extended-info").style.display = ''
    container.removeChild(container.querySelector(".weather-info-placeholder"))
}

function populateLocalWeather(data) {
    const local = document.getElementById("local-weather")
    local.querySelector(".weather-icon").src = `icons/${data.weather[0].icon}.png`
    local.querySelector("h2").innerHTML = data.name
    local.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp)}˚C`
    local.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`
    local.querySelector(".clouds").innerHTML = capitalizeFirst(data.weather[0].description)
    local.querySelector(".pressure").innerHTML = `${data.main.pressure} hpa`
    local.querySelector(".humidity").innerHTML = `${data.main.humidity}%`
    local.querySelector(".coordinates").innerHTML = `[${data.coord.lat}, ${data.coord.lon}]`
    document.getElementById("local-weather-placeholder").style.display = 'none'
    document.getElementById("local-weather").style.display = ''
}

function capitalizeFirst(string) {
    return string[0].toUpperCase() + string.slice(1)
}

function removeCity(event) {
    event.target.disabled = true
    const city = event.target.parentNode
    const name = city.querySelector(".city-name").innerHTML
    fetch(`${baseUrl}/favorites?name=${name}`, { method: 'DELETE' })
        .then(res => {
            if (res.status === 500) {
                alert('Ошибка на сервере при удалении города ' + name)
                event.target.disabled = false
            }
            document.getElementById("favorites").removeChild(city.parentNode)
        })
        .catch(err => {
            console.log(err)
            if (err.message === 'Failed to fetch' || err.message === 'Network request failed') {
                alert("Ошибка сети")
                event.target.disabled = false
            }
        })
}