/*******************************************************************
 * Class: ZoomManager
 * Has function and handlers for general situations when working
 * with plot zooms.
 ******************************************************************/
import Zoom from "../Classes/Zoom";
const $ = require('jquery-ajax');

export default class ZoomManager {
  constructor() {
    this.ZOOMS_KEY = 'zooms';
    this.init();
  }


  init() {
    // ZoomPath represent a ordered sequence of zooms made by user.
    // This sequence is needed for reconstruction of currently zoomed area by user.
    localStorage.setItem('zoomPath', JSON.stringify([null]));
    // Fired whenever zoom is changed
    document.addEventListener('plotSelectionChanged', (e) => {this.onZoomChange()});
  }

  /**
   * Gets value of the actual selection from storage.
   * @returns {null|array} Null if no was performed of array with two values 0->start, 1->end of selection
   */
  getSelection() {
    const selection = JSON.parse(localStorage.getItem('selection'));
    if(typeof(selection) === 'undefined'){
      localStorage.setItem('selection', 'null');
      return null;
    } else {
      return selection;
    }
  }

  /**
   * Sets value of actual selection.
   * Used for changing zooms.
   * @param {null|*[]}selectionValue
   */
  setSelection(selectionValue) {
    localStorage.setItem('selection', JSON.stringify(selectionValue));
  }

  /**
   * Gets all zooms saved in storage.
   * @returns {Zoom[]}
   */
  getAllZoomsLocal() {
    const zooms = JSON.parse(localStorage.getItem(this.ZOOMS_KEY));
    if(typeof(zooms) === 'undefined' || zooms === null){
      localStorage.setItem('selection', JSON.stringify('[]'));
      return [];
    } else {
      return zooms.map(zoom => new Zoom(zoom.id, zoom.name, zoom.zoomSequence))
    }
  }

  /**
   * Gets all zooms from database.
   * @return {Promise<Object[]>}
   */
  getAllZooms() {
    return new Promise(((resolve, reject) => {
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      const viewID = localStorage.getItem('viewID');
      $.ajax({
        url:  SERVER_URL + '/zooms?viewID=' + viewID,
        method: 'GET',
        success: (res) => {
          const zooms = JSON.parse(res);
          resolve(zooms.map((zoom => {return new Zoom(zoom._id, zoom.title, zoom.zoomSequence)})));
        },
        error: (res) => {
          reject(res);
        }
      })
    }));
  }

  /**
   * Gets sequence of zooms for current main zoom.
   * @returns {*[]}
   */
  getCurrentZoomPath() {
    const zoomPath = JSON.parse(localStorage.getItem('zoomPath'));
    if(typeof(zoomPath) === 'undefined' || zoomPath === null){
      localStorage.setItem('selection', JSON.stringify('[null]'));
      return [null];
    } else {
      return zoomPath
    }
  }

  setLocalZooms(zooms){
    localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
  }

  /**
   * Saves zoom sequence into database.
   * @param {*[]}zoomSequence
   * @param {string}name
   * @return Promise{Object} Resolve in View object from storage, reject on error.
   */
  addNewZoom(zoomSequence, name = '') {
    return new Promise(((resolve, reject) => {
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      const viewID = localStorage.getItem('viewID');
      $.ajax({
        url:  SERVER_URL + '/zooms/add',
        method: 'POST',
        data: {
          title: name,
          viewID: viewID,
          sequence: JSON.stringify(zoomSequence)
        },
        success: (res) => {
          const resParsed = JSON.parse(res);
          const zoom = new Zoom(resParsed._id, resParsed.title, resParsed.zoomSequence);
          this.saveZoomLocal(zoom);
          resolve(JSON.parse(res));
        },
        error: (res) => {
          reject(res);
        }
      })
    }))
  }

  /**
   * Saves Zoom object to storage.
   * @param zoom
   */
  saveZoomLocal(zoom) {
    const zooms = JSON.parse(localStorage.getItem('zooms'));
    zooms.push(zoom);
    localStorage.setItem('zooms', JSON.stringify(zooms));
  }

  /**
   * Returns Zoom with corresponding ID.
   * @param {string}id
   * @returns Zoom
   * @throws Error when zoom was not found
   */
  getZoomByID(id){
    const zooms = this.getAllZoomsLocal();
    for(let i = 0; i<zooms.length; i++){
      if(zooms[i].id === id)
        return zooms[i];
    }
    return null;
  }

  /**
   * Updates data to zoom in storage set by ID.
   * @param {number} id
   * @param {string} name
   * @param {*[]} zoomSequence
   */
  updateZoom(id, {name= '', zoomSequence= null}){
    return new Promise(((resolve, reject) => {
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      const viewID = localStorage.getItem('viewID');
      const data= {
        zoomID: id,
        viewID: viewID,
        title: name,
        zoomSequence: JSON.stringify(zoomSequence)
      };
      $.ajax({
        url:  SERVER_URL + '/zooms/update',
        method: 'POST',
        data: {
          zoomID: id,
          viewID: viewID,
          title: name,
          zoomSequence: JSON.stringify(zoomSequence)
        },
        success: (res) => {
          const parsedRes = JSON.parse(res);
          const zooms = this.getAllZoomsLocal();
          zooms.forEach(zoom => {
            if(zoom.id === parsedRes._id){
              zoom.name = parsedRes.title;
              zoom.zoomSequence = parsedRes.zoomSequence;
            }
          });
          localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
          resolve(parsedRes);
        },
        error: (res) => {
          reject(res)
        }
      })
    }));
  }

  /**
   * Deletes zoom with corresponding ID from storage.
   * @param {string}id
   */
  deleteZoom(id){
    return new Promise(((resolve, reject) => {
      const SERVER_URL = localStorage.getItem('SERVER_URL');
      $.ajax({
        url: SERVER_URL + "/zooms/delete",
        method: "POST",
        data: {
          id: id
        },
        success: (res) => {
          const zooms = this.getAllZoomsLocal();
          zooms.forEach(zoom => {
            if(zoom.id === id) {
              const deleteIndex = zooms.indexOf(zoom);
              zooms.splice(deleteIndex, 1);
            }
          });
          localStorage.setItem(this.ZOOMS_KEY, JSON.stringify(zooms));
          resolve(JSON.parse(res));
        },
        error: (res) => {
          reject(res);
        }
      })
    }));
  }


  /**
   * Used for saving current zoom sequence into storage.
   * @returns Promise{Object} Zoom object from database
   */
  saveCurrentZoom() {
    return new Promise(((resolve, reject) => {

      const zoomPath = this.getCurrentZoomPath();
      this.addNewZoom(zoomPath).then((zoom) => {
        resolve(zoom)
      }, (err) => {reject(err)});
    }))

  }


  // Handler for global Event fired when selection in plot is made.
  onZoomChange(e) {
    // Loads selection from memory
    const selection = JSON.parse(localStorage.getItem('selection'));
    // Null means whole plot is shown
    if(selection === null){
      // Therefore reset the zoomPath
      localStorage.setItem('zoomPath', JSON.stringify([null]));
    } else {
      // Otherwise get the actual zoomPath from memory
      const zoomPath = JSON.parse(localStorage.getItem('zoomPath'));
      // And append new selection to it.
      zoomPath.push(selection);
      localStorage.setItem('zoomPath', JSON.stringify(zoomPath));
    }
  }


  fireChangeEvent(from = null) {
    const event = new Event('plotSelectionChanged');
    if(from !== null)
      event.from = from;
    document.dispatchEvent(event);
  }
}