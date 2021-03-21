import * as d3 from "d3";
import IModalPage from "./IModalPage";

const $ = require('jquery-ajax');

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
        <button>Upload new file!</button>
      </div>
      `
      resolve(html);
    }));
  }

  /**
   * Used for inserting JS code in runtime environment
   */
  initFunctions() {
    d3.select('#fileSelectPage > button')
      .on('click', (e) => { this.uploadButtonClick(e) });
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
        }
      })
    }));
  }

  /**
   * Calls API for files in database and draw them into the modal window.
   */
  drawFiles() {
    this.getFiles().then((files) => {
      files.forEach((file) => {
        d3.select('#fileSelectPage .tiles')
          .append('div')
          .attr('file-id', file._id)
          .classed('tile',true)
          .on('click', (e) => {this.fileTileClickHandler(e)})
          .html(`
          <i class="fas fa-file-csv"></i>
          <div>${file.nickname}</div>
          <div>${new Date(file.created_at).toLocaleDateString()}</div>
          `)
      })
    })
  }

  /**
   * Handles click on file tile representing loaded file from database.
   * @param e Event
   */
  fileTileClickHandler(e) {
    let target = e.target;
    while(!target.classList.contains("tile")){
      target = target.parentNode;
    }
    d3.selectAll('#fileSelectPage .tile').classed('selected', false);
    target.classList.add('selected');
    const fileID = target.getAttribute('file-id');
    this.jobDone = true;
    this.file = fileID;
    this.modal.activePageDoneHandler();
  }

  uploadButtonClick(e) {
    this.jobDone = true;
    this.file = null;
    this.modal.forceNextPage();
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      resolve({
        key:    "file",
        value:  this.file
      });
    }))
  }


}
