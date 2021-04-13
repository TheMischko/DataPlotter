const express = require('express');
const router = express.Router();

const fileModel = require('../models/FileModel');
const viewModel = require('../models/ViewModel');
const zoomModel = require('../models/ZoomModel');

/**
 * Handler for POST request on /files end point.
 * Sends back all files in database if no id is specified in request query.
 * If id is set in request query then sends back all data about that file.
 */
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

/**
 * Handler for POST request on /files/upload endpoint.
 * Lets user upload a new file to server. File and other information has to be in body of request.
 * Sends back ID of newly uploaded file.
 */
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

/**
 * Handler for POST request on /files/delete endpoint.
 * Deletes file from server database and storage, as well as all corresponding views and zooms.
 * File is described by fileID in request body.
 */
router.post('/delete', ((req, res) => {
  const fileID = req.body.fileID;
  if(typeof fileID === "undefined" || fileID === "")
    res.status("400").send("Bad file ID.");
  fileModel.deleteFile(fileID).then(
    async () => {
      const views = await viewModel.getAllViewsForFile(fileID);
      if(typeof views === "string")
        res.status(400).send(views);
      for (const view of views) {
        const result =  await viewModel.deleteView(view._id);
        if(result)
          continue;
        const zooms = await zoomModel.getZoomsForView(view._id);
        for (const zoom of zooms) {
          await zoomModel.deleteZoom(zoom._id);
        }
      }
      res.status(200).send('Deleted');
      },
    (err) => { res.status(400).send(err); }
  )
}));

/**
 * Handler for POST request on /files/rename endpoint.
 * Changes nickname of file in database.
 * File is specified in fileID attribute of request body and nickname is in nickname attribute.
 */
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