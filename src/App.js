import {Api} from "./Api.js";

const defaultCity = "Saint Petersburg";

export class App {

    constructor() {
        this.api = new Api();
    }

    start() {
        document.getElementById("refresh-button").addEventListener("click", e => this.updateLocation(e))
        document.getElementById("favorites-add").addEventListener("submit", e => {
            e.preventDefault()
            this.addNewCity(e.target.elements.cityName.value)
        })
        const lang = navigator.language.slice(0, 2)
        if (lang) {
            this.api.setLang(lang)
        }
        else {
            this.api.setLang('en')
        }
        this.updateLocation()
        this.loadFavorites()
    }

    loadFavorites() {
        this.api.getFavoritesList()
            .then(res => {
                if (res) {
                    for (let fav of res) {
                        this.loadCity(fav.city)
                    }
                }
                else {
                    alert('Не удалось загрузить избранное')
                }
            })
    }

    updateLocation() {
        document.getElementById("local-weather").style.display = 'none'
        document.getElementById("local-weather-placeholder").style.display = 'flex'
        if (!navigator.geolocation) {
            this.positionError()
        } else {
            navigator.geolocation.getCurrentPosition(pos => this.showPosition(pos), () => this.positionError())
        }
    }

    showPosition(position) {
        this.api.loadWeatherByLocation(position.coords.latitude, position.coords.longitude)
            .then(data => {
                if (data && data.ok) {
                    this.populateLocalWeather(data.body)
                }
                else {
                    alert('Ошибка сети при загрузке текущей локации')
                }
            })
    }

    positionError() {
        this.api.loadWeatherByName(defaultCity)
            .then(data => {
                if (data && data.ok) {
                    this.populateLocalWeather(data.body)
                }
                else {
                    alert('Ошибка сети при загрузке текущей локации')
                }
            })
    }

    loadCity(name) {
        const container = this.createPlaceholder()
        this.api.loadWeatherByName(name)
            .then((response) => {
                if (!response) {
                    alert(`Не удалось загрузить город: ${name}. Ошибка сети`)
                    return
                }
                if (response.status === 500) {
                    alert('Ошибка на сервере')
                } else {
                    this.populateCity(response.body, container)
                }
            })
    }

    addNewCity(name) {
        if (!name) {
            alert("Задан пустой запрос")
            return
        }
        this.showLoading(true)
        this.api.addFavorite(name)
            .then((response) => {
                if (!response) {
                    alert('Ошибка сети')
                    return
                }
                if (response.status === 404) {
                    alert(`Город не найден: "${name}"`)
                } else if (response.status === 409) {
                    alert(`${name} уже находится в избранном.`)
                } else {
                    this.createCity(response.body)
                }
            })
            .then(() => this.showLoading(false))
        this.resetForm()
    }

    createCity(body) {
        const templ = document.getElementById("city-template").content
        const clone = document.importNode(templ, true)
        const container = clone.querySelector(".city-container")
        this.populateCity(body, container)
        document.getElementById("favorites").appendChild(clone)
    }

    createPlaceholder() {
        const favorites = document.getElementById("favorites")
        const templ = document.getElementById("city-template").content
        const clone = document.importNode(templ, true)
        const container = clone.querySelector(".city-container")
        container.querySelector(".weather-info-placeholder").style.display = 'flex'
        container.querySelector(".extended-info").style.display = 'none'
        container.querySelector(".weather-icon-mini").style.display = 'none'
        container.querySelector(".city-name").innerHTML = name
        favorites.appendChild(clone)
        return container
    }

    showLoading(show) {
        const form = document.getElementById('favorites-add')
        form.querySelector(".loader").style.display = show ? 'inline' : ''
        form.elements.submitButton.style.display = show ? 'none' : ''
    }

    resetForm() {
        document.getElementById('favorites-add').reset()
    }

    populateCity(data, container) {
        container.querySelector(".remove-city-button").addEventListener("click", e => this.removeCity(e))
        const icon = container.querySelector(".weather-icon-mini")
        icon.src = `icons/${data.weather[0].icon}.png`
        icon.style.display = 'inline'
        container.querySelector(".city-name").innerHTML = data.name
        container.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp)}˚C`
        container.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`
        container.querySelector(".clouds").innerHTML = this.capitalizeFirst(data.weather[0].description)
        container.querySelector(".pressure").innerHTML = `${data.main.pressure} hpa`
        container.querySelector(".humidity").innerHTML = `${data.main.humidity}%`
        container.querySelector(".coordinates").innerHTML = `[${data.coord.lat}, ${data.coord.lon}]`
        container.querySelector(".extended-info").style.display = ''
        container.removeChild(container.querySelector(".weather-info-placeholder"))
    }

    populateLocalWeather(data) {
        const local = document.getElementById("local-weather")
        local.querySelector(".weather-icon").src = `icons/${data.weather[0].icon}.png`
        local.querySelector("h2").innerHTML = data.name
        local.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp)}˚C`
        local.querySelector(".wind").innerHTML = `${data.wind.speed} m/s`
        local.querySelector(".clouds").innerHTML = this.capitalizeFirst(data.weather[0].description)
        local.querySelector(".pressure").innerHTML = `${data.main.pressure} hpa`
        local.querySelector(".humidity").innerHTML = `${data.main.humidity}%`
        local.querySelector(".coordinates").innerHTML = `[${data.coord.lat}, ${data.coord.lon}]`
        document.getElementById("local-weather-placeholder").style.display = 'none'
        document.getElementById("local-weather").style.display = ''
    }

    capitalizeFirst(string) {
        return string[0].toUpperCase() + string.slice(1)
    }

    removeCity(event) {
        event.target.disabled = true
        const city = event.target.parentNode
        const name = city.querySelector(".city-name").innerHTML
        this.api.removeFavorite(name)
            .then(res => {
                if (!res) {
                    alert("Ошибка сети")
                    event.target.disabled = false
                    return
                }
                if (res.status === 500) {
                    alert('Ошибка на сервере при удалении города ' + name)
                    event.target.disabled = false
                }
                else {
                    document.getElementById("favorites").removeChild(city.parentNode)
                }
            })
    }
}