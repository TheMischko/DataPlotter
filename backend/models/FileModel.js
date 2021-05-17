const fileSchema = require('../dbSchemas/fileSchema');
const mongoose = require('mongoose');
const File = mongoose.model('Files', fileSchema);
const fs = require('fs');

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
    if(inFile == null) {
      reject("Value of inFile is null");
      return;
    }
    const csvMimeTypesString = process.env.CSV_MIMETYPE;

    const csvMimeTypes = csvMimeTypesString.split(', ');

    
    let isValidMimetype = false;

    csvMimeTypes.forEach((minetype) => {
      if(inFile.mimetype === minetype) {
        isValidMimetype = true;
      }
    });

    if(!isValidMimetype){
      reject("File is not type of CSV.");
      return;
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
            if(err) {
              fs.unlink(`${csvFolder}${fileName}`, () => {});
              reject(err.message);
              return;
            }
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
    File.find(async (err, files) => {
      if(err) {
        reject(err);
        return;
      }
      let file_list = [...files];
      for(let i = 0; i < files.length; i++){
        if(!fs.existsSync(process.env.CSV_FILE_FOLDER + files[i].filename)){
          file_list.splice(file_list.indexOf(files[i]), 1);
          deleteFile(files[i]._id).then();
        }
      }
      resolve(file_list);
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
    if(fileID == null) reject("Wrong file ID");
    File.findOne({_id: fileID}, (err, file) => {
      if(err || typeof file === "undefined" || file === null) {
        reject();
      } else {
        if (fs.existsSync(process.env.CSV_FILE_FOLDER + file.filename))
          resolve(file)
        else
          deleteFile(file._id).then();
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
    if(md5 == null || mimetype == null) reject()
    File.find({md5: md5, mimetype: mimetype},
      (err, files) => {
        if(err) {
          reject()
          return;
        }
        if(files.length > 0)
          resolve(files);
        else
          reject()
      });
  }))
}

/**
 * Deletes file with specified ID both from database and from filesystem.
 * @param fileID {String} ID of file in database
 * @return {Promise<void|String>} Returns error if there is any.
 */
const deleteFile = (fileID) => {
  return new Promise(((resolve, reject) => {
    if(fileID == null) reject();
    File.findOneAndDelete({_id: fileID}, (err, file) => {
      if(err)
        reject(err.message);
      else
        fs.unlink(process.env.CSV_FILE_FOLDER + file.filename, (err) => {
          if(err)
            reject(err.message);
          else
            resolve();
        });
    })
  }))
}

/**
 * Changes nickname of file in database.
 * @param fileID {String} ID of file in database
 * @param nickname {String} new nickname for the file
 * @return {Promise<void|String>} Returns error if there is any.
 */
const changeNickname = (fileID, nickname) => {
  return new Promise(((resolve, reject) => {
    if(fileID == null || nickname == null) resolve();
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
  deleteFile: deleteFile,
  changeNickname: changeNickname
}