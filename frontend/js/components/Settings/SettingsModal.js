import Modal from "./Modal";
import * as d3 from "d3";
import DataUploadPage from "./Pages/DataUploadPage";
import FileSelectPage from "./Pages/FileSelectPage";
import ViewSelectPage from "./Pages/ViewSelectPage";
import ViewMakerPage from "./Pages/ViewMakerPage";

const $ = require('jquery-ajax');
/**
 * Class of the modal window that handles getting data from user so other part of application
 * can create plots from them.
 */
export default class SettingsModal extends Modal{
    /**
     * Set which page are shown in modal.
     * Pages are shown in consecutively in order in which are in this.content array.
     * So this.content[0] is shown first, this.content[1] is shown as second etc.
     */
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

    /**
     * Hide modal when data for plots are loaded.
     */
    onPageLoadedHandler() {
        d3.select('#'+this.DOM_ID).classed('hidden', true);
    }

    /**
     * If event showSettingModal occurs, show modal
     */
    onShowNeededHandler() {
        this.element.style('display', 'block');
        this.element.style('opacity', '1');
        this.setupContent()
        this.redraw();
    }

    /**
     * Sets footer part of modal and creates it in DOM.
     */
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

    /**
     * Handler for leftButton click event.
     * Shows previous page.
     * @param e Event
     */
    leftButtonClicked(e){
        this.activePage--;
        this.content[this.activePage].resetOutputValue();
        this.content[this.activePage].jobDone = false;
        this.redraw();
    }

    /**
     * Handler for rightButton click event.
     * Saves output from current page and shows next or finishes the settings routine.
     * @param e Event
     */
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

    /**
     * Redraws content of modal with content of active page.
     */
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

    /**
     * This function is called by pages. Pages signalize to modal that their work is done
     * and user is able to continue on next page.
     */
    activePageDoneHandler(){
        const activeContent = this.content[this.activePage];
        if(!activeContent.isAllowedToNext()){
            d3.select('#settingModal-rightButton').attr('disabled', true);
            return;
        }
        d3.select('#settingModal-rightButton').attr('disabled', null);
    }

    /**
     * This function is called when there are no other pages and user finished whole setup routine.
     * All data are saved so other parts of application can use then.
     * Fires onFinishEvent and hides modal.
     */
    onFinishHandler(){
        this.getAllPlotData().then((data) => {
            localStorage.setItem('plotData', JSON.stringify(data));
            localStorage.setItem('viewID', JSON.stringify(this.data.view));
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

    /**
     * Handler for showSettingModal event.
     * Resets saved modal data and shows first page.
     * @param e Event
     */
    onSetupNeedHandler(e) {
        this.data = {};
        this.activePage = 0;
        this.onShowNeededHandler();
    }

    /**
     * Async function that call backend API for data for plots described by data saved from pages.
     * @return {Promise<{}[]>} Returns data for plots in array of objects.
     */
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

    /**
     * Immediately show next page without user clicking on rightButton.
     */
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