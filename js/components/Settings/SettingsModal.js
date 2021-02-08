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
        this.activePage = 0
        this.numOfPlots = 2;
        this.data = {};
        this.zoomManager = options.zoomManager;
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
        const onFinishEvent = new CustomEvent('setupFinished', { settings: this.data });
        document.dispatchEvent(onFinishEvent);
        const modalInDOM = d3.selectAll('#'+this.DOM_ID)
                            .transition()
                                .duration(500)
                                .style("opacity", 0)
                                .style('display', 'none');

        setTimeout(()=>{
            modalInDOM.style('display', 'none');
        }, 1000);

        this.createPlots();
    }


    createPlots(){
        const plotsWrapper = d3.select('#plots');

        const csv = new CsvLoader();
        csv.readFile(this.data.files[0]).then(r => {
            const data = csv.getPointsArray(this.data.axes.x, this.data.axes.y);

            for(let i = 0; i<this.numOfPlots; i++){
                const id = 'plot-'+i;
                const classed = 'plot';
                plotsWrapper.append('svg')
                    .attr('id', 'wrapper-plot-'+i)
                    .classed('plot', true);
                const element = document.getElementById('wrapper-plot-'+i);
                new Plot(element, '.'+classed, {
                    zoomManager: this.zoomManager,
                    DOM_ID: id,
                    data: data,
                    group: 1
                });
            }
        });

    }
}