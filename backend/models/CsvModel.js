const fs = require('fs');
const csv = require('csv-parser');

const csv_dir = process.env.CSV_FILE_FOLDER;
/**
 * Reads columns names from CSV file and return the names in list separately.
 * @param filename String - file name in base CSV folder
 * @returns {Promise<String[]>} Names in list
 */
const getHeaders = (filename) => {
  return new Promise(((resolve) => {
    fs.createReadStream(csv_dir+filename)
      .pipe(csv())
      .on('headers', (headers) => {
        resolve(headers);
      })
  }))
};

const getValueTuples = (filename, xValue, yValue) => {
  const values = [];
  let i = 0;
  return new Promise(((resolve, reject) => {
    fs.createReadStream(csv_dir + filename)
      .pipe(csv())
      .on('data', (data) => {
        // Linear scale
        data['linear'] = i++;

        if(typeof data[xValue] === 'undefined' || typeof data[yValue] === 'undefined')
          reject();
        values.push({x: data[xValue], y: data[yValue]});
      })
      .on('end', () => {
        resolve(values);
      })
  }))
}

module.exports = {
  getHeaders: getHeaders,
  getValueTuples: getValueTuples
}