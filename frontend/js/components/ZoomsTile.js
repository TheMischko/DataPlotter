import * as d3 from "d3";

export default class ZoomsTile {
  constructor(element, selector, options) {
    this.element = element;
    /* ZoomManager */
    this.zoomManager = options['zoomManager'];
    this.parent = options['parent'];
    this.init();
  }

  init(){
    const parent = d3.select(this.parent);
    parent.classed('option-tile', true);
    parent.append('h1')
      .text('Saved zooms:');

    document.addEventListener('setupFinished', (e) => {
      parent.selectAll('.zoomButton').remove();
      this.zoomManager.getAllZooms().then((zooms) => {
        this.zoomManager.setLocalZooms(zooms);
        for(let i = 0; i < zooms.length; i++){
          const name = zooms[i].name === ''
            ? 'Zoom'+zooms[i].id
            : zooms[i].name
          this.appendZoomButton(parent, zooms[i].id, name, false);
        }
      });
    });

    parent.append('button')
      .attr('id', 'add-zoom')
      .html('<i class="fas fa-plus"></i>&nbsp;Save current zoom')
      .classed('success', true)
      .on('click', (e) => {
        this.addZoomClicked(e);
      });
  }


  appendZoomButton(barElement, zoomId, name, startWithInput){
    const button = barElement.append('button')
      .classed('zoomButton', true)
      .attr('name', name)
      .attr('zoom-id', zoomId)
      .on('click', (e) => {this.savedZoomButtonClicked(e)})
      .on('dblclick', (e) => {this.savedButtonDoubleClk(e)});
    button.append('div')
      .text(name)
      .style('display', startWithInput ? 'none' : 'block')
    button.append('input')
      .attr('type', 'text')
      .attr('placeholder', 'Set name...')
      .attr('zoom-id', zoomId)
      .style('display', startWithInput ? 'block' : 'none')
      .on('blur', (e) => {this.inputLostFocus(e)})
      .on('keypress', (e) => {this.inputKeyPressed(e)})
      .node().focus();
  }


  /**
   * Handler for click event on button that saves new zoom.
   * @param e Event
   */
  addZoomClicked(e) {
    const newIndex = this.zoomManager.saveCurrentZoom().then((zoom) => {
      const parent = d3.select(e.target.parentNode);
      this.appendZoomButton(parent, zoom._id, '', true);
    });

  }

  /**
   * Handler for click event on button representing saved zoom.
   * @param e
   */
  savedZoomButtonClicked(e) {
    let target = e.target;
    while(target.tagName !== 'BUTTON'){
      target = target.parentNode;
    }
    const zoomID = target.getAttribute('zoom-id');
    const zoomSequence = this.zoomManager.getZoomByID(zoomID).zoomSequence;
    if(target.classList.contains('deleteMode')){
      this.savedZoomButtonDeleteClicked(target, zoomID);
      return;
    }
    // If is current view set over whole plot ignore the first step of zoomPath aka 'Go back to default'
    if(this.zoomManager.getCurrentZoomPath().length === 1) {
      zoomSequence.splice(0, 1);
    }
    for(let i = 0; i < zoomSequence.length; i++) {
      setTimeout(() => {
        if(i === 0 && zoomSequence[i] === null)
          this.zoomManager.setSelection(null)
        else
          this.zoomManager.setSelection([zoomSequence[i][0], zoomSequence[i][1]]);
        localStorage.setItem('activeZoom', JSON.stringify(zoomID));
        this.zoomManager.fireChangeEvent('button');
      }, 300*i);
    }
  }


  savedZoomButtonDeleteClicked(target, zoomID){
    const name = target.getAttribute('name');
    if(target.classList.contains('deleteReady')){
      d3.select(target)
        .remove();
      this.zoomManager.deleteZoom(zoomID).then();
    } else {
      d3.select(target)
        .classed('danger', false)
        .classed('deleteReady', true)
        .select('div')
        .text('Are you sure?');

      setTimeout(() => {
        d3.select(target)
          .classed('danger', true)
          .classed('deleteReady', false)
          .select('div')
          .text(name);
      }, 3000);
    }
  }


  savedButtonDoubleClk(e) {
    let target = e.target;
    while(target.tagName !== 'BUTTON'){
      target = target.parentNode;
    }
    // Hide button text
    d3.select(target.children[0])
      .style('display', 'none');
    // Show input
    d3.select(target.children[1])
      .style('display', 'block')
      .node().focus();
  }


  inputLostFocus(e) {
    const nameVal = e.target.value !== ''
      ? e.target.value
      : 'Zoom'+e.target.getAttribute('zoom-id');

    // Show text
    d3.select(e.target.previousSibling)
      .text(nameVal)
      .style('display', 'block');
    // Hide input
    d3.select(e.target)
      .style('display', 'none');
    d3.select(e.target.parentNode)
      .attr('name', nameVal);
    this.zoomManager.updateZoom(
      e.target.getAttribute('zoom-id'),
      {name: nameVal}).then();
  }


  inputKeyPressed(e) {
    if(e.code === 'Enter' || e.code === 'NumpadEnter'){
      e.target.blur();
    }
  }

}