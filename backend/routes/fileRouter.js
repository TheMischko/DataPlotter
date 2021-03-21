const express = require('express');
const router = express.Router();

const fileModel = require('../models/FileModel');


router.get('/', ((req, res) => {
  const id = req.query.id;
  if(typeof id === "undefined") {
    fileModel.getFiles().then(
      (files) => {
        res.status(200).send(JSON.stringify(files))
      },
      (err) => {
        res.status(400).send(err)
      });
  } else {
    fileModel.getFileByID(id).then(
      (file) => { res.status(200).send(JSON.stringify(file)) },
      (err) => { res.status(400).send(err) }
    )
  }
}));

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