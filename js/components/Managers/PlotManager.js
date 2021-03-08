/*******************************************************************
 * Class: PlotManager
 * Has function and handlers for general situations when working
 * with SVG plots.
 ******************************************************************/
import CsvLoader from "../CsvLoader";
import Plot from "../Plot";
import * as d3 from "d3";
export default class PlotManager {
  /**
   * Constructor for PlotManager class.
   * @param wrapperID DOM ID of element that should wrap plot elements.
   * @param zoomManager Instance of ZoomManager class.
   */
  constructor(wrapperID, zoomManager) {
    this.numOfPlots = 2;
    this.wrapperID = wrapperID;
    this.init();
    this.csvLoader = new CsvLoader();
    this.zoomManager = zoomManager;
  }


  init() {
    document.addEventListener('DOMContentLoaded', (e) => this.onPageLoadedHandler(e));
    document.addEventListener('setupFinished', (e) => this.onSetupFinishedHandler(e));
  }


  /**
   * Function that is called when whole page is loaded.
   *
   * Tries to load data for plot generation from local storage.
   * If not found call for initial behavior aka show settings modal.
   * If found skip initial setting and draw all plots immediately.
   * @param e Event
   */
  onPageLoadedHandler(e) {
    this.wrapperElement = document.getElementById(this.wrapperID);
    const points = JSON.parse(localStorage.getItem('savedPoints'));
    const axes = JSON.parse(localStorage.getItem('axes'));
    if(points !== null && axes !== null){
      const onFinishEvent = new CustomEvent('setupFinished');
      onFinishEvent.settings = points;
      onFinishEvent.fromInit = true;
      document.dispatchEvent(onFinishEvent);
      this.createPlots(points, axes);
    } else {
      const onFinishEvent = new CustomEvent('showSettingsModal');
      document.dispatchEvent(onFinishEvent);
    }
  }


  /**
   * Function that is called after settings are set and data are ready to be loaded.
   *
   * Loads data from CSV file, saves them and draws plots out of those data.
   * @param e Event
   */
  onSetupFinishedHandler(e) {
    if(typeof e.fromInit !== "undefined" && e.fromInit)
      return;
    const setup = e.settings;
    const file = setup.files[0];
    this.csvLoader.readFile(file).then(r => {
      const data = this.csvLoader.getPointsArray(setup.axes.x, setup.axes.y);
      localStorage.setItem('savedPoints', JSON.stringify(data));
      localStorage.setItem('axes', JSON.stringify(setup.axes));
      this.createPlots(data, setup.axes);
    });
  }


  /**
   * For points values and information about axes creates all plots.
   * @param points List of objects containing 'x' and 'y' keys and number values
   * @param axes Object containing string values of axe name under 'x' or 'y' keys
   */
  createPlots(points, axes) {
    for(let i = 0; i<this.numOfPlots; i++){
      const id = 'plot-'+i;
      const classed = 'plot';
      d3.select(this.wrapperElement).append('svg')
        .attr('id', 'wrapper-plot-'+i)
        .classed('plot', true);
      const element = document.getElementById('wrapper-plot-'+i);
      new Plot(element, '.'+classed, {
        zoomManager: this.zoomManager,
        DOM_ID: id,
        data: points,
        group: 1
      });
    }
  }
}