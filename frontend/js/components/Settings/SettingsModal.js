import Modal from "./Modal";
import * as d3 from "d3";
import DataUploadPage from "./Pages/DataUploadPage";
import FileSelectPage from "./Pages/FileSelectPage";
import ViewSelectPage from "./Pages/ViewSelectPage";
import ViewMakerPage from "./Pages/ViewMakerPage";

const $ = require('jquery-ajax');

export default class SettingsModal extends Modal{
    setupContent(){
        this.content = [
            new FileSelectPage(this),
            new DataUploadPage(this),
            new ViewSelectPage(this),
            new ViewMakerPage(this)
        ]
    }

    constructor(parentNode, selector, options) {
        super(parentNode, selector, options);
        this.selector = selector;
        this.activePage = 0
        this.data = {};
        this.zoomManager = options.zoomManager;
        this.init();
    }


    init() {
        document.addEventListener('DOMContentLoaded', e => this.onPageLoadedHandler(e));
        document.addEventListener('showSettingsModal', e => this.onShowNeededHandler(e));
        document.addEventListener('setupNeeded', e => this.onSetupNeedHandler(e))
    }


    onPageLoadedHandler() {
        d3.select('#'+this.DOM_ID).classed('hidden', true);
    }


    onShowNeededHandler() {
        this.element.style('display', 'block');
        this.element.style('opacity', '1');
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
        this.activePage--;
        this.content[this.activePage].resetOutputValue();
        this.content[this.activePage].jobDone = false;
        this.redraw();
    }

    rightButtonClicked(e){
        const activeContent = this.content[this.activePage];
        activeContent.returnValue().then((outputData) => {
            outputData.forEach((data) => {
                this.data[data.key] = data.value;
            });
            this.activePage++;
            if(this.activePage === this.content.length) {
                this.activePage--;
                this.onFinishHandler();
            }
            else
                this.redraw();

        });
    }

    redraw(){
        const activeContent = this.content[this.activePage];
        console.log(this.data);
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
        d3.select('#settingModal-rightButton').attr('disabled', null);
    }

    onFinishHandler(){
        this.getAllPlotData().then((data) => {
            localStorage.setItem('plotData', JSON.stringify(data));
            const onFinishEvent = new CustomEvent('setupFinished');
            onFinishEvent.settings = this.data
            document.dispatchEvent(onFinishEvent);
            const modalInDOM = d3.selectAll('#'+this.DOM_ID)
              .transition()
              .duration(250)
              .style("opacity", 0)

            setTimeout(()=>{
                d3.selectAll('#'+this.DOM_ID).style('display', 'none');
            }, 500);
        });
    }

    onSetupNeedHandler(e) {
        this.data = {};
        this.activePage = 0;
        this.onShowNeededHandler();
    }

    getAllPlotData(){
        return new Promise(((resolve, reject) => {
            const viewID = this.data.view;
            if(typeof viewID === "undefined" || viewID === ""){
                reject()
            }
            const SERVER_URL = localStorage.getItem("SERVER_URL");
            $.ajax({
                url: SERVER_URL+`/valuesFromView?viewID=${viewID}`,
                method: 'GET',
                beforeSend: (req) => {
                    req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
                    req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
                },
                success: (res) => {
                    resolve(JSON.parse(res));
                },
                error: (res) => {
                    console.error("Couldn't load View data!");
                    console.error(res);
                    reject(res);
                }
            });
    }))};


    forceNextPage() {
        const activeContent = this.content[this.activePage];
        activeContent.returnValue().then((outputData) => {
            outputData.forEach((data) => {
                this.data[data.key] = data.value;
            });
            this.rightButtonClicked();
        })
    }
}