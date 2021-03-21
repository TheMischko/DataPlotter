import Modal from "./Modal";
import * as d3 from "d3";
import DataUploadPage from "./Pages/DataUploadPage";
import ValueSelectorPage from "./Pages/ValueSelectorPage";
import FileSelectPage from "./Pages/FileSelectPage";
import Plot from "../Plot";
import CsvLoader from "../CsvLoader";
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
        const activeContent = this.content[this.activePage];
        activeContent.returnValue().then((outputData) => {
            this.data[outputData.key] = outputData.value;
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

    getAllPlotData(){
        return new Promise(((resolve, reject) => {
            const fileID = this.data.file;
            const viewID = this.data.view;
            if(typeof fileID === "undefined" || typeof viewID === "undefined" || fileID === "" || viewID === ""){
                reject()
            }
            this.getViewData(viewID).then(async (view) => {
                localStorage.setItem('title', view.title);
                localStorage.setItem('viewID', view._id);
                const plotSettings = view.plotSettings;
                const plotsData = [];
                for(const setting of plotSettings) {
                    const data = await this.getPlotData(fileID, setting.xColumn, setting.yColumn, setting.func);
                    plotsData.push(data);
                }
                resolve(plotsData);
            }, (err) => {
                console.error(("Could't load View data!"));
                console.error((err));
                reject();
            })
        }));

    }

    getViewData(viewID){
        return new Promise(((resolve, reject) => {
            const SERVER_URL = localStorage.getItem("SERVER_URL");
            $.ajax({
                url:    SERVER_URL + "/views?id=" + viewID,
                method: 'GET',
                beforeSend: (req) => {
                    req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
                    req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
                },
                success: (res) => {
                    resolve(JSON.parse(res));
                },
                error: (res) => {
                    reject(res);
                }
            })

        }));
    }

    getPlotData(fileID, xColumn, yColumn, func){
        return new Promise(((resolve, reject) => {
            const SERVER_URL = localStorage.getItem("SERVER_URL");
            $.ajax({
                url: SERVER_URL + `/values?id=${fileID}&x_value=${xColumn}&y_value=${yColumn}&func=${func}`,
                method: 'GET',
                beforeSend: (req) => {
                    req.setRequestHeader('Access-Control-Allow-Origin', SERVER_URL)
                    req.setRequestHeader('Access-Control-Allow-Credentials', 'true')
                },
                success: (res) => {
                    resolve(JSON.parse(res));
                },
                error: (res) => {
                    reject(res);
                }

            })
        }));
    }


    forceNextPage() {
        const activeContent = this.content[this.activePage];
        activeContent.returnValue().then((outputData) => {
            this.data[outputData.key] = outputData.value;
            this.rightButtonClicked();
        })
    }
}