const express = require('express');
const router = express.Router();
const viewModel = require('../models/ViewModel');


router.get('/', ((req, res) => {
  const id = req.query.id;
  const fileID = req.query.fileID;
  // If ID is set, return View object with this ID.
  if(typeof id !== "undefined"){
    viewModel.getViewByID(id).then(
      (view) => { res.status(200).send(JSON.stringify(view)) },
      (err) => { res.status(400).send(err) }
    )
  }
  // If fileID is set, return all Views for this File.
  else if (typeof fileID !== "undefined"){
    viewModel.getAllViewsForFile(fileID).then(
      (views) => { res.status(200).send(JSON.stringify(views)) },
      (err) => { res.status(400).send(err) }
    )
  }
  // If none is set, return all views.
  else {
    viewModel.getViews().then(
      (views) => {
        res.status(200).send(JSON.stringify(views))
      },
      (err) => {
        res.status(400).send(err)
      });
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
    res.status(400).send(ex.message);
  }
}));


router.post('/delete', ((req, res) => {
  const id = req.body.id;

  viewModel.deleteView(id).then(
    () => { res.status(200).send('Deleted') },
    (err) => { res.status(400).send(err)  }
  );
}));


router.post('/edit', ((req, res) => {
  let viewID = undefined;
  let fileID = undefined;
  let title = undefined;
  let plotSettings = undefined
  try {
    viewID = req.body.viewID;
    fileID = req.body.fileID;
    title = req.body.title;
    plotSettings = JSON.parse(req.body.plotSettings)
  } catch (ex) {}
  const changes = {};

  if(typeof fileID !== "undefined")
    changes["fileID"] = fileID;
  if(typeof title !== "undefined")
    changes["title"] = title;
  if(typeof plotSettings !== "undefined")
    changes["plotSettings"] = plotSettings;

  viewModel.editView(viewID, changes).then(
    (id) => { res.status(200).send(id) },
    (err) => { res.status(400).send(err) }
  );
}));

module.exports = router;