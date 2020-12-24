import sinon from "sinon";
import chai from "chai";
import {App} from "../src/App.js";
import {Api} from "../src/Api.js";

chai.should();
const sandbox = sinon.createSandbox();

const stubCity = {"coord":{"lon":37.62,"lat":55.75},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04n"}],"base":"stations","main":{"temp":-7.33,"feels_like":-14.61,"temp_min":-8,"temp_max":-7,"pressure":1020,"humidity":79},"visibility":10000,"wind":{"speed":6,"deg":190},"clouds":{"all":75},"dt":1608747929,"sys":{"type":1,"id":9029,"country":"RU","sunrise":1608703113,"sunset":1608728326},"timezone":10800,"id":524901,"name":"Moscow","cod":200}

const stubCityResponse = {
    status: 200,
    ok: true,
    body: stubCity
}

const stubConflictResponse = {
    status: 409,
    ok: false,
    body: {
        name: "Moscow"
    }
}

const stubNotFoundResponse = {
    status: 404,
    ok: false,
    body: {}
}

const stubServerErrorResponse = {
    status: 500,
    ok: false,
    body: "Some error"
}

const stubFavorites = [
    {
        "city": "Moscow"
    },
    {
        "city": "Saint Petersburg"
    }
];

describe('Frontend', () => {
    let alertSpy;
    before(() => {
        global.alert = () => {}
    });
    beforeEach(() => {
        alertSpy = sandbox.spy(global, 'alert');
    })
    after(() => {
        sandbox.restore();
        delete global.window;
    });
    afterEach(() => {
        sandbox.resetHistory();
        sandbox.restore();
    });
    describe('Favorites list', () => {
        it('should load favorites', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'getFavoritesList').resolves(stubFavorites);
            sandbox.stub(App.prototype, 'loadCity');
            const app = new App();
            await app.loadFavorites();

            fetchStub.calledOnce.should.be.true;
            app.loadCity.callCount.should.equal(2);
            alertSpy.called.should.be.false;
        });
        it('should load empty list', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'getFavoritesList').resolves([]);
            sandbox.stub(App.prototype, 'loadCity');
            const app = new App();
            await app.loadFavorites();

            fetchStub.calledOnce.should.be.true;
            app.loadCity.callCount.should.equal(0);
            alertSpy.called.should.be.false;
        });
        it('should alert about loading error', async () => {
            sandbox.stub(Api.prototype, 'getFavoritesList').resolves(null);
            sandbox.stub(App.prototype, 'loadCity');
            const app = new App();
            await app.loadFavorites();

            app.loadCity.called.should.be.false;
            alert.calledOnce.should.be.true;
            alertSpy.calledWith('Не удалось загрузить избранное').should.be.true
        });
    });
    describe('Local weather', () => {
        it('should load weather for current city', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'loadWeatherByLocation').resolves(stubCityResponse);
            sandbox.stub(App.prototype, 'populateLocalWeather');
            const app = new App();
            await app.showPosition({coords: {latitude: 'lat', longitude: 'lng'}});

            fetchStub.calledOnce.should.be.true;
            fetchStub.calledWith('lat', 'lng').should.be.true
            app.populateLocalWeather.calledOnce.should.be.true;
            alertSpy.called.should.be.false;
        });
        it('should alert about loading by location error', async () => {
            sandbox.stub(Api.prototype, 'loadWeatherByLocation').resolves(null);
            sandbox.stub(App.prototype, 'populateLocalWeather');
            const app = new App();
            await app.showPosition({coords: {latitude: 'lat', longitude: 'lng'}});

            app.populateLocalWeather.called.should.be.false;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Ошибка сети при загрузке текущей локации').should.be.true
        });
        it('should load weather for default city', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'loadWeatherByName').resolves(stubCityResponse);
            sandbox.stub(App.prototype, 'populateLocalWeather');
            const app = new App();
            await app.positionError();

            fetchStub.calledOnce.should.be.true;
            fetchStub.calledWith('Saint Petersburg').should.be.true;
            app.populateLocalWeather.calledOnce.should.be.true;
            alertSpy.called.should.be.false;
        });
        it('should alert about loading by name error', async () => {
            sandbox.stub(Api.prototype, 'loadWeatherByName').resolves(null);
            sandbox.stub(App.prototype, 'populateLocalWeather');
            const app = new App();
            await app.positionError();

            app.populateLocalWeather.called.should.be.false;
            alertSpy.calledOnce.should.be.true;
            alertSpy.calledWith('Ошибка сети при загрузке текущей локации').should.be.true
        });
    });
    describe('Favorites-add', () => {
        it('should add city to favorites', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'addFavorite').resolves(stubCityResponse);
            sandbox.stub(App.prototype, 'createCity');
            sandbox.stub(App.prototype, 'showLoading');
            sandbox.stub(App.prototype, 'resetForm');
            const app = new App();
            await app.addNewCity("Moscow");

            fetchStub.calledOnce.should.be.true;
            app.createCity.calledOnce.should.be.true;
            app.showLoading.called.should.be.true;
            app.resetForm.calledOnce.should.be.true;
            alertSpy.called.should.be.false;
        });
        it('should alert about empty field', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'addFavorite').resolves(stubCityResponse);
            sandbox.stub(App.prototype, 'createCity');
            sandbox.stub(App.prototype, 'showLoading');
            sandbox.stub(App.prototype, 'resetForm');
            const app = new App();
            await app.addNewCity("");

            fetchStub.called.should.be.false;
            app.createCity.calledOnce.should.be.false;
            app.showLoading.called.should.be.false;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Задан пустой запрос').should.be.true
        });
        it('should alert about city conflict', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'addFavorite').resolves(stubConflictResponse);
            sandbox.stub(App.prototype, 'createCity');
            sandbox.stub(App.prototype, 'showLoading');
            sandbox.stub(App.prototype, 'resetForm');
            const app = new App();
            await app.addNewCity("Moscow");

            fetchStub.calledOnce.should.be.true;
            app.createCity.calledOnce.should.be.false;
            app.showLoading.called.should.be.true;
            app.resetForm.calledOnce.should.be.true;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Moscow уже находится в избранном.').should.be.true
        });
        it('should alert about city not found', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'addFavorite').resolves(stubNotFoundResponse);
            sandbox.stub(App.prototype, 'createCity');
            sandbox.stub(App.prototype, 'showLoading');
            sandbox.stub(App.prototype, 'resetForm');
            const app = new App();
            await app.addNewCity("Moscow");

            fetchStub.calledOnce.should.be.true;
            app.createCity.calledOnce.should.be.false;
            app.showLoading.called.should.be.true;
            app.resetForm.calledOnce.should.be.true;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Город не найден: "Moscow"').should.be.true
        });
        it('should alert about loading error', async () => {
            sandbox.stub(Api.prototype, 'addFavorite').resolves(null);
            sandbox.stub(App.prototype, 'createCity');
            sandbox.stub(App.prototype, 'showLoading');
            sandbox.stub(App.prototype, 'resetForm');
            const app = new App();
            await app.addNewCity("Moscow");

            app.createCity.calledOnce.should.be.false;
            app.showLoading.called.should.be.true;
            app.resetForm.calledOnce.should.be.true;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Ошибка сети').should.be.true
        });
    });
    describe('Favorites-load', () => {
        it('should load city from favorites', async () => {
            let fetchStub = sandbox.stub(Api.prototype, 'loadWeatherByName').resolves(stubCityResponse);
            sandbox.stub(App.prototype, 'createPlaceholder');
            sandbox.stub(App.prototype, 'populateCity');
            const app = new App();
            await app.loadCity("Moscow");

            fetchStub.calledOnce.should.be.true;
            app.createPlaceholder.calledOnce.should.be.true;
            app.populateCity.calledOnce.should.be.true;
            alertSpy.called.should.be.false;
        });
        it('should alert about loading error', async () => {
            sandbox.stub(Api.prototype, 'loadWeatherByName').resolves(null);
            sandbox.stub(App.prototype, 'createPlaceholder');
            sandbox.stub(App.prototype, 'populateCity');
            const app = new App();
            await app.loadCity("Moscow");

            app.populateCity.called.should.be.false;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Не удалось загрузить город: Moscow. Ошибка сети').should.be.true
        });
        it('should alert about server error', async () => {
            sandbox.stub(Api.prototype, 'loadWeatherByName').resolves(stubServerErrorResponse);
            sandbox.stub(App.prototype, 'createPlaceholder');
            sandbox.stub(App.prototype, 'populateCity');
            const app = new App();
            await app.loadCity("Moscow");

            app.populateCity.called.should.be.false;
            alertSpy.called.should.be.true;
            alertSpy.calledWith('Ошибка на сервере').should.be.true
        });
    })
    describe('Utilities', () => {
        it('should capitalize first letter', async () => {
            const app = new App();
            const result = app.capitalizeFirst('tesT')

            result.should.equal('TesT')
        });
    });
})