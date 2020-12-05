"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceAndDuration = void 0;
//@ts-nocheck
const fetch = require('node-fetch');
exports.distanceAndDuration = (lat1, lng1, lat2, lng2) => {
    return new Promise((resolve, reject) => {
        fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${lat1},${lng1}&destinations=${lat2},${lng2}&key=AIzaSyBvO-bHlACJ8_gnP1OLCoH9N7VLrCTt7vY`)
            .then((response) => response.json())
            .then((json) => {
            const elem = json.rows[0].elements[0];
            if (elem.status !== 'ZERO_RESULTS') {
                return resolve({
                    duration: elem.duration.value,
                    distance: elem.distance.value,
                });
            }
            else
                return resolve({
                    duration: 'N/A',
                    distance: 'N/A',
                });
        })
            .catch((e) => {
            return reject(e);
        });
    });
};
