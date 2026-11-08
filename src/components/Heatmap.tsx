'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function Heatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<{ department: string, percentage: number }[]>([]);

  useEffect(() => {
    fetch('/api/hod/attendance/heatmap')
      .then(res => res.json())
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.department))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const color = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([50, 100]); // Attendance percentage range

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.department) || 0)
      .attr('y', d => y(d.percentage))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.percentage))
      .attr('fill', d => color(d.percentage));

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .call(d3.axisLeft(y));

  }, [data]);

  return <svg ref={svgRef} width="400" height="300"></svg>;
}
