import * as d3 from "d3";
import ZoomsTile from "./ZoomsTile";
import ZoomToolsTile from "./ZoomToolsTile";

export default class RightBar{
  constructor(element, selector, options) {
    this.element = element;
    this.element.style.opacity = '0';
    /* ZoomManager */
    this.zoomManager = options.zoomManager;
    this.init();
  }


  init(){
    const bar = d3.select(this.element);

    document.addEventListener('setupFinished', (e) => {
      bar.style('opacity', '1');
    });

    const zoomToolsTileID = 'zoomsTile';
    const zoomToolsTileElement = bar.append('div').attr('id', zoomToolsTileID).node();
    const zoomToolsTile = new ZoomToolsTile(zoomToolsTileElement, '#'+zoomToolsTileID, {
      zoomManager:  this.zoomManager,
      parent:       zoomToolsTileElement
    });

    const zoomTileID = 'zoomsTile';
    const zoomTileElement = bar.append('div').attr('id', zoomTileID).node();
    const zoomTile = new ZoomsTile(zoomTileElement, '#'+zoomTileID, {
      zoomManager:  this.zoomManager,
      parent:       zoomTileElement
    });
  }
}