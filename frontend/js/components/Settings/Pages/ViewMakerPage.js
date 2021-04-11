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
     this.getOptionsHTML().then((options) => {
       this.options = options;
     });
    this.getFunctionsHTML().then((functions) => {
      this.functions = functions;
    });
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

    setTimeout(() => {
      jQuery('.select2').select2();
      d3.selectAll(`.delete-button`).on('click', (e) => {console.log(this.returnValue())});
      this.plots++;
      }, 100)
  }

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

  newViewClickHandler(e) {
    this.appendNewPlotEditor().then();
  }

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
          const selects = jQuery(forms[i]).find(`select[name=yColumn]`);
          if(selects.length == 0)
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