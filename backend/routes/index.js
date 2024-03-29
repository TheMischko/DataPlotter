const express = require('express');
const router = express.Router();
const fileModel = require('../models/FileModel');
const csvModel = require('../models/CsvModel');
const viewModel = require('../models/ViewModel');
const functions = require('../dataFunctions/dataFunctions');

/**
 * Handler for GET request on /values endpoint.
 * Sends back array of tuples from CSV file values, where xColumn and yColumn is set by body of request.
 */
router.get('/values', ((req, res) => {
  const csvID = req.query['id'];
  const x_value = typeof req.query['x_value'] === "undefined" ? 'linear scale' : req.query['x_value'];
  const y_value = typeof req.query['y_value'] === "undefined" ? 'linear scale' : req.query['y_value'];
  const func = req.query['func'];

  if(typeof csvID === "undefined" || (
    typeof req.query['x_value'] === "undefined"
    && typeof req.query['y_value'] === "undefined"))
    res.status(400).send('Not enough values set.')

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

/**
 * Handler for GET request on /valuesFromView endpoint.
 * Sends back values defined by columns saved in View, that user reference by ID in request query.
 */
router.get("/valuesFromView", ((req, res) => {
  const viewID = req.query['viewID'];

  if(typeof viewID === "undefined" || viewID === "" || viewID === null)
    res.status(400).send("Wrong viewID provided");

  viewModel.getViewByID(viewID).then(
    async (view) => {
      try{
        const file = await fileModel.getFileByID(view.fileID);
        const result = [];
        for(let i = 0; i < view.plotSettings.length; i++){
          const plot = [];
          const settings = view.plotSettings[i];
          for(let j = 0; j < settings.values.length; j++){
              const val = settings.values[j];
              let course = await csvModel.getValueTuples(file.filename, settings.xColumn, val.yColumn);
              let funcName = ""
              if (typeof val.func !== "undefined" && Object.keys(functions).includes(val.func))
                course = functions[val.func](course);
              funcName = val.func;
              plot.push({
                xColumn: settings.xColumn,
                yColumn: val.yColumn,
                func: val.func,
                values: course,
                color: val.color
              });
            }
          result.push(plot);
          }
        res.send(JSON.stringify(result));
      }
      catch (e) {
        res.status(400).send(e.message);
      }
    },
    () => { res.status(400).send("Error during fetching saved View")}
  );



}))

/**
 * Handler for GET request on /headers endpoint.
 * Sends back all column names from CSV file set by ID in request query.
 */
router.get('/headers', ((req, res) => {
  const csvID = req.query.id;
  if(typeof csvID === "undefined" || csvID === null){
    res.status(400).send('No ID specified.')
  }
  fileModel.getFileByID(csvID).then(
    (file) => {
    csvModel.getHeaders(file.filename).then(
      (headers => {
      res.send(JSON.stringify(headers));
    }),
    () => {
      res.status(400).send('No File with that ID found.')
    });
  });
}));

/**
 * Handler for GET request on /functions endpoint.
 * Sends back all possible functions that can operate over CSV data.
 */
router.get('/functions', ((req, res) => {
  const func = Object.keys(functions);
  res.status(200).send(JSON.stringify(func));
}))

module.exports = router;
