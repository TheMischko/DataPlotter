const fileSchema = require('../dbSchemas/fileSchema');
const mongoose = require('mongoose');
const File = mongoose.model('Files', fileSchema);

/**
 * Saves any CSV file from HTTP request to folder on server.
 * Uses basic validation of file.
 *
 * @param inFile File object from req.files list in router method
 * @returns {Promise<string|null>} If valid than returns filename on server, otherwise returns null.
 * Full path to file can be made by connecting path to files from .env and this filename.
 */
const saveCSV = (inFile) => {
  return new Promise(((resolve, reject) => {
    const csvMime = process.env.CSV_MIMETYPE;

    if(inFile.mimetype !== csvMime) {
      reject();
    }

    let dateString = new Date().toJSON();
    dateString = dateString
      .replace(/-*T*:*/g, '')
      .split('.')[0];

    const fileName = `${dateString}.csv`;

    //Looking for file in DB.
    findSimilarFile(inFile.md5, inFile.mimetype).then(
      (files) => {
        //Found.
        resolve(files[0]['_id']);
      },() => {
        //Not Found.
        //Saving new file then.
        const csvFolder = process.env.CSV_FILE_FOLDER;
        inFile.mv(`${csvFolder}${fileName}`).then(() => {
          //Saved
          const dbFile = new File({
            filename: fileName,
            mimetype: inFile.mimetype,
            md5: inFile.md5,
            size: inFile.size
          });
          //Saving to DB
          dbFile.save((err, dbFile) => {
            //All saved.
            if(err) return console.log(err);
            resolve(dbFile['_id']);
          })
        });
    });
  }));
}

/**
 * Returns all files from database.
 * @returns {Promise<Object[]>} Resolve in files, reject on error.
 */
const getFiles = () => {
  return new Promise(((resolve, reject) => {
    File.find((err, files) => {
      if(err)
        reject(err);
      resolve(files);
    })
  }));
}

/**
 * Look for a file under the ID in database and return it.
 * Async function, resolve in file, reject if file not found
 * @param fileID Number - ID of file in database
 * @returns {Promise<Object>} File
 */
const getFileByID = (fileID) => {
  return new Promise(((resolve, reject) => {
    File.findOne({_id: fileID}, (err, file) => {
      if(err || typeof file === "undefined" || file === null) {
        reject();
      } else {
        resolve(file)
      }
    })
  }))
}


/**
 * Looks for file with same MD5 hash and same mimetype.
 * On resolve return list of all files.
 * On reject doesn't return anything.
 * @param md5 - MD5 hash of file
 * @param mimetype - Mimetype of file
 * @returns {Promise<Object[]>}
 */
const findSimilarFile = (md5, mimetype) => {
  return new Promise(((resolve, reject) => {
    File.find({md5: md5, mimetype: mimetype},
      (err, files) => {
        if(err) {
          console.log(err);
          reject()
        }
        if(files.length > 0)
          resolve(files);
        else
          reject()
      });
  }))
}


const deleteFile = (fileID) => {
  return new Promise(((resolve, reject) => {
    resolve();
    File.findOneAndDelete({_id: fileID}, (err, file) => {
      if(err)
        reject(err);
      else
        resolve();
    })
  }))
}


const changeNickname = (fileID, nickname) => {
  return new Promise(((resolve, reject) => {
    File.findOneAndUpdate({_id: fileID}, {nickname: nickname}, (err, file) => {
      if(err)
        reject(err);
      else
        resolve();
    })
  }));
}


module.exports = {
  saveCSV: saveCSV,
  getFileByID: getFileByID,
  getFiles: getFiles,
  deleteFile: deleteFile
}