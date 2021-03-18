const express = require('express');
const router = express.Router();
const fileModel = require('../models/FileModel')

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

module.exports = router;
