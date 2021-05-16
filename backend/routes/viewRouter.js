const express = require('express');
const router = express.Router();
const viewModel = require('../models/ViewModel');
const zoomModel = require('../models/ZoomModel');
/**
 * Handler for GET request on /views endpoint.
 * Sends back all all views if no other data is given.
 * Sends back view data if id of view is in request query.
 * Sends back all views that corresponds to file if fileID is given in request query.
 */
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

/**
 * Handler for POST request on /zooms/add endpoint.
 * Adds new view to database if needed data are in request body.
 */
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

/**
 * Handler for POST request on /zooms/delete endpoint.
 * Deletes view and all corresponding zooms to that view in database.
 * View to delete is set by id in request body.
 */
router.post('/delete', ((req, res) => {
  const id = req.body.id;

  viewModel.deleteView(id).then(
    async () => {
      try {
        const zooms = await zoomModel.getZoomsForView(id);
        zooms.forEach((zoom) => {
          zoomModel.deleteZoom(zoom._id);
        });
        res.status(200).send('Deleted')
      } catch (ex) {
        res.status(400).send(ex.message)
      }
    },
    (err) => { res.status(400).send(err)  }
  );
}));

/**
 * Handler for POST request on /views/edit endpoint.
 * Edits view data in database by information given in request body.
 */
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