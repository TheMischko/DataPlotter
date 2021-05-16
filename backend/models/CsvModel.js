const fs = require('fs');
const csv = require('csv-parser');

const csv_dir = process.env.CSV_FILE_FOLDER;

/**
 * Scales for generation values over data from CSV files.
 * Scale is a function with index of current value as input and should return some float value.
 * @type {{"logarithmic scale": (function(*=): number), "linear scale": (function(*): *)}}
 */
const scales =
  {
    "linear scale": (i) => i,
    "logarithmic scale": (i) => Math.log(i)
  }


/**
 * Reads columns names from CSV file and return the names in list separately.
 * @param filename String - file name in base CSV folder
 * @returns {Promise<String[]>} Names in list
 */
const getHeaders = (filename) => {
  return new Promise(((resolve, reject) => {
    if(filename == null) reject("Can't get headers for file with null filename.");
    fs.access(csv_dir+filename, fs.constants.R_OK, (err => {
      if(err) {reject("Can't access the file to get headers."); return;}
      fs.createReadStream(csv_dir+filename)
        .pipe(csv())
        .on('headers', (headers) => {
          const outHeaders = [...Object.keys(scales), ...headers]
          resolve(outHeaders);
        })
    }))
  }))
};

/**
 * Reads specified CSV file and with given names of columns creates array of tuples
 * with values X and Y.
 * @param filename {String} name of file in default CSV folder
 * @param xValue {String} name of the column for X values;
 * @param yValue {String} name of the column for Y values;
 * @return {Promise<{}[]>} Returns array of objects that contains number values under properties x and y.
 */
const getValueTuples = (filename, xValue, yValue) => {
  if (filename == null || xValue == null || yValue == null) return undefined;
  const values = [];
  let i = 0;
  return new Promise(((resolve, reject) => {
    try {
      fs.createReadStream(csv_dir + filename)
        .pipe(csv())
        .on('data', (data) => {
          Object.keys(scales).forEach((scale) => {
            data[scale] = scales[scale](i);
          })
          i++;
          if (typeof data[xValue] === 'undefined' && typeof data[yValue] === 'undefined'){
            reject();
            return;
          }
          values.push({x: Number(data[xValue]), y: Number(data[yValue])});

        })
        .on('end', () => {
          resolve(values);
        })
    } catch(err) {
      reject(err);
    }
  }))
}

module.exports = {
  getHeaders: getHeaders,
  getValueTuples: getValueTuples
}