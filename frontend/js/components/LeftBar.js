import * as d3 from "d3";
import PlotToolsTile from "./PlotToolsTile";

/**
 * Class for left side bar on main page.
 */
export default class LeftBar{
  constructor(element, selector, options) {
    this.element = element;
    this.element.style.opacity = '0';
    this.init();
  }

  /**
   * Function that initialize code of the class.
   */
  init() {
    const bar = d3.select(this.element);
    // Called when the application knows all needed information to create plots.
    document.addEventListener('setupFinished', (e) => {
      bar.style('opacity', '1');
    });
    // Create PlotTool menu tile
    const plotTileID = 'plotTile';
    const plotTileElement = bar.append('div').attr('id', plotTileID).node();
    const zoomTile = new PlotToolsTile(plotTileElement, '#'+plotTileID, {});
  }
}