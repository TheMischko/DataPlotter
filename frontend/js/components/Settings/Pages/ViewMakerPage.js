import * as d3 from "d3";
import IModalPage from "./IModalPage";
import css from "../../../../css/ViewMakerPage.css"

const $ = require('jquery-ajax');

export default class ViewMakerPage extends IModalPage {
  constructor(modal) {
    super(modal);
    this.title = "Create view by selecting axes and functions over data";
    this.settings = "";
    this.init().then();
    this.plots = 0;
    this.jobDone = true;
    this.plotSettings = null;
    this.isEditing = false;
  }

  async init(){
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
    const isEditView = this.modal.data.viewEdit;
    this.getOptionsHTML().then((options) => {
     this.options = options;
    });
    this.getFunctionsHTML().then((functions) => {
      this.functions = functions;
    });

    if(typeof alreadyKnownView !== "undefined" && alreadyKnownView !== null){
      if(typeof isEditView !== "undefined" && isEditView === true){
        this.viewID = alreadyKnownView;
        this.isEditing = true;
        setTimeout(() => {
          this.recreateViewSettings().then();
        }, 100);
      } else {
        this.viewID = alreadyKnownView;
        this.modal.forceNextPage();
      }
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
            <button id="addNewPlotButton">Add new Plot!</button>
        </div>
      `;
      resolve(html);
      setTimeout(() => {this.appendNewPlotEditor().then();}, 100);
    }))
  }

  /**
   * Async function that appends new form for creating new View in DOM.
   * @return {Promise<void>}
   */
  async appendNewPlotEditor() {
    const root = d3.select('#viewMakerPage #plotSettings');
    root.append('div')
      .classed('setting', true)
      .attr('plot', this.plots)
      .html(`
        <button class="delete-button"><i class="fas fa-times"></i></button>
        <h2>Plot ${this.plots+1}</h2>
        <form>
            <div class="row">
                <label>Main X axis:</label>
                <select name="xColumn" class="select2">
                    ${this.options}
                </select>
            </div>
            <div class="br"></div>
            <div class="row">
            <label>Y0 axis:</label>
                <select course="0" name="yColumn" class="select2">
                    ${this.options}
                </select>
            </div>
            <div class="row">
            <label>Function over Y0:</label>
                <select course="0" name="func" class="select2">
                    ${this.functions}
                </select>
            </div>
            <div class="row">
                <label>Color of Y0 values:</label>
                <input course="0" type="color" />
            </div>
            <div class="br"></div>
        </form>
        
      `).append('button')
        .attr('style', "margin: 0 auto; display: block")
        .classed('danger', true).classed('add_new_value_button', true)
        .text('Add new values to this plot')
        .on('click', (e) => { this.addNewValuesButtonClicked(e); });

      jQuery('.select2').select2();
      d3.selectAll(`.delete-button`).on('click', (e) => {console.log(this.returnValue())});
      this.plots++;
  }

  /**
   * Async function that calls Backend api for possible value columns from file that user can select from
   * and returns them as option tags array.
   * @return {Promise<String[]>}
   */
  getOptionsHTML() {
    return new Promise(((resolve, reject) => {
      const fileID = this.modal.data.file;
      console.log("FileID: "+fileID);
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

  /**
   * Async function that calls Backend api for possible function that user can select from
   * and returns them as option tags array.
   * @return {Promise<String[]>}
   */
  getFunctionsHTML() {
    return new Promise(((resolve, reject) => {
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      $.ajax({
        url:  SERVER_URL + '/functions',
        method: 'GET',
        success: (res) => {
          const options = JSON.parse(res);
          let html = '<option value="">-No function-</option>'
          options.forEach((option) => {
            html += `<option value="${option}">${option}</option>`
          })
          resolve(html);
        }
      })

    }));
  }

  /**
   * Simulates click on addNewView button.
   * @param e
   */
  newViewClickHandler(e) {
    this.appendNewPlotEditor().then();
  }

  /**
   * Handler for click event on addNewValue button.
   * Appends new inputs to form in plot setting with target button.
   * @param e Event
   */
  addNewValuesButtonClicked(e) {
    let form = e.target.parentNode.querySelector('form');
    const values = form.querySelectorAll('select[name=yColumn]');
    form = d3.select(form)
    form.append('div').classed('row', true)
      .html(`
        <label>Y${values.length} axis:</label>
        <select course="${values.length}" name="yColumn" class="select2">${this.options}</select>
      `);
    form.append('div').classed('row', true)
      .html(`
        <label>Function over Y${values.length}:</label>
        <select course="${values.length}" name="func" class="select2">${this.functions}</select>
      `);
    form.append('div').classed('row', true)
      .html(`
        <label>Color of Y${values.length} values:</label>
        <input course="${values.length}" type="color" />
      `)
    form.append('div').classed('br', true);
    jQuery('.select2').select2();
  }

  /**
   * Async function that fills all inputs with data from Backend API for saved viewID.
   * @return {Promise<void>}
   */
  async recreateViewSettings() {
    await this.getViewDataFromServer();
    if(this.settings === "")
      return
    const settings = this.settings;
    console.log(settings);
    console.log(d3.select("#plotName"));
    d3.select("#plotName").node().value = settings.title;
    for(let i = 0; i < settings.plotSettings.length-1; i++){
      await this.appendNewPlotEditor();
    }
    for(let i = 0; i < this.plots; i++){
      let plot = d3.select(`.setting[plot="${i}"]`);
      plot.select("select[name='xColumn']").node().value = settings.plotSettings[0].xColumn;

      const values = settings.plotSettings[i].values;
      const newValuesButton = plot.select(".add_new_value_button");
      for(let j = 0; j < values.length-1; j++){
        newValuesButton.node().click();
      }
      for(let j = 0; j < values.length; j++){
        const y = jQuery(`.setting[plot="${i}"] select[course="${j}"][name="yColumn"]`);
        y.val(values[j].yColumn);
        y.trigger("change");

        const f = jQuery(`.setting[plot="${i}"] select[course="${j}"][name="func"]`);
        f.val(values[j].func);
        f.trigger("change");

        plot.select(`input[course="${j}"][type="color"]`).node().value = values[j].color;
      }
    }
  }

  /**
   * Async function that calls backend API for View data.
   * @return {{}} View object from Backend, it contains these keys: String _id, String title,
   * String fileID, {}[] plotSettings
   */
  getViewDataFromServer() {
    return new Promise(((resolve, reject)=> {
      if(typeof this.viewID === "undefined" || this.viewID === "")
        reject("No viewID is set.")

      const SERVER_URL = localStorage.getItem('SERVER_URL');
      $.ajax({
        url: SERVER_URL + `/views?id=${this.viewID}`,
        method: "GET",
        success: (res) => {
          this.settings = JSON.parse(res);
          resolve();
        },
        error: (res) => {
          console.error("Couldn't fetch view data from server.")
          console.error(res);
          reject(res)
        }
      })
    }))
  }

  /**
   * Parses all inputs on page and returns values in array.
   * @return {[]} view details
   */
  parseInputs() {
    const forms = jQuery(".setting form");
    const data = [];
    // Parse all inputs and fetch those data to 'data' array
    forms.each((i) => {
      const selects = jQuery(forms[i]).find(`select[name=yColumn]`);
      if(selects.length === 0)
        return
      const values = []
      selects.each((j) => {
        const y = jQuery(forms[i]).find(`select[name=yColumn][course=${j}]`).val();
        const func = jQuery(forms[i]).find(`select[name=func][course=${j}]`).val();
        const color = jQuery(forms[i]).find(`input[type=color][course=${j}]`).val();
        values.push({
          yColumn: y,
          func: func,
          color: color
        })
      });
      data.push({
        xColumn: jQuery(forms[i]).find('select[name=xColumn]').val(),
        values: values
      })
    });
    return data;
  }

  /**
   * If page needs to return some values to other page of other classes, this function is used.
   * @returns
   */
  returnValue(){
    return new Promise(((resolve, reject) => {
      if(typeof this.viewID !== "undefined" && this.viewID !== null) {
        if(typeof this.isEditing !== "undefined" && this.isEditing === true){
          const data = this.parseInputs();
          const fileID = this.modal.data.file;
          const SERVER_URL = localStorage.getItem('SERVER_URL');
          const plotName = jQuery("#plotName").val()
          const viewID = this.viewID;

          $.ajax({
            url: SERVER_URL + '/views/edit',
            method: 'POST',
            data: {
              fileID: fileID,
              title: plotName,
              plotSettings: JSON.stringify(data),
              viewID: viewID
            },
            success: (res) => {
              this.viewID = res;
              resolve([{
                key: "view",
                value: this.viewID
              }]);
            },
            error: (res) => {
              reject(res);
            }
          });
        } else {
          //If viewID is known from previous page, skip API call and return this viewID.
          resolve([{
            key: "view",
            value: this.viewID
          }]);
        }
      } else {
        // Else save data via API and return newly created ID
        const data = this.parseInputs()
        // Send fetched data to server
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
            resolve([{
              key: "view",
              value: this.viewID
            }]);
          },
          error: (res) => {
            reject(res);
          }
        })
      }
    }));
  }
}