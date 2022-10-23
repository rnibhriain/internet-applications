const express = require('express')
const app = express()
const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));
const port = 3000
const apiKey = "5ef6251a430ba4bca2ca9331f555f7f5";
const factKey = "KJcK1fKcuKJVoXawMFNsgA==kRNvXRXS5NK1rQhc";

let AvgTemp = [];
let AvgRain = [];
let AvgWind = [];

const request = require('request');

// making response json for the client
const sendData = async (req, res) => {

    let city = req.params.city;
    let result = await returnData(city);

    // get lat and lon
    let lat = result.coord.lat;
    let lon = result.coord.lon;

    // get air quality
    let quality = await fetch('http://api.openweathermap.org/data/2.5/air_pollution?lat='+ lat+'&lon='+lon+'&appid=' + apiKey);
    const myJson = await quality.json();
    let air = myJson.list[0].components.pm2_5;

    let forecast = await getForecast(city);
    let rain = checkForRain(forecast);
    let temp = returnAvgs(forecast);

    var population = 0;

    // when city data has been received
    cityData(city).then(function(val) {
        population =  val.population;
        capital = val.is_capital;
        country = val.country;

        // when fun fact has been received
        funFact().then(function(data) {

            res.json( {
            air: air,
            rain: rain,
            temp: temp,
            rainfall: AvgRain,
            windspeed: AvgWind,
            Avgtemp: AvgTemp,
            population: population,
            capital: capital,
            country: country,
            fact: data.fact
            });

        }).catch(function(err) {
            console.log(err);
        });

    }).catch(function(err) {
        console.log(err);
    });
    
}

// returns data for summary table and the avg temperature
function returnAvgs (forecast) {
    AvgTemp = [];
    AvgRain = [];
    AvgWind = [];

    fourDayTempAvg = 0;

    // get first day date
    var unix_timestamp = forecast.list[0].dt;
    var date = new Date(unix_timestamp * 1000);
    var day = date.getDate();

    // initialise the values
    var count = 0;
    let averageTemp = 0;
    let averageRain = 0;
    let averageWind = 0;
    var currentDate = day;
    var j = 0;
    var i = 0
    
    for (; i < 40 && count < 5; count++) {

        // reset the averages
        averageTemp = 0;
        averageRain = 0;
        averageWind = 0;

        unix_timestamp = forecast.list[i].dt;
        date = new Date(unix_timestamp * 1000);
        day = currentDate;

        for (j = 0 ;day == currentDate ; j++, i++) {
            
            unix_timestamp = forecast.list[i].dt;
            date = new Date(unix_timestamp * 1000);

            // date part from the timestamp
            currentDate = date.getDate();

            // get temperature for that hour
            let currentTemp = forecast.list[i].main.temp;
            if (!isNaN(currentTemp)) {
                    averageTemp += currentTemp- 273.15;
                    fourDayTempAvg += currentTemp - 273.15;
            }

            // get rainfall for that hour
            let rain = forecast.list[i].rain;
            if (rain != undefined) {
                let currentRain = forecast.list[i].rain['3h'];
                if (!isNaN(currentRain)) {
                    averageRain += currentRain;
                }
            }

            // get windspeed for that hour
            let wind = forecast.list[i].wind.speed;
            if (wind != undefined) {
                let currentWind = forecast.list[i].wind.speed;
                if (!isNaN(currentWind)) {
                    averageWind += currentWind;
                }
            }
            
        }

        // as long as it is the current day
        if (count != 0) {
            AvgTemp.push((averageTemp/j).toFixed(2));
            AvgRain.push((averageRain/j).toFixed(2));
            AvgWind.push((averageWind/j).toFixed(2));
        }
        
    }
    return fourDayTempAvg/i;
}

// if there is rain any of the days return true
function checkForRain (forecast) {
    for (var i in forecast.list) { 
        if (forecast.list[i].weather[0].main == "Rain") {
            return true;
        }
    }
    return false;
}

// gets a random fun fact
const funFact = async () => {
    return new Promise (function (resolve, reject ) {
        var limit = 1;
        request.get({
        url: 'https://api.api-ninjas.com/v1/facts?limit=' + limit,
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': factKey
        },
        }, function(error, response, body) {
            if(error) return reject(error);
            else if(response.statusCode != 200) return reject(response.statusCode);
            else { 
                try {
                    resolve(JSON.parse(body)[0]);
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
}

// gets some data about the city
const cityData = async (city_name) => {
    return new Promise (function (resolve, reject ) {
        request.get({
        url: 'https://api.api-ninjas.com/v1/city?name=' + city_name,
        headers: {
            'Content-Type': 'application/json', 
            'X-Api-Key': factKey 
        },
        }, function(error, response, body) {
            if(error) return reject(error);
            else if(response.statusCode != 200) return reject(response.statusCode);
            else { 
                try {
                    resolve(JSON.parse(body)[0]);
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
}

const path=require("path");
const { parseArgs } = require('util'); 
let publicPath= path.resolve(__dirname,"");
app.use(express.static(publicPath));
app.get('/data/:city', sendData);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// gets current weather data
const returnData = async (city_name) => {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    return data;
}

// gets the five day forecast
const getForecast = async (city_name) => {

    const response = await fetch('https://api.openweathermap.org/data/2.5/forecast?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    return data;

}