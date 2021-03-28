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
      console.log("Deleting file: " + fileID);
      const views = await viewModel.getAllViewsForFile(fileID);
      for (const view of views) {
        console.log("Deleting view: " + view._id);
        await viewModel.deleteView(view._id);
        const zooms = await zoomModel.getZoomsForView(view._id);
        for (const zoom of zooms) {
          console.log("Deleting zoom: " + zoom._id);
          await zoomModel.deleteZoom(zoom._id);
        }
      }

      res.status(200).send('Deleted');
      },
    (err) => { res.status(400).send(err); }
  )
}));

module.exports = router;