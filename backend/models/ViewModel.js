const viewSchema = require('../dbSchemas/viewSchema');
const mongoose = require('mongoose');
const View = mongoose.model('Views', viewSchema);

/**
 * Gets all the views from database.
 * @returns {Promise<Object[]>}
 */
const getViews = () => {
  return new Promise(((resolve, reject) => {
    View.find((err, views) => {
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
    if(viewID == null) reject("Wrong ID set");
    View.findOne({_id: viewID},(err, view) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(view);
    });
  }));
}

/**
 * Gets all views associated with certain File in database.
 * @param fileID Number - ID of File object in database
 * @returns {Promise<Object[]>} Resolve in list of Views, reject on error
 */
const getAllViewsForFile = (fileID) => {
  return new Promise(((resolve, reject) => {
    if(fileID == null) {
      reject("Wrong ID set");
      return;
    }
    View.find({fileID: fileID},(err, views) => {
      if(err) resolve([]);
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
    if(title == null || fileID == null || plotSettings == null) {
      reject("Wrong arguments set.");
      return;
    }
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
    if(viewID == null) {
      reject("Wrong ID set");
      return;
    }
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
const editView = (viewID, changes = {}) => {
  return new Promise(((resolve, reject) => {
    if(viewID == null) {
      reject("Wrong ID set");
      return;
    }
    View.findByIdAndUpdate(viewID, changes, {runValidators: true}, (err, view) => {
      if(err)
        reject(err);
      else
        resolve(view._id);
    });
  }))
}


module.exports = {
  getViews: getViews,
  getViewByID: getViewByID,
  addView: addView,
  deleteView: deleteView,
  editView: editView,
  getAllViewsForFile: getAllViewsForFile
};