const viewSchema = require('../dbSchemas/viewSchema');
const mongoose = require('mongoose');
const View = mongoose.model('Views', viewSchema);

/**
 * Gets all the views from database.
 * @returns {Promise<Object[]>}
 */
const getViews = () => {
  return new Promise(((resolve, reject) => {
    View.find().then((err, views) => {
      if(err)
        reject(err);
      resolve(views);
    });
  }));
};

/**
 * Gets single view from database by ID.
 * @param viewID String - ID
 * @returns {Promise<Object>}
 */
const getViewByID = (viewID) => {
  return new Promise(((resolve, reject) => {
    View.find({_id: viewID}).then((err, views) => {
      if(err)
        reject(err);
      resolve(views);
    });
  }));
}

/**
 * Creates new view object in database.
 * @param title String - Title of view seen by users
 * @param fileID String - ID of file, where data for plots are
 * @param plotSettings - Array of objects containing information about axes columns and functions
 * @returns {Promise<String>} Resolves in ID of newly created database record or rejects in message on error
 */
const addView = (title, fileID, plotSettings) => {
  return new Promise(((resolve, reject) => {
    const view = new View({
      title: title,
      fileID: fileID,
      plotSettings: plotSettings
    });
    view.validate().then(
      () => {
        view.save().then((newView) => {
          resolve(newView._id);
        })
      },
      () => {
        reject('Didnt pass validation.')
      })
  }));
}

/**
 * Deletes single view from database.
 * @param viewID String - ID of view in database
 * @returns {Promise<String>} - Resolve on success, reject in message on error
 */
const deleteView = (viewID) => {
  return new Promise(((resolve, reject) => {
    View.findOneAndDelete({_id: viewID}).then(
      () => { resolve() },
      () => { reject('Couldnt delete view with this ID.') })
  }))
}

/**
 * Edits data of single view.
 * @param viewID String - ID of view in database
 * @param changes Object - has to contain attributes with same names as database records
 * @returns {Promise<String>} - Resolve on success, reject in message on error
 */
const editView = (viewID, changes) => {
  return new Promise(((resolve, reject) => {
    View.findByIdAndUpdate(viewID, changes, {runValidators: true}, (err, view) => {
      if(err)
        reject(err);
      else
        resolve();
    });
  }))
}


module.exports = {
  getViews: getViews,
  getViewByID: getViewByID,
  addView: addView,
  deleteView: deleteView,
  editView: editView
};