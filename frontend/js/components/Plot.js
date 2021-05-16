import * as d3 from "d3";
import css from "../../css/plot.css"

/**
 * Main class that handles all behavior of single plot on the page.
 */
export default class Plot{
    /**
     * Main class that handles all behavior of single plot on the page.
     * @param element HTMLElement of SVG element that corresponds to current plot.
     * @param selector DOM selector for SVG element.
     * @param options Dictionary of additional data.
     * Options for Plot class should contain these keys:
     * zoomManager, data, DOM_ID
     */
    constructor(element, selector, options) {
        this.element = element;
        this.selector = selector;
        this.options = options;
        this.zoomManager = options.zoomManager;
        // Saves data from parameter to this.data attribute.
        this.parseData(options.data).then(() => {
            // Line parts of the plot for each individual course.
            this.lineGraphs = {};
            // Data of point corresponding to each individual course.
            this.points = {};
            // Tooltip elements for each individual course.
            this.tooltips = {};
            // D3 selection of parent node of this.element.
            this.parent = d3.select(this.element.parentNode);
            // Handle resize event.
            window.addEventListener('resize', (e) => {
                this.resize(e);
            })
            // Initialize plot.
            this.init(element);
            // Set axis for this plot.
            this.setAxis();
            // Draw courses to SVG element.
            this.drawPlot();
        }, (err) => {
            notify(err, {type: "danger"});
            console.error(err);
        });
    }

    /**
     * Async function that translate input data to format that other function needs.
     * @param data - Array of objects corresponding to each course containing these values:
     * String color, String func, [{*}] values, String xColumn, String yColumn
     * @return {Promise<void>}
     */
    parseData(data){
        this.data = [];
        return new Promise(((resolve, reject) => {
            if(data == null) {
                reject("Data for plot are null");
                return;
            }
            data.forEach((course, i) => {
                this.data.push({
                    points: course.values,
                    color: course.color,
                    courseID: i,
                    xColumn: course.xColumn,
                    yColumn: course.yColumn,
                    func: course.func
                })
            });
            resolve();
        }));
    }


    /**
     * Initiate basic properties of plot like element at DOM, margins and sizes.
     * @param element Corresponding DOM element for plot.
     */
    init(element){
        // Margin corresponds to padding between the element boundaries and start of the actual plot.
        this.margin = {
            top: 10,
            right: 30,
            bottom: 30,
            left: window.innerWidth < 900 ? 40 : 60
        }
        // Setting dimensions of the plot
        this.width = this.parent.node().offsetWidth - this.margin.left - this.margin.right;
        this.height = window.innerHeight/2.2 - this.margin.top - this.margin. bottom;
        // Number of lines each axis
        this.ticksCount = 10;

        this.DOM_id = this.options.DOM_ID;
        // Main element
        this.svg = d3
            .select(element)
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin. bottom)
            .append("g")
            .attr('id', this.DOM_id)
            .attr("transform",
                "translate("+this.margin.left+","+this.margin.top+")")
            // Custom event signalizing when user hovers over plot
            .on("mousemove", (e) => {
                const event = new MouseEvent('plotMouseOver', e)
                event.group = this.group;
                event.sourcePlot = this.element;
                document.dispatchEvent(event);
            })
            // Custom event signalizing when user hovers out of plot
            .on("mouseleave", (e) => {
                const event = new MouseEvent('plotMouseLeave', e)
                event.group = this.group;
                event.sourcePlot = this.element;
                document.dispatchEvent(event);
            });
        // Listen to custom event that can occur on other plots as well.
        document.addEventListener('plotMouseOver', e => {
            this.showMouseTooltip(e);
        })
        // Tooltip divs
        this.data.forEach((course) => {
            this.tooltips[course.courseID] = d3.select(document.body)
              .append('div')
              .attr('class', 'tooltip')
              .attr('plotID', this.DOM_id.split("wrapper-plot-")[0])
              .attr('courseID', course.courseID)
              .style('opacity', 0)
        })
        // Add clipPath - everything out of this area won't be drawn.
        this.clipId = "clip-"+Date.now();
        this.clip = this.svg.append("defs")
            .append("svg:clipPath")
            .attr("id",this.clipId)
            .append("svg:rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("x", 0)
            .attr("y", 0);

        // Store idleTimeout that is used to optimize how often application calls selection handler.
        localStorage.setItem('idleTimeout', null)
        // Initialize selection in memory that uses values values between <0, 1> that corresponds to
        // percentage of pixel selected from plot.
        localStorage.setItem('selection', JSON.stringify([0, 1]));
        // Initialize default selection values used for returning back to default view.
        localStorage.setItem('default-selection', JSON.stringify([0, 1]));
        // Initialize activeZoom value that corresponds to ID of current zoom from backend API.
        localStorage.setItem('activeZoom', null);

        // Add brushing
        this.brush = d3.brushX()
            // Initialise the brush area: start at 0,0 and finishes at width,height:
            // it means I select the whole graph area
            .extent([ [0,0], [this.width, this.height] ])
            // Each time the brush selection changes, send custom event plotSelectionChanged
            .on("end", (e) => {
                if(typeof(e.sourceEvent) !== 'undefined') {
                    const event = new Event('plotSelectionChanged')
                    event.from = 'mouse';
                    const selection = e.selection !== null
                      ? [
                        e.selection[0]/(this.width-this.margin.left),
                        e.selection[1]/(this.width-this.margin.left)
                      ]
                      : null;
                    // Save selection as percentage of pixels selected from plot.
                    localStorage.setItem('selection', JSON.stringify(selection));
                    document.dispatchEvent(event);
                }
            });
        // Listen to custom event that can occur on other plots as well.
        document.addEventListener('plotSelectionChanged', (data) => {
            let selection = JSON.parse(localStorage.getItem('selection'));
            const sel = selection !== null
                ? [selection[0]*(this.width-this.margin.left), selection[1]*(this.width-this.margin.left)]
                : null;
            this.updateChart(this, {selection: sel}, true)
        });
    }


    /**
     * Set both axis by values corresponding to the data in this.data property.
     */
    setAxis(){
        /***********************************
                    X axis
         ***********************************/

        const boundaries = this.findBoundaries();

        this.xScale = d3.scaleLinear()
            .domain([boundaries.minX, boundaries.maxX])
            .range([0, this.width])
            .nice(50);

        this.xAxis = this.svg
            .append("g")
            .attr('id', 'xAxis')
            .attr("transform", "translate(0," + this.height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(this.xScale));

        this.xGrid = this.svg.append('g')
            .attr('id', 'xGrid')
            .attr('class', 'grid')
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.makeGridLinesX()
                .tickSize(-this.height)
                .tickFormat(""));

        /***********************************
                    Y axis
         ***********************************/
        this.yScale = d3.scaleLinear()
            .domain([boundaries.minY, boundaries.maxY])
            .range([this.height, 0]);

        this.svg.append("g")
            .attr('id', 'yAxis')
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))

        this.svg.append('g')
            .attr('class', 'grid')
            .attr('id', 'yGrid')
            .call(this.makeGridlinesY()
                .tickSize(-this.width)
                .tickFormat(''));
    }

    /**
     * Draw plot to SVG element.
     */
    drawPlot(){
        // Tooltip line
        this.svg
            .append('g')
            .append('line')
            .classed('tooltip-line', true)
            .attr('target-id', this.DOM_id)
            .attr('x1', 100)
            .attr('x2', 100)
            .attr('y1', 0)
            .attr('y2', this.height)
            .attr('style', "stroke:rgb(255,0,0);stroke-width:2")
        // Line function, changes how the line between points is drawn.
        this.lineFunction = d3.line()
          .x((data) => {
              return this.xScale(data.x);
          })
          .y((data) => {
              return this.yScale(data.y);
          })
          .curve(d3.curveNatural);
        // Draw line for each course in data.
        this.data.forEach((course) => {
            // Append new element to SVG and store it in dictionary.
            this.lineGraphs[course.courseID] = this.svg.append("g")
              .attr("clip-path", "url(#"+this.clipId+")");
            this.lineGraphs[course.courseID]
              .append('path')
              .attr('id', 'lineGraph-path')
              .attr('class', 'curve')
              .attr('d', this.lineFunction(course.points))
              .attr('style', `stroke:${course.color};`);
            // Append new wrapper element for points of course.
            this.points[course.courseID] = this.svg.append("g")
              .attr("clip-path", "url(#"+this.clipId+")");
            // Draw the points.
            this.points[course.courseID]
              .append('g')
              .attr('class', 'brush')
              .call(this.brush)
        })
    }

    /**
     * Used to find max and min values for data in this.data property.
     * @returns {{minY: number, minX: number, maxY: number, maxX: number}}
     */
    findBoundaries(){
        const boundaries = {
            'minX': Number.MAX_SAFE_INTEGER,
            'maxX': Number.MIN_SAFE_INTEGER,
            'minY': Number.MAX_SAFE_INTEGER,
            'maxY': Number.MIN_SAFE_INTEGER
        }

        this.data.forEach( (course) => {
            course.points.forEach(point => {
                boundaries.maxX = point.x > boundaries.maxX ? point.x : boundaries.maxX;
                boundaries.minX = point.x < boundaries.minX ? point.x : boundaries.minX;
                boundaries.maxY = point.y > Number(boundaries.maxY) ? point.y : Number(boundaries.maxY);
                boundaries.minY = point.y < Number(boundaries.minY) ? point.y : Number(boundaries.minY);
            });
        });
        return boundaries;
    }


    /**
     * Creates X-axis gridlines in graph.
     * @returns {*|[*]|[]|*[]}
     */
    makeGridLinesX() {
        return d3.axisBottom(this.xScale).ticks(this.ticksCount);
    }

    /**
     * Creates Y-axis gridlines in graph.
     * @returns {*|[*]|[]|*[]}
     */
    makeGridlinesY() {
        return d3.axisLeft(this.yScale)
            .ticks(this.ticksCount)
    }

    /**
     * A function that set idleTimeOut to null
     */
    idled() {
        localStorage.setItem('idleTimeout', 'false');
    }

    /**
     * Function that redraw graph in chosen region for zoom.
     * @param ref This object
     * @param selection Tuple of starting point and ending point for zoom.
     * @param resetSelectionAfter Boolean if method should save default selection value into selection.
     * @returns {number}
     */
    updateChart(ref, {selection}, resetSelectionAfter = false ) {
        let extent = selection;
        let idleTimeout = JSON.parse(localStorage.getItem('idleTimeout'));

        // If no selection, back to initial coordinate.
        // Otherwise update X axis domain.
        if(extent === null){
            if(idleTimeout === null)
                // This allows to wait a little bit.
                return idleTimeout = setTimeout(() => {ref.idled();}, 350);
            const boundaries = this.findBoundaries();
            ref.xScale.domain([boundaries.minX, boundaries.maxX]);
        } else {
            ref.xScale.domain([ ref.xScale.invert(extent[0]), ref.xScale.invert(extent[1]) ]);
            // This removes the grey brush area as soon as the selection has been done.
            ref.data.forEach((course) => {
                ref.points[course.courseID].select('.brush').call(ref.brush.move, null);
            })
        }

        //Update axis and circle position.
        ref.xAxis
            .transition()
            .duration(200)
            .call(d3.axisBottom(ref.xScale))
        ref.xGrid
            .transition()
            .duration(200)
            .call(this.makeGridLinesX()
                .tickSize(-ref.height)
                .tickFormat(""));

        // Redraw each course of plot.
        this.data.forEach((course) => {
            const lineGraph = ref.lineGraphs[course.courseID];
            lineGraph
              .selectAll('path')
              .transition()
              .duration(200)
              .attr('d', this.lineFunction(course.points));

            const points = ref.points[course.courseID];
            points
              .selectAll('.dot')
              .transition()
              .duration(200)
              .attr('cx', (data) => ref.xScale(course.points.x))
              .attr('cy', (data) => ref.yScale(course.points.y))
        });
    }

    /**
     * Handler for plotMouseOver event.
     * Shows value tooltip for each plot course on corresponding position.
     * @param e Event
     */
    showMouseTooltip(e) {
        // This allows to find the closest X index of the mouse:
        const bisect = d3.bisector(function(d) { return d.x; }).left;
        const x0 = this.xScale.invert(e.pageX-this.element.getBoundingClientRect().x-this.margin.left);
        d3.selectAll('.tooltip-line')
            .attr('x1', e.pageX-this.element.getBoundingClientRect().x-this.margin.left)
            .attr('x2', e.pageX-this.element.getBoundingClientRect().x-this.margin.left);

        this.data.forEach((course) => {
            const tooltip = this.tooltips[course.courseID];
            const i = bisect(course.points, x0, 1);
            if(typeof (course.points[i]) === 'undefined'){
                return
            }
            tooltip.style('opacity', 0.9);

            tooltip.html(`[${parseFloat(course.points[i].x).toFixed(2)};
            ${parseFloat(course.points[i].y).toFixed(2)}]`)
                .style('left', (this.xScale(course.points[i].x) + 10 + this.element.getBoundingClientRect().x) + "px")
                .style('top', (this.yScale(course.points[i].y)+ 10 + this.element.getBoundingClientRect().y) + "px")
                .style('background-color', course.color)
                .style('border-color', course.color);
        });
    }

    /*
     * Handler for onResize event.
     * Redraw courses that they fit into changed element size.
     */
    resize(e){
        this.margin.left = window.innerWidth < 900 ? 40 : 60;
        this.width = this.parent.node().offsetWidth - this.margin.left - this.margin.right;
        this.height = window.innerHeight/2.5 - this.margin.top - this.margin. bottom;

        this.svg = d3
          .select(this.element)
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin. bottom)
          .select("g")
          .attr("transform",
            "translate("+this.margin.left+","+this.margin.top+")");

        const clip_test = this.svg.select("defs")
          .select("clipPath")
          .select("rect")
          .attr("width", this.width)
          .attr("height", this.height)
          .attr("x", 0)
          .attr("y", 0);

        this.brush.extent([ [0,0], [this.width, this.height] ]);

        const boundaries = this.findBoundaries();

        this.xScale = d3.scaleLinear()
          .domain([boundaries.minX, boundaries.maxX])
          .range([0, this.width])
          .nice(50);

        this.xAxis = this.svg
          .select('#xAxis')
          .attr("transform", "translate(0," + this.height + ")")
          .call(d3.axisBottom(this.xScale));

        this.xGrid = this.svg
          .select('#xGrid')
          .attr("transform", "translate(0," + this.height + ")")
          .call(this.makeGridLinesX()
            .tickSize(-this.height)
            .tickFormat(""));

        this.yScale = d3.scaleLinear()
          .domain([boundaries.minY, boundaries.maxY])
          .range([this.height, 0]);

        this.svg.select("#yAxis")
          .call(d3.axisLeft(this.yScale))

        this.svg.select('#yGrid')
          .call(this.makeGridlinesY()
            .tickSize(-this.width)
            .tickFormat(''));

        this.svg
          .select(`[target-id=${this.DOM_id}]`)
          .attr('target-id', this.DOM_id)
          .attr('x1', 100)
          .attr('x2', 100)
          .attr('y1', 0)
          .attr('y2', this.height)

        this.data.forEach((course) => {
            this.lineGraphs[course.courseID]
              .select('#lineGraph-path')
              .attr('d', this.lineFunction(course.points));

            this.points[course.courseID]
              .select('.brush')
              .call(this.brush)

            this.points[course.courseID]
              .selectAll('.dot')
              .data(course.points)
              .enter()
              .select('circle')
              .attr('r', 3)
              .attr('cx', (data) => this.xScale(data.x))
              .attr('cy', (data) => this.yScale(data.y))
        });
    }
}