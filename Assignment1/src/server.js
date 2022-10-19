const express = require('express')
const app = express()
const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));
const port = 3000
const apiKey = "5ef6251a430ba4bca2ca9331f555f7f5";
var lat = 50;
var lon = 50;

const sendrandom = async (req, res) => {
    let min = parseInt(req.params.min);
    let city = req.params.city;
    let result = await returnData(city);

    let temp = result.main.temp - 273.15;
    lat = result.coord.lat;
    lon = result.coord.lon;

    let quality = await fetch('http://api.openweathermap.org/data/2.5/air_pollution?lat='+ lat+'&lon='+lon+'&appid=' + apiKey);
    const myJson = await quality.json();
    console.log(myJson);
    console.log("temp: ", temp);
    let air = myJson.list[0].components.pm2_5;
    console.log("air: ", air);
    console.log("temp: ", temp);
    let max = parseInt(req.params.max);
    if (isNaN(min) || isNaN(max)) {
        res.status(400);
        res.json( {error : "Bad Request."});
        return;
    }

    let forecast = await getForecast(city);
    let rain = checkForRain(forecast);
    let rainfall = [...returnRainfall(forecast)];
    let windspeed = [...returnWindspeed(forecast)];
    let Avgtemp = [...returnAvgTemp(forecast)];

    res.json( {
            temp : temp,
            air: air,
            rain: rain,
            rainfall: rainfall,
            windspeed: windspeed,
            Avgtemp: Avgtemp
            });
    console.log(city);
    
}

function returnAvgTemp (forecast) {
    let temp = [];
    for (var i = 0; i < 4; i ++) {
        let average = 0;
        for (var j = 0; j < 6; j++) {
            let rain = forecast.list[(1+i)*(j+1)].main.temp;
            if (rain != undefined) {
                let current = forecast.list[(1+i)*(j+1)].main.temp;
                if (!isNaN(current)) {
                    average += current- 273.15;
                }
            }
            
        }
        temp.push((average/6).toFixed(2));
    }

    return temp;

}

function returnWindspeed (forecast) {
    let windspeed = [];
    for (var i = 0; i < 4; i ++) {
        let average = 0;
        for (var j = 0; j < 6; j++) {
            let rain = forecast.list[(1+i)*(j+1)].wind.speed;
            if (rain != undefined) {
                let current = forecast.list[(1+i)*(j+1)].wind.speed;
                if (!isNaN(current)) {
                    average += current;
                }
            }
            
        }
        windspeed.push((average/6).toFixed(2));
    }

    return windspeed;

}

function returnRainfall (forecast) {
    let rainfall = [];
    for (var i = 0; i < 4; i ++) {
        let average = 0;
        for (var j = 0; j < 6; j++) {
            //console.log(forecast.list[(1+i)*(j+1)].rain['3h']);
            let rain = forecast.list[(1+i)*(j+1)].rain;
            if (rain != undefined) {
                let current = forecast.list[(1+i)*(j+1)].rain['3h'];
                if (!isNaN(current)) {
                    average += current;
                }
            }
            
        }
        rainfall.push((average/6).toFixed(2));
    }

    return rainfall;

}

function checkForRain (forecast) {
    console.log(forecast.list[0].weather[0].main);
    for (var i in forecast.list) { 
        if (forecast.list[i].weather[0].main == "Rain") {
            return true;
        }
    }
    return false;
}

const path=require("path");
const { parseArgs } = require('util'); 
let publicPath= path.resolve(__dirname,"");
app.use(express.static(publicPath));
app.get('/random/:min/:max/:city', sendrandom);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
const returnData = async (city_name) => {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    console.log(data);
    return data;
}

const getForecast = async (city_name) => {
    const response = await fetch('https://api.openweathermap.org/data/2.5/forecast?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    console.log(data);
    return data;
}