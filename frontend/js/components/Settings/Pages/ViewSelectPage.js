import * as d3 from "d3";
import IModalPage from "./IModalPage";

const $ = require('jquery-ajax');

export default class ViewSelectPage extends IModalPage{
  constructor(modal) {
    super(modal);
    this.title = "Select or create View over File";
    this.editView = false;
  }

  /**
   * Returns title of the page.
   * @returns {string}
   */
  getTitle(){
    return this.title;
  }

  initFunctions(){
    d3.select('#createViewButton')
      .on('click', (e) => { this.createNewViewClickHandler(e); });
    d3.select('#editViewButton')
      .on('click', (e) => { this.editButtonClick(e); });
    d3.select('#deleteViewButton')
      .on('click', (e) => { this.deleteButtonClick(e); });
    this.editView = false;
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
        <div class="tile-buttons hidden">
            <button id="editViewButton" class="success"><i class="fas fa-pencil-alt"></i>&nbsp;Edit view</button>
            <button id="deleteViewButton" class="danger"><i class="fas fa-trash"></i>&nbsp;Delete view</button>
        </div>
        <button id="createViewButton">Create new View!</button>
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
        return;
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
          notify("Couldn't fetch views for this file.", {type: "danger"});
          reject(res);
        }
      })
    }));
  }

  /**
   * Calls API for views for file set by pages before in database and draw them into the modal window.
   */
  drawViews() {
    d3.select("#viewWrapper .tiles")
      .append("i")
      .attr("id", "spinner")
      .classed("fas", true)
      .classed("fa-spinner", true)
      .classed("fa-spin", true);
    this.getViews().then((views) => {
      d3.select("#spinner").remove();
      if(views.length === 0){
        d3.select('#viewWrapper .tiles')
          .append('div')
          .attr("style", "color: grey; margin: 20px;")
          .text("There are currently no views for this file.")
        return;
      }
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
      })
    }, (err) => {});
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
    d3.selectAll(".tile-buttons").classed('hidden', false);

    const viewID = target.getAttribute('view-id');
    this.jobDone = true;
    this.view = viewID;
    this.modal.activePageDoneHandler();
  }

  /**
   * Handler for createView button.
   * Moves a user to page where new View is made.
   * @param e Event
   */
  createNewViewClickHandler(e) {
    this.view = null;
    this.jobDone = true;
    this.modal.forceNextPage();
  }

  /**
   * Handles click event on deleteButton.
   * Deletes selected view.
   * @param e Event
   */
  deleteButtonClick(e) {
    let target = e.target.tagName === "BUTTON" ? e.target : e.target.parentNode;
    let selectedView = d3.selectAll(".tile.selected");
    let viewID = selectedView.attr("view-id");
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
          notify("File was deleted successfully.", {type: "success"});
          selectedView.remove();
          d3.selectAll(".tile-buttons").classed('hidden', true);
        },
        error: (res) => {
          notify("Couldn't delete file on server.", {type: "danger"});
          console.error(res);
        }
      })
    } else {
      target.classList.add("clicked");
      target.innerHTML = "Are you sure?";
      setTimeout(()=>{
        target.innerHTML = "<i class=\"fas fa-trash\"></i>&nbsp;Delete view";
        target.classList.remove("clicked");
      }, 3000);
    }
  }

  /**
   * Handles click event on editButton
   * Shows input in view tile and hides name div.
   * @param e Event
   */
  editButtonClick(e) {
    let selectedView = d3.selectAll(".tile.selected");
    let viewID = selectedView.attr("view-id");
    if(typeof viewID === "undefined" || viewID === null)
      return;

    this.view = viewID;
    this.editView = true;

    this.modal.forceNextPage();
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      resolve([
        {
          key:    "view",
          value:  this.view
        },
        {
          key: "viewEdit",
          value: this.editView
        }
        ]);
    }))

  }
}