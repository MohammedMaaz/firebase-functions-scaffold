//@ts-nocheck
const { decode_bbox, bboxes } = require('ngeohash');
const Geo = require('./index');
const monteCarloCircleArea = ({ cLat, cLng, radius, minLat, minLng, maxLat, maxLng, simCount = 1000, }) => {
    let inCircleCounts = 0;
    let rectArea = Geo.get_distance(minLat, minLng, maxLat, minLng) *
        Geo.get_distance(minLat, minLng, minLat, maxLng);
    for (let i = 0; i < simCount; ++i) {
        //gen a random coord within rectangle bounds
        const pLat = Math.random() * (maxLat - minLat) + minLat;
        const pLng = Math.random() * (maxLng - minLng) + minLng;
        //if this point is also a part of the circle then increment inCircleCounts
        if (Geo.get_distance(cLat, cLng, pLat, pLng) <= radius)
            inCircleCounts++;
    }
    const percent = inCircleCounts / simCount;
    const circleArea = percent * rectArea;
    return { circleArea, rectArea, percentage: percent * 100 };
};
const lazyCompression = ({ geoHashes, lat, lng, radius, error, precision }) => {
    const maxVacantAreaPercentage = 50; //vacant area possessed by a geohash as a percentage of circle's own area
    const MC_Samples = 1000;
    let extraHashes = [];
    let toDeleteHashes = [];
    const decOffset = 0.0008;
    for (let hash of geoHashes) {
        const hashBox = decode_bbox(hash);
        //get area of intersection of circle with this hash
        const { percentage } = monteCarloCircleArea({
            cLat: lat,
            cLng: lng,
            radius,
            minLat: hashBox[1],
            minLng: hashBox[0],
            maxLat: hashBox[3],
            maxLng: hashBox[2],
            simCount: MC_Samples,
        });
        const vacantAreaPercentage = 100 - percentage;
        //if vacant area is more than allowed
        if (vacantAreaPercentage > maxVacantAreaPercentage) {
            //then remove then decompose this hash into one level smaller hashes
            toDeleteHashes.push(hash);
            extraHashes.push(...bboxes(hashBox[0] + decOffset, hashBox[1] + decOffset, hashBox[2] - decOffset, hashBox[3] - decOffset, precision + 1).filter((_hash) => !Geo.is_hash_outside_circle(_hash, lat, lng, radius, error)));
        }
    }
    //delete required hashes
    for (let hash of toDeleteHashes)
        geoHashes.delete(hash);
    //add new hashes
    for (let hash of extraHashes)
        geoHashes.add(hash);
    return geoHashes;
};
module.exports = lazyCompression;
