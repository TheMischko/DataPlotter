import * as d3 from "d3";
import IModalPage from "./IModalPage";

const $ = require('jquery-ajax');

/**
 * Page that provides all uploaded data to user and handles file selection.
 */
export default class FileSelectPagePage extends IModalPage{
  constructor(modal) {
    super(modal);
    this.title = "Select file to work with";
    this.file = "";
  }

  /**
   * Returns title of the page.
   * @returns {string}
   */
  getTitle(){
    return this.title;
  }

  /**
   * Returns HTML content of the page.
   * @returns {Promise}
   */
  getContent(){
    this.drawFiles();
    return new Promise(((resolve, reject) => {
      const html = `
      <p>
        Select file you would like to work with from already uploaded files or upload your own file. 
      </p>
      <div id="fileSelectPage" class="tile-wrapper">
        <div class="tiles"></div>
        <div class="tile-buttons hidden">
            <button id="editFileButton" class="success"><i class="fas fa-pencil-alt"></i>&nbsp;Edit file</button>
            <button id="deleteFileButton" class="danger"><i class="fas fa-trash"></i>&nbsp;Delete file</button>
        </div>
        <button id="uploadButton"><i class="fas fa-file-upload"></i>&nbsp;Upload new file!</button>
      </div>
      `
      resolve(html);
    }));
  }

  /**
   * Used for inserting JS code in runtime environment
   */
  initFunctions() {
    d3.select('#uploadButton')
      .on('click', (e) => { this.uploadButtonClick(e) });
    d3.select('#editFileButton')
      .on('click', (e) => { this.editButtonClick(e) });
    d3.select('#deleteFileButton')
      .on('click', (e) => { this.deleteButtonClick(e) })
  }

  /**
   * Gets all files from database.
   * @returns {Promise<Object[]>}
   */
  getFiles() {
    const SERVER_URL = localStorage.getItem('SERVER_URL');
    return new Promise(((resolve, reject) => {
      $.ajax({
        url: SERVER_URL + '/files/',
        method: 'GET',
        beforeSend: (req) => {
          req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
          req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
        },
        success: (res) => {
          const response = JSON.parse(res);
          resolve(response);
        },
        error: (res) => {
          reject(res);
          notify("Couldn't load file saved on server.", {type: "danger"});
        }
      })
    }));
  }

  /**
   * Calls API for files in database and draw them into the modal window.
   */
  drawFiles() {
    this.getFiles().then((files) => {
      if(files.length === 0){
        d3.select('#fileSelectPage .tiles')
          .append('div')
          .attr("style", "color: grey; margin: 20px;")
          .text("File archive is empty.")
        return;
      }
      files.forEach((file) => {
        d3.select('#fileSelectPage .tiles')
          .append('div')
          .attr('file-id', file._id)
          .classed('tile',true)
          .on('click', (e) => {this.fileTileClickHandler(e)})
          .html(`
          <i class="fas fa-file-csv"></i>
          <div class="fileName">${file.nickname}</div>
          <input class="hidden" type="text" name="fileName" value="${file.nickname}">
          <div>${new Date(file.created_at).toLocaleDateString()}</div>
          `)
      });
      // Event listeners for setting the change to fileName input
      document.querySelectorAll(".tile input").forEach((input) => {
        input.addEventListener("change", (e) => { this.saveFileChanges(e)});
        input.addEventListener("keyup", (e) => {
          if(e.key === "Enter" || e.keyCode === 13){
              this.saveFileChanges(e);
          }
        });
        input.addEventListener("focusout", (e) => {
          d3.select(e.target).classed("hidden", true);
          d3.select(e.target.parentNode).select(".fileName").classed("hidden", false);
        });
      });
    });
  }

  /**
   * Handles click on file tile representing loaded file from database.
   * @param e Event
   */
  fileTileClickHandler(e) {
    let target = e.target;
    if(typeof target === "undefined" || target === null)
      return;
    while(!target.classList.contains("tile")){
      if(target.tagName === "BUTTON")
        return;
      target = target.parentNode;
    }
    d3.selectAll('#fileSelectPage .tile').classed('selected', false);
    target.classList.add('selected');

    d3.selectAll(".tile-buttons").classed('hidden', false);

    const fileID = target.getAttribute('file-id');
    this.jobDone = true;
    this.file = fileID;
    this.modal.activePageDoneHandler();
  }

  /**
   * Handles click event on deleteButton.
   * Deletes selected file.
   * @param e Event
   */
  deleteButtonClick(e) {
    let target = e.target.tagName === "BUTTON" ? e.target : e.target.parentNode;
    if(target.classList.contains("clicked")){
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      const activeTile = d3.selectAll(".tile.selected");
      const activeTileID = activeTile.attr("file-id");

      $.ajax({
        url: SERVER_URL + "/files/delete",
        method: "POST",
        beforeSend: (req) => {
          req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
          req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
        },
        data: {
          fileID: activeTileID
        },
        success: (res) => {
          activeTile.remove();
          notify("File deleted successfully.", {type: "success"});
          d3.selectAll(".tile-buttons").classed('hidden', true);
        },
        error: (res) => {
          notify("Couldn't delete file.", {type: "danger"});
          reject.error("Couldn't delete file");
          console.error(res);
        }
      });
    } else {
      target.classList.add("clicked");
      target.innerHTML = "Are you sure?";
      setTimeout(() => {
        target.classList.remove("clicked");
        target.innerHTML = "<i class=\"fas fa-trash\"></i>&nbsp;Delete file";
      }, 3000);
    }
  }

  /**
   * Handles click event on uploadButton
   * Moves to user to page that handles file uploading.
   * @param e Event
   */
  uploadButtonClick(e) {
    this.jobDone = true;
    this.file = null;
    this.modal.forceNextPage();
  }

  /**
   * Handles click event on editButton
   * Shows input in file tile and hides name div.
   * @param e Event
   */
  editButtonClick(e) {
    const activeTile = d3.selectAll(".tile.selected");
    activeTile.select("input").classed("hidden", false).node().focus();
    activeTile.select(".fileName").classed("hidden", true);
  }

  /**
   * Handler that is called when writing a new name for file is done.
   * @param e Event
   */
  saveFileChanges(e) {
    // Loose focus
    document.activeElement.blur();
    const newFileName = e.target.value;
    const fileID = e.target.parentNode.getAttribute("file-id");

    const SERVER_URL = localStorage.getItem('SERVER_URL');
    $.ajax({
      url: SERVER_URL + "/files/rename",
      method: "POST",
      beforeSend: (req) => {
        req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
        req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
      },
      data: {
        fileID: fileID,
        nickname: newFileName
      },
      success: (res) => {
        notify("Changes to file were successfully saved.", {type: "success"});
        d3.select(e.target).classed("hidden", true).text(newFileName);
        d3.select(e.target.parentNode).select(".fileName").classed("hidden", false).text(newFileName);
      },
      error: (res) => {
        console.error(res);
        notify("Couldn't save changes to file.", {type: "danger"});
        const oldText = d3.select(e.target.parentNode)
          .select(".fileName")
          .classed("hidden", false)
          .node().innerHTML;
        d3.select(e.target).classed("hidden", true).text(oldText);
      }
    })
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      resolve([{
        key:    "file",
        value:  this.file
      }]);
    }))
  }
}
