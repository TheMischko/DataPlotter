const express = require('express');
const router = express.Router();
const viewModel = require('../models/ViewModel');


router.get('/', ((req, res) => {
  const id = req.query.id;
  if(typeof id === "undefined") {
    viewModel.getViews().then(
      (views) => {
        res.status(200).send(JSON.stringify(views))
      },
      (err) => {
        res.status(400).send(err)
      });
  } else {
    viewModel.getViewByID(id).then(
      (view) => { res.status(200).send(JSON.stringify(view)) },
      (err) => { res.status(400).send(err) }
    )
  }
}));


router.post('/add', ((req, res) => {
  try {
    const fileID = req.body.fileID;
    const title = req.body.title;
    const plotSettings = JSON.parse(req.body.plotSettings)

    viewModel.addView(title, fileID, plotSettings).then(
      (id) => { res.status(200).send(id) },
      (err) => { res.status(400).send(err) }
    );
  } catch (ex) {
    res.status(400).send(ex);
  }
}));


router.post('/delete', ((req, res) => {
  const id = req.body.id;

  viewModel.deleteView(id).then(
    () => { res.status(200).send('Deleted') },
    (err) => { res.status(400).send(err)  }
  );
}));


router.post('/add', ((req, res) => {
  let id = undefined;
  let fileID = undefined;
  let title = undefined;
  let plotSettings = undefined
  try {
    id = req.body.id;
    fileID = req.body.fileID;
    title = req.body.title;
    plotSettings = JSON.parse(req.body.plotSettings)
  } catch (ex) {}
  const changes = {
    fileID: fileID,
    title: title,
    plotSettings: plotSettings
  }

  viewModel.editView(id, changes).then(
    (id) => { res.status(200).send(id) },
    (err) => { res.status(400).send(err) }
  );
}));

module.exports = router;