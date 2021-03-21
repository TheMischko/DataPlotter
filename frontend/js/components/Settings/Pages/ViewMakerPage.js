import * as d3 from "d3";
import IModalPage from "./IModalPage";
import css from "../../../../css/ViewMakerPage.css"

const $ = require('jquery-ajax');

export default class ViewMakerPage extends IModalPage {
  constructor(modal) {
    super(modal);
    this.title = "Create view by selecting axes and functions over data";
    this.settings = "";
    this.init();
    this.plots = 0;
    this.jobDone = true;
    this.plotSettings = null;
  }

  init(){
    const SERVER_URL = localStorage.getItem('SERVER_URL');
  }

  /**
   * Returns title of the page.
   * @returns {string}
   */
  getTitle(){
    return this.title;
  }

  initFunctions(){
    const alreadyKnownView = this.modal.data.view;
    if(typeof alreadyKnownView !== "undefined" && alreadyKnownView !== null){
      this.viewID = alreadyKnownView;
      this.modal.forceNextPage();
    }
    d3.select('#viewMakerPage button')
      .on('click', (e) => {this.newViewClickHandler()});
  }

  getContent() {
    return new Promise((resolve => {
      const html = `
        <p>
            Here you need to select columns that appear in file you selected to axes in plot. If you want, you can 
            also select function that changes values over X-axis. You can also add multiple plots to single view.
        </p>
        <div id="viewMakerPage" class="tile-wrapper">
            
            <div id="plotSettings">
            <div class="setting">
                <row>
                    <label>Name this view:</label>
                    <input id="plotName" type="text" />
                </row>
            </div>
            </div>
            <button>Add new View!</button>
        </div>
      `;
      resolve(html);
      setTimeout(() => {this.appendNewPlotEditor().then();}, 100);
    }))
  }

  async appendNewPlotEditor() {
    const options = await this.getOptionsHTML();
    const functions = await this.getFunctionsHTML();

    const root = d3.select('#viewMakerPage #plotSettings');
    root.append('div')
      .classed('setting', true)
      .attr('plot', this.plots)
      .html(`
        <button class="delete-button"><i class="fas fa-times"></i></button>
        <h2>Plot ${this.plots+1}</h2>
        <form>
            <div class="row">
                <label>X axis:</label>
                <select name="xColumn" class="select2">
                    ${options}
                </select>
            </div>
            <div class="row">
            <label>Y axis:</label>
                <select name="yColumn" class="select2">
                    ${options}
                </select>
            </div>
            <div class="row">
            <label>Function:</label>
                <select name="func" class="select2">
                    ${functions}
                </select>
            </div>
        </form>
      `);

    setTimeout(() => {
      jQuery('.select2').select2();
      d3.selectAll(`.delete-button`).on('click', (e) => {console.log(this.returnValue())});
      this.plots++;
      }, 100)
  }

  getOptionsHTML() {
    return new Promise(((resolve, reject) => {
      const fileID = this.modal.data.file;
      if(typeof fileID === "undefined")
        reject()

      const SERVER_URL = localStorage.getItem('SERVER_URL');
      $.ajax({
        url: SERVER_URL + '/headers?id='+fileID,
        method: 'GET',
        success: (res) => {
          const options = JSON.parse(res);
          let html = ""
          options.forEach((option) => {
            html += `<option value="${option}">${option}</option>`
          })
          resolve(html);
        },
        error: (res) => {
          reject(JSON.parse(res));
        }
      })
    }));
  }

  getFunctionsHTML() {
    return new Promise(((resolve, reject) => {
      const options = [
        'Histogram', 'Klouzavy prumer', 'Funkce 3'
      ]
      let html = ""
      options.forEach((option) => {
        html += `<option value="${option}">${option}</option>`
      })
      resolve(html);
    }));
  }

  newViewClickHandler(e) {
    this.appendNewPlotEditor().then();
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      //If viewID is known from previous page, skip API call and return this viewID.
      if(typeof this.viewID !== "undefined" && this.viewID !== null) {
        resolve(this.viewID);
      } else {
        // Else save data via API and return newly created ID
        const forms = jQuery(".setting form");
        const data = [];
        forms.each((i) => {
          data.push({
            xColumn: jQuery(forms[i]).find('select[name=xColumn]').val(),
            yColumn: jQuery(forms[i]).find('select[name=yColumn]').val(),
            func: jQuery(forms[i]).find('select[name=func]').val()
          })
        });
        const fileID = this.modal.data.file;
        const SERVER_URL = localStorage.getItem('SERVER_URL');
        const plotName = jQuery("#plotName").val()
        $.ajax({
          url: SERVER_URL + '/views/add',
          method: 'POST',
          data: {
            fileID: fileID,
            title: plotName,
            plotSettings: JSON.stringify(data)
          },
          success: (res) => {
            this.viewID = res;
            resolve({
              key: "view",
              value: this.viewID
            });
          },
          error: (res) => {
            reject(res);
          }
        })
      }
    }));
  }
}