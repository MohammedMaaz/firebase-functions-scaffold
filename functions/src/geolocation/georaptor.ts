//@ts-nocheck
const get_combinations = (str) => {
  const base32 = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'j',
    'k',
    'm',
    'n',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ];
  return base32.map((ch) => str + ch);
};

const isSubset = (subSet, _set) => {
  return new Set([..._set, ...subSet]).size === _set.size;
};

const georaptor = (geohashes, minlevel, maxlevel) => {
  let deletegh = new Set(),
    final_geohashes = new Set(),
    flag = true,
    final_geohashes_size = 0;
  let i = 0;

  while (flag) {
    console.log('Count', i++);
    final_geohashes.clear();
    deletegh.clear();

    for (let geohash of geohashes) {
      let geohash_length = geohash.length;

      if (geohash_length >= minlevel) {
        let part = geohash.slice(0, -1);

        if (!deletegh.has(part) && !deletegh.has(geohash)) {
          let combinations = new Set(get_combinations(part));

          if (isSubset(combinations, geohashes)) {
            final_geohashes.add(part);
            deletegh.add(part);
          } else {
            deletegh.add(geohash);
            if (geohash_length >= maxlevel)
              final_geohashes.add(geohash.slice(0, maxlevel));
            else final_geohashes.add(geohash);
          }
          if (final_geohashes_size === final_geohashes.size) flag = false;
        }
      }
    }
    final_geohashes_size = final_geohashes.size;
    geohashes.clear();
    geohashes = new Set([...geohashes, ...final_geohashes]);
  }
  return geohashes;
};

module.exports = georaptor;
