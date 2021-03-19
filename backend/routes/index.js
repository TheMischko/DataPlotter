const express = require('express');
const router = express.Router();
const fileModel = require('../models/FileModel');
const csvModel = require('../models/CsvModel');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send(null);
});
router.post('/upload', function(req, res, next) {
  const fileNames = Object.keys(req.files);
  const files = req.files;
  const csvMime = process.env.CSV_MIMETYPE;

  if(fileNames.length === 0){
    res.status(400).send('No files provided')
  }

  for(let f of fileNames){
    const file = files[f];
    fileModel.saveCSV(file).then(
      (fileId) => {
        res.status(200).send(JSON.stringify({id: fileId}));
    },
      () => {
        res.status(400).send(JSON.stringify('Wrong file provided.'));
      });
  }
});

router.get('/values', ((req, res) => {
  const csvID = req.query['id'];
  const x_value = typeof req.query['x_value'] === "undefined" ? 'linear' : req.query['x_value'];
  const y_value = typeof req.query['y_value'] === "undefined" ? 'linear' : req.query['y_value'];
  const fnc = req.query['fnc'];

  if(typeof csvID === "undefined" || (req.query['x_value'] === "undefined" && req.query['y_value'] === "undefined"))
    res.status(400).send('Bad request.')

  fileModel.getFileByID(csvID).then(
    (file) => {
      csvModel.getValueTuples(file.filename, x_value, y_value).then((values) => {
        if (typeof fnc !== "undefined") {}
        else
          res.send(JSON.stringify(values));
      }, () => {
        res.status(400).send('Error during CSV parse - wrong columns.')
      });
    },
    () => res.status(400).send('File not found.')
  );
}));


router.get('/headers', ((req, res) => {
  const csvID = req.query.id;
  if(typeof csvID === "undefined" || csvID === null){
    res.status(400).send('No ID specified.')
  }
  fileModel.getFileByID(csvID).then((file) => {
    csvModel.getHeaders(file.filename).then((headers => {
      res.send(JSON.stringify(headers));
    }));

  }, () => {
    res.status(400).send('No File with that ID found.')
  });

}));

module.exports = router;
