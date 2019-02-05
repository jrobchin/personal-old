import React, { Component } from 'react';
import * as d3 from "d3";

import '../styles/map.css';

const ZOOM_SPEED = 0.1;

const PINS = [
  {
    name: 'Toronto, Canada',
    long: -79.6010328,
    lat: 43.6565353,
  },
  {
    name: 'Berlin, Germany',
    long: 13.4050,
    lat: 52.5200
  },
  {
    name: 'New York, USA',
    long: -74.0060,
    lat: 40.7128
  },
  {
    name: 'London, Canada',
    long: -81.2453,
    lat: 42.9849
  },
  {
    name: 'London, Canada',
    long: -81.2453,
    lat: 42.9849
  }
];

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      scale: 0,
      mapX: 0,
      mapY: 0,
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

    let state = {
      width: offsetWidth,
      height: offsetHeight,
      scale: 186,
      mapX: 380,
      mapY: 220,
    };

    if (offsetWidth > 600) {
      state.scale = 186;
      state.mapX = 465;
      state.mapY = 221;
    } else if (offsetWidth > 992) {
      state.scale = 186;
      state.mapX = 544;
      state.mapY = 229;
    }

    this.setState(state);
  }
  
  drawMap = async () => {

    // Load GeoJSON data
    if (this.geoJson === null)
      this.geoJson = await d3.json('/world.geo.json')

    // Get params to draw the map
    var { width, height, scale, mapX, mapY } = this.state;
    
    // Create map and svg groups
    var svg = d3.select('#map')
                .attr('width', width)
                .attr('height', height);
    svg.selectAll("*").remove();
    var mapG = svg.append('g');
    var pinG = svg.append('g');
    
    // Create projection and geopath
    var projection = d3.geoMercator()
                       .scale(scale)
                       .center([0, 42])
                       .translate([mapX, mapY]);
    var geoPath = d3.geoPath()
                 .projection(projection);
    
    // Transform pins to coordinates
    let pins = PINS.map(pin => {
      let coords = projection([pin.long, pin.lat]);
      return {
        ...pins,
        x: coords[0],
        y: coords[1]
      };
    });

    // Draw paths
    mapG.selectAll('path')
        .data(this.geoJson.features)
        .enter()
        .append('path')
        .attr('fill', '#d6d6b1')

        .attr('d', geoPath);

    // Draw pins
    pinG.selectAll('circle')
        .data(pins)
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('fill', '#3d5a6c')
        .attr('cx', (d, i) => {
          return d.x;
        })
        .attr('cy', (d, i) => {
          return d.y;
        });
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
      <div>
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
        <div>
          <p>mapX: {this.state.mapX}, mapY: {this.state.mapY}</p>
          <p>scale: {this.state.scale}</p>
        </div>
      </div>
    );
  }
}
 
export default Map;