const express = require('express');
const router = express.Router();
const fileModel = require('../models/FileModel');
const csvModel = require('../models/CsvModel');
const functions = require('../dataFunctions/dataFunctions');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send(null);
});

router.get('/values', ((req, res) => {
  const csvID = req.query['id'];
  const x_value = typeof req.query['x_value'] === "undefined" ? 'linear scale' : req.query['x_value'];
  const y_value = typeof req.query['y_value'] === "undefined" ? 'linear scale' : req.query['y_value'];
  const func = req.query['func'];
  console.log(func);

  if(typeof csvID === "undefined" || (req.query['x_value'] === "undefined" && req.query['y_value'] === "undefined"))
    res.status(400).send('Bad request.')

  fileModel.getFileByID(csvID).then(
    (file) => {
      csvModel.getValueTuples(file.filename, x_value, y_value).then((values) => {
        if (typeof func !== "undefined" && Object.keys(functions).includes(func))
          values = functions[func](values)
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

router.get('/functions', ((req, res) => {
  const func = Object.keys(functions);
  res.status(200).send(JSON.stringify(func));
}))

module.exports = router;
