import * as d3 from "d3";
import ZoomsTile from "./ZoomsTile";
import PlotToolsTile from "./PlotToolsTile";

export default class LeftBar{
  constructor(element, selector, options) {
    this.element = element;
    this.element.style.opacity = '0';
    this.init();
  }

  init() {
    const bar = d3.select(this.element);

    document.addEventListener('setupFinished', (e) => {
      bar.style('opacity', '1');
    });

    const plotTileID = 'zoomsTile';
    const plotTileElement = bar.append('div').attr('id', plotTileID).node();
    const zoomTile = new PlotToolsTile(plotTileElement, '#'+plotTileID, {});
  }
}