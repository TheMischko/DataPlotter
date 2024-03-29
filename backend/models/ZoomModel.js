const zoomSchema = require('../dbSchemas/zoomSchema');
const mongoose = require('mongoose');
const Zoom = mongoose.model('Zooms', zoomSchema);

/**
 * Add single zoom to the database.
 * @param title String - Title of zoom.
 * @param sequence Array - Sequence of zooms from main application. Should be array of tuple values.
 * @param viewID Number - ID of parent view for this zoom. Relation is Zoom N:1 View
 * @returns {Promise<Object>} Resolve if it passed validation, reject if not.
 */
const addZoom = (title, sequence, viewID) => {
  return new Promise(((resolve, reject) => {
    if(title == null || sequence == null || viewID == null) {
      reject();
      return;
    }
    let zoom = new Zoom({
      title: title,
      zoomSequence: sequence,
      viewID: viewID
    })
    zoom.validate().then(
      () => {
        zoom.save().then(zoom => {
          resolve(zoom);
        })
      },
      () => {
        reject();
      }
    )
  }))
}

/**
 * Deletes single zoom instance from database.
 * @param zoomID Number - ID of zoom to delete
 * @returns {Promise<String>} Resolve in null if deleted, Reject in error message on error.
 */
const deleteZoom = (zoomID) => {
  return new Promise(((resolve, reject) => {
    if(zoomID == null) reject("Wrong ID set");
    Zoom.findOneAndDelete({_id: zoomID}, (err) => {
      if(err)
        reject(err);
      else
        resolve();
    })
  }));
}

/**
 * Returns all zooms for parent view.
 * @param viewID String - ID of parent view for this zoom. Relation is Zoom N:1 View
 * @returns {Promise<Object[]>}
 */
const getZoomsForView = (viewID) => {
  return new Promise(((resolve, reject) => {
    if(viewID == null) reject("Wrong ID set");
    Zoom.find({viewID: viewID}, (err, zooms) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(zooms)
    })
  }));
}

/**
 * Changes data of existing zoom in database.
 * @param zoomID {String} ID of zoom that has to change
 * @param changes {{}} object containing changes
 * Keys has to be names of the properties in database and values has to be new values.
 * @return {Promise<Object>}
 */
const updateZoom = (zoomID, changes= {}) => {
  return new Promise(((resolve, reject) => {
    if(zoomID == null) reject("Wrong ID set");
    Zoom.findByIdAndUpdate(zoomID, changes, {runValidators: true}, (err, zoom) => {
      if(err)
        reject(err);
      else
        resolve(zoom);
    });
  }))
}

module.exports = {
  addZoom: addZoom,
  deleteZoom: deleteZoom,
  getZoomsForView: getZoomsForView,
  updateZoom: updateZoom
}