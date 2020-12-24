const defaultCity = "Saint Petersburg";
const baseUrl = "http://localhost:3000";
let lang;

export class Api {

    setLang(newLang) {
        lang = newLang
    }

    async getFavoritesList() {
        try{
            const response = await fetch(`${baseUrl}/favorites`);
            return await response.json();
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

    async addFavorite(name) {
        try {
            const response = await fetch(`${baseUrl}/favorites`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: name, lang: lang})
            })
            return {
                status: response.status,
                ok: response.ok,
                body: await response.json()
            };
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

    async removeFavorite(name) {
        try {
            const response = await fetch(`${baseUrl}/favorites?name=${name}`, {method: 'DELETE'})
            return {
                status: response.status,
                ok: response.ok,
                body: await response.json()
            };
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

    async loadWeatherByLocation(lat, long) {
        try {
            const response = await fetch(`${baseUrl}/weather/coordinates?lat=${lat}&long=${long}&lang=${lang}`)
            return {
                status: response.status,
                ok: response.ok,
                body: await response.json()
            };
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

    async loadWeatherByName(name) {
        try {
            const response = await fetch(`${baseUrl}/weather/city?q=${name}&lang=${lang}`)
            return {
                status: response.status,
                ok: response.ok,
                body: await response.json()
            };
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

}