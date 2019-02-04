import React, { Component } from 'react';
import * as d3 from "d3";

import '../styles/map.css';

const ZOOM_SPEED = 0.1;

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      scale: 100,
      mapX: null,
      mapY: null,
    };

    this.container = React.createRef();

    this.geoJson = null;
    this.mouse = {
      dragging: false,
      x: 0,
      y: 0,
    };
  }

  componentDidMount = () => {
    window.addEventListener('resize', this.initMapState);
    this.initMapState();
  }
  
  componentDidUpdate = () => {
    this.drawMap();
  }
  
  componentWillUnmount = () => {
    window.removeEventListener('resize', this.initMapState);
  }

  initMapState = () => {
    let { offsetWidth, offsetHeight } = this.container.current;
    this.setState({
      width: offsetWidth,
      height: offsetHeight,
      mapX: offsetWidth / 2,
      mapY: offsetHeight / 2,
      scale: offsetHeight / 4.25,
    });
  }
  
  drawMap = async () => {

    // Load GeoJSON data
    if (this.geoJson === null)
      this.geoJson = await d3.json('/world.geo.json')

    // Get params to draw the map
    var { width, height, scale, mapX, mapY } = this.state;
    
    var svg = d3.select('#map')
                .attr('width', width)
                .attr('height', height);
    svg.selectAll("*").remove();
    var g = svg.append('g');
                
    var projection = d3.geoMercator()
                       .scale(scale)
                       .center([0, 42])
                       .translate([mapX, mapY]);
    var geoPath = d3.geoPath()
                 .projection(projection);
    
    g.selectAll('path')
     .data(this.geoJson.features)
     .enter()
     .append('path')
     .attr('fill', '#ccc')
     .attr('d', geoPath);

  }

  zoom = (amount) => {
    this.setState({
      scale: this.state.scale * amount
    });
  }

  translate = ({dx=0, dy=0}) => {
    this.setState({
      mapX: this.state.mapX + dx,
      mapY: this.state.mapY + dy
    });
  }

  moveTo = ({x, y}) => {
    this.setState({
      mapX: x,
      mapY: y
    });
  }

  onMouseDown = (e) => {
    this.mouse.dragging = true;
    this.mouse.x = e.nativeEvent.offsetX;
    this.mouse.y = e.nativeEvent.offsetY;
  }

  onMouseMove = (e) => {
    if (!this.mouse.dragging) return;

    let { x, y } = this.mouse;
    this.mouse.x = e.nativeEvent.offsetX;
    this.mouse.y = e.nativeEvent.offsetY;
    
    this.translate({
      dx: this.mouse.x - x,
      dy: this.mouse.y - y
    });
  }

  onWheel = (e) => {
    let zoomFactor = e.deltaY > 0 ? 1 - ZOOM_SPEED : 1 + ZOOM_SPEED;
    let dx = (this.container.current.offsetWidth/2 - this.state.mapX) * (zoomFactor - 1);
    let dy = (this.container.current.offsetHeight/2 - this.state.mapY) * (zoomFactor - 1);
    this.translate({dx: -dx, dy: -dy});
    this.zoom(zoomFactor);
  }

  render() { 
    return (
      <div id="map-container" ref={this.container}>
        <svg 
          id="map"
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={() => { this.mouse.dragging = false }}
          onMouseLeave={() => { this.mouse.dragging = false }}
          onWheel={this.onWheel}
          onDoubleClick={this.onDoubleClick}
        >
        </svg>
      </div>
    );
  }
}
 
export default Map;