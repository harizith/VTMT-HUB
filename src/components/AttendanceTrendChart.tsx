"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface AttendanceTrendChartProps {
  className?: string;
  classId?: string;
}

export default function AttendanceTrendChart({ className, classId = "II-CSE-A" }: AttendanceTrendChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // 6-month historical attendance trend data (Past 6 months: May to October)
    const data = [
      { month: "May", rate: 88, predicted: 88 },
      { month: "Jun", rate: 91, predicted: 91 },
      { month: "Jul", rate: 89, predicted: 89 },
      { month: "Aug", rate: 93, predicted: 93 },
      { month: "Sep", rate: 90, predicted: 90 },
      { month: "Oct", rate: 94, predicted: 94 },
      { month: "Nov (Proj)", rate: 95, predicted: 95 }, // Predictive insight
    ];

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 500 240`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scalePoint()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.5);

    // Y scale (attendance percentage 70% to 100%)
    const y = d3.scaleLinear()
      .domain([70, 100])
      .range([height, 0]);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("fill", "var(--text-muted)")
      .style("font-size", "11px");

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .style("fill", "var(--text-muted)")
      .style("font-size", "11px");

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "var(--border-subtle)")
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.6);

    // Area generator for gradient fill
    const area = d3.area<any>()
      .x(d => x(d.month) || 0)
      .y0(height)
      .y1(d => y(d.rate))
      .curve(d3.curveMonotoneX);

    // Add gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "attendance-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "var(--sky-blue, #38bdf8)")
      .attr("stop-opacity", 0.4);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "var(--sky-blue, #38bdf8)")
      .attr("stop-opacity", 0.0);

    // Add Area
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#attendance-gradient)")
      .attr("d", area);

    // Line generator
    const valueline = d3.line<any>()
      .x(d => x(d.month) || 0)
      .y(d => y(d.rate))
      .curve(d3.curveMonotoneX);

    // Add Line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--sky-blue, #38bdf8)")
      .attr("stroke-width", 3)
      .attr("d", valueline);

    // Add dots for data points
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.month) || 0)
      .attr("cy", d => y(d.rate))
      .attr("r", d => d.month.includes("Proj") ? 6 : 4)
      .attr("fill", d => d.month.includes("Proj") ? "#f59e0b" : "var(--royal-blue)")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Tooltip / Label for projected month
    svg.selectAll(".text")
      .data(data.filter(d => d.month.includes("Proj")))
      .enter()
      .append("text")
      .attr("x", d => (x(d.month) || 0) - 25)
      .attr("y", d => y(d.rate) - 12)
      .text(d => `${d.rate}% (Proj)`)
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("fill", "#f59e0b");

  }, [classId]);

  return (
    <div className={`student-card premium-card ${className || ""}`} style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 0.25rem 0", color: "var(--text-main)" }}>
            6-Month Attendance Trend & Predictive Insights
          </h3>
          <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text-muted)" }}>
            Class: <strong>{classId}</strong> • Historical consistency with AI projection
          </p>
        </div>
        <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--sky-blue)", fontWeight: "700" }}>
          +2.5% Trend
        </span>
      </div>
      <div style={{ width: "100%" }}>
        <svg ref={svgRef} style={{ overflow: "visible" }} />
      </div>
    </div>
  );
}
