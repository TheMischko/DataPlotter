const express = require('express');
const router = express.Router();

const fileModel = require('../models/FileModel');
const viewModel = require('../models/ViewModel');
const zoomModel = require('../models/ZoomModel');


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


router.post('/delete', ((req, res) => {
  const fileID = req.body.fileID;
  if(typeof fileID === "undefined" || fileID === "")
    res.status("400").send("Bad file ID.");
  fileModel.deleteFile(fileID).then(
    async () => {
      const views = await viewModel.getAllViewsForFile(fileID);
      for (const view of views) {
        await viewModel.deleteView(view._id);
        const zooms = await zoomModel.getZoomsForView(view._id);
        for (const zoom of zooms) {
          await zoomModel.deleteZoom(zoom._id);
        }
        res.status(200).send('Deleted');
      }
      },
    (err) => { res.status(400).send(err); }
  )
}));


router.post('/rename', (((req, res) => {
  const fileID = req.body.fileID;
  const name = req.body.nickname;
  if((typeof fileID === "undefined" || typeof name === "undefined")
    || (fileID.length === 0 || name.length === 0)){
    res.status(400).send("ID or name is invalid");
  }
  fileModel.changeNickname(fileID, name).then(
    () => res.status(200).send("Renamed."),
    (err) => res.status(400).send(err)
  );
})));

module.exports = router;