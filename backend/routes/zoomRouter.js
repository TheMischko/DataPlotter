const express = require('express');
const router = express.Router();
const zoomModel = require('../models/ZoomModel');

router.get('/', ((req, res) => {
  const viewID = req.query.viewID;
  if(typeof viewID === "undefined"){
    res.status(400).send('Bad request.');
  }
  zoomModel.getZoomsForView(viewID).then(
    (zooms) => { res.status(200).send(JSON.stringify(zooms)) },
    () => { res.status(400).send('Nothing found.') }
  );
}));


router.post('/add', ((req, res) => {
  try{
    const sequence = JSON.parse(req.body.sequence);
    zoomModel.addZoom(req.body.title, sequence, req.body.viewID).then(
      (zoom) => { res.status(200).send(JSON.stringify(zoom)); },
      () => { res.status(400).send('Cannot save.'); }
    );
  } catch(e){
    res.status(400).send(JSON.stringify(e));
  }
}));


router.post('/delete', ((req, res) => {
  const id = req.body.id;
  if(typeof id === "undefined")
    res.status(400).send("Undefined.");

  zoomModel.deleteZoom(id).then(
    () => { res.status(200).send('Deleted.'); },
    (err) => { res.status(400).send(err); }
  );
}));

router.post('/update', (((req, res) => {
  let zoomID = undefined;
  let viewID = undefined;
  let title = undefined;
  let zoomSequence = undefined
  try {
    zoomID = req.body.zoomID;
    viewID = req.body.viewID;
    title = req.body.title;
    zoomSequence = JSON.parse(req.body.zoomSequence)
  } catch (ex) {}
  const changes = {};

  if(typeof viewID !== "undefined")
    changes["fileID"] = viewID;
  if(typeof title !== "undefined")
    changes["title"] = title;
  if(typeof zoomSequence !== "undefined")
    changes["plotSettings"] = zoomSequence;

  zoomModel.updateZoom(zoomID, changes).then(
    (zoom) => { res.status(200).send(JSON.stringify(zoom)) },
    (err) => { res.status(400).send(err)}
  )
})))

module.exports = router;