import * as d3 from "d3"
import dataHandler from "./data";
export default class MainPlot{


    constructor(element) {
        this.dataHandler = new dataHandler();
        this.margin = {
            top: 10,
            right: 30,
            bottom: 30,
            left:60
        }
        // Setting dimensions of the plot
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 700 - this.margin.top - this.margin. bottom;
        this.ticksCount = 10;

        // Tooltip div
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
        // Main element
        this.svg = d3
            .select(element)
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin. bottom)
            .append("g")
            .attr("transform",
                "translate("+this.margin.left+","+this.margin.top+")");

        /***********************************
                    X axis
         ***********************************/

        this.xScale = d3.scaleTime()
            .domain([this.dataHandler.dates[0], this.dataHandler.dates[this.dataHandler.dates.length-1]])
            .range([0, this.width])
            .nice(50);

        this.xAxis = this.svg
            .append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(this.xScale));

        this.xGrid = this.svg.append('g')
            .attr('class', 'grid')
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.makeGridLinesX()
                .tickSize(-this.height)
                .tickFormat(""));

        /***********************************
                     Y axis
         ***********************************/
        this.yScale = d3.scaleLinear()
            .domain([0, 9600])
            .range([this.height, 0]);

        this.svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))

        this.svg.append('g')
            .attr('class', 'grid')
            .call(this.makeGridlinesY()
                .tickSize(-this.width)
                .tickFormat(''));

        // Add clipPath - everything out of this area won't be drawn.
        const clip = this.svg.append("defs")
            .append("svg:clipPath")
            .attr("id","clip")
            .append("svg:rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("x", 0)
            .attr("y", 0);

        // A function that set idleTimeOut to null
        this.idleTimeout = null;

        // Add brushing
        this.brush = d3.brushX()
            // initialise the brush area: start at 0,0 and finishes at width,height:
            // it means I select the whole graph area
            .extent([ [0,0], [this.width, this.height] ])
            // Each time the brush selection changes, trigger the 'updateChart' function
            .on("end", (selection) => {this.updateChart(this, selection);})

        // Line
        this.lineFunction = d3.line()
            .x((data) => {
                return this.xScale(data);
            })
            .y((data) => {
                return this.yScale(this.dataHandler.rawData[this.dataHandler.reverseTimeParser(data)]);
            })
            .curve(d3.curveNatural);

        this.lineGraph = this.svg.append("g")
            .attr("clip-path", "url(#clip)");
        this.lineGraph
            .append('path')
            .attr('class', 'curve')
            .attr('d', this.lineFunction(this.dataHandler.dates));
        // Points
        this.points = this.svg.append("g")
            .attr("clip-path", "url(#clip)");
        // Add the brushing
        this.points
            .append('g')
            .attr('class', 'brush')
            .call(this.brush)

        this.points
            .selectAll('.dot')
            .data(this.dataHandler.dates)
            .enter()
            .append('circle')
            .classed('dot', true)
            .attr('r', 3)
            .attr('cx', (data) => this.xScale(data))
            .attr('cy', (data) => this.yScale(this.dataHandler.rawData[this.dataHandler.reverseTimeParser(data)]))
            .on("mouseover", (e, data) => {
                this.pointsMouseOver(e, data);
            })
            .on("mouseout", (e, i) => {
                this.pointsMouseOut(e, i);
            })



    }


    makeGridLinesX() {
        return d3.axisBottom(this.xScale).ticks(this.ticksCount);
    }


    makeGridlinesY() {
        return d3.axisLeft(this.yScale)
            .ticks(this.ticksCount)
    }

    /**
     * A function that set idleTimeOut to null
     */
    idled() { this.idleTimeout = null }


    updateChart(ref, {selection} ) {
        d3.event.stopPropagation();
        console.log(selection);
        console.log(ref);
        let extent = selection;

        // If no selection, back to initial coordinate.
        // Otherwise update X axis domain
        if(!extent){
            if(!ref.idleTimeout)
                // This allows to wait a little bit
                return ref.idleTimeout = setTimeout(ref.idled, 350);
            ref.xScale.domain([this.dataHandler.dates[0], ref.dataHandler.dates[ref.dataHandler.dates.length-1]]);
        } else {
            ref.xScale.domain([ ref.xScale.invert(extent[0]), ref.xScale.invert(extent[1]) ]);
            // This removes the grey brush area as soon as the selection has been done
            ref.points.select('.brush').call(ref.brush.move, null);
        }

        //Update axis and circle position
        ref.xAxis
            .transition()
            .duration(1000)
            .call(d3.axisBottom(ref.xScale))
        ref.xGrid
            .transition()
            .duration(1000)
            .call(this.makeGridLinesX()
                .tickSize(-ref.height)
                .tickFormat(""));

        let lineFunction = d3.line()
            .x((data) => {
                return ref.xScale(data);
            })
            .y((data) => {
                return ref.yScale(ref.dataHandler.rawData[ref.dataHandler.reverseTimeParser(data)]);
            })
            .curve(d3.curveNatural);

        ref.lineGraph
            .selectAll('path')
            .transition()
            .duration(1000)
            .attr('d', lineFunction(ref.dataHandler.dates));

        ref.points
            .selectAll('.dot')
            .transition()
            .duration(1000)
            .attr('cx', (data) => ref.xScale(data))
            .attr('cy', (data) => ref.yScale(ref.dataHandler.rawData[ref.dataHandler.reverseTimeParser(data)]))
    }


    pointsMouseOver(e, data) {
        d3.select(e.target).transition()
            .duration('100')
            .attr("r", 5);

        this.tooltip.transition()
            .duration('100')
            .style('opacity', 1);
        this.tooltip.html(this.dataHandler.rawData[this.dataHandler.reverseTimeParser(data)])
            .style('left', (e.pageX + 10) + "px")
            .style('top', (e.pageY - 15) + "px")
    }


    pointsMouseOut(e, i){
        d3.select(e.target).transition()
            .duration('100')
            .attr("r", 3);

        this.tooltip.transition()
            .duration('100')
            .style('opacity', 0);
    }
}