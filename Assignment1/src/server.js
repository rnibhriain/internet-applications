const express = require('express')
const app = express()
const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));
const port = 3000
const apiKey = "5ef6251a430ba4bca2ca9331f555f7f5";
const factKey = "KJcK1fKcuKJVoXawMFNsgA==kRNvXRXS5NK1rQhc";

const request = require('request');

const sendData= async (req, res) => {

    let city = req.params.city;
    let result = await returnData(city);

    let temp = result.main.temp - 273.15;
    let lat = result.coord.lat;
    let lon = result.coord.lon;

    let quality = await fetch('http://api.openweathermap.org/data/2.5/air_pollution?lat='+ lat+'&lon='+lon+'&appid=' + apiKey);
    const myJson = await quality.json();
    console.log("temp: ", temp);

    let air = myJson.list[0].components.pm2_5;
    
    console.log("air: ", air);
    console.log("temp: ", temp);

    let forecast = await getForecast(city);
    let rain = checkForRain(forecast);
    let rainfall = [...returnRainfall(forecast)];
    let windspeed = [...returnWindspeed(forecast)];
    let Avgtemp = [...returnAvgTemp(forecast)];
    var fact = "";
    var population = 0;

    cityData(city).then(function(val) {
        population =  val.population;
        capital = val.is_capital;
        country = val.country;

        funFact().then(function(data) {

            fact = data.fact;

            res.json( {
            temp : temp,
            air: air,
            rain: rain,
            rainfall: rainfall,
            windspeed: windspeed,
            Avgtemp: Avgtemp,
            population: population,
            capital: capital,
            country: country,
            fact: fact
            });

        }).catch(function(err) {
            console.log(err);
        });

    }).catch(function(err) {
        console.log(err);
    });
    
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

const returnData = async (city_name) => {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    return data;
}

const getForecast = async (city_name) => {
    const response = await fetch('https://api.openweathermap.org/data/2.5/forecast?q=' + city_name+ '&appid=' + apiKey);
    const data = await response.json(); //extract JSON from the http response
    return data;
}