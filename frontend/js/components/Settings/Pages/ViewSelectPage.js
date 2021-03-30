import * as d3 from "d3";
import IModalPage from "./IModalPage";

const $ = require('jquery-ajax');

export default class ViewSelectPage extends IModalPage{
  constructor(modal) {
    super(modal);
    this.title = "Select or create View over File";
    this.settings = "";
  }

  /**
   * Returns title of the page.
   * @returns {string}
   */
  getTitle(){
    return this.title;
  }

  initFunctions(){
    d3.select('#viewWrapper button')
      .on('click', (e) => {this.createNewViewClickHandler(e)});
  }

  /**
   * Returns HTML content of the page.
   * @returns {Promise}
   */
  getContent(){
    return new Promise(((resolve, reject) => {
      const html = `
      <p>
        On this page you can see saved combinations of various values from this file and functions over them (View).
        You can select already saved View or make one yourself.
      </p>
      <div class="tile-wrapper" id="viewWrapper">
        <div class="tiles"></div>
        <button>Create new View!</button>
      </div>
      `
      resolve(html);
      this.drawViews();
    }));
  }

  /**
   * Gets all files from database.
   * @returns {Promise<Object[]>}
   */
  getViews() {
    const SERVER_URL = localStorage.getItem('SERVER_URL');
    const fileID = this.modal.data.file;
    return new Promise(((resolve, reject) => {
      if(typeof fileID === "undefined" || fileID === null || fileID === ""){
        reject("File ID is not specified");
      }
      $.ajax({
        url: SERVER_URL + `/views?fileID=${fileID}`,
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
   * Calls API for views for file set by pages before in database and draw them into the modal window.
   */
  drawViews() {
    this.getViews().then((views) => {
      views.forEach((view) => {
        let viewName = view.title.length > 40 ? view.title.substring(0, 39)+"…" : view.title
        d3.select('#viewWrapper .tiles')
          .append('div')
          .attr('view-id', view._id)
          .attr('title', view.title)
          .classed('tile',true)
          .on('click', (e) => {this.viewTileClickHandler(e)})
          .html(`
          <i class="fas fa-chart-line"></i>
          <div>${viewName}</div>
          <div><br/></div>`)
          .append("button")
            .classed('deleteButton', true)
            .html("<i class=\"fas fa-times\"></i>")
            .on("click", (e) => this.deleteButtonClick(e));
      })
    })
  }

  /**
   * Handles click on file tile representing loaded file from database.
   * @param e Event
   */
  viewTileClickHandler(e) {
    let target = e.target;
    while(!target.classList.contains("tile")){
      if(target.tagName === "BUTTON")
        return;
      if(target.parentNode === null)
        return;
      target = target.parentNode;
    }
    d3.selectAll('#viewWrapper .tile').classed('selected', false);
    target.classList.add('selected');
    const viewID = target.getAttribute('view-id');
    this.jobDone = true;
    this.view = viewID;
    this.modal.activePageDoneHandler();
  }

  createNewViewClickHandler(e) {
    this.view = null;
    this.jobDone = true;
    this.modal.forceNextPage();
  }

  deleteButtonClick(e) {
    let target = e.target.tagName === "BUTTON" ? e.target : e.target.parentNode;
    let viewID = target.parentNode.getAttribute("view-id");
    if(typeof viewID === "undefined" || viewID === null)
      return;

    if(target.classList.contains("clicked")){
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      $.ajax({
        url: SERVER_URL + "/views/delete",
        method: "POST",
        data: {
          id: viewID
        },
        success: (res) => {
          target.parentNode.parentNode.removeChild(target.parentNode);
        },
        error: (res) => {
          console.error(res);
        }
      })
    } else {
      target.classList.add("clicked");
      target.innerHTML = "Confirm";
      setTimeout(()=>{
        target.innerHTML = "<i class=\"fas fa-times\"></i>";
        target.classList.remove("clicked");
      }, 3000);
    }
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      resolve({
        key:    "view",
        value:  this.view
      });
    }))

  }
}