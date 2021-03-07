import Modal from "./Modal";
import * as d3 from "d3";
import DataUploadPage from "./Pages/DataUploadPage";
import ValueSelectorPage from "./Pages/ValueSelectorPage";
import Plot from "../Plot";
import CsvLoader from "../CsvLoader";

export default class SettingsModal extends Modal{
    setupContent(){
        this.content = [
            new DataUploadPage(this),
            new ValueSelectorPage(this),
        ]
    }

    constructor(parentNode, selector, options) {
        super(parentNode, selector, options);
        this.selector = selector;
        this.activePage = 0
        this.numOfPlots = 2;
        this.data = {};
        this.zoomManager = options.zoomManager;
        this.init();
    }


    init() {
        document.addEventListener('DOMContentLoaded', e => this.onPageLoadedHandler(e));
        document.addEventListener('showSettingsModal', e => this.onShowNeededHandler(e));
    }


    onPageLoadedHandler() {
        d3.select('#'+this.DOM_ID).classed('hidden', true);
    }


    onShowNeededHandler() {
        this.setupContent()
        this.redraw();
    }

    createFooter(){
        this.setFooter('');
        const rowDiv = this.appendFooter('div')
        rowDiv.classed('footer-row', 'true')

        const leftButton = rowDiv.append('button')
            .attr('id', 'settingModal-leftButton')
            .classed('footer-button', 'true')
            .text('Prev')
            .on('click', (e) => this.leftButtonClicked(e))

        const pagesIndicator = rowDiv.append('div')
            .attr('id', 'settingModal-pagesIndicator')

        this.content.forEach((c, i) => {
            pagesIndicator.append('div')
                .classed('page', true)
                .classed('active', i === this.activePage)
        })

        const rightButton = rowDiv.append('button')
            .attr('id', 'settingModal-rightButton')
            .classed('footer-button', 'true')
            .text(this.activePage === this.content.length-1 ? 'Finish' :'Next')
            .on('click', (e) => this.rightButtonClicked(e))

    }

    leftButtonClicked(e){
        this.content[this.activePage].jobDone = true;
    }

    rightButtonClicked(e){
        this.activePage++;
        if(this.activePage === this.content.length) {
            this.activePage--;
            this.onFinishHandler();
        }
        else
            this.redraw();


    }

    redraw(){
        const activeContent = this.content[this.activePage];
        const headerHTML = `<h1>Step ${this.activePage+1}: ${activeContent.getTitle()}</h1>`
        this.setHeader(headerHTML);
        activeContent.getContent().then(r => {
            this.setBody(r);
            this.createFooter();

            if(this.activePage === 0){
                d3.select('#settingModal-leftButton').attr('disabled', true);
            } else {
                d3.select('#settingModal-leftButton').attr('disabled', null);
            }

            if(!activeContent.isAllowedToNext()){
                d3.select('#settingModal-rightButton').attr('disabled', true);
            } else {
                d3.select('#settingModal-rightButton').attr('disabled', null);
            }

            activeContent.initFunctions();
        })
        setTimeout(() => {
            d3.select('#'+this.DOM_ID).classed('hidden', false);
        }, 100);

    }


    activePageDoneHandler(){
        const activeContent = this.content[this.activePage];
        if(!activeContent.isAllowedToNext()){
            d3.select('#settingModal-rightButton').attr('disabled', true);
            return;
        }

        const outputData = activeContent.returnValue();
        this.data[outputData.key] = outputData.value;

        d3.select('#settingModal-rightButton').attr('disabled', null);

    }

    onFinishHandler(){
        console.log(this.data);
        const onFinishEvent = new CustomEvent('setupFinished');
        onFinishEvent.settings = this.data
        document.dispatchEvent(onFinishEvent);
        const modalInDOM = d3.selectAll('#'+this.DOM_ID)
                            .transition()
                                .duration(500)
                                .style("opacity", 0)
                                .style('display', 'none');

        setTimeout(()=>{
            modalInDOM.style('display', 'none');
        }, 1000);
    }
}